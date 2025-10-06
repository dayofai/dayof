import * as z from 'zod';

export const eventSchema = z.object({
  id: z.string(),
  mixedTicketTypesAllowed: z.boolean(),
  currency: z.string(),
  timeZone: z.string(),
  venueUtcOffset: z
    .string()
    .regex(/^[+-]\d{2}:\d{2}$/)
    .optional(),
});

export type Event = z.output<typeof eventSchema>;
