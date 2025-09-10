import { sql } from 'drizzle-orm';
import { index, pgTable } from 'drizzle-orm/pg-core';
import { dineroType } from './custom-types';
import { createdBy } from './extend-created-by';
import { timeStamps } from './extend-timestamps';

export const priceSet = pgTable('price_set', (t) => ({
  id: t.text('id').primaryKey().default(sql`nanoid()`),
  label: t.text('label'),
  description: t.text('description'),
  type: t.text('type').default('default').notNull(),
  startsAt: t.timestamp('starts_at', { withTimezone: true }),
  endsAt: t.timestamp('ends_at', { withTimezone: true }),
  rules: t.jsonb('rules').default({}),
  metadata: t.jsonb('metadata'),
  ...timeStamps({ softDelete: true }),
  ...createdBy(),
}));

export const price = pgTable(
  'price',
  (t) => ({
    id: t.text('id').primaryKey().default(sql`nanoid()`),
    label: t.text('label'),
    priceSetId: t
      .text('price_set_id')
      .references(() => priceSet.id)
      .notNull(),
    amount: dineroType('amount').notNull(),
    minQuantity: t.numeric('min_quantity'),
    maxQuantity: t.numeric('max_quantity'),
    isTaxInclusive: t.boolean('is_tax_inclusive').default(false), // if null look at a default
    isFeeInclusive: t.boolean('is_fee_inclusive').default(false), // if null look at a default
    metadata: t.jsonb('metadata'),
    ...timeStamps({ softDelete: true }),
    ...createdBy(),
  }),
  (t) => [index('price_price_set_id_idx').on(t.priceSetId)]
);
