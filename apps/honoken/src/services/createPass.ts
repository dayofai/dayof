import { schema as sharedSchema } from 'database/schema';
import { and, eq } from 'drizzle-orm';
import { randomUUID, randomBytes } from 'node:crypto';
import { PassDataEventTicketSchema } from '../schemas/passContentSchemas';
import { VercelBlobAssetStorage } from '../storage/vercel-blob-storage';
import { getDbClient } from '../db';
import type { Env } from '../types';
import type { Logger } from '../utils/logger';
import { upsertPassContentWithEtag } from '../repo/wallet';
import type { CreatePassInput } from '../schemas/createPassSchema';

// Inngest integration for pass creation notification
import { Inngest } from 'inngest';

// Module-level Inngest event key constant
const INNGEST_EVENT_KEY = process.env.INNGEST_EVENT_KEY;

// Instantiate module-level inngest client
const inngest = new Inngest({
  id: "dayof",
  eventKey: INNGEST_EVENT_KEY,
});

export class CreatePassError extends Error {
  statusCode: number;
  friendlyMessage?: string;
  constructor(msg: string, opts?: { statusCode?: number; friendlyMessage?: string }) {
    super(msg);
    this.statusCode = opts?.statusCode ?? 400;
    this.friendlyMessage = opts?.friendlyMessage;
  }
}

export type CreatePassResult = {
  passTypeIdentifier: string;
  serialNumber: string;
  authenticationToken: string;
  certRef: string;
  downloadPath: string; // e.g., "/v1/passes/..."
  passContent: any;
  warnings: string[];
  etag: string;
};

function trimStringOrDefault(val: string | undefined, def: string): string {
  if (!val) return def;
  return val.trim();
}

function generateSerial(): string {
  // Use randomUUID, but Apple serials are case-sensitive and can be any string up to 64 ASCII chars.
  // We'll take the first 12 chars of a uuid with hyphens removed.
  return randomUUID().replace(/-/g, '').slice(0, 12);
}

function generateAuthToken(): string {
  // Apple spec: authenticationToken must be 16-128 chars, ASCII. We'll use 32 bytes hex = 64 chars.
  return randomBytes(32).toString('hex');
}

function generateBarcodeValue(): string {
  return 'TICKET-' + randomBytes(6).toString('hex').toUpperCase();
}

const DEFAULT_PASS_TYPE_IDENTIFIER = 'pass.cards.dayof.tickets';
const DEFAULT_CERT_REF = 'dayof-tickets';

