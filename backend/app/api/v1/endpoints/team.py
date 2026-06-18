from datetime import datetime, timedelta, timezone
import secrets
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import (
    get_current_tenant_manager,
    get_current_user,
    get_tenant_id,
)
from app.database.session import get_db
from app.models.team_invitation import TeamInvitation, TeamInvitationStatus
from app.models.user import ClientTeamRole, User, UserRole
from app.services.billing_service import get_plan_metadata
from app.services.email_service import send_email_message


router = APIRouter(prefix="/team", tags=["Team"])


class TeamMemberResponse(BaseModel):
    id: str
    tenant_id: str
    full_name: str
    email: EmailStr
    role: ClientTeamRole
    is_active: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None


class TeamMemberUpdate(BaseModel):
    role: ClientTeamRole | None = None
    is_active: bool | None = None


class TeamInvitationCreate(BaseModel):
    email: EmailStr
    role: ClientTeamRole = ClientTeamRole.viewer


class TeamInvitationResponse(BaseModel):
    id: str
    tenant_id: str
    email: EmailStr
    role: ClientTeamRole
    status: str
    invited_by_user_id: str
    expires_at: datetime
    created_at: datetime | None = None
    updated_at: datetime | None = None


class TeamInvitationCreateResponse(BaseModel):
    invitation: TeamInvitationResponse
    email_sent: bool
    message: str
    preview_url: str | None = None


class MessageResponse(BaseModel):
    message: str


def _normalize_team_role(role: str) -> str:
    if role == UserRole.client.value:
        return ClientTeamRole.owner.value
    if role == UserRole.staff.value:
        return ClientTeamRole.sales.value
    return role


def _serialize_member(user: User) -> TeamMemberResponse:
    return TeamMemberResponse(
        id=user.id,
        tenant_id=user.tenant_id or "",
        full_name=user.full_name,
        email=user.email,
        role=ClientTeamRole(_normalize_team_role(user.role)),
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


def _serialize_invitation(invitation: TeamInvitation) -> TeamInvitationResponse:
    return TeamInvitationResponse(
        id=invitation.id,
        tenant_id=invitation.tenant_id,
        email=invitation.email,
        role=ClientTeamRole(invitation.role),
        status=invitation.status,
        invited_by_user_id=invitation.invited_by_user_id,
        expires_at=invitation.expires_at,
        created_at=invitation.created_at,
        updated_at=invitation.updated_at,
    )


def _frontend_origin(request: Request) -> str:
    return (request.headers.get("origin") or "http://localhost:5173").rstrip("/")


def _is_owner(user: User) -> bool:
    return user.role in {UserRole.owner.value, UserRole.client.value}


async def _expire_pending_invitations(
    db: AsyncSession,
    tenant_id: str,
) -> None:
    result = await db.execute(
        select(TeamInvitation).where(
            TeamInvitation.tenant_id == tenant_id,
            TeamInvitation.status == TeamInvitationStatus.pending.value,
        )
    )
    now = datetime.now(timezone.utc)

    for invitation in result.scalars().all():
        expires_at = invitation.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at <= now:
            invitation.status = TeamInvitationStatus.expired.value


async def _ensure_member_capacity(
    db: AsyncSession,
    tenant_id: str,
) -> None:
    from app.models.billing import Subscription
    from app.models.tenant import Tenant

    subscription_result = await db.execute(
        select(Subscription).where(Subscription.tenant_id == tenant_id)
    )
    subscription = subscription_result.scalar_one_or_none()

    tenant_result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = tenant_result.scalar_one_or_none()
    plan_id = subscription.plan if subscription else (tenant.plan if tenant else "free")
    limit = get_plan_metadata(plan_id)["limits"]["team_members"]

    if limit is None:
        return

    active_count_result = await db.execute(
        select(func.count(User.id)).where(
            User.tenant_id == tenant_id,
            User.is_active == True,
        )
    )
    pending_count_result = await db.execute(
        select(func.count(TeamInvitation.id)).where(
            TeamInvitation.tenant_id == tenant_id,
            TeamInvitation.status == TeamInvitationStatus.pending.value,
        )
    )
    occupied_seats = (active_count_result.scalar() or 0) + (
        pending_count_result.scalar() or 0
    )

    if occupied_seats >= limit:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Your {get_plan_metadata(plan_id)['name']} plan allows "
                f"{limit} team member seat(s). Upgrade the plan or cancel a pending invite."
            ),
        )


@router.get("/members", response_model=list[TeamMemberResponse])
async def get_team_members(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(User)
        .where(User.tenant_id == tenant_id)
        .order_by(User.is_active.desc(), User.created_at.asc())
    )
    return [_serialize_member(member) for member in result.scalars().all()]


