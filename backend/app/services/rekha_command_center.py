from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from typing import Any

import httpx
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_job import AIJob
from app.models.billing import Subscription
from app.models.rekha_outreach import (
    RekhaCampaignSettings,
    RekhaOutreachMessage,
    RekhaProspect,
)
from app.models.support_ticket import SupportTicket
from app.services.rekha_automation import (
    process_autonomous_rekha_cycle,
    process_due_rekha_follow_ups,
)


def _env(key: str, default: str = "") -> str:
    return os.getenv(key, default).strip()


async def _count(db: AsyncSession, model: Any, *conditions: Any) -> int:
    query = select(func.count(model.id))
    if conditions:
        query = query.where(*conditions)
    return int(await db.scalar(query) or 0)


async def operations_snapshot(db: AsyncSession) -> dict[str, Any]:
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    prospect_rows = await db.execute(
        select(RekhaProspect.status, func.count(RekhaProspect.id)).group_by(RekhaProspect.status)
    )
    pipeline = {str(row[0]): int(row[1]) for row in prospect_rows.all()}
    settings = await db.get(RekhaCampaignSettings, "default")
    return {
        "sales": {
            "total_prospects": sum(pipeline.values()),
            "pipeline": pipeline,
            "needs_founder": await _count(db, RekhaProspect, RekhaProspect.requires_founder.is_(True)),
            "sent_today": await _count(
                db,
                RekhaOutreachMessage,
                RekhaOutreachMessage.sent_at >= today,
            ),
            "replies_today": await _count(
                db,
                RekhaOutreachMessage,
                RekhaOutreachMessage.direction == "inbound",
                RekhaOutreachMessage.created_at >= today,
            ),
        },
        "support": {
            "open": await _count(db, SupportTicket, SupportTicket.status == "open"),
            "in_progress": await _count(db, SupportTicket, SupportTicket.status == "in_progress"),
            "urgent": await _count(
                db,
                SupportTicket,
                SupportTicket.priority == "urgent",
                SupportTicket.status.in_(["open", "in_progress"]),
            ),
        },
        "subscriptions": {
            "active": await _count(db, Subscription, Subscription.status == "active"),
            "trialing": await _count(db, Subscription, Subscription.status == "trialing"),
            "past_due": await _count(db, Subscription, Subscription.status == "past_due"),
        },
        "ai_jobs": {
            "queued": await _count(db, AIJob, AIJob.status == "queued"),
            "running": await _count(db, AIJob, AIJob.status == "running"),
            "failed": await _count(db, AIJob, AIJob.status == "failed"),
        },
        "automation": {
            "campaign_active": bool(settings and settings.is_active),
            "autonomous_discovery": bool(settings and settings.autonomous_discovery),
            "auto_initial_outreach": bool(settings and settings.auto_initial_outreach),
            "auto_follow_ups": bool(settings and settings.auto_follow_ups),
            "auto_reply_safe": bool(settings and settings.auto_reply_safe),
            "next_discovery_at": settings.next_discovery_at.isoformat() if settings and settings.next_discovery_at else None,
        },
    }


def _daily_brief(snapshot: dict[str, Any]) -> str:
    sales = snapshot["sales"]
    support = snapshot["support"]
    subs = snapshot["subscriptions"]
    jobs = snapshot["ai_jobs"]
    priorities: list[str] = []
    if support["urgent"]:
        priorities.append(f"{support['urgent']} urgent support ticket pehle review karo")
    if sales["needs_founder"]:
        priorities.append(f"{sales['needs_founder']} lead tumhare verified answer ka wait kar rahi hai")
    if subs["past_due"]:
        priorities.append(f"{subs['past_due']} subscription past-due hai")
    if jobs["failed"]:
        priorities.append(f"{jobs['failed']} AI job failed hai")
    if not priorities:
        priorities.append("Koi critical blocker nahi hai; sales pipeline aur demos par focus kar sakte ho")
    return (
        f"Aaj ka founder brief: {sales['total_prospects']} prospects, {sales['sent_today']} messages sent, "
        f"{sales['replies_today']} new replies. Support mein {support['open']} open aur "
        f"{support['in_progress']} in-progress tickets hain. Active subscriptions: {subs['active']}. "
        f"Priority: {'; '.join(priorities)}."
    )


def _topic_reply(intent: str, snapshot: dict[str, Any]) -> str:
    if intent == "support":
        item = snapshot["support"]
        return (
            f"Support desk: {item['open']} open, {item['in_progress']} in progress aur "
            f"{item['urgent']} urgent tickets hain. Main urgent queue ko top priority maanungi."
        )
    if intent == "subscriptions":
        item = snapshot["subscriptions"]
        return (
            f"Subscriptions: {item['active']} active, {item['trialing']} trialing aur "
            f"{item['past_due']} past-due accounts hain."
        )
    if intent == "ai_jobs":
        item = snapshot["ai_jobs"]
        return f"AI jobs: {item['running']} running, {item['queued']} queued aur {item['failed']} failed hain."
    sales = snapshot["sales"]
    pipeline = sales["pipeline"]
    return (
        f"Sales pipeline: {sales['total_prospects']} total prospects, "
        f"{pipeline.get('interested', 0)} interested, {pipeline.get('demo_booked', 0)} demos booked, "
        f"{sales['needs_founder']} founder escalations aur {sales['replies_today']} replies today."
    )


