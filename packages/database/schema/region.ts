import { sql } from 'drizzle-orm';
import { index, pgTable } from 'drizzle-orm/pg-core';
import { currency } from './currency';
import { timeStamps } from './extend-timestamps';
// import { paymentProvider } from './payment'; // Omitted for wallet-only test run

export const region = pgTable(
  'region',
  (t) => ({
    id: t.text('id').primaryKey().default(sql`nanoid()`),
    name: t.text('name').notNull(),
    currencyCode: t
      .text('currency_code')
      .references(() => currency.code)
      .notNull(),
    automaticTaxes: t.boolean('automatic_taxes').default(true),
    metadata: t.jsonb('metadata'),
    ...timeStamps({ softDelete: true }),
  }),
  (table) => ({
    currencyCodeIdx: index('region_currency_code_idx').on(table.currencyCode),
  })
);

export const regionCountry = pgTable(
  'region_country',
  (t) => ({
    iso2: t.text('iso_2').primaryKey(),
    iso3: t.text('iso_3'),
    numCode: t.text('num_code').notNull(),
    name: t.text('name').notNull(),
    displayName: t.text('display_name').notNull(),
    regionId: t.text('region_id').references(() => region.id),
    metadata: t.jsonb('metadata'),
    ...timeStamps({ softDelete: true }),
  }),
  (table) => ({
    regionIdIdx: index('region_country_region_id_idx').on(table.regionId),
  })
);

// Payment provider dependencies omitted in wallet-only run
export const regionPaymentProvider = pgTable(
  'region_payment_provider',
  (t) => ({
    id: t.text('id').primaryKey().default(sql`nanoid()`),
    regionId: t
      .text('region_id')
      .references(() => region.id)
      .notNull(),
    paymentProviderId: t.text('payment_provider_id').notNull(),
    ...timeStamps({ softDelete: true }),
  }),
  (table) => ({
    regionIdIdx: index('region_payment_provider_region_id_idx').on(
      table.regionId
    ),
  })
);

/** region */
// Relations are defined centrally in relations.ts using Drizzle RQB v2
