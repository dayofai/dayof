# Product Panel Spec Working Updates

> ## **QUESTION 3**
>
> "Keeps CTA logic out of the client; aligns with the PDF’s global button behavior across panel types." I don't necessarily want to keep _all_ logic out of the client... That's why we have derived atoms and stuff. What I had hoped what that my panel could consume the event and ticket types and determine it's own state (though I guess that's now split between "panel on server" and "panel on client".
>
> Another question I have is how do we pass "access code" undated types to the client? we don't want those to be on the client until unlocked...

---

> ## **RESPONSE 3**

## TL;DR: Three Contract Additions

The panel can have _brains_ (derived atoms) without being the _policy engine_. Here's the clean split, plus three explicit contract additions to handle panel-level rules and access-code security:

### ✅ 1. `context.orderRules` – Panel selection model

Server-authoritative rules that let atoms drive UX without guessing:

```ts
context.orderRules: {
  types: "single" | "multiple",           // single type panel vs multi-type
  typesPerOrder: "single" | "multiple",   // can mix types in one order?
  ticketsPerType: "single" | "multiple",  // multi-quantity per type?
  minSelectedTypes: number,               // 1 = must select at least one type
  minTicketsPerSelectedType: number       // 1 = single-type panel defaults to 1
}
```

**Why:** Covers the PDF's panel-type matrix (single vs multi types, single vs multi per type) and "defaults to 1" vs "can be 0" behaviors. Atoms compose these rules locally without doing policy math.

### ✅ 2. `context.gatingSummary` – Access-code flow without leakage

Panel-level hint for hidden gated items:

```ts
context.gatingSummary: {
  hasAccessCode: boolean,         // event uses access codes
  hasHiddenGatedItems: boolean    // at least one omitted item exists pre-unlock
}
```

**Why:** Lets atoms show **AccessCodeCTA** when `hasHiddenGatedItems=true` without leaking SKU names, counts, or prices. Matches PDF's "show Sold Out + AccessCodeCTA → reveal upon unlock" pattern.

**Note:** Messaging for access-code prompts is handled via `context.panelNotices` (see response-4) rather than a `reasonCode` field here.

### ✅ 3. `gating.listingPolicy` – Omit vs show locked

Replaces `visibilityPolicy` with explicit sendability:

```ts
gating.listingPolicy: "visible_locked" | "omit_until_unlocked"
```

**Why:**

- **`visible_locked`**: Ship the row, show lock icon, mask price (tease the SKU)
- **`omit_until_unlocked`**: Don't ship the row at all pre-unlock (zero leakage)

Server decides if a locked item is even sent; client never sees omitted items until unlock.

---

## 1) Where logic lives (pragmatic split)

**Safe in the client (derived atoms = view logic):**

- Bottom CTA enable/disable based on **server facts** (`temporal.phase`, `supply.status`, `gating.satisfied`, `orderRules`, current selection).
- Default quantity and selection (0 vs 1) using **panel‑level rules** (`orderRules`, see §2).
- Label decisions (“Get Ticket” vs “Get Tickets”), pluralization, tiny UX affordances.
- DynamicNotice **rendering & ordering** when the server provides notices; optional _fallback_ notices (e.g., “No selection yet”) that don’t require computing business truth.

**Authoritative on the server:**

- Gates (validation, windows, limits), schedule math (`phase`), availability decision (`status='available' | 'none'`), and clamps (`maxSelectable`).
- Whether a SKU is even _sendable_ to the client (omitted vs visible locked).
- Pricing math and price modes (`fixed/free/donation/hidden`).
  These expectations come straight from the TicketPanel variants in the PDF (e.g., when to disable CTA if only gated options remain; different panel defaults for single vs multi types).

---

## 2) Panel rules so atoms can decide UX without guessing

The PDF encodes panel‑level rules like **Types**, **Types per Order**, **Tickets per Type**, and different **defaults** (e.g., single‑type defaults to quantity=1; multi‑type allows 0). Let's keep those rules **server‑authored**, then let atoms compose them.

### Full Schema Addition

Add to `ContextSchema`:

```ts
// Authoritative panel-level order rules (no client math)
export const OrderRulesSchema = z.object({
  types: z.enum(["single", "multiple"]).default("multiple"),
  // ^ Does this event have a single ticket type or multiple types?

  typesPerOrder: z.enum(["single", "multiple"]).default("multiple"),
  // ^ Can a customer mix multiple types in one order?
  // "single" = radio button behavior (select one type only)
  // "multiple" = checkbox behavior (select multiple types)

  ticketsPerType: z.enum(["single", "multiple"]).default("multiple"),
  // ^ Can a customer select multiple tickets of the same type?
  // "single" = selecting a type adds exactly 1 to cart
  // "multiple" = show quantity stepper

  minSelectedTypes: z.number().int().nonnegative().default(0),
  // ^ Minimum number of types that must be selected for valid order
  // 0 = can proceed with no selection (CTA disabled until selection made)
  // 1 = must select at least one type (for single-type panels, auto-select it)

  minTicketsPerSelectedType: z.number().int().nonnegative().default(0),
  // ^ Minimum quantity per type once that type is selected
  // 0 = can select a type without specifying quantity (multi-type panels)
  // 1 = selecting a type defaults to qty=1 and cannot be 0 (single-type panels)
});

export const ContextSchema = z.object({
  // ...existing fields...
  orderRules: OrderRulesSchema.default({
    types: "multiple",
    typesPerOrder: "multiple",
    ticketsPerType: "multiple",
    minSelectedTypes: 0,
    minTicketsPerSelectedType: 0,
  }),
  // ...
});
```

### Why These Fields Matter

| Field                       | Example Value | Drives This Behavior                                               |
| --------------------------- | ------------- | ------------------------------------------------------------------ |
| `types`                     | `"single"`    | Event has only one ticket type (no type selection UI needed)       |
| `types`                     | `"multiple"`  | Event has multiple types (show type selector)                      |
| `typesPerOrder`             | `"single"`    | Radio button selection; choosing type B deselects type A           |
| `typesPerOrder`             | `"multiple"`  | Checkbox selection; can add both GA and VIP to cart                |
| `ticketsPerType`            | `"single"`    | Selecting a type = adding 1 unit (no stepper needed)               |
| `ticketsPerType`            | `"multiple"`  | Show quantity stepper for each type                                |
| `minSelectedTypes`          | `1`           | Auto-select the only type (single-type panel) or require selection |
| `minSelectedTypes`          | `0`           | Allow browsing without selection; CTA disabled until user picks    |
| `minTicketsPerSelectedType` | `1`           | Default qty=1 when type selected; can't reduce to 0                |
| `minTicketsPerSelectedType` | `0`           | Allow qty=0 (multi-type: can select types without committing qty)  |

### Common Panel Configurations

**Single-type panel (e.g., one GA ticket only):**

```ts
{
  types: "single",
  typesPerOrder: "single",
  ticketsPerType: "multiple",
  minSelectedTypes: 1,        // auto-select it
  minTicketsPerSelectedType: 1  // default to qty=1, can't be 0
}
```

**Multi-type panel, single type per order (e.g., GA _or_ VIP, not both):**

```ts
{
  types: "multiple",
  typesPerOrder: "single",
  ticketsPerType: "multiple",
  minSelectedTypes: 0,        // user must choose
  minTicketsPerSelectedType: 0  // can browse without qty
}
```

**Multi-type panel, mix allowed (e.g., GA + VIP together):**

```ts
{
  types: "multiple",
  typesPerOrder: "multiple",
  ticketsPerType: "multiple",
  minSelectedTypes: 0,
  minTicketsPerSelectedType: 0
}
```

This mirrors the PDF's panel matrix and "CTA disabled if 0 selected" behavior, but atoms do the UI math locally.

**Atom sketch (client):**

