// Strict Zod schema for admin pass creation API

import { z } from 'zod/v4';

// RGB: 'rgb(0, 0, 0)'
export const rgbStringRegex = /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/;

// Accepts a strict object for /admin/create-pass
export const CreatePassSchema = z
  .object({
    // Identifiers/metadata
    passTypeIdentifier: z.string().min(1).optional(),
    certRef: z.string().min(1).optional(),
    serialNumber: z.string().min(1).optional(),
    // authenticationToken: removed
    // Main required metadata (Apple Wallet requirement)
    description: z.string().optional(),
    organizationName: z.string().optional(),
    logoText: z.string().optional(),
    groupingIdentifier: z.string().optional(),
    eventName: z.string().optional(),
    eventDateISO: z
      .string()
      .datetime({ message: 'eventDateISO must be ISO8601 datetime' })
      .optional(),
    venueName: z.string().optional(),
    seat: z.string().optional(),
    section: z.string().optional(),
    poster: z.coerce.boolean().optional(),
    barcodeMessage: z.string().optional(),

    // Visuals/colors
    foregroundColor: z.string().regex(rgbStringRegex).optional(),
    backgroundColor: z.string().regex(rgbStringRegex).optional(),
    labelColor: z.string().regex(rgbStringRegex).optional(),

    maxDistance: z.number().positive().optional(),
    relevantDate: z
      .string()
      .datetime({ message: 'relevantDate must be ISO8601 datetime' })
      .optional(),
    locations: z
      .array(
        z.object({
          latitude: z.number(),
          longitude: z.number(),
          altitude: z.number().optional(),
          relevantText: z.string().optional(),
        }),
      )
      .optional(),
    semanticTags: z
      .record(
        z.string(),
        z.union([
          z.string(),
          z.number(),
          z.boolean(),
          z.string().datetime({ message: 'semanticTags values must be datetimes if date' }),
        ]),
      )
      .optional(),
    webServiceURL: z.string().url().optional(),
  })
  .strict();

export type CreatePassInput = z.infer<typeof CreatePassSchema>;