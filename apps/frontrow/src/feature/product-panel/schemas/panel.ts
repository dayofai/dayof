import * as z from 'zod';
import { ContextSchema } from './context';
import { PanelItemSchema } from './item';
import { PricingSchema } from './pricing';
import { SectionSchema } from './sections';

export const PanelDataSchema = z
  .object({
    context: ContextSchema,
    sections: z.array(SectionSchema).min(1),
    items: z.array(PanelItemSchema).default([]),
    pricing: PricingSchema,
  })
  .strict()
  .refine(
    (data) => {
      const pricingCurrency = data.pricing.currency.code;
      return data.items.every(
        (item) => item.commercial.price.currency.code === pricingCurrency
      );
    },
    { message: 'All items must use the same currency as pricing' }
  )
  .refine(
    (data) => {
      const ids = data.items.map((item) => item.product.id);
      return new Set(ids).size === ids.length;
    },
    { message: 'Product IDs must be unique within the panel' }
  );

export type PanelData = z.infer<typeof PanelDataSchema>;
