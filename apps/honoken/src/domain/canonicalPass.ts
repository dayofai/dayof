// Canonical pass domain model + projection into PassDataEventTicket.
import { z } from 'zod/v4';
import { PassDataEventTicketSchema, type PassDataEventTicket } from '../schemas/passContentSchemas';

// Current canonical schema version
export const CANONICAL_PASS_SCHEMA_VERSION = 1 as const;

// Canonical schema (internal). Keep purposely narrower & stable.
export const CanonicalPassSchemaV1 = z.object({
  _schemaVersion: z.literal(CANONICAL_PASS_SCHEMA_VERSION),
  event: z.object({
    name: z.string().min(1),
    startsAt: z.string().datetime().optional(),
    venue: z
      .object({
        name: z.string().min(1).optional(),
      })
      .optional(),
    seat: z
      .object({
        seat: z.string().optional(),
        section: z.string().optional(),
      })
      .optional(),
  }),
  style: z.object({
    foregroundColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    labelColor: z.string().optional(),
    logoText: z.string().optional(),
    posterVersion: z.number().optional(),
  }),
  distribution: z.object({
    webServiceURL: z.string().url().optional(),
    barcodeMessage: z.string().optional(),
  }),
  meta: z.object({
    description: z.string().min(1),
    organizationName: z.string().min(1),
    groupingIdentifier: z.string().optional(),
    relevantDate: z.string().datetime().optional(),
    maxDistance: z.number().optional(),
  }),
  // Arbitrary semantic tags preserved verbatim
  semanticTags: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
});
export type CanonicalPassV1 = z.infer<typeof CanonicalPassSchemaV1>;

// Partial schema used for PATCH operations. All top-level keys optional; retains same inner constraints.
export const PartialCanonicalPassSchemaV1 = z.object({
  _schemaVersion: z.literal(CANONICAL_PASS_SCHEMA_VERSION).optional(),
  event: CanonicalPassSchemaV1.shape.event.partial().optional(),
  style: CanonicalPassSchemaV1.shape.style.partial().optional(),
  distribution: CanonicalPassSchemaV1.shape.distribution.partial().optional(),
  meta: CanonicalPassSchemaV1.shape.meta.partial().optional(),
  semanticTags: CanonicalPassSchemaV1.shape.semanticTags.optional(),
});
export type PartialCanonicalPassV1 = z.infer<typeof PartialCanonicalPassSchemaV1>;

// Shallow-ish deep merge for plain objects; arrays are replaced (not merged).
export function deepMerge<T extends Record<string, any>, U extends Record<string, any>>(base: T, patch: U): T & U {
  const out: any = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && typeof out[k] === 'object' && out[k] !== null && !Array.isArray(out[k])) {
      out[k] = deepMerge(out[k], v);
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out;
}

export type AnyCanonicalPass = CanonicalPassV1; // future union on version bump

// Project canonical -> PassDataEventTicket (the DB/display shape used by existing builder)
export function projectCanonicalToPassData(c: AnyCanonicalPass): PassDataEventTicket {
  const primaryFields = [
    { key: 'event', label: 'Event', value: c.event.name },
    ...(c.event.startsAt
      ? [
          {
            key: 'date',
            label: 'Date',
            value: c.event.startsAt,
            dateStyle: 'PKDateStyleMedium',
            timeStyle: 'PKDateStyleShort',
          } as const,
        ]
      : []),
    ...(c.event.venue?.name
      ? [{ key: 'venue', label: 'Venue', value: c.event.venue.name }]
      : []),
  ];
  const secondaryFields = [
    ...(c.event.seat?.seat
      ? [{ key: 'seat', label: 'Seat', value: c.event.seat.seat }]
      : []),
    ...(c.event.seat?.section
      ? [{ key: 'section', label: 'Section', value: c.event.seat.section }]
      : []),
  ];
  const eventTicket: any = { primaryFields };
  if (secondaryFields.length > 0) eventTicket.secondaryFields = secondaryFields;

  const passData: PassDataEventTicket = {
    description: c.meta.description,
    organizationName: c.meta.organizationName,
    eventTicket,
    logoText: c.style.logoText,
    foregroundColor: c.style.foregroundColor,
    backgroundColor: c.style.backgroundColor,
    labelColor: c.style.labelColor,
    groupingIdentifier: c.meta.groupingIdentifier,
    posterVersion: c.style.posterVersion,
    relevantDate: c.meta.relevantDate,
    maxDistance: c.meta.maxDistance,
    semanticTags: c.semanticTags,
    webServiceURL: c.distribution.webServiceURL,
    barcode: c.distribution.barcodeMessage
      ? {
          format: 'PKBarcodeFormatQR',
          message: c.distribution.barcodeMessage,
          messageEncoding: 'iso-8859-1',
        }
      : undefined,
  } as PassDataEventTicket;

  // Validate before returning to ensure we never emit invalid shape
  return PassDataEventTicketSchema.parse(passData);
}

export function normalizeWebServiceURL(u?: string): string | undefined {
  if (!u) return undefined;
  let v = u.trim();
  if (v === '') return undefined;
  // Strip trailing duplicated segments /v1 or /api (common mistakes) if they appear at end.
  v = v.replace(/\/(api|v1)\/?$/i, '/');
  if (!v.endsWith('/')) v += '/';
  return v;
}
