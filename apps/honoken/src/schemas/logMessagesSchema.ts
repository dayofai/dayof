import { z } from "zod/v4";

export const LogMessagesBodySchema = z.object({
  logs: z.array(z.string().min(1, { error: "Log message cannot be empty." }))
         .min(1, { error: "Logs array cannot be empty." })
});

export type LogMessagesPayload = z.infer<typeof LogMessagesBodySchema>;