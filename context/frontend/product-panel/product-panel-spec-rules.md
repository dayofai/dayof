# Product Panel Rules Audit Checklist

**Extracted from:** Product Panel Spec 0.4  
**Purpose:** Human-readable ordered list of all codified rules for implementation auditing

---

## Product Structure & Identity

1. **Product ID uniqueness**: Each `product.id` MUST be unique across the entire payload
2. **Product type validation**: `product.type` MUST be one of: `"ticket"`, `"digital"`, or `"physical"`
3. **Product name required**: Every product MUST have a non-empty `name` field
4. **No price in product**: Price MUST NOT exist in `product` or `variant` objects; it lives only in `commercial.price`
5. **Variant flexibility**: `variant` object MAY be empty `{}` for general admission tickets; when present, it MAY include `id`, `name`, and `attributes`
6. **Fulfillment methods enum**: When present, `fulfillment.methods` MUST only contain recognized values: `"eticket"`, `"apple_pass"`, `"will_call"`, `"physical_mail"`, `"shipping"`, `"nfc"`
7. **Fulfillment is display-only**: Fulfillment methods MUST NOT affect purchasability; they only affect icons/tooltips

---

## Display & Presentation Rules

### Row Presentation

8. **Locked presentation condition**: A row is `"locked"` if and only if `gating.required === true` AND `gating.satisfied === false` AND `gating.listingPolicy === "visible_locked"`
9. **Normal presentation default**: All other rows have `"normal"` presentation
10. **Omitted items have no presentation**: Items with `listingPolicy="omit_until_unlocked"` and unsatisfied gates MUST NOT appear in `items[]` and thus have no presentation state

### Price Display

11. **Price shown only when purchasable**: Price is displayed (`priceUI="shown"`) ONLY when the item is purchasable (except when locked)
12. **Price masked when locked**: When `presentation === "locked"`, price MUST be masked (`priceUI="masked"`), not shown
13. **Price hidden when not purchasable**: When not purchasable and not locked, price MUST be hidden (`priceUI="hidden"`)
14. **No price tease**: Showing price for non-purchasable items is FORBIDDEN (prevents psychological tease/anchor effects)

### Quantity Controls

15. **Quantity hidden when locked**: Locked rows MUST hide quantity controls entirely
16. **Quantity hidden when not purchasable**: Quantity UI is hidden unless `presentation === "normal"` AND `isPurchasable === true` AND `maxSelectable > 0`
17. **Select vs stepper**: When shown, quantity UI uses `"select"` for `maxSelectable === 1`, `"stepper"` for `maxSelectable > 1`

### Badges & Visual Hints

18. **Product-level badges only**: Badges in `display.badges[]` are product-specific, not section-level
19. **Low remaining flag**: `display.showLowRemaining` is a boolean presentation flag for urgency styling; the count comes from `supply.remaining`
20. **Section assignment**: Items assign themselves to sections via `display.sectionId`; if absent, client SHOULD render in first section by order

---

## State Axes (Business Logic)

### Temporal Axis

21. **Temporal phase authority**: `temporal.phase` MUST be one of: `"before"`, `"during"`, or `"after"`
22. **Server decides phase**: The server MUST compute phase; the client MUST NOT compute from timestamps
23. **No client countdown math**: Clients MUST NOT compute countdowns or sale windows from timestamps
24. **Timestamp metadata only**: `currentWindow` and `nextWindow` timestamps are for display metadata only, not client computation

### Supply Axis

25. **Supply status values**: `supply.status` MUST be one of: `"available"`, `"none"`, or `"unknown"`
26. **Supply remaining is optional**: `supply.remaining` MAY be present but MUST NOT drive business rules
27. **Sold out signal**: When sold out, `supply.status === "none"` and reasons SHOULD include `"sold_out"`
28. **No inference from counts**: Client MUST NOT infer "sold out" from `remaining === 0`; only `status` governs

### Gating Axis

29. **Gating fields required**: Gating MUST include `required`, `satisfied`, `listingPolicy`, and `reasons[]`
30. **Listing policy values**: `listingPolicy` MUST be either `"omit_until_unlocked"` (default) or `"visible_locked"`
31. **Omit enforcement**: When `required=true` AND `satisfied=false` AND `listingPolicy="omit_until_unlocked"`, the item MUST NOT be in `items[]`
32. **Visible locked enforcement**: When `listingPolicy="visible_locked"` and gate unsatisfied, item MUST be sent but locked (price masked, quantity hidden)
33. **Server-side validation only**: Access code validation MUST occur server-side; client MUST NOT validate or rate-limit
34. **Requirements metadata**: `gating.requirements[]` is explanatory metadata only; `gating.satisfied` is authoritative for purchasability

