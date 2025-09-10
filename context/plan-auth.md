<plan>

Here’s a clean, **actionable plan** tailored to your repo to make Better Auth a **standalone Hono service** and wire it to your web apps (TanStack Start) and the Expo app.

---

## TL;DR decisions

- **Deploy a dedicated service** at `apps/auth` (Hono on Vercel **Node** runtime).
- **Use path `/auth`** (not `/api/auth`). This is fully supported—as long as you set the **baseURL including the path**. The baseURL can include a path and it overrides the default; the default is `/api/auth` only when you don’t set one. ([Better Auth][1])
- **Production cookies across subdomains** (`frontrow.dayof.ai`, `backstage.dayof.ai`) via Better Auth’s `crossSubDomainCookies` option. ([Better Auth][2])
- **Local & Preview**: keep cookies **host-only** and **proxy `/api/auth/*` from each web app** to the auth service, so the browser sees same-origin and cookies “just work”.
- **Expo**: point straight at the auth baseURL and use the **Expo plugin**; it stores/sends session cookies via `SecureStore`. ([Better Auth][3])

---

## 1) Add the standalone auth service

Create `apps/auth` with these files.

### `apps/auth/package.json`

```json
{
  "name": "auth",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "hono --watch src/app.ts",
    "build": "true"
  },
  "dependencies": {
    "better-auth": "^1.3.8",
    "hono": "^4.8.2",
    "better-auth/adapters/drizzle": "^1.3.8",
    "@better-auth/expo": "^0.1.0",
    "drizzle-orm": "beta",
    "@neondatabase/serverless": "^1.0.1"
  },
  "devDependencies": {
    "@hono/node-server": "^1.14.4",
    "typescript": "^5.7.2"
  }
}
```

### `apps/auth/src/auth.ts`

```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { expo } from "@better-auth/expo";
import { db } from "database/db";

// IMPORTANT: include the path in baseURL if you want "/auth" instead of default "/api/auth"
const BASE_URL = process.env.BETTER_AUTH_URL; // e.g. https://auth.dayof.ai/auth

export const auth = betterAuth({
  baseURL: BASE_URL, // includes "/auth"
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  plugins: [expo()],
  // Production: share cookies across subdomains; Previews/Local: leave undefined.
  ...(process.env.AUTH_COOKIE_DOMAIN
    ? {
        advanced: {
          crossSubDomainCookies: {
            enabled: true,
            domain: process.env.AUTH_COOKIE_DOMAIN, // e.g. dayof.ai
          },
        },
      }
    : {}),
  // Lock down which web/native origins may call the server.
  trustedOrigins: (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
});
```

### `apps/auth/src/app.ts`

```ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth";

const app = new Hono();

// Allow web app origins; allow "null" origin (RN/Expo) as well.
const ALLOW = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  "/auth/*",
  cors({
    origin: (origin) => (origin ? ALLOW.includes(origin) : true),
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 600,
  })
);

// Mount Better Auth at /auth/*
app.on(["GET", "POST"], "/auth/*", (c) => auth.handler(c.req.raw));

// Health
app.get("/health", (c) => c.json({ ok: true }));

export default app;
export const config = { runtime: "nodejs20.x" };
```

### `apps/auth/api/index.ts`

```ts
import { handle } from "hono/vercel";
import app from "../src/app";

const h = handle(app);
export const GET = h;
export const POST = h;
export const PUT = h;
export const PATCH = h;
export const DELETE = h;
export const OPTIONS = h;
```

### `apps/auth/vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "regions": ["iad1"],
  "functions": { "api/index.ts": { "maxDuration": 300 } },
  "ignoreCommand": "if [ -z \"$VERCEL_GIT_PREVIOUS_SHA\" ]; then exit 1; fi; git diff --quiet \"$VERCEL_GIT_PREVIOUS_SHA\" \"$VERCEL_GIT_COMMIT_SHA\" -- apps/auth packages/database || exit 1"
}
```

### ENV for the auth project (Vercel)

- `DATABASE_URL` — Neon Postgres.
- `BETTER_AUTH_URL` — **include the path** you chose, e.g. `https://auth.dayof.ai/auth`. (If you include a path, it overrides the default.) ([Better Auth][1])
- `AUTH_COOKIE_DOMAIN=dayof.ai` — **only in Production** (omit in Preview/Dev).
- `ALLOWED_ORIGINS=https://frontrow.dayof.ai,https://backstage.dayof.ai,http://localhost:3001,http://localhost:5173`

> **DB schema**: run Better Auth’s generator or bring its tables into `packages/database/schema` and push/migrate. (You already export a Neon Drizzle client at `packages/database/db/index.ts`.)

---

## 2) Update all clients to point to the new baseURL

We’ll use **one env var that already includes the path**. For PROD it’ll be the absolute `https://auth.dayof.ai/auth`. For **local/preview** it will be **`/api/auth`** to hit the proxy we add below.

### Backstage — `apps/backstage/src/lib/auth-client.ts` **(edit)**

```diff
-import { createAuthClient } from "better-auth/react";
-
-export const authClient = createAuthClient({
-  baseURL:
-      import.meta.env.VITE_SERVER_URL,
-});
+import { createAuthClient } from "better-auth/react";
+export const authClient = createAuthClient({
+  baseURL: import.meta.env.VITE_AUTH_BASE_URL, // PROD: https://auth.dayof.ai/auth; Dev/Preview: /api/auth
+});
```

### Frontrow — `apps/frontrow/src/lib/auth-client.ts` **(edit)**

```diff
-import { createAuthClient } from "better-auth/react";
-
-export const authClient = createAuthClient({
-  baseURL:
-      import.meta.env.VITE_SERVER_URL,
-});
+import { createAuthClient } from "better-auth/react";
+export const authClient = createAuthClient({
+  baseURL: import.meta.env.VITE_AUTH_BASE_URL,
+});
```

### Expo (Crew) — `apps/crew/lib/auth-client.ts` **(edit)**

```diff
-import { createAuthClient } from "better-auth/react";
-import { expoClient } from "@better-auth/expo/client";
-import * as SecureStore from "expo-secure-store";
-
-export const authClient = createAuthClient({
-  baseURL: process.env.EXPO_PUBLIC_SERVER_URL,
-  plugins: [
-    expoClient({
-      storagePrefix: "dayof-crew",
-      storage: SecureStore,
-    }),
-  ],
-});
+import { createAuthClient } from "better-auth/react";
+import { expoClient } from "@better-auth/expo/client";
+import * as SecureStore from "expo-secure-store";
+
+export const authClient = createAuthClient({
+  baseURL: process.env.EXPO_PUBLIC_AUTH_BASE_URL, // e.g. https://auth.dayof.ai/auth
+  plugins: [
+    expoClient({
+      scheme: "dayof", // your deep-link scheme if you have one
+      storagePrefix: "dayof-crew",
+      storage: SecureStore,
+    }),
+  ],
+});
```

> Expo: the plugin stores the session cookie and attaches it on requests—no browser cookie jar. ([Better Auth][3])

### Update `.env.example` files

Backstage `apps/backstage/.env.example`

```diff
-VITE_SERVER_URL=
+VITE_AUTH_BASE_URL= # prod: https://auth.dayof.ai/auth
+                    # dev/preview: /api/auth
```

Frontrow `apps/frontrow/.env.example`

```diff
-VITE_SERVER_URL=
+VITE_AUTH_BASE_URL= # prod: https://auth.dayof.ai/auth
+                    # dev/preview: /api/auth
```

Crew `apps/crew/.env.example`

```diff
-EXPO_PUBLIC_SERVER_URL=
+EXPO_PUBLIC_AUTH_BASE_URL= # e.g. https://auth.dayof.ai/auth
+EXPO_PUBLIC_SERVER_URL=    # keep for your own API base (already used in orpc.ts)
```

Your forms/components keep working—no code changes needed beyond the client import, since they call `authClient.signIn.*` / `signUp.*`.

---

## 3) Add **per-app proxy** for Local & Preview (so cookies are host-only)

> In Dev & Preview we want the browser to see `Set-Cookie` from **the app’s own domain**, so the cookie is stored host-only and no cross-site rules apply. We’ll **forward** `/api/auth/*` to the auth service and return the response as-is.

### Frontrow — add `apps/frontrow/api/auth.ts` **(new)**

