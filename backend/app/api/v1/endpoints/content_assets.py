from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, select
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

from app.database.session import get_db
from app.core.dependencies import get_current_user, get_tenant_id
from app.models.content_asset import ContentAsset, ContentAssetType
from app.models.property import Property
from app.models.user import User


router = APIRouter(prefix="/content/assets", tags=["Content Assets"])


class ContentAssetCreate(BaseModel):
    title: str
    description: Optional[str] = None
    asset_type: ContentAssetType = ContentAssetType.text
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    mime_type: Optional[str] = None
    file_size: Optional[int] = None
    property_id: Optional[str] = None
    metadata_json: Dict[str, Any] = Field(default_factory=dict)


class ContentAssetUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    asset_type: Optional[ContentAssetType] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    mime_type: Optional[str] = None
    file_size: Optional[int] = None
    property_id: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None


class ContentAssetResponse(BaseModel):
    id: str
    tenant_id: str
    uploaded_by_user_id: str
    title: str
    description: Optional[str]
    asset_type: ContentAssetType
    file_url: Optional[str]
    file_name: Optional[str]
    mime_type: Optional[str]
    file_size: Optional[int]
    property_id: Optional[str]
    metadata_json: Dict[str, Any]
    is_active: bool
    property_title: Optional[str] = None
    uploaded_by_name: Optional[str] = None
    uploaded_by_email: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


def _clean_required_text(value: str, field_name: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} is required",
        )
    return cleaned


async def _get_tenant_property(
    db: AsyncSession,
    tenant_id: str,
    property_id: Optional[str],
) -> Optional[Property]:
    if not property_id:
        return None

    result = await db.execute(
        select(Property).where(
            Property.id == property_id,
            Property.tenant_id == tenant_id,
            Property.is_active == True,
        )
    )
    property_record = result.scalar_one_or_none()

    if not property_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Property not found for this tenant",
        )

    return property_record


async def _serialize_asset(
    asset: ContentAsset,
    db: AsyncSession,
) -> Dict[str, Any]:
    user_result = await db.execute(select(User).where(User.id == asset.uploaded_by_user_id))
    uploaded_by = user_result.scalar_one_or_none()

    property_record = None
    if asset.property_id:
        property_result = await db.execute(select(Property).where(Property.id == asset.property_id))
        property_record = property_result.scalar_one_or_none()

    return {
        "id": asset.id,
        "tenant_id": asset.tenant_id,
        "uploaded_by_user_id": asset.uploaded_by_user_id,
        "title": asset.title,
        "description": asset.description,
        "asset_type": asset.asset_type,
        "file_url": asset.file_url,
        "file_name": asset.file_name,
        "mime_type": asset.mime_type,
        "file_size": asset.file_size,
        "property_id": asset.property_id,
        "metadata_json": asset.metadata_json or {},
        "is_active": asset.is_active,
        "property_title": property_record.title if property_record else None,
        "uploaded_by_name": uploaded_by.full_name if uploaded_by else None,
        "uploaded_by_email": uploaded_by.email if uploaded_by else None,
        "created_at": asset.created_at,
        "updated_at": asset.updated_at,
    }


@router.post("/", response_model=ContentAssetResponse, status_code=status.HTTP_201_CREATED)
async def create_content_asset(
    data: ContentAssetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
):
    if data.file_size is not None and data.file_size < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="file_size cannot be negative",
        )

    await _get_tenant_property(db, tenant_id, data.property_id)

    asset = ContentAsset(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        uploaded_by_user_id=current_user.id,
        title=_clean_required_text(data.title, "title"),
        description=data.description.strip() if data.description else None,
        asset_type=data.asset_type.value,
        file_url=data.file_url.strip() if data.file_url else None,
        file_name=data.file_name.strip() if data.file_name else None,
        mime_type=data.mime_type.strip() if data.mime_type else None,
        file_size=data.file_size,
        property_id=data.property_id,
        metadata_json=data.metadata_json,
    )

    db.add(asset)
    await db.commit()
    await db.refresh(asset)

    return await _serialize_asset(asset, db)


@router.get("/my", response_model=List[ContentAssetResponse])
async def get_my_content_assets(
    asset_type: Optional[ContentAssetType] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
):
    query = select(ContentAsset).where(
        ContentAsset.tenant_id == tenant_id,
        ContentAsset.is_active == True,
    )

    if asset_type:
        query = query.where(ContentAsset.asset_type == asset_type.value)

    if search:
        pattern = f"%{search.strip()}%"
        query = query.where(
            or_(
                ContentAsset.title.ilike(pattern),
                ContentAsset.description.ilike(pattern),
                ContentAsset.file_name.ilike(pattern),
            )
        )

    query = query.order_by(ContentAsset.created_at.desc())

    result = await db.execute(query)
    assets = result.scalars().all()
    return [await _serialize_asset(asset, db) for asset in assets]


@router.get("/{asset_id}", response_model=ContentAssetResponse)
async def get_content_asset(
    asset_id: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
):
    result = await db.execute(
        select(ContentAsset).where(
            ContentAsset.id == asset_id,
            ContentAsset.tenant_id == tenant_id,
            ContentAsset.is_active == True,
        )
    )

    asset = result.scalar_one_or_none()

    if not asset:
        raise HTTPException(status_code=404, detail="Content asset not found")

    return await _serialize_asset(asset, db)


@router.put("/{asset_id}", response_model=ContentAssetResponse)
async def update_content_asset(
    asset_id: str,
    data: ContentAssetUpdate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
):
    result = await db.execute(
        select(ContentAsset).where(
            ContentAsset.id == asset_id,
            ContentAsset.tenant_id == tenant_id,
            ContentAsset.is_active == True,
        )
    )

    asset = result.scalar_one_or_none()

    if not asset:
        raise HTTPException(status_code=404, detail="Content asset not found")

    updates = data.model_dump(exclude_unset=True)

    if "title" in updates and updates["title"] is not None:
        updates["title"] = _clean_required_text(updates["title"], "title")

    if "description" in updates and updates["description"] is not None:
        updates["description"] = updates["description"].strip() or None

    if "asset_type" in updates and updates["asset_type"] is not None:
        updates["asset_type"] = updates["asset_type"].value

    if "file_size" in updates and updates["file_size"] is not None and updates["file_size"] < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="file_size cannot be negative",
        )

    if "property_id" in updates:
        await _get_tenant_property(db, tenant_id, updates["property_id"])

    for key, value in updates.items():
        setattr(asset, key, value)

    await db.commit()
    await db.refresh(asset)

    return await _serialize_asset(asset, db)


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content_asset(
    asset_id: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
):
    result = await db.execute(
        select(ContentAsset).where(
            ContentAsset.id == asset_id,
            ContentAsset.tenant_id == tenant_id,
            ContentAsset.is_active == True,
        )
    )

    asset = result.scalar_one_or_none()

    if not asset:
        raise HTTPException(status_code=404, detail="Content asset not found")

    asset.is_active = False
    await db.commit()