### Demand Axis

35. **Demand kind values**: `demand.kind` MUST be one of: `"none"`, `"waitlist"`, or `"notify_me"`
36. **Gating precedence over demand**: If `gating.required && !satisfied`, demand CTAs (waitlist/notify) MUST NOT be shown
37. **No demand leakage**: Locked items MUST NOT surface demand CTAs until unlocked

---

## Purchasability Rules

38. **Purchasability definition**: An item is purchasable if and only if: `temporal.phase === "during"` AND `supply.status === "available"` AND (`!gating.required` OR `gating.satisfied`) AND `commercial.maxSelectable > 0`
39. **All conditions required**: All four conditions must be true for purchasability; any single failure makes the item non-purchasable

---

## CTA (Call-to-Action) Rules

40. **Locked rows have no CTA**: When `presentation === "locked"`, CTA MUST be `"none"`
41. **Purchasable shows quantity**: When purchasable, CTA is `"quantity"` (enabled only if `maxSelectable > 0`)
42. **Sold out + waitlist**: When `supply.status === "none"` AND `demand.kind === "waitlist"`, CTA is `"waitlist"`
43. **Before sale + notify**: When `temporal.phase === "before"` AND `demand.kind === "notify_me"`, CTA is `"notify"`
44. **Default to none**: If no conditions match, CTA is `"none"`
45. **CTA label from payload**: CTA button labels MUST come from payload (`messages[]` with `placement: "row.cta_label"` or templates); client MUST NOT hardcode strings
46. **No approval CTAs**: There is NO "Request Access" or approval-related CTA in this contract

---

## Commercial & Pricing Rules

### Price Structure

47. **Dinero snapshots required**: All money MUST be Dinero.js V2 snapshots with `{ amount, currency, scale }`
48. **Currency consistency**: All items' `commercial.price.currency.code` MUST match `pricing.currency.code`
49. **Single currency per panel**: Mixed currency panels are INVALID

### Max Selectable (The Single Clamp)

50. **MaxSelectable is authoritative**: `commercial.maxSelectable` is the ONLY value that constrains quantity UI
51. **Server computes maxSelectable**: Server MUST recompute `maxSelectable` from stock, holds, limits, fraud rules, etc.
52. **Zero means not selectable**: When `maxSelectable === 0`, the item cannot be selected (sold out, locked, or unavailable)
53. **Client enforces only maxSelectable**: Client MUST NOT derive limits from `supply.remaining`, `limits.perOrder`, or `limits.perUser`
54. **Limits are informational**: `limits.perOrder` and `limits.perUser` are for display copy only ("Max 4 per order"), not UI enforcement

### Fees & Pricing Footer

55. **FeesIncluded is presentation hint**: `feesIncluded` affects copy only ("+ fees" vs "incl. fees"); it does NOT change math
56. **Server computes all pricing**: The `pricing` object is 100% server-computed; client MUST NOT perform money arithmetic
57. **Pricing always present**: `pricing` is always included; if nothing selected, send `{ currency, lineItems: [] }`
58. **LineItems render in order**: Client MUST render `pricing.lineItems[]` in the exact order provided; no reordering
59. **No local totals**: Client MUST NOT compute totals, taxes, fees, or discounts; render only what server provides

---

## Messages & Copy Rules

### Message Channels

60. **Single row text channel**: Row-level text comes ONLY from `state.messages[]`
61. **Single panel banner channel**: Panel-level banners come ONLY from `context.panelNotices[]`
62. **No client-invented text**: Client MUST NOT synthesize text from machine codes or hardcoded strings
63. **Message structure required**: Each message MUST have `code`, `placement`, and optionally `text`, `params`, `variant`, `priority`
64. **Placement is required**: If `placement` is omitted or invalid, client MUST omit that message

### Message Resolution

65. **Text takes precedence**: If message has `text`, render it verbatim; no templating
66. **Template fallback**: If no `text`, find `copyTemplates[key === code]` and interpolate with `params`
67. **Omit if neither**: If neither `text` nor matching template exists, omit the message
68. **Unknown placeholders to empty**: When interpolating, unknown `{placeholder}` MUST resolve to `""`, not literal token

### Priority & Sorting

69. **Messages sorted by priority**: Within same placement, messages sort by descending `priority`, then payload order
70. **Notices sorted by priority**: `panelNotices[]` MUST be sorted by descending `priority`; default priority is 0

### Variant Styling

