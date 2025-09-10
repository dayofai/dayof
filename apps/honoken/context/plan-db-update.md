Below is a **tight, updated implementation plan** that folds in your decisions and the code context you shared. It replaces the original where needed and keeps everything greenfield, Drizzle V2–ready, Node 22–aligned, with **stored tokens**, **jsonb content split**, **Inngest‑orchestrated ETag updates**, and **Vercel Blob** for assets.

---

# DB Consolidation & Orchestration Plan (Aligned)

**Scope**
Consolidate Honoken’s wallet schema into the shared monorepo database package, standardize naming, split pass content to a 1‑to‑1 `jsonb` table, implement **ETag‑on‑write via Inngest workflows**, keep **stored plaintext tokens**, switch Honoken to consume `@database` exports, and use **Vercel Blob** for assets.

**Outcome**
One Neon Postgres database and a single monorepo‑wide DB package (Drizzle V2). GET paths are pure read‑only. Updates are durable, ordered, and race‑free via Inngest.

---

## Decisions (locked)

- **Node**: Align **Node 22** everywhere (monorepo engines and Vercel).
- **Token strategy**: **Keep stored tokens** in `wallet_pass.authentication_token` (Apple spec). Add a btree index for lookups. No deterministic/HMAC tokens now.
- **Tables**: Prefix `wallet_`; all snake_case.
- **Pass content**: New `wallet_pass_content` (`jsonb`, 1‑to‑1 with pass).
- **ETag**: **On write** only, via Inngest workflow (no writes in GET). Store in `wallet_pass.etag`.
  _Composition note:_ exclude `authentication_token` from ETag (prevents churn if token policy ever changes).
- **Updated clock**: Always bump `wallet_pass.updated_at` on material changes; use seconds precision for Last‑Modified semantics.
- **Tenancy**: Passes belong to orgs (`createdBy()` → `org_id`) where appropriate. `wallet_cert`, `wallet_apns_key`, `wallet_pass_type` can be global/universal.
- **Soft delete**: `timeStamps({ softDelete: true })` on wallet tables where noted.
- **Logs**: PostHog only; no DB table.
- **APNs**: Keep dev trigger endpoint optional; production fan‑out run via Inngest step.
- **Assets**: **Vercel Blob** via `BLOB_READ_WRITE_TOKEN` (your adapter is good).

---

## High‑level Overview (what changes vs. the original plan)

1. **Shared DB schema** (`packages/database/schema/wallet.ts`) for:
   - `wallet_ticket_style_enum`
   - `wallet_cert`, `wallet_apns_key`, `wallet_pass_type`
   - `wallet_pass` (composite PK), `wallet_device`, `wallet_registration`
   - `wallet_pass_content` (1‑to‑1 JSONB with `wallet_pass`)
   - Relations & `$inferSelect/$inferInsert` types
   - Indexes (including on `authentication_token`)

2. **Honoken** moves to shared `database` package schema/client; local schema removed.
3. **ETag & updates**: No writes in GET. All pass mutations go through **repo helpers** that recompute ETag and bump timestamps **inside the same TX**; these run **inside an Inngest workflow** that then fans out APNs.
4. **Build pass** (`current-passkit.ts`): read `wallet_pass`, `wallet_pass_type`→`wallet_cert`, and `wallet_pass_content.data` (JSONB). Assets fetched via your **Vercel Blob** adapter.
5. **Guardrails**: ESLint “no‑raw‑writes” rules outside repo layer.
6. **Greenfield migrations** generated from the shared DB package only.

---

## Schema (Drizzle V2 & DDL)

> Greenfield: we can create fresh without rename shims. Below is the shape; generate via Drizzle from TS definitions.

**Enum**

```sql
CREATE TYPE wallet_ticket_style_enum AS ENUM ('coupon','event','storeCard','generic');
```

**Tables (core)**

- `wallet_cert(cert_ref PK, description, is_enhanced, team_id, encrypted_bundle, timestamps, deleted_at)`
- `wallet_apns_key(key_ref PK, team_id, is_active, key_id, encrypted_p8_key, timestamps, deleted_at)`
  - `UNIQUE(team_id, key_id)`

- `wallet_pass_type(pass_type_identifier PK, cert_ref→wallet_cert, timestamps, deleted_at)`
- `wallet_pass( pass_type_identifier, serial_number, authentication_token, ticket_style, poster, etag, timestamps, deleted_at, org_id, PRIMARY KEY(pass_type_identifier, serial_number) )`
  - `INDEX(updated_at)`, `INDEX(authentication_token)`

- `wallet_device(device_library_identifier PK, push_token, timestamps, deleted_at)`
- `wallet_registration( device_library_identifier→wallet_device, pass_type_identifier, serial_number, active, timestamps, deleted_at, org_id, PRIMARY KEY(device_library_identifier, pass_type_identifier, serial_number), FK(pass_type_identifier, serial_number)→wallet_pass ON UPDATE/DELETE CASCADE )`
  - `INDEX(pass_type_identifier, serial_number)`, `INDEX(device_library_identifier, active)`

- `wallet_pass_content( pass_type_identifier, serial_number, data JSONB NOT NULL, timestamps, deleted_at, org_id, PRIMARY KEY(pass_type_identifier, serial_number), FK→wallet_pass ON UPDATE/DELETE CASCADE )`

