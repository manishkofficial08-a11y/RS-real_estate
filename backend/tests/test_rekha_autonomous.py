from app.models.rekha_outreach import RekhaCampaignSettings, RekhaProspect
from app.services.rekha_automation import (
    _candidate_channel,
    _initial_send_allowed,
    _split_values,
)


def test_autonomous_rotation_config_accepts_commas_and_lines():
    assert _split_values("Delhi, Mumbai\nBengaluru", "fallback") == [
        "Delhi",
        "Mumbai",
        "Bengaluru",
    ]
    assert _split_values("", "Gurgaon") == ["Gurgaon"]


def test_auto_channel_prefers_business_email():
    assert _candidate_channel({"email": "hello@example.com", "phone": "+919876543210"}, "auto") == "email"
    assert _candidate_channel({"phone": "+919876543210"}, "auto") == "whatsapp"
    assert _candidate_channel({"phone": "+919876543210"}, "email") is None


def test_whatsapp_autosend_requires_recorded_opt_in():
    settings = RekhaCampaignSettings(auto_initial_outreach=True)
    prospect = RekhaProspect(business_name="Example", phone="+919876543210", whatsapp_opt_in=False)
    status = {
        "auto_send_enabled": True,
        "email_ready": True,
        "whatsapp_ready": True,
        "compliance_ready": True,
    }
    assert not _initial_send_allowed(prospect, "whatsapp", settings, status)
    prospect.whatsapp_opt_in = True
    assert _initial_send_allowed(prospect, "whatsapp", settings, status)


def test_email_autosend_requires_compliance_address():
    settings = RekhaCampaignSettings(auto_initial_outreach=True)
    prospect = RekhaProspect(business_name="Example", email="hello@example.com")
    status = {
        "auto_send_enabled": True,
        "email_ready": True,
        "whatsapp_ready": False,
        "compliance_ready": False,
    }
    assert not _initial_send_allowed(prospect, "email", settings, status)
    status["compliance_ready"] = True
    assert _initial_send_allowed(prospect, "email", settings, status)
