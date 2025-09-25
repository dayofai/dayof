import { schema } from 'database/schema';
import { and, eq } from 'drizzle-orm';
import { getDbClient } from 'honoken/db';
import { pushToMany } from 'honoken/passkit/apnsFetch';
import { upsertPassContentWithEtag } from 'honoken/repo/wallet';
import type { Env as HonokenEnv } from 'honoken/types';
import { inngest } from '../client';

export const walletPassUpdate = inngest.createFunction(
  {
    id: 'wallet-pass-update',
    // Per-pass concurrency; keyed by serialNumber (assumed globally unique in practice)
    concurrency: { limit: 1, key: 'event.data.serialNumber' },
  },
  { event: 'pass/update.requested' },
  async ({ event, step, logger }) => {
    const { passTypeIdentifier, serialNumber, content } = event.data as {
      passTypeIdentifier: string;
      serialNumber: string;
      content: unknown;
    };

    const env = process.env as unknown as HonokenEnv;

    // Unify logger usage: adapt Inngest logger to Honoken logger shape
    const loggerAdapter = {
      info: (message: string, data?: Record<string, unknown>) =>
        logger.info(message, data),
      warn: (message: string, data?: Record<string, unknown>) =>
        logger.warn(message, data),
      warnAsync: async (message: string, data?: Record<string, unknown>) =>
        logger.warn(message, data),
      error: (
        message: string,
        error: unknown,
        data?: Record<string, unknown>
      ) => logger.error(message, error as Error, data),
      errorAsync: async (
        message: string,
        error: unknown,
        data?: Record<string, unknown>
      ) => logger.error(message, error as Error, data),
    } as const;

    const db = getDbClient(env, loggerAdapter as any);

    const write = await step.run('write-etag', async () => {
      const result = await upsertPassContentWithEtag(
        db,
        { passTypeIdentifier, serialNumber },
        content
      );
      return result;
    });

    if (!write.changed) {
      // Idempotency: no push when content/metadata did not materially change.
      return { skipped: true, etag: write.etag } as const;
    }

    const regs = await step.run('load-registrations', async () => {
      const rows = await db
        .select({
          pushToken: schema.walletDevice.pushToken,
          deviceLibraryIdentifier: schema.walletDevice.deviceLibraryIdentifier,
        })
        .from(schema.walletRegistration)
        .innerJoin(
          schema.walletDevice,
          eq(
            schema.walletRegistration.deviceLibraryIdentifier,
            schema.walletDevice.deviceLibraryIdentifier
          )
        )
        .where(
          and(
            eq(
              schema.walletRegistration.passTypeIdentifier,
              passTypeIdentifier
            ),
            eq(schema.walletRegistration.serialNumber, serialNumber),
            eq(schema.walletRegistration.active, true)
          )
        );
      return rows;
    });

    if (regs.length === 0) {
      return { pushed: 0, etag: write.etag } as const;
    }

    const pushed = await step.run('apns-push', async () => {
      const report = await pushToMany(
        env,
        regs,
        passTypeIdentifier,
        loggerAdapter as unknown as Parameters<typeof pushToMany>[3]
      );
      return report?.summary?.attempted ?? regs.length;
    });

    return { pushed, etag: write.etag } as const;
  }
);
