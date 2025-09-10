import { sql } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { index, pgTable, unique } from 'drizzle-orm/pg-core';
import { ianaTimezone } from './custom-types';
import { createdBy } from './extend-created-by';
import { timeStamps } from './extend-timestamps';

export const locationType = pgTable('location_type', (t) => ({
  id: t.text('id').primaryKey().default(sql`nanoid()`),
  name: t.text('name').notNull(),
  description: t.text('description'),
}));

// Core location table with essential fields
export const location = pgTable(
  'location',
  (t) => ({
    id: t.text('id').primaryKey().default(sql`nanoid()`),

    locationParentId: t
      .text('location_parent_id')
      .references((): AnyPgColumn => location.id, { onDelete: 'restrict' }),

    // Basic info
    name: t.text('name').notNull(),
    handle: t.text('handle').notNull(),
    description: t.text('description'),

    // Location type reference
    locationTypeId: t
      .text('location_type_id')
      .references(() => locationType.id, { onDelete: 'restrict' })
      .notNull(),

    // IANA Timezone
    timezone: ianaTimezone('timezone').notNull(),

    ...timeStamps({ softDelete: true }),
    ...createdBy(),
  }),
  (t) => [
    unique('location_handle_org_unique').on(t.handle, t.orgId),
    index('location_location_parent_id_idx').on(t.locationParentId),
    index('location_location_type_id_idx').on(t.locationTypeId),
  ]
);
