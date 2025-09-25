type TicketStyle = 'coupon' | 'event' | 'storeCard' | 'generic' | null;

export function stableStringify(value: unknown): string {
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
    ticketStyle: TicketStyle;
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
