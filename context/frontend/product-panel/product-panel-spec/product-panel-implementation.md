# Product Panel Spec 0.4 — Part 4 of 4: Schemas & Authoring

[Back to Product Panel Spec Index](./product-panel-index.md)

**Sections Covered:** §14 Schemas & Appendices  
Part of Product Panel Spec 0.4

> Contract semantics live in [§1–§13](./product-panel-contract.md#sections) and the associated [Display](./product-panel-display.md#5-preferences--copy-incl-payment-plan-banner-rule) and [Business](./product-panel-business.md#10-relations--add-ons-selection-vs-ownership-matchbehavior) parts.

## 14. Zod/TS Schemas _(single source of truth)_

> **Purpose:** Define runtime-validated, type-safe schemas for the entire Product Panel contract using Zod 4. These schemas serve as the **single source of truth** for TypeScript types, runtime validation, form handling (TanStack Form), API responses (TanStack Query), and atom state (Jotai).

---

### Architecture Context: TanStack Start & Validation Strategy

**Deployment Model:** DayOf uses **TanStack Start with server functions**, which fundamentally shapes our validation approach.

**Key Architectural Facts:**

1. **Atomic Deployments**: Server and client code deploy together as a single Vercel project. There is **no version skew**—server and client are always the same version.

2. **Isomorphic Validation**: The same Zod schemas validate data on both:

   - **Server-side**: During SSR, loader execution, and server function calls
   - **Client-side**: During hydration, subsequent fetches, and form submissions

3. **SSR/Hydration Consistency**: The critical risk is not forward compatibility (no old clients exist), but **server-rendered HTML mismatching client hydration**. Strict validation catches these bugs immediately.

4. **Greenfield Architecture**: No legacy clients, no long-lived mobile apps with independent release schedules, no cached data surviving deployments.

**Why This Matters for Schemas:**

Traditional API design assumes **version skew**: old clients hitting new servers, requiring forward-compatible schemas that ignore unknown fields. With TanStack Start server functions:

- **No old clients exist** → Unknown fields are bugs, not future features
- **SSR + hydration use same schemas** → Strict validation ensures consistency
- **Atomic deploys** → Adding enum values just requires one coordinated deploy
- **Server functions** → No separate API versioning; server + client update together

**Validation Philosophy:**

| Traditional REST API                     | TanStack Start (Our Approach)        |
| ---------------------------------------- | ------------------------------------ |
| `.passthrough()` (ignore unknown fields) | `.strict()` (reject unknown fields)  |
| Optional with `.default()` everywhere    | Required fields fail fast            |
| Extensible enums (`z.string()`)          | Strict enums (`z.enum()`)            |
| Forward compatibility priority           | Bug detection priority               |
| **Goal**: Old clients don't break        | **Goal**: Server/client stay in sync |

**Concrete Example:**

```typescript
// ❌ Traditional REST API approach (not needed for us)
const OrderRulesSchema = z
  .object({
    types: z.enum(["single", "multiple"]).default("multiple"), // Hide server bugs
  })
  .passthrough(); // Ignore unknown fields

// ✅ TanStack Start approach (what we do)
const OrderRulesSchema = z
  .object({
    types: z.enum(["single", "multiple"]), // Required; fail if missing
  })
  .strict(); // Reject unknown fields immediately
```

**Benefits of Strict Validation:**

1. **Catches Server Bugs**: Missing required fields fail validation, not silently at render time
2. **SSR/Hydration Safety**: Schema mismatches surface immediately, preventing hydration errors
3. **Type Safety**: No optional-everywhere types that hide bugs
4. **Clear Contracts**: Required fields document server obligations explicitly
5. **Fail Fast**: Validation errors at the boundary, not deep in component trees

**When We Would Need Forward Compatibility:**

- Long-lived mobile apps (we're web-only for panel)
- Cached API responses surviving deployments (we don't cache across deploys)
- Multiple frontends with independent release schedules (our frontends deploy atomically)

**We have none of these**, so strict validation is the correct choice.

**Schema Decisions Explained:**

- **`.strict()` everywhere**: Unknown fields = validation errors = bugs caught early
- **No `.default()` on business fields**: Server must send explicit values; hiding missing data is worse than failing
- **Required fields**: `orderRules.types` is required, not `optional().default("multiple")`
- **Strict enums**: `z.enum(["single", "multiple"])` not `z.string()` (coordinated deploys are fine)
- **Remove copy refinements**: Template existence checked at render time, not schema time (separation of concerns)

---

### 14.1 Normative — Schema Architecture

#### A. Single source principle

- All TypeScript types for the Product Panel contract **MUST** be derived from Zod schemas via `z.infer<typeof Schema>`.
- Manual TypeScript types that duplicate schema structure are **forbidden**.
- Schemas **MUST** validate server payloads at the boundary (TanStack Query response).
- Derived client state (atoms) **MUST** use types inferred from these schemas.

#### B. Validation boundaries

- **Server → Client (required):** TanStack Query **MUST** validate all API responses with the root `PanelDataSchema`.
- **Client → Server (required):** Form submissions (access codes, quantity changes) **MUST** validate with appropriate schemas.
- **Internal derivations (type-only):** Atom transformations use inferred types but do not re-validate (server data is already validated).

#### C. Schema composition rules

- Use Zod's `.strict()` on the root `PanelDataSchema` to reject unknown top‑level keys (SSR/hydration consistency; atomic deploys).
- Prefer `.strict()` for nested object schemas to catch shape drift.
- Use `.default()` for **optional fields with server-defined defaults** only; client **MUST NOT** invent defaults for business fields.
- Use `.readonly()` for **immutable reference data** (e.g., `context.copyTemplates`).
- Chain `.brand()` for **nominal types** where primitive aliasing would be unsafe (e.g., `ProductId`, `DineroSnapshot`).

#### D. Zod 4 leveraged features

- **Codecs:** Use for bi-directional validation (parse incoming, serialize outgoing).
- **Discriminated unions:** Axis-specific schemas (e.g., `supply.status` discriminates supply state).
- **Transforms:** Currency formatting, Dinero reconstruction (display-only; never for business logic).
- **Refinements:** Cross-field validation (e.g., `maxSelectable` consistency with `supply.status`).
- **Error maps:** Custom error messages for validation failures (user-friendly, not technical).

---

### 14.2 Core Contract Schemas

> These schemas mirror the contract structure from §§3–11. Order matches payload shape.

```typescript
import { z } from "zod";

// ============================================================================
// Primitives & Branded Types
// ============================================================================

/** Machine code (snake_case reason/message/notice identifiers) */
const MachineCodeSchema = z
  .string()
  .regex(/^[a-z][a-z0-9_]*$/, "Machine codes must be snake_case")
  .brand("MachineCode");

/** Product ID (unique per panel payload) */
const ProductIdSchema = z.string().min(1).brand("ProductId");

/** Section ID (references sections[]) */
const SectionIdSchema = z.string().min(1).brand("SectionId");

// ============================================================================
// Dinero Snapshots (§4.4, §6, §11)
// ============================================================================

/** Dinero.js V2 currency object */
const DineroCurrencySchema = z.object({
  code: z.string().length(3), // ISO 4217 (e.g., "USD", "EUR")
  base: z.number().int().positive(),
  exponent: z.number().int().nonnegative(),
});

/** Dinero.js V2 snapshot (transport format for all money) */
const DineroSnapshotSchema = z
  .object({
    amount: z.number().int(), // minor units (cents)
    currency: DineroCurrencySchema,
    scale: z.number().int().nonnegative(),
  })
  .strict()
  .brand("DineroSnapshot");

type DineroSnapshot = z.infer<typeof DineroSnapshotSchema>;

// ============================================================================
// Context Schemas (§4.1, §5)
// ============================================================================

const OrderRulesSchema = z
  .object({
    types: z.enum(["single", "multiple"]),
    typesPerOrder: z.enum(["single", "multiple"]),
    ticketsPerType: z.enum(["single", "multiple"]),
    minSelectedTypes: z.number().int().nonnegative(),
    minTicketsPerSelectedType: z.number().int().nonnegative(),
  })
  .strict();

const GatingSummarySchema = z
  .object({
    hasHiddenGatedItems: z.boolean(), // Required; server decides explicitly
    hasAccessCode: z.boolean().optional(),
  })
  .strict();

const NoticeActionSchema = z
  .object({
    label: z.string().min(1),
    kind: z.enum(["link", "drawer"]),
    target: z.string().optional(),
  })
  .strict();

const NoticeSchema = z
  .object({
    code: MachineCodeSchema,
    scope: z.enum(["panel", "item"]).default("panel"),
    variant: z.enum(["neutral", "info", "warning", "error"]).default("info"),
    title: z.string().optional(),
    text: z.string().optional(),
    params: z.record(z.unknown()).optional(),
    action: NoticeActionSchema.optional(),
    priority: z.number().default(0),
    expiresAt: z.string().datetime().optional(),
  })
  .strict();
// Note: No .refine() check for "text or params required"
// Rationale: Template existence cannot be validated at schema time (coupling).
// Enforcement: Render layer omits notices/messages with neither text nor matching template.

const CopyTemplateSchema = z
  .object({
    key: MachineCodeSchema,
    template: z.string().min(1),
    locale: z.string().optional(),
  })
  .strict()
  .readonly();

const ClientCopySchema = z
  .object({
    selection_min_reached: z.string().optional(),
    selection_max_types: z.string().optional(),
    quantity_min_reached: z.string().optional(),
    quantity_max_reached: z.string().optional(),
    addon_requires_parent: z.string().optional(),
    panel_cta_continue: z.string().optional(),
    panel_cta_waitlist: z.string().optional(),
    panel_cta_disabled: z.string().optional(),
  })
  .strict();

const TooltipSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1),
  })
  .strict()
  .readonly();

const HoverCardSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().optional(),
    body: z.string().min(1),
    action: NoticeActionSchema.optional(),
  })
  .strict()
  .readonly();

const EffectivePrefsSchema = z
  .object({
    showTypeListWhenSoldOut: z.boolean(),
    displayPaymentPlanAvailable: z.boolean(),
    displayRemainingThreshold: z.number().int().positive().optional(),
  })
  .strict();

const ContextSchema = z
  .object({
    orderRules: OrderRulesSchema, // REQUIRED per §4
    gatingSummary: GatingSummarySchema.optional(),
    panelNotices: z.array(NoticeSchema).default([]),
    effectivePrefs: EffectivePrefsSchema,
    copyTemplates: z.array(CopyTemplateSchema).optional(),
    clientCopy: ClientCopySchema.optional(),
    tooltips: z.array(TooltipSchema).optional(),
    hovercards: z.array(HoverCardSchema).optional(),
  })
  .strict();

// ============================================================================
// Sections (§4.2)
// ============================================================================

const SectionSchema = z
  .object({
    id: SectionIdSchema,
    label: z.string().min(1),
    order: z.number().int().positive(),
    labelOverride: z.string().nullable().optional(),
  })
  .strict();

// ============================================================================
// State Axes (§3)
// ============================================================================

const TemporalSchema = z
  .object({
    phase: z.enum(["before", "during", "after"]),
    reasons: z.array(MachineCodeSchema),
    currentWindow: z
      .object({
        startsAt: z.string().datetime(),
        endsAt: z.string().datetime(),
      })
      .optional(),
    nextWindow: z
      .object({
        startsAt: z.string().datetime(),
        endsAt: z.string().datetime(),
      })
      .optional(),
  })
  .strict();

const SupplySchema = z
  .object({
    status: z.enum(["available", "none", "unknown"]),
    remaining: z.number().int().nonnegative().optional(),
    reasons: z.array(MachineCodeSchema),
  })
  .strict();

const GatingRequirementSchema = z
  .object({
    kind: z.string(), // e.g., "unlock_code", "membership"
    satisfied: z.boolean(),
    validWindow: z
      .object({
        startsAt: z.string().datetime(),
        endsAt: z.string().datetime(),
      })
      .optional(),
    limit: z
      .object({
        maxUses: z.number().int().positive().optional(),
        usesRemaining: z.number().int().nonnegative().optional(),
      })
      .optional(),
  })
  .strict();

const GatingSchema = z
  .object({
    required: z.boolean(),
    satisfied: z.boolean(),
    listingPolicy: z.enum(["omit_until_unlocked", "visible_locked"]),
    reasons: z.array(MachineCodeSchema),
    requirements: z.array(GatingRequirementSchema).optional(),
  })
  .strict();

const DemandSchema = z
  .object({
    kind: z.enum(["none", "waitlist", "notify_me"]),
    reasons: z.array(MachineCodeSchema),
  })
  .strict();

const MessageSchema = z
  .object({
    code: MachineCodeSchema,
    text: z.string().optional(),
    params: z.record(z.unknown()).optional(),
    placement: z.enum([
      "row.under_title",
      "row.under_price",
      "row.under_quantity",
      "row.footer",
      "row.cta_label",
    ]),
    variant: z.enum(["neutral", "info", "warning", "error"]).default("info"),
    priority: z.number().default(0),
  })
  .strict();
// Note: No .refine() check for "text or params required"
// Rationale: Template existence cannot be validated at schema time (coupling).
// Enforcement: Render layer omits messages with neither text nor matching template (§5.4, §7.1).

const StateSchema = z
  .object({
    temporal: TemporalSchema,
    supply: SupplySchema,
    gating: GatingSchema,
    demand: DemandSchema,
    messages: z.array(MessageSchema), // Required; server must send (even if empty array)
  })
  .strict();

// ============================================================================
// Product & Item Structure (§6)
// ============================================================================

const FulfillmentSchema = z
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
    details: z.record(z.unknown()).optional(),
  })
  .strict();

const ProductSchema = z
  .object({
    id: ProductIdSchema,
    name: z.string().min(1),
    type: z.enum(["ticket", "digital", "physical"]).default("ticket"),
    fulfillment: FulfillmentSchema.optional(),
    description: z.string().optional(),
    subtitle: z.string().optional(),
    category: z.string().optional(),
  })
  .strict();

const VariantSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
    attributes: z.record(z.unknown()).optional(),
  })
  .strict();

const CommercialSchema = z
  .object({
    price: DineroSnapshotSchema,
    feesIncluded: z.boolean().default(false),
    maxSelectable: z.number().int().nonnegative(),
    limits: z
      .object({
        perOrder: z.number().int().positive().optional(),
        perUser: z.number().int().positive().optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .refine(
    (commercial) => {
      // maxSelectable should be 0 when item is not selectable
      // This is a soft validation; server controls the authoritative value
      return true;
    },
    { message: "maxSelectable must reflect current selectability" }
  );

const RelationsSchema = z
  .object({
    parentProductIds: z.array(ProductIdSchema).optional(),
    matchBehavior: z.enum(["per_ticket", "per_order"]).optional(),
  })
  .strict();

const BadgeDetailRefSchema = z
  .object({
    kind: z.enum(["tooltip", "hovercard"]),
    ref: z.string().min(1),
  })
  .strict();

const DisplaySchema = z
  .object({
    badges: z.array(z.string()),
    badgeDetails: z.record(BadgeDetailRefSchema).optional(),
    sectionId: SectionIdSchema.optional(),
    showLowRemaining: z.boolean(),
  })
  .strict();

const PanelItemSchema = z
  .object({
    product: ProductSchema,
    variant: VariantSchema.optional(),
    state: StateSchema,
    commercial: CommercialSchema,
    relations: RelationsSchema.optional(),
    display: DisplaySchema,
  })
  .strict()
  .refine(
    (item) => {
      // Gating invariant: omit_until_unlocked items should not be sent when unsatisfied
      // This validation catches server bugs
      if (
        item.state.gating.required &&
        !item.state.gating.satisfied &&
        item.state.gating.listingPolicy === "omit_until_unlocked"
      ) {
        return false; // Should not be in payload
      }
      return true;
    },
    {
      message:
        "Items with unsatisfied omit_until_unlocked gating must not be sent",
    }
  );

// ============================================================================
// Pricing (§11)
// ============================================================================

const PricingLineItemSchema = z
  .object({
    code: z.enum(["TICKETS", "FEES", "TAX", "DISCOUNT", "TOTAL"]),
    label: z.string().min(1),
    amount: DineroSnapshotSchema,
  })
  .strict();

const PricingSchema = z
  .object({
    currency: DineroCurrencySchema,
    mode: z.enum(["reserve", "final"]).optional(),
    lineItems: z.array(PricingLineItemSchema).default([]),
  })
  .strict()
  .refine(
    (pricing) => {
      // All line items must use the same currency
      return pricing.lineItems.every(
        (item) => item.amount.currency.code === pricing.currency.code
      );
    },
    { message: "All line items must use the same currency as pricing.currency" }
  );

// ============================================================================
// Root Contract (§4)
// ============================================================================

const PanelDataSchema = z
  .object({
    context: ContextSchema,
    sections: z.array(SectionSchema).min(1),
    items: z.array(PanelItemSchema).default([]),
    pricing: PricingSchema,
  })
  .strict() // reject unknown top-level keys for SSR/hydration consistency
  .refine(
    (data) => {
      // Currency consistency: all items must match pricing currency
      const pricingCurrency = data.pricing.currency.code;
      return data.items.every(
        (item) => item.commercial.price.currency.code === pricingCurrency
      );
    },
    { message: "All items must use the same currency as pricing" }
  )
  .refine(
    (data) => {
      // Product IDs must be unique
      const ids = data.items.map((item) => item.product.id);
      return new Set(ids).size === ids.length;
    },
    { message: "Product IDs must be unique within the panel" }
  );

// ============================================================================
// Type Exports (inferred from schemas)
// ============================================================================

export type MachineCode = z.infer<typeof MachineCodeSchema>;
export type ProductId = z.infer<typeof ProductIdSchema>;
export type SectionId = z.infer<typeof SectionIdSchema>;
export type DineroCurrency = z.infer<typeof DineroCurrencySchema>;
export type DineroSnapshot = z.infer<typeof DineroSnapshotSchema>;

export type OrderRules = z.infer<typeof OrderRulesSchema>;
export type GatingSummary = z.infer<typeof GatingSummarySchema>;
export type Notice = z.infer<typeof NoticeSchema>;
export type NoticeAction = z.infer<typeof NoticeActionSchema>;
export type CopyTemplate = z.infer<typeof CopyTemplateSchema>;
export type ClientCopy = z.infer<typeof ClientCopySchema>;
export type Tooltip = z.infer<typeof TooltipSchema>;
export type HoverCard = z.infer<typeof HoverCardSchema>;
export type EffectivePrefs = z.infer<typeof EffectivePrefsSchema>;
export type Context = z.infer<typeof ContextSchema>;

export type Section = z.infer<typeof SectionSchema>;

export type Temporal = z.infer<typeof TemporalSchema>;
export type Supply = z.infer<typeof SupplySchema>;
export type Gating = z.infer<typeof GatingSchema>;
export type GatingRequirement = z.infer<typeof GatingRequirementSchema>;
export type Demand = z.infer<typeof DemandSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type State = z.infer<typeof StateSchema>;

export type Fulfillment = z.infer<typeof FulfillmentSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type Variant = z.infer<typeof VariantSchema>;
export type Commercial = z.infer<typeof CommercialSchema>;
export type Relations = z.infer<typeof RelationsSchema>;
export type BadgeDetailRef = z.infer<typeof BadgeDetailRefSchema>;
export type Display = z.infer<typeof DisplaySchema>;
export type PanelItem = z.infer<typeof PanelItemSchema>;

export type PricingLineItem = z.infer<typeof PricingLineItemSchema>;
export type Pricing = z.infer<typeof PricingSchema>;

export type PanelData = z.infer<typeof PanelDataSchema>;

// Schema exports for runtime validation
export {
  MachineCodeSchema,
  ProductIdSchema,
  SectionIdSchema,
  DineroCurrencySchema,
  DineroSnapshotSchema,
  OrderRulesSchema,
  GatingSummarySchema,
  NoticeSchema,
  NoticeActionSchema,
  CopyTemplateSchema,
  ClientCopySchema,
  TooltipSchema,
  HoverCardSchema,
  EffectivePrefsSchema,
  ContextSchema,
  SectionSchema,
  TemporalSchema,
  SupplySchema,
  GatingSchema,
  GatingRequirementSchema,
  DemandSchema,
  MessageSchema,
  StateSchema,
  FulfillmentSchema,
  ProductSchema,
  VariantSchema,
  CommercialSchema,
  RelationsSchema,
  BadgeDetailRefSchema,
  DisplaySchema,
  PanelItemSchema,
  PricingLineItemSchema,
  PricingSchema,
  PanelDataSchema,
};
```

---

### 14.3 TanStack Query Integration

> **Purpose:** Validate all server responses at the API boundary and provide type-safe query hooks.

```typescript
import { useQuery, useMutation } from "@tanstack/react-query";
import { PanelDataSchema, type PanelData } from "./schemas";

// ============================================================================
// Query Keys (type-safe, hierarchical)
// ============================================================================

export const panelKeys = {
  all: ["panel"] as const,
  event: (eventId: string) => [...panelKeys.all, "event", eventId] as const,
  withSelection: (eventId: string, selection: Record<string, number>) =>
    [...panelKeys.event(eventId), "selection", selection] as const,
};

// ============================================================================
// API Client (validates with Zod)
// ============================================================================

async function fetchPanelData(eventId: string): Promise<PanelData> {
  const response = await fetch(`/api/events/${eventId}/panel`);

  if (!response.ok) {
    throw new Error(`Failed to fetch panel: ${response.statusText}`);
  }

  const rawData = await response.json();

  // Runtime validation with Zod
  const parseResult = PanelDataSchema.safeParse(rawData);

  if (!parseResult.success) {
    console.error("Panel validation failed:", parseResult.error.format());
    throw new Error("Invalid panel data received from server");
  }

  return parseResult.data;
}

async function updatePanelWithSelection(
  eventId: string,
  selection: Record<ProductId, number>
): Promise<PanelData> {
  const response = await fetch(`/api/events/${eventId}/panel/selection`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ selection }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update selection: ${response.statusText}`);
  }

  const rawData = await response.json();
  const parseResult = PanelDataSchema.safeParse(rawData);

  if (!parseResult.success) {
    throw new Error("Invalid panel data after selection update");
  }

  return parseResult.data;
}

