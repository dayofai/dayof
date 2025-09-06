# DB Consolidation Plan: Honoken → Shared Monorepo Database (Drizzle V2)

- **Scope**: Consolidate Honoken’s local schema into the monorepo database package, standardize naming, add `wallet_*` tables including `wallet_pass_content`, move to ETag-on-write, and switch Honoken to consume `@database` exports.
- **Outcome**: One Neon Postgres database and a single monorepo-wide DB package, Drizzle V2-compatible, future-proofed for Wallet (PassKit and beyond).

---

## Decisions (from discussion)

- **Prefix**: Use `wallet_` for table names (e.g., `wallet_pass`, `wallet_registration`).
- **Pass content**: Separate table `wallet_pass_content` (one-to-one with `wallet_pass`), JSONB payload; no versioning/history initially.
- **Tenancy**: `wallet_cert`, `wallet_apns_key`, `wallet_pass_type` remain independent (no `org_id`) for now.
- **Soft delete**: Use shared `timeStamps({ softDelete: true })` where appropriate; continue `active` boolean for registrations and leave note about future soft-delete.
- **ETag**: Compute on write (create/update of pass or content), store in `wallet_pass.etag`. GET path reads only; middleware should not write.
- **Auth token**: Retain plaintext token for now to match current code paths; plan a follow-up to hash tokens later.
- **Logs**: PostHog only; no DB table for `/v1/log` at this time.
- **APNs dev trigger**: Provide a minimal authenticated endpoint to enqueue/send dev pushes; production orchestration via Inngest.

---

## High-level Overview

1. Add a new `packages/database/schema/wallet.ts` module that defines:
   - `wallet_ticket_style_enum`
   - `wallet_cert`, `wallet_apns_key`, `wallet_pass_type`
   - `wallet_pass` (composite PK), `wallet_device`, `wallet_registration`
   - `wallet_pass_content` (composite PK and FK to `wallet_pass`)
   - Drizzle relations for joins where useful
2. Export wallet schema from `packages/database/schema/index.ts` and include in the shared `schema` object.
3. Generate and apply migrations from the shared database package (Drizzle V2), targeting Neon.
4. Update Honoken to import `db` and `schema` from `database` package and replace local schema imports/usages.
5. Implement ETag-on-write helpers and refactor middleware to read-only behavior.
6. Optionally add an admin dev endpoint to trigger APNs for a pass.
7. Clean up Honoken’s local schema and drizzle config linkage.

---

## Files to be Added / Modified

- Add: `packages/database/schema/wallet.ts`
- Modify: `packages/database/schema/index.ts` (export and compose wallet tables)
- Modify: `packages/database/db/index.ts` (schema already passed in; ensure wallet tables available via `schema`)
- Add (if not present): `packages/database/drizzle.config.ts` pointing at `packages/database/schema/**/*.ts` for migration generation.
- Modify Honoken imports and references:
  - `apps/honoken/src/db/index.ts` (switch to shared db client or wrapper over it)
  - `apps/honoken/src/db/schema.ts` (deprecate/remove, migrate references)
  - `apps/honoken/src/db/etag.ts` (reuse compute only; move writes to write paths)
  - `apps/honoken/src/middleware/pkpass-etag.ts` (read-only ETag/Last-Modified logic)
  - `apps/honoken/src/storage.ts` (table references, joins, verify logic)
  - `apps/honoken/src/passkit/passkit.ts` (selects/joins to pass type/cert, assets)
  - `apps/honoken/src/passkit/apnsKeys.ts`, `apps/honoken/src/passkit/certs.ts` (table name changes)
  - `apps/honoken/src/routes/*` that query tables
  - `apps/honoken/drizzle.config.ts` (stop referencing local schema file)
  - Tests referencing schema/queries as needed

---

## Detailed Plan

### 1) Create shared wallet schema (packages/database)

File: `packages/database/schema/wallet.ts`

