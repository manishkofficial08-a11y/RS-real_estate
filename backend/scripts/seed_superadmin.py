import asyncio
import os
import sys
import uuid
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import select

# Import all models so SQLAlchemy relationships are registered
from app.models import Tenant, Property, Lead, LeadActivity, User, UserRole
from app.database.base import AsyncSessionLocal
from app.core.security import hash_password


async def seed_superadmin():
    email = os.getenv("SUPERADMIN_EMAIL", "founder@aigrowthos.com")
    password = os.getenv("SUPERADMIN_PASSWORD", "Admin@12345")
    full_name = os.getenv("SUPERADMIN_NAME", "AI Growth OS Founder")

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user:
            user.full_name = full_name
            user.password_hash = hash_password(password)
            user.role = UserRole.superadmin.value
            user.tenant_id = None
            user.is_active = True
            await db.commit()
            print(f"Superadmin updated: {email}")
            return

        user = User(
            id=str(uuid.uuid4()),
            email=email,
            full_name=full_name,
            password_hash=hash_password(password),
            role=UserRole.superadmin.value,
            tenant_id=None,
            is_active=True,
        )

        db.add(user)
        await db.commit()
        print(f"Superadmin created: {email}")


if __name__ == "__main__":
    asyncio.run(seed_superadmin())