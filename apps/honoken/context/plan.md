# PassKit Web Service Compliance — Test‑First Remediation Plan

Status: proposed and validated

This plan closes the compliance gaps identified during the hunt by enforcing authentication on the “List Updated Serials” endpoint, hardening conditional GET behavior in the smoke app to mirror production, and aligning cache headers in tests.

Primary targets:

- Add auth to List Updated Serials in production [createV1App()](apps/honoken/src/index.ts:198).
- Update smoke app behavior for the same route [createV1App()](apps/honoken/src/index.smoke.ts:220) to require ApplePass auth so smoke tests become strict.
- Ensure smoke 304 responses include ETag/Last-Modified/Cache-Control (mirrors [pkpassEtagMiddleware](apps/honoken/src/middleware/pkpass-etag.ts:146)).
- Align unit test expectations for Cache-Control with production ([cache-headers-simple.test.ts](apps/honoken/tests/unit/cache-headers-simple.test.ts:12) vs [pkpassEtagMiddleware](apps/honoken/src/middleware/pkpass-etag.ts:148)).

---

## Validation of the Approach

From the spec/behavior perspective

- Authentication: Apple’s PassKit web service requires an Authorization: ApplePass {token} header for sensitive endpoints, including device registrations and listing updated serials. Production currently wires the list route without auth [createV1App()](apps/honoken/src/index.ts:198-201). The smoke app mirrors that behavior [createV1App()](apps/honoken/src/index.smoke.ts:220-224). Tightening both is correct and spec‑aligned.
- Route semantics: The list route lacks a serialNumber parameter, so the existing [applePassAuthMiddleware](apps/honoken/src/middleware/auth.ts:10) (which validates a specific {type, serial}) cannot be used as-is. A device+type aware check is needed: token must match any pass of the given passTypeIdentifier that is actively registered for the requesting device. This keeps auth bound to actual pass ownership, not a loose token match.

From the architecture/codebase perspective

- Middleware placement: Production already authenticates pass download with [applePassAuthMiddleware](apps/honoken/src/middleware/auth.ts:10) and handles conditional caching via [pkpassEtagMiddleware](apps/honoken/src/middleware/pkpass-etag.ts:100). Adding a list‑specific auth middleware is consistent with the current layered approach.
- Data model/indexes: The Drizzle schema gives us:
  - passes: composite PK on (passTypeIdentifier, serialNumber) and index on updatedAt ([schema](apps/honoken/src/db/schema.ts:61)).
  - registrations: composite PK on (deviceLibraryIdentifier, passTypeIdentifier, serialNumber) plus indexes including (deviceLibraryIdentifier, active) and pass reference index ([schema](apps/honoken/src/db/schema.ts:107)).
    These are sufficient to implement an efficient EXISTS/INNER JOIN check for the list auth middleware.
- Test strategy: Smoke tests use the smoke app [index.smoke.ts](apps/honoken/src/index.smoke.ts:1), not production [index.ts](apps/honoken/src/index.ts:1). Therefore, tests must be made strict and the smoke app must be updated to enforce ApplePass header for the list route; otherwise stricter tests will fail for the wrong reason.

Cache/caching semantics

- Production sets “no-cache, no-store, must-revalidate” on pass responses ([pkpassEtagMiddleware](apps/honoken/src/middleware/pkpass-etag.ts:148,175,200)). Unit tests currently assert “no-store, must-revalidate” only ([cache-headers-simple.test.ts](apps/honoken/tests/unit/cache-headers-simple.test.ts:12)). Aligning tests to the stricter production setting is appropriate and safe for Wallet clients.
- RFC 7232 compliance for 304: Production correctly includes ETag and Last‑Modified on 304 paths ([pkpassEtagMiddleware](apps/honoken/src/middleware/pkpass-etag.ts:146-176)). Smoke app should do the same so tests can assert header presence reliably.

Risks and mitigations

- Existing client assumptions: If any test helper or demo caller relied on unauthenticated list access, they will now receive 401. Mitigation: smoke app continues to accept a documented test token ("valid-test-token") for happy-path flows.
- Query cost: The new middleware runs a simple joined lookup on indexed columns. Low risk; if needed, we can add composite indexes later.
- Token sprawl: The middleware matches token to a pass row; this keeps tokens scoped to real passes rather than “any token”.

---