```ts
export const config = { runtime: "edge" };

const AUTH_PROXY_BASE = process.env.AUTH_PROXY_BASE; // e.g. https://auth-dev.dayof.ai/auth (staging) or the preview auth URL

export default async function handler(req: Request) {
  if (!AUTH_PROXY_BASE)
    return new Response("Missing AUTH_PROXY_BASE", { status: 500 });

  const url = new URL(req.url);
  // strip "/api/auth" and append to AUTH_PROXY_BASE
  const target = new URL(
    url.pathname.replace(/^\/api\/auth/, "") + url.search,
    AUTH_PROXY_BASE
  );

  // forward everything, including cookies; let Vercel handle Set-Cookie passthrough
  const res = await fetch(target.toString(), {
    method: req.method,
    headers: req.headers,
    body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body,
    redirect: "manual",
  });
  return res;
}
```

> **No vercel.json changes needed**: filesystem functions under `/api` take precedence over your catch‑all rewrite to `/api/server`. (If you ever add a conflicting rewrite, put this route first.)

### Backstage — add `apps/backstage/api/auth.ts` **(new)**

```ts
export const config = { runtime: "edge" };

const AUTH_PROXY_BASE = process.env.AUTH_PROXY_BASE;

export default async function handler(req: Request) {
  if (!AUTH_PROXY_BASE)
    return new Response("Missing AUTH_PROXY_BASE", { status: 500 });

  const url = new URL(req.url);
  const target = new URL(
    url.pathname.replace(/^\/api\/auth/, "") + url.search,
    AUTH_PROXY_BASE
  );

  const res = await fetch(target.toString(), {
    method: req.method,
    headers: req.headers,
    body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body,
    redirect: "manual",
  });
  return res;
}
```

**Set these env vars in Frontrow & Backstage projects:**

- `AUTH_PROXY_BASE`
  - **Dev/Preview**: a stable staging auth URL (recommended) like `https://auth-dev.dayof.ai/auth`.
  - **Prod**: leave **unset**; in Prod, point the clients directly at `https://auth.dayof.ai/auth` and do not use the proxy.

> Why this works: When the auth server **does not** set a cookie `Domain` (we omit `AUTH_COOKIE_DOMAIN` in dev/preview), `Set-Cookie` becomes **host-only** and will be stored under the **frontend domain** because the response is served by the proxy route. In production we deliberately set `Domain=dayof.ai` to share across subdomains. ([Better Auth][2])

---

## 4) TanStack Start & Hono specifics

- Your web apps already send `credentials: "include"` for ORPC calls—good. For any cross-origin Hono client you make, **force credentials** (cookies). ([Better Auth][4])
- **Edge vs Node**: keep **auth on Node** (DB drivers, and Better Auth is tuned for Node). Frontrow’s app server can stay Edge; the `/api/auth` proxy we added runs fine on Edge and simply forwards.
- **Events/Inngest** (`apps/events`) and **Honoken** don’t need changes. If you want “user signed in” events in Inngest, add a small **after‑hook** in Better Auth and `fetch` your events endpoint from the auth service. (Better Auth provides lifecycle hooks.) ([Better Auth][5])

---

## 5) “/auth” vs “/api/auth”

- **Yes, `/auth` is fine.** Either mount the handler at `/auth/*` **and** set `baseURL` to an absolute URL **including `/auth`**, or keep the default `/api/auth`. If a path is present in `baseURL`, it takes precedence over the default. ([Better Auth][1])
- **Clients** (web & Expo) must use the same baseURL. For local/preview we make the baseURL `/api/auth` (proxy); in prod we set a full absolute URL `https://auth.dayof.ai/auth`.

---

## 6) Minimal change list (monorepo)

**New**

- `apps/auth/**` (5 files above)
- `apps/frontrow/api/auth.ts`
- `apps/backstage/api/auth.ts`

**Edited**

- `apps/backstage/src/lib/auth-client.ts` (use `VITE_AUTH_BASE_URL`)
- `apps/frontrow/src/lib/auth-client.ts` (use `VITE_AUTH_BASE_URL`)
- `apps/crew/lib/auth-client.ts` (use `EXPO_PUBLIC_AUTH_BASE_URL`)
- `apps/*/.env.example` — add the new vars (shown above)

**Vercel project envs**

- **auth**: `DATABASE_URL`, `BETTER_AUTH_URL` (with `/auth`), `AUTH_COOKIE_DOMAIN` (prod only), `ALLOWED_ORIGINS`
- **frontrow**: `VITE_AUTH_BASE_URL` (`/api/auth` dev/preview, absolute prod), `AUTH_PROXY_BASE` (dev/preview)
- **backstage**: same as frontrow
- **crew**: `EXPO_PUBLIC_AUTH_BASE_URL` (absolute prod; absolute dev works too)

**DB**

- Run the Better Auth schema generator or include required tables in `packages/database/schema` and migrate.

---

## 7) Quick validation checklist

- **Prod web**: `VITE_AUTH_BASE_URL=https://auth.dayof.ai/auth`. Sign in → `Set-Cookie` shows `Domain=dayof.ai`. Session is visible on **both** `frontrow` and `backstage`.
- **Preview web**: `VITE_AUTH_BASE_URL=/api/auth`, `AUTH_PROXY_BASE=https://auth-dev.dayof.ai/auth` (or your preview auth). Sign in → `Set-Cookie` has **no `Domain`** and is stored for the app’s preview host. Session works; no CORS prompts.
- **Expo**: `EXPO_PUBLIC_AUTH_BASE_URL=https://auth.dayof.ai/auth`. Sign in on device/simulator; subsequent calls include the stored cookie.

---

## Notes & gotchas

- **Cross‑subdomain cookies**: enable them **only in Prod** and set the domain to the minimal necessary scope. Don’t enable on previews—use the proxy so cookies are host‑only. ([Better Auth][2])
- **Base URL pitfalls**: if you include the path in `baseURL`, the server and clients must agree. If you later move from `/auth` back to `/api/auth`, change **both** places. ([Better Auth][1])
- **Cross‑origin requests**: if you ever call the auth service **directly** from a web app (not via proxy), ensure your fetch/Hono client sends `credentials: "include"`. ([Better Auth][4])

---

## Answering your specific questions

> **What needs to be done to accomplish this?**
> Add `apps/auth` (Hono + Better Auth + Drizzle Neon adapter), update your clients to use a **baseURL** (with `/auth`), add **/api/auth** proxy functions to each web app for Dev/Preview, set the env vars per project, and migrate the Better Auth tables.

> **Can I deploy to Vercel or does it need to run on Bun?**
> **Vercel Node runtime is perfect**; Bun is not required. You’re already on Hono + Neon which works great on Node.

> **Can it just be `/auth` and not `/api/auth`?**
> Yes. Set `BETTER_AUTH_URL` to include `/auth` and mount the handler at `/auth/*`. Clients use the same baseURL. ([Better Auth][1])

> **How does this need adjusted for Expo, Hono (events/honoken), TanStack Start?**

- **Expo**: set `EXPO_PUBLIC_AUTH_BASE_URL` (absolute) and keep the Expo plugin. ([Better Auth][3])
- **Web (TanStack Start)**: use `VITE_AUTH_BASE_URL` and add the `/api/auth` proxy in each app for Dev/Preview.
- **Hono services (events, honoken)**: no change required unless they need auth; if they do, forward the session cookie like you already do in ORPC.

If you want, I can generate ready-to-commit files for `apps/auth/` and the exact diffs for the three client files + the two new proxy functions so you can paste them straight in.

[1]: https://www.better-auth.com/docs/reference/options?utm_source=chatgpt.com "Options"
[2]: https://www.better-auth.com/docs/concepts/cookies?utm_source=chatgpt.com "Cookies"
[3]: https://www.better-auth.com/docs/integrations/expo?utm_source=chatgpt.com "Expo Integration"
[4]: https://www.better-auth.com/docs/integrations/hono?utm_source=chatgpt.com "Hono Integration"
[5]: https://www.better-auth.com/docs/concepts/hooks?utm_source=chatgpt.com "Hooks"

---

"Production cookies across subdomains (frontrow.dayof.ai, backstage.dayof.ai) via Better Auth’s crossSubDomainCookies option." are not subdomains ... they actually map to dayof.ai (frontrow) and app.dayof.ai (backstage). The Vercel project / app names are frontrow and backstage to help us devs and business partners speak about the development clearly.

