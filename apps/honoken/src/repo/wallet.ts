import { schema, type WalletPass } from 'database/schema';
import { and, eq } from 'drizzle-orm';
import type { DbClient } from '../db';

type PassKey = {
  passTypeIdentifier: string;
  serialNumber: string;
};

function nowSeconds(): Date {
  const ms = Date.now();
  return new Date(Math.floor(ms / 1000) * 1000);
}

function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_k, v) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const sorted: Record<string, unknown> = {};
      for (const key of Object.keys(v as Record<string, unknown>).sort()) {
        sorted[key] = (v as Record<string, unknown>)[key];
      }
      return sorted;
    }
    return v;
  });
}

async function sha256Hex(input: string | Uint8Array): Promise<string> {
  const data =
    typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const buf = new ArrayBuffer(data.byteLength);
  new Uint8Array(buf).set(data);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  const bytes = new Uint8Array(digest);
  let hex = '';
  for (const b of bytes) {
    hex += b.toString(16).padStart(2, '0');
  }
  return hex;
}

export function computeEtagFrom(
  meta: {
    passTypeIdentifier: string;
    serialNumber: string;
    ticketStyle: WalletPass['ticketStyle'];
    poster: boolean;
    updatedAt: Date;
  },
  contentData: unknown
): Promise<string> {
  const payload = {
    pass: {
      passTypeIdentifier: meta.passTypeIdentifier,
      serialNumber: meta.serialNumber,
      ticketStyle: meta.ticketStyle,
      poster: meta.poster,
      updatedAtSec: Math.floor(meta.updatedAt.getTime() / 1000),
    },
    content: contentData ?? null,
  };
  return sha256Hex(stableStringify(payload));
}

export function upsertPassContentWithEtag(
  db: DbClient,
  key: PassKey,
  data: unknown
): Promise<{ etag: string; updatedAt: Date; changed: boolean }> {
  return db.transaction(async (tx) => {
    const pass = await tx.query.walletPass.findFirst({
      where: {
        passTypeIdentifier: key.passTypeIdentifier,
        serialNumber: key.serialNumber,
      },
      columns: { id: true, ticketStyle: true, poster: true, etag: true },
    });
    if (!pass) {
      throw new Error(
        `PASS_NOT_FOUND: ${key.passTypeIdentifier}/${key.serialNumber}`
      );
    }

    const existing = await tx.query.walletPassContent.findFirst({
      where: { passId: pass.id },
      columns: { data: true },
    });

    const prevJson = existing?.data ?? null;
    const nextJson = data ?? null;
    const changed = stableStringify(prevJson) !== stableStringify(nextJson);

    if (!existing) {
      await tx
        .insert(schema.walletPassContent)
        .values({ passId: pass.id, data: nextJson });
    } else if (changed) {
      await tx
        .update(schema.walletPassContent)
        .set({ data: nextJson, updatedAt: nowSeconds() })
        .where(eq(schema.walletPassContent.passId, pass.id));
    }

    if (!changed && pass.etag) {
      // Nothing changed and ETag already exists
      return { etag: pass.etag, updatedAt: nowSeconds(), changed };
    }

    const updatedAt = nowSeconds();
    const etag = await computeEtagFrom(
      {
        passTypeIdentifier: key.passTypeIdentifier,
        serialNumber: key.serialNumber,
        ticketStyle: pass.ticketStyle,
        poster: pass.poster,
        updatedAt,
      },
      nextJson
    );

    await tx
      .update(schema.walletPass)
      .set({ etag, updatedAt })
      .where(
        and(
          eq(schema.walletPass.passTypeIdentifier, key.passTypeIdentifier),
          eq(schema.walletPass.serialNumber, key.serialNumber)
        )
      );

    return { etag, updatedAt, changed: true };
  });
}

export function updatePassMetadataWithEtag(
  db: DbClient,
  key: PassKey,
  patch: Partial<{ ticketStyle: WalletPass['ticketStyle']; poster: boolean }>
): Promise<{ etag: string; updatedAt: Date; changed: boolean }> {
  return db.transaction(async (tx) => {
    await tx
      .update(schema.walletPass)
      .set(patch)
      .where(
        and(
          eq(schema.walletPass.passTypeIdentifier, key.passTypeIdentifier),
          eq(schema.walletPass.serialNumber, key.serialNumber)
        )
      );

    const reloaded = await tx.query.walletPass.findFirst({
      where: {
        passTypeIdentifier: key.passTypeIdentifier,
        serialNumber: key.serialNumber,
      },
      columns: { id: true, ticketStyle: true, poster: true },
    });
    if (!reloaded) {
      throw new Error(
        `PASS_NOT_FOUND: ${key.passTypeIdentifier}/${key.serialNumber}`
      );
    }

    const content = await tx.query.walletPassContent.findFirst({
      where: { passId: reloaded.id },
      columns: { data: true },
    });

    const updatedAt = nowSeconds();
    const etag = await computeEtagFrom(
      {
        passTypeIdentifier: key.passTypeIdentifier,
        serialNumber: key.serialNumber,
        ticketStyle: reloaded.ticketStyle,
        poster: reloaded.poster,
        updatedAt,
      },
      content?.data ?? null
    );

    await tx
      .update(schema.walletPass)
      .set({ etag, updatedAt })
      .where(
        and(
          eq(schema.walletPass.passTypeIdentifier, key.passTypeIdentifier),
          eq(schema.walletPass.serialNumber, key.serialNumber)
        )
      );

    return { etag, updatedAt, changed: true };
  });
}
