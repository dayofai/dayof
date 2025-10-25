The deep‑research write‑up is rich but dense. Treat it as **raw ore**, not the surface you publish. Keep the **structured outline** we already have and **pull in only the good minerals** from v0.4. Below is exactly how I’d do it, with a concrete outline and drop‑in section examples in your preferred style.

---

## TL;DR

- **Keep your outline.** It’s faster to read, easier to implement, and better for code review.
- **Adopt the useful v0.4 pieces** (orderRules, gatingSummary, listingPolicy, unified messages, panelNotices), but **publish them inside your outline** with RFC‑style MUST/SHOULD bullets, decision tables, and compact examples.
- **Ditch narrative bulk.** Every section gets: **Normative → Rationale → Examples → Tests** (4 compact blocks, max).

---

## Recommended doc structure (v0.4‑g)

> Same skeleton you liked; I’ve slotted the v0.4 upgrades where they belong.

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

   - Row presentation (normal/locked/suppressed)
   - Purchasable boolean
   - CTA decision tree _(incl. approvalRequired → Request)_
   - Quantity & price visibility rules

9. **Gating & Unlock (No Leakage)**

   - `listingPolicy="omit_until_unlocked"` default; `gatingSummary` is the only hint

10. **Relations & Add‑ons** _(selection vs ownership; applyQuantity/matchBehavior)_
11. **Pricing Footer** _(server math; inclusions flags)_
12. **Reason Codes Registry** _(machine codes; copy via messages/templates)_
13. **Invariants & Guardrails** _(client MUST NOT compute X)_
14. **Zod/TS Schemas** _(single source of truth)_
15. **Reference Fixtures (Storybook)**
16. **Change Log (v0.3 → v0.4‑g)**

---

## Editorial rules (so it stays parseable)

- **Normative first** (MUST/SHOULD/MUST NOT) in bullets.
- **Decision tables** for UI mapping.
- **Examples**: tiny JSON; one per case.
- **Tests**: 2–4 acceptance checks per section (“Given/When/Expect”).
- Avoid paragraphs > 4 lines. No duplicated concepts in different sections.

---

## Drop‑in section examples (concise)

### 3.3 Gating (with `listingPolicy`) — **FINAL TEXT**

**Normative**

- Gated items MUST set `state.gating.required=true`.
- If gate unsatisfied:

  - `listingPolicy="omit_until_unlocked"` (default) ⇒ item MUST NOT be sent in `items[]`.
  - `listingPolicy="visible_locked"` ⇒ item MUST be sent as **locked**; price MUST be masked; quantity UI MUST be hidden.

- Client MUST NOT infer omitted items. Only use `context.gatingSummary.hasHiddenGatedItems`.
- Access code validation MUST occur server‑side; client MUST NOT rate‑limit or validate.
- On successful unlock, previously omitted items MUST appear with `gating.satisfied=true`.

**Rationale**

- Zero‑leak default protects presales.
- Tease mode (`visible_locked`) is opt‑in for marketing.

**Examples**

```jsonc
// Hidden until unlock (default)
"gating": { "required": true, "satisfied": false, "listingPolicy": "omit_until_unlocked" }

// Visible locked (tease)
"gating": { "required": true, "satisfied": false, "listingPolicy": "visible_locked", "reasons": ["requires_code"] }
```

**Tests**

- Given `omit_until_unlocked`, item absent; `gatingSummary.hasHiddenGatedItems=true`.
- Given `visible_locked`, row renders locked; price masked; no quantity UI.
- After unlock, `satisfied=true`; CTA resolves to Purchase if other axes allow.

---

### 7. Messages (Unified) — **FINAL TEXT**

**Normative**

- `state.messages[]` is the **only** row‑level display channel for inline text.
- Each message MAY include `{ code, text?, params?, placement?, severity?, priority? }`.
- Panel banners MUST come from `context.panelNotices[]` only.
- `copyTemplates[]` MAY supply templates by `code` for when `text` is omitted.
- Axis `reasons[]` are machine facts only; client MUST NOT render text from reasons directly.
- `reasonTexts` MUST NOT be used (deprecated/removed).

**Rationale**

- One display channel avoids precedence fights and duplicate copy.

**Examples**

```jsonc
"state": {
  "supply": { "status": "none", "reasons": ["sold_out"] },
  "messages": [
    { "code": "sold_out", "text": "Sold Out", "placement": "row.under_quantity", "severity": "neutral", "priority": 100 }
  ]
}
```

