<!-- markdownlint-disable MD025 -->
<!-- markdownlint-disable MD024 -->

# Product Panel Spec 0.4

## Sections

1. **Purpose & Scope**
2. **Terminology & Lexicon** _(authoritative names; forbidden → preferred table)_
3. **State Model (Orthogonal Axes)**

   - 3.1 Temporal
   - 3.2 **Supply** _(canonical; no “availability/inventory”)_
   - 3.3 **Gating** _(with `listingPolicy`)_
   - 3.4 Demand Capture
   - _(Admin axis removed—disabled never sent)_

4. **Top‑Level Contract Shape** _(Context, Sections, Items, Pricing)_

   - **Context includes**: `orderRules`, `gatingSummary`, `panelNotices`, `copyTemplates`, `clientCopy`, tooltips/hovercards, prefs

5. **Preferences & Copy** _(incl. payment plan banner rule)_
6. **Item Structure** _(product, variant, fulfillment, commercial clamp)_
7. **Messages (Unified)**

   - Replace `reasonTexts` + `microcopy` split with **`state.messages[]`** + optional `copyTemplates`

8. **Rendering Composition (Derived Atoms Only)**

   - Row presentation (normal/locked)
   - Purchasable boolean
   - CTA decision tree
   - Quantity & price visibility rules

9. **Gating & Unlock (No Leakage)**

   - `listingPolicy="omit_until_unlocked"` default; `gatingSummary` is the only hint

10. **Relations & Add‑ons** _(selection vs ownership; applyQuantity/matchBehavior)_
11. **Pricing Footer** _(server math; inclusions flags)_
12. **Reason Codes Registry** _(machine codes; copy via messages/templates)_
13. **Invariants & Guardrails** _(client MUST NOT compute X)_
14. **Zod/TS Schemas** _(single source of truth)_

## 1. Purpose & Scope

### Normative

- **Purpose:** Define the JSON **contract** between the server and the Product Panel UI. The server is the **single source of truth** for all business decisions; the client is a **pure view** that derives presentation from server facts.

- **What this contract MUST cover (inclusive scope):**

  - **Axes of state** per item: `temporal`, `supply`, `gating`, `demand`.
  - **Selection rules** for the panel: `context.orderRules` (types/tickets mins & composition).
  - **Row‑level messages:** `state.messages[]` (the only inline text channel per item).
  - **Panel‑level notices:** `context.panelNotices[]` (the only banner channel).
  - **Gating behavior:** `gating.required | satisfied | listingPolicy`, plus `context.gatingSummary` for zero‑leak hints.
  - **Authoritative clamps & money:** `commercial.maxSelectable`, `pricing` (server‑computed).
  - **Display hints:** badges/placements/hovercards/tooltips as provided in context/display.

- **What is explicitly out of scope (client MUST NOT implement):**

  - Payments, checkout orchestration, taxes/fees math, discounts, installment scheduling.
  - Identity/auth, membership verification, abuse/rate‑limit policies.
  - Seat maps, seat adjacency rules, hold management.
  - Business policy recomputation (sale windows, availability, purchase limits).
  - Any approval/request workflow (not part of this contract).

- **Panel scope boundary:**

  - The Product Panel covers everything **up to** adding tickets and add‑ons to an order.
  - It ensures the user has selected what they need (meeting min/max rules from `orderRules`) and validates selection completeness.
  - The panel then **hands off** to the checkout process with the finalized selection.
  - Payment processing, seat assignment (reserved seating), and authentication flows are **outside** this contract.
  - This separation keeps panel logic focused on **product selection** rather than transaction orchestration.

- **Contract guarantees:**

  - **Orthogonality:** Each axis is independent; causes go in `reasons[]`; user‑facing text goes in `messages[]` / `panelNotices[]`.
  - **Zero‑leak gating:** Default sendability is governed by `gating.listingPolicy`; omitted items **do not** appear in `items[]`.
  - **Single clamps:** UI quantity controls enforce **only** `commercial.maxSelectable`.
  - **Single speech channel per level:** rows speak via `state.messages[]`; the panel speaks via `context.panelNotices[]`. No other strings.
  - **Replace over infer:** When new payloads arrive, the client **replaces** derived state from server facts; it does not back‑compute truth.

- **Compatibility rules:**

  - Clients **MUST** ignore unknown fields gracefully.
  - Servers **SHOULD** treat unspecified optional fields as absent (do not rely on client defaults for business logic).
  - All machine codes and enums are authoritative; clients **MUST NOT** transform codes into UI text without payload strings/templates.

---

### Rationale (why these boundaries exist)

- The panel must be predictable, testable, and secure. Keeping **decisions on the server** and **derivations in the client** prevents drift, reduces combinatorial bugs, and blocks leakage for gated SKUs.
- One row text channel and one banner channel avoid precedence fights, duplicated copy, and translation churn.
- A single clamp and server‑computed pricing eliminate the gray area where client math contradicts business policy.

### Real‑time synchronization

- The client receives the **authoritative state** from the server at load time.
- Real‑time updates (via polling, WebSocket, or server push) ensure the client always reflects current state without local guesswork.
- When the payload refreshes (e.g., inventory changes, sale window transitions, access code unlocked), atoms **re-derive** UI state from the new server facts.
- The client does **not** maintain a separate "source of truth" or attempt to predict state transitions; it derives presentation from what the server sends and requests fresh data when the user acts or time elapses.

**Flow:** Server fact changes → new payload arrives → atoms re-run derivations → React re-renders UI. No prediction, no back-calculation.

---

### Examples (compact)

#### Inclusive scope, minimal top‑level shape

```jsonc
{
  "context": {
    "orderRules": {
      "types": "multiple",
      "typesPerOrder": "multiple",
      "ticketsPerType": "multiple",
      "minSelectedTypes": 0,
      "minTicketsPerSelectedType": 0
    },
    "gatingSummary": { "hasHiddenGatedItems": true },
    "panelNotices": [
      {
        "code": "requires_code",
        "text": "Enter access code to view tickets",
        "variant": "info",
        "priority": 90
      }
    ],
    "effectivePrefs": {
      "showTypeListWhenSoldOut": true,
      "displayPaymentPlanAvailable": false
    }
  },
  "sections": [{ "id": "main", "label": "Tickets", "order": 1 }],
  "items": [
    {
      "product": {
        "id": "prod_ga",
        "name": "General Admission",
        "type": "ticket"
      },
      "state": {
        "temporal": { "phase": "during", "reasons": [] },
        "supply": { "status": "available", "reasons": [] },
        "gating": {
          "required": false,
          "satisfied": true,
          "listingPolicy": "omit_until_unlocked",
          "reasons": []
        },
        "demand": { "kind": "none", "reasons": [] },
        "messages": []
      },
      "commercial": {
        "price": {
          "amount": 5000,
          "currency": { "code": "USD", "base": 10, "exponent": 2 },
          "scale": 2
        },
        "feesIncluded": false,
        "maxSelectable": 6
      },
      "display": { "badges": [] }
    }
  ],
  "pricing": {
    "currency": { "code": "USD", "base": 10, "exponent": 2 },
    "lineItems": [
      {
        "code": "TOTAL",
        "label": "Total",
        "amount": {
          "amount": 0,
          "currency": { "code": "USD", "base": 10, "exponent": 2 },
          "scale": 2
        }
      }
    ],
    "mode": "reserve"
  }
}
```

**Out of scope (intentionally absent)**
_No local countdown strings, no client‑invented banners, no approval flows, no price math._

.

.

███████████▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░

.

.

## 2. Terminology & Lexicon (authoritative names)

### Normative (Terminology & Lexicon)

- **Field naming:** use **`camelCase`** for all JSON payload fields.
- **Machine codes:** use **`snake_case`** for all machine codes (e.g., reason codes, message codes, enum literals).
- Availability axis name is **`supply`**.
- **Axes (canonical):**

  - `temporal`
  - `supply`
  - `gating`
  - `demand`

- **Supply axis:**

  - `supply.status` ∈ `"available" | "none" | "unknown"`.
    - Use `display.showLowRemaining: boolean` for urgency styling; `supply.remaining` for copy interpolation.
  - `supply.reasons` is an array of machine codes (e.g., `["sold_out"]`).
  - `supply.remaining` MAY be included (number) but is **not** used for business logic.

- **Gating axis:**

  - `gating.required: boolean`
  - `gating.satisfied: boolean`
  - `gating.listingPolicy` ∈ `"omit_until_unlocked"` (default) | `"visible_locked"`
  - Access‑code validation is server‑side only.

- **Demand axis:** `demand.kind` ∈ `"none" | "waitlist" | "notify_me"`.
- **Unified messages:** row‑level display text comes **only** from `state.messages[]`
  Each message MAY include `{ code, text?, params?, placement?, variant?, priority? }`.
- **Panel banners:** come **only** from `context.panelNotices[]` (priority‑ordered; informational only, not primary CTAs).
- **Copy registries:** optional `context.copyTemplates[]` (templates) and `context.clientCopy` (client‑reactive microcopy).
- **Gating hint:** `context.gatingSummary.hasHiddenGatedItems: boolean` is the **only** allowed hint that hidden gated items exist.
- **Reason codes:** machine codes are **`snake_case`** (e.g., `sold_out`, `requires_code`, `sales_ended`). UI strings are supplied by the payload; the client does not hardcode.
- **Display flag naming:** boolean flags controlling UI presentation use consistent prefixes:
  - `show*` for visibility toggles (e.g., `showTypeListWhenSoldOut`, `showLowRemaining`)
  - `display*` for feature availability flags (e.g., `displayPaymentPlanAvailable`, `displayRemainingThreshold`)

### Why no hardcoded copy?

All user‑facing text and labels come from the server or configurable copy dictionaries—**nothing is hardwired** in the client code. This includes:

- Status messages: "Sold out", "Sales start in…", "Requires code"
- Button labels: "Add", "Join Waitlist", "Notify Me"
- Error prompts: "Max 4 tickets per order", "Minimum 1 ticket required"
- Notices: "Payment plans available at checkout"

**Benefits:**

- **Consistency** across platforms (web, mobile, kiosk)
- **Localization** without client releases
- **A/B testing** of copy variants server‑side
- **Rapid iteration** on messaging (no deployment for text changes)

The server provides either **exact text** (`"Sold Out"`) or **templates** with params (`"Only {count} left!"`). The client **never invents** strings or derives them from codes alone.

### Absolute forbidden terms (contract & code comments)

- `inventory`, `stock` (use `supply.remaining`, and copy like "Only N left" supplied by server).
- `availability` as an axis/field name (use `supply`).
- "view model" / MVVM jargon (refer to **derived state** if needed in client docs).
- Any client‑invented banners or row text.

### **Tests**

- **Schema & Naming Compliance**
  - Payloads **MUST** validate with `supply.*` fields present and **no** `availability.*` or `inventory.*` fields.
  - All machine codes and enums **MUST** use `snake_case` (e.g., `sold_out`, `requires_code`, `sales_ended`).
- **Message Channels**
  - The client **MUST** render messages from `state.messages[]` and `context.panelNotices[]` only; no other strings may be introduced.

### Examples (compact & canonical)

```jsonc
// Supply axis (sold out)
"supply": { "status": "none", "reasons": ["sold_out"] }

// Gating axis (secure default)
"gating": { "required": true, "satisfied": false, "listingPolicy": "omit_until_unlocked" }

// Demand axis
"demand": { "kind": "waitlist", "reasons": [] }

// Unified row messages
"state": {
  "messages": [
    { "code": "sold_out", "text": "Sold Out", "placement": "row.under_quantity", "priority": 100 }
  ]
}

// Panel notices
"context": {
  "panelNotices": [
    { "code": "payment_plan_available", "variant": "info", "text": "Payment plans available at checkout", "priority": 50 }
  ]
}
```

> ℹ️ A full "forbidden → preferred" mapping table belongs in the **Appendix: Terminology & Migration Notes** (for authoring hygiene). Section 2 remains purely normative.

### Client State Architecture (derived state, not ViewModel)

- **Terminology (normative):** Use the word **state**, not “view model”. The client maintains and consumes **derived state** computed from the server contract. No two‑way bindings.
- **One‑way flow:** contract → derive/compose via atoms → client state → React components. No props drilling for panel data.

#### State Flow (one direction)

```text
Server Contract (PanelItem)
    ↓
Atoms (derive + compose)
    ↓
Client State (RowState, SectionState, PanelState)
    ↓
React Components (consume via useAtomValue)
```

#### No props, no drilling (pattern)

```ts
function ProductPanel() {
  const panelState = useAtomValue(panelStateAtom);
  return panelState.sections.map((section) => (
    <Section key={section.id} id={section.id} />
  ));
}

function Section({ id }: { id: string }) {
  const section = useAtomValue(sectionStateAtom(id));
  return section.rows.map((row) => (
    <ProductRow key={row.key} rowId={row.key} />
  ));
}

function ProductRow({ rowId }: { rowId: string }) {
  const rowState = useAtomValue(rowStateAtom(rowId));
  const [quantity, setQuantity] = useAtom(selectionFamily(rowId));
  // rowState: { presentation, quantityUI, priceUI, cta, ... }
}
```

#### State Types Hierarchy (authoritative names)

```ts
export type RowState = {
  key: string;
  presentation: RowPresentation;
  quantityUI: QuantityUI;
  priceUI: PriceUI;
  cta: RowCTA;
  maxSelectable: number;
};

export type SectionState = {
  id: string;
  label: string;
  rows: RowState[];
};

export type PanelState = {
  sections: SectionState[];
  allOutOfStock: boolean;
  anyLockedVisible: boolean;
};
```

#### State Atoms Pattern (derive → compose → consume)

```ts
export const productPanelQueryAtom =
  atomWithQuery<ProductPanelPayload>(/* ... */);

export const rowStatesAtom = atom((get) => {
  const payload = get(productPanelQueryAtom);
  return payload.items.map((item) => deriveRowState(item, payload));
});

export const panelStateAtom = atom<PanelState>((get) => {
  const rowStates = get(rowStatesAtom);
  const sections = get(sectionsAtom);
  // compose PanelState from rowStates + sections + rollups
  return derivePanelState({ rowStates, sections });
});

export const selectionFamily = atomFamily((rowKey: string) =>
  atom(0, (get, set, qty: number) => {
    const row = get(rowStateAtom(rowKey));
    const clamped = Math.max(0, Math.min(qty, row.maxSelectable));
    set(selectionFamily(rowKey), clamped);
  })
);
```

#### Why “State” not “ViewModel”

| Reason               | Explanation                                                       |
| -------------------- | ----------------------------------------------------------------- |
| **React convention** | “Derived state” is standard React terminology.                    |
| **Jotai philosophy** | Atoms hold state; components consume state.                       |
| **No MVVM baggage**  | ViewModel implies two‑way binding; we use one‑way flow.           |
| **Clear boundaries** | Contract (server) → State (client‑derived) → Components (render). |
| **Future‑proof**     | “Selection state”, “gate state”, “pricing state” all fit.         |

.

.

███████████▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░

.

.

## 3. State Model (Orthogonal Axes)

> The server sends **independent axes**; the client composes them into presentation.
> Axes: **`temporal`**, **`supply`**, **`gating`**, **`demand`**. _(Admin axis removed — unpublished/disabled items are never sent.)_

### Why Axes?

Each product's status is broken down into **independent dimensions** (timing, supply, access, demand). This allows the server to explicitly signal _why_ an item is or isn't purchasable at any moment—for example, distinguishing "sold out" from "not on sale yet" from "requires access code."

The client composes these orthogonal facts into presentation states through pure view mapping—**no business logic**, **no schedule math**, **no price computation**. A ticket might be temporally available (`phase="during"`) but supply-constrained (`status="none"`) and offering a waitlist (`kind="waitlist"`)—three independent server decisions that together determine the row's CTA.

This separation makes the system **testable** (toggle one axis at a time), **extensible** (add geo-gating or age verification later without touching existing axes), and **secure** (client cannot recompute or bypass server decisions).

---

### **Normative (global to the state model)**

- Each item **MUST** include:

  ```jsonc
  "state": {
    "temporal": { ... },
    "supply":   { ... },
    "gating":   { ... },
    "demand":   { ... },
    "messages": [ /* optional, row display-only */ ]
  }
  ```

- **Independence:** Axes **MUST NOT** encode each other’s decisions. Causes go in `reasons[]` (machine codes, `snake_case`). User text **MUST** come from `state.messages[]` (or `context.copyTemplates`), not from `reasons[]`.

- **No leakage:** Only `gating.listingPolicy` and server omission control whether an item is sent. Client **MUST NOT** infer missing items except via `context.gatingSummary.hasHiddenGatedItems`.

- **Purchasability (derived later):** “Purchasable” is a client‐derived boolean: `temporal.phase="during"` **AND** `supply.status="available"` **AND** (`gating.required=false` **OR** `gating.satisfied=true`). The derivation lives in §8; this section defines the axes that make it possible.

---

## 3.1 Temporal

### **Normative**

- `temporal.phase` **MUST** be one of: `"before" | "during" | "after"`.
- `temporal.reasons[]` **MAY** include machine codes such as:

  - `outside_window` (phase=`before`)
  - `sales_ended` (phase=`after`)

- The server **MUST** decide the phase; the client **MUST NOT** compute from timestamps or clocks.
- Any human‑readable timing text (e.g., "On sale Fri 10 AM CT") **MUST** be delivered via `state.messages[]` or `context.copyTemplates`.
- `temporal.currentWindow` and `temporal.nextWindow` **MAY** provide ISO timestamp objects for display metadata only:
  - These are **not** for client computation of `phase` or countdown rendering.
  - The client **MAY** format timestamps for locale display only (e.g., converting ISO to local time format).
  - The client **MUST NOT** compute countdowns, sale windows, or phase transitions from timestamps.
  - If countdown UI is desired, the server **MUST** send refreshed text or trigger client re-fetch on schedule transitions.
  - **Recommended:** Send pre-formatted text whenever possible to avoid client-side time formatting complexity.

### **Rationale**

- Time math (TZ, DST, pauses) belongs on the server; clients only reflect the call.

### **Examples**

```jsonc
// Not on sale yet
"temporal": { "phase": "before", "reasons": ["outside_window"] }

// On sale
"temporal": { "phase": "during", "reasons": [] }

// Sales ended
"temporal": { "phase": "after", "reasons": ["sales_ended"] }
```

### **Tests**

- Given `phase="before"`, purchasability derivation **MUST** be false regardless of other axes.
- Given `phase` toggles `"before"→"during"` in a refresh, purchasability **MUST** re‑compute to true iff other axes permit (no extra client logic).
- Client **MUST NOT** display a countdown unless a message is provided; no clock math is allowed.

---

## 3.2 Supply

### **Normative**

