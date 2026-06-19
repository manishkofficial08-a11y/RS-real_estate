from datetime import datetime, timezone
from typing import Any, Dict, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.social_account import SocialAccount, SocialAccountStatus
from app.services.token_crypto import decrypt_token


def normalize_social_platform(platform: str) -> str:
    value = (platform or "").strip().lower()

    aliases = {
        "youtube shorts": "youtube",
        "youtube_short": "youtube",
        "youtube_shorts": "youtube",
        "fb": "facebook",
        "facebook video": "facebook",
        "ig": "instagram",
        "instagram reels": "instagram",
        "reels": "instagram",
        "linkedin page": "linkedin",
        "linkedin profile": "linkedin",
    }

    return aliases.get(value, value)


async def get_connected_social_account_credentials(
    db: AsyncSession,
    tenant_id: str,
    platform: str,
) -> Optional[Dict[str, Any]]:
    normalized_platform = normalize_social_platform(platform)

    result = await db.execute(
        select(SocialAccount)
        .where(
            SocialAccount.tenant_id == tenant_id,
            SocialAccount.platform == normalized_platform,
            SocialAccount.status == SocialAccountStatus.connected.value,
            SocialAccount.is_active == True,
        )
        .order_by(
            SocialAccount.updated_at.desc().nullslast(),
            SocialAccount.created_at.desc(),
        )
    )

    account = result.scalar_one_or_none()

    if not account:
        return None

    if account.token_expires_at:
        expires_at = account.token_expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at <= datetime.now(timezone.utc):
            account.status = SocialAccountStatus.expired.value
            account.last_error = "Stored access token has expired. Reconnect this social account."
            await db.commit()
            return None

    return {
        "account_id": account.id,
        "platform": account.platform,
        "account_name": account.account_name,
        "external_account_id": account.external_account_id,
        "access_token": decrypt_token(account.access_token_encrypted),
        "refresh_token": decrypt_token(account.refresh_token_encrypted),
        "scopes": account.scopes or [],
        "metadata_json": account.metadata_json or {},
    }
