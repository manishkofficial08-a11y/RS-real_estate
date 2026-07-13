from __future__ import annotations

import asyncio
import logging
import os
import uuid
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import FastAPI
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.base import AsyncSessionLocal
from app.models.rekha_outreach import (
    RekhaAutomationRun,
    RekhaCampaignSettings,
    RekhaMessageStatus,
    RekhaOutreachMessage,
    RekhaProspect,
    RekhaProspectStatus,
)
from app.services.free_lead_generation import discover_public_business_leads
from app.services.rekha_agent import (
    calculate_fit,
    draft_follow_up,
    draft_outreach,
    infer_market_region,
    integration_status,
    send_outreach,
)
from app.services.rekha_email_inbox import poll_rekha_email_replies


logger = logging.getLogger(__name__)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _split_values(value: str | None, fallback: str) -> list[str]:
    values = [item.strip() for item in (value or "").replace("\n", ",").split(",") if item.strip()]
    return values or [fallback]


def _within_working_hours(settings: RekhaCampaignSettings, now: datetime) -> bool:
    try:
        local_now = now.astimezone(ZoneInfo(settings.timezone_name))
    except ZoneInfoNotFoundError:
        local_now = now.astimezone(ZoneInfo("Asia/Kolkata"))
    return settings.working_hours_start <= local_now.hour < settings.working_hours_end


async def _sent_today(db: AsyncSession, now: datetime) -> int:
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return int(
        await db.scalar(
            select(func.count(RekhaOutreachMessage.id)).where(
                RekhaOutreachMessage.status == RekhaMessageStatus.sent.value,
                RekhaOutreachMessage.sent_at >= start,
            )
        )
        or 0
    )


def _schedule_next_follow_up(prospect: RekhaProspect, sent_at: datetime) -> None:
    prospect.follow_up_stage = max(prospect.follow_up_stage, 1)
    delay = {1: 3, 2: 4, 3: 5}.get(prospect.follow_up_stage)
    prospect.next_follow_up_at = sent_at + timedelta(days=delay) if delay else None


async def _deliver(
    prospect: RekhaProspect,
    message: RekhaOutreachMessage,
    now: datetime,
) -> dict:
    recipient = prospect.email if message.channel == "email" else prospect.phone
    if not recipient:
        return {"sent": False, "message": "missing_recipient"}
    result = await send_outreach(message.channel, recipient, message.subject or "", message.body)
    message.approved_at = now
    if result.get("sent"):
        message.status = RekhaMessageStatus.sent.value
        message.sent_at = now
        message.provider = result.get("provider") or message.provider
        message.provider_message_id = result.get("provider_message_id")
        message.error_message = None
        prospect.status = RekhaProspectStatus.contacted.value
        prospect.last_contacted_at = now
        _schedule_next_follow_up(prospect, now)
    else:
        message.status = RekhaMessageStatus.failed.value
        message.error_message = result.get("message") or "Delivery failed"
    return result


def _initial_send_allowed(
    prospect: RekhaProspect,
    channel: str,
    settings: RekhaCampaignSettings,
    status: dict,
) -> bool:
    if not settings.auto_initial_outreach or not status["auto_send_enabled"]:
        return False
    if channel == "email":
        return bool(prospect.email and status["email_ready"] and status["compliance_ready"])
    return bool(
        prospect.phone
        and prospect.whatsapp_opt_in
        and status["whatsapp_ready"]
    )


async def _is_duplicate(db: AsyncSession, candidate: dict) -> bool:
    filters = [func.lower(RekhaProspect.business_name) == str(candidate["name"]).lower()]
    if candidate.get("id"):
        filters.append(RekhaProspect.external_id == candidate["id"])
    if candidate.get("email"):
        filters.append(func.lower(RekhaProspect.email) == str(candidate["email"]).lower())
    if candidate.get("phone"):
        filters.append(RekhaProspect.phone == candidate["phone"])
    return bool(await db.scalar(select(RekhaProspect.id).where(or_(*filters)).limit(1)))