- `supply.status` **MUST** be one of: `"available" | "none" | "unknown"`.
  - `"available"`: stock exists (use `supply.remaining` and `display.showLowRemaining` for urgency)
  - `"none"`: sold out
  - `"unknown"`: status cannot be determined (e.g., external seat map not ready)
- When sold out, `supply.reasons` **SHOULD** include `sold_out`.
- `supply.remaining` **MAY** be present (number) for copy/urgency, but **MUST NOT** drive business rules.
- **Authoritative clamp:** selection controls enforce **only** `commercial.maxSelectable` (see §13 guardrails). Supply does **not** set the clamp; it explains it.

### **Rationale**

- Counts can be stale, seat maps can constrain selection, and limits apply; a single clamp avoids contradictions.

### **Examples**

```jsonc
// In stock (count optional)
"supply": { "status": "available", "remaining": 5, "reasons": [] }

// Sold out
"supply": { "status": "none", "reasons": ["sold_out"] }

// Unknown (e.g., seat provider session not ready)
"supply": { "status": "unknown", "reasons": [] }
```

### **Tests**

- With `supply.status="none"`, the row **MUST** not be purchasable (CTA decided in §8).
- With `supply.status="available"` and `commercial.maxSelectable=0`, the row **MUST** not render quantity controls (clamp wins).
- Client **MUST NOT** infer `sold_out` from `remaining=0`; only `status`/messages govern display.
- **Clamp authority:** Given `commercial.maxSelectable=2` and any `supply.remaining` value (including 0), the quantity UI **MUST** clamp at 2. The client **MUST NOT** derive limits from `remaining` or other fields.
- **MaxSelectable vs remaining:** Given `commercial.maxSelectable: 2` and `supply.remaining: 0`, quantity UI **MUST** allow up to 2 (clamp is authoritative; no inference from counts).
  - **Authoring note:** The "remaining=0 but maxSelectable>0" fixture is didactic (proves clamp authority). In production payloads, prefer keeping `remaining` omitted or consistent with clamp unless there is an intentional reason (e.g., async seat batch allocation), and accompany edge cases with clear `state.messages[]`.

---

## 3.3 Gating (with `listingPolicy`)

### **Normative**

- Gated items **MUST** set `gating.required=true`.

- If gate unsatisfied:

  - `listingPolicy="omit_until_unlocked"` (**default**) ⇒ item **MUST NOT** be sent in `items[]`.
  - `listingPolicy="visible_locked"` ⇒ item **MUST** be sent as **locked**; price **MUST** be masked; quantity UI **MUST** be hidden.

- Client **MUST NOT** infer omitted items. Only use `context.gatingSummary.hasHiddenGatedItems`.

- Access code validation **MUST** occur server‑side; client **MUST NOT** validate or rate‑limit.

- `gating.requirements[]` **MAY** provide structured metadata about gate constraints:

  - `kind`: type of gate (e.g., `"unlock_code"`)
  - `satisfied`: whether this specific requirement is met
  - `validWindow`: optional time window when gate is active
  - `limit`: optional usage constraints (`maxUses`, `usesRemaining`)
  - The server uses this metadata to compute `gating.satisfied`; the client uses it **only** for explanatory messages (e.g., "Code expired", "Code max uses reached").
  - The client **MUST NOT** use `requirements[]` to decide purchasability; only `gating.satisfied` governs that.

- On successful unlock, previously omitted items **MUST** appear with `gating.satisfied=true` (and become purchasable only if other axes allow).

### **Rationale**

- Zero‑leak default protects presales/secret SKUs. `visible_locked` is an explicit tease mode.

### **Examples**

```jsonc
// Hidden until unlock (default)
"gating": { "required": true, "satisfied": false, "listingPolicy": "omit_until_unlocked" }

// Visible locked (tease)
"gating": {
  "required": true,
  "satisfied": false,
  "listingPolicy": "visible_locked",
  "reasons": ["requires_code"]
}

// Visible locked with requirements metadata (for error messaging)
"gating": {
  "required": true,
  "satisfied": false,
  "listingPolicy": "visible_locked",
  "requirements": [{
    "kind": "unlock_code",
    "satisfied": false,
    "validWindow": {
      "startsAt": "2025-10-22T00:00:00Z",
      "endsAt": "2025-10-25T23:59:59Z"
    },
    "limit": {
      "maxUses": 100,
      "usesRemaining": 23
    }
  }],
  "reasons": ["requires_code"]
}

// Unlocked
"gating": { "required": true, "satisfied": true, "listingPolicy": "omit_until_unlocked" }
```

### **Tests**

- Given `omit_until_unlocked`, item **MUST** be absent from `items[]`; `context.gatingSummary.hasHiddenGatedItems=true`.
- Given `visible_locked`, row renders **locked**; price masked; quantity UI hidden.
- After unlock, `gating.satisfied=true`; CTA resolves to **Purchase** iff `temporal="during"` and `supply="available"`.
- **Omit enforcement:** If an item has `gating.required=true`, `satisfied=false`, and `listingPolicy="omit_until_unlocked"`, it **MUST NOT** be present in `items[]`.
- **Hint presence:** When items are omitted due to gating, `context.gatingSummary.hasHiddenGatedItems` **MUST** be `true` iff any omitted item has stock.
- **No leakage:** The client **MUST NOT** display, cache, or log any information about omitted items beyond the boolean `hasHiddenGatedItems` hint.
- **Price masking:** Locked rows (`gating.required=true && satisfied=false`) **MUST** mask price and hide quantity controls.

---

## 3.4 Demand (alternate actions)

### **Normative**

- `demand.kind` **MUST** be one of: `"none" | "waitlist" | "notify_me"`.
- `demand.reasons[]` **MAY** annotate machine facts (e.g., `waitlist_available`).
- Demand **does not** override gating: if `gating.required && !satisfied`, the client **MUST NOT** surface demand CTAs that would leak locked inventory.
- CTA mapping from `demand.kind` is defined in §8 (Rendering/CTA Decision).

### **Rationale**

- Demand expresses the server‑chosen fallback when direct purchase is not available. Gating precedence prevents leakage and UX confusion.

### **Examples**

```jsonc
// Waitlist offered (e.g., sold out)
"demand": { "kind": "waitlist", "reasons": ["waitlist_available"] }

// Notify-me (before sale)
"demand": { "kind": "notify_me", "reasons": [] }

// No alternate
"demand": { "kind": "none", "reasons": [] }
```

### **Tests**

- With `supply.status="none"` and `demand.kind="waitlist"` and gate satisfied (or not required), CTA **MUST** resolve to **Join Waitlist** (per §8).
- With `temporal.phase="before"` and `demand.kind="notify_me"`, CTA **MUST** resolve to **Notify Me** (per §8).
- With `gating.required=true` and `satisfied=false`, demand CTAs **MUST NOT** appear (until unlocked).
- **No approval CTAs:** The client **MUST NOT** render any "Request Access" or approval-related CTAs; these are not part of this contract.

---

## 3.5 Cross‑Axis Invariants (quick)

### **Normative**