---

Good catch — thanks for the correction.

**Reality:** production hosts are **dayof.ai (Frontrow)** and **app.dayof.ai (Backstage)**. That’s one **apex** + one **subdomain** of the **same registrable domain** (`dayof.ai`). The plan still stands; we just need to be precise about the cookie **Domain** and the allowed origins.

Below is the **adjusted, ready‑to‑apply** version.

---

## What changes with apex + subdomain

1. **Cookie scope (prod):**
   Set the cookie `Domain=dayof.ai`. That makes the session visible to **dayof.ai** and **app.dayof.ai** (and any other `*.dayof.ai` host you might add later).
   Keep `SameSite` at the default (Lax) — it’s still **same‑site** across apex ↔ subdomain.

2. **CORS allow‑list (prod):**
   Allow `https://dayof.ai` and `https://app.dayof.ai`.

3. **Previews & local:**
   Do **not** set a Domain attribute. Cookies should be **host‑only**, which is why we keep the **per‑app `/api/auth` proxy** in dev/preview so the browser sees the response as same‑origin.

Everything else from the plan (standalone Hono auth service, proxies for previews, Expo plugin) remains the same.

---

## Auth service (Hono) — minimal snippets with corrections

### `apps/auth/src/auth.ts`

```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { expo } from "@better-auth/expo";
import { db } from "database/db";

// IMPORTANT: include your chosen path in baseURL if you use "/auth"
const BASE_URL = process.env.BETTER_AUTH_URL; // e.g. https://auth.dayof.ai/auth

export const auth = betterAuth({
  baseURL: BASE_URL, // includes "/auth"
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  plugins: [expo()],
  // PROD ONLY: share across apex + subdomain by scoping to the registrable domain
  ...(process.env.AUTH_COOKIE_DOMAIN
    ? {
        advanced: {
          cookiePrefix: "dayof", // prevent name collisions at apex
          crossSubDomainCookies: {
            enabled: true,
            domain: process.env.AUTH_COOKIE_DOMAIN, // "dayof.ai"
          },
        },
      }
    : {}),
  // lock down callers (add more as needed)
  trustedOrigins: (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
});
```

### `apps/auth/src/app.ts` (CORS allowlist corrected)

```ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth";

const app = new Hono();

const ALLOW = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  "/auth/*",
  cors({
    origin: (origin) => (origin ? ALLOW.includes(origin) : true), // allow null for RN
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 600,
  })
);

app.on(["GET", "POST"], "/auth/*", (c) => auth.handler(c.req.raw));
app.get("/health", (c) => c.json({ ok: true }));

export default app;
export const config = { runtime: "nodejs20.x" };
```

### Auth service env (Vercel)

- **Prod**
  - `DATABASE_URL=<neon>`
  - `BETTER_AUTH_URL=https://auth.dayof.ai/auth`
  - `AUTH_COOKIE_DOMAIN=dayof.ai` ← **this is the key change**
  - `ALLOWED_ORIGINS=https://dayof.ai,https://app.dayof.ai`

- **Preview/Dev**
  - `DATABASE_URL=<your branch url>`
  - `BETTER_AUTH_URL=https://<your-auth-preview>.vercel.app/auth` (or a stable `auth-dev.dayof.ai`)
  - **Do not set `AUTH_COOKIE_DOMAIN`**
  - `ALLOWED_ORIGINS=https://<your-frontend-preview>,http://localhost:3001,http://localhost:5173`

---

## Web apps (TanStack Start) — baseURL + proxy unchanged, just precise

**Goal:**

- **Prod** web apps call **`https://auth.dayof.ai/auth`** directly (CORS allow list includes `https://dayof.ai` & `https://app.dayof.ai`; cookies scoped to `dayof.ai` work on both).
- **Preview/Dev** web apps call **`/api/auth/*`** which proxies to the auth service, making cookies **host‑only** for that preview host.

### Client config (Backstage & Frontrow)

Use one env var that includes the path:

```ts
// apps/*/src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // PROD: https://auth.dayof.ai/auth
  // Preview/Dev: /api/auth  (goes through the per-app proxy)
  baseURL: import.meta.env.VITE_AUTH_BASE_URL,
});
```

**.env.example updates**

```diff
# apps/backstage/.env.example
-VITE_SERVER_URL=
+VITE_AUTH_BASE_URL=

# apps/frontrow/.env.example
-VITE_SERVER_URL=
+VITE_AUTH_BASE_URL=
```

> In **Prod** set `VITE_AUTH_BASE_URL=https://auth.dayof.ai/auth`.
> In **Preview/Dev** set `VITE_AUTH_BASE_URL=/api/auth` and also set `AUTH_PROXY_BASE` (see below).

### Per‑app proxy (unchanged logic, still the right move for previews)

- `apps/frontrow/api/auth.ts` (Edge) and `apps/backstage/api/auth.ts` (Edge) forward `/api/auth/*` → `${AUTH_PROXY_BASE}/*`.

**Per‑app env for previews/dev**

- `AUTH_PROXY_BASE=https://<your auth preview or auth-dev domain>/auth`

**Prod**

- Don’t set `AUTH_PROXY_BASE` and point clients directly to `https://auth.dayof.ai/auth`.

> Because we **omit** `AUTH_COOKIE_DOMAIN` in previews/dev, the auth server sets **host‑only** cookies. Returning them through the proxy means the browser stores them for the **frontend’s** host (exactly what we want in previews).

---

## Expo (React Native)

Your existing Expo client is fine; just point it at the absolute baseURL and keep the plugin:

```ts
// apps/crew/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_AUTH_BASE_URL, // e.g. https://auth.dayof.ai/auth
  plugins: [
    expoClient({
      scheme: "dayof",
      storagePrefix: "dayof-crew",
      storage: SecureStore,
    }),
  ],
});
```

**.env.example**

```diff
# apps/crew/.env.example
-EXPO_PUBLIC_SERVER_URL=
+EXPO_PUBLIC_AUTH_BASE_URL=
+EXPO_PUBLIC_SERVER_URL=    # keep for your own API base used in ORPC
```

- The Expo plugin stores/sends the session cookie from `SecureStore`. No browser SameSite games here.
- If your native app calls your own API (e.g., ORPC), keep doing what you’re doing: attach the cookie you get from the auth client (you already do in `apps/crew/utils/orpc.ts`).

---

## Sanity checks (specific to apex + subdomain)

- **Prod sign‑in from dayof.ai**:
  Network tab shows `Set-Cookie` with `Domain=dayof.ai`. Navigate to **app.dayof.ai** — session is present without an extra sign‑in.

- **Prod sign‑in from app.dayof.ai**:
  Same behavior; the browser accepts `Domain=dayof.ai` set by a subdomain. Session is shared with the apex.

- **Preview sign‑in**:
  `Set-Cookie` **does not** have a Domain attribute. Cookie is stored for the preview host only. No cross‑preview bleed. Works because we go through `/api/auth` proxy.

- **Direct cross‑origin calls (prod only)**:
  If you ever bypass the proxy and call `https://auth.dayof.ai/auth` directly from web apps, make sure those fetches use `credentials: "include"` (Better Auth’s React client does the right thing already).

---

## Answering your questions succinctly

- **Can I deploy to Vercel or does it need Bun?**
  Deploy to **Vercel Node runtime**. Bun is unnecessary.

- **Can it be `/auth` instead of `/api/auth`?**
  Yes. Set `BETTER_AUTH_URL` to include `/auth`, mount the Hono handler at `/auth/*`, and point all clients at the same path. For previews/local, keep `/api/auth` as a **proxy path** in each web app.

- **Any special adjustments for Expo, Hono (events, honoken), TanStack Start?**
  - **Expo:** use the Expo plugin + absolute baseURL (done).
  - **Events / Honoken:** no change unless you decide to read the auth cookie there.
  - **TanStack Start (frontrow/backstage):** switch to `VITE_AUTH_BASE_URL`, add/keep the `/api/auth` proxy for previews, and set the CORS allow‑list to `https://dayof.ai, https://app.dayof.ai`.

If you want, I’ll produce the exact file diffs for:

- `apps/auth/**` (new service)
- the three `auth-client.ts` edits
- the two proxy functions
- updated `.env.example` files

No fluff — copy/paste and commit.

---

