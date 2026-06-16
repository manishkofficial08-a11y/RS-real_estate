from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from app.database.session import get_db
from app.models.lead import Lead, LeadActivity, LeadStatus, LeadSource
from app.models.user import User
from app.core.dependencies import get_current_user, get_tenant_id
import uuid

router = APIRouter(prefix="/leads", tags=["Leads"])

# Schemas
class LeadCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    source: LeadSource = LeadSource.website
    status: LeadStatus = LeadStatus.new
    score: int = 0
    property_interest_id: Optional[str] = None
    notes: Optional[str] = None

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    source: Optional[LeadSource] = None
    status: Optional[LeadStatus] = None
    score: Optional[int] = None
    property_interest_id: Optional[str] = None
    notes: Optional[str] = None
    assigned_to: Optional[str] = None

class ActivityCreate(BaseModel):
    activity_type: str
    description: Optional[str] = None

class ActivityResponse(BaseModel):
    id: str
    lead_id: str
    activity_type: str
    description: Optional[str]
    created_by: Optional[str]
    created_at: str

    class Config:
        from_attributes = True

class LeadResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    email: Optional[str]
    phone: Optional[str]
    source: LeadSource
    status: LeadStatus
    score: int
    property_interest_id: Optional[str]
    notes: Optional[str]
    assigned_to: Optional[str]

    class Config:
        from_attributes = True

@router.get("/archived", response_model=List[LeadResponse])
async def get_archived_leads(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id)
):
    result = await db.execute(
        select(Lead).where(
            Lead.tenant_id == tenant_id,
            Lead.is_active == False
        )
    )
    return result.scalars().all()


@router.put("/{lead_id}/restore", response_model=LeadResponse)
async def restore_lead(
    lead_id: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id)
):
    result = await db.execute(
        select(Lead).where(
            Lead.id == lead_id,
            Lead.tenant_id == tenant_id
        )
    )
    lead = result.scalar_one_or_none()

    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead.is_active = True
    await db.commit()
    await db.refresh(lead)

    return lead

# Endpoints
@router.get("/", response_model=List[LeadResponse])
async def get_leads(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id)
):
    result = await db.execute(
        select(Lead).where(
            Lead.tenant_id == tenant_id,
            Lead.is_active == True
        )
    )
    return result.scalars().all()


@router.post("/", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
async def create_lead(
    data: LeadCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id)
):
    lead = Lead(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        **data.model_dump()
    )
    db.add(lead)
    await db.flush()

    # Log activity
    activity = LeadActivity(
        id=str(uuid.uuid4()),
        lead_id=lead.id,
        activity_type="created",
        description="Lead created",
        created_by=current_user.id
    )
    db.add(activity)
    await db.commit()
    await db.refresh(lead)
    return lead


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id)
):
    result = await db.execute(
        select(Lead).where(
            Lead.id == lead_id,
            Lead.tenant_id == tenant_id,
            Lead.is_active == True
        )
    )
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.put("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: str,
    data: LeadUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id)
):
    result = await db.execute(
        select(Lead).where(
            Lead.id == lead_id,
            Lead.tenant_id == tenant_id
        )
    )
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    for key, value in data.model_dump(exclude_none=True).items():
        setattr(lead, key, value)

    # Log activity
    activity = LeadActivity(
        id=str(uuid.uuid4()),
        lead_id=lead.id,
        activity_type="updated",
        description="Lead updated",
        created_by=current_user.id
    )
    db.add(activity)
    await db.commit()
    await db.refresh(lead)
    return lead


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lead(
    lead_id: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id)
):
    result = await db.execute(
        select(Lead).where(
            Lead.id == lead_id,
            Lead.tenant_id == tenant_id
        )
    )
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead.is_active = False
    await db.commit()


@router.post("/{lead_id}/activities", status_code=status.HTTP_201_CREATED)
async def add_activity(
    lead_id: str,
    data: ActivityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id)
):
    result = await db.execute(
        select(Lead).where(
            Lead.id == lead_id,
            Lead.tenant_id == tenant_id
        )
    )
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    activity = LeadActivity(
        id=str(uuid.uuid4()),
        lead_id=lead_id,
        activity_type=data.activity_type,
        description=data.description,
        created_by=current_user.id
    )
    db.add(activity)
    await db.commit()
    return {"message": "Activity added successfully"}
