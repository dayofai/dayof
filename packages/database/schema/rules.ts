import { defineRelations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
} from 'drizzle-orm/pg-core';
import { createdBy } from './extend-created-by';
import { timeStamps } from './extend-timestamps';
import { fee } from './fee';
import { promotion } from './promotion';
import { taxRate } from './tax';

export const rules = pgTable(
  'rules',
  {
    id: serial('id').primaryKey(),
    code: text('code').notNull(), // e.g. “RULE-FREE-SHIP”
    name: text('name'),
    description: text('description'),
    domain: text('domain').notNull(), // pricing | shipping | tax …
    condition: jsonb('condition').notNull(), // DSL / tree for evaluator
    factKeys: jsonb('fact_keys').notNull(), // list of facts this rule touches
    priority: integer('priority').default(0),
    stackingBehavior: text('stacking_behavior').default('stack'), // stack | exclusive
    calculationPhase: text('calculation_phase'), // pre_discount | post_discount | final
    isActive: boolean('is_active').default(true),
    ...timeStamps({ softDelete: true }),
    ...createdBy(),
  },
  (t) => [
    index('rules_domain_idx').on(t.domain),
    index('rules_active_idx').on(t.isActive),
    index('rules_factkeys_gin').using('gin', t.factKeys),
  ]
);

export const ruleFees = pgTable(
  'rule_fees',
  {
    ruleId: integer('rule_id')
      .references(() => rules.id, { onDelete: 'cascade' })
      .notNull(),
    feeId: integer('fee_id')
      .references(() => fee.id, { onDelete: 'cascade' })
      .notNull(),
    priority: integer('priority').default(0),
    ...timeStamps({ softDelete: false }),
    ...createdBy(),
  },
  (t) => [primaryKey({ columns: [t.ruleId, t.feeId] })]
);

export const ruleTaxes = pgTable(
  'rule_taxes',
  {
    ruleId: integer('rule_id')
      .references(() => rules.id, { onDelete: 'cascade' })
      .notNull(),
    taxId: integer('tax_id')
      .references(() => taxRate.id, { onDelete: 'cascade' })
      .notNull(),
    ...timeStamps({ softDelete: false }),
    ...createdBy(),
  },
  (t) => [primaryKey({ columns: [t.ruleId, t.taxId] })]
);

export const rulePromotions = pgTable(
  'rule_promotions',
  {
    ruleId: integer('rule_id')
      .references(() => rules.id, { onDelete: 'cascade' })
      .notNull(),
    promotionId: integer('promotion_id')
      .references(() => promotion.id, { onDelete: 'cascade' })
      .notNull(),
    ...timeStamps({ softDelete: false }),
    ...createdBy(),
  },
  (t) => [primaryKey({ columns: [t.ruleId, t.promotionId] })]
);

// Relations

export const relations = defineRelations(
  {
    rules,
    fee,
    taxRate,
    promotion,
    ruleFees,
    ruleTaxes,
    rulePromotions,
  },
  (r) => ({
    /* ─────────── policies ─────────── */
    policies: {
      rules: r.many.rules({
        from: r.policies.id.through(r.policyRules.policyId),
        to: r.rules.id.through(r.policyRules.ruleId),
      }),
    },

    /* ─────────── rules ────────────── */
    rules: {
      policyLinks: r.many.policyRules(), // keep junction visible when needed
      fees: r.many.fees({
        from: r.rules.id.through(r.ruleFees.ruleId),
        to: r.fees.id.through(r.ruleFees.feeId),
      }),
      taxes: r.many.taxes({
        from: r.rules.id.through(r.ruleTaxes.ruleId),
        to: r.taxes.id.through(r.ruleTaxes.taxId),
      }),
      promotions: r.many.promotions({
        from: r.rules.id.through(r.rulePromotions.ruleId),
        to: r.promotions.id.through(r.rulePromotions.promotionId),
      }),
    },

    /* ───────── junction tables ────── */
    policyRules: {
      policy: r.one.policies({
        from: r.policyRules.policyId,
        to: r.policies.id,
      }),
      rule: r.one.rules({ from: r.policyRules.ruleId, to: r.rules.id }),
    },

    ruleFees: {
      rule: r.one.rules({ from: r.ruleFees.ruleId, to: r.rules.id }),
      fee: r.one.fees({ from: r.ruleFees.feeId, to: r.fees.id }),
    },

    ruleTaxes: {
      rule: r.one.rules({ from: r.ruleTaxes.ruleId, to: r.rules.id }),
      tax: r.one.taxes({ from: r.ruleTaxes.taxId, to: r.taxes.id }),
    },

    rulePromotions: {
      rule: r.one.rules({ from: r.rulePromotions.ruleId, to: r.rules.id }),
      promotion: r.one.promotions({
        from: r.rulePromotions.promotionId,
        to: r.promotions.id,
      }),
    },

    /* ─────────── leaf tables ───────── */
    fees: { ruleLinks: r.many.ruleFees() },
    taxes: { ruleLinks: r.many.ruleTaxes() },
    promotions: { ruleLinks: r.many.rulePromotions() },
  })
);
