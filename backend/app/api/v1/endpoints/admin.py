from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from pydantic import BaseModel
from app.database.session import get_db
from app.models.user import User
from app.models.tenant import Tenant
from app.models.property import Property
from app.models.lead import Lead
from app.core.dependencies import get_current_admin

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