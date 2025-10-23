// src/contract/schemas.ts
// zod v4 schema for ProductPanel Payload — v0.2 (Event Page)
import * as z from 'zod';

// ---- Basic types ----
export const MoneySchema = z.object({
  amount: z.number().int().nonnegative(),
  currency: z.string().min(1),
});

// price block (no arithmetic here)
export const PriceSchema = z
  .object({
    mode: z.enum(['fixed', 'free', 'donation']),
    amount: z.number().int().nonnegative().optional(),
    currency: z.string().min(1).optional(),
    caption: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.mode !== 'free') {
      if (val.amount == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['amount'],
          message: 'amount required for fixed/donation',
        });
      }
      if (!val.currency) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['currency'],
          message: 'currency required for fixed/donation',
        });
      }
    }
  });

// ---- 0) Conventions & Non-goals ----
// Already described in contract; enforced where useful via schema

// ---- 1) Top-level object ----
export const EffectivePrefsSchema = z.object({
  displayRemainingThreshold: z.number().int().nonnegative().default(10),
  showFeesNote: z.boolean().default(true),
  showTypeListWhenSoldOut: z.boolean().default(true),
  hideZeroInventoryVariants: z.boolean().default(false),
  ctaLabelOverrides: z.record(z.string(), z.string()).default({}),
});

export const ContextSchema = z.object({
  eventId: z.string().min(1),
  displayTimezone: z.string().min(1), // IANA; no validation here
  locale: z.string().min(2),
  effectivePrefs: EffectivePrefsSchema,
});

export const AxesSchema = z
  .object({
    types: z.enum(['single', 'multiple']),
    typesPerOrder: z.enum(['single', 'multiple']),
    ticketsPerType: z.enum(['single', 'multiple']),
  })
  .partial()
  .optional();

export const SectionIdSchema = z.string().min(1); // e.g., "primary", "addons"

export const SectionSchema = z.object({
  id: SectionIdSchema,
  label: z.string().min(1),
  order: z.number().int(),
  labelOverride: z.string().nullable(),
});

// ---- 2) PanelItem ----
export const ProductSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['ticket', 'addon', 'physical', 'digital', 'subscription']),
  name: z.string().min(1),
  description: z.string().optional(),
  capabilities: z.object({
    timeBound: z.boolean(),
    supportsWaitlist: z.boolean(),
    supportsBackorder: z.boolean(),
    shipRequired: z.boolean(),
    subscription: z.boolean(),
  }),
  variantDifferentiators: z.array(z.string()).default([]),
});

export const VariantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  variantAttributes: z.record(z.string(), z.unknown()).default({}),
  price: PriceSchema,
  visibilityWhenGated: z.enum(['visible', 'hidden']).default('visible'),
});

export const CommercialSchema = z.object({
  status: z.enum([
    'available',
    'approvalRequired',
    'outOfStock',
    'notOnSale',
    'paused',
    'windowEnded',
    'expired',
  ]),
  reasons: z.array(z.string()).default([]),
  reasonTexts: z.record(z.string(), z.string()).default({}),
  demandCapture: z
    .enum(['none', 'waitlist', 'notifyMe', 'backorder'])
    .default('none'),
  limits: z
    .object({
      perVariant: z
        .union([z.literal('infinite'), z.number().int().nonnegative()])
        .default('infinite'),
      perUser: z.number().int().nonnegative().nullable().optional(),
      perOrder: z.number().int().nonnegative().nullable().optional(),
    })
    .default({ perVariant: 'infinite' }),
  remaining: z
    .object({
      inventory: z
        .union([
          z.literal('infinite'),
          z.number().int().nonnegative(),
          z.null(),
        ])
        .nullable()
        .optional(),
      perUser: z.number().int().nonnegative().nullable().optional(),
      perOrder: z.number().int().nonnegative().nullable().optional(),
    })
    .default({}),
  maxSelectable: z.number().int().nonnegative().default(0),
  schedule: z
    .object({
      currentWindow: z
        .object({
          startsAt: z.iso.datetime(),
          endsAt: z.iso.datetime().optional(),
          reasonCode: z.string().optional(),
        })
        .nullable()
        .optional(),
      nextWindow: z
        .object({
          startsAt: z.iso.datetime(),
          endsAt: z.iso.datetime().optional(),
          reasonCode: z.string().optional(),
        })
        .nullable()
        .optional(),
    })
    .default({}),
});