Below are **unified diffs** you can `git apply`. They add a standalone **Auth** Hono service mounted at **`/auth`**, switch web/Expo clients to use an **explicit baseURL**, and add **/api/auth** proxy functions for Dev/Preview.

---

### 1) **New service**: `apps/auth`

#### `apps/auth/package.json` (new)

```diff
diff --git a/apps/auth/package.json b/apps/auth/package.json
new file mode 100644
--- /dev/null
+++ b/apps/auth/package.json
@@ -0,0 +1,29 @@
+{
+  "name": "auth",
+  "private": true,
+  "type": "module",
+  "scripts": {
+    "build": "true"
+  },
+  "dependencies": {
+    "better-auth": "^1.3.4",
+    "hono": "^4.8.2",
+    "database": "workspace:*"
+  }
+}
```

#### `apps/auth/src/auth.ts` (new)

```diff
diff --git a/apps/auth/src/auth.ts b/apps/auth/src/auth.ts
new file mode 100644
--- /dev/null
+++ b/apps/auth/src/auth.ts
@@ -0,0 +1,55 @@
+import { betterAuth } from "better-auth";
+import { drizzleAdapter } from "better-auth/adapters/drizzle";
+import { db } from "database/db";
+
+/**
+ * IMPORTANT:
+ * - baseURL includes the path (/auth) so Better Auth generates routes under that path.
+ * - Provide AUTH_COOKIE_DOMAIN=dayof.ai in PROD only to share cookies across dayof.ai + app.dayof.ai.
+ * - Ensure Better Auth tables exist in your DB (run @better-auth/cli generate + migrate).
+ */
+const BASE_URL = process.env.BETTER_AUTH_URL;           // e.g. https://auth.dayof.ai/auth
+const COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN;   // e.g. dayof.ai (PROD only)
+const SECRET = process.env.BETTER_AUTH_SECRET;          // required in production
+
+export const auth = betterAuth({
+  baseURL: BASE_URL,
+  secret: SECRET,
+  database: drizzleAdapter(db, { provider: "pg" }),
+  emailAndPassword: { enabled: true },
+  // Share cookies across apex + subdomain in PROD only
+  ...(COOKIE_DOMAIN
+    ? {
+        advanced: {
+          crossSubDomainCookies: {
+            enabled: true,
+            domain: COOKIE_DOMAIN, // "dayof.ai"
+          },
+        },
+      }
+    : {}),
+  // Allowlisted callers (web apps, preview, local, etc.)
+  trustedOrigins: (process.env.ALLOWED_ORIGINS ?? "")
+    .split(",")
+    .map((s) => s.trim())
+    .filter(Boolean),
+});
```

#### `apps/auth/src/app.ts` (new)

```diff
diff --git a/apps/auth/src/app.ts b/apps/auth/src/app.ts
new file mode 100644
--- /dev/null
+++ b/apps/auth/src/app.ts
@@ -0,0 +1,33 @@
+import { Hono } from "hono";
+import { cors } from "hono/cors";
+import { auth } from "./auth";
+
+const app = new Hono();
+
+const ALLOW = (process.env.ALLOWED_ORIGINS ?? "")
+  .split(",")
+  .map((s) => s.trim())
+  .filter(Boolean);
+
+// Allow web origins; allow null origin (RN/Expo) too.
+app.use(
+  "/auth/*",
+  cors({
+    origin: (origin) => (origin ? ALLOW.includes(origin) : true),
+    allowMethods: ["GET", "POST", "OPTIONS"],
+    allowHeaders: ["Content-Type", "Authorization"],
+    credentials: true,
+    maxAge: 600,
+  }),
+);
+
+// Mount Better Auth at /auth/*
+app.on(["GET", "POST"], "/auth/*", (c) => auth.handler(c.req.raw));
+
+app.get("/health", (c) => c.json({ ok: true }));
+
+export default app;
+// Use Node runtime (DB driver compatibility etc.)
+export const config = { runtime: "nodejs20.x" };
```

#### `apps/auth/api/index.ts` (new)

```diff
diff --git a/apps/auth/api/index.ts b/apps/auth/api/index.ts
new file mode 100644
--- /dev/null
+++ b/apps/auth/api/index.ts
@@ -0,0 +1,12 @@
+import { handle } from "hono/vercel";
+import app from "../src/app";
+
+const h = handle(app);
+export const GET = h;
+export const POST = h;
+export const PUT = h;
+export const PATCH = h;
+export const DELETE = h;
+export const OPTIONS = h;
+
+export const config = { runtime: "nodejs20.x" };
```

#### `apps/auth/vercel.json` (new)

```diff
diff --git a/apps/auth/vercel.json b/apps/auth/vercel.json
new file mode 100644
--- /dev/null
+++ b/apps/auth/vercel.json
@@ -0,0 +1,12 @@
+{
+  "$schema": "https://openapi.vercel.sh/vercel.json",
+  "regions": ["iad1"],
+  "functions": {
+    "api/index.ts": {
+      "maxDuration": 300
+    }
+  },
+  "ignoreCommand": "if [ -z \"$VERCEL_GIT_PREVIOUS_SHA\" ]; then exit 1; fi; git diff --quiet \"$VERCEL_GIT_PREVIOUS_SHA\" \"$VERCEL_GIT_COMMIT_SHA\" -- apps/auth packages/database || exit 1"
+}
```

#### `apps/auth/.env.example` (new)

```diff
diff --git a/apps/auth/.env.example b/apps/auth/.env.example
new file mode 100644
--- /dev/null
+++ b/apps/auth/.env.example
@@ -0,0 +1,12 @@
+# Required
+DATABASE_URL=
+BETTER_AUTH_SECRET=
+
+# Base URL MUST include the /auth path you mounted on
+#   e.g. https://auth.dayof.ai/auth
+BETTER_AUTH_URL=
+
+# Production only: share cookies across dayof.ai + app.dayof.ai
+AUTH_COOKIE_DOMAIN=dayof.ai
+
+# Comma-separated list of allowed web origins (prod/local/preview)
+ALLOWED_ORIGINS=https://dayof.ai,https://app.dayof.ai,http://localhost:3001,http://localhost:5173
```

---

### 2) **Proxy** for Dev/Preview: `/api/auth/*` in each web app

#### `apps/frontrow/api/auth.ts` (new)

```diff
diff --git a/apps/frontrow/api/auth.ts b/apps/frontrow/api/auth.ts
new file mode 100644
--- /dev/null
+++ b/apps/frontrow/api/auth.ts
@@ -0,0 +1,29 @@
+export const config = { runtime: "edge" };
+
+const AUTH_PROXY_BASE = process.env.AUTH_PROXY_BASE; // e.g. https://auth-dev.dayof.ai/auth
+
+export default async function handler(req: Request) {
+  if (!AUTH_PROXY_BASE) {
+    return new Response("Missing AUTH_PROXY_BASE", { status: 500 });
+  }
+  const url = new URL(req.url);
+  // Forward /api/auth/* → AUTH_PROXY_BASE/*
+  const upstream = new URL(
+    url.pathname.replace(/^\/api\/auth/, "") + url.search,
+    AUTH_PROXY_BASE,
+  );
+  const res = await fetch(upstream.toString(), {
+    method: req.method,
+    headers: req.headers,
+    body: req.method === "GET" || req.method === "HEAD" ? undefined : req.body,
+    redirect: "manual",
+  });
+  return res;
+}
```

#### `apps/backstage/api/auth.ts` (new)

```diff
diff --git a/apps/backstage/api/auth.ts b/apps/backstage/api/auth.ts
new file mode 100644
--- /dev/null
+++ b/apps/backstage/api/auth.ts
@@ -0,0 +1,29 @@
+export const config = { runtime: "edge" };
+
+const AUTH_PROXY_BASE = process.env.AUTH_PROXY_BASE; // e.g. https://auth-dev.dayof.ai/auth
+
+export default async function handler(req: Request) {
+  if (!AUTH_PROXY_BASE) {
+    return new Response("Missing AUTH_PROXY_BASE", { status: 500 });
+  }
+  const url = new URL(req.url);
+  // Forward /api/auth/* → AUTH_PROXY_BASE/*
+  const upstream = new URL(
+    url.pathname.replace(/^\/api\/auth/, "") + url.search,
+    AUTH_PROXY_BASE,
+  );
+  const res = await fetch(upstream.toString(), {
+    method: req.method,
+    headers: req.headers,
+    body: req.method === "GET" || req.method === "HEAD" ? undefined : req.body,
+    redirect: "manual",
+  });
+  return res;
+}
```

