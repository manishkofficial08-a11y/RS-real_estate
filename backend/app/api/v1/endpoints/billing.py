from datetime import datetime, timedelta
import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import (
    get_current_tenant_manager,
    get_current_user,
    get_tenant_id,
)
from app.database.session import get_db
from app.models.ai_job import AIJob, AIJobType
from app.models.billing import (
    BillingCycle,
    Invoice,
    InvoiceStatus,
    Subscription,
    SubscriptionPlan,
    SubscriptionStatus,
)
from app.models.content_asset import ContentAsset
from app.models.generated_post import GeneratedPost
from app.models.scheduled_post import ScheduledPost
from app.models.tenant import Tenant
from app.models.user import User
from app.services.billing_service import (
    PLAN_CATALOG,
    calculate_period_end,
    get_plan_metadata,
    utc_now,
)


router = APIRouter(prefix="/billing", tags=["Billing"])


class BillingPlanResponse(BaseModel):
    id: str
    name: str
    currency: str
    monthly_price: float | None
    yearly_price: float | None
    limits: dict[str, int | None]
    features: list[str]


class SubscriptionResponse(BaseModel):
    id: str
    tenant_id: str
    plan: SubscriptionPlan
    status: SubscriptionStatus
    billing_cycle: BillingCycle
    current_period_start: datetime
    current_period_end: datetime
    cancel_at_period_end: bool
    provider: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


class SubscriptionUpdate(BaseModel):
    plan: SubscriptionPlan | None = None
    billing_cycle: BillingCycle | None = None
    cancel_at_period_end: bool | None = None


class SubscriptionUpdateResponse(BaseModel):
    subscription: SubscriptionResponse
    message: str


class InvoiceResponse(BaseModel):
    id: str
    tenant_id: str
    subscription_id: str | None
    invoice_number: str
    amount: float
    currency: str
    status: InvoiceStatus
    invoice_url: str | None
    issued_at: datetime
    due_at: datetime
    paid_at: datetime | None
    created_at: datetime | None = None


class BillingUsageItem(BaseModel):
    used: int
    limit: int | None


class BillingSummaryResponse(BaseModel):
    subscription: SubscriptionResponse
    plan: BillingPlanResponse
    usage: dict[str, BillingUsageItem]
    billing_mode: str
    message: str


def _serialize_plan(plan_id: str) -> BillingPlanResponse:
    return BillingPlanResponse(**get_plan_metadata(plan_id))


def _serialize_subscription(subscription: Subscription) -> SubscriptionResponse:
    return SubscriptionResponse(
        id=subscription.id,
        tenant_id=subscription.tenant_id,
        plan=SubscriptionPlan(subscription.plan),
        status=SubscriptionStatus(subscription.status),
        billing_cycle=BillingCycle(subscription.billing_cycle),
        current_period_start=subscription.current_period_start,
        current_period_end=subscription.current_period_end,
        cancel_at_period_end=subscription.cancel_at_period_end,
        provider=subscription.provider,
        created_at=subscription.created_at,
        updated_at=subscription.updated_at,
    )


def _serialize_invoice(invoice: Invoice) -> InvoiceResponse:
    return InvoiceResponse(
        id=invoice.id,
        tenant_id=invoice.tenant_id,
        subscription_id=invoice.subscription_id,
        invoice_number=invoice.invoice_number,
        amount=invoice.amount,
        currency=invoice.currency,
        status=InvoiceStatus(invoice.status),
        invoice_url=invoice.invoice_url,
        issued_at=invoice.issued_at,
        due_at=invoice.due_at,
        paid_at=invoice.paid_at,
        created_at=invoice.created_at,
    )


async def _get_or_create_subscription(
    db: AsyncSession,
    tenant_id: str,
) -> Subscription:
    result = await db.execute(
        select(Subscription).where(Subscription.tenant_id == tenant_id)
    )
    subscription = result.scalar_one_or_none()

    if subscription:
        return subscription

    tenant_result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = tenant_result.scalar_one()
    plan = tenant.plan if tenant.plan in PLAN_CATALOG else SubscriptionPlan.free.value
    now = utc_now()
    subscription = Subscription(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        plan=plan,
        status=SubscriptionStatus.active.value,
        billing_cycle=BillingCycle.monthly.value,
        current_period_start=now,
        current_period_end=calculate_period_end(now, BillingCycle.monthly.value),
        cancel_at_period_end=False,
        provider="mock",
        metadata_json={"created_by": "billing_foundation"},
    )
    db.add(subscription)
    await db.flush()
    return subscription


async def _count_for_tenant(
    db: AsyncSession,
    model,
    tenant_id: str,
    *filters,
) -> int:
    result = await db.execute(
        select(func.count(model.id)).where(
            model.tenant_id == tenant_id,
            *filters,
        )
    )
    return result.scalar() or 0