**Drizzle V2 TS**
Define in `packages/database/schema/wallet.ts` (use your shared helpers):

```ts
import {
  pgTable,
  text,
  boolean,
  pgEnum,
  primaryKey,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { timeStamps } from "../_shared/time-stamps";
import { createdBy } from "../_shared/created-by";

export const walletTicketStyleEnum = pgEnum("wallet_ticket_style_enum", [
  "coupon",
  "event",
  "storeCard",
  "generic",
]);

export const walletCert = pgTable(
  "wallet_cert",
  (t) => ({
    certRef: text("cert_ref").primaryKey(),
    description: text("description"),
    isEnhanced: boolean("is_enhanced").notNull().default(false),
    teamId: text("team_id").notNull(),
    encryptedBundle: text("encrypted_bundle").notNull(),
    ...timeStamps({ softDelete: true }),
  }),
  (t) => ({
    byEnhanced: index("idx_wallet_certs_enhanced").on(t.isEnhanced),
    byTeam: index("idx_wallet_certs_team_id").on(t.teamId),
  })
);

export const walletApnsKey = pgTable(
  "wallet_apns_key",
  (t) => ({
    keyRef: text("key_ref").primaryKey(),
    teamId: text("team_id").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    keyId: text("key_id").notNull(),
    encryptedP8Key: text("encrypted_p8_key").notNull(),
    ...timeStamps({ softDelete: true }),
  }),
  (t) => ({
    teamActive: index("idx_wallet_apns_key_team_active").on(
      t.teamId,
      t.isActive
    ),
    uniqTeamKey: index("uq_wallet_apns_key_team_key")
      .on(t.teamId, t.keyId)
      .unique(),
  })
);

export const walletPassType = pgTable(
  "wallet_pass_type",
  (t) => ({
    passTypeIdentifier: text("pass_type_identifier").primaryKey(),
    certRef: text("cert_ref")
      .notNull()
      .references(() => walletCert.certRef),
    ...timeStamps({ softDelete: true }),
  }),
  (t) => ({
    byCertRef: index("idx_wallet_pass_type_cert_ref").on(t.certRef),
  })
);

export const walletPass = pgTable(
  "wallet_pass",
  (t) => ({
    passTypeIdentifier: text("pass_type_identifier").notNull(),
    serialNumber: text("serial_number").notNull(),
    authenticationToken: text("authentication_token").notNull(),
    ticketStyle: walletTicketStyleEnum("ticket_style"),
    poster: boolean("poster").notNull().default(false),
    etag: text("etag"),
    ...timeStamps({ softDelete: true }),
    ...createdBy(), // org_id, created_by if you have them
  }),
  (t) => ({
    pk: primaryKey({ columns: [t.passTypeIdentifier, t.serialNumber] }),
    byUpdatedAt: index("idx_wallet_pass_updated_at").on(t.updatedAt),
    byAuthToken: index("idx_wallet_pass_auth_token").on(t.authenticationToken),
  })
);

export const walletDevice = pgTable("wallet_device", (t) => ({
  deviceLibraryIdentifier: text("device_library_identifier").primaryKey(),
  pushToken: text("push_token").notNull(),
  ...timeStamps({ softDelete: true }),
}));

export const walletRegistration = pgTable(
  "wallet_registration",
  (t) => ({
    deviceLibraryIdentifier: text("device_library_identifier")
      .notNull()
      .references(() => walletDevice.deviceLibraryIdentifier),
    passTypeIdentifier: text("pass_type_identifier").notNull(),
    serialNumber: text("serial_number").notNull(),
    active: boolean("active").notNull().default(true),
    ...timeStamps({ softDelete: true }),
    ...createdBy(),
  }),
  (t) => ({
    pk: primaryKey({
      columns: [
        t.deviceLibraryIdentifier,
        t.passTypeIdentifier,
        t.serialNumber,
      ],
    }),
    byPassRef: index("idx_wallet_registration_pass_ref").on(
      t.passTypeIdentifier,
      t.serialNumber
    ),
    byDeviceActive: index("idx_wallet_registration_device_active").on(
      t.deviceLibraryIdentifier,
      t.active
    ),
  })
);

export const walletPassContent = pgTable(
  "wallet_pass_content",
  (t) => ({
    passTypeIdentifier: text("pass_type_identifier").notNull(),
    serialNumber: text("serial_number").notNull(),
    data: jsonb("data").notNull(),
    ...timeStamps({ softDelete: true }),
    ...createdBy(),
  }),
  (t) => ({
    pk: primaryKey({ columns: [t.passTypeIdentifier, t.serialNumber] }),
  })
);

// relations
export const walletPassRelations = relations(walletPass, ({ one, many }) => ({
  passType: one(walletPassType, {
    fields: [walletPass.passTypeIdentifier],
    references: [walletPassType.passTypeIdentifier],
  }),
  content: one(walletPassContent, {
    fields: [walletPass.passTypeIdentifier, walletPass.serialNumber],
    references: [
      walletPassContent.passTypeIdentifier,
      walletPassContent.serialNumber,
    ],
  }),
  registrations: many(walletRegistration),
}));

export type WalletPass = typeof walletPass.$inferSelect;
export type NewWalletPass = typeof walletPass.$inferInsert;
// (Repeat for other tables as needed)
```

**drizzle.config.ts** (`packages/database/`)
Use Node 22, Drizzle Kit pointing at `schema/**/*.ts`. Migrations generated here only.

