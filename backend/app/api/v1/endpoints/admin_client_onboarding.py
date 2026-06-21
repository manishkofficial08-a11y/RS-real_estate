import secrets
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_admin
from app.core.security import hash_password
from app.database.session import get_db
from app.models.billing import BillingCycle, Subscription, SubscriptionStatus
from app.models.tenant import BusinessType, PlanType, Tenant
from app.models.user import User, UserRole
from app.services.billing_service import calculate_period_end

router = APIRouter(prefix="/admin/client-onboarding", tags=["Admin Client Onboarding"])


class AdminClientOnboardingRequest(BaseModel):
    business_name: str
    owner_name: str
    owner_email: str
    business_type: BusinessType = BusinessType.real_estate
    plan: PlanType = PlanType.pro
    notes: Optional[str] = None


class AdminClientOnboardingResponse(BaseModel):
    tenant_id: str
    business_name: str
    business_type: str
    plan: str
    owner_id: str
    owner_name: str
    owner_email: str
    role: str
    temporary_password: str
    message: str


@router.post(
    "",
    response_model=AdminClientOnboardingResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_client_onboarding_workspace(
    data: AdminClientOnboardingRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    business_name = data.business_name.strip()
    owner_name = data.owner_name.strip()
    owner_email = data.owner_email.lower().strip()

    if not business_name:
        raise HTTPException(status_code=400, detail="Business name is required")

    if not owner_name:
        raise HTTPException(status_code=400, detail="Owner name is required")

    if not owner_email or "@" not in owner_email:
        raise HTTPException(status_code=400, detail="Valid owner email is required")

    existing_user_result = await db.execute(select(User).where(User.email == owner_email))
    if existing_user_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Owner email already exists")

    tenant = Tenant(
        id=str(uuid.uuid4()),
        name=business_name,
        business_type=data.business_type.value,
        plan=data.plan.value,
        is_active=True,
    )
    db.add(tenant)
    await db.flush()

    now = datetime.now(timezone.utc)
    subscription = Subscription(
        id=str(uuid.uuid4()),
        tenant_id=tenant.id,
        plan=data.plan.value,
        status=SubscriptionStatus.active.value,
        billing_cycle=BillingCycle.monthly.value,
        current_period_start=now,
        current_period_end=calculate_period_end(now, BillingCycle.monthly.value),
        cancel_at_period_end=False,
        provider="manual",
        metadata_json={
            "created_by": "admin_client_onboarding",
            "created_by_user_id": current_user.id,
            "notes": data.notes,
        },
    )
    db.add(subscription)

    temporary_password = secrets.token_urlsafe(10)
    owner = User(
        id=str(uuid.uuid4()),
        email=owner_email,
        full_name=owner_name,
        password_hash=hash_password(temporary_password),
        role=UserRole.owner.value,
        tenant_id=tenant.id,
        is_active=True,
    )
    db.add(owner)

    await db.commit()

    return AdminClientOnboardingResponse(
        tenant_id=tenant.id,
        business_name=tenant.name,
        business_type=tenant.business_type,
        plan=tenant.plan,
        owner_id=owner.id,
        owner_name=owner.full_name,
        owner_email=owner.email,
        role=owner.role,
        temporary_password=temporary_password,
        message="Client workspace created successfully. Share the temporary password securely.",
    )
