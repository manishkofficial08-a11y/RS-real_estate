from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
from app.database.session import get_db
from app.models.property import Property, PropertyType, PropertyStatus
from app.models.user import User
from app.core.dependencies import get_current_user, get_tenant_id
import uuid

router = APIRouter(prefix="/properties", tags=["Properties"])

# Schemas
class PropertyCreate(BaseModel):
    title: str
    description: Optional[str] = None
    price: float
    location: str
    property_type: PropertyType = PropertyType.apartment
    status: PropertyStatus = PropertyStatus.available
    bedrooms: int = 0
    bathrooms: int = 0
    area_sqft: Optional[float] = None
    images: Optional[List[str]] = []

class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    location: Optional[str] = None
    property_type: Optional[PropertyType] = None
    status: Optional[PropertyStatus] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area_sqft: Optional[float] = None
    images: Optional[List[str]] = None

class PropertyResponse(BaseModel):
    id: str
    tenant_id: str
    title: str
    description: Optional[str]
    price: float
    location: str
    property_type: PropertyType
    status: PropertyStatus
    bedrooms: int
    bathrooms: int
    area_sqft: Optional[float]
    images: List[str]
    created_by: str

    class Config:
        from_attributes = True

# Endpoints
@router.get("/", response_model=List[PropertyResponse])
async def get_properties(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id)
):
    result = await db.execute(
        select(Property).where(
            Property.tenant_id == tenant_id,
            Property.is_active == True
        )
    )
    return result.scalars().all()


@router.post("/", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
async def create_property(
    data: PropertyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id)
):
    property = Property(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        created_by=current_user.id,
        **data.model_dump()
    )
    db.add(property)
    await db.commit()
    await db.refresh(property)
    return property


@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property(
    property_id: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id)
):
    result = await db.execute(
        select(Property).where(
            Property.id == property_id,
            Property.tenant_id == tenant_id,
            Property.is_active == True
        )
    )
    property = result.scalar_one_or_none()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    return property


@router.put("/{property_id}", response_model=PropertyResponse)
async def update_property(
    property_id: str,
    data: PropertyUpdate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id)
):
    result = await db.execute(
        select(Property).where(
            Property.id == property_id,
            Property.tenant_id == tenant_id
        )
    )
    property = result.scalar_one_or_none()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")

    for key, value in data.model_dump(exclude_none=True).items():
        setattr(property, key, value)

    await db.commit()
    await db.refresh(property)
    return property


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property(
    property_id: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id)
):
    result = await db.execute(
        select(Property).where(
            Property.id == property_id,
            Property.tenant_id == tenant_id
        )
    )
    property = result.scalar_one_or_none()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")

    property.is_active = False
    await db.commit()