- **No duplication:** A cause appears once (in its axis' `reasons[]`); display text appears once (`state.messages[]`) or as `context.panelNotices[]`.
- **Gating precedence:** If `gating.required=true` AND `gating.satisfied=false`, demand CTAs (waitlist/notify_me) **MUST NOT** be shown, even if `demand.kind` is set.
  - **Rationale:** Prevents leaking locked inventory. A waitlist CTA for an unsatisfied gated item would reveal its existence to unauthorized users.
  - **Example:** A members-only ticket sells out. The server sets `demand.kind="waitlist"` but keeps `gating.satisfied=false` for non-members. The client shows neither purchase nor waitlist CTAs until the gate is satisfied.
- **Visibility vs. lock:** Visibility is controlled by **sendability** (`omit_until_unlocked` or server omission). Locking is a **rendered state** of a **sent** item.
- **No admin axis:** Items not for sale (unpublished/disabled) are omitted server‑side; the client will never see them.

### **Tests**

- A gated, unsatisfied item **cannot** be both omitted and visible: `listingPolicy` defines exactly one behavior.
- Given `gating.required=true`, `satisfied=false`, `demand.kind="waitlist"`: row **MUST** show lock state with **no** waitlist CTA (gating precedence).
- **Banner exclusivity:** With an empty `context.panelNotices[]`, the panel **MUST NOT** render any top banners—even if all visible rows are sold out. All panel-level notices **MUST** come from `context.panelNotices[]` only.
- Unknown fields in `state` **MUST** be ignored without breaking derivations.

---

### **Tiny end‑to‑end example (axes only, minimal messages)**

```jsonc
{
  "product": { "id": "prod_ga", "name": "General Admission", "type": "ticket" },
  "state": {
    "temporal": { "phase": "during", "reasons": [] },
    "supply": { "status": "available", "reasons": [] },
    "gating": {
      "required": false,
      "satisfied": true,
      "listingPolicy": "omit_until_unlocked",
      "reasons": []
    },
    "demand": { "kind": "none", "reasons": [] },
    "messages": []
  },
  "commercial": { "maxSelectable": 6 },
  "display": { "badges": [] }
}
```

> This section defines **what the server says**. §7 specifies how rows speak (`messages[]`). §8 defines **how the client renders** from these axes (row presentation, CTA table, quantity/price visibility).

.

.

███████████▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░

.

.

## 4. Top‑Level Contract Shape _(Context, Sections, Items, Pricing)_

### **Normative**

#### Root object

- The payload **MUST** be an object with exactly these top‑level keys:

  - `context` _(required)_
  - `sections` _(required, array)_
  - `items` _(required, array)_
  - `pricing` _(required)_

- Clients **MUST** ignore unknown top‑level keys and unknown sub‑fields.
- Machine codes (e.g., in `reasons[]` and `messages[].code`) **MUST** be `snake_case`. Field names remain camelCase.

---

**4.1 `context` (server‑authored panel configuration & copy)**

The server is the single source for configuration, banner text, and copy artifacts.

- **MUST** include:

  - `orderRules` — selection composition for the panel:

    - `types`: `"single" | "multiple"`
    - `typesPerOrder`: `"single" | "multiple"`
    - `ticketsPerType`: `"single" | "multiple"`
    - `minSelectedTypes`: integer ≥ 0
    - `minTicketsPerSelectedType`: integer ≥ 0

  - `panelNotices[]` — panel‑level banners, ordered by descending `priority`.

    - Each notice **MAY** specify `{ code, text?, params?, variant?, priority?, action?, expiresAt? }`.

  - `effectivePrefs` — display preferences (non‑business, UI hints):

    - **SHOULD** at least provide:

      - `showTypeListWhenSoldOut: boolean`:
        - `true`: when all items are sold out, still render the list of ticket types (with "Sold out" labels)
        - `false`: when all items are sold out, hide the list entirely and show only a panel notice (e.g., "Event Sold Out")
        - Default recommended: `true` (transparency)
      - `displayPaymentPlanAvailable: boolean`: informational flag; if `true`, the server typically includes a `panelNotices[]` entry about payment plans at checkout
      - `displayRemainingThreshold?: number`: optional threshold for urgency styling (e.g., if remaining ≤ this value, set `display.showLowRemaining=true`)

- **MUST/SHOULD** behavior:

  - `gatingSummary`:

    - **MUST** be present **iff** any gating is configured for the event.
    - **MUST** include `hasHiddenGatedItems: boolean` (the **only** hint that omitted, gated SKUs exist).
    - **MAY** include `hasAccessCode: boolean` (general capability hint).

  - Copy registries:

    - `copyTemplates[]` **MAY** supply templates with `{ key, template }` structure, where `key` matches `messages[].code` for interpolating `messages[].params`.
    - `clientCopy` **MAY** provide client‑reactive strings (e.g., min/max selection errors).

  - Help text:

    - `tooltips[]` and/or `hovercards[]` **MAY** provide referenced explainer content for badges and UI affordances.

- **MUST NOT** contain `reasonTexts` for row rendering (row text comes from `state.messages[]`; see §7).

---

**4.2 `sections` (grouping/navigation)**

- `sections[]` **MUST** be sent to group rows for display organization.

  - Each section: `{ id, label, order, labelOverride? }`.
  - The server determines section IDs, labels, and order; the client **MUST NOT** assume any specific section IDs or names.

- Items assign themselves to sections via `display.sectionId`.
  - If `display.sectionId` is absent, the item's section placement is undefined; the client **SHOULD** render it in the first section by `order`.
- Empty sections (no items assigned) **MAY** be hidden by the client.

---

**4.3 `items` (the list of purchasable & related products)**

Each element in `items[]` is a **Panel Item** the client renders verbatim (no client filtering beyond derivation rules).

- **MUST** include:

  - `product`: `{ id, name, type }` where `type ∈ "ticket" | "digital" | "physical"`.

    - `product.id` **MUST** be unique across the payload.

  - `variant` **MAY** exist (forward‑compat; empty object acceptable).
  - `state`: **MUST** include the four orthogonal axes **plus** the unified message channel:

    **Axes (decision facts):**

    - `temporal`: `{ phase: "before" | "during" | "after", reasons[] }`
      - See §3.1 for full spec; `currentWindow`/`nextWindow` metadata MAY be present.
    - `supply`: `{ status: "available" | "none" | "unknown", reasons[], remaining? }`
      - See §3.2 for full spec.
    - `gating`: `{ required: boolean, satisfied: boolean, listingPolicy: "omit_until_unlocked" | "visible_locked", reasons[], requirements?[] }`
      - See §3.3 for full spec including `requirements[]` shape (kind, validWindow, limit).
    - `demand`: `{ kind: "none" | "waitlist" | "notify_me", reasons[] }`
      - See §3.4 for full spec.

    **Display text channel (composes axis info into UI strings):**

    - `messages[]`: array of `{ code, text?, params?, placement?, variant?, priority? }`

      - The **only** row‑level text channel; composes information from all axes into user‑facing strings.
      - **Not** an axis; it's the presentation layer that derives from axis `reasons[]`.
      - `variant`: explicit styling (e.g., `"warning"`, `"error"`, `"info"`, `"neutral"`) for icon/color
      - `priority`: for sorting when multiple messages exist (higher numbers first)
      - **Example relationship:**

        ```jsonc
        // Axis has machine code
        "supply": { "status": "none", "reasons": ["sold_out"] }

        // Messages has display text for that code
        "messages": [
          { "code": "sold_out", "text": "Sold Out", "placement": "row.under_quantity", "variant": "info" }
        ]
        ```

  - `commercial`: authoritative clamps & money:

    - **MUST** include `{ price, feesIncluded, maxSelectable, limits? }`.
    - `price`: **Dinero.js V2 snapshot object** with `{ amount, currency, scale }`:
      - `amount`: integer in minor units (e.g., `5000` for $50.00)
      - `currency`: full currency object `{ code, base, exponent }` (e.g., `{ code: "USD", base: 10, exponent: 2 }`)
      - `scale`: precision scale (typically `2` for cents)
      - **Rationale:** All money is transported as Dinero snapshots; nothing happens to money outside Dinero.js V2 and Dinero utils. Client **MAY** display without Dinero utils, but transport is always Dinero objects.
    - `feesIncluded: boolean`: whether `price` includes fees or fees are added separately
    - `maxSelectable`: **computed** effective cap that accounts for current stock, `limits.perOrder`, `limits.perUser`, and any other server-side constraints (holds, fraud rules, etc.).
      - When `0`, the item cannot be selected (sold out, locked, or otherwise unavailable).
      - UI quantity controls **MUST** enforce **only** this value; never derive limits from other fields.
    - `limits.perOrder` / `limits.perUser`: **optional** business rules; informational for display (e.g., "Max 4 per order"), but `maxSelectable` is authoritative for UI enforcement.

  - `display`: view hints:

    - **SHOULD** include `{ badges[], sectionId? }`.
    - **MAY** include `{ badgeDetails: { [badge]: { kind: "tooltip"|"hovercard", ref } }, showLowRemaining? }`.
    - **Field explanations:**
      - `badges[]`: short labels for this specific product (e.g., `["Popular", "Members"]`); product-level, not section-level.
      - `badgeDetails`: optional tooltips/hovercards explaining badges (references `context.tooltips[]` or `context.hovercards[]`).
      - `showLowRemaining: boolean`: when `true`, signals the UI should apply urgency styling **for this item** (e.g., highlight the row, pulse animation). The actual count comes from `supply.remaining`; this is just a presentation flag.
        - **Not** a section-level FOMO notice; for event-wide urgency ("Only 20 tickets left!"), use `context.panelNotices[]`.
      - `sectionId: string`: assigns this item to a section from `sections[]`. If absent, client renders in first section by `order`.

  - `relations` **MAY** express add‑on dependencies:

    - `parentProductIds?: string[]` — IDs of products this item depends on. If empty/absent, the item has no dependencies.
    - `matchBehavior?: "per_ticket" | "per_order"`:
      - `"per_ticket"`: this add-on can be selected once per parent ticket (e.g., meal voucher per attendee).
      - `"per_order"`: this add-on is limited to the order level regardless of parent quantity (e.g., one parking pass per order).
    - **Note:** An "add-on" is not a separate `product.type`; it's any product with `parentProductIds[]` populated. The backend manages junction table relationships; the panel receives the derived `relations` object for UI enforcement.

- **MUST NOT** include any "admin/approval" axis (unpublished items are never sent; approval flows are out of scope).
- **Gating sendability**:

  - If `required=true` and `satisfied=false` and `listingPolicy="omit_until_unlocked"` → item **MUST NOT** appear in `items[]`.
  - If `visible_locked`, the item **MUST** appear locked; price masked; quantity controls hidden.

---

**4.4 `pricing` (server‑computed money summary)**

> ⚠️ **Work in Progress:** The pricing contract structure is evolving. The `mode` field, `lineItems[]` granularity, and breakdown format may change as implementation progresses. The server may ultimately send a simpler structure (subtotal, fees, taxes, total) rather than detailed line items. This section will be updated as the pricing contract stabilizes over the next week.

- The pricing footer is **authoritative** and **server‑computed**; clients **MUST NOT** perform price math.
- **MUST** include:

  - `currency`: **Dinero.js V2 currency object** `{ code, base, exponent }` (e.g., `{ code: "USD", base: 10, exponent: 2 }`)
    - Applies to all monetary values in this pricing object
  - `mode?: "reserve" | "final"` _(provisional field; may be removed)_:
    - `"reserve"`: interim pricing during selection (face value + estimated fees); may change as user selects items
    - `"final"`: locked-in price after all discounts, taxes, payment plan adjustments applied
  - **Breakdown structure** _(provisional; exact fields TBD)_:
    - May use `lineItems[]` with detailed breakdown: `{ code, label, amount }` where each `amount` is a Dinero snapshot
    - May use simpler fields like `subtotal`, `fees`, `taxes`, `total` (all Dinero snapshots)
    - Common line item codes (if used): `"TICKETS"`, `"FEES"`, `"TAX"`, `"DISCOUNT"`, `"TOTAL"`
    - Negative amounts allowed for discounts

- **Stable architectural principles** _(regardless of final structure)_:

  - All monetary amounts are **Dinero.js V2 snapshot objects** `{ amount, currency, scale }`
  - Server computes all totals, fees, taxes, discounts; client receives Dinero snapshots
  - Client **MAY** use Dinero utils for display formatting or **MAY** format directly from snapshot values
  - Client **MUST NOT** perform arithmetic on money; all calculations happen server-side and are returned as new Dinero snapshots
  - Nothing happens to money outside Dinero.js V2 and Dinero utils

- **Dynamic updates**: As the user changes selection quantities, the client **requests** a new payload from the server (or receives a push update). The server recalculates `pricing` including all fees, taxes, discounts, payment plan effects, etc. The client **replaces** the footer with the new `pricing` object.

- **Always present**: `pricing` is always included in the payload. If there is nothing to display yet (e.g., no selection), send `{ currency, lineItems: [] }`. The client **MUST NOT** compute or backfill totals; it renders only what the server provides.

---

### **Rationale**

- This shape keeps **configuration, copy, and security** at the top (`context`), **facts** in the middle (`items[].state`, `commercial`), and **money** at the bottom (`pricing`).
- `sections` provide grouping without coupling to item structure; the server decides section IDs and labels.
- Unified `state.messages[]` + `context.panelNotices[]` prevents copy collisions and implicit heuristics.
- Authoritative `maxSelectable` + server `pricing` eliminate client/server drift from local math.
- **Dinero.js V2 architecture** ensures all money operations are safe, precise, and server-computed:
  - All amounts transported as Dinero snapshots (persisted the same way)
  - Client never performs arithmetic; only formats for display
  - Eliminates floating-point errors and currency conversion bugs

### **How the Pieces Relate** _(mental model)_

Understanding how context, items, and pricing work together:

**Context provides the rules and UI scaffolding:**

- `orderRules` tells the client how selections can be composed (one type vs many, minimums, etc.)
- `gatingSummary.hasHiddenGatedItems` hints that omitted items exist (without leaking details)
- `panelNotices[]` provides event-level banners ("Payment plans available", "Enter access code")
- `effectivePrefs` controls display behaviors (show/hide sold-out list)
- `copyTemplates`, `tooltips`, `hovercards` supply reusable text artifacts

**Items provide the facts about each product:**

- `product.id` is the unique key
- `state` (four axes + messages) describes **why** a product is/isn't purchasable
- `commercial.maxSelectable` is the authoritative clamp (accounts for stock + limits + holds + fraud rules)
- `display` provides view hints (badges, showLowRemaining flag, sectionId assignment)
- `relations` defines add-on dependencies (parentProductIds, matchBehavior)

**Pricing provides the computed money summary:**

- Updated by the server as the user changes selections
- Client **replaces** footer with new lineItems; never computes totals locally
- `mode: "reserve"` during selection, `"final"` after discounts/taxes applied

**Example flow:**

1. User loads panel → server sends `context` (rules + notices), `sections` (grouping), `items[]` (facts), `pricing` (initial $0)
2. User selects 2 GA tickets → client POSTs selection → server responds with updated `items[]` (maxSelectable adjusted?) + new `pricing` (tickets + fees)
3. User enters access code → server responds with previously omitted items now in `items[]`, `gating.satisfied=true`, updated `gatingSummary`
4. User clicks checkout → panel validates against `orderRules`, proceeds if valid

---

### **Examples** _(tiny, canonical)_

> **Note:** Pricing examples show `lineItems[]` structure as provisional. Actual implementation may use simpler or more complex breakdown fields.

#### Minimal viable payload (single section)

```jsonc
{
  "context": {
    "orderRules": {
      "types": "multiple",
      "typesPerOrder": "multiple",
      "ticketsPerType": "multiple",
      "minSelectedTypes": 0,
      "minTicketsPerSelectedType": 0
    },
    "gatingSummary": { "hasHiddenGatedItems": false },
    "panelNotices": [],
    "effectivePrefs": {
      "showTypeListWhenSoldOut": true,
      "displayPaymentPlanAvailable": false
    }
  },
  "sections": [{ "id": "main", "label": "Tickets", "order": 1 }],
  "items": [
    {
      "product": {
        "id": "prod_ga",
        "name": "General Admission",
        "type": "ticket"
      },
      "variant": {},
      "state": {
        "temporal": { "phase": "during", "reasons": [] },
        "supply": { "status": "available", "reasons": [] },
        "gating": {
          "required": false,
          "satisfied": true,
          "listingPolicy": "omit_until_unlocked",
          "reasons": []
        },
        "demand": { "kind": "none", "reasons": [] },
        "messages": []
      },
      "commercial": {
        "price": {
          "amount": 5000,
          "currency": { "code": "USD", "base": 10, "exponent": 2 },
          "scale": 2
        },
        "feesIncluded": false,
        "maxSelectable": 10
      },
      "display": { "badges": ["Popular"] }
    }
  ],
  "pricing": {
    "currency": { "code": "USD", "base": 10, "exponent": 2 },
    "mode": "reserve",
    "lineItems": [
      {
        "code": "TOTAL",
        "label": "Total",
        "amount": {
          "amount": 0,
          "currency": { "code": "USD", "base": 10, "exponent": 2 },
          "scale": 2
        }
      }
    ]
  }
}
```

#### With multiple sections, locked row, panel banner, templates

```jsonc
{
  "context": {
    "orderRules": {
      "types": "multiple",
      "typesPerOrder": "multiple",
      "ticketsPerType": "multiple",
      "minSelectedTypes": 0,
      "minTicketsPerSelectedType": 0
    },
    "gatingSummary": { "hasHiddenGatedItems": true },
    "panelNotices": [
      {
        "code": "requires_code",
        "variant": "info",
        "text": "Enter access code to view tickets",
        "priority": 90
      }
    ],
    "effectivePrefs": {
      "showTypeListWhenSoldOut": true,
      "displayPaymentPlanAvailable": true
    },
    "copyTemplates": [
      { "key": "remaining_low", "template": "Only {count} left!" }
    ],
    "hovercards": [
      {
        "id": "members_info",
        "title": "Members Only",
        "body": "Unlock with a valid access code."
      }
    ]
  },
  "sections": [
    { "id": "primary", "label": "Tickets", "order": 1, "labelOverride": null },
    { "id": "addons", "label": "Add‑ons", "order": 2, "labelOverride": null }
  ],
  "items": [
    {
      "product": {
        "id": "prod_locked",
        "name": "Members Presale",
        "type": "ticket"
      },
      "variant": {},
      "state": {
        "temporal": { "phase": "during", "reasons": [] },
        "supply": { "status": "available", "reasons": [] },
        "gating": {
          "required": true,
          "satisfied": false,
          "listingPolicy": "visible_locked",
          "reasons": ["requires_code"]
        },
        "demand": { "kind": "none", "reasons": [] },
        "messages": [
          {
            "code": "requires_code",
            "text": "Requires access code",
            "placement": "row.under_title",
            "variant": "info",
            "priority": 80
          }
        ]
      },
      "commercial": {
        "price": {
          "amount": 9000,
          "currency": { "code": "USD", "base": 10, "exponent": 2 },
          "scale": 2
        },
        "feesIncluded": false,
        "maxSelectable": 0
      },
      "display": {
        "badges": ["Members"],
        "badgeDetails": {
          "Members": { "kind": "hovercard", "ref": "members_info" }
        },
        "sectionId": "primary"
      }
    }
  ],
  "pricing": {
    "currency": { "code": "USD", "base": 10, "exponent": 2 },
    "mode": "reserve",
    "lineItems": [
      {
        "code": "TOTAL",
        "label": "Total",
        "amount": {
          "amount": 0,
          "currency": { "code": "USD", "base": 10, "exponent": 2 },
          "scale": 2
        }
      }
    ]
  }
}
```

---

### **Tests**

- **Root keys present**

  - Given a payload without `context`, `sections`, `items`, or `pricing`, the client **MUST** reject the payload (validation error).
  - Given an unknown top‑level key, the client **MUST** ignore it without side‑effects.

- **Context rules respected**

  - Given `context.orderRules` with `typesPerOrder="single"`, the client **MUST** enforce single‑type selection when enabling the bottom CTA (no extra business logic).
  - Given `context.gatingSummary.hasHiddenGatedItems=true`, the client **MUST NOT** invent row placeholders; it **MAY** show only the banner(s) in `panelNotices`.

- **Sections rendering**

  - When an item lacks `display.sectionId`, the client **SHOULD** render it in the first section by `order`.
  - Empty sections (no items) **MAY** be hidden by the client.

- **Items integrity**

  - Given two `items[]` with the same `product.id`, the client **MUST** treat this as invalid (duplicate row key).
  - Given an item with `gating.required=true`, `satisfied=false`, `listingPolicy="omit_until_unlocked"`, the item **MUST NOT** be present in `items[]`.

- **Pricing authority**

  - Given `pricing.lineItems=[]`, the footer **MUST** render no lines (no client recomputation); changing quantities **MUST** request new server pricing rather than compute locally.
  - `pricing` is always present; the client **MUST NOT** compute totals locally under any circumstances.

---

**Author note (for implementers):**
Lock these shapes into your Zod/TS schemas. Keep `messages[]` and `panelNotices[]` as the only speech channels; keep clamps (`maxSelectable`) and money (`pricing`) server‑authored.

.

.

███████████▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░

.

.

## 5. Preferences & Copy _(incl. payment plan banner rule)_

### **Normative**

### 5.1 `context.effectivePrefs` (UI hints only; never business logic)

The server **MAY** include UI preferences that shape **presentation**, not policy. Clients **MUST NOT** use them to compute availability, prices, or clamps.

- `showTypeListWhenSoldOut: boolean` —

  - `true` ⇒ keep rows visible (disabled) when everything’s sold out.
  - `false` ⇒ collapse to a compact sold‑out panel.
  - Default is server‑defined; client renders whatever is sent.

- `displayPaymentPlanAvailable: boolean` — indicates that installment plans exist at checkout.

  - **MUST NOT** by itself render any banner or badge. See **5.3** for the banner rule.

- `displayRemainingThreshold?: number` — optional urgency threshold that the **server** uses to decide when to set `display.showLowRemaining=true` (e.g., when `supply.remaining ≤ threshold`).

  - **Informational only:** tells the client what threshold the server is using; the client does not perform the comparison.
  - This flag **MUST NOT** alter purchasability or client logic.

- Unknown prefs **MUST** be ignored safely by clients.

#### 5.2 Copy channels (single source at each level)

- **Row‑level copy:** `items[].state.messages[]` is the **only** inline text channel per row.
  Each entry **MAY** include `{ code, text?, params?, placement?, variant?, priority? }`.
  - `variant`: explicit styling variant (e.g., `"warning"`, `"error"`, `"info"`, `"neutral"`) for icon/color selection
  - `priority`: for sorting when multiple messages exist (higher numbers first)
- **Panel‑level banners:** `context.panelNotices[]` for informational banners only (not CTAs).
  Each notice **MAY** include `{ code, text?, params?, variant?, priority?, action?, expiresAt? }`.
  - **Not for primary actions:** Access code entry and waitlist signup are **panel-level CTAs**, not notices (see below).
- Clients **MUST NOT** render any text invented locally (no hardcoded "Sold out", no client‑authored banners).
- `context.reasonTexts` is **not part of this contract**; row text comes from `state.messages[]` only (see §4.1).

**How the two channels work together:**

The separation of panel vs row notices ensures broad messages don't get lost among the list, and each item's specific status is clearly labeled right next to it. Key scenarios:

- **Visible but locked item:** The lock state is conveyed as a **row-level message** (e.g., "Requires access code" with lock icon). The user sees the item but knows a code is needed. The **access code CTA** appears below the PanelActionButton.
- **Hidden until unlocked:** A **panel-level notice** MAY appear at top (e.g., "Enter access code to view tickets") for guidance. The **access code CTA** appears below the PanelActionButton. After successful unlock, the notice may be removed; unlocked items appear with their own row-level status.
- **Event sold out with waitlist:** The **PanelActionButton changes to "Join Waitlist"** (see §5.3a for derivation). A **panel notice** MAY announce "All tickets sold out" for context. Individual sold-out rows show their own **row messages** ("Sold out").
- **Event not on sale with waitlist:** The **PanelActionButton becomes "Join Waitlist"** (see §5.3a). A **panel notice** MAY provide timing info ("Tickets on sale Friday at 10 AM").
- **Multiple concerns:** An item can have multiple row messages (e.g., "Requires access code" + "Sales end tomorrow"). The panel can have multiple notices (e.g., "Payment plans available" + informational alerts). Priority sorting ensures critical messages appear first.

#### 5.3 Payment plan banner rule (authoritative)

- `effectivePrefs.displayPaymentPlanAvailable=true` **MUST NOT** auto‑render any banner or badge.
- A payment‑plan banner **MUST** be rendered **only** when the server sends a notice:

  ```jsonc
  {
    "code": "payment_plan_available",
    "variant": "info",
    "text": "Payment plans available at checkout",
    "priority": 50
  }
  ```

- Per‑row "Payment Plan" badges **MUST NOT** be rendered. The concept is order‑level and surfaces only via `panelNotices[]`.
- Clients **MUST** sort `panelNotices[]` by **descending numeric `priority`** (higher numbers first).

  - Default priority is `0` if omitted.
  - Ties preserve server order.

- **Notice actions** _(optional, for secondary actions only)_: Notices **MAY** include an `action: { label, kind, target? }` for supplementary interactive elements:
  - `kind: "link"` → open external URL (e.g., "Learn More" link about payment plans)
  - `kind: "drawer"` → open internal info panel/modal (e.g., "Why join the waitlist?" explainer)
  - The client renders the action as a secondary button/link using the provided `label`.
  - **Not for primary CTAs:** Waitlist signup and access code entry use panel-level CTAs (PanelActionButton, AccessCodeCTA), not notice actions.

#### 5.3a Panel-level CTA derivation (PanelActionButton & AccessCodeCTA)

The panel has two derived CTAs that are **not** `panelNotices[]`:

**PanelActionButton (main button at bottom):**

- **States:**

  - `"continue"`: Default when items are purchasable and selection is valid → button shows "Continue" (or "Checkout")
  - `"waitlist"`: When no items purchasable but waitlist available → button shows "Join Waitlist"
  - `"disabled"`: When selection invalid (doesn't meet `orderRules`) or nothing purchasable with no waitlist → button grayed out

- **Waitlist derivation logic:**
  - **IF** all visible items are **not** purchasable (no item has `temporal.phase="during"` AND `supply.status="available"` AND gating satisfied)
  - **AND** any **eligible visible** item (gate satisfied or not required; not hidden by `omit_until_unlocked`) has `demand.kind="waitlist"`
  - **THEN** PanelActionButton state = `"waitlist"` (button shows "Join Waitlist")
  - **Note:** Respects gating precedence (§3.5)—locked items with waitlist do not trigger panel waitlist CTA until unlocked.
- **Common scenarios:**
  - Event not on sale yet (`temporal.phase="before"`) + waitlist enabled → "Join Waitlist"
  - All tickets sold out (`supply.status="none"`) + waitlist → "Join Waitlist"
  - Sales ended (`temporal.phase="after"`) + waitlist for next event → "Join Waitlist"
- **Label source:** The app provides panel CTA labels via app-level copy or `context.clientCopy` (e.g., `panel_cta_continue`, `panel_cta_waitlist`, `panel_cta_disabled`).

**AccessCodeCTA (positioned below PanelActionButton):**

- **Appears when:**
  - `context.gatingSummary.hasHiddenGatedItems=true`, OR
  - Any visible item has `gating.required=true && satisfied=false`
- **Typical UI:** Input field + "Apply Code" button (or similar)
- **Not** a `panelNotice`; it's a persistent UI element derived from gating state
- A panel notice **MAY** provide additional guidance at the top (e.g., "Enter access code to view tickets")

**Key principle:** These CTAs are **derived from panel/item state**, not configured via notices. Notices provide context; CTAs provide actions.

#### 5.4 Templates & interpolation

- `context.copyTemplates[]` **MAY** define templates `{ key, template, locale? }`.

  - A row message **MUST** resolve its display text as:

    1. use `messages[].text` if provided; else
    2. find `copyTemplates[].key === messages[].code`, interpolate `{...messages[].params}`, and render; else
    3. omit the message (no fallback strings).

- `panelNotices[]` follow the same rule: if `text` is absent and a template with `key === code` exists, interpolate; otherwise omit the notice.
- Placeholders use `{name}` syntax. Unknown placeholders **MUST** resolve to `""` (empty string), not the literal token.

**5.5 Client‑triggered copy (`context.clientCopy`)**

Row messages can be **server-authored** (included in `state.messages[]`) or **client-triggered** (using `context.clientCopy` templates):

- **Server-authored messages:** Static or dynamic row status from the server (e.g., "Sold out", "Only 5 left!", "Includes VIP lounge access"). These are always in `state.messages[]`.
- **Client-triggered messages:** Validation errors the client shows in response to user actions (e.g., trying to checkout without meeting `orderRules`, exceeding `maxSelectable`). These use `context.clientCopy` templates.

**`context.clientCopy` strings:**

The server **MAY** provide strings for client‑triggered validation/errors, e.g.:

- `selection_min_reached` — "Please select at least one ticket."
- `selection_max_types` — "You can only select one ticket type."
- `quantity_min_reached` — "Minimum {min} tickets required for this type."
- `quantity_max_reached` — "Maximum {max} tickets for this type."

**Usage:**

- Clients **MUST** use these strings verbatim when they initiate the message (e.g., on invalid checkout press). No local wording.
- These strings are **templates** that can include placeholders (e.g., `{max}`, `{min}`); the client interpolates them with current values.

#### 5.6 Tooltips & hovercards (progressive disclosure)

- `context.tooltips[]` / `context.hovercards[]` **MAY** define reusable explainer content.
- `items[].display.badgeDetails[badge]` **MAY** reference `{ kind: "tooltip" | "hovercard", ref }`.
- Clients **MUST** resolve these references and render the supplied content; no local prose.

#### 5.7 Variant & placement

- `variant` **SHOULD** be one of: `"neutral" | "info" | "warning" | "error"`; unrecognized values default to `"info"`.

  - `"neutral"`: informational, no urgency; subtle styling (e.g., "Includes VIP lounge access")
  - `"info"`: standard status; default styling (e.g., "Only 5 left!")
  - `"warning"`: urgent or time-sensitive; attention-grabbing styling (e.g., "Sales end in 1 hour!")
  - `"error"`: problem requiring user action; error styling (e.g., "Invalid access code")

- **Purpose:** Explicit styling control for icon, color, and urgency level. The server chooses the variant; the client applies corresponding styles.

- Recommended `messages[].placement` slots:

  - `row.under_title` — Small text just below the row title
  - `row.under_price` — Inline with or under price
  - `row.under_quantity` — Under the quantity control / CTA area
  - `row.footer` — At bottom of the row
  - `row.cta_label` — CTA button label text for the row

- Clients **MUST NOT** display messages outside the declared placements.

**Multiple messages per row:**

- An item **MAY** have multiple messages (e.g., "Requires access code" + "Sales end tomorrow").
- Clients **MUST** display all messages with valid text/templates, sorted by descending `priority`.
- If placement conflicts (two messages for same slot), stack them vertically or use the highest-priority one (implementation choice).
- The client **collates** messages and displays them in designated spots (typically as smaller, styled text under the relevant UI element).

---

### **Rationale**

- **One voice per layer.** Row facts speak via `messages[]`; panel‑wide context speaks via `panelNotices[]`. This prevents precedence fights and localization churn.
- **Server controls tone & timing.** Copy changes, A/B tests, and localization land on the server—no client releases or guesswork.
- **Security & clarity.** No implicit banners (“maybe there’s a code?”). If the server wants the user to see it, the server sends it.

---

### **Examples**

#### A) Preferences with no banners (no auto‑render)

```jsonc
"context": {
  "effectivePrefs": {
    "showTypeListWhenSoldOut": true,
    "displayPaymentPlanAvailable": true,
    "displayRemainingThreshold": 10
  },
  "panelNotices": []
}
```

_Result: no payment‑plan banner. No badges. Nothing is shown unless the server sends a notice._

#### B) Payment plan banner present (authoritative)

```jsonc
"context": {
  "effectivePrefs": { "displayPaymentPlanAvailable": true },
  "panelNotices": [
    {
      "code": "payment_plan_available",
      "variant": "info",
      "text": "Payment plans available at checkout",
      "priority": 50
    }
  ]
}
```

**B2) Panel notice with additional guidance (not primary CTA):**

```jsonc
"context": {
  "panelNotices": [
    {
      "code": "event_sold_out_info",
      "variant": "info",
      "text": "All tickets are sold out. Join our waitlist to be notified if tickets become available.",
      "priority": 100
    }
  ]
}
// Note: The PanelActionButton itself becomes "Join Waitlist" (not via this notice).
// This notice provides context; the button provides the action.
```

#### C) Using templates for row messages (no `text` on the message)

```jsonc
"context": {
  "copyTemplates": [
    { "key": "remaining_low", "template": "Only {count} left!" }
  ]
},
"items": [{
  "state": {
    "supply": { "status": "available", "remaining": 3, "reasons": [] },
    "messages": [
      { "code": "remaining_low", "params": { "count": 3 }, "placement": "row.under_quantity", "priority": 60 }
    ]
  }
}]
```

**C2) Informational message (neutral variant):**

