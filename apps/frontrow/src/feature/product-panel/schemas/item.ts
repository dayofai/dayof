import * as z from 'zod';
import { DineroSnapshotSchema } from '@/lib/schemas/money';
import { ProductIdSchema, SectionIdSchema } from './primitives';
import { StateSchema } from './state';

export const FulfillmentSchema = z
  .object({
    methods: z.array(
      z.enum([
        'eticket',
        'apple_pass',
        'will_call',
        'physical_mail',
        'shipping',
        'nfc',
      ])
    ),
    details: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const ProductSchema = z
  .object({
    id: ProductIdSchema,
    name: z.string().min(1),
    type: z.enum(['ticket', 'digital', 'physical']),
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
    attributes: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const CommercialSchema = z
  .object({
    price: DineroSnapshotSchema,
    feesIncluded: z.boolean(),
    maxSelectable: z.number().int().nonnegative(),
    limits: z
      .object({
        perOrder: z.number().int().positive().optional(),
        perUser: z.number().int().positive().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const RelationsSchema = z
  .object({
    parentProductIds: z.array(ProductIdSchema).min(1),
    displayMode: z.enum(['nested', 'section']),
    constraint: z.enum(['match_parent', 'optional', 'independent']),
    minQuantity: z.number().int().positive().optional(),
  })
  .strict()
  .refine(
    (rel) => {
      if (rel.minQuantity !== undefined && rel.constraint === 'match_parent') {
        return false;
      }
      return true;
    },
    { message: 'minQuantity cannot be used with match_parent constraint' }
  );

export const BadgeDetailRefSchema = z
  .object({
    kind: z.enum(['tooltip', 'hovercard']),
    ref: z.string().min(1),
  })
  .strict();

export const DisplaySchema = z
  .object({
    badges: z.array(z.string()),
    badgeDetails: z.record(z.string(), BadgeDetailRefSchema).optional(),
    sectionId: SectionIdSchema.optional(),
    showLowRemaining: z.boolean(),
  })
  .strict();

export const PanelItemSchema = z
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
      if (
        item.state.gating.required &&
        !item.state.gating.satisfied &&
        item.state.gating.listingPolicy === 'omit_until_unlocked'
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        'Items with unsatisfied omit_until_unlocked gating must not be sent',
    }
  );

export type Fulfillment = z.infer<typeof FulfillmentSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type Variant = z.infer<typeof VariantSchema>;
export type Commercial = z.infer<typeof CommercialSchema>;
export type Relations = z.infer<typeof RelationsSchema>;
export type BadgeDetailRef = z.infer<typeof BadgeDetailRefSchema>;
export type Display = z.infer<typeof DisplaySchema>;
export type PanelItem = z.infer<typeof PanelItemSchema>;