## Step-by-Step Implementation Guide

All commands should be run with Bun. To run tests:

- bun run test

We will implement test-first for each change.

### 1) Strengthen smoke tests for List Updated Serials (unauthorized cases)

Touched file: [http-endpoints.test.ts](apps/honoken/tests/smoke/http-endpoints.test.ts:347)

Add two tests under “List Updated Serials”:

- Without Authorization → 401
- With Authorization: ApplePass wrong-token → 401

Example additions:

```ts
it("should return 401 when listing updated serials without Authorization", async () => {
  const path = `/v1/devices/${TEST_DEVICE_ID}/registrations/${TEST_PASS_TYPE}`;
  const req = new Request(`http://localhost${path}`);
  const res = await appFetch(req, mockEnv, mockContext);
  expect(res.status).toBe(401);
});

it("should return 401 when Authorization uses wrong token", async () => {
  const path = `/v1/devices/${TEST_DEVICE_ID}/registrations/${TEST_PASS_TYPE}`;
  const req = new Request(`http://localhost${path}`, {
    headers: { Authorization: "ApplePass wrong-token" },
  });
  const res = await appFetch(req, mockEnv, mockContext);
  expect(res.status).toBe(401);
});
```

Add one positive test to validate happy path:

```ts
it("should allow listing updated serials with valid ApplePass token", async () => {
  const path = `/v1/devices/${TEST_DEVICE_ID}/registrations/${TEST_PASS_TYPE}`;
  const req = new Request(`http://localhost${path}`, {
    headers: { Authorization: "ApplePass valid-test-token" },
  });
  const res = await appFetch(req, mockEnv, mockContext);
  expect([200, 204]).toContain(res.status);
  if (res.status === 200) {
    const json = await res.json();
    expect(json).toEqual({
      serialNumbers: expect.any(Array),
      lastUpdated: expect.any(String),
    });
  }
});
```

Why: Makes the test suite actually catch missing auth on the list route.

### 2) Enforce auth in smoke app for List Updated Serials

Touched file: [index.smoke.ts](apps/honoken/src/index.smoke.ts:177)

Update `handleListUpdatedSerials` to match the other smoke handlers’ auth style ([handleRegisterDevice](apps/honoken/src/index.smoke.ts:127), [handleUnregisterDevice](apps/honoken/src/index.smoke.ts:142)):

```ts
const handleListUpdatedSerials = async (c: any) => {
  const auth = c.req.header("authorization");
  if (!auth || !auth.startsWith("ApplePass ")) {
    return c.json({ error: "Invalid authorization" }, 401);
  }
  const token = auth.replace("ApplePass ", "");
  if (token !== "valid-test-token") {
    return c.json({ error: "Invalid authorization token" }, 401);
  }

  const result = await mockStorage.listUpdatedSerials();
  if (!result || result.serialNumbers.length === 0) {
    return c.body(null, 204);
  }
  return c.json(result, 200);
};
```

Why: Keeps smoke behavior aligned with production intent, enabling strict tests.

### 3) Add production auth for List Updated Serials via a new middleware

Touched files:

- [auth.ts](apps/honoken/src/middleware/auth.ts:1)
- [index.ts](apps/honoken/src/index.ts:198)

Implement `applePassAuthForListMiddleware()` in [auth.ts](apps/honoken/src/middleware/auth.ts:1):

```ts
import { Context, Next } from "hono";
import { getDbClient } from "../db";
import { passes, registrations } from "../db/schema";
import { and, eq } from "drizzle-orm";
import type { Env } from "../types";
import { createLogger } from "../utils/logger";

