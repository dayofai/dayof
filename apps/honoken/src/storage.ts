import { createHash } from 'node:crypto';
import { schema as sharedSchema } from 'database/schema';
import { and, eq, gt } from 'drizzle-orm';
import type { PostHog } from 'posthog-node';
import { getDbClient } from './db';
import type { Env } from './types';
import type { Logger } from './utils/logger';

/**
 * Hash device ID for privacy-preserving tracking
 */
function hashDeviceId(deviceId: string): string {
  return createHash('sha256').update(deviceId).digest('hex').substring(0, 16);
}

export async function verifyToken(
  env: Env,
  passTypeIdentifier: string,
  serialNumber: string,
  authorizationHeader?: string,
  logger?: Logger
): Promise<{ valid: boolean; notFound: boolean }> {
  // 1. Strict case-sensitive check for "ApplePass " prefix
  // This handles missing headers, empty headers, wrong schemes, and wrong case
  if (!authorizationHeader?.startsWith('ApplePass ')) {
    return { valid: false, notFound: false };
  }

  // 2. Extract the token directly using substring (10 chars = "ApplePass ")
  // Trim to handle any accidental whitespace in the token itself
  const token = authorizationHeader.substring(10).trim();

  // 3. Check if the extracted token is empty
  // This handles cases like "Authorization: ApplePass   " (only spaces after prefix)
  if (!token) {
    return { valid: false, notFound: false };
  }

  // 4. Only proceed with database lookup if all preliminary checks pass
  const dbClient = getDbClient(env, logger);
  const result = await dbClient.query.walletPass.findFirst({
    columns: { authenticationToken: true },
    where: { passTypeIdentifier, serialNumber },
  });

  if (!result) {
    return { valid: false, notFound: true };
  }
  return { valid: result.authenticationToken === token, notFound: false };
}

export async function registerDevice(
  env: Env,
  deviceLibraryIdentifier: string,
  passTypeIdentifier: string,
  serialNumber: string,
  pushToken: string,
  authorizationHeader: string | undefined,
  logger: Logger,
  posthog?: PostHog
): Promise<{ success: boolean; status: number; message?: string }> {
  const verification = await verifyToken(
    env,
    passTypeIdentifier,
    serialNumber,
    authorizationHeader,
    logger
  );

  if (verification.notFound) {
    return { success: false, status: 404, message: 'Pass not found.' };
  }

  if (!verification.valid) {
    return {
      success: false,
      status: 401,
      message: 'Invalid authentication token.',
    };
  }

  const dbClient = getDbClient(env, logger);

  try {
    // neon-http has no transactions; perform sequential operations
    await dbClient
      .insert(sharedSchema.walletDevice)
      .values({ deviceLibraryIdentifier, pushToken })
      .onConflictDoUpdate({
        target: sharedSchema.walletDevice.deviceLibraryIdentifier,
        set: { pushToken },
      });

    const existingReg = await dbClient.query.walletRegistration.findFirst({
      columns: { deviceLibraryIdentifier: true, active: true },
      where: { deviceLibraryIdentifier, passTypeIdentifier, serialNumber },
    });

    let outcome: 'already_active' | 'reactivated' | 'created';
    if (existingReg) {
      if (existingReg.active) {
        outcome = 'already_active';
      } else {
        await dbClient
          .update(sharedSchema.walletRegistration)
          .set({ active: true })
          .where(
            and(
              eq(
                sharedSchema.walletRegistration.deviceLibraryIdentifier,
                deviceLibraryIdentifier
              ),
              eq(
                sharedSchema.walletRegistration.passTypeIdentifier,
                passTypeIdentifier
              ),
              eq(sharedSchema.walletRegistration.serialNumber, serialNumber)
            )
          );
        outcome = 'reactivated';
      }
    } else {
      const passRow = await dbClient.query.walletPass.findFirst({
        columns: { id: true },
        where: { passTypeIdentifier, serialNumber },
      });

      if (!passRow) {
        throw new Error('PASS_NOT_FOUND');
      }

      await dbClient
        .insert(sharedSchema.walletRegistration)
        .values({
          passId: passRow.id,
          deviceLibraryIdentifier,
          passTypeIdentifier,
          serialNumber,
          active: true,
        })
        .onConflictDoNothing();
      outcome = 'created';
    }

    // Track device registration in PostHog (only for new registrations)
    if (outcome === 'created' && posthog) {
      const hashedDeviceId = hashDeviceId(deviceLibraryIdentifier);
      posthog.capture({
        distinctId: hashedDeviceId,
        event: 'device_registered',
        properties: {
          passType: passTypeIdentifier,
          hashedDeviceId,
          // Don't include serialNumber for privacy
        },
      });
    }

    if (outcome === 'created') {
      return {
        success: true,
        status: 201,
        message: 'Device successfully registered.',
      };
    }
    if (outcome === 'reactivated') {
      return {
        success: true,
        status: 200,
        message: 'Existing registration reactivated.',
      };
    }
    if (outcome === 'already_active') {
      return {
        success: true,
        status: 200,
        message: 'Device already registered and active.',
      };
    }
    // This should never happen since the transaction must return one of the above values
    logger.error(
      'Device registration transaction returned unexpected outcome.',
      new Error('REGISTRATION_OUTCOME_ERROR'),
      { deviceLibraryIdentifier, passTypeIdentifier, serialNumber, outcome }
    );
    return {
      success: false,
      status: 500,
      message: 'Internal server error during registration.',
    };
  } catch (error: unknown) {
    logger.error('Error during device registration transaction', error, {
      deviceLibraryIdentifier,
      passTypeIdentifier,
      serialNumber,
    });
    return {
      success: false,
      status: 500,
      message: 'Internal server error during registration.',
    };
  }
}