**Tests**

- If `messages[].text` present → render verbatim.
- If `messages[].text` absent but template exists → render interpolated.
- No `messages[]` → row may still show hard UI tokens (e.g., lock icon), but no implicit strings.

---

### 8. Rendering: CTA Decision — **FINAL TABLE**

| Condition (in order)                                                             | CTA             | Enabled           |
| -------------------------------------------------------------------------------- | --------------- | ----------------- |
| Row presentation ≠ `normal`                                                      | none            | —                 |
| `approvalRequired=true` AND temporal=`during` AND supply=`available` AND gate OK | `request`       | true              |
| Purchasable (`during` + supply=`available` + gate OK)                            | `purchase`      | `maxSelectable>0` |
| supply=`none` AND `demandCapture.kind="waitlist"` AND gate OK                    | `join_waitlist` | true              |
| temporal=`before` AND `demandCapture.kind="notifyMe"`                            | `notify_me`     | true              |
| Otherwise                                                                        | none            | —                 |

---

### 5. Preferences & Payment Plan Banner — **FINAL TEXT**

**Normative**

- `effectivePrefs.paymentPlanAvailable` indicates feature availability; it MUST NOT auto‑render a banner.
- A payment plan banner MUST be rendered **only** when the server sends a `panelNotices[]` entry with `code="payment_plan_available"`.
- Client MUST render `panelNotices[]` in descending `priority`.

**Example notice**

```jsonc
{
  "code": "payment_plan_available",
  "scope": "panel",
  "severity": "info",
  "text": "Payment plans available at checkout",
  "priority": 50
}
```

**Tests**

- No banner without a notice entry, even if `paymentPlanAvailable=true`.
- With the notice present → banner renders once at panel top.

---

## One‑page cheat sheet (what changed vs. v0.3)

- **Admin axis → removed.** Use `state.approvalRequired` flag only.
- **availability → supply.** `status: "available" | "none" | "unknown"`.
- **Gating**: `listingPolicy` replaces `visibilityPolicy`. Default: `"omit_until_unlocked"`.
- **Panel banners**: from `context.panelNotices[]` only.
- **Copy**: unified `state.messages[]` + optional `copyTemplates[]`. `reasonTexts` gone.
- **Codes**: prefer `sold_out`, `requires_code` everywhere.
- **Hidden gated**: client only trusts `context.gatingSummary.hasHiddenGatedItems`.

---

## Build plan (fast and ADHD‑friendly)

**Pass 1 — Lexicon & Invariants (30–45 min)**

- Write Section 2 (forbidden → preferred table).
- Write Section 13 (client MUST NOT list).

**Pass 2 — Schemas (single file)**

- Apply the v0.4‑g schema diffs you already have (I can hand you the consolidated file).
- Generate types; fix red squiggles in client.

**Pass 3 — Decision tables**

- Sections 8 & 3: row presentation, purchasable, CTA table (above).
- Keep each table under ~12 rows.

**Pass 4 — Examples & Fixtures**

- 6 fixtures: available, sold out + waitlist, visible_locked, omit_until_unlocked, all public sold out + hidden gated, approvalRequired.

**Pass 5 — Tests**

- One assertion per fixture (snapshot of row VM + panel notices).

---

## Why this beats the deep‑research draft

- **Same power, less cognitive load.** The “deep” doc is a rationale dump. Your outline is a **contract**.
- **Fewer nouns for the brain.** One messaging channel. One supply name. One clamp. Default secure gating.
- **Directly implementable.** Every bullet maps to code or validation.

---

## Ready‑to‑merge deltas you already approved

- Admin axis → **remove**; keep `approvalRequired` boolean.
- `availability` → **`supply`**.
- `visibilityPolicy` → **`listingPolicy`** (default `omit_until_unlocked`).
- `reasonTexts` → **delete**; use **`state.messages[]`** + `copyTemplates[]`.
- Payment plan → banner only when **`panelNotices[]`** includes it.
- Codes → **`sold_out`**, **`requires_code`** everywhere.
- Client inference of hidden gated → **forbidden**; rely on **`gatingSummary`**.

NOTE: This is greenfield but we do not need to always state that it's greenfield or draw comparisons to previous ideas. It's greenfield so what we produce here does not need to be qualified in the context of past versions!

Please write:
