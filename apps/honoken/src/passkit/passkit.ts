// PKPass will be loaded dynamically - preload on Vercel to avoid cold-start penalty
let LazyPKPass: typeof import('passkit-generator').PKPass | undefined;

// Preload passkit-generator on Vercel to avoid cold-start penalty on first request
if (process.env.VERCEL !== undefined) {
  import('passkit-generator')
    .then((module) => {
      LazyPKPass = module.PKPass;
    })
    .catch(() => {
      // Silently ignore preload failures; request-time fallback will handle it
    });
}

import { Buffer } from 'node:buffer';
import { schema as sharedSchema } from 'database/schema';
import { and, eq } from 'drizzle-orm';
import type { ZodIssue } from 'zod/v4';
import { z } from 'zod/v4';
import { getDbClient } from '../db';
import { PassDataEventTicketSchema } from '../schemas';
import {
  adaptLegacyToCanonical,
  projectCanonicalToPassData,
  CANONICAL_PASS_SCHEMA_VERSION,
} from '../domain/canonicalPass';
import { VercelBlobAssetStorage } from '../storage/vercel-blob-storage';
import type { Env } from '../types';
import type { Logger } from '../utils/logger';
import { type CertBundle, loadCertBundle } from './certs';

async function fetchVerifiedPngAsset(
  storage: VercelBlobAssetStorage,
  key: string,
  expectedW: number,
  expectedH: number,
  logger: Logger
): Promise<ArrayBuffer> {
  logger.info(
    `[fetchVerifiedPngAsset] Attempting to fetch and verify PNG asset: ${key}`,
    { expectedW, expectedH }
  );

  // Fast header range fetch (24 bytes)
  const header = await storage.retrieveRange(key, 0, 23);
  if (!header) {
    const errMsg = `[fetchVerifiedPngAsset] Asset not found in storage: ${key}`;
    logger.error(errMsg, new Error(errMsg), { key });
    throw new Error(`Asset not found in storage: ${key}`);
  }

  if (header.byteLength < 24) {
    const errMsg = `[fetchVerifiedPngAsset] File too short for PNG validation: ${key}`;
    logger.error(errMsg, new Error(errMsg), { key, length: header.byteLength });
    throw new Error(`File too short for PNG validation: ${key}`);
  }

  const headerBytes = new Uint8Array(header);

  // PNG signature check (first 8 bytes)
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < pngSignature.length; i++) {
    if (headerBytes[i] !== pngSignature[i]) {
      const errMsg = `[fetchVerifiedPngAsset] Corrupt PNG (bad signature): ${key}`;
      logger.error(errMsg, new Error(errMsg), { key });
      throw new Error(`Corrupt PNG (bad signature): ${key}`);
    }
  }

  // Read chunk length (bytes 8-11, big-endian)
  const chunkLength = new DataView(header, 8, 4).getUint32(0, false);

  // IHDR chunk should be exactly 13 bytes
  if (chunkLength !== 13) {
    const errMsg = `[fetchVerifiedPngAsset] Invalid IHDR chunk length ${chunkLength} for ${key}, expected 13`;
    logger.error(errMsg, new Error(errMsg), { key, chunkLength });
    throw new Error(`Invalid IHDR chunk length for PNG: ${key}`);
  }

  // Verify chunk type is "IHDR" (bytes 12-15: 0x49, 0x48, 0x44, 0x52)
  if (
    headerBytes[12] !== 0x49 ||
    headerBytes[13] !== 0x48 ||
    headerBytes[14] !== 0x44 ||
    headerBytes[15] !== 0x52
  ) {
    const errMsg = `[fetchVerifiedPngAsset] Invalid or missing IHDR chunk type for ${key}`;
    logger.error(errMsg, new Error(errMsg), { key });
    throw new Error(`Invalid or missing IHDR chunk for PNG: ${key}`);
  }

  // Read width/height from bytes 16-23 (using header bytes view)
  const headerView = new DataView(header, 16, 8);
  const w = headerView.getUint32(0, false); // Width
  const h = headerView.getUint32(4, false); // Height

  if (w !== expectedW || h !== expectedH) {
    const errMsg = `[fetchVerifiedPngAsset] Wrong dimensions ${w}×${h} for ${key}, expected ${expectedW}×${expectedH}`;
    logger.error(errMsg, new Error(errMsg), {
      key,
      actualW: w,
      actualH: h,
      expectedW,
      expectedH,
    });
    throw new Error(
      `Wrong dimensions ${w}×${h} for ${key}, expected ${expectedW}×${expectedH}`
    );
  }
  logger.info(`[fetchVerifiedPngAsset] Dimensions OK for ${key} (${w}x${h})`);

  // If header is ok, fetch full asset
  const fullArrayBuffer = await storage.retrieve(key);
  if (!fullArrayBuffer) {
    const errMsg = `[fetchVerifiedPngAsset] Asset not found in storage: ${key}`;
    logger.error(errMsg, new Error(errMsg), { key });
    throw new Error(`Asset not found in storage: ${key}`);
  }

  logger.info(`[fetchVerifiedPngAsset] Successfully verified PNG asset ${key}`);
  return fullArrayBuffer;
}