---

### 3) **Clients**: point to new baseURL (with path)

#### `apps/backstage/src/lib/auth-client.ts`

```diff
diff --git a/apps/backstage/src/lib/auth-client.ts b/apps/backstage/src/lib/auth-client.ts
index 8d9e6df..b7a4c7e 100644
--- a/apps/backstage/src/lib/auth-client.ts
+++ b/apps/backstage/src/lib/auth-client.ts
@@ -1,7 +1,8 @@
 import { createAuthClient } from "better-auth/react";

 export const authClient = createAuthClient({
-  baseURL:
-      import.meta.env.VITE_SERVER_URL,
+  // PROD: https://auth.dayof.ai/auth
+  // Dev/Preview: /api/auth (served by this app's proxy function)
+  baseURL: import.meta.env.VITE_AUTH_BASE_URL,
 });

```

#### `apps/frontrow/src/lib/auth-client.ts`

```diff
diff --git a/apps/frontrow/src/lib/auth-client.ts b/apps/frontrow/src/lib/auth-client.ts
index 8d9e6df..b7a4c7e 100644
--- a/apps/frontrow/src/lib/auth-client.ts
+++ b/apps/frontrow/src/lib/auth-client.ts
@@ -1,7 +1,8 @@
 import { createAuthClient } from "better-auth/react";

 export const authClient = createAuthClient({
-  baseURL:
-      import.meta.env.VITE_SERVER_URL,
+  // PROD: https://auth.dayof.ai/auth
+  // Dev/Preview: /api/auth (served by this app's proxy function)
+  baseURL: import.meta.env.VITE_AUTH_BASE_URL,
 });

```

#### `apps/crew/lib/auth-client.ts`

```diff
diff --git a/apps/crew/lib/auth-client.ts b/apps/crew/lib/auth-client.ts
index 1b3b6aa..37f9c2e 100644
--- a/apps/crew/lib/auth-client.ts
+++ b/apps/crew/lib/auth-client.ts
@@ -1,13 +1,13 @@
 import { createAuthClient } from "better-auth/react";
 import { expoClient } from "@better-auth/expo/client";
 import * as SecureStore from "expo-secure-store";

 export const authClient = createAuthClient({
-  baseURL: process.env.EXPO_PUBLIC_SERVER_URL,
+  // Use absolute auth base URL (includes /auth path)
+  baseURL: process.env.EXPO_PUBLIC_AUTH_BASE_URL,
   plugins: [
     expoClient({
       storagePrefix: "dayof-crew",
       storage: SecureStore,
     }),
   ],
 });

```

---

### 4) **Env examples** (keep existing API base vars; add auth vars)

#### `apps/backstage/.env.example`

```diff
diff --git a/apps/backstage/.env.example b/apps/backstage/.env.example
index 6b8a0cc..b3d1101 100644
--- a/apps/backstage/.env.example
+++ b/apps/backstage/.env.example
@@ -1 +1,8 @@
 VITE_SERVER_URL=
+
+# Auth base URL used by the Better Auth client
+#   PROD: https://auth.dayof.ai/auth
+#   Dev/Preview: /api/auth  (goes through this app's proxy)
+VITE_AUTH_BASE_URL=
+
+# Dev/Preview only: upstream auth URL (must include /auth)
+AUTH_PROXY_BASE=
```

#### `apps/frontrow/.env.example`

```diff
diff --git a/apps/frontrow/.env.example b/apps/frontrow/.env.example
index 6b8a0cc..b3d1101 100644
--- a/apps/frontrow/.env.example
+++ b/apps/frontrow/.env.example
@@ -1 +1,8 @@
 VITE_SERVER_URL=
+
+# Auth base URL used by the Better Auth client
+#   PROD: https://auth.dayof.ai/auth
+#   Dev/Preview: /api/auth  (goes through this app's proxy)
+VITE_AUTH_BASE_URL=
+
+# Dev/Preview only: upstream auth URL (must include /auth)
+AUTH_PROXY_BASE=
```

#### `apps/crew/.env.example`

```diff
diff --git a/apps/crew/.env.example b/apps/crew/.env.example
index 6b8a0cc..b3d1101 100644
--- a/apps/crew/.env.example
+++ b/apps/crew/.env.example
@@ -1 +1,5 @@
 EXPO_PUBLIC_SERVER_URL=
+
+# Absolute Better Auth base URL (includes /auth)
+#   e.g. https://auth.dayof.ai/auth
+EXPO_PUBLIC_AUTH_BASE_URL=
```

---

## How to roll it out

1. Commit & push the patch.
2. Create a **Vercel project** for `apps/auth`. Set env:
   - **Prod**:
     `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=https://auth.dayof.ai/auth`,
     `AUTH_COOKIE_DOMAIN=dayof.ai`,
     `ALLOWED_ORIGINS=https://dayof.ai,https://app.dayof.ai`
   - **Preview/Dev**:
     `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=https://<your-auth-preview>.vercel.app/auth`,
     _(omit `AUTH_COOKIE_DOMAIN`)_,
     `ALLOWED_ORIGINS=<your preview web origins>,http://localhost:3001,http://localhost:5173`

3. In **Frontrow** & **Backstage** projects:
   - **Prod**: `VITE_AUTH_BASE_URL=https://auth.dayof.ai/auth` (leave `AUTH_PROXY_BASE` unset)
   - **Preview/Dev**: `VITE_AUTH_BASE_URL=/api/auth`, `AUTH_PROXY_BASE=https://<your-auth-preview-or-staging>/auth`

4. In **Crew (Expo)**:
   `EXPO_PUBLIC_AUTH_BASE_URL=https://auth.dayof.ai/auth`

> Don’t forget to generate & migrate Better Auth tables (via **`@better-auth/cli`** + **drizzle-kit**).

---

### Notes & sources

- **Use a custom path**: if you change from `/api/auth`, include the **full path** in `baseURL` and mount your handler accordingly. ([Better Auth][1])
- **Cross‑subdomain cookies**: enable `crossSubDomainCookies` and scope the cookie to your registrable domain (`dayof.ai`) for apex + subdomain sharing. ([Better Auth][2])
- **Expo client plugin** securely stores and attaches cookies; point RN at the absolute baseURL. ([Better Auth][3], [npm][4])
- **Drizzle adapter import path**: `better-auth/adapters/drizzle`. ([Better Auth][5])

If you want me to also drop in a **ready-to-run DB schema migration** for Better Auth (based on your Drizzle setup), say the word and I’ll generate a starter `packages/database/schema/auth.*` pair plus `drizzle-kit` commands.

[1]: https://www.better-auth.com/docs/reference/options "Options | Better Auth"
[2]: https://www.better-auth.com/docs/concepts/cookies?utm_source=chatgpt.com "Cookies"
[3]: https://www.better-auth.com/docs/integrations/expo?utm_source=chatgpt.com "Expo Integration"
[4]: https://www.npmjs.com/package/%40better-auth/expo?utm_source=chatgpt.com "Better Auth Expo Plugin"
[5]: https://www.better-auth.com/docs/adapters/drizzle "Drizzle ORM Adapter | Better Auth"

---

Short answer: **No, using `/auth` isn’t going to bite you** as long as you always set `baseURL` explicitly on both the server and clients. The “default” `/api/auth` is just a convention; Better Auth routes are generated off whatever `baseURL` you give it. The _real_ gotchas come from mixing path-based hosting on your frontend projects and Vercel rewrites—not from Better Auth.

Below is a precise rundown against your repo.

---

## Will deviating from `/api/auth` cause issues later?

**Generally, no.** Realistic risks and how you avoid them:

1. **People assuming the default.**
   If someone forgets to set `baseURL` on a new client, they’ll target `/api/auth` by default and get a 404.
   **Mitigation:** keep the explicit `VITE_AUTH_BASE_URL` / `EXPO_PUBLIC_AUTH_BASE_URL` pattern you just added and make it required in `.env.example`. Do not rely on defaults anywhere.

