from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_tenant_id
from app.database.session import get_db
from app.models.generated_post import GeneratedPost
from app.models.scheduled_post import (
    ScheduledPost,
    ScheduledPostPlatform,
    ScheduledPostStatus,
)
from app.models.user import User


router = APIRouter(prefix="/scheduled-posts", tags=["Scheduled Posts"])


class ScheduledPostCreate(BaseModel):
    generated_post_id: str
    platform: ScheduledPostPlatform = ScheduledPostPlatform.instagram
    status: ScheduledPostStatus = ScheduledPostStatus.scheduled
    scheduled_at: datetime
    published_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    failure_reason: Optional[str] = None
    external_post_id: Optional[str] = None
    external_post_url: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3
    metadata_json: Dict[str, Any] = Field(default_factory=dict)


class ScheduledPostUpdate(BaseModel):
    generated_post_id: Optional[str] = None
    platform: Optional[ScheduledPostPlatform] = None
    status: Optional[ScheduledPostStatus] = None
    scheduled_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    failure_reason: Optional[str] = None
    external_post_id: Optional[str] = None
    external_post_url: Optional[str] = None
    retry_count: Optional[int] = None
    max_retries: Optional[int] = None
    metadata_json: Optional[Dict[str, Any]] = None


class ScheduledPostResponse(BaseModel):
    id: str
    tenant_id: str
    generated_post_id: str
    created_by_user_id: Optional[str]
    platform: ScheduledPostPlatform
    status: ScheduledPostStatus
    scheduled_at: datetime
    published_at: Optional[datetime]
    failed_at: Optional[datetime]
    failure_reason: Optional[str]
    external_post_id: Optional[str]
    external_post_url: Optional[str]
    retry_count: int
    max_retries: int
    metadata_json: Dict[str, Any]
    is_active: bool
    generated_post_title: Optional[str] = None
    created_by_name: Optional[str] = None
    created_by_email: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


def _clean_optional_text(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None

    return value.strip() or None


def _validate_retry_count(value: int, field_name: str) -> int:
    if value < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} cannot be negative",
        )

    return value


async def _get_tenant_generated_post(
    db: AsyncSession,
    tenant_id: str,
    generated_post_id: str,
) -> GeneratedPost:
    result = await db.execute(
        select(GeneratedPost).where(
            GeneratedPost.id == generated_post_id,
            GeneratedPost.tenant_id == tenant_id,
            GeneratedPost.is_active == True,
        )
    )
    generated_post = result.scalar_one_or_none()

    if not generated_post:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Generated post not found for this tenant",
        )

    return generated_post


async def _serialize_scheduled_post(
    schedule: ScheduledPost,
    db: AsyncSession,
) -> Dict[str, Any]:
    generated_post_result = await db.execute(
        select(GeneratedPost).where(GeneratedPost.id == schedule.generated_post_id)
    )
    generated_post = generated_post_result.scalar_one_or_none()

    created_by = None
    if schedule.created_by_user_id:
        user_result = await db.execute(select(User).where(User.id == schedule.created_by_user_id))
        created_by = user_result.scalar_one_or_none()

    return {
        "id": schedule.id,
        "tenant_id": schedule.tenant_id,
        "generated_post_id": schedule.generated_post_id,
        "created_by_user_id": schedule.created_by_user_id,
        "platform": schedule.platform,
        "status": schedule.status,
        "scheduled_at": schedule.scheduled_at,
        "published_at": schedule.published_at,
        "failed_at": schedule.failed_at,
        "failure_reason": schedule.failure_reason,
        "external_post_id": schedule.external_post_id,
        "external_post_url": schedule.external_post_url,
        "retry_count": schedule.retry_count or 0,
        "max_retries": schedule.max_retries or 0,
        "metadata_json": schedule.metadata_json or {},
        "is_active": schedule.is_active,
        "generated_post_title": generated_post.title if generated_post else None,
        "created_by_name": created_by.full_name if created_by else None,
        "created_by_email": created_by.email if created_by else None,
        "created_at": schedule.created_at,
        "updated_at": schedule.updated_at,
    }


