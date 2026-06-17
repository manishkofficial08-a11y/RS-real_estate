from __future__ import annotations

import json
import os
from datetime import datetime
from typing import Any

import httpx
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_job import AIJob, AIJobStatus

load_dotenv()


def _safe_json_loads(value: str | None) -> dict[str, Any]:
    if not value:
        return {}

    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, dict) else {"raw": parsed}
    except json.JSONDecodeError:
        return {"raw": value}


def _to_json(value: dict[str, Any]) -> str:
    return json.dumps(value, ensure_ascii=False)


def _prompt(payload: dict[str, Any], job: AIJob) -> str:
    return str(payload.get("prompt") or job.description or job.title or "").strip()


def _platform(payload: dict[str, Any]) -> str:
    return str(payload.get("platform") or "LinkedIn").strip()


def _tone(payload: dict[str, Any]) -> str:
    return str(payload.get("tone") or "Professional").strip()


def _strip_json_fence(text: str) -> str:
    cleaned = text.strip()

    if cleaned.startswith("```json"):
        cleaned = cleaned.removeprefix("```json").strip()

    if cleaned.startswith("```"):
        cleaned = cleaned.removeprefix("```").strip()

    if cleaned.endswith("```"):
        cleaned = cleaned.removesuffix("```").strip()

    return cleaned


def _extract_output_text(data: dict[str, Any]) -> str:
    if isinstance(data.get("output_text"), str):
        return data["output_text"]

    parts: list[str] = []

    for item in data.get("output", []) or []:
        for content in item.get("content", []) or []:
            if isinstance(content.get("text"), str):
                parts.append(content["text"])
            elif isinstance(content.get("output_text"), str):
                parts.append(content["output_text"])

    return "\n".join(parts).strip()


def _parse_json_or_text(text: str) -> dict[str, Any]:
    cleaned = _strip_json_fence(text)

    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict):
            return parsed

        return {"result": parsed}
    except json.JSONDecodeError:
        return {"result": cleaned}


def _build_system_prompt(job: AIJob, payload: dict[str, Any]) -> str:
    platform = _platform(payload)
    tone = _tone(payload)
    user_prompt = _prompt(payload, job)

    if job.job_type == "caption":
        return f"""
You are a senior real estate marketing copywriter.
Generate platform-ready captions for a real estate business.

Return ONLY valid JSON:
{{
  "agent": "caption_agent",
  "caption": "primary caption",
  "alternatives": ["caption 1", "caption 2", "caption 3"],
  "platform": "{platform}",
  "tone": "{tone}",
  "cta": "short call to action"
}}

User request:
{user_prompt}
""".strip()

    if job.job_type == "hashtag":
        return f"""
You are a social media growth specialist for real estate businesses.
Generate high-intent hashtags.

Return ONLY valid JSON:
{{
  "agent": "hashtag_agent",
  "hashtags": ["#tag1", "#tag2"],
  "platform": "{platform}",
  "strategy": "short hashtag strategy"
}}

User request:
{user_prompt}
""".strip()

    if job.job_type == "report":
        return f"""
You are a business analyst for a real estate SaaS client.
Create a concise, useful business report.

Return ONLY valid JSON:
{{
  "agent": "report_agent",
  "title": "report title",
  "summary": "short summary",
  "highlights": ["point 1", "point 2", "point 3"],
  "recommended_actions": ["action 1", "action 2", "action 3"]
}}

User request:
{user_prompt}
""".strip()

    if job.job_type == "recommendation":
        return f"""
You are an AI growth consultant for a real estate business.
Give practical recommendations.

Return ONLY valid JSON:
{{
  "agent": "recommendation_agent",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "priority": "what to do first"
}}

User request:
{user_prompt}
""".strip()

    return f"""
You are an AI assistant for a real estate business operating system.
Process the user's request.

Return ONLY valid JSON:
{{
  "agent": "generic_agent",
  "result": "main result",
  "next_steps": ["step 1", "step 2"]
}}

User request:
{user_prompt}
""".strip()


async def _call_openai(job: AIJob, payload: dict[str, Any]) -> dict[str, Any]:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()

    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is missing")

    model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini").strip()
    prompt = _build_system_prompt(job, payload)

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            "https://api.openai.com/v1/responses",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "input": prompt,
                "temperature": 0.7,
            },
        )

    if response.status_code >= 400:
        raise RuntimeError(f"OpenAI API error {response.status_code}: {response.text}")

    data = response.json()
    output_text = _extract_output_text(data)

    if not output_text:
        raise RuntimeError("OpenAI API returned empty output")

    parsed = _parse_json_or_text(output_text)
    parsed["provider"] = "openai"
    parsed["model"] = model
    parsed["raw_text"] = output_text

    return parsed