```ts
const orderRulesAtom = atom((get) => payload.context.orderRules);
const visibleRowsAtom = atom((get) =>
  rows.filter((r) => r.presentation !== "suppressed")
);
const selectionValidAtom = atom((get) => {
  const rules = get(orderRulesAtom);
  const sel = get(selectionAtom); // map of variantId -> qty
  const typesSelected = Object.keys(sel).length;
  const ticketsSelectedPerType = Object.values(sel).every(
    (qty) => qty >= rules.minTicketsPerSelectedType
  );
  return typesSelected >= rules.minSelectedTypes && ticketsSelectedPerType;
});
const anyPurchasableAtom = atom((get) =>
  get(visibleRowsAtom).some(
    (r) => r.presentation === "normal" && r.cta.kind === "purchase"
  )
);
const bottomCtaEnabledAtom = atom(
  (get) => get(selectionValidAtom) && get(anyPurchasableAtom)
);
```

---

## 3) Shipping **access‑code gated** types without leaking them

The PDF shows two valid behaviors:

1. **Show "Sold Out" to public + AccessCode CTA**, and only reveal gated items _after_ unlock.
2. **Show gated items as locked** with price masked (tease the existence).

Both are explicitly mentioned (the first is highlighted in the PDF notes). To support both safely without leaking SKU details:

### A) Gating schema updates: `listingPolicy` field

**Replace `visibilityPolicy`** with `listingPolicy` to make server sendability explicit:

```ts
// Updated gating schema (item-level)
const GatingSchema = z.object({
  required: z.boolean().default(false),
  // ^ Does this item require gate satisfaction to purchase?

  satisfied: z.boolean().default(true),
  // ^ Has the user satisfied all gate requirements? (server-computed)

  listingPolicy: z
    .enum([
      "visible_locked", // send item to client; show locked row with masked price
      "omit_until_unlocked", // do NOT send item to client until gate satisfied
    ])
    .default("visible_locked"),
  // ^ Server decision: should this locked item be sent at all?

  requirements: z.array(GatingRequirementSchema).default([]),
  // ^ What gates apply (unlock_code, membership, etc.)

  reasons: z.array(z.string()).default([]),
  // ^ Why gated: ["requires_code", "code_expired", etc.]
});
```

### B) Panel-level gating summary: `gatingSummary`

Add panel-level context so atoms can show **AccessCodeCTA** without knowing what's hidden:

```ts
// Panel-level gating summary (in context)
export const GatingSummarySchema = z.object({
  hasAccessCode: z.boolean().default(false),
  // ^ Does this event use access codes at all?

  hasHiddenGatedItems: z.boolean().default(false),
  // ^ Are there items with listingPolicy="omit_until_unlocked" that weren't sent?
  // True = show AccessCodeCTA even if visible items are sold out

  // Note: Messaging for access codes is handled via context.panelNotices,
  // not a reasonCode field here. This keeps gatingSummary as pure facts.
});

export const ContextSchema = z.object({
  // ...existing fields...
  gatingSummary: GatingSummarySchema.default({
    hasAccessCode: false,
    hasHiddenGatedItems: false,
  }),
  // ...
});
```

### C) Server logic for omitted items

**Server rule:**

```ts
// Pseudocode: when assembling panel payload
const omittedItems = [];
for (const item of allItems) {
  if (
    item.gating.required &&
    !item.gating.satisfied &&
    item.gating.listingPolicy === "omit_until_unlocked"
  ) {
    // DO NOT include in payload.items[]
    omittedItems.push(item);
    continue;
  }

  // Otherwise send the item (locked or normal)
  payload.items.push(item);
}

// Set gatingSummary flags
const anyOmittedItemHasStock = omittedItems.some(
  (item) => item.state.supply.status === "available"
);
context.gatingSummary.hasHiddenGatedItems =
  omittedItems.length > 0 && anyOmittedItemHasStock;

// Critical: If ALL items (visible + hidden) are sold out,
// hasHiddenGatedItems should be false to suppress AccessCodeCTA
const allItemsSoldOut =
  payload.items.every((item) => item.state.supply.status === "none") &&
  omittedItems.every((item) => item.state.supply.status === "none");

if (allItemsSoldOut) {
  context.gatingSummary.hasHiddenGatedItems = false;
}
```

**Zero leakage:** The client never sees SKU name, price, count, or even existence of omitted items.

**Sold-out + gating behavior:** When all products (including gated ones) are sold out, `hasHiddenGatedItems` is `false`, preventing a useless access code prompt.

### D) Client atom behavior

Atoms decide to render **AccessCodeCTA** when hidden items exist:

```ts
const showAccessCodeCtaAtom = atom((get) => {
  const { gatingSummary } = get(payloadAtom).context;
  return gatingSummary.hasHiddenGatedItems;
});
```

This matches the PDF's "AccessCodeCTA when public sees Sold Out" pattern—no SKU details leaked.

### B) Unlock flow (no leakage)

1. **Initial GET** → payload **without** the gated items; `context.gatingSummary.hasHiddenGatedItems = true`.
2. **POST /events/:id/panel/unlock** with `{ code }`

   - Server validates, rate limits, etc.
   - Returns `{ gatingToken, notices?, reasons? }`.

3. **GET panel with gatingToken** → payload now **includes** previously omitted items, with `gating.satisfied=true` and normal `listingPolicy` (or it can remain `omit_until_unlocked`—doesn’t matter once satisfied).
4. Client updates view; derived atoms recompute purchasability and CTA state.

No counts, names, or prices of gated items are exposed until step 3. Rate limiting/Turnstile stays server‑side (the PDF calls this out implicitly under security concerns like “too many attempts”).

**Pre‑unlock example (no gated items shipped):**

```jsonc
{
  "context": {
    "gatingSummary": {
      "hasAccessCode": true,
      "hasHiddenGatedItems": true
    },
    "panelNotices": [
      {
        "code": "requires_code",
        "scope": "panel",
        "severity": "info",
        "text": "Enter access code to view tickets.",
        "action": { "kind": "open_drawer", "target": "access_code" },
        "priority": 90
      }
    ]
  },
  "items": [
    /* only public types here, possibly all out-of-stock so panel shows Sold Out + AccessCodeCTA */
  ]
}
```

**Integration with response-4:** The `panelNotices` array (from response-4) provides the messaging, while `gatingSummary` (from response-3) provides the boolean facts atoms use for logic.

**Post‑unlock example (gated items revealed):**

```jsonc
{
  "context": {
    "gatingSummary": { "hasAccessCode": true, "hasHiddenGatedItems": false },
    "panelNotices": [] // access-code notice removed after unlock
  },
  "items": [
    ,
    /* public items... */ {
      "product": {
        "id": "prod_members",
        "type": "ticket",
        "name": "Members Only"
      },
      "state": {
        "gating": {
          "required": true,
          "satisfied": true,
          "listingPolicy": "omit_until_unlocked"
        },
        "temporal": { "phase": "during" },
        "supply": { "status": "available" },
        "demandCapture": { "kind": "none" },
        "microcopy": [
          {
            "code": "unlocked_via_code",
            "placement": "row.under_title",
            "severity": "info",
            "text": "Unlocked with your access code",
            "priority": 100
          }
        ]
      },
      "commercial": { "maxSelectable": 2 }
    }
  ]
}
```

**Integration with response-4:** Newly revealed items can include row-level `state.microcopy` (from response-4) to confirm unlock success. This provides visual feedback that the access code worked.

---

## 4) Bottom‑CTA behavior when only gated remains

The PDF calls out: **“CTA disabled if access gated and no other tickets are available other than the gated ones.”** Your atoms can compute that using only the **facts** above—no hidden heuristics:

```ts
const onlyGatedRemainingAtom = atom((get) => {
  const rows = get(visibleRowsAtom);
  const anyPurchaseable = rows.some(
    (r) => r.presentation === "normal" && r.cta.kind === "purchase"
  );
  const hasHiddenGated =
    get(payloadAtom).context.gatingSummary.hasHiddenGatedItems;
  return !anyPurchaseable && hasHiddenGated; // i.e., gating is the only route to purchase
});

const bottomCtaEnabledAtom = atom(
  (get) =>
    get(selectionValidAtom) &&
    get(anyPurchasableAtom) &&
    !get(onlyGatedRemainingAtom)
);
```