- Define `wallet_ticket_style_enum = pgEnum('wallet_ticket_style_enum', ['coupon', 'event', 'storeCard', 'generic'])`.
- `wallet_cert` (maps from existing `certs`):
  - Columns: `certRef` (pk), `description`, `isEnhanced` (default false, not null), `teamId` (not null), `encryptedBundle` (not null), `iv` (text; placeholder for legacy), timestamps via `timeStamps({ softDelete: true })`.
  - Index: `idx_wallet_certs_enhanced` on `isEnhanced`; add `idx_wallet_certs_team_id` on `teamId`.
- `wallet_apns_key` (from `apns_keys`):
  - Columns: `keyRef` (pk), `teamId` (not null), `isActive` (default true, not null), `keyId` (not null), `encryptedP8Key` (not null), `iv` (text), timestamps via `timeStamps({ softDelete: true })`.
  - Index: `idx_wallet_apns_key_team_active` on `(teamId, isActive)`.
  - Unique: `(teamId, keyId)` to prevent duplicates.
- `wallet_pass_type` (from `pass_types`):
  - Columns: `passTypeIdentifier` (pk), `certRef` (fk → `wallet_cert.certRef`), timestamps via `timeStamps({ softDelete: true })`.
  - Index: `idx_wallet_pass_type_cert_ref` on `certRef`.
- `wallet_pass` (from `passes`), composite pk `(passTypeIdentifier, serialNumber)`:
  - Columns: `authenticationToken` (plaintext for now; follow-up to hash), `ticketStyle` (enum), `poster` (bool default false), `etag` (text), timestamps via `timeStamps({ softDelete: true })`.
  - Index: `idx_wallet_pass_updated_at` on `updated_at`.
- `wallet_device` (from `devices`):
  - Columns: `deviceLibraryIdentifier` (pk), `pushToken` (not null), timestamps via `timeStamps({ softDelete: true })`.
- `wallet_registration` (from `registrations`):
  - Composite pk `(deviceLibraryIdentifier, passTypeIdentifier, serialNumber)`
  - Columns: `active` (default true), timestamps via `timeStamps({ softDelete: true })`.
  - FKs: `(passTypeIdentifier, serialNumber)` → `wallet_pass` on update/delete cascade; `deviceLibraryIdentifier` → `wallet_device`.
  - Index: `idx_wallet_registration_pass_ref` on `(passTypeIdentifier, serialNumber)`, `idx_wallet_registration_device_active` on `(deviceLibraryIdentifier, active)`.
- `wallet_pass_content` (new):
  - Composite pk `(passTypeIdentifier, serialNumber)` and fk to `wallet_pass` with cascade delete.
  - Column: `data` JSONB (typed with `$type<PassDataEventTicket>` if desired), timestamps via `timeStamps({ softDelete: true })`.
- Add Drizzle `relations()` where useful for read convenience (e.g., pass → pass_type, pass → pass_content, registration → device/pass).

File: `packages/database/schema/index.ts`

- Export wallet tables and enum.
- Add them to the `schema` object so `import { schema } from 'database/schema'` exposes them to all apps.

No code changes needed in: `packages/database/db/index.ts` (already builds with `schema`).

Secondary effects considered:

- Index names/length: `wallet_*` keeps names concise.
- Enum name conflicts: new enum name `wallet_ticket_style_enum` avoids collision with `ticket_style_enum` if present elsewhere.

### 2) Switch Honoken to shared schema

File: `apps/honoken/src/db/index.ts`

- Replace local `tablesOnlySchemaConst` with imports from `database` package:
  - Import `db` and `schema` from `database/db` and `database/schema` as needed, or re-export a thin wrapper if Honoken needs its own logger injection/resilience wrapper.
  - Preferred: remove Neon client duplication and directly use `database/db` for a single client, or keep wrapper but source `schema` from `database`.
- Ensure type consistency across consumers.

File: `apps/honoken/src/db/schema.ts`

- Deprecate/remove usage. Migrate all imports that reference `./schema` to `database/schema` tables:
  - `certs` → `wallet_cert`
  - `apnsKeys` → `wallet_apns_key`
  - `passTypes` → `wallet_pass_type`
  - `passes` → `wallet_pass`
  - `devices` → `wallet_device`
  - `registrations` → `wallet_registration`
  - Enum `ticketStyleEnum` → `wallet_ticket_style_enum`

File: `apps/honoken/drizzle.config.ts`

