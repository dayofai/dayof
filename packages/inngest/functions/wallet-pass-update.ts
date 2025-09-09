import { schema } from 'database/schema';
import { and, eq } from 'drizzle-orm';
import { getDbClient } from '../../../apps/honoken/src/db';
import { pushToMany } from '../../../apps/honoken/src/passkit/apnsFetch';
import { upsertPassContentWithEtag } from '../../../apps/honoken/src/repo/wallet';
import type { Env as HonokenEnv } from '../../../apps/honoken/src/types';
import { inngest } from '../client';

export const walletPassUpdate = inngest.createFunction(
  { id: 'wallet-pass-update' },
  { event: 'pass/update.requested' },
  async ({ event, step, logger }) => {
    const { passTypeIdentifier, serialNumber, content } = event.data as {
      passTypeIdentifier: string;
      serialNumber: string;
      content: unknown;
    };

    const env = process.env as unknown as HonokenEnv;
    const db = getDbClient(env);

    const write = await step.run('write-etag', async () => {
      const result = await upsertPassContentWithEtag(
        db,
        { passTypeIdentifier, serialNumber },
        content
      );
      return result;
    });

    if (!write.changed) {
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

    const appLogger = {
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
    };

    const pushed = await step.run('apns-push', async () => {
      const report = await pushToMany(
        env,
        regs,
        passTypeIdentifier,
        appLogger as unknown as Parameters<typeof pushToMany>[3]
      );
      return report?.summary?.attempted ?? regs.length;
    });

    return { pushed, etag: write.etag } as const;
  }
);
