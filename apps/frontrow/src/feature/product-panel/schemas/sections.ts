import * as z from 'zod';
import { SectionIdSchema } from './primitives';

export const SectionSchema = z
  .object({
    id: SectionIdSchema,
    label: z.string().min(1),
    order: z.number().int().positive(),
    labelOverride: z.string().nullable().optional(),
  })
  .strict();

export type Section = z.infer<typeof SectionSchema>;
