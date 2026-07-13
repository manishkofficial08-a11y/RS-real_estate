from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from typing import Any
from urllib.parse import quote

import httpx

from app.models.rekha_outreach import RekhaProspect
from app.services.email_service import send_email_message


REKHA_NAME = "Rekha"
INDIA_MARKERS = {
    "india", "bharat", "delhi", "gurgaon", "gurugram", "noida", "mumbai", "bombay",
    "bengaluru", "bangalore", "pune", "hyderabad", "chennai", "kolkata", "jaipur",
    "ahmedabad", "surat", "lucknow", "indore", "chandigarh", "haryana", "punjab",
    "rajasthan", "uttar pradesh", "maharashtra", "karnataka", "gujarat",
}
HINGLISH_MARKERS = {
    "kya", "kaise", "haan", "nahi", "nhi", "batao", "chahiye", "karna", "kar sakte",
    "kitna", "abhi", "baad", "theek", "acha", "accha", "samjha", "bhai",
}


def _env(key: str, default: str = "") -> str:
    return os.getenv(key, default).strip()


def founder_profile() -> dict[str, str]:
    return {
        "name": _env("REKHA_FOUNDER_NAME", "Manish"),
        "company": _env("REKHA_COMPANY_NAME", "MMe-AI"),
        "phone": _env("REKHA_FOUNDER_PHONE", "+91 8851144571"),
        "whatsapp_url": _env(
            "REKHA_FOUNDER_WHATSAPP_URL",
            "https://wa.me/918851144571",
        ),
        "booking_url": _env("REKHA_BOOKING_URL"),
        "demo_hours": _env("REKHA_DEMO_HOURS", "10:00 AM–5:00 PM IST"),
        "contact_email": _env(
            "REKHA_CONTACT_EMAIL",
            _env("SMTP_FROM_EMAIL", "mmeai.official@gmail.com"),
        ),
    }


def integration_status() -> dict[str, Any]:
    profile = founder_profile()
    return {
        "agent_name": REKHA_NAME,
        "ai_ready": bool(_env("OPENAI_API_KEY")) and _env("AI_PROVIDER", "mock").lower() == "openai",
        "email_ready": all(
            _env(key)
            for key in ("SMTP_HOST", "SMTP_PORT", "SMTP_USERNAME", "SMTP_PASSWORD", "SMTP_FROM_EMAIL")
        ),
        "email_inbound_ready": _env("REKHA_IMAP_ENABLED", "false").lower() in {"1", "true", "yes"}
        and bool(_env("REKHA_IMAP_USERNAME", _env("SMTP_USERNAME")))
        and bool(_env("REKHA_IMAP_PASSWORD", _env("SMTP_PASSWORD"))),
        "whatsapp_ready": all(
            _env(key)
            for key in (
                "REKHA_WHATSAPP_PHONE_NUMBER_ID",
                "REKHA_WHATSAPP_ACCESS_TOKEN",
                "REKHA_WHATSAPP_TEMPLATE_NAME",
            )
        ),
        "booking_ready": bool(profile["booking_url"]),
        "compliance_ready": bool(_env("REKHA_POSTAL_ADDRESS")),
        "founder_handoff_ready": bool(
            profile["phone"] or profile["whatsapp_url"] or profile["contact_email"]
        ),
        "auto_send_enabled": _env("REKHA_AUTO_SEND_ENABLED", "false").lower() == "true",
        "daily_send_limit": int(_env("REKHA_DAILY_SEND_LIMIT", "20") or "20"),
        "call_enabled": False,
        "call_note": "Voice calling is intentionally gated until consent, provider, voice and transfer safeguards are approved.",
    }


def infer_market_region(location: str | None, phone: str | None = None) -> str:
    normalized = (location or "").lower()
    digits = re.sub(r"\D", "", phone or "")
    if any(marker in normalized for marker in INDIA_MARKERS) or digits.startswith("91"):
        return "india"
    return "international" if normalized or phone else "unknown"


def detect_language(text: str) -> str:
    lowered = text.lower()
    if re.search(r"[\u0900-\u097f]", text):
        return "hindi"
    if sum(1 for marker in HINGLISH_MARKERS if marker in lowered) >= 2:
        return "hinglish"
    return "english"


def _localized_hold(language: str) -> str:
    if language == "hindi":
        return "अच्छा सवाल है। गलत जानकारी देने के बजाय मैं इसे मनीष से ठीक से verify करके आपको जल्द बताती हूँ।"
    if language == "hinglish":
        return "Achha sawaal hai. Galat information dene ke bajay main Manish se properly verify karke aapko jaldi batati hoon."
    return "That’s a good question. Rather than give you an inaccurate answer, I’ll verify it properly with Manish and get back to you shortly."


