import { sql } from 'drizzle-orm';
import { check, pgTable } from 'drizzle-orm/pg-core';
import { createdBy } from '../schema/extend-created-by';
import { timeStamps } from '../schema/extend-timestamps';
// Note: relations moved to relations.ts (RQB v2)
import { address } from './address';

export const stockLocation = pgTable('stock_location', (t) => ({
  id: t.text('id').primaryKey().default(sql`'sloc_' || nanoid()`),
  name: t.text('name').notNull(),
  addressId: t
    .text('address_id')
    .references(() => address.id)
    .notNull(),
  metadata: t.jsonb('metadata'),
  ...timeStamps({ softDelete: true }),
  ...createdBy(),
}));

export const salesChannel = pgTable('sales_channel', (t) => ({
  id: t.text('id').primaryKey().default(sql`'sc_' || nanoid()`),
  name: t.text('name').notNull(),
  description: t.text('description'),
  isDisabled: t.boolean('is_disabled').default(false),
  metadata: t.jsonb('metadata'),
  ...timeStamps({ softDelete: true }),
  ...createdBy(),
}));

export const salesChannelStockLocation = pgTable(
  'sales_channel_stock_location',
  (t) => ({
    id: t.text('id').primaryKey().default(sql`'scloc_' || nanoid()`),
    salesChannelId: t
      .text('sales_channel_id')
      .references(() => salesChannel.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    locationId: t
      .text('location_id')
      .references(() => stockLocation.id, {
        onDelete: 'restrict',
      })
      .default('sc_WASBSjE935POhANBMjbeW')
      .notNull(),
    ...timeStamps({ softDelete: false }),
    ...createdBy(),
  })
);

/** salesChannel */
// Relations are defined centrally in relations.ts using Drizzle RQB v2
