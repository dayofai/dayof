// @ts-nocheck
import { defineRelations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  uuid,
} from 'drizzle-orm/pg-core';

// Reuse existing entities from the v0 schema
import { organizations, users } from './better-auth';
import { fee } from './fee';
import { product, productCategory, productVariant } from './product';
import { promotion } from './promotion';
import { salesChannel } from './sales-channel';
import { taxRate } from './tax';

// --- Targeting Enums (V1: single scope per rule; tags are additive runtime filter) ---

export const targetScopeEnum = pgEnum('target_scope_enum', [
  'UNIVERSAL',
  'DOMAIN',
  'ENTITY_TYPE',
  'ENTITIES',
]);

// Limit to entity families we have explicit junctions for in this repo
export const targetEntityTypeEnum = pgEnum('target_entity_type_enum', [
  'product',
  'product_variant',
  'product_category',
  'sales_channel',
]);

// Rule effect discriminator: controls how matched rules are interpreted
export const ruleEffectEnum = pgEnum('rule_effect_enum', [
  'boolean',
  'linked',
]);

// --- Core Rules Table (working) ---

export const rules = pgTable(
  'rules_working',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Partitioning & ownership
    domain: text('domain').notNull(),
    name: text('name').notNull(),
    description: text('description'),

    // Targeting (explicit, no inference)
    targetScope: targetScopeEnum('target_scope').notNull().default('UNIVERSAL'),
    targetEntityType: targetEntityTypeEnum('target_entity_type'),

    // Condition & variables
    condition: jsonb('condition').notNull(), // typed DSL AST
    variables: jsonb('variables').default('{}'),

    // Optional precomputed list of fact keys for perf
    factKeys: text('fact_keys').array(),

    // Engine effect + evaluation control
    effect: ruleEffectEnum('effect').notNull(),
    priority: integer('priority').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),

    // Auditing / soft delete
    createdAt: text('created_at').default(sql`now()`),
    updatedAt: text('updated_at').default(sql`now()`),
    deletedAt: text('deleted_at'),

    // Ownership
    actorType: text('actor_type'), // 'system' | 'user' | 'api_token'
    orgId: text('org_id').references(() => organizations.id),
    userId: text('user_id').references(() => users.id),
  },
  (t) => ({
    domainOrgIdx: index('rules_working_domain_org_idx').on(t.domain, t.orgId),
    activeIdx: index('rules_working_active_idx').on(t.isActive),
    scopeIdx: index('rules_working_scope_idx').on(t.targetScope),
    // Validation: if ENTITY_TYPE then targetEntityType must be set; if UNIVERSAL/DOMAIN then must be null
    scopeTypeCheck: check(
      'rules_working_scope_type_check',
      sql`(CASE ${t.targetScope}
            WHEN 'ENTITY_TYPE' THEN ${t.targetEntityType} IS NOT NULL
            WHEN 'UNIVERSAL' THEN ${t.targetEntityType} IS NULL
            WHEN 'DOMAIN' THEN ${t.targetEntityType} IS NULL
            ELSE TRUE
          END)`
    ),
    actorCheck: check(
      'rules_working_actor_check',
      sql`((${t.actorType} = 'system' AND ${t.userId} IS NULL AND ${t.orgId} IS NULL)
            OR (${t.actorType} IN ('user','api_token') AND ${t.orgId} IS NOT NULL))`
    ),
  })
);

// --- Domain-specific configuration tables (same pattern as v0) ---

export const rule_access_config = pgTable('rule_access_config_working', {
  ruleId: uuid('rule_id')
    .primaryKey()
    .references(() => rules.id, { onDelete: 'cascade' }),
  priorityGroup: text('priority_group'), // 'override' | 'deny' | 'require'
});

export const rule_pricing_config = pgTable('rule_pricing_config_working', {
  ruleId: uuid('rule_id')
    .primaryKey()
    .references(() => rules.id, { onDelete: 'cascade' }),
  stackingBehavior: text('stacking_behavior'), // 'compound' | 'sequential' | 'max'
  calculationPhase: text('calculation_phase'), // 'pre_discount' | 'post_discount'
});

// --- Explicit Junction Tables (entity families we have) ---

export const rule_target_products = pgTable(
  'rule_target_products_working',
  {
    ruleId: uuid('rule_id')
      .notNull()
      .references(() => rules.id, { onDelete: 'cascade' }),
    productId: text('product_id')
      .notNull()
      .references(() => product.id, { onDelete: 'cascade' }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.ruleId, t.productId] }) })
);

export const rule_target_product_variants = pgTable(
  'rule_target_product_variants_working',
  {
    ruleId: uuid('rule_id')
      .notNull()
      .references(() => rules.id, { onDelete: 'cascade' }),
    variantId: text('variant_id')
      .notNull()
      .references(() => productVariant.id, { onDelete: 'cascade' }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.ruleId, t.variantId] }) })
);

