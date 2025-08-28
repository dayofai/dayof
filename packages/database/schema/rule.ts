import { defineRelations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  uuid,
} from 'drizzle-orm/pg-core';
import { organizations, users } from './better-auth';
// Referenced tables from other schema files
import { createdBy } from './extend-created-by';
import { timeStamps } from './extend-timestamps';
import { fee } from './fee';
import { product, productCategory, productVariant } from './product';
import { promotion } from './promotion';
import { salesChannel } from './sales-channel';
import { taxRate } from './tax';

// --- Enums & Core Rule Table ---

/**

- Defines the actor model for rule ownership, aligning with Better Auth.
- This is the cornerstone of the "Unified Actor Model" principle.
- - 'system': A platform-level rule available to all organizations.
- - 'user': A rule created by a specific user within an organization.
- - 'api_token': A rule created programmatically via an API token.
*/

/**

- The core `rules` table.
- This table is intentionally lean and generic, containing only universally
- applicable fields. It is the concrete implementation of the "Policy as Data" axiom.
*/
export const rules = pgTable(
  'rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // CORE DEFINITION
    domain: text('domain').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    condition: jsonb('condition').notNull(), // The rule logic AST
    effect: text('effect').notNull(), // 'allow', 'deny', or 'linked'

    // PERFORMANCE OPTIMIZATION: For the "Two-Pass" model.
    factKeys: text('fact_keys').array(),

    // EVALUATION CONTROL
    priority: integer('priority').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),

    /**

- THE ROLE OF 'VARIABLES': RULE CONFIGURATION VS. RUNTIME FACTS
- ***
- This `jsonb` column is essential for separating a rule's timeless LOGIC
- from its specific CONFIGURATION.
-
- - A FACT (e.g., `user.age`) is dynamic data fetched at runtime to represent
- the current state of the world.
- - A VARIABLE (e.g., `minimumAge`) is a static parameter defined _with the rule_
- to make its logic configurable without altering the `condition` AST.
-
- EXAMPLE:
- condition: `{ "fact": "user.age", "operator": "gte", "value": "{{minimumAge}}" }`
- variables: `{ "minimumAge": 21 }`
-
- Before evaluation, the engine substitutes `{{minimumAge}}` with `21`.
-
- WHY THIS IS CRITICAL:
- 1.  **GUI-Friendly:** A non-technical user can change `21` to `18` in a simple
-     form field, which just updates this `variables` object. They never need
-     to see or edit the complex `condition` JSON.
- 2.  **Reusability:** Allows for the creation of rule templates (e.g., system rules)
-     where the logic is fixed but the thresholds are customizable per organization.
*/
    variables: jsonb('variables').default('{}'),

    message: text('message'),

    // AUDITING
    ...timeStamps({ softDelete: true }),
    ...createdBy(),
  },
  (table) => ({
    // INDEXES
    domainOrgIdx: index('rules_domain_org_idx').on(table.domain, table.orgId),
    factKeysGinIdx: index('rules_fact_keys_gin').using('gin', table.factKeys),
    activeIdx: index('rules_active_idx')
      .on(table.isActive)
      .where(sql`"deletedAt" IS NULL`),

    // CONSTRAINTS
    actorCheck: check(
      'rules_actor_check',
      sql`     (actor_type = 'system' AND actor_id IS NULL AND org_id IS NULL) OR
    (actor_type IN ('user', 'api_token') AND org_id IS NOT NULL)
  `
    ),
  })
);

// --- Domain-Specific Extension Tables (Elegant Modularity) ---

/**

- Domain-specific configuration for 'access' rules.
- This table uses a one-to-one relationship with `rules`, allowing the `access`
- domain to have its own schema without polluting the core `rules` table.
*/
export const rule_access_config = pgTable('rule_access_config', {
  ruleId: uuid('rule_id')
    .primaryKey()
    .references(() => rules.id, { onDelete: 'cascade' }),
  priorityGroup: text('priority_group'), // 'override' | 'deny' | 'require'
});

/**

- Domain-specific configuration for 'pricing' rules.
*/
export const rule_pricing_config = pgTable('rule_pricing_config', {
  ruleId: uuid('rule_id')
    .primaryKey()
    .references(() => rules.id, { onDelete: 'cascade' }),
  stackingBehavior: text('stacking_behavior'), // 'compound' | 'sequential' | 'max'
  calculationPhase: text('calculation_phase'), // 'pre_discount' | 'post_discount'
});