async def _ai_reply(message: str, snapshot: dict[str, Any]) -> str | None:
    if _env("AI_PROVIDER", "mock").lower() != "openai" or not _env("OPENAI_API_KEY"):
        return None
    prompt = f"""
You are Rekha, the transparent AI digital operations assistant for Manish, founder of MMe-AI.
Reply in natural Hinglish unless the founder writes fully in English. Be concise and operational.
Never claim an action was performed unless the supplied data says it was performed.
Never invent revenue, client details, business results, prices, legal promises or technical status.
Suggest the single best next action when useful.

Current aggregate dashboard snapshot:
{json.dumps(snapshot, ensure_ascii=False)}

Founder message: {message}
""".strip()
    try:
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(
                "https://api.openai.com/v1/responses",
                headers={"Authorization": f"Bearer {_env('OPENAI_API_KEY')}", "Content-Type": "application/json"},
                json={"model": _env("OPENAI_MODEL", "gpt-4.1-mini"), "input": prompt},
            )
        response.raise_for_status()
        data = response.json()
        if isinstance(data.get("output_text"), str):
            return data["output_text"].strip()
        parts = [
            str(content.get("text") or content.get("output_text") or "")
            for item in data.get("output", []) or []
            for content in item.get("content", []) or []
        ]
        return "\n".join(item for item in parts if item).strip() or None
    except (httpx.HTTPError, ValueError, TypeError):
        return None


async def handle_founder_command(db: AsyncSession, message: str) -> dict[str, Any]:
    clean = message.strip()
    lowered = clean.lower()
    action_name: str | None = None
    action_status: str | None = None
    action_result: dict[str, Any] | None = None

    if any(phrase in lowered for phrase in ("lead khojo", "leads khojo", "find leads", "discovery chala", "new leads lao")):
        action_name = "run_lead_discovery"
        action_result = await process_autonomous_rekha_cycle(db, force=True)
        action_status = "completed" if action_result.get("processed") else "not_run"
        reply = (
            f"Lead cycle complete: {action_result.get('imported_count', 0)} new prospects, "
            f"{action_result.get('drafted_count', 0)} drafts aur {action_result.get('sent_count', 0)} sends."
            if action_result.get("processed")
            else f"Lead cycle run nahi hua: {str(action_result.get('reason') or 'not ready').replace('_', ' ')}."
        )
        intent = "sales_action"
    elif "follow" in lowered and any(word in lowered for word in ("bhejo", "chala", "process", "send", "karo")):
        action_name = "process_follow_ups"
        action_result = await process_due_rekha_follow_ups(db)
        action_status = "completed"
        reply = f"Follow-up queue checked: {action_result.get('processed_count', 0)} prospects process hue."
        intent = "sales_action"
    elif "auto reply" in lowered and any(word in lowered for word in ("on", "enable", "start")):
        settings = await db.get(RekhaCampaignSettings, "default")
        if not settings:
            settings = RekhaCampaignSettings(id="default")
            db.add(settings)
        settings.auto_reply_safe = True
        await db.commit()
        action_name, action_status, intent = "enable_safe_auto_reply", "completed", "automation_action"
        reply = "Safe auto-replies ON hain. Uncertain pricing, legal ya technical questions tumhare paas escalate hongi."
    elif "auto reply" in lowered and any(word in lowered for word in ("off", "disable", "stop", "band")):
        settings = await db.get(RekhaCampaignSettings, "default")
        if not settings:
            settings = RekhaCampaignSettings(id="default")
            db.add(settings)
        settings.auto_reply_safe = False
        await db.commit()
        action_name, action_status, intent = "disable_safe_auto_reply", "completed", "automation_action"
        reply = "Safe auto-replies OFF kar diye. Incoming replies dashboard mein sync hoti rahengi."
    else:
        if any(word in lowered for word in ("support", "ticket", "query")):
            intent = "support"
        elif any(word in lowered for word in ("subscription", "billing", "revenue", "payment")):
            intent = "subscriptions"
        elif any(word in lowered for word in ("job", "queue", "failed task")):
            intent = "ai_jobs"
        elif any(word in lowered for word in ("lead", "sales", "demo", "whatsapp", "outreach")):
            intent = "sales"
        else:
            intent = "daily_brief"
        snapshot = await operations_snapshot(db)
        ai_text = await _ai_reply(clean, snapshot)
        reply = ai_text or (_daily_brief(snapshot) if intent == "daily_brief" else _topic_reply(intent, snapshot))

    snapshot = await operations_snapshot(db)
    return {
        "reply": reply,
        "intent": intent,
        "action_name": action_name,
        "action_status": action_status,
        "action_result": action_result,
        "snapshot": snapshot,
        "quick_actions": [
            "Aaj ka founder brief do",
            "Sales pipeline batao",
            "Urgent support dikhao",
            "Due follow-ups process karo",
            "New leads khojo",
        ],
    }
