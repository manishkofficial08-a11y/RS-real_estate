from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from pydantic import BaseModel
from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.models.property import Property
from app.models.lead import Lead
from app.core.dependencies import get_current_admin
import uuid

router = APIRouter(prefix="/admin", tags=["Admin"])

# Schemas
class TenantResponse(BaseModel):
    id: str
    name: str
    business_type: str
    plan: str
    is_active: bool

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_tenants: int
    total_users: int
    total_properties: int
    total_leads: int

# Endpoints
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
        total_tenants=tenants.scalar(),
        total_users=users.scalar(),
        total_properties=properties.scalar(),
        total_leads=leads.scalar()
    )

@router.get("/tenants", response_model=List[TenantResponse])
async def get_all_tenants(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    result = await db.execute(select(Tenant))
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