2. **Path collisions in frontends (rewrites).**
   If you tried to mount the auth routes **inside** a frontend project at `/auth`, your catch‑all rewrites (e.g. Frontrow’s) would likely swallow those requests.
   **Mitigation:** you’re not doing that—auth is a **separate Vercel project** at `auth.dayof.ai`. In your web apps you only expose a **proxy** at `/api/auth/*` for dev/previews. That separation avoids rewrite conflicts.

3. **Future code-gen / snippets.**
   Many examples use `/api/auth`. You’re fine as long as you don’t copy‑paste sample code that assumes defaults without setting `baseURL`.

4. **Cookie Path/Domain.**
   Better Auth cookies default to `Path=/`. Your choice of `/auth` or `/api/auth` doesn’t change cookie validity as long as `Path=/` (the default) and you keep `Domain=dayof.ai` only in prod. You’re already doing that.

**Net:** Using `/auth` on `auth.dayof.ai` is clean and keeps `/api` free in that project if you want unrelated APIs later.

---

## What you already have under `/api` (by app)

**Frontrow**

- `apps/frontrow/api/server.ts` (Edge): your SSR entrypoint (all non-asset requests are rewritten to this).
- You just added (per our diff) **`apps/frontrow/api/auth.ts`** (Edge): the **proxy** that forwards `/api/auth/*` → the Auth service for dev/preview.

**Backstage**

- No SSR function file today, but `apps/backstage/vercel.json` forwards `/api/*` to `/api/*` if present.
- You just added **`apps/backstage/api/auth.ts`** (Edge): same **proxy** for dev/preview.

**Events (Inngest)**

- Not a Vercel filesystem API route; the Hono server itself exposes **`/api/inngest`** on the events service domain.

**Honoken (PassKit)**

- Entire Hono app served under the **`/api`** prefix for that service (`/api/v1/...`, `/api/admin/...`), via `apps/honoken/api/index.ts` with the Hono Vercel adapter and `vercel.json` rewrites.

**Handbook**

- Has `routes/api/search.ts`, but your repo-level `.vercelignore` excludes `apps/handbook/` from the monorepo deploys you care about, so it won’t conflict.

**ORPC (your app APIs)**

- Web apps talk to your own backend via **`/rpc`** (see `apps/*/src/utils/orpc.ts`). That’s entirely separate from `/api`.

**Conclusion:**

- `/api` is **already reserved** for app SSR functions (frontrow) and service-level APIs (honoken, events).
- Keeping the standalone auth service on **`/auth` at `auth.dayof.ai`** **avoids crowding `/api`** on that service and keeps your mental model tidy:
  - _auth routes_: `https://auth.dayof.ai/auth/*`
  - _web SSR_: `/api/server` inside each web app
  - _project APIs_: `/rpc` (your ORPC) and service-specific `/api/*` on other domains

---

## Practical guidance (do this and you won’t have problems)

- **Always set `baseURL` explicitly** on:
  - Auth server (`BETTER_AUTH_URL=https://auth.dayof.ai/auth`)
  - Web clients (`VITE_AUTH_BASE_URL` = `https://auth.dayof.ai/auth` in prod, `/api/auth` via proxy in dev/preview)
  - Expo client (`EXPO_PUBLIC_AUTH_BASE_URL=https://auth.dayof.ai/auth`)

- **Keep the dev/preview proxy at `/api/auth/*`** inside each web app. That makes cookies **host-only** in previews and avoids third‑party cookie rules. In prod, you skip the proxy and point directly at `auth.dayof.ai`.

- **Prod cookies:** set `AUTH_COOKIE_DOMAIN=dayof.ai` (apex + subdomain). In previews, **omit** it.

- **Don’t mount auth inside a web app** at `/auth`; your Frontrow rewrite sends almost everything to `/api/server`. Keeping auth on its own domain avoids this entire class of conflicts.

- **Document the convention** in your repo README (top-level “Conventions” section: “Auth lives at /auth on auth.dayof.ai; clients must set baseURL”).

If you want, I can add a short “Conventions” snippet for your README and a `check-env` script that fails builds when `VITE_AUTH_BASE_URL` / `EXPO_PUBLIC_AUTH_BASE_URL` are missing.

---

**Pick `/auth`** for the standalone auth service at `auth.dayof.ai`.
Keep `/api/auth` only as the **proxy path inside your web apps** for local/preview.

### Why `/auth` (for the dedicated service)

- **Separation of concerns:** On `auth.dayof.ai`, `/auth/*` makes it obvious those endpoints are authentication—not a general “API.” You keep `/api/*` free on that service for anything else you may add later (internal admin, metrics, etc.).
- **Fewer collisions / rewrites:** Your web apps already use `/api` for SSR (`/api/server`) and other things. Using `/auth` upstream avoids mental collisions with existing `/api/*` uses across services.
- **Clarity in tooling & logs:** Grepping, dashboards, WAF rules, and observability are cleaner when the path clearly encodes the concern (`/auth`).
- **No cookie downside:** Better Auth sets `Path=/` by default; choosing `/auth` vs `/api/auth` doesn’t change cookie behavior. You’ll still scope `Domain=dayof.ai` in prod and omit it in previews.

### When would `/api/auth` be better?

- If auth lived **inside the same Vercel project** as a web app (and not on its own domain). Then staying under `/api/*` helps avoid SPA router conflicts. That’s **not** your setup.

### Concrete plan for your repo

- **Auth service (Vercel project `auth`)**: mount Better Auth at **`/auth/*`** and set
  `BETTER_AUTH_URL=https://auth.dayof.ai/auth`.
- **Prod web apps** (`dayof.ai` and `app.dayof.ai`): set
  `VITE_AUTH_BASE_URL=https://auth.dayof.ai/auth`.
- **Preview/local web apps**: keep **proxy** at `/api/auth/*` that forwards to the auth service’s `/auth/*`. Set
  `VITE_AUTH_BASE_URL=/api/auth` and `AUTH_PROXY_BASE=https://<your-auth-preview>/auth`.
- **Expo app**: set
  `EXPO_PUBLIC_AUTH_BASE_URL=https://auth.dayof.ai/auth`.

That gives you a clean, intention‑revealing URL on the auth domain, with zero downsides for cookies or clients, and preserves the nice dev/preview behavior via the per‑app `/api/auth` proxy.

---

> **Pick /auth** for the standalone auth service at auth.dayof.ai.
> Keep /api/auth only as the **proxy path inside your web apps** for local/preview.

What about our plan needs to change for this?

---

Short version: **nothing material changes**. The patch I gave you already implements the “/auth on the standalone service + /api/auth proxy in the web apps” model. If you apply it as‑is, you’re aligned with the decision.

That said, here’s the **delta checklist** so you can sanity‑scan what actually depends on the choice of `/auth` vs `/api/auth`:

---

## What must match the `/auth` decision

### 1) Auth service (apps/auth)

- **Mount path:** handler mounted at `/auth/*` (not `/api/auth/*`).
- **Base URL:** `BETTER_AUTH_URL` **includes the path**
  `https://auth.dayof.ai/auth`
- **Cookies (prod only):** `AUTH_COOKIE_DOMAIN=dayof.ai` (share across **dayof.ai** ↔ **app.dayof.ai**).
- **CORS allowlist:** `ALLOWED_ORIGINS=https://dayof.ai,https://app.dayof.ai` (+ locals/previews).
- **Runtime:** Node (unchanged).

> If you ever switch to `/api/auth` on the auth service, you’d need to change both the mount path and every client’s `baseURL`. Otherwise, keep it on `/auth` and you’re done.

### 2) Web apps (frontrow, backstage)

- **Client `baseURL`:** point to `/auth` in prod, **proxy** in dev/preview:
  - **Prod:** `VITE_AUTH_BASE_URL=https://auth.dayof.ai/auth`
  - **Dev/Preview:** `VITE_AUTH_BASE_URL=/api/auth`

- **Proxy forward target:** must end with `/auth`
  `AUTH_PROXY_BASE=https://<your-auth-preview-or-staging>/auth`
- **No changes** to your app API base (`VITE_SERVER_URL`) or ORPC code.

> Routing note: your `/api/auth.ts` filesystem function **wins before** Frontrow’s catch‑all rewrite to `/api/server`, so no extra vercel.json edits are needed.

### 3) Expo (Crew)

- **Client `baseURL`:** absolute, includes `/auth`
  `EXPO_PUBLIC_AUTH_BASE_URL=https://auth.dayof.ai/auth`
