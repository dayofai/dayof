# Product Panel — Non‑contract Notes (Implementation, Rationale, and References)

## Database & storage

### Revisions vs snapshots (snapshots now)

You can get far with snapshots only:

- On purchase, embed a product snapshot (and `variant` + `price` snapshots) in the order line.
- Optionally compute an ETag so you can dedupe identical snapshots later (and optionally store them in a snapshots table).
- ETag computation: canonicalize JSON (stable key order, normalized types), hash (SHA‑256). Include product id, variant id (if any), human fields (name/description/terms), policy knobs that affect what the buyer saw, and the resolved price.
- Pros: simple, legally safe, no authoring workflow today.
- Upgrade path: when you care about undo/draft/publish, add `product_revision`. Keep snapshotting on purchase regardless.

### Snapshots (Postgres 18; 5M rows target)

You’re fine with snapshots‑only for now. Two pragmatic options:

A) Snapshot table + pointer in order line (recommended)

- `product_snapshot (id, snapshot_hash, product_id, variant_id, price_id, created_at, payload_jsonb)`
- `order_line (…, product_snapshot_id)`
- Compute `snapshot_hash = SHA‑256(canonical_json(payload))` to dedupe identical payloads.
- Unique index on `snapshot_hash` ⇒ re‑use snapshot rows across orders.

B) Embed snapshot directly on each order line (simplest)

- `order_line (…, product_snapshot_jsonb)`
- Faster read, more storage. Good enough at your scale if you compress backups.

ETag / hash notes:

- Build the canonical JSON by stable key ordering; avoid floats; include: product id, variant id (if any), name, description, terms, policy knobs that affect what buyer sees, and the resolved price (amount + currency).
- Compute SHA‑256 in app or DB; store the hex as `snapshot_hash`.

Indexes & hygiene:

- Index `(created_at)` (for TTL/archival), `(product_id)` if you need back‑fills.
- Consider monthly partitioning by `created_at` once volume grows.
- JSONB will TOAST/compress; you don’t need to hand‑compress.

### Add‑ons DB shape (conceptual)

- `product (id, type)` where `type ∈ {ticket, addon, physical, digital, subscription}`
- `product_requirements (child_product_id, parent_product_id, scope)`
  - `scope`: `selection` (must be in the same cart) or `ownership` (must already own it)

## Server/client implementation details

### Effective preferences fetching and caching

- Treat `effectivePrefs` as a single JSON object, already merged server‑side.
- Query key guidelines for TanStack Query:
  - `['effectivePrefs', orgId, eventId]`
  - Add `'public'` or other context tags as needed, e.g., `['effectivePrefs', orgId, eventId, 'public']`
- Why one object?
  - Atomic, cacheable, and versionable (you can add a `version` field later for fast invalidation).
  - Can be split later without breaking the panel.

### Compute location boundaries (who does what)

- Panel never evaluates schedules; it only formats given timestamps.
- Panel does no policy math (status, demand capture, or clamping). Those come precomputed.
- Server computes pricing summary for the current selection; the panel renders it verbatim.

## Tooling & libraries

- Use `ts-pattern` with `.exhaustive()` to match `(product.type, status, demandCapture)` for compile‑time exhaustiveness.
- Use Jotai derived atoms (`atomFamily`, `atomWithReducer`) for selectors and flows.
- Validate payloads at the edges with Zod v4.
- External references informing patterns: Stripe docs, Martin Fowler on value objects.

## UI behavior & components

### Status → UI mapping (behavioral reference)

