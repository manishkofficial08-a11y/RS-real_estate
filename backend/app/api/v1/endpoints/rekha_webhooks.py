from __future__ import annotations

import hashlib
import hmac
import os
import re
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.models.rekha_outreach import (
    RekhaMessageStatus,
    RekhaOutreachMessage,
    RekhaProspect,
    RekhaProspectStatus,
)
from app.services.rekha_agent import classify_reply


router = APIRouter(prefix="/webhooks/rekha", tags=["Rekha Webhooks"])


class RekhaInboundPayload(BaseModel):
    channel: str = Field(pattern="^(email|whatsapp)$")
    sender: str = Field(min_length=3, max_length=320)
    body: str = Field(min_length=1, max_length=10000)
    provider_message_id: str | None = Field(default=None, max_length=500)


def _digits(value: str | None) -> str:
    return re.sub(r"\D", "", value or "")


async def _find_prospect(db: AsyncSession, channel: str, sender: str) -> RekhaProspect | None:
    if channel == "email":
        result = await db.execute(
            select(RekhaProspect).where(func.lower(RekhaProspect.email) == sender.strip().lower())
        )
        return result.scalar_one_or_none()
    sender_digits = _digits(sender)
    if len(sender_digits) < 7:
        return None
    result = await db.execute(select(RekhaProspect).where(RekhaProspect.phone.is_not(None)).limit(2000))
    for prospect in result.scalars().all():
        prospect_digits = _digits(prospect.phone)
        if prospect_digits and (
            prospect_digits == sender_digits
            or prospect_digits.endswith(sender_digits[-10:])
            or sender_digits.endswith(prospect_digits[-10:])
        ):
            return prospect
    return None


async def _ingest(
    db: AsyncSession,
    channel: str,
    sender: str,
    body: str,
    provider_message_id: str | None,
) -> dict:
    if provider_message_id:
        duplicate = await db.scalar(
            select(RekhaOutreachMessage.id).where(
                RekhaOutreachMessage.provider_message_id == provider_message_id
            )
        )
        if duplicate:
            return {"accepted": True, "duplicate": True}

    prospect = await _find_prospect(db, channel, sender)
    if not prospect:
        return {"accepted": True, "matched": False}

    classification = await classify_reply(body)
    now = datetime.now(timezone.utc)
    inbound = RekhaOutreachMessage(
        id=str(uuid.uuid4()),
        prospect_id=prospect.id,
        channel=channel,
        direction="inbound",
        status=RekhaMessageStatus.received.value,
        body=body.strip(),
        provider="inbound_webhook",
        provider_message_id=provider_message_id,
        message_kind="inbound",
        auto_generated=False,
    )
    suggested = RekhaOutreachMessage(
        id=str(uuid.uuid4()),
        prospect_id=prospect.id,
        channel=channel,
        direction="outbound",
        status=RekhaMessageStatus.draft.value,
        subject=f"Re: {prospect.business_name}" if channel == "email" else None,
        body=classification["suggested_reply"],
        provider="rekha_reply_classifier",
        message_kind="hold" if classification.get("requires_founder") else "reply",
        auto_generated=True,
    )
    db.add_all([inbound, suggested])
    prospect.replied_at = now
    prospect.next_follow_up_at = None
    prospect.last_intent = classification["intent"]
    prospect.status = classification["intent"]
    prospect.language_preference = classification.get("language") or prospect.language_preference
    prospect.requires_founder = bool(classification.get("requires_founder"))
    prospect.founder_note = classification.get("reason") if prospect.requires_founder else None
    if classification["intent"] == "opted_out":
        prospect.opted_out = True
    prospect.automation_paused = prospect.requires_founder or prospect.opted_out
    await db.commit()
    return {
        "accepted": True,
        "matched": True,
        "prospect_id": prospect.id,
        "intent": classification["intent"],
        "requires_founder": prospect.requires_founder,
    }


@router.post("/inbound")
async def receive_provider_neutral_reply(
    data: RekhaInboundPayload,
    x_rekha_webhook_secret: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    expected = os.getenv("REKHA_INBOUND_WEBHOOK_SECRET", "").strip()
    if not expected:
        raise HTTPException(status_code=503, detail="Inbound webhook is not configured")
    if not x_rekha_webhook_secret or not hmac.compare_digest(x_rekha_webhook_secret, expected):
        raise HTTPException(status_code=401, detail="Invalid webhook secret")
    return await _ingest(db, data.channel, data.sender, data.body, data.provider_message_id)


@router.get("/whatsapp")
async def verify_whatsapp_webhook(
    mode: str = Query(alias="hub.mode"),
    token: str = Query(alias="hub.verify_token"),
    challenge: str = Query(alias="hub.challenge"),
):
    expected = os.getenv("REKHA_WHATSAPP_VERIFY_TOKEN", "").strip()
    if mode != "subscribe" or not expected or not hmac.compare_digest(token, expected):
        raise HTTPException(status_code=403, detail="WhatsApp webhook verification failed")
    return PlainTextResponse(challenge)


@router.post("/whatsapp")
async def receive_whatsapp_reply(
    request: Request,
    x_hub_signature_256: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    raw = await request.body()
    app_secret = os.getenv("REKHA_WHATSAPP_APP_SECRET", "").strip()
    if not app_secret:
        raise HTTPException(status_code=503, detail="WhatsApp webhook app secret is not configured")
    expected = "sha256=" + hmac.new(app_secret.encode(), raw, hashlib.sha256).hexdigest()
    if not x_hub_signature_256 or not hmac.compare_digest(x_hub_signature_256, expected):
        raise HTTPException(status_code=401, detail="Invalid WhatsApp webhook signature")
    payload = await request.json()
    accepted = []
    for entry in payload.get("entry", []):
        for change in entry.get("changes", []):
            for message in (change.get("value", {}) or {}).get("messages", []):
                body = ((message.get("text") or {}).get("body") or "").strip()
                sender = str(message.get("from") or "")
                if body and sender:
                    accepted.append(await _ingest(db, "whatsapp", sender, body, message.get("id")))
    return {"accepted": True, "messages": accepted}