This exactly matches the behavior shown across the panel types in the PDF, while staying purely presentational.

---

## 5) Two quick options for _visibility_ policy (pick per SKU)

- **`visible_locked` (tease the SKU):** Ship the row, show a lock, mask price, and surface an item‑level `DynamicNotice` → “Enter access code.”
- **`omit_until_unlocked` (no leakage):** Don’t ship the row pre‑unlock; panel shows AccessCodeCTA only.
  Both modes appear in the PDF’s flows; choose default at the product level and override per event if needed.

---

## 6) Minimal diffs to v0.3

- Replace `gating.visibilityPolicy` with `gating.listingPolicy: 'visible_locked' | 'omit_until_unlocked'`.
- Add `context.orderRules` (so atoms can handle defaults and 0/1 behaviors cleanly).
- Add `context.gatingSummary` (to show AccessCodeCTA without leaking SKUs).
- Keep your existing access‑code **reason codes** and **DynamicNotice** wiring; just emit a panel‑level notice pre‑unlock.

---

## 7) Why this balances power + safety

- The **server** still decides truth (what exists, what’s purchasable, whether gates are satisfied).
- The **client** decides UX (CTA enabled/disabled, quantity defaults, how to present states), using explicit, compact rules—no schedule math, no capacity math.
- **Hidden gated items never reach the client** until unlock, satisfying your non‑leak requirement while matching the PDF’s “show sold out + AccessCodeCTA → reveal upon unlock” narrative.

---

---

## 8) Complete Contract Changes Summary

Here's the full set of schema additions and replacements to implement all three enhancements:

### Schema Additions (to `ContextSchema`)

```ts
import * as z from "zod";

// ============================================================================
// 1. ORDER RULES (panel selection model)
// ============================================================================
export const OrderRulesSchema = z.object({
  types: z.enum(["single", "multiple"]).default("multiple"),
  typesPerOrder: z.enum(["single", "multiple"]).default("multiple"),
  ticketsPerType: z.enum(["single", "multiple"]).default("multiple"),
  minSelectedTypes: z.number().int().nonnegative().default(0),
  minTicketsPerSelectedType: z.number().int().nonnegative().default(0),
});

// ============================================================================
// 2. GATING SUMMARY (panel-level access-code state)
// ============================================================================
export const GatingSummarySchema = z.object({
  hasAccessCode: z.boolean().default(false),
  hasHiddenGatedItems: z.boolean().default(false),
  // Note: Access-code messaging handled via context.panelNotices (response-4)
});

// ============================================================================
// Update ContextSchema
// ============================================================================
export const ContextSchema = z.object({
  eventId: z.string().min(1),
  displayTimezone: z.string().min(1),
  locale: z.string().min(2),
  eventAllOutOfStock: z.boolean().optional(),
  effectivePrefs: EffectivePrefsSchema,

  // NEW: Panel selection rules
  orderRules: OrderRulesSchema.default({
    types: "multiple",
    typesPerOrder: "multiple",
    ticketsPerType: "multiple",
    minSelectedTypes: 0,
    minTicketsPerSelectedType: 0,
  }),

  // NEW: Panel-level gating summary
  gatingSummary: GatingSummarySchema.default({
    hasAccessCode: false,
    hasHiddenGatedItems: false,
  }),
});
```

### Schema Changes (to `GatingSchema`)

```ts
// ============================================================================
// 3. LISTING POLICY (replaces visibilityPolicy)
// ============================================================================
const GatingSchema = z.object({
  required: z.boolean().default(false),
  satisfied: z.boolean().default(true),

  // CHANGED: Replace visibilityPolicy with listingPolicy
  listingPolicy: z
    .enum(["visible_locked", "omit_until_unlocked"])
    .default("visible_locked"),
  // REMOVED: visibilityPolicy: z.enum(["visible", "hidden"])

  requirements: z.array(GatingRequirementSchema).default([]),
  reasons: z.array(z.string()).default([]),
});
```

---

## 9) Implementation Checklist

### Server-Side Changes

- [ ] **Add `orderRules` to context**

  - [ ] Determine panel type from event ticket configuration
  - [ ] Set `types: "single"` if event has exactly one purchasable product
  - [ ] Set `typesPerOrder: "single"` if business rules forbid mixing types
  - [ ] Set `minSelectedTypes: 1` for single-type panels (auto-select)
  - [ ] Set `minTicketsPerSelectedType: 1` for single-type panels (default qty)

- [ ] **Add `gatingSummary` to context**

  - [ ] Set `hasAccessCode: true` if event has any gated products
  - [ ] Set `hasHiddenGatedItems: true` if any items omitted due to unsatisfied gates
  - [ ] Emit corresponding `panelNotices` entry for access-code messaging (see response-4)

- [ ] **Replace `visibilityPolicy` with `listingPolicy`**

  - [ ] Update schema: `visibilityPolicy` → `listingPolicy`
  - [ ] Update enum values: `"visible"` → `"visible_locked"`, `"hidden"` → `"omit_until_unlocked"`
  - [ ] Implement omission logic: filter out items with `required && !satisfied && listingPolicy === "omit_until_unlocked"`

- [ ] **Access-code unlock endpoint**

  - [ ] Create `POST /events/:id/panel/unlock` endpoint
  - [ ] Validate access code, check windows/limits
  - [ ] Return short-lived `gatingToken` on success
  - [ ] Implement rate limiting + Turnstile protection

- [ ] **Panel payload with token**
  - [ ] `GET /events/:id/panel?gatingToken=...`
  - [ ] Include previously omitted items when token validates
  - [ ] Set `gating.satisfied: true` for unlocked items

### Client-Side Changes

- [ ] **Update schemas**

  - [ ] Add `OrderRulesSchema` to schemas file
  - [ ] Add `GatingSummarySchema` to schemas file
  - [ ] Update `GatingSchema` (listingPolicy field)
  - [ ] Add fields to `ContextSchema`

- [ ] **Create derived atoms for orderRules**

  - [ ] `orderRulesAtom` – read from context
  - [ ] `selectionValidAtom` – check min types/tickets against current selection
  - [ ] Update quantity stepper defaults based on `minTicketsPerSelectedType`
  - [ ] Implement type selection constraints based on `typesPerOrder`

- [ ] **Create derived atoms for gating**

  - [ ] `showAccessCodeCtaAtom` – return `gatingSummary.hasHiddenGatedItems`
  - [ ] `onlyGatedRemainingAtom` – check if no normal purchase options exist
  - [ ] `bottomCtaEnabledAtom` – compose selection valid + has purchasable + not only-gated-remaining

- [ ] **Update row presentation mapping**

  - [ ] Handle `listingPolicy` in presentation logic (locked vs suppressed)
  - [ ] Rows with `omit_until_unlocked` should never appear (server-filtered)

- [ ] **Implement AccessCodeCTA component**

  - [ ] Show when `showAccessCodeCtaAtom` is true
  - [ ] Open drawer/modal for code entry
  - [ ] POST to unlock endpoint
  - [ ] Refresh panel with gatingToken on success

- [ ] **Update fixtures/Storybook**
  - [ ] Add fixture with single-type panel config
  - [ ] Add fixture with multi-type, single-per-order config
  - [ ] Add fixture with hidden gated items (test AccessCodeCTA)
  - [ ] Add fixture with visible locked items

---

## 10) Migration Notes

### Breaking Changes

- **`gating.visibilityPolicy`** is replaced by **`gating.listingPolicy`**
  - Old: `"visible"` | `"hidden"`
  - New: `"visible_locked"` | `"omit_until_unlocked"`
  - Migration: `"visible"` → `"visible_locked"`, `"hidden"` → `"omit_until_unlocked"`