def _localized_capability_reply(language: str) -> str:
    if language in {"hindi", "hinglish"}:
        return (
            "Bilkul. MMe-AI repetitive workflows—jaise lead follow-ups, support, reporting aur "
            "internal handoffs—ko automate karta hai. Agar aap ek time-consuming process batayein, "
            "main uske liye suitable demo suggest kar sakti hoon."
        )
    return (
        "Absolutely. MMe-AI automates repetitive workflows such as lead follow-ups, support, "
        "reporting and internal handoffs. If you share one time-consuming process, I can suggest "
        "a suitable demo."
    )


def _localized_known_reply(kind: str, language: str, handoff: str = "") -> str:
    replies = {
        "opted_out": {
            "english": "Understood. I won’t contact you again.",
            "hinglish": "Samajh gayi. Main aapko dobara contact nahi karungi.",
            "hindi": "समझ गई। मैं आपसे दोबारा संपर्क नहीं करूँगी।",
        },
        "interested": {
            "english": "Great — I’ll connect you directly with Manish for the workflow discussion.",
            "hinglish": "Perfect — workflow discussion ke liye main aapko directly Manish se connect kar deti hoon.",
            "hindi": "बहुत अच्छा — workflow discussion के लिए मैं आपको सीधे मनीष से connect कर देती हूँ।",
        },
        "not_interested": {
            "english": "Thanks for letting me know. I won’t follow up further.",
            "hinglish": "Batane ke liye thank you. Main iske baad follow-up nahi karungi.",
            "hindi": "बताने के लिए धन्यवाद। मैं इसके बाद follow-up नहीं करूँगी।",
        },
        "not_now": {
            "english": "No problem. I’ll pause here and won’t crowd your inbox.",
            "hinglish": "Koi problem nahi. Main yahin pause kar deti hoon aur aapko unnecessary messages nahi bhejungi.",
            "hindi": "कोई समस्या नहीं। मैं यहीं रुकती हूँ और आपको अनावश्यक संदेश नहीं भेजूँगी।",
        },
    }
    text = replies[kind].get(language, replies[kind]["english"])
    return (text + ("\n" + handoff if handoff else "")).strip()


def calculate_fit(prospect: RekhaProspect) -> tuple[int, str]:
    score = max(0, min(int(prospect.lead_score or 0), 100))
    reasons: list[str] = []

    if prospect.email:
        score += 10
        reasons.append("public business email available")
    if prospect.phone:
        score += 8
        reasons.append("business phone available")
    if prospect.website:
        score += 7
        reasons.append("active website available for workflow research")
    if prospect.address:
        score += 3
    if prospect.email and prospect.phone:
        reasons.append("multi-channel contactability")

    score = min(score, 100)
    if not reasons:
        reasons.append("basic public listing; manual research required")
    return score, "; ".join(reasons)


def _handoff_lines() -> list[str]:
    profile = founder_profile()
    lines: list[str] = [
        "What date and time would suit you best for a short demo?",
        f"If you don’t have a preference, our usual demo window is {profile['demo_hours']}.",
    ]
    if profile["booking_url"]:
        lines.append(f"Demo: {profile['booking_url']}")
    if profile["whatsapp_url"]:
        lines.append(f"WhatsApp {profile['name']}: {profile['whatsapp_url']}")
    elif profile["phone"]:
        lines.append(f"WhatsApp/call {profile['name']}: {profile['phone']}")
    if profile["contact_email"]:
        lines.append(f"Email: {profile['contact_email']}")
    return lines


def _fallback_copy(prospect: RekhaProspect, channel: str) -> dict[str, str]:
    category = (prospect.category or "business").strip()
    location = (prospect.location or "your area").strip()
    profile = founder_profile()
    intro = (
        f"I came across {prospect.business_name} while researching {category.lower()} businesses "
        f"around {location}."
    )
    offer = (
        "MMe-AI helps teams reduce repetitive work by automating workflows such as lead follow-ups, "
        "support, reporting and internal handoffs. We can first prepare a small no-cost working demo "
        "for one workflow; only if it feels useful do we discuss a paid production setup."
    )

    if channel == "whatsapp":
        body = (
            f"Hi, Rekha here — {profile['name']}'s AI assistant at {profile['company']}. "
            f"{intro} {offer}\n\nWould it be okay if I ask 2 quick questions to identify the best demo? "
            "Reply STOP anytime and I will not contact you again."
        )
        return {"subject": "", "body": body}

    body = (
        f"Hi {prospect.business_name} team,\n\n"
        f"I’m Rekha, {profile['name']}'s AI assistant at {profile['company']}. {intro}\n\n"
        f"{offer}\n\n"
        "Would it be useful if I sent 2–3 questions and suggested the highest-impact workflow to demo? "
        "No commitment required.\n\n"
        "Regards,\nRekha\nAI assistant to " + profile["name"] +
        "\n\nBusiness outreach from MMe-AI. Reply STOP to opt out."
    )
    postal_address = _env("REKHA_POSTAL_ADDRESS")
    if postal_address:
        body += f"\nMMe-AI, {postal_address}"
    return {
        "subject": f"A small workflow demo for {prospect.business_name}",
        "body": body,
    }


