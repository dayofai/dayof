import { sql } from 'drizzle-orm';
import { index, pgTable } from 'drizzle-orm/pg-core';
import { createdBy } from './extend-created-by';
import { timeStamps } from './extend-timestamps';
import { regionCountry } from './region';

export const address = pgTable(
  'address',
  (t) => ({
    id: t.text('id').primaryKey().default(sql`nanoid()`),
    addressName: t.text('address_name'),
    isDefaultShipping: t
      .boolean('is_default_shipping')
      .default(false)
      .notNull(),
    isDefaultBilling: t.boolean('is_default_billing').default(false).notNull(),
    company: t.text('company'),
    firstName: t.text('first_name'),
    lastName: t.text('last_name'),
    address1: t.text('address_1').notNull(),
    address2: t.text('address_2'),
    city: t.text('city').notNull(),
    countryCode: t
      .text('country_code')
      .references(() => regionCountry.iso2)
      .notNull(),
    province: t.text('province'),
    postalCode: t.text('postal_code').notNull(),
    longitude: t.doublePrecision('longitude'),
    latitude: t.doublePrecision('latitude'),
    originalPhoneNumber: t.text('original_phone_number').notNull(),
    e164PhoneNumber: t.text('e164_phone_number').notNull(),
    metadata: t.jsonb('metadata'),
    ...timeStamps({ softDelete: true }),
    ...createdBy(),
  }),
  (table) => ({
    countryCodeIdx: index('address_country_code_idx').on(table.countryCode),
  })
);