def _candidate_channel(candidate: dict, requested: str) -> str | None:
    if requested == "email":
        return "email" if candidate.get("email") else None
    if requested == "whatsapp":
        return "whatsapp" if candidate.get("phone") else None
    if candidate.get("email"):
        return "email"
    return "whatsapp" if candidate.get("phone") else None


async def process_autonomous_rekha_cycle(
    db: AsyncSession,
    *,
    force: bool = False,
) -> dict:
    now = _now()
    settings = await db.get(RekhaCampaignSettings, "default")
    if not settings or not settings.is_active or not settings.autonomous_discovery:
        return {"checked_at": now.isoformat(), "processed": False, "reason": "autonomous_discovery_paused"}
    running_cycle = await db.scalar(
        select(RekhaAutomationRun.id).where(
            RekhaAutomationRun.status == "running",
            RekhaAutomationRun.started_at >= now - timedelta(minutes=30),
        ).limit(1)
    )
    if running_cycle:
        return {
            "checked_at": now.isoformat(),
            "processed": False,
            "reason": "cycle_already_running",
            "run_id": running_cycle,
        }
    if not _within_working_hours(settings, now):
        return {"checked_at": now.isoformat(), "processed": False, "reason": "outside_working_hours"}
    if not force and settings.next_discovery_at and settings.next_discovery_at > now:
        return {
            "checked_at": now.isoformat(),
            "processed": False,
            "reason": "not_due",
            "next_discovery_at": settings.next_discovery_at.isoformat(),
        }

    locations = _split_values(settings.discovery_locations, "Gurgaon, Haryana")
    industries = _split_values(settings.discovery_industries, "Local Businesses")
    completed_runs = int(await db.scalar(select(func.count(RekhaAutomationRun.id))) or 0)
    location = locations[completed_runs % len(locations)]
    industry = industries[(completed_runs // len(locations)) % len(industries)]
    run = RekhaAutomationRun(
        id=str(uuid.uuid4()),
        status="running",
        location=location,
        industry=industry,
        channel=settings.discovery_channel,
        started_at=now,
    )
    db.add(run)
    settings.last_discovery_at = now
    await db.flush()

    try:
        discovery = await discover_public_business_leads(
            industry=industry,
            location=location,
            radius_km=settings.discovery_radius_km,
            limit=settings.discovery_batch_size,
        )
        candidates = [
            item for item in discovery["candidates"]
            if int(item.get("score") or 0) >= settings.minimum_score
            and _candidate_channel(item, settings.discovery_channel)
        ]
        run.discovered_count = len(discovery["candidates"])
        run.qualified_count = len(candidates)
        status = integration_status()
        sent_today = await _sent_today(db, now)

        for candidate in candidates:
            if await _is_duplicate(db, candidate):
                run.duplicates_skipped += 1
                continue
            channel = _candidate_channel(candidate, settings.discovery_channel)
            if not channel:
                continue
            prospect = RekhaProspect(
                id=str(uuid.uuid4()),
                external_id=candidate.get("id"),
                business_name=candidate["name"],
                category=candidate.get("category"),
                location=discovery["resolved_location"],
                address=candidate.get("address"),
                phone=candidate.get("phone"),
                email=candidate.get("email"),
                website=candidate.get("website"),
                source=candidate.get("source") or "OpenStreetMap",
                source_url=candidate.get("source_url"),
                lead_score=int(candidate.get("score") or 0),
                preferred_channel=channel,
                market_region=infer_market_region(discovery["resolved_location"], candidate.get("phone")),
                status=RekhaProspectStatus.researched.value,
            )
            prospect.fit_score, prospect.fit_reason = calculate_fit(prospect)
            db.add(prospect)
            await db.flush()
            run.imported_count += 1

            copy = await draft_outreach(prospect, channel)
            message = RekhaOutreachMessage(
                id=str(uuid.uuid4()),
                prospect_id=prospect.id,
                channel=channel,
                direction="outbound",
                status=RekhaMessageStatus.draft.value,
                subject=copy.get("subject") or None,
                body=copy["body"],
                provider=copy.get("provider") or "rekha",
                message_kind="initial",
                auto_generated=True,
            )
            db.add(message)
            prospect.status = RekhaProspectStatus.drafted.value
            run.drafted_count += 1

            if sent_today >= status["daily_send_limit"]:
                continue
            if _initial_send_allowed(prospect, channel, settings, status):
                delivery = await _deliver(prospect, message, now)
                if delivery.get("sent"):
                    sent_today += 1
                    run.sent_count += 1
                else:
                    run.failed_count += 1

        settings.consecutive_failures = 0
        settings.next_discovery_at = now + timedelta(minutes=settings.discovery_interval_minutes)
        run.status = "completed"
    except Exception as exc:
        logger.exception("Rekha autonomous discovery cycle failed")
        settings.consecutive_failures += 1
        backoff = settings.discovery_interval_minutes * min(settings.consecutive_failures + 1, 4)
        settings.next_discovery_at = now + timedelta(minutes=backoff)
        run.status = "failed"
        run.error_message = str(exc)[:2000]
        run.failed_count += 1
    run.finished_at = _now()
    await db.commit()
    return {
        "checked_at": now.isoformat(),
        "processed": True,
        "run_id": run.id,
        "status": run.status,
        "industry": industry,
        "location": location,
        "discovered_count": run.discovered_count,
        "qualified_count": run.qualified_count,
        "imported_count": run.imported_count,
        "drafted_count": run.drafted_count,
        "sent_count": run.sent_count,
        "duplicates_skipped": run.duplicates_skipped,
        "failed_count": run.failed_count,
        "error_message": run.error_message,
        "next_discovery_at": settings.next_discovery_at.isoformat() if settings.next_discovery_at else None,
    }


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
    sent_today = await _sent_today(db, now)
    results: list[dict] = []
    for prospect in prospects:
        channel = prospect.preferred_channel or ("email" if prospect.email else "whatsapp")
        copy = draft_follow_up(prospect, max(1, prospect.follow_up_stage))
        message = RekhaOutreachMessage(
            id=str(uuid.uuid4()),
            prospect_id=prospect.id,
            channel=channel,
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
        channel_ready = (
            channel == "email" and status["email_ready"] and status["compliance_ready"]
        ) or (
            channel == "whatsapp" and status["whatsapp_ready"] and prospect.whatsapp_opt_in
        )
        if status["auto_send_enabled"] and channel_ready and sent_today < status["daily_send_limit"]:
            delivery = await _deliver(prospect, message, now)
            if delivery.get("sent"):
                prospect.follow_up_stage += 1
                _schedule_next_follow_up(prospect, now)
                sent_today += 1
                result["status"] = "sent"
            else:
                prospect.next_follow_up_at = now + timedelta(days=1)
                result["status"] = "failed"
        results.append(result)

    await db.commit()
    return {"checked_at": now.isoformat(), "processed_count": len(results), "results": results}


async def _rekha_automation_loop() -> None:
    interval = max(int(os.getenv("REKHA_WORKER_INTERVAL_SECONDS", "60") or "60"), 30)
    while True:
        try:
            async with AsyncSessionLocal() as db:
                inbox = await poll_rekha_email_replies(db)
                cycle = await process_autonomous_rekha_cycle(db)
                follow_ups = await process_due_rekha_follow_ups(
                    db, limit=int(os.getenv("REKHA_WORKER_BATCH_SIZE", "25") or "25")
                )
                if inbox.get("processed_count") or cycle.get("processed") or follow_ups.get("processed_count"):
                    logger.info("Rekha autonomous worker: inbox=%s cycle=%s follow_ups=%s", inbox, cycle, follow_ups)
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
