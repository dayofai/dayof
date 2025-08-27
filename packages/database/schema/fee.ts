import { sql } from "drizzle-orm";
import { pgTable, check, pgEnum } from "drizzle-orm/pg-core";
import { timeStamps } from "./extend-timestamps";
import { dineroType } from "./custom-types";
import { createdBy } from "./extend-created-by";

export const feeTypeEnum = pgEnum("fee_type_enum", ["percentage", "fixed"]);
export const feeAllocationEnum = pgEnum("fee_allocation_enum", [
	"item",
	"order",
]);
export const feeDistributionEnum = pgEnum("fee_distribution_enum", [
	"each",
	"across",
]);

export const fee = pgTable(
	"fee",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`'fee_' || nanoid()`),
		name: t.text("name").notNull(),
		description: t.text("description"),
		isActive: t.boolean("is_active").default(true).notNull(),
		feeType: feeTypeEnum("fee_type_enum").notNull(), // percentage or fixed
		percentage: t.numeric("percentage"),
		amount: dineroType("amount"),
		feeAllocation: feeAllocationEnum("fee_allocation_enum").notNull(), // item or order
		feeDistribution: feeDistributionEnum("fee_distribution_enum"), // each or accross
		isTaxable: t.boolean("is_taxable").default(true).notNull(),
		metadata: t.jsonb("metadata"),
		...timeStamps({ softDelete: true }),
		...createdBy(),
	}),
	(table) => [
		check("fee_pk_check", sql`${table.id} SIMILAR TO 'fee_[0-9a-zA-Z]{12}'`),
		check(
			"fee_type_amount_check",
			sql`
			(${table.feeType} = 'percentage' AND ${table.percentage} IS NOT NULL AND ${table.amount} IS NULL) OR
			(${table.feeType} = 'fixed' AND ${table.amount} IS NOT NULL AND ${table.percentage} IS NULL)`,
		),
		check(
			"fee_distribution_check",
			sql`${table.feeDistribution} IS NULL OR (${table.feeAllocation} = 'item')`,
		),
		check(
			"percentage_check",
			sql`${table.percentage} >= 0 AND ${table.percentage} <= 100`,
		),
	],
);


