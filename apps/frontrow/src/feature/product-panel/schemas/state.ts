import * as z from 'zod';
import { MachineCodeSchema } from './primitives';

export const TemporalSchema = z
  .object({
    phase: z.enum(['before', 'during', 'after']),
    reasons: z.array(MachineCodeSchema),
    currentWindow: z
      .object({
        startsAt: z.string().datetime({ offset: true }),
        endsAt: z.string().datetime({ offset: true }),
      })
      .optional(),
    nextWindow: z
      .object({
        startsAt: z.string().datetime({ offset: true }),
        endsAt: z.string().datetime({ offset: true }),
      })
      .optional(),
  })
  .strict();

export const SupplySchema = z
  .object({
    status: z.enum(['available', 'none', 'unknown']),
    remaining: z.number().int().nonnegative().optional(),
    reasons: z.array(MachineCodeSchema),
  })
  .strict();

export const GatingRequirementSchema = z
  .object({
    kind: z.string(),
    satisfied: z.boolean(),
    validWindow: z
      .object({
        startsAt: z.string().datetime({ offset: true }),
        endsAt: z.string().datetime({ offset: true }),
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

export const GatingSchema = z
  .object({
    required: z.boolean(),
    satisfied: z.boolean(),
    listingPolicy: z.enum(['omit_until_unlocked', 'visible_locked']),
    reasons: z.array(MachineCodeSchema),
    requirements: z.array(GatingRequirementSchema).optional(),
  })
  .strict();

export const DemandSchema = z
  .object({
    kind: z.enum(['none', 'waitlist', 'notify_me']),
    reasons: z.array(MachineCodeSchema),
  })
  .strict();

export const MessageSchema = z
  .object({
    code: MachineCodeSchema,
    text: z.string().optional(),
    params: z.record(z.string(), z.unknown()).optional(),
    placement: z.enum([
      'row.under_title',
      'row.under_price',
      'row.under_quantity',
      'row.footer',
      'row.cta_label',
    ]),
    variant: z.enum(['neutral', 'info', 'warning', 'error']).default('info'),
    priority: z.number().default(0),
  })
  .strict();

export const StateSchema = z
  .object({
    temporal: TemporalSchema,
    supply: SupplySchema,
    gating: GatingSchema,
    demand: DemandSchema,
    messages: z.array(MessageSchema),
  })
  .strict();

export type Temporal = z.infer<typeof TemporalSchema>;
export type Supply = z.infer<typeof SupplySchema>;
export type GatingRequirement = z.infer<typeof GatingRequirementSchema>;
export type Gating = z.infer<typeof GatingSchema>;
export type Demand = z.infer<typeof DemandSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type State = z.infer<typeof StateSchema>;
