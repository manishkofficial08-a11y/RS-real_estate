from __future__ import annotations

import asyncio
import ipaddress
import mimetypes
import os
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING, Any, Dict, Optional
from urllib.parse import urljoin, urlparse

import httpx

from app.models.generated_post import GeneratedPost

if TYPE_CHECKING:
    from app.models.content_asset import ContentAsset


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


def _credential_value(
    credentials: Optional[Dict[str, Any]],
    key: str,
    env_name: str = "",
    default: str = "",
) -> str:
    if credentials:
        value = credentials.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()

        metadata = credentials.get("metadata_json")
        if isinstance(metadata, dict):
            metadata_value = metadata.get(key)
            if isinstance(metadata_value, str) and metadata_value.strip():
                return metadata_value.strip()

    if env_name:
        return _env(env_name, default)

    return default


def _required_credential_or_env(
    credentials: Optional[Dict[str, Any]],
    key: str,
    env_name: str,
    label: str,
) -> str:
    value = _credential_value(credentials, key, env_name)
    if not value:
        raise PublisherConfigError(f"{label} is not configured")
    return value


def _publisher_mode() -> str:
    mode = _env("PUBLISHER_MODE", "mock").lower()
    if mode not in {"mock", "real", "hybrid"}:
        return "mock"
    return mode


def get_publisher_mode() -> str:
    return _publisher_mode()


def _normalize_platform(platform: Optional[str]) -> str:
    value = (platform or "other").strip().lower()
    if value == "twitter/x":
        return "twitter"
    if value in {"youtube shorts", "youtube_short", "youtube_shorts"}:
        return "youtube"
    if value in {"instagram reels", "reels", "ig"}:
        return "instagram"
    if value in {"facebook video", "fb"}:
        return "facebook"
    return value


def _platform_label(platform: str) -> str:
    labels = {
        "youtube": "YouTube Shorts",
        "instagram": "Instagram Reels",
        "facebook": "Facebook Video",
        "linkedin": "LinkedIn",
    }
    return labels.get(platform, platform.title())


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


def _extract_media_reference(
    post: GeneratedPost,
    media_asset: Optional["ContentAsset"] = None,
) -> Optional[str]:
    if media_asset and isinstance(media_asset.file_url, str) and media_asset.file_url.strip():
        return media_asset.file_url.strip()

    metadata = post.metadata_json or {}

    for key in ("source_file_url", "media_url", "file_url"):
        value = metadata.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()

    return None


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


def _is_public_http_url(value: Optional[str]) -> bool:
    if not value:
        return False

    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        return False

    hostname = parsed.hostname.lower()
    if hostname in {"localhost", "host.docker.internal"} or hostname.endswith(".local"):
        return False

    try:
        address = ipaddress.ip_address(hostname)
    except ValueError:
        return True

    return not (
        address.is_private
        or address.is_loopback
        or address.is_link_local
        or address.is_reserved
    )


def _require_public_media_url(
    post: GeneratedPost,
    media_asset: Optional["ContentAsset"],
    platform_label: str,
) -> str:
    media_url = _absolute_media_url(_extract_media_reference(post, media_asset))
    if not media_url or not _is_public_http_url(media_url):
        raise PublisherConfigError(
            f"{platform_label} requires a publicly reachable media URL. "
            "Deploy the backend and set PUBLIC_BACKEND_URL to a public HTTPS URL."
        )

    return media_url


def _extract_asset_type(
    post: GeneratedPost,
    media_asset: Optional["ContentAsset"] = None,
) -> str:
    if media_asset and isinstance(media_asset.asset_type, str):
        return media_asset.asset_type.lower()

    metadata = post.metadata_json or {}
    value = metadata.get("source_asset_type")

    if isinstance(value, str):
        return value.lower()

    return ""


def _mock_publish(
    post: GeneratedPost,
    platform: Optional[str] = None,
    warning: Optional[str] = None,
) -> PublisherResult:
    platform = _normalize_platform(platform or post.platform)
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


async def _get_json(url: str, params: Dict[str, Any]) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=45) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        if not response.text:
            return {}
        return response.json()


async def _publish_facebook(
    post: GeneratedPost,
    media_asset: Optional["ContentAsset"] = None,
    credentials: Optional[Dict[str, Any]] = None,
) -> PublisherResult:
    page_id = (
        _credential_value(credentials, "external_account_id")
        or _credential_value(credentials, "page_id", "FACEBOOK_PAGE_ID")
    )
    if not page_id:
        raise PublisherConfigError("Facebook page id is not configured")

    token = _required_credential_or_env(
        credentials,
        "access_token",
        "FACEBOOK_PAGE_ACCESS_TOKEN",
        "Facebook page access token",
    )
    graph_version = _env("META_GRAPH_VERSION", "v20.0")

    caption = _build_caption(post)
    media_reference = _extract_media_reference(post, media_asset)
    asset_type = _extract_asset_type(post, media_asset)

    base_url = f"https://graph.facebook.com/{graph_version}/{page_id}"

    if asset_type == "video":
        if not media_reference:
            raise PublisherConfigError(
                "Facebook Video publishing requires a linked video asset."
            )
        media_url = _require_public_media_url(
            post,
            media_asset,
            "Facebook Video publishing",
        )
        endpoint = f"{base_url}/videos"
        payload = {
            "file_url": media_url,
            "description": caption,
            "access_token": token,
        }
    elif media_reference:
        media_url = _require_public_media_url(
            post,
            media_asset,
            "Facebook media publishing",
        )
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


