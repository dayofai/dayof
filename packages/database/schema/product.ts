import { sql } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { index, pgEnum, pgTable, unique } from 'drizzle-orm/pg-core';
import { createdBy } from './extend-created-by';
import { timeStamps } from './extend-timestamps';
import { brandProfile } from './organization';
import { priceSet } from './pricing';
import { salesChannel } from './sales-channel';
import { tags } from './tag';

export const productStatusEnum = pgEnum('product_status_enum', [
  'draft',
  'active',
  'paused',
  'archived',
]);

export const product = pgTable(
  'product',
  (t) => ({
    id: t.text('id').primaryKey().default(sql`nanoid()`),
    name: t.text('name').notNull(),
    handle: t.text('handle').notNull(),
    description: t.text('description'),
    status: productStatusEnum('status').notNull(),
    typeId: t
      .text('type_id')
      .references(() => productType.id, {
        onDelete: 'restrict',
      })
      .notNull(),
    isDiscountable: t.boolean('is_discountable').default(true).notNull(),
    metadata: t.jsonb(),
    brandProfileId: t
      .text('brand_profile_id')
      .references(() => brandProfile.id, { onDelete: 'set null' }),
    ...timeStamps({ softDelete: true }),
    ...createdBy(),
  }),
  (table) => ({
    handleOrgUnique: unique('product_handle_org_unique').on(
      table.handle,
      table.orgId
    ),
    typeIdIdx: index('product_type_id_idx').on(table.typeId),
    brandProfileIdIdx: index('product_brand_profile_id_idx').on(
      table.brandProfileId
    ),
  })
);

export const productVariant = pgTable(
  'product_variant',
  (t) => ({
    id: t.text('id').primaryKey().default(sql`nanoid()`),
    productId: t
      .text('product_id')
      .references(() => product.id, { onDelete: 'cascade' })
      .notNull(),
    name: t.text('name').notNull(),
    description: t.text('description'),
    status: productStatusEnum('status').notNull(),
    manageInventory: t.boolean('manage_inventory').default(true).notNull(),
    variantRank: t.integer('variant_rank').default(0),
    metadata: t.jsonb('metadata'),
    ...timeStamps({ softDelete: true }),
    ...createdBy(),
  }),
  (table) => ({
    productIdIdx: index('product_variant_product_id_idx').on(table.productId),
  })
);

export const productType = pgTable(
  'product_type',
  (t) => ({
    id: t.text('id').primaryKey().default(sql`nanoid()`),
    singularNoun: t.text('singular_noun').notNull(),
    pluralNoun: t.text('plural_noun').notNull(),
    handle: t.text('handle').notNull(),
    metadata: t.jsonb('metadata'),
    ...timeStamps({ softDelete: true }),
    ...createdBy(),
  }),
  (table) => [
    unique('product_type_handle_org_unique').on(table.handle, table.orgId),
  ]
);

// For grouping a list of products for use with promotions, unique storefronts,
// or other internal features.
export const productGroup = pgTable(
  'product_collection',
  (t) => ({
    id: t.text('id').primaryKey().default(sql`nanoid()`),
    name: t.text('name').notNull(),
    handle: t.text('handle').notNull(),
    metadata: t.jsonb('metadata'),
    ...timeStamps({ softDelete: true }),
    ...createdBy(),
  }),
  (table) => [
    unique('product_group_handle_org_unique').on(table.handle, table.orgId),
  ]
);

// Storefront and marketplace for clear hierarchical navigation.
// May mirror event categories (e.g. concert, conference) or specific to products.
export const productCategory = pgTable(
  'category',
  (t) => ({
    id: t.text('id').primaryKey().default(sql`nanoid()`),
    name: t.text('name').notNull(),
    description: t.text('description'),
    handle: t.text('handle').notNull(),
    mpath: t.text('mpath').notNull(),
    isActive: t.boolean('is_active').default(false).notNull(),
    isGlobal: t.boolean('is_global').default(false).notNull(),
    rank: t.integer('rank').default(0).notNull(),
    parentCategoryId: t
      .text('parent_category_id')
      .references((): AnyPgColumn => productCategory.id, {
        onDelete: 'set null', // allows deleting parent categories
      }),
    metadata: t.jsonb('metadata'),
    ...timeStamps({ softDelete: true }),
    ...createdBy(),
  }),
  (table) => ({
    handleOrgUnique: unique('category_handle_org_unique').on(
      table.handle,
      table.orgId
    ),
    parentCategoryIdIdx: index('category_parent_category_id_idx').on(
      table.parentCategoryId
    ),
  })
);