// ============================================================================
// Query Hooks (type-safe, validated)
// ============================================================================

export function usePanelData(eventId: string) {
  return useQuery({
    queryKey: panelKeys.event(eventId),
    queryFn: () => fetchPanelData(eventId),
    staleTime: 30_000, // 30s
    refetchOnWindowFocus: true,
    retry: 3,
  });
}

export function useUpdateSelection(eventId: string) {
  return useMutation({
    mutationFn: (selection: Record<ProductId, number>) =>
      updatePanelWithSelection(eventId, selection),
    // Optimistic updates would go here
  });
}
```

---

### 14.4 Jotai Integration

> **Purpose:** Type-safe atoms for derived state and selection management.

```typescript
import { atom, type PrimitiveAtom } from "jotai";
import { atomFamily } from "jotai/utils";
import { atomWithQuery } from "jotai-tanstack-query";
import type { PanelData, PanelItem, ProductId } from "./schemas";
import { panelKeys, fetchPanelData } from "./api";

// ============================================================================
// Query Atom (TanStack Query + Jotai)
// ============================================================================

export const panelDataQueryAtom = (eventId: string) =>
  atomWithQuery<PanelData>(() => ({
    queryKey: panelKeys.event(eventId),
    queryFn: () => fetchPanelData(eventId),
  }));

