import asyncio
import os
import sys
from pathlib import Path

backend_root = Path(__file__).resolve().parents[1]
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from sqlalchemy import select

from app.database.session import AsyncSessionLocal
from app.models.tenant import Tenant
from app.models.user import User, UserRole


async def main() -> None:
    email = input("Founder email to promote [manishkofficial08@gmail.com]: ").strip() or "manishkofficial08@gmail.com"

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user:
            raise SystemExit(f"No user found with email: {email}")

        old_role = user.role
        old_tenant_id = user.tenant_id

        user.role = UserRole.superadmin.value
        user.tenant_id = None

        if old_tenant_id:
            tenant_result = await db.execute(select(Tenant).where(Tenant.id == old_tenant_id))
            tenant = tenant_result.scalar_one_or_none()
            if tenant and tenant.name.lower().strip() == "test real estate":
                tenant.is_active = False

        await db.commit()

        print("Founder account promoted successfully.")
        print(f"Email: {user.email}")
        print(f"Old role: {old_role}")
        print(f"New role: {user.role}")
        print(f"Old tenant_id: {old_tenant_id}")
        print(f"New tenant_id: {user.tenant_id}")
        print("Dummy Test Real Estate tenant deactivated if it matched.")


if __name__ == "__main__":
    database_url = os.getenv("DATABASE_URL", "")
    if not database_url:
        raise SystemExit("DATABASE_URL is not set.")
    asyncio.run(main())
