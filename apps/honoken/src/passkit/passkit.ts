// PKPass will be loaded dynamically - preload on Vercel to avoid cold-start penalty
let LazyPKPass: typeof import('passkit-generator').PKPass | undefined;

// Preload passkit-generator on Vercel to avoid cold-start penalty on first request
if (process.env.VERCEL !== undefined) {
  import('passkit-generator').then(
    (module) => {
      LazyPKPass = module.PKPass;
    },
    (error) => {
      // Silently fail during preload - the request-time fallback will handle it
      console.warn(
        'Failed to preload passkit-generator during cold start:',
        error.message
      );
    }
  );
}

import { Buffer } from 'node:buffer';
import { eq } from 'drizzle-orm';
import { type ZodIssue, z } from 'zod/v4';
import { getDbClient } from '../db';
import { passes, passTypes } from '../db/schema';
import { PassDataEventTicketSchema } from '../schemas';
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

  const headerBytes = header;

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
  const chunkLength =
    (headerBytes[8] << 24) |
    (headerBytes[9] << 16) |
    (headerBytes[10] << 8) |
    headerBytes[11];

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
  const headerView = new DataView(
    headerBytes.buffer,
    headerBytes.byteOffset + 16,
    8
  );
  const w = headerView.getUint32(0); // Width
  const h = headerView.getUint32(4); // Height

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
function createBasePassJson(): any {
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

/**
 * Builds an Apple Wallet pass (.pkpass) from database and Upstash Redis assets
 * @param env Environment containing database and Redis storage credentials
 * @param passTypeIdentifier The pass type identifier for this pass
 * @param serialNumber The unique serial number for this pass
 * @param logger Logger instance for structured logging
 * @returns Promise resolving to ArrayBuffer containing the pkpass data
 */
export async function buildPass(
  env: Env,
  passTypeIdentifier: string,
  serialNumber: string,
  logger: Logger
): Promise<ArrayBuffer> {
  try {
    const db = getDbClient(env, logger);
    const storage = new VercelBlobAssetStorage(env, logger);

    // 1) Fetch pass row
    logger.info('Fetching pass data from database');
    const passRow = await db.query.passes.findFirst({
      where: (p, { eq, and }) =>
        and(
          eq(p.passTypeIdentifier, passTypeIdentifier),
          eq(p.serialNumber, serialNumber)
        ),
    });

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
    const passTypeLink = await db.query.passTypes.findFirst({
      where: (pt) => eq(pt.passTypeIdentifier, passTypeIdentifier),
    });

    if (!passTypeLink) {
      logger.error('No pass type mapping found', new Error('CONFIG_ERROR'), {
        passTypeIdentifier,
      });
      throw new Error(
        `Server configuration error for pass type ${passTypeIdentifier}`
      );
    }
    const certRef = passTypeLink.certRef;

    // 3) Load certificate bundle
    logger.info('Loading certificate bundle', { certRef });
    let certBundle: CertBundle;
    try {
      certBundle = await loadCertBundle(certRef, env, logger);
    } catch (err: any) {
      logger.error('Failed to load certificate bundle', err, {
        certRef,
        passTypeIdentifier,
        serialNumber,
      });
      throw new Error(`CERT_BUNDLE_LOAD_ERROR: ${err.message}`);
    }

    // 4) Prepare and Validate Pass Data from DB
    let rawPassDataFromDb: any;
    if (typeof (passRow as any).passData === 'string') {
      try {
        rawPassDataFromDb = JSON.parse((passRow as any).passData);
      } catch (e) {
        logger.error('Invalid JSON in passData from DB', e, {
          passTypeIdentifier,
          serialNumber,
        });
        throw new Error('PASS_DATA_INVALID_JSON');
      }
    } else {
      rawPassDataFromDb = (passRow as any).passData;
    }
    rawPassDataFromDb = rawPassDataFromDb || {};

    let validatedPassData: z.infer<typeof PassDataEventTicketSchema>;
    try {
      validatedPassData = PassDataEventTicketSchema.parse(rawPassDataFromDb);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const prettyErrorSummary = validationError.issues
          .map(
            (e: ZodIssue) => `${e.path.join('.') || 'passData'}: ${e.message}`
          )
          .join('; ');
        logger.error('Pass data validation failed', {
          passTypeIdentifier,
          serialNumber,
          ticketStyle: passRow.ticketStyle,
          validationIssues: validationError.issues,
          prettySummary: prettyErrorSummary,
        });
        throw new Error(`PASS_DATA_VALIDATION_ERROR: ${prettyErrorSummary}`);
      }
      logger.error(
        'Unknown error during pass data validation',
        validationError,
        { passTypeIdentifier, serialNumber, ticketStyle: passRow.ticketStyle }
      );
      throw validationError;
    }

    // 5) Create pass JSON content
    logger.info('Creating pass.json content');
    const passJsonContent = createBasePassJson();

    // Add required fields
    passJsonContent.passTypeIdentifier = passRow.passTypeIdentifier;
    passJsonContent.serialNumber = passRow.serialNumber;
    passJsonContent.authenticationToken = passRow.authenticationToken;
    passJsonContent.teamIdentifier = certBundle.teamId;

    // 6) Transform loose fields into eventTicket structure if needed
    // Shallow copy is sufficient - we only mutate top-level properties (assignment/deletion)
    const processedPassData = { ...validatedPassData };

    if (processedPassData.eventTicket) {
      logger.info('Using pre-structured eventTicket from passData', {
        passTypeIdentifier,
        serialNumber,
      });
    } else {
      logger.info(
        'No pre-structured eventTicket found, creating from loose fields'
      );

      // Build primaryFields from available loose fields
      const primaryFields: any[] = [];

      if (processedPassData.eventName) {
        primaryFields.push({
          key: 'event',
          label: 'Event',
          value: processedPassData.eventName,
        });
      }

      if (processedPassData.eventDateISO) {
        primaryFields.push({
          key: 'date',
          label: 'Date',
          value: processedPassData.eventDateISO,
          dateStyle: 'PKDateStyleMedium',
          timeStyle: 'PKDateStyleShort',
        });
      }

      if (processedPassData.venueName) {
        primaryFields.push({
          key: 'venue',
          label: 'Venue',
          value: processedPassData.venueName,
        });
      }

      // Add seat information as secondary field if available
      const secondaryFields: any[] = [];
      if (processedPassData.seat) {
        secondaryFields.push({
          key: 'seat',
          label: 'Seat',
          value: processedPassData.seat,
        });
      }

      if (processedPassData.section) {
        secondaryFields.push({
          key: 'section',
          label: 'Section',
          value: processedPassData.section,
        });
      }

      // Apple requires at least one primaryField for eventTicket
      if (primaryFields.length === 0) {
        // Fallback: use description as primary field if no other data available
        primaryFields.push({
          key: 'event',
          label: 'Event',
          value: processedPassData.description,
        });
        logger.warn(
          'No loose fields available for eventTicket, using description as fallback',
          {
            passTypeIdentifier,
            serialNumber,
          }
        );
      }

      // Create the eventTicket structure
      processedPassData.eventTicket = {
        primaryFields,
        ...(secondaryFields.length > 0 && { secondaryFields }),
      };

      // Remove loose fields that have been transformed
      delete processedPassData.eventName;
      delete processedPassData.eventDateISO;
      delete processedPassData.venueName;
      delete processedPassData.seat;
      delete processedPassData.section;

      logger.info('Created eventTicket structure from loose fields', {
        passTypeIdentifier,
        serialNumber,
        primaryFieldsCount: primaryFields.length,
        secondaryFieldsCount: secondaryFields.length,
      });
    }

    // Merge processed pass data into the content
    Object.assign(passJsonContent, processedPassData);

    // Handle NFC
    if (validatedPassData.nfc) {
      if (certBundle.isEnhanced) {
        // Additional validation for encryptionPublicKey format
        if (
          !validatedPassData.nfc.encryptionPublicKey ||
          validatedPassData.nfc.encryptionPublicKey.trim() === ''
        ) {
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
        delete passJsonContent.nfc;
      }
    }
    // Note: Removed automatic NFC addition for poster passes. Without valid NFC data,
    // Apple will display the pass in legacy ticket format instead of poster format.
    // This is the correct behavior as poster format requires valid NFC configuration.

    // 7) Initialize model files for pass creation
    const modelFiles: Record<string, Buffer> = {
      'pass.json': Buffer.from(JSON.stringify(passJsonContent)),
    };

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
    } catch (error: any) {
      logger.warn(
        `Failed to fetch/verify pass-specific icon.png (${passSpecificIconKey}): ${error.message}. Trying fallback.`
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
      } catch (error: any) {
        logger.warn(
          `Failed to fetch/verify global fallback icon.png (${globalFallbackIconKey}): ${error.message}`
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

    // Handle high resolution icons
    for (const suffix of ['@2x', '@3x']) {
      const filename = `icon${suffix}.png`;
      const passSpecificKey = `${passRow.passTypeIdentifier}/${passRow.serialNumber}/${filename}`;
      const globalFallbackKey = `brand-assets/${filename}`;
      let added = false;
      const expectedDimensions =
        suffix === '@2x'
          ? { width: 58, height: 58 }
          : { width: 87, height: 87 };

      logger.info(`Attempting to fetch pass-specific ${filename}`, {
        path: passSpecificKey,
      });
      try {
        const imageBuffer = await fetchVerifiedPngAsset(
          storage,
          passSpecificKey,
          expectedDimensions.width,
          expectedDimensions.height,
          logger
        );
        modelFiles[filename] = Buffer.from(imageBuffer);
        logger.info(
          `Added pass-specific ${filename} using fetchVerifiedPngAsset`
        );
        added = true;
      } catch (error: any) {
        logger.warn(
          `Failed to fetch/verify pass-specific ${filename} (${passSpecificKey}): ${error.message}. Trying fallback.`
        );
      }

      if (!added) {
        logger.info(`Attempting to fetch global fallback ${filename}`, {
          path: globalFallbackKey,
        });
        try {
          const fallbackBuffer = await fetchVerifiedPngAsset(
            storage,
            globalFallbackKey,
            expectedDimensions.width,
            expectedDimensions.height,
            logger
          );
          modelFiles[filename] = Buffer.from(fallbackBuffer);
          logger.info(
            `Added global fallback ${filename} using fetchVerifiedPngAsset`
          );
          // 'added' remains false if this path is taken, but the file is added.
          // The 'added' flag was primarily for the outer if condition.
        } catch (error: any) {
          logger.warn(
            `Failed to fetch/verify global fallback ${filename} (${globalFallbackKey}): ${error.message}`
          );
        }
      }
    }
    // --- End Icon Handling ---

    // --- Logo Handling ---
    const logoKey = `${passRow.passTypeIdentifier}/${passRow.serialNumber}/logo.png`;
    const logo2xKey = `${passRow.passTypeIdentifier}/${passRow.serialNumber}/logo@2x.png`;
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
    } catch (error: any) {
      logger.error(
        `Failed to fetch/verify mandatory logo.png (${logoKey}): ${error.message}`,
        new Error('MANDATORY_LOGO_FAILURE'),
        { serialNumber, passTypeIdentifier }
      );
      throw new Error(
        `Mandatory logo.png (${logoKey}) could not be processed: ${error.message}`
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
    } catch (error: any) {
      logger.warn(
        `Optional logo@2x.png (${logo2xKey}) could not be processed or was not found: ${error.message}`
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
      const background2xKey = `${passRow.passTypeIdentifier}/${passRow.serialNumber}/background@2x.png`;
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
      } catch (error: any) {
        logger.warn(
          `Optional background@2x.png for poster (${background2xKey}) could not be processed or was not found: ${error.message}`
        );
        // This is optional for poster, so we don't throw if it fails.
      }
    }
    // --- End Poster/Background Handling ---

    // 9) Create PKPass with all the assets and certificates
    logger.info('Creating PKPass instance with assets and certificates');
    if (LazyPKPass) {
      logger.info('Using preloaded passkit-generator instance.');
    } else {
      logger.info(
        'Fallback: dynamically loading passkit-generator (preload may have failed)...'
      );
      try {
        LazyPKPass = (await import('passkit-generator')).PKPass;
        logger.info('passkit-generator loaded via fallback.');
      } catch (error: any) {
        logger.error('Failed to load passkit-generator', error, {
          passTypeIdentifier,
          serialNumber,
        });
        LazyPKPass = undefined; // Explicitly invalidate for next retry
        throw new Error(`Failed to load passkit-generator: ${error.message}`);
      }
    }
    const pass = new LazyPKPass(modelFiles, {
      wwdr: certBundle.wwdr,
      signerCert: certBundle.signerCert,
      signerKey: certBundle.signerKey,
      signerKeyPassphrase: certBundle.signerKeyPassphrase,
    });

    // 10) Generate final .pkpass buffer
    logger.info('Generating pkpass data');
    const pkpassData: Uint8Array | ArrayBuffer = await pass.getAsBuffer();

    if (pkpassData instanceof ArrayBuffer) {
      logger.info('Pass generation complete');
      return pkpassData;
    }
    if (pkpassData instanceof Uint8Array) {
      logger.info('Pass generation complete (converted from Uint8Array)');
      return pkpassData.buffer.slice(
        pkpassData.byteOffset,
        pkpassData.byteOffset + pkpassData.byteLength
      ) as ArrayBuffer;
    }

    logger.error(
      'Unexpected pass buffer type',
      new Error('UNEXPECTED_BUFFER_TYPE'),
      { serialNumber, passTypeIdentifier }
    );
    throw new Error(
      'Unexpected pass buffer type generated by passkit-generator'
    );
  } catch (error) {
    const log = logger || console;
    log.error(
      'Failed to build pass',
      error instanceof Error ? error : new Error(String(error)),
      { passTypeIdentifier, serialNumber }
    );
    throw error;
  }
}