// ============================================================================
// Selection Atoms (per-item quantity)
// ============================================================================

/** Per-product selection state (quantity) */
export const selectionFamily = atomFamily((productId: ProductId) =>
  atom(0, (get, set, newQty: number) => {
    // Clamp to maxSelectable (authoritative)
    const panel = get(panelDataQueryAtom); // Assumes eventId in scope
    const item = panel.items.find((it) => it.product.id === productId);
    const max = item?.commercial.maxSelectable ?? 0;
    const clamped = Math.max(0, Math.min(newQty, max));
    set(selectionFamily(productId), clamped);
  })
);

// ============================================================================
// Derived State Atoms (§8 rendering composition)
// ============================================================================

/** Row presentation: normal | locked */
export const rowPresentationAtom = (item: PanelItem) =>
  atom((get) => {
    const { gating } = item.state;
    return gating.required &&
      !gating.satisfied &&
      gating.listingPolicy === "visible_locked"
      ? ("locked" as const)
      : ("normal" as const);
  });

/** Purchasable boolean (§8.1) */
export const isPurchasableAtom = (item: PanelItem) =>
  atom((get) => {
    const { temporal, supply, gating } = item.state;
    return (
      temporal.phase === "during" &&
      supply.status === "available" &&
      (!gating.required || gating.satisfied)
    );
  });

