# Product Panel Spec 0.4 — Part 3 of 4: Business Rules & Reference

[Back to Product Panel Spec Index](./product-panel-index.md)

**Sections Covered:** §10–§13 Business Rules  
Part of Product Panel Spec 0.4

> Rendering implications for these dependencies live in [§8 Rendering Composition](./product-panel-display.md#8-rendering-composition-derived-atoms-only).

## 10. Relations & Add‑ons _(selection vs ownership; `matchBehavior`)_

> **What this section does:** defines how a row can **depend on** other rows (parents), and how the client presents and validates those dependencies **without** inventing business rules. This is **not** a new axis; it's metadata used to constrain selection and explain behavior.
>
> **Common use cases:** Add-ons like parking passes, meal vouchers, or merchandise that should only be purchasable alongside a main ticket. For example, a parking pass might be limited to one per order regardless of ticket quantity (`per_order`), while a meal voucher might be available for each ticket purchased (`per_ticket`).
>
> **Key principle:** The server is the final gatekeeper. It validates all parent-child relationships on submission, so even if a user bypassed the UI, the server's `maxSelectable` and order validation would catch invalid selections.

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

- **Practical examples:**

  - `"per_ticket"`: A "Fast Pass" add-on for each ticket. If a user selects 3 VIP tickets, the client should allow up to 3 Fast Passes to match (enforced via server-updated `maxSelectable`).
  - `"per_order"`: A "Parking Pass" limited to one per order. No matter how many GA or VIP tickets are selected, only one Parking Pass can be added. The UI would disable adding a second once `maxSelectable` is reached.

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
- **Reduce on refresh:** If a payload refresh lowers `maxSelectable` below the user's current add‑on selection, the client **MUST** clamp the selection down to the new `maxSelectable` (see §8 and selection family) and reflect it immediately.
- **No leakage:** Clients **MUST NOT** infer or surface any information about parents that are omitted due to gating. No placeholders, counts, or prices.
- **UI presentation flexibility:** The contract doesn't mandate how add-ons are displayed. Some UIs might nest add-ons under parent tickets; others list them separately with explanatory text (e.g., "Requires a GA ticket"). What matters is that the dependency is clear to the user through server-provided copy and badges.

#### E. Interactions with other fields

- **Limits & caps:** `limits.perOrder`/`limits.perUser` remain informational; `maxSelectable` already reflects them. Clients **MUST NOT** enforce `limits.*` directly.
- **Demand:** Add‑ons **may** use `demand.kind` (`waitlist`, `notify_me`) like any item. Gating precedence (§3.5) still applies.
- **Sectioning:** The server **SHOULD** place add‑ons under a distinct section via `display.sectionId` (e.g., `"add_ons"`), but clients **MUST** render them wherever they are assigned.

---

### 10.2 **Rationale (why this shape works)**

- Keeps **one clamp** (`maxSelectable`) as the only numeric authority while allowing **relationship semantics** (per‑ticket/per‑order) to be expressed server‑side and reflected on each refresh.
- Avoids client‑side math races (parent changes while stock updates) and **prevents leakage** when parents are gated/omitted.
- Scales from trivial (one parking pass per order) to complex (many parents, dynamic holds) without changing client code.
- **Security:** The server validates everything on submission. If a user somehow bypassed the UI and tried to add 5 parking passes when `maxSelectable=1`, the server's order validation would reject it. The client UI is a convenience, not a security boundary.

---

### 10.3 **Examples (tiny, canonical)**

The following examples demonstrate how `matchBehavior` works in practice. Notice how `maxSelectable` starts at 0 when no parent is selected, then updates via server refresh when parents are added.

#### Quick reference box — per‑ticket vs per‑order

```jsonc
// Per‑ticket add‑on: matches parent quantity (e.g., Fast Pass)
{
  "product": { "id": "add_fastpass", "name": "Fast Pass", "type": "digital" },
  "relations": { "parentProductIds": ["prod_ga", "prod_vip"], "matchBehavior": "per_ticket" },
  "commercial": { "maxSelectable": 0 }
}

// Per‑order add‑on: one per order regardless of parent quantity (e.g., Parking)
{
  "product": { "id": "add_parking", "name": "Parking Pass", "type": "physical" },
  "relations": { "parentProductIds": ["prod_ga", "prod_vip"], "matchBehavior": "per_order" },
  "commercial": { "limits": { "perOrder": 1 }, "maxSelectable": 0 }
}
```

> Server recomputes `maxSelectable` on refresh based on current parent selection and stock; client never invents caps.

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

This example shows a typical per-order add-on. The server enforces `limits.perOrder=1`, and `maxSelectable` updates from 0 to 1 once any parent ticket is selected (regardless of parent quantity).

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
  _Expect_ quantity UI `stepper`, cap 3; price shown when row is purchasable (per §8).

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

## 11. Pricing Footer _(server math; inclusions flags)_

### **Normative**

- **Authoritative math**

  - `pricing` is **always present** and is **100% server‑computed**. The client **MUST NOT** perform any money arithmetic (no sums, no prorations, no taxes/fees math).
  - All monetary values in `pricing` **MUST** be **Dinero.js v2 snapshots**:
    `{ amount: number, currency: { code: string, base: number, exponent: number }, scale: number }`.
  - **Single currency per panel:** `pricing.currency.code` **MUST** match every `items[].commercial.price.currency.code`. Mixed currency panels are **invalid**.

- **Shape (until the pricing contract fully stabilizes)**

  - The server **SHOULD** send the **line‑item form** and **MAY** also send simpler fields. Unknown fields are **invalid**.

    ```jsonc
    "pricing": {
      "currency": { "code": "USD", "base": 10, "exponent": 2 },
      "mode": "reserve", // or "final" (optional; see below)
      "lineItems": [
        { "code": "TICKETS",  "label": "Tickets",   "amount": { ...Dinero... } },
        { "code": "FEES",     "label": "Fees",      "amount": { ...Dinero... } },
        { "code": "TAX",      "label": "Tax",       "amount": { ...Dinero... } },
        { "code": "DISCOUNT", "label": "Discount",  "amount": { ...Dinero... } }, // negative allowed
        { "code": "TOTAL",    "label": "Total",     "amount": { ...Dinero... } }
      ]
    }
    ```

  - Clients **MUST** render `lineItems` **in the order provided**. Clients **MUST NOT** reorder, insert, or compute derived rows.
  - **Visual exception:** Clients **MAY** apply visual styling to distinguish TOTAL (e.g., bold, separator line above) without reordering.
  - **Edge case:** If `TOTAL` appears mid-array (server bug), still render in provided order; do not auto-move to end.
  - **Negative amounts are allowed** (e.g., discounts). Render signed values exactly as provided.

- **Mode (status of the math)**

  - `pricing.mode?: "reserve" | "final"` (**optional; provisional**):

    - `"reserve"` → interim numbers (e.g., estimated taxes/fees).
    - `"final"` → checkout‑locked totals.

  - Styling or “estimated” disclaimers are **copy** concerns; the server provides the right `label` text when needed. The client **MUST NOT** infer “estimated”.

- **Inclusions flags (what’s included where)**

  - **Per‑row:** `items[].commercial.feesIncluded: boolean`

    - **Affects copy only** next to the **row price** (e.g., “incl. fees” vs “+ fees”). It **does not** change math.

  - **Footer breakdown:** Inclusion/exclusion is communicated by the **presence and values of `lineItems`**.
    Examples:

    - If fees are broken out, the server sends a non‑zero `FEES` line.
    - If taxes are included in ticket prices, the server **omits** `TAX` or sends it as `0`.

  - Clients **MUST** take inclusions/exclusions **only** from what the server sends; never guess based on flags or numbers elsewhere.

- **Updates & lifecycle**

  - Any change in selection, unlock, discount, or rule **MUST** cause the client to request/receive a refreshed payload. The footer then **replaces** itself with the new `pricing`.
  - With **no selection**, `pricing` still exists. The server **MAY** send an empty breakdown (`lineItems: []`) or a single `TOTAL` of 0. The client renders **exactly** what is present (no local totals).

- **When to request pricing refresh (implementation triggers)**

  - **MUST refresh** on:

    - User changes any item quantity (debounce 300ms recommended)
    - User enters/applies discount code
    - User unlocks gated items (code validation success)
    - Server pushes updated payload (WebSocket/SSE)

  - **MUST NOT** refresh on:

    - Pure UI interactions (expanding sections, hovering badges)
    - Client-side validation errors (max quantity warnings)
    - Rendering or scrolling events

  - While awaiting refresh, keep displaying **previous pricing state**; do not show loading spinners in the footer itself (use top-level loading indicators if needed).

- **Accessibility & formatting**

  - Clients **MUST** format Dinero snapshots for display (locale, currency symbol) but **MUST NOT** alter numeric values.
  - The **label** field is the source of truth for line names ("Fees", "Estimated tax", etc.). Clients **MUST NOT** substitute their own strings.

- **Dinero formatting (implementation guidance)**

  - The client **MAY** format Dinero snapshots using one of two approaches:

    **Approach A: Using Dinero.js utils**

    ```ts
    import { dinero, toDecimal } from "dinero.js";

    const price = dinero(snapshot); // reconstruct from snapshot
    const formatted = toDecimal(price); // "150.00"
    ```

    **Approach B: Direct from snapshot (no Dinero import required)**

    ```ts
    function formatDineroSnapshot(snapshot: DineroSnapshot): string {
      const { amount, currency, scale } = snapshot;
      const divisor = Math.pow(currency.base, scale);
      const value = amount / divisor;
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.code,
      }).format(value);
    }
    ```

  - Both approaches are valid; choose based on bundle size vs. simplicity tradeoffs.
  - The client **MUST NOT** perform arithmetic on snapshot values beyond display formatting.

- **Interplay with rows (§6 & §8)**

  - **Row price visibility** is governed by §6/§8 (shown only when purchasable; masked when locked). The footer is **independent** of row price visibility.
  - `commercial.maxSelectable` and all selection logic **MUST NOT** be inferred from `pricing`.

- **Line‑item code registry (for semantics, not strings)**

  - Recommended codes the client recognizes **without** hardcoding display text:

    - `"TICKETS"`, `"FEES"`, `"TAX"`, `"DISCOUNT"`, `"TOTAL"`

  - Unknown codes **MUST** be rendered as provided (label + amount); clients ignore semantics.

---

### **Rationale**

- Keeping **all** money math on the server eliminates client/server drift, race conditions, and rounding bugs.
- Treating inclusions as **what the server chooses to show** (breakout vs. folded into "Tickets") avoids duplicate logic and disagreements.
- Using Dinero snapshots across the wire ensures consistent precision and currency handling with zero floating‑point surprises.

---

### **State transitions (loading & errors)**

- **During pricing refresh:**

  - Keep displaying the **last valid `pricing`** state.
  - Apply subtle "updating" indicator (e.g., 50% opacity overlay or small spinner icon) if refresh takes >500ms.
  - **MUST NOT** clear the footer to empty state during refresh (prevents jarring layout shifts).

- **On pricing fetch error:**

  - Keep displaying last valid pricing with error indicator (e.g., warning icon + "Prices may be outdated").
  - Retry automatically after 3s; show "Retry" button if 3 attempts fail.
  - **MUST NOT** block checkout if pricing is stale <30s (server will revalidate).

- **On currency mismatch (validation error):**

  - Display error state immediately: "Configuration error. Please contact support."
  - Log error with payload excerpt for debugging; **MUST NOT** attempt to render broken pricing.

---

### **Visual rendering patterns (implementation guidance)**

- **Empty state (no selection):**

  ```text
  [No pricing footer displayed]
  ```

  Rationale: Showing "$0.00" before selection implies something is in cart; showing nothing is clearer.

- **Standard breakdown:**

  ```text
  Tickets        $150.00
  Fees           $ 18.00
  Tax            $ 12.00
  ──────────────────────
  Total          $180.00
  ```

  Use visual hierarchy: regular weight for line items, bold for TOTAL.

- **With discount (negative amount):**

  ```text
  Tickets        $150.00
  Fees           $ 18.00
  Promo applied  -$ 10.00
  ──────────────────────
  Total          $158.00
  ```

  Render negative amounts with minus sign; use distinct color (not red, as red implies error—use theme accent or green for savings).

- **All-inclusive (single line):**

  ```text
  Total          $ 50.00
  ```

  When server sends only TOTAL, render just that line (no artificial breakdown).

---

### **Examples (compact, canonical)**

#### A) Minimal, no selection yet (empty breakdown)

```jsonc
"pricing": {
  "currency": { "code": "USD", "base": 10, "exponent": 2 },
  "mode": "reserve",
  "lineItems": []
}
```

_Render nothing in the footer (no sums). Do **not** invent a $0 total._

#### B) Tickets + fees + tax + discount + total (reserve)

```jsonc
"pricing": {
  "currency": { "code": "USD", "base": 10, "exponent": 2 },
  "mode": "reserve",
  "lineItems": [
    {
      "code": "TICKETS",
      "label": "Tickets",
      "amount": { "amount": 15000, "currency": { "code": "USD", "base": 10, "exponent": 2 }, "scale": 2 }
    },
    {
      "code": "FEES",
      "label": "Fees",
      "amount": { "amount": 1800, "currency": { "code": "USD", "base": 10, "exponent": 2 }, "scale": 2 }
    },
    {
      "code": "TAX",
      "label": "Estimated tax",
      "amount": { "amount": 1200, "currency": { "code": "USD", "base": 10, "exponent": 2 }, "scale": 2 }
    },
    {
      "code": "DISCOUNT",
      "label": "Promo applied",
      "amount": { "amount": -500, "currency": { "code": "USD", "base": 10, "exponent": 2 }, "scale": 2 }
    },
    {
      "code": "TOTAL",
      "label": "Total",
      "amount": { "amount": 17500, "currency": { "code": "USD", "base": 10, "exponent": 2 }, "scale": 2 }
    }
  ]
}
```

_Render labels as provided; display signed values; no recomputation._

#### C) All‑in ticket pricing (fees folded), tax omitted (final)

```jsonc
"pricing": {
  "currency": { "code": "USD", "base": 10, "exponent": 2 },
  "mode": "final",
  "lineItems": [
    {
      "code": "TICKETS",
      "label": "Tickets (incl. fees)",
      "amount": { "amount": 5000, "currency": { "code": "USD", "base": 10, "exponent": 2 }, "scale": 2 }
    },
    {
      "code": "TOTAL",
      "label": "Total",
      "amount": { "amount": 5000, "currency": { "code": "USD", "base": 10, "exponent": 2 }, "scale": 2 }
    }
  ]
}
```

_Fees are included in tickets; server chose not to show a separate `FEES` row._

---

### **Tests (acceptance checks)**

- **Presence & shape**

  - _Given_ a payload without `pricing` → _Expect_ client validation error (section 4 requires it).
  - _Given_ `pricing.lineItems` present → _Expect_ render **exactly** those rows, in provided order.

- **Currency consistency**

  - _Given_ any `items[].commercial.price.currency.code` ≠ `pricing.currency.code` → _Expect_ client validation error or hard block (single currency per panel).

- **Currency mismatch (error state)**

  - _Given_ `items[0].commercial.price.currency.code="USD"` and `items[1].commercial.price.currency.code="EUR"`
  - _Expect_ client **MUST** reject payload during validation; display error state: "Configuration error: Mixed currencies detected"
  - _Implementation:_ Validate currency consistency immediately upon payload receipt, before any rendering.
  - _Rationale:_ Mixed currency is a server configuration bug, not a runtime state; fail fast.

- **No local math**

  - _Given_ `lineItems` omit `TOTAL` → _Expect_ no computed total; render only present rows.
  - _Given_ negative `DISCOUNT.amount` → _Expect_ show signed value; do not alter other rows.

- **Mode handling**

  - _Given_ `pricing.mode="reserve"` with `TAX` labeled “Estimated tax” → _Expect_ render that label verbatim; do not infer or add “estimated” elsewhere.
  - _Given_ `pricing.mode="final"` → _Expect_ render labels verbatim; client does not change copy.

- **Inclusions**

  - _Given_ rows with `commercial.feesIncluded=false` and a non‑zero `FEES` line → _Expect_ per‑row copy uses the server’s provided strings (e.g., “+ fees” via templates) and the footer shows the `FEES` row; no client inference.
  - _Given_ a panel where taxes are included in `TICKETS` (no `TAX` row) → _Expect_ no tax row rendered; do not add one.

- **Zero/empty state**

  - _Given_ `lineItems: []` (no selection) → _Expect_ no totals rendered; do not synthesize `$0.00`.
  - _Given_ a single `TOTAL` of 0 → _Expect_ render “Total $0.00” with provided label; no extra rows.

- **Robustness**

  - _Given_ an unknown line item `{ code:"ADJUSTMENT", label:"Adjustment", amount: {...} }` → _Expect_ render it as provided; do not drop or re‑label.
  - _Given_ selection change → _Expect_ client requests/uses new `pricing`; do not animate by recomputing locally.

---

### **Developer checklist (implementation audit)**

**Money handling:**

- [ ] All Dinero snapshots formatted for display only (no arithmetic on `amount` fields)
- [ ] Currency consistency validated on every payload receipt
- [ ] Negative amounts (discounts) rendered with minus sign and distinct styling
- [ ] No rounding or precision changes applied to snapshot values

**Rendering:**

- [ ] `lineItems` rendered in exact payload order (no reordering logic)
- [ ] `label` text used verbatim (no substitutions like "Subtotal" → "Items")
- [ ] Empty `lineItems[]` renders nothing (no synthetic "$0.00" line)
- [ ] Visual hierarchy applied (TOTAL distinguished via styling, not reordering)

**State management:**

- [ ] Previous pricing displayed during refresh (no empty state flash)
- [ ] Pricing refresh triggered only on quantity/selection changes, not UI events
- [ ] Debounce on quantity changes (300ms recommended) to avoid excessive server calls

**Error handling:**

- [ ] Currency mismatch causes validation failure (payload rejected)
- [ ] Stale pricing (fetch error) handled gracefully with retry logic
- [ ] Unknown line item codes are invalid (strict enum); update server before introducing new codes

**Testing coverage:**

- [ ] Fixture: Empty lineItems (no selection)
- [ ] Fixture: Standard breakdown (tickets + fees + tax + total)
- [ ] Fixture: With discount (negative amount)
- [ ] Fixture: All-inclusive (single TOTAL line)
- [ ] Fixture: Unknown line item code (e.g., "ADJUSTMENT")
- [ ] Fixture: Currency mismatch (validation error)

.

.

███████████▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░

.

.

## 12. Reason Codes Registry _(machine codes; copy via messages/templates)_

> **Contract intent:** Codes are **machine facts**. They never render by themselves. User‑facing text is delivered via `items[].state.messages[]` (row) or `context.panelNotices[]` (panel), optionally using `context.copyTemplates[]`. See §§2, 5, 7.

---

### **Normative**

- **Code style**

  - Codes **MUST** be `snake_case` ASCII tokens (e.g., `sold_out`, `requires_code`).
  - Codes **MUST NOT** contain tense, punctuation, or spaces.
  - Field names remain `camelCase`; only machine codes are `snake_case`. (§2)

- **Where codes appear**

  - **Axis evidence:** `state.temporal.reasons[]`, `state.supply.reasons[]`, `state.gating.reasons[]`, `state.demand.reasons[]`.
    These arrays carry machine facts; they **MUST NOT** be rendered as strings directly. (§§3, 7)
  - **Row messages:** `state.messages[].code` may **reference** a code when `text` is omitted and a `copyTemplates[key==code]` exists. (§7.1)
  - **Panel banners:** `context.panelNotices[].code` identifies the notice kind; the banner text comes from `text` or a template keyed by `code`. (§5.4)
  - **CTA labels:** if a row CTA needs text, provide a `state.messages[]` entry with `placement: "row.cta_label"` and `code` or `text`. (§8.1, §7)

- **What codes do not do**

  - Codes **MUST NOT** drive business decisions; business logic lives on the server and is expressed via axis fields and clamps. (§1, §13)
  - Clients **MUST NOT** translate codes locally. If no `text` and no matching template exist, omit the string. (§7.1)
  - Clients **MUST NOT** invent panel banners from codes present only in item axes. Panel banners come **only** from `context.panelNotices[]`. (§5)

- **Extending the registry**

  - New codes **MUST** be added to the shared schema and deployed atomically with server and client.
  - Prefer short, specific codes (one meaning each). Avoid synonyms (`event_sold_out` **not** `event_fully_booked`).

- **Scope**

  - This registry covers **reason/message/notice** codes.
    **Pricing line item codes** like `"TICKETS"`, `"FEES"`, `"TOTAL"` are **not** reason codes and are out of scope for this section. (§4.4)

---

### **Canonical code sets (v0.4‑g)**

> The lists below reflect codes **already used** in this spec’s examples and recommended authoring patterns. You can ship more, but keep semantics consistent with the axis.

#### A) Temporal (axis: `state.temporal.reasons[]` and/or row messages)

| Code             | Meaning (machine fact)                         | Typical surface                              |
| ---------------- | ---------------------------------------------- | -------------------------------------------- |
| `outside_window` | Not on sale yet; phase is `"before"`           | Row message under title (e.g., on‑sale info) |
| `sales_ended`    | Sale window closed; phase is `"after"`         | Row message under title                      |
| `sales_end_soon` | Sale ending soon (server‑decided threshold)    | Row message (warning) or panel notice (info) |
| `on_sale_at`\*   | Preformatted on‑sale stamp (message‑only code) | Row message under title                      |

- `on_sale_at` is a **message code**, not an axis reason; server supplies `text` (“On sale Fri 10:00 AM CT”) directly. (§7.3)

#### B) Supply (axis: `state.supply.reasons[]` and/or row messages)

| Code              | Meaning (machine fact)                     | Typical surface                                |
| ----------------- | ------------------------------------------ | ---------------------------------------------- |
| `sold_out`        | No remaining stock; `supply.status="none"` | Row message under quantity                     |
| `remaining_low`\* | Low stock urgency (server decided)         | Row message under quantity; use `params.count` |

- `remaining_low` is commonly used as a **message code** resolved via `copyTemplates` with `{count}`; it does **not** change `supply.status` (which remains `"available"`). Use `display.showLowRemaining=true` for styling. (§2, §5.4)

#### C) Gating (axis: `state.gating.reasons[]` and panel notice)

| Code             | Meaning (machine fact)                                  | Typical surface                                     |
| ---------------- | ------------------------------------------------------- | --------------------------------------------------- |
| `requires_code`  | Access gate present and not satisfied                   | Locked row message (visible_locked) or panel notice |
| `invalid_code`\* | Last unlock attempt failed validation (server decision) | **Panel** notice (error)                            |
| `unlocked`\*     | Gate satisfied (for celebratory copy if desired)        | Optional row message under title                    |

- `invalid_code`/`unlocked` are **message/notice codes**; there’s no requirement to add them to axis `reasons[]`. Access validation remains server‑side. (§3.3, §5)

#### D) Demand (axis: `state.demand.reasons[]` and CTA messaging)

| Code                 | Meaning (machine fact)                | Typical surface                               |
| -------------------- | ------------------------------------- | --------------------------------------------- |
| `waitlist_available` | Waitlist is enabled for this item     | Row CTA label message (e.g., “Join Waitlist”) |
| `notify_available`   | Notify‑me is enabled (pre‑sale phase) | Row CTA label message (e.g., “Notify Me”)     |

> **Gating precedence:** if `gating.required && !satisfied`, demand CTAs **MUST NOT** surface until unlocked. (§3.5, §8.7)

#### E) Panel‑level notices (context: `panelNotices[].code`)

| Code                     | Meaning                                    | Notes & surface                               |
| ------------------------ | ------------------------------------------ | --------------------------------------------- |
| `requires_code`          | Event has gated inventory users can unlock | Info banner; pairs with AccessCode input UI   |
| `event_sold_out`         | All visible sellable inventory is gone     | Info banner; may appear with/without waitlist |
| `payment_plan_available` | Payment plans exist at checkout            | Info banner; **never** per‑row badge (§5.3)   |
| `sales_end_soon`         | Event‑wide urgency on sale end             | Optional banner (server chooses)              |

> If public items are sold out **and** `gatingSummary.hasHiddenGatedItems=true`, prefer `requires_code` over an “Event Sold Out” banner to avoid misleading users. (§3.5, §5)

#### F) Client‑triggered validation (context: `clientCopy` keys)

| Key                     | Purpose (client action → uses server copy)         |
| ----------------------- | -------------------------------------------------- |
| `selection_min_reached` | Pressed checkout without required selection        |
| `selection_max_types`   | Tried to select > allowed ticket types             |
| `quantity_min_reached`  | Tried to set quantity below minimum for a type     |
| `quantity_max_reached`  | Tried to exceed `maxSelectable`/per‑order guidance |

> These are **not axis reasons**. They are templates the client triggers with params (e.g., `{max}`, `{min}`) on invalid actions. (§5.5)

#### G) CTA label helpers (row message, `placement: "row.cta_label"`)

| Code           | Typical text (server‑provided) | When used (derived; §8)                        |
| -------------- | ------------------------------ | ---------------------------------------------- |
| `waitlist_cta` | “Join Waitlist”                | `supply.status="none"` + `demand=waitlist`     |
| `notify_cta`   | “Notify Me”                    | `temporal.phase="before"` + `demand=notify_me` |

> Remember: **the client never hardcodes** CTA strings; provide these via messages/templates. (§8.1)

---

### **Authoring guidance (server‑side)**

- **One cause, one code.** Put the cause exactly once in its axis `reasons[]`. Use `messages[]` or `panelNotices[]` to speak to the user. (§3, §7)
- **Pick canonical names.** Use these codes as written:

  - Temporal: `outside_window`, `sales_ended`, `sales_end_soon`
  - Supply: `sold_out` (+ message code `remaining_low`)
  - Gating: `requires_code`, `invalid_code` (notice), `unlocked` (message)
  - Demand: `waitlist_available`, `notify_available`
  - Panel: `event_sold_out`, `requires_code`, `payment_plan_available`, `sales_end_soon`

- **Don’t overload codes.** `sold_out` means “no stock” only; it does not imply waitlist—set `demand.kind="waitlist"` separately. (§3.4)
- **Message‑only codes.** It’s fine to emit message codes with no matching axis reason (e.g., `on_sale_at`, `remaining_low`), provided you supply `text` or a template. (§7.4)
- **Priorities & placement.** For stacked messages, set `priority` to control order and choose a specific `placement` slot. (§7.1)
- **Localization.** Resolve `messages[].text`/templates server‑side per locale; clients don’t translate. (§7.1, §5.4)

---

### **Examples (compact & canonical)**

**1) Sold out with waitlist (row CTA label via message code):**

