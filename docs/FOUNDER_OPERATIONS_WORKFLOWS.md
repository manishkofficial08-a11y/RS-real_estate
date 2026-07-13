# Founder operations workflows

## Database migration

Run the latest Alembic migration before deploying the backend:

```bash
cd backend
alembic upgrade head
```

Migration `010_support_conversations` adds threaded support messages and backfills existing client messages and founder replies.

## Support lifecycle

1. Any authenticated user in a client workspace can create a ticket.
2. Tickets are tenant-isolated and visible to that workspace in the client Support page.
3. Client and founder replies are stored as an ordered conversation instead of overwriting one reply field.
4. A client reply reopens a resolved or closed ticket.
5. Founder replies and status changes create client notifications.
6. Client replies create founder notifications.

## Subscription lifecycle

- Client dashboards read the current plan, limits, usage, renewal preference and invoices from `/billing/*`.
- Founder dashboard reads every tenant through `/billing/admin/subscriptions`.
- New tenants receive a subscription during onboarding and missing legacy subscriptions are safely initialized when founder billing data is loaded.
- Founder controls can change plan, cycle, status and cancellation preference; the client dashboard sees the same persisted record.
- Billing remains provider-agnostic/mock until Stripe or Razorpay credentials and webhooks are connected. The UI does not claim that mock invoices are paid.

## Lead generation

The Founder Lead Generation page uses MMe-AI's public website niches as primary presets:

- Real Estate
- Healthcare
- Education
- Retail
- Local Businesses

Additional operational niches remain available. Leads can be filtered by quality score and contact availability before CSV export or CRM import.
