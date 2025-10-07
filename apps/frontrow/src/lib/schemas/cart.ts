import * as z from 'zod';

export const cartItemSchema = z.object({
  ticketId: z.string(),
  qty: z.number().int().min(0),
});

export type CartItem = z.output<typeof cartItemSchema>;
export type CartItemInput = z.input<typeof cartItemSchema>;
