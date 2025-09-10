import { sql } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { check, pgEnum, text } from 'drizzle-orm/pg-core';
import { organization, user } from './better-auth';

export const actorTypeEnum = pgEnum('actor_type_enum', [
  'user', // Regular user through Clerk
  'system', // System operations
  'api_token', // API operations
]);

export const createdBy = () => {
  const fields = {
    actorType: actorTypeEnum('actor_type').default('user').notNull(),
    userId: text('user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    orgId: text('org_id').references(() => organization.id, {
      onDelete: 'cascade',
    }),
  };
  return {
    ...fields,
  };
};

type CreatedByCols = ReturnType<typeof createdBy>;

export const createdByCheck = <
  T extends Record<keyof CreatedByCols, AnyPgColumn>,
>(
  table: T
) => ({
  validActorConstraints: check(
    'valid_actor_constraints',
    sql`
			CASE ${table.actorType}
				WHEN 'user' THEN 
					${table.userId} IS NOT NULL AND ${table.orgId} IS NOT NULL
				WHEN 'system' THEN 
					${table.userId} IS NULL
				WHEN 'api_token' THEN 
					${table.userId} IS NULL
				ELSE FALSE
			END
		`
  ),
});