async def _publish_instagram(
    post: GeneratedPost,
    media_asset: Optional["ContentAsset"] = None,
    credentials: Optional[Dict[str, Any]] = None,
) -> PublisherResult:
    ig_account_id = (
        _credential_value(credentials, "external_account_id")
        or _credential_value(
            credentials,
            "instagram_business_account_id",
            "INSTAGRAM_BUSINESS_ACCOUNT_ID",
        )
    )
    if not ig_account_id:
        raise PublisherConfigError("Instagram business account id is not configured")

    token = _required_credential_or_env(
        credentials,
        "access_token",
        "INSTAGRAM_ACCESS_TOKEN",
        "Instagram access token",
    )
    graph_version = _env("META_GRAPH_VERSION", "v20.0")

    if not _extract_media_reference(post, media_asset):
        raise PublisherConfigError(
            "Instagram publishing requires a linked image or video asset."
        )

    media_url = _require_public_media_url(
        post,
        media_asset,
        "Instagram publishing",
    )
    caption = _build_caption(post)
    asset_type = _extract_asset_type(post, media_asset)

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

    if asset_type == "video":
        for _ in range(15):
            container_status = await _get_json(
                f"https://graph.facebook.com/{graph_version}/{creation_id}",
                {
                    "fields": "status_code",
                    "access_token": token,
                },
            )
            status_code = str(container_status.get("status_code") or "").upper()

            if status_code == "FINISHED":
                break

            if status_code in {"ERROR", "EXPIRED"}:
                raise PublisherError(
                    f"Instagram Reel processing failed with status {status_code}"
                )

            await asyncio.sleep(2)
        else:
            raise PublisherError(
                "Instagram Reel processing did not finish before publish timeout"
            )

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


async def _publish_linkedin(
    post: GeneratedPost,
    media_asset: Optional["ContentAsset"] = None,
    credentials: Optional[Dict[str, Any]] = None,
) -> PublisherResult:
    token = _required_credential_or_env(
        credentials,
        "access_token",
        "LINKEDIN_ACCESS_TOKEN",
        "LinkedIn access token",
    )
    author_urn = (
        _credential_value(credentials, "external_account_id")
        or _credential_value(credentials, "author_urn", "LINKEDIN_AUTHOR_URN")
    )
    if not author_urn:
        raise PublisherConfigError("LinkedIn author URN is not configured")

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
        warning=(
            "LinkedIn published the professional text/caption. "
            "LinkedIn video upload will be added later."
            if _extract_asset_type(post, media_asset) == "video"
            else None
        ),
    )


def _local_media_path(media_reference: str) -> Optional[Path]:
    parsed = urlparse(media_reference)
    relative_path = parsed.path if parsed.scheme in {"http", "https"} else media_reference
    normalized = relative_path.lstrip("/\\")

    if not normalized.lower().startswith("uploads/"):
        return None

    backend_dir = Path(__file__).resolve().parents[2]
    candidates = [
        Path.cwd() / normalized,
        Path.cwd() / "backend" / normalized,
        backend_dir / normalized,
    ]

    for candidate in candidates:
        if candidate.is_file():
            return candidate

    return None


async def _read_video_source(
    post: GeneratedPost,
    media_asset: Optional["ContentAsset"] = None,
) -> tuple[bytes, str]:
    if _extract_asset_type(post, media_asset) != "video":
        raise PublisherConfigError(
            "YouTube Shorts publishing requires a linked video asset."
        )

    media_reference = _extract_media_reference(post, media_asset)
    if not media_reference:
        raise PublisherConfigError(
            "YouTube Shorts publishing requires a linked video asset."
        )

    mime_type = (
        media_asset.mime_type
        if media_asset and isinstance(media_asset.mime_type, str)
        else None
    )
    mime_type = mime_type or mimetypes.guess_type(urlparse(media_reference).path)[0]
    mime_type = mime_type or "video/mp4"

    local_path = _local_media_path(media_reference)
    if local_path:
        return await asyncio.to_thread(local_path.read_bytes), mime_type

    if media_reference.startswith(("http://", "https://")):
        async with httpx.AsyncClient(timeout=180, follow_redirects=True) as client:
            response = await client.get(media_reference)
            response.raise_for_status()
            return response.content, mime_type

    raise PublisherConfigError(
        "YouTube could not read the linked video file. "
        "Keep the upload available locally or provide a reachable media URL."
    )