| `commercial.status` | `demandCapture` | Gates (met?)                         | Core UI behavior                                  |
| ------------------- | --------------- | ------------------------------------ | ------------------------------------------------- |
| `available`         | `none`          | ✅                                   | Price + quantity/selection + Get Ticket(s)        |
| `approvalRequired`  | `none`          | ✅                                   | Price + quantity/selection + Request to Join      |
| `outOfStock`        | `waitlist`      | ✅                                   | No price/qty; Join Waitlist notice + CTA          |
| `outOfStock`        | `none`          | ✅                                   | Non‑interactive Sold Out notice                   |
| `notOnSale`         | `none`          | n/a                                  | Non‑interactive; show SaleWindow hint if provided |
| `paused`            | `none`          | n/a                                  | Non‑interactive; Sales Paused notice              |
| `windowEnded`       | `none`          | n/a                                  | Non‑interactive; Sales window ended               |
| `expired`           | `none`          | n/a                                  | Past Event (terminal)                             |
| any                 | any             | ❌ & `visibilityWhenGated='visible'` | Show locked row + AccessCodeCTA / unlock drawer   |
| any                 | any             | ❌ & `visibilityWhenGated='hidden'`  | Suppress row entirely                             |

Small guardrails:

- When all tickets are sold out, tenant may show/hide the list; represent upstream via `context.effectivePrefs.showTypeListWhenSoldOut`.
- SingleTypePrice shows a price block without quantity; quantity control appears separately when allowed.
- DynamicNoticeGroup can be populated from `reasons` + prefs (e.g., low inventory threshold) without UI recomputing policy.

### Add‑on placement examples (layout guidance)

Sectioned (own section):

```json
{
  "relations": {
    "requires": { "scope": "selection", "anyOf": ["prod_ga"], "allOf": [] }
  },
  "display": { "placement": "section", "sectionId": "addons" }
}
```

Nested (as children of parent):

```json
{
  "relations": {
    "requires": { "scope": "selection", "anyOf": ["prod_ga"], "allOf": [] }
  },
  "display": { "placement": "children", "sectionId": "primary" }
}
```

## Business/domain rationale

- Keep variants as immutable SKUs (attributes/behavior); prices immutable (new Price for changes). Aligns with value‑object DDD and Stripe practices.
- Price lists map segment/region to Price IDs; promos apply at checkout/order scope.
- Rollouts are additive: create new Variant/Price, archive old; panel logic doesn’t change.
- Panel is a projection layer; engine is authoritative for status, reasons, demand capture, and limits.

## Tenant/config policy & roadmap

- Sections are not tenant configurable now. You can pass a one‑off `labelOverride` from the server if you need to rename “Add‑ons” later.
- Roadmap notes: add status→UI matrix page; standardize reason codes; finalize section labels.

## Meta/process & references

- What’s needed to finalize: section labels, standardized reason codes, fees note policy.
- Useful next moves: validate with realistic server payloads; fold add‑ons‑as‑children into examples.
- References: Stripe docs, Investopedia (backorder), Martin Fowler (value objects), `ts-pattern`, Jotai, Zod.

## Pricing computation specifics

Rules:

- Show fees note near the price only when `effectivePrefs.showFeesNote=true`.
- Footer shown via `pricing.showPriceSummary=true`; server computes full summary for the current selection; panel renders verbatim.

Notes:

- If fees/taxes are inclusive, set `inclusions.feesIncluded=true` and/or `taxesIncluded=true` and omit separate fee/tax lines (or include them as zero).
- For total‑only, return a summary with only a `total` line.
- Simple vs detailed is a server decision (`mode`). Panel may reveal schedule when `mode='detailed'`.

## Time & formatting guidance

- All timestamps in payload are UTC ISO. Panel formats using `context.displayTimezone` and `context.locale`.
- No schedule math in the panel.

## Preferences mechanics

- Pass `effectivePrefs` as a single merged JSON object.
- Caching/versioning tips: stable query key; optional `version` field for fast invalidation.

## Debug/observability

- Keep raw vs effective preferences optional for debugging.
- Provide remaining components (`remaining.inventory`, etc.) alongside `maxSelectable` for transparent hints without moving policy into UI.

## A11y/copy micro‑decisions

- Use DynamicNotice for reasons; use hint microcopy for limits and sales windows.

## PDF‑derived UI notes

- Axes (Types Available, Types per Order, Tickets per Type) and specific states (Sold Out with Waitlist, Past Event, Access Code CTA/Drawer) informed the mapping and examples.
