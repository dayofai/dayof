import { timestamp } from "drizzle-orm/pg-core";

// This is common columns, `deleted_at` are optional
export const timeStamps = ({ softDelete }: { softDelete: boolean }) => {
	const commonTimestamps = {
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdateFn(() => new Date())
			.notNull(),
	};
	const deleteTimestamp = {
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
	};
	return softDelete
		? { ...commonTimestamps, ...deleteTimestamp }
		: commonTimestamps;
};
