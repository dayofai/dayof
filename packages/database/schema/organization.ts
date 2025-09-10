import { sql } from 'drizzle-orm';
import { pgTable, unique } from 'drizzle-orm/pg-core';
import { address } from './address';
import { organization } from './better-auth';
import { currency } from './currency';
import { ianaTimezone } from './custom-types';
import { createdBy } from './extend-created-by';
import { timeStamps } from './extend-timestamps';
import { regionCountry } from './region';
import { taxRate } from './tax';

// core organization settings (account-level defaults)
export const organizationSettings = pgTable(
  'organization_settings',
  (t) => ({
    id: t.text('id').primaryKey().default(sql`nanoid()`),
    orgId: t
      .text('org_id')
      .references(() => organization.id, { onDelete: 'cascade' })
      .notNull(),

    // business defaults
    defaultCurrencyCode: t
      .text('default_currency_code')
      .references(() => currency.code)
      .notNull(),
    defaultCountryCode: t
      .text('default_country_code')
      .references(() => regionCountry.iso2)
      .notNull(),
    defaultTimezone: ianaTimezone('default_timezone').notNull(),

    // tax & fee settings
    defaultTaxRateId: t
      .text('default_tax_rate_id')
      .references(() => taxRate.id)
      .notNull(),
    defaultIsTaxInclusive: t
      .boolean('default_is_tax_inclusive')
      .default(false)
      .notNull(),
    defaultIsFeeInclusive: t
      .boolean('default_is_fee_inclusive')
      .default(false)
      .notNull(),

    // business info
    businessName: t.text('business_name').notNull(),
    businessEmail: t.text('business_email'),
    businessPhone: t.text('business_phone'),
    businessAddressId: t
      .text('business_address_id')
      .references(() => address.id),
    taxEin: t.text('tax_ein'),

    // feature controls for posthog
    // pre-emptive maniac feature flag support
    featureFlags: t.jsonb('feature_flags').default({
      enabled: {}, // enabled features
      overrides: {}, // org-wide overrides
    }),
    metadata: t.jsonb('metadata'),
    ...timeStamps({ softDelete: true }),
  }),
  (table) => [unique('org_settings_org_unique').on(table.orgId)]
);

// brand profiles for different identities within an organization
// I'll need to link this up on the event level

export const brandProfile = pgTable('brand_profile', (t) => ({
  id: t.text('id').primaryKey().default(sql`nanoid()`),

  // profile
  name: t.text('name').notNull(),
  handle: t.text('handle').notNull(),
  description: t.text('description'),

  // brand identity
  brandIdentity: t.jsonb('brand_identity').default({
    //   need to define the schema for this e.g.:
    //   logo: null,
    //   banner: null,
    //   colors: {
    //     primary: "#000000",
    //     secondary: "#ffffff"
    //   }
  }),

  // contact / social
  email: t.text('email'),
  phone: t.text('phone'),
  website: t.text('website'),
  socialLinks: t.jsonb('social_links'), // need to define schema for this

  // optional overrides of org settings
  currencyCode: t.text('currency_code').references(() => currency.code),
  countryCode: t.text('country_code').references(() => regionCountry.iso2),

  // tax & fee settings
  // null by default - use org default if null
  defaultTaxRateId: t.text('default_tax_rate_id').references(() => taxRate.id),
  defaultIsTaxInclusive: t.boolean('default_is_tax_inclusive'),
  defaultIsFeeInclusive: t.boolean('default_is_fee_inclusive'),

  isDefault: t.boolean('is_default').default(false).notNull(),

  metadata: t.jsonb('metadata'),
  ...timeStamps({ softDelete: true }),
  ...createdBy(),
}));
