import { text, pgEnum, check } from "drizzle-orm/pg-core";
import { users, organizations } from "./better-auth";
import { sql } from "drizzle-orm";

export const actorTypeEnum = pgEnum("actor_type_enum", [
	"user", // Regular user through Clerk
	"system", // System operations
	"api_token", // API operations
]);

export const createdBy = () => {
	const fields = {
		actorType: actorTypeEnum("actor_type").default("user").notNull(),
		userId: text("user_id").references(() => users.id, {
			onDelete: "set null",
		}),
		orgId: text("org_id").references(() => organizations.id, {
			onDelete: "cascade",
		}),
	};
	return {
		...fields,
	};
};

export const createdByCheck = (table: any) => ({
	validActorConstraints: check(
		"valid_actor_constraints",
		sql`
			CASE ${table.actorType}
				WHEN 'user' THEN 
					${table.userId} IS NOT NULL AND ${table.orgId} IS NOT NULL
				WHEN 'system' THEN 
					${table.userId} IS NULL
				WHEN 'api_token' THEN 
					${table.userId} IS NULL AND ${table.orgId} IS NOT NULL
				ELSE FALSE
			END
		`,
	),
});