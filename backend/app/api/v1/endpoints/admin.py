from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from app.database.session import get_db
from app.models.user import User
from app.models.tenant import Tenant
from app.models.property import Property
from app.models.lead import Lead
from app.models.generated_post import GeneratedPost
from app.models.scheduled_post import ScheduledPost, ScheduledPostStatus
from app.core.dependencies import get_current_admin
from app.services.scheduled_publisher import process_due_scheduled_posts

router = APIRouter(prefix="/admin", tags=["Admin"])


class TenantResponse(BaseModel):
    id: str
    name: str
    business_type: str
    plan: str
    is_active: bool

    class Config:
        from_attributes = True


class AdminUserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    tenant_id: Optional[str]
    company: Optional[str]
    is_active: bool


class AdminLeadResponse(BaseModel):
    id: str
    tenant_id: str
    company: Optional[str]
    name: str
    email: Optional[str]
    phone: Optional[str]
    source: str
    status: str
    score: int
    property_interest_id: Optional[str]
    notes: Optional[str]
    assigned_to: Optional[str]


class DashboardStats(BaseModel):
    total_tenants: int
    total_users: int
    total_properties: int
    total_leads: int


class AdminPublisherOperationsSummary(BaseModel):
    total: int
    scheduled: int
    publishing: int
    published: int
    failed: int
    cancelled: int
    due_now: int
    retry_ready: int
    success_rate: int


class AdminPublisherPlatformMetric(BaseModel):
    platform: str
    total: int
    scheduled: int
    publishing: int
    published: int
    failed: int
    success_rate: int


class AdminPublisherEvent(BaseModel):
    id: str
    tenant_id: str
    business_name: Optional[str]
    generated_post_title: Optional[str]
    platform: str
    status: str
    scheduled_at: Optional[str]
    published_at: Optional[str]
    failed_at: Optional[str]
    failure_reason: Optional[str]
    external_post_url: Optional[str]
    retry_count: int
    max_retries: int


class AdminPublisherOperationsResponse(BaseModel):
    checked_at: str
    summary: AdminPublisherOperationsSummary
    platforms: List[AdminPublisherPlatformMetric]
    recent_events: List[AdminPublisherEvent]
    failed_events: List[AdminPublisherEvent]


class AdminPublisherProcessDueRequest(BaseModel):
    tenant_id: Optional[str] = None
    limit: int = 25
    allow_mock_fallback: bool = True


class AdminPublisherProcessDueResponse(BaseModel):
    checked_at: str
    tenant_count: int
    due_count: int
    processed_count: int
    results: List[Dict[str, Any]]


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    tenants = await db.execute(select(func.count(Tenant.id)))
    users = await db.execute(select(func.count(User.id)))
    properties = await db.execute(select(func.count(Property.id)))
    leads = await db.execute(select(func.count(Lead.id)))

    return DashboardStats(
        total_tenants=tenants.scalar() or 0,
        total_users=users.scalar() or 0,
        total_properties=properties.scalar() or 0,
        total_leads=leads.scalar() or 0
    )