71. **Variant values**: `variant` SHOULD be one of: `"neutral"`, `"info"`, `"warning"`, `"error"`
72. **Variant is cosmetic**: Variant affects styling only; it never alters purchasability or CTAs

---

## Gating & Security Rules

### Zero-Leak Default

73. **Hidden items hint only**: `context.gatingSummary.hasHiddenGatedItems` is the ONLY allowed hint about omitted items
74. **Boolean hint only**: The hint is boolean; client MUST NOT infer counts, names, or prices of hidden items
75. **No row placeholders**: Client MUST NOT render placeholders for omitted items
76. **No logging codes**: Client MUST NOT log access codes, tokens, or any derived info about hidden SKUs

### Access Code Flow

77. **AccessCodeCTA derivation**: Show access code UI when `gatingSummary.hasHiddenGatedItems === true` OR any visible item is locked
78. **Panel-level CTA**: Access code input is panel-level, not per-row
79. **Server validates unlock**: On code submission, server validates and returns refreshed payload with unlocked items or error notice
80. **No local unlock**: Client MUST NOT flip `gating.satisfied` locally; wait for server response

### Post-Unlock Confirmation

81. **Unlocked but sold out**: When unlocked item has `supply.status="none"`, it MUST still appear (disabled) to confirm code worked
82. **No dead-end feeling**: For omitted-then-unlocked items, show confirmation (panel notice or newly visible rows)

### Public Sold Out + Hidden Gated

83. **Prompt for code, not sold out**: When all visible items are sold out BUT `hasHiddenGatedItems === true`, client MUST show access code prompt, NOT "Event Sold Out" final state
84. **Prevents misleading users**: This rule prevents users thinking nothing is available when gated inventory exists

---

## Relations & Add-ons Rules

### Structure

85. **Add-on is relationship**: Add-on is NOT a product type; it's any product with `relations.parentProductIds[]` populated
86. **Parent IDs reference products**: `parentProductIds[]` values MUST match `product.id` fields in the panel
87. **Match behavior values**: `matchBehavior` MUST be either `"per_ticket"` or `"per_order"`
88. **Default match behavior**: If `parentProductIds[]` exists but `matchBehavior` is omitted, treat as `"per_order"`

### Server Responsibilities

89. **Server computes add-on max**: Server MUST recompute `maxSelectable` for add-ons based on parent selection and `matchBehavior`
90. **Parent absent = disabled**: When no parent selected, server SHOULD send `maxSelectable=0` for dependent add-ons
91. **Multi-parent sum**: For multiple parents with `"per_ticket"`, server MUST reflect sum of all selected parents in `maxSelectable`

### Client Responsibilities

92. **Never invent caps**: Client MUST NOT compute add-on limits locally; only enforce `commercial.maxSelectable`
93. **Refresh on parent change**: Client MUST request server refresh whenever parent selection changes
94. **Clamp down on refresh**: If refresh lowers `maxSelectable` below current selection, client MUST clamp selection down immediately
95. **No parent leakage**: If all parents are omitted (gated), the add-on MUST also be omitted or have `maxSelectable=0`

---

## Context & Configuration Rules

### Order Rules

96. **OrderRules required**: `context.orderRules` MUST be present
97. **OrderRules fields**: MUST include `types`, `typesPerOrder`, `ticketsPerType`, `minSelectedTypes`, `minTicketsPerSelectedType`
98. **Enum values**: `types`, `typesPerOrder`, `ticketsPerType` MUST be `"single"` or `"multiple"`
99. **Minimums are integers**: `minSelectedTypes` and `minTicketsPerSelectedType` MUST be non-negative integers

### Preferences

100. **Prefs are UI hints**: `effectivePrefs` fields control presentation, never business logic
101. **ShowTypeListWhenSoldOut**: When `true`, keep sold-out rows visible; when `false`, collapse list
102. **No auto-banners from prefs**: `displayPaymentPlanAvailable` alone MUST NOT render a banner; requires `panelNotices[]` entry
103. **Threshold is informational**: `displayRemainingThreshold` tells client what threshold server uses; client does NOT perform comparison

### Panel Notices

104. **No notice auto-generation**: Client MUST NOT invent panel notices based on item states
105. **Empty notices allowed**: `panelNotices: []` is valid; client MUST NOT show default banners
106. **Notice actions are secondary**: Notice `action` is for supplementary links/drawers, NOT primary CTAs (waitlist/access code)

### Copy Templates

107. **Templates are optional**: `copyTemplates[]` is optional; messages MAY provide `text` directly
108. **Client copy for validation**: `clientCopy` provides strings for client-triggered validation errors (min/max selection)
109. **No copy invention**: Client MUST use provided copy verbatim; no local wording

