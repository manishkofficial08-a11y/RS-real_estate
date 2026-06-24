from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_tenant_id
from app.database.session import get_db
from app.models.ai_job import AIJob
from app.models.content_asset import ContentAsset
from app.models.generated_post import (
    GeneratedPost,
    GeneratedPostPlatform,
    GeneratedPostStatus,
)
from app.models.property import Property
from app.models.user import User
from app.services.social_account_credentials import (
    get_connected_social_account_credentials,
)
from app.services.social_publisher import (
    PublisherError,
    get_publisher_mode,
    publish_generated_post_to_platform,
)


router = APIRouter(prefix="/generated-posts", tags=["Generated Posts"])


CAMPAIGN_PLATFORM_LABELS = {
    "youtube": "YouTube Shorts",
    "instagram": "Instagram Reels",
    "facebook": "Facebook Video",
    "linkedin": "LinkedIn",
}


class GeneratedPostCreate(BaseModel):
    title: str
    content: str
    platform: GeneratedPostPlatform = GeneratedPostPlatform.instagram
    status: GeneratedPostStatus = GeneratedPostStatus.draft
    property_id: Optional[str] = None
    source_ai_job_id: Optional[str] = None
    hashtags: List[str] = Field(default_factory=list)
    media_asset_ids: List[str] = Field(default_factory=list)
    scheduled_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    metadata_json: Dict[str, Any] = Field(default_factory=dict)


class GeneratedPostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    platform: Optional[GeneratedPostPlatform] = None
    status: Optional[GeneratedPostStatus] = None
    property_id: Optional[str] = None
    source_ai_job_id: Optional[str] = None
    hashtags: Optional[List[str]] = None
    media_asset_ids: Optional[List[str]] = None
    scheduled_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    metadata_json: Optional[Dict[str, Any]] = None


class GeneratedPostPublishRequest(BaseModel):
    platform: Optional[GeneratedPostPlatform] = None
    allow_mock_fallback: bool = True


class CampaignPublishRequest(BaseModel):
    platforms: List[str] = Field(
        default_factory=lambda: ["youtube", "instagram", "facebook", "linkedin"],
        min_length=1,
    )
    allow_mock_fallback: bool = True
    campaign_metadata: Dict[str, Any] = Field(default_factory=dict)


class CampaignPublishResult(BaseModel):
    platform: str
    status: str
    mode: str
    external_post_id: Optional[str] = None
    external_post_url: Optional[str] = None
    warning: Optional[str] = None
    error: Optional[str] = None


def _platform_not_connected_message(platform: str) -> str:
    return (
        f"{CAMPAIGN_PLATFORM_LABELS.get(platform, platform.title())} is not connected. "
        "Connect this account before publishing."
    )


class CampaignPublishResponse(BaseModel):
    generated_post_id: str
    campaign_id: str
    results: List[CampaignPublishResult]


class GeneratedPostResponse(BaseModel):
    id: str
    tenant_id: str
    created_by_user_id: Optional[str]
    property_id: Optional[str]
    source_ai_job_id: Optional[str]

    title: str
    content: str
    platform: GeneratedPostPlatform
    status: GeneratedPostStatus

    hashtags: List[str]
    media_asset_ids: List[str]
    metadata_json: Dict[str, Any]

    scheduled_at: Optional[datetime]
    published_at: Optional[datetime]
    is_active: bool

    property_title: Optional[str] = None
    created_by_name: Optional[str] = None
    created_by_email: Optional[str] = None
    source_ai_job_title: Optional[str] = None

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


def _clean_string_list(values: Optional[List[str]]) -> List[str]:
    if not values:
        return []

    return [value.strip() for value in values if isinstance(value, str) and value.strip()]


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


async def _get_tenant_ai_job(
    db: AsyncSession,
    tenant_id: str,
    source_ai_job_id: Optional[str],
) -> Optional[AIJob]:
    if not source_ai_job_id:
        return None

    result = await db.execute(
        select(AIJob).where(
            AIJob.id == source_ai_job_id,
            AIJob.tenant_id == tenant_id,
        )
    )
    ai_job = result.scalar_one_or_none()

    if not ai_job:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="AI job not found for this tenant",
        )

    return ai_job


