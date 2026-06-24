from __future__ import annotations

import asyncio
import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import FastAPI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.base import AsyncSessionLocal
from app.models.content_asset import ContentAsset
from app.models.generated_post import GeneratedPost, GeneratedPostStatus
from app.models.scheduled_post import ScheduledPost, ScheduledPostStatus
from app.services.social_account_credentials import (
    get_connected_social_account_credentials,
)
from app.services.social_publisher import (
    PublisherError,
    PublisherConfigError,
    get_publisher_mode,
    publish_generated_post_to_platform,
)

logger = logging.getLogger(__name__)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _clean_string_list(values: Any) -> List[str]:
    if not isinstance(values, list):
        return []

    return [value.strip() for value in values if isinstance(value, str) and value.strip()]


def _append_metadata_event(metadata: Optional[Dict[str, Any]], key: str, event: Dict[str, Any], limit: int = 20) -> Dict[str, Any]:
    updated = dict(metadata or {})
    events = updated.get(key)
    event_list = list(events) if isinstance(events, list) else []
    event_list.append(event)
    updated[key] = event_list[-limit:]
    updated[f"latest_{key.rstrip('s')}"] = event
    return updated


async def get_linked_media_asset(
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


async def process_one_scheduled_post(
    db: AsyncSession,
    schedule: ScheduledPost,
    allow_mock_fallback: bool = True,
) -> Dict[str, Any]:
    started_at = _now()
    publisher_mode = get_publisher_mode()
    schedule_metadata = schedule.metadata_json or {}
    metadata_allow_mock_fallback = schedule_metadata.get("allow_mock_fallback")
    effective_allow_mock_fallback = (
        metadata_allow_mock_fallback
        if isinstance(metadata_allow_mock_fallback, bool)
        else allow_mock_fallback
    )

    post_result = await db.execute(
        select(GeneratedPost).where(
            GeneratedPost.id == schedule.generated_post_id,
            GeneratedPost.tenant_id == schedule.tenant_id,
            GeneratedPost.is_active == True,
        )
    )
    post = post_result.scalar_one_or_none()

    if not post:
        schedule.status = ScheduledPostStatus.failed.value
        schedule.failed_at = started_at
        schedule.failure_reason = "Generated post not found for this schedule"
        await db.commit()

        return {
            "schedule_id": schedule.id,
            "generated_post_id": schedule.generated_post_id,
            "platform": schedule.platform,
            "status": "failed",
            "mode": publisher_mode,
            "error": schedule.failure_reason,
        }

    schedule.status = ScheduledPostStatus.publishing.value
    schedule.metadata_json = _append_metadata_event(
        schedule.metadata_json,
        "processor_events",
        {
            "event": "publishing_started",
            "started_at": started_at.isoformat(),
            "mode": publisher_mode,
            "allow_mock_fallback": effective_allow_mock_fallback,
        },
    )
    await db.commit()
    await db.refresh(schedule)

    media_asset = await get_linked_media_asset(db, schedule.tenant_id, post)

    try:
        social_credentials = await get_connected_social_account_credentials(
            db,
            schedule.tenant_id,
            schedule.platform,
        )

        if not social_credentials and not effective_allow_mock_fallback:
            raise PublisherConfigError(
                f"{schedule.platform} is not connected. Connect this account before publishing."
            )

        publish_result = await publish_generated_post_to_platform(
            post,
            platform=schedule.platform,
            media_asset=media_asset,
            allow_mock_fallback=effective_allow_mock_fallback,
            credentials=social_credentials,
        )

        completed_at = _now()
        schedule.status = ScheduledPostStatus.published.value
        schedule.published_at = completed_at
        schedule.failed_at = None
        schedule.failure_reason = None
        schedule.external_post_id = publish_result.external_post_id
        schedule.external_post_url = publish_result.external_post_url
        schedule.metadata_json = _append_metadata_event(
            schedule.metadata_json,
            "processor_events",
            {
                "event": "published",
                "completed_at": completed_at.isoformat(),
                "platform": publish_result.platform,
                "mode": publish_result.mode,
                "provider": publish_result.provider,
                "external_post_id": publish_result.external_post_id,
                "external_post_url": publish_result.external_post_url,
                "warning": publish_result.warning,
                "raw_response": publish_result.raw_response,
            },
        )

        post.status = GeneratedPostStatus.published.value
        post.published_at = post.published_at or completed_at
        post.metadata_json = _append_metadata_event(
            post.metadata_json,
            "scheduled_publish_events",
            {
                "schedule_id": schedule.id,
                "platform": publish_result.platform,
                "mode": publish_result.mode,
                "provider": publish_result.provider,
                "external_post_id": publish_result.external_post_id,
                "external_post_url": publish_result.external_post_url,
                "warning": publish_result.warning,
                "published_at": completed_at.isoformat(),
            },
        )

        await db.commit()

        return {
            "schedule_id": schedule.id,
            "generated_post_id": schedule.generated_post_id,
            "platform": publish_result.platform,
            "status": "published",
            "mode": publish_result.mode,
            "external_post_id": publish_result.external_post_id,
            "external_post_url": publish_result.external_post_url,
            "warning": publish_result.warning,
        }

    except Exception as exc:
        failed_at = _now()
        error_message = str(exc)

        schedule.status = ScheduledPostStatus.failed.value
        schedule.failed_at = failed_at
        schedule.failure_reason = error_message
        schedule.retry_count = (schedule.retry_count or 0) + 1
        schedule.metadata_json = _append_metadata_event(
            schedule.metadata_json,
            "processor_events",
            {
                "event": "failed",
                "failed_at": failed_at.isoformat(),
                "mode": publisher_mode,
                "error": error_message,
            },
        )

        post.status = GeneratedPostStatus.failed.value
        post.metadata_json = _append_metadata_event(
            post.metadata_json,
            "scheduled_publish_events",
            {
                "schedule_id": schedule.id,
                "platform": schedule.platform,
                "mode": publisher_mode,
                "status": "failed",
                "error": error_message,
                "failed_at": failed_at.isoformat(),
            },
        )

        await db.commit()

        if not isinstance(exc, PublisherError):
            logger.exception("Unexpected scheduled publish failure")

        return {
            "schedule_id": schedule.id,
            "generated_post_id": schedule.generated_post_id,
            "platform": schedule.platform,
            "status": "failed",
            "mode": publisher_mode,
            "error": error_message,
        }


async def process_due_scheduled_posts(
    db: AsyncSession,
    tenant_id: Optional[str] = None,
    limit: int = 25,
    allow_mock_fallback: bool = True,
) -> Dict[str, Any]:
    due_at = _now()

    query = select(ScheduledPost).where(
        ScheduledPost.is_active == True,
        ScheduledPost.status == ScheduledPostStatus.scheduled.value,
        ScheduledPost.scheduled_at <= due_at,
    )

    if tenant_id:
        query = query.where(ScheduledPost.tenant_id == tenant_id)

    query = query.order_by(ScheduledPost.scheduled_at.asc()).limit(limit)

    result = await db.execute(query)
    due_schedules = result.scalars().all()

    results = []
    for schedule in due_schedules:
        results.append(
            await process_one_scheduled_post(
                db,
                schedule,
                allow_mock_fallback=allow_mock_fallback,
            )
        )

    return {
        "checked_at": due_at.isoformat(),
        "due_count": len(due_schedules),
        "processed_count": len(results),
        "results": results,
    }


async def _scheduled_publisher_loop() -> None:
    interval = int(os.getenv("SCHEDULED_PUBLISHER_INTERVAL_SECONDS", "60") or "60")
    interval = max(interval, 15)

    while True:
        try:
            async with AsyncSessionLocal() as db:
                summary = await process_due_scheduled_posts(
                    db,
                    limit=int(os.getenv("SCHEDULED_PUBLISHER_BATCH_SIZE", "25") or "25"),
                    allow_mock_fallback=True,
                )

                if summary["processed_count"]:
                    logger.info("Scheduled publisher processed due posts: %s", summary)

        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Scheduled publisher loop failed")

        await asyncio.sleep(interval)


def register_scheduled_publisher_worker(app: FastAPI) -> None:
    disabled = os.getenv("DISABLE_SCHEDULED_PUBLISHER_WORKER", "").lower() in {
        "1",
        "true",
        "yes",
    }

    if disabled:
        return

    @app.on_event("startup")
    async def _start_scheduled_publisher_worker() -> None:
        if getattr(app.state, "scheduled_publisher_task", None):
            return

        app.state.scheduled_publisher_task = asyncio.create_task(
            _scheduled_publisher_loop()
        )

    @app.on_event("shutdown")
    async def _stop_scheduled_publisher_worker() -> None:
        task = getattr(app.state, "scheduled_publisher_task", None)
        if not task:
            return

        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
