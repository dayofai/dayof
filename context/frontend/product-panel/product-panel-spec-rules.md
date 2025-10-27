<!-- markdownlint-disable MD029 -->
<!-- markdownlint-disable MD032 -->

# Product Panel Rules Audit Checklist

**Extracted from:** [Product Panel Spec 0.4](product-panel-spec.md)  
**Purpose:** Human-readable ordered list of all codified rules for implementation auditing

> **Note:** This checklist is comprehensive but does not replace the spec. When in doubt, consult the [source specification](product-panel-spec.md). Each rule includes a reference to its source section.

---

## Product Structure & Identity

1. **Product ID uniqueness** _[§4.3](product-panel-spec.md#43-items-the-list-of-purchasable--related-products)_: Each `product.id` MUST be unique across the entire payload
2. **Product type validation** _[§6.1](product-panel-spec.md#61-normative-contract-you-can-validate)_: `product.type` MUST be one of: `"ticket"`, `"digital"`, or `"physical"`
3. **Product name required** _[§6.1](product-panel-spec.md#61-normative-contract-you-can-validate)_: Every product MUST have a non-empty `name` field
4. **No price in product** _[§6.4](product-panel-spec.md#64-invariants--guardrails-read-before-coding)_: Price MUST NOT exist in `product` or `variant` objects; it lives only in `commercial.price`
5. **Variant flexibility** _[§6.1](product-panel-spec.md#61-normative-contract-you-can-validate)_: `variant` object MAY be empty `{}` for general admission tickets; when present, it MAY include `id`, `name`, and `attributes`
6. **Fulfillment methods enum** _[§6.1](product-panel-spec.md#61-normative-contract-you-can-validate)_: When present, `fulfillment.methods` MUST only contain recognized values: `"eticket"`, `"apple_pass"`, `"will_call"`, `"physical_mail"`, `"shipping"`, `"nfc"`
7. **Fulfillment is display-only** _[§6.4](product-panel-spec.md#64-invariants--guardrails-read-before-coding)_: Fulfillment methods MUST NOT affect purchasability; they only affect icons/tooltips

---

## Display & Presentation Rules

### Row Presentation

8. **Locked presentation condition** _[§8.1](product-panel-spec.md#81-normative--derived-flags-pure-functions-over-the-contract)_: A row is `"locked"` if and only if `gating.required === true` AND `gating.satisfied === false` AND `gating.listingPolicy === "visible_locked"`
9. **Normal presentation default** _[§8.1](product-panel-spec.md#81-normative--derived-flags-pure-functions-over-the-contract)_: All other rows have `"normal"` presentation
10. **Omitted items have no presentation** _[§3.3](product-panel-spec.md#33-gating-with-listingpolicy)_: Items with `listingPolicy="omit_until_unlocked"` and unsatisfied gates MUST NOT appear in `items[]` and thus have no presentation state

### Price Display

11. **Price shown only when purchasable** _[§8.1](product-panel-spec.md#81-normative--derived-flags-pure-functions-over-the-contract)_: Price is displayed (`priceUI="shown"`) ONLY when the item is purchasable (except when locked)
12. **Price masked when locked** _[§8.1](product-panel-spec.md#81-normative--derived-flags-pure-functions-over-the-contract)_: When `presentation === "locked"`, price MUST be masked (`priceUI="masked"`), not shown
13. **Price hidden when not purchasable** _[§8.1](product-panel-spec.md#81-normative--derived-flags-pure-functions-over-the-contract)_: When not purchasable and not locked, price MUST be hidden (`priceUI="hidden"`)
14. **No price tease** _[§6.4](product-panel-spec.md#64-invariants--guardrails-read-before-coding)_: Showing price for non-purchasable items is FORBIDDEN (prevents psychological tease/anchor effects)

### Quantity Controls

15. **Quantity hidden when locked** _[§8.1](product-panel-spec.md#81-normative--derived-flags-pure-functions-over-the-contract)_: Locked rows MUST hide quantity controls entirely
16. **Quantity hidden when not purchasable** _[§8.1](product-panel-spec.md#81-normative--derived-flags-pure-functions-over-the-contract)_: Quantity UI is hidden unless `presentation === "normal"` AND `isPurchasable === true` AND `maxSelectable > 0`
17. **Select vs stepper** _[§8.1](product-panel-spec.md#81-normative--derived-flags-pure-functions-over-the-contract)_: When shown, quantity UI uses `"select"` for `maxSelectable === 1`, `"stepper"` for `maxSelectable > 1`

### Badges & Visual Hints

18. **Product-level badges only** _[§4.3](product-panel-spec.md#43-items-the-list-of-purchasable--related-products)_: Badges in `display.badges[]` are product-specific, not section-level
19. **Low remaining flag** _[§4.3](product-panel-spec.md#43-items-the-list-of-purchasable--related-products)_: `display.showLowRemaining` is a boolean presentation flag for urgency styling; the count comes from `supply.remaining`
20. **Section assignment** _[§4.2](product-panel-spec.md#42-sections-groupingnavigation)_: Items assign themselves to sections via `display.sectionId`; if absent, client SHOULD render in first section by order

---

## State Axes (Business Logic)

### Temporal Axis

21. **Temporal phase authority** _[§3.1](product-panel-spec.md#31-temporal)_: `temporal.phase` MUST be one of: `"before"`, `"during"`, or `"after"`
22. **Server decides phase** _[§3.1](product-panel-spec.md#31-temporal)_: The server MUST compute phase; the client MUST NOT compute from timestamps
23. **No client countdown math** _[§3.1](product-panel-spec.md#31-temporal)_: Clients MUST NOT compute countdowns or sale windows from timestamps
24. **Timestamp metadata only** _[§3.1](product-panel-spec.md#31-temporal)_: `currentWindow` and `nextWindow` timestamps are for display metadata only, not client computation

### Supply Axis

25. **Supply status values** _[§3.2](product-panel-spec.md#32-supply)_: `supply.status` MUST be one of: `"available"`, `"none"`, or `"unknown"`
26. **Supply remaining is optional** _[§3.2](product-panel-spec.md#32-supply)_: `supply.remaining` MAY be present but MUST NOT drive business rules
27. **Sold out signal** _[§3.2](product-panel-spec.md#32-supply)_: When sold out, `supply.status === "none"` and reasons SHOULD include `"sold_out"`
28. **No inference from counts** _[§3.2](product-panel-spec.md#32-supply)_: Client MUST NOT infer "sold out" from `remaining === 0`; only `status` governs

### Gating Axis

29. **Gating fields required** _[§3.3](product-panel-spec.md#33-gating-with-listingpolicy)_: Gating MUST include `required`, `satisfied`, `listingPolicy`, and `reasons[]`
30. **Listing policy values** _[§3.3](product-panel-spec.md#33-gating-with-listingpolicy)_: `listingPolicy` MUST be either `"omit_until_unlocked"` (default) or `"visible_locked"`
31. **Omit enforcement** _[§3.3](product-panel-spec.md#33-gating-with-listingpolicy)_: When `required=true` AND `satisfied=false` AND `listingPolicy="omit_until_unlocked"`, the item MUST NOT be in `items[]`
32. **Visible locked enforcement** _[§3.3](product-panel-spec.md#33-gating-with-listingpolicy)_: When `listingPolicy="visible_locked"` and gate unsatisfied, item MUST be sent but locked (price masked, quantity hidden)
33. **Server-side validation only** _[§3.3](product-panel-spec.md#33-gating-with-listingpolicy)_: Access code validation MUST occur server-side; client MUST NOT validate or rate-limit
34. **Requirements metadata** _[§3.3](product-panel-spec.md#33-gating-with-listingpolicy)_: `gating.requirements[]` is explanatory metadata only; `gating.satisfied` is authoritative for purchasability

### Demand Axis

35. **Demand kind values** _[§3.4](product-panel-spec.md#34-demand-alternate-actions)_: `demand.kind` MUST be one of: `"none"`, `"waitlist"`, or `"notify_me"`
36. **Gating precedence over demand** _[§3.5](product-panel-spec.md#35-crossaxis-invariants-quick)_: If `gating.required && !satisfied`, demand CTAs (waitlist/notify) MUST NOT be shown
37. **No demand leakage** _[§3.5](product-panel-spec.md#35-crossaxis-invariants-quick)_: Locked items MUST NOT surface demand CTAs until unlocked

---

## Purchasability Rules

38. **Purchasability definition** _[§3 Normative](product-panel-spec.md#normative-global-to-the-state-model), [§8.1](product-panel-spec.md#81-normative--derived-flags-pure-functions-over-the-contract)_: An item is purchasable if and only if: `temporal.phase === "during"` AND `supply.status === "available"` AND (`!gating.required` OR `gating.satisfied`) AND `commercial.maxSelectable > 0`
39. **All conditions required** _[§8.1](product-panel-spec.md#81-normative--derived-flags-pure-functions-over-the-contract)_: All four conditions must be true for purchasability; any single failure makes the item non-purchasable

---

## CTA (Call-to-Action) Rules

40. **Locked rows have no CTA** _[§8.1](product-panel-spec.md#81-normative--derived-flags-pure-functions-over-the-contract)_: When `presentation === "locked"`, CTA MUST be `"none"`
41. **Purchasable shows quantity** _[§8.1](product-panel-spec.md#81-normative--derived-flags-pure-functions-over-the-contract)_: When purchasable, CTA is `"quantity"` (enabled only if `maxSelectable > 0`)
42. **Sold out + waitlist** _[§8.1](product-panel-spec.md#81-normative--derived-flags-pure-functions-over-the-contract)_: When `supply.status === "none"` AND `demand.kind === "waitlist"`, CTA is `"waitlist"`
43. **Before sale + notify** _[§8.1](product-panel-spec.md#81-normative--derived-flags-pure-functions-over-the-contract)_: When `temporal.phase === "before"` AND `demand.kind === "notify_me"`, CTA is `"notify"`
44. **Default to none** _[§8.1](product-panel-spec.md#81-normative--derived-flags-pure-functions-over-the-contract)_: If no conditions match, CTA is `"none"`
45. **CTA label from payload** _[§8.1](product-panel-spec.md#81-normative--derived-flags-pure-functions-over-the-contract)_: CTA button labels MUST come from payload (`messages[]` with `placement: "row.cta_label"` or templates); client MUST NOT hardcode strings
46. **No approval CTAs** _[§3.4](product-panel-spec.md#34-demand-alternate-actions)_: There is NO "Request Access" or approval-related CTA in this contract

---

## Commercial & Pricing Rules

### Price Structure

47. **Dinero snapshots required** _[§4.3](product-panel-spec.md#43-items-the-list-of-purchasable--related-products), [§11](product-panel-spec.md#11-pricing-footer-server-math-inclusions-flags)_: All money MUST be Dinero.js V2 snapshots with `{ amount, currency, scale }`
48. **Currency consistency** _[§11](product-panel-spec.md#11-pricing-footer-server-math-inclusions-flags)_: All items' `commercial.price.currency.code` MUST match `pricing.currency.code`
49. **Single currency per panel** _[§11](product-panel-spec.md#11-pricing-footer-server-math-inclusions-flags)_: Mixed currency panels are INVALID

### Max Selectable (The Single Clamp)

50. **MaxSelectable is authoritative** _[§4.3](product-panel-spec.md#43-items-the-list-of-purchasable--related-products), [§6.1](product-panel-spec.md#61-normative-contract-you-can-validate)_: `commercial.maxSelectable` is the ONLY value that constrains quantity UI
51. **Server computes maxSelectable** _[§4.3](product-panel-spec.md#43-items-the-list-of-purchasable--related-products)_: Server MUST recompute `maxSelectable` from stock, holds, limits, fraud rules, etc.
52. **Zero means not selectable** _[§4.3](product-panel-spec.md#43-items-the-list-of-purchasable--related-products)_: When `maxSelectable === 0`, the item cannot be selected (sold out, locked, or unavailable)
53. **Client enforces only maxSelectable** _[§3.2](product-panel-spec.md#32-supply), [§4.3](product-panel-spec.md#43-items-the-list-of-purchasable--related-products)_: Client MUST NOT derive limits from `supply.remaining`, `limits.perOrder`, or `limits.perUser`
54. **Limits are informational** _[§4.3](product-panel-spec.md#43-items-the-list-of-purchasable--related-products)_: `limits.perOrder` and `limits.perUser` are for display copy only ("Max 4 per order"), not UI enforcement

### Fees & Pricing Footer

55. **FeesIncluded is presentation hint** _[§6.1](product-panel-spec.md#61-normative-contract-you-can-validate)_: `feesIncluded` affects copy only ("+ fees" vs "incl. fees"); it does NOT change math
56. **Server computes all pricing** _[§4.4](product-panel-spec.md#44-pricing-servercomputed-money-summary), [§11](product-panel-spec.md#11-pricing-footer-server-math-inclusions-flags)_: The `pricing` object is 100% server-computed; client MUST NOT perform money arithmetic
57. **Pricing always present** _[§4.4](product-panel-spec.md#44-pricing-servercomputed-money-summary)_: `pricing` is always included; if nothing selected, send `{ currency, lineItems: [] }`
58. **LineItems render in order** _[§11](product-panel-spec.md#11-pricing-footer-server-math-inclusions-flags)_: Client MUST render `pricing.lineItems[]` in the exact order provided; no reordering
59. **No local totals** _[§11](product-panel-spec.md#11-pricing-footer-server-math-inclusions-flags)_: Client MUST NOT compute totals, taxes, fees, or discounts; render only what server provides
60. **Pricing line item codes strict** _[§14.2](product-panel-spec.md#142-core-contract-schemas)_: Line item `code` values MUST be from enum: `"TICKETS"`, `"FEES"`, `"TAX"`, `"DISCOUNT"`, `"TOTAL"` (unknown codes are validation errors; schema enforces strict enum)
61. **Pricing structure provisional** _[§4.4](product-panel-spec.md#44-pricing-servercomputed-money-summary)_: The `pricing.mode` field and exact breakdown structure are marked Work in Progress and may change

---

## Messages & Copy Rules

### Message Channels

62. **Single row text channel** _[§7.1](product-panel-spec.md#71-normative-contract-you-can-validate)_: Row-level text comes ONLY from `state.messages[]`
63. **Single panel banner channel** _[§7.1](product-panel-spec.md#71-normative-contract-you-can-validate)_: Panel-level banners come ONLY from `context.panelNotices[]`
64. **No client-invented text** _[§7.1](product-panel-spec.md#71-normative-contract-you-can-validate)_: Client MUST NOT synthesize text from machine codes or hardcoded strings
65. **Message structure required** _[§7.1](product-panel-spec.md#71-normative-contract-you-can-validate)_: Each message MUST have `code`, `placement`, and optionally `text`, `params`, `variant`, `priority`
66. **Placement is required** _[§7.1](product-panel-spec.md#71-normative-contract-you-can-validate)_: If `placement` is omitted or invalid, client MUST omit that message

### Message Resolution

67. **Text takes precedence** _[§7.1](product-panel-spec.md#71-normative-contract-you-can-validate)_: If message has `text`, render it verbatim; no templating
68. **Template fallback** _[§5.4](product-panel-spec.md#54-templates--interpolation)_: If no `text`, find `copyTemplates[key === code]` and interpolate with `params`
69. **Omit if neither** _[§7.1](product-panel-spec.md#71-normative-contract-you-can-validate)_: If neither `text` nor matching template exists, omit the message
70. **Unknown placeholders to empty** _[§5.4](product-panel-spec.md#54-templates--interpolation)_: When interpolating, unknown `{placeholder}` MUST resolve to `""`, not literal token

### Priority & Sorting

71. **Messages sorted by priority** _[§7.1](product-panel-spec.md#71-normative-contract-you-can-validate)_: Within same placement, messages sort by descending `priority`, then payload order
72. **Notices sorted by priority** _[§5.3](product-panel-spec.md#53-payment-plan-banner-rule-authoritative)_: `panelNotices[]` MUST be sorted by descending `priority`; default priority is 0

### Variant Styling

73. **Variant values** _[§5.7](product-panel-spec.md#57-variant--placement)_: `variant` SHOULD be one of: `"neutral"`, `"info"`, `"warning"`, `"error"`
74. **Variant is cosmetic** _[§7.5](product-panel-spec.md#75-invariants--guardrails-remember)_: Variant affects styling only; it never alters purchasability or CTAs

---

## Gating & Security Rules

### Zero-Leak Default

75. **Hidden items hint only** _[§9.1](product-panel-spec.md#91-normative)_: `context.gatingSummary.hasHiddenGatedItems` is the ONLY allowed hint about omitted items
76. **Boolean hint only** _[§9.1](product-panel-spec.md#91-normative)_: The hint is boolean; client MUST NOT infer counts, names, or prices of hidden items
77. **No row placeholders** _[§9.1](product-panel-spec.md#91-normative)_: Client MUST NOT render placeholders for omitted items
78. **No logging codes** _[§13 Security](product-panel-spec.md#security-guardrails)_: Client MUST NOT log access codes, tokens, or any derived info about hidden SKUs

### Access Code Flow

79. **AccessCodeCTA derivation** _[§5.3a](product-panel-spec.md#53a-panel-level-cta-derivation-panelactionbutton--accesscodecta), [§9.1](product-panel-spec.md#91-normative)_: Show access code UI when `gatingSummary.hasHiddenGatedItems === true` OR any visible item is locked
80. **Panel-level CTA** _[§5.3a](product-panel-spec.md#53a-panel-level-cta-derivation-panelactionbutton--accesscodecta)_: Access code input is panel-level, not per-row
81. **Server validates unlock** _[§9.1](product-panel-spec.md#91-normative)_: On code submission, server validates and returns refreshed payload with unlocked items or error notice
82. **No local unlock** _[§8.3](product-panel-spec.md#83-interaction--data-refresh-authoritative-loop)_: Client MUST NOT flip `gating.satisfied` locally; wait for server response

### Post-Unlock Confirmation

83. **Unlocked but sold out** _[§3.3 UX nuances](product-panel-spec.md#33-gating-with-listingpolicy)_: When unlocked item has `supply.status="none"`, it MUST still appear (disabled) to confirm code worked
84. **No dead-end feeling** _[§3.3 UX nuances](product-panel-spec.md#33-gating-with-listingpolicy)_: For omitted-then-unlocked items, show confirmation (panel notice or newly visible rows)

### Public Sold Out + Hidden Gated

85. **Prompt for code, not sold out** _[§3.3 UX nuances](product-panel-spec.md#33-gating-with-listingpolicy)_: When all visible items are sold out BUT `hasHiddenGatedItems === true`, client MUST show access code prompt, NOT "Event Sold Out" final state
86. **Prevents misleading users** _[§3.3 UX nuances](product-panel-spec.md#33-gating-with-listingpolicy)_: This rule prevents users thinking nothing is available when gated inventory exists

---

## Relations & Add-ons Rules

### Structure

87. **Add-on is relationship** _[§10.1](product-panel-spec.md#101-normative-contract-you-can-validate)_: Add-on is NOT a product type; it's any product with `relations.parentProductIds[]` populated
88. **Parent IDs reference products** _[§10.1](product-panel-spec.md#101-normative-contract-you-can-validate)_: `parentProductIds[]` values MUST match `product.id` fields in the panel
89. **Match behavior values** _[§10.1](product-panel-spec.md#101-normative-contract-you-can-validate)_: `matchBehavior` MUST be either `"per_ticket"` or `"per_order"`
90. **Default match behavior** _[§10.1](product-panel-spec.md#101-normative-contract-you-can-validate)_: If `parentProductIds[]` exists but `matchBehavior` is omitted, treat as `"per_order"`

### Server Responsibilities

91. **Server computes add-on max** _[§10.1](product-panel-spec.md#101-normative-contract-you-can-validate)_: Server MUST recompute `maxSelectable` for add-ons based on parent selection and `matchBehavior`
92. **Parent absent = disabled** _[§10.1](product-panel-spec.md#101-normative-contract-you-can-validate)_: When no parent selected, server SHOULD send `maxSelectable=0` for dependent add-ons
93. **Multi-parent sum** _[§10.1](product-panel-spec.md#101-normative-contract-you-can-validate)_: For multiple parents with `"per_ticket"`, server MUST reflect sum of all selected parents in `maxSelectable`

### Client Responsibilities

94. **Never invent caps** _[§10.1](product-panel-spec.md#101-normative-contract-you-can-validate)_: Client MUST NOT compute add-on limits locally; only enforce `commercial.maxSelectable`
95. **Refresh on parent change** _[§10.1](product-panel-spec.md#101-normative-contract-you-can-validate)_: Client MUST request server refresh whenever parent selection changes
96. **Clamp down on refresh** _[§10.1](product-panel-spec.md#101-normative-contract-you-can-validate)_: If refresh lowers `maxSelectable` below current selection, client MUST clamp selection down immediately
97. **No parent leakage** _[§10.1](product-panel-spec.md#101-normative-contract-you-can-validate)_: If all parents are omitted (gated), the add-on MUST also be omitted or have `maxSelectable=0`

---

## Context & Configuration Rules

### Order Rules

98. **OrderRules required** _[§4.1](product-panel-spec.md#41-context-serverauthored-panel-configuration--copy)_: `context.orderRules` MUST be present
99. **OrderRules fields** _[§4.1](product-panel-spec.md#41-context-serverauthored-panel-configuration--copy)_: MUST include `types`, `typesPerOrder`, `ticketsPerType`, `minSelectedTypes`, `minTicketsPerSelectedType`
100.  **Enum values** _[§4.1](product-panel-spec.md#41-context-serverauthored-panel-configuration--copy)_: `types`, `typesPerOrder`, `ticketsPerType` MUST be `"single"` or `"multiple"`
101.  **Minimums are integers** _[§4.1](product-panel-spec.md#41-context-serverauthored-panel-configuration--copy)_: `minSelectedTypes` and `minTicketsPerSelectedType` MUST be non-negative integers

### Preferences

102. **Prefs are UI hints** _[§5.1](product-panel-spec.md#51-contexteffectiveprefs-ui-hints-only-never-business-logic)_: `effectivePrefs` fields control presentation, never business logic
103. **Unknown prefs invalid** _[§5.1](product-panel-spec.md#51-contexteffectiveprefs-ui-hints-only-never-business-logic)_: Unknown fields in `effectivePrefs` are validation errors (strict validation)
104. **ShowTypeListWhenSoldOut** _[§5.1](product-panel-spec.md#51-contexteffectiveprefs-ui-hints-only-never-business-logic)_: When `true`, keep sold-out rows visible; when `false`, collapse list
105. **No auto-banners from prefs** _[§5.3](product-panel-spec.md#53-payment-plan-banner-rule-authoritative)_: `displayPaymentPlanAvailable` alone MUST NOT render a banner; requires `panelNotices[]` entry
106. **Threshold is informational** _[§5.1](product-panel-spec.md#51-contexteffectiveprefs-ui-hints-only-never-business-logic)_: `displayRemainingThreshold` tells client what threshold server uses; client does NOT perform comparison

### Panel Notices

107. **No notice auto-generation** _[§5.2](product-panel-spec.md#52-copy-channels-single-source-at-each-level)_: Client MUST NOT invent panel notices based on item states
108. **Empty notices allowed** _[§5.2](product-panel-spec.md#52-copy-channels-single-source-at-each-level)_: `panelNotices: []` is valid; client MUST NOT show default banners
109. **Notice actions are secondary** _[§5.3](product-panel-spec.md#53-payment-plan-banner-rule-authoritative)_: Notice `action` is for supplementary links/drawers, NOT primary CTAs (waitlist/access code)

### Copy Templates

110. **Templates are optional** _[§5.4](product-panel-spec.md#54-templates--interpolation)_: `copyTemplates[]` is optional; messages MAY provide `text` directly
111. **Client copy for validation** _[§5.5](product-panel-spec.md#55-clienttriggered-copy-contextclientcopy)_: `clientCopy` provides strings for client-triggered validation errors (min/max selection)
112. **No copy invention** _[§2](product-panel-spec.md#why-no-hardcoded-copy)_: Client MUST use provided copy verbatim; no local wording

---

## Payment Plan Rules

113. **Panel-level only** _[§5.3](product-panel-spec.md#53-payment-plan-banner-rule-authoritative)_: Payment plans surface via panel notice ONLY; NEVER per-row badges
114. **Notice required** _[§5.3](product-panel-spec.md#53-payment-plan-banner-rule-authoritative)_: Payment plan banner MUST be rendered only when server sends `panelNotices[]` entry with `code: "payment_plan_available"`
115. **Pref doesn't render** _[§5.3](product-panel-spec.md#53-payment-plan-banner-rule-authoritative)_: `displayPaymentPlanAvailable=true` alone does NOT trigger a banner

---

## Section Rules

116. **Sections required** _[§4.2](product-panel-spec.md#42-sections-groupingnavigation)_: `sections[]` array MUST have at least one section
117. **Section fields** _[§4.2](product-panel-spec.md#42-sections-groupingnavigation)_: Each section MUST have `id`, `label`, and `order`
118. **Server controls sections** _[§4.2](product-panel-spec.md#42-sections-groupingnavigation)_: Server decides section IDs, labels, and order; client MUST NOT assume specific values
119. **Empty sections hidden** _[§4.2](product-panel-spec.md#42-sections-groupingnavigation)_: Sections with no assigned items MAY be hidden by client

---

## Root Contract Rules

120. **Four top-level keys** _[§4 Root object](product-panel-spec.md#root-object)_: Payload MUST have exactly: `context`, `sections`, `items`, `pricing`
121. **Strict validation** _[§4 Root object](product-panel-spec.md#root-object)_: Unknown top-level keys are INVALID (reject payload)
122. **Items may be empty** _[§4.3](product-panel-spec.md#43-items-the-list-of-purchasable--related-products)_: `items: []` is valid (no products available or all omitted due to gating)

---

## State Replacement Rules

123. **Replace, don't predict** _[§1 Real-time sync](product-panel-spec.md#realtime-synchronization)_: On new payload, client MUST replace derived state from new server facts; never predict transitions
124. **No local state flips** _[§8.3](product-panel-spec.md#83-interaction--data-refresh-authoritative-loop)_: Client MUST NOT locally flip boolean flags like `gating.satisfied` or `temporal.phase`
125. **Atoms re-derive** _[§1 Real-time sync](product-panel-spec.md#realtime-synchronization)_: When payload changes, atoms re-run derivation functions with new facts
126. **No back-calculation** _[§13](product-panel-spec.md#13-invariants--guardrails-what-the-client-must-not-do)_: Client MUST NOT back-calculate business state from UI state or time

---

## Validation & Schema Rules

127. **Zod schema authority** _[§14.1](product-panel-spec.md#141-normative--schema-architecture)_: All TypeScript types MUST be derived from Zod schemas via `z.infer<>`
128. **Strict mode root** _[§14.1](product-panel-spec.md#141-normative--schema-architecture)_: Root `PanelDataSchema` MUST use `.strict()` to reject unknown top-level fields
129. **Nested strictness** _[§14.10](product-panel-spec.md#1410-invariants--guardrails)_: Nested object schemas SHOULD use `.strict()` to catch unknown sub-fields
130. **Validate at boundary** _[§14.1](product-panel-spec.md#141-normative--schema-architecture)_: TanStack Query MUST validate all API responses with `PanelDataSchema`
131. **Machine code format** _[§12](product-panel-spec.md#12-reason-codes-registry-machine-codes-copy-via-messagestemplates)_: Machine codes MUST be `snake_case` matching regex `^[a-z][a-z0-9_]*$`
132. **No manual types** _[§14.1](product-panel-spec.md#141-normative--schema-architecture)_: Manual TypeScript types that duplicate schema structure are FORBIDDEN

---

## Reason Code Rules

133. **Codes are machine facts** _[§12](product-panel-spec.md#12-reason-codes-registry-machine-codes-copy-via-messagestemplates)_: Reason codes in `reasons[]` are NOT user-facing text
134. **No code translation** _[§12](product-panel-spec.md#12-reason-codes-registry-machine-codes-copy-via-messagestemplates)_: Client MUST NOT translate reason codes to strings for display
135. **Codes in snake_case** _[§12](product-panel-spec.md#12-reason-codes-registry-machine-codes-copy-via-messagestemplates)_: All codes MUST be snake_case (e.g., `sold_out`, `requires_code`)
136. **One cause, one code** _[§12](product-panel-spec.md#12-reason-codes-registry-machine-codes-copy-via-messagestemplates)_: Each cause appears once in its axis `reasons[]`; display via messages

---

## Panel-Level CTA Rules

### PanelActionButton (main button)

137. **Three kinds** _[§5.3a](product-panel-spec.md#53a-panel-level-cta-derivation-panelactionbutton--accesscodecta)_: PanelActionButton `kind` is `"checkout"`, `"waitlist"`, or `"notify_me"` with `enabled` boolean
138. **Checkout default** _[§5.3a](product-panel-spec.md#53a-panel-level-cta-derivation-panelactionbutton--accesscodecta)_: Default kind is `"checkout"` when any item is purchasable and `maxSelectable > 0`
139. **Waitlist/Notify conditions** _[§5.3a](product-panel-spec.md#53a-panel-level-cta-derivation-panelactionbutton--accesscodecta)_: Kind becomes `"waitlist"` when no items purchasable but at least one visible eligible item has `demand.kind="waitlist"`. Becomes `"notify_me"` when any item has `temporal.phase="before"` AND `demand.kind="notify_me"`. Gate precedence applies.
140. **Disabled when invalid** _[§5.3a](product-panel-spec.md#53a-panel-level-cta-derivation-panelactionbutton--accesscodecta)_: `enabled=false` when selection invalid (doesn't meet `orderRules`) or nothing purchasable with no waitlist/notify
141. **Respects gating** _[§5.3a](product-panel-spec.md#53a-panel-level-cta-derivation-panelactionbutton--accesscodecta)_: Locked items with waitlist/notify do NOT trigger panel waitlist/notify state until unlocked
142. **Labels atom-driven** _[§5.3a](product-panel-spec.md#53a-panel-level-cta-derivation-panelactionbutton--accesscodecta)_: PanelActionButton labels come from atom logic with `clientCopy` overrides; never hardcoded

### AccessCodeCTA

143. **Derived from state** _[§5.3a](product-panel-spec.md#53a-panel-level-cta-derivation-panelactionbutton--accesscodecta)_: AccessCodeCTA is derived from panel/item state, not configured via notices
144. **Show when hidden or locked** _[§5.3a](product-panel-spec.md#53a-panel-level-cta-derivation-panelactionbutton--accesscodecta)_: Appears when `hasHiddenGatedItems=true` OR any visible item is locked
145. **Not a notice** _[§5.3a](product-panel-spec.md#53a-panel-level-cta-derivation-panelactionbutton--accesscodecta)_: AccessCodeCTA is a persistent UI element, NOT a `panelNotice`

---

## Timestamp & Time Rules

146. **No time zone math** _[§3.1](product-panel-spec.md#31-temporal)_: Client MUST NOT perform timezone, DST, or time window calculations
147. **Timestamps for display only** _[§3.1](product-panel-spec.md#31-temporal)_: ISO timestamps in `currentWindow`/`nextWindow` are for locale formatting only
148. **No countdown computation** _[§3.1](product-panel-spec.md#31-temporal)_: If countdown UI needed, server MUST send refreshed text or trigger re-fetch
149. **Pre-formatted preferred** _[§3.1](product-panel-spec.md#31-temporal)_: Server SHOULD send pre-formatted date/time strings when possible

---

## Fulfillment Rules

150. **Never gates purchase** _[§6.4](product-panel-spec.md#64-invariants--guardrails-read-before-coding)_: Fulfillment methods MUST NOT change purchasability
151. **Icons and notes only** _[§6.4](product-panel-spec.md#64-invariants--guardrails-read-before-coding)_: Fulfillment drives only icons, badges, and tooltips
152. **Special requirements via messages** _[§6.4](product-panel-spec.md#64-invariants--guardrails-read-before-coding)_: Age restrictions, ID requirements, redemption conditions conveyed via `state.messages[]` or badge hovercards
153. **Unknown methods invalid** _[§6.1](product-panel-spec.md#61-normative-contract-you-can-validate)_: Unknown fulfillment method values are validation errors

---

## Currency & Money Rules

154. **Dinero architecture** _[§11](product-panel-spec.md#11-pricing-footer-server-math-inclusions-flags)_: All money operations use Dinero.js V2; nothing happens to money outside Dinero utils
155. **Transport as snapshots** _[§4.4](product-panel-spec.md#44-pricing-servercomputed-money-summary)_: All monetary values transported as Dinero snapshots
156. **Display formatting only** _[§11](product-panel-spec.md#11-pricing-footer-server-math-inclusions-flags)_: Client MAY format for display but MUST NOT perform arithmetic
157. **No floating point** _[§11](product-panel-spec.md#11-pricing-footer-server-math-inclusions-flags)_: Never use plain numbers for money; always Dinero snapshots
158. **Currency code consistency** _[§11](product-panel-spec.md#11-pricing-footer-server-math-inclusions-flags)_: Validate currency consistency on every payload receipt

---

## Error Handling Rules

159. **Validation errors fail fast** _[§14.10](product-panel-spec.md#1410-invariants--guardrails)_: Schema validation errors at boundary, not deep in component trees
160. **Currency mismatch fatal** _[§11](product-panel-spec.md#11-pricing-footer-server-math-inclusions-flags)_: Currency mismatch causes validation failure; payload rejected
161. **Unknown fields rejected** _[§14.1](product-panel-spec.md#141-normative--schema-architecture)_: Due to `.strict()` validation, unknown fields cause validation errors
162. **No silent defaults** _[§14 Architecture Context](product-panel-spec.md#architecture-context-tanstack-start--validation-strategy)_: Server bugs (missing required fields) fail validation rather than silently using defaults

---

## Testing & Fixtures Rules

163. **Six core fixtures** _[Appendix I](product-panel-spec.md#i-fixture-set-starter-pack)_: Create fixtures for: available, sold out + waitlist, visible locked, omit until unlock, public sold out + hidden gated, payment plan
164. **Test all axes** _[§3](product-panel-spec.md#3-state-model-orthogonal-axes)_: Cover all combinations of temporal, supply, gating, demand states
165. **Test gating precedence** _[§3.5](product-panel-spec.md#35-crossaxis-invariants-quick)_: Verify locked items don't show demand CTAs
166. **Test clamp authority** _[§3.2](product-panel-spec.md#32-supply)_: Verify maxSelectable overrides all other numeric fields
167. **Test message omission** _[§7.7](product-panel-spec.md#77-edge-cases--tests-acceptance-checks)_: Verify messages without text or templates are omitted
168. **Test currency validation** _[§14.9](product-panel-spec.md#149-tests-schema-validation)_: Verify mixed currency payloads are rejected

---

## Security & Privacy Rules

169. **No code logging** _[§13 Security](product-panel-spec.md#security-guardrails)_: MUST NOT log access codes or tokens in analytics, errors, or URLs
170. **No token persistence** _[§13 Security](product-panel-spec.md#security-guardrails)_: MUST NOT persist gating tokens beyond server TTL or across accounts
171. **Server retries only** _[§13 Security](product-panel-spec.md#security-guardrails)_: All unlock attempts go to server; client performs no retries beyond UX
172. **No price exposure** _[§13 Security](product-panel-spec.md#security-guardrails)_: MUST NOT display price for locked rows or log it
173. **No caching omitted** _[§13 Security](product-panel-spec.md#security-guardrails)_: MUST NOT cache omitted items or speculate their presence

---

## Performance & Refresh Rules

174. **Debounce quantity changes** _[§11](product-panel-spec.md#11-pricing-footer-server-math-inclusions-flags)_: When quantity changes, debounce 300ms before server refresh
175. **Previous state during refresh** _[§11 State transitions](product-panel-spec.md#state-transitions-loading--errors)_: Keep displaying previous pricing state during refresh; no empty state flash
176. **Retry on error** _[§11 State transitions](product-panel-spec.md#state-transitions-loading--errors)_: On pricing fetch error, retry automatically after 3s; show retry button after 3 attempts
177. **No blocking on stale** _[§11 State transitions](product-panel-spec.md#state-transitions-loading--errors)_: MUST NOT block checkout if pricing stale <30s (server will revalidate)

---

## Accessibility Rules

> _Note: These are org-wide a11y standards; the spec itself has limited normative a11y constraints. See [Ultracite rules](../../AGENTS.md) for comprehensive a11y requirements._

178. **Field labels required** _[Org a11y policy]_: All form fields MUST have accessible labels
179. **Error announcements** _[Org a11y policy]_: Validation errors MUST be announced with `role="alert"`
180. **No positive tabIndex** _[Org a11y policy]_: MUST NOT use positive integers for tabIndex
181. **Semantic elements** _[Org a11y policy]_: Use semantic HTML elements instead of role attributes when possible
182. **Alt text for images** _[Org a11y policy]_: All images requiring alt text MUST have meaningful descriptions

---

## Integration Rules (TanStack Stack)

183. **Query key structure** _[§14.3](product-panel-spec.md#143-tanstack-query-integration)_: Include filters/selection in query key for stable invalidation
184. **Form validation on submit** _[§14.5](product-panel-spec.md#145-tanstack-form-integration)_: Validate with TanStack Form on submit, not onChange for performance
185. **Atoms don't re-validate** _[§14.1](product-panel-spec.md#141-normative--schema-architecture)_: Jotai atoms use inferred types but don't re-validate (trust boundary validation)
186. **Custom error map** _[§14.6](product-panel-spec.md#146-validation-patterns--error-handling)_: Use custom error map for user-friendly messages, not technical Zod errors

---

## Prohibited Actions (What Client MUST NOT Do)

187. **No schedule math** _[§13](product-panel-spec.md#13-invariants--guardrails-what-the-client-must-not-do)_: MUST NOT compute countdowns or sale windows
188. **No availability math** _[§13](product-panel-spec.md#13-invariants--guardrails-what-the-client-must-not-do)_: MUST NOT infer "sold out" or "low stock" from numbers
189. **No price math** _[§13](product-panel-spec.md#13-invariants--guardrails-what-the-client-must-not-do)_: MUST NOT compute totals, fees, taxes, discounts, installments
190. **No clamp math** _[§13](product-panel-spec.md#13-invariants--guardrails-what-the-client-must-not-do)_: MUST NOT derive limits from counts or limits fields
191. **No gate logic** _[§13](product-panel-spec.md#13-invariants--guardrails-what-the-client-must-not-do)_: MUST NOT validate access codes or apply rate limits
192. **No SKU inference** _[§13](product-panel-spec.md#13-invariants--guardrails-what-the-client-must-not-do)_: MUST NOT guess names/counts/prices for omitted items
193. **No ad-hoc text** _[§13](product-panel-spec.md#13-invariants--guardrails-what-the-client-must-not-do)_: MUST NOT render text not from `panelNotices[]`, `messages[]`, or templates
194. **No approval flows** _[§13](product-panel-spec.md#13-invariants--guardrails-what-the-client-must-not-do)_: MUST NOT invent "Request Access" or approval CTAs

---

## Best Practices

195. **Fail fast on validation** _[§14.10](product-panel-spec.md#1410-invariants--guardrails)_: Reject invalid payloads immediately; don't render partial/broken UI
196. **Log validation errors** _[§14.6](product-panel-spec.md#146-validation-patterns--error-handling)_: In development, log full validation errors with `error.format()`
197. **Generic errors in production** _[§14.6](product-panel-spec.md#146-validation-patterns--error-handling)_: Show generic error to user; log details to error tracking
198. **Never expose raw Zod** _[§14.10](product-panel-spec.md#1410-invariants--guardrails)_: Use custom error map; don't show technical Zod errors to users
199. **Atomic deploys** _[§14 Architecture Context](product-panel-spec.md#architecture-context-tanstack-start--validation-strategy)_: Server + client deploy together; no version skew concerns
200. **Strict enums** _[§14 Architecture Context](product-panel-spec.md#architecture-context-tanstack-start--validation-strategy)_: Use strict enums; coordinated deploys make this safe
201. **Required fields** _[§14 Architecture Context](product-panel-spec.md#architecture-context-tanstack-start--validation-strategy)_: Make business fields required; fail if missing rather than hide bugs with defaults
202. **SSR/hydration consistency** _[§14 Architecture Context](product-panel-spec.md#architecture-context-tanstack-start--validation-strategy)_: Same schemas validate server and client to prevent hydration mismatches

---

## Known Spec Conflicts to Resolve

> _The following conflicts exist in the source spec and need resolution:_

**Pricing line item codes policy:**

- §11 normative text states: "Unknown codes MUST be rendered as provided (label + amount)" _(line 4558)_
- §11 developer checklist states: "Unknown line item codes are invalid (strict enum)" _(line 4783)_
- §14.2 Zod schema enforces: `z.enum(["TICKETS", "FEES", "TAX", "DISCOUNT", "TOTAL"])` _(line 5690)_

**Resolution**: The schema implementation (strict enum) takes precedence. Rule 60 aligns with §14.2. The spec's §11 normative text should be updated to match the schema.

---

**Total Rules:** 202 (198 original + 2 new rules + 2 renumbered)

**Last Updated:** Enhanced with spec links and missing rules (Jan 2025)
