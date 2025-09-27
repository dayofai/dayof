// Canonical pass domain model + projection into PassDataEventTicket (legacy tolerant)
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

export type AnyCanonicalPass = CanonicalPassV1; // future union on version bump

// Legacy adapter: takes whatever is in DB (legacy PassDataEventTicket) -> canonical
export function adaptLegacyToCanonical(raw: unknown): AnyCanonicalPass | null {
  // Try interpreting as PassDataEventTicket first
  const parsed = (() => {
    try {
      return PassDataEventTicketSchema.parse(raw);
    } catch {
      return null;
    }
  })();
  if (!parsed) return null;
  // If already looks canonical (has _schemaVersion) we bail (caller should detect separately)
  if (parsed && typeof parsed === 'object' && '_schemaVersion' in parsed) {
    return parsed as unknown as AnyCanonicalPass; // caller will validate separately
  }
  const primary = parsed.eventTicket?.primaryFields ?? [];
  const findVal = (key: string) => primary.find((f) => f.key === key)?.value;
  // Prefer loose override fields if present (PATCH may supply eventName without rewriting eventTicket)
  const looseEventName = (parsed as any).eventName as string | undefined;
  const looseDate = (parsed as any).eventDateISO as string | undefined;
  const looseVenue = (parsed as any).venueName as string | undefined;
  const looseSeat = (parsed as any).seat as string | undefined;
  const looseSection = (parsed as any).section as string | undefined;

  const canonical: CanonicalPassV1 = {
    _schemaVersion: CANONICAL_PASS_SCHEMA_VERSION,
    event: {
      name: looseEventName || (findVal('event') as string) || 'Event',
      startsAt: looseDate || (findVal('date') as string) || undefined,
      venue: { name: looseVenue || (findVal('venue') as string) || undefined },
      seat: {
        seat: looseSeat || (findVal('seat') as string) || undefined,
        section: looseSection || (findVal('section') as string) || undefined,
      },
    },
    style: {
      foregroundColor: (parsed as any).foregroundColor,
      backgroundColor: (parsed as any).backgroundColor,
      labelColor: (parsed as any).labelColor,
      logoText: (parsed as any).logoText,
      posterVersion: (parsed as any).posterVersion,
    },
    distribution: {
      webServiceURL: (parsed as any).webServiceURL,
      barcodeMessage: (parsed as any).barcode?.message,
    },
    meta: {
      description: (parsed as any).description,
      organizationName: (parsed as any).organizationName,
      groupingIdentifier: (parsed as any).groupingIdentifier,
      relevantDate: (parsed as any).relevantDate,
      maxDistance: (parsed as any).maxDistance,
    },
    semanticTags: (parsed as any).semanticTags,
  };
  return canonical;
}

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