---

## Payment Plan Rules

110. **Panel-level only**: Payment plans surface via panel notice ONLY; NEVER per-row badges
111. **Notice required**: Payment plan banner MUST be rendered only when server sends `panelNotices[]` entry with `code: "payment_plan_available"`
112. **Pref doesn't render**: `displayPaymentPlanAvailable=true` alone does NOT trigger a banner

---

## Section Rules

113. **Sections required**: `sections[]` array MUST have at least one section
114. **Section fields**: Each section MUST have `id`, `label`, and `order`
115. **Server controls sections**: Server decides section IDs, labels, and order; client MUST NOT assume specific values
116. **Empty sections hidden**: Sections with no assigned items MAY be hidden by client

---

## Root Contract Rules

117. **Four top-level keys**: Payload MUST have exactly: `context`, `sections`, `items`, `pricing`
118. **Strict validation**: Unknown top-level keys are INVALID (reject payload)
119. **Items may be empty**: `items: []` is valid (no products available or all omitted due to gating)

---

## State Replacement Rules

120. **Replace, don't predict**: On new payload, client MUST replace derived state from new server facts; never predict transitions
121. **No local state flips**: Client MUST NOT locally flip boolean flags like `gating.satisfied` or `temporal.phase`
122. **Atoms re-derive**: When payload changes, atoms re-run derivation functions with new facts
123. **No back-calculation**: Client MUST NOT back-calculate business state from UI state or time

---

## Validation & Schema Rules

124. **Zod schema authority**: All TypeScript types MUST be derived from Zod schemas via `z.infer<>`
125. **Strict mode**: Root `PanelDataSchema` MUST use `.strict()` to reject unknown fields
126. **Validate at boundary**: TanStack Query MUST validate all API responses with `PanelDataSchema`
127. **Machine code format**: Machine codes MUST be `snake_case` matching regex ``^[a-z][a-z0-9_]*$``
128. **No manual types**: Manual TypeScript types that duplicate schema structure are FORBIDDEN

---

## Reason Code Rules

129. **Codes are machine facts**: Reason codes in `reasons[]` are NOT user-facing text
130. **No code translation**: Client MUST NOT translate reason codes to strings for display
131. **Codes in snake_case**: All codes MUST be snake_case (e.g., `sold_out`, `requires_code`)
132. **One cause, one code**: Each cause appears once in its axis `reasons[]`; display via messages

---

## Panel-Level CTA Rules

### PanelActionButton (main button)