def _ensure_compliance_copy(body: str, channel: str) -> str:
    if "reply stop" not in body.lower():
        body += "\n\nReply STOP and Rekha will not contact you again."
    if channel == "email":
        postal_address = _env("REKHA_POSTAL_ADDRESS")
        if postal_address and postal_address.lower() not in body.lower():
            body += f"\nMMe-AI, {postal_address}"
    return body


def _extract_output_text(data: dict[str, Any]) -> str:
    if isinstance(data.get("output_text"), str):
        return data["output_text"]
    parts: list[str] = []
    for item in data.get("output", []) or []:
        for content in item.get("content", []) or []:
            text = content.get("text") or content.get("output_text")
            if isinstance(text, str):
                parts.append(text)
    return "\n".join(parts).strip()


async def draft_outreach(prospect: RekhaProspect, channel: str) -> dict[str, str]:
    fallback = _fallback_copy(prospect, channel)
    if _env("AI_PROVIDER", "mock").lower() != "openai" or not _env("OPENAI_API_KEY"):
        return {**fallback, "provider": "rekha_template"}

    profile = founder_profile()
    prompt = f"""
You are Rekha, an AI sales assistant working for {profile['name']}, founder of {profile['company']}.
Write a concise, natural first-touch {channel} message to a business prospect.

Facts you may use:
- Business: {prospect.business_name}
- Category: {prospect.category or 'business'}
- Location: {prospect.location or prospect.address or 'not known'}
- Website: {prospect.website or 'not available'}
- Source: public business listing

Offer:
{profile['company']} studies repetitive business workflows and builds AI automation that reduces manual
work, response time and operational load. Offer a small, limited no-cost working demo for one workflow.
Only if the demo is useful will a paid production setup be discussed.

Rules:
- Never invent a problem, employee name, result, relationship or website observation.
- Explicitly say Rekha is an AI assistant. Do not pretend to be human.
- Add a clear one-line opt-out. For email, also add the MMe-AI postal address when provided: {_env('REKHA_POSTAL_ADDRESS') or 'not configured'}.
- Sound warm and conversational, not corporate or overexcited.
- No pressure, fake urgency, exaggerated ROI or spam language.
- Ask one low-friction permission question.
- Keep WhatsApp under 90 words; email under 150 words.
- For email, include a useful subject. For WhatsApp, subject must be empty.
- Return only JSON with string keys subject and body.
""".strip()

    try:
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(
                "https://api.openai.com/v1/responses",
                headers={
                    "Authorization": f"Bearer {_env('OPENAI_API_KEY')}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": _env("OPENAI_MODEL", "gpt-4.1-mini"),
                    "input": prompt,
                    "temperature": 0.4,
                },
            )
        response.raise_for_status()
        raw = _extract_output_text(response.json()).strip()
        raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.IGNORECASE)
        parsed = json.loads(raw)
        subject = str(parsed.get("subject") or fallback["subject"]).strip()
        body = str(parsed.get("body") or fallback["body"]).strip()
        if not body:
            raise ValueError("Empty outreach body")
        return {"subject": subject, "body": _ensure_compliance_copy(body, channel), "provider": "openai"}
    except (httpx.HTTPError, ValueError, TypeError, json.JSONDecodeError):
        return {**fallback, "provider": "rekha_template_fallback"}


