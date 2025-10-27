# Product Panel — Normative Rules & Invariants (extracted)

Version: not specified
Source: product-panel-spec.md

## 1. Title and Provenance

- Title: "Product Panel — Normative Rules & Invariants (extracted)"
- Version/date: not specified in source
- Source: product-panel-spec.md

## 2. Conventions

- Level indicates strength: MUST/MUST NOT/SHOULD/MAY. Subject indicates actor: Client/Server/Contract.

## 3. Rules by Category

### Contract Shape

- [MUST] Contract — Payload object has exactly top-level keys: context, sections, items, pricing. [Ref: §Root object]
- [MUST] Client — Validate root keys strictly; unknown top-level keys are invalid. [Ref: §Root object]
- [MUST] Contract — Machine codes use snake_case; field names use camelCase. [Ref: §Root object]
- [MUST] Client — Validate payloads strictly on server (SSR/loaders) and client (hydration). [Ref: §Validation & compatibility (TanStack Start)]
- [MUST] Server — Send all business-meaningful fields explicitly. [Ref: §Validation & compatibility (TanStack Start)]
- [MUST NOT] Client — Invent defaults that change business meaning. [Ref: §Validation & compatibility (TanStack Start)]
- [MUST NOT] Client — Transform machine codes into UI text without payload strings/templates. [Ref: §Validation & compatibility (TanStack Start)]
- [MUST] Client — Replace derived state from server facts on each payload refresh; do not maintain a separate source of truth or predict transitions. [Ref: §Real‑time synchronization]
- [MUST NOT] Client — Implement payments, checkout orchestration, taxes/fees math, discounts, installment scheduling, identity/auth, membership verification, abuse/rate-limit, seat maps/holds/adjacency, approval/request workflows. [Ref: §Normative]

### Axes — Temporal

- [MUST] Server — Provide temporal.phase ∈ {"before","during","after"}. [Ref: §3.1 Temporal]
- [MUST] Client — Use server-provided temporal.phase; do not compute from timestamps or clocks. [Ref: §3.1 Temporal]
- [MUST] Client — Render timing text only via state.messages[] or context.copyTemplates. [Ref: §3.1 Temporal]
- [MUST NOT] Client — Compute countdowns, sale windows, or phase transitions from timestamps. [Ref: §3.1 Temporal]
- [MAY] Server — Include temporal.currentWindow/nextWindow timestamps for display-only. [Ref: §3.1 Temporal]
- [MAY] Client — Format timestamps for locale display only. [Ref: §3.1 Temporal]

### Axes — Supply

- [MUST] Server — Provide supply.status ∈ {"available","none","unknown"}. [Ref: §3.2 Supply]
- [SHOULD] Server — Include supply.reasons with "sold_out" when status is "none". [Ref: §3.2 Supply]
- [MAY] Server — Include supply.remaining for copy/urgency only. [Ref: §3.2 Supply]
- [MUST NOT] Client — Use supply.remaining to drive business rules. [Ref: §3.2 Supply]
- [MUST] Client — Enforce only commercial.maxSelectable as the quantity clamp. [Ref: §3.2 Supply]

### Axes — Gating (incl. listingPolicy)

- [MUST] Server — Set gating.required=true for gated items. [Ref: §3.3 Gating (with `listingPolicy`)]
- [MUST] Server — Omit item when unsatisfied and listingPolicy="omit_until_unlocked". [Ref: §3.3 Gating (with `listingPolicy`)]
- [MUST] Server — Send item as locked when unsatisfied and listingPolicy="visible_locked". [Ref: §3.3 Gating (with `listingPolicy`)]
- [MUST] Client — Mask price and hide quantity UI for locked rows. [Ref: §3.3 Gating (with `listingPolicy`)]
- [MUST NOT] Client — Infer omitted items beyond context.gatingSummary.hasHiddenGatedItems. [Ref: §3.3 Gating (with `listingPolicy`)]
- [MUST] Server — Validate access codes server-side. [Ref: §3.3 Gating (with `listingPolicy`)]
- [MUST NOT] Client — Validate or rate-limit access codes. [Ref: §3.3 Gating (with `listingPolicy`)]
- [MAY] Server — Include gating.requirements[] metadata for copy only. [Ref: §3.3 Gating (with `listingPolicy`)]
- [MUST NOT] Client — Use gating.requirements[] to decide purchasability. [Ref: §3.3 Gating (with `listingPolicy`)]
- [MUST] Server — On unlock, include previously omitted items and set gating.satisfied=true. [Ref: §3.3 Gating (with `listingPolicy`)]

