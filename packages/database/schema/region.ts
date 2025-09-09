import { sql } from 'drizzle-orm';
import { check, pgTable } from 'drizzle-orm/pg-core';
import { timeStamps } from '../schema/extend-timestamps';
import { currency } from './currency';
// import { paymentProvider } from './payment'; // Omitted for wallet-only test run

export const region = pgTable(
  'region',
  (t) => ({
    id: t.text('id').primaryKey().default(sql`'reg_' || nanoid()`),
    name: t.text('name').notNull(),
    currencyCode: t
      .text('currency_code')
      .references(() => currency.code)
      .notNull(),
    automaticTaxes: t.boolean('automatic_taxes').default(true),
    metadata: t.jsonb('metadata'),
    ...timeStamps({ softDelete: true }),
  }),
  (table) => [
    check('region_pk_check', sql`${table.id} SIMILAR TO 'reg_[0-9a-zA-Z]{12}'`),
  ]
);

export const regionCountry = pgTable('region_country', (t) => ({
  iso2: t.text('iso_2').primaryKey(),
  iso3: t.text('iso_3'),
  numCode: t.text('num_code').notNull(),
  name: t.text('name').notNull(),
  displayName: t.text('display_name').notNull(),
  regionId: t.text('region_id').references(() => region.id),
  metadata: t.jsonb('metadata'),
  ...timeStamps({ softDelete: true }),
}));

// Payment provider dependencies omitted in wallet-only run
export const regionPaymentProvider = pgTable(
  'region_payment_provider',
  (t) => ({
    id: t.text('id').primaryKey().default(sql`'rpp_' || nanoid()`),
    regionId: t
      .text('region_id')
      .references(() => region.id)
      .notNull(),
    paymentProviderId: t.text('payment_provider_id').notNull(),
    ...timeStamps({ softDelete: true }),
  }),
  (table) => [
    check(
      'region_payment_provider_pk_check',
      sql`${table.id} SIMILAR TO 'rpp_[0-9a-zA-Z]{12}'`
    ),
  ]
);

/** region */
// Relations are defined centrally in relations.ts using Drizzle RQB v2
