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
    RekhaMessageStatus,
    RekhaOutreachMessage,
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
    draft_outreach,
    integration_status,
    send_outreach,
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


class RekhaRunRequest(BaseModel):
    industry: str = Field(min_length=2, max_length=80)
    location: str = Field(min_length=2, max_length=160)
    radius_km: int = Field(default=5, ge=1, le=25)
    limit: int = Field(default=20, ge=5, le=50)
    minimum_score: int = Field(default=70, ge=0, le=100)
    channel: str = Field(default="email", pattern="^(email|whatsapp)$")
    auto_send: bool = False


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
        "sent_at": message.sent_at.isoformat() if message.sent_at else None,
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
        "opted_out": prospect.opted_out,
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
    result = await send_outreach(message.channel, recipient, message.subject or "", message.body)
    message.approved_at = datetime.now(timezone.utc)
    if result.get("sent"):
        message.status = RekhaMessageStatus.sent.value
        message.sent_at = datetime.now(timezone.utc)
        message.provider = result.get("provider") or message.provider
        message.provider_message_id = result.get("provider_message_id")
        message.error_message = None
        prospect.status = RekhaProspectStatus.contacted.value
        prospect.last_contacted_at = message.sent_at
        prospect.next_follow_up_at = message.sent_at + timedelta(days=4)
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
    return {
        "agent": integration_status(),
        "pipeline": counts,
        "total_prospects": sum(counts.values()),
        "sent_today": await _sent_today(db),
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
    )
    db.add(inbound)
    prospect.replied_at = datetime.now(timezone.utc)
    prospect.next_follow_up_at = None
    intent = classification["intent"]
    prospect.status = intent
    if intent == "opted_out":
        prospect.opted_out = True
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
    )
    db.add(suggested)
    await db.commit()
    return {
        "intent": prospect.status,
        "suggested_reply": _message_payload(suggested),
        "founder_handoff": prospect.status in {"interested", "demo_booked"},
    }


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