- Stop pointing at local `./src/db/schema.ts` for migration generation. For Honoken, we won’t generate migrations locally anymore (shared pkg owns schema/migrations). Optionally delete this file or leave with a comment indicating migrations are managed by the shared package.

Tests & build config: verify nothing relies on local schema paths.

### 3) Update all Honoken code references

File: `apps/honoken/src/passkit/apnsKeys.ts`

- Replace imports of `apnsKeys` with `schema.wallet_apns_key` and adjust property names (`keyRef`, `teamId`, `keyId`, `encryptedP8Key`, `updatedAt`).
- Validation and cache invalidation logic remains the same.

File: `apps/honoken/src/passkit/certs.ts`

- Replace imports of `certs` with `schema.wallet_cert`.
- Preserve request coalescing and timestamp validation.

File: `apps/honoken/src/passkit/passkit.ts`

- Replace `passes`/`passTypes` with `schema.wallet_pass`/`schema.wallet_pass_type`.
- JOIN stays the same conceptually. No schema change needed for assets logic.

File: `apps/honoken/src/storage.ts`

- Replace `passes`, `devices`, `registrations` with `schema.wallet_pass`, `schema.wallet_device`, `schema.wallet_registration`.
- `verifyToken`, `registerDevice`, `unregisterDevice`, `listUpdatedSerials` keep semantics; update table names and columns accordingly.
- Note: we’re keeping plaintext `authenticationToken` for now (follow-up: hash).

File: `apps/honoken/src/middleware/pkpass-etag.ts`

- Keep read-only conditional GET logic.
- Internally, change query to fetch `wallet_pass` and LEFT JOIN `wallet_pass_content` to obtain content timestamps for Last-Modified. Do not write ETag here.

File: `apps/honoken/src/db/etag.ts`

- Keep `computeEtag` pure function to hash the stable representation of pass + content.
- Remove or deprecate `ensureStoredEtag` (no writes from GET). Add write-path helpers described below.

File: `apps/honoken/src/routes/*`

- `getPassFileRoute.ts`: No change besides ensuring middleware sets headers; generation remains.
- `registerDeviceRoute.ts`, `unregisterDeviceRoute.ts`, `listUpdatedSerialsRoute.ts`: keep logic, ensure table names updated via `storage.ts`.

File: `apps/honoken/src/middleware/index.ts`, `apps/honoken/src/middleware/auth.ts`

- Ensure storage imports are intact and schema references resolved via `storage.ts` mapping.

### 4) Implement ETag-on-write helpers

New helpers (can live in `apps/honoken/src/db/etag.ts` or `apps/honoken/src/storage.ts`):

- `computeEtag({ pass, content })`: keep existing function as-is.
- `updatePassEtagOnPassUpdate(tx, keys, passUpdates)`:
  - Apply pass updates inside transaction.
  - Read current content row (`wallet_pass_content`).
  - Compute ETag and update `wallet_pass.etag`.
- `upsertPassContentWithEtag(tx, keys, data)`:
  - Upsert `wallet_pass_content` with `data`.
  - Read current pass row.
  - Compute ETag and update `wallet_pass.etag`.
- Wire these helpers wherever pass metadata or content are written (initial creation or updates). For now, Honoken doesn’t expose public write APIs beyond registration; when you add admin/content update endpoints or background jobs, use these helpers.

Secondary effects considered:

- Transactions prevent race conditions and ensure ETag reflects persisted state.
- Middleware remains read-only; no fire-and-forget writes on GET.

### 5) Add optional dev-only admin endpoint for APNs

File: `apps/honoken/src/routes/admin.ts`

- Add a route (behind Basic Auth) e.g., `POST /admin/push/:passTypeIdentifier/:serialNumber`:
  - Look up active device registrations for that pass.
  - Call `pushToMany` (existing APNs code) with small batch.
  - Return a simple summary for development.
- Guard in production if not desired.

### 6) Clean up local schema & config

- Remove or archive `apps/honoken/src/db/schema.ts`.
- Consider removing `apps/honoken/drizzle.config.ts` or add a comment indicating shared package manages migrations.
- Ensure `apps/honoken/package.json` retains `database` workspace dep and no local schema/migration scripts remain.