### Axes — Demand

- [MUST] Server — Provide demand.kind ∈ {"none","waitlist","notify_me"}. [Ref: §3.4 Demand (alternate actions)]
- [MUST NOT] Client — Surface demand CTAs when gating.required=true and gating.satisfied=false. [Ref: §3.4 Demand (alternate actions)]

### Cross-Axis Invariants

- [MUST] Contract — Keep axes independent; do not encode decisions across axes. [Ref: §Normative (global to the state model)]
- [MUST] Contract — Put causes in reasons[] and user text in state.messages[] or context.panelNotices[]. [Ref: §Normative (global to the state model)]
- [MUST] Client — Enforce gating precedence: if gate unsatisfied, do not show demand CTAs. [Ref: §3.5 Cross‑Axis Invariants (quick)]
- [MUST] Server — Omit unpublished/disabled items (no admin axis). [Ref: §3.5 Cross‑Axis Invariants (quick)]

### Derived Flags (isPurchasable, presentation)

- [MUST] Client — Compute isPurchasable as temporal.phase="during" AND supply.status="available" AND (gating.required=false OR gating.satisfied=true) AND commercial.maxSelectable > 0. [Ref: §8.1 Normative — Derived flags]
- [MUST] Client — Derive presentation="locked" when gating.required=true AND gating.satisfied=false AND gating.listingPolicy="visible_locked"; otherwise presentation="normal". [Ref: §8.1 Normative — Derived flags]

### Items & Commercial (maxSelectable, limits)

- [MUST] Contract — Each items[] element includes product, state (temporal, supply, gating, demand, messages[]), commercial, display; variant optional; relations optional. [Ref: §4.3 `items` (the list of purchasable & related products)]
- [MUST] Contract — product.type ∈ {"ticket","digital","physical"}; no price in product/variant. [Ref: §6.1 Normative (contract you can validate)]
- [MUST] Server — Ensure product.id is unique across payload. [Ref: §4.3 `items` (the list of purchasable & related products)]
- [MUST] Server — Provide commercial with price, feesIncluded, maxSelectable; limits optional. [Ref: §4.3 `items` (the list of purchasable & related products)]
- [MUST] Contract — commercial.price is a Dinero v2 snapshot { amount, currency{code,base,exponent}, scale }. [Ref: §6.1 Normative (contract you can validate)]
- [MUST] Server — Compute commercial.maxSelectable as the effective cap considering stock, limits, holds, fraud rules; 0 disables selection. [Ref: §6.1 Normative (contract you can validate)]
- [MUST] Client — Enforce only commercial.maxSelectable; do not derive limits from other fields. [Ref: §4.3 `items` (the list of purchasable & related products)]
- [MAY] Server — Provide limits.perOrder / limits.perUser for display only. [Ref: §6.1 Normative (contract you can validate)]
- [MUST NOT] Client — Enforce limits.perOrder or limits.perUser directly. [Ref: §4.3 `items` (the list of purchasable & related products)]
- [MUST NOT] Client — Show price for non‑purchasable rows; only mask price for locked rows. [Ref: §6.4 Invariants & Guardrails (read before coding)]
- [MUST NOT] Client — Invent "Free" or other labels; labels come from payload/templating. [Ref: §6.6 Edge cases & tests (acceptance checks)]
- [MUST NOT] Contract — Include any admin/approval axis in items. [Ref: §4.3 `items` (the list of purchasable & related products)]