### Backward Compatibility

- **New fields have defaults** – existing payloads will validate:
  - `orderRules` defaults to multi-type, multi-per-order behavior
  - `gatingSummary` defaults to no access codes
  - `listingPolicy` defaults to `"visible_locked"` (existing visible behavior)

### Recommended Rollout

1. **Phase 1: Add new fields** (backward compatible)

   - Add `orderRules`, `gatingSummary` with defaults
   - Keep `visibilityPolicy` alongside new `listingPolicy`
   - Deploy server + client

2. **Phase 2: Populate new fields** (data migration)

   - Backfill `orderRules` for existing events
   - Set `gatingSummary` for events with access codes
   - Populate `listingPolicy` from `visibilityPolicy`

3. **Phase 3: Cut over atoms** (client update)

   - Switch atoms to read new fields
   - Validate behavior in Storybook + staging

4. **Phase 4: Remove old field** (breaking, optional)
   - Remove `visibilityPolicy` from schema
   - Clean up migration code

---

## 11) Why This Design Scales

### Atoms Stay Presentational

- **No business math**: Atoms compose server facts but never recompute gates, schedules, or availability
- **Pure view mapping**: `orderRules` → UI defaults, `gatingSummary` → show CTA, `listingPolicy` → omit vs lock
- **Easy testing**: Toggle server facts, atoms derive presentation deterministically

### Security by Design

- **Zero leakage**: Omitted items never touch the client; no scraping, no hints
- **Token-based unlock**: Short-lived tokens prevent replay attacks
- **Rate limiting**: Server-side protection against brute force
- **Clear boundaries**: Server decides sendability, client decides placement

### Flexible Panel Types

- **Single-type panels**: `minSelectedTypes: 1` auto-selects, `minTicketsPerSelectedType: 1` defaults qty
- **Multi-type panels**: Both mins set to 0, CTA disabled until selection
- **Radio vs checkbox**: `typesPerOrder: "single"` vs `"multiple"` drives interaction model
- **Future-proof**: Add `maxTypesPerOrder` later if needed without breaking atoms

### Access-Code Flows

- **Visible locked**: Tease the SKU, mask price, show lock icon (marketing benefit)
- **Hidden until unlock**: Complete omission, AccessCodeCTA replaces type list (scarcity benefit)
- **Per-SKU control**: Mix visible and hidden locked items in same event
- **Panel-level CTA**: `gatingSummary.hasHiddenGatedItems` drives messaging without coupling to item details

---

## Next Steps

### Quick Wins (Day 1)

1. Add schemas to contracts file
2. Wire basic atoms (`orderRulesAtom`, `showAccessCodeCtaAtom`)
3. Update Storybook fixtures with new fields

### Core Implementation (Week 1)

1. Implement server omission logic for `omit_until_unlocked`
2. Build unlock endpoint with rate limiting
3. Create `selectionValidAtom` and wire to bottom CTA
4. Build AccessCodeCTA component

### Polish & Testing (Week 2)

1. Add all panel-type fixtures (single, multi, radio-select)
2. Test hidden → revealed flow end-to-end
3. Validate quantity defaults match PDF spec
4. Load test unlock endpoint

---

### Recommended Defaults

**For most events:**

```ts
orderRules: {
  types: "multiple",
  typesPerOrder: "multiple",
  ticketsPerType: "multiple",
  minSelectedTypes: 0,
  minTicketsPerSelectedType: 0
}
```

**For single-type events:**

```ts
orderRules: {
  types: "single",
  typesPerOrder: "single",
  ticketsPerType: "multiple",
  minSelectedTypes: 1,
  minTicketsPerSelectedType: 1
}
```

**For access-gated events:**

```ts
gating: {
  listingPolicy: "omit_until_unlocked"  // secure default
}

gatingSummary: {
  hasAccessCode: true,
  hasHiddenGatedItems: true  // computed server-side
}

// Use panelNotices for messaging (response-4 integration)
panelNotices: [
  {
    code: "requires_code",
    scope: "panel",
    text: "Enter access code to view tickets.",
    action: { kind: "open_drawer", target: "access_code" }
  }
]
```

---

## 12) Integration with Response-4 (Notices & Microcopy)

Response-3 and response-4 are **designed to work together**. Here's how they integrate:

### Response-3 Provides Facts, Response-4 Provides Messaging

**Response-3 (server-authoritative facts):**

- `orderRules` → panel selection constraints
- `gatingSummary` → boolean flags for access-code state
- `listingPolicy` → whether items are sent to client

**Response-4 (presentation layer):**

- `panelNotices` → banner messaging (uses facts from response-3)
- `state.microcopy` → row-level inline text (server-driven)
- `clientCopy` → selection-reactive hints (client-driven, uses facts from response-3)
- `badgeDetails` → progressive disclosure (tooltips/hovercards)

### Key Integration Points

#### 1. Access-Code Flow

```jsonc
// Response-3 facts
{
  "context": {
    "gatingSummary": {
      "hasAccessCode": true,
      "hasHiddenGatedItems": true
    }
  }
}

// Response-4 messaging
{
  "context": {
    "panelNotices": [
      {
        "code": "requires_code",
        "scope": "panel",
        "text": "Enter access code to view tickets.",
        "action": { "kind": "open_drawer", "target": "access_code" }
      }
    ]
  }
}

// Client atom (combines both)
const showAccessCodeCtaAtom = atom((get) => {
  // Use response-3 fact for logic
  return get(payloadAtom).context.gatingSummary.hasHiddenGatedItems;
});

// DynamicNotice component renders response-4 panelNotices
```

#### 2. Selection Validation

```jsonc
// Response-3 rules
{
  "context": {
    "orderRules": {
      "typesPerOrder": "single",
      "minTicketsPerSelectedType": 1
    }
  }
}

// Response-4 client-driven messages
{
  "context": {
    "clientCopy": {
      "selection_max_types": "You can only choose one type.",
      "quantity_min_reached": "Minimum is {min}."
    }
  }
}

// Client atom (uses response-3 rules to trigger response-4 messages)
const selectionErrorAtom = atom((get) => {
  const rules = get(orderRulesAtom);
  const selection = get(selectionAtom);

  if (rules.typesPerOrder === "single" && Object.keys(selection).length > 1) {
    return get(payloadAtom).context.clientCopy.selection_max_types;
  }
  // ... other validations
});
```

#### 3. Post-Unlock Confirmation

```jsonc
// Response-3: item revealed after unlock
{
  "items": [
    {
      "product": { "name": "Members Only" },
      "state": {
        "gating": { "satisfied": true },

        // Response-4: row-level microcopy confirms unlock
        "microcopy": [
          {
            "code": "unlocked_via_code",
            "placement": "row.under_title",
            "text": "Unlocked with your access code"
          }
        ]
      }
    }
  ]
}
```

### Summary: Clean Separation of Concerns

| Layer                      | Responsibility                             | Source             |
| -------------------------- | ------------------------------------------ | ------------------ |
| **Facts**                  | orderRules, gatingSummary, listingPolicy   | Response-3         |
| **Server Messaging**       | panelNotices, state.microcopy, reasonTexts | Response-4         |
| **Client Messaging**       | clientCopy (selection/validation errors)   | Response-4         |
| **Progressive Disclosure** | badgeDetails, tooltips, hovercards         | Response-4         |
| **Atom Logic**             | Compose facts → presentation decisions     | Client (uses both) |

**No conflicts, no redundancy.** Response-3 provides authoritative facts; response-4 provides the presentation layer. Atoms bridge them with pure view logic.

**Key changes from initial proposals:**

- ✅ Removed `gatingSummary.reasonCode` (redundant with `panelNotices[].code`)
- ✅ Added row-level `state.microcopy` to unlock flow (confirm unlock success)
- ✅ Cross-referenced response-3 facts with response-4 messaging throughout

---