async def classify_reply(reply: str) -> dict[str, Any]:
    clean = reply.strip()
    lowered = clean.lower()
    language = detect_language(clean)
    if lowered in {"stop", "unsubscribe", "band karo"} or any(term in lowered for term in ("unsubscribe", "remove me", "stop messaging", "do not contact", "don't contact")):
        return {"intent": "opted_out", "suggested_reply": _localized_known_reply("opted_out", language), "confidence": 1.0, "requires_founder": False, "language": language, "reason": "Explicit opt-out"}
    if any(term in lowered for term in ("interested", "demo", "call me", "let's talk", "lets talk", "sounds good")):
        handoff = "\n".join(_handoff_lines())
        return {
            "intent": "interested",
            "suggested_reply": _localized_known_reply("interested", language, handoff),
            "confidence": 0.96,
            "requires_founder": False,
            "language": language,
            "reason": "Clear positive/demo intent",
        }
    if any(term in lowered for term in ("not interested", "no thanks", "no thank")):
        return {"intent": "not_interested", "suggested_reply": _localized_known_reply("not_interested", language), "confidence": 0.98, "requires_founder": False, "language": language, "reason": "Clear rejection"}
    if any(term in lowered for term in ("later", "next month", "not now", "busy")):
        return {"intent": "not_now", "suggested_reply": _localized_known_reply("not_now", language), "confidence": 0.92, "requires_founder": False, "language": language, "reason": "Asked to defer"}
    if any(term in lowered for term in ("what do you do", "what can you", "kya karte", "kya automate", "how can you help")):
        return {"intent": "replied", "suggested_reply": _localized_capability_reply(language), "confidence": 0.9, "requires_founder": False, "language": language, "reason": "General capability question"}
    sensitive_topics = (
        "price", "pricing", "cost", "quote", "guarantee", "contract", "legal", "security",
        "privacy", "gdpr", "hipaa", "data", "integration", "api", "refund", "timeline",
        "kitna", "charges", "fees",
    )
    if any(term in lowered for term in sensitive_topics) or "?" in clean:
        return {"intent": "needs_founder", "suggested_reply": _localized_hold(language), "confidence": 0.55, "requires_founder": True, "language": language, "reason": "Needs verified commercial or technical answer"}
    return {
        "intent": "needs_founder",
        "suggested_reply": _localized_hold(language),
        "confidence": 0.45,
        "requires_founder": True,
        "language": language,
        "reason": "Intent is not clear enough for a reliable automatic answer",
    }


def draft_follow_up(prospect: RekhaProspect, stage: int) -> dict[str, str]:
    profile = founder_profile()
    name = prospect.business_name
    if stage <= 1:
        body = (
            f"Hi {name} team — Rekha here, {profile['name']}'s AI assistant at {profile['company']}. "
            "Just following up on my earlier note. If reducing repetitive work is relevant, I can "
            "suggest one small workflow to test without any commitment. Should I send two quick questions?"
        )
        subject = f"Re: workflow demo for {name}"
    elif stage == 2:
        body = (
            f"Hi {name} team — one practical starting point is usually a repetitive follow-up, support, "
            "reporting or handoff process. Rekha here from MMe-AI; if you share the most time-consuming "
            "one, we can outline a limited working demo around it."
        )
        subject = f"One practical automation idea for {name}"
    else:
        body = (
            f"Hi {name} team — I’ll close the loop after this note so I don’t crowd your inbox. "
            "If workflow automation becomes relevant later, you can reply here and I’ll connect you "
            f"with {profile['name']}. — Rekha, AI assistant at {profile['company']}"
        )
        subject = f"Closing the loop — {name}"
    if prospect.preferred_channel == "whatsapp":
        subject = ""
    return {"subject": subject, "body": _ensure_compliance_copy(body, prospect.preferred_channel or "email"), "provider": "rekha_follow_up_template"}


async def send_outreach(channel: str, recipient: str, subject: str, body: str) -> dict[str, Any]:
    if channel == "email":
        result = await send_email_message([recipient], subject, body)
        return {**result, "provider": "smtp"}

    if channel != "whatsapp":
        return {"sent": False, "message": f"Unsupported channel: {channel}"}

    phone_number_id = _env("REKHA_WHATSAPP_PHONE_NUMBER_ID")
    access_token = _env("REKHA_WHATSAPP_ACCESS_TOKEN")
    template_name = _env("REKHA_WHATSAPP_TEMPLATE_NAME")
    if not (phone_number_id and access_token and template_name):
        digits = re.sub(r"\D", "", recipient)
        return {
            "sent": False,
            "provider": "whatsapp_manual",
            "manual_url": f"https://wa.me/{digits}?text={quote(body)}" if digits else "",
            "message": "Official WhatsApp template credentials are not configured. Open the manual review link instead.",
        }

    payload = {
        "messaging_product": "whatsapp",
        "to": re.sub(r"\D", "", recipient),
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": _env("REKHA_WHATSAPP_TEMPLATE_LANGUAGE", "en")},
            "components": [
                {
                    "type": "body",
                    "parameters": [{"type": "text", "text": body[:1024]}],
                }
            ],
        },
    }
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"https://graph.facebook.com/{_env('META_GRAPH_VERSION', 'v20.0')}/{phone_number_id}/messages",
                headers={"Authorization": f"Bearer {access_token}"},
                json=payload,
            )
        response.raise_for_status()
        data = response.json()
        message_id = ((data.get("messages") or [{}])[0]).get("id")
        return {
            "sent": True,
            "provider": "whatsapp_cloud_api",
            "provider_message_id": message_id,
            "message": "WhatsApp template sent.",
        }
    except httpx.HTTPError as exc:
        return {"sent": False, "provider": "whatsapp_cloud_api", "message": str(exc)}
