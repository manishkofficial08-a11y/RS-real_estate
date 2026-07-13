from app.services.free_lead_generation import (
    build_overpass_query,
    configured_overpass_urls,
    deduplicate_candidates,
    element_matches_industry,
    element_to_candidate,
    normalize_category,
    valid_public_phone,
)


def test_known_industry_uses_bounded_category_rule():
    assert normalize_category("Real Estate Agents") == "real_estate"
    query = build_overpass_query("Real Estate Agents", 21.2514, 81.6296, 5000)
    assert '["office"]' in query
    assert "around:5000,21.251400,81.629600" in query


def test_mme_ai_local_business_niche_uses_broad_indexed_rules():
    assert normalize_category("Local Businesses") == "local_businesses"
    query = build_overpass_query("Local Businesses", 21.2514, 81.6296, 3000)
    assert '["shop"]' in query
    assert '["office"]' in query
    assert '["amenity"]' in query


def test_free_provider_has_failover_instances(monkeypatch):
    monkeypatch.delenv("LEAD_AGENT_OVERPASS_URLS", raising=False)
    monkeypatch.delenv("LEAD_AGENT_OVERPASS_URL", raising=False)
    assert len(configured_overpass_urls()) >= 2


def test_custom_industry_uses_indexed_business_tags_and_local_filtering():
    query = build_overpass_query('solar "installer"', 21.25, 81.63, 2000)
    assert '["office"]' in query
    assert '["shop"]' in query
    assert 'solar "installer"' not in query


def test_real_estate_name_fallback_filters_unrelated_offices():
    assert element_matches_industry(
        {"tags": {"name": "Sunrise Properties", "office": "company"}},
        "Real Estate Agents",
    )
    assert not element_matches_industry(
        {"tags": {"name": "Example Accounting", "office": "accountant"}},
        "Real Estate Agents",
    )


def test_osm_element_becomes_scored_candidate():
    candidate = element_to_candidate(
        {
            "type": "node",
            "id": 42,
            "lat": 21.25,
            "lon": 81.63,
            "tags": {
                "name": "Example Realty",
                "office": "estate_agent",
                "contact:phone": "+91 99999 99999",
                "contact:email": "hello@example.com",
                "website": "https://example.com",
                "addr:city": "Raipur",
            },
        },
        "real estate agents",
    )

    assert candidate is not None
    assert candidate["id"] == "osm-node-42"
    assert candidate["category"] == "Estate Agent"
    assert candidate["score"] == 100
    assert candidate["address"] == "Raipur"


def test_duplicate_candidates_are_removed():
    candidate = {
        "name": "Example Realty",
        "email": "hello@example.com",
        "phone": "+91 99999 99999",
        "latitude": 21.25,
        "longitude": 81.63,
    }
    assert len(deduplicate_candidates([candidate, dict(candidate)])) == 1


def test_short_service_numbers_and_information_points_are_rejected():
    assert valid_public_phone("139") is None
    assert valid_public_phone("+91 98765 43210") == "+919876543210"
    assert not element_matches_industry(
        {"tags": {"name": "Gurgaon", "tourism": "information", "phone": "139"}},
        "Local Businesses",
    )


def test_admin_lead_generation_routes_are_registered(monkeypatch, tmp_path):
    monkeypatch.chdir(tmp_path)
    from app.main import app

    paths = {route.path for route in app.routes}
    assert "/api/v1/admin/lead-generation/search" in paths
    assert "/api/v1/admin/lead-generation/import" in paths
    assert "/api/v1/support/tickets/{ticket_id}/messages" in paths
    assert "/api/v1/support/admin/tickets/{ticket_id}/messages" in paths
    assert "/api/v1/billing/admin/subscriptions" in paths
    assert "/api/v1/billing/admin/subscriptions/{tenant_id}" in paths
