from __future__ import annotations

import asyncio
import logging
import os
import uuid
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import FastAPI
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.base import AsyncSessionLocal
from app.models.rekha_outreach import (
    RekhaCampaignSettings,
    RekhaMessageStatus,
    RekhaOutreachMessage,
    RekhaProspect,
    RekhaProspectStatus,
)
from app.services.rekha_agent import draft_follow_up, integration_status, send_outreach


logger = logging.getLogger(__name__)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _within_working_hours(settings: RekhaCampaignSettings, now: datetime) -> bool:
    try:
        local_now = now.astimezone(ZoneInfo(settings.timezone_name))
    except ZoneInfoNotFoundError:
        local_now = now.astimezone(ZoneInfo("Asia/Kolkata"))
    return settings.working_hours_start <= local_now.hour < settings.working_hours_end


async def process_due_rekha_follow_ups(db: AsyncSession, limit: int = 25) -> dict:
    now = _now()
    settings = await db.get(RekhaCampaignSettings, "default")
    if not settings or not settings.is_active or not settings.auto_follow_ups:
        return {"checked_at": now.isoformat(), "processed_count": 0, "reason": "campaign_paused"}
    if not _within_working_hours(settings, now):
        return {"checked_at": now.isoformat(), "processed_count": 0, "reason": "outside_working_hours"}

    due = await db.execute(
        select(RekhaProspect)
        .options(selectinload(RekhaProspect.messages))
        .where(
            RekhaProspect.next_follow_up_at.is_not(None),
            RekhaProspect.next_follow_up_at <= now,
            RekhaProspect.status == RekhaProspectStatus.contacted.value,
            RekhaProspect.opted_out.is_(False),
            RekhaProspect.automation_paused.is_(False),
            RekhaProspect.requires_founder.is_(False),
            RekhaProspect.follow_up_stage <= 3,
        )
        .order_by(RekhaProspect.next_follow_up_at.asc())
        .limit(max(1, min(limit, 100)))
    )
    prospects = due.scalars().unique().all()

    status = integration_status()
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    sent_today = int(
        await db.scalar(
            select(func.count(RekhaOutreachMessage.id)).where(
                RekhaOutreachMessage.status == RekhaMessageStatus.sent.value,
                RekhaOutreachMessage.sent_at >= start,
            )
        )
        or 0
    )
    results: list[dict] = []
    for prospect in prospects:
        copy = draft_follow_up(prospect, max(1, prospect.follow_up_stage))
        message = RekhaOutreachMessage(
            id=str(uuid.uuid4()),
            prospect_id=prospect.id,
            channel=prospect.preferred_channel or ("email" if prospect.email else "whatsapp"),
            direction="outbound",
            status=RekhaMessageStatus.draft.value,
            subject=copy["subject"] or None,
            body=copy["body"],
            provider=copy["provider"],
            message_kind="follow_up",
            scheduled_at=prospect.next_follow_up_at,
            auto_generated=True,
        )
        db.add(message)
        prospect.next_follow_up_at = None
        result = {"prospect_id": prospect.id, "message_id": message.id, "status": "drafted"}

        recipient = prospect.email if message.channel == "email" else prospect.phone
        can_send = status["auto_send_enabled"] and sent_today < status["daily_send_limit"]
        if can_send and recipient:
            delivery = await send_outreach(message.channel, recipient, message.subject or "", message.body)
            message.approved_at = now
            if delivery.get("sent"):
                message.status = RekhaMessageStatus.sent.value
                message.sent_at = now
                message.provider = delivery.get("provider") or message.provider
                message.provider_message_id = delivery.get("provider_message_id")
                prospect.last_contacted_at = now
                prospect.follow_up_stage += 1
                delays = {2: 4, 3: 5}
                delay = delays.get(prospect.follow_up_stage)
                if delay:
                    prospect.next_follow_up_at = now + timedelta(days=delay)
                sent_today += 1
                result["status"] = "sent"
            else:
                message.status = RekhaMessageStatus.failed.value
                message.error_message = delivery.get("message") or "Follow-up delivery failed"
                result["status"] = "failed"
        results.append(result)

    await db.commit()
    return {"checked_at": now.isoformat(), "processed_count": len(results), "results": results}


async def _rekha_automation_loop() -> None:
    interval = max(int(os.getenv("REKHA_WORKER_INTERVAL_SECONDS", "60") or "60"), 30)
    while True:
        try:
            async with AsyncSessionLocal() as db:
                summary = await process_due_rekha_follow_ups(
                    db, limit=int(os.getenv("REKHA_WORKER_BATCH_SIZE", "25") or "25")
                )
                if summary.get("processed_count"):
                    logger.info("Rekha processed follow-ups: %s", summary)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Rekha automation worker failed")
        await asyncio.sleep(interval)


def register_rekha_automation_worker(app: FastAPI) -> None:
    if os.getenv("DISABLE_REKHA_AUTOMATION_WORKER", "").lower() in {"1", "true", "yes"}:
        return

    @app.on_event("startup")
    async def _start_rekha_worker() -> None:
        if not getattr(app.state, "rekha_automation_task", None):
            app.state.rekha_automation_task = asyncio.create_task(_rekha_automation_loop())

    @app.on_event("shutdown")
    async def _stop_rekha_worker() -> None:
        task = getattr(app.state, "rekha_automation_task", None)
        if task:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
