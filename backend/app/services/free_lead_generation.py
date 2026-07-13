from __future__ import annotations

import os
import re
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional
from urllib.parse import urlparse

import httpx


NOMINATIM_URL = os.getenv(
    "LEAD_AGENT_NOMINATIM_URL",
    "https://nominatim.openstreetmap.org",
).rstrip("/")
DEFAULT_OVERPASS_URLS = [
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]
LEAD_AGENT_USER_AGENT = os.getenv(
    "LEAD_AGENT_USER_AGENT",
    "MME-AI-Free-Lead-Agent/1.0",
)


class LeadGenerationError(RuntimeError):
    """Base error for free lead discovery."""


class LocationNotFoundError(LeadGenerationError):
    """Raised when Nominatim cannot resolve a requested location."""


class LeadSourceUnavailableError(LeadGenerationError):
    """Raised when a free upstream data source is unavailable."""


@dataclass(frozen=True)
class GeocodedLocation:
    latitude: float
    longitude: float
    display_name: str


def configured_overpass_urls() -> List[str]:
    configured = os.getenv("LEAD_AGENT_OVERPASS_URLS") or os.getenv("LEAD_AGENT_OVERPASS_URL")
    if not configured:
        return DEFAULT_OVERPASS_URLS
    return [url.strip() for url in configured.split(",") if url.strip()]


CATEGORY_RULES: Dict[str, List[str]] = {
    "real_estate": ['["office"]'],
    "restaurants": ['["amenity"~"^(restaurant|cafe|fast_food)$"]'],
    "healthcare": ['["amenity"~"^(clinic|hospital|doctors|dentist|pharmacy)$"]'],
    "fitness": [
        '["leisure"~"^(fitness_centre|sports_centre)$"]',
        '["sport"="fitness"]',
    ],
    "education": ['["amenity"~"^(school|college|university|training)$"]'],
    "retail": ['["shop"]'],
    "hotels": ['["tourism"~"^(hotel|guest_house|hostel|motel)$"]'],
    "salons": ['["shop"~"^(hairdresser|beauty|massage)$"]'],
    "automotive": ['["shop"~"^(car|car_repair|tyres|motorcycle)$"]'],
    "professional_services": ['["office"~"^(lawyer|accountant|consulting|company)$"]'],
}

CATEGORY_ALIASES = {
    "real estate": "real_estate",
    "real estate agent": "real_estate",
    "real estate agents": "real_estate",
    "property dealer": "real_estate",
    "property dealers": "real_estate",
    "restaurant": "restaurants",
    "cafe": "restaurants",
    "doctor": "healthcare",
    "doctors": "healthcare",
    "clinic": "healthcare",
    "hospital": "healthcare",
    "gym": "fitness",
    "gyms": "fitness",
    "school": "education",
    "schools": "education",
    "college": "education",
    "shop": "retail",
    "shops": "retail",
    "hotel": "hotels",
    "salon": "salons",
    "car dealer": "automotive",
    "car repair": "automotive",
    "lawyer": "professional_services",
    "accountant": "professional_services",
    "consultant": "professional_services",
}


def normalize_category(industry: str) -> str:
    cleaned = re.sub(r"\s+", " ", industry.strip().lower())
    alias = CATEGORY_ALIASES.get(cleaned, cleaned.replace("-", "_").replace(" ", "_"))
    return alias if alias in CATEGORY_RULES else "custom"


def build_overpass_query(
    industry: str,
    latitude: float,
    longitude: float,
    radius_meters: int,
) -> str:
    category = normalize_category(industry)
    if category == "custom":
        selector_rules = ['["office"]', '["shop"]', '["amenity"]', '["tourism"]']
    else:
        selector_rules = CATEGORY_RULES[category]

    selectors = "\n".join(
        f"  nwr{rule}(around:{radius_meters},{latitude:.6f},{longitude:.6f});"
        for rule in selector_rules
    )
    return f"[out:json][timeout:25];\n(\n{selectors}\n);\nout center tags 200;"


def element_matches_industry(element: Dict[str, Any], industry: str) -> bool:
    tags = element.get("tags") or {}
    category = normalize_category(industry)
    name = str(tags.get("name") or tags.get("brand") or "").lower()

    if category == "real_estate":
        return tags.get("office") == "estate_agent" or any(
            keyword in name
            for keyword in (
                "real estate",
                "realty",
                "property",
                "properties",
                "builder",
                "developer",
            )
        )

    if category != "custom":
        return True

    searchable = " ".join(
        str(tags.get(key) or "").lower()
        for key in ("name", "brand", "operator", "office", "shop", "amenity", "tourism")
    )
    keywords = [token for token in re.findall(r"[a-z0-9]+", industry.lower()) if len(token) >= 3]
    return bool(keywords) and all(keyword in searchable for keyword in keywords)


def _first(tags: Dict[str, Any], *keys: str) -> Optional[str]:
    for key in keys:
        value = tags.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _address(tags: Dict[str, Any]) -> Optional[str]:
    full = _first(tags, "addr:full", "contact:address")
    if full:
        return full

    street = " ".join(
        part
        for part in [
            _first(tags, "addr:housenumber"),
            _first(tags, "addr:street"),
        ]
        if part
    )
    parts = [
        street or None,
        _first(tags, "addr:suburb"),
        _first(tags, "addr:city", "addr:town", "addr:village"),
        _first(tags, "addr:state"),
        _first(tags, "addr:postcode"),
    ]
    joined = ", ".join(part for part in parts if part)
    return joined or None