export const rule_target_sales_channels = pgTable(
  'rule_target_sales_channels_working',
  {
    ruleId: uuid('rule_id')
      .notNull()
      .references(() => rules.id, { onDelete: 'cascade' }),
    channelId: text('channel_id')
      .notNull()
      .references(() => salesChannel.id, { onDelete: 'cascade' }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.ruleId, t.channelId] }) })
);

export const rule_target_product_categories = pgTable(
  'rule_target_product_categories_working',
  {
    ruleId: uuid('rule_id')
      .notNull()
      .references(() => rules.id, { onDelete: 'cascade' }),
    categoryId: text('category_id')
      .notNull()
      .references(() => productCategory.id, { onDelete: 'cascade' }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.ruleId, t.categoryId] }) })
);

export const rule_target_tags = pgTable(
  'rule_target_tags_working',
  {
    ruleId: uuid('rule_id')
      .notNull()
      .references(() => rules.id, { onDelete: 'cascade' }),
    tag: text('tag').notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.ruleId, t.tag] }) })
);

// --- Linked effects (same as v0) ---

export const rule_fees = pgTable(
  'rule_fees_working',
  {
    ruleId: uuid('rule_id')
      .notNull()
      .references(() => rules.id, { onDelete: 'cascade' }),
    feeId: text('fee_id')
      .notNull()
      .references(() => fee.id, { onDelete: 'cascade' }),
    priority: integer('priority').default(0),
  },
  (t) => ({ pk: primaryKey({ columns: [t.ruleId, t.feeId] }) })
);

export const rule_promotions = pgTable(
  'rule_promotions_working',
  {
    ruleId: uuid('rule_id')
      .notNull()
      .references(() => rules.id, { onDelete: 'cascade' }),
    promotionId: uuid('promotion_id')
      .notNull()
      .references(() => promotion.id, { onDelete: 'cascade' }),
    priority: integer('priority').default(0),
  },
  (t) => ({ pk: primaryKey({ columns: [t.ruleId, t.promotionId] }) })
);

export const rule_tax_rates = pgTable(
  'rule_tax_rates_working',
  {
    ruleId: uuid('rule_id')
      .notNull()
      .references(() => rules.id, { onDelete: 'cascade' }),
    taxRateId: text('tax_rate_id')
      .notNull()
      .references(() => taxRate.id, { onDelete: 'cascade' }),
    priority: integer('priority').default(0),
  },
  (t) => ({ pk: primaryKey({ columns: [t.ruleId, t.taxRateId] }) })
);

// --- Relations (Drizzle Relations v2) ---

export const rulesRelations = defineRelations(
  {
    rules,
    rule_access_config,
    rule_pricing_config,
    rule_target_products,
    rule_target_product_variants,
    rule_target_sales_channels,
    rule_target_product_categories,
    rule_target_tags,
    rule_fees,
    rule_promotions,
    rule_tax_rates,
    product,
    productVariant,
    productCategory,
    salesChannel,
    fee,
    promotion,
    taxRate,
    users,
    organizations,
  },
  (r) => ({
    rules: {
      accessConfig: r.one.rule_access_config({
        from: r.rules.id,
        to: r.rule_access_config.ruleId,
      }),
      pricingConfig: r.one.rule_pricing_config({
        from: r.rules.id,
        to: r.rule_pricing_config.ruleId,
      }),
      targetProducts: r.many.rule_target_products({
        from: r.rules.id,
        to: r.rule_target_products.ruleId,
      }),
      targetProductVariants: r.many.rule_target_product_variants({
        from: r.rules.id,
        to: r.rule_target_product_variants.ruleId,
      }),
      targetSalesChannels: r.many.rule_target_sales_channels({
        from: r.rules.id,
        to: r.rule_target_sales_channels.ruleId,
      }),
      targetProductCategories: r.many.rule_target_product_categories({
        from: r.rules.id,
        to: r.rule_target_product_categories.ruleId,
      }),
      targetTags: r.many.rule_target_tags({
        from: r.rules.id,
        to: r.rule_target_tags.ruleId,
      }),
      fees: r.many.rule_fees({
        from: r.rules.id,
        to: r.rule_fees.ruleId,
      }),
      promotions: r.many.rule_promotions({
        from: r.rules.id,
        to: r.rule_promotions.ruleId,
      }),
      taxes: r.many.rule_tax_rates({
        from: r.rules.id,
        to: r.rule_tax_rates.ruleId,
      }),
      organization: r.one.organizations({
        from: r.rules.orgId,
        to: r.organizations.id,
        optional: true,
      }),
      owner: r.one.users({
        from: r.rules.userId,
        to: r.users.id,
        optional: true,
      }),
    },
  })
);


