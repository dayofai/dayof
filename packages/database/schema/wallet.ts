import { sql } from 'drizzle-orm';
import { pgEnum, pgTable } from 'drizzle-orm/pg-core';
import { timeStamps } from './extend-timestamps';

export const walletTicketStyleEnum = pgEnum('wallet_ticket_style_enum', [
  'coupon',
  'event',
  'storeCard',
  'generic',
]);

export const walletCert = pgTable(
  'wallet_cert',
  (t) => ({
    certRef: t.text('cert_ref').primaryKey(),
    description: t.text('description'),
    isEnhanced: t.boolean('is_enhanced').default(false).notNull(),
    teamId: t.text('team_id').notNull(),
    encryptedBundle: t.text('encrypted_bundle').notNull(),
    ...timeStamps({ softDelete: false }),
  }),
  (table) => [
    // indexes
    sql`CREATE INDEX IF NOT EXISTS idx_wallet_certs_enhanced ON ${table} (is_enhanced)` as unknown as never,
    sql`CREATE INDEX IF NOT EXISTS idx_wallet_certs_team_id ON ${table} (team_id)` as unknown as never,
  ]
);

export const walletApnsKey = pgTable(
  'wallet_apns_key',
  (t) => ({
    keyRef: t.text('key_ref').primaryKey(),
    teamId: t.text('team_id').notNull(),
    isActive: t.boolean('is_active').default(true).notNull(),
    keyId: t.text('key_id').notNull(),
    encryptedP8Key: t.text('encrypted_p8_key').notNull(),
    ...timeStamps({ softDelete: false }),
  }),
  (table) => [
    sql`CREATE INDEX IF NOT EXISTS idx_wallet_apns_key_team_active ON ${table} (team_id, is_active)` as unknown as never,
    sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_wallet_apns_key_team_key ON ${table} (team_id, key_id)` as unknown as never,
  ]
);

export const walletPassType = pgTable(
  'wallet_pass_type',
  (t) => ({
    passTypeIdentifier: t.text('pass_type_identifier').primaryKey(),
    certRef: t
      .text('cert_ref')
      .references(() => walletCert.certRef)
      .notNull(),
    ...timeStamps({ softDelete: false }),
  }),
  (table) => [
    sql`CREATE INDEX IF NOT EXISTS idx_wallet_pass_type_cert_ref ON ${table} (cert_ref)` as unknown as never,
  ]
);

export const walletPass = pgTable(
  'wallet_pass',
  (t) => ({
    serialNumber: t.text('serial_number').notNull(),
    passTypeIdentifier: t
      .text('pass_type_identifier')
      .references(() => walletPassType.passTypeIdentifier, {
        onUpdate: 'restrict',
      })
      .notNull(),
    authenticationToken: t.text('authentication_token').notNull(),
    ticketStyle: walletTicketStyleEnum('ticket_style'),
    poster: t.boolean('poster').default(false).notNull(),
    etag: t.text('etag'),
    ...timeStamps({ softDelete: false }),
  }),
  (table) => [
    sql`ALTER TABLE ${table} ADD PRIMARY KEY (pass_type_identifier, serial_number)` as unknown as never,
    sql`CREATE INDEX IF NOT EXISTS idx_wallet_pass_updated_at ON ${table} (updated_at)` as unknown as never,
  ]
);

export const walletDevice = pgTable('wallet_device', (t) => ({
  deviceLibraryIdentifier: t.text('device_library_identifier').primaryKey(),
  pushToken: t.text('push_token').notNull(),
  ...timeStamps({ softDelete: false }),
}));

export const walletRegistration = pgTable(
  'wallet_registration',
  (t) => ({
    deviceLibraryIdentifier: t
      .text('device_library_identifier')
      .references(() => walletDevice.deviceLibraryIdentifier)
      .notNull(),
    passTypeIdentifier: t.text('pass_type_identifier').notNull(),
    serialNumber: t.text('serial_number').notNull(),
    active: t.boolean('active').default(true).notNull(),
    ...timeStamps({ softDelete: false }),
  }),
  (table) => [
    sql`ALTER TABLE ${table} ADD PRIMARY KEY (device_library_identifier, pass_type_identifier, serial_number)` as unknown as never,
    sql`CREATE INDEX IF NOT EXISTS idx_wallet_registration_pass_ref ON ${table} (pass_type_identifier, serial_number)` as unknown as never,
    sql`CREATE INDEX IF NOT EXISTS idx_wallet_registration_device_active ON ${table} (device_library_identifier, active)` as unknown as never,
    sql`ALTER TABLE ${table} ADD CONSTRAINT wallet_registration_pass_fk
        FOREIGN KEY (pass_type_identifier, serial_number)
        REFERENCES wallet_pass(pass_type_identifier, serial_number)
        ON UPDATE CASCADE ON DELETE CASCADE` as unknown as never,
  ]
);

export const walletPassContent = pgTable(
  'wallet_pass_content',
  (t) => ({
    passTypeIdentifier: t.text('pass_type_identifier').notNull(),
    serialNumber: t.text('serial_number').notNull(),
    data: t.jsonb('data').notNull(),
    ...timeStamps({ softDelete: false }),
  }),
  (table) => [
    sql`ALTER TABLE ${table} ADD PRIMARY KEY (pass_type_identifier, serial_number)` as unknown as never,
    sql`ALTER TABLE ${table} ADD CONSTRAINT wallet_pass_content_fk
        FOREIGN KEY (pass_type_identifier, serial_number)
        REFERENCES wallet_pass(pass_type_identifier, serial_number)
        ON UPDATE CASCADE ON DELETE CASCADE` as unknown as never,
  ]
);