async def _usage_for_tenant(
    db: AsyncSession,
    tenant_id: str,
    plan_id: str,
) -> dict[str, BillingUsageItem]:
    limits = get_plan_metadata(plan_id)["limits"]
    counts = {
        "team_members": await _count_for_tenant(
            db,
            User,
            tenant_id,
            User.is_active == True,
        ),
        "media_uploads": await _count_for_tenant(
            db,
            ContentAsset,
            tenant_id,
            ContentAsset.is_active == True,
        ),
        "generated_posts": await _count_for_tenant(
            db,
            GeneratedPost,
            tenant_id,
            GeneratedPost.is_active == True,
        ),
        "scheduled_posts": await _count_for_tenant(
            db,
            ScheduledPost,
            tenant_id,
            ScheduledPost.is_active == True,
        ),
        "reports": await _count_for_tenant(
            db,
            AIJob,
            tenant_id,
            AIJob.job_type == AIJobType.report.value,
        ),
    }

    return {
        key: BillingUsageItem(used=value, limit=limits.get(key))
        for key, value in counts.items()
    }


@router.get("/plans", response_model=list[BillingPlanResponse])
async def get_billing_plans(
    current_user: User = Depends(get_current_user),
):
    return [_serialize_plan(plan_id) for plan_id in ("free", "pro", "enterprise")]


@router.get("/subscription", response_model=SubscriptionResponse)
async def get_billing_subscription(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    subscription = await _get_or_create_subscription(db, tenant_id)
    await db.commit()
    await db.refresh(subscription)
    return _serialize_subscription(subscription)


@router.get("/summary", response_model=BillingSummaryResponse)
async def get_billing_summary(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    subscription = await _get_or_create_subscription(db, tenant_id)
    usage = await _usage_for_tenant(db, tenant_id, subscription.plan)
    await db.commit()
    await db.refresh(subscription)

    return BillingSummaryResponse(
        subscription=_serialize_subscription(subscription),
        plan=_serialize_plan(subscription.plan),
        usage=usage,
        billing_mode=subscription.provider,
        message="Billing is running in mock mode. No payment provider is connected.",
    )


@router.patch("/subscription", response_model=SubscriptionUpdateResponse)
async def update_billing_subscription(
    data: SubscriptionUpdate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_tenant_manager),
):
    subscription = await _get_or_create_subscription(db, tenant_id)
    old_plan = subscription.plan
    old_cycle = subscription.billing_cycle
    plan_changed = data.plan is not None and data.plan.value != old_plan
    cycle_changed = (
        data.billing_cycle is not None
        and data.billing_cycle.value != old_cycle
    )

    if data.plan is not None:
        subscription.plan = data.plan.value
    if data.billing_cycle is not None:
        subscription.billing_cycle = data.billing_cycle.value
    if data.cancel_at_period_end is not None:
        subscription.cancel_at_period_end = data.cancel_at_period_end

    if plan_changed or cycle_changed:
        now = utc_now()
        subscription.status = SubscriptionStatus.active.value
        subscription.current_period_start = now
        subscription.current_period_end = calculate_period_end(
            now,
            subscription.billing_cycle,
        )
        subscription.cancel_at_period_end = False

        plan = get_plan_metadata(subscription.plan)
        amount = (
            plan["yearly_price"]
            if subscription.billing_cycle == BillingCycle.yearly.value
            else plan["monthly_price"]
        )

        if amount is not None and amount > 0:
            invoice = Invoice(
                id=str(uuid.uuid4()),
                tenant_id=tenant_id,
                subscription_id=subscription.id,
                invoice_number=f"INV-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}",
                amount=float(amount),
                currency=plan["currency"],
                status=InvoiceStatus.pending.value,
                invoice_url=None,
                issued_at=now,
                due_at=now + timedelta(days=7),
                paid_at=None,
                metadata_json={
                    "mode": "mock",
                    "note": "Payment collection placeholder for Stripe/Razorpay.",
                },
            )
            db.add(invoice)

    tenant_result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = tenant_result.scalar_one()
    tenant.plan = subscription.plan

    await db.commit()
    await db.refresh(subscription)

    return SubscriptionUpdateResponse(
        subscription=_serialize_subscription(subscription),
        message=(
            "Plan updated in mock billing mode."
            if plan_changed or cycle_changed
            else "Subscription preferences updated in mock billing mode."
        ),
    )


@router.get("/invoices", response_model=list[InvoiceResponse])
async def get_billing_invoices(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Invoice)
        .where(Invoice.tenant_id == tenant_id)
        .order_by(Invoice.issued_at.desc())
    )
    return [_serialize_invoice(invoice) for invoice in result.scalars().all()]
