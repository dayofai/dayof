## Auth Service (Better Auth + Hono)

This repo uses a standalone Better Auth service (Hono, Vercel Node) mounted at `/auth`. Web apps use a proxy (`/api/auth/*`) only in dev/preview. Expo calls the auth service directly.

### Hosts

- Production web: `https://dayof.ai` (Frontrow), `https://app.dayof.ai` (Backstage)
- Auth: `https://auth.dayof.ai/auth`

### Environments and cookies

- Production: cookies are shared between apex and subdomain via `Domain=dayof.ai`.
- Preview/Local: cookies are host-only; web apps proxy `/api/auth/*` to the auth service.

### Projects and env vars

Auth (apps/auth)

- DATABASE_URL
- BETTER_AUTH_SECRET
- BETTER_AUTH_URL (must include path, e.g. `https://auth.dayof.ai/auth`)
- AUTH_COOKIE_DOMAIN=dayof.ai (prod only)
- ALLOWED_ORIGINS=`https://dayof.ai,https://app.dayof.ai[,http://localhost:3001,http://localhost:5173]`
- INNGEST_EVENT_KEY (optional: required if emitting events from auth)

Frontrow / Backstage (web)

- VITE_AUTH_BASE_URL: `https://auth.dayof.ai/auth` (prod) or `/api/auth` (preview/dev)
- AUTH_PROXY_BASE: `https://<auth-preview>/auth` (preview/dev only)

Crew (Expo)

- EXPO_PUBLIC_AUTH_BASE_URL: `https://auth.dayof.ai/auth`
- EXPO_PUBLIC_SERVER_URL: your app API base (unchanged)

### Runtime/Routes

- Auth service (Node runtime): `/auth/*`
- Frontrow SSR remains on Edge; `/api/auth` proxy (Edge) forwards to `AUTH_PROXY_BASE`.
- Backstage `/api/auth` proxy (Edge) forwards to `AUTH_PROXY_BASE`.

### Better Auth configuration (server)

- Base URL includes the path `/auth`.
- CORS allowlist reads `ALLOWED_ORIGINS` and enables `credentials`.
- Cookie domain (`AUTH_COOKIE_DOMAIN=dayof.ai`) enabled only in production.

Plugins enabled

- Organization, Phone Number, Magic Link, Anonymous, Admin, JWT
- Phone Number plugin requires a sender; Magic Link requires an email sender. In CLI config used for schema generation, these are no-ops.

References

- Phone Number: https://www.better-auth.com/docs/plugins/phone-number
- Magic Link: https://www.better-auth.com/docs/plugins/magic-link
- Anonymous: https://www.better-auth.com/docs/plugins/anonymous
- Admin: https://www.better-auth.com/docs/plugins/admin
- JWT: https://www.better-auth.com/docs/plugins/jwt

### Database schema

- Location: `packages/database/schema/better-auth.ts` (merged, singular table names)
- Tables/columns (singular): `user`, `session`, `account`, `verification`, `organization`, `member`, `invitation`, `jwks`
- Notable columns:
  - user: `phoneNumber`, `phoneNumberVerified`, `isAnonymous`, `role`, `banned`, `banReason`, `banExpires`
  - session: `activeOrganizationId`, `impersonatedBy`

#### Drizzle V2 & migrations (monorepo standard)

- The shared database package (`packages/database`) is the single source of truth for Drizzle V2 schema and migrations across services (including Auth and Honoken).
- Generate migrations only from `packages/database` (using Drizzle Kit). App folders (e.g., `apps/auth`) should NOT hold their own `drizzle.config.ts` or generate migrations.
- Typical flow:
  - Set `DEV_DATABASE_URL` to your Neon dev branch URL in your shell
  - From `packages/database`, run: `npx drizzle-kit generate`
  - Apply the generated SQL under `packages/database/migrations` via Neon Console or your preferred client
- Services consume `db`/`schema` from the shared `database` package at runtime; no runtime dependency on Drizzle Kit.

### Schema generation (already applied here)

- Generator config: `apps/auth/cli-auth.config.ts`
- Command used:
  - `npx @better-auth/cli@1.3.8 generate --config apps/auth/cli-auth.config.ts --output packages/database/schema/better-auth.generated.ts --yes`
  - The generated schema was merged into `better-auth.ts` and the generated file removed.

### Env templates

Auth (.env)

```
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=https://auth.dayof.ai/auth
# prod only
AUTH_COOKIE_DOMAIN=dayof.ai
ALLOWED_ORIGINS=https://dayof.ai,https://app.dayof.ai,http://localhost:3001,http://localhost:5173
INNGEST_EVENT_KEY=
```

Frontrow (.env)

```
# prod
VITE_AUTH_BASE_URL=https://auth.dayof.ai/auth
# preview/dev
# VITE_AUTH_BASE_URL=/api/auth
# AUTH_PROXY_BASE=https://<auth-preview>.vercel.app/auth
```

Backstage (.env)

```
# prod
VITE_AUTH_BASE_URL=https://auth.dayof.ai/auth
# preview/dev
# VITE_AUTH_BASE_URL=/api/auth
# AUTH_PROXY_BASE=https://<auth-preview>.vercel.app/auth
```

Crew (.env)

```
EXPO_PUBLIC_AUTH_BASE_URL=https://auth.dayof.ai/auth
EXPO_PUBLIC_SERVER_URL=
```

### Quick validation

- Prod sign-in on `dayof.ai` → `Set-Cookie` shows `Domain=dayof.ai`; navigate to `app.dayof.ai` and session is present.
- Preview sign-in on a preview host → `Set-Cookie` has no Domain; session remains host-only via the proxy.
- Expo sign-in → subsequent calls include the stored cookie via plugin storage.

### Notes

- Always keep server and client baseURL paths aligned.
- In preview/dev do not set `AUTH_COOKIE_DOMAIN`.
- When calling the auth service cross-origin (no proxy), ensure `credentials: "include"`.
