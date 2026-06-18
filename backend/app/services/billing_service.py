from __future__ import annotations

from calendar import monthrange
from datetime import datetime, timezone
from typing import Any


PLAN_CATALOG: dict[str, dict[str, Any]] = {
    "free": {
        "id": "free",
        "name": "Free",
        "currency": "USD",
        "monthly_price": 0,
        "yearly_price": 0,
        "limits": {
            "team_members": 2,
            "media_uploads": 25,
            "generated_posts": 25,
            "scheduled_posts": 10,
            "reports": 5,
        },
        "features": [
            "Core CRM and property workspace",
            "Basic media library",
            "AI content trial allowance",
            "Community support",
        ],
    },
    "pro": {
        "id": "pro",
        "name": "Pro",
        "currency": "USD",
        "monthly_price": 49,
        "yearly_price": 490,
        "limits": {
            "team_members": 10,
            "media_uploads": 1000,
            "generated_posts": 1000,
            "scheduled_posts": 500,
            "reports": 100,
        },
        "features": [
            "Everything in Free",
            "Multi-platform campaign publishing",
            "Advanced scheduler and reports",
            "Up to 10 team members",
            "Priority email support",
        ],
    },
    "enterprise": {
        "id": "enterprise",
        "name": "Enterprise",
        "currency": "USD",
        "monthly_price": None,
        "yearly_price": None,
        "limits": {
            "team_members": None,
            "media_uploads": None,
            "generated_posts": None,
            "scheduled_posts": None,
            "reports": None,
        },
        "features": [
            "Everything in Pro",
            "Custom limits and onboarding",
            "Dedicated success manager",
            "Custom integrations and SLAs",
            "Invoice-based billing",
        ],
    },
}


def get_plan_metadata(plan: str) -> dict[str, Any]:
    return PLAN_CATALOG.get(plan, PLAN_CATALOG["free"])


def calculate_period_end(start: datetime, billing_cycle: str) -> datetime:
    months = 12 if billing_cycle == "yearly" else 1
    target_month_index = start.month - 1 + months
    target_year = start.year + target_month_index // 12
    target_month = target_month_index % 12 + 1
    target_day = min(start.day, monthrange(target_year, target_month)[1])

    return start.replace(
        year=target_year,
        month=target_month,
        day=target_day,
    )


def utc_now() -> datetime:
    return datetime.now(timezone.utc)