async def _youtube_access_token(
    credentials: Optional[Dict[str, Any]] = None,
) -> str:
    refresh_token = _credential_value(
        credentials,
        "refresh_token",
        "YOUTUBE_REFRESH_TOKEN",
    )

    if refresh_token:
        payload = {
            "client_id": _required_env("YOUTUBE_CLIENT_ID"),
            "client_secret": _required_env("YOUTUBE_CLIENT_SECRET"),
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        }
        token_data = await _post_form("https://oauth2.googleapis.com/token", payload)
        access_token = token_data.get("access_token")

        if not isinstance(access_token, str) or not access_token:
            raise PublisherError("YouTube OAuth refresh did not return an access token")

        return access_token

    access_token = _credential_value(credentials, "access_token")
    if access_token:
        return access_token

    raise PublisherConfigError(
        "YouTube access token or refresh token is not configured"
    )


async def _publish_youtube(
    post: GeneratedPost,
    media_asset: Optional["ContentAsset"] = None,
    credentials: Optional[Dict[str, Any]] = None,
) -> PublisherResult:
    video_bytes, mime_type = await _read_video_source(post, media_asset)
    access_token = await _youtube_access_token(credentials)
    privacy_status = _env("YOUTUBE_PRIVACY_STATUS", "private").lower()

    if privacy_status not in {"private", "public", "unlisted"}:
        raise PublisherConfigError(
            "YOUTUBE_PRIVACY_STATUS must be private, public, or unlisted"
        )

    tags = [
        tag.strip().lstrip("#")
        for tag in post.hashtags or []
        if isinstance(tag, str) and tag.strip()
    ]
    metadata = {
        "snippet": {
            "title": post.title.strip()[:100],
            "description": _build_caption(post)[:5000],
            "tags": tags,
        },
        "status": {
            "privacyStatus": privacy_status,
            "selfDeclaredMadeForKids": False,
        },
    }
    upload_url = (
        "https://www.googleapis.com/upload/youtube/v3/videos"
        "?part=snippet,status&uploadType=resumable"
    )
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": mime_type,
        "X-Upload-Content-Length": str(len(video_bytes)),
    }

    async with httpx.AsyncClient(timeout=300, follow_redirects=True) as client:
        start_response = await client.post(upload_url, json=metadata, headers=headers)
        start_response.raise_for_status()
        resumable_url = start_response.headers.get("location")

        if not resumable_url:
            raise PublisherError(
                "YouTube did not return a resumable upload URL"
            )

        upload_response = await client.put(
            resumable_url,
            content=video_bytes,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": mime_type,
                "Content-Length": str(len(video_bytes)),
            },
        )
        upload_response.raise_for_status()
        data = upload_response.json() if upload_response.text else {}

    external_id = data.get("id")
    if not isinstance(external_id, str) or not external_id:
        raise PublisherError("YouTube upload completed without a video ID")

    return PublisherResult(
        platform="youtube",
        mode="real",
        external_post_id=external_id,
        external_post_url=f"https://youtu.be/{external_id}",
        provider="youtube_data_api",
        raw_response=data,
    )


async def _real_publish(
    post: GeneratedPost,
    platform: Optional[str] = None,
    media_asset: Optional["ContentAsset"] = None,
    credentials: Optional[Dict[str, Any]] = None,
) -> PublisherResult:
    platform = _normalize_platform(platform or post.platform)

    if platform == "youtube":
        return await _publish_youtube(post, media_asset, credentials)

    if platform == "facebook":
        return await _publish_facebook(post, media_asset, credentials)

    if platform == "instagram":
        return await _publish_instagram(post, media_asset, credentials)

    if platform == "linkedin":
        return await _publish_linkedin(post, media_asset, credentials)

    raise PublisherConfigError(
        f"Real publisher for platform '{platform}' is not configured yet"
    )


async def publish_generated_post_to_platform(
    post: GeneratedPost,
    platform: Optional[str] = None,
    media_asset: Optional["ContentAsset"] = None,
    allow_mock_fallback: bool = True,
    credentials: Optional[Dict[str, Any]] = None,
) -> PublisherResult:
    mode = _publisher_mode()
    normalized_platform = _normalize_platform(platform or post.platform)

    if mode == "mock":
        if not allow_mock_fallback:
            raise PublisherConfigError(
                f"{_platform_label(normalized_platform)} publisher is running in mock mode. "
                "Connect real credentials and set PUBLISHER_MODE=real or hybrid before live publishing."
            )
        return _mock_publish(post, normalized_platform)

    try:
        return await _real_publish(
            post,
            normalized_platform,
            media_asset,
            credentials,
        )
    except Exception as exc:
        if mode == "hybrid" and allow_mock_fallback:
            return _mock_publish(post, normalized_platform, warning=str(exc))

        if isinstance(exc, PublisherError):
            raise

        raise PublisherError(str(exc)) from exc