```jsonc
"state": {
  "temporal": { "phase": "during", "reasons": [] },
  "supply":   { "status": "none", "reasons": ["sold_out"] },
  "gating":   { "required": false, "satisfied": true, "listingPolicy": "omit_until_unlocked", "reasons": [] },
  "demand":   { "kind": "waitlist", "reasons": ["waitlist_available"] },
  "messages": [
    { "code": "sold_out",     "text": "Sold Out",     "placement": "row.under_quantity", "priority": 100 },
    { "code": "waitlist_cta", "text": "Join Waitlist","placement": "row.cta_label",       "priority": 80  }
  ]
}
```

**2) Before sale (preformatted time) + notify‑me:**

```jsonc
"state": {
  "temporal": { "phase": "before", "reasons": ["outside_window"] },
  "supply":   { "status": "available", "reasons": [] },
  "gating":   { "required": false, "satisfied": true, "listingPolicy": "omit_until_unlocked", "reasons": [] },
  "demand":   { "kind": "notify_me", "reasons": ["notify_available"] },
  "messages": [
    { "code": "on_sale_at", "text": "On sale Fri 10:00 AM CT", "placement": "row.under_title" },
    { "code": "notify_cta", "text": "Notify Me",               "placement": "row.cta_label"   }
  ]
}
```