133. **Four states**: PanelActionButton states are `"continue"`, `"waitlist"`, `"notify"`, or `"disabled"` (see Spec §8.4).
134. **Continue default**: Default state is `"continue"` when items are purchasable and selection valid
135. **Waitlist/Notify conditions**: State becomes `"waitlist"` when **no items are purchasable** but at least one **visible** item has `demand.kind="waitlist"`. It becomes `"notify"` when **no items are purchasable** and at least one **visible** item has `demand.kind="notify_me"` (e.g., before the sale window). Gate precedence applies (see 137).
136. **Disabled when invalid**: State is `"disabled"` when selection invalid (doesn't meet `orderRules`) or nothing purchasable with no waitlist/notify
137. **Respects gating**: Locked items with waitlist/notify do NOT trigger panel waitlist/notify state until unlocked
138. **Labels from server**: PanelActionButton labels MUST come from server-provided copy (e.g., `context.clientCopy`)

### AccessCodeCTA

139. **Derived from state**: AccessCodeCTA is derived from panel/item state, not configured via notices
140. **Show when hidden or locked**: Appears when `hasHiddenGatedItems=true` OR any visible item is locked
141. **Not a notice**: AccessCodeCTA is a persistent UI element, NOT a `panelNotice`

---

## Timestamp & Time Rules

142. **No time zone math**: Client MUST NOT perform timezone, DST, or time window calculations
143. **Timestamps for display only**: ISO timestamps in `currentWindow`/`nextWindow` are for locale formatting only
144. **No countdown computation**: If countdown UI needed, server MUST send refreshed text or trigger re-fetch
145. **Pre-formatted preferred**: Server SHOULD send pre-formatted date/time strings when possible

---

## Fulfillment Rules

146. **Never gates purchase**: Fulfillment methods MUST NOT change purchasability
147. **Icons and notes only**: Fulfillment drives only icons, badges, and tooltips
148. **Special requirements via messages**: Age restrictions, ID requirements, redemption conditions conveyed via `state.messages[]` or badge hovercards
149. **Unknown methods invalid**: Unknown fulfillment method values are validation errors

---

## Currency & Money Rules

150. **Dinero architecture**: All money operations use Dinero.js V2; nothing happens to money outside Dinero utils
151. **Transport as snapshots**: All monetary values transported as Dinero snapshots
152. **Display formatting only**: Client MAY format for display but MUST NOT perform arithmetic
153. **No floating point**: Never use plain numbers for money; always Dinero snapshots
154. **Currency code consistency**: Validate currency consistency on every payload receipt

---

## Error Handling Rules

155. **Validation errors fail fast**: Schema validation errors at boundary, not deep in component trees
156. **Currency mismatch fatal**: Currency mismatch causes validation failure; payload rejected
157. **Unknown fields rejected**: Due to `.strict()` validation, unknown fields cause validation errors
158. **No silent defaults**: Server bugs (missing required fields) fail validation rather than silently using defaults

---

## Testing & Fixtures Rules

159. **Six core fixtures**: Create fixtures for: available, sold out + waitlist, visible locked, omit until unlock, public sold out + hidden gated, payment plan
160. **Test all axes**: Cover all combinations of temporal, supply, gating, demand states
161. **Test gating precedence**: Verify locked items don't show demand CTAs
162. **Test clamp authority**: Verify maxSelectable overrides all other numeric fields
163. **Test message omission**: Verify messages without text or templates are omitted
164. **Test currency validation**: Verify mixed currency payloads are rejected

---

## Security & Privacy Rules

165. **No code logging**: MUST NOT log access codes or tokens in analytics, errors, or URLs
166. **No token persistence**: MUST NOT persist gating tokens beyond server TTL or across accounts
167. **Server retries only**: All unlock attempts go to server; client performs no retries beyond UX
168. **No price exposure**: MUST NOT display price for locked rows or log it
169. **No caching omitted**: MUST NOT cache omitted items or speculate their presence

---

## Performance & Refresh Rules

170. **Debounce quantity changes**: When quantity changes, debounce 300ms before server refresh
171. **Previous state during refresh**: Keep displaying previous pricing state during refresh; no empty state flash
172. **Retry on error**: On pricing fetch error, retry automatically after 3s; show retry button after 3 attempts
173. **No blocking on stale**: MUST NOT block checkout if pricing stale <30s (server will revalidate)

---

## Accessibility Rules

174. **Field labels required**: All form fields MUST have accessible labels
175. **Error announcements**: Validation errors MUST be announced with `role="alert"`
176. **No positive tabIndex**: MUST NOT use positive integers for tabIndex
177. **Semantic elements**: Use semantic HTML elements instead of role attributes when possible
178. **Alt text for images**: All images requiring alt text MUST have meaningful descriptions

---

## Integration Rules (TanStack Stack)

179. **Query key structure**: Include filters/selection in query key for stable invalidation
180. **Form validation on submit**: Validate with TanStack Form on submit, not onChange for performance
181. **Atoms don't re-validate**: Jotai atoms use inferred types but don't re-validate (trust boundary validation)
182. **Custom error map**: Use custom error map for user-friendly messages, not technical Zod errors

---

## Prohibited Actions (What Client MUST NOT Do)

183. **No schedule math**: MUST NOT compute countdowns or sale windows
184. **No availability math**: MUST NOT infer "sold out" or "low stock" from numbers
185. **No price math**: MUST NOT compute totals, fees, taxes, discounts, installments
186. **No clamp math**: MUST NOT derive limits from counts or limits fields
187. **No gate logic**: MUST NOT validate access codes or apply rate limits
188. **No SKU inference**: MUST NOT guess names/counts/prices for omitted items
189. **No ad-hoc text**: MUST NOT render text not from `panelNotices[]`, `messages[]`, or templates
190. **No approval flows**: MUST NOT invent "Request Access" or approval CTAs

---

## Best Practices

191. **Fail fast on validation**: Reject invalid payloads immediately; don't render partial/broken UI
192. **Log validation errors**: In development, log full validation errors with `error.format()`
193. **Generic errors in production**: Show generic error to user; log details to error tracking
194. **Never expose raw Zod**: Use custom error map; don't show technical Zod errors to users
195. **Atomic deploys**: Server + client deploy together; no version skew concerns
196. **Strict enums**: Use strict enums; coordinated deploys make this safe
197. **Required fields**: Make business fields required; fail if missing rather than hide bugs with defaults
198. **SSR/hydration consistency**: Same schemas validate server and client to prevent hydration mismatches

---

**Total Rules:** 198

**Last Updated:** Based on Product Panel Spec 0.4
