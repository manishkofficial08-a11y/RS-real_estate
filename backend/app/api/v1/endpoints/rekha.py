from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import get_current_admin
from app.database.session import get_db
from app.models.rekha_outreach import (
    RekhaAutomationRun,
    RekhaMessageStatus,
    RekhaOutreachMessage,
    RekhaCampaignSettings,
    RekhaProspect,
    RekhaProspectStatus,
)
from app.models.user import User
from app.services.free_lead_generation import (
    LeadSourceUnavailableError,
    LocationNotFoundError,
    discover_public_business_leads,
)
from app.services.rekha_agent import (
    calculate_fit,
    classify_reply,
    infer_market_region,
    draft_outreach,
    integration_status,
    send_outreach,
)
from app.services.rekha_automation import (
    process_autonomous_rekha_cycle,
    process_due_rekha_follow_ups,
)


router = APIRouter(prefix="/admin/rekha", tags=["Admin Rekha Outreach"])


class RekhaCandidate(BaseModel):
    id: str
    name: str
    category: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    score: int = Field(default=0, ge=0, le=100)
    source: str = "OpenStreetMap"
    source_url: Optional[str] = None
    location: Optional[str] = None


class RekhaImportRequest(BaseModel):
    candidates: List[RekhaCandidate] = Field(min_length=1, max_length=50)
    resolved_location: Optional[str] = None


class RekhaDraftRequest(BaseModel):
    channel: str = Field(default="email", pattern="^(email|whatsapp)$")


class RekhaSendRequest(BaseModel):
    subject: Optional[str] = None
    body: Optional[str] = None


class RekhaReplyRequest(BaseModel):
    channel: str = Field(default="email", pattern="^(email|whatsapp|call)$")
    body: str = Field(min_length=1, max_length=5000)
    demo_booked: bool = False


class RekhaWhatsAppSendRequest(BaseModel):
    body: str = Field(min_length=1, max_length=4096)


class RekhaRunRequest(BaseModel):
    industry: str = Field(min_length=2, max_length=80)
    location: str = Field(min_length=2, max_length=160)
    radius_km: int = Field(default=5, ge=1, le=25)
    limit: int = Field(default=20, ge=5, le=50)
    minimum_score: int = Field(default=70, ge=0, le=100)
    channel: str = Field(default="email", pattern="^(email|whatsapp)$")
    auto_send: bool = False


class RekhaCampaignUpdate(BaseModel):
    is_active: bool
    auto_follow_ups: bool = True
    auto_reply_safe: bool = False
    autonomous_discovery: bool = False
    auto_initial_outreach: bool = False
    discovery_locations: str = Field(default="Gurgaon, Haryana", min_length=2, max_length=1000)
    discovery_industries: str = Field(default="Local Businesses", min_length=2, max_length=1000)
    discovery_channel: str = Field(default="auto", pattern="^(auto|email|whatsapp)$")
    minimum_score: int = Field(default=60, ge=40, le=100)
    discovery_radius_km: int = Field(default=5, ge=1, le=25)
    discovery_batch_size: int = Field(default=10, ge=5, le=50)
    discovery_interval_minutes: int = Field(default=180, ge=30, le=1440)
    working_hours_start: int = Field(default=9, ge=0, le=23)
    working_hours_end: int = Field(default=18, ge=1, le=24)
    timezone_name: str = Field(default="Asia/Kolkata", min_length=3, max_length=80)


class RekhaProspectAutomationUpdate(BaseModel):
    paused: bool


class RekhaFounderResolution(BaseModel):
    answer: str = Field(min_length=2, max_length=5000)
    send_now: bool = False


def _message_payload(message: RekhaOutreachMessage) -> dict[str, Any]:
    return {
        "id": message.id,
        "prospect_id": message.prospect_id,
        "channel": message.channel,
        "direction": message.direction,
        "status": message.status,
        "subject": message.subject,
        "body": message.body,
        "provider": message.provider,
        "provider_message_id": message.provider_message_id,
        "error_message": message.error_message,
        "message_kind": message.message_kind,
        "scheduled_at": message.scheduled_at.isoformat() if message.scheduled_at else None,
        "auto_generated": message.auto_generated,
        "sent_at": message.sent_at.isoformat() if message.sent_at else None,
        "delivered_at": message.delivered_at.isoformat() if message.delivered_at else None,
        "read_at": message.read_at.isoformat() if message.read_at else None,
        "created_at": message.created_at.isoformat() if message.created_at else None,
    }