> ## **QUESTION 4**
>
> There’s a different between the DynamicNotice component, hints (as data), and microcopyHint (display component?), and badges, and Tooltips, and maybe a HoverCard (for something like Payment Plan examples or details in the ProductPanel) DynamicNotice isn’t so much dynamic on the client side… e.g. I never intended for it to change if a ticket is selected. Things related to a specific ticket type should show in the ticket card as microcopy (available until, qty remaining, etc.). I thought if DynamicNotice as a top level “important context delivering component” like a banner on a website. e.g. we want you to specifically know there are only 31 tickets _total_ left for this event, or we really want to call attention to the fact that there’s only one hour left to purchase. How do we best structure and account for this? Where we can define some standard message templates and also allow for overrides? Additionally there are some microcopy that’s not a hint per-se but is a message that appears below e.g. the quantity selector when you hit a maximum or something. I guess those can still be called hints? They are driven by client side state.

---

> ## RESPONSE 4

Below is a crisp model that separates **DynamicNotice** (top‑level banner), **Hints (data)**, **Microcopy** (inline messages), **Badges**, **Tooltips**, and **HoverCards**, and shows how to standardize templates with overrides—without making the client do business math.

> The PDF’s screens expect a banner‑style “DynamicNotice” at the panel level (Sold Out, Past Event, Event Full + Waitlist), optional hints near controls (limits, sale window), and little pills/badges (Payment Plan). Let’s reflect that explicitly.

---

## 0) TL;DR taxonomy

- **DynamicNotice** = **panel‑level banner(s)**.
  Authoritative, server‑driven. Not reactive to row selection. Think: “Only 31 tickets left for this event” or “One hour left to purchase.” (Top of panel, like a website banner).

- **Hints (data)** = **facts** the server gives (remaining counts, limits, window metadata). The client **can** turn hints into microcopy or badges, but never recomputes truth.

- **Microcopy** = **inline, small text** inside a row or near a control.
  Two sources:

  1. **Server‑driven microcopy** (static with respect to selection): “Sales end Oct 25, 11:59 PM CT”, “Pick up at venue.”
  2. **Client‑driven microcopy** (reacts to selection): “Max 6 per order,” “You’ve hit the limit,” etc.

- **Badges** = **chips/pills** that tag an item. Small, scannable: “Popular”, “Payment Plan”.

- **Tooltips / HoverCards** = **progressive disclosure**. Tooltip = short, one‑liner. HoverCard = longer explainers (e.g., payment plan details). The PDF explicitly calls out Payment Plan explanations; this is a perfect HoverCard target.

---

## 1) Contract surfaces (clean, additive to v0.3)

### A) DynamicNotice (panel banner)

Server composes **ready‑to‑render** messages; client only renders and orders.

```ts
// --- Message templates ---
export const MessageTemplateSchema = z.object({
  key: z.string(), // e.g., "event_total_remaining"
  template: z.string(), // ICU-ish: "Only {count} {noun} left for this event."
  // Optional: per-locale overrides if you don’t want to ship a global registry
  localeTemplates: z.record(z.string(), z.string()).optional(),
});

// --- Notice payload (panel banner) ---
export const NoticeActionSchema = z.object({
  kind: z.enum(["open_drawer", "open_url", "copy", "none"]).default("none"),
  target: z.string().optional(), // "waitlist_drawer" | "access_code" | URL
  label: z.string().optional(),
});

export const NoticeSchema = z.object({
  code: z.string(), // machine code, e.g., "all_types_out_of_stock"
  scope: z.literal("panel"), // DynamicNotice is panel-level
  severity: z.enum(["info", "warning", "error", "neutral"]).default("info"),
  title: z.string().optional(), // if omitted, client can derive from templates[code]
  text: z.string().optional(), // server-rendered string (wins over template)
  params: z.record(z.string(), z.unknown()).default({}), // for templates
  action: NoticeActionSchema.optional(),
  priority: z.number().int().default(0),
  expiresAt: z.iso.datetime().optional(), // optional TTL
});

export const ContextSchema = z.object({
  // ...existing...
  panelNotices: z.array(NoticeSchema).default([]),
  copyTemplates: z.array(MessageTemplateSchema).default([]), // registry (optional)
});
```

**Why:** You wanted standard templates **and** overrides. The `copyTemplates` registry sets the default text; each `Notice` may provide `text` to override. The client never computes “one hour left”—the server either populates `text` directly or uses `params` + `template`. The PDF’s **Event Full + Waitlist Enabled** and **Sold Out** flows map 1:1 to these banners.

### Examples

- “Only 31 tickets left for this event” → `{ code: "event_total_remaining", params: { count: 31, noun: "tickets" } }`
- “One hour left to purchase” → `{ code: "sale_window_final", text: "One hour left to purchase." }`
- “Sold Out” + **Join Waitlist** → `{ code: "all_types_out_of_stock", action: { kind: "open_drawer", target: "waitlist", label: "Join Waitlist" } }`

---

### B) Hints (data) → Microcopy (inline)

Keep **facts** on the server; let the **client choose placement** and show/hide behaviors—but never recompute truth.

**You already have the right raw facts**:

- `state.temporal.currentWindow/nextWindow` → sale dates
- `state.supply.remaining.count` → remaining
- `commercial.limits.perOrder/perUser` → limits
- `product.fulfillment` → pickup/shipping, channels
  All of these show up as “SaleWindowHint”, “LimitsHint”, or “Tickets remaining” in the PDF.

Add a thin, optional layer to pre‑assemble common microcopy so there’s no ambiguity:

```ts
// --- Optional precomposed microcopy (server-authored) ---
export const MicrocopyMessageSchema = z.object({
  code: z.string(), // "limits_per_order", "sale_window_ends", "remaining_low"
  placement: z
    .enum([
      "row.under_title",
      "row.under_price",
      "row.under_quantity",
      "row.footer",
      "panel.header_meta",
    ])
    .default("row.under_quantity"),
  severity: z.enum(["neutral", "info", "warning"]).default("neutral"),
  text: z.string().optional(), // direct text
  params: z.record(z.string(), z.unknown()).default({}), // for templating
  priority: z.number().int().default(0),
});

export const StateAxesSchema = z.object({
  // ...existing...
  microcopy: z.array(MicrocopyMessageSchema).default([]), // server-provided inline text
});
```

**Why:** lets the server say “show ‘Sales end Oct 25…’ under the quantity control” or “Only 3 left” as inline text, without the client inventing copy or comparing dates/counts. The UI can still _choose_ whether to render some messages based on layout constraints.

---

### C) Client‑driven microcopy (selection‑reactive)

These are the little messages you mentioned ("below the quantity selector when you hit a maximum"). They're **UI‑state only** and safe for client atoms to handle.

**The Requirement (from notes):**

> Reasons for things that are "presentational" should be standardized and client-side. e.g. max_per_order_reached, max_per_user_reached which happen when max_selectable_reached.

When the user **interacts** with the UI and hits a limit (like selecting too many tickets or trying to select 0 when minimum is 1), the **client** should show these messages—but the **copy should still be server-controlled** for consistency.

To make them customizable without a release, give them copy keys:

```ts
export const ClientCopySchema = z.object({
  // keys the client uses when it generates local microcopy
  selection_min_reached: z.string().default("Select at least {min}."),
  selection_max_types: z.string().default("You can only choose one type."),
  quantity_min_reached: z.string().default("Minimum is {min}."),
  quantity_max_reached: z.string().default("Max {max} per order."),
});
export const ContextSchema = z.object({
  // ...existing...
  clientCopy: ClientCopySchema.default({}),
});
```

#### How It Works: Server Facts + Client Detection + Server Copy

**Server provides authoritative facts (response-3):**

```ts
context: {
  orderRules: {
    typesPerOrder: "single",      // Can only pick one type
    minTicketsPerSelectedType: 1  // Must select at least 1 ticket
  }
}

commercial: {
  maxSelectable: 6  // Can't exceed 6 tickets
}
```