async def _get_linked_media_asset(
    db: AsyncSession,
    tenant_id: str,
    post: GeneratedPost,
) -> Optional[ContentAsset]:
    asset_ids = _clean_string_list(post.media_asset_ids)
    metadata = post.metadata_json or {}
    source_asset_id = metadata.get("source_asset_id")

    if isinstance(source_asset_id, str) and source_asset_id.strip():
        source_asset_id = source_asset_id.strip()
        if source_asset_id not in asset_ids:
            asset_ids.append(source_asset_id)

    if not asset_ids:
        return None

    result = await db.execute(
        select(ContentAsset).where(
            ContentAsset.id.in_(asset_ids),
            ContentAsset.tenant_id == tenant_id,
            ContentAsset.is_active == True,
        )
    )
    assets_by_id = {asset.id: asset for asset in result.scalars().all()}

    ordered_assets = [
        assets_by_id[asset_id] for asset_id in asset_ids if asset_id in assets_by_id
    ]

    return next(
        (asset for asset in ordered_assets if asset.asset_type == "video"),
        ordered_assets[0] if ordered_assets else None,
    )


async def _serialize_generated_post(
    post: GeneratedPost,
    db: AsyncSession,
) -> Dict[str, Any]:
    created_by = None
    if post.created_by_user_id:
        user_result = await db.execute(select(User).where(User.id == post.created_by_user_id))
        created_by = user_result.scalar_one_or_none()

    property_record = None
    if post.property_id:
        property_result = await db.execute(select(Property).where(Property.id == post.property_id))
        property_record = property_result.scalar_one_or_none()

    ai_job = None
    if post.source_ai_job_id:
        ai_job_result = await db.execute(select(AIJob).where(AIJob.id == post.source_ai_job_id))
        ai_job = ai_job_result.scalar_one_or_none()

    return {
        "id": post.id,
        "tenant_id": post.tenant_id,
        "created_by_user_id": post.created_by_user_id,
        "property_id": post.property_id,
        "source_ai_job_id": post.source_ai_job_id,
        "title": post.title,
        "content": post.content,
        "platform": post.platform,
        "status": post.status,
        "hashtags": post.hashtags or [],
        "media_asset_ids": post.media_asset_ids or [],
        "metadata_json": post.metadata_json or {},
        "scheduled_at": post.scheduled_at,
        "published_at": post.published_at,
        "is_active": post.is_active,
        "property_title": property_record.title if property_record else None,
        "created_by_name": created_by.full_name if created_by else None,
        "created_by_email": created_by.email if created_by else None,
        "source_ai_job_title": ai_job.title if ai_job else None,
        "created_at": post.created_at,
        "updated_at": post.updated_at,
    }


@router.post("/", response_model=GeneratedPostResponse, status_code=status.HTTP_201_CREATED)
async def create_generated_post(
    data: GeneratedPostCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
):
    await _get_tenant_property(db, tenant_id, data.property_id)
    await _get_tenant_ai_job(db, tenant_id, data.source_ai_job_id)

    published_at = data.published_at
    if data.status == GeneratedPostStatus.published and published_at is None:
        published_at = datetime.now(timezone.utc)

    post = GeneratedPost(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        created_by_user_id=current_user.id,
        property_id=data.property_id,
        source_ai_job_id=data.source_ai_job_id,
        title=_clean_required_text(data.title, "title"),
        content=_clean_required_text(data.content, "content"),
        platform=data.platform.value,
        status=data.status.value,
        hashtags=_clean_string_list(data.hashtags),
        media_asset_ids=_clean_string_list(data.media_asset_ids),
        scheduled_at=data.scheduled_at,
        published_at=published_at,
        metadata_json=data.metadata_json,
    )

    db.add(post)
    await db.commit()
    await db.refresh(post)

    return await _serialize_generated_post(post, db)


@router.get("/my", response_model=List[GeneratedPostResponse])
async def get_my_generated_posts(
    status_filter: Optional[GeneratedPostStatus] = Query(default=None, alias="status"),
    platform: Optional[GeneratedPostPlatform] = None,
    property_id: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
):
    query = select(GeneratedPost).where(
        GeneratedPost.tenant_id == tenant_id,
        GeneratedPost.is_active == True,
    )

    if status_filter:
        query = query.where(GeneratedPost.status == status_filter.value)

    if platform:
        query = query.where(GeneratedPost.platform == platform.value)

    if property_id:
        query = query.where(GeneratedPost.property_id == property_id)

    if search and search.strip():
        pattern = f"%{search.strip()}%"
        query = query.where(
            or_(
                GeneratedPost.title.ilike(pattern),
                GeneratedPost.content.ilike(pattern),
            )
        )

    query = query.order_by(GeneratedPost.created_at.desc()).limit(limit)

    result = await db.execute(query)
    posts = result.scalars().all()

    return [await _serialize_generated_post(post, db) for post in posts]


