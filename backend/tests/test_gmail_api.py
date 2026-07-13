import base64
from email import message_from_bytes

import pytest

from app.services import gmail_api


def test_gmail_api_configuration_requires_all_credentials(monkeypatch):
    monkeypatch.setenv("REKHA_GMAIL_API_ENABLED", "true")
    monkeypatch.setenv("REKHA_GMAIL_CLIENT_ID", "client")
    monkeypatch.setenv("REKHA_GMAIL_CLIENT_SECRET", "secret")
    monkeypatch.setenv("REKHA_GMAIL_REFRESH_TOKEN", "refresh")
    monkeypatch.delenv("REKHA_GMAIL_FROM_EMAIL", raising=False)
    assert gmail_api.gmail_api_configured() is False
    monkeypatch.setenv("REKHA_GMAIL_FROM_EMAIL", "mmeai.official@gmail.com")
    assert gmail_api.gmail_api_configured() is True


def test_gmail_message_encoding(monkeypatch):
    monkeypatch.setenv("REKHA_GMAIL_FROM_EMAIL", "mmeai.official@gmail.com")
    raw = gmail_api._encode_message(["client@example.com"], "Hello", "Plain body", "<b>HTML</b>")
    decoded = base64.urlsafe_b64decode(raw + "=" * (-len(raw) % 4))
    message = message_from_bytes(decoded)
    assert message["From"] == "mmeai.official@gmail.com"
    assert message["To"] == "client@example.com"
    assert message["Subject"] == "Hello"


@pytest.mark.asyncio
async def test_send_gmail_message_returns_provider_id(monkeypatch):
    for key, value in {
        "REKHA_GMAIL_API_ENABLED": "true",
        "REKHA_GMAIL_CLIENT_ID": "client",
        "REKHA_GMAIL_CLIENT_SECRET": "secret",
        "REKHA_GMAIL_REFRESH_TOKEN": "refresh",
        "REKHA_GMAIL_FROM_EMAIL": "mmeai.official@gmail.com",
    }.items():
        monkeypatch.setenv(key, value)

    async def fake_request(*args, **kwargs):
        return {"id": "gmail-message-1"}

    monkeypatch.setattr(gmail_api, "_request", fake_request)
    result = await gmail_api.send_gmail_message(["client@example.com"], "Subject", "Body")
    assert result["sent"] is True
    assert result["provider"] == "gmail_api"
    assert result["provider_message_id"] == "gmail-message-1"