def _prospect_payload(prospect: RekhaProspect) -> dict[str, Any]:
    return {
        "id": prospect.id,
        "external_id": prospect.external_id,
        "business_name": prospect.business_name,
        "category": prospect.category,
        "location": prospect.location,
        "address": prospect.address,
        "phone": prospect.phone,
        "email": prospect.email,
        "website": prospect.website,
        "source": prospect.source,
        "source_url": prospect.source_url,
        "lead_score": prospect.lead_score,
        "fit_score": prospect.fit_score,
        "fit_reason": prospect.fit_reason,
        "status": prospect.status,
        "preferred_channel": prospect.preferred_channel,
        "market_region": prospect.market_region,
        "language_preference": prospect.language_preference,
        "opted_out": prospect.opted_out,
        "whatsapp_opt_in": prospect.whatsapp_opt_in,
        "whatsapp_opted_in_at": prospect.whatsapp_opted_in_at.isoformat() if prospect.whatsapp_opted_in_at else None,
        "automation_paused": prospect.automation_paused,
        "requires_founder": prospect.requires_founder,
        "founder_note": prospect.founder_note,
        "last_intent": prospect.last_intent,
        "follow_up_stage": prospect.follow_up_stage,
        "last_contacted_at": prospect.last_contacted_at.isoformat() if prospect.last_contacted_at else None,
        "next_follow_up_at": prospect.next_follow_up_at.isoformat() if prospect.next_follow_up_at else None,
        "replied_at": prospect.replied_at.isoformat() if prospect.replied_at else None,
        "demo_booked_at": prospect.demo_booked_at.isoformat() if prospect.demo_booked_at else None,
        "created_at": prospect.created_at.isoformat() if prospect.created_at else None,
        "messages": [_message_payload(message) for message in (prospect.messages or [])],
    }


async def _get_prospect(db: AsyncSession, prospect_id: str) -> RekhaProspect:
    result = await db.execute(
        select(RekhaProspect)
        .options(selectinload(RekhaProspect.messages))
        .where(RekhaProspect.id == prospect_id)
    )
    prospect = result.scalar_one_or_none()
    if not prospect:
        raise HTTPException(status_code=404, detail="Rekha prospect not found")
    return prospect


async def _import_candidates(
    db: AsyncSession,
    candidates: List[RekhaCandidate],
    resolved_location: Optional[str],
) -> tuple[list[RekhaProspect], int]:
    imported: list[RekhaProspect] = []
    skipped = 0
    for candidate in candidates:
        duplicate_filters = []
        if candidate.id:
            duplicate_filters.append(RekhaProspect.external_id == candidate.id)
        if candidate.email:
            duplicate_filters.append(func.lower(RekhaProspect.email) == candidate.email.lower())
        if candidate.phone:
            duplicate_filters.append(RekhaProspect.phone == candidate.phone)
        duplicate_filters.append(func.lower(RekhaProspect.business_name) == candidate.name.lower())
        duplicate = await db.execute(select(RekhaProspect.id).where(or_(*duplicate_filters)))
        if duplicate.scalars().first():
            skipped += 1
            continue

        prospect = RekhaProspect(
            id=str(uuid.uuid4()),
            external_id=candidate.id,
            business_name=candidate.name,
            category=candidate.category,
            location=candidate.location or resolved_location,
            address=candidate.address,
            phone=candidate.phone,
            email=candidate.email,
            website=candidate.website,
            source=candidate.source,
            source_url=candidate.source_url,
            lead_score=candidate.score,
            preferred_channel="email" if candidate.email else ("whatsapp" if candidate.phone else None),
            market_region=infer_market_region(candidate.location or resolved_location, candidate.phone),
        )
        prospect.fit_score, prospect.fit_reason = calculate_fit(prospect)
        prospect.status = RekhaProspectStatus.researched.value
        db.add(prospect)
        imported.append(prospect)
    await db.flush()
    return imported, skipped