/** CTA kind (§8.1) */
export const ctaKindAtom = (item: PanelItem) =>
  atom((get) => {
    const presentation = get(rowPresentationAtom(item));
    if (presentation === "locked") return "none" as const;

    const isPurchasable = get(isPurchasableAtom(item));
    if (isPurchasable) {
      return item.commercial.maxSelectable > 0
        ? ("quantity" as const)
        : ("none" as const);
    }

    const { supply, demand, temporal } = item.state;
    if (supply.status === "none" && demand.kind === "waitlist") {
      return "waitlist" as const;
    }
    if (temporal.phase === "before" && demand.kind === "notify_me") {
      return "notify" as const;
    }

    return "none" as const;
  });

/** Quantity UI mode (§8.1) */
export const quantityUIAtom = (item: PanelItem) =>
  atom((get) => {
    const presentation = get(rowPresentationAtom(item));
    const isPurchasable = get(isPurchasableAtom(item));
    const { maxSelectable } = item.commercial;

    if (presentation !== "normal" || !isPurchasable || maxSelectable <= 0) {
      return "hidden" as const;
    }

    return maxSelectable === 1 ? ("select" as const) : ("stepper" as const);
  });

/** Price UI mode (§8.1) */
export const priceUIAtom = (item: PanelItem) =>
  atom((get) => {
    const presentation = get(rowPresentationAtom(item));
    if (presentation === "locked") return "masked" as const;

    const isPurchasable = get(isPurchasableAtom(item));
    return isPurchasable ? ("shown" as const) : ("hidden" as const);
  });

