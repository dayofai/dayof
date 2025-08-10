import { sql } from "drizzle-orm";
import { pgTable, check } from "drizzle-orm/pg-core";
import { currency } from "./currency";
import { timeStamps } from "../schema/extend-timestamps";
import { paymentProvider } from "./payment";
import { relations } from "drizzle-orm";

export const region = pgTable(
	"region",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`'reg_' || nanoid()`),
		name: t.text("name").notNull(),
		currencyCode: t
			.text("currency_code")
			.references(() => currency.code)
			.notNull(),
		automaticTaxes: t.boolean("automatic_taxes").default(true),
		metadata: t.jsonb("metadata"),
		...timeStamps({ softDelete: true }),
	}),
	(table) => [
		check("region_pk_check", sql`${table.id} SIMILAR TO 'reg_[0-9a-zA-Z]{12}'`),
	],
);

export const regionCountry = pgTable("region_country", (t) => ({
	iso2: t.text("iso_2").primaryKey(),
	iso3: t.text("iso_3"),
	numCode: t.text("num_code").notNull(),
	name: t.text("name").notNull(),
	displayName: t.text("display_name").notNull(),
	regionId: t.text("region_id").references(() => region.id),
	metadata: t.jsonb("metadata"),
	...timeStamps({ softDelete: true }),
}));

export const regionPaymentProvider = pgTable(
	"region_payment_provider",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`'rpp_' || nanoid()`),
		regionId: t
			.text("region_id")
			.references(() => region.id)
			.notNull(),
		paymentProviderId: t
			.text("payment_provider_id")
			.references(() => paymentProvider.id)
			.notNull(),
		...timeStamps({ softDelete: true }),
	}),
	(table) => [
		check(
			"region_payment_provider_pk_check",
			sql`${table.id} SIMILAR TO 'rpp_[0-9a-zA-Z]{12}'`,
		),
	],
);

/** region */
export const regionRelations = relations(region, ({ many }) => ({
	// One region has many countries
	countries: many(regionCountry),
	// One region has many payment providers through the junction table
	paymentProviders: many(regionPaymentProvider),
}));

/** regionCountry */
export const regionCountryRelations = relations(regionCountry, ({ one }) => ({
	// Each country belongs to one region
	region: one(region, {
		fields: [regionCountry.regionId],
		references: [region.id],
	}),
}));

/** regionPaymentProvider */
export const regionPaymentProviderRelations = relations(
	regionPaymentProvider,
	({ one }) => ({
		// Each entry links to one region
		region: one(region, {
			fields: [regionPaymentProvider.regionId],
			references: [region.id],
		}),
		// Each entry links to one payment provider
		paymentProvider: one(paymentProvider, {
			fields: [regionPaymentProvider.paymentProviderId],
			references: [paymentProvider.id],
		}),
	}),
);
