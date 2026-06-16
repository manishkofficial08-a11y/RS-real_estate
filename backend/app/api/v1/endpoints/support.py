from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.database.session import get_db
from app.core.dependencies import get_current_user, get_current_admin, get_tenant_id
from app.models.user import User
from app.models.tenant import Tenant
from app.models.support_ticket import (
    SupportTicket,
    SupportTicketStatus,
    SupportTicketPriority,
    SupportTicketCategory,
)


router = APIRouter(prefix="/support", tags=["Support"])


class SupportTicketCreate(BaseModel):
    subject: str
    category: str = SupportTicketCategory.general.value
    priority: str = SupportTicketPriority.medium.value
    message: str


class SupportTicketUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    admin_reply: Optional[str] = None
    assigned_admin_id: Optional[str] = None


class SupportTicketResponse(BaseModel):
    id: str
    tenant_id: str
    created_by_user_id: str

    subject: str
    category: str
    priority: str
    status: str
    message: str
    admin_reply: Optional[str] = None
    assigned_admin_id: Optional[str] = None

    created_by_name: Optional[str] = None
    created_by_email: Optional[str] = None
    business_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


async def enrich_ticket(
    ticket: SupportTicket,
    db: AsyncSession,
) -> SupportTicketResponse:
    user_result = await db.execute(
        select(User).where(User.id == ticket.created_by_user_id)
    )
    user = user_result.scalar_one_or_none()

    tenant_result = await db.execute(
        select(Tenant).where(Tenant.id == ticket.tenant_id)
    )
    tenant = tenant_result.scalar_one_or_none()

    return SupportTicketResponse(
        id=ticket.id,
        tenant_id=ticket.tenant_id,
        created_by_user_id=ticket.created_by_user_id,
        subject=ticket.subject,
        category=ticket.category,
        priority=ticket.priority,
        status=ticket.status,
        message=ticket.message,
        admin_reply=ticket.admin_reply,
        assigned_admin_id=ticket.assigned_admin_id,
        created_by_name=user.full_name if user else None,
        created_by_email=user.email if user else None,
        business_name=tenant.name if tenant else None,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
    )


def validate_ticket_create(data: SupportTicketCreate):
    if not data.subject.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subject is required",
        )

    if not data.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message is required",
        )

    allowed_categories = [item.value for item in SupportTicketCategory]
    allowed_priorities = [item.value for item in SupportTicketPriority]

    if data.category not in allowed_categories:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category. Allowed: {allowed_categories}",
        )

    if data.priority not in allowed_priorities:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid priority. Allowed: {allowed_priorities}",
        )


def validate_ticket_update(data: SupportTicketUpdate):
    allowed_statuses = [item.value for item in SupportTicketStatus]
    allowed_priorities = [item.value for item in SupportTicketPriority]

    if data.status and data.status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Allowed: {allowed_statuses}",
        )

    if data.priority and data.priority not in allowed_priorities:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid priority. Allowed: {allowed_priorities}",
        )


@router.post("/tickets", response_model=SupportTicketResponse, status_code=status.HTTP_201_CREATED)
async def create_support_ticket(
    data: SupportTicketCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
):
    validate_ticket_create(data)

    ticket = SupportTicket(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        created_by_user_id=current_user.id,
        subject=data.subject.strip(),
        category=data.category,
        priority=data.priority,
        status=SupportTicketStatus.open.value,
        message=data.message.strip(),
    )

    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)

    return await enrich_ticket(ticket, db)


@router.get("/tickets/my", response_model=List[SupportTicketResponse])
async def get_my_support_tickets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
):
    result = await db.execute(
        select(SupportTicket)
        .where(
            SupportTicket.tenant_id == tenant_id,
            SupportTicket.created_by_user_id == current_user.id,
        )
        .order_by(desc(SupportTicket.created_at))
    )

    tickets = result.scalars().all()

    return [await enrich_ticket(ticket, db) for ticket in tickets]


@router.get("/admin/tickets", response_model=List[SupportTicketResponse])
async def get_all_support_tickets(
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    query = select(SupportTicket).order_by(desc(SupportTicket.created_at))

    if status_filter:
        query = query.where(SupportTicket.status == status_filter)

    if priority_filter:
        query = query.where(SupportTicket.priority == priority_filter)

    result = await db.execute(query)
    tickets = result.scalars().all()

    return [await enrich_ticket(ticket, db) for ticket in tickets]


@router.put("/admin/tickets/{ticket_id}", response_model=SupportTicketResponse)
async def update_support_ticket(
    ticket_id: str,
    data: SupportTicketUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    validate_ticket_update(data)

    result = await db.execute(
        select(SupportTicket).where(SupportTicket.id == ticket_id)
    )
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Support ticket not found",
        )

    if data.status is not None:
        ticket.status = data.status

    if data.priority is not None:
        ticket.priority = data.priority

    if data.admin_reply is not None:
        ticket.admin_reply = data.admin_reply.strip() or None

    if data.assigned_admin_id is not None:
        ticket.assigned_admin_id = data.assigned_admin_id

    await db.commit()
    await db.refresh(ticket)

    return await enrich_ticket(ticket, db)