**Client atoms watch for violations and use server copy:**

```ts
const selectionErrorAtom = atom((get) => {
  const rules = get(orderRulesAtom);
  const selection = get(selectionAtom);
  const { clientCopy } = get(payloadAtom).context;

  // User tries to select a second type when typesPerOrder='single'
  if (rules.typesPerOrder === "single" && Object.keys(selection).length > 1) {
    return clientCopy.selection_max_types;
    // Returns: "You can only choose one type."
  }

  // User tries to reduce qty to 0 when minTicketsPerSelectedType=1
  if (qty === 0 && rules.minTicketsPerSelectedType === 1) {
    return clientCopy.quantity_min_reached.replace(
      "{min}",
      rules.minTicketsPerSelectedType
    );
    // Returns: "Minimum is 1."
  }

  // User hits maxSelectable
  if (qty === maxSelectable) {
    return clientCopy.quantity_max_reached.replace("{max}", maxSelectable);
    // Returns: "Max 6 per order."
  }

  return null;
});
```

**UI rendering:**

```tsx
// Stepper component
<Stepper value={qty} onChange={setQty} max={maxSelectable} />;
{
  selectionError && (
    <Microcopy severity="info" placement="under_quantity">
      {selectionError}
    </Microcopy>
  );
}
```

#### The Key Distinction

| Type                        | Example                         | When Computed                                     | Why                                         |
| --------------------------- | ------------------------------- | ------------------------------------------------- | ------------------------------------------- |
| **Server-driven microcopy** | "Sales end Oct 25, 11:59 PM CT" | Server computes dates                             | Server has authoritative time/schedule data |
| **Server-driven microcopy** | "Only 3 tickets left"           | Server knows inventory                            | Server has authoritative supply data        |
| **Client-driven microcopy** | "Max 6 per order"               | Shown when user **hits** the max                  | Reactive to user interaction                |
| **Client-driven microcopy** | "You can only choose one type"  | Shown when user **tries** to select a second type | Reactive to selection state                 |

#### Separation of Concerns

| Layer                  | Responsibility                       | Example                       |
| ---------------------- | ------------------------------------ | ----------------------------- |
| **Server (facts)**     | Authoritative rules & clamps         | `orderRules`, `maxSelectable` |
| **Client (logic)**     | Detect violations during interaction | Atoms watch selection state   |
| **Server (copy)**      | Standardized message strings         | `clientCopy` with templates   |
| **Client (rendering)** | Show/hide based on current state     | Microcopy component           |

This matches the PDF's panel‑type rules (single vs multiple types; defaults and clamps) while keeping the client responsive without re‑doing schedule/availability math.

**Why this approach?**

- ✅ Messages are **standardized** (server-controlled copy)
- ✅ Behavior is **reactive** (client detects violations instantly)
- ✅ Rules are **authoritative** (server provides the facts)
- ✅ Customizable **without releases** (update `clientCopy` strings server-side)

---

### D) Badges, Tooltips, HoverCards

Badges are already server‑driven (`display.badges`). We just add optional details you can reveal via Tooltip or HoverCard.

```ts
export const BadgeDetailRefSchema = z.object({
  kind: z.enum(["tooltip", "hovercard"]),
  ref: z.string(), // key into the registries below
});

export const DisplaySchema = z.object({
  // ...existing...
  badges: z.array(z.string()).default([]),
  badgeDetails: z.record(z.string(), BadgeDetailRefSchema).default({}),
});

export const TooltipSchema = z.object({ id: z.string(), text: z.string() });
export const HoverCardSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  body: z.string(), // markdown allowed if you like
  action: NoticeActionSchema.optional(), // e.g., "Learn more" → URL
});

export const ContextSchema = z.object({
  // ...existing...
  tooltips: z.array(TooltipSchema).default([]),
  hovercards: z.array(HoverCardSchema).default([]),
});
```

#### Example

- Badge `PaymentPlanAvailable` with details:

  - `badgeDetails["PaymentPlanAvailable"] = { kind: "hovercard", ref: "pp_details_v1" }`
  - `context.hovercards` includes `pp_details_v1` with the APR, schedule policy summary, etc.
    This exactly fits the “Payment Plan examples/details” call‑out.

---

## 2) Responsibilities (so nothing fights)

- **Server decides truth**: sold‑out, waitlist on/off, access‑code status, sale windows, remaining counts, limits, and which DynamicNotices to show. It may also ship **precomposed microcopy** to pin placement and wording when important.
- **Client decides presentation**:

  - how many panel notices to show (by priority),
  - where to place microcopy slots (using `placement`),
  - **client‑only microcopy** triggered by local state (min/max reached, invalid selection), using `context.clientCopy`.

- **No recomputation**: client never infers sold‑out from counts or “hour left” from timestamps; if you want relative phrasing, server sends the exact string or updates on refresh.

This is consistent with the PDF’s pattern: DynamicNoticeGroup is present on more than one panel type, but it’s not meant to flicker based on selection—only based on event state.

---

## 3) Concrete examples

### Panel banner: “Only 31 tickets total left”

```jsonc
{
  "context": {
    "panelNotices": [
      {
        "code": "event_total_remaining",
        "scope": "panel",
        "severity": "info",
        "params": { "count": 31, "noun": "tickets" },
        "priority": 100
      }
    ],
    "copyTemplates": [
      {
        "key": "event_total_remaining",
        "template": "Only {count} {noun} left for this event."
      }
    ]
  }
}
```

### Panel banner: “One hour left to purchase”

```jsonc
{
  "context": {
    "panelNotices": [
      {
        "code": "sale_window_final",
        "scope": "panel",
        "severity": "warning",
        "text": "One hour left to purchase.",
        "priority": 120,
        "expiresAt": "2025-10-30T02:59:59Z"
      }
    ]
  }
}
```

### Row microcopy (server‑driven): “Sales end Oct 25…” under quantity

```jsonc
{
  "items": [
    {
      "state": {
        "microcopy": [
          {
            "code": "sale_window_ends",
            "placement": "row.under_quantity",
            "text": "Sales end Oct 25, 11:59 PM CT",
            "priority": 50
          }
        ]
      }
    }
  ]
}
```

### Row microcopy (client‑driven): “Max 6 per order” once the stepper hits 6

```jsonc
{
  "context": {
    "clientCopy": {
      "quantity_max_reached": "Max {max} per order."
    }
  }
}
```

Client atom: when `qty === commercial.maxSelectable`, render that string under the stepper with `{max}`.

---

### Sold-Out Microcopy Variations

**Server logic** for choosing which sold-out `panelNotice` variant to emit:

```ts
// Server determines which sold-out message based on available alternatives
if (allSoldOut && hasAccessCode && !anyOmittedItemHasStock) {
  // All sold out including gated items
  panelNotices.push({
    code: "event_sold_out",
    scope: "panel",
    severity: "neutral",
    text: "Event sold out",
  });
  // Do NOT include access code CTA
} else if (allVisibleSoldOut && hasHiddenGatedItems) {
  // Public sold out, gated items available
  panelNotices.push({
    code: "requires_code",
    scope: "panel",
    severity: "info",
    text: "Enter access code to view tickets",
    action: { kind: "open_drawer", target: "access_code" },
  });
} else if (allSoldOut && hasWaitlist) {
  // Sold out with waitlist
  panelNotices.push({
    code: "event_sold_out_waitlist",
    scope: "panel",
    severity: "info",
    text: "You can join the waitlist to be notified if tickets become available",
    action: { kind: "open_drawer", target: "waitlist" },
  });
} else if (allSoldOut && hasAccessCode && hasWaitlist) {
  // Should not happen (contradicts first rule), but handle gracefully
  panelNotices.push({
    code: "event_sold_out_multi_option",
    scope: "panel",
    severity: "info",
    text: "You can enter an access code or join the waitlist",
    action: { kind: "open_drawer", target: "access_code" }, // or show both actions
  });
}
```

