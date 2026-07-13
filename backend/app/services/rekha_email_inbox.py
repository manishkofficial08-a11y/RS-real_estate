from __future__ import annotations

import asyncio
import email
import imaplib
import os
import uuid
import base64
from datetime import datetime, timezone
from email.header import decode_header
from email.utils import parseaddr

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rekha_outreach import (
    RekhaCampaignSettings,
    RekhaMessageStatus,
    RekhaOutreachMessage,
    RekhaProspect,
)
from app.services.rekha_agent import classify_reply, integration_status, send_outreach
from app.services.gmail_api import (
    fetch_unread_raw_messages,
    gmail_api_configured,
    mark_gmail_message_read,
)


def _env(key: str, default: str = "") -> str:
    return os.getenv(key, default).strip()


def _decode(value: str | None) -> str:
    parts: list[str] = []
    for item, charset in decode_header(value or ""):
        if isinstance(item, bytes):
            parts.append(item.decode(charset or "utf-8", errors="replace"))
        else:
            parts.append(item)
    return "".join(parts)


def _plain_body(message: email.message.Message) -> str:
    if message.is_multipart():
        for part in message.walk():
            if part.get_content_type() == "text/plain" and "attachment" not in str(part.get("Content-Disposition") or ""):
                payload = part.get_payload(decode=True) or b""
                return payload.decode(part.get_content_charset() or "utf-8", errors="replace").strip()
        return ""
    payload = message.get_payload(decode=True) or b""
    return payload.decode(message.get_content_charset() or "utf-8", errors="replace").strip()


def _fetch_unread() -> list[dict[str, str]]:
    host = _env("REKHA_IMAP_HOST", "imap.gmail.com")
    port = int(_env("REKHA_IMAP_PORT", "993") or "993")
    username = _env("REKHA_IMAP_USERNAME", _env("SMTP_USERNAME"))
    password = _env("REKHA_IMAP_PASSWORD", _env("SMTP_PASSWORD"))
    if not username or not password:
        return []
    inbox: list[dict[str, str]] = []
    with imaplib.IMAP4_SSL(host, port) as client:
        client.login(username, password)
        client.select("INBOX")
        status, data = client.uid("search", None, "UNSEEN")
        if status != "OK" or not data:
            return []
        for uid in data[0].split()[-50:]:
            fetch_status, payload = client.uid("fetch", uid, "(BODY.PEEK[])")
            if fetch_status != "OK" or not payload or not isinstance(payload[0], tuple):
                continue
            message = email.message_from_bytes(payload[0][1])
            inbox.append({
                "uid": uid.decode(),
                "sender": parseaddr(_decode(message.get("From")))[1].lower(),
                "message_id": str(message.get("Message-ID") or f"imap-{uid.decode()}").strip(),
                "subject": _decode(message.get("Subject")),
                "body": _plain_body(message),
            })
    return inbox


async def _fetch_unread_gmail_api() -> list[dict[str, str]]:
    inbox: list[dict[str, str]] = []
    for item in await fetch_unread_raw_messages(limit=50):
        raw = item["raw"]
        decoded = base64.urlsafe_b64decode(raw + "=" * (-len(raw) % 4))
        message = email.message_from_bytes(decoded)
        inbox.append({
            "uid": item["id"],
            "sender": parseaddr(_decode(message.get("From")))[1].lower(),
            "message_id": str(message.get("Message-ID") or f"gmail-{item['id']}").strip(),
            "subject": _decode(message.get("Subject")),
            "body": _plain_body(message),
        })
    return inbox


def _mark_seen(uids: list[str]) -> None:
    if not uids:
        return
    host = _env("REKHA_IMAP_HOST", "imap.gmail.com")
    port = int(_env("REKHA_IMAP_PORT", "993") or "993")
    username = _env("REKHA_IMAP_USERNAME", _env("SMTP_USERNAME"))
    password = _env("REKHA_IMAP_PASSWORD", _env("SMTP_PASSWORD"))
    with imaplib.IMAP4_SSL(host, port) as client:
        client.login(username, password)
        client.select("INBOX")
        for uid in uids:
            client.uid("store", uid, "+FLAGS", "(\\Seen)")