// --- Explicit Junction Tables for Targeting (No Polymorphism!) ---

// --- CONCRETE ENTITY TARGETS ---

export const rule_target_products = pgTable(
  'rule_target_products',
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
  'rule_target_product_variants',
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

// export const rule_target_events = pgTable('rule_target_events', { ... });
// export const rule_target_locations = pgTable('rule_target_locations', { ... });
// export const rule_target_customers = pgTable('rule_target_customers', { ... });

export const rule_target_sales_channels = pgTable(
  'rule_target_sales_channels',
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

// --- ABSTRACT GROUPING TARGETS ---

export const rule_target_tags = pgTable(
  'rule_target_tags',
  {
    ruleId: uuid('rule_id')
      .notNull()
      .references(() => rules.id, { onDelete: 'cascade' }),
    tag: text('tag').notNull(), // The literal tag string, e.g., 'vip-event'
  },
  (t) => ({ pk: primaryKey({ columns: [t.ruleId, t.tag] }) })
);

export const rule_target_product_categories = pgTable(
  'rule_target_product_categories',
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

// export const rule_target_event_groups = pgTable('rule_target_event_groups', { ... });

// Links 'pricing' rules to specific fees when `effect` is 'linked'.

export const rule_fees = pgTable(
  'rule_fees',
  {
    ruleId: uuid('rule_id')
      .notNull()
      .references(() => rules.id, { onDelete: 'cascade' }),
    feeId: text('fee_id')
      .notNull()
      .references(() => fee.id, { onDelete: 'cascade' }),
    priority: integer('priority').default(0),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.ruleId, t.feeId] }),
  })
);

// links 'pricing' rules to specific promotions.
export const rule_promotions = pgTable(
  'rule_promotions',
  {
    ruleId: uuid('rule_id')
      .notNull()
      .references(() => rules.id, { onDelete: 'cascade' }),
    promotionId: uuid('promotion_id')
      .notNull()
      .references(() => promotion.id, { onDelete: 'cascade' }),
    priority: integer('priority').default(0),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.ruleId, t.promotionId] }),
  })
);

// Links 'pricing' rules to specific tax rates.

export const rule_tax_rates = pgTable(
  'rule_tax_rates',
  {
    ruleId: uuid('rule_id')
      .notNull()
      .references(() => rules.id, { onDelete: 'cascade' }),
    taxRateId: text('tax_rate_id')
      .notNull()
      .references(() => taxRate.id, { onDelete: 'cascade' }),
    priority: integer('priority').default(0),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.ruleId, t.taxRateId] }),
  })
);

/**
 * Defines all relations for the policy engine, enabling clean, type-safe,
 * and efficient queries using Drizzle's `with` clause.
 *
 * This includes:
 * 1. Forward relations from rules to their configurations, targets, and effects
 * 2. Back-references from targeted entities (products, variants, etc.) to find applicable rules
 * 3. Back-references from effect entities (fees, promotions, taxes) for impact analysis
 * 4. Ownership relations connecting rules to users and organizations for multi-tenancy
 *
 * These relations enable powerful queries like:
 * - "Show all rules that apply to this product"
 * - "Show all rules that use this fee"
 * - "Show all rules created by this user"
 * - "Get a rule with all its targets and effects in one query"
 */