async def _draft_message(
    db: AsyncSession,
    prospect: RekhaProspect,
    channel: str,
    current_user: User,
) -> RekhaOutreachMessage:
    if prospect.opted_out:
        raise HTTPException(status_code=400, detail="Prospect has opted out")
    if channel == "email" and not prospect.email:
        raise HTTPException(status_code=400, detail="Prospect does not have a public email")
    if channel == "whatsapp" and not prospect.phone:
        raise HTTPException(status_code=400, detail="Prospect does not have a public phone")

    copy = await draft_outreach(prospect, channel)
    message = RekhaOutreachMessage(
        id=str(uuid.uuid4()),
        prospect_id=prospect.id,
        channel=channel,
        direction="outbound",
        status=RekhaMessageStatus.draft.value,
        subject=copy.get("subject") or None,
        body=copy["body"],
        provider=copy.get("provider"),
        created_by=current_user.id,
        message_kind="initial",
    )
    db.add(message)
    prospect.status = RekhaProspectStatus.drafted.value
    prospect.preferred_channel = channel
    await db.flush()
    return message


async def _sent_today(db: AsyncSession) -> int:
    now = datetime.now(timezone.utc)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    result = await db.execute(
        select(func.count(RekhaOutreachMessage.id)).where(
            RekhaOutreachMessage.status == RekhaMessageStatus.sent.value,
            RekhaOutreachMessage.sent_at >= start,
        )
    )
    return int(result.scalar() or 0)


async def _campaign_settings(db: AsyncSession) -> RekhaCampaignSettings:
    settings = await db.get(RekhaCampaignSettings, "default")
    if settings is None:
        settings = RekhaCampaignSettings(id="default")
        db.add(settings)
        await db.flush()
    return settings


def _campaign_payload(settings: RekhaCampaignSettings) -> dict[str, Any]:
    return {
        "is_active": settings.is_active,
        "auto_follow_ups": settings.auto_follow_ups,
        "auto_reply_safe": settings.auto_reply_safe,
        "autonomous_discovery": settings.autonomous_discovery,
        "auto_initial_outreach": settings.auto_initial_outreach,
        "discovery_locations": settings.discovery_locations,
        "discovery_industries": settings.discovery_industries,
        "discovery_channel": settings.discovery_channel,
        "minimum_score": settings.minimum_score,
        "discovery_radius_km": settings.discovery_radius_km,
        "discovery_batch_size": settings.discovery_batch_size,
        "discovery_interval_minutes": settings.discovery_interval_minutes,
        "last_discovery_at": settings.last_discovery_at.isoformat() if settings.last_discovery_at else None,
        "next_discovery_at": settings.next_discovery_at.isoformat() if settings.next_discovery_at else None,
        "consecutive_failures": settings.consecutive_failures,
        "working_hours_start": settings.working_hours_start,
        "working_hours_end": settings.working_hours_end,
        "timezone_name": settings.timezone_name,
    }


def _within_whatsapp_customer_window(prospect: RekhaProspect, now: datetime) -> bool:
    return bool(
        prospect.replied_at
        and prospect.replied_at >= now - timedelta(hours=24)
    )


async def _send_message(
    db: AsyncSession,
    message: RekhaOutreachMessage,
    prospect: RekhaProspect,
) -> dict[str, Any]:
    status_info = integration_status()
    if await _sent_today(db) >= status_info["daily_send_limit"]:
        raise HTTPException(status_code=429, detail="Rekha daily send limit reached")
    recipient = prospect.email if message.channel == "email" else prospect.phone
    if not recipient:
        raise HTTPException(status_code=400, detail=f"Prospect has no {message.channel} destination")
    if message.channel == "whatsapp" and not prospect.whatsapp_opt_in:
        raise HTTPException(
            status_code=400,
            detail="WhatsApp outreach requires recorded opt-in or an inbound conversation",
        )
    now = datetime.now(timezone.utc)
    result = await send_outreach(
        message.channel,
        recipient,
        message.subject or "",
        message.body,
        message_kind=message.message_kind,
        within_customer_window=_within_whatsapp_customer_window(prospect, now),
    )
    message.approved_at = now
    if result.get("sent"):
        message.status = RekhaMessageStatus.sent.value
        message.sent_at = now
        message.provider = result.get("provider") or message.provider
        message.provider_message_id = result.get("provider_message_id")
        message.error_message = None
        if message.message_kind in {"initial", "follow_up"}:
            prospect.status = RekhaProspectStatus.contacted.value
        prospect.last_contacted_at = message.sent_at
        if message.message_kind in {"initial", "follow_up"}:
            if message.message_kind == "follow_up":
                prospect.follow_up_stage += 1
            else:
                prospect.follow_up_stage = max(prospect.follow_up_stage, 1)
            follow_up_delays = {1: 3, 2: 4, 3: 5}
            delay = follow_up_delays.get(prospect.follow_up_stage)
            prospect.next_follow_up_at = message.sent_at + timedelta(days=delay) if delay else None
    else:
        message.status = RekhaMessageStatus.failed.value
        message.error_message = result.get("message") or "Message was not sent"
    await db.flush()
    return result


