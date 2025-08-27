Primary Rules Catalog (with file/line references)

Door Access (Cards at Door)
- Session must have started (deny if currentTime < session.startTime)
  - Source: src/lib/scanning-checks/card-checks.ts:94-111
- Session must not be ended when scanning (deny if currentTime > session.endTime)
  - Source: src/lib/scanning-checks/card-checks.ts:112-129
- Card location must match venue location (card.locationId == session.venueLocationId)
  - Source: src/lib/scanning-checks/card-checks.ts:572-585
- Card validity window must overlap session window; card end extended to next day 4:00 AM
  - Source: src/lib/scanning-checks/card-checks.ts:588-645
- Free entry required per tier (Maniac Card / Maniac VIP Card) else deny
  - Source: src/lib/scanning-checks/card-checks.ts:131-164, 166-201
- No reentry allowed when session.reentryAllowed == false and prior entry exists
  - Source: src/lib/scanning-checks/card-checks.ts:203-226
- God mode bypasses door checks
  - Source: src/lib/scanning-checks/card-checks.ts:82-92

Session Invariants (Active Session Resolution)
- Exactly one active session for a venue and current time; else explicit errors
  - No Active Session: src/lib/scanning-checks/door-scanning-checks.ts:215-224
  - Multiple Sessions Found: src/lib/scanning-checks/door-scanning-checks.ts:226-235
- Session access pages redirect if session ended
  - Source: src/app/(internal)/team/door/[venueId]/[sessionId]/layout.tsx:17-23

Ticket Tailor Tickets
- Ticket must be Active (statusId equals active-id) else deny
  - Source: src/lib/scanning-checks/ticket-tailor-checks.ts:130-141
- Ticket session must equal current session else deny
  - Source: src/lib/scanning-checks/ticket-tailor-checks.ts:156-167
- No reentry allowed when currentSession.reentryAllowed == false and prior entry exists
  - Source: src/lib/scanning-checks/ticket-tailor-checks.ts:174-186

Issued Tickets (Internal)
- Ticket must be Active (statusId equals active-id) else deny
  - Source: src/lib/scanning-checks/issued-tickets-checks.ts:75-86
- Ticket session must match current session else deny
  - Source: src/lib/scanning-checks/issued-tickets-checks.ts:137-148
- No reentry allowed when session.reentryAllowed == false and prior entry exists
  - Source: src/lib/scanning-checks/issued-tickets-checks.ts:155-166

Scan Recording Invariants
- Staff user must be authenticated for scan recording; insert scan with result and isEntry flag; idempotent on conflict
  - Source: src/lib/scanning-checks/door-scanning-checks.ts:126-158

Card Linking (Physical ↔ Issued)
- Weeks must match unless special Week5→Week6 exception
  - Source: src/actions.ts:423-441
- Locations must match when physical has a location
  - Source: src/actions.ts:451-460
- Tiers must match unless (Week 5 both) or (Week5→Week6 case)
  - Source: src/actions.ts:463-473
- Only staff-authenticated users can link
  - Source: src/actions.ts:345-356
- Linking writes are recorded and link history is captured
  - Source: src/actions.ts:475-507
- Schema-enforced 1:1 linking (physicalCardId and issuedCardId unique)
  - Source: src/schema.ts:154-171

Authorization
- Door UI requires permission "org:maniac_cards:door"; otherwise Access Denied
  - Source: src/app/(internal)/team/door/layout.tsx:6-10

Stripe Webhook Invariants
- Idempotent order creation: skip if order for checkout session exists
  - Source: src/app/api/stripe/webhook/route.ts:60-71
- If checkout session has payment_method "installment-plan", create subscription schedule in connected account context
  - Source: src/app/api/stripe/webhook/route.ts:74-106
- On customer.subscription.deleted: find issuedTrip after a cutoff date and cancel trip, refund order; skip if it was a card
  - Source: src/app/api/stripe/webhook/route.ts:275-371

Misc Rules & Behaviors
- Always register scans (success or failure) with reason
  - Source: src/lib/scanning-checks/door-scanning-checks.ts:332-345 (called from checkAllTicketTypes)
- When Ticket Tailor ticket passes checks, attempt to mark as checked-in via external API (best-effort)
  - Source: src/lib/scanning-checks/door-scanning-checks.ts:380-390


