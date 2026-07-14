from app.services.rekha_command_center import _daily_brief, _topic_reply


def snapshot(**overrides):
    value = {
        "sales": {
            "total_prospects": 25,
            "pipeline": {"interested": 3, "demo_booked": 2},
            "needs_founder": 1,
            "sent_today": 4,
            "replies_today": 2,
        },
        "support": {"open": 5, "in_progress": 2, "urgent": 1},
        "subscriptions": {"active": 4, "trialing": 1, "past_due": 1},
        "ai_jobs": {"queued": 2, "running": 1, "failed": 1},
        "automation": {
            "campaign_active": True,
            "autonomous_discovery": True,
            "auto_initial_outreach": False,
            "auto_follow_ups": True,
            "auto_reply_safe": True,
            "next_discovery_at": None,
        },
    }
    value.update(overrides)
    return value


def test_daily_brief_prioritizes_real_operational_blockers():
    reply = _daily_brief(snapshot())
    assert "25 prospects" in reply
    assert "1 urgent support ticket" in reply
    assert "1 lead tumhare verified answer" in reply


def test_sales_topic_uses_live_pipeline_counts():
    reply = _topic_reply("sales", snapshot())
    assert "3 interested" in reply
    assert "2 demos booked" in reply
