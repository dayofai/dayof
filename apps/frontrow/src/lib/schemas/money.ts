import * as z from 'zod';

/**
 * Dinero.js V2 currency object (ISO 4217 compliant)
 *
 * @see https://dinerojs.com/docs/core-concepts/currencies
 * @example
 * ```ts
 * const USD = { code: 'USD', base: 10, exponent: 2 };
 * ```
 */
export const DineroCurrencySchema = z.object({
  code: z.string().length(3), // ISO 4217 currency code (e.g., USD, EUR)
  base: z.number().int().positive(), // Decimal base (usually 10)
  exponent: z.number().int().nonnegative(), // Number of decimal places
});

/**
 * Dinero.js V2 snapshot (transport format for all money values)
 *
 * This is the canonical serialization format for Dinero objects across
 * the wire. Use this schema to validate all monetary amounts in API
 * payloads, cart state, pricing, and orders.
 *
 * @see https://dinerojs.com/docs/api/conversions/to-snapshot
 * @example
 * ```ts
 * const priceSnapshot = {
 *   amount: 2500,
 *   currency: { code: 'USD', base: 10, exponent: 2 },
 *   scale: 2,
 * }; // Represents $25.00
 * ```
 */
export const DineroSnapshotSchema = z
  .object({
    amount: z.number().int(), // Integer amount in smallest unit
    currency: DineroCurrencySchema,
    scale: z.number().int().nonnegative(), // Decimal scale
  })
  .strict()
  .brand('DineroSnapshot');

export type DineroCurrency = z.infer<typeof DineroCurrencySchema>;
export type DineroSnapshot = z.infer<typeof DineroSnapshotSchema>;