```jsonc
"items": [{
  "state": {
    "messages": [
      {
        "code": "vip_includes",
        "text": "Includes VIP lounge access",
        "placement": "row.under_title",
        "variant": "neutral",
        "priority": 50
      }
    ]
  }
}]
```

_Rendering: Displayed as subtle, non-urgent informational text (e.g., gray, smaller font). Not a warning or error._

#### D) Two banners, ordered by `priority`

```jsonc
"context": {
  "panelNotices": [
    { "code": "requires_code", "text": "Enter access code to view tickets", "variant": "info", "priority": 90 },
    { "code": "payment_plan_available", "text": "Payment plans available at checkout", "variant": "info", "priority": 50 }
  ]
}
```

_Rendering order: “Enter access code …” above “Payment plans …”._

#### E) Multiple messages per row (priority sorted)

```jsonc
"items": [{
  "state": {
    "gating": { "required": true, "satisfied": false, "reasons": ["requires_code"] },
    "temporal": { "phase": "during", "reasons": ["sales_end_soon"] },
    "messages": [
      {
        "code": "requires_code",
        "text": "Requires access code",
        "placement": "row.under_title",
        "variant": "info",
        "priority": 90
      },
      {
        "code": "sales_end_soon",
        "text": "Sales end tonight at 11:59 PM",
        "placement": "row.under_title",
        "variant": "warning",
        "priority": 80
      }
    ]
  }
}]
```

_Rendering: Both messages appear under title, sorted by priority (requires_code first). Client may stack them or show highest priority only._

#### F) Badge detail via hovercard

```jsonc
"context": {
  "hovercards": [
    { "id": "members_info", "title": "Members Only", "body": "Unlock with a valid access code." }
  ]
},
"items": [{
  "display": {
    "badges": ["Members"],
    "badgeDetails": { "Members": { "kind": "hovercard", "ref": "members_info" } }
  }
}]
```

---

### **Invariants & guardrails (REMEMBER)**

- **No auto‑banners.** `effectivePrefs.*` **never** creates UI by itself. Banners come **only** from `panelNotices[]`.
- **No per‑row payment‑plan badges.** Ever. It’s an order‑level concept.
- **Messages require text or a template.** If neither is present, **omit** the message/notice.
- **Templates are not business logic.** Interpolate parameters; do not compute counts, dates, or phases. Those originate server‑side.
- **Respect placements and priorities.** Don't reshuffle banners or move messages to new locations.
- **No `reasonTexts` mapping:** This is not part of the contract. Use `messages[]` and `copyTemplates[]` for all display text.

---

### **Client do / don’t**

#### Do

- Render banners strictly from `panelNotices[]`, sorted by descending `priority`.
- Use `messages[].text` or `copyTemplates` interpolation; otherwise omit.
- Use `clientCopy` for client‑triggered validations (min/max selection, etc.).
- Treat `effectivePrefs` as presentation hints only.

#### Don't

- Don't hardcode strings like "Sold out", "Enter access code", "Join Waitlist".
- Don't auto‑show payment‑plan messaging from `displayPaymentPlanAvailable` flag alone.
- Don't compute parameters for templates:
  - ❌ Don't build `{date_local}` from timestamps (server sends formatted dates)
  - ❌ Don't create "Only N left!" by checking `supply.remaining` (server sends the message)
  - ❌ Don't compute `{max}` for "Max {max} per order" from `limits` (use `clientCopy` template with current `maxSelectable`)
  - ✅ **Do** interpolate server-provided params into server-provided templates
- Don't surface approval/request CTAs—approval flows are out of scope.
- Don't invent new placement slots beyond the defined ones (`row.under_title`, etc.).
- Don't ignore `priority` values; always sort descending (higher first).

---

### **Edge cases & tests**

- **No banner without notice**
  _Given_ `displayPaymentPlanAvailable=true` and `panelNotices=[]`
  _Expect_ no payment‑plan banner is rendered.

- **Banner appears with notice**
  _Given_ `panelNotices=[{ code:"payment_plan_available", text:"...", priority:50 }]`
  _Expect_ a single info banner rendered at panel top; no per‑row badges.

- **Priority ordering**
  _Given_ `panelNotices` includes both `{ code:"requires_code", priority:90 }` and `{ code:"payment_plan_available", priority:50 }`
  _Expect_ “requires_code” banner above the payment‑plan banner.

- **Template resolution (row)**
  _Given_ a row message `{ code:"remaining_low", params:{count:2} }` and `copyTemplates[{key:"remaining_low","template":"Only {count} left!"}]`
  _Expect_ rendered text “Only 2 left!” at `row.under_quantity`.

- **Template missing**
  _Given_ a row message `{ code:"foo_bar" }` with no `text` and no matching template
  _Expect_ no message rendered (no fallback text).

- **Client‑triggered copy**
  _Given_ `clientCopy.selection_min_reached="Please select at least one ticket."` and user taps Checkout with no selection
  _Expect_ that exact string to appear; no client‑invented phrasing.

- **Prefs don't change business**
  _Given_ `displayRemainingThreshold=5` and `supply.remaining=3` but `commercial.maxSelectable=0`
  _Expect_ urgency styling may apply, but quantity controls remain hidden (clamp wins).

- **Panel notice vs PanelActionButton**
  _Given_ all items sold out with `demand.kind="waitlist"` and a panel notice `{ code:"event_sold_out_info", text:"All tickets sold out..." }`
  _Expect_ the notice banner appears at top (informational), and the PanelActionButton at bottom changes to "Join Waitlist" (primary action).

- **Multiple messages per row**
  _Given_ an item with two messages at same placement, priorities 90 and 80
  _Expect_ both messages rendered (stacked or highest-priority only), sorted by descending priority.

- **`showTypeListWhenSoldOut` behavior**
  _Given_ all items have `supply.status="none"`, `showTypeListWhenSoldOut=false`, and a panel notice `event_sold_out`
  _Expect_ the item list is hidden; only the panel notice and its action (if any) are visible.
  _Given_ same scenario but `showTypeListWhenSoldOut=true`
  _Expect_ the item list remains visible (with "Sold out" row messages), and the panel notice appears above it.

.

.

███████████▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░

.

.

## 6. Item Structure _(product, variant, fulfillment, commercial clamp)_

> **What this section does:** pins down the shape and meaning of the **thing you render per row**. Identity and delivery live in `product`/`variant`/`fulfillment`. What a user can actually select is governed by the **commercial clamp** (`commercial.maxSelectable`) plus the state axes from §3.
> **Copy lives elsewhere:** row text is `state.messages[]`; panel banners are `context.panelNotices[]`.

---

### 6.1 Normative (contract you can validate)

**Each `items[]` element MUST include:**

- **`product`** — identity & delivery metadata (no money, no availability):

  - `id: string` — unique in payload.
  - `name: string`.
  - `type: "ticket" | "digital" | "physical"`.
  - `fulfillment?: { methods: string[]; details?: Record<string, unknown> }`

    - `methods[]` **MUST** use server‑defined enums; client **MAY** ignore unknowns:

      - Recommended baseline: `"eticket"`, `"will_call"`, `"physical_mail"`, `"apple_pass"`, `"shipping"`.
      - The client uses these to display appropriate icons or labels (e.g., mobile phone icon for `"eticket"`, Apple Wallet logo for `"apple_pass"`, shipping truck for `"physical_mail"`).

    - `details` is vendor‑ or product‑specific metadata; **display‑only**.
      - May include shipping info, pickup instructions, redemption requirements, etc.
      - Client renders as supplementary text/tooltips; does not affect business logic.

  - Extra fields **MAY** appear (e.g., `description: string`, `subtitle: string`, `category: string`); clients **MUST** ignore unknown fields gracefully.
    - **`description`**: longer product description for detail views or hovercards
    - These are **static product metadata**; for dynamic status text, use `state.messages[]`

- **`variant`** — differentiation placeholder (forward‑compat):

  - Optional and **MAY** be `{}` (most general admission tickets).
  - When present, **MAY** include:

    - `id?: string` — unique variant identifier (for multi-variant products)
    - `name?: string` — variant name (e.g., "Large", "Blue", "VIP Section A"); do not duplicate `product.name` unless it truly differs
    - `attributes?: Record<string, unknown>` — variant-specific data (size, color, seat info, time slot, etc.)

  - **MUST NOT** contain price or availability; those live in `commercial` and `state`.

  - **Common use cases:**
    - Physical goods: size/color variants (e.g., `{ attributes: { size: "L", color: "black" } }`)
    - Reserved seating: seat location (future; e.g., `{ attributes: { section: "A", row: "5", seat: "12" } }`)
    - Time-slotted tickets: time windows (e.g., `{ attributes: { slot: "10:00-11:00" } }`)
    - Currently: mostly empty `{}` for GA tickets; populated for physical merch

- **`commercial`** — **authoritative clamp** & price snapshot:

  - `price: { amount: number; currency: { code: string; base: number; exponent: number }; scale: number }`
    _(Dinero v2 snapshot; server‑computed)_
  - `feesIncluded: boolean` — **presentation hint** only (affects copy like "+ fees" vs "incl. fees").
  - `maxSelectable: number` — **single source of truth** for the quantity UI clamp (integer ≥ 0).
    - **Computed server-side** from: current `supply.remaining`, `limits.perOrder`, `limits.perUser`, any holds, fraud rules, etc.
    - When `0`, the item cannot be selected (sold out, locked, or unavailable for any reason).
    - **UI enforcement:** Quantity controls clamp to this value; never derive limits from other fields.
    - **Example:** If `supply.remaining=50`, `limits.perOrder=10`, `limits.perUser=6`, and the user has already bought 2 → server sends `maxSelectable=4`.
  - `limits?: { perOrder?: number; perUser?: number }` — **informational only** for display copy (e.g., "Max 4 per order").
    - The client **MAY** use these in `clientCopy` templates but **MUST NOT** use them for quantity clamping.
    - **Example:** Show "Maximum 10 per order" hint text, but enforce only `maxSelectable=4` (the effective cap).

- **`state`** — the axes from §3 plus `messages[]` (already specified in §§3–5).

- **`display`** — view hints (see §4): `badges[]`, optional `badgeDetails`, optional `sectionId`, and optional `showLowRemaining: boolean`.

- **`relations`** _(optional)_ — add-on dependencies (see §4.3):
  - `parentProductIds?: string[]` — IDs this item depends on
  - `matchBehavior?: "per_ticket" | "per_order"` — how add-on quantity relates to parent quantity
  - If absent or empty, the item has no dependencies (standalone product)

> **Field naming:** contract fields are **camelCase**; machine **codes** (e.g., `messages[].code`) are **snake_case**.

---

### 6.2 Rationale (why the split looks like this)

- **Identity vs. money vs. truth:** `product` says _what it is_; `commercial` says _what you can buy now & how much_; `state` says _why_. This separation prevents accidental business logic drifting into the client.
- **Fulfillment is display‑only:** Delivery method affects icons/badges/tooltips, not purchasability. A ticket with `["eticket", "apple_pass"]` shows mobile and Wallet icons; a physical item with `["physical_mail"]` shows a shipping icon. If multiple methods exist, the UI can list them. Special fulfillment requirements (e.g., age restrictions, ID requirements) are conveyed via `state.messages[]` or badge hovercards—never hardcoded.
- **One clamp to rule them all:** only `maxSelectable` controls the quantity UI. Everything else (remaining counts, per‑order caps) are folded server‑side into that number and/or surfaced as copy.
- **Variant flexibility:** The `variant` field is forward-compatible for future differentiation (seat info, time slots, sizes). Currently minimal or empty for most tickets; used more for physical goods with attributes.

---

### 6.3 Examples (tiny, valid JSON)

#### A) Simple on‑sale ticket, mobile + Apple Wallet, clamp 6

```jsonc
{
  "product": {
    "id": "prod_ga",
    "name": "General Admission",
    "type": "ticket",
    "fulfillment": { "methods": ["eticket", "apple_pass"] }
  },
  "variant": {},
  "state": {
    "temporal": { "phase": "during", "reasons": [] },
    "supply": { "status": "available", "reasons": [] },
    "gating": {
      "required": false,
      "satisfied": true,
      "listingPolicy": "omit_until_unlocked",
      "reasons": []
    },
    "demand": { "kind": "none", "reasons": [] },
    "messages": []
  },
  "commercial": {
    "price": {
      "amount": 5000,
      "currency": { "code": "USD", "base": 10, "exponent": 2 },
      "scale": 2
    },
    "feesIncluded": false,
    "maxSelectable": 6,
    "limits": { "perOrder": 8, "perUser": 6 }
  },
  "display": { "badges": ["Popular"], "showLowRemaining": false }
}
```

#### B) Physical merch (ships), order‑level clamp 1

```jsonc
{
  "product": {
    "id": "tee_black",
    "name": "Event Tee (Black)",
    "type": "physical",
    "fulfillment": {
      "methods": ["physical_mail", "shipping"],
      "details": { "shipsFrom": "US-AL" }
    }
  },
  "variant": { "attributes": { "size": "L" } },
  "state": {
    "temporal": { "phase": "during", "reasons": [] },
    "supply": { "status": "available", "reasons": [] },
    "gating": {
      "required": false,
      "satisfied": true,
      "listingPolicy": "omit_until_unlocked",
      "reasons": []
    },
    "demand": { "kind": "none", "reasons": [] },
    "messages": []
  },
  "commercial": {
    "price": {
      "amount": 3000,
      "currency": { "code": "USD", "base": 10, "exponent": 2 },
      "scale": 2
    },
    "feesIncluded": false,
    "maxSelectable": 1,
    "limits": { "perOrder": 1 }
  },
  "display": { "badges": ["Merch"] }
}
```

#### C) Gated presale ticket (visible locked), price masked by UI, clamp=0

```jsonc
{
  "product": {
    "id": "prod_mem",
    "name": "Members Presale",
    "type": "ticket",
    "fulfillment": { "methods": ["eticket"] }
  },
  "variant": {},
  "state": {
    "temporal": { "phase": "during", "reasons": [] },
    "supply": { "status": "available", "reasons": [] },
    "gating": {
      "required": true,
      "satisfied": false,
      "listingPolicy": "visible_locked",
      "reasons": ["requires_code"]
    },
    "demand": { "kind": "none", "reasons": [] },
    "messages": [
      {
        "code": "requires_code",
        "text": "Requires access code",
        "placement": "row.under_title",
        "priority": 80
      }
    ]
  },
  "commercial": {
    "price": {
      "amount": 8000,
      "currency": { "code": "USD", "base": 10, "exponent": 2 },
      "scale": 2
    },
    "feesIncluded": false,
    "maxSelectable": 0
  },
  "display": { "badges": ["Members"], "showLowRemaining": false }
}
```

#### D) Add-on with parent dependency (per-order parking pass)

```jsonc
{
  "product": {
    "id": "addon_parking",
    "name": "Parking Pass",
    "type": "physical",
    "fulfillment": { "methods": ["will_call"] }
  },
  "variant": {},
  "state": {
    "temporal": { "phase": "during", "reasons": [] },
    "supply": { "status": "available", "reasons": [] },
    "gating": {
      "required": false,
      "satisfied": true,
      "listingPolicy": "omit_until_unlocked",
      "reasons": []
    },
    "demand": { "kind": "none", "reasons": [] },
    "messages": []
  },
  "commercial": {
    "price": {
      "amount": 2000,
      "currency": { "code": "USD", "base": 10, "exponent": 2 },
      "scale": 2
    },
    "feesIncluded": false,
    "maxSelectable": 1,
    "limits": { "perOrder": 1 }
  },
  "display": {
    "badges": ["Add-on"],
    "sectionId": "add_ons"
  },
  "relations": {
    "parentProductIds": ["prod_ga", "prod_vip"],
    "matchBehavior": "per_order"
  }
}
```

_Note: This parking pass requires a parent ticket (GA or VIP) and is limited to 1 per order regardless of ticket quantity._

---

### 6.4 Invariants & Guardrails (read before coding)

