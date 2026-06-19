from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_tenant_id
from app.database.session import get_db
from app.models.social_account import SocialAccount, SocialAccountStatus, SocialPlatform
from app.models.user import User
from app.services.token_crypto import encrypt_token


router = APIRouter(prefix="/social-accounts", tags=["Social Accounts"])


class SocialAccountManualConnect(BaseModel):
    platform: SocialPlatform
    account_name: str = Field(min_length=1, max_length=160)
    external_account_id: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    scopes: List[str] = Field(default_factory=list)
    metadata_json: Dict[str, Any] = Field(default_factory=dict)


class SocialAccountResponse(BaseModel):
    id: str
    tenant_id: str
    platform: SocialPlatform | str
    account_name: str
    external_account_id: Optional[str]
    status: SocialAccountStatus | str
    scopes: List[str]
    token_expires_at: Optional[datetime]
    last_connected_at: Optional[datetime]
    last_error: Optional[str]
    metadata_json: Dict[str, Any]
    is_active: bool
    created_at: Optional[datetime]
    updated_at: Optional[datetime]


class SocialReadinessItem(BaseModel):
    platform: str
    connected: bool
    account_name: Optional[str] = None
    status: str
    action_required: Optional[str] = None


class SocialReadinessResponse(BaseModel):
    connected_count: int
    total_platforms: int
    live_ready: bool
    items: List[SocialReadinessItem]


SUPPORTED_PLATFORMS = [
    SocialPlatform.youtube.value,
    SocialPlatform.instagram.value,
    SocialPlatform.facebook.value,
    SocialPlatform.linkedin.value,
]


def _clean_text(value: str, field_name: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} is required",
        )
    return cleaned


def _serialize_account(account: SocialAccount) -> SocialAccountResponse:
    return SocialAccountResponse(
        id=account.id,
        tenant_id=account.tenant_id,
        platform=account.platform,
        account_name=account.account_name,
        external_account_id=account.external_account_id,
        status=account.status,
        scopes=account.scopes or [],
        token_expires_at=account.token_expires_at,
        last_connected_at=account.last_connected_at,
        last_error=account.last_error,
        metadata_json=account.metadata_json or {},
        is_active=account.is_active,
        created_at=account.created_at,
        updated_at=account.updated_at,
    )


async def _get_tenant_account(
    db: AsyncSession,
    tenant_id: str,
    account_id: str,
) -> SocialAccount:
    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.id == account_id,
            SocialAccount.tenant_id == tenant_id,
            SocialAccount.is_active == True,
        )
    )
    account = result.scalar_one_or_none()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Social account not found",
        )

    return account


@router.get("/", response_model=List[SocialAccountResponse])
async def list_social_accounts(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
):
    result = await db.execute(
        select(SocialAccount)
        .where(
            SocialAccount.tenant_id == tenant_id,
            SocialAccount.is_active == True,
        )
        .order_by(SocialAccount.created_at.desc())
    )

    return [_serialize_account(account) for account in result.scalars().all()]


@router.post("/connect-manual", response_model=SocialAccountResponse, status_code=status.HTTP_201_CREATED)
async def connect_social_account_manual(
    data: SocialAccountManualConnect,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
):
    account_name = _clean_text(data.account_name, "account_name")
    platform = data.platform.value

    existing_query = select(SocialAccount).where(
        SocialAccount.tenant_id == tenant_id,
        SocialAccount.platform == platform,
        SocialAccount.is_active == True,
    )

    if data.external_account_id:
        existing_query = existing_query.where(
            SocialAccount.external_account_id == data.external_account_id.strip()
        )

    existing_result = await db.execute(existing_query)
    existing = existing_result.scalar_one_or_none()

    now = datetime.now(timezone.utc)

    if existing:
        existing.account_name = account_name
        existing.external_account_id = (
            data.external_account_id.strip() if data.external_account_id else existing.external_account_id
        )
        existing.status = SocialAccountStatus.connected.value
        existing.scopes = [scope.strip() for scope in data.scopes if scope.strip()]
        existing.access_token_encrypted = encrypt_token(data.access_token) or existing.access_token_encrypted
        existing.refresh_token_encrypted = encrypt_token(data.refresh_token) or existing.refresh_token_encrypted
        existing.token_expires_at = data.token_expires_at
        existing.last_connected_at = now
        existing.last_error = None
        existing.metadata_json = data.metadata_json or {}
        await db.commit()
        await db.refresh(existing)
        return _serialize_account(existing)

    account = SocialAccount(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        created_by_user_id=current_user.id,
        platform=platform,
        account_name=account_name,
        external_account_id=data.external_account_id.strip() if data.external_account_id else None,
        status=SocialAccountStatus.connected.value,
        scopes=[scope.strip() for scope in data.scopes if scope.strip()],
        access_token_encrypted=encrypt_token(data.access_token),
        refresh_token_encrypted=encrypt_token(data.refresh_token),
        token_expires_at=data.token_expires_at,
        last_connected_at=now,
        metadata_json=data.metadata_json or {},
    )

    db.add(account)
    await db.commit()
    await db.refresh(account)

    return _serialize_account(account)


@router.patch("/{account_id}/disconnect", response_model=SocialAccountResponse)
async def disconnect_social_account(
    account_id: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
):
    account = await _get_tenant_account(db, tenant_id, account_id)
    account.status = SocialAccountStatus.disconnected.value
    account.access_token_encrypted = None
    account.refresh_token_encrypted = None
    account.token_expires_at = None
    await db.commit()
    await db.refresh(account)

    return _serialize_account(account)


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_social_account(
    account_id: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
):
    account = await _get_tenant_account(db, tenant_id, account_id)
    account.is_active = False
    account.status = SocialAccountStatus.disconnected.value
    await db.commit()
    return None


@router.get("/readiness", response_model=SocialReadinessResponse)
async def get_social_readiness(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
):
    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.tenant_id == tenant_id,
            SocialAccount.is_active == True,
        )
    )

    accounts = result.scalars().all()
    connected_by_platform = {
        account.platform: account
        for account in accounts
        if account.status == SocialAccountStatus.connected.value
    }

    items: List[SocialReadinessItem] = []

    for platform in SUPPORTED_PLATFORMS:
        account = connected_by_platform.get(platform)

        if account:
            items.append(
                SocialReadinessItem(
                    platform=platform,
                    connected=True,
                    account_name=account.account_name,
                    status=account.status,
                )
            )
        else:
            items.append(
                SocialReadinessItem(
                    platform=platform,
                    connected=False,
                    status="not_connected",
                    action_required=f"Connect {platform} account before live publishing",
                )
            )

    connected_count = sum(1 for item in items if item.connected)

    return SocialReadinessResponse(
        connected_count=connected_count,
        total_platforms=len(SUPPORTED_PLATFORMS),
        live_ready=connected_count == len(SUPPORTED_PLATFORMS),
        items=items,
    )