@router.post("/", response_model=ScheduledPostResponse, status_code=status.HTTP_201_CREATED)
async def create_scheduled_post(
    data: ScheduledPostCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
):
    await _get_tenant_generated_post(db, tenant_id, data.generated_post_id)

    retry_count = _validate_retry_count(data.retry_count, "retry_count")
    max_retries = _validate_retry_count(data.max_retries, "max_retries")

    published_at = data.published_at
    if data.status == ScheduledPostStatus.published and published_at is None:
        published_at = datetime.now(timezone.utc)

    schedule = ScheduledPost(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        generated_post_id=data.generated_post_id,
        created_by_user_id=current_user.id,
        platform=data.platform.value,
        status=data.status.value,
        scheduled_at=data.scheduled_at,
        published_at=published_at,
        failed_at=data.failed_at,
        failure_reason=_clean_optional_text(data.failure_reason),
        external_post_id=_clean_optional_text(data.external_post_id),
        external_post_url=_clean_optional_text(data.external_post_url),
        retry_count=retry_count,
        max_retries=max_retries,
        metadata_json=data.metadata_json,
    )

    db.add(schedule)
    await db.commit()
    await db.refresh(schedule)

    return await _serialize_scheduled_post(schedule, db)


@router.get("/my", response_model=List[ScheduledPostResponse])
async def get_my_scheduled_posts(
    status_filter: Optional[ScheduledPostStatus] = Query(default=None, alias="status"),
    platform: Optional[ScheduledPostPlatform] = None,
    generated_post_id: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
):
    query = select(ScheduledPost).where(
        ScheduledPost.tenant_id == tenant_id,
        ScheduledPost.is_active == True,
    )

    if status_filter:
        query = query.where(ScheduledPost.status == status_filter.value)

    if platform:
        query = query.where(ScheduledPost.platform == platform.value)

    if generated_post_id:
        await _get_tenant_generated_post(db, tenant_id, generated_post_id)
        query = query.where(ScheduledPost.generated_post_id == generated_post_id)

    query = query.order_by(ScheduledPost.scheduled_at.asc()).limit(limit)

    result = await db.execute(query)
    schedules = result.scalars().all()

    return [await _serialize_scheduled_post(schedule, db) for schedule in schedules]


@router.get("/{schedule_id}", response_model=ScheduledPostResponse)
async def get_scheduled_post(
    schedule_id: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
):
    result = await db.execute(
        select(ScheduledPost).where(
            ScheduledPost.id == schedule_id,
            ScheduledPost.tenant_id == tenant_id,
            ScheduledPost.is_active == True,
        )
    )
    schedule = result.scalar_one_or_none()

    if not schedule:
        raise HTTPException(status_code=404, detail="Scheduled post not found")

    return await _serialize_scheduled_post(schedule, db)


@router.put("/{schedule_id}", response_model=ScheduledPostResponse)
async def update_scheduled_post(
    schedule_id: str,
    data: ScheduledPostUpdate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
):
    result = await db.execute(
        select(ScheduledPost).where(
            ScheduledPost.id == schedule_id,
            ScheduledPost.tenant_id == tenant_id,
            ScheduledPost.is_active == True,
        )
    )
    schedule = result.scalar_one_or_none()

    if not schedule:
        raise HTTPException(status_code=404, detail="Scheduled post not found")

    updates = data.model_dump(exclude_unset=True)

    if "generated_post_id" in updates and updates["generated_post_id"] is not None:
        await _get_tenant_generated_post(db, tenant_id, updates["generated_post_id"])

    if "platform" in updates and updates["platform"] is not None:
        updates["platform"] = updates["platform"].value

    if "status" in updates and updates["status"] is not None:
        updates["status"] = updates["status"].value
        if updates["status"] == ScheduledPostStatus.published.value and not schedule.published_at:
            updates["published_at"] = datetime.now(timezone.utc)

    if "retry_count" in updates and updates["retry_count"] is not None:
        updates["retry_count"] = _validate_retry_count(updates["retry_count"], "retry_count")

    if "max_retries" in updates and updates["max_retries"] is not None:
        updates["max_retries"] = _validate_retry_count(updates["max_retries"], "max_retries")

    for key in ("failure_reason", "external_post_id", "external_post_url"):
        if key in updates:
            updates[key] = _clean_optional_text(updates[key])

    for key, value in updates.items():
        setattr(schedule, key, value)

    await db.commit()
    await db.refresh(schedule)

    return await _serialize_scheduled_post(schedule, db)


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_scheduled_post(
    schedule_id: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
):
    result = await db.execute(
        select(ScheduledPost).where(
            ScheduledPost.id == schedule_id,
            ScheduledPost.tenant_id == tenant_id,
            ScheduledPost.is_active == True,
        )
    )
    schedule = result.scalar_one_or_none()

    if not schedule:
        raise HTTPException(status_code=404, detail="Scheduled post not found")

    schedule.is_active = False
    schedule.status = ScheduledPostStatus.cancelled.value

    await db.commit()
    return None
