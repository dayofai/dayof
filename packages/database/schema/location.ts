import { sql } from "drizzle-orm";
import { pgTable, check, unique, index } from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { timeStamps } from "./extend-timestamps";
import { createdBy } from "./extend-created-by";

export const locationType = pgTable(
	"location_type",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`'ltype_' || nanoid()`),
		name: t.text("name").notNull(),
		description: t.text("description"),
	}),
);

// Core location table with essential fields
export const location = pgTable(
	"location",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`'loc_' || nanoid()`),

		locationParentId: t
			.text("location_parent_id")
			.references((): AnyPgColumn => location.id, { onDelete: "restrict" }),

		// Basic info
		name: t.text("name").notNull(),
		handle: t.text("handle").notNull(),
		description: t.text("description"),

		// Location type reference
		locationTypeId: t
			.text("location_type_id")
			.references(() => locationType.id, { onDelete: "restrict" })
			.notNull(),

		// IANA Timezone
		timezone: t.text("timezone").notNull(),

		...timeStamps({ softDelete: true }),
		...createdBy(),
	}),
	(table) => ({
		checks: [
			unique("location_handle_org_unique").on(table.handle, table.orgId),
		],
	}),
);
