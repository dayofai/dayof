import { sql } from 'drizzle-orm';
import { check, index, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { createdBy } from './extend-created-by';
import { timeStamps } from './extend-timestamps';

export const tags = pgTable(
  'tags',
  {
    id: text('id').primaryKey().default(sql`'tag_' || nanoid()`),
    name: text('name').notNull(),
    category: text('category'), // 'product', 'venue', 'customer', etc.
    description: text('description'),
    ...timeStamps({ softDelete: true }),
    ...createdBy(),
  },
  (table) => [
    uniqueIndex('tags_name_unique').on(table.name),
    index('tags_category_idx').on(table.category),
    check('tags_id_check', sql`${table.id} SIMILAR TO 'tag_[0-9a-zA-Z]{12}'`),
  ]
);

// Export types
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
