from __future__ import annotations

import os
import uuid
from dataclasses import dataclass
from typing import Any, Dict, Optional
from urllib.parse import urljoin

import httpx

from app.models.generated_post import GeneratedPost


class PublisherError(Exception):
    """Base publisher error."""


class PublisherConfigError(PublisherError):
    """Raised when a platform is not configured."""


@dataclass
class PublisherResult:
    platform: str
    mode: str
    external_post_id: str
    external_post_url: str
    provider: str
    raw_response: Dict[str, Any]
    warning: Optional[str] = None


def _env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


def _required_env(name: str) -> str:
    value = _env(name)
    if not value:
        raise PublisherConfigError(f"{name} is not configured")
    return value


def _publisher_mode() -> str:
    mode = _env("PUBLISHER_MODE", "mock").lower()
    if mode not in {"mock", "real", "hybrid"}:
        return "mock"
    return mode


def _normalize_platform(platform: Optional[str]) -> str:
    value = (platform or "other").strip().lower()
    if value == "twitter/x":
        return "twitter"
    return value


def _build_caption(post: GeneratedPost) -> str:
    hashtags = []
    for tag in post.hashtags or []:
        if isinstance(tag, str) and tag.strip():
            cleaned = tag.strip()
            hashtags.append(cleaned if cleaned.startswith("#") else f"#{cleaned}")

    parts = [post.content.strip()]
    if hashtags:
        parts.append(" ".join(hashtags))

    return "\n\n".join(part for part in parts if part)


def _absolute_media_url(value: Optional[str]) -> Optional[str]:
    if not value:
        return None

    if value.startswith("http://") or value.startswith("https://"):
        return value

    public_backend_url = (
        _env("PUBLIC_BACKEND_URL")
        or _env("BACKEND_PUBLIC_URL")
        or _env("API_PUBLIC_URL")
    )

    if not public_backend_url:
        return None

    return urljoin(public_backend_url.rstrip("/") + "/", value.lstrip("/"))


def _extract_media_url(post: GeneratedPost) -> Optional[str]:
    metadata = post.metadata_json or {}

    for key in ("source_file_url", "media_url", "file_url"):
        value = metadata.get(key)
        if isinstance(value, str) and value.strip():
            return _absolute_media_url(value.strip())

    return None


def _extract_asset_type(post: GeneratedPost) -> str:
    metadata = post.metadata_json or {}
    value = metadata.get("source_asset_type")

    if isinstance(value, str):
        return value.lower()

    return ""


def _mock_publish(post: GeneratedPost, warning: Optional[str] = None) -> PublisherResult:
    platform = _normalize_platform(post.platform)
    external_id = f"mock_{platform}_{uuid.uuid4().hex[:12]}"

    return PublisherResult(
        platform=platform,
        mode="mock",
        external_post_id=external_id,
        external_post_url=f"https://mock.social/{platform}/posts/{external_id}",
        provider="mock",
        raw_response={
            "message": "Mock publish completed. Configure real platform tokens for live publishing.",
        },
        warning=warning,
    )


async def _post_json(url: str, payload: Dict[str, Any], headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=45) as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        if not response.text:
            return {}
        return response.json()