- **No price in `product` or `variant`.** Price lives only in `commercial.price`.
  _Reason:_ prevents contradictory sources of truth.
- **Clamp is king.** The **only** value that constrains the quantity UI is `commercial.maxSelectable`.
  _Do not_ clamp off `supply.remaining` or `limits.*`.
- **Fees hint only.** `feesIncluded` changes copy ("incl. fees" / "+ fees") but never math; all math is server‑computed in `pricing`.
- **Price visibility policy.** Price is shown (`priceUI="shown"`) **only** when purchasable (except `priceUI="masked"` for locked rows). Showing price for non-purchasable rows (sold out, not on sale yet) is **disallowed**.
  _Reason:_ avoids tease/anchor effects and maintains clear purchasability signals.
- **Fulfillment is never a gate.** Icons and notes only; it **MUST NOT** change purchasability.
  - **Special requirements** (age restrictions, ID requirements, redemption conditions) are conveyed via `state.messages[]` or badge hovercards.
  - **Example:** An alcohol voucher might have a message `"Must present valid ID (21+)"` or a badge `"21+"` with a hovercard explaining the requirement.
  - The panel's job is to inform the buyer **before** purchase; actual redemption (scanning QR, verifying ID) happens outside the panel scope.
- **Locked rows mask price.** When `gating.required && !satisfied`, the client masks price and hides quantity controls—even if `commercial.price` is present.
- **One currency per panel.** The server **MUST** keep currency consistent across `commercial.price` and `pricing.currency`. Clients **MUST NOT** mix.

---

### 6.5 Client do / don't (practical)

#### Do

- Render fulfillment **icons/tooltips** from `product.fulfillment.methods` (e.g., phone icon for `"eticket"`, Wallet mark for `"apple_pass"`).
- Use `display.showLowRemaining` to style urgency; interpolate counts via `state.messages[]` (templates from `context.copyTemplates`).
- Enable quantity UI only when `maxSelectable > 0` **and** the §3 purchasability boolean is true.
- Show "+ fees" / "incl. fees" based on `feesIncluded`.

#### Don't

- Don’t compute totals, taxes, fees, or discounts in the client. Use `pricing` as sent.
- Don’t gate UI on `limits.*` or `supply.remaining` directly. They are **copy** only.
- Don’t leak gated prices. Mask price when locked.
- Don’t add per‑row payment‑plan badges; surface plans only via a **panel** notice (see §5.3).

---

### 6.6 Edge cases & tests (acceptance checks)

- **Clamp beats counts**
  _Given_ `supply.status="available"`, `supply.remaining=50`, `commercial.maxSelectable=0`
  _Expect_ quantity UI hidden; row not selectable.

- **Sold out beats clamp**
  _Given_ `supply.status="none"`, `commercial.maxSelectable=5`
  _Expect_ quantity UI hidden; row shows sold‑out message from `state.messages[]`.

- **Locked masks price**
  _Given_ `gating.required=true`, `satisfied=false`, `listingPolicy="visible_locked"`
  _Expect_ price masked; quantity hidden; show lock copy from `messages[]`.

- **Free items**
  _Given_ `commercial.price.amount=0`, purchasability true, `maxSelectable>0`
  _Expect_ quantity UI enabled; display “Free” via server message template; **no** client logic to infer labels.

- **Currency consistency**
  _Given_ any item whose `commercial.price.currency.code` differs from `pricing.currency.code`
  _Expect_ client validation error or block; the server is required to normalize currency per panel.

- **Unknown fulfillment method**
  _Given_ `product.fulfillment.methods=["weird_future_channel"]`
  _Expect_ ignore unknown method; do not fail rendering.

- **Add-on without parent**
  _Given_ an add-on with `relations.parentProductIds=["prod_vip"]` but no VIP ticket in the order
  _Expect_ client may disable add-on selection or show validation message using `clientCopy`; server will reject order if submitted.

- **Add-on with per-ticket match**
  _Given_ 3 GA tickets selected and a meal voucher with `matchBehavior="per_ticket"`
  _Expect_ client allows up to 3 meal vouchers (matching parent quantity); server enforces same on submission.

---

### 6.7 Migration notes (v0.3 → v0.4)

- **Add‑on is not a product type.** Keep `type ∈ {"ticket","digital","physical"}`. Add‑on behavior is modeled via **relations** (§11).
- **Visibility → listing policy.** Replace `gating.visibilityPolicy` with `gating.listingPolicy ∈ {"omit_until_unlocked","visible_locked"}`.
- **Reason text channel unified.** Replace split `reasonTexts`/`microcopy` with `state.messages[]` (+ optional `context.copyTemplates`).
- **Price location unified.** Any legacy `variant.price`/`product.price` must move to `commercial.price`.

---

### 6.8 Quick reference tables

#### Product types

| `product.type` | Meaning                             | Common fulfillment methods               |
| -------------- | ----------------------------------- | ---------------------------------------- |
| `ticket`       | Admission or time‑bound entitlement | `eticket`, `apple_pass`, `will_call`     |
| `digital`      | Non‑physical voucher/benefit        | `eticket` (barcode), `nfc` (optional)    |
| `physical`     | Shipped or picked‑up goods          | `physical_mail`, `shipping`, `will_call` |

#### Fulfillment methods (baseline mapping)

| Method          | UI hint (non‑normative)     | Notes                              |
| --------------- | --------------------------- | ---------------------------------- |
| `eticket`       | mobile ticket icon          | QR or barcode delivered digitally  |
| `apple_pass`    | Apple Wallet icon           | Add‑to‑Wallet available            |
| `will_call`     | badge “Will Call”           | Pickup at venue                    |
| `physical_mail` | shipping truck icon         | Ships to address                   |
| `shipping`      | generic shipping badge/icon | Alias/companion to `physical_mail` |

---

### 6.9 Developer checklist (quick)

- [ ] `product` has no price/availability; only identity + optional `fulfillment`.
- [ ] `variant` contains no money; omit or keep minimal (empty `{}` for GA tickets).
- [ ] `commercial.price` is a Dinero snapshot; `maxSelectable` present; `feesIncluded` set.
- [ ] Quantity UI clamps **only** to `maxSelectable` (never `limits.*` or `supply.remaining`).
- [ ] Price masked when locked; quantity hidden when locked or sold out.
- [ ] Copy comes from `state.messages[]` / `context.copyTemplates` (no hardcoded strings).
- [ ] Fulfillment icons/tooltips driven by `product.fulfillment.methods`; unknown methods ignored.
- [ ] Add-on dependencies respected via `relations.parentProductIds` and `matchBehavior`.
- [ ] Currency consistency: all items' `commercial.price.currency.code` matches `pricing.currency.code`.

.

.

███████████▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░

.

.

## 7. Messages (Unified)

> **This section replaces the v0.3 split (`reasonTexts` + `microcopy`).**
> Rows speak through **one channel only**: `state.messages[]`.
> Panel banners live in **one channel only**: `context.panelNotices[]` (see §5).

---

### 7.1 Normative (contract you can validate)

#### A. Single row‑level channel

- Each item’s **only** inline text channel is **`state.messages[]`**.
- The client **MUST NOT** synthesize row text from machine codes (`reasons[]`) or hardcoded strings.

#### B. Message object shape

Each entry in `state.messages[]` **MUST** conform to:

```ts
{
  code: string,                           // machine code, snake_case (e.g., "sold_out", "requires_code")
  text?: string,                          // fully formatted UI string (already localized)
  params?: Record<string, unknown>,       // values to interpolate if text omitted
  placement: "row.under_title" |
             "row.under_price"  |
             "row.under_quantity" |
             "row.footer" |
             "row.cta_label",             // REQUIRED slot; unrecognized placements MUST be ignored
  variant?: "neutral" | "info" | "warning" | "error", // styling hint only; default "info"
  priority?: number                       // order within the placement; higher renders first; default 0
}
```

Rules:

- **`placement` is required.** If omitted or invalid, the client **MUST** omit that message.
- If `text` **is present**, the client renders it verbatim (no templating).
- If `text` **is absent**, the client **MUST** attempt to resolve a template by `code` in `context.copyTemplates[]` and interpolate with `params`.
  Unknown placeholders **MUST** resolve to empty string, not `{placeholder}`.
- If neither `text` nor a matching template is available, the client **MUST** omit the message.
- Messages within the **same placement** are sorted by **descending `priority`**, then **payload order**.

#### C. Relationship to axes

- Axis arrays `state.temporal.reasons[]`, `state.supply.reasons[]`, `state.gating.reasons[]`, `state.demand.reasons[]` are **machine evidence**, not UI.
- The server **SHOULD** emit one or more `messages[]` that correspond to the user‑visible outcomes of those reasons.
- The client **MUST NOT** translate reason codes to strings.

#### D. Panel vs row speech

- Panel‑level banners **MUST** come **only** from `context.panelNotices[]` (see §5).
  Row messages **MUST NOT** duplicate panel banners unless explicitly intended by the server.

#### E. Internationalization

- `messages[].text` and `copyTemplates[]` **MUST** be localized server‑side before delivery.
  Clients **MUST NOT** perform translation.

---

### 7.2 Rationale (why this is clean and survivable)

- One channel per layer eliminates precedence wars, z‑index fights, and translation drift.
- Codes stay machine‑readable (`snake_case`), text stays human‑readable (server‑owned).
- Interpolation via server templates keeps logic centralized while letting the client render instantly.

---

### 7.3 Canonical examples (tiny, valid JSON)

#### A) Sold out (row status under quantity)

```jsonc
"state": {
  "supply": { "status": "none", "reasons": ["sold_out"] },
  "messages": [
    { "code": "sold_out", "text": "Sold Out", "placement": "row.under_quantity", "priority": 100 }
  ]
}
```

#### B) Low remaining with template interpolation

```jsonc
"context": {
  "copyTemplates": [
    { "key": "remaining_low", "template": "Only {count} left!" }
  ]
},
"state": {
  "supply": { "status": "available", "reasons": [] },
  "messages": [
    { "code": "remaining_low", "params": { "count": 3 }, "placement": "row.under_quantity", "priority": 60 }
  ]
}
```

#### C) Gated (visible locked) message under title

```jsonc
"state": {
  "gating": { "required": true, "satisfied": false, "listingPolicy": "visible_locked", "reasons": ["requires_code"] },
  "messages": [
    { "code": "requires_code", "text": "Requires access code", "placement": "row.under_title", "variant": "info", "priority": 80 }
  ]
}
```

#### D) Before sale with formatted time (server pre‑formats text)

```jsonc
"state": {
  "temporal": { "phase": "before", "reasons": ["outside_window"] },
  "messages": [
    { "code": "on_sale_at", "text": "On sale Fri 10:00 AM CT", "placement": "row.under_title", "variant": "info" }
  ]
}
```

---

### 7.4 Quick decision table (when to emit common messages)

| Situation                 | Axis facts (examples)                                                   | Suggested `messages[]` entry                              | Placement            | Variant |
| ------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------- | -------------------- | ------- |
| Not on sale yet           | `temporal.phase="before"`                                               | `{ code:"on_sale_at", text:"On sale Fri 10 AM CT" }`      | `row.under_title`    | info    |
| Sales ended               | `temporal.phase="after", reasons:["sales_ended"]`                       | `{ code:"sales_ended", text:"Sales ended" }`              | `row.under_title`    | info    |
| Sold out                  | `supply.status="none", reasons:["sold_out"]`                            | `{ code:"sold_out", text:"Sold Out" }`                    | `row.under_quantity` | info    |
| Waitlist offered          | `supply.status="none", demand.kind="waitlist"`                          | `{ code:"waitlist_available", text:"Join the waitlist" }` | `row.footer`         | info    |
| Low remaining urgency     | `supply.status="available", remaining low` (server decides)             | `{ code:"remaining_low", params:{count:N} }`              | `row.under_quantity` | warning |
| Gated (visible locked)    | `gating.required=true, satisfied=false, listingPolicy="visible_locked"` | `{ code:"requires_code", text:"Requires access code" }`   | `row.under_title`    | info    |
| Members badge explanation | (badge via `display.badges`)                                            | `{ code:"members_info", text:"Exclusive to members" }`    | `row.footer`         | neutral |

> **Note:** For **hidden** gated items (`omit_until_unlocked`) there is **no row** to message. Use a **panel** notice (`requires_code`) instead (see §5).

---

### 7.5 Invariants & guardrails (REMEMBER)

- **No `reasonTexts` map.** That construct is removed. All row text is `state.messages[]` (or template resolution).
- **Do not backfill.** If the server does not provide `text` or a matching template, the client **MUST** omit the message; it must not invent "Sold out".
- **No countdown math.** If a countdown is desired, the server emits time‑boxed text and refreshes payloads; the client does not compute or tick.
- **No cross‑placement spill.** The client **MUST NOT** move messages to new placements; it either renders at the declared placement or omits.
- **Variant is cosmetic.** It influences styling only; it never alters purchasability or CTAs.

---

### 7.6 Client do / don’t (practical)

#### Do

- Sort messages **per placement** by `priority` desc, then payload order.
- Interpolate templates only when `text` is missing and a template with `key == code` exists.
- Use `params` exactly as provided (no client computation of derived params).
- Keep messages reactive: when a new payload arrives, replace the rendered set.

#### Don’t

- Don’t translate reason codes; don’t display codes to users.
- Don’t render messages with unknown `placement`.
- Don’t deduplicate “similar” messages heuristically; render exactly what the server sent (within the placement/priority rules).
- Don’t conflate row messages with panel banners.

---

### 7.7 Edge cases & tests (acceptance checks)

- **Template fallback works**
  _Given_ `messages:[{ code:"remaining_low", params:{count:2}, placement:"row.under_quantity" }]` and `copyTemplates:[{ key:"remaining_low", template:"Only {count} left!" }]`
  _Expect_ the row renders “Only 2 left!” under quantity.

- **Missing template is omitted**
  _Given_ `messages:[{ code:"foo_bar", placement:"row.footer" }]` and no matching template and no `text`
  _Expect_ no message is rendered.

- **Placement required**
  _Given_ `messages:[{ code:"sold_out", text:"Sold Out" }]` (missing `placement`)
  _Expect_ message omitted (client must not guess a location).

- **Priority ordering**
  _Given_ two messages in the same placement with priorities 90 and 50
  _Expect_ the 90 message renders above 50; within equal priorities, payload order wins.

- **Hidden gated ⇒ no row messages**
  _Given_ a gated item with `listingPolicy="omit_until_unlocked"` and `satisfied=false`
  _Expect_ **no** `messages[]` (item omitted); the hint to enter a code **must** be a panel notice (see §5).

- **Locked row masks price but still messages**
  _Given_ `gating.required=true, satisfied=false, listingPolicy="visible_locked"` and `messages:[{ code:"requires_code", ... }]`
  _Expect_ price masked (per §6) and the message displayed; quantity UI hidden.

---

### 7.8 Migration notes (v0.3 → v0.4)

- **Replace `reasonTexts` → `state.messages[]`**

  - Before: axis `reasons[]` + `reasonTexts` map → client text.
  - After: server emits `messages[]` entries with `text` **or** a `code` resolved via `copyTemplates[]`.

- **Replace `microcopy[]` → `state.messages[]`**

  - Keep the content; move to the unified structure with explicit `placement` and optional `severity`/`priority`.

- **No client dictionaries.** Any client‑side string tables must be removed in favor of server‑provided text/templates.
- **Codes stabilize; text flexes.** Keep your existing codes (`sold_out`, `requires_code`) but stop expecting the client to map them.

---

### 7.9 Developer checklist (fast audit)

- [ ] Every item that needs inline text has **`state.messages[]`** (not `reasonTexts`, not legacy `microcopy`).
- [ ] Every message has a **valid `placement`**.
- [ ] If `text` is omitted, there is a **matching `copyTemplates[key==code]`** or the message is intentionally omitted.
- [ ] Messages render in **priority order** within their placement.
- [ ] No client code translates machine codes; no hardcoded “Sold Out”, “Requires access code”, etc.

---

Up next, we can lock **§8 Rendering Composition** (truth tables for row presentation, purchasability, CTA resolution) or **§8 Gating & Unlock Flow** (pre‑unlock vs post‑unlock payloads and zero‑leak rules), depending on what you want to ship first.

.

.

███████████▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░

.

.

## 8. Rendering Composition _(Derived Atoms Only)_

> **What this section does:** turns server facts (§§3–6) into concrete UI: row presentation, purchasability, quantity/price visibility, and CTA.
> **Discipline:** derive; don't decide. **No banners**, **no strings**, **no math** unless provided by payload (see §§4–5 & §13).

---

### 8.1 Normative — Derived flags (pure functions over the contract)

The client **MUST** derive, per `items[]` element:

- **Row presentation** `presentation: "normal" | "locked"`

  - `"locked"` **iff** `state.gating.required === true` **AND** `state.gating.satisfied === false` **AND** `state.gating.listingPolicy === "visible_locked"`.
  - Otherwise `"normal"`.
  - Items with `listingPolicy="omit_until_unlocked"` **never** arrive in `items[]` (server omission; see §3.3).

- **Purchasable boolean** `isPurchasable: boolean`
  `isPurchasable = (state.temporal.phase === "during")  
&& (state.supply.status === "available")  
&& (!state.gating.required || state.gating.satisfied)`

- **Quantity UI** `quantityUI: "hidden" | "select" | "stepper"`

  - **Hidden** unless `presentation === "normal" && isPurchasable && commercial.maxSelectable > 0`.
  - If shown:

    - `"select"` when `commercial.maxSelectable === 1` (single‑tap “Add” or a 1‑step selector).
    - `"stepper"` when `commercial.maxSelectable > 1`.

- **Price UI** `priceUI: "hidden" | "masked" | "shown"`

  - `"masked"` when `presentation === "locked"`.
  - `"shown"` **iff** `presentation === "normal"` **AND** `isPurchasable === true`.
  - Otherwise `"hidden"`.
    _(This is intentionally stricter than some prior drafts: sold‑out or out‑of‑window rows do **not** show price; we avoid tease/anchor effects unless purchasable.)_

- **CTA** `cta.kind: "quantity" | "waitlist" | "notify" | "none"` with `cta.enabled: boolean`

  - **Gate precedence:** if `presentation === "locked"`, `cta.kind="none"`.
  - Else, evaluate in order:

    1. If `isPurchasable` → `cta.kind="quantity"` and `cta.enabled = (commercial.maxSelectable > 0)`.
    2. Else if `state.supply.status === "none"` **and** `state.demand.kind === "waitlist"` → `cta.kind="waitlist"` (enabled).
    3. Else if `state.temporal.phase === "before"` **and** `state.demand.kind === "notify_me"` → `cta.kind="notify"` (enabled).
    4. Else → `cta.kind="none"`.

