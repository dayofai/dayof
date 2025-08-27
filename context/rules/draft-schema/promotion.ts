import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { timeStamps } from './extend-timestamps';

// Placeholder promotion table - update with actual schema
export const promotion = pgTable('promotion', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  ...timeStamps({ softDelete: true }),
});
