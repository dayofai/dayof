import { sql } from 'drizzle-orm';
import { index, pgTable, unique } from 'drizzle-orm/pg-core';
// Note: relations moved to relations.ts (RQB v2)
import { address } from './address';
import { createdBy } from './extend-created-by';
import { timeStamps } from './extend-timestamps';

export const stockLocation = pgTable(
  'stock_location',
  (t) => ({
    id: t.text('id').primaryKey().default(sql`nanoid()`),
    name: t.text('name').notNull(),
    addressId: t
      .text('address_id')
      .references(() => address.id)
      .notNull(),
    metadata: t.jsonb('metadata'),
    ...timeStamps({ softDelete: true }),
    ...createdBy(),
  }),
  (t) => [index('stock_location_address_id_idx').on(t.addressId)]
);

export const salesChannel = pgTable('sales_channel', (t) => ({
  id: t.text('id').primaryKey().default(sql`nanoid()`),
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
    id: t.text('id').primaryKey().default(sql`nanoid()`),
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
      .notNull(),
    ...timeStamps({ softDelete: false }),
    ...createdBy(),
  }),
  (t) => [
    index('scsl_sales_channel_id_idx').on(t.salesChannelId),
    index('scsl_location_id_idx').on(t.locationId),
    unique('scsl_sales_channel_location_unique').on(
      t.salesChannelId,
      t.locationId
    ),
  ]
);

/** salesChannel */
// Relations are defined centrally in relations.ts using Drizzle RQB v2
