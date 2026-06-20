import asyncio
import secrets
import sys
import uuid
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from sqlalchemy import select
from app.core.security import hash_password
from app.database.base import AsyncSessionLocal
from app.models.tenant import Tenant, BusinessType, PlanType
from app.models.user import User, UserRole


def ask(prompt: str, default: str | None = None) -> str:
    label = f"{prompt}"
    if default:
        label += f" [{default}]"
    label += ": "

    value = input(label).strip()
    return value or (default or "")


async def main() -> None:
    print("\n=== MMe AI Invite-Only Client Workspace Creator ===\n")

    business_name = ask("Business name", "Ridhi Sidhi Real Estate")
    owner_name = ask("Owner full name", "Ram Kumar Sahu")
    owner_email = ask("Owner email")
    business_type = ask("Business type", BusinessType.real_estate.value)
    plan = ask("Plan", PlanType.pro.value)

    if not owner_email:
        raise SystemExit("ERROR: Owner email is required.")

    temp_password = secrets.token_urlsafe(10)

    async with AsyncSessionLocal() as db:
        existing_user = await db.execute(select(User).where(User.email == owner_email))
        if existing_user.scalar_one_or_none():
            raise SystemExit(f"ERROR: User already exists with email: {owner_email}")

        tenant = Tenant(
            id=str(uuid.uuid4()),
            name=business_name,
            business_type=business_type,
            plan=plan,
            is_active=True,
        )
        db.add(tenant)
        await db.flush()

        user = User(
            id=str(uuid.uuid4()),
            email=owner_email,
            full_name=owner_name,
            password_hash=hash_password(temp_password),
            role=UserRole.owner.value,
            tenant_id=tenant.id,
            is_active=True,
        )
        db.add(user)

        await db.commit()

    print("\n✅ Client workspace created successfully.\n")
    print(f"Business: {business_name}")
    print(f"Tenant ID: {tenant.id}")
    print(f"Owner: {owner_name}")
    print(f"Email: {owner_email}")
    print(f"Role: {UserRole.owner.value}")
    print(f"Plan: {plan}")
    print("\nTemporary login password:")
    print(temp_password)
    print("\nIMPORTANT:")
    print("Share this temporary password securely, then ask client to change/reset password.")
    print("Better production flow later: auto-send password setup link.\n")


if __name__ == "__main__":
    asyncio.run(main())
