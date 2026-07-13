from __future__ import annotations

import base64
import os
import time
from email.message import EmailMessage
from typing import Any

import httpx


TOKEN_URL = "https://oauth2.googleapis.com/token"
GMAIL_API_ROOT = "https://gmail.googleapis.com/gmail/v1/users/me"

_cached_access_token = ""
_cached_access_token_expires_at = 0.0


def _env(key: str, default: str = "") -> str:
    return os.getenv(key, default).strip()


def gmail_api_configured() -> bool:
    return _env("REKHA_GMAIL_API_ENABLED", "false").lower() in {"1", "true", "yes"} and all(
        _env(key)
        for key in (
            "REKHA_GMAIL_CLIENT_ID",
            "REKHA_GMAIL_CLIENT_SECRET",
            "REKHA_GMAIL_REFRESH_TOKEN",
            "REKHA_GMAIL_FROM_EMAIL",
        )
    )


async def _access_token() -> str:
    global _cached_access_token, _cached_access_token_expires_at
    if _cached_access_token and time.time() < _cached_access_token_expires_at - 60:
        return _cached_access_token
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            TOKEN_URL,
            data={
                "client_id": _env("REKHA_GMAIL_CLIENT_ID"),
                "client_secret": _env("REKHA_GMAIL_CLIENT_SECRET"),
                "refresh_token": _env("REKHA_GMAIL_REFRESH_TOKEN"),
                "grant_type": "refresh_token",
            },
        )
    response.raise_for_status()
    payload = response.json()
    _cached_access_token = str(payload["access_token"])
    _cached_access_token_expires_at = time.time() + int(payload.get("expires_in") or 3600)
    return _cached_access_token


async def _request(
    method: str,
    path: str,
    *,
    params: dict[str, Any] | None = None,
    json: dict[str, Any] | None = None,
) -> dict[str, Any]:
    token = await _access_token()
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.request(
            method,
            f"{GMAIL_API_ROOT}{path}",
            headers={"Authorization": f"Bearer {token}"},
            params=params,
            json=json,
        )
    response.raise_for_status()
    return response.json() if response.content else {}


def _encode_message(
    recipients: list[str],
    subject: str,
    body: str,
    html_body: str | None = None,
) -> str:
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = _env("REKHA_GMAIL_FROM_EMAIL")
    message["To"] = ", ".join(recipients)
    message.set_content(body)
    if html_body:
        message.add_alternative(html_body, subtype="html")
    return base64.urlsafe_b64encode(message.as_bytes()).decode().rstrip("=")


async def send_gmail_message(
    recipients: list[str],
    subject: str,
    body: str,
    html_body: str | None = None,
) -> dict[str, Any]:
    if not gmail_api_configured():
        return {"sent": False, "provider": "gmail_api", "message": "Gmail API is not configured."}
    try:
        payload = await _request(
            "POST",
            "/messages/send",
            json={"raw": _encode_message(recipients, subject, body, html_body)},
        )
        return {
            "sent": True,
            "provider": "gmail_api",
            "provider_message_id": payload.get("id"),
            "recipients": recipients,
            "message": f"Email sent to {len(recipients)} recipient(s) through Gmail API.",
        }
    except (httpx.HTTPError, KeyError, ValueError) as exc:
        return {
            "sent": False,
            "provider": "gmail_api",
            "recipients": recipients,
            "message": f"Gmail API send failed: {exc}",
        }


async def fetch_unread_raw_messages(limit: int = 50) -> list[dict[str, str]]:
    if not gmail_api_configured():
        return []
    listing = await _request(
        "GET",
        "/messages",
        params={"q": "is:unread", "maxResults": min(max(limit, 1), 100)},
    )
    results: list[dict[str, str]] = []
    for item in listing.get("messages") or []:
        message_id = str(item.get("id") or "")
        if not message_id:
            continue
        payload = await _request(
            "GET",
            f"/messages/{message_id}",
            params={"format": "raw"},
        )
        raw = str(payload.get("raw") or "")
        if raw:
            results.append({"id": message_id, "raw": raw})
    return results


async def mark_gmail_message_read(message_id: str) -> None:
    await _request(
        "POST",
        f"/messages/{message_id}/modify",
        json={"removeLabelIds": ["UNREAD"]},
    )

