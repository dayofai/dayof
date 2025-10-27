# Product Panel — Implementation Guide (Primary Reference)

**Status:** Build‑ready  
**Source of truth:** This guide operationalizes Product Panel Spec v0.4 into code and checklists.  
**Scope:** Everything a developer needs to implement the Product Panel UI (validation, state, rendering, interactions, tests).  
**Contract shape:** _Server‑driven_ JSON. Client is a pure view with strict validation and **no business logic**.

> **Architecture Context (assumptions)**:
>
> - **Framework:** TanStack Start v1 (SSR-first, server functions)
> - **State:** Jotai atoms + TanStack Query
> - **Validation:** Zod 4, `.strict()` at boundaries (SSR + hydration)
> - **Money:** Dinero v2 snapshots over the wire
> - **Deploy:** Atomic (server and client always in sync)

---

## Contents

1. [Contract & Validation (Zod)](#1-contract--validation-zod)
2. [State Management Architecture (Jotai + Query)](#2-state-management-architecture-jotai--query)
3. [Component Structure & Responsibilities](#3-component-structure--responsibilities)
4. [Derived Rendering Logic (Pure Functions)](#4-derived-rendering-logic-pure-functions)
5. [User Interactions & Flows](#5-user-interactions--flows)
6. [Edge Cases, Invariants & Guardrails](#6-edge-cases-invariants--guardrails)
7. [Accessibility & UX Rules](#7-accessibility--ux-rules)
8. [Testing, Fixtures & Acceptance Criteria](#8-testing-fixtures--acceptance-criteria)
9. [Performance, Refresh & Error Handling](#9-performance-refresh--error-handling)
10. [Integration Notes & Examples](#10-integration-notes--examples)
11. [Developer Checklists (Quick Audits)](#11-developer-checklists-quick-audits)
12. [Appendix: Types, Utilities, and Copy Patterns](#12-appendix-types-utilities-and-copy-patterns)

---

## 1) Contract & Validation (Zod)

**Goal:** Define strict Zod schemas that validate **everything** at the boundary. Reject unknown fields. Derive TS types with `z.infer`. Money is Dinero v2 snapshots. No local enums beyond those declared.

### 1.1 Top‑level

**Four keys only**: `context`, `sections`, `items`, `pricing`. Unknown top‑level keys → **validation error**.

> **Optional enhancement**: Spec §14.2 recommends branded types for IDs (`ProductIdSchema = z.string().min(1).brand("ProductId")`). This adds compile-time safety (prevents mixing ProductId with plain string) but isn't required for runtime correctness. The schemas below use plain types for simplicity.

```ts
import { z } from "zod";

/** ——— Utilities ——— */
const snakeCode = z.string().regex(/^[a-z][a-z0-9_]*$/); // machine codes

/** Dinero currency + snapshot */
export const CurrencySchema = z
  .object({
    code: z.string().regex(/^[A-Z]{3}$/), // ISO 4217 format (e.g., USD)
    // NOTE: Validates format only, not actual currency existence
    base: z.number().int().positive(), // e.g., 10
    exponent: z.number().int().nonnegative(), // e.g., 2
  })
  .strict();

export const DineroSnapshotSchema = z
  .object({
    amount: z.number().int(), // minor units (e.g., cents)
    currency: CurrencySchema,
    scale: z.number().int().nonnegative(),
  })
  .strict();

/** ——— Axes ——— */
const TemporalWindowSchema = z
  .object({
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
  })
  .strict();

export const TemporalSchema = z
  .object({
    phase: z.enum(["before", "during", "after"]),
    reasons: z.array(snakeCode).default([]),
    currentWindow: TemporalWindowSchema.optional(), // metadata only, not for math
    nextWindow: TemporalWindowSchema.optional(), // metadata only, not for math
  })
  .strict();

export const SupplySchema = z
  .object({
    status: z.enum(["available", "none", "unknown"]),
    reasons: z.array(snakeCode).default([]),
    remaining: z.number().int().nonnegative().optional(), // copy-only
  })
  .strict();

export const GatingRequirementSchema = z
  .object({
    kind: z.string(), // Common: "unlock_code", "membership", "purchase_history", etc.
    satisfied: z.boolean(), // Required (not optional) per spec §3.3
    validWindow: z
      .object({
        startsAt: z.string().optional(),
        endsAt: z.string().optional(),
      })
      .partial()
      .optional(),
    limit: z
      .object({
        maxUses: z.number().int().nonnegative().optional(),
        usesRemaining: z.number().int().nonnegative().optional(),
      })
      .partial()
      .optional(),
  })
  .strict();

export const GatingSchema = z
  .object({
    required: z.boolean(),
    satisfied: z.boolean(),
    listingPolicy: z.enum(["omit_until_unlocked", "visible_locked"]),
    reasons: z.array(snakeCode).default([]),
    requirements: z.array(GatingRequirementSchema).optional(),
  })
  .strict();

export const DemandSchema = z
  .object({
    kind: z.enum(["none", "waitlist", "notify_me"]),
    reasons: z.array(snakeCode).default([]),
  })
  .strict();

/** Row-level unified messages */
export const MessagePlacementSchema = z.enum([
  "row.under_title",
  "row.under_price",
  "row.under_quantity",
  "row.footer",
  "row.cta_label",
]);

export const MessageVariantSchema = z.enum([
  "neutral",
  "info",
  "warning",
  "error",
]);

export const RowMessageSchema = z
  .object({
    code: snakeCode, // machine code
    text: z.string().optional(), // localized full text (preferred)
    params: z.record(z.any()).optional(), // template params if text omitted
    placement: MessagePlacementSchema, // REQUIRED slot
    variant: MessageVariantSchema.optional().default("info"),
    priority: z.number().int().optional().default(0),
  })
  .strict();

/** ——— Product, Variant, Fulfillment ——— */
export const FulfillmentSchema = z
  .object({
    methods: z.array(
      z.enum([
        "eticket",
        "apple_pass",
        "will_call",
        "physical_mail",
        "shipping",
        "nfc",
      ])
    ),
    details: z.record(z.any()).optional(), // display-only metadata
  })
  .strict();

export const ProductSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    type: z.enum(["ticket", "digital", "physical"]),
    fulfillment: FulfillmentSchema.optional(),
    description: z.string().optional(),
    subtitle: z.string().optional(),
    category: z.string().optional(),
  })
  .strict();

export const VariantSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
    attributes: z.record(z.any()).optional(),
  })
  .strict();

/** ——— Commercial ——— */
export const CommercialLimitsSchema = z
  .object({
    perOrder: z.number().int().nonnegative().optional(),
    perUser: z.number().int().nonnegative().optional(),
  })
  .strict();

export const CommercialSchema = z
  .object({
    price: DineroSnapshotSchema,
    feesIncluded: z.boolean(), // copy-only ("+ fees" vs "incl. fees")
    maxSelectable: z.number().int().nonnegative(), // CLAMP — authoritative
    limits: CommercialLimitsSchema.optional(), // informational only
  })
  .strict();

/** ——— Display ——— */
export const DisplayBadgeDetailSchema = z
  .object({
    kind: z.enum(["tooltip", "hovercard"]),
    ref: z.string(),
  })
  .strict();

export const DisplaySchema = z
  .object({
    badges: z.array(z.string()).default([]),
    badgeDetails: z.record(DisplayBadgeDetailSchema).optional(),
    sectionId: z.string().optional(),
    showLowRemaining: z.boolean().default(false),
  })
  .strict();

/** ——— Relations (Add-ons) ——— */
export const RelationsSchema = z
  .object({
    parentProductIds: z.array(z.string()).min(1),
    displayMode: z.enum(["nested", "section"]),
    constraint: z.enum(["match_parent", "optional", "independent"]),
    minQuantity: z.number().int().positive().optional(),
  })
  .strict()
  .refine(
    (rel) =>
      rel.constraint === "match_parent" ? rel.minQuantity === undefined : true,
    { message: "minQuantity cannot be used with match_parent constraint" }
  );

/** ——— Item (Panel Row) ——— */
export const ItemStateSchema = z
  .object({
    temporal: TemporalSchema,
    supply: SupplySchema,
    gating: GatingSchema,
    demand: DemandSchema,
    messages: z.array(RowMessageSchema).default([]),
  })
  .strict();

export const PanelItemSchema = z
  .object({
    product: ProductSchema,
    variant: VariantSchema.optional(),
    state: ItemStateSchema,
    commercial: CommercialSchema,
    display: DisplaySchema,
    relations: RelationsSchema.optional(),
  })
  .strict();

/** ——— Context & Notices ——— */
export const PanelNoticeVariantSchema = z.enum([
  "neutral",
  "info",
  "warning",
  "error",
]);

export const PanelNoticeSchema = z
  .object({
    code: snakeCode,
    icon: z.string().optional(),
    title: z.string().optional(),
    text: z.string().optional(),
    description: z.string().optional(),
    params: z.record(z.any()).optional(),
    variant: PanelNoticeVariantSchema.optional(),
    priority: z.number().int().optional().default(0),
    action: z
      .object({
        label: z.string(),
        kind: z.enum(["link", "drawer"]),
        target: z.string().optional(),
      })
      .optional(),
    expiresAt: z.string().optional(),
  })
  .strict();

export const GatingSummarySchema = z
  .object({
    hasHiddenGatedItems: z.boolean(),
    hasAccessCode: z.boolean().optional(),
  })
  .strict();

export const OrderRulesSchema = z
  .object({
    types: z.enum(["single", "multiple"]),
    typesPerOrder: z.enum(["single", "multiple"]),
    ticketsPerType: z.enum(["single", "multiple"]),
    minSelectedTypes: z.number().int().nonnegative(),
    minTicketsPerSelectedType: z.number().int().nonnegative(),
  })
  .strict();

export const CopyTemplateSchema = z
  .object({
    key: snakeCode, // must match messages[].code when used
    template: z.string(),
    locale: z.string().optional(),
  })
  .strict();

export const ClientCopySchema = z
  .object({
    // Selection validation and panel labels (templates allowed)
    selection_min_reached: z.string().optional(),
    selection_max_types: z.string().optional(),
    quantity_min_reached: z.string().optional(),
    quantity_max_reached: z.string().optional(),
    addon_requires_parent: z.string().optional(),
    // Panel button labels (singular/plural)
    panel_action_button_cta: z.string().optional(),
    panel_action_button_cta_plural: z.string().optional(),
    // Welcome text defaults
    welcome_default: z.string().optional(),
    welcome_waitlist: z.string().optional(),
    welcome_notify_me: z.string().optional(),
  })
  .strict();

export const EffectivePrefsSchema = z
  .object({
    showTypeListWhenSoldOut: z.boolean(),
    displayPaymentPlanAvailable: z.boolean(),
    displayRemainingThreshold: z.number().int().nonnegative().optional(),
  })
  .strict();

/** ——— Tooltips & Hovercards ——— */
export const TooltipSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1),
  })
  .strict();

export const HoverCardSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().optional(),
    body: z.string().min(1),
    action: z
      .object({
        label: z.string(),
        kind: z.enum(["link", "drawer"]),
        target: z.string().optional(),
      })
      .optional(),
  })
  .strict();

export const ContextSchema = z
  .object({
    orderRules: OrderRulesSchema,
    panelNotices: z.array(PanelNoticeSchema).default([]),
    effectivePrefs: EffectivePrefsSchema,
    gatingSummary: GatingSummarySchema.optional(), // present iff gating configured
    welcomeText: z.string().optional(),
    copyTemplates: z.array(CopyTemplateSchema).optional(),
    clientCopy: ClientCopySchema.optional(),
    tooltips: z.array(TooltipSchema).optional(),
    hovercards: z.array(HoverCardSchema).optional(),
  })
  .strict();

/** ——— Sections ——— */
export const SectionSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    order: z.number().int(),
    labelOverride: z.string().nullable().optional(),
  })
  .strict();

/** ——— Pricing ———
 * lineItems[].code is intentionally a string (open set). The UI uses provided labels.
 */
export const PricingLineItemSchema = z
  .object({
    code: z.string(), // Open set; common: "TICKETS", "FEES", "TAX", "DISCOUNT", "TOTAL"
    // Spec §11: render unknown codes with provided label (no special handling)
    label: z.string(), // UI label is authoritative
    amount: DineroSnapshotSchema,
  })
  .strict();

export const PricingSchema = z
  .object({
    currency: CurrencySchema,
    mode: z.enum(["reserve", "final"]).optional(),
    lineItems: z.array(PricingLineItemSchema),
  })
  .strict();

/** ——— Root ——— */
export const PanelDataSchema = z
  .object({
    context: ContextSchema,
    sections: z.array(SectionSchema).min(1),
    items: z.array(PanelItemSchema),
    pricing: PricingSchema,
  })
  .strict();

export type PanelData = z.infer & lt;
typeof PanelDataSchema & gt;
export type PanelItem = z.infer & lt;
typeof PanelItemSchema & gt;
export type ItemState = z.infer & lt;
typeof ItemStateSchema & gt;
```

**Validation strategy:**

- Validate **on SSR** (server function/loader) and **on hydration** (client).
- Use `.strict()` everywhere; unknown fields should fail fast.
- Machine codes (`snake_case`) validated via `snakeCode` regex.
- **Currency consistency**: check `items[].commercial.price.currency.code` vs `pricing.currency.code`. Mismatch → **fatal**.

```ts
/** Currency consistency guard (run after schema parse) */
export function assertSingleCurrency(data: PanelData): void {
  const panelCode = data.pricing.currency.code;
  for (const it of data.items) {
    const itemCode = it.commercial.price.currency.code;
    if (itemCode !== panelCode) {
      throw new Error(
        `Currency mismatch: item ${it.product.id} uses ${itemCode}, pricing uses ${panelCode}`
      );
    }
  }
}
```

**Error handling:**

- In development: log `error.format?.()` from Zod.
- In production: show generic UI error; do not leak technical details.
- Reject invalid payloads; do **not** render partial UI.

---

### 1.2 Contract invariants (client MUST enforce via validation)

- Root keys must be exactly four.
- `product.id` **unique** across `items[]` (validate set uniqueness).
- `gating.listingPolicy` only `"omit_until_unlocked"` | `"visible_locked"`.
- Messages require `placement`; omit invalid placements.
- **No client math**: use `pricing` as-is; render in order provided.

```ts
export function assertUniqueProductIds(items: PanelItem[]): void {
  const set = new Set<string>();
  for (const it of items) {
    if (set.has(it.product.id)) {
      throw new Error(`Duplicate product.id: ${it.product.id}`);
    }
    set.add(it.product.id);
  }
}
```

---

## 2) State Management Architecture (Jotai + Query)

**Principle:** Atoms **derive** UI state from server facts. All business decisions come from the server. On any refresh, replace facts and re‑derive.

### 2.1 Atom graph (minimal viable set)

- **`panelDataAtom`** — holds last valid `PanelData` (validated).
- **`selectionAtom`** — client’s chosen quantities `{ [productId]: number }` (source of selection sent to server).
- **Derived row atoms:** for each `PanelItem`, derive `presentation`, `isPurchasable`, `quantityUI`, `priceUI`, `cta`.
- **`panelActionButtonAtom`** — derives bottom CTA state (checkout | waitlist | notify_me, enabled boolean, label from copy).
- **`accessCodeCTAAtom`** — derives whether to show access-code affordance.
- **`pricingAtom`** — reads `panelDataAtom.pricing` (no math).
- **`refreshPendingAtom`** — tracks if a server refresh is in flight.

> The selection **does not** decide caps; it **triggers** a refresh. The server returns updated `maxSelectable`, updated `pricing`, and any downstream changes.

### 2.2 Atom definitions

```ts
import { atom } from "jotai";
import type { PanelData, PanelItem } from "./schemas";

/** Last valid payload (authoritative facts) */
export const panelDataAtom = atom&lt;PanelData | null&gt;(null);

/** Client selection (quantities by productId); UI clamps by server `maxSelectable` */
export const selectionAtom = atom&lt;Record&lt;string, number&gt;&gt;({});

/** Helpers */
export type RowFlags = {
  presentation: "normal" | "locked";
  isPurchasable: boolean;
  quantityUI: "hidden" | "select" | "stepper";
  priceUI: "hidden" | "masked" | "shown";
  cta: { kind: "quantity" | "waitlist" | "notify" | "none"; enabled: boolean };
};

/** Pure derivations (see §4)
 *
 * NOTE: This function derives per-item flags. For full layout (items.length > 1),
 * apply the consistency rule: if ANY item has maxSelectable > 1, ALL items must
 * show "stepper" (override per-row "select" decision). See §4.4 for details.
 */
export function deriveRowFlags(item: PanelItem): RowFlags {
  const g = item.state.gating;
  const presentation = g.required && !g.satisfied && g.listingPolicy === "visible_locked" ? "locked" : "normal";

  const isPurchasable =
    item.state.temporal.phase === "during" &&
    item.state.supply.status === "available" &&
    (!g.required || g.satisfied) &&
    item.commercial.maxSelectable > 0;

  const quantityUI =
    presentation !== "normal" || !isPurchasable
      ? "hidden"
      : item.commercial.maxSelectable === 1
        ? "select"
        : "stepper";

  const priceUI =
    presentation === "locked" ? "masked" :
    isPurchasable ? "shown" : "hidden";

  let cta: RowFlags["cta"] = { kind: "none", enabled: false };
  if (presentation === "locked") {
    cta = { kind: "none", enabled: false };
  } else if (isPurchasable) {
    cta = { kind: "quantity", enabled: item.commercial.maxSelectable > 0 };
  } else if (item.state.supply.status === "none" && item.state.demand.kind === "waitlist") {
    cta = { kind: "waitlist", enabled: true };
  } else if (item.state.temporal.phase === "before" && item.state.demand.kind === "notify_me") {
    cta = { kind: "notify", enabled: true };
  }

  return { presentation, isPurchasable, quantityUI, priceUI, cta };
}

/** Derived flags per item id for render-time access */
export const rowFlagsByIdAtom = atom((get) =&gt; {
  const data = get(panelDataAtom);
  const map: Record&lt;string, RowFlags&gt; = {};
  if (!data) return map;
  for (const it of data.items) map[it.product.id] = deriveRowFlags(it);
  return map;
});

/** Access code CTA visibility */
export const accessCodeCTAAtom = atom((get) =&gt; {
  const data = get(panelDataAtom);
  if (!data) return false;
  const hasHidden = data.context.gatingSummary?.hasHiddenGatedItems === true;
  const anyLockedVisible = data.items.some((it) =&gt; deriveRowFlags(it).presentation === "locked");
  return hasHidden || anyLockedVisible;
});

/** Panel action button (bottom) */
type PanelActionKind = "checkout" | "waitlist" | "notify_me";
export type PanelAction = { kind: PanelActionKind; enabled: boolean; label: string };

export const panelActionButtonAtom = atom((get) =&gt; {
  const data = get(panelDataAtom);
  if (!data) return { kind: "checkout", enabled: false, label: "…" } as PanelAction;

  const flags = data.items.map(deriveRowFlags);
  const anyPurchasable = flags.some((f) =&gt; f.isPurchasable);
  const anyWaitlist = !anyPurchasable &amp;&amp; data.items.some((it, i) =&gt;
    it.state.supply.status === "none" &amp;&amp; it.state.demand.kind === "waitlist" &amp;&amp; deriveRowFlags(it).presentation !== "locked"
  );
  const anyNotify = !anyPurchasable &amp;&amp; data.items.some((it) =&gt;
    it.state.temporal.phase === "before" &amp;&amp; it.state.demand.kind === "notify_me" &amp;&amp; deriveRowFlags(it).presentation !== "locked"
  );

  let kind: PanelActionKind = "checkout";
  let enabled = false;

  if (anyPurchasable) {
    kind = "checkout";
    // Must check selection validity against orderRules (spec §5.3a)
    const selection = get(selectionAtom);
    enabled = selectionValid(data.context.orderRules, selection, data.items);
  } else if (anyWaitlist) {
    kind = "waitlist";
    enabled = true;
  } else if (anyNotify) {
    kind = "notify_me";
    enabled = true;
  } else {
    kind = "checkout";
    enabled = false;
  }

  // Detect singular vs. plural context (spec §5.3a)
  const isCompactLayout = data.items.length === 1;
  const isSingular = isCompactLayout && data.items[0]?.commercial.maxSelectable === 1;

  // Label resolution from clientCopy (see §12.3)
  const cc = data.context.clientCopy;
  const label = resolvePanelActionLabel(kind, !isSingular, cc); // Use derived plural flag

  return { kind, enabled, label };
});
```

> **Important:** `resolvePanelActionLabel` must use server-provided `clientCopy` when present; otherwise supply sensible defaults as a pure component concern (no business logic). See [§12.3](#123-label--copy-resolution).

### 2.3 Refresh loop

**Events that trigger refresh:**

- Quantity change (debounced 300 ms)
- Access code submission (success or failure)
- Server push (polling/WebSocket/SSE)
- Discount code application

**Do NOT refresh on**:

- Pure UI events (expand/collapse, hover)
- Client validation errors (max qty warnings)
- Rendering/scrolling events
- Modal open/close

**Why**: These don't change business state; refreshing would spam server and degrade UX.

**Refresh discipline:**

- Keep previous `panelDataAtom` while request is in-flight.
- On success: **replace** `panelDataAtom` with the new payload (validate, assert currency, assert unique ids).
- On error: preserve old data, show non-blocking error banner, backoff retries per policy.

### 2.4 Advanced: Factory Pattern for Multi-Instance Support

The atoms above use global scope (simple, works for single panel instance). For apps with multiple simultaneous panel instances (e.g., admin preview + customer view), use a factory pattern:

```ts
export function createPanelAtoms(eventId: string) {
  const queryAtom = atomWithQuery(() => ({
    queryKey: ["panel", eventId],
    queryFn: () => fetchPanelData(eventId),
  }));

  const selectionFamily = atomFamily((productId: string) => atom(0));
  const isPurchasableFamily = atomFamily((productId: string) =>
    atom((get) => {
      const panel = get(queryAtom);
      const item = panel.items.find((i) => i.product.id === productId);
      return item ? deriveRowFlags(item).isPurchasable : false;
    })
  );
  // ... return scoped atoms
}

// Usage: provide via Context
const atoms = useMemo(() => createPanelAtoms(eventId), [eventId]);
```

**Benefits**: Isolated state, atomFamily caching (prevents memory leaks), SSR/hydration optimization.

**See**: Implementation Guide §3.2-3.4 for complete pattern.

---

## 3) Component Structure & Responsibilities

**Goal:** Small, focused components. No business logic inside components; only derivations and rendering.

### 3.1 Top‑level layout

- **`&lt;ProductPanel /&gt;`**
  _Responsibilities:_

  - Fetch & validate payload (SSR + hydrate)
  - Provide atoms to subtree (Jotai Provider if needed)
  - Render header + `PanelNoticesArea`
  - Render `SectionsList` (grouped rows)
  - Render `PricingFooter`
  - Render `PanelActionBar` (main button + Access Code CTA)
  - Handle global loading/error states

**Layout modes (render-time, UI only):**

| Condition                                   | Layout          | Description                        |
| ------------------------------------------- | --------------- | ---------------------------------- |
| `items.length === 1`                        | **Compact**     | Single product card (streamlined)  |
| `items.length > 1`                          | **Full**        | Row-based list with sections       |
| `items.length === 0 && hasHiddenGatedItems` | **Gated-entry** | Access code screen (no product UI) |

**Compact variations**:

- Minimal (max=1): No qty stepper, singular label ("Get Ticket"), footer optional
- With quantity (max>1): Stepper on right, plural label ("Get Tickets"), footer required

**Full layout**: Always plural labels, always show footer, apply qty UI consistency rule (§4.4).

> All contract rules still apply regardless of layout mode (price visibility, clamps, etc.).

### 3.2 Subcomponents

- **`PanelNoticesArea`**:
  Input: `context.panelNotices[]` sorted by `priority desc`, then payload order.

  **Two notice variants** (determined by `code`):

  - **Standard** (most codes): Icon + title + text + description + optional action button
  - **Specialized** (`requires_code_entry`): Icon + title + description + inline access form (input + submit)

  **When to use**:

  - Gated-only (items=[] + hasHiddenGatedItems): Use `requires_code_entry` notice (primary affordance)
  - Mixed scenarios: Use standard notice + AccessCodeCTA below button (secondary affordance)

  No client-invented notices.

- **`SectionsList`**:
  Groups items by `display.sectionId`, defaulting to the first section by `order` when absent. Hide empty sections.

- **`Section`**:
  Renders a heading (`label` or `labelOverride`) and its `ItemRow`s.

- **`ItemRow`**:
  Receives `PanelItem`. Derives flags (`deriveRowFlags`) and renders:

  - Title, optional subtitle
  - Fulfillment icons (from `product.fulfillment.methods`)
  - Price area (masked/shown/hidden)
  - Quantity UI (`hidden`/`select`/`stepper`) with clamp `maxSelectable`
  - Row messages (by placement, priority)
  - Row CTA (if `waitlist` or `notify`), label resolved from row messages or templates
  - Badges & hovercards/tooltips based on `display.badges` and `badgeDetails`

- **`PricingFooter`**:
  Renders `pricing.lineItems[]` in **exact order** with authoritative `label`. Bold/break before TOTAL is allowed as visual style only.

- **`PanelActionBar`**:
  Reads `panelActionButtonAtom` for kind/enabled/label. Renders main button (Checkout/Waitlist/Notify). Beneath, conditionally renders `AccessCodeCTA` (from `accessCodeCTAAtom`) unless code entry is already provided as a notice variant.

- **`AccessCodeCTA`**:
  Secondary affordance (expandable link + input) for code submission. Not a notice. Only appears when derived (see §2.2).

- **`RowMessages`**:
  Renders messages by placement; sorts each placement bucket by `priority desc`, then payload order. Uses provided `text`, or interpolates via `copyTemplates` by `code` + `params`. Unknown placeholders → empty strings.

---

## 4) Derived Rendering Logic (Pure Functions)

> The client **derives** UI from server facts. No business logic. Derivations re‑run on every new payload.

### 4.1 Per‑row flags

- **Presentation:**
  `locked` iff `gating.required && !gating.satisfied && listingPolicy === "visible_locked"`, else `normal`.

- **Purchasable:**
  `temporal.phase === "during" AND supply.status === "available" AND (!gating.required || gating.satisfied) AND commercial.maxSelectable > 0`.

- **Quantity UI:**

  - `hidden` unless `presentation === "normal" && isPurchasable && maxSelectable > 0`
  - When shown: `select` if `maxSelectable === 1`, else `stepper`.

- **Price UI:**

  - `masked` when `presentation === "locked"`
  - `shown` iff `presentation === "normal" && isPurchasable === true`
  - Otherwise `hidden`.

- **Row CTA (in order):**

  - If `locked` → `none`
  - Else if `isPurchasable` → `quantity` (enabled if `maxSelectable > 0`)
  - Else if `supply.status === "none" && demand.kind === "waitlist"` → `waitlist`
  - Else if `temporal.phase === "before" && demand.kind === "notify_me"` → `notify`
  - Else → `none`.

### 4.2 Panel action button

- **Kind:**

  - If any **visible** item purchasable → `checkout`
  - Else if none purchasable but at least one **visible** `waitlist` → `waitlist`
  - Else if none purchasable but at least one **visible** `notify_me` → `notify_me`
  - Else `checkout` disabled.

- **Labels:** From `context.clientCopy` where present; else default strings (see §12.3) selected by the atom using singular/plural context.

### 4.3 Messages

- Use `text` verbatim when present.
- Else resolve `copyTemplates[key === code]` with `params`.
- Else omit.
- Sort per placement by `priority desc`, then payload order.
- **Never** translate machine codes.

### 4.4 Full Layout: Quantity UI Consistency Rule (Spec §8.9)

**Rule**: In full layout (items.length > 1), if ANY item has `maxSelectable > 1`, then ALL items MUST show steppers (even items with max=1).

**Why**: Visual consistency prevents user confusion. Mixed UI (some steppers, some "Add" buttons) creates unclear interaction model.

**Detection**:

```ts
const isFullLayout = items.length > 1;
const anyItemMultiQty = items.some((item) => item.commercial.maxSelectable > 1);

if (isFullLayout && anyItemMultiQty) {
  // Override per-row quantityUI to "stepper" for ALL items
}
```

**Examples**:

- Full, all max=1 (GA=1, VIP=1): ALL show "Add" buttons ✅
- Full, mixed (GA=10, VIP=1): ALL show steppers (VIP constrained 0-1) ✅
- Compact, max=1: Show no qty control (implicit qty=1) ✅
- Compact, max>1: Show stepper on right ✅

**Implementation**: Apply as override after `deriveRowFlags` in rendering logic, or extend function with panel context parameter:

```ts
export function deriveRowFlags(
  item: PanelItem,
  panelContext?: { isFullLayout: boolean; anyItemMultiQty: boolean }
): RowFlags {
  // ... existing logic ...

  let quantityUI = /* per-item logic from §4.1 */;

  // Full layout consistency rule (spec §8.9)
  if (panelContext?.isFullLayout && panelContext.anyItemMultiQty) {
    if (presentation === "normal" && isPurchasable && item.commercial.maxSelectable > 0) {
      quantityUI = "stepper"; // Override "select" for consistency
    }
  }

  return { presentation, isPurchasable, quantityUI, priceUI, cta };
}
```

---

## 5) User Interactions & Flows

**All interactions go through the server.** Client does not compute money, caps, or eligibility.

### 5.1 Quantity selection

- User increments/decrements within UI clamp (0…`maxSelectable`).
- Debounce 300 ms; POST selection to server (include current selection map).
- Server returns refreshed payload with:

  - Possibly adjusted `maxSelectable` (including add-on recompute)
  - Updated `pricing`
  - Any gating/demand changes

- Client validates & **replaces** `panelDataAtom`.
- If server’s new `maxSelectable` < current selected quantity, **clamp down** immediately.

**Never** compute caps locally from `remaining` or `limits`; only respect `maxSelectable`.

### 5.2 Access code flow

- `AccessCodeCTA` visible when derived (see §2.2).
- Submit code → server validates → returns new payload:

  - Omitted items may appear; locked items may flip to satisfied
  - `gatingSummary.hasHiddenGatedItems` may change
  - If unlocked item is sold out, keep it visible (disabled) to **confirm success**

- On invalid code: server sets error via notice or message; client renders it verbatim. No local error strings.

### 5.3 Waitlist / Notify‑me

- When row `cta.kind === "waitlist"` or `"notify"`, the row’s `cta_label` comes from `messages[]` or templates.
- Clicking triggers app‑level flow (drawer/form); **not** part of the panel contract. Do not invent strings; prefer server-provided.

### 5.4 Checkout CTA

- Enabled only when:

  - `panelActionButtonAtom.kind === "checkout"` and `enabled === true`
  - Selection must satisfy `context.orderRules` (min counts/composition). Copy for validation errors comes from `context.clientCopy`.

---

## 6) Edge Cases, Invariants & Guardrails

**Hard walls** (client must **never** do):

- No schedule/time math (no countdowns, no phase inference)
- No availability math (don’t derive “sold out” from counts)
- No price math (no totals/fees/taxes/discounts in client)
- No clamp math (never compute caps; use `maxSelectable` only)
- No gate logic (never validate codes locally; never flip `gating.satisfied`)
- No invented copy (only `messages[]`, `panelNotices[]`, templates, `clientCopy`)
- No per-row payment-plan badges (banner only when server sends notice)
- No placeholders for omitted items
- No logging of access codes/tokens

**Omit vs Locked:**

- `omit_until_unlocked`: item absent from `items[]`. Only hint is `context.gatingSummary.hasHiddenGatedItems`.
- `visible_locked`: item is present but locked (price masked, quantity hidden, CTA none).

**Currency consistency:**
`pricing.currency.code` must equal every `commercial.price.currency.code`. Mismatch → validation error.

**Relations (Add‑ons):**

- Add‑on defined by presence of `relations` (not a `product.type`).
- Server recomputes `maxSelectable` based on parent selection and `constraint` (`match_parent`, `optional`, or `independent`).
- `displayMode` controls rendering: `nested` under parent, `section` in assigned section.
- If no parent selected → server should send `maxSelectable=0`.
- If parents omitted by gating → add‑on omitted (or disabled without leakage).

---

## 7) Accessibility & UX Rules

- Every form control has a label.
- Validation errors announced with `role="alert"`.
- No positive `tabIndex`.
- Use semantic HTML over ARIA when possible.
- Provide alt text where required.
- Do **not** rely on color alone to convey state (pair icon/text). Avoid red/green‑only distinctions; prefer clear icons and text variants (`info`, `warning`, `error`, `neutral`).

---

## 8) Testing, Fixtures & Acceptance Criteria

**Fixture set (minimum):**

1. **Available** — at least one purchasable item
2. **Sold out + waitlist** — `supply: none`, `demand: waitlist`
3. **Visible locked** — `listingPolicy: visible_locked`, unsatisfied
4. **Omit until unlock** — omitted row + `gatingSummary.hasHiddenGatedItems=true`
5. **Public sold out + hidden gated** — all visible sold out, hint true ⇒ code prompt shown (not terminal sold-out)
6. **Payment plan** — presence of `panelNotices[]` with `code: "payment_plan_available"`

**Acceptance criteria (selected):**

- **Row presentation:** Locked rows mask price and hide quantity.
- **Price visibility:** Price shown only when purchasable; hidden otherwise; masked if locked.
- **Quantity UI:** Hidden unless normal & purchasable & `maxSelectable > 0`; `select` if 1, else `stepper`.
- **CTA mapping:** Matches truth table exactly; no CTA for locked rows.
- **Panel action button:** Derives to `checkout`/`waitlist`/`notify_me`/disabled based on visible items only and respects gating precedence.
- **Gating zero‑leak:** Omitted items never referenced in UI beyond boolean hint.
- **Pricing footer:** Renders `lineItems[]` in exact order with provided labels; no recomputation.
- **Currency consistency:** Mismatch rejects payload.
- **Relations clamp:** Server‑driven `maxSelectable` reflects parent selection; client clamps down on refresh if reduced.
- **Messages:** Placement respected; sorted by `priority desc`, then payload order; templating used only if `text` absent.

> See §11 for component‑specific checklists.

---

## 9) Performance, Refresh & Error Handling

- **Debounce** quantity updates at 300 ms (atom or handler level).
- Keep showing previous pricing during refresh (no flash-to-empty).
- **Retry** pricing fetch errors automatically (e.g., 3s backoff × 3), then show retry affordance.
- **Do not** block checkout if pricing is <30 s stale (server will revalidate).
- Long refresh: show subtle “updating” indicator without disrupting layout.

---

## 10) Integration Notes & Examples

### 10.1 Fetch & validate (SSR)

```ts
import {
  PanelDataSchema,
  assertSingleCurrency,
  assertUniqueProductIds,
} from "./schemas";

export async function loadPanel(): Promise & lt;
PanelData & gt;
{
  const raw = await serverFunction_getPanelData(); // TanStack Start server function
  const data = PanelDataSchema.parse(raw);
  assertUniqueProductIds(data.items);
  assertSingleCurrency(data);
  return data;
}
```

### 10.2 Hydration: provide atoms

```tsx
import { useSetAtom } from "jotai";
import { panelDataAtom } from "./atoms";

export function ProductPanelRoot({ initialData }: { initialData: PanelData }) {
  const setData = useSetAtom(panelDataAtom);
  useEffect(() =&gt; { setData(initialData); }, [initialData, setData]);
  return &lt;ProductPanel /&gt;;
}
```

### 10.3 Quantity change → refresh

```ts
import { useMutation } from "@tanstack/react-query";
import { selectionAtom, panelDataAtom } from "./atoms";
import { useAtomValue, useSetAtom } from "jotai";

export function useApplySelection() {
  const selection = useAtomValue(selectionAtom);
  const setPanel = useSetAtom(panelDataAtom);

  return useMutation({
    mutationFn: async () =&gt; {
      const raw = await serverFunction_applySelection(selection);
      const data = PanelDataSchema.parse(raw);
      assertUniqueProductIds(data.items);
      assertSingleCurrency(data);
      return data;
    },
    onSuccess: (data) =&gt; setPanel(data),
  });
}
```

### 10.4 Templating messages

```ts
export function resolveMessageText(msg: z.infer&lt;typeof RowMessageSchema&gt;, templates?: Record&lt;string, string&gt;) {
  if (msg.text) return msg.text;
  const template = templates?.[msg.code];
  if (!template) return null;
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) =&gt; {
    const v = (msg.params ?? {})[key];
    return v == null ? "" : String(v);
  });
}
```

---

## 11) Developer Checklists (Quick Audits)

### 11.1 Validation (boundary)

- [ ] Root keys exactly: `context`, `sections`, `items`, `pricing` (no extras)
- [ ] Every `product.id` unique
- [ ] `gating.listingPolicy` value valid
- [ ] `messages[].placement` required; unknown placements omitted
- [ ] Currency codes consistent across items and pricing
- [ ] Unknown fields rejected (Zod `.strict()`)

### 11.2 ItemRow rendering

- [ ] `presentation` derived correctly (`visible_locked` → locked)
- [ ] `isPurchasable` derived from axes + `maxSelectable > 0`
- [ ] Price UI: masked (locked) / shown (purchasable) / hidden (otherwise)
- [ ] Quantity UI: hidden unless normal+purchasable; select vs stepper by clamp
- [ ] CTA mapping matches table; labels from payload (`row.cta_label` or templates)
- [ ] Fulfillment icons from `product.fulfillment.methods` enum only
- [ ] Messages rendered by placement/priority; template interpolation only if `text` missing

### 11.3 PanelActionBar

- [ ] Bottom button kind derived (`checkout`/`waitlist`/`notify_me`/disabled)
- [ ] Label resolved via `clientCopy` fallbacks (plural by default)
- [ ] AccessCodeCTA shown only when derived (hasHiddenGatedItems OR any locked visible) and not duplicated with a dedicated notice variant

### 11.4 PricingFooter

- [ ] `lineItems[]` rendered in order, **no recomputation**
- [ ] Labels used verbatim; TOTAL visually emphasized only (no reordering)
- [ ] Negative amounts rendered with minus sign

### 11.5 Interactions

- [ ] Quantity change debounced 300 ms → server refresh
- [ ] On refresh reducing `maxSelectable`, selection clamped down immediately
- [ ] Access code submit → replace state from server; invalid codes surfaced via notices/messages
- [ ] Waitlist/Notify actions trigger app flow; no fabricated copy

### 11.6 Security & Privacy

- [ ] No logging access codes/tokens
- [ ] No placeholders for omitted items
- [ ] No leakage of hidden SKUs
- [ ] No hardcoded UI text beyond defaults allowed by this guide (use payload strings)

---

## 12) Appendix: Types, Utilities, and Copy Patterns

### 12.1 Money formatting (Dinero snapshot → localized string)

```ts
export function formatDinero(snapshot: z.infer&lt;typeof DineroSnapshotSchema&gt;, locale = "en-US"): string {
  const { amount, currency, scale } = snapshot;
  const divisor = Math.pow(currency.base, scale);
  const value = amount / divisor;
  return new Intl.NumberFormat(locale, { style: "currency", currency: currency.code }).format(value);
}
```

> Display only. **No arithmetic** beyond formatting.

### 12.2 Section assignment

- If `display.sectionId` absent, render in first section by `order`.
- Empty sections may be hidden.

### 12.3 Label & copy resolution

- **Row CTA labels**: Prefer a row message with `placement: "row.cta_label"`. Otherwise, map by `code` templates.

- **PanelActionButton labels**: Resolve by `kind` + singular/plural context.

  **Singular vs. plural detection** (spec §5.3a):

  - **Singular**: Compact layout (`items.length === 1`) AND `maxSelectable === 1`
  - **Plural**: Full layout (`items.length > 1`) OR `maxSelectable > 1`

  **Default labels** by kind:

  - `checkout`: "Get Ticket" (singular) / "Get Tickets" (plural)
  - `waitlist`: "Join Waitlist" (same for both)
  - `notify_me`: "Notify Me" (same for both)

- **Overrides**: Use `context.clientCopy.panel_action_button_cta` (singular) and `.panel_action_button_cta_plural` (plural).

  **Examples**:

  - Compact, max=1, no override → "Get Ticket"
  - Compact, max=6, no override → "Get Tickets"
  - Full layout, no override → "Get Tickets" (always plural)
  - Compact, max=1, override="Buy Now" → "Buy Now"

```ts
export function resolvePanelActionLabel(
  kind: "checkout" | "waitlist" | "notify_me",
  plural: boolean,
  cc?: z.infer&lt;typeof ClientCopySchema&gt;,
): string {
  const fallbacks = {
    checkout: plural ? "Get Tickets" : "Get Ticket",
    waitlist: "Join Waitlist",
    notify_me: "Notify Me",
  } as const;
  if (!cc) return fallbacks[kind];
  const override = plural ? cc.panel_action_button_cta_plural : cc.panel_action_button_cta;
  return override ?? fallbacks[kind];
}
```

### 12.4 Row message rendering by placement (skeleton)

```tsx
function RowMessages({ item }: { item: PanelItem }) {
  const templates = Object.fromEntries((item as any)?.context?.copyTemplates?.map?.((t:any) =&gt; [t.key, t.template]) ?? []);
  const byPlacement: Record&lt;z.infer&lt;typeof MessagePlacementSchema&gt;, typeof item.state.messages&gt; = {
    "row.under_title": [],
    "row.under_price": [],
    "row.under_quantity": [],
    "row.footer": [],
    "row.cta_label": [],
  };
  for (const m of item.state.messages) {
    if (byPlacement[m.placement]) byPlacement[m.placement].push(m);
  }
  for (const key of Object.keys(byPlacement) as Array&lt;keyof typeof byPlacement&gt;) {
    byPlacement[key].sort((a, b) =&gt; (b.priority ?? 0) - (a.priority ?? 0));
  }
  // Render each placement bucket in its slot; omitted here for brevity
  return null;
}
```

### 12.5 Derived selection validity (for enabling Checkout)

**Note:** This is **UI gating only** (presentation enable/disable). **Do not** run business policy. Use `context.orderRules` + current selection counts.

```ts
export function selectionValid(orderRules: z.infer&lt;typeof OrderRulesSchema&gt;, selection: Record&lt;string, number&gt;, items: PanelItem[]): boolean {
  // Count selected types (product.type "ticket" only counts as a type)
  const ticketsByType: Record&lt;string, number&gt; = {};
  for (const it of items) {
    const q = selection[it.product.id] ?? 0;
    if (q &gt; 0 &amp;&amp; it.product.type === "ticket") {
      ticketsByType[it.product.id] = q;
    }
  }
  const selectedTypes = Object.keys(ticketsByType).length;
  const minTypes = orderRules.minSelectedTypes;
  const minTicketsPerType = orderRules.minTicketsPerSelectedType;

  if (selectedTypes &lt; minTypes) return false;
  for (const q of Object.values(ticketsByType)) {
    if (q &lt; minTicketsPerType) return false;
  }
  // Single vs multiple constraints are enforced by presentation (not mixing) in the panel; server is authoritative anyway.
  return true;
}
```

> Copy for validation errors should come from `context.clientCopy` (e.g., `selection_min_reached`, `quantity_min_reached`).

### 12.6 Optional: Branded Types for Type Safety

Spec §14.2 recommends branded types for stronger compile-time safety:

```ts
const ProductIdSchema = z.string().min(1).brand("ProductId");
const MachineCodeSchema = z.string().regex(/^[a-z][a-z0-9_]*$/).brand("MachineCode");

export type ProductId = z.infer<typeof ProductIdSchema>; // Branded string
export type MachineCode = z.infer<typeof MachineCodeSchema>; // Branded string

// Usage: prevents mixing
function getItem(id: ProductId) { ... }
getItem("random-string"); // ❌ Compile error
getItem(validatedId); // ✅ OK
```

**Benefits**: Prevents accidentally passing wrong string types (ProductId vs SectionId).

**Tradeoff**: More verbose; requires explicit branding at boundaries.

**Recommendation**: Use for large codebases or when IDs are easily confused.

---

## Appendix: Visual States (Quick Tables)

### Row Decision Table

| Condition                                     | Presentation | Price UI | Qty UI      | CTA      |
| --------------------------------------------- | ------------ | -------- | ----------- | -------- |
| Gate unsatisfied & visible (`visible_locked`) | locked       | masked   | hidden      | none     |
| Purchasable (all axes + clamp)                | normal       | shown    | select/step | quantity |
| Sold out + waitlist                           | normal       | hidden   | hidden      | waitlist |
| Before sale + notify_me                       | normal       | hidden   | hidden      | notify   |
| Otherwise                                     | normal       | hidden   | hidden      | none     |

### Panel Action Button

| Visible items                  | Button kind | Enabled |
| ------------------------------ | ----------- | ------- |
| Any purchasable                | checkout    | yes     |
| None purchasable, any waitlist | waitlist    | yes     |
| None purchasable, any notify   | notify_me   | yes     |
| None of the above              | checkout    | no      |

---

## Appendix: Sample Fixtures (JSONC)

### A) Minimal purchasable GA

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
        "maxSelectable": 6
      },
      "display": { "badges": [], "showLowRemaining": false }
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

### B) Visible locked row

```jsonc
{
  "product": {
    "id": "prod_locked",
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

### C) Sold out + waitlist

```jsonc
{
  "product": { "id": "prod_ga", "name": "General Admission", "type": "ticket" },
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
        "placement": "row.under_quantity",
        "priority": 100
      }
    ]
  },
  "commercial": { "maxSelectable": 0 },
  "display": { "badges": [], "showLowRemaining": false }
}
```

### D) Omit until unlock (gated-only)

```jsonc
{
  "context": {
    "orderRules": {
      "types": "single",
      "typesPerOrder": "single",
      "ticketsPerType": "single",
      "minSelectedTypes": 0,
      "minTicketsPerSelectedType": 0
    },
    "gatingSummary": { "hasHiddenGatedItems": true },
    "panelNotices": [
      {
        "code": "requires_code_entry",
        "icon": "lock",
        "title": "Have an access code?",
        "description": "Enter your code below to unlock exclusive tickets.",
        "priority": 100
      }
    ],
    "effectivePrefs": {
      "showTypeListWhenSoldOut": true,
      "displayPaymentPlanAvailable": false
    }
  },
  "sections": [{ "id": "main", "label": "Tickets", "order": 1 }],
  "items": [],
  "pricing": {
    "currency": { "code": "USD", "base": 10, "exponent": 2 },
    "lineItems": []
  }
}
```

### E) Public sold out + hidden gated (critical edge case)

```jsonc
{
  "context": {
    "gatingSummary": { "hasHiddenGatedItems": true },
    "panelNotices": [
      {
        "code": "requires_code",
        "text": "Enter access code to view tickets",
        "variant": "info",
        "priority": 90
      }
    ]
  },
  "items": [
    {
      "product": {
        "id": "prod_ga",
        "name": "General Admission",
        "type": "ticket"
      },
      "state": {
        "supply": { "status": "none", "reasons": ["sold_out"] },
        "messages": [
          {
            "code": "sold_out",
            "text": "Sold Out",
            "placement": "row.under_quantity"
          }
        ]
      },
      "commercial": { "maxSelectable": 0 }
    }
  ]
}
```

**CRITICAL**: Show code prompt, NOT "Event Sold Out" finale. Hidden gated inventory may still exist.

### F) Payment plan

```jsonc
{
  "context": {
    "effectivePrefs": { "displayPaymentPlanAvailable": true },
    "panelNotices": [
      {
        "code": "payment_plan_available",
        "variant": "info",
        "icon": "credit-card",
        "title": "Payment Plans Available",
        "description": "Split your purchase into installments at checkout.",
        "priority": 50
      }
    ]
  }
}
```

**Note**: Banner renders only when server sends notice (not auto-generated from prefs flag).

---

## Notes & Rationale Alignment

- Orthogonal axes and single clamp (`maxSelectable`) ensure no client math or contradictions.
- Messages are the sole row text channel; panel notices are the sole banner channel.
- Pricing is always server‑computed; client formats Dinero snapshots for display only.
- Gating zero‑leak prevents SKU leakage while enabling a tease mode (`visible_locked`) when explicitly chosen.
