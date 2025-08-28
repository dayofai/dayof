import { z } from "zod/v4";

export const RegisterDeviceBodySchema = z.object({
  pushToken: z.string().min(1, { error: "Push token cannot be empty." })
});

export type RegisterDevicePayload = z.infer<typeof RegisterDeviceBodySchema>;