Hardcoded IDs and Constants to Abstract

- Active Ticket Status ID: 'Ban0a0nbQAbY'
  - Used in ticket-tailor and issued-ticket checks to mean Active
  - Sources:
    - src/lib/scanning-checks/ticket-tailor-checks.ts:130-141
    - src/lib/scanning-checks/issued-tickets-checks.ts:75-86

- Week IDs for special linking logic
  - Week 5: 'kNkus0tXHbao'
  - Week 6: '1sDK7NiGsZFg'
  - Source: src/actions.ts:423-435

- Stripe ALLOWED_APPLICATION_ID (commented enforcement)
  - 'ca_QpvN2rzkF1OM8vchXLyvXkpU7Uk5F86w'
  - Source: src/app/api/stripe/webhook/route.ts:19

- Webhook cutoff date for trip cancellations
  - '2024-10-01T00:00:00Z'
  - Source: src/app/api/stripe/webhook/route.ts:283-285

- Stripe Tax Rate IDs (env-conditional)
  - Production: 'txr_1OYPfKAp3wrt5iDHsGfPOUI5'
  - Non-prod: 'txr_1OYPdxAp3wrt5iDHiaZXl0KD'
  - Source: src/actions.ts:115-119

- Cash activation session ID prefix for manual activations
  - Format: `cash_${physicalCardNanoId}`
  - Sources: src/actions.ts:1026-1028, 1085-1093, 1136-1143

- Session validity extension constant
  - Extend card end to 4:00 AM next day
  - Source: src/lib/scanning-checks/card-checks.ts:590-593

- Authorization permission string for Door UI
  - 'org:maniac_cards:door'
  - Source: src/app/(internal)/team/door/layout.tsx:6-10