---

## Inngest‑orchestrated updates (race‑free)

**Event**
`pass/update.requested` with `{ passTypeIdentifier, serialNumber, content }`.

**Workflow order**

1. **Write TX**: Upsert content JSON, recompute ETag, bump `updated_at` (seconds precision).
2. **If changed**: Query active registrations.
3. **APNs fan‑out** with bounded concurrency; idempotency key `wallet:${pt}:${sn}:${etag}`.
4. **Handle outcomes** (e.g., 410 → unregister).

**Repo helpers (sync, transactional, small surface)**
All writes go through repo to guarantee ETag & timestamp correctness:

- `upsertPassContentWithEtag(tx, key, data) -> { etag, updatedAt, changed }`
- `updatePassMetadataWithEtag(tx, key, patch) -> { etag, updatedAt, changed }`

**Guardrails**
Add ESLint `no-restricted-imports` to prevent raw updates to `wallet_pass[_content]` outside `src/repo/**`.

> You already saw the code skeleton in the discussion; keep the ETag payload to **only** fields that affect pkpass output (exclude `authentication_token`).

---

## GET path (pure read‑only)

- Middleware **never writes**.
- `ETag: "<wallet_pass.etag>"`, `Last-Modified: wallet_pass.updated_at` (UTC string).
- Precedence: check `If-None-Match` first, `If-Modified-Since` second.
- Transitional fallback (only if needed during bring‑up): if `etag` is null, compute in‑process for comparison **without** persisting.

---

## Honoken app changes (file‑by‑file)

**Remove local schema**

- Delete/retire `apps/honoken/src/db/schema.ts` and local Drizzle config.
- Import `db` & `schema` only from `@database`.

**DB client**

- `apps/honoken/src/db/index.ts`: use shared client or thin wrapper; ensure `schema` exposes `wallet_*`.

**ETag**

- `apps/honoken/src/middleware/pkpass-etag.ts`: strip any store‑etag logic; read‑only headers only.

**Repo**

- `apps/honoken/src/repo/wallet.ts`: add repo helpers above; all write paths use them.

**Pass building**

- `apps/honoken/src/passkit/passkit.ts` (your `current-passkit.ts`):
  - Replace `passes`/`passTypes` with `schema.wallet_pass`/`schema.wallet_pass_type`.
  - Read JSONB: `const content = await db.query.wallet_pass_content.findFirst(...); const raw = content?.data ?? {};`
  - Cert lookup: `wallet_pass_type.cert_ref -> wallet_cert`.
  - Keep NFC & poster logic as you have; certBundle loader unchanged.
  - Assets: use **VercelBlobAssetStorage** (already implemented).
  - **No ETag compute here**.

**APNs**

- `apps/honoken/src/passkit/apnsKeys.ts`, `certs.ts`: swap to wallet tables; keep cache / rotation behavior.
- Concurrency limit in APNs fan‑out (100–200).

**Routes**

- `registerDeviceRoute.ts`, `unregisterDeviceRoute.ts`, `listUpdatedSerialsRoute.ts` → update to wallet tables.
  - `listUpdatedSerials` should use `wallet_pass.updated_at` cutoff.

- Optional dev route: `POST /admin/push/:pt/:sn` (Basic Auth) → look up regs and call APNs (or trigger Inngest).

---

## Vercel Blob (assets)

- Use your `VercelBlobAssetStorage` class with `BLOB_READ_WRITE_TOKEN`.
- Asset keys remain `${passTypeIdentifier}/${serialNumber}/...` and `brand-assets/...`.
- PNG header probing via range requests — keep as implemented.

---

## Packages & config alignment

- **Node 22**: set `"engines": { "node": ">=22 <23" }` in root and apps; `vercel.json` runtime Node 22.
- **Drizzle Kit**: set in `packages/database/drizzle.config.ts`.
- **ESLint**: add restricted import rule; allow in `src/repo/**`.
- **Env**: document `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, APNs/cert secrets, PostHog (optional in dev).

---

## Rollout steps

1. **Add schema**: `packages/database/schema/wallet.ts` (above), export from `schema/index.ts`.
2. **Config**: `packages/database/drizzle.config.ts` → generate migrations (greenfield).
3. **Apply migrations** to Neon (single DB).
4. **Wire Honoken** to shared `database` pkg; remove local schema.
5. **Add repo layer** and **Inngest function** `pass/update.requested` → write‑then‑push.
6. **Make GET pure** (no writes).
7. **Smoke test**: register, list‑updated, GET pass, APNs push.
8. Optional: add a nightly Inngest check for missing/NULL etags (should be no‑op, keeps system self‑healing).

---

## Testing checklist

- **ETag**: 200 → 304 with `If-None-Match`; update content → new ETag & newer Last‑Modified.
- **Race‑free**: Trigger update → ensure APNs push arrives only after ETag commit (workflow order).
- **List‑updated**: respects `updated_at` seconds precision.
- **APNs**: 410 Gone → unregister; 429 Retry‑After respected.
- **Assets**: required icons/logos validated via PNG header checks; correct fallbacks.

---

## Quick diffs / callouts

- **Tokens**: keep `authentication_token` plaintext + `INDEX`. (We still exclude it from ETag.)
- **Content split**: `wallet_pass_content.data JSONB` holds the pass payload; **no** wide JSON on the hot `wallet_pass` table.
- **Inngest**: single workflow: **Step 1 write+etag → Step 2 load regs → Step 3 APNs** (bounded).
- **GET**: no DB mutations.

---

If you want, I can draft the exact **repo helpers**, **Inngest function**, and a patched `passkit.ts` that reads `wallet_pass_content` (swapping your `passes/passTypes` usage to `wallet_*`) and drop them in as ready‑to‑paste modules.

Awesome — here are **ready‑to‑paste modules** that implement the pattern “right”: a tiny **repo layer** (atomic writes + ETag), a **durable Inngest workflow** that does “write → then push”, and a **patched pass builder** that reads `wallet_pass_content` (JSONB) and uses your Vercel Blob storage.

I’ve kept imports/pathing explicit; if your monorepo differs, just adjust the import paths where noted.

---

## 1) Repository: atomic writes + ETag (no GET writes)

**File:** `apps/honoken/src/repo/wallet.ts`

```ts
// apps/honoken/src/repo/wallet.ts
// Tiny write surface for wallet_* tables. Everyone must use this for writes.
// ETag is recomputed on write; GET paths remain pure.