@router.get("/{post_id}", response_model=GeneratedPostResponse)
async def get_generated_post(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
):
    result = await db.execute(
        select(GeneratedPost).where(
            GeneratedPost.id == post_id,
            GeneratedPost.tenant_id == tenant_id,
            GeneratedPost.is_active == True,
        )
    )
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(status_code=404, detail="Generated post not found")

    return await _serialize_generated_post(post, db)


@router.put("/{post_id}", response_model=GeneratedPostResponse)
async def update_generated_post(
    post_id: str,
    data: GeneratedPostUpdate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
):
    result = await db.execute(
        select(GeneratedPost).where(
            GeneratedPost.id == post_id,
            GeneratedPost.tenant_id == tenant_id,
            GeneratedPost.is_active == True,
        )
    )
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(status_code=404, detail="Generated post not found")

    updates = data.model_dump(exclude_unset=True)

    if "property_id" in updates:
        await _get_tenant_property(db, tenant_id, updates["property_id"])

    if "source_ai_job_id" in updates:
        await _get_tenant_ai_job(db, tenant_id, updates["source_ai_job_id"])

    if "title" in updates and updates["title"] is not None:
        updates["title"] = _clean_required_text(updates["title"], "title")

    if "content" in updates and updates["content"] is not None:
        updates["content"] = _clean_required_text(updates["content"], "content")

    if "platform" in updates and updates["platform"] is not None:
        updates["platform"] = updates["platform"].value

    if "status" in updates and updates["status"] is not None:
        updates["status"] = updates["status"].value
        if updates["status"] == GeneratedPostStatus.published.value and not post.published_at:
            updates["published_at"] = datetime.now(timezone.utc)

    if "hashtags" in updates and updates["hashtags"] is not None:
        updates["hashtags"] = _clean_string_list(updates["hashtags"])

    if "media_asset_ids" in updates and updates["media_asset_ids"] is not None:
        updates["media_asset_ids"] = _clean_string_list(updates["media_asset_ids"])

    for key, value in updates.items():
        setattr(post, key, value)

    await db.commit()
    await db.refresh(post)

    return await _serialize_generated_post(post, db)



@router.post("/{post_id}/publish", response_model=GeneratedPostResponse)
async def publish_generated_post(
    post_id: str,
    data: GeneratedPostPublishRequest = GeneratedPostPublishRequest(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
):
    result = await db.execute(
        select(GeneratedPost).where(
            GeneratedPost.id == post_id,
            GeneratedPost.tenant_id == tenant_id,
            GeneratedPost.is_active == True,
        )
    )
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(status_code=404, detail="Generated post not found")

    if data.platform:
        post.platform = data.platform.value

    media_asset = await _get_linked_media_asset(db, tenant_id, post)
    selected_platform = data.platform.value if data.platform else post.platform
    social_credentials = await get_connected_social_account_credentials(
        db,
        tenant_id,
        selected_platform,
    )

    if not social_credentials and not data.allow_mock_fallback:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=_platform_not_connected_message(selected_platform),
        )

    try:
        publish_result = await publish_generated_post_to_platform(
            post,
            platform=selected_platform,
            media_asset=media_asset,
            allow_mock_fallback=data.allow_mock_fallback,
            credentials=social_credentials,
        )
    except PublisherError as exc:
        metadata = dict(post.metadata_json or {})
        metadata["publisher"] = {
            "mode": "failed",
            "error": str(exc),
            "attempted_at": datetime.now(timezone.utc).isoformat(),
        }
        post.metadata_json = metadata
        post.status = GeneratedPostStatus.failed.value
        await db.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    metadata = dict(post.metadata_json or {})
    metadata["publisher"] = {
        "platform": publish_result.platform,
        "mode": publish_result.mode,
        "provider": publish_result.provider,
        "external_post_id": publish_result.external_post_id,
        "external_post_url": publish_result.external_post_url,
        "warning": publish_result.warning,
        "raw_response": publish_result.raw_response,
        "published_by_user_id": current_user.id,
        "published_at": datetime.now(timezone.utc).isoformat(),
    }

    post.metadata_json = metadata
    post.status = GeneratedPostStatus.published.value
    post.published_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(post)

    return await _serialize_generated_post(post, db)


