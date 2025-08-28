import { z } from 'zod/v4';

// Apple Wallet field dictionary keys: https://developer.apple.com/library/archive/documentation/UserExperience/Reference/PassKit_Bundle/Chapters/FieldDictionary.html#//apple_ref/doc/uid/TP40012026-CH4-SW1
// Value can be string, number, or date (ISO 8601 string).
// For numbers, Wallet may format them based on `numberStyle`. Dates can have `dateStyle` and `timeStyle`.
// We'll keep value flexible here; specific formatting attributes can be added if needed.
export const PassFieldSchema = z.object({
  key: z.string().min(1, { error: "Field 'key' cannot be empty." }),
  label: z.string().min(1, { error: "Field 'label' cannot be empty." }),
  value: z.union([
    z.string().min(1, { error: "Field 'value' (string) cannot be empty." }),
    z.number(),
    // For dates, expect ISO 8601 string format from the DB/passData
    z.iso.datetime({ error: "Field 'value' (date) must be a valid ISO 8601 date string." })
  ]),
  changeMessage: z.string().optional(), // e.g., "Gate changed to %@"
  textAlignment: z.enum(['PKTextAlignmentLeft', 'PKTextAlignmentCenter', 'PKTextAlignmentRight', 'PKTextAlignmentNatural']).optional(),
  dateStyle: z.enum(['PKDateStyleNone', 'PKDateStyleShort', 'PKDateStyleMedium', 'PKDateStyleLong', 'PKDateStyleFull']).optional(),
  timeStyle: z.enum(['PKDateStyleNone', 'PKDateStyleShort', 'PKDateStyleMedium', 'PKDateStyleLong', 'PKDateStyleFull']).optional(),
  isRelative: z.boolean().optional(),
  currencyCode: z.string().optional(),
  numberStyle: z.enum(['PKNumberStyleDecimal', 'PKNumberStylePercent', 'PKNumberStyleScientific', 'PKNumberStyleSpellOut']).optional(),
});

export const EventTicketStructureSchema = z.object({
  primaryFields: z.array(PassFieldSchema).min(1, {
    error: "eventTicket must have at least one primaryField.",
  }),
  secondaryFields: z.array(PassFieldSchema).optional(),
  auxiliaryFields: z.array(PassFieldSchema).optional(),
  headerFields: z.array(PassFieldSchema).optional(), // Often used for event type or logo text
  backFields: z.array(PassFieldSchema).optional(),   // Content for the back of the pass
});

// https://developer.apple.com/library/archive/documentation/UserExperience/Reference/PassKit_Bundle/Chapters/LowerLevelKeys.html#//apple_ref/doc/uid/TP40012026-CH3-SW3
export const BarcodeSchema = z.object({
  format: z.enum([
    "PKBarcodeFormatQR",
    "PKBarcodeFormatPDF417",
    "PKBarcodeFormatAztec",
    "PKBarcodeFormatCode128",
  ]),
  message: z.string().min(1, { error: "Barcode 'message' cannot be empty." }),
  messageEncoding: z.string().min(1, { error: "Barcode 'messageEncoding' cannot be empty." }) // e.g., "iso-8859-1"
    .default("iso-8859-1"), // Common default
  altText: z.string().optional(),
}).optional(); // Barcode is optional for a pass

// --- Strict Pass Data Schema - Only requires Apple's absolute necessities ---
// This schema validates the `passData` object fetched from your database.
// The buildPass function will transform loose fields into proper eventTicket structure.
export const PassDataEventTicketSchema = z.object({
  // REQUIRED: Apple's absolute minimum requirements
  description: z.string().min(1, { error: "Pass 'description' is required by Apple." }),
  organizationName: z.string().min(1, { error: "Pass 'organizationName' is required by Apple." }),

  // OPTIONAL: Pre-structured eventTicket (if data is already in correct format)
  eventTicket: EventTicketStructureSchema.optional(),

  // OPTIONAL: Loose fields that buildPass can transform into eventTicket.primaryFields
  eventName: z.string().optional(),
  venueName: z.string().optional(), 
  eventDateISO: z.string().datetime({ error: "eventDateISO must be a valid ISO 8601 date string." }).optional(),
  seat: z.string().optional(),
  section: z.string().optional(),

  // OPTIONAL: Visual styling
  logoText: z.string().optional(),
  foregroundColor: z.string().regex(/^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/, {
    error: "foregroundColor must be in 'rgb(r, g, b)' format.",
  }).optional(),
  backgroundColor: z.string().regex(/^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/, {
    error: "backgroundColor must be in 'rgb(r, g, b)' format.",
  }).optional(),
  labelColor: z.string().regex(/^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/, {
    error: "labelColor must be in 'rgb(r, g, b)' format.",
  }).optional(),

  // OPTIONAL: Pass metadata
  groupingIdentifier: z.string().optional(),
  suppressStripShine: z.boolean().optional(),
  webServiceURL: z.url().optional(),
  authenticationToken: z.string().optional(),

  // OPTIONAL: Barcode data
  barcode: BarcodeSchema,
  barcodes: z.array(BarcodeSchema).optional(),

  // OPTIONAL: NFC (strict validation per README.md NFC compliance requirements)
  // Either provide valid NFC data or omit entirely - no empty encryption keys allowed
  nfc: z.object({
    message: z.string().min(1, { error: "NFC message cannot be empty" }),
    encryptionPublicKey: z.string()
      .min(1, { error: "NFC encryptionPublicKey cannot be empty - either provide a valid Base64-encoded ECDH P-256 public key or omit the nfc object entirely" })
      .regex(/^[A-Za-z0-9+/]+={0,2}$/, { 
        error: "NFC encryptionPublicKey must be a valid Base64-encoded string" 
      })
      .refine((key) => {
        // Basic length check - ECDH P-256 public keys are typically 64-91 characters when Base64 encoded
        return key.length >= 64 && key.length <= 200;
      }, {
        message: "NFC encryptionPublicKey appears to be invalid length for ECDH P-256 public key"
      }),
  }).optional(),

  // OPTIONAL: Location data
  locations: z.array(z.object({
    latitude: z.number(),
    longitude: z.number(),
    altitude: z.number().optional(),
    relevantText: z.string().optional(),
  })).optional(),

  maxDistance: z.number().positive().optional(),

  // OPTIONAL: Relevant Date (ISO 8601 string)
  relevantDate: z.iso.datetime({ error: "Relevant date must be a valid ISO 8601 date string."}).optional(),

  // OPTIONAL: Poster version for image cache busting
  posterVersion: z.number().optional(),

  // OPTIONAL: Additional semantic tag data for custom business logic
  // Allow any additional string, number, boolean, or ISO date fields for semantic tagging
  semanticTags: z.record(z.string(), z.union([
    z.string(),
    z.number(), 
    z.boolean(),
    z.string().datetime()
  ])).optional(),
}).strict(); // Use strict() - no unknown fields allowed except those explicitly defined

export type PassField = z.infer<typeof PassFieldSchema>;
export type EventTicketStructure = z.infer<typeof EventTicketStructureSchema>;
export type Barcode = z.infer<typeof BarcodeSchema>;
export type PassDataEventTicket = z.infer<typeof PassDataEventTicketSchema>; 