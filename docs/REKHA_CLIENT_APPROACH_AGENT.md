# Rekha — Client Approach Agent

Rekha is MMe-AI's founder-facing sales assistant. She turns public business
discovery into a reviewable lead-to-demo pipeline without pretending to be a
human or inventing business facts.

## Final first-touch pitch

### Email

**Subject:** A small workflow demo for {{business_name}}

Hi {{business_name}} team,

I'm Rekha, Manish's AI assistant at MMe-AI. I came across your business while
researching {{category}} companies around {{location}}.

MMe-AI helps teams reduce repetitive work by automating workflows such as lead
follow-ups, support, reporting and internal handoffs. We can first prepare a
small, limited no-cost working demo for one workflow; only if it feels useful do
we discuss a paid production setup.

Would it be useful if I sent 2-3 questions and suggested the highest-impact
workflow to demo? No commitment required.

Regards,
Rekha
AI assistant to Manish

### WhatsApp

Hi, Rekha here — Manish's AI assistant at MMe-AI. I came across
{{business_name}} while researching {{category}} businesses around
{{location}}. We help teams automate repetitive workflows like follow-ups,
support and reporting. We can first show a limited no-cost working demo; only
if it is useful do we discuss a paid setup. Would it be okay if I ask two quick
questions to identify the best demo?

The runtime may personalize this copy, but it is forbidden from inventing a
problem, contact name, result, relationship, or website observation.

## Implemented flow

1. Discover businesses through the existing OpenStreetMap/Nominatim agent.
2. Require a public contact destination and a founder-configured score floor.
3. De-duplicate and store prospects in a founder-only pipeline.
4. Generate a grounded email or WhatsApp draft with an honest AI disclosure.
5. Require review by default; production auto-send has an environment-level
   kill switch and daily cap.
6. Send email through configured SMTP. WhatsApp uses an approved Business
   template when Cloud API credentials are present; otherwise Rekha returns a
   manual review link and records that delivery did not occur.
7. Classify replies as interested, replied, not now, not interested, or opted
   out. Opt-outs permanently block sending.
8. On interest/demo intent, prepare a founder handoff containing the configured
   booking URL and Manish's WhatsApp/phone/email.

## Automation and reply safety

- A campaign-level pause switch gates every scheduled follow-up.
- Follow-ups use a three-touch sequence at approximately day 3, day 7 and day
  12. The last touch closes the loop politely; no further message is scheduled.
- A per-prospect pause, opt-out flag, founder escalation or incoming reply stops
  the active sequence.
- The background worker respects the configured timezone, working-hour window,
  environment auto-send kill switch and daily send cap.
- Indian location/phone signals are stored separately from international
  prospects. Incoming English, Hinglish and Hindi are detected so acknowledgements
  can mirror the prospect's language without using stereotypes or fake familiarity.
- Clear opt-outs, demo intent, rejection, deferral and general capability questions
  are handled deterministically. Pricing, contracts, guarantees, security, privacy,
  integrations and unclear questions are never guessed.
- For an uncertain question Rekha says she will verify it with Manish, pauses that
  prospect and creates a founder-dashboard escalation. Manish's answer becomes a
  reviewable `founder_verified` reply draft.

Inbound provider support is available at:

- `POST /api/v1/webhooks/rekha/inbound` for an email provider or integration
  using `X-Rekha-Webhook-Secret`.
- `GET/POST /api/v1/webhooks/rekha/whatsapp` for Meta verification and signed
  WhatsApp Cloud webhook payloads.

Webhook payloads are deduplicated using provider message IDs. Unknown senders are
acknowledged but are not inserted into the founder pipeline automatically.

## Why calls are not enabled yet

Voice is a separate production surface, not just another message button. The
proposed call path is:

`Registered telephony number -> SIP/voice provider -> low-latency voice agent -> CRM/calendar tools -> live founder transfer`

Before activation the following must be verified:

- the geography-specific lawful basis/consent and commercial-call registration;
- a registered telephony provider and caller identity;
- an opening disclosure that Rekha is an AI assistant;
- interruption handling, silence recovery, latency and accent evaluation;
- a strict knowledge base with no invented pricing, results, or commitments;
- immediate opt-out and do-not-call suppression;
- live transfer to Manish and a fallback when transfer fails;
- call recording disclosure/retention policy where recording is used;
- per-minute cost caps, daily limits and abuse monitoring;
- test calls and scored evaluations before any prospect traffic.

OpenAI's current voice-agent guidance documents realtime voice architecture,
including tool use and server-side controls:
https://developers.openai.com/api/docs/guides/voice-agents

TRAI describes consent as voluntary permission for commercial communication and
the digital recording of that consent:
https://www.trai.gov.in/manage-your-consent

No call should try to impersonate a human. The target is natural pacing and
useful conversation while remaining transparent about Rekha's identity.

## Production configuration

See `backend/.env.example` for:

- OpenAI personalization
- SMTP email sending
- founder contact and booking links
- the auto-send kill switch and daily cap
- official WhatsApp Business template credentials
- inbound webhook secret and WhatsApp verification/app secrets
- automation worker interval and batch-size controls

Secrets belong in the deployment environment, never in the repository or
browser bundle.

## Current production map

- GitHub: `manishkofficial08-a11y/RS-real_estate`
- Founder dashboard frontend: Vercel project `mme-ai-founder`
- Client dashboard frontend: Vercel project `rs-real-estate`
- Backend: Render service `mme-ai-api`
- Production database: Supabase project `rs-real-estate-production`
- Official contact email: `mmeai.official@gmail.com`
- Founder phone/WhatsApp: `+91 8851144571`
- Public WhatsApp link: `https://wa.me/918851144571`
- Demo scheduling rule: ask for the client's preferred date/time first; when
  they have no preference, offer the official `10:00 AM–5:00 PM IST` window.
