import { sql } from "drizzle-orm";
import { pgTable, pgEnum, check, unique, index } from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { createdBy, createdByCheck } from "./extend-created-by";
import { timeStamps } from "./extend-timestamps";
import { tag } from "./tag";
import { priceSet } from "./pricing";
import { salesChannel } from "./sales-channel";
import { brandProfile } from "./organization";

export const product = pgTable(
	"product",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`'prod_' || nanoid()`),
		name: t.text("name").notNull(),
		handle: t.text("handle").notNull(),
		description: t.text("description"),
		status: productStatusEnum("status").notNull(),
		typeId: t
			.text("type_id")
			.references(() => productType.id, {
				onDelete: "restrict",
			})
			.notNull(),
		isDiscountable: t.boolean().default(true).notNull(),
		metadata: t.jsonb(),
		brandProfileId: t
			.text("brand_profile_id")
			.references(() => brandProfile.id, { onDelete: "set null" }),
		...timeStamps({ softDelete: true }),
		...createdBy(),
	}),
);

export const productVariant = pgTable(
	"product_variant",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`'pvar_' || nanoid()`),
		productId: t
			.text("product_id")
			.references(() => product.id, { onDelete: "cascade" })
			.notNull(),
		name: t.text("name").notNull(),
		description: t.text("description"),
		status: productStatusEnum("status").notNull(),
		manageInventory: t.boolean("manage_inventory").default(true).notNull(),
		variantRank: t.integer("variant_rank").default(0),
		metadata: t.jsonb("metadata"),
		...timeStamps({ softDelete: true }),
		...createdBy(),
	}),
	(table) => ({
		checks: [
			createdByCheck(table).validActorConstraints,
		]
	}),
);

export const productType = pgTable(
	"product_type",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`'ptyp_' || nanoid()`),
		singularNoun: t.text("singular_noun").notNull(),
		pluralNoun: t.text("plural_noun").notNull(),
		handle: t.text("handle").notNull().unique(),
		metadata: t.jsonb("metadata"),
		...timeStamps({ softDelete: true }),
		...createdBy(),
	}),
	(table) => [
		check(
			"product_type_pk_check",
			sql`${table.id} SIMILAR TO 'ptyp_[0-9a-zA-Z]{12}'`,
		),
	],
);

// For grouping a list of products for use with promotions, unique storefronts,
// or other internal features.
export const productGroup = pgTable(
	"product_collection",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`'pcol_' || nanoid()`),
		name: t.text("name").notNull(),
		handle: t.text("handle").notNull(),
		metadata: t.jsonb("metadata"),
		...timeStamps({ softDelete: true }),
		...createdBy(),
	}),
	(table) => [
		unique("product_group_handle_org_unique").on(
			table.handle,
			table.orgId,
		),
	],
);

// Storefront and marketplace for clear hierarchical navigation.
// May mirror event categories (e.g. concert, conference) or specific to products.
export const productCategory = pgTable(
	"category",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`'pcat_' || nanoid()`),
		name: t.text("name").notNull(),
		description: t.text("description"),
		handle: t.text("handle").notNull().unique(),
		mpath: t.text("mpath").notNull(),
		isActive: t.boolean("is_active").default(false).notNull(),
		isGlobal: t.boolean("is_global").default(false).notNull(),
		rank: t.integer("rank").default(0).notNull(),
		parentCategoryId: t
			.text("parent_category_id")
			.references((): AnyPgColumn => productCategory.id, {
				onDelete: "set null", // allows deleting parent categories
			}),
		metadata: t.jsonb("metadata"),
		...timeStamps({ softDelete: true }),
		...createdBy(),
	}),
);

export const productStatusEnum = pgEnum("product_status_enum", [
	"draft",
	"active",
	"paused",
	"archived",
]);

export const productGroupProduct = pgTable(
	"product_collection_product",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`'pcolprod_' || nanoid()`),
		productId: t
			.text("product_id")
			.references(() => product.id, {
				onDelete: "cascade", // if product deleted, remove from collections
			})
			.notNull(),
		productGroupId: t
			.text("product_group_id")
			.references(() => productGroup.id, {
				onDelete: "cascade",
			})
			.notNull(),
	}),
	(table) => [
		check(
			"product_collection_product_pk_check",
			sql`${table.id} SIMILAR TO 'pcolprod_[0-9a-zA-Z]{12}'`,
		),
	],
);

export const productCategoryProduct = pgTable(
	"product_category",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`'pcp_' || nanoid()`),
		productId: t
			.text("product_id")
			.references(() => product.id, {
				onDelete: "cascade", // if product deleted, remove category associations
			})
			.notNull(),
		categoryId: t
			.text("category_id")
			.references(() => productCategory.id, {
				onDelete: "cascade", // if category deleted, remove product associations
			})
			.notNull(),
		...timeStamps({ softDelete: true }),
		...createdBy(),
	}),
	(table) => [
		check(
			"product_category_product_pk_check",
			sql`${table.id} SIMILAR TO 'pcp_[0-9a-zA-Z]{12}'`,
		),
	],
);

export const productTag = pgTable(
	"product_tag",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`'ptag_' || nanoid()`),
		productId: t
			.text("product_id")
			.references(() => product.id, { onDelete: "cascade" })
			.notNull(),
		tagId: t
			.text("tag_id")
			.references(() => tag.id, { onDelete: "cascade" })
			.notNull(),
		...timeStamps({ softDelete: true }),
		...createdBy(),
	}),
);

export const productVariantPriceSet = pgTable(
	"product_variant_price_set",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`'pvps_' || nanoid()`),
		variantId: t
			.text("variant_id")
			.references(() => productVariant.id, { onDelete: "cascade" })
			.notNull(),
		priceSetId: t
			.text("price_set_id")
			.references(() => priceSet.id, { onDelete: "cascade" })
			.notNull(),
		...timeStamps({ softDelete: true }),
	})
);

export const productSalesChannel = pgTable(
	"product_sales_channel",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`'psc_' || nanoid()`),
		productId: t
			.text("product_id")
			.references(() => product.id, {
				onDelete: "cascade",
			})
			.notNull(),
		salesChannelId: t
			.text("sales_channel_id")
			.references(() => salesChannel.id, {
				onDelete: "cascade",
			})
			.notNull(),
		...timeStamps({ softDelete: false }),
		...createdBy(),
	})
);
