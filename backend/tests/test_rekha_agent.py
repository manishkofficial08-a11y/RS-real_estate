import pytest

from app.models.rekha_outreach import RekhaProspect
from app.services.rekha_agent import (
    calculate_fit,
    classify_reply,
    draft_outreach,
    integration_status,
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
    result = await classify_reply("Yes, interested. Let's book a demo.")
    assert result["intent"] == "interested"
    assert "Manish" in result["suggested_reply"]
    assert "+91 99999 99999" in result["suggested_reply"]


@pytest.mark.asyncio
async def test_opt_out_stops_outreach():
    result = await classify_reply("Please remove me and do not contact again")
    assert result["intent"] == "opted_out"


def test_voice_calling_is_safety_gated(monkeypatch):
    monkeypatch.delenv("REKHA_AUTO_SEND_ENABLED", raising=False)
    state = integration_status()
    assert state["call_enabled"] is False
    assert state["auto_send_enabled"] is False


def test_rekha_routes_are_registered():
    from app.main import app

    paths = {route.path for route in app.routes}
    assert "/api/v1/admin/rekha/run" in paths
    assert "/api/v1/admin/rekha/overview" in paths
    assert "/api/v1/admin/rekha/prospects/{prospect_id}/draft" in paths
    assert "/api/v1/admin/rekha/messages/{message_id}/send" in paths
