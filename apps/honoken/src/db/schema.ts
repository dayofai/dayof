import { pgTable, text, timestamp, boolean, primaryKey, foreignKey, index, uniqueIndex, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';

export const ticketStyleEnum = pgEnum('ticket_style_enum', ['coupon', 'event', 'storeCard', 'generic']);

export const certs = pgTable('certs', {
    certRef: text('cert_ref').primaryKey(),              // Human-readable key
    description: text('description'),                     // Description of the certificate
    isEnhanced: boolean('is_enhanced').default(false).notNull(),
    teamId: text('team_id').notNull(),
    encryptedBundle: text('encrypted_bundle').notNull(), // Base64 encoded encrypted certificate bundle
    iv: text('iv').notNull(),                             // Base64 encoded initialization vector
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().$onUpdate(() => new Date()),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    isEnhancedIdx: index('idx_certs_enhanced').on(table.isEnhanced),
}));

export const certsRelations = relations(certs, ({ many }) => ({
 passTypes: many(passTypes),
}));

/**
 * Table for storing APNS key information
 */
export const apnsKeys = pgTable('apns_keys', {
  keyRef: text('key_ref').primaryKey(),
  teamId: text('team_id').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  keyId: text('key_id').notNull(),
  encryptedP8Key: text('encrypted_p8_key').notNull(), // Base64 encoded encrypted APNs P8 key
  iv: text('iv').notNull(),                             // Base64 encoded initialization vector
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().$onUpdate(() => new Date()),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    teamIdx: index('idx_apns_keys_team_id').on(table.teamId),
  };
});

export const passTypes = pgTable('pass_types', {
    passTypeIdentifier: text('pass_type_identifier').primaryKey(),
    certRef: text('cert_ref')
        .notNull()
        .references(() => certs.certRef),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => ({
    certRefIdx: index('idx_pass_types_cert_ref').on(table.certRef),
}));

export const passTypesRelations = relations(passTypes, ({ one, many }) => ({
 cert: one(certs, {
  fields: [passTypes.certRef],
  references: [certs.certRef],
 }),
 passes: many(passes),
}));

export const passes = pgTable('passes', {
    serialNumber: text('serial_number').notNull(),
    passTypeIdentifier: text('pass_type_identifier').notNull(),
    authenticationToken: text('authentication_token').notNull(),
    ticketStyle: ticketStyleEnum('ticket_style'),
    poster: boolean('poster').default(false).notNull(),
    etag: text('etag'),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.passTypeIdentifier, table.serialNumber] }),
        lastUpdatedIdx: index('idx_passes_last_updated').on(table.updatedAt),
        // FK to pass_types for multi-cert architecture
        passTypeFk: foreignKey({
            columns: [table.passTypeIdentifier],
            foreignColumns: [passTypes.passTypeIdentifier],
        }).onUpdate('restrict'),
    };
});

export const passesRelations = relations(passes, ({ one, many }) => ({
 passType: one(passTypes, {
  fields: [passes.passTypeIdentifier],
  references: [passTypes.passTypeIdentifier],
 }),
 registrations: many(registrations),
}));

/**
 * Table for storing device information
 */
export const devices = pgTable('devices', {
  deviceLibraryIdentifier: text('device_library_identifier').primaryKey(),
  pushToken: text('push_token').notNull(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const devicesRelations = relations(devices, ({ many }) => ({
 registrations: many(registrations),
}));

/**
 * Table for storing pass registrations for devices
 */
export const registrations = pgTable('registrations', {
  deviceLibraryIdentifier: text('device_library_identifier')
    .notNull()
    .references(() => devices.deviceLibraryIdentifier),
  passTypeIdentifier: text('pass_type_identifier').notNull(),
  serialNumber: text('serial_number').notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => {
  return {
    pk: primaryKey({ 
      columns: [
        table.deviceLibraryIdentifier, 
        table.passTypeIdentifier, 
        table.serialNumber
      ] 
    }),
    // Foreign key to passes table (composite key)
    passRefIdx: index('idx_registrations_pass_ref').on(
      table.passTypeIdentifier, 
      table.serialNumber
    ),
    deviceActiveIdx: index("idx_registrations_device_active").on(table.deviceLibraryIdentifier, table.active),
    passRef: foreignKey({
      columns: [table.passTypeIdentifier, table.serialNumber],
      foreignColumns: [passes.passTypeIdentifier, passes.serialNumber],
    }).onUpdate('cascade').onDelete('cascade'),
  };
});

export const registrationsRelations = relations(registrations, ({ one }) => ({
 device: one(devices, {
  fields: [registrations.deviceLibraryIdentifier],
  references: [devices.deviceLibraryIdentifier],
 }),
 pass: one(passes, {
  fields: [registrations.passTypeIdentifier, registrations.serialNumber],
  references: [passes.passTypeIdentifier, passes.serialNumber],
 }),
}));

/**
 * Export all tables for use in the application
 */
export const schema = {
    certs,
    passTypes,
    passes,
    devices,
    registrations,
    ticketStyleEnum, // Added enum export as per guide
    apnsKeys,
    certsRelations,
    passTypesRelations,
    passesRelations,
    devicesRelations,
    registrationsRelations,
};