---

## Secondary Effects & Compatibility Notes

- Enum rename (`ticket_style_enum` → `wallet_ticket_style_enum`) requires regenerating SQL in shared DB package; no runtime code references enums directly in Honoken.
- Indexes are preserved with wallet\_\* naming to keep `listUpdatedSerials` performant.
- APNs key selection query in `apnsFetch.ts` continues to inner join `wallet_pass_type` → `wallet_cert` → `wallet_apns_key` with `isActive = true`.
- README references need a small tweak: `passes` → `wallet_pass`, plus note that dynamic content resides in `wallet_pass_content`.
- Notes about soft delete for devices/registrations left as comments for future policy decisions.

---

## Rollout Steps

1. Implement Drizzle V2 schema in `packages/database/schema/wallet.ts`; export from `packages/database/schema/index.ts`.
2. Add `packages/database/drizzle.config.ts` (if missing). Generate migrations in the shared package and apply to Neon.
3. Update Honoken imports to use shared `database` package schema and client; remove local schema usage.
4. Refactor `pkpass-etag` to read-only; add write helpers for ETag.
5. Smoke test endpoints (`/v1/*`), especially conditional GET paths and registration flows.
6. Add dev push endpoint if desired; verify APNs fetch path works with wallet tables.
7. Remove deprecated files (`apps/honoken/src/db/schema.ts`) and update docs/README to reflect `wallet_pass_content`.

---

## References to Updated Files

- `packages/database/schema/index.ts` (compose wallet tables into `schema`)
- `packages/database/schema/wallet.ts` (new)
- `packages/database/db/index.ts` (no code changes required, but relies on `schema` containing wallet tables)
- `apps/honoken/src/db/index.ts` (use shared `database` client/schema)
- `apps/honoken/src/db/schema.ts` (remove/migrate references)
- `apps/honoken/src/db/etag.ts` (keep compute; move writes to write paths)
- `apps/honoken/src/middleware/pkpass-etag.ts` (read-only; JOIN content)
- `apps/honoken/src/passkit/apnsKeys.ts` (wallet tables)
- `apps/honoken/src/passkit/certs.ts` (wallet tables)
- `apps/honoken/src/passkit/passkit.ts` (wallet tables for pass/pass_type/cert)
- `apps/honoken/src/storage.ts` (wallet tables for verify/register/list)
- `apps/honoken/src/routes/*` (ensure imports/behavior intact; dev push endpoint addition in `admin.ts`)
- `apps/honoken/drizzle.config.ts` (deprecate local schema reference)

---

## Incorporating GPT‑5 Pro Review: Adjustments, Simplifications, and Snippets

This section refines the plan with pragmatic changes and concrete code/SQL based on the review. It focuses on correctness, performance, and a frictionless rollout.

### A) Greenfield mode simplifications

- IV columns: Since ciphertext is versioned as `version:iv:ciphertext`, we can drop legacy `iv` columns entirely in `wallet_cert` and `wallet_apns_key` (no need to keep them nullable in greenfield).
- Soft delete: Defer soft delete for `wallet_*` tables to avoid accidental omissions in filters. Keep only `created_at` / `updated_at`. We can add soft delete later with clear query conventions.
- Enum reuse vs rename: For greenfield creation, define `wallet_ticket_style_enum` directly and use it in `wallet_pass.ticket_style`.

Clarifying note: If you later share DB with legacy tables, consider the rename path below instead of fresh creates.

### B) Schema DDL — greenfield create with Drizzle V2 (recommended here)

Minimal SQL to create fresh `wallet_*` tables (no data migration required):

