import pytest

from app.models.rekha_outreach import RekhaProspect
from app.services.rekha_agent import (
    calculate_fit,
    classify_reply,
    detect_language,
    draft_follow_up,
    draft_outreach,
    infer_market_region,
    integration_status,
    send_outreach,
)


def prospect(**overrides):
    values = {
        "business_name": "Northstar Services",
        "category": "Professional Services",
        "location": "Gurgaon, Haryana",
        "email": "hello@example.com",
        "phone": "+91 99999 99999",
        "website": "https://example.com",
        "address": "Sector 44, Gurgaon",
        "lead_score": 70,
        "source": "OpenStreetMap",
    }
    values.update(overrides)
    return RekhaProspect(**values)


def test_fit_score_rewards_contactable_grounded_prospects():
    score, reason = calculate_fit(prospect())
    assert score == 98
    assert "public business email" in reason
    assert "multi-channel" in reason


@pytest.mark.asyncio
async def test_rekha_template_is_transparent_and_low_pressure(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "mock")
    copy = await draft_outreach(prospect(), "email")
    assert "AI assistant" in copy["body"]
    assert "no-cost working demo" in copy["body"]
    assert "paid production setup" in copy["body"]
    assert copy["subject"]
    assert copy["provider"] == "rekha_template"


@pytest.mark.asyncio
async def test_interested_reply_creates_founder_handoff(monkeypatch):
    monkeypatch.setenv("REKHA_FOUNDER_PHONE", "+91 99999 99999")
    monkeypatch.setenv("REKHA_FOUNDER_WHATSAPP_URL", "")
    result = await classify_reply("Yes, interested. Let's book a demo.")
    assert result["intent"] == "interested"
    assert "Manish" in result["suggested_reply"]
    assert "+91 99999 99999" in result["suggested_reply"]


@pytest.mark.asyncio
async def test_opt_out_stops_outreach():
    result = await classify_reply("Please remove me and do not contact again")
    assert result["intent"] == "opted_out"


@pytest.mark.asyncio
async def test_unknown_question_is_held_for_founder_instead_of_guessed():
    result = await classify_reply("Can you guarantee the result and what will it cost?")
    assert result["intent"] == "needs_founder"
    assert result["requires_founder"] is True
    assert "verify" in result["suggested_reply"].lower()


@pytest.mark.asyncio
async def test_hinglish_question_gets_natural_hinglish_hold_reply():
    result = await classify_reply("Ye kitna cost karega aur kaise karna hai?")
    assert result["language"] == "hinglish"
    assert "properly verify" in result["suggested_reply"]


def test_market_and_language_detection_are_region_aware():
    assert infer_market_region("Gurgaon, Haryana") == "india"
    assert infer_market_region("London, United Kingdom") == "international"
    assert detect_language("क्या आप बता सकते हैं?") == "hindi"
    assert detect_language("How does this work?") == "english"


def test_follow_up_sequence_closes_politely_without_pressure():
    copy = draft_follow_up(prospect(preferred_channel="email"), 3)
    assert "close the loop" in copy["body"]
    assert "AI assistant" in copy["body"]


def test_voice_calling_is_safety_gated(monkeypatch):
    monkeypatch.delenv("REKHA_AUTO_SEND_ENABLED", raising=False)
    state = integration_status()
    assert state["call_enabled"] is False
    assert state["auto_send_enabled"] is False


def test_official_contact_email_is_available_as_safe_fallback(monkeypatch):
    monkeypatch.delenv("REKHA_CONTACT_EMAIL", raising=False)
    monkeypatch.delenv("SMTP_FROM_EMAIL", raising=False)
    from app.services.rekha_agent import founder_profile

    assert founder_profile()["contact_email"] == "mmeai.official@gmail.com"


@pytest.mark.asyncio
async def test_interested_lead_is_asked_for_preferred_demo_time(monkeypatch):
    monkeypatch.delenv("REKHA_FOUNDER_PHONE", raising=False)
    monkeypatch.delenv("REKHA_FOUNDER_WHATSAPP_URL", raising=False)
    monkeypatch.delenv("REKHA_DEMO_HOURS", raising=False)
    result = await classify_reply("Sounds good, I am interested in a demo")
    reply = result["suggested_reply"]
    assert "What date and time would suit you best" in reply
    assert "10:00 AM–5:00 PM IST" in reply
    assert "https://wa.me/918851144571" in reply


def test_rekha_routes_are_registered():
    from app.main import app

    paths = {route.path for route in app.routes}
    assert "/api/v1/admin/rekha/run" in paths
    assert "/api/v1/admin/rekha/overview" in paths
    assert "/api/v1/admin/rekha/prospects/{prospect_id}/draft" in paths
    assert "/api/v1/admin/rekha/messages/{message_id}/send" in paths
    assert "/api/v1/admin/rekha/prospects/{prospect_id}/whatsapp/send" in paths
    assert "/api/v1/admin/rekha/campaign" in paths
    assert "/api/v1/admin/rekha/process-due" in paths
    assert "/api/v1/admin/rekha/prospects/{prospect_id}/resolve" in paths
    assert "/api/v1/webhooks/rekha/inbound" in paths
    assert "/api/v1/webhooks/rekha/whatsapp" in paths


@pytest.mark.asyncio
async def test_whatsapp_reply_uses_session_text_inside_customer_window(monkeypatch):
    captured = {}

    class Response:
        def raise_for_status(self):
            return None

        def json(self):
            return {"messages": [{"id": "wamid.reply"}]}

    class Client:
        def __init__(self, **kwargs):
            del kwargs

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            del args

        async def post(self, url, headers, json):
            captured.update(url=url, headers=headers, payload=json)
            return Response()

    monkeypatch.setenv("REKHA_WHATSAPP_PHONE_NUMBER_ID", "123")
    monkeypatch.setenv("REKHA_WHATSAPP_ACCESS_TOKEN", "token")
    monkeypatch.setenv("REKHA_WHATSAPP_TEMPLATE_NAME", "rekha_intro")
    monkeypatch.setattr("app.services.rekha_agent.httpx.AsyncClient", Client)
    result = await send_outreach(
        "whatsapp",
        "+91 99999 99999",
        "",
        "Yes, kal 11 baje works.",
        message_kind="reply",
        within_customer_window=True,
    )
    assert result["sent"] is True
    assert captured["payload"]["type"] == "text"
    assert captured["payload"]["text"]["body"] == "Yes, kal 11 baje works."


@pytest.mark.asyncio
async def test_whatsapp_initial_message_uses_approved_template(monkeypatch):
    captured = {}

    class Response:
        def raise_for_status(self):
            return None

        def json(self):
            return {"messages": [{"id": "wamid.initial"}]}

    class Client:
        def __init__(self, **kwargs):
            del kwargs

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            del args

        async def post(self, url, headers, json):
            captured.update(url=url, headers=headers, payload=json)
            return Response()

    monkeypatch.setenv("REKHA_WHATSAPP_PHONE_NUMBER_ID", "123")
    monkeypatch.setenv("REKHA_WHATSAPP_ACCESS_TOKEN", "token")
    monkeypatch.setenv("REKHA_WHATSAPP_TEMPLATE_NAME", "rekha_intro")
    monkeypatch.setattr("app.services.rekha_agent.httpx.AsyncClient", Client)
    result = await send_outreach("whatsapp", "+91 99999 99999", "", "Intro copy")
    assert result["sent"] is True
    assert captured["payload"]["type"] == "template"
    assert captured["payload"]["template"]["name"] == "rekha_intro"