**3) Visible locked (gated) + panel requires‑code banner:**

```jsonc
// Row
"state": {
  "gating": { "required": true, "satisfied": false, "listingPolicy": "visible_locked", "reasons": ["requires_code"] },
  "messages": [
    { "code": "requires_code", "text": "Requires access code", "placement": "row.under_title", "priority": 80 }
  ],
  "temporal": { "phase": "during", "reasons": [] },
  "supply":   { "status": "available", "reasons": [] },
  "demand":   { "kind": "none", "reasons": [] }
},
// Panel
"context": {
  "gatingSummary": { "hasHiddenGatedItems": false },
  "panelNotices": [
    { "code": "requires_code", "variant": "info", "text": "Enter access code to view tickets", "priority": 90 }
  ]
}
```

**4) Low remaining message via template (no axis reason required):**

```jsonc
"context": {
  "copyTemplates": [ { "key": "remaining_low", "template": "Only {count} left!" } ]
},
"state": {
  "supply": { "status": "available", "reasons": [], "remaining": 3 },
  "messages": [
    { "code": "remaining_low", "params": { "count": 3 }, "placement": "row.under_quantity", "priority": 60 }
  ]
}
```

**5) Panel sold‑out vs hidden gated (choose banner wisely):**

```jsonc
// Case A: truly sold out with no hidden gated
"context": {
  "gatingSummary": { "hasHiddenGatedItems": false },
  "panelNotices":  [ { "code": "event_sold_out", "variant": "info", "text": "Event sold out", "priority": 100 } ]
}
// Case B: public sold out but hidden gated exists — do NOT show event_sold_out; invite code instead
"context": {
  "gatingSummary": { "hasHiddenGatedItems": true },
  "panelNotices":  [ { "code": "requires_code", "variant": "info", "text": "Enter access code to view tickets", "priority": 100 } ]
}
```