- **CTA label text**

  - The **button label** (when textual) **MUST** come from the payload:

    - Prefer a row message with `placement: "row.cta_label"` and `text` (or `code` + `copyTemplates`, see §5.4).
    - The client **MUST NOT** hardcode “Join Waitlist” / “Notify Me” / “Add” strings.

  - Quantity controls MAY be icon‑only; if text is used, it must also come from payload copy.

> **No “Request” CTA:** approval/requests are **out of scope** for v0.4 (see §13).

---

### 8.2 Decision tables (mechanical mapping)

#### A) Presentation

| Condition                                                                                      | `presentation` |
| ---------------------------------------------------------------------------------------------- | -------------- |
| `gating.required && !gating.satisfied && listingPolicy="visible_locked"`                       | `locked`       |
| Otherwise                                                                                      | `normal`       |
| _(Items omitted by server—`omit_until_unlocked`—do not appear and thus have no presentation.)_ | —              |

#### B) Purchasable

| `temporal.phase` | `supply.status` | Gate satisfied?              | `isPurchasable` |
| ---------------- | --------------- | ---------------------------- | --------------- |
| `"during"`       | `"available"`   | `(!required \|\| satisfied)` | `true`          |
| Any other combo  | Any other combo | Any                          | `false`         |

#### C) CTA resolution (in order; first match wins)

| Condition                                                           | `cta.kind` | Notes                                                                   |
| ------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------- |
| `presentation === "locked"`                                         | `none`     | Gate precedence; see §3.5                                               |
| `isPurchasable`                                                     | `quantity` | Quantity control shown if `commercial.maxSelectable > 0`                |
| `supply.status === "none"` **AND** `demand.kind === "waitlist"`     | `waitlist` | Label from `messages[]` or `copyTemplates`; action handler is app‑level |
| `temporal.phase === "before"` **AND** `demand.kind === "notify_me"` | `notify`   | Label from payload                                                      |
| Otherwise                                                           | `none`     | Purely informational row                                                |

#### D) Quantity & Price visibility

| `presentation` | `isPurchasable` | `maxSelectable` | `quantityUI` | `priceUI` |
| -------------- | --------------- | --------------- | ------------ | --------- |
| `locked`       | —               | —               | hidden       | masked    |
| `normal`       | `false`         | any             | hidden       | hidden    |
| `normal`       | `true`          | `0`             | hidden       | shown     |
| `normal`       | `true`          | `1`             | select       | shown     |
| `normal`       | `true`          | `> 1`           | stepper      | shown     |

> **Remember:** `maxSelectable` is **authoritative**. Never recompute min/max from counts/limits (see §13).

---

### 8.3 Interaction & data refresh (authoritative loop)

- **All interactions** (quantity changes, unlock attempts, demand CTAs) **MUST** call the server and rely on a refreshed payload. The client **MUST** re‑derive presentation from the new data; no local toggling of truth.
- **Access code:** submit → server validates → refreshed `items[]` (locked → unlocked or omitted → included), `gatingSummary` updated.
  **Client MUST NOT** locally flip `gating.satisfied`.
- **Quantity change:** client sends proposed selection → server recomputes clamps and pricing → client renders updated `commercial.maxSelectable` + `pricing`.
  **Client MUST NOT** compute totals/fees/discounts.

---

### 8.4 Rollups (panel‑level, no copy)

The client **MAY** derive rollups **only** for layout/controls, never to show banners:

- `selectionValid` — computed from `context.orderRules` (min types/tickets) and current selection; gates the bottom “Continue” button (out of this contract’s copy scope; string comes from app).
- `allVisibleSoldOut` — `items.every(i => i.state.supply.status === "none")`.
  Used **only** with `effectivePrefs.showTypeListWhenSoldOut === false` to collapse the list.
  **MUST NOT** generate a “Sold out” banner; show one only if `panelNotices[]` contains it.
- `anyLockedVisible` — `items.some(i => presentation === "locked")`.
  Could be used to surface an **app‑level** unlock affordance (UI only). **Never** invent text.

---

### 8.5 Examples (compact, valid JSON + expected renders)

#### A) Waitlist CTA

```jsonc
{
  "state": {
    "temporal": { "phase": "during", "reasons": [] },
    "supply": { "status": "none", "reasons": ["sold_out"] },
    "gating": {
      "required": false,
      "satisfied": true,
      "listingPolicy": "omit_until_unlocked",
      "reasons": []
    },
    "demand": { "kind": "waitlist", "reasons": ["waitlist_available"] },
    "messages": [
      {
        "code": "sold_out",
        "text": "Sold Out",
        "placement": "row.under_quantity"
      },
      {
        "code": "waitlist_cta",
        "text": "Join Waitlist",
        "placement": "row.cta_label"
      }
    ]
  },
  "commercial": {
    "price": {
      "amount": 12000,
      "currency": { "code": "USD", "base": 10, "exponent": 2 },
      "scale": 2
    },
    "feesIncluded": false,
    "maxSelectable": 0
  }
}
```

- **Derived:** `presentation="normal"`, `isPurchasable=false`, `quantityUI=hidden`, `priceUI=hidden`, `cta.kind="waitlist"` with label **"Join Waitlist"** from the row message.

#### B) Notify‑me CTA (before window)

```jsonc
{
  "state": {
    "temporal": { "phase": "before", "reasons": ["outside_window"] },
    "supply": { "status": "available", "reasons": [] },
    "gating": {
      "required": false,
      "satisfied": true,
      "listingPolicy": "omit_until_unlocked",
      "reasons": []
    },
    "demand": { "kind": "notify_me", "reasons": [] },
    "messages": [
      {
        "code": "outside_window",
        "text": "On sale Friday 10:00 AM CT",
        "placement": "row.under_title"
      },
      {
        "code": "notify_cta",
        "text": "Notify Me",
        "placement": "row.cta_label"
      }
    ]
  },
  "commercial": {
    "price": {
      "amount": 5000,
      "currency": { "code": "USD", "base": 10, "exponent": 2 },
      "scale": 2
    },
    "feesIncluded": false,
    "maxSelectable": 0
  }
}
```

- **Derived:** `presentation="normal"`, `isPurchasable=false`, `cta.kind="notify"` with label **"Notify Me"**.

#### C) Visible locked (price masked)

```jsonc
{
  "state": {
    "temporal": { "phase": "during", "reasons": [] },
    "supply": { "status": "available", "reasons": [] },
    "gating": {
      "required": true,
      "satisfied": false,
      "listingPolicy": "visible_locked",
      "reasons": ["requires_code"]
    },
    "demand": { "kind": "none", "reasons": [] },
    "messages": [
      {
        "code": "requires_code",
        "text": "Requires access code",
        "placement": "row.under_title"
      }
    ]
  },
  "commercial": {
    "price": {
      "amount": 9000,
      "currency": { "code": "USD", "base": 10, "exponent": 2 },
      "scale": 2
    },
    "feesIncluded": false,
    "maxSelectable": 0
  }
}
```

- **Derived:** `presentation="locked"`, `priceUI="masked"`, `quantityUI=hidden`, `cta="none"`.

---

### 8.6 Pseudocode (reference; keep it boring)

```ts
function derivePresentation(item) {
  const g = item.state.gating;
  return g.required && !g.satisfied && g.listingPolicy === "visible_locked"
    ? "locked"
    : "normal";
}

function derivePurchasable(item) {
  const s = item.state;
  return (
    s.temporal.phase === "during" &&
    s.supply.status === "available" &&
    (!s.gating.required || s.gating.satisfied)
  );
}

function deriveQuantityUI(item, pres, purch) {
  if (pres !== "normal" || !purch) return "hidden";
  const max = item.commercial.maxSelectable ?? 0;
  if (max <= 0) return "hidden";
  return max === 1 ? "select" : "stepper";
}

function derivePriceUI(pres, purch) {
  if (pres === "locked") return "masked";
  return purch ? "shown" : "hidden";
}

function deriveCTA(item, pres, purch) {
  if (pres === "locked") return { kind: "none", enabled: false };
  if (purch)
    return { kind: "quantity", enabled: item.commercial.maxSelectable > 0 };
  const s = item.state;
  if (s.supply.status === "none" && s.demand.kind === "waitlist")
    return { kind: "waitlist", enabled: true };
  if (s.temporal.phase === "before" && s.demand.kind === "notify_me")
    return { kind: "notify", enabled: true };
  return { kind: "none", enabled: false };
}
```

> **Strings:** Any visible label for these controls must be supplied in `state.messages[]` (e.g., `placement: "row.cta_label"`) or resolvable via `copyTemplates` (§5.4). No hardcoded UI text.

---

### 8.7 Edge cases & tests (acceptance)

- **Gate precedence over demand**
  _Given_ `gating.required=true && !satisfied && listingPolicy="visible_locked"` **and** `demand.kind="waitlist"`
  _Expect_ `presentation="locked"`, `cta="none"`, price masked.

- **Clamp beats counts**
  _Given_ `isPurchasable=true` **and** `commercial.maxSelectable=0`
  _Expect_ `quantityUI="hidden"`, `priceUI="shown"`, `cta.kind="quantity"`, `cta.enabled=false`.

- **Unknown supply**
  _Given_ `temporal.phase="during"` **and** `supply.status="unknown"`
  _Expect_ `isPurchasable=false`, `quantityUI="hidden"`, `priceUI="hidden"`. If the server wants copy, it supplies a message (e.g., “Availability updating…”).

- **Notify vs. waitlist priority**
  _Given_ `temporal.phase="before"`, `demand.kind="notify_me"`, and later a refresh with `supply.status="none"` and `demand.kind="waitlist"`
  _Expect_ CTA moves from `notify` to `waitlist` after refresh (no client heuristics).

- **No auto banners**
  _Given_ `allVisibleSoldOut === true` **and** `context.panelNotices=[]`
  _Expect_ no banner is invented; list may collapse only if `effectivePrefs.showTypeListWhenSoldOut=false`.

- **CTA labels from payload**
  _Given_ `cta.kind="waitlist"` **and** no `row.cta_label` message or template
  _Expect_ the control renders icon‑only or as an affordance with no text; client **MUST NOT** inject a default string.

---

### 8.8 Client checklist (quick)

- [ ] Compute `presentation`, `isPurchasable`, `quantityUI`, `priceUI`, `cta` **only** from server fields.
- [ ] Do **not** invent banners or strings. Pull CTA labels via `messages[]`/`copyTemplates`.
- [ ] Respect `commercial.maxSelectable` as the **only** clamp.
- [ ] Mask price on locked rows; hide price when not purchasable.
- [ ] Collapse sold‑out lists only per `effectivePrefs.showTypeListWhenSoldOut`.
- [ ] On any interaction, call server → replace payload → re‑derive.

.

.

███████████▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░

.

.

## 13. Invariants & Guardrails (what the client MUST NOT do)

> **Why these exist:** The panel's power comes from being a **pure view** of server state. These guardrails prevent common pitfalls that lead to drift, bugs, security issues, and user confusion. By keeping all business logic server‑side, we gain: unified logic (no client/server contradictions), dynamic adaptability (same UI handles all scenarios), improved user clarity (server knows exact reasons), and security (client cannot bypass rules).

### Hard rules (non‑negotiable)

- **No schedule math.** Do **not** compute countdowns or sale windows. Use `temporal.phase` and any server‑supplied text.
  - **Why:** Timezones, DST transitions, and schedule pauses make client‑side time math brittle. Sales can be paused mid‑window for operational reasons. The server is authoritative.
- **No availability math.** Do **not** infer "sold out" or "low stock" from numbers. Use `supply.status` and server messages.
  - **Why:** Counts can be stale; seat maps impose adjacency constraints; holds exist. A single `status` decision from the server avoids race conditions and incorrect displays.
- **No price math.** Do **not** compute totals, fees, taxes, discounts, or installment effects. Render `pricing` verbatim.
  - **Why:** Tax rules, promotional discounts, and installment schedules have complex business logic. Client‑computed prices create a "gray area" where displayed totals contradict the actual charge.
  - **Money architecture:** All monetary values are **Dinero.js V2 snapshots**. Nothing happens to money outside Dinero utils. The client receives Dinero snapshots, **MAY** format for display using Dinero utils or directly from snapshot values, but **MUST NOT** perform arithmetic. All calculations happen server-side.
- **No clamp math.** Do **not** derive selection limits from counts or limits. Enforce **only** `commercial.maxSelectable`.
  - **Why:** Multiple constraints (per‑order, per‑user, remaining, fraud rules) combine server‑side. A single clamp prevents contradictory UI behavior and respects all policies.
- **No gate logic.** Do **not** validate access codes, apply rate limits, or reveal omitted SKUs. Respect `gating.satisfied` and `listingPolicy`.
- **No hidden‑SKU inference.** Do **not** guess names/counts/prices for omitted items. The **only** hint is `gatingSummary.hasHiddenGatedItems`.
- **No ad‑hoc banners or row text.** Render **only** `context.panelNotices[]` and `state.messages[]` (or `copyTemplates`/`clientCopy` when specified).
- **No approval/request flows.** There is **no** approval concept in this contract; do not invent a “Request” CTA.
- **No per‑row payment‑plan badges.** Payment plans surface via a **panel** notice, not per item.
- **No legacy fields.** The schema is authoritative; if a field isn’t defined here, it doesn’t exist.

### What the client MAY derive (presentation only)

The client **derives UI state** from server facts using pure functions (atoms). These derivations are **re-run** when new payloads arrive, using the new facts. The client never predicts or back-calculates server state.

**Allowed derivations:**

- **Row presentation:** `normal | locked` from server facts (locked = present + `gating.required && !satisfied`).
  - Items with `listingPolicy="omit_until_unlocked"` are not sent; they have no presentation state.
- **Purchasable boolean:** `temporal.phase="during"` AND `supply.status="available"` AND (gate satisfied or not required).
- **CTA selection:** `purchase` / `join_waitlist` / `notify_me` / `none` from **server fields only** (`demand.kind`, `supply.status`, `temporal.phase`, gating).
- **Selection validity:** Enable/disable bottom CTA against `context.orderRules` (min types/tickets), without computing business policy.

**Key principle:** These are **pure transformations** of server data into UI state. Atoms compose server facts; they do not compute business decisions.

### Security guardrails

> **Threat model:** Because all business logic lives server‑side, the system is robust against client‑side tampering. Users cannot unlock hidden tickets, bypass purchase limits, or discover secret SKUs except by calling the server, which validates everything. The client is a "dumb terminal" that respects server state—**security by architecture**, not by obfuscation.

- **Access codes & tokens**

  - Do **not** log access codes or gating tokens in analytics, errors, or URLs.
    - **Why:** Prevents code leakage in logs, error reports, or shared links.
  - Do **not** persist gating tokens beyond server TTL or across accounts.
    - **Why:** Tokens are single‑session credentials; reuse across accounts or after expiry bypasses server validation.
  - All unlock attempts go to the server; client performs no retries beyond normal UX.
    - **Why:** Server enforces rate limiting and tracks brute‑force attempts; client retries would bypass these protections.

- **Data exposure**

  - Do **not** display machine codes directly; show payload‑supplied text only.
    - **Why:** Machine codes (`sold_out`, `requires_code`) are internal; exposing them in UI creates support burden and leaks implementation details.
  - Do **not** render price for locked rows (`visible_locked`); price is masked.

- **Caching & staleness**

  - Do **not** predict or back-calculate business state; always re-derive presentation from new server facts.
    - **Why:** The client derives UI state (presentation, CTA, purchasability) from server facts via atoms. When a new payload arrives, atoms re-run their derivation functions using the **new facts**. The client never attempts to predict what the next server state will be (e.g., flipping `temporal.phase` based on local clock) or back-calculate business decisions (e.g., recomputing `maxSelectable` from `remaining`).
    - **Pattern:** New payload → atoms re-derive → React re-renders. No local state contradicts server state.
  - Do **not** cache omitted items or speculate their presence.
    - **Why:** Omitted items (`listingPolicy="omit_until_unlocked"`) are a zero‑leak security feature. Caching defeated items reveals their existence.

### Allowed vs. forbidden (quick matrix)

| Action                                       | Allowed? | Source of truth                   |
| -------------------------------------------- | -------- | --------------------------------- |
| Show “Sold Out” on a row                     | ✅       | `supply.status="none"` + messages |
| Show “Enter access code” banner              | ✅       | `context.panelNotices[]`          |
| Enable “Join Waitlist” CTA                   | ✅       | `demand.kind="waitlist"`          |
| Mask price on a locked row                   | ✅       | `gating.required && !satisfied`   |
| Compute countdown to sale start              | ❌       | Use server‑provided messaging     |
| Derive maxSelectable from `remaining`/limits | ❌       | Use `commercial.maxSelectable`    |
| Add a custom “Event Sold Out” banner         | ❌       | Only `panelNotices[]`             |
| Display per‑row "Payment Plan" badge         | ❌       | Use panel notice                  |

---

### Next steps (tight, build‑ready)

- Lock enums and shapes in the schemas: `supply`, `gating.listingPolicy`, `demand`, `state.messages[]`, `panelNotices[]`, `gatingSummary`, `orderRules`.
- Add Storybook fixtures to exercise guardrails: available, sold out + waitlist, `visible_locked`, `omit_until_unlocked`, public‑sold‑out + hidden‑gated.
- Draft **Appendix: Terminology & Migration Notes** with the full forbidden→preferred mapping (for authors only), keeping Section 2 purely normative.

.

.

███████████▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░

.

.

## 9. Gating & Unlock (No Leakage)

> **Purpose:** Define how access‑controlled items are represented, hidden, revealed, and rendered—without leaking SKU identity, price, or counts before authorization. This section is **normative** and composes with §§3.3, 5.3/5.3a, 7, 8, and 13.

---

### 9.1 Normative

#### A. Authoritative fields & sendability

- Each item’s gating lives in `state.gating`:
  `{ required: boolean, satisfied: boolean, listingPolicy: "omit_until_unlocked"|"visible_locked", reasons[], requirements?[] }`.
  See §3.3 for the full axis shape.
- **Default sendability:** If `required=true` **and** `satisfied=false` and `listingPolicy` is **absent**, treat it as `"omit_until_unlocked"`.
- **Omit policy (`"omit_until_unlocked"`):**

  - When unsatisfied, the item **MUST NOT** appear in `items[]`.
  - The **only** allowed hint is `context.gatingSummary.hasHiddenGatedItems: boolean`. No placeholders, no counts, no names.

- **Visible‑locked policy (`"visible_locked"`):**

  - When unsatisfied, the item **MUST** be present in `items[]` but rendered as **locked**.
  - While locked, price **MUST** be **masked**, quantity UI **MUST** be **hidden**, and row CTA **MUST** be **none** (see §8 decision tables).

