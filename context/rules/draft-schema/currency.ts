import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { timeStamps } from "../schema/extend-timestamps";

/**
 * Currency Configuration for Dinero.js
 *
 * const USD = {
 *   code: "USD",
 *   base: 10,        // decimal-based
 *   exponent: 2,     // cents
 *   symbol: "$",
 *   name: "US Dollar"
 * }
 *
 * Usage:
 * const amount = dinero({
 *   amount: 1000,    // $10.00 (stored in minor units - cents)
 *   currency: USD
 * })
 *
 */
export const currency = pgTable("currency", {
	code: text("code").primaryKey(), // ISO 4217 code
	base: integer("base").default(10).notNull(), // decimal-based currencies only
	exponent: integer("exponent").default(2).notNull(), // 2 for cents
	symbol: text("symbol").notNull(), // e.g., "$"
	name: text("name").notNull(), // e.g., "US Dollar"
	...timeStamps({ softDelete: true }),
});