```sql
-- Enum
CREATE TYPE wallet_ticket_style_enum AS ENUM ('coupon', 'event', 'storeCard', 'generic');

-- Core tables
CREATE TABLE wallet_cert (
  cert_ref TEXT PRIMARY KEY,
  description TEXT,
  is_enhanced BOOLEAN NOT NULL DEFAULT false,
  team_id TEXT NOT NULL,
  encrypted_bundle TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_wallet_certs_enhanced ON wallet_cert (is_enhanced);
CREATE INDEX idx_wallet_certs_team_id ON wallet_cert (team_id);

CREATE TABLE wallet_apns_key (
  key_ref TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  key_id TEXT NOT NULL,
  encrypted_p8_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_wallet_apns_key_team_active ON wallet_apns_key (team_id, is_active);
CREATE UNIQUE INDEX uq_wallet_apns_key_team_key ON wallet_apns_key (team_id, key_id);

CREATE TABLE wallet_pass_type (
  pass_type_identifier TEXT PRIMARY KEY,
  cert_ref TEXT NOT NULL REFERENCES wallet_cert(cert_ref),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_wallet_pass_type_cert_ref ON wallet_pass_type (cert_ref);

CREATE TABLE wallet_pass (
  pass_type_identifier TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  authentication_token TEXT NOT NULL,
  ticket_style wallet_ticket_style_enum,
  poster BOOLEAN NOT NULL DEFAULT false,
  etag TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (pass_type_identifier, serial_number),
  CONSTRAINT wallet_pass_type_fk FOREIGN KEY (pass_type_identifier)
    REFERENCES wallet_pass_type(pass_type_identifier)
    ON UPDATE RESTRICT
);
CREATE INDEX idx_wallet_pass_updated_at ON wallet_pass (updated_at);

CREATE TABLE wallet_device (
  device_library_identifier TEXT PRIMARY KEY,
  push_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE wallet_registration (
  device_library_identifier TEXT NOT NULL REFERENCES wallet_device(device_library_identifier),
  pass_type_identifier TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (device_library_identifier, pass_type_identifier, serial_number),
  CONSTRAINT wallet_registration_pass_fk FOREIGN KEY (pass_type_identifier, serial_number)
    REFERENCES wallet_pass(pass_type_identifier, serial_number)
    ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX idx_wallet_registration_pass_ref
  ON wallet_registration (pass_type_identifier, serial_number);
CREATE INDEX idx_wallet_registration_device_active
  ON wallet_registration (device_library_identifier, active);

CREATE TABLE wallet_pass_content (
  pass_type_identifier TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (pass_type_identifier, serial_number),
  CONSTRAINT wallet_pass_content_fk FOREIGN KEY (pass_type_identifier, serial_number)
    REFERENCES wallet_pass(pass_type_identifier, serial_number)
    ON UPDATE CASCADE ON DELETE CASCADE
);
```

Drizzle V2 tables should mirror this structure and indexes.

Drizzle V2 config for the shared database package (example):

```ts
// packages/database/drizzle.config.ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./schema/**/*.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Use a dev branch URL for generation; prod/preview is managed by Neon/Vercel integration
    url: process.env.DEV_DATABASE_URL!,
  },
} satisfies Config;
```

Migration commands (from `packages/database`):

```bash
cd packages/database
DEV_DATABASE_URL=postgresql://... npx drizzle-kit generate
# Apply via Neon Console or preferred SQL client.
```

Drizzle V2 table example (TypeScript) for `wallet_pass` and `wallet_pass_content`:

```ts
// packages/database/schema/wallet.ts
import {
  pgTable,
  text,
  boolean,
  timestamp,
  pgEnum,
  primaryKey,
  index,
  jsonb,
} from "drizzle-orm/pg-core";

export const walletTicketStyleEnum = pgEnum("wallet_ticket_style_enum", [
  "coupon",
  "event",
  "storeCard",
  "generic",
]);

export const walletPass = pgTable(
  "wallet_pass",
  (t) => ({
    passTypeIdentifier: t.text("pass_type_identifier").notNull(),
    serialNumber: t.text("serial_number").notNull(),
    authenticationToken: t.text("authentication_token").notNull(),
    ticketStyle: walletTicketStyleEnum("ticket_style"),
    poster: t.boolean("poster").notNull().default(false),
    etag: t.text("etag"),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  }),
  (table) => ({
    pk: primaryKey({ columns: [table.passTypeIdentifier, table.serialNumber] }),
    updatedIdx: index("idx_wallet_pass_updated_at").on(table.updatedAt),
  })
);

export const walletPassContent = pgTable(
  "wallet_pass_content",
  (t) => ({
    passTypeIdentifier: t.text("pass_type_identifier").notNull(),
    serialNumber: t.text("serial_number").notNull(),
    data: jsonb("data").notNull(),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  }),
  (table) => ({
    pk: primaryKey({ columns: [table.passTypeIdentifier, table.serialNumber] }),
    // Add FK using a separate constraint here or via SQL migration if needed
  })
);
```