- Leave `EXPO_PUBLIC_SERVER_URL` as‑is for your own API.
- The Expo plugin keeps storing & sending the session cookie; nothing else changes.

### 4) Other services (events/Inngest, honoken)

- No change required. If you later want those services to **read** the session, forward the cookie you already carry in web/Expo when calling them.

---

## Things that **don’t** change (but people often break)

- **Cookie behavior:** Using `/auth` vs `/api/auth` doesn’t change cookies. In **prod**, you set `Domain=dayof.ai`. In **previews/dev**, you **omit** `AUTH_COOKIE_DOMAIN` so cookies are host‑only (that’s why we proxy through `/api/auth`).
- **Client defaults:** Don’t rely on defaults. Always set `baseURL` explicitly (server and all clients). If someone forgets, they’ll try `/api/auth` and get 404s.

---

## Quick validation flow

- **Prod web:** Sign in on `dayof.ai` → `Set-Cookie` shows `Domain=dayof.ai`. Navigate to `app.dayof.ai` → still signed in.
- **Preview web:** Sign in on a preview URL → `Set-Cookie` has **no Domain** (host‑only). Works without any third‑party cookie issues because we go through `/api/auth`.
- **Expo:** Sign in → subsequent calls carry the stored cookie; no browser SameSite rules involved.

---

### Bottom line

You don’t need to change anything beyond what’s already in the diffs:

- Keep **auth service at `/auth`**.
- Keep **web proxies at `/api/auth`** only for dev/preview.
- Set the envs exactly as above.

If you want, I can add a tiny **README “Conventions”** section and a `check-env` script that fails builds when `VITE_AUTH_BASE_URL` / `EXPO_PUBLIC_AUTH_BASE_URL` aren’t set, so no one accidentally relies on defaults.

---

Perfect — here are **ready‑to‑commit diffs** that add a concise “Conventions” section to your root README and a detailed conventions doc under `context/docs/`.

---

### 1) `README.md` → add a high‑level **Conventions** section (links to the full doc)