export async function applePassAuthForListMiddleware(
  c: Context<{ Bindings: Env }>,
  next: Next
) {
  const logger = createLogger(c);
  const { deviceLibraryIdentifier, passTypeIdentifier } = c.req.param();
  const auth = c.req.header("Authorization");

  if (!deviceLibraryIdentifier || !passTypeIdentifier) {
    logger.error("List auth middleware error: missing params", {});
    return c.json({ message: "Bad Request: Missing required parameters" }, 400);
  }

  if (!auth || !auth.startsWith("ApplePass ")) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  const token = auth.substring(10).trim();
  if (!token) return c.json({ message: "Unauthorized" }, 401);

  const db = getDbClient(c.env, logger);

  // Does this device have an active registration for a pass of this type
  // whose authenticationToken matches the provided token?
  const match = await db
    .select({ serialNumber: passes.serialNumber })
    .from(passes)
    .innerJoin(
      registrations,
      and(
        eq(registrations.passTypeIdentifier, passes.passTypeIdentifier),
        eq(registrations.serialNumber, passes.serialNumber)
      )
    )
    .where(
      and(
        eq(passes.passTypeIdentifier, passTypeIdentifier),
        eq(passes.authenticationToken, token),
        eq(registrations.deviceLibraryIdentifier, deviceLibraryIdentifier),
        eq(registrations.active, true)
      )
    )
    .limit(1);

  if (!match || match.length === 0) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  await next();
}
```

Wire it into the list route in [index.ts](apps/honoken/src/index.ts:198):

```ts
v1.get(
  "/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier",
  zValidator("param", DevicePassRegistrationsParamsSchema, formatZodError),
  applePassAuthForListMiddleware, // ← add this
  handleListUpdatedSerials
);
```

Why: Auth on list route becomes equivalent in strength to other endpoints, but adapted to its semantics.

### 4) Harden smoke 304 Not Modified to include required headers

Touched file: [index.smoke.ts](apps/honoken/src/index.smoke.ts:157)

Update the 304 path in `handleGetPassFile` to mirror production’s [pkpassEtagMiddleware](apps/honoken/src/middleware/pkpass-etag.ts:146-176):

```ts
const handleGetPassFile = async (c: any) => {
  const authHeader = c.req.header("authorization");
  if (!authHeader || !authHeader.startsWith("ApplePass ")) {
    return c.json({ error: "Invalid authorization" }, 401);
  }
  const token = authHeader.replace("ApplePass ", "");
  if (token !== "test-auth-smoke-12345") {
    return c.json({ error: "Invalid authorization token" }, 401);
  }

  const testEtag = '"test-etag"';
  const ifNoneMatch = c.req.header("if-none-match");
  const lastModified = new Date().toUTCString();

  if (ifNoneMatch === testEtag) {
    c.header("ETag", testEtag);
    c.header("Last-Modified", lastModified);
    c.header("Cache-Control", "no-cache, no-store, must-revalidate");
    return c.body(null, 304);
  }

  // For simplicity in smoke mode we still return a 404 (after auth),
  // but ensure headers are present for 200 paths in case we extend later.
  c.header("ETag", testEtag);
  c.header("Last-Modified", lastModified);
  c.header("Cache-Control", "no-cache, no-store, must-revalidate");
  return c.json({ error: "Pass not found" }, 404);
};
```

Why: Tests can assert RFC‑compliant header presence reliably.

### 5) Align Cache-Control expectations in unit tests

Touched file: [cache-headers-simple.test.ts](apps/honoken/tests/unit/cache-headers-simple.test.ts:12)

Change expectations from `'no-store, must-revalidate'` to `'no-cache, no-store, must-revalidate'` (all three places in the file where Cache-Control is asserted).

Why: Matches production’s stricter header set ([pkpassEtagMiddleware](apps/honoken/src/middleware/pkpass-etag.ts:148,175,200)).

### 6) Tighten any remaining lenient status assertions (follow‑up)

Search in [http-endpoints.test.ts](apps/honoken/tests/smoke/http-endpoints.test.ts:1) for assertions like `expect([200, 204, 401])` and progressively replace with exact expectations where deterministic (e.g., unauthenticated → 401). Keep leniency only where the smoke app intentionally returns multiple possible outcomes.

Why: Makes the smoke suite an early warning system for compliance regressions.

### 7) Run the suite

- bun run test

Iterate until green. If DB‑backed tests encounter missing env, ensure mock env is used as in existing tests.

---

## Rollback Plan

- To revert the auth behavior on the list route quickly, remove `applePassAuthForListMiddleware` from [createV1App()](apps/honoken/src/index.ts:198) and revert the smoke app’s list handler to unconditional JSON response [handleListUpdatedSerials](apps/honoken/src/index.smoke.ts:177).
- The middleware addition is self‑contained in [auth.ts](apps/honoken/src/middleware/auth.ts:1).

---

## Acceptance Criteria

- Smoke tests:
  - Listing updated serials without Authorization returns 401.
  - Listing with `Authorization: ApplePass wrong-token` returns 401.
  - Listing with `Authorization: ApplePass valid-test-token` returns 200 or 204; if 200 the response structure equals `{ serialNumbers: string[], lastUpdated: string }`.
- 304 behavior:
  - When `If-None-Match` matches, smoke returns 304 with ETag, Last‑Modified, and Cache‑Control present.
- Cache headers unit tests:
  - Updated assertions pass with `'no-cache, no-store, must-revalidate'`.
- No regressions on existing tests.

---

## Appendix: Middleware pseudocode rationale

Why device+type token verification?

- The list route lacks a serial parameter. Validating that the presented token belongs to any pass of `passTypeIdentifier` that is actively registered for `deviceLibraryIdentifier` ensures:
  - The token is genuine (matches a real pass row in [passes](apps/honoken/src/db/schema.ts:61)).
  - The device is entitled to updates for that pass type (checked via [registrations](apps/honoken/src/db/schema.ts:107), active=true).

This mirrors how Apple expects servers to guard update listing—by the pass’s authentication token, scoped to the device’s active registrations.

## Initial Assessment

<initial-assessment>

First, I map the territory. The trail is clear: the smoke app powers these smoke tests, not the production app. The “List Updated Serials” route in production [createV1App()](apps/honoken/src/index.ts:177) attaches only Zod validation and calls [handleListUpdatedSerials](apps/honoken/src/routes/listUpdatedSerialsRoute.ts). No auth middleware there. The smoke app [createV1App()](apps/honoken/src/index.smoke.ts:195) mirrors that omission; its [handleListUpdatedSerials](apps/honoken/src/index.smoke.ts:177) returns JSON without any auth check.

My hunch solidifies: we can’t just write tests and fix only production—these smoke tests exercise the smoke app. If we assert 401 here, we must update both: production routes and the smoke app mock.

Hunt map

```mermaid
sequenceDiagram
  participant T as Tests
  participant S as Smoke App [apps/honoken/src/index.smoke.ts]
  participant P as Prod App [apps/honoken/src/index.ts]
  participant H as listUpdatedSerials() [apps/honoken/src/storage.ts]

  T->>S: GET /v1/devices/:device/registrations/:type (no Authorization)
  Note right of S: Current behavior: no auth → 200/204
  T->>P: (Coverage later) same route
  Note right of P: No auth middleware on this route
  S->>H: listUpdatedSerials(...) (no token check)
  H-->>S: result → 200/204
  Note over T,S,P: We want 401 without valid ApplePass token.