### C) Alternative: rename path (for future reference — NOT applicable in greenfield)

If you’re not greenfield in a future phase, you can rename in place and add the new content table. This is documented here for completeness but not part of the current implementation.

```sql
ALTER TABLE certs          RENAME TO wallet_cert;
ALTER TABLE apns_keys      RENAME TO wallet_apns_key;
ALTER TABLE pass_types     RENAME TO wallet_pass_type;
ALTER TABLE passes         RENAME TO wallet_pass;
ALTER TABLE devices        RENAME TO wallet_device;
ALTER TABLE registrations  RENAME TO wallet_registration;

-- Make legacy iv nullable if present
ALTER TABLE wallet_cert ALTER COLUMN iv DROP NOT NULL;
ALTER TABLE wallet_apns_key ALTER COLUMN iv DROP NOT NULL;

-- Create wallet_pass_content as above
```

If you also want to rename the enum, perform a safe cast from the old type to the new one as noted in the review.

### D) ETag strategy — write-time with read-only GET

Keep GET cheap and pure; compute and persist ETags only on writes.

Key rules:

- On any pass content upsert/update: update `wallet_pass_content.data`, then recompute ETag and bump `wallet_pass.updated_at` within the SAME transaction.
- On any pass metadata change: update fields, then recompute ETag and set `wallet_pass.updated_at = now()` within the SAME transaction.
- Transitional fallback: if `wallet_pass.etag` is NULL (legacy/older rows), compute ETag on the fly in GET but do not persist.
- Last-Modified: use only `wallet_pass.updated_at` (we bump it for content changes), so middleware doesn’t need a join.

Example write helper (TypeScript):

```ts
// keys = { passTypeIdentifier, serialNumber }
export async function upsertPassContentWithEtag(
  tx: DbClient,
  keys: { passTypeIdentifier: string; serialNumber: string },
  data: unknown
) {
  await tx
    .insert(schema.wallet_pass_content)
    .values({ ...keys, data })
    .onConflictDoUpdate({
      target: [
        schema.wallet_pass_content.passTypeIdentifier,
        schema.wallet_pass_content.serialNumber,
      ],
      set: { data, updatedAt: new Date() },
    });

  const pass = await tx.query.wallet_pass.findFirst({
    where: (p, { eq, and }) =>
      and(
        eq(p.passTypeIdentifier, keys.passTypeIdentifier),
        eq(p.serialNumber, keys.serialNumber)
      ),
  });

  const etag = await computeEtag({
    serialNumber: keys.serialNumber,
    passTypeIdentifier: keys.passTypeIdentifier,
    authenticationToken: pass!.authenticationToken,
    ticketStyle: pass!.ticketStyle,
    poster: pass!.poster,
    updatedAt: pass!.updatedAt,
    passContent: { data },
  });

  await tx
    .update(schema.wallet_pass)
    .set({ etag, updatedAt: new Date() })
    .where((p, { eq, and }) =>
      and(
        eq(p.passTypeIdentifier, keys.passTypeIdentifier),
        eq(p.serialNumber, keys.serialNumber)
      )
    );
}
```

Middleware changes (`pkpass-etag`):

- Remove writes; only read `wallet_pass`.
- If `etag` is null, compute one-time ETag from `wallet_pass` (and optionally loaded content) for header comparison only.
- Set `ETag`, `Last-Modified` (from `wallet_pass.updated_at`), and `Cache-Control` consistently.
- Validate params before auth and before ETag to short-circuit fast.

Example ordering in route:

```ts
v1.get(
  "/passes/:passTypeIdentifier/:serialNumber",
  zValidator("param", PassIdParamsSchema, formatZodError),
  applePassAuthMiddleware,
  pkpassEtagMiddleware,
  handleGetPassFile
);
```

### E) Certs/APNs storage & caching refinements

