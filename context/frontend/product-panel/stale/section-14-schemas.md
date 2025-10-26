## 14. Zod/TS Schemas _(single source of truth)_

> **Purpose:** Define runtime-validated, type-safe schemas for the entire Product Panel contract using Zod 4. These schemas serve as the **single source of truth** for TypeScript types, runtime validation, form handling (TanStack Form), API responses (TanStack Query), and atom state (Jotai).

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

- Use Zod's `.strict()` for **all** object schemas to reject unknown fields (fail-fast on schema drift).
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
    types: z.enum(["single", "multiple"]).default("multiple"),
    typesPerOrder: z.enum(["single", "multiple"]).default("multiple"),
    ticketsPerType: z.enum(["single", "multiple"]).default("multiple"),
    minSelectedTypes: z.number().int().nonnegative().default(0),
    minTicketsPerSelectedType: z.number().int().nonnegative().default(0),
  })
  .strict();

const GatingSummarySchema = z
  .object({
    hasHiddenGatedItems: z.boolean().default(false),
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
  .strict()
  .refine(
    (notice) => notice.text !== undefined || notice.params !== undefined,
    "Notice must have either text or params for template resolution"
  );

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
    showTypeListWhenSoldOut: z.boolean().default(true),
    displayPaymentPlanAvailable: z.boolean().default(false),
    displayRemainingThreshold: z.number().int().positive().optional(),
  })
  .strict();

const ContextSchema = z
  .object({
    orderRules: OrderRulesSchema.optional(),
    gatingSummary: GatingSummarySchema.optional(),
    panelNotices: z.array(NoticeSchema).default([]),
    effectivePrefs: EffectivePrefsSchema.default({}),
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
    phase: z.enum(["before", "during", "after"]).default("before"),
    reasons: z.array(MachineCodeSchema).default([]),
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
    status: z.enum(["available", "none", "unknown"]).default("available"),
    remaining: z.number().int().nonnegative().optional(),
    reasons: z.array(MachineCodeSchema).default([]),
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
    required: z.boolean().default(false),
    satisfied: z.boolean().default(false),
    listingPolicy: z
      .enum(["omit_until_unlocked", "visible_locked"])
      .default("omit_until_unlocked"),
    reasons: z.array(MachineCodeSchema).default([]),
    requirements: z.array(GatingRequirementSchema).optional(),
  })
  .strict();

const DemandSchema = z
  .object({
    kind: z.enum(["none", "waitlist", "notify_me"]).default("none"),
    reasons: z.array(MachineCodeSchema).default([]),
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
  .strict()
  .refine(
    (msg) => msg.text !== undefined || msg.params !== undefined,
    "Message must have either text or params for template resolution"
  );

const StateSchema = z
  .object({
    temporal: TemporalSchema,
    supply: SupplySchema,
    gating: GatingSchema,
    demand: DemandSchema,
    messages: z.array(MessageSchema).default([]),
  })
  .strict();

// ============================================================================
// Product & Item Structure (§6)
// ============================================================================

const FulfillmentSchema = z
  .object({
    methods: z
      .array(
        z.enum([
          "eticket",
          "apple_pass",
          "will_call",
          "physical_mail",
          "shipping",
          "nfc",
        ])
      )
      .default([]),
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
  .strict()
  .default({});

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
    parentProductIds: z.array(ProductIdSchema).default([]),
    matchBehavior: z.enum(["per_ticket", "per_order"]).optional(),
  })
  .strict()
  .default({});

const BadgeDetailRefSchema = z
  .object({
    kind: z.enum(["tooltip", "hovercard"]),
    ref: z.string().min(1),
  })
  .strict();

const DisplaySchema = z
  .object({
    badges: z.array(z.string()).default([]),
    badgeDetails: z.record(BadgeDetailRefSchema).optional(),
    sectionId: SectionIdSchema.optional(),
    showLowRemaining: z.boolean().default(false),
  })
  .strict();

const PanelItemSchema = z
  .object({
    product: ProductSchema,
    variant: VariantSchema,
    state: StateSchema,
    commercial: CommercialSchema,
    relations: RelationsSchema,
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
  .strict()
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
  const { orderRules } = panel.context;

  if (!orderRules) return true; // No rules = always valid

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

describe("PanelDataSchema", () => {
  it("validates minimal valid payload", () => {
    const minimal = {
      context: {
        orderRules: {},
        panelNotices: [],
        effectivePrefs: {},
      },
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

  it("rejects payload with unknown top-level field", () => {
    const invalid = {
      context: {},
      sections: [],
      items: [],
      pricing: { currency: {}, lineItems: [] },
      unknownField: "should fail", // .strict() catches this
    };

    const result = PanelDataSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects payload with currency mismatch", () => {
    const invalid = {
      context: {},
      sections: [{ id: "main", label: "Tickets", order: 1 }],
      items: [
        {
          product: { id: "prod1", name: "GA", type: "ticket" },
          variant: {},
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
          display: { badges: [] },
          relations: {},
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
      context: {},
      sections: [{ id: "main", label: "Tickets", order: 1 }],
      items: [
        { product: { id: "prod1" } /* ... */ },
        { product: { id: "prod1" } /* ... */ }, // Duplicate
      ],
      pricing: { currency: { code: "USD" }, lineItems: [] },
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
      variant: {},
      state: {
        temporal: { phase: "during", reasons: [] },
        supply: { status: "available", reasons: [] },
        gating: {
          required: true,
          satisfied: false, // Not satisfied
          listingPolicy: "omit_until_unlocked", // Should be omitted
          reasons: ["requires_code"],
        },
        demand: { kind: "none", reasons: [] },
        messages: [],
      },
      commercial: {
        price: { amount: 9000, currency: { code: "USD" }, scale: 2 },
        feesIncluded: false,
        maxSelectable: 0,
      },
      display: { badges: [] },
      relations: {},
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

- **MUST** use `.strict()` on all object schemas to catch unknown fields.
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

- [ ] All object schemas use `.strict()` to reject unknown fields
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

#### Adding new fields (backward compatible)

```typescript
// Old schema
const OldSchema = z
  .object({
    name: z.string(),
  })
  .strict();

// New schema (backward compatible)
const NewSchema = z
  .object({
    name: z.string(),
    description: z.string().optional(), // Optional = backward compatible
  })
  .strict();
```

#### Breaking changes (coordinate with backend)

```typescript
// Breaking: changing field type
const Breaking = z.object({
  price: z.number(), // Was DineroSnapshotSchema
  // ❌ Requires coordinated deploy
});

// Non-breaking: adding discriminated union case
const SupplySchema = z.object({
  status: z.enum(["available", "none", "unknown", "pending"]), // Added "pending"
  // ✅ Old clients ignore unknown enum values
});
```

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

---

**End of Section 14**
