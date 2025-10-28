import * as z from 'zod';
import {
  DineroCurrencySchema,
  DineroSnapshotSchema,
} from '@/lib/schemas/money';

export const PricingLineItemSchema = z
  .object({
    code: z.enum(['TICKETS', 'FEES', 'TAX', 'DISCOUNT', 'TOTAL']),
    label: z.string().min(1),
    amount: DineroSnapshotSchema,
  })
  .strict();

export const PricingSchema = z
  .object({
    currency: DineroCurrencySchema,
    mode: z.enum(['reserve', 'final']).optional(),
    lineItems: z.array(PricingLineItemSchema).default([]),
  })
  .strict()
  .refine(
    (pricing) => {
      return pricing.lineItems.every(
        (item) => item.amount.currency.code === pricing.currency.code
      );
    },
    {
      message: 'All line items must use the same currency as pricing.currency',
    }
  );

export type PricingLineItem = z.infer<typeof PricingLineItemSchema>;
export type Pricing = z.infer<typeof PricingSchema>;