---

### **Tests (acceptance checks)**

- **Code style**

  - Given any `reasons[]` or `messages[].code` with non‑`snake_case`, validation **MUST** fail.

- **No direct rendering of codes**

  - Given an item with `state.supply.reasons=["sold_out"]` and **no** matching message/template, the UI **MUST NOT** show `"sold_out"`; it shows **no** string for that reason. (§7.1)

- **Template resolution**

  - Given `messages:[{ code:"remaining_low", params:{count:2}, placement:"row.under_quantity" }]` and `copyTemplates:[{key:"remaining_low",template:"Only {count} left!"}]`, render “Only 2 left!”. (§7.7)

- **Panel vs row separation**

  - Given all rows `sold_out` and `panelNotices=[]`, the client **MUST NOT** invent an “Event Sold Out” banner. (§5)
  - Given `panelNotices=[{ code:"payment_plan_available", ...}]`, a banner **MUST** render; per‑row payment‑plan badges **MUST NOT** appear. (§5.3)

- **Gating precedence**

  - Given `gating.required=true && !satisfied` (visible locked) and `demand.kind="waitlist"`, the row CTA **MUST** be `none` (no waitlist button) until unlocked; price masked. (§3.5, §8.7)

- **Hidden gated hint**

  - Given omitted gated items with stock, `context.gatingSummary.hasHiddenGatedItems` **MUST** be `true`; client **MUST NOT** infer more than that boolean. (§3.3)

- **Unknown codes safe‑ignore**

  - Given an unrecognized `messages[].code` with `text` supplied → render `text`.
  - Given unrecognized `panelNotices[].code` with `text` supplied → render the notice.
  - Given unrecognized `code` with **no** `text` and **no** template → omit silently.

---

### **Quick reference (cheat sheet)**

- **Temporal:** `outside_window`, `sales_ended`, `sales_end_soon`, _(message)_ `on_sale_at`
- **Supply:** `sold_out`, _(message)_ `remaining_low`
- **Gating:** `requires_code`, _(notice)_ `invalid_code`, _(message)_ `unlocked`
- **Demand:** `waitlist_available`, `notify_available`
- **Panel:** `event_sold_out`, `requires_code`, `payment_plan_available`, `sales_end_soon`
- **Client validation (templates):** `selection_min_reached`, `selection_max_types`, `quantity_min_reached`, `quantity_max_reached`
- **CTA labels (row message placement):** `waitlist_cta`, `notify_cta`

> Memory hook: **Axes explain; messages speak; notices announce.** Codes tag the facts; copy carries the words.

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

