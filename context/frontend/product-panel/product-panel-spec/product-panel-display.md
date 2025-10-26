# Product Panel Spec 0.4 — Part 2 of 4: Display & Interaction

[Back to Product Panel Spec Index](./product-panel-index.md)

**Sections Covered:** §5–§9 Display & Interaction  
Part of Product Panel Spec 0.4

> For contract fields referenced here, see [§4 Top-Level Contract Shape](./product-panel-contract.md#4-top-level-contract-shape-context-sections-items-pricing).

## 5. Preferences & Copy _(incl. payment plan banner rule)_

### **Normative**

### 5.1 `context.effectivePrefs` (UI hints only; never business logic)

The server **MAY** include UI preferences that shape **presentation**, not policy. Clients **MUST NOT** use them to compute availability, prices, or clamps.

- `showTypeListWhenSoldOut: boolean` —

  - `true` ⇒ keep rows visible (disabled) when everything's sold out.
  - `false` ⇒ collapse to a compact sold‑out panel.
  - Default is server‑defined; client renders exactly what is sent. Clients **MUST NOT** assume UI defaults for absent fields.
  - **Rationale:** Different events benefit from different treatments. Showing sold‑out types builds context and FOMO (driving waitlist signups), while hiding them provides a cleaner UX for postponed/cancelled events. This flexibility is independent of the strict price‑hiding policy (see §6/§8).

- `displayPaymentPlanAvailable: boolean` — indicates that installment plans exist at checkout.

  - **MUST NOT** by itself render any banner or badge. See **5.3** for the banner rule.

- `displayRemainingThreshold?: number` — optional urgency threshold that the **server** uses to decide when to set `display.showLowRemaining=true` (e.g., when `supply.remaining ≤ threshold`).

  - **Informational only:** tells the client what threshold the server is using; the client does not perform the comparison.
  - This flag **MUST NOT** alter purchasability or client logic.

- Unknown prefs are **invalid** (validation error).

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
- **Label source:** PanelActionButton labels **MUST** come from server-provided copy (e.g., `context.clientCopy`) or app-level copy that is sourced from the server (e.g., `panel_cta_continue`, `panel_cta_waitlist`, `panel_cta_disabled`). Clients **MUST NOT** hardcode these strings. See §5.4/§7.1 for template resolution rules.

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
- **Unknown placeholders resolve to empty string.** When interpolating templates, any unknown `{placeholder}` **MUST** resolve to `""`.
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

    - `methods[]` **MUST** use server‑defined enums; unknown values are **invalid** (validation error):
      - Recommended baseline: `"eticket"`, `"will_call"`, `"physical_mail"`, `"apple_pass"`, `"shipping"`.
      - The client uses these to display appropriate icons or labels (e.g., mobile phone icon for `"eticket"`, Apple Wallet logo for `"apple_pass"`, shipping truck for `"physical_mail"`).
    - `details` is vendor‑ or product‑specific metadata; **display‑only**.
      - May include shipping info, pickup instructions, redemption requirements, etc.
      - Client renders as supplementary text/tooltips; does not affect business logic.

  - Extra fields are limited to: `description?: string`, `subtitle?: string`, `category?: string`. Unknown extra fields are **invalid**.
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
- **Price visibility policy.** Price is shown (`priceUI="shown"`) **only** when purchasable (except `priceUI="masked"` for locked rows). Showing price for non-purchasable rows (sold out, not on sale yet, or when `commercial.maxSelectable=0`) is **disallowed**.
  _Reason:_ Displaying a price for an item you cannot buy creates psychological "tease" and "anchor" effects—users fixate on the unavailable price, leading to confusion ("Why show it if I can't buy it?") and potential frustration. By hiding price when not purchasable, we maintain clear, honest signals: if you see a price, you can act on it. Locked rows use masking (not hiding) to preserve the gating UX without leaking pricing to unauthorized users.
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
  _Expect_ validation error (unknown method).

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
- [ ] Price masked when locked; price hidden when not purchasable; quantity hidden when locked or not purchasable.
- [ ] Copy comes from `state.messages[]` / `context.copyTemplates` (no hardcoded strings).
- [ ] Fulfillment icons/tooltips driven by `product.fulfillment.methods`; values MUST be from the enum (unknown methods are invalid).
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
- [ ] When interpolating templates, any unknown `{placeholder}` resolves to `""` (empty string).
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
&& (!state.gating.required || state.gating.satisfied)  
&& (commercial.maxSelectable > 0)`

- **Quantity UI** `quantityUI: "hidden" | "select" | "stepper"`

  - **Hidden** unless `presentation === "normal" && isPurchasable && commercial.maxSelectable > 0`.
  - If shown:

    - `"select"` when `commercial.maxSelectable === 1` (single‑tap “Add” or a 1‑step selector).
    - `"stepper"` when `commercial.maxSelectable > 1`.

- **Price UI** `priceUI: "hidden" | "masked" | "shown"`

  - `"masked"` when `presentation === "locked"`.
  - `"shown"` **iff** `presentation === "normal"` **AND** `isPurchasable === true`.
  - Otherwise `"hidden"`.
  - **Rationale:** This strict policy prevents psychological "tease/anchor" effects. Showing a price for something you can't buy creates confusion and frustration ("Why display it if I can't select it?"). Hiding price until purchasable maintains honest, actionable signals. Locked rows use masking (not hiding) to preserve gating UX without leaking price to unauthorized users. See §6 for full policy discussion.

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

#### 8.1.a Row decision cheatsheet (developer aid)

```ts
function getRowPresentation(state: ItemState): "normal" | "locked" {
  const g = state.gating;
  if (g.required && !g.satisfied && g.listingPolicy === "visible_locked")
    return "locked";
  return "normal"; // Items with omit_until_unlocked never arrive in items[]
}

function isPurchasable(state: ItemState, maxSelectable: number): boolean {
  return (
    state.temporal.phase === "during" &&
    state.supply.status === "available" &&
    (!state.gating.required || state.gating.satisfied) &&
    maxSelectable > 0
  );
}

type CTA = {
  kind: "quantity" | "waitlist" | "notify" | "none";
  enabled?: boolean;
};
function getRowCTA(state: ItemState, maxSelectable: number): CTA {
  if (getRowPresentation(state) === "locked") return { kind: "none" };
  if (isPurchasable(state, maxSelectable))
    return { kind: "quantity", enabled: maxSelectable > 0 };
  if (state.supply.status === "none" && state.demand.kind === "waitlist")
    return { kind: "waitlist", enabled: true };
  if (state.temporal.phase === "before" && state.demand.kind === "notify_me")
    return { kind: "notify", enabled: true };
  return { kind: "none" };
}
```

> Use payload‑provided strings for labels (see §5). This snippet mirrors the truth tables above; it is illustrative only.

---

### 8.2 Decision tables (mechanical mapping)

#### A) Presentation

| Condition                                                                                      | `presentation` |
| ---------------------------------------------------------------------------------------------- | -------------- |
| `gating.required && !gating.satisfied && listingPolicy="visible_locked"`                       | `locked`       |
| Otherwise                                                                                      | `normal`       |
| _(Items omitted by server—`omit_until_unlocked`—do not appear and thus have no presentation.)_ | —              |

#### B) Purchasable

| `temporal.phase` | `supply.status` | Gate satisfied?              | `maxSelectable` | `isPurchasable` |
| ---------------- | --------------- | ---------------------------- | --------------- | --------------- |
| `"during"`       | `"available"`   | `(!required \|\| satisfied)` | `> 0`           | `true`          |
| Any other combo  | Any other combo | Any                          | Any             | `false`         |

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
  const max = item.commercial.maxSelectable ?? 0;
  return (
    s.temporal.phase === "during" &&
    s.supply.status === "available" &&
    (!s.gating.required || s.gating.satisfied) &&
    max > 0
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
  _Given_ `temporal.phase="during"`, `supply.status="available"`, `gating` satisfied or not required, and `commercial.maxSelectable=0`
  _Expect_ `isPurchasable=false`, `quantityUI="hidden"`, `priceUI="hidden"`, `cta.kind="quantity"` not selected (no quantity CTA).

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
- [ ] If `maxSelectable=0`, the row is not purchasable; price is hidden and quantity is hidden.
- [ ] When interpolating templates, any unknown `{placeholder}` resolves to `""` (empty string).
- [ ] Collapse sold‑out lists only per `effectivePrefs.showTypeListWhenSoldOut`.
- [ ] On any interaction, call server → replace payload → re‑derive.

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

**Visual treatment of locked rows (implementation guidance):**

- Locked rows typically appear **greyed-out** with a **lock icon** (visual indicator).
- Price may be replaced with placeholder text like "Locked" or "—" (not just blank).
- The row should clearly communicate its locked state through both visual styling and the message from `state.messages[]`.

**Unlock confirmation pattern:**

- When a gated item unlocks but has `supply.status="none"`, the item **MUST** still appear (as a disabled/sold-out row) to confirm the code worked.
- This prevents user confusion ("Did my code work?") by showing the item exists even when unavailable.
- The confirmation differs by `listingPolicy`: omitted items appear for the first time; `visible_locked` items transition from locked to unlocked-but-unavailable.

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

#### H. Unlock flow (user journey)

Understanding the complete unlock sequence helps implementers handle edge cases correctly:

**Pre-unlock state (omit_until_unlocked):**

- User loads panel → server sends **empty or partial** `items[]` (public items only, if any)
- `context.gatingSummary.hasHiddenGatedItems=true` (the hint)
- `context.panelNotices[]` includes unlock prompt: `{ code:"requires_code", text:"Enter access code to view tickets" }`
- Client displays AccessCodeCTA prominently (input + "Apply Code" button)
- User sees either: (a) no items if all are gated, or (b) public items marked sold out if those exist

**Unlock attempt:**

- User enters code → client POSTs to server `/panel/unlock` (or similar endpoint)
- Server validates code server-side (checks signature, expiry, usage limits, etc.)

**Post-unlock (success):**

- Server responds with updated payload:
  - Previously omitted items now appear in `items[]`
  - Those items have `gating.satisfied=true`
  - `context.gatingSummary.hasHiddenGatedItems` updates (may stay `true` if partial unlock)
  - Panel notice may change or be removed
- Client replaces state → atoms re-derive → React re-renders
- User sees: newly visible items with `presentation="normal"` (if available) or sold-out status (if `supply.status="none"`)

**Post-unlock (error):**

- Server responds with error payload or notice:
  - `context.panelNotices[]` includes `{ code:"code_invalid", variant:"error", text:"Invalid access code. Please try again." }`
  - No items are unlocked; state remains unchanged
- Client displays error banner (red, high priority)
- User can retry with correct code

**Critical edge case: Public sold out + hidden gated:**

- **Scenario:** All visible items have `supply.status="none"` but `gatingSummary.hasHiddenGatedItems=true`
- **Client behavior:** Do **NOT** show "Event Sold Out" final state; show "Enter access code" prompt instead
- **Rationale:** Prevents misleading users into thinking nothing is available when gated inventory exists
- **After unlock:** If gated items are also sold out, **then** show "Event Sold Out" (but user got confirmation their code worked)

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

#### F) Public sold out + hidden gated (no "sold out" dead‑end)

```jsonc
"context": {
  "gatingSummary": { "hasHiddenGatedItems": true },
  "panelNotices": [
    { "code": "requires_code", "variant": "info", "text": "Enter access code to view tickets", "priority": 90 }
  ]
},
"items": [
  // public items with supply.status="none"
  {
    "product": { "id": "prod_ga", "name": "General Admission", "type": "ticket" },
    "state": {
      "supply": { "status": "none", "reasons": ["sold_out"] },
      "messages": [
        { "code": "sold_out", "text": "Sold Out", "placement": "row.under_quantity", "priority": 100 }
      ]
    },
    "commercial": { "maxSelectable": 0 }
  }
]
// Panel SHOULD NOT collapse to final sold-out state; show AccessCodeCTA instead.
// User sees: sold-out public items + prominent "Enter access code" prompt (not "Event Sold Out" finale).
```

#### G) Reason code usage guidance

Gating-related codes and their typical presentation:

- **`requires_code`** (axis reason + panel notice + row message)

  - As axis reason: `gating.reasons: ["requires_code"]`
  - As panel notice: Instructional banner "Enter access code to view tickets" (info variant)
  - As row message: Small text "Requires access code" under locked item title (info variant)
  - Visual: Lock icon, greyed-out row styling

- **`code_invalid`** (panel notice, error state)

  - Shown after failed unlock attempt
  - Panel notice: "Invalid access code. Please try again." (error variant, red banner)
  - High priority (displays prominently)
  - Client does NOT generate this; server includes it in error response payload

- **`unlocked`** (row message, optional celebration)
  - May appear after successful unlock: "Unlocked with your code" (neutral variant)
  - Server may omit this if the unlocked state is obvious from newly visible items
  - Purpose: explicit confirmation feedback

**Visual treatment by code:**

| Code            | Icon     | Styling    | Typical Placement            | Variant |
| --------------- | -------- | ---------- | ---------------------------- | ------- |
| `requires_code` | 🔒 Lock  | Grey/muted | Row: under title; Panel: top | info    |
| `code_invalid`  | ⚠️ Alert | Red border | Panel: top banner            | error   |
| `unlocked`      | ✓ Check  | Normal     | Row: under title (optional)  | neutral |

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

- **Public sold out + hidden gated (no "sold out" dead-end)**
  _Given_ all visible items have `supply.status="none"` **AND** `gatingSummary.hasHiddenGatedItems=true`
  _Expect_ client **MUST NOT** display final "Event Sold Out" state; **MUST** show AccessCodeCTA and unlock prompt notice instead.
  _Rationale_ Prevents misleading users when gated inventory still exists.

- **Unlocked but sold out (confirmation feedback)**
  _Given_ user successfully unlocks code but unlocked item has `supply.status="none"`
  _Expect_ item appears as disabled/sold-out row (not omitted) to confirm code validation succeeded.
  _User benefit_ Clear feedback: "Your code worked, but this ticket sold out."

---

### 9.7 Developer checklist (quick)

**Core contract compliance:**

- [ ] Enforce sendability: omit vs visible‑locked exactly as specified by `listingPolicy`.
- [ ] Show AccessCodeCTA when `hasHiddenGatedItems` is true **or** any visible row is locked.
- [ ] Mask price + hide quantity on locked rows; no row CTA while locked.
- [ ] Do not render demand CTAs (waitlist/notify) for locked rows.
- [ ] Never invent copy; render `messages[]` / `panelNotices[]` only (templates via `copyTemplates`).
- [ ] After unlock attempt, re‑render from **new** payload; do not toggle `satisfied` locally.
- [ ] Do not log codes/tokens (see §13 Security guardrails).

**Visual implementation:**

- [ ] Locked rows: greyed-out styling + lock icon + price placeholder ("Locked" or "—").
- [ ] Reason code display: `requires_code` shows lock icon; `code_invalid` shows red error banner.
- [ ] Unlock confirmation: unlocked items that are sold out still appear (disabled) to confirm code worked.

**Edge case handling:**

- [ ] Public sold out + `hasHiddenGatedItems=true`: show unlock prompt, NOT "Event Sold Out" finale.
- [ ] Post-unlock sold out: render item as disabled row with sold-out message (confirmation feedback).
- [ ] Invalid code: display server-provided error notice prominently; allow retry.
- [ ] Partial unlock: keep AccessCodeCTA visible if `hasHiddenGatedItems` remains `true`.

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