export const policyRelations = defineRelations(
  {
    rules,
    rule_access_config,
    rule_pricing_config,
    rule_target_products,
    rule_target_product_variants,
    rule_target_sales_channels,
    rule_target_tags,
    rule_target_product_categories,
    rule_fees,
    rule_promotions,
    rule_tax_rates,
    fee,
    promotion,
    taxRate,
    product,
    productVariant,
    productCategory,
    salesChannel,
    users,
    organizations,
  },
  (r) => ({
    // Main rules table relations
    rules: {
      // One-to-One relations for domain-specific config
      accessConfig: r.one.rule_access_config({
        from: r.rules.id,
        to: r.rule_access_config.ruleId,
      }),
      pricingConfig: r.one.rule_pricing_config({
        from: r.rules.id,
        to: r.rule_pricing_config.ruleId,
      }),

      // One-to-Many relations for targets (now explicit, not polymorphic!)
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
      targetTags: r.many.rule_target_tags({
        from: r.rules.id,
        to: r.rule_target_tags.ruleId,
      }),
      targetProductCategories: r.many.rule_target_product_categories({
        from: r.rules.id,
        to: r.rule_target_product_categories.ruleId,
      }),

      // One-to-Many relations for linked effects
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

      // Ownership relations
      organization: r.one.organizations({
        from: r.rules.orgId,
        to: r.organizations.id,
        optional: true, // orgId can be null for system rules
      }),
      owner: r.one.users({
        from: r.rules.userId,
        to: r.users.id,
        optional: true, // userId can be null for system rules
      }),
    },

    // Back-references for querying from the extension tables
    rule_access_config: {
      rule: r.one.rules({
        from: r.rule_access_config.ruleId,
        to: r.rules.id,
      }),
    },
    rule_pricing_config: {
      rule: r.one.rules({
        from: r.rule_pricing_config.ruleId,
        to: r.rules.id,
      }),
    },

    // Back-references from target tables
    rule_target_products: {
      rule: r.one.rules({
        from: r.rule_target_products.ruleId,
        to: r.rules.id,
      }),
      product: r.one.product({
        from: r.rule_target_products.productId,
        to: r.product.id,
      }),
    },
    rule_target_product_variants: {
      rule: r.one.rules({
        from: r.rule_target_product_variants.ruleId,
        to: r.rules.id,
      }),
      variant: r.one.productVariant({
        from: r.rule_target_product_variants.variantId,
        to: r.productVariant.id,
      }),
    },
    rule_target_sales_channels: {
      rule: r.one.rules({
        from: r.rule_target_sales_channels.ruleId,
        to: r.rules.id,
      }),
      channel: r.one.salesChannel({
        from: r.rule_target_sales_channels.channelId,
        to: r.salesChannel.id,
      }),
    },
    rule_target_tags: {
      rule: r.one.rules({
        from: r.rule_target_tags.ruleId,
        to: r.rules.id,
      }),
    },
    rule_target_product_categories: {
      rule: r.one.rules({
        from: r.rule_target_product_categories.ruleId,
        to: r.rules.id,
      }),
      category: r.one.productCategory({
        from: r.rule_target_product_categories.categoryId,
        to: r.productCategory.id,
      }),
    },

    // Junction table relations with "through" relations to get full effect details
    rule_fees: {
      rule: r.one.rules({
        from: r.rule_fees.ruleId,
        to: r.rules.id,
      }),
      fee: r.one.fee({
        from: r.rule_fees.feeId,
        to: r.fee.id,
      }),
    },
    rule_promotions: {
      rule: r.one.rules({
        from: r.rule_promotions.ruleId,
        to: r.rules.id,
      }),
      promotion: r.one.promotion({
        from: r.rule_promotions.promotionId,
        to: r.promotion.id,
      }),
    },
    rule_tax_rates: {
      rule: r.one.rules({
        from: r.rule_tax_rates.ruleId,
        to: r.rules.id,
      }),
      taxRate: r.one.taxRate({
        from: r.rule_tax_rates.taxRateId,
        to: r.taxRate.id,
      }),
    },

    // Back-references from targeted entities
    product: {
      ruleTargets: r.many.rule_target_products({
        from: r.product.id,
        to: r.rule_target_products.productId,
      }),
    },
    productVariant: {
      ruleTargets: r.many.rule_target_product_variants({
        from: r.productVariant.id,
        to: r.rule_target_product_variants.variantId,
      }),
    },
    salesChannel: {
      ruleTargets: r.many.rule_target_sales_channels({
        from: r.salesChannel.id,
        to: r.rule_target_sales_channels.channelId,
      }),
    },
    productCategory: {
      ruleTargets: r.many.rule_target_product_categories({
        from: r.productCategory.id,
        to: r.rule_target_product_categories.categoryId,
      }),
    },

    // Back-references from effect entities
    fee: {
      ruleLinks: r.many.rule_fees({
        from: r.fee.id,
        to: r.rule_fees.feeId,
      }),
    },
    promotion: {
      ruleLinks: r.many.rule_promotions({
        from: r.promotion.id,
        to: r.rule_promotions.promotionId,
      }),
    },
    taxRate: {
      ruleLinks: r.many.rule_tax_rates({
        from: r.taxRate.id,
        to: r.rule_tax_rates.taxRateId,
      }),
    },

    // Back-references from ownership entities
    users: {
      rulesCreated: r.many.rules({
        from: r.users.id,
        to: r.rules.userId,
      }),
    },
    organizations: {
      rules: r.many.rules({
        from: r.organizations.id,
        to: r.rules.orgId,
      }),
    },
  })
);
