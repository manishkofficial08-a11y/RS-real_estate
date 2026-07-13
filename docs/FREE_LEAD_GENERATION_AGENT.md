# Free Lead Generation Agent

The Founder Dashboard includes a review-first lead discovery workflow at
`/admin/lead-generation`.

## What it does

- Geocodes a city or locality with Nominatim.
- Searches public business records through global Overpass API instances.
- Scores listings by contact completeness.
- Lets the founder review and select results.
- Imports selected records into a chosen tenant CRM.
- Skips likely duplicates by email, phone, or business name.
- Exports reviewed results as CSV.

The agent does not send outreach, scrape Google Maps, or require a paid API key.

## Backend endpoints

- `POST /api/v1/admin/lead-generation/search`
- `POST /api/v1/admin/lead-generation/import`

Both endpoints require platform-admin authentication. Search is read-only. Import
is the only operation that writes CRM records.

## Configuration

Set a unique `LEAD_AGENT_USER_AGENT` containing a support contact before a
production rollout. Optional provider overrides are documented in
`backend/.env.example`.

Public instances are intended for bounded interactive searches. The API limits
search radius to 25 km and results to 50. For sustained commercial volume, run a
private Overpass/Nominatim deployment or switch the provider URLs to managed
instances.

## Data-quality note

Coverage depends on OpenStreetMap contributors. Restaurants, shops, clinics, and
other mapped places generally return more records than sparsely tagged niches.
The UI returns honest zero-result states and never fabricates business data.
