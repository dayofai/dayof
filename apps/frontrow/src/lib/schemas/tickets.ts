import * as z from 'zod';

const dineroSchema = z.object({
  amount: z.number().int().nonnegative(),
  currency: z.string(),
});

const ticketPricingSchema = z.object({
  ticket: dineroSchema,
  strikePrice: dineroSchema.optional(),
  fees: z
    .object({
      amount: dineroSchema,
      included: z.boolean(),
      showBreakdown: z.boolean().optional(),
      label: z.string().optional(),
    })
    .optional(),
  tax: z
    .object({
      amount: dineroSchema,
      included: z.boolean(),
      showBreakdown: z.boolean().optional(),
      label: z.string().optional(),
    })
    .optional(),
});

export const ticketSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  pricing: ticketPricingSchema,
  status: z.enum([
    'on_sale',
    'scheduled',
    'sold_out',
    'waitlist',
    'ended',
    'hidden',
    'paused',
    'invite_only',
    'external',
  ]),
  availabilityLabel: z.string().optional(),
  salesWindow: z
    .object({
      startsAt: z.iso.datetime().optional(),
      endsAt: z.iso.datetime().optional(),
    })
    .optional(),
  limits: z
    .object({
      minPerOrder: z.number().int().positive().optional(),
      maxPerOrder: z.number().int().positive().optional(),
      maxPerPerson: z.number().int().positive().optional(),
    })
    .optional(),
  soldLimit: z.union([z.number().int().nonnegative(), z.literal('unlimited')]),
  soldCount: z.number().int().nonnegative().optional(),
  allowOversell: z.boolean().optional(),
  oversellBuffer: z.number().int().nonnegative().optional(),
  sortOrder: z.number().int().optional(),
  featured: z.boolean().optional(),
  badges: z
    .array(z.enum(['new', 'limited', 'best_value', 'sold_out', 'members_only']))
    .optional(),
  requiresCode: z.boolean().optional(),
  visibility: z.enum(['public', 'unlisted', 'hidden']).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.iso.datetime().optional(),
});

export type Ticket = z.output<typeof ticketSchema>;
export type TicketInput = z.input<typeof ticketSchema>;
