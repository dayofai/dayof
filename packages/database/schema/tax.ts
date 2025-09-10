import { sql } from 'drizzle-orm';
import { check, index, pgTable, unique } from 'drizzle-orm/pg-core';
import { dineroType } from './custom-types';
import { createdBy } from './extend-created-by';
import { timeStamps } from './extend-timestamps';
import { productVariant } from './product';

/**
 * Tax Rate Storage and Calculation with Dinero.js
 *
 * 1. Storing a tax rate (e.g., 8.25%):
 *    const taxRate = {
 *      rate: dinero({ amount: 825, scale: 4 }), // 0.0825 or 8.25%
 *      rawRate: 8.25,                           // for display
 *    }
 *
 *    // When sending to database, rate is automatically converted to snapshot:
 *    // {
 *    //   amount: 825,
 *    //   scale: 4,
 *    // }
 *
 * 2. Retrieving and using the rate:
 *    // Database automatically converts snapshot back to Dinero object
 *    const { rate } = await db.query.taxRate.findFirst()
 *
 *    // Calculate tax on a price
 *    const price = dinero({ amount: 1000, currency: USD }) // $10.00
 *    const taxAmount = multiply(price, rate) // $0.83
 *
 * Note: The scale of 4 is used because:
 * - amount: 825 (8.25 * 100 to avoid decimals)
 * - scale: 4 (moves decimal 4 places left: 825 -> 0.0825)
 *
 * @see https://v2.dinerojs.com/docs/faq/how-do-i-calculate-a-percentage
 * @see https://v2.dinerojs.com/docs/guides/transporting-and-restoring
 */

/**
 * Tax Calculation Strategy:
 * - Calculate and round tax at the line item level
 * - Sum rounded amounts for total tax
 * - Small differences vs total calculation are expected and standard
 *   in e-commerce (follows Shopify's approach)
 */

export const taxRate = pgTable(
  'tax_rate',
  (t) => ({
    id: t.text('id').primaryKey().default(sql`nanoid()`),

    // dinero object with scale and numeric version of the rate
    rate: dineroType('rate').notNull(), // Dinero object with scale for calculations
    rawRate: t.numeric('raw_rate').notNull(), // e.g., 8.25 for 8.25%

    name: t.text('name').notNull(), // e.g., 'Texas State Sales Tax'
    receiptCode: t.text('receipt_code').notNull(), // e.g., 'TX-STATE'
    isDefault: t.boolean('is_default').default(false).notNull(),
    metadata: t.jsonb('metadata'),
    ...timeStamps({ softDelete: true }),
    ...createdBy(),
  }),
  (table) => [
    // Ensure rawRate is a valid percentage
    check(
      'tax_rate_percentage_check',
      sql`${table.rawRate} >= 0 AND ${table.rawRate} <= 100`
    ),
  ]
);

export const productVariantTaxRate = pgTable(
  'product_variant_tax_rate',
  (t) => ({
    id: t.text('id').primaryKey().default(sql`nanoid()`),
    taxRateId: t
      .text('tax_rate_id')
      .references(() => taxRate.id)
      .notNull(),
    productVariantId: t
      .text('product_variant_id')
      .references(() => productVariant.id)
      .notNull(),
    metadata: t.jsonb('metadata'),
    ...timeStamps({ softDelete: true }),
    ...createdBy(),
  }),
  (t) => [
    unique('pvtr_tax_rate_product_variant_unique').on(
      t.taxRateId,
      t.productVariantId
    ),
    index('pvtr_tax_rate_id_idx').on(t.taxRateId),
    index('pvtr_product_variant_id_idx').on(t.productVariantId),
  ]
);