/**
 * Creates a base pass JSON structure for event ticket passes
 * @returns Base pass.json structure with defaults
 */
type PassField = {
  key: string;
  label?: string;
  value: string;
  dateStyle?: string;
  timeStyle?: string;
};

type PassJson = {
  formatVersion: number;
  eventTicket: Record<string, unknown>;
  description: string;
  organizationName: string;
  foregroundColor: string;
  backgroundColor: string;
  labelColor: string;
  passTypeIdentifier?: string;
  serialNumber?: string;
  authenticationToken?: string;
  teamIdentifier?: string;
  nfc?: unknown;
};

type PassRow = {
  id: string;
  passTypeIdentifier: string;
  serialNumber: string;
  eventId: string;
  authenticationToken: string;
  ticketStyle: unknown;
  poster: boolean;
};

function createBasePassJson(): PassJson {
  return {
    formatVersion: 1,
    eventTicket: {}, // Initialize the eventTicket structure
    // Default values that would have been in the template
    description: '',
    organizationName: '',
    foregroundColor: 'rgb(0, 0, 0)',
    backgroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(0, 0, 0)',
  };
}

async function getPassRow(
  env: Env,
  logger: Logger,
  passTypeIdentifier: string,
  serialNumber: string
): Promise<PassRow | null> {
  const db = getDbClient(env, logger);
  const row = await db
    .select({
      id: sharedSchema.walletPass.id,
      passTypeIdentifier: sharedSchema.walletPass.passTypeIdentifier,
      serialNumber: sharedSchema.walletPass.serialNumber,
      authenticationToken: sharedSchema.walletPass.authenticationToken,
      ticketStyle: sharedSchema.walletPass.ticketStyle,
      poster: sharedSchema.walletPass.poster,
      eventId: sharedSchema.walletPass.eventId,
    })
    .from(sharedSchema.walletPass)
    .where(
      and(
        eq(sharedSchema.walletPass.passTypeIdentifier, passTypeIdentifier),
        eq(sharedSchema.walletPass.serialNumber, serialNumber)
      )
    )
    .limit(1)
    .then((r) => r[0] ?? null);
  return (row as unknown as PassRow) ?? null;
}

async function getCertRef(
  env: Env,
  logger: Logger,
  passTypeIdentifier: string
): Promise<string | null> {
  const db = getDbClient(env, logger);
  const link = await db
    .select({ certRef: sharedSchema.walletPassType.certRef })
    .from(sharedSchema.walletPassType)
    .where(
      eq(sharedSchema.walletPassType.passTypeIdentifier, passTypeIdentifier)
    )
    .limit(1)
    .then((r) => r[0]);
  return link?.certRef ?? null;
}

async function loadCertBundleSafe(
  certRef: string,
  env: Env,
  logger: Logger,
  passTypeIdentifier: string,
  serialNumber: string
): Promise<CertBundle> {
  try {
    return await loadCertBundle(certRef, env, logger);
  } catch (err: unknown) {
    logger.error(
      'Failed to load certificate bundle',
      err instanceof Error ? err : new Error(String(err)),
      { certRef, passTypeIdentifier, serialNumber }
    );
    throw new Error(
      `CERT_BUNDLE_LOAD_ERROR: ${(err as Error)?.message ?? String(err)}`
    );
  }
}