@router.get("/overview")
async def get_rekha_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    del current_user
    status_rows = await db.execute(
        select(RekhaProspect.status, func.count(RekhaProspect.id)).group_by(RekhaProspect.status)
    )
    counts = {row[0]: int(row[1]) for row in status_rows.all()}
    settings = await _campaign_settings(db)
    escalation_count = await db.scalar(
        select(func.count(RekhaProspect.id)).where(RekhaProspect.requires_founder == True)
    )
    run_rows = await db.execute(
        select(RekhaAutomationRun).order_by(desc(RekhaAutomationRun.started_at)).limit(12)
    )
    automation_runs = [
        {
            "id": item.id,
            "status": item.status,
            "industry": item.industry,
            "location": item.location,
            "channel": item.channel,
            "discovered_count": item.discovered_count,
            "qualified_count": item.qualified_count,
            "imported_count": item.imported_count,
            "drafted_count": item.drafted_count,
            "sent_count": item.sent_count,
            "duplicates_skipped": item.duplicates_skipped,
            "failed_count": item.failed_count,
            "error_message": item.error_message,
            "started_at": item.started_at.isoformat() if item.started_at else None,
            "finished_at": item.finished_at.isoformat() if item.finished_at else None,
        }
        for item in run_rows.scalars().all()
    ]
    return {
        "agent": integration_status(),
        "pipeline": counts,
        "total_prospects": sum(counts.values()),
        "sent_today": await _sent_today(db),
        "campaign": _campaign_payload(settings),
        "escalation_count": int(escalation_count or 0),
        "automation_runs": automation_runs,
    }