@router.post(
    "/{post_id}/campaign-publish",
    response_model=CampaignPublishResponse,
)
async def campaign_publish_generated_post(
    post_id: str,
    data: CampaignPublishRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
):
    query_result = await db.execute(
        select(GeneratedPost).where(
            GeneratedPost.id == post_id,
            GeneratedPost.tenant_id == tenant_id,
            GeneratedPost.is_active == True,
        )
    )
    post = query_result.scalar_one_or_none()

    if not post:
        raise HTTPException(status_code=404, detail="Generated post not found")

    supported_platforms = {"youtube", "instagram", "facebook", "linkedin"}
    platforms: List[str] = []

    for requested_platform in data.platforms:
        normalized = requested_platform.strip().lower().replace("youtube shorts", "youtube")
        if normalized not in supported_platforms:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported campaign platform: {requested_platform}",
            )
        if normalized not in platforms:
            platforms.append(normalized)

    media_asset = await _get_linked_media_asset(db, tenant_id, post)
    campaign_id = str(uuid.uuid4())
    published_at = datetime.now(timezone.utc)
    publisher_mode = get_publisher_mode()
    results: List[CampaignPublishResult] = []

    for platform in platforms:
        try:
            social_credentials = await get_connected_social_account_credentials(
                db,
                tenant_id,
                platform,
            )

            if not social_credentials and not data.allow_mock_fallback:
                results.append(
                    CampaignPublishResult(
                        platform=platform,
                        status="not_connected",
                        mode="not_connected",
                        error=_platform_not_connected_message(platform),
                    )
                )
                continue

            publish_result = await publish_generated_post_to_platform(
                post,
                platform=platform,
                media_asset=media_asset,
                allow_mock_fallback=data.allow_mock_fallback,
                credentials=social_credentials,
            )
            results.append(
                CampaignPublishResult(
                    platform=platform,
                    status=(
                        "mock_fallback"
                        if publish_result.mode == "mock"
                        else "success"
                    ),
                    mode=publish_result.mode,
                    external_post_id=publish_result.external_post_id,
                    external_post_url=publish_result.external_post_url,
                    warning=publish_result.warning,
                )
            )
        except PublisherError as exc:
            results.append(
                CampaignPublishResult(
                    platform=platform,
                    status="failed",
                    mode=publisher_mode,
                    error=str(exc),
                )
            )

    campaign_record = {
        "campaign_id": campaign_id,
        "platforms": platforms,
        "allow_mock_fallback": data.allow_mock_fallback,
        "campaign_metadata": data.campaign_metadata,
        "published_by_user_id": current_user.id,
        "published_at": published_at.isoformat(),
        "results": [result.model_dump() for result in results],
    }
    metadata = dict(post.metadata_json or {})
    previous_campaigns = metadata.get("campaigns")
    campaigns = list(previous_campaigns) if isinstance(previous_campaigns, list) else []
    campaigns.append(campaign_record)
    metadata["campaigns"] = campaigns[-20:]
    metadata["latest_campaign"] = campaign_record
    post.metadata_json = metadata

    if any(result.status in {"success", "mock_fallback"} for result in results):
        post.status = GeneratedPostStatus.published.value
        post.published_at = published_at
    else:
        post.status = GeneratedPostStatus.failed.value

    await db.commit()

    return CampaignPublishResponse(
        generated_post_id=post.id,
        campaign_id=campaign_id,
        results=results,
    )


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def archive_generated_post(
    post_id: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
):
    result = await db.execute(
        select(GeneratedPost).where(
            GeneratedPost.id == post_id,
            GeneratedPost.tenant_id == tenant_id,
            GeneratedPost.is_active == True,
        )
    )
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(status_code=404, detail="Generated post not found")

    post.is_active = False
    post.status = GeneratedPostStatus.archived.value

    await db.commit()
    return None