- **Unlock transition:** Upon successful unlock, the server **MUST**:

  - Include previously omitted items in `items[]` **or** flip visible‑locked rows to `gating.satisfied=true`.
  - Recompute `commercial.maxSelectable` and `pricing` as needed.
  - Update `context.gatingSummary.hasHiddenGatedItems` accordingly (see §9.4).

#### B. GatingSummary (panel‑level hints)

- `context.gatingSummary` **MUST** be present **iff** gating exists for the event.
- It **MUST** include:

  - `hasHiddenGatedItems: boolean` — `true` **iff** there exists at least one **omitted** gated item that currently has purchasable stock (per §8 purchasability) or could become available during the current session (server decision).
    _Do not set true for items that are omitted but permanently unavailable._

- It **MAY** include:

  - `hasAccessCode: boolean` — feature presence hint only.

- Clients **MUST NOT** infer anything beyond this boolean (no SKU counts, no names, no ranges).

#### C. Unlock UX derivation (panel‑level, not notices)

- The access‑code UI (the **AccessCodeCTA**) is **derived**, not configured:

  - It **MUST** appear when **either**:

    - `context.gatingSummary.hasHiddenGatedItems === true`, **or**
    - Any visible item is locked: `gating.required && !gating.satisfied && listingPolicy="visible_locked"`.
      _(Matches §5.3a.)_

- Panel banners about codes (e.g., instructional “Enter access code…”) **MUST** come from `context.panelNotices[]` (optional). The AccessCodeCTA itself is **not** a notice (see §5.3/§5.3a).

#### D. No leakage & precedence

- Clients **MUST NOT**:

  - Render row placeholders for omitted items.
  - Display or log codes, tokens, or any derived inference about hidden SKUs.
  - Surface demand CTAs (waitlist/notify) for an item while it is gated and unsatisfied. **Gating precedence applies.** (See §3.5 and §8.)

- Locked rows (`visible_locked`) **MUST** mask price and hide quantity controls regardless of `commercial.price` presence (§6).

#### E. Validation & error handling

- Access‑code validation, rate limiting, and unlock token issuance happen **server‑side**. The client **MUST NOT** validate or rate‑limit locally.
- On invalid/expired code, the server returns a payload state that conveys errors via:

  - A panel‑level notice (e.g., `{ code:"code_invalid", variant:"error", text:"Invalid access code" }`), **or**
  - A row message for a **still‑locked** row (e.g., `{ code:"code_invalid", placement:"row.under_title", variant:"error" }`).
    The client renders **only** what the payload says (no local strings), per §7.

#### F. Requirements metadata (optional, for copy only)

- `gating.requirements[]` **MAY** include structured facts (e.g., `{ kind:"unlock_code", satisfied:false, validWindow, limit }`).
- Clients **MUST** treat `requirements[]` as **explanatory** metadata only (copy and tooling). They **MUST NOT** derive purchasability or sendability from it. `gating.satisfied` remains authoritative.

#### G. State replacement

- After any unlock attempt, the client **MUST** replace local derived state from the **new** payload (no local flips, no predictions). See §8.3 and §13.

---

### 9.2 Rationale

- **Zero‑leak default:** Scrapers love disabled rows. `omit_until_unlocked` eliminates name/price leakage by not sending the row at all.
- **Two explicit modes:** Marketing sometimes needs a tease. `visible_locked` is the opt‑in tease, with strict masking rules.
- **One unlock surface:** Keeping the AccessCodeCTA panel‑level avoids per‑row code UX complexity and aligns with `gatingSummary`.
- **Server as oracle:** The server owns the unlock lifecycle, stock truth, and clamp. The client merely re‑renders on new facts.

---

### 9.3 Decision tables

#### A) Sendability & presentation

| `required` | `satisfied` | `listingPolicy`       | In `items[]`? | Row `presentation` | Price UI | Quantity UI | Row CTA |
| ---------- | ----------- | --------------------- | ------------- | ------------------ | -------- | ----------- | ------- |
| false      | —           | —                     | ✅            | `normal`           | per §8   | per §8      | per §8  |
| true       | false       | `omit_until_unlocked` | ❌            | —                  | —        | —           | —       |
| true       | false       | `visible_locked`      | ✅            | `locked`           | masked   | hidden      | none    |
| true       | true        | _(either)_            | ✅            | `normal`           | per §8   | per §8      | per §8  |

#### B) When to show the AccessCodeCTA (panel‑level)

| Condition                                                                            | Show AccessCodeCTA? |
| ------------------------------------------------------------------------------------ | ------------------- |
| `context.gatingSummary.hasHiddenGatedItems === true`                                 | ✅                  |
| Any visible item locked (`required && !satisfied && listingPolicy="visible_locked"`) | ✅                  |
| Neither of the above                                                                 | ❌                  |

> Instructional banners about codes are optional notices (`context.panelNotices[]`), separate from the AccessCodeCTA.

#### C) Demand precedence (no leakage)

| Locked state? (`required && !satisfied`) | `demand.kind`              | Row CTA                  |
| ---------------------------------------- | -------------------------- | ------------------------ |
| true                                     | `"waitlist"`/`"notify_me"` | **none**                 |
| false                                    | `"waitlist"`               | `join_waitlist` (per §8) |
| false                                    | `"notify_me"`              | `notify` (per §8)        |

---

### 9.4 Server obligations (for clarity)

- **`hasHiddenGatedItems` truthiness:**
  Set `true` when **any omitted** gated SKU is meaningfully unlockable (e.g., has stock or may open during the current sale), `false` otherwise. Do not thrash this flag for transient, non‑purchasable states.
- **After unlock:**

  - Include newly unlocked items (previously omitted), or flip `satisfied=true` on formerly locked items.
  - Recompute `commercial.maxSelectable` and all `pricing`.
  - Adjust `hasHiddenGatedItems` to reflect remaining hidden stock (it may stay `true` if the code only unlocked a subset).

- **Error states:** Convey invalid/expired/limit‑exhausted outcomes via messages/notices; never rely on client‑invented copy.

---

### 9.5 Examples (tiny, canonical)

#### A) Hidden until unlock (default)

```jsonc
// Payload (pre-unlock): the gated item is omitted; only a hint + optional notice
"context": {
  "gatingSummary": { "hasHiddenGatedItems": true },
  "panelNotices": [
    { "code": "requires_code", "variant": "info", "text": "Enter access code to view tickets", "priority": 90 }
  ]
},
"items": [
  // ... public items only
]
```

#### B) Visible locked (tease)

```jsonc
{
  "product": {
    "id": "prod_members",
    "name": "Members Presale",
    "type": "ticket"
  },
  "state": {
    "temporal": { "phase": "during", "reasons": [] },
    "supply": { "status": "available", "reasons": [] },
    "gating": {
      "required": true,
      "satisfied": false,
      "listingPolicy": "visible_locked",
      "reasons": ["requires_code"]
    },
    "demand": { "kind": "none", "reasons": [] },
    "messages": [
      {
        "code": "requires_code",
        "text": "Requires access code",
        "placement": "row.under_title",
        "variant": "info",
        "priority": 80
      }
    ]
  },
  "commercial": {
    "price": {
      "amount": 9000,
      "currency": { "code": "USD", "base": 10, "exponent": 2 },
      "scale": 2
    },
    "feesIncluded": false,
    "maxSelectable": 0
  },
  "display": { "badges": ["Members"] }
}
```

#### C) After successful unlock

```jsonc
// Same item after server validation
"state": {
  "temporal": { "phase": "during", "reasons": [] },
  "supply": { "status": "available", "reasons": [] },
  "gating": { "required": true, "satisfied": true, "listingPolicy": "visible_locked", "reasons": [] },
  "demand": { "kind": "none", "reasons": [] },
  "messages": []
},
"commercial": { "maxSelectable": 2 }
```

#### D) Invalid code (panel‑level)

```jsonc
"context": {
  "gatingSummary": { "hasHiddenGatedItems": true },
  "panelNotices": [
    { "code": "code_invalid", "variant": "error", "text": "Invalid access code. Please try again.", "priority": 100 }
  ]
}
```

#### E) Requirements metadata (explanatory only)

```jsonc
"gating": {
  "required": true,
  "satisfied": false,
  "listingPolicy": "visible_locked",
  "requirements": [{
    "kind": "unlock_code",
    "satisfied": false,
    "validWindow": { "startsAt": "2025-10-22T00:00:00Z", "endsAt": "2025-10-25T23:59:59Z" },
    "limit": { "maxUses": 100, "usesRemaining": 23 }
  }],
  "reasons": ["requires_code"]
}
```

#### F) Public sold out + hidden gated (no “sold out” dead‑end)

```jsonc
"context": {
  "gatingSummary": { "hasHiddenGatedItems": true },
  "panelNotices": [
    { "code": "requires_code", "variant": "info", "text": "Enter access code to view tickets", "priority": 90 }
  ]
},
"items": [
  // public items with supply.status="none"
],
// Panel SHOULD NOT collapse to final sold-out state; show AccessCodeCTA.
```

---

### 9.6 Tests (acceptance checks)

- **Omit enforcement**
  _Given_ `required=true`, `satisfied=false`, `listingPolicy="omit_until_unlocked"`
  _Expect_ item **absent** from `items[]`; `context.gatingSummary.hasHiddenGatedItems=true` **iff** omitted stock is meaningfully available.

- **Locked rendering**
  _Given_ `required=true`, `satisfied=false`, `listingPolicy="visible_locked"`
  _Expect_ row `presentation="locked"`, **price masked**, **quantity hidden**, **CTA none**; render any messages per §7.

- **Unlock transition**
  _When_ server validates code → next payload has either newly included items or flipped `satisfied=true`
  _Expect_ client to **replace** state and re‑derive (§8). No local flips.

- **Gating precedence over demand**
  _Given_ locked row and `demand.kind="waitlist"`
  _Expect_ **no** waitlist CTA until `satisfied=true`. (Row CTA remains none.)

- **AccessCodeCTA derivation**
  _Given_ `hasHiddenGatedItems=true` **or** any visible locked row
  _Expect_ AccessCodeCTA present (panel‑level).
  _Given_ neither condition
  _Expect_ no AccessCodeCTA.

- **Error surfacing**
  _Given_ invalid code
  _Expect_ error displayed **only** via payload text (panel notice or row message); no client‑invented copy.

- **No leakage**
  _Given_ omitted items
  _Expect_ no SKU placeholders, names, or prices in UI or logs; only the boolean hint in `gatingSummary`.

- **Price masking**
  _Given_ `presentation="locked"`
  _Expect_ price UI **masked** even if `commercial.price` is present.

- **Partial unlock**
  _Given_ code unlocks a subset of gated SKUs
  _Expect_ newly unlocked items included; `hasHiddenGatedItems` may remain `true` if others remain omitted.

---

### 9.7 Developer checklist (quick)

- [ ] Enforce sendability: omit vs visible‑locked exactly as specified by `listingPolicy`.
- [ ] Show AccessCodeCTA when `hasHiddenGatedItems` is true **or** any visible row is locked.
- [ ] Mask price + hide quantity on locked rows; no row CTA while locked.
- [ ] Do not render demand CTAs (waitlist/notify) for locked rows.
- [ ] Never invent copy; render `messages[]` / `panelNotices[]` only (templates via `copyTemplates`).
- [ ] After unlock attempt, re‑render from **new** payload; do not toggle `satisfied` locally.
- [ ] Do not log codes/tokens (see §13 Security guardrails).

---

### 9.8 Consistency audit (cross‑section)

- **§3.3 (Gating axis):** Listing policy, reasons, and `requirements[]` semantics are unchanged and respected here. ✅
- **§5.3/5.3a (Prefs & CTAs):** AccessCodeCTA derivation and panel‑notice separation match the rules above. ✅
- **§7 (Messages):** All user copy comes from `messages[]`/`panelNotices[]`/`copyTemplates`; no `reasonTexts` usage. ✅
- **§8 (Rendering):** Presentation, price masking, CTA resolution (including precedence) align with the decision tables here. ✅
- **§13 (Guardrails):** No schedule/availability/clamp math; no leakage; no local unlock; no per‑row payment‑plan badges. ✅

> With these rules, gated flows stay secure by architecture: hidden items don’t exist client‑side until the server says otherwise, and visible locks never leak price or enable alternate CTAs prematurely.

.

.

███████████▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░

.

.

## 10. Relations & Add‑ons _(selection vs ownership; `matchBehavior`)_

> **What this section does:** defines how a row can **depend on** other rows (parents), and how the client presents and validates those dependencies **without** inventing business rules. This is **not** a new axis; it’s metadata used to constrain selection and explain behavior.

---

### 10.1 **Normative (contract you can validate)**

#### A. Shape

- An item **MAY** include `relations`:

  ```ts
  relations?: {
    parentProductIds?: string[];         // IDs this item depends on
    matchBehavior?: "per_ticket" | "per_order";
  }
  ```

- If `relations.parentProductIds` is **absent or empty** ⇒ the item is **standalone** (not an add‑on).
- If `relations.parentProductIds` is **present and non‑empty** ⇒ the item is an **add‑on** to those **parent** products (IDs must match `items[].product.id` present or potentially present in this panel).

#### B. Semantics (ownership & selection)

- **Add‑on definition:** Any item with `parentProductIds[]` is an **add‑on**. “Add‑on” is a **relationship**, not a product type. `product.type` stays `"ticket" | "digital" | "physical"`.
- **Parent set:** The **parent set** for an add‑on is the multiset sum of selected quantities across **all** `parentProductIds` that are currently visible/unlocked.

  - Let `parentSelectedCount = Σ selection[parentId]` across the listed IDs (client selection state).

- **`matchBehavior` meaning:**

  - `"per_ticket"` ⇒ An add‑on can be selected **at most** one‑for‑one with **the current** `parentSelectedCount`.
  - `"per_order"` ⇒ An add‑on is limited **at the order level** regardless of parent quantity (typically one per order or a small cap).

- **Default:** If `parentProductIds[]` exists and `matchBehavior` is **omitted**, clients **MUST** treat it as `"per_order"` for compatibility.

#### C. Server responsibilities

- **Authoritative clamp:** `commercial.maxSelectable` remains the **authoritative cap** for every item (see §§4, 6, 13).
  The server **MUST** recompute `maxSelectable` for add‑ons on every payload refresh to reflect:

  - stock/holds/limits **and**
  - the current selection of their parents (per `matchBehavior`).

- **Parent‑absent state:** When `parentSelectedCount === 0`, the server **SHOULD** send `maxSelectable=0` for add‑ons; on parent selection changes, it **MUST** update `maxSelectable` accordingly in the next payload.
- **Gating zero‑leak:** If **all** parents for an add‑on are omitted due to gating (`omit_until_unlocked`) or are otherwise not sendable, the add‑on **MUST** also be omitted (or sent with `maxSelectable=0` and its own gating), so that parent existence is not leaked.
- **Multi‑parent:** When multiple parents are listed, the server’s clamp **MUST** reflect the **sum** of all selected parents for `"per_ticket"`, or the order cap for `"per_order"` (still ≤ `maxSelectable`).

#### D. Client responsibilities

- **Never invent caps:** The client **MUST NOT** compute or enforce numeric quantity caps besides `commercial.maxSelectable`.
  _Corollary:_ The client **MUST** initiate a payload refresh whenever parent selection changes so the server can update dependent `maxSelectable` values.
- **Visibility & purchasability:** Add‑ons follow the **same** axes rules as any item (temporal, supply, gating, demand). If `maxSelectable=0` or the derived `isPurchasable` (§8) is false, quantity UI is hidden.
- **Parent presence affordance:** When an add‑on has `parentProductIds[]` and `maxSelectable=0`, the client **MAY** render explanatory copy using server‑provided strings (e.g., `clientCopy.addon_requires_parent`) but **MUST NOT** inject local prose.
- **Reduce on refresh:** If a payload refresh lowers `maxSelectable` below the user’s current add‑on selection, the client **MUST** clamp the selection down to the new `maxSelectable` (see §8 and selection family) and reflect it immediately.
- **No leakage:** Clients **MUST NOT** infer or surface any information about parents that are omitted due to gating. No placeholders, counts, or prices.

#### E. Interactions with other fields

- **Limits & caps:** `limits.perOrder`/`limits.perUser` remain informational; `maxSelectable` already reflects them. Clients **MUST NOT** enforce `limits.*` directly.
- **Demand:** Add‑ons **may** use `demand.kind` (`waitlist`, `notify_me`) like any item. Gating precedence (§3.5) still applies.
- **Sectioning:** The server **SHOULD** place add‑ons under a distinct section via `display.sectionId` (e.g., `"add_ons"`), but clients **MUST** render them wherever they are assigned.

---

### 10.2 **Rationale (why this shape works)**

- Keeps **one clamp** (`maxSelectable`) as the only numeric authority while allowing **relationship semantics** (per‑ticket/per‑order) to be expressed server‑side and reflected on each refresh.
- Avoids client‑side math races (parent changes while stock updates) and **prevents leakage** when parents are gated/omitted.
- Scales from trivial (one parking pass per order) to complex (many parents, dynamic holds) without changing client code.

---

### 10.3 **Examples (tiny, canonical)**

#### A) Per‑ticket meal voucher (initial: no parent selected)

```jsonc
{
  "product": { "id": "addon_meal", "name": "Meal Voucher", "type": "digital" },
  "relations": {
    "parentProductIds": ["prod_ga", "prod_vip"],
    "matchBehavior": "per_ticket"
  },
  "state": {
    "temporal": { "phase": "during", "reasons": [] },
    "supply": { "status": "available", "reasons": [] },
    "gating": {
      "required": false,
      "satisfied": true,
      "listingPolicy": "omit_until_unlocked",
      "reasons": []
    },
    "demand": { "kind": "none", "reasons": [] },
    "messages": [
      {
        "code": "addon_requires_parent",
        "text": "Add at least one ticket to select this add‑on",
        "placement": "row.under_quantity",
        "variant": "neutral",
        "priority": 40
      }
    ]
  },
  "commercial": {
    "price": {
      "amount": 1500,
      "currency": { "code": "USD", "base": 10, "exponent": 2 },
      "scale": 2
    },
    "feesIncluded": false,
    "maxSelectable": 0
  },
  "display": { "badges": ["Add‑on"], "sectionId": "add_ons" }
}
```

_After the buyer selects **3** GA tickets and the client refreshes the payload:_

```jsonc
"commercial": {
  "price": { "amount": 1500, "currency": { "code": "USD", "base": 10, "exponent": 2 }, "scale": 2 },
  "feesIncluded": false,
  "maxSelectable": 3
}
```

#### B) Per‑order parking pass (cap 1), parent required

