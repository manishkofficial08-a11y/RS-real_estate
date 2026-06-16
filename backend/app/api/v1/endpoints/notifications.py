from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.dependencies import get_current_user, get_current_admin, get_tenant_id
from app.models.user import User
from app.models.notification import Notification, NotificationAudience


router = APIRouter(prefix="/notifications", tags=["Notifications"])


class NotificationResponse(BaseModel):
    id: str
    tenant_id: Optional[str] = None
    recipient_user_id: Optional[str] = None
    audience: str
    type: str
    title: str
    message: str
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None
    link: Optional[str] = None
    is_read: bool

    class Config:
        from_attributes = True


class NotificationUnreadCountResponse(BaseModel):
    unread_count: int


async def create_notification(
    db: AsyncSession,
    *,
    audience: str,
    title: str,
    message: str,
    notification_type: str,
    tenant_id: Optional[str] = None,
    recipient_user_id: Optional[str] = None,
    related_entity_type: Optional[str] = None,
    related_entity_id: Optional[str] = None,
    link: Optional[str] = None,
) -> Notification:
    notification = Notification(
        tenant_id=tenant_id,
        recipient_user_id=recipient_user_id,
        audience=audience,
        type=notification_type,
        title=title,
        message=message,
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
        link=link,
        is_read=False,
    )

    db.add(notification)
    await db.flush()
    return notification


@router.get("/my", response_model=List[NotificationResponse])
async def get_my_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
):
    result = await db.execute(
        select(Notification)
        .where(
            Notification.audience == NotificationAudience.client.value,
            Notification.tenant_id == tenant_id,
        )
        .order_by(desc(Notification.created_at))
        .limit(30)
    )

    return result.scalars().all()


@router.get("/my/unread-count", response_model=NotificationUnreadCountResponse)
async def get_my_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
):
    result = await db.execute(
        select(func.count(Notification.id)).where(
            Notification.audience == NotificationAudience.client.value,
            Notification.tenant_id == tenant_id,
            Notification.is_read == False,  # noqa: E712
        )
    )

    return NotificationUnreadCountResponse(unread_count=result.scalar_one())


@router.put("/my/{notification_id}/read", response_model=NotificationResponse)
async def mark_my_notification_read(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
):
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.audience == NotificationAudience.client.value,
            Notification.tenant_id == tenant_id,
        )
    )
    notification = result.scalar_one_or_none()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    notification.is_read = True
    await db.commit()
    await db.refresh(notification)

    return notification


@router.get("/admin", response_model=List[NotificationResponse])
async def get_admin_notifications(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    result = await db.execute(
        select(Notification)
        .where(Notification.audience == NotificationAudience.admin.value)
        .order_by(desc(Notification.created_at))
        .limit(30)
    )

    return result.scalars().all()


@router.get("/admin/unread-count", response_model=NotificationUnreadCountResponse)
async def get_admin_unread_count(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    result = await db.execute(
        select(func.count(Notification.id)).where(
            Notification.audience == NotificationAudience.admin.value,
            Notification.is_read == False,  # noqa: E712
        )
    )

    return NotificationUnreadCountResponse(unread_count=result.scalar_one())


@router.put("/admin/{notification_id}/read", response_model=NotificationResponse)
async def mark_admin_notification_read(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.audience == NotificationAudience.admin.value,
        )
    )
    notification = result.scalar_one_or_none()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    notification.is_read = True
    await db.commit()
    await db.refresh(notification)

    return notification