1. DB ping on every cache hit: add a per-entry `lastCheckedAt` and a min recheck interval (e.g., 30–60s). Keep admin invalidation endpoints for instant bust.

```ts
const MIN_RECHECK_MS = 60_000; // 60s

if (cache.has(key)) {
  const cached = cache.get(key)!;
  const now = Date.now();
  if (now - cached.lastCheckedAt < MIN_RECHECK_MS) {
    return cached.data;
  }
  // else: perform lightweight updatedAt check, update lastCheckedAt
}
```

2. AES key length policy: enforce 32‑byte keys consistently.

```ts
const keyBytes = base64ToArrayBuffer(base64Key);
if (keyBytes.byteLength !== 32) {
  throw new Error(
    `Invalid key length ${keyBytes.byteLength} bytes; require 32 bytes (AES‑256).`
  );
}
```

3. Zod version alignment:

- Either upgrade to Zod v4 across the app (and ensure `@hono/zod-validator` supports it), or
- Revert imports to `import { z } from 'zod'` and avoid v4-only helpers like `z.prettifyError`.

### F) APNs sending — concurrency & Retry‑After

Limit macro parallelism to avoid socket stampedes. Two options:

Option 1: tiny dependency (`p-limit`)

```ts
import pLimit from "p-limit";
const limit = pLimit(100);
const outcomes = await Promise.all(
  regs.map((d) => limit(() => sendWithRetry(d, ctx)))
);
```

Option 2: minimal local limiter

```ts
async function mapLimited<T, R>(
  items: T[],
  limit: number,
  fn: (t: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let i = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return results;
}
// usage
const outcomes = await mapLimited(regs, 100, (d) => sendWithRetry(d, ctx));
```

Retry‑After parsing fallback:

```ts
if (status === 429 && retryAfter) {
  const secs = parseInt(retryAfter, 10);
  if (!Number.isNaN(secs)) err.retryAfterMs = secs * 1000;
  else {
    const dateMs = Date.parse(retryAfter);
    if (!Number.isNaN(dateMs))
      err.retryAfterMs = Math.max(0, dateMs - Date.now());
  }
}
```

### G) Config and env hygiene

- Vercel rewrites: remove any `/api` rewrite that collapses `/api/*` to `/api`. Vercel routes `/api/*` to `api/index.ts` automatically.
- Node version: align `package.json` engines and `vercel.json` runtime (e.g., Node 22 both places if desired).
- Drizzle config: align on `DEV_DATABASE_URL` for local migrations in the shared DB package. Honoken should not run migrations against its own local schema file.
- PostHog optionality: allow missing API key in dev; don’t block startup. Warn instead.

### H) README/documentation tweaks

- Reflect that dynamic content lives in `wallet_pass_content` (not a `passData` column on `wallet_pass`).
- Mention ETag-on-write and that GET is read-only.

### I) Minimal test checklist

1. ETag/Last‑Modified
   - First GET with no DB `etag` returns 200 with computed ETag and Last-Modified.
   - GET with `If-None-Match` returns 304 with same headers.
   - Content update → new ETag and newer Last-Modified.

2. List-updated-serials
   - Before content update: serial appears; after: excluded when timestamp advances.

3. Cert/APNs cache
   - Rotate cert/key via admin → next operations pick up new material without restart.

4. APNs concurrency behavior
   - 2k devices push does not explode sockets; outcomes sane.

5. Config sanity
   - No `/api` rewrite issues; Node version aligned; Zod version consistent.

---

## Open Clarifying Questions

1. Zod version: prefer upgrading the monorepo to Zod v4 now, or keep v3 and remove v4-only APIs?
2. Soft delete: okay to defer soft delete on `wallet_*` tables for now (keeping only created/updated timestamps)?
3. APNs limiter: fine to add `p-limit` as a tiny dependency, or should we use a local helper?
4. Dev push endpoint: should it enqueue (Inngest) or call APNs directly for development convenience?
5. PostHog policy: make it optional in dev (warn only) and required in prod, or optional everywhere?
6. Drizzle migrations: confirm that the shared `database` package will own migrations and Honoken’s local drizzle config can be removed.