def _category_label(tags: Dict[str, Any], fallback: str) -> str:
    for key in ("office", "amenity", "shop", "tourism", "leisure", "sport"):
        value = _first(tags, key)
        if value:
            return value.replace("_", " ").title()
    return fallback.strip().title()


def _safe_public_url(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    candidate = value if "://" in value else f"https://{value}"
    parsed = urlparse(candidate)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return None
    return candidate


def score_candidate(candidate: Dict[str, Any]) -> int:
    score = 10 if candidate.get("name") else 0
    score += 25 if candidate.get("phone") else 0
    score += 25 if candidate.get("email") else 0
    score += 15 if candidate.get("website") else 0
    score += 15 if candidate.get("address") else 0
    score += 10 if candidate.get("category") else 0
    return min(score, 100)


def element_to_candidate(element: Dict[str, Any], industry: str) -> Optional[Dict[str, Any]]:
    tags = element.get("tags") or {}
    name = _first(tags, "name", "brand", "operator")
    if not name:
        return None

    latitude = element.get("lat")
    longitude = element.get("lon")
    center = element.get("center") or {}
    if latitude is None:
        latitude = center.get("lat")
    if longitude is None:
        longitude = center.get("lon")

    element_type = str(element.get("type") or "element")
    element_id = str(element.get("id") or "unknown")
    candidate: Dict[str, Any] = {
        "id": f"osm-{element_type}-{element_id}",
        "name": name,
        "category": _category_label(tags, industry),
        "address": _address(tags),
        "phone": _first(tags, "contact:phone", "phone", "contact:mobile", "mobile"),
        "email": _first(tags, "contact:email", "email"),
        "website": _safe_public_url(_first(tags, "contact:website", "website", "url")),
        "latitude": float(latitude) if latitude is not None else None,
        "longitude": float(longitude) if longitude is not None else None,
        "source": "OpenStreetMap",
        "source_url": f"https://www.openstreetmap.org/{element_type}/{element_id}",
    }
    candidate["score"] = score_candidate(candidate)
    return candidate


def deduplicate_candidates(candidates: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen = set()
    unique: List[Dict[str, Any]] = []
    for candidate in candidates:
        key = (
            (candidate.get("email") or "").lower(),
            re.sub(r"\D", "", candidate.get("phone") or ""),
            candidate.get("name", "").lower(),
            round(candidate.get("latitude") or 0, 5),
            round(candidate.get("longitude") or 0, 5),
        )
        if key in seen:
            continue
        seen.add(key)
        unique.append(candidate)
    return unique


async def geocode_location(location: str, client: httpx.AsyncClient) -> GeocodedLocation:
    try:
        response = await client.get(
            f"{NOMINATIM_URL}/search",
            params={"q": location, "format": "jsonv2", "limit": 1},
        )
        response.raise_for_status()
        results = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise LeadSourceUnavailableError(
            "Free location service is temporarily unavailable. Please retry shortly."
        ) from exc

    if not results:
        raise LocationNotFoundError(f"Could not find location: {location}")

    result = results[0]
    return GeocodedLocation(
        latitude=float(result["lat"]),
        longitude=float(result["lon"]),
        display_name=str(result.get("display_name") or location),
    )


async def discover_public_business_leads(
    industry: str,
    location: str,
    radius_km: int,
    limit: int,
) -> Dict[str, Any]:
    headers = {"User-Agent": LEAD_AGENT_USER_AGENT, "Accept": "application/json"}
    timeout = httpx.Timeout(35.0, connect=10.0)
    async with httpx.AsyncClient(headers=headers, timeout=timeout, follow_redirects=True) as client:
        geocoded = await geocode_location(location, client)
        query = build_overpass_query(
            industry,
            geocoded.latitude,
            geocoded.longitude,
            radius_km * 1000,
        )
        payload = None
        last_error: Optional[Exception] = None
        for overpass_url in configured_overpass_urls():
            try:
                response = await client.post(
                    overpass_url,
                    data={"data": query},
                    timeout=httpx.Timeout(28.0, connect=8.0),
                )
                response.raise_for_status()
                payload = response.json()
                break
            except (httpx.HTTPError, ValueError) as exc:
                last_error = exc

        if payload is None:
            raise LeadSourceUnavailableError(
                "Free business directory is busy or unavailable. Please retry shortly."
            ) from last_error

    candidates = deduplicate_candidates(
        candidate
        for candidate in (
            element_to_candidate(element, industry)
            for element in payload.get("elements", [])
            if element_matches_industry(element, industry)
        )
        if candidate is not None
    )
    candidates.sort(
        key=lambda item: (item["score"], bool(item.get("email")), bool(item.get("phone"))),
        reverse=True,
    )

    return {
        "industry": industry,
        "location": location,
        "resolved_location": geocoded.display_name,
        "radius_km": radius_km,
        "provider": "OpenStreetMap + Nominatim",
        "attribution_url": "https://www.openstreetmap.org/copyright",
        "candidates": candidates[:limit],
    }