@router.get("/prospects")
async def list_rekha_prospects(
    prospect_status: Optional[str] = None,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    del current_user
    query = (
        select(RekhaProspect)
        .options(selectinload(RekhaProspect.messages))
        .order_by(desc(RekhaProspect.created_at))
        .limit(min(max(limit, 1), 250))
    )
    if prospect_status:
        query = query.where(RekhaProspect.status == prospect_status)
    result = await db.execute(query)
    return [_prospect_payload(item) for item in result.scalars().unique().all()]


@router.put("/campaign")
async def update_rekha_campaign(
    data: RekhaCampaignUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    del current_user
    if data.working_hours_start >= data.working_hours_end:
        raise HTTPException(status_code=400, detail="Campaign end hour must be after start hour")
    settings = await _campaign_settings(db)
    for key, value in data.model_dump().items():
        setattr(settings, key, value)
    await db.commit()
    return _campaign_payload(settings)


@router.patch("/prospects/{prospect_id}/automation")
async def update_prospect_automation(
    prospect_id: str,
    data: RekhaProspectAutomationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    del current_user
    prospect = await _get_prospect(db, prospect_id)
    prospect.automation_paused = data.paused
    await db.commit()
    return _prospect_payload(prospect)


@router.post("/prospects/{prospect_id}/resolve")
async def resolve_founder_question(
    prospect_id: str,
    data: RekhaFounderResolution,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    prospect = await _get_prospect(db, prospect_id)
    if not prospect.requires_founder:
        raise HTTPException(status_code=409, detail="This prospect has no unresolved founder question")
    channel = prospect.preferred_channel or ("email" if prospect.email else "whatsapp")
    message = RekhaOutreachMessage(
        id=str(uuid.uuid4()),
        prospect_id=prospect.id,
        channel=channel,
        direction="outbound",
        status=RekhaMessageStatus.draft.value,
        subject=f"Re: your question for {prospect.business_name}" if channel == "email" else None,
        body=data.answer.strip(),
        provider="founder_verified",
        created_by=current_user.id,
        message_kind="founder_answer",
    )
    db.add(message)
    prospect.requires_founder = False
    prospect.founder_note = None
    prospect.automation_paused = False
    prospect.status = RekhaProspectStatus.replied.value
    if data.send_now:
        if not integration_status()["auto_send_enabled"]:
            raise HTTPException(status_code=400, detail="Production auto-send switch is disabled")
        await _send_message(db, message, prospect)
    await db.commit()
    return {"prospect": _prospect_payload(prospect), "message": _message_payload(message)}


@router.post("/prospects/import", status_code=status.HTTP_201_CREATED)
async def import_rekha_prospects(
    data: RekhaImportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    del current_user
    imported, skipped = await _import_candidates(db, data.candidates, data.resolved_location)
    await db.commit()
    return {
        "imported_count": len(imported),
        "skipped_count": skipped,
        "prospect_ids": [item.id for item in imported],
        "message": f"Rekha added {len(imported)} prospects and skipped {skipped} duplicates.",
    }


@router.post("/prospects/{prospect_id}/draft", status_code=status.HTTP_201_CREATED)
async def create_rekha_draft(
    prospect_id: str,
    data: RekhaDraftRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    prospect = await _get_prospect(db, prospect_id)
    message = await _draft_message(db, prospect, data.channel, current_user)
    await db.commit()
    await db.refresh(message)
    return _message_payload(message)


@router.post("/messages/{message_id}/send")
async def send_rekha_message(
    message_id: str,
    data: RekhaSendRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    del current_user
    result = await db.execute(
        select(RekhaOutreachMessage)
        .options(selectinload(RekhaOutreachMessage.prospect))
        .where(RekhaOutreachMessage.id == message_id)
    )
    message = result.scalar_one_or_none()
    if not message:
        raise HTTPException(status_code=404, detail="Rekha message not found")
    if message.prospect.opted_out:
        raise HTTPException(status_code=400, detail="Prospect has opted out")
    if message.status == RekhaMessageStatus.sent.value:
        raise HTTPException(status_code=409, detail="Message has already been sent")
    if data.subject is not None:
        message.subject = data.subject.strip() or None
    if data.body is not None:
        message.body = data.body.strip()
    if not message.body:
        raise HTTPException(status_code=400, detail="Message body is empty")
    send_result = await _send_message(db, message, message.prospect)
    await db.commit()
    await db.refresh(message)
    return {"message": _message_payload(message), "delivery": send_result}


@router.post("/prospects/{prospect_id}/whatsapp/send")
async def send_rekha_whatsapp_message(
    prospect_id: str,
    data: RekhaWhatsAppSendRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    prospect = await _get_prospect(db, prospect_id)
    if not prospect.phone:
        raise HTTPException(status_code=400, detail="Prospect has no WhatsApp number")
    if prospect.opted_out:
        raise HTTPException(status_code=400, detail="Prospect has opted out")
    now = datetime.now(timezone.utc)
    message = RekhaOutreachMessage(
        id=str(uuid.uuid4()),
        prospect_id=prospect.id,
        channel="whatsapp",
        direction="outbound",
        status=RekhaMessageStatus.draft.value,
        body=data.body.strip(),
        provider="founder_whatsapp_inbox",
        created_by=current_user.id,
        message_kind="reply" if _within_whatsapp_customer_window(prospect, now) else "initial",
        auto_generated=False,
    )
    db.add(message)
    await db.flush()
    delivery = await _send_message(db, message, prospect)
    await db.commit()
    await db.refresh(message)
    return {"message": _message_payload(message), "delivery": delivery}


@router.post("/prospects/{prospect_id}/reply")
async def record_rekha_reply(
    prospect_id: str,
    data: RekhaReplyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    prospect = await _get_prospect(db, prospect_id)
    classification = await classify_reply(data.body)
    inbound = RekhaOutreachMessage(
        id=str(uuid.uuid4()),
        prospect_id=prospect.id,
        channel=data.channel,
        direction="inbound",
        status=RekhaMessageStatus.received.value,
        body=data.body.strip(),
        provider="manual_or_webhook",
        created_by=current_user.id,
        message_kind="inbound",
    )
    db.add(inbound)
    prospect.replied_at = datetime.now(timezone.utc)
    if data.channel == "whatsapp":
        prospect.whatsapp_opt_in = True
        prospect.whatsapp_opted_in_at = prospect.replied_at
    prospect.next_follow_up_at = None
    intent = classification["intent"]
    prospect.status = intent
    prospect.last_intent = intent
    prospect.language_preference = classification.get("language") or prospect.language_preference
    prospect.requires_founder = bool(classification.get("requires_founder"))
    prospect.founder_note = classification.get("reason") if prospect.requires_founder else None
    if intent == "opted_out":
        prospect.opted_out = True
    prospect.automation_paused = prospect.requires_founder or prospect.opted_out
    if data.demo_booked:
        prospect.status = RekhaProspectStatus.demo_booked.value
        prospect.demo_booked_at = datetime.now(timezone.utc)
    suggested = RekhaOutreachMessage(
        id=str(uuid.uuid4()),
        prospect_id=prospect.id,
        channel=data.channel if data.channel != "call" else "whatsapp",
        direction="outbound",
        status=RekhaMessageStatus.draft.value,
        body=classification["suggested_reply"],
        provider="rekha_reply_classifier",
        created_by=current_user.id,
        message_kind="hold" if prospect.requires_founder else "reply",
        auto_generated=True,
    )
    db.add(suggested)
    settings = await _campaign_settings(db)
    auto_replied = False
    if (
        settings.is_active
        and settings.auto_reply_safe
        and integration_status()["auto_send_enabled"]
        and not prospect.opted_out
        and ((suggested.channel == "email" and prospect.email) or (suggested.channel == "whatsapp" and prospect.phone))
    ):
        delivery = await _send_message(db, suggested, prospect)
        auto_replied = bool(delivery.get("sent"))
    await db.commit()
    return {
        "intent": prospect.status,
        "suggested_reply": _message_payload(suggested),
        "founder_handoff": prospect.status in {"interested", "demo_booked"},
        "requires_founder": prospect.requires_founder,
        "confidence": classification.get("confidence"),
        "reason": classification.get("reason"),
        "auto_replied": auto_replied,
    }


@router.post("/process-due")
async def process_due_rekha_messages(
    limit: int = 25,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    del current_user
    return await process_due_rekha_follow_ups(db, limit=limit)


@router.post("/process-cycle")
async def process_rekha_cycle_now(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    del current_user
    return await process_autonomous_rekha_cycle(db, force=True)


@router.post("/run")
async def run_rekha(
    data: RekhaRunRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    try:
        discovery = await discover_public_business_leads(
            industry=data.industry.strip(),
            location=data.location.strip(),
            radius_km=data.radius_km,
            limit=data.limit,
        )
    except LocationNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except LeadSourceUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    candidates = [
        RekhaCandidate(**candidate, location=discovery["resolved_location"])
        for candidate in discovery["candidates"]
        if int(candidate.get("score") or 0) >= data.minimum_score
        and (candidate.get("email") if data.channel == "email" else candidate.get("phone"))
    ]
    imported, skipped = await _import_candidates(db, candidates, discovery["resolved_location"])
    drafted: list[RekhaOutreachMessage] = []
    sent = 0
    send_errors: list[str] = []
    auto_allowed = data.auto_send and integration_status()["auto_send_enabled"]
    for prospect in imported:
        message = await _draft_message(db, prospect, data.channel, current_user)
        drafted.append(message)
        if auto_allowed:
            delivery = await _send_message(db, message, prospect)
            if delivery.get("sent"):
                sent += 1
            else:
                send_errors.append(f"{prospect.business_name}: {delivery.get('message')}")
    await db.commit()
    return {
        "agent": "Rekha",
        "discovered_count": len(discovery["candidates"]),
        "qualified_count": len(candidates),
        "imported_count": len(imported),
        "duplicates_skipped": skipped,
        "drafted_count": len(drafted),
        "sent_count": sent,
        "auto_send_requested": data.auto_send,
        "auto_send_enabled": integration_status()["auto_send_enabled"],
        "send_errors": send_errors,
        "message": (
            f"Rekha prepared {len(drafted)} personalized outreach drafts"
            + (f" and sent {sent}." if auto_allowed else ". Review them before sending.")
        ),
    }
