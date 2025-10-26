# Product Panel Spec 0.4 — Part 1 of 4: Foundation & Contract

[Back to Product Panel Spec Index](./product-panel-index.md)

**Sections Covered:** §1–§4 Top-Level Contract Shape  
Part of Product Panel Spec 0.4

> See [§8 Rendering Composition](./product-panel-display.md#8-rendering-composition-derived-atoms-only) for client derivations referenced in the state model.

<!-- markdownlint-disable MD025 -->
<!-- markdownlint-disable MD024 -->

# Product Panel Spec 0.4

> **Note:** This document is the sole normative contract for the Product Panel. Any other documents are explanatory only and MUST NOT override this spec.
>
> **Architecture Context:** This spec is designed for DayOf's specific tech stack—assumptions about deployment, rendering, and state management are baked into every decision. Understanding the architecture explains **why** the contract looks the way it does.
>
> **Key Stack Facts:**
>
> - **Framework**: TanStack Start v1 (SSR-first, server functions, not REST API)
> - **Deployment**: Vercel with **atomic deploys** (server + client = one build, one version, always in sync)
> - **Rendering**: Isomorphic execution (same code runs server-side for SSR and client-side for hydration)
> - **State**: Jotai atoms + TanStack Query (derived state from server facts, no prop drilling)
> - **Validation**: Zod 4 schemas validate **twice**: server (SSR/loaders) and client (hydration/forms)
> - **Data Flow**: Server functions → server state → atoms derive presentation → React renders
>
> **How This Impacts The Contract:**
>
> 1. **No version skew** → Strict validation (`.strict()`) catches bugs; unknown fields are errors, not forward-compat concerns
> 2. **SSR + hydration** → Same schemas run server + client; consistency is critical to prevent hydration mismatches
> 3. **Atomic deploys** → Schema changes deploy atomically; no "old client + new server" scenarios
> 4. **Server functions** → No separate API versioning; contract is isomorphic (server and client share types)
> 5. **Derived state** → Client never computes business logic; atoms transform server facts into UI state
> 6. **No caching across deploys** → No stale data surviving deployments; every deploy = fresh contract
>
> **What This Means for Implementers:**
>
> - Unknown fields = validation errors (fail fast, not graceful degradation)
> - Business fields are **required** (no `.default()` hiding server bugs)
> - Enums are **strict** (coordinated deploys are fine; catch typos immediately)
> - Template checks happen at **render time** (schema layer doesn't know about template registry)
> - Currency/money handled via **Dinero.js V2 snapshots** (nothing happens to money outside Dinero utils)
>
> This is **not** a traditional REST API contract designed for independent client/server versioning. It's an **isomorphic TanStack Start contract** where server and client are two execution contexts of the same codebase.
>
> See §14 "Architecture Context: TanStack Start & Validation Strategy" for detailed rationale and comparison with traditional API design patterns.

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

- **Validation & compatibility (TanStack Start):**

  - Clients **MUST** validate payloads strictly on both server (SSR/loaders) and client (hydration). Unknown fields are **validation errors**.
  - Servers **MUST** send all business‑meaningful fields explicitly; clients **MUST NOT** invent defaults that change business meaning.
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

- **Purchasability (derived later):** “Purchasable” is a client‐derived boolean: `temporal.phase="during"` **AND** `supply.status="available"` **AND** (`gating.required=false` **OR** `gating.satisfied=true`) **AND** `commercial.maxSelectable > 0`. The derivation lives in §8; this section defines the axes that make it possible.

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

### **UX nuances (non-normative, clarifying)**

- **Post‑unlock confirmation:** If a user enters a valid access code but the unlocked inventory is already sold out, the UI should still confirm success.
  - For previously visible‑locked items, keep the row visible but disabled with a sold‑out message (confirms the code worked).
  - For items previously omitted via `omit_until_unlocked`, show a panel‑level confirmation (e.g., a short notice indicating the code was valid) if no new rows appear; avoid a “dead end” feeling.
- **Price visibility:** Prices are masked only when a row is locked. For sold‑out or otherwise non‑purchasable rows (including when `commercial.maxSelectable=0`), price **MUST NOT** be shown per §8 price visibility rules. The normative rules above still govern masking when locked.
- **Public sold‑out + hidden gated stock:** When `context.gatingSummary.hasHiddenGatedItems === true`, prefer an access‑code prompt over a terminal “Event Sold Out” state to guide the user toward unlocking.

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
- Unknown fields in `state` are **invalid** under strict validation.

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

- Clients **MUST** validate root keys strictly; unknown top‑level keys are **invalid**.
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
  - Given an unknown top‑level key, the client **MUST** reject the payload (validation error).

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

