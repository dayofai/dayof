import { sql } from 'drizzle-orm';
import { index, pgEnum, pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { createdBy } from './extend-created-by';
import { timeStamps } from './extend-timestamps';

// Enum for pass ticket styles
export const walletTicketStyleEnum = pgEnum('wallet_ticket_style_enum', [
  'coupon',
  'event',
  'storeCard',
  'generic',
]);

// Certificates used to sign passes
export const walletCert = pgTable(
  'wallet_cert',
  (t) => ({
    id: t.text('id').primaryKey().default(sql`nanoid()`),
    certRef: t.text('cert_ref').notNull(),
    description: t.text('description'),
    isEnhanced: t.boolean('is_enhanced').notNull().default(false),
    teamId: t.text('team_id').notNull(),
    encryptedBundle: t.text('encrypted_bundle').notNull(),
    ...timeStamps({ softDelete: true }),
  }),
  (t) => ({
    byEnhanced: index('idx_wallet_certs_enhanced').on(t.isEnhanced),
    byTeam: index('idx_wallet_certs_team_id').on(t.teamId),
    uniqCertRef: uniqueIndex('uq_wallet_cert_cert_ref').on(t.certRef),
  })
);

// APNs authentication keys (p8)
export const walletApnsKey = pgTable(
  'wallet_apns_key',
  (t) => ({
    id: t.text('id').primaryKey().default(sql`nanoid()`),
    keyRef: t.text('key_ref').notNull(),
    teamId: t.text('team_id').notNull(),
    isActive: t.boolean('is_active').notNull().default(true),
    keyId: t.text('key_id').notNull(),
    encryptedP8Key: t.text('encrypted_p8_key').notNull(),
    ...timeStamps({ softDelete: true }),
  }),
  (t) => ({
    byTeamActive: index('idx_wallet_apns_key_team_active').on(
      t.teamId,
      t.isActive
    ),
    uniqTeamKey: uniqueIndex('uq_wallet_apns_key_team_key').on(
      t.teamId,
      t.keyId
    ),
    uniqKeyRef: uniqueIndex('uq_wallet_apns_key_key_ref').on(t.keyRef),
  })
);

// Pass type mapping to certificate
export const walletPassType = pgTable(
  'wallet_pass_type',
  (t) => ({
    id: t.text('id').primaryKey().default(sql`nanoid()`),
    passTypeIdentifier: t.text('pass_type_identifier').notNull(),
    certRef: t
      .text('cert_ref')
      .notNull()
      .references(() => walletCert.certRef),
    ...timeStamps({ softDelete: true }),
  }),
  (t) => ({
    byCertRef: index('idx_wallet_pass_type_cert_ref').on(t.certRef),
    uniqPassTypeIdentifier: uniqueIndex('uq_wallet_pass_type_identifier').on(
      t.passTypeIdentifier
    ),
  })
);

// Individual passes (hot row)
export const walletPass = pgTable(
  'wallet_pass',
  (t) => ({
    id: t.text('id').primaryKey().default(sql`nanoid()`),
    passTypeIdentifier: t.text('pass_type_identifier').notNull(),
    serialNumber: t.text('serial_number').notNull(),
    authenticationToken: t.text('authentication_token').notNull(),
    ticketStyle: walletTicketStyleEnum('ticket_style'),
    poster: t.boolean('poster').notNull().default(false),
    etag: t.text('etag'),
    ...timeStamps({ softDelete: true }),
    ...createdBy(),
  }),
  (t) => ({
    byUpdatedAt: index('idx_wallet_pass_updated_at').on(t.updatedAt),
    byAuthToken: index('idx_wallet_pass_auth_token').on(t.authenticationToken),
    uniqTypeSerial: uniqueIndex('uq_wallet_pass_type_serial').on(
      t.passTypeIdentifier,
      t.serialNumber
    ),
  })
);

// Registered devices
export const walletDevice = pgTable(
  'wallet_device',
  (t) => ({
    id: t.text('id').primaryKey().default(sql`nanoid()`),
    deviceLibraryIdentifier: t.text('device_library_identifier').notNull(),
    pushToken: t.text('push_token').notNull(),
    ...timeStamps({ softDelete: true }),
  }),
  (t) => ({
    uniqDeviceLibraryIdentifier: uniqueIndex(
      'uq_wallet_device_library_identifier'
    ).on(t.deviceLibraryIdentifier),
  })
);

// Device registrations to a pass
export const walletRegistration = pgTable(
  'wallet_registration',
  (t) => ({
    id: t.text('id').primaryKey().default(sql`nanoid()`),
    passId: t
      .text('pass_id')
      .notNull()
      .references(() => walletPass.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    deviceLibraryIdentifier: t
      .text('device_library_identifier')
      .notNull()
      .references(() => walletDevice.deviceLibraryIdentifier),
    passTypeIdentifier: t.text('pass_type_identifier').notNull(),
    serialNumber: t.text('serial_number').notNull(),
    active: t.boolean('active').notNull().default(true),
    ...timeStamps({ softDelete: true }),
    ...createdBy(),
  }),
  (t) => ({
    byPassRef: index('idx_wallet_registration_pass_ref').on(
      t.passTypeIdentifier,
      t.serialNumber
    ),
    byDeviceActive: index('idx_wallet_registration_device_active').on(
      t.deviceLibraryIdentifier,
      t.active
    ),
    uniqDevicePass: uniqueIndex('uq_wallet_registration_device_pass').on(
      t.deviceLibraryIdentifier,
      t.passId
    ),
    passIdIdx: index('wallet_registration_pass_id_idx').on(t.passId),
  })
);

// JSONB content split from the hot pass row (1-1)
export const walletPassContent = pgTable(
  'wallet_pass_content',
  (t) => ({
    id: t.text('id').primaryKey().default(sql`nanoid()`),
    passId: t
      .text('pass_id')
      .notNull()
      .references(() => walletPass.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    data: t.jsonb('data').notNull(),
    ...timeStamps({ softDelete: true }),
    ...createdBy(),
  }),
  (t) => ({
    uniqPass: uniqueIndex('uq_wallet_pass_content_pass_id').on(t.passId),
  })
);

// Relations are defined centrally in relations.ts using Drizzle RQB v2

// Types
export type WalletCert = typeof walletCert.$inferSelect;
export type NewWalletCert = typeof walletCert.$inferInsert;

export type WalletApnsKey = typeof walletApnsKey.$inferSelect;
export type NewWalletApnsKey = typeof walletApnsKey.$inferInsert;

export type WalletPassType = typeof walletPassType.$inferSelect;
export type NewWalletPassType = typeof walletPassType.$inferInsert;

export type WalletPass = typeof walletPass.$inferSelect;
export type NewWalletPass = typeof walletPass.$inferInsert;

export type WalletDevice = typeof walletDevice.$inferSelect;
export type NewWalletDevice = typeof walletDevice.$inferInsert;

export type WalletRegistration = typeof walletRegistration.$inferSelect;
export type NewWalletRegistration = typeof walletRegistration.$inferInsert;

export type WalletPassContent = typeof walletPassContent.$inferSelect;
export type NewWalletPassContent = typeof walletPassContent.$inferInsert;