```diff
diff --git a/README.md b/README.md
index 8f2a3e5..d1b3b9c 100644
--- a/README.md
+++ b/README.md
@@ -66,3 +66,43 @@ Use the Expo Go app to run the mobile application.
 The API is running at [http://localhost:3000](http://localhost:3000).

 ## Project Structure
@@ -102,3 +142,43 @@ dayof/
 - `bun dev:server`: Start only the server
 - `bun check-types`: Check TypeScript types across all apps
 - `bun dev:native`: Start the React Native/Expo development server
 - `bun db:push`: Push schema changes to database
 - `bun db:studio`: Open database studio UI
+
+## Conventions (Auth, URLs, Cookies)
+
+**Auth is a dedicated Hono service** deployed as its own Vercel project at `auth.dayof.ai`, mounted at the path **`/auth`** (not `/api/auth`). All clients MUST set the full base URL including that path.
+
+**Production**
+- Web apps live at **`https://dayof.ai`** (Frontrow) and **`https://app.dayof.ai`** (Backstage).
+- Auth base URL: `https://auth.dayof.ai/auth`
+- Better Auth cookie scope: `Domain=dayof.ai` (shared apex ↔ subdomains), `Secure`, `HttpOnly`, default `SameSite=Lax`.
+- Web clients env: `VITE_AUTH_BASE_URL=https://auth.dayof.ai/auth`
+- Expo env: `EXPO_PUBLIC_AUTH_BASE_URL=https://auth.dayof.ai/auth`
+
+**Local & Vercel Previews**
+- Do **not** set a cookie `Domain`. Cookies must be **host‑only**.
+- Each web app exposes a **proxy route**: `/api/auth/*` → upstream auth `.../auth/*`.
+- Web clients env: `VITE_AUTH_BASE_URL=/api/auth` and set `AUTH_PROXY_BASE` to your auth preview URL (must include `/auth`).
+
+**Never mount auth inside a web app**. Keep auth on `auth.dayof.ai`. Web apps only proxy in dev/preview for host‑only cookies.
+
+**Always set baseURL explicitly** on server & clients. Do **not** rely on Better Auth defaults.
+
+See the full policy and examples in [`context/docs/auth-conventions.md`](context/docs/auth-conventions.md).
```

---

### 2) `context/docs/auth-conventions.md` → full, precise **Auth Conventions** (new)

````diff
diff --git a/context/docs/auth-conventions.md b/context/docs/auth-conventions.md
new file mode 100644
--- /dev/null
+++ b/context/docs/auth-conventions.md
@@ -0,0 +1,294 @@
+# Auth Conventions (Better Auth + Hono)
+
+These conventions define how we run authentication across the monorepo (web apps, Expo app, and services).
+
+> TL;DR
+> **Auth lives at `https://auth.dayof.ai/auth` (standalone Hono service).**
+> Web apps **proxy `/api/auth/*` → auth** only in **local/preview**.
+> **Production cookies** use `Domain=dayof.ai` to share sessions between **dayof.ai** and **app.dayof.ai**.
+
+---
+
+## Terms
+
+- **Auth Service**: Vercel project at `auth.dayof.ai`, Hono app, Better Auth mounted under `/auth`.
+- **Frontrow**: Web app at `https://dayof.ai`.
+- **Backstage**: Web app at `https://app.dayof.ai`.
+- **Crew**: Expo (React Native) app.
+- **Services**: `events` (Inngest/Hono), `honoken` (PassKit Web Service).
+
+---
+
+## 1) URLs & Paths
+
+- **Auth Service path**: `/auth` (not `/api/auth`).
+  Server env: `BETTER_AUTH_URL=https://auth.dayof.ai/auth`
+
+- **Web apps (prod)** call auth **directly**:
+  `VITE_AUTH_BASE_URL=https://auth.dayof.ai/auth`
+
+- **Web apps (local/preview)** call auth via **proxy**:
+  - Client base URL: `VITE_AUTH_BASE_URL=/api/auth`
+  - Edge function forwards `/api/auth/*` → `${AUTH_PROXY_BASE}/*`
+  - Env: `AUTH_PROXY_BASE=https://<auth-preview-or-staging>.vercel.app/auth` (must include `/auth`)
+
+- **Expo** always calls auth directly (no proxy):
+  `EXPO_PUBLIC_AUTH_BASE_URL=https://auth.dayof.ai/auth`
+
+- **Do not mount auth under any app’s `/api`**. Keep it as a dedicated service.
+
+---
+
+## 2) Cookies & SameSite Policy
+
+**Production**
+- Better Auth sets `Domain=dayof.ai` (apex). This shares the session across `dayof.ai` and `app.dayof.ai`.
+- `Secure`, `HttpOnly`, default `SameSite=Lax` are required/safe and work across apex ↔ subdomain (they are considered **same‑site**).
+- Server env (prod only): `AUTH_COOKIE_DOMAIN=dayof.ai`
+
+**Local & Preview**
+- **Do not** set a cookie `Domain`. Cookies must be **host‑only**.
+- Browsers will not accept parent domains on public‑suffix hosts like `*.vercel.app`; the proxy makes cookies same‑origin per preview host.
+- We keep `/api/auth/*` proxy in each web app so the response that sets the cookie comes **from the app’s own host**.
+
+**Expo**
+- The Expo client plugin stores/sends the cookie via `SecureStore`. Browser SameSite rules do not apply.
+
+---
+
+## 3) CORS & Trusted Origins
+
+- The Auth Service uses an allowlist. In **prod**:
+  - `ALLOWED_ORIGINS=https://dayof.ai,https://app.dayof.ai`
+- In **local/preview**, include: `http://localhost:3001`, `http://localhost:5173`, and any preview origins you need.
+- `credentials: true` must be enabled; the Better Auth React client handles it. Expo plugin attaches the cookie explicitly.
+- Trusted origins should also be set in Better Auth options (we centralize via env).
+
+---
+
+## 4) Runtimes
+
+- **Auth Service**: Vercel **Node** runtime (DB driver compatibility).
+- **Web app proxies**: **Edge** runtime (simple fetch forwarder).
+- **Frontrow SSR**: Edge (existing).
+- **Events/Honoken**: unchanged.
+
+---
+
+## 5) Environment Variables (by project)
+
+### Auth Service (`apps/auth`)
+
+Required:
+```
+DATABASE_URL=postgres://...
+BETTER_AUTH_SECRET=...                 # long random string
+BETTER_AUTH_URL=https://auth.dayof.ai/auth
+ALLOWED_ORIGINS=https://dayof.ai,https://app.dayof.ai,http://localhost:3001,http://localhost:5173
+```
+
+Production‑only:
+```
+AUTH_COOKIE_DOMAIN=dayof.ai            # share across apex + subdomains
+```
+
+Preview/Dev:
+```
+# Do NOT set AUTH_COOKIE_DOMAIN here.
+BETTER_AUTH_URL=https://<auth-preview>.vercel.app/auth
+ALLOWED_ORIGINS=<add your preview origins + locals>
+```
+
+### Web Apps (Frontrow, Backstage)
+
+Production:
+```
+VITE_AUTH_BASE_URL=https://auth.dayof.ai/auth
+# AUTH_PROXY_BASE unset in prod
+```
+
+Preview/Dev:
+```
+VITE_AUTH_BASE_URL=/api/auth
+AUTH_PROXY_BASE=https://<auth-preview-or-staging>.vercel.app/auth
+```
+
+### Expo (Crew)
+
+All envs:
+```
+EXPO_PUBLIC_AUTH_BASE_URL=https://auth.dayof.ai/auth
+# EXPO_PUBLIC_SERVER_URL remains for your own API base (e.g., ORPC)
+```
+
+---
+
+## 6) Client Configuration
+
+### Web (React + TanStack Start)
+
+```ts
+// apps/*/src/lib/auth-client.ts
+import { createAuthClient } from "better-auth/react";
+
+export const authClient = createAuthClient({
+  // Prod: https://auth.dayof.ai/auth
+  // Dev/Preview: /api/auth (proxy path)
+  baseURL: import.meta.env.VITE_AUTH_BASE_URL!,
+});
+```
+
+### Expo (React Native)
+
+```ts
+import { createAuthClient } from "better-auth/react";
+import { expoClient } from "@better-auth/expo/client";
+import * as SecureStore from "expo-secure-store";
+
+export const authClient = createAuthClient({
+  baseURL: process.env.EXPO_PUBLIC_AUTH_BASE_URL!, // absolute, includes /auth
+  plugins: [
+    expoClient({
+      scheme: "dayof",             // set your deep-link scheme
+      storagePrefix: "dayof-crew",
+      storage: SecureStore,
+    }),
+  ],
+});
+```
+
+### Web Proxy (Edge function)
+
+```ts
+// apps/<app>/api/auth.ts
+export const config = { runtime: "edge" };
+const AUTH_PROXY_BASE = process.env.AUTH_PROXY_BASE!;
+export default async function handler(req: Request) {
+  const url = new URL(req.url);
+  const upstream = new URL(url.pathname.replace(/^\/api\/auth/, "") + url.search, AUTH_PROXY_BASE);
+  return fetch(upstream.toString(), {
+    method: req.method,
+    headers: req.headers,
+    body: ["GET","HEAD"].includes(req.method) ? undefined : req.body,
+    redirect: "manual",
+  });
+}
+```
+
+---
+
+## 7) Database & Adapters
+
+- Use Neon + Drizzle. The auth service imports our shared `database/db` client.
+- Ensure Better Auth tables are generated/migrated. Keep schema in `packages/database/schema` if you want it versioned with the rest of the DB.
+- The auth service runs on the Node runtime so the Neon fetch client works reliably.
+
+---
+
+## 8) Adding a New Web Client
+
+1. Create `.env` with:
+   - **Prod**: `VITE_AUTH_BASE_URL=https://auth.dayof.ai/auth`
+   - **Preview/Dev**: `VITE_AUTH_BASE_URL=/api/auth` and `AUTH_PROXY_BASE=https://<auth-preview>/auth`
+2. Add `/api/auth.ts` proxy (Edge) identical to the other web apps.
+3. Use the standard `authClient` import and call `authClient.signIn.*`, `authClient.signUp.*`, etc.
+4. Verify:
+   - Preview cookie is **host‑only** (no `Domain` attribute).
+   - Prod cookie shows `Domain=dayof.ai` and the session is shared with other hosts under the domain.
+
+---
+
+## 9) Security Rules
+
+- **Do not** set `AUTH_COOKIE_DOMAIN` in local/preview.
+- Only allow trusted origins (set `ALLOWED_ORIGINS`).
+- Leave `HttpOnly` and `Secure` on. Use HTTPS everywhere.
+- If you ever host untrusted tools under `*.dayof.ai`, consider isolating them on a separate registrable domain so shared cookies aren’t exposed.
+- Don’t rely on public‑suffix domains (`*.vercel.app`) for cross‑subdomain cookies; they are intentionally blocked by browsers.
+
+---
+
+## 10) Testing & Troubleshooting
+
+### Production sanity checks
+1. Sign in on **`https://dayof.ai`** → confirm `Set-Cookie` includes `Domain=dayof.ai`.
+2. Navigate to **`https://app.dayof.ai`** → user is already authenticated.
+
+### Preview sanity checks
+1. Sign in on a **preview** URL → `Set-Cookie` **does not** include `Domain`, and is stored for that host only.
+2. Repeat on another preview → sessions are isolated (host‑only).
+
+### Common mistakes
+- Missing/incorrect `baseURL` (clients default to `/api/auth` and 404).
+- Proxy misconfigured (missing `/auth` at the end of `AUTH_PROXY_BASE`).
+- Setting cookie domain on preview (breaks because public‑suffix).
+
+---
+
+## 11) Service Interaction Notes
+
+- **Events (Inngest)**: if auth should emit events (e.g., `user/signed_in`), use Better Auth hooks and `fetch` the events endpoint from the auth service. Keep workflows in the events service.
+- **Honoken**: keep its `/api/v1/...` routes independent. If it needs the session, forward the cookie from callers.
+- **ORPC (`/rpc`)** remains our own app API and is independent of the auth service pathing.
+
+---
+
+## 12) Why `/auth` (not `/api/auth`)?
+
+- Clear separation of concerns: the auth service can still expose its own `/api/*` for unrelated admin/endpoints later.
+- Avoids mental and rewrite collisions with existing app‑level `/api/*` (SSR, RPC, etc.).
+- Cookie behavior is identical either way; path choice doesn’t affect it.
+- The only requirement is: **always** set the base URL explicitly on server and clients.
+
+---
+
+## 13) Quick Reference (copy/paste)
+
+**Auth Service (prod)**
+```
+BETTER_AUTH_URL=https://auth.dayof.ai/auth
+AUTH_COOKIE_DOMAIN=dayof.ai
+ALLOWED_ORIGINS=https://dayof.ai,https://app.dayof.ai
+```
+
+**Auth Service (preview)**
+```
+BETTER_AUTH_URL=https://<auth-preview>.vercel.app/auth
+# Do not set AUTH_COOKIE_DOMAIN
+ALLOWED_ORIGINS=<preview-web-origins>,http://localhost:3001,http://localhost:5173
+```
+
+**Frontrow/Backstage (prod)**
+```
+VITE_AUTH_BASE_URL=https://auth.dayof.ai/auth
+```
+
+**Frontrow/Backstage (preview/dev)**
+```
+VITE_AUTH_BASE_URL=/api/auth
+AUTH_PROXY_BASE=https://<auth-preview-or-staging>.vercel.app/auth
+```
+
+**Crew (Expo)**
+```
+EXPO_PUBLIC_AUTH_BASE_URL=https://auth.dayof.ai/auth
+```
+
+---
+
+## 14) Migration Notes (if we change paths later)
+
+If we ever switch the auth mount path (e.g., `/auth` → `/api/auth`):
+1. Change `BETTER_AUTH_URL` on the auth service to the **new full URL including the path**.
+2. Update **all** clients’ `baseURL` envs to the same path.
+3. Update proxy functions’ `AUTH_PROXY_BASE` to include the new path.
+4. Smoke test prod + preview cookie behavior again.
+
+---
+
+_Last updated:_ keep this doc consistent with any changes to auth pathing, cookie policy, or origin policy.
````

---

If you want, I can also add a tiny `scripts/check-env.ts` (or a package.json script) that fails builds when `VITE_AUTH_BASE_URL` / `EXPO_PUBLIC_AUTH_BASE_URL` are missing in web/Expo apps and when `BETTER_AUTH_URL` is missing in the auth service.

</plan>