export async function unregisterDevice(
  env: Env,
  deviceLibraryIdentifier: string,
  passTypeIdentifier: string,
  serialNumber: string,
  authorizationHeader: string | undefined,
  logger: Logger
): Promise<{ success: boolean; status: number; message?: string }> {
  const verification = await verifyToken(
    env,
    passTypeIdentifier,
    serialNumber,
    authorizationHeader,
    logger
  );
  if (verification.notFound) {
    return { success: false, status: 404, message: 'Pass not found.' };
  }
  if (!verification.valid) {
    return {
      success: false,
      status: 401,
      message: 'Invalid authentication token.',
    };
  }

  const dbClient = getDbClient(env, logger);

  try {
    // Set active = false instead of deleting the record
    await dbClient
      .update(sharedSchema.walletRegistration)
      .set({ active: false })
      .where(
        and(
          eq(
            sharedSchema.walletRegistration.deviceLibraryIdentifier,
            deviceLibraryIdentifier
          ),
          eq(
            sharedSchema.walletRegistration.passTypeIdentifier,
            passTypeIdentifier
          ),
          eq(sharedSchema.walletRegistration.serialNumber, serialNumber),
          eq(sharedSchema.walletRegistration.active, true) // Only deactivate if currently active
        )
      );

    // Apple expects 200 OK for successful unregistration.
    // If the registration didn't exist or wasn't active, it's effectively still a 200 from client perspective.
    return {
      success: true,
      status: 200,
      message: 'Device successfully unregistered.',
    };
  } catch (error: unknown) {
    logger.error('Error during device unregistration', error, {
      deviceLibraryIdentifier,
      passTypeIdentifier,
      serialNumber,
    });
    return {
      success: false,
      status: 500,
      message: 'Internal server error during unregistration.',
    };
  }
}

