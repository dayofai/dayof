import { sql } from "drizzle-orm";
import { check, pgTable } from "drizzle-orm/pg-core";
import { createdBy } from "../schema/extend-created-by";
import { timeStamps } from "../schema/extend-timestamps";
import { relations } from "drizzle-orm";
import { productSalesChannel } from "./product";
import { address } from "./address";

export const stockLocation = pgTable(
	"stock_location",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`'sloc_' || nanoid()`),
		name: t.text("name").notNull(),
		addressId: t
			.text("address_id")
			.references(() => address.id)
			.notNull(),
		metadata: t.jsonb("metadata"),
		...timeStamps({ softDelete: true }),
		...createdBy(),
	}),
);

export const salesChannel = pgTable(
	"sales_channel",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`'sc_' || nanoid()`),
		name: t.text("name").notNull(),
		description: t.text("description"),
		isDisabled: t.boolean("is_disabled").default(false),
		metadata: t.jsonb("metadata"),
		...timeStamps({ softDelete: true }),
		...createdBy(),
	}),
);

export const salesChannelStockLocation = pgTable(
	"sales_channel_stock_location",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`'scloc_' || nanoid()`),
		salesChannelId: t
			.text("sales_channel_id")
			.references(() => salesChannel.id, {
				onDelete: "cascade",
			})
			.notNull(),
		locationId: t
			.text("location_id")
			.references(() => stockLocation.id, {
				onDelete: "restrict",
			})
			.default("sc_WASBSjE935POhANBMjbeW")
			.notNull(),
		...timeStamps({ softDelete: false }),
		...createdBy(),
	}),
);

/** salesChannel */
export const salesChannelRelations = relations(salesChannel, ({ many }) => ({
	// One sales channel has many stock locations through the junction table
	stockLocations: many(salesChannelStockLocation),
	// One sales channel has many products through the junction table (from product.ts)
	products: many(productSalesChannel),
}));

/** salesChannelStockLocation */
export const salesChannelStockLocationRelations = relations(
	salesChannelStockLocation,
	({ one }) => ({
		// Each entry links to one sales channel
		salesChannel: one(salesChannel, {
			fields: [salesChannelStockLocation.salesChannelId],
			references: [salesChannel.id],
		}),
		// Each entry links to one stock location
		stockLocation: one(stockLocation, {
			fields: [salesChannelStockLocation.locationId],
			references: [stockLocation.id],
		}),
	}),
);