export const GateRequirementSchema = z.object({
  kind: z.enum(['access_code']), // future: add more
  satisfied: z.boolean(),
});

export const GatesSchema = z.object({
  logic: z.enum(['all', 'any']).default('all'),
  requirements: z.array(GateRequirementSchema).default([]),
  visibilityWhenGated: z.enum(['visible', 'hidden']).default('visible'),
});

export const RelationsSchema = z
  .object({
    requires: z
      .object({
        scope: z.enum(['selection', 'ownership']),
        anyOf: z.array(z.string()).default([]),
        allOf: z.array(z.string()).default([]),
      })
      .nullable()
      .optional(),
  })
  .default({});

export const DisplaySchema = z.object({
  placement: z.enum(['section', 'children']).default('section'),
  sectionId: SectionIdSchema.default('primary'),
  badges: z.array(z.string()).default([]),
  lowInventory: z.boolean().optional(),
});

export const UiHintsSchema = z.object({
  feesNote: z.string().optional(),
});

export const PanelItemSchema = z.object({
  product: ProductSchema,
  variant: VariantSchema,
  commercial: CommercialSchema,
  gates: GatesSchema,
  relations: RelationsSchema,
  display: DisplaySchema,
  uiHints: UiHintsSchema.optional(),
});

// ---- 7) Pricing (footer) ----
export const PricingLineSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('subtotal'), amount: MoneySchema }),
  z.object({ type: z.literal('fees'), amount: MoneySchema }),
  z.object({ type: z.literal('taxes'), amount: MoneySchema }),
  z.object({ type: z.literal('feesAndTaxes'), amount: MoneySchema }),
  z.object({ type: z.literal('total'), amount: MoneySchema }),
]);

export const PaymentPlanSchema = z.object({
  kind: z.enum(['installments', 'subscription']),
  deposit: MoneySchema.optional(),
  installments: z
    .object({
      count: z.number().int().positive(),
      perInstallment: MoneySchema,
      interval: z.enum(['day', 'week', 'month']),
      schedule: z
        .array(z.object({ dueAt: z.iso.datetime(), amount: MoneySchema }))
        .optional(),
    })
    .optional(),
});

export const PricingSummarySchema = z.object({
  mode: z.enum(['simple', 'detailed']).default('simple'),
  lines: z.array(PricingLineSchema),
  inclusions: z
    .object({ feesIncluded: z.boolean(), taxesIncluded: z.boolean() })
    .default({ feesIncluded: false, taxesIncluded: false }),
  paymentPlan: PaymentPlanSchema.optional(),
});

export const PricingSchema = z.object({
  showPriceSummary: z.boolean().default(false),
  summary: PricingSummarySchema.nullable().optional(),
});

export const ProductPanelPayloadSchema = z.object({
  context: ContextSchema,
  axes: AxesSchema,
  sections: z.array(SectionSchema),
  items: z.array(PanelItemSchema),
  pricing: PricingSchema,
});

export type Money = z.output<typeof MoneySchema>;
export type Price = z.output<typeof PriceSchema>;
export type EffectivePrefs = z.output<typeof EffectivePrefsSchema>;
export type Context = z.output<typeof ContextSchema>;
export type Axes = z.output<typeof AxesSchema>;
export type Section = z.output<typeof SectionSchema>;
export type Product = z.output<typeof ProductSchema>;
export type Variant = z.output<typeof VariantSchema>;
export type Commercial = z.output<typeof CommercialSchema>;
export type Gates = z.output<typeof GatesSchema>;
export type Relations = z.output<typeof RelationsSchema>;
export type Display = z.output<typeof DisplaySchema>;
export type UiHints = z.output<typeof UiHintsSchema>;
export type PanelItem = z.output<typeof PanelItemSchema>;
export type Pricing = z.output<typeof PricingSchema>;
export type PricingSummary = z.output<typeof PricingSummarySchema>;
export type ProductPanelPayload = z.output<typeof ProductPanelPayloadSchema>;
