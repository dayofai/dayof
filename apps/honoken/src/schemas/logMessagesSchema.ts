import { z } from 'zod';

export const LogMessagesBodySchema = z.object({
  logs: z
    .array(z.string().min(1, { message: 'Log message cannot be empty.' }))
    .min(1, { message: 'Logs array cannot be empty.' }),
});

export type LogMessagesPayload = z.infer<typeof LogMessagesBodySchema>;