async function getValidatedPassData(
  env: Env,
  logger: Logger,
  passId: string,
  passTypeIdentifier: string,
  serialNumber: string
): Promise<z.infer<typeof PassDataEventTicketSchema>> {
  const db = getDbClient(env, logger);
  const contentRow = await db
    .select({ data: sharedSchema.walletPassContent.data })
    .from(sharedSchema.walletPassContent)
    .where(eq(sharedSchema.walletPassContent.passId, passId))
    .limit(1)
    .then((r) => r[0]);
  const rawPassDataFromDb: unknown = contentRow?.data ?? {};
  try {
    // Detect canonical shape
    if (
      rawPassDataFromDb &&
      typeof rawPassDataFromDb === 'object' &&
      '_schemaVersion' in rawPassDataFromDb &&
      (rawPassDataFromDb as { _schemaVersion?: unknown })._schemaVersion ===
        CANONICAL_PASS_SCHEMA_VERSION
    ) {
      const projected = projectCanonicalToPassData(
        rawPassDataFromDb as any
      );
      return projected; // already validated by projector
    }
    // Legacy path: adapt then project if possible
    const adapted = adaptLegacyToCanonical(rawPassDataFromDb);
    if (adapted) {
      const projected = projectCanonicalToPassData(adapted);
      return projected;
    }
    // Fallback: treat JSON as passData directly (legacy original)
    return PassDataEventTicketSchema.parse(rawPassDataFromDb);
  } catch (validationError: unknown) {
    if (validationError instanceof z.ZodError) {
      const prettyErrorSummary = validationError.issues
        .map((e: ZodIssue) => `${e.path.join('.') || 'passData'}: ${e.message}`)
        .join('; ');
      logger.error('Pass data validation failed', {
        passTypeIdentifier,
        serialNumber,
        validationIssues: validationError.issues,
        prettySummary: prettyErrorSummary,
      });
      throw new Error(`PASS_DATA_VALIDATION_ERROR: ${prettyErrorSummary}`);
    }
    logger.error(
      'Unknown error during pass data validation',
      validationError instanceof Error
        ? validationError
        : new Error(String(validationError)),
      { passTypeIdentifier, serialNumber }
    );
    throw validationError;
  }
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: needed complexity
function mergePassDataIntoPassJson(
  base: PassJson,
  validatedPassData: z.infer<typeof PassDataEventTicketSchema>,
  certBundle: CertBundle,
  passTypeIdentifier: string,
  serialNumber: string,
  logger: Logger
): PassJson {
  let passJsonContent: PassJson = { ...base };
  const {
    eventTicket: incomingEventTicket,
    eventName,
    eventDateISO,
    venueName,
    seat,
    section,
    nfc: incomingNfc,
    ...restLoose
  } = validatedPassData;

  if (incomingEventTicket) {
    logger.info('Using pre-structured eventTicket from passData', {
      passTypeIdentifier,
      serialNumber,
    });
    passJsonContent = { ...passJsonContent, ...validatedPassData } as PassJson;
  } else {
    logger.info(
      'No pre-structured eventTicket found, creating from loose fields'
    );
    const primaryFields: PassField[] = [];
    if (eventName) {
      primaryFields.push({ key: 'event', label: 'Event', value: eventName });
    }
    if (eventDateISO) {
      primaryFields.push({
        key: 'date',
        label: 'Date',
        value: eventDateISO,
        dateStyle: 'PKDateStyleMedium',
        timeStyle: 'PKDateStyleShort',
      });
    }
    if (venueName) {
      primaryFields.push({ key: 'venue', label: 'Venue', value: venueName });
    }
    const secondaryFields: PassField[] = [];
    if (seat) {
      secondaryFields.push({ key: 'seat', label: 'Seat', value: seat });
    }
    if (section) {
      secondaryFields.push({
        key: 'section',
        label: 'Section',
        value: section,
      });
    }
    if (primaryFields.length === 0) {
      primaryFields.push({
        key: 'event',
        label: 'Event',
        value: String(
          (restLoose as { description?: unknown }).description ?? ''
        ),
      });
      logger.warn(
        'No loose fields available for eventTicket, using description as fallback',
        {
          passTypeIdentifier,
          serialNumber,
        }
      );
    }
    const merged = {
      ...restLoose,
      eventTicket: {
        primaryFields,
        ...(secondaryFields.length > 0 ? { secondaryFields } : {}),
      },
    } as Record<string, unknown>;
    passJsonContent = { ...passJsonContent, ...merged } as PassJson;
  }

  const hasEncryptionPublicKey = (
    nfc: unknown
  ): nfc is { encryptionPublicKey: string } => {
    return (
      typeof nfc === 'object' &&
      nfc !== null &&
      'encryptionPublicKey' in nfc &&
      typeof (nfc as { encryptionPublicKey: unknown }).encryptionPublicKey ===
        'string' &&
      ((nfc as { encryptionPublicKey: string }).encryptionPublicKey?.trim?.() ??
        '') !== ''
    );
  };

  if (incomingNfc) {
    if (certBundle.isEnhanced) {
      if (!hasEncryptionPublicKey(incomingNfc)) {
        logger.error(
          'NFC data provided but encryptionPublicKey is empty or invalid. Apple rejects passes with empty encryptionPublicKey.',
          new Error('INVALID_NFC_ENCRYPTION_KEY'),
          { passTypeIdentifier, serialNumber }
        );
        throw new Error(
          'INVALID_NFC_ENCRYPTION_KEY: encryptionPublicKey cannot be empty'
        );
      }
      logger.info(
        'Valid NFC data included from passData with enhanced certificate.',
        { passTypeIdentifier, serialNumber }
      );
    } else {
      logger.warn(
        'Attempted to add NFC data with a non-enhanced certificate. NFC will be omitted.',
        { passTypeIdentifier, serialNumber }
      );
      const { nfc: _omitNfc, ...rest } = passJsonContent as Record<
        string,
        unknown
      >;
      passJsonContent = rest as PassJson;
    }
  }

  return passJsonContent;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: needed complexity
async function assembleModelFiles(
  storage: VercelBlobAssetStorage,
  passRow: PassRow,
  certBundle: CertBundle,
  passJsonContent: PassJson,
  logger: Logger
): Promise<Record<string, Buffer>> {
  const modelFiles: Record<string, Buffer> = {
    'pass.json': Buffer.from(JSON.stringify(passJsonContent)),
  };

  const passSpecificIconKey = `${passRow.passTypeIdentifier}/events/${passRow.eventId}/icon.png`;
  logger.info('Attempting to fetch pass-specific icon.png', {
    path: passSpecificIconKey,
  });
  try {
    const iconBuffer = await fetchVerifiedPngAsset(
      storage,
      passSpecificIconKey,
      29,
      29,
      logger
    );
    modelFiles['icon.png'] = Buffer.from(iconBuffer);
    logger.info('Added pass-specific icon.png using fetchVerifiedPngAsset');
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.warn(
      `Failed to fetch/verify pass-specific icon.png (${passSpecificIconKey}): ${err.message}. Trying fallback.`
    );
  }

  if (!modelFiles['icon.png']) {
    const globalFallbackIconKey = 'brand-assets/icon.png';
    logger.info('Attempting to fetch global fallback icon.png', {
      path: globalFallbackIconKey,
    });
    try {
      const fallbackBuffer = await fetchVerifiedPngAsset(
        storage,
        globalFallbackIconKey,
        29,
        29,
        logger
      );
      modelFiles['icon.png'] = Buffer.from(fallbackBuffer);
      logger.info('Added global fallback icon.png using fetchVerifiedPngAsset');
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.warn(
        `Failed to fetch/verify global fallback icon.png (${globalFallbackIconKey}): ${err.message}`
      );
    }
  }

  if (!modelFiles['icon.png']) {
    logger.error(
      'No valid icon.png found after trying all fallbacks',
      new Error('MISSING_ICON'),
      {
        serialNumber: passRow.serialNumber,
        passTypeIdentifier: passRow.passTypeIdentifier,
      }
    );
    throw new Error('icon.png is mandatory and could not be found.');
  }

  const highResSpecs = [
    { suffix: '@2x', width: 58, height: 58 },
    { suffix: '@3x', width: 87, height: 87 },
  ] as const;

  const highResResults = await Promise.all(
    highResSpecs.map(async (spec) => {
      const filename = `icon${spec.suffix}.png`;
  const passSpecificKey = `${passRow.passTypeIdentifier}/events/${passRow.eventId}/${filename}`;
      const globalFallbackKey = `brand-assets/${filename}`;

      logger.info(`Attempting to fetch pass-specific ${filename}`, {
        path: passSpecificKey,
      });
      try {
        const imageBuffer = await fetchVerifiedPngAsset(
          storage,
          passSpecificKey,
          spec.width,
          spec.height,
          logger
        );
        logger.info(
          `Added pass-specific ${filename} using fetchVerifiedPngAsset`
        );
        return { filename, buffer: Buffer.from(imageBuffer) } as const;
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.warn(
          `Failed to fetch/verify pass-specific ${filename} (${passSpecificKey}): ${err.message}. Trying fallback.`
        );
      }

      logger.info(`Attempting to fetch global fallback ${filename}`, {
        path: globalFallbackKey,
      });
      try {
        const fallbackBuffer = await fetchVerifiedPngAsset(
          storage,
          globalFallbackKey,
          spec.width,
          spec.height,
          logger
        );
        logger.info(
          `Added global fallback ${filename} using fetchVerifiedPngAsset`
        );
        return { filename, buffer: Buffer.from(fallbackBuffer) } as const;
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.warn(
          `Failed to fetch/verify global fallback ${filename} (${globalFallbackKey}): ${err.message}`
        );
        return null;
      }
    })
  );

  for (const result of highResResults) {
    if (result) {
      modelFiles[result.filename] = result.buffer;
    }
  }

  const logoKey = `${passRow.passTypeIdentifier}/events/${passRow.eventId}/logo.png`;
  const logo2xKey = `${passRow.passTypeIdentifier}/events/${passRow.eventId}/logo@2x.png`;
  logger.info('Attempting to fetch mandatory logo.png', { path: logoKey });
  try {
    const logoBuffer = await fetchVerifiedPngAsset(
      storage,
      logoKey,
      160,
      50,
      logger
    );
    modelFiles['logo.png'] = Buffer.from(logoBuffer);
    logger.info('Added logo.png using fetchVerifiedPngAsset');
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(
      `Failed to fetch/verify mandatory logo.png (${logoKey}): ${err.message}`,
      new Error('MANDATORY_LOGO_FAILURE'),
      {
        serialNumber: passRow.serialNumber,
        passTypeIdentifier: passRow.passTypeIdentifier,
      }
    );
    throw new Error(
      `Mandatory logo.png (${logoKey}) could not be processed: ${err.message}`
    );
  }

  logger.info('Attempting to fetch optional logo@2x.png', { path: logo2xKey });
  try {
    const logo2xBuffer = await fetchVerifiedPngAsset(
      storage,
      logo2xKey,
      320,
      100,
      logger
    );
    modelFiles['logo@2x.png'] = Buffer.from(logo2xBuffer);
    logger.info('Added logo@2x.png using fetchVerifiedPngAsset');
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.warn(
      `Optional logo@2x.png (${logo2xKey}) could not be processed or was not found: ${err.message}`
    );
  }

  if (passRow.poster && certBundle.isEnhanced) {
  const background2xKey = `${passRow.passTypeIdentifier}/events/${passRow.eventId}/background@2x.png`;
    logger.info('Attempting to fetch background@2x.png for poster', {
      path: background2xKey,
    });
    try {
      const bg2xBuffer = await fetchVerifiedPngAsset(
        storage,
        background2xKey,
        180 * 2,
        220 * 2,
        logger
      );
      modelFiles['background@2x.png'] = Buffer.from(bg2xBuffer);
      logger.info(
        'Added background@2x.png for poster pass using fetchVerifiedPngAsset'
      );
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.warn(
        `Optional background@2x.png for poster (${background2xKey}) could not be processed or was not found: ${err.message}`
      );
    }
  }

  return modelFiles;
}

async function ensurePKPassLoaded(
  logger: Logger,
  passTypeIdentifier: string,
  serialNumber: string
): Promise<typeof import('passkit-generator').PKPass> {
  if (LazyPKPass) {
    return LazyPKPass;
  }
  logger.info(
    'Fallback: dynamically loading passkit-generator (preload may have failed)...'
  );
  try {
    LazyPKPass = (await import('passkit-generator')).PKPass;
    logger.info('passkit-generator loaded via fallback.');
    return LazyPKPass;
  } catch (error: unknown) {
    logger.error(
      'Failed to load passkit-generator',
      error instanceof Error ? error : new Error(String(error)),
      { passTypeIdentifier, serialNumber }
    );
    LazyPKPass = undefined;
    throw new Error(
      `Failed to load passkit-generator: ${(error instanceof Error ? error : new Error(String(error))).message}`
    );
  }
}

function toArrayBufferStrict(
  data: Uint8Array | ArrayBuffer,
  logger: Logger,
  passTypeIdentifier: string,
  serialNumber: string
): ArrayBuffer {
  if (data instanceof ArrayBuffer) {
    logger.info('Pass generation complete');
    return data;
  }
  if (data instanceof Uint8Array) {
    logger.info('Pass generation complete (converted from Uint8Array)');
    return data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength
    ) as ArrayBuffer;
  }
  logger.error(
    'Unexpected pass buffer type',
    new Error('UNEXPECTED_BUFFER_TYPE'),
    { serialNumber, passTypeIdentifier }
  );
  throw new Error('Unexpected pass buffer type generated by passkit-generator');
}

/**
 * Builds an Apple Wallet pass (.pkpass) from database and Upstash Redis assets
 * @param env Environment containing database and Redis storage credentials
 * @param passTypeIdentifier The pass type identifier for this pass
 * @param serialNumber The unique serial number for this pass
 * @param logger Logger instance for structured logging
 * @returns Promise resolving to ArrayBuffer containing the pkpass data
 */

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: needed complexity
export async function buildPass(
  env: Env,
  passTypeIdentifier: string,
  serialNumber: string,
  logger: Logger
): Promise<ArrayBuffer> {
  try {
    const storage = new VercelBlobAssetStorage(env, logger);

    // 1) Fetch pass row
    logger.info('Fetching pass data from database');
    const passRow = await getPassRow(
      env,
      logger,
      passTypeIdentifier,
      serialNumber
    );

    if (!passRow) {
      logger.error('Pass not found', new Error('PASS_NOT_FOUND'), {
        serialNumber,
        passTypeIdentifier,
      });
      throw new Error('PASS_NOT_FOUND');
    }

    if (passRow.passTypeIdentifier !== passTypeIdentifier) {
      logger.error('Pass type mismatch', new Error('PASS_TYPE_MISMATCH'), {
        expectedType: passTypeIdentifier,
        actualType: passRow.passTypeIdentifier,
      });
      throw new Error('PASS_TYPE_MISMATCH');
    }

    // 2) Find the passType -> certRef
    logger.info('Finding certificate reference for pass type');
    const certRef = await getCertRef(env, logger, passTypeIdentifier);
    if (!certRef) {
      logger.error('No pass type mapping found', new Error('CONFIG_ERROR'), {
        passTypeIdentifier,
      });
      throw new Error(
        `Server configuration error for pass type ${passTypeIdentifier}`
      );
    }

    // 3) Load certificate bundle
    logger.info('Loading certificate bundle', { certRef });
    const certBundle = await loadCertBundleSafe(
      certRef,
      env,
      logger,
      passTypeIdentifier,
      serialNumber
    );

    // 4) Prepare and Validate Pass Data from DB
    const validatedPassData = await getValidatedPassData(
      env,
      logger,
      passRow.id,
      passTypeIdentifier,
      serialNumber
    );

    // 5) Create pass JSON content
    logger.info('Creating pass.json content');
    let passJsonContent = createBasePassJson();

    // Add required fields
    passJsonContent.passTypeIdentifier = passRow.passTypeIdentifier;
    passJsonContent.serialNumber = passRow.serialNumber;
    passJsonContent.authenticationToken = passRow.authenticationToken;
    passJsonContent.teamIdentifier = certBundle.teamId;

    passJsonContent = mergePassDataIntoPassJson(
      passJsonContent,
      validatedPassData,
      certBundle,
      passTypeIdentifier,
      serialNumber,
      logger
    );
    // Note: Removed automatic NFC addition for poster passes. Without valid NFC data,
    // Apple will display the pass in legacy ticket format instead of poster format.
    // This is the correct behavior as poster format requires valid NFC configuration.

    // 7) Initialize model files for pass creation
    const modelFiles = await assembleModelFiles(
      storage,
      passRow,
      certBundle,
      passJsonContent,
      logger
    );

    // 8) Collect all required images to add to the model files
    // --- Icon Handling ---
    const passSpecificIconKey = `${passRow.passTypeIdentifier}/${passRow.serialNumber}/icon.png`;
    logger.info('Attempting to fetch pass-specific icon.png', {
      path: passSpecificIconKey,
    });
    try {
      const iconBuffer = await fetchVerifiedPngAsset(
        storage,
        passSpecificIconKey,
        29,
        29,
        logger
      );
      modelFiles['icon.png'] = Buffer.from(iconBuffer);
      logger.info('Added pass-specific icon.png using fetchVerifiedPngAsset');
    } catch (error: unknown) {
      logger.warn(
        `Failed to fetch/verify pass-specific icon.png (${passSpecificIconKey}): ${(error instanceof Error ? error : new Error(String(error))).message}. Trying fallback.`
      );
      // Error here means we couldn't get this specific icon, so we fall through to global fallback logic
    }

    if (!modelFiles['icon.png']) {
      const globalFallbackIconKey = 'brand-assets/icon.png';
      // const globalFallbackIconKey = 'brand-assets/icon.png'; // Already declared above in the outer scope if needed
      logger.info('Attempting to fetch global fallback icon.png', {
        path: globalFallbackIconKey,
      });
      try {
        const fallbackBuffer = await fetchVerifiedPngAsset(
          storage,
          globalFallbackIconKey,
          29,
          29,
          logger
        );
        modelFiles['icon.png'] = Buffer.from(fallbackBuffer);
        logger.info(
          'Added global fallback icon.png using fetchVerifiedPngAsset'
        );
      } catch (error: unknown) {
        logger.warn(
          `Failed to fetch/verify global fallback icon.png (${globalFallbackIconKey}): ${(error instanceof Error ? error : new Error(String(error))).message}`
        );
        // If this also fails, the check at line 313 will handle it.
      }
    }

    if (!modelFiles['icon.png']) {
      logger.error(
        'No valid icon.png found after trying all fallbacks',
        new Error('MISSING_ICON'),
        { serialNumber, passTypeIdentifier }
      );
      throw new Error('icon.png is mandatory and could not be found.');
    }

    // Handle high resolution icons in parallel
    const highResSpecs = [
      { suffix: '@2x', width: 58, height: 58 },
      { suffix: '@3x', width: 87, height: 87 },
    ] as const;

    const highResResults = await Promise.all(
      highResSpecs.map(async (spec) => {
        const filename = `icon${spec.suffix}.png`;
        const passSpecificKey = `${passRow.passTypeIdentifier}/${passRow.serialNumber}/${filename}`;
        const globalFallbackKey = `brand-assets/${filename}`;

        logger.info(`Attempting to fetch pass-specific ${filename}`, {
          path: passSpecificKey,
        });
        try {
          const imageBuffer = await fetchVerifiedPngAsset(
            storage,
            passSpecificKey,
            spec.width,
            spec.height,
            logger
          );
          logger.info(
            `Added pass-specific ${filename} using fetchVerifiedPngAsset`
          );
          return { filename, buffer: Buffer.from(imageBuffer) } as const;
        } catch (error: unknown) {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.warn(
            `Failed to fetch/verify pass-specific ${filename} (${passSpecificKey}): ${err.message}. Trying fallback.`
          );
        }

        logger.info(`Attempting to fetch global fallback ${filename}`, {
          path: globalFallbackKey,
        });
        try {
          const fallbackBuffer = await fetchVerifiedPngAsset(
            storage,
            globalFallbackKey,
            spec.width,
            spec.height,
            logger
          );
          logger.info(
            `Added global fallback ${filename} using fetchVerifiedPngAsset`
          );
          return { filename, buffer: Buffer.from(fallbackBuffer) } as const;
        } catch (error: unknown) {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.warn(
            `Failed to fetch/verify global fallback ${filename} (${globalFallbackKey}): ${err.message}`
          );
          return null;
        }
      })
    );

    for (const result of highResResults) {
      if (result) {
        modelFiles[result.filename] = result.buffer;
      }
    }
    // --- End Icon Handling ---

    // --- Logo Handling ---
  const logoKey = `${passRow.passTypeIdentifier}/events/${passRow.eventId}/logo.png`;
  const logo2xKey = `${passRow.passTypeIdentifier}/events/${passRow.eventId}/logo@2x.png`;
    logger.info('Attempting to fetch mandatory logo.png', { path: logoKey });
    try {
      const logoBuffer = await fetchVerifiedPngAsset(
        storage,
        logoKey,
        160,
        50,
        logger
      );
      modelFiles['logo.png'] = Buffer.from(logoBuffer);
      logger.info('Added logo.png using fetchVerifiedPngAsset');
    } catch (error: unknown) {
      logger.error(
        `Failed to fetch/verify mandatory logo.png (${logoKey}): ${(error instanceof Error ? error : new Error(String(error))).message}`,
        new Error('MANDATORY_LOGO_FAILURE'),
        { serialNumber, passTypeIdentifier }
      );
      throw new Error(
        `Mandatory logo.png (${logoKey}) could not be processed: ${(error instanceof Error ? error : new Error(String(error))).message}`
      );
    }

    logger.info('Attempting to fetch optional logo@2x.png', {
      path: logo2xKey,
    });
    try {
      const logo2xBuffer = await fetchVerifiedPngAsset(
        storage,
        logo2xKey,
        320,
        100,
        logger
      );
      modelFiles['logo@2x.png'] = Buffer.from(logo2xBuffer);
      logger.info('Added logo@2x.png using fetchVerifiedPngAsset');
    } catch (error: unknown) {
      logger.warn(
        `Optional logo@2x.png (${logo2xKey}) could not be processed or was not found: ${(error instanceof Error ? error : new Error(String(error))).message}`
      );
      // This is optional, so we don't throw if it fails.
    }
    // --- End Logo Handling ---

    // --- Poster/Background Handling ---
    if (passRow.poster && certBundle.isEnhanced) {
      logger.info('Processing poster-specific assets (background image)', {
        poster: true,
        isEnhanced: true,
        serialNumber,
        passTypeIdentifier,
      });
  const background2xKey = `${passRow.passTypeIdentifier}/events/${passRow.eventId}/background@2x.png`;
      logger.info('Attempting to fetch background@2x.png for poster', {
        path: background2xKey,
      });
      try {
        const bg2xBuffer = await fetchVerifiedPngAsset(
          storage,
          background2xKey,
          180 * 2,
          220 * 2,
          logger
        );
        modelFiles['background@2x.png'] = Buffer.from(bg2xBuffer);
        logger.info(
          'Added background@2x.png for poster pass using fetchVerifiedPngAsset'
        );
      } catch (error: unknown) {
        logger.warn(
          `Optional background@2x.png for poster (${background2xKey}) could not be processed or was not found: ${(error instanceof Error ? error : new Error(String(error))).message}`
        );
        // This is optional for poster, so we don't throw if it fails.
      }
    }
    // --- End Poster/Background Handling ---

    // 9) Create PKPass with all the assets and certificates
    logger.info('Creating PKPass instance with assets and certificates');
    const PKPassCtor = await ensurePKPassLoaded(
      logger,
      passTypeIdentifier,
      serialNumber
    );
    const pass = new PKPassCtor(modelFiles, {
      wwdr: certBundle.wwdr,
      signerCert: certBundle.signerCert,
      signerKey: certBundle.signerKey,
      signerKeyPassphrase: certBundle.signerKeyPassphrase,
    });

    // 10) Generate final .pkpass buffer
    logger.info('Generating pkpass data');
    const pkpassData = await pass.getAsBuffer();
    return toArrayBufferStrict(
      pkpassData,
      logger,
      passTypeIdentifier,
      serialNumber
    );
  } catch (error: unknown) {
    logger.error(
      'Failed to build pass',
      error instanceof Error ? error : new Error(String(error)),
      { passTypeIdentifier, serialNumber }
    );
    throw error instanceof Error ? error : new Error(String(error));
  }
}