This ensures the sold-out messaging is always contextually appropriate and never misleading.

---

### Payment Plan Availability

**Decision:** Payment plans are controlled at the **order level**, not per-product-type.

**Implementation:**

- Availability is a **preference** passed via `effectivePrefs.paymentPlanAvailable` (boolean)
- When available, indicate via **panel-level `panelNotice`** (DynamicNotice banner)
- Do **not** use per-product `PaymentPlanAvailable` badge
- Schedule/terms details shown via HoverCard or drawer

```jsonc
{
  "context": {
    "effectivePrefs": {
      "paymentPlanAvailable": true
    },
    "panelNotices": [
      {
        "code": "payment_plan_available",
        "scope": "panel",
        "severity": "info",
        "text": "Payment plans available at checkout",
        "priority": 50
      }
    ],
    "hovercards": [
      {
        "id": "payment_plan_details",
        "title": "Payment Plan Details",
        "body": "Split your purchase into 4 interest-free payments...",
        "action": { "kind": "open_url", "target": "/payment-plans" }
      }
    ]
  }
}
```

---

### DynamicNotice Component Implementation

**shadcn Item Components:** The `DynamicNotice` component can display multiple notice rows using [shadcn's Item components](https://ui.shadcn.com/docs/components/item) for consistent layout and styling:

```tsx
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@/components/ui/item";

function DynamicNotice({ notices }) {
  return (
    <div className="space-y-2">
      {notices
        .sort((a, b) => b.priority - a.priority)
        .map((notice) => (
          <Item key={notice.code} variant={severityToVariant(notice.severity)}>
            <ItemContent>
              <ItemTitle>{notice.title || notice.text}</ItemTitle>
              {notice.description && (
                <ItemDescription>{notice.description}</ItemDescription>
              )}
            </ItemContent>
            {notice.action && (
              <ItemActions>
                <Button onClick={() => handleAction(notice.action)}>
                  {notice.action.label || "Action"}
                </Button>
              </ItemActions>
            )}
          </Item>
        ))}
    </div>
  );
}
```

This provides a clean, accessible, and consistent banner presentation for panel-level notices.

---

## 4) Where to put the "31 total left" fact

If you want that number to be **event‑level**, add it to context to avoid re‑summing on the client:

```ts
export const EventRollupSchema = z.object({
  totalRemainingCount: z.number().int().nonnegative().nullable().optional(),
});
export const ContextSchema = z.object({
  // ...existing...
  eventRollup: EventRollupSchema.default({}),
});
```

You can then generate the banner either as a `panelNotice` (preferred) or leave it to the client to consume `eventRollup.totalRemainingCount` and create a banner using the template registry (less preferred, but possible).

---

## 5) Minimal changes to v0.3 (summary)

- **Add** `context.panelNotices[]` and optional `context.copyTemplates[]`.
- **Add** `state.microcopy[]` for per‑row server‑provided inline messages.
- **Add** `context.clientCopy{}` to override strings the client generates for selection‑driven messages (min/max reached, etc.).
- **Add** `display.badgeDetails{}` + `context.tooltips[]/hovercards[]` for progressive disclosure.
- **Optional** `context.eventRollup.totalRemainingCount` to avoid summing on the client.

All of this aligns with the PDF’s panels: DynamicNotice banners for **Event Full/Waitlist**, **Sold Out**, **Past Event**, optional hints (“SaleWindowHint”, “LimitsHint”), and Payment Plan explainers via a hovercard.

---

## 6) Implementation checklist (bite‑sized)

- Server

  - [ ] Emit `panelNotices` for event‑level calls to action (Sold Out, Waitlist, “hour left”).
  - [ ] Optionally precompose critical microcopy in `items[].state.microcopy[]`.
  - [ ] Provide `copyTemplates` defaults (or manage centrally).
  - [ ] For Payment Plan, add `hovercards[]` and set `display.badgeDetails`.

- Client

  - [ ] Render `DynamicNoticeGroup` from `panelNotices` by descending `priority`.
  - [ ] Add a `MicrocopyHint` component that can render `items[].state.microcopy[]` by `placement`.
  - [ ] Add `clientCopy`‑backed microcopy for selection/min/max states.
  - [ ] Wire `badgeDetails` to open tooltips/hovercards.

.

.

.

---

## Scaffold Insights and Nomenclature Addendum

### How the scaffold should inform your spec (make these "normative")

- Row presentation is purely presentational and driven by gating; locked vs suppressed is the only distinction you need to standardize.

```15:22:context/frontend/product-panel/scaffold/mapping.ts
function rowPresentation(item: PanelItem, satisfied: boolean): "normal" | "locked" | "suppressed" {
  if (!satisfied) {
    const visible = (item.gates?.visibilityWhenGated ?? "visible") === "visible"
      || (item.variant?.visibilityWhenGated ?? "visible") === "visible";
    return visible ? "locked" : "suppressed";
  }
  return "normal";
}
```

- Authoritative clamp only. Selection must clamp to server `maxSelectable`; never recompute limits client‑side.

```43:49:context/frontend/product-panel/scaffold/atoms.ts
const item = items.find((it) => `${it.product.id}/${it.variant.id}` === key);
const max = item?.commercial?.maxSelectable ?? 0;
const clamped = Math.max(0, Math.min(Math.floor(nextQty), max));
set(selectionFamily(key), clamped);
```

- CTA and price UI are pure derivations of server state; label overrides live only in prefs.

```36:41:context/frontend/product-panel/scaffold/mapping.ts
if (pres === "locked") return "masked";
if (pres === "suppressed") return "hidden";
const st = item.commercial.status;
return (st === "available" || st === "approvalRequired") ? "shown" : "hidden";
```

### Patterns to codify in v0.3/v0.3.1 text

**Client state boundaries:**

- Keep normative names: `RowPresentation`, `QuantityUI`, `PriceUI`, `CTAKind`, `RowNotice`, `RowState`, `PanelState`, `SectionState`.
- Identity key is `productId/variantId`. Group by `sectionId`; render in server order.
- State derivation is one-way: `PanelItem` (server contract) → `RowState` (client-derived) via atoms.

**Panel rollups from client-only composition:**

- Define `panelMode` by combining "all out of stock" + `effectivePrefs.showTypeListWhenSoldOut`.
- Define `anyGatedVisible` (locked rows) and reserve room for `anyGatedHidden` (hidden/omitted gating).
- These are computed from server facts but are client-derived state.

**Copy model:**

- Row notices come from machine reasons + optional texts; CTA labels can be overridden via `ctaLabelOverrides`.
- Distinguish server-provided notices/hints from client-reactive microcopy (limits reached) but drive strings from server.

**Selection state model:**

- Selection is per row (keyed by `productId/variantId`), clamped only by `maxSelectable`.
- Use stepper/select/hidden mapping based on clamp and presentation state.
- Selection state is local (Jotai atoms), never sent to server until checkout.

**Add-ons and placement:**

- Encode "children vs section" placement and `applyQuantity` semantics in relations; children inherit parent selection quantity.

**Pricing footer:**

- Display `pricing.summary` verbatim; no math in client state.

### Where your "working updates" fit cleanly into the scaffold shape

**orderRules:**

- Lives as atoms beside selection family; powers "defaults to 1", "single vs multiple types", and bottom-CTA gating.
- Drives client-side validation state (selection valid/invalid) without doing policy math.

**gatingSummary + listingPolicy:**

- Row presentation state already models locked/suppressed; use `listingPolicy` to decide omission upstream, and `gatingSummary` to enable a panel-level AccessCodeCTA.
- Client atoms read `gatingSummary` to derive `showAccessCodeCta` state.

**Notices/microcopy registries:**

- Slot into the same copy pipeline as row notices and `ctaLabelOverrides`.
- Panel-level `panelNotices` → panel state
- Row-level `microcopy` → row state
- Client-reactive `clientCopy` → derived from selection state + server rules

### Small spec tightenings the scaffold suggests

- **Make the row UI mapping table normative:** presentation state → quantityUI/priceUI/CTA (pure function).
- **Standardize the stable row key:** `${productId}/${variantId}` for selection atoms and React keys.
- **Call out that rollups are client-derived state:** `allOutOfStock`, `anyGatedVisible` are computed from server facts.
- **Keep "authoritative facts vs derived state" as a hard rule:** server supplies axes, limits, gates, pricing; client derives presentation state only.

**Net:** The scaffold gives you the exact client state boundaries, naming, and composition patterns; v0.3 should enshrine these as invariants while your updates (orderRules, gatingSummary, listingPolicy, notices) extend them without changing the client's role.

---

## Terminology Migration: "State" not "ViewModel"

### What to change in both spec files

**Core type renames:**

```diff
- RowViewModel → RowState
- PanelViewModel → PanelState
- SectionViewModel → SectionState
```

**Atom renames:**

```diff
- panelViewModelAtom → panelStateAtom
- rowViewModelAtom → rowStateAtom (if used)
```

**Function renames:**

```diff
- mapItemToRowVM → deriveRowState
- mapItemToRowViewModel → deriveRowState
```

**Conceptual language shifts:**

| Old (MVVM)              | New (Jotai/React)              |
| ----------------------- | ------------------------------ |
| "view model"            | "derived state"                |
| "mapping to view model" | "deriving state from contract" |
| "view model atom"       | "state atom"                   |
| "panel view model"      | "panel state"                  |
| "row view model"        | "row state"                    |

### Specific sections to update in product-panel-spec-working.md

**Section 3) State Composition → Rendering:**