### Pricing Footer (server math, line items)

- [MUST] Server — Always include pricing; compute all money server-side. [Ref: §4.4 `pricing` (server‑computed money summary)]
- [MUST NOT] Client — Perform price math; render server-provided Dinero snapshots only. [Ref: §4.4 `pricing` (server‑computed money summary)]
- [MUST] Contract — Keep single currency per panel; pricing.currency.code matches every item price currency. [Ref: §11 Pricing Footer _(server math; inclusions flags)_]
- [MUST] Client — Render pricing.lineItems in payload order; do not reorder, insert, or compute derived rows. [Ref: §11 Pricing Footer _(server math; inclusions flags)_]
- [MUST] Client — Render unknown pricing line item codes as provided using label verbatim. [Ref: §11 Pricing Footer _(server math; inclusions flags)_]
- [MAY] Server — Use pricing.mode "reserve" or "final"; clients do not infer "estimated" beyond labels. [Ref: §11 Pricing Footer _(server math; inclusions flags)_]
- [MAY] Server — Omit TAX or send 0 if included elsewhere; negative amounts allowed for discounts. [Ref: §11 Pricing Footer _(server math; inclusions flags)_]
- [MUST] Client — Keep last valid pricing displayed during refresh; do not clear the footer. [Ref: §11 Pricing Footer _(server math; inclusions flags)_]
- [MUST] Client — Format Dinero snapshots for display without altering numeric values. [Ref: §11 Pricing Footer _(server math; inclusions flags)_]
- [MUST] Client — Validate single currency per panel (all items' price currencies match pricing.currency). [Ref: §11 Pricing Footer _(server math; inclusions flags)_]
- [MUST] Client — Trigger pricing refresh on quantity changes, discount application, and unlock success; not on pure UI interactions. [Ref: §11 Pricing Footer _(server math; inclusions flags)_]

### Messages & Panel Notices (single channels, placement, priority, resolution)

- [MUST] Contract — Use a single row-level channel: state.messages[]. [Ref: §7.1 Normative (contract you can validate)]
- [MUST NOT] Client — Synthesize row text from reasons[] or hardcoded strings. [Ref: §7.1 Normative (contract you can validate)]
- [MUST] Contract — Each messages[] entry includes code (snake_case) and required placement; omit messages with invalid/missing placement. [Ref: §7.1 Normative (contract you can validate)]
- [MUST] Client — If text missing, resolve via context.copyTemplates[key==code] with params; otherwise omit. [Ref: §5.4 Templates & interpolation]
- [MUST] Client — Sort messages per placement by descending priority, then payload order. [Ref: §7.1 Normative (contract you can validate)]
- [MUST] Contract — Panel-level banners come only from context.panelNotices[]. [Ref: §7.1 Normative (contract you can validate)]
- [MUST NOT] Client — Duplicate panel banners as row messages unless both are sent by server. [Ref: §7.1 Normative (contract you can validate)]
- [MUST NOT] Contract — Include reasonTexts in context; row text lives in state.messages[]. [Ref: §4.1 `context` (server‑authored panel configuration & copy)]
- [MUST] Contract — Sort panelNotices[] by descending numeric priority (ties keep server order). [Ref: §5.3 Payment plan banner rule (authoritative)]
- [MUST] Server — Localize messages and templates before delivery; client performs no translation. [Ref: §7.1 Normative (contract you can validate)]
- [MUST NOT] Client — Render any text not coming from messages[] / panelNotices[] / copyTemplates or clientCopy. [Ref: §5.2 Copy channels (single source at each level)]
- [MUST NOT] Client — Hardcode PanelActionButton labels; labels come from atom logic with clientCopy overrides. [Ref: §5.3a Panel-level CTA derivation (PanelActionButton & AccessCodeCTA)]

### Preferences (UI hints only; payment plan invariants)

- [MUST NOT] Client — Use context.effectivePrefs for business logic (availability, prices, clamps). [Ref: §5.1 `context.effectivePrefs` (UI hints only; never business logic)]
- [SHOULD] Server — Provide showTypeListWhenSoldOut and displayPaymentPlanAvailable in effectivePrefs. [Ref: §5.1 `context.effectivePrefs` (UI hints only; never business logic)]
- [MUST] Contract — Treat unknown prefs as invalid (validation error). [Ref: §5.1 `context.effectivePrefs` (UI hints only; never business logic)]
- [MUST] Contract — Render a payment-plan banner only when a panelNotices[] entry with code:"payment_plan_available" is present. [Ref: §5.3 Payment plan banner rule (authoritative)]
- [MUST NOT] Client — Auto-render a payment plan banner based on displayPaymentPlanAvailable alone. [Ref: §5.3 Payment plan banner rule (authoritative)]

### Sections (id/label/order, visibility)

- [MUST] Server — Send sections[] for grouping; each has { id, label, order, labelOverride? }. [Ref: §4.2 `sections` (grouping/navigation)]
- [MUST NOT] Client — Assume any specific section IDs or names. [Ref: §4.2 `sections` (grouping/navigation)]
- [MUST] Client — Place items by display.sectionId; if absent, render in first section by order. [Ref: §4.2 `sections` (grouping/navigation)]
- [MAY] Client — Hide empty sections. [Ref: §4.2 `sections` (grouping/navigation)]

### Gating & Unlock (zero-leak, AccessCodeCTA derivation)

- [MUST] Contract — Treat missing listingPolicy on unsatisfied gated items as "omit_until_unlocked". [Ref: §9.1 Normative]
- [MUST] Contract — Include context.gatingSummary iff gating exists; it must contain hasHiddenGatedItems: boolean. [Ref: §4.1 `context` (server‑authored panel configuration & copy)]
- [MUST] Client — Show AccessCodeCTA when gatingSummary.hasHiddenGatedItems===true or any visible item is locked, unless using requires_code_entry notice. [Ref: §5.3a Panel-level CTA derivation (PanelActionButton & AccessCodeCTA)]
- [MUST NOT] Client — Render placeholders for omitted items; do not leak any info beyond the hasHiddenGatedItems boolean. [Ref: §9.1 Normative]
- [MUST] Server — After unlock, include previously omitted items or flip gating.satisfied=true, recompute clamps and pricing, and update gatingSummary. [Ref: §9.1 Normative]
- [MUST] Client — Mask price and hide quantity for locked rows regardless of commercial.price presence. [Ref: §9.1 Normative]
- [MUST NOT] Client — Surface demand CTAs (waitlist/notify) for locked items. [Ref: §9.1 Normative]
- [MUST] Client — Replace local derived state only after receiving the new payload post-unlock. [Ref: §9.1 Normative]

### Relations & Add-ons (parentProductIds, matchBehavior)

- [MAY] Contract — Include relations.parentProductIds[] and matchBehavior: "per_ticket" | "per_order"; default to "per_order" if omitted when parents exist. [Ref: §10.1 Normative (contract you can validate)]
- [MUST] Contract — Treat any item with parentProductIds[] as an add-on; do not change product.type. [Ref: §10.1 Normative (contract you can validate)]
- [MUST] Server — Recompute add-on maxSelectable on each refresh to reflect parent selections and constraints. [Ref: §10.1 Normative (contract you can validate)]
- [SHOULD] Server — Send maxSelectable=0 for add-ons when parentSelectedCount=0. [Ref: §10.1 Normative (contract you can validate)]
- [MUST NOT] Client — Compute numeric caps for add-ons; enforce only maxSelectable and refresh on parent changes. [Ref: §10.1 Normative (contract you can validate)]
- [MUST NOT] Client — Leak gated parents; if all parents are omitted, the add-on must be omitted or separately gated. [Ref: §10.1 Normative (contract you can validate)]
- [MUST] Client — Clamp current selection down if refreshed maxSelectable decreases. [Ref: §10.1 Normative (contract you can validate)]

### Currency & Money (Dinero snapshots, single currency)

- [MUST] Contract — Transport all money as Dinero v2 snapshots; nothing else. [Ref: §11 Pricing Footer _(server math; inclusions flags)_]
- [MUST] Client — Format snapshots for display (locale, currency symbol) without altering numeric values. [Ref: §11 Pricing Footer _(server math; inclusions flags)_]
- [MUST] Contract — Keep one currency per panel across all amounts. [Ref: §6.4 Invariants & Guardrails (read before coding)]

### Fulfillment (icons/tooltips only)

- [MUST] Contract — Restrict product.fulfillment.methods to server-defined enums; unknown values are invalid. [Ref: §6.1 Normative (contract you can validate)]
- [MAY] Server — Provide fulfillment.details as display-only metadata. [Ref: §6.1 Normative (contract you can validate)]
- [MUST NOT] Client — Use fulfillment to change purchasability; it is display-only. [Ref: §6.4 Invariants & Guardrails (read before coding)]

### Validation & Schemas (Zod strictness, boundary validation)

- [MUST] Client — Validate payloads strictly at SSR and on client; unknown fields are errors. [Ref: §Validation & compatibility (TanStack Start)]
- [MUST] Client — Reject payload missing any of: context, sections, items, pricing. [Ref: §Root object]
- [MUST] Client — Reject payload with duplicate product.id. [Ref: §4.3 `items` (the list of purchasable & related products)]
- [MUST] Client — Reject payload on currency mismatch between items and pricing. [Ref: §11 Pricing Footer _(server math; inclusions flags)_]

### Reason Codes (machine codes, snake_case, non-UI)

- [MUST] Contract — Use snake_case for machine codes in reasons[] and messages[].code. [Ref: §Root object]
- [MUST NOT] Client — Translate reason codes to UI strings or display codes to users. [Ref: §7.1 Normative (contract you can validate)]
- [MUST] Contract — Keep reason codes in reasons[]; user text in messages[] or panelNotices[]. [Ref: §Normative (global to the state model)]

### Panel-Level Rollups (PanelActionButton, AccessCodeCTA)

- [MUST] Client — Derive PanelActionButton kind and enabled from panel state: checkout when any visible item purchasable; waitlist when none purchasable but any eligible visible item has demand.waitlist; notify_me when before-sale with notify; otherwise disabled checkout. [Ref: §5.3a Panel-level CTA derivation (PanelActionButton & AccessCodeCTA)]
- [MUST] Client — Determine singular/plural label context per spec and source labels from clientCopy or atom defaults; never hardcode. [Ref: §5.3a Panel-level CTA derivation (PanelActionButton & AccessCodeCTA)]
- [MUST] Client — Show AccessCodeCTA under the stated conditions; the access form as a notice uses code:"requires_code_entry". [Ref: §5.2 Copy channels (single source at each level)]

### Performance & Refresh (debounce, retry/backoff, stale allowances)

- [MUST] Client — Re-derive presentation on every payload refresh; never predict future server state. [Ref: §Real‑time synchronization]
- [MUST] Client — Call server for all interactions (quantity changes, unlock attempts, demand CTAs) and replace local derived state from the new payload. [Ref: §8.3 Interaction & data refresh (authoritative loop)]
- [MUST] Client — Keep previous pricing visible during refresh; on fetch error, show stale pricing with error indicator and retry policy; do not block checkout for <30s staleness. [Ref: §11 Pricing Footer _(server math; inclusions flags)_]

### Accessibility

- [MAY] Client — Apply visual styling distinctions (e.g., TOTAL emphasis) without reordering. [Ref: §11 Pricing Footer _(server math; inclusions flags)_]

### Security & Privacy (no logging codes/tokens, no caching omitted SKUs)

- [MUST NOT] Client — Log access codes or gating tokens in analytics, errors, or URLs. [Ref: §Security guardrails]
- [MUST NOT] Client — Persist gating tokens beyond server TTL or across accounts. [Ref: §Security guardrails]
- [MUST] Client — Send all unlock attempts to server; do not implement client-side rate limiting/validation. [Ref: §Security guardrails]
- [MUST NOT] Client — Cache/speculate omitted items or leak their presence beyond the summary boolean. [Ref: §Security guardrails]
- [MUST NOT] Client — Show price for locked rows; only mask as specified. [Ref: §Security guardrails]

## 4. Decision Tables

### CTA Selection Logic

- [MUST] Client — If gating.required && !gating.satisfied && listingPolicy="visible_locked" ⇒ cta.kind="none". [Ref: §8.1 Normative — Derived flags (pure functions over the contract)]
- [MUST] Client — Else if isPurchasable===true ⇒ cta.kind="quantity", enabled=(maxSelectable>0). [Ref: §8.1 Normative — Derived flags (pure functions over the contract)]
- [MUST] Client — Else if supply.status="none" AND demand.kind="waitlist" ⇒ cta.kind="waitlist", enabled. [Ref: §8.1 Normative — Derived flags (pure functions over the contract)]
- [MUST] Client — Else if temporal.phase="before" AND demand.kind="notify_me" ⇒ cta.kind="notify", enabled. [Ref: §8.1 Normative — Derived flags (pure functions over the contract)]
- [MUST] Client — Else ⇒ cta.kind="none". [Ref: §8.1 Normative — Derived flags (pure functions over the contract)]
- [MUST] Client — Apply gating precedence: demand CTAs MUST NOT appear while gate is unsatisfied. [Ref: §3.5 Cross‑Axis Invariants (quick)]

### Price/Quantity Visibility Matrix

- [MUST] Client — If presentation="locked" ⇒ quantityUI="hidden", priceUI="masked". [Ref: §8.1 Normative — Derived flags (pure functions over the contract)]
- [MUST] Client — If presentation="normal" AND isPurchasable=false ⇒ quantityUI="hidden", priceUI="hidden". [Ref: §8.1 Normative — Derived flags (pure functions over the contract)]
- [MUST] Client — If presentation="normal" AND isPurchasable=true AND maxSelectable===1 ⇒ quantityUI="select", priceUI="shown". [Ref: §8.1 Normative — Derived flags (pure functions over the contract)]
- [MUST] Client — If presentation="normal" AND isPurchasable=true AND maxSelectable>1 ⇒ quantityUI="stepper", priceUI="shown". [Ref: §8.1 Normative — Derived flags (pure functions over the contract)]
- [MUST] Client — Show quantity controls only when presentation="normal", isPurchasable=true, and maxSelectable>0. [Ref: §8.1 Normative — Derived flags (pure functions over the contract)]
- [MUST] Client — Show price only when presentation="normal" and isPurchasable=true. [Ref: §8.1 Normative — Derived flags (pure functions over the contract)]

## 5. Validation Checklist

- [MUST] — Root keys exactly context, sections, items, pricing; reject unknown roots. [Ref: §Root object]
- [MUST] — Machine codes snake_case; field names camelCase. [Ref: §Root object]
- [MUST] — Validate payload strictly at SSR and hydration; unknown fields are errors. [Ref: §Validation & compatibility (TanStack Start)]
- [MUST] — context.orderRules includes required fields (types, typesPerOrder, ticketsPerType, minSelectedTypes, minTicketsPerSelectedType). [Ref: §4.1 `context` (server‑authored panel configuration & copy)]
- [MUST] — context.gatingSummary present iff gating exists; contains hasHiddenGatedItems. [Ref: §4.1 `context` (server‑authored panel configuration & copy)]
- [MUST] — sections[] entries have {id,label,order}. [Ref: §4.2 `sections` (grouping/navigation)]
- [MUST] — Each item has unique product.id. [Ref: §4.3 `items` (the list of purchasable & related products)]
- [MUST] — product.type ∈ {"ticket","digital","physical"}; no price fields in product/variant. [Ref: §6.1 Normative (contract you can validate)]
- [MUST] — product.fulfillment.methods[] values in allowed enum; unknown is invalid. [Ref: §6.1 Normative (contract you can validate)]
- [MUST] — state.temporal.phase ∈ {"before","during","after"}. [Ref: §3.1 Temporal]
- [MUST] — supply.status ∈ {"available","none","unknown"}. [Ref: §3.2 Supply]
- [MUST] — gating.listingPolicy ∈ {"omit_until_unlocked","visible_locked"} when present; default omit when absent and unsatisfied. [Ref: §3.3 Gating (with `listingPolicy`)]
- [MUST] — visible_locked items present with price masked and quantity hidden. [Ref: §3.3 Gating (with `listingPolicy`)]
- [MUST] — demand.kind ∈ {"none","waitlist","notify_me"}; demand CTAs suppressed while gate unsatisfied. [Ref: §3.4 Demand (alternate actions)]
- [MUST] — state.messages[] entries include required placement; omit if invalid/missing. [Ref: §7.1 Normative (contract you can validate)]
- [MUST] — commercial.price is a valid Dinero snapshot; commercial.maxSelectable present; limits.\* optional/informational. [Ref: §6.1 Normative (contract you can validate)]
- [MUST] — All commercial.price.currency.code match pricing.currency.code. [Ref: §11 Pricing Footer _(server math; inclusions flags)_]
- [MUST] — pricing present in every payload; client renders only provided breakdown; no recomputation. [Ref: §11 Pricing Footer _(server math; inclusions flags)_]
- [MUST] — Render pricing.lineItems in provided order without reordering. [Ref: §11 Pricing Footer _(server math; inclusions flags)_]
- [MUST] — Payment plan banner appears only when panelNotices includes code "payment_plan_available". [Ref: §5.3 Payment plan banner rule (authoritative)]
- [MUST] — Omit items entirely when gating.required && !satisfied && listingPolicy="omit_until_unlocked". [Ref: §3.3 Gating (with `listingPolicy`)]
- [MUST NOT] — Render price when isPurchasable=false. [Ref: §6.4 Invariants & Guardrails (read before coding)]
- [MUST NOT] — Use limits.\* or supply.remaining to clamp; enforce only maxSelectable. [Ref: §6.1 Normative (contract you can validate)]
- [MUST NOT] — Accept unknown effectivePrefs; treat as invalid. [Ref: §5.1 `context.effectivePrefs` (UI hints only; never business logic)]
- [MUST NOT] — Display machine codes; only payload text or resolved templates. [Ref: §7.1 Normative (contract you can validate)]

## 6. Gaps & Ambiguities

- **Line-item code handling conflict** — §11 says "Unknown codes MUST be rendered as provided," while the "Developer checklist (implementation audit)" later says "Unknown line item codes are invalid (strict enum)"; this is inconsistent. [Ref: §11 Pricing Footer _(server math; inclusions flags)_, §Developer checklist (implementation audit)]
- **Pricing structure WIP** — §4.4 labels the pricing contract as evolving (mode/lineItems/granularity may change), which leaves exact pricing shape partially unstable. [Ref: §4.4 `pricing` (server‑computed money summary)]
- **Multiple "Normative" subheadings** — Several sections use the generic heading "Normative," which can create citation ambiguity without the parent section context. [Ref: §Normative]
- **Accessibility requirements** — Largely implementation guidance; no explicit normative a11y constraints beyond allowed visual styling are specified. [Ref: §11 Pricing Footer _(server math; inclusions flags)_]