async def _post_form(url: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(url, data=payload)
        response.raise_for_status()
        if not response.text:
            return {}
        return response.json()


async def _publish_facebook(post: GeneratedPost) -> PublisherResult:
    page_id = _required_env("FACEBOOK_PAGE_ID")
    token = _required_env("FACEBOOK_PAGE_ACCESS_TOKEN")
    graph_version = _env("META_GRAPH_VERSION", "v20.0")

    caption = _build_caption(post)
    media_url = _extract_media_url(post)
    asset_type = _extract_asset_type(post)

    base_url = f"https://graph.facebook.com/{graph_version}/{page_id}"

    if media_url and asset_type == "video":
        endpoint = f"{base_url}/videos"
        payload = {
            "file_url": media_url,
            "description": caption,
            "access_token": token,
        }
    elif media_url:
        endpoint = f"{base_url}/photos"
        payload = {
            "url": media_url,
            "caption": caption,
            "access_token": token,
        }
    else:
        endpoint = f"{base_url}/feed"
        payload = {
            "message": caption,
            "access_token": token,
        }

    data = await _post_form(endpoint, payload)
    external_id = str(data.get("post_id") or data.get("id") or f"facebook_{uuid.uuid4().hex[:12]}")

    return PublisherResult(
        platform="facebook",
        mode="real",
        external_post_id=external_id,
        external_post_url=f"https://www.facebook.com/{external_id}",
        provider="facebook_graph_api",
        raw_response=data,
    )


async def _publish_instagram(post: GeneratedPost) -> PublisherResult:
    ig_account_id = _required_env("INSTAGRAM_BUSINESS_ACCOUNT_ID")
    token = _required_env("INSTAGRAM_ACCESS_TOKEN")
    graph_version = _env("META_GRAPH_VERSION", "v20.0")

    media_url = _extract_media_url(post)
    if not media_url:
        raise PublisherConfigError(
            "Instagram publishing requires a public image/video URL. Set PUBLIC_BACKEND_URL after deployment."
        )

    caption = _build_caption(post)
    asset_type = _extract_asset_type(post)

    base_url = f"https://graph.facebook.com/{graph_version}/{ig_account_id}"

    create_payload: Dict[str, Any] = {
        "caption": caption,
        "access_token": token,
    }

    if asset_type == "video":
        create_payload["media_type"] = "REELS"
        create_payload["video_url"] = media_url
    else:
        create_payload["image_url"] = media_url

    container = await _post_form(f"{base_url}/media", create_payload)
    creation_id = container.get("id")

    if not creation_id:
        raise PublisherError("Instagram media container was not created")

    published = await _post_form(
        f"{base_url}/media_publish",
        {
            "creation_id": creation_id,
            "access_token": token,
        },
    )

    external_id = str(published.get("id") or creation_id)

    return PublisherResult(
        platform="instagram",
        mode="real",
        external_post_id=external_id,
        external_post_url=f"https://www.instagram.com/p/{external_id}/",
        provider="instagram_graph_api",
        raw_response={"container": container, "published": published},
    )


async def _publish_linkedin(post: GeneratedPost) -> PublisherResult:
    token = _required_env("LINKEDIN_ACCESS_TOKEN")
    author_urn = _required_env("LINKEDIN_AUTHOR_URN")

    payload = {
        "author": author_urn,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {
                    "text": _build_caption(post),
                },
                "shareMediaCategory": "NONE",
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
    }

    headers = {
        "Authorization": f"Bearer {token}",
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=45) as client:
        response = await client.post(
            "https://api.linkedin.com/v2/ugcPosts",
            json=payload,
            headers=headers,
        )
        response.raise_for_status()
        data = response.json() if response.text else {}
        external_id = response.headers.get("x-restli-id") or data.get("id") or f"linkedin_{uuid.uuid4().hex[:12]}"

    return PublisherResult(
        platform="linkedin",
        mode="real",
        external_post_id=str(external_id),
        external_post_url=f"https://www.linkedin.com/feed/update/{external_id}",
        provider="linkedin_ugc_api",
        raw_response=data,
        warning="LinkedIn first version publishes text/caption. Rich media upload will be added next.",
    )


async def _real_publish(post: GeneratedPost) -> PublisherResult:
    platform = _normalize_platform(post.platform)

    if platform == "facebook":
        return await _publish_facebook(post)

    if platform == "instagram":
        return await _publish_instagram(post)

    if platform == "linkedin":
        return await _publish_linkedin(post)

    raise PublisherConfigError(
        f"Real publisher for platform '{platform}' is not configured yet"
    )


async def publish_generated_post_to_platform(
    post: GeneratedPost,
    allow_mock_fallback: bool = True,
) -> PublisherResult:
    mode = _publisher_mode()

    if mode == "mock":
        return _mock_publish(post)

    try:
        return await _real_publish(post)
    except Exception as exc:
        if mode == "hybrid" or allow_mock_fallback:
            return _mock_publish(post, warning=str(exc))

        if isinstance(exc, PublisherError):
            raise

        raise PublisherError(str(exc)) from exc