@router.get("/tenants", response_model=List[TenantResponse])
async def get_all_tenants(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    result = await db.execute(select(Tenant).order_by(Tenant.created_at.desc()))
    return result.scalars().all()


@router.patch("/tenants/{tenant_id}/toggle")
async def toggle_tenant(
    tenant_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()

    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    tenant.is_active = not tenant.is_active
    await db.commit()

    return {"message": f"Tenant {'activated' if tenant.is_active else 'deactivated'}"}


@router.get("/users", response_model=List[AdminUserResponse])
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    result = await db.execute(
        select(User, Tenant.name)
        .outerjoin(Tenant, User.tenant_id == Tenant.id)
        .order_by(User.created_at.desc())
    )

    users = []
    for user, company_name in result.all():
        users.append(
            AdminUserResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                role=user.role,
                tenant_id=user.tenant_id,
                company=company_name,
                is_active=user.is_active,
            )
        )

    return users


@router.get("/leads", response_model=List[AdminLeadResponse])
async def get_all_leads(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    result = await db.execute(
        select(Lead, Tenant.name)
        .outerjoin(Tenant, Lead.tenant_id == Tenant.id)
        .where(Lead.is_active == True)
        .order_by(Lead.created_at.desc())
    )

    leads = []
    for lead, company_name in result.all():
        leads.append(
            AdminLeadResponse(
                id=lead.id,
                tenant_id=lead.tenant_id,
                company=company_name,
                name=lead.name,
                email=lead.email,
                phone=lead.phone,
                source=lead.source,
                status=lead.status,
                score=lead.score,
                property_interest_id=lead.property_interest_id,
                notes=lead.notes,
                assigned_to=lead.assigned_to,
            )
        )

    return leads


def _admin_dt_to_iso(value):
    if not value:
        return None

    return value.isoformat()


def _admin_as_utc(value):
    if not value:
        return None

    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


def _admin_publisher_event(schedule, business_name, generated_post_title):
    return AdminPublisherEvent(
        id=schedule.id,
        tenant_id=schedule.tenant_id,
        business_name=business_name,
        generated_post_title=generated_post_title,
        platform=schedule.platform or "unknown",
        status=schedule.status or "unknown",
        scheduled_at=_admin_dt_to_iso(schedule.scheduled_at),
        published_at=_admin_dt_to_iso(schedule.published_at),
        failed_at=_admin_dt_to_iso(schedule.failed_at),
        failure_reason=schedule.failure_reason,
        external_post_url=schedule.external_post_url,
        retry_count=schedule.retry_count or 0,
        max_retries=schedule.max_retries or 0,
    )


@router.get("/publisher-operations", response_model=AdminPublisherOperationsResponse)
async def get_publisher_operations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(ScheduledPost, Tenant.name, GeneratedPost.title)
        .join(Tenant, ScheduledPost.tenant_id == Tenant.id)
        .outerjoin(GeneratedPost, ScheduledPost.generated_post_id == GeneratedPost.id)
        .where(ScheduledPost.is_active == True)
        .order_by(ScheduledPost.scheduled_at.desc())
        .limit(500)
    )

    rows = result.all()

    status_counts = {
        "scheduled": 0,
        "publishing": 0,
        "published": 0,
        "failed": 0,
        "cancelled": 0,
    }
    due_now = 0
    retry_ready = 0
    platform_buckets: Dict[str, Dict[str, int]] = {}
    recent_events: List[AdminPublisherEvent] = []
    failed_events: List[AdminPublisherEvent] = []

    for schedule, business_name, generated_post_title in rows:
        status_value = schedule.status or "unknown"
        platform_value = schedule.platform or "unknown"

        if status_value in status_counts:
            status_counts[status_value] += 1

        scheduled_at = _admin_as_utc(schedule.scheduled_at)

        if (
            status_value == ScheduledPostStatus.scheduled.value
            and scheduled_at
            and scheduled_at <= now
        ):
            due_now += 1

        if (
            status_value == ScheduledPostStatus.failed.value
            and (schedule.retry_count or 0) < (schedule.max_retries or 0)
        ):
            retry_ready += 1

        if platform_value not in platform_buckets:
            platform_buckets[platform_value] = {
                "total": 0,
                "scheduled": 0,
                "publishing": 0,
                "published": 0,
                "failed": 0,
            }

        platform_buckets[platform_value]["total"] += 1

        if status_value in platform_buckets[platform_value]:
            platform_buckets[platform_value][status_value] += 1

        event = _admin_publisher_event(schedule, business_name, generated_post_title)

        if len(recent_events) < 12:
            recent_events.append(event)

        if status_value == ScheduledPostStatus.failed.value and len(failed_events) < 8:
            failed_events.append(event)

    total = len(rows)
    completed = status_counts["published"]
    failed = status_counts["failed"]
    success_rate = round((completed / max(1, completed + failed)) * 100)

    platform_metrics = []

    for platform, values in sorted(platform_buckets.items()):
        platform_completed = values.get("published", 0)
        platform_failed = values.get("failed", 0)
        platform_success_rate = round(
            (platform_completed / max(1, platform_completed + platform_failed)) * 100
        )

        platform_metrics.append(
            AdminPublisherPlatformMetric(
                platform=platform,
                total=values["total"],
                scheduled=values.get("scheduled", 0),
                publishing=values.get("publishing", 0),
                published=values.get("published", 0),
                failed=values.get("failed", 0),
                success_rate=platform_success_rate,
            )
        )

    return AdminPublisherOperationsResponse(
        checked_at=now.isoformat(),
        summary=AdminPublisherOperationsSummary(
            total=total,
            scheduled=status_counts["scheduled"],
            publishing=status_counts["publishing"],
            published=status_counts["published"],
            failed=status_counts["failed"],
            cancelled=status_counts["cancelled"],
            due_now=due_now,
            retry_ready=retry_ready,
            success_rate=success_rate,
        ),
        platforms=platform_metrics,
        recent_events=recent_events,
        failed_events=failed_events,
    )


@router.post("/publisher-operations/process-due", response_model=AdminPublisherProcessDueResponse)
async def process_due_publisher_posts_admin(
    data: AdminPublisherProcessDueRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    now = datetime.now(timezone.utc)

    if data.tenant_id:
        tenant_ids = [data.tenant_id]
    else:
        result = await db.execute(
            select(ScheduledPost.tenant_id)
            .where(
                ScheduledPost.is_active == True,
                ScheduledPost.status == ScheduledPostStatus.scheduled.value,
                ScheduledPost.scheduled_at <= now,
            )
            .distinct()
        )
        tenant_ids = [tenant_id for tenant_id in result.scalars().all() if tenant_id]

    due_count = 0
    processed_count = 0
    all_results: List[Dict[str, Any]] = []

    for tenant_id in tenant_ids:
        result = await process_due_scheduled_posts(
            db,
            tenant_id=tenant_id,
            limit=data.limit,
            allow_mock_fallback=data.allow_mock_fallback,
        )

        due_count += int(result.get("due_count") or 0)
        processed_count += int(result.get("processed_count") or 0)
        all_results.extend(result.get("results") or [])

    return AdminPublisherProcessDueResponse(
        checked_at=now.isoformat(),
        tenant_count=len(tenant_ids),
        due_count=due_count,
        processed_count=processed_count,
        results=all_results,
    )