```

Top suspects (ranked)

1. Missing auth on List Updated Serials in both production and smoke app

- Evidence: [createV1App()](apps/honoken/src/index.ts:198-201) wires only zValidator, not [applePassAuthMiddleware](apps/honoken/src/middleware/auth.ts:10). The smoke app does the same.

2. Test leniency hides the bug

- Evidence: [http-endpoints.test.ts](apps/honoken/tests/smoke/http-endpoints.test.ts:354-359) allows [200, 204, 401] for the list-serials route, so it never flags the missing 401.

3. 304 Not Modified header completeness in smoke app

- Evidence: Smoke handler for 304 path lacks guaranteed ETag/Last-Modified mirroring production’s [pkpassEtagMiddleware](apps/honoken/src/middleware/pkpass-etag.ts:146-176,193-202).

4. Cache-Control header mismatch in unit test vs prod

- Evidence: Production sets 'no-cache, no-store, must-revalidate' ([pkpassEtagMiddleware](apps/honoken/src/middleware/pkpass-etag.ts:148,175,200)) while unit test expects 'no-store, must-revalidate' ([cache-headers-simple.test.ts](apps/honoken/tests/unit/cache-headers-simple.test.ts:12,21,38,60)).

Plan of attack (test-first, in order)

- Task 1: Enforce 401 on List Updated Serials
  - Add smoke tests:
    - GET without Authorization → 401
    - GET with Authorization: ApplePass wrong-token → 401
    - GET with Authorization: ApplePass valid-test-token → 200 or 204, with correct response shape when 200
  - Update the smoke app [handleListUpdatedSerials](apps/honoken/src/index.smoke.ts:177) to check the header like the other smoke handlers:
    - Reject if header missing or format wrong (non-ApplePass or no token)
    - Accept only 'valid-test-token' (consistent with other smoke routes)
  - Update production app routes to attach auth to the list route:
    - In [createV1App()](apps/honoken/src/index.ts:198-201), insert [applePassAuthMiddleware](apps/honoken/src/middleware/auth.ts:10). Caveat: that middleware expects passTypeIdentifier and serialNumber; this route has no serialNumber. We must implement a device-level auth variant.

  Critical design note: Apple’s spec ties auth to the pass’s authenticationToken. The list endpoint doesn’t include serialNumber in the path, so the existing middleware can’t query a single pass row to verify a token. Practical server patterns:
  - Accept any ApplePass token for the passTypeIdentifier that belongs to a pass the device is registered for, or
  - Verify the token matches any (passTypeIdentifier, serialNumber) pair that is registered for that device.

  Minimal, spec-aligned path forward for this codebase:
  - Create a new middleware applePassAuthForListMiddleware(passTypeIdentifier, deviceLibraryIdentifier): verify Authorization header token belongs to any pass with the given passTypeIdentifier that is registered to that device (active). If true → next(); else 401. This avoids guessing a serial number and matches the route semantics.
  - Wire this new middleware for the list route in production.

- Task 2: Harden 304 Not Modified in smoke path
  - Enhance smoke handler [handleGetPassFile](apps/honoken/src/index.smoke.ts:157-175) to set ETag and Last-Modified on 304 and 200 responses, mirroring [pkpassEtagMiddleware](apps/honoken/src/middleware/pkpass-etag.ts:146-176,193-202).
  - Extend smoke tests to assert presence of ETag and Last-Modified on 304 responses.

- Task 3: Align Cache-Control expectations
  - Update [cache-headers-simple.test.ts](apps/honoken/tests/unit/cache-headers-simple.test.ts:12,21,38,60) to accept 'no-cache, no-store, must-revalidate' (production’s value). Or, if we prefer the unit test as truth, change production to 'no-store, must-revalidate' consistently. Given pkpass caching semantics, keeping 'no-cache, no-store, must-revalidate' is a safe, stricter setting. I will update the test.

What I will change (concrete)

- New smoke tests in [http-endpoints.test.ts](apps/honoken/tests/smoke/http-endpoints.test.ts):
  - Add:
    - “List Updated Serials without Authorization → 401”
    - “List Updated Serials with invalid token → 401”
    - “List Updated Serials with valid token → 200 or 204; if 200, structure matches { serialNumbers: string[], lastUpdated: string }”
- Smoke app [index.smoke.ts](apps/honoken/src/index.smoke.ts):
  - Update [handleListUpdatedSerials](apps/honoken/src/index.smoke.ts:177) to mirror auth checks used by [handleRegisterDevice](apps/honoken/src/index.smoke.ts:127-140) and [handleUnregisterDevice](apps/honoken/src/index.smoke.ts:142-155):
    - Require ApplePass ... header and accept only 'valid-test-token'
- Production app [index.ts](apps/honoken/src/index.ts):
  - Introduce a new middleware in [apps/honoken/src/middleware/auth.ts](apps/honoken/src/middleware/auth.ts) (e.g., applePassAuthForListMiddleware()) that:
    - Extracts deviceLibraryIdentifier and passTypeIdentifier
    - Extracts Authorization token (ApplePass prefix enforced)
    - Verifies that token equals authenticationToken for any pass row of that passTypeIdentifier that has an active registration for that device (a single JOIN/EXISTS query is enough)
  - Wire it into [createV1App()](apps/honoken/src/index.ts:198-201) before [handleListUpdatedSerials](apps/honoken/src/routes/listUpdatedSerialsRoute.ts:7).
- Smoke app 304 behavior:
  - In [handleGetPassFile](apps/honoken/src/index.smoke.ts:157-175), add ETag/Last-Modified headers consistently for 304 and 200 paths.
- Update unit test expectations:
  - In [cache-headers-simple.test.ts](apps/honoken/tests/unit/cache-headers-simple.test.ts:12,21,38,60), accept 'no-cache, no-store, must-revalidate'.

Request to proceed: switch to Code mode

I’m ready to implement the above changes test-first, then code. I’ll make surgical edits with clear commits and run the suite via bun.

Proposed run steps:

- bun run test
- Fix failing tests iteratively until green.

I will also maintain a TODO board to track progress.

Requesting approval to switch modes to implement changes now.
</initial-assessment>