// enum moved above to avoid TDZ issues in esbuild

export const productGroupProduct = pgTable(
  'product_collection_product',
  (t) => ({
    id: t.text('id').primaryKey().default(sql`nanoid()`),
    productId: t
      .text('product_id')
      .references(() => product.id, {
        onDelete: 'cascade', // if product deleted, remove from collections
      })
      .notNull(),
    productGroupId: t
      .text('product_group_id')
      .references(() => productGroup.id, {
        onDelete: 'cascade',
      })
      .notNull(),
  }),
  (table) => ({
    productIdIdx: index('pcp_product_id_idx').on(table.productId),
    productGroupIdIdx: index('pcp_product_group_id_idx').on(
      table.productGroupId
    ),
    productProductGroupUnique: unique('pcp_product_product_group_unique').on(
      table.productId,
      table.productGroupId
    ),
  })
);

export const productCategoryProduct = pgTable(
  'product_category',
  (t) => ({
    id: t.text('id').primaryKey().default(sql`nanoid()`),
    productId: t
      .text('product_id')
      .references(() => product.id, {
        onDelete: 'cascade', // if product deleted, remove category associations
      })
      .notNull(),
    categoryId: t
      .text('category_id')
      .references(() => productCategory.id, {
        onDelete: 'cascade', // if category deleted, remove product associations
      })
      .notNull(),
    ...timeStamps({ softDelete: true }),
    ...createdBy(),
  }),
  (table) => ({
    productIdIdx: index('product_category_product_id_idx').on(table.productId),
    categoryIdIdx: index('product_category_category_id_idx').on(
      table.categoryId
    ),
    productCategoryUnique: unique(
      'product_category_product_category_unique'
    ).on(table.productId, table.categoryId),
  })
);

export const productTag = pgTable(
  'product_tag',
  (t) => ({
    id: t.text('id').primaryKey().default(sql`nanoid()`),
    productId: t
      .text('product_id')
      .references(() => product.id, { onDelete: 'cascade' })
      .notNull(),
    tagId: t
      .text('tag_id')
      .references(() => tags.id, { onDelete: 'cascade' })
      .notNull(),
    ...timeStamps({ softDelete: true }),
    ...createdBy(),
  }),
  (table) => ({
    productIdIdx: index('product_tag_product_id_idx').on(table.productId),
    tagIdIdx: index('product_tag_tag_id_idx').on(table.tagId),
    productTagUnique: unique('product_tag_product_tag_unique').on(
      table.productId,
      table.tagId
    ),
  })
);

export const productVariantPriceSet = pgTable(
  'product_variant_price_set',
  (t) => ({
    id: t.text('id').primaryKey().default(sql`nanoid()`),
    variantId: t
      .text('variant_id')
      .references(() => productVariant.id, { onDelete: 'cascade' })
      .notNull(),
    priceSetId: t
      .text('price_set_id')
      .references(() => priceSet.id, { onDelete: 'cascade' })
      .notNull(),
    ...timeStamps({ softDelete: true }),
  }),
  (table) => ({
    variantIdIdx: index('pvps_variant_id_idx').on(table.variantId),
    priceSetIdIdx: index('pvps_price_set_id_idx').on(table.priceSetId),
    variantPriceSetUnique: unique('pvps_variant_price_set_unique').on(
      table.variantId,
      table.priceSetId
    ),
  })
);

export const productSalesChannel = pgTable(
  'product_sales_channel',
  (t) => ({
    id: t.text('id').primaryKey().default(sql`nanoid()`),
    productId: t
      .text('product_id')
      .references(() => product.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    salesChannelId: t
      .text('sales_channel_id')
      .references(() => salesChannel.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    ...timeStamps({ softDelete: false }),
    ...createdBy(),
  }),
  (table) => ({
    productIdIdx: index('psc_product_id_idx').on(table.productId),
    salesChannelIdIdx: index('psc_sales_channel_id_idx').on(
      table.salesChannelId
    ),
    productSalesChannelUnique: unique('psc_product_sales_channel_unique').on(
      table.productId,
      table.salesChannelId
    ),
  })
);