async def poll_rekha_email_replies(db: AsyncSession) -> dict:
    use_gmail_api = gmail_api_configured()
    if not use_gmail_api and _env("REKHA_IMAP_ENABLED", "false").lower() not in {"1", "true", "yes"}:
        return {"processed_count": 0, "reason": "email_inbound_disabled"}
    messages = await _fetch_unread_gmail_api() if use_gmail_api else await asyncio.to_thread(_fetch_unread)
    campaign = await db.get(RekhaCampaignSettings, "default")
    status_info = integration_status()
    now = datetime.now(timezone.utc)
    sent_today = int(
        await db.scalar(
            select(func.count(RekhaOutreachMessage.id)).where(
                RekhaOutreachMessage.status == RekhaMessageStatus.sent.value,
                RekhaOutreachMessage.sent_at >= now.replace(hour=0, minute=0, second=0, microsecond=0),
            )
        )
        or 0
    )
    matched_uids: list[str] = []
    results: list[dict] = []
    for item in messages:
        if not item["sender"] or not item["body"]:
            continue
        prospect = await db.scalar(
            select(RekhaProspect).where(func.lower(RekhaProspect.email) == item["sender"])
        )
        if not prospect:
            continue
        duplicate = await db.scalar(
            select(RekhaOutreachMessage.id).where(
                RekhaOutreachMessage.provider_message_id == item["message_id"]
            )
        )
        if duplicate:
            matched_uids.append(item["uid"])
            continue
        classification = await classify_reply(item["body"])
        now = datetime.now(timezone.utc)
        inbound = RekhaOutreachMessage(
            id=str(uuid.uuid4()), prospect_id=prospect.id, channel="email",
            direction="inbound", status=RekhaMessageStatus.received.value,
            subject=item["subject"], body=item["body"], provider="imap",
            provider_message_id=item["message_id"], message_kind="inbound",
        )
        suggested = RekhaOutreachMessage(
            id=str(uuid.uuid4()), prospect_id=prospect.id, channel="email",
            direction="outbound", status=RekhaMessageStatus.draft.value,
            subject=f"Re: {item['subject'] or prospect.business_name}",
            body=classification["suggested_reply"], provider="rekha_reply_classifier",
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
        auto_replied = False
        if (
            campaign and campaign.is_active and campaign.auto_reply_safe
            and status_info["auto_send_enabled"] and status_info["email_ready"]
            and status_info["compliance_ready"] and sent_today < status_info["daily_send_limit"]
            and not prospect.opted_out and not prospect.requires_founder
        ):
            delivery = await send_outreach("email", prospect.email or "", suggested.subject or "", suggested.body)
            suggested.approved_at = now
            if delivery.get("sent"):
                suggested.status = RekhaMessageStatus.sent.value
                suggested.sent_at = now
                suggested.provider = delivery.get("provider") or suggested.provider
                suggested.provider_message_id = delivery.get("provider_message_id")
                auto_replied = True
                sent_today += 1
            else:
                suggested.status = RekhaMessageStatus.failed.value
                suggested.error_message = delivery.get("message") or "Automatic email reply failed"
        matched_uids.append(item["uid"])
        results.append({"prospect_id": prospect.id, "intent": classification["intent"], "auto_replied": auto_replied})
    await db.commit()
    try:
        if use_gmail_api:
            for message_id in matched_uids:
                await mark_gmail_message_read(message_id)
        else:
            await asyncio.to_thread(_mark_seen, matched_uids)
    except Exception:
        # Database deduplication prevents a duplicate reply if IMAP flagging
        # temporarily fails; the next poll can safely retry marking it read.
        pass
    return {"processed_count": len(results), "results": results}