- Title stays the same (already uses "State")
- Tables and text already mostly use "state"; just replace any `RowViewModel` type references

**Section 6) Client Code Implementation:**

```diff
- ### B) **`mapping.ts`** (replace file)
+ ### B) **`state-derivation.ts`** (replace file)

  function rowPresentation(item: PanelItem): RowPresentation { ... }

- export function mapItemToRowVM(
+ export function deriveRowState(
    item: PanelItem,
    payload: ProductPanelPayload,
    selectionCount: number
- ): RowViewModel {
+ ): RowState {
```

**Section 5) Jotai Alignment:**

```diff
- ### Client (derived atoms = presentation only)
+ ### Client (derived state atoms)

- - `rowPresentation`:
+ - `rowPresentationAtom` (or inline in `rowStateAtom`):
```

**Example code blocks throughout:**

```diff
- const rowVMs = items.map((it) => mapItemToRowVM(...));
+ const rowStates = items.map((it) => deriveRowState(...));

- export type RowViewModel = {
+ export type RowState = {
    key: string;
    presentation: RowPresentation;
    // ...
  }
```

### Specific sections to update in product-panel-spec-working-updates.md

**Section 6) Client-driven microcopy:**

```diff
  **Atom sketch (client):**

- const bottomCtaEnabledAtom = atom(
+ const bottomCtaEnabledAtom = atom<boolean>(
    (get) => get(selectionValidAtom) && get(anyPurchasableAtom)
  );
```

**Section 4) Bottom-CTA behavior:**

```diff
  const onlyGatedRemainingAtom = atom((get) => {
-   const rows = get(visibleRowsAtom);
+   const rowStates = get(visibleRowStatesAtom);
-   const anyPurchaseable = rows.some(
+   const anyPurchaseable = rowStates.some(
      (r) => r.presentation === "normal" && r.cta.kind === "purchase"
    );
```

**Section 8) Complete Contract Changes Summary:**

- Replace any references to "view model" with "derived state"
- Examples already use atoms correctly; just update variable names

### New section to add to both specs

Add after the Jotai alignment section:

---

## Client State Architecture

### State Flow (One Direction)

```text
Server Contract (PanelItem)
    ↓
Atoms (derive + compose)
    ↓
Client State (RowState, PanelState)
    ↓
React Components (consume via useAtomValue)
```

**No props, no drilling.** Each component reads the atoms it needs:

```ts
function ProductPanel() {
  const panelState = useAtomValue(panelStateAtom);
  // panelState: { sections, panelMode, allOutOfStock, ... }

  return panelState.sections.map((section) => (
    <Section key={section.id} id={section.id} />
  ));
}

function Section({ id }: { id: string }) {
  const section = useAtomValue(sectionStateAtom(id));
  // section: { label, rows: RowState[] }

  return section.rows.map((rowState) => (
    <ProductRow key={rowState.key} rowId={rowState.key} />
  ));
}

function ProductRow({ rowId }: { rowId: string }) {
  const rowState = useAtomValue(rowStateAtom(rowId));
  const [quantity, setQuantity] = useAtom(selectionFamily(rowId));

  // rowState: { presentation, quantityUI, priceUI, cta, ... }
  // Direct atom reads, zero props
}
```

### State Types Hierarchy

```ts
// Derived from single contract item
export type RowState = {
  key: string; // stable ID for atoms/React
  presentation: RowPresentation; // normal | locked | suppressed
  quantityUI: QuantityUI; // hidden | select | stepper
  priceUI: PriceUI; // hidden | shown | masked
  cta: RowCTA; // purchase | waitlist | none | ...
  notices: RowNotice[]; // derived from state.reasons
  // ... other derived fields
};

// Composition of rows
export type SectionState = {
  id: string;
  label: string;
  rows: RowState[];
};

// Top-level panel state
export type PanelState = {
  sections: SectionState[];
  panelMode: PanelMode; // full | compactWaitlistOnly
  allOutOfStock: boolean; // rollup
  anyGatedVisible: boolean; // rollup
  // ... other panel-level state
};
```

### State Atoms Pattern

```ts
// Base query (TanStack Query via Jotai)
export const productPanelQueryAtom = atomWithQuery<ProductPanelPayload>(...)

// Derived state (pure functions, no side effects)
export const rowStatesAtom = atom((get) => {
  const payload = get(productPanelQueryAtom);
  return payload.items.map(item => deriveRowState(item, payload));
})

export const panelStateAtom = atom<PanelState>((get) => {
  const rowStates = get(rowStatesAtom);
  const sections = get(sectionsAtom);
  // ... compose into PanelState
})

// Selection state (writable atoms, per-row)
export const selectionFamily = atomFamily((rowKey: string) =>
  atom(0, (get, set, qty: number) => {
    const row = get(rowStateAtom(rowKey));
    const clamped = Math.max(0, Math.min(qty, row.maxSelectable));
    set(selectionFamily(rowKey), clamped);
  })
)
```

### Why "State" not "ViewModel"

| Reason               | Explanation                                                      |
| -------------------- | ---------------------------------------------------------------- |
| **React convention** | "Derived state" is standard React terminology                    |
| **Jotai philosophy** | Atoms hold state; components consume state                       |
| **No MVVM baggage**  | ViewModel implies two-way binding; we have one-way flow          |
| **Clear boundaries** | Contract (server) → State (client-derived) → Components (render) |
| **Future-proof**     | "Selection state", "gate state", "pricing state" all fit         |

---

### Summary of changes needed

**In product-panel-spec-working.md:**

1. Find/replace: `RowViewModel` → `RowState`, `PanelViewModel` → `PanelState`, `SectionViewModel` → `SectionState`
2. Find/replace: `mapItemToRowVM` → `deriveRowState`
3. Find/replace: `panelViewModelAtom` → `panelStateAtom`
4. Add "Client State Architecture" section after Jotai alignment
5. Update all code examples to use `rowStates` not `rowVMs`

**In product-panel-spec-working-updates.md:**

1. Same find/replace as above
2. Update atom examples to use state terminology
3. Add "Client State Architecture" section
4. Update integration examples (responses 3/4) to show state flow

**In scaffold files:**

1. Rename `types.ts` exports
2. Rename `mapping.ts` → `state-derivation.ts` and function name
3. Rename `selectors.ts` atom names
4. Update README to use state terminology