```jsonc
{
  "product": {
    "id": "addon_parking",
    "name": "Parking Pass",
    "type": "physical"
  },
  "relations": {
    "parentProductIds": ["prod_ga", "prod_vip"],
    "matchBehavior": "per_order"
  },
  "state": {
    "temporal": { "phase": "during", "reasons": [] },
    "supply": { "status": "available", "reasons": [] },
    "gating": {
      "required": false,
      "satisfied": true,
      "listingPolicy": "omit_until_unlocked",
      "reasons": []
    },
    "demand": { "kind": "none", "reasons": [] },
    "messages": []
  },
  "commercial": {
    "price": {
      "amount": 2000,
      "currency": { "code": "USD", "base": 10, "exponent": 2 },
      "scale": 2
    },
    "feesIncluded": false,
    "limits": { "perOrder": 1 },
    "maxSelectable": 0 // before any parent selected
  },
  "display": { "badges": ["Add‑on"], "sectionId": "add_ons" }
}
```

_After selecting any parent tickets (≥1), refresh yields `maxSelectable: 1`._

#### C) Hidden parent ⇒ add‑on omitted (zero‑leak)

```jsonc
// Parent product is gated and omitted with listingPolicy="omit_until_unlocked".
// The add‑on referencing only that parent is also omitted.
// Context hints gating, but does not leak what the add‑on is.
"context": {
  "gatingSummary": { "hasHiddenGatedItems": true },
  "panelNotices": [
    { "code": "requires_code", "text": "Enter access code to view all available options", "variant": "info", "priority": 90 }
  ]
}
```

---

### 10.4 **How the UI derives behavior (mechanical)**

> These rules use **only** server facts + current selection, and never compute money or availability.

- **Quantity UI shows** only when (§8):

  - `presentation === "normal"` **and**
  - `isPurchasable === true` **and**
  - `commercial.maxSelectable > 0`.

- **Add‑on enablement loop (client duties):**

  1. Parent selection changes → **POST** selection → server recalculates clamps/pricing.
  2. Client receives refreshed payload → re‑derives UI.
  3. Any add‑on whose `maxSelectable` increased/decreased updates its UI accordingly.

- **“Per ticket” experience:** Buyers **experience** a one‑for‑one cap because the server reflects parent totals in `maxSelectable` on each refresh. The client **does not** compute a local numeric cap.
- **“Per order” experience:** The server typically returns `maxSelectable=1` once any parent is selected; the client shows a single‑select affordance.

---

### 10.5 **Edge cases & tests (acceptance checks)**

- **Parent absent ⇒ add‑on disabled**
  _Given_ `relations.parentProductIds=["prod_ga"]`, `parentSelectedCount=0`
  _Expect_ server sends `maxSelectable=0`; quantity UI hidden; any row message comes from payload (no client prose).

- **Parent added ⇒ add‑on enabled (per_ticket)**
  _Given_ buyer selects 3 GA; server refresh sets `maxSelectable=3`
  _Expect_ quantity UI `stepper`, cap 3; price shown if `isPurchasable=true`.

- **Parent reduced ⇒ add‑on clamped down**
  _Given_ add‑on selection=3, then parent selection drops to 1; server refresh sets `maxSelectable=1`
  _Expect_ client clamps selection to 1 immediately upon applying refresh.

- **Per‑order cap respected**
  _Given_ `"per_order"`, `limits.perOrder=1`, parentSelectedCount=4; server sends `maxSelectable=1`
  _Expect_ quantity UI single‑select; attempts to exceed are prevented by `maxSelectable`.

- **Hidden parent (omit) ⇒ add‑on omitted**
  _Given_ the only parent for an add‑on is omitted due to `omit_until_unlocked`
  _Expect_ the add‑on is also omitted (or `maxSelectable=0` with its own gating); no leakage of name/price.

- **Locked add‑on masks price**
  _Given_ add‑on has `gating.required=true && !satisfied` and `listingPolicy="visible_locked"`
  _Expect_ `presentation="locked"`, price masked, quantity hidden, CTA none (per §§3.3, 6, 8).

- **Multi‑parent sum (per_ticket)**
  _Given_ `parentProductIds=["prod_ga","prod_vip"]`, selection GA=2, VIP=1 → parentSelectedCount=3
  _Expect_ server returns `maxSelectable=3`; client displays cap 3.

- **No client caps**
  _Given_ any scenario above
  _Expect_ client never computes `min(parentSelectedCount, X)` as a hard cap; it only applies the latest server `maxSelectable`.

---

### 10.6 **Developer checklist (quick)**

- [ ] Treat any `relations.parentProductIds[]` item as an **add‑on**; do **not** change `product.type`.
- [ ] Never compute numeric caps locally; always use `commercial.maxSelectable`.
- [ ] On **any parent selection change**, trigger a server refresh; re‑derive UI from the new payload.
- [ ] If a refresh lowers `maxSelectable`, clamp the current selection down to that value.
- [ ] Do not leak gated parents: if parents are omitted, the dependent add‑on must not reveal them (trust server omission).
- [ ] Place add‑ons in an “Add‑ons” section via `display.sectionId` when provided; otherwise render where assigned.
- [ ] Use only payload copy (e.g., `state.messages[]`, `clientCopy`) to explain dependencies; no local strings.

---

**Author note:** This section deliberately preserves the spec’s single‑clamp discipline (**`maxSelectable` is king**) while giving the server all levers to express parent‑child constraints. The client’s job is to **refresh often** and **render faithfully**.

.

.

███████████▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░

.

.

# Appendix — Authoring & Migration Notes (non‑normative)

> This appendix is **guidance for authors and implementers**. It explains naming choices, “forbidden → preferred” mappings, and practical “before/after” examples. The body of the spec remains the only normative source.

---

## A. Purpose & Scope

- Keep authors aligned on **names**, **axes**, and **message channels**.
- Prevent re‑introducing past mistakes (e.g., `inventory`, ad‑hoc banners, dual messaging systems).
- Offer concrete **before/after** payload examples you can copy‑paste into fixtures.
- Capture **security rationale** (zero‑leak gating) in one place.

---

## B. Axis & Field Naming — Migration Cheatsheet

Use this when editing schemas, payloads, and fixtures. Items marked **removed** no longer exist in the contract; don’t mention them outside this appendix.

| Area               | Previously used (do not ship)             | Ship now (canonical)                                             | Notes                                  |
| ------------------ | ----------------------------------------- | ---------------------------------------------------------------- | -------------------------------------- |
| Availability axis  | `availability.*`, `stock`, `inventory`    | **`supply.status`**, `supply.reasons`, `supply.remaining?`       | "inventory/stock" are forbidden terms. |
| Demand axis        | `demandCapture`                           | **`demand.kind`** ∈ `none \| waitlist \| notify_me`              | Single noun, standard CTAs.            |
| Gating visibility  | `visibilityPolicy: "visible" \| "hidden"` | **`listingPolicy`**: `"omit_until_unlocked" \| "visible_locked"` | "Sendability" is explicit.             |
| Hidden gating hint | Row placeholders, counts of hidden SKUs   | **`context.gatingSummary.hasHiddenGatedItems: boolean`**         | Boolean hint only; no leakage.         |
| Row text channels  | `reasonTexts`, `microcopy` split          | **`state.messages[]`** (+ optional `copyTemplates`)              | One display channel per row.           |
| Panel banners      | `dynamicNotices`, client‑invented banners | **`context.panelNotices[]`**                                     | One banner channel, server‑authored.   |
| Admin/approval     | `admin` axis, `approvalRequired`          | **Removed**                                                      | No approval/request flow in contract.  |
| Payment plan surf. | Per‑row "Payment Plan" badges             | **Panel notice** `payment_plan_available`                        | Order‑level concept.                   |
| Code style         | `camelCase`, free text                    | **`snake_case`** reason codes + payload copy for UI strings      | Machine stable + localizable.          |

---

## C. “Before → After” JSON Patterns

### C1. Availability → Supply (and single source for “Sold Out”)

**Before (don’t use):**

```jsonc
{
  "availability": { "status": "soldOut" },
  "reasonTexts": { "sold_out": "Sold Out" }
}
```

**After (ship this):**

```jsonc
{
  "supply": { "status": "none", "reasons": ["sold_out"] },
  "state": {
    "messages": [
      {
        "code": "sold_out",
        "text": "Sold Out",
        "placement": "row.under_quantity",
        "priority": 100
      }
    ]
  }
}
```

---

### C2. Gating zero‑leak default (`omit_until_unlocked`)

**Before (leaky placeholders):**

```jsonc
{
  "product": { "name": "VIP Secret" },
  "gating": { "required": true, "satisfied": false },
  "price": 15000
  // present but disabled; leaks name/price
}
```

**After (no leakage pre‑unlock):**

```jsonc
// Item is omitted entirely from items[]
"context": {
  "gatingSummary": { "hasHiddenGatedItems": true },
  "panelNotices": [
    { "code": "requires_code", "variant": "info", "text": "Enter access code to view tickets", "priority": 90 }
  ]
}
```

Post‑unlock, the item appears:

```jsonc
{
  "product": { "id": "prod_secret", "name": "VIP Secret", "type": "ticket" },
  "state": {
    "gating": {
      "required": true,
      "satisfied": true,
      "listingPolicy": "omit_until_unlocked"
    },
    "supply": { "status": "available" }
  },
  "stateMessages": [
    {
      "code": "unlocked",
      "text": "Unlocked with your code",
      "placement": "row.under_title"
    }
  ],
  "commercial": { "maxSelectable": 2 }
}
```

---

### C3. Panel banners — single channel

**Before (client‑invented “Sold Out” banner):**

```jsonc
// nothing in context, client decides to show banner when all rows sold out
```

**After (server decides, client renders):**

```jsonc
"context": {
  "panelNotices": [
    { "code": "event_sold_out", "variant": "info", "text": "Event sold out", "priority": 100 }
  ]
}
```

---

### C4. Unified per‑row messages (no `reasonTexts` at row level)

**Before (dual channels):**

```jsonc
"reasonTexts": { "remaining_low": "Only 3 left!" },
"microcopy": [{ "code": "remaining_low" }]
```

**After (one channel):**

```jsonc
"state": {
  "messages": [
    {
      "code": "remaining_low",
      "text": "Only 3 left!",
      "placement": "row.under_quantity",
      "variant": "info",
      "priority": 60
    }
  ]
}
```

---

### C5. Demand CTAs

**Before:**

```jsonc
"demandCapture": { "kind": "waitlist" }
```

**After:**

```jsonc
"demand": { "kind": "waitlist" }
```

CTA mapping is mechanical: `supply.status="none"` + `demand.kind="waitlist"` → “Join Waitlist”.

---

### C6. Payment plans (panel‑level, not per row)

**Before:**

```jsonc
"display": { "badges": ["PaymentPlanAvailable"] }
```

**After:**

```jsonc
"context": {
  "panelNotices": [
    { "code": "payment_plan_available", "variant": "info", "text": "Payment plans available at checkout", "priority": 50 }
  ]
}
```

---

## D. Security Rationale — Zero‑Leak Gating

- **Threat model:** Scrapers and curious users harvest SKU names/prices via hidden or disabled rows.
- **Mitigation:** `"omit_until_unlocked"` keeps gated SKUs out of `items[]` until server‑validated unlock.
- **Hinting:** `gatingSummary.hasHiddenGatedItems` is the only allowed signal; it’s **boolean**, not counts.
- **Unlock flow:** client submits code → server validates + returns a short‑lived token → subsequent panel load includes unlocked items.
- **Client obligations:** never log codes/tokens; never cache unlocked payloads across accounts; never infer or display price for locked items.

---

## E. Authoring Heuristics (keep payloads crisp)

- **Keep axes orthogonal.** Causes go into axis `reasons[]`; user text goes into `state.messages[]`.
- **Prefer explicit over clever.** If you want a banner, send `panelNotices[]`. If you want inline urgency, send a message with `placement`.
- **No duplicates.** The same concept must not appear in more than one axis or channel.
- **Short JSON, many states.** One tiny example per state beats one giant all‑states example.
- **Priority first.** Higher priority messages and notices should be rendered first; set `priority` in payload.

---

## F. Do / Don’t Cookbook

### Do

- Use `supply.status="none"` + `state.messages[]` → “Sold Out”.
- Use `panelNotices[]` for “Event sold out”, “Payment plans available”, “Enter access code”.
- Use `gating.listingPolicy="omit_until_unlocked"` by default.
- Use `commercial.maxSelectable` as the **only** UI clamp.
- Use `copyTemplates` for templated strings; let server control phrasing.

### Don’t

- Don’t hardcode UI text (ever).
- Don’t compute totals/countdowns/limits client‑side.
- Don’t ship gated rows just to show a lock if you need zero‑leak.
- Don’t invent banners or CTAs not present in payload.
- Don’t use `inventory`, `stock`, or `availability` as field names.

---

## G. Reason Code Registry (authoring reference)

> Codes are machine tokens; UI text comes from `state.messages[]` or `panelNotices[]`.

- **Temporal:** `outside_window`, `sales_ended`
- **Supply:** `sold_out`, `remaining_low`
- **Gating:** `requires_code`, `code_invalid`, `code_verified`
- **Demand:** `waitlist_available`, `notify_available`
- **Panel‑level:** `event_sold_out`, `payment_plan_available`, `requires_code`

> Keep codes **short and specific**. Use `snake_case`. Avoid tense in codes; tense belongs in copy.

---

## H. Message Placement Slots (recommended)

Use a small set of placements so UI composition is predictable:

| Placement            | Intended spot                         |
| -------------------- | ------------------------------------- |
| `row.under_title`    | Small text just below the row title   |
| `row.under_price`    | Inline with or under price            |
| `row.under_quantity` | Under the quantity control / CTA area |
| `row.footer`         | At bottom of the row                  |
| `row.cta_label`      | CTA button label text for the row     |

**Note:** Panel-level banners use `context.panelNotices[]`, not row message placements.

---

## I. Fixture Set (starter pack)

Create and snapshot these six fixtures in Storybook:

1. **Available**: `supply.available`, purchasable.
2. **Sold out + waitlist**: `supply.none`, `demand.waitlist`.
3. **Visible locked**: `gating.required && !satisfied`, `listingPolicy="visible_locked"`; price masked.
4. **Omit until unlock**: gated item omitted; `gatingSummary.hasHiddenGatedItems=true`; access‑code banner.
5. **Public sold out + hidden gated**: all visible `none`, summary `true` (banner invites code).
6. **Payment plan**: `panelNotices[payment_plan_available]`.

---

## J. FAQ (for team alignment)

**Q: Why not compute countdowns client‑side?**
A: Timezones, daylight saving edges, and sales pauses make it brittle. Server owns truth; client renders text.

**Q: Can we show price for a locked row?**
A: Not for secure flows. If marketing wants a tease, use `visible_locked` with masked price and an explanatory message.

**Q: Can we surface “total remaining across event”?**
A: Only if the server sends it (e.g., via a panel notice or an explicit rollup field). The client must not sum.

**Q: Where do “max N per order” messages live?**
A: Client‑reactive microcopy using `context.clientCopy` (strings from server), triggered by `commercial.maxSelectable`.

---

## K. Copy & Templates — Quick Patterns

- **Template style:** `"Only {count} left!"`, `"Max {max} per order."`, `"Sales end {date_local}."`
- **Interpolate server‑supplied params** only; don’t compute `date_local` or counts in the client.
- **Severity:** `neutral | info | warn | error` for styling; keep content terse.

---

## L. Schema Cliff Notes (enums & shapes)

```ts
// Axes
supply.status: "available" | "none" | "unknown"
gating: {
  required: boolean
  satisfied: boolean
  listingPolicy: "omit_until_unlocked" | "visible_locked"
  reasons: string[]
}
demand.kind: "none" | "waitlist" | "notify_me"

// Messaging
state.messages[]: { code: string; text?: string; params?: {}; placement: string; variant?: "neutral" | "info" | "warning" | "error"; priority?: number }

// Banners
context.panelNotices[]: { code: string; text?: string; params?: {}; variant?: "neutral" | "info" | "warning" | "error"; priority?: number }

// Hints
context.gatingSummary: { hasHiddenGatedItems: boolean }
commercial.maxSelectable: number
```

---

## M. Lint the Payload (authoring checklist)

- [ ] No `inventory/stock/availability` fields.
- [ ] Every inline string is in `state.messages[]` (or properly templated); no duplicated strings.
- [ ] Gated items omitted when `listingPolicy="omit_until_unlocked" && !satisfied`.
- [ ] If **all** visible items are `supply.none` and **no** hidden gated items, include `event_sold_out` panel notice (or intentionally none).
- [ ] No approval/request fields or CTAs.
- [ ] `commercial.maxSelectable` present and consistent with purchasability.

---

## N. Rationale Snapshots (why these choices stick)

- **One name per axis.** “Supply” ends the “availability/inventory” bikeshed and keeps code grep‑able.
- **One row text channel.** `state.messages[]` prevents precedence fights and duplicate copy.
- **Zero‑leak default.** Security trumps tease. If you want tease, opt‑in with `visible_locked`.
- **Server as oracle.** If the server can’t express it cleanly, the client shouldn’t guess it.

---

## O. Future Hooks (safe extensions)

- **`demand.kind="standby_queue"`** (virtual line) — CTA and copy remain data‑driven.
- **`messages[].placement="row.badge_tooltip"`** — progressive disclosure slots without new channels.
- **`panelNotices[].expiresAt`** — server‑controlled timeboxing of banners.

---

## P. Migration Notes — ViewModel → State (for authoring hygiene)

> We are greenfield going forward. These notes exist only to prevent legacy terms from reappearing in code or docs. The body of the spec uses the new names exclusively.

### Authoritative renames (do not reintroduce old names)

```diff
- RowViewModel → RowState
- SectionViewModel → SectionState
- PanelViewModel → PanelState

- panelViewModelAtom → panelStateAtom
- rowViewModelAtom → rowStateAtom

- mapItemToRowVM → deriveRowState
- mapItemToRowViewModel → deriveRowState
```

### Conceptual language shift

| Old (MVVM)            | New (React/Jotai)            |
| --------------------- | ---------------------------- |
| view model            | derived state                |
| mapping to view model | deriving state from contract |
| view model atom       | state atom                   |
| panel view model      | panel state                  |
| row view model        | row state                    |

### Example updates (illustrative)

```diff
- const rowVMs = items.map((it) => mapItemToRowVM(it, payload));
+ const rowStates = items.map((it) => deriveRowState(it, payload));

- export type RowViewModel = {
+ export type RowState = {
    key: string;
    presentation: RowPresentation;
    // ...
  }
```

### Rationale (short)

- Aligns with React vocabulary and Jotai’s atom model.
- Removes MVVM two‑way binding baggage; our flow is one‑directional.
- Keeps boundaries crisp: server contract → client‑derived state → components.

---

### Close‑out

This appendix will grow with real fixtures and gotchas from implementation. When in doubt, simplify: one axis, one banner channel, one row message channel, and a boolean hint for hidden gated items.

---