@router.post(
    "/invitations",
    response_model=TeamInvitationCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_team_invitation(
    data: TeamInvitationCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_tenant_manager),
    tenant_id: str = Depends(get_tenant_id),
):
    email = str(data.email).strip().lower()

    if data.role == ClientTeamRole.owner and not _is_owner(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only an owner can invite another owner",
        )

    await _expire_pending_invitations(db, tenant_id)

    existing_user_result = await db.execute(
        select(User).where(func.lower(User.email) == email)
    )
    if existing_user_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    existing_invite_result = await db.execute(
        select(TeamInvitation).where(
            TeamInvitation.tenant_id == tenant_id,
            func.lower(TeamInvitation.email) == email,
            TeamInvitation.status == TeamInvitationStatus.pending.value,
        )
    )
    if existing_invite_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A pending invitation already exists for this email",
        )

    await _ensure_member_capacity(db, tenant_id)

    invitation = TeamInvitation(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        email=email,
        role=data.role.value,
        status=TeamInvitationStatus.pending.value,
        invited_by_user_id=current_user.id,
        invite_code=secrets.token_urlsafe(24),
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(invitation)
    await db.flush()

    invite_url = f"{_frontend_origin(request)}/invite?code={invitation.invite_code}"
    email_result = await send_email_message(
        to_emails=[email],
        subject="You are invited to join RS Real Estate",
        body=(
            f"{current_user.full_name} invited you to join their RS Real Estate "
            f"workspace as {data.role.value}.\n\nAccept invitation:\n{invite_url}\n\n"
            "This invitation expires in 7 days."
        ),
    )

    await db.commit()
    await db.refresh(invitation)

    return TeamInvitationCreateResponse(
        invitation=_serialize_invitation(invitation),
        email_sent=bool(email_result.get("sent")),
        message=str(email_result.get("message") or "Invitation created"),
        preview_url=None if email_result.get("sent") else invite_url,
    )


@router.get("/invitations", response_model=list[TeamInvitationResponse])
async def get_team_invitations(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    await _expire_pending_invitations(db, tenant_id)
    await db.commit()

    result = await db.execute(
        select(TeamInvitation)
        .where(TeamInvitation.tenant_id == tenant_id)
        .order_by(TeamInvitation.created_at.desc())
    )
    return [_serialize_invitation(invitation) for invitation in result.scalars().all()]


@router.patch("/members/{member_id}", response_model=TeamMemberResponse)
async def update_team_member(
    member_id: str,
    data: TeamMemberUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_tenant_manager),
    tenant_id: str = Depends(get_tenant_id),
):
    result = await db.execute(
        select(User).where(
            User.id == member_id,
            User.tenant_id == tenant_id,
        )
    )
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")

    member_role = _normalize_team_role(member.role)
    if member_role == ClientTeamRole.owner.value and not _is_owner(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only an owner can update another owner",
        )

    if data.role == ClientTeamRole.owner and not _is_owner(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only an owner can assign the owner role",
        )

    if member.id == current_user.id:
        if data.is_active is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot deactivate your own account",
            )
        if data.role and data.role.value != member_role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot change your own role",
            )

    if (
        member_role == ClientTeamRole.owner.value
        and (
            data.is_active is False
            or (data.role and data.role != ClientTeamRole.owner)
        )
    ):
        owner_count_result = await db.execute(
            select(func.count(User.id)).where(
                User.tenant_id == tenant_id,
                User.is_active == True,
                User.role.in_([UserRole.owner.value, UserRole.client.value]),
            )
        )
        if (owner_count_result.scalar() or 0) <= 1:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="The workspace must keep at least one active owner",
            )

    if data.role is not None:
        member.role = data.role.value
    if data.is_active is not None:
        member.is_active = data.is_active

    await db.commit()
    await db.refresh(member)
    return _serialize_member(member)


@router.delete("/members/{member_id}", response_model=MessageResponse)
async def deactivate_team_member(
    member_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_tenant_manager),
    tenant_id: str = Depends(get_tenant_id),
):
    await update_team_member(
        member_id=member_id,
        data=TeamMemberUpdate(is_active=False),
        db=db,
        current_user=current_user,
        tenant_id=tenant_id,
    )
    return MessageResponse(message="Team member deactivated")


@router.patch(
    "/invitations/{invitation_id}/cancel",
    response_model=TeamInvitationResponse,
)
async def cancel_team_invitation(
    invitation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_tenant_manager),
    tenant_id: str = Depends(get_tenant_id),
):
    result = await db.execute(
        select(TeamInvitation).where(
            TeamInvitation.id == invitation_id,
            TeamInvitation.tenant_id == tenant_id,
        )
    )
    invitation = result.scalar_one_or_none()

    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    if invitation.status != TeamInvitationStatus.pending.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only pending invitations can be cancelled",
        )

    invitation.status = TeamInvitationStatus.cancelled.value
    await db.commit()
    await db.refresh(invitation)
    return _serialize_invitation(invitation)