def _caption_agent(job: AIJob, payload: dict[str, Any]) -> dict[str, Any]:
    prompt = _prompt(payload, job)
    platform = _platform(payload)
    tone = _tone(payload)

    primary = (
        f"{prompt}\n\n"
        f"Positioned for {platform} with a {tone.lower()} tone.\n\n"
        "Book a visit today and experience a smarter way to discover your next property."
    )

    return {
        "agent": "caption_agent",
        "provider": "mock_template",
        "caption": primary,
        "alternatives": [
            f"Looking for a property that matches lifestyle, location, and value? {prompt} Contact us for details.",
            f"Premium real estate opportunity: {prompt} DM us to schedule a walkthrough.",
            f"Your next real estate move starts here. {prompt} Let's connect today.",
        ],
        "platform": platform,
        "tone": tone,
        "note": "Mock-template fallback output.",
    }


def _hashtag_agent(job: AIJob, payload: dict[str, Any]) -> dict[str, Any]:
    platform = _platform(payload)
    prompt = _prompt(payload, job).lower()

    base_tags = [
        "#RealEstate",
        "#Property",
        "#LuxuryHomes",
        "#DreamHome",
        "#RealEstateIndia",
        "#HomeBuyers",
        "#InvestmentProperty",
        "#GurgaonRealEstate",
        "#DelhiNCR",
        "#PropertyInvestment",
    ]

    if "3bhk" in prompt or "apartment" in prompt:
        base_tags.extend(["#3BHK", "#ApartmentLiving", "#LuxuryApartment"])

    if "villa" in prompt:
        base_tags.extend(["#VillaLife", "#LuxuryVilla"])

    if "commercial" in prompt or "office" in prompt:
        base_tags.extend(["#CommercialRealEstate", "#OfficeSpace"])

    return {
        "agent": "hashtag_agent",
        "provider": "mock_template",
        "platform": platform,
        "hashtags": list(dict.fromkeys(base_tags))[:18],
        "note": "Mock-template fallback output.",
    }


def _report_agent(job: AIJob, payload: dict[str, Any]) -> dict[str, Any]:
    prompt = _prompt(payload, job)

    return {
        "agent": "report_agent",
        "provider": "mock_template",
        "title": job.title,
        "summary": f"AI report generated for: {prompt or job.title}",
        "highlights": [
            "Lead activity should be reviewed daily to prevent warm leads from going cold.",
            "Premium listings should be promoted with location, lifestyle, and urgency-led messaging.",
            "Follow-up speed and content consistency are the highest-impact growth levers.",
        ],
        "recommended_actions": [
            "Follow up with hot leads within 24 hours.",
            "Create 3 listing-specific posts this week.",
            "Track property-wise enquiry conversion.",
            "Use captions and hashtags tailored to each platform.",
        ],
        "note": "Mock-template fallback output.",
    }


def _recommendation_agent(job: AIJob, payload: dict[str, Any]) -> dict[str, Any]:
    prompt = _prompt(payload, job)

    return {
        "agent": "recommendation_agent",
        "provider": "mock_template",
        "recommendations": [
            f"Use a sharper CTA based on this request: {prompt or job.title}",
            "Prioritize leads with recent activity and high intent.",
            "Repurpose top-performing listing content into short-form posts.",
            "Use location-specific proof points in every caption.",
        ],
        "note": "Mock-template fallback output.",
    }


def _generic_agent(job: AIJob, payload: dict[str, Any]) -> dict[str, Any]:
    prompt = _prompt(payload, job)

    return {
        "agent": "generic_agent",
        "provider": "mock_template",
        "result": f"Processed AI request: {prompt or job.title}",
        "next_steps": [
            "Review generated output.",
            "Edit for brand voice if needed.",
            "Use it in the relevant campaign or workflow.",
        ],
        "note": "Mock-template fallback output.",
    }


def _run_mock_agent(job: AIJob, payload: dict[str, Any]) -> dict[str, Any]:
    if job.job_type == "caption":
        return _caption_agent(job, payload)

    if job.job_type == "hashtag":
        return _hashtag_agent(job, payload)

    if job.job_type == "report":
        return _report_agent(job, payload)

    if job.job_type == "recommendation":
        return _recommendation_agent(job, payload)

    return _generic_agent(job, payload)


async def _run_agent(job: AIJob, payload: dict[str, Any]) -> dict[str, Any]:
    provider = os.getenv("AI_PROVIDER", "mock").strip().lower()

    if provider == "openai":
        return await _call_openai(job, payload)

    return _run_mock_agent(job, payload)


async def execute_ai_job(job: AIJob, db: AsyncSession) -> AIJob:
    job.status = AIJobStatus.running.value
    job.started_at = job.started_at or datetime.utcnow()
    job.progress = 35
    job.attempts = (job.attempts or 0) + 1
    job.error_message = None

    await db.commit()
    await db.refresh(job)

    try:
        payload = _safe_json_loads(job.input_payload)
        output = await _run_agent(job, payload)

        job.output_payload = _to_json(output)
        job.status = AIJobStatus.completed.value
        job.progress = 100
        job.completed_at = datetime.utcnow()
        job.failed_at = None
        job.error_message = None
    except Exception as exc:
        job.status = AIJobStatus.failed.value
        job.failed_at = datetime.utcnow()
        job.error_message = str(exc)
        job.progress = min(job.progress or 0, 99)

    await db.commit()
    await db.refresh(job)

    return job
