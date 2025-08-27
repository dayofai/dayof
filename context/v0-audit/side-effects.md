External Side-Effects (with references)

- Ticket Tailor API: mark ticket checked-in after successful validation (best-effort)
  - Source: src/lib/scanning-checks/door-scanning-checks.ts:380-390
- Scan Recording: insert scan records with isEntry/result/staff into DB; onConflictDoNothing
  - Source: src/lib/scanning-checks/door-scanning-checks.ts:126-158, 332-349
- Stripe (Checkout Sessions): creation for cards/trips, connected account context
  - Source: src/actions.ts:302-315 (cards/trips), 252-268 (cards params), 229-244 (trips params)
- Stripe (Webhook): subscription schedule creation, trip cancellation/refund flows
  - Source: src/app/api/stripe/webhook/route.ts:74-106, 275-371
- Clerk (Users): create/sync user for physical card activation
  - Source: src/actions.ts:976-1004 (upsert to DB), 979-987 (Clerk upsert)
- Passkit: enroll member and generate QR code image
  - Source: src/actions.ts:1080-1111
- Customer.io: identify and track "Card Activated" event
  - Source: src/actions.ts:1113-1144
- Linked Cards History: record link/unlink actions
  - Source: src/actions.ts:498-503 (link), 616-627 (unlink)