import { and, eq } from "drizzle-orm";
import { schema } from "database/schema"; // ⬅️ shared database package
// If you have a shared DB type, import it; otherwise keep "any".
export type DbClient = any;

/** Round Date.now() to seconds (Apple conditional GET semantics). */
function nowSeconds(): Date {
  const ms = Date.now();
  return new Date(Math.floor(ms / 1000) * 1000);
}

/** Stable stringify: sorts object keys recursively; keeps array order. */
function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_k, v) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(v as Record<string, unknown>).sort()) {
        out[k] = (v as Record<string, unknown>)[k];
      }
      return out;
    }
    return v;
  });
}

/** SHA-256 hex (Node 22 has global WebCrypto). */
async function sha256Hex(input: string | Uint8Array): Promise<string> {
  const data =
    typeof input === "string" ? new TextEncoder().encode(input) : input;
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}

export type PassKey = {
  passTypeIdentifier: string;
  serialNumber: string;
};

type PassMeta = {
  passTypeIdentifier: string;
  serialNumber: string;
  ticketStyle: string | null;
  poster: boolean;
  updatedAt: Date;
};

/** Compose the minimal payload that affects the pkpass output and hash it. */
async function computeEtagFrom(
  meta: PassMeta,
  contentData: unknown
): Promise<string> {
  const payload = {
    pass: {
      passTypeIdentifier: meta.passTypeIdentifier,
      serialNumber: meta.serialNumber,
      ticketStyle: meta.ticketStyle,
      poster: meta.poster,
      // seconds precision; avoid ETag churn from sub-second variance
      updatedAtSec: Math.floor(meta.updatedAt.getTime() / 1000),
    },
    content: contentData ?? null,
  };
  return sha256Hex(stableStringify(payload));
}

/**
 * Upsert JSONB content and recompute ETag.
 * Returns { etag, updatedAt, changed } – where "changed" indicates if content actually changed.
 * IMPORTANT: Throws if the pass does not exist.
 */
