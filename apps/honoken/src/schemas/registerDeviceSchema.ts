import { z } from 'zod';

export const RegisterDeviceBodySchema = z.object({
  pushToken: z.string().min(1, { message: 'Push token cannot be empty.' }),
});

export type RegisterDevicePayload = z.infer<typeof RegisterDeviceBodySchema>;