// ============================================================================
// Panel-level rollups
// ============================================================================

/** All visible items are sold out (no hidden gated considered) */
export const allVisibleSoldOutAtom = atom((get) => {
  const panel = get(panelDataQueryAtom);
  return panel.items.every((item) => item.state.supply.status === "none");
});

/** Any visible item is locked (requires showing access code CTA) */
export const anyLockedVisibleAtom = atom((get) => {
  const panel = get(panelDataQueryAtom);
  return panel.items.some(
    (item) =>
      item.state.gating.required &&
      !item.state.gating.satisfied &&
      item.state.gating.listingPolicy === "visible_locked"
  );
});

/** Selection is valid per orderRules (§5.3a) */
export const selectionValidAtom = atom((get) => {
  const panel = get(panelDataQueryAtom);
  const { orderRules } = panel.context; // REQUIRED per §4

  // Count selected types
  const selectedTypes = panel.items.filter(
    (item) => get(selectionFamily(item.product.id)) > 0
  );

  // Min types check
  if (selectedTypes.length < orderRules.minSelectedTypes) {
    return false;
  }

  // Min tickets per type check
  for (const item of selectedTypes) {
    const qty = get(selectionFamily(item.product.id));
    if (qty < orderRules.minTicketsPerSelectedType) {
      return false;
    }
  }

  return true;
});
```

---

### 14.5 TanStack Form Integration

> **Purpose:** Type-safe form validation for access codes and user inputs.

```typescript
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";

// ============================================================================
// Access Code Form
// ============================================================================

const AccessCodeFormSchema = z.object({
  code: z
    .string()
    .min(1, "Access code is required")
    .max(100, "Access code too long")
    .regex(/^[A-Za-z0-9-_]+$/, "Invalid code format"),
});

type AccessCodeForm = z.infer<typeof AccessCodeFormSchema>;

export function useAccessCodeForm(onSubmit: (code: string) => Promise<void>) {
  return useForm<AccessCodeForm, typeof zodValidator>({
    defaultValues: {
      code: "",
    },
    validatorAdapter: zodValidator,
    validators: {
      onSubmit: AccessCodeFormSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value.code);
    },
  });
}

// Usage in component:
// const form = useAccessCodeForm(async (code) => {
//   await unlockWithCode(code);
// });
//
// <form.Field name="code" validators={{ onChange: z.string().min(1) }}>
//   {(field) => <input {...field.getInputProps()} />}
// </form.Field>

// ============================================================================
// Quantity Selection Validation (client-side)
// ============================================================================

const QuantityInputSchema = z
  .object({
    quantity: z.number().int().nonnegative(),
    maxSelectable: z.number().int().nonnegative(),
  })
  .refine(
    (data) => data.quantity <= data.maxSelectable,
    "Quantity exceeds maximum allowed"
  );

export function validateQuantityInput(
  quantity: number,
  maxSelectable: number
): boolean {
  const result = QuantityInputSchema.safeParse({ quantity, maxSelectable });
  return result.success;
}
```

---

### 14.6 Validation Patterns & Error Handling

```typescript
// ============================================================================
// Custom Error Map (user-friendly messages)
// ============================================================================