export async function listUpdatedSerials(
  env: Env,
  deviceLibraryIdentifier: string,
  passTypeIdentifier: string,
  filters: { passesUpdatedSince?: string },
  logger: Logger
): Promise<{ serialNumbers: string[]; lastUpdated: string } | undefined> {
  const dbClient = getDbClient(env, logger);

  // Build WHERE conditions for the join query
  const whereConditions = [
    eq(
      sharedSchema.walletRegistration.deviceLibraryIdentifier,
      deviceLibraryIdentifier
    ),
    eq(sharedSchema.walletRegistration.passTypeIdentifier, passTypeIdentifier),
    eq(sharedSchema.walletRegistration.active, true),
    eq(sharedSchema.walletPass.passTypeIdentifier, passTypeIdentifier), // Ensure pass type matches
  ];

  if (filters.passesUpdatedSince) {
    const updatedSince = new Date(Number(filters.passesUpdatedSince) * 1000);
    whereConditions.push(gt(sharedSchema.walletPass.updatedAt, updatedSince));
  }

  // Single query with INNER JOIN instead of inArray() to avoid PostgreSQL IN clause limits
  const updatedPasses = await dbClient
    .select({
      serialNumber: sharedSchema.walletPass.serialNumber,
      updated_at: sharedSchema.walletPass.updatedAt,
    })
    .from(sharedSchema.walletPass)
    .innerJoin(
      sharedSchema.walletRegistration,
      and(
        eq(
          sharedSchema.walletPass.passTypeIdentifier,
          sharedSchema.walletRegistration.passTypeIdentifier
        ),
        eq(
          sharedSchema.walletPass.serialNumber,
          sharedSchema.walletRegistration.serialNumber
        )
      )
    )
    .where(and(...whereConditions));

  if (updatedPasses.length === 0) {
    return;
  }

  const updatedSerialNumbers = updatedPasses.map((pass) => pass.serialNumber);

  const timestamps = updatedPasses.map((pass) => {
    const date =
      pass.updated_at instanceof Date
        ? pass.updated_at
        : new Date(pass.updated_at);
    return Math.floor(date.getTime() / 1000);
  });

  const lastUpdated = String(Math.max(...timestamps));

  return {
    serialNumbers: updatedSerialNumbers,
    lastUpdated,
  };
}

/**
 * Verify list access token for the list-updated-serials endpoint.
 * Checks that the token belongs to any pass of the given passTypeIdentifier
 * and that the device has an active registration for that pass.
 */
export async function verifyListAccessToken(
  env: Env,
  passTypeIdentifier: string,
  deviceLibraryIdentifier: string,
  token: string,
  logger?: Logger
): Promise<boolean> {
  const dbClient = getDbClient(env, logger);
  const result = await dbClient
    .select({ serialNumber: sharedSchema.walletPass.serialNumber })
    .from(sharedSchema.walletPass)
    .innerJoin(
      sharedSchema.walletRegistration,
      and(
        eq(
          sharedSchema.walletRegistration.passTypeIdentifier,
          sharedSchema.walletPass.passTypeIdentifier
        ),
        eq(
          sharedSchema.walletRegistration.serialNumber,
          sharedSchema.walletPass.serialNumber
        )
      )
    )
    .where(
      and(
        eq(sharedSchema.walletPass.passTypeIdentifier, passTypeIdentifier),
        eq(sharedSchema.walletPass.authenticationToken, token),
        eq(
          sharedSchema.walletRegistration.deviceLibraryIdentifier,
          deviceLibraryIdentifier
        ),
        eq(sharedSchema.walletRegistration.active, true)
      )
    );

  return Array.isArray(result) ? result.length > 0 : !!result;
}

export async function getPassData(
  env: Env,
  passTypeIdentifier: string,
  serialNumber: string,
  logger: Logger
): Promise<{ authenticationToken: string } | undefined> {
  const dbClient = getDbClient(env, logger);

  const result = await dbClient.query.walletPass.findFirst({
    columns: { authenticationToken: true },
    where: { passTypeIdentifier, serialNumber },
  });

  if (!result) {
    return;
  }

  return result;
}

export async function getPassModificationTime(
  env: Env,
  passTypeIdentifier: string,
  serialNumber: string,
  logger: Logger
): Promise<Date | null> {
  const dbClient = getDbClient(env, logger);

  const result = await dbClient.query.walletPass.findFirst({
    columns: { updatedAt: true },
    where: { passTypeIdentifier, serialNumber },
  });

  if (!result) {
    return null;
  }

  // Ensure we return a proper Date object
  return result.updatedAt instanceof Date
    ? result.updatedAt
    : new Date(result.updatedAt);
}

// Logs messages using the provided logger instance.
export function logMessages(logs: string[], logger: Logger): void {
  for (const msg of logs) {
    logger.info('[PassKit Log]', { messageContent: msg });
  }
}