// Returns { result, warnings[] }
export async function createPass(
  env: Env,
  logger: Logger,
  input: CreatePassInput
): Promise<CreatePassResult> {
  const db = getDbClient(env, logger);

  const warnings: string[] = [];

  // Assign trimmed identifiers/defaults for passType, certRef, etc.
  const passTypeIdentifier = trimStringOrDefault(
    input.passTypeIdentifier,
    DEFAULT_PASS_TYPE_IDENTIFIER
  );
  const certRef = trimStringOrDefault(input.certRef, DEFAULT_CERT_REF);

  // Check certificate exists
  const cert = await db.query.walletCert.findFirst({
    where: { certRef },
    columns: { certRef: true },
  });
  if (!cert) {
    throw new CreatePassError(
      `No certificate found with certRef '${certRef}'`,
      {
        statusCode: 400,
        friendlyMessage: `No certificate found for certRef '${certRef}'. Please upload a certificate first.`,
      }
    );
  }

  // Upsert passType → certRef
  let passTypeRow = await db.query.walletPassType.findFirst({
    where: { passTypeIdentifier },
    columns: { id: true, passTypeIdentifier: true, certRef: true },
  });
  if (!passTypeRow) {
    await db
      .insert(sharedSchema.walletPassType)
      .values({
        passTypeIdentifier,
        certRef,
      })
      .onConflictDoNothing();
    // Reload
    passTypeRow = await db.query.walletPassType.findFirst({
      where: { passTypeIdentifier },
      columns: { id: true, passTypeIdentifier: true, certRef: true },
    });
  }
  if (!passTypeRow) {
    throw new CreatePassError(
      `Failed to create pass type ${passTypeIdentifier}`,
      { statusCode: 500 }
    );
  }

  // Compose serialNumber (generate if not provided)
  const serialNumber = input.serialNumber
    ? input.serialNumber.trim()
    : generateSerial();

  // Generate authenticationToken (admin-only endpoint should not take one)
  const authenticationToken = generateAuthToken();

  // Ensure serial uniqueness
  const existingPass = await db
    .select({ id: sharedSchema.walletPass.id })
    .from(sharedSchema.walletPass)
    .where(
      and(
        eq(sharedSchema.walletPass.passTypeIdentifier, passTypeIdentifier),
        eq(sharedSchema.walletPass.serialNumber, serialNumber)
      )
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (existingPass) {
    throw new CreatePassError(
      `A pass already exists for ${passTypeIdentifier} / ${serialNumber}`,
      {
        friendlyMessage:
          'A pass with this passTypeIdentifier and serialNumber already exists. Please provide a unique serial.',
        statusCode: 409,
      }
    );
  }

  // Insert wallet_pass row
  const newPass = await db
    .insert(sharedSchema.walletPass)
    .values({
      passTypeIdentifier,
      serialNumber,
      authenticationToken,
      ticketStyle: 'event',
      poster: !!input.poster,
      // For admin/manual passes, actorType is system; set userId/orgId to null.
      actorType: 'system',
      userId: null,
      orgId: null,
    })
    .returning({ id: sharedSchema.walletPass.id })
    .then((rows) => rows[0]);

  if (!newPass?.id) {
    throw new CreatePassError('Failed to insert pass row', {
      statusCode: 500,
    });
  }

  // Compose pass content payload
  const primaryFields = [
    {
      key: 'event',
      label: 'Event',
      value: input.eventName?.trim() || 'DayOf Sample Event',
    },
    ...(input.eventDateISO
      ? [
          {
            key: 'date',
            label: 'Date',
            value: input.eventDateISO,
            dateStyle: 'PKDateStyleMedium',
            timeStyle: 'PKDateStyleShort',
          },
        ]
      : []),
    ...(input.venueName
      ? [
          {
            key: 'venue',
            label: 'Venue',
            value: input.venueName.trim(),
          },
        ]
      : []),
  ];
  const secondaryFields = [
    ...(input.seat
      ? [
          {
            key: 'seat',
            label: 'Seat',
            value: input.seat,
          },
        ]
      : []),
    ...(input.section
      ? [
          {
            key: 'section',
            label: 'Section',
            value: input.section,
          },
        ]
      : []),
  ];
  const eventTicket: Record<string, any> = { primaryFields };
  if (secondaryFields.length > 0) {
    eventTicket.secondaryFields = secondaryFields;
  }

  const passContent = {
    description:
      input.description?.trim() || `Event Ticket (${serialNumber.slice(-6)})`,
    organizationName: input.organizationName?.trim() || 'DayOf',
    logoText: input.logoText?.trim() || 'DayOf',
    eventTicket,
    groupingIdentifier: input.groupingIdentifier,
    posterVersion: input.poster ? 1 : undefined,
    foregroundColor:
      input.foregroundColor ||
      (input.poster ? 'rgb(255,255,255)' : 'rgb(0,0,0)'),
    backgroundColor:
      input.backgroundColor ||
      (input.poster ? 'rgb(0,0,0)' : 'rgb(255,255,255)'),
    labelColor:
      input.labelColor ||
      (input.poster ? 'rgb(255,255,255)' : 'rgb(0,0,0)'),
    maxDistance: input.maxDistance,
    relevantDate: input.relevantDate,
    locations: input.locations,
    semanticTags: input.semanticTags,
    barcode: {
      format: 'PKBarcodeFormatQR' as const,
      message: input.barcodeMessage?.trim() || generateBarcodeValue(),
      messageEncoding: 'iso-8859-1',
    },
    // Provide webServiceURL if supplied or configured via environment, ensuring trailing slash as per Apple spec
    webServiceURL: (() => {
      const explicit = input.webServiceURL?.trim() || env.HONOKEN_WEB_SERVICE_URL?.trim();
      if (!explicit) return undefined;
      return explicit.endsWith('/') ? explicit : explicit + '/';
    })(),
  };

  // Validate via PassDataEventTicketSchema (throws if not valid)
  const validPassContent = PassDataEventTicketSchema.parse(passContent);

  // Store content + compute ETag
  const { etag } = await upsertPassContentWithEtag(
    db,
    {
      passTypeIdentifier,
      serialNumber,
    },
    validPassContent
  );

  // Emit Inngest event for pass update (to trigger downstream workflow)
  if (!INNGEST_EVENT_KEY) {
    logger.warn('INNGEST_EVENT_KEY missing, not emitting pass/update.requested', {
      passTypeIdentifier,
      serialNumber,
      context: 'createPass',
      error: 'INNGEST_EVENT_KEY is not set',
    });
  } else {
    try {
      await inngest.send({
        name: 'pass/update.requested',
        data: {
          passTypeIdentifier,
          serialNumber,
          content: validPassContent,
        },
      });
    } catch (error) {
      logger.warn('Failed to emit pass/update.requested inngest event', {
        passTypeIdentifier,
        serialNumber,
        error: error instanceof Error ? error.message : String(error),
        context: 'createPass',
      });
    }
  }

  // Check required assets in blob storage (optional in dev)
  // If HONOKEN_IMAGES_READ_WRITE_TOKEN is not set, skip checks and return a warning
  if (!env.HONOKEN_IMAGES_READ_WRITE_TOKEN) {
    warnings.push(
      'Asset checks skipped: HONOKEN_IMAGES_READ_WRITE_TOKEN not set in environment.'
    );
  } else {
    const blob = new VercelBlobAssetStorage(env, logger);
    const assetPrefix = `${passTypeIdentifier}/${serialNumber}/`;

    // Required: icon.png (29x29), logo.png (160x50+), background@2x.png for poster
    const assetsToCheck = [
      { name: 'icon.png', path: assetPrefix + 'icon.png', required: true },
      { name: 'logo.png', path: assetPrefix + 'logo.png', required: true },
      {
        name: 'background@2x.png',
        path: assetPrefix + 'background@2x.png',
        required: !!input.poster,
      },
    ];

    for (const asset of assetsToCheck) {
      if (asset.required) {
        const found = await blob.exists(asset.path);
        if (!found) {
          warnings.push(
            `Missing required asset: ${asset.name} (${asset.path})`
          );
        }
      }
    }
  }

  // Compose download path (for frontend download usage)
  const downloadPath = `/v1/passes/${encodeURIComponent(
    passTypeIdentifier
  )}/${encodeURIComponent(serialNumber)}`;

  return {
    passTypeIdentifier,
    serialNumber,
    authenticationToken,
    certRef,
    downloadPath,
    passContent: validPassContent,
    warnings,
    etag,
  };
}