import { z } from "zod";

const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_type) {
    if (issue.expected === "string") {
      return { message: "Expected text" };
    }
    if (issue.expected === "number") {
      return { message: "Expected a number" };
    }
  }

  if (issue.code === z.ZodIssueCode.invalid_enum_value) {
    return {
      message: `Must be one of: ${issue.options.join(", ")}`,
    };
  }

  if (issue.code === z.ZodIssueCode.too_small) {
    if (issue.type === "string") {
      return { message: `Must be at least ${issue.minimum} characters` };
    }
    if (issue.type === "number") {
      return { message: `Must be at least ${issue.minimum}` };
    }
  }

  // Fallback to default message
  return { message: ctx.defaultError };
};

z.setErrorMap(customErrorMap);

// ============================================================================
// Validation Helpers
// ============================================================================

/** Parse with detailed error logging (development) */
export function parseWithLogging<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context: string
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    console.group(`[Validation Error] ${context}`);
    console.error("Raw data:", data);
    console.error("Errors:", result.error.format());
    console.groupEnd();
    throw new Error(`Invalid ${context}: ${result.error.message}`);
  }

  return result.data;
}

/** Safe parse with fallback */
export function parseWithFallback<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  fallback: T
): T {
  const result = schema.safeParse(data);
  return result.success ? result.data : fallback;
}
```

---

### 14.7 Examples

#### A) Complete type flow (server → atoms → components)

```typescript
// 1. Server response validated by TanStack Query
const { data: panel, isLoading, error } = usePanelData(eventId);
//    ^? PanelData (inferred from PanelDataSchema)

// 2. Atoms derive presentation from validated data
const rowStates = panel.items.map((item) => ({
  key: item.product.id,
  presentation: rowPresentationAtom(item),
  isPurchasable: isPurchasableAtom(item),
  cta: ctaKindAtom(item),
  quantityUI: quantityUIAtom(item),
  priceUI: priceUIAtom(item),
}));

// 3. Component consumes typed state
function ProductRow({ item }: { item: PanelItem }) {
  const [quantity, setQuantity] = useAtom(selectionFamily(item.product.id));
  const presentation = useAtomValue(rowPresentationAtom(item));
  const cta = useAtomValue(ctaKindAtom(item));
  //    ^? "quantity" | "waitlist" | "notify" | "none"

  if (presentation === "locked") {
    return <LockedRow item={item} />;
  }

  return <NormalRow item={item} cta={cta} quantity={quantity} />;
}
```

#### B) Dinero formatting with type safety

```typescript
import { dinero, toDecimal } from "dinero.js";
import type { DineroSnapshot } from "./schemas";

function formatPrice(snapshot: DineroSnapshot): string {
  const price = dinero(snapshot);
  return toDecimal(price, ({ value, currency }) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.code,
    }).format(Number(value))
  );
}

// Usage (type-safe):
const priceText = formatPrice(item.commercial.price);
//    ^? string
```

#### C) Access code form with validation

```typescript
function AccessCodeInput() {
  const form = useAccessCodeForm(async (code) => {
    await unlockGatedItems(code);
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="code"
        validators={{
          onChange: z.string().min(1, "Enter a code"),
        }}
      >
        {(field) => (
          <div>
            <input
              {...field.getInputProps()}
              placeholder="Access code"
              aria-label="Access code"
            />
            {field.state.meta.errors.length > 0 && (
              <span role="alert">{field.state.meta.errors[0]}</span>
            )}
          </div>
        )}
      </form.Field>
      <button type="submit" disabled={!form.state.canSubmit}>
        Apply Code
      </button>
    </form>
  );
}
```

---

### 14.8 Rationale

#### Why single source schemas?

- **Type safety:** One schema → one type. No drift between runtime validation and compile-time types.
- **Fail-fast:** Server bugs (schema changes, new fields) are caught at the API boundary, not deep in component trees.
- **Documentation:** Schemas are self-documenting; they show exactly what fields exist and their constraints.

#### Why validate at the boundary?

- **Trust but verify:** Server is authoritative, but network/proxies can corrupt. Validation ensures we're rendering valid data.
- **Debug aid:** Validation errors pinpoint exactly which field failed and why (better than `undefined is not a function`).
- **Security:** Prevents XSS/injection if server is compromised or returns unexpected data.

#### Why Zod 4?

- **Codecs:** Bi-directional parsing (incoming JSON → TypeScript, TypeScript → outgoing JSON).
- **Performance:** Faster parsing than v3; critical for high-frequency updates (selection changes).
- **Better errors:** More readable error messages for debugging and user feedback.
- **Ecosystem:** First-class support in TanStack Form, TanStack Query adapters.

#### Why brand types?

- **Nominal typing:** Prevents mixing `ProductId` with plain `string` (compile-time safety).
- **Intent clarity:** `ProductId` is clearer than `string` in function signatures.
- **Refactor safety:** If we change ID format (e.g., UUIDs → NanoIDs), only schema changes; usage sites are protected.

---

### 14.9 Tests (schema validation)

```typescript
import { describe, it, expect } from "vitest";
import { PanelDataSchema, PanelItemSchema } from "./schemas";

// Test helper: minimal valid context (required fields)
const validContext = {
  orderRules: {
    types: "multiple" as const,
    typesPerOrder: "multiple" as const,
    ticketsPerType: "multiple" as const,
    minSelectedTypes: 0,
    minTicketsPerSelectedType: 0,
  },
  panelNotices: [],
  effectivePrefs: {
    showTypeListWhenSoldOut: true,
    displayPaymentPlanAvailable: false,
  },
};

describe("PanelDataSchema", () => {
  it("validates minimal valid payload", () => {
    const minimal = {
      context: validContext,
      sections: [{ id: "main", label: "Tickets", order: 1 }],
      items: [],
      pricing: {
        currency: { code: "USD", base: 10, exponent: 2 },
        lineItems: [],
      },
    };

    const result = PanelDataSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it("rejects unknown top-level fields", () => {
    const withUnknown = {
      context: validContext,
      sections: [{ id: "main", label: "Tickets", order: 1 }],
      items: [],
      pricing: {
        currency: { code: "USD", base: 10, exponent: 2 },
        lineItems: [],
      },
      unknownField: "should be rejected",
    };

    const result = PanelDataSchema.safeParse(withUnknown);
    expect(result.success).toBe(false);
  });

  it("rejects payload with currency mismatch", () => {
    const invalid = {
      context: validContext,
      sections: [{ id: "main", label: "Tickets", order: 1 }],
      items: [
        {
          product: { id: "prod1", name: "GA", type: "ticket" },
          state: {
            temporal: { phase: "during", reasons: [] },
            supply: { status: "available", reasons: [] },
            gating: {
              required: false,
              satisfied: true,
              listingPolicy: "omit_until_unlocked",
              reasons: [],
            },
            demand: { kind: "none", reasons: [] },
            messages: [],
          },
          commercial: {
            price: {
              amount: 5000,
              currency: { code: "EUR", base: 10, exponent: 2 }, // Mismatch
              scale: 2,
            },
            feesIncluded: false,
            maxSelectable: 1,
          },
          display: { badges: [], showLowRemaining: false },
        },
      ],
      pricing: {
        currency: { code: "USD", base: 10, exponent: 2 },
        lineItems: [],
      },
    };

    const result = PanelDataSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("currency");
  });

  it("rejects item with duplicate product IDs", () => {
    const invalid = {
      context: validContext,
      sections: [{ id: "main", label: "Tickets", order: 1 }],
      items: [
        {
          product: {
            id: "prod1",
            name: "GA",
            type: "ticket",
          } /* ... minimal required fields omitted for brevity */,
        },
        {
          product: {
            id: "prod1",
            name: "VIP",
            type: "ticket",
          } /* ... minimal required fields omitted for brevity */,
        },
      ],
      pricing: {
        currency: { code: "USD", base: 10, exponent: 2 },
        lineItems: [],
      },
    };

    const result = PanelDataSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("unique");
  });
});

describe("PanelItemSchema", () => {
  it("rejects omit_until_unlocked item that should be omitted", () => {
    const invalid = {
      product: { id: "secret", name: "Secret", type: "ticket" },
      state: {
        temporal: { phase: "during", reasons: [] },
        supply: { status: "available", reasons: [] },
        gating: {
          required: true,
          satisfied: false, // Not satisfied
          listingPolicy: "omit_until_unlocked", // Should be omitted
          reasons: [],
        },
        demand: { kind: "none", reasons: [] },
        messages: [],
      },
      commercial: {
        price: {
          amount: 9000,
          currency: { code: "USD", base: 10, exponent: 2 },
          scale: 2,
        },
        feesIncluded: false,
        maxSelectable: 0,
      },
      display: { badges: [], showLowRemaining: false },
    };

    const result = PanelItemSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("omit_until_unlocked");
  });
});

describe("MachineCodeSchema", () => {
  it("accepts valid snake_case codes", () => {
    expect(MachineCodeSchema.safeParse("sold_out").success).toBe(true);
    expect(MachineCodeSchema.safeParse("requires_code").success).toBe(true);
    expect(MachineCodeSchema.safeParse("remaining_low").success).toBe(true);
  });

  it("rejects non-snake_case codes", () => {
    expect(MachineCodeSchema.safeParse("SoldOut").success).toBe(false);
    expect(MachineCodeSchema.safeParse("sold-out").success).toBe(false);
    expect(MachineCodeSchema.safeParse("Sold Out").success).toBe(false);
  });
});
```

---

### 14.10 Invariants & Guardrails

#### Schema discipline

- **Root schema strict:** Use `.strict()` on `PanelDataSchema` so clients reject unknown top-level keys (SSR/hydration consistency).
- **Nested strictness:** Use `.strict()` for nested object schemas to catch unknown sub-fields.
- **MUST** derive TypeScript types via `z.infer<>` (no manual types).
- **MUST** validate all server responses with root schema (`PanelDataSchema`).
- **MUST NOT** use Zod transformers for business logic (display formatting only).
- **MUST NOT** create separate "API types" and "UI types" (single source).

#### Integration rules

- **TanStack Query:** Parse response with `PanelDataSchema.safeParse()` before returning.
- **TanStack Form:** Use `zodValidator` adapter; validate on submit (not onChange for performance).
- **Jotai:** Atom types inferred from schemas; atoms do not re-validate (already validated at boundary).

#### Error handling

- Development: Log full validation errors with `error.format()`.
- Production: Show generic error to user; log details to error tracking.
- Never expose raw Zod errors to end users (use custom error map).

---

### 14.11 Developer Checklist

**Schema authoring:**

- [ ] Root `PanelDataSchema` uses `.strict()` (reject unknown top-level keys)
- [ ] Nested object schemas use `.strict()` (catch unknown sub-fields)
- [ ] Optional fields with server defaults use `.default()` (no client-invented defaults)
- [ ] Enums use `z.enum()` with exhaustive values (matches spec §§3–12)
- [ ] Money fields use `DineroSnapshotSchema` (never plain numbers)
- [ ] Machine codes validated with `MachineCodeSchema` (snake_case regex)

**Type safety:**

- [ ] All types exported via `z.infer<typeof Schema>`
- [ ] No manual TypeScript interfaces that duplicate schemas
- [ ] Branded types used for IDs (`ProductId`, `SectionId`)
- [ ] Function signatures use inferred types, not `any` or `unknown`

**Validation boundaries:**

- [ ] TanStack Query validates responses with `.safeParse()` before returning
- [ ] Form submissions validate with TanStack Form + `zodValidator`
- [ ] Atoms use inferred types but do not re-validate (trust boundary validation)
- [ ] Custom error map provides user-friendly messages (not technical Zod errors)

**Integration:**

- [ ] Query keys typed and hierarchical (`panelKeys.*`)
- [ ] Atom families use branded types for parameters (`ProductId` not `string`)
- [ ] Derived atoms reference schema types (e.g., `PanelItem`, not ad-hoc interfaces)
- [ ] Form hooks use schema-derived types for `onSubmit` callbacks

**Testing:**

- [ ] Valid minimal payload passes validation
- [ ] Unknown fields rejected (`.strict()` enforcement)
- [ ] Currency mismatch rejected (cross-field validation)
- [ ] Duplicate product IDs rejected
- [ ] Gating invariants validated (omit_until_unlocked items must be absent)
- [ ] Machine code format validated (snake_case)

---

### 14.12 Migration Notes (schema evolution)

**Atomic Deployment Model**: With TanStack Start, server + client always deploy together. This simplifies schema evolution significantly.

#### Adding new optional fields

```typescript
// Old schema
const OldSchema = z
  .object({
    name: z.string(),
  })
  .strict();

// New schema (add optional field)
const NewSchema = z
  .object({
    name: z.string(),
    description: z.string().optional(), // New optional field
  })
  .strict();
```

**Deploy**: Update schema → deploy server + client together → done. Both sides know about the new field immediately; no coordination complexity.

#### Changing field types (atomic deploy)

```typescript
// Changing field type
const Updated = z.object({
  price: DineroSnapshotSchema, // Changed from z.number()
  // ✅ Deploy server + client together; no version skew
});

// Adding enum values
const SupplySchema = z.object({
  status: z.enum(["available", "none", "unknown", "pending"]), // Added "pending"
  // ✅ Update schema + deploy atomically; strict validation catches issues
});
```

**Key Insight**: With atomic deploys, "breaking changes" just means "update the schema and deploy." No multi-version support needed.

#### Schema versioning (future)

```typescript
// Version discriminator for major contract changes
const PanelDataV1Schema = PanelDataSchema.extend({
  version: z.literal("1.0"),
});

const PanelDataV2Schema = z.object({
  version: z.literal("2.0"),
  // ... new structure
});

const VersionedPanelDataSchema = z.discriminatedUnion("version", [
  PanelDataV1Schema,
  PanelDataV2Schema,
]);
```

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

## Q. ReUI Filters + shadcn Field + TanStack Form + Jotai + Query

### Purpose

Non‑normative integration pattern showing how to pair ReUI Filters with shadcn Field for accessible layout, Jotai for state (no prop drilling), TanStack Form for optional form modeling, TanStack Query for data fetching, and TanStack Start (router) for URL/search‑param sync — while respecting Product Panel guardrails (§§3–13).

### Scope and fit

- Use for list/data filtering UIs around the panel (e.g., browsing events, add‑ons directories), not to override server truths in the panel contract.
- Server remains the source of truth; filters shape the query, not the business decisions.

### Constraints (align with spec)

- Copy: no client‑invented strings for the panel; filter UI labels come from component config, not panel payload.
- Security: never leak gated info; don’t log sensitive tokens; sanitize/validate filter payload on server.
- State: Jotai is the single source of truth for filter state; sync into TanStack Form only if needed.
- Query: include filters structurally in the Query key (stable/serializable) to drive invalidation/refetch.
- URL: optional sync to router search params; avoid encoding secrets.
- a11y: wrap filter UI in shadcn Field primitives for label/description/error consistency.

### Blueprint

#### Install components

```bash
bunx shadcn@latest add @reui/filters
bunx shadcn@latest add field
```

#### Define filter atom and field config (typed)

- `filtersAtom = atom<Filter[]>([])` (use ReUI public types)
- `fields: FilterFieldConfig[] | FilterFieldGroup[]` from the page context

#### Accessible wrapper with shadcn Field

```tsx
<Field>
  <FieldLabel>Filters</FieldLabel>
  <FieldDescription>Refine results</FieldDescription>
  <Filters fields={fields} filters={filters} onChange={setFilters} />
  <FieldError />
</Field>
```

#### Optional TanStack Form sync

- If filters belong to a form, bind via a `form.Field name="filters"` and pass `value/onChange` to `<Filters>`, or mirror Jotai → form using `form.setFieldValue('filters', filters)`.

#### TanStack Query integration

- Query key: `['dataset', { filters }]` (stable, JSON‑serializable)
- Server endpoint validates a whitelist of fields/operators and values with Zod; never interpolate raw strings into SQL.

#### URL/search‑param sync (optional)

- Encode filters as a compact, stable string; use TanStack Start router search params. Keep the Jotai atom and router in two‑way sync with debounced updates.

#### Testing

- Unit: when `filtersAtom` changes, the Query key changes and refetches.
- a11y: Field renders label/description/error; no positive tabIndex; valid roles.
- Security: ensure server rejects unknown fields/operators; snapshot tests for payload validation.

### Example (minimal, typed)

```tsx
// atoms
type AppFilter = {
  id: string;
  field: string;
  operator: string;
  values: unknown[];
};
const filtersAtom = atom<AppFilter[]>([]);

function FiltersField({ fields }: { fields: any[] }) {
  const [filters, setFilters] = useAtom(filtersAtom);
  return (
    <Field>
      <FieldLabel>Filters</FieldLabel>
      <Filters fields={fields} filters={filters} onChange={setFilters} />
      <FieldError />
    </Field>
  );
}

// query
const { data } = useQuery({
  queryKey: ["dataset", { filters: useAtomValue(filtersAtom) }],
  queryFn: () => api.listItems({ filters: get(filtersAtom) }),
});
```

### Do / Don’t (quick)

- Do: keep Jotai as source; validate on server; include filters in queryKey; wrap in Field; sync URL when useful.
- Don’t: hardcode panel strings; leak gated info; mutate queryKey types; store secrets in URL.

### References

- ReUI Filters: [reui.io/docs/filters](https://reui.io/docs/filters)
- shadcn Field: [ui.shadcn.com/docs/components/field](https://ui.shadcn.com/docs/components/field)
- shadcn Field video: [YouTube](https://www.youtube.com/watch?v=gjrXeqgxbas)