export async function upsertPassContentWithEtag(
  db: DbClient,
  key: PassKey,
  incomingData: unknown
): Promise<{ etag: string; updatedAt: Date; changed: boolean }> {
  return db.transaction(async (tx: DbClient) => {
    // Ensure pass exists
    const pass = await tx.query.walletPass.findFirst({
      where: (p: any, { eq, and }: any) =>
        and(
          eq(p.passTypeIdentifier, key.passTypeIdentifier),
          eq(p.serialNumber, key.serialNumber)
        ),
    });
    if (!pass) {
      throw new Error(
        `PASS_NOT_FOUND: ${key.passTypeIdentifier}/${key.serialNumber}`
      );
    }

    const existing = await tx.query.walletPassContent.findFirst({
      where: (c: any, { eq, and }: any) =>
        and(
          eq(c.passTypeIdentifier, key.passTypeIdentifier),
          eq(c.serialNumber, key.serialNumber)
        ),
    });

    const prevJson = existing?.data ?? null;
    const nextJson = incomingData ?? null;
    const changed = stableStringify(prevJson) !== stableStringify(nextJson);

    // If no existing row, must insert. If same content, we still treat as change for first insert.
    if (!existing) {
      await tx
        .insert(schema.walletPassContent)
        .values({ ...key, data: nextJson });
    } else if (changed) {
      await tx
        .update(schema.walletPassContent)
        .set({ data: nextJson, updatedAt: nowSeconds() })
        .where(
          and(
            eq(
              schema.walletPassContent.passTypeIdentifier,
              key.passTypeIdentifier
            ),
            eq(schema.walletPassContent.serialNumber, key.serialNumber)
          )
        );
    }

    if (!changed && pass.etag) {
      // Nothing changed and ETag already exists – return it.
      return { etag: pass.etag, updatedAt: pass.updatedAt, changed };
    }

    // Compose meta with the new updatedAt seconds boundary
    const updatedAt = nowSeconds();
    const meta: PassMeta = {
      passTypeIdentifier: key.passTypeIdentifier,
      serialNumber: key.serialNumber,
      ticketStyle: pass.ticketStyle,
      poster: pass.poster,
      updatedAt,
    };

    const etag = await computeEtagFrom(meta, nextJson);

    // Bump ETag + updatedAt on the hot row only when content changed or initial insert
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

/**
 * Update metadata that affects the pkpass output (e.g., ticketStyle, poster),
 * recompute ETag, and bump updatedAt.
 */
export async function updatePassMetadataWithEtag(
  db: DbClient,
  key: PassKey,
  patch: Partial<Pick<PassMeta, "ticketStyle" | "poster">>
): Promise<{ etag: string; updatedAt: Date; changed: boolean }> {
  return db.transaction(async (tx: DbClient) => {
    // Update metadata fields
    await tx
      .update(schema.walletPass)
      .set(patch)
      .where(
        and(
          eq(schema.walletPass.passTypeIdentifier, key.passTypeIdentifier),
          eq(schema.walletPass.serialNumber, key.serialNumber)
        )
      );

    // Reload pass and content to compute ETag
    const [pass, content] = await Promise.all([
      tx.query.walletPass.findFirst({
        where: (p: any, { eq, and }: any) =>
          and(
            eq(p.passTypeIdentifier, key.passTypeIdentifier),
            eq(p.serialNumber, key.serialNumber)
          ),
      }),
      tx.query.walletPassContent.findFirst({
        where: (c: any, { eq, and }: any) =>
          and(
            eq(c.passTypeIdentifier, key.passTypeIdentifier),
            eq(c.serialNumber, key.serialNumber)
          ),
      }),
    ]);

    if (!pass) {
      throw new Error(
        `PASS_NOT_FOUND: ${key.passTypeIdentifier}/${key.serialNumber}`
      );
    }

    const updatedAt = nowSeconds();
    const meta: PassMeta = {
      passTypeIdentifier: key.passTypeIdentifier,
      serialNumber: key.serialNumber,
      ticketStyle: pass.ticketStyle,
      poster: pass.poster,
      updatedAt,
    };

    const etag = await computeEtagFrom(meta, content?.data ?? null);

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
```

> **Guardrail:** Add an ESLint rule to prevent raw writes to `walletPass`/`walletPassContent` outside this repo (see snippet at the end).

---

## 2) Inngest: write → then push (durable & race‑free)

**Events (types):** `packages/inngest/events.ts`

```ts
// packages/inngest/events.ts
export type PassUpdateRequestedEvent = {
  name: "pass/update.requested";
  data: {
    passTypeIdentifier: string;
    serialNumber: string;
    content: unknown;
  };
};
```

**Function:** `packages/inngest/functions/wallet-pass-update.ts`

```ts
// packages/inngest/functions/wallet-pass-update.ts
// Durable workflow that ensures DB+ETag commit happens BEFORE any APNs notifications.
// Adjust import paths as needed for your repo structure.

import { inngest } from "../client"; // ⬅️ your Inngest client
import { and, eq } from "drizzle-orm";
import { schema } from "database/schema";
import { getDbClient } from "apps/honoken/src/db"; // ⬅️ path to your DB factory
import {
  upsertPassContentWithEtag,
  type PassKey,
} from "apps/honoken/src/repo/wallet";
import { pushToMany } from "apps/honoken/src/passkit/apnsFetch"; // ⬅️ your APNs fan-out helper

export const walletPassUpdate = inngest.createFunction(
  {
    id: "wallet-pass-update",
    // If your Inngest version supports per-key concurrency, enable it (recommended):
    // concurrency: {
    //   limit: 1,
    //   key: (evt) =>
    //     `wallet:${evt.data.passTypeIdentifier}:${evt.data.serialNumber}`,
    // },
  },
  { event: "pass/update.requested" },
  async ({ event, step, logger }) => {
    const { passTypeIdentifier, serialNumber, content } = event.data as {
      passTypeIdentifier: string;
      serialNumber: string;
      content: unknown;
    };

    const key: PassKey = { passTypeIdentifier, serialNumber };
    const db = getDbClient(process.env as any, logger);

    const write = await step.run("write-etag", async () =>
      upsertPassContentWithEtag(db, key, content)
    );

    if (!write.changed) {
      logger.info("No material change; skipping APNs push", {
        passTypeIdentifier,
        serialNumber,
        etag: write.etag,
      });
      return { skipped: true, etag: write.etag };
    }

    // Load active device registrations for this pass
    const regs = await step.run("load-registrations", async () => {
      return db
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
    });

    if (regs.length === 0) {
      logger.info("No active registrations; nothing to push", {
        passTypeIdentifier,
        serialNumber,
      });
      return { pushed: 0, etag: write.etag };
    }

    // Idempotency per (pass, etag) prevents duplicate pushes for identical state
    const pushed = await step.run(
      "apns-push",
      async () => {
        const report = await pushToMany(
          process.env as any,
          regs,
          passTypeIdentifier,
          logger
        );
        return report?.summary?.attempted ?? regs.length;
      },
      {
        idempotencyKey: `wallet:${passTypeIdentifier}:${serialNumber}:${write.etag}`,
      }
    );

    return { pushed, etag: write.etag };
  }
);
```

> If your Inngest flavor exposes per‑key concurrency (recommended), enable the commented `concurrency` block so updates for the same pass never interleave.

---

## 3) Pass builder: reads JSONB `wallet_pass_content`, uses Vercel Blob

**File:** `apps/honoken/src/passkit/passkit.ts`
(Adapted from your `current-passkit.ts`, swapping to `wallet_*` + JSONB content. Notes inline.)

```ts
// apps/honoken/src/passkit/passkit.ts
// Reads wallet_pass + wallet_pass_type + wallet_pass_content (JSONB)
// Uses Vercel Blob for assets, and passkit-generator (preloaded on Vercel)

let LazyPKPass: typeof import("passkit-generator").PKPass | undefined;

if (process.env.VERCEL !== undefined) {
  import("passkit-generator").then(
    (m) => {
      LazyPKPass = m.PKPass;
    },
    (err) => {
      console.warn("Failed to preload passkit-generator:", err?.message);
    }
  );
}

import { Buffer } from "node:buffer";
import { and, eq } from "drizzle-orm";
import { type ZodIssue, z } from "zod/v4";

import { schema } from "database/schema"; // ⬅️ shared database schema
import { getDbClient } from "../db";
import { VercelBlobAssetStorage } from "../storage/vercel-blob-storage";
import type { Env } from "../types";
import type { Logger } from "../utils/logger";
import { type CertBundle, loadCertBundle } from "./certs";
import { PassDataEventTicketSchema } from "../schemas"; // your Zod schema for pass content

// --- asset helpers (unchanged from your version) ---
async function fetchVerifiedPngAsset(
  storage: VercelBlobAssetStorage,
  key: string,
  expectedW: number,
  expectedH: number,
  logger: Logger
): Promise<ArrayBuffer> {
  logger.info(`[fetchVerifiedPngAsset] ${key}`, { expectedW, expectedH });

  const header = await storage.retrieveRange(key, 0, 23);
  if (!header || header.byteLength < 24) {
    throw new Error(`Asset not found or too short: ${key}`);
  }
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < sig.length; i++) {
    if (header[i] !== sig[i]) throw new Error(`Corrupt PNG signature: ${key}`);
  }
  const chunkLength =
    (header[8] << 24) | (header[9] << 16) | (header[10] << 8) | header[11];
  if (chunkLength !== 13) throw new Error(`Invalid IHDR length for ${key}`);
  if (
    !(
      header[12] === 0x49 &&
      header[13] === 0x48 &&
      header[14] === 0x44 &&
      header[15] === 0x52
    )
  ) {
    throw new Error(`Invalid IHDR chunk for ${key}`);
  }
  const dv = new DataView(header.buffer, header.byteOffset + 16, 8);
  const w = dv.getUint32(0);
  const h = dv.getUint32(4);
  if (w !== expectedW || h !== expectedH) {
    throw new Error(
      `Wrong dimensions ${w}×${h} for ${key}, expected ${expectedW}×${expectedH}`
    );
  }

  const buf = await storage.retrieve(key);
  if (!buf) throw new Error(`Asset not found: ${key}`);
  return buf;
}

function createBasePassJson(): any {
  return {
    formatVersion: 1,
    eventTicket: {},
    description: "",
    organizationName: "",
    foregroundColor: "rgb(0, 0, 0)",
    backgroundColor: "rgb(255, 255, 255)",
    labelColor: "rgb(0, 0, 0)",
  };
}

export async function buildPass(
  env: Env,
  passTypeIdentifier: string,
  serialNumber: string,
  logger: Logger
): Promise<ArrayBuffer> {
  const db = getDbClient(env, logger);
  const storage = new VercelBlobAssetStorage(env, logger);

  // 1) Pass row
  logger.info("Fetching pass row", { passTypeIdentifier, serialNumber });
  const passRow = await db.query.walletPass.findFirst({
    where: (p: any, { eq, and }: any) =>
      and(
        eq(p.passTypeIdentifier, passTypeIdentifier),
        eq(p.serialNumber, serialNumber)
      ),
  });
  if (!passRow) throw new Error("PASS_NOT_FOUND");

  // 2) Find pass type => cert
  const passType = await db.query.walletPassType.findFirst({
    where: (pt: any, { eq }: any) =>
      eq(pt.passTypeIdentifier, passTypeIdentifier),
  });
  if (!passType)
    throw new Error(`CONFIG_ERROR: pass type ${passTypeIdentifier} not mapped`);
  const certRef = passType.certRef;

  // 3) Load certificate bundle
  let certBundle: CertBundle;
  try {
    certBundle = await loadCertBundle(certRef, env, logger);
  } catch (err: any) {
    logger.error("CERT_BUNDLE_LOAD_ERROR", err, { certRef });
    throw new Error(`CERT_BUNDLE_LOAD_ERROR: ${err.message}`);
  }

  // 4) Load JSONB content (wallet_pass_content.data)
  const contentRow = await db.query.walletPassContent.findFirst({
    where: (c: any, { eq, and }: any) =>
      and(
        eq(c.passTypeIdentifier, passTypeIdentifier),
        eq(c.serialNumber, serialNumber)
      ),
  });
  const rawPassDataFromDb = (contentRow?.data ?? {}) as unknown;

  // 5) Validate content against your Zod schema
  let validatedPassData: z.infer<typeof PassDataEventTicketSchema>;
  try {
    validatedPassData = PassDataEventTicketSchema.parse(rawPassDataFromDb);
  } catch (e) {
    if (e instanceof z.ZodError) {
      const pretty = e.issues
        .map(
          (iss: ZodIssue) =>
            `${iss.path.join(".") || "passData"}: ${iss.message}`
        )
        .join("; ");
      logger.error("PASS_DATA_VALIDATION_ERROR", { pretty, issues: e.issues });
      throw new Error(`PASS_DATA_VALIDATION_ERROR: ${pretty}`);
    }
    throw e;
  }

  // 6) Build pass.json
  const passJsonContent = createBasePassJson();
  passJsonContent.passTypeIdentifier = passRow.passTypeIdentifier;
  passJsonContent.serialNumber = passRow.serialNumber;
  passJsonContent.authenticationToken = passRow.authenticationToken; // stored tokens (dev choice)
  passJsonContent.teamIdentifier = certBundle.teamId;

  // Transform “loose” fields to eventTicket only if not already structured
  const processed = { ...validatedPassData };

  if (!processed.eventTicket) {
    const primary: any[] = [];
    const secondary: any[] = [];

    if ((processed as any).eventName) {
      primary.push({
        key: "event",
        label: "Event",
        value: (processed as any).eventName,
      });
    }
    if ((processed as any).eventDateISO) {
      primary.push({
        key: "date",
        label: "Date",
        value: (processed as any).eventDateISO,
        dateStyle: "PKDateStyleMedium",
        timeStyle: "PKDateStyleShort",
      });
    }
    if ((processed as any).venueName) {
      primary.push({
        key: "venue",
        label: "Venue",
        value: (processed as any).venueName,
      });
    }

    if ((processed as any).seat) {
      secondary.push({
        key: "seat",
        label: "Seat",
        value: (processed as any).seat,
      });
    }
    if ((processed as any).section) {
      secondary.push({
        key: "section",
        label: "Section",
        value: (processed as any).section,
      });
    }

    if (primary.length === 0) {
      primary.push({
        key: "event",
        label: "Event",
        value: (processed as any).description || "",
      });
    }

    (processed as any).eventTicket = {
      primaryFields: primary,
      ...(secondary.length > 0 ? { secondaryFields: secondary } : {}),
    };

    delete (processed as any).eventName;
    delete (processed as any).eventDateISO;
    delete (processed as any).venueName;
    delete (processed as any).seat;
    delete (processed as any).section;
  }

  Object.assign(passJsonContent, processed);

  // NFC (only when cert is enhanced & data is valid)
  if ((processed as any).nfc) {
    if (certBundle.isEnhanced) {
      const k = (processed as any).nfc.encryptionPublicKey;
      if (!k || String(k).trim() === "") {
        throw new Error(
          "INVALID_NFC_ENCRYPTION_KEY: encryptionPublicKey cannot be empty"
        );
      }
    } else {
      delete (passJsonContent as any).nfc;
    }
  }

  // 7) Collect assets (Vercel Blob)
  const modelFiles: Record<string, Buffer> = {
    "pass.json": Buffer.from(JSON.stringify(passJsonContent)),
  };

  // icon.png (required) with fallbacks
  const iconKey = `${passRow.passTypeIdentifier}/${passRow.serialNumber}/icon.png`;
  try {
    const buf = await fetchVerifiedPngAsset(storage, iconKey, 29, 29, logger);
    modelFiles["icon.png"] = Buffer.from(buf);
  } catch {
    const fallback = `brand-assets/icon.png`;
    const buf = await fetchVerifiedPngAsset(storage, fallback, 29, 29, logger);
    modelFiles["icon.png"] = Buffer.from(buf);
  }

  // icon@2x, icon@3x (optional)
  for (const [suffix, w, h] of [
    ["@2x", 58, 58],
    ["@3x", 87, 87],
  ] as const) {
    const name = `icon${suffix}.png`;
    const key = `${passRow.passTypeIdentifier}/${passRow.serialNumber}/${name}`;
    const fallback = `brand-assets/${name}`;
    try {
      const buf = await fetchVerifiedPngAsset(storage, key, w, h, logger);
      modelFiles[name] = Buffer.from(buf);
    } catch {
      try {
        const buf = await fetchVerifiedPngAsset(
          storage,
          fallback,
          w,
          h,
          logger
        );
        modelFiles[name] = Buffer.from(buf);
      } catch {
        // optional; ignore
      }
    }
  }

  // logo.png (required) + logo@2x (optional)
  const logoKey = `${passRow.passTypeIdentifier}/${passRow.serialNumber}/logo.png`;
  const logo2xKey = `${passRow.passTypeIdentifier}/${passRow.serialNumber}/logo@2x.png`;
  {
    const buf = await fetchVerifiedPngAsset(storage, logoKey, 160, 50, logger);
    modelFiles["logo.png"] = Buffer.from(buf);
  }
  try {
    const buf = await fetchVerifiedPngAsset(
      storage,
      logo2xKey,
      320,
      100,
      logger
    );
    modelFiles["logo@2x.png"] = Buffer.from(buf);
  } catch {
    // optional
  }

  // Poster background (optional; only for poster & enhanced cert)
  if (passRow.poster && certBundle.isEnhanced) {
    const bg2x = `${passRow.passTypeIdentifier}/${passRow.serialNumber}/background@2x.png`;
    try {
      const buf = await fetchVerifiedPngAsset(
        storage,
        bg2x,
        180 * 2,
        220 * 2,
        logger
      );
      modelFiles["background@2x.png"] = Buffer.from(buf);
    } catch {
      // optional; ignore
    }
  }

  // 8) Build pkpass
  if (!LazyPKPass) {
    const mod = await import("passkit-generator");
    LazyPKPass = mod.PKPass;
  }
  const pass = new LazyPKPass(modelFiles, {
    wwdr: certBundle.wwdr,
    signerCert: certBundle.signerCert,
    signerKey: certBundle.signerKey,
    signerKeyPassphrase: certBundle.signerKeyPassphrase,
  });

  const pkpass: Uint8Array | ArrayBuffer = await pass.getAsBuffer();
  if (pkpass instanceof ArrayBuffer) return pkpass;
  if (pkpass instanceof Uint8Array)
    return pkpass.buffer.slice(
      pkpass.byteOffset,
      pkpass.byteOffset + pkpass.byteLength
    );
  throw new Error("UNEXPECTED_BUFFER_TYPE from passkit-generator");
}
```

> **Note:** This builder never computes or writes ETags. It simply reads `wallet_pass`, `wallet_pass_type`, and `wallet_pass_content.data` and builds the pass.

---

## 4) (Recommended) Read‑only Conditional GET middleware

**File:** `apps/honoken/src/middleware/pkpass-etag.ts`

```ts
// apps/honoken/src/middleware/pkpass-etag.ts
// Pure read-only ETag/Last-Modified handling. No writes here.

import { and, eq } from "drizzle-orm";
import { schema } from "database/schema";
import { getDbClient } from "../db";
import type { Env } from "../types";
import type { MiddlewareHandler } from "hono";

export function pkpassEtag(env: Env): MiddlewareHandler {
  return async (c, next) => {
    const passTypeIdentifier = c.req.param("passTypeIdentifier");
    const serialNumber = c.req.param("serialNumber");

    const db = getDbClient(env, c.get("logger"));
    const pass = await db.query.walletPass.findFirst({
      where: (p: any, { eq, and }: any) =>
        and(
          eq(p.passTypeIdentifier, passTypeIdentifier),
          eq(p.serialNumber, serialNumber)
        ),
    });
    if (!pass || !pass.etag) {
      // If missing (should be rare after backfill), just fall through and let handler send 200.
      return next();
    }

    const etag = `"${pass.etag}"`; // quoted (strong ETag)
    const lastMod = new Date(
      Math.floor(pass.updatedAt.getTime() / 1000) * 1000
    ).toUTCString();

    c.header("ETag", etag);
    c.header("Last-Modified", lastMod);
    c.header("Cache-Control", "private, max-age=0, must-revalidate");

    const inm = c.req.header("if-none-match");
    if (inm && inm.replace(/^W\//, "") === etag) {
      return c.body(null, 304);
    }

    const ims = c.req.header("if-modified-since");
    if (ims) {
      const imsDate = new Date(ims);
      if (!Number.isNaN(imsDate.valueOf()) && pass.updatedAt <= imsDate) {
        return c.body(null, 304);
      }
    }

    return next();
  };
}
```

---

## 5) (Recommended) ESLint guardrail to block raw writes

**Snippet:** `apps/honoken/.eslintrc.json` (merge into your config)

```jsonc
{
  "overrides": [
    {
      "files": ["src/**/*.ts"],
      "rules": {
        "no-restricted-imports": [
          "error",
          {
            "paths": [
              {
                "name": "database/schema",
                "importNames": ["walletPass", "walletPassContent"],
                "message": "Do not write walletPass/walletPassContent directly; use src/repo/wallet.ts",
              },
            ],
          },
        ],
      },
    },
    {
      "files": ["src/repo/**/*.ts"],
      "rules": {
        "no-restricted-imports": "off",
      },
    },
  ],
}
```

---

## 6) How to use it (one simple flow)

- **Update content (any source):** emit an event:

```ts
// anywhere in your app (admin API, back-office, job, etc.)
await inngest.send({
  name: "pass/update.requested",
  data: {
    passTypeIdentifier: "pass.com.example.event",
    serialNumber: "ABC-123",
    content: {
      /* your validated JSON payload */
    },
  },
});
```

- The **Inngest function** will:
  1. upsert JSONB → compute ETag → bump `updated_at` (TX),
  2. read active registrations,
  3. APNs fan‑out (idempotent on `(pass, etag)`).

- **GET /v1/passes/\:pt/\:sn**:
  Your route pipeline should be:

```
validate params → apple auth middleware → pkpassEtag(env) → handler(buildPass)
```

If the device presents the old ETag, it receives `304`. After an update, the stored ETag has changed, so the device receives `200` with a freshly signed `.pkpass`.

---

## Notes you won’t have to rediscover later

- **Stored tokens** are kept (`wallet_pass.authentication_token`), and **excluded from ETag** so token policy changes won’t churn device caches.
- **`updated_at` seconds precision** is enforced in the repo so your `If-Modified-Since` comparisons behave exactly as intended.
- **Content split** (`wallet_pass_content.data`) keeps the hot table small and cache‑friendly; JSONB churn stays off the hot path.
- **No writes in GET** makes your read path predictable and cheap.
- **Idempotency** in APNs push step (per `(pass, etag)`) prevents duplicate pushes for identical state.

---

If you want, I can also drop in a **one‑time backfill Inngest function** that computes and stores `etag` for any legacy rows (should be empty for greenfield), plus a **nightly self‑heal** that recomputes if `etag IS NULL`.
