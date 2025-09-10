# Honoken Tests Plan

Here’s a tight, low‑risk plan that fixes tests first, keeps changes scoped, and prioritizes Apple spec compliance.

## Step 0 — Baseline

- Current: HTTP endpoints smoke suite passes (good Apple spec signal). Failures stem from:
  - Import-time crash in shared DB relations.
  - Logger tests asserting on console.\*, while logger writes JSON to stdout/stderr.
  - Storage/passkit/certs tests assuming older schema/mocks.

## Step 1 — Unblock test runner (DB relations import crash)

- Goal: Stop the import-time error from `packages/database/schema/relations.ts` so tests can run.
- Change scope: In the database package only.
  - Guard or correct the failing relation in `relations.ts` (the undefined `paymentProvider.id` reference).
  - Ensure schema exports containing wallet tables can load without touching Honoken app code.
- Acceptance:
  - `bun run test` collects tests without crashing before execution.
  - No app-level behavior changes.
- Why this first: It’s a single fix that removes a blocker without cascading through the app.

## Step 2 — Re-run to surface true failures

- Goal: Confirm next layer of failures after DB is stable.
- Change scope: None (run only).
- Acceptance: We have a clean failure list for logger/storage/passkit/certs tests.

## Step 3 — Fix logger tests (don’t change logger code)

- Goal: Make tests assert on what we actually emit.
- Change scope: Tests only.
  - Spy on `process.stdout.write` / `process.stderr.write` and parse the structured JSON lines.
  - Keep expectations (levels, fields, sampling) aligned with current logger behavior.
- Acceptance:
  - All logger and environment-behavior tests pass by observing stdout/stderr JSON, not console.\*.
- Apple-docs impact: None (logger is orthogonal).

## Step 4 — Update storage tests to wallet schema + Apple spec

- Goal: Align tests with current wallet schema usage and Apple Web Service response codes.
- Change scope: Tests/mocks only.
  - Refresh fixtures/mocks for `getDbClient` queries against `wallet_*` tables.
  - Validate status codes per `apple-docs.md`: 201/200 for register, 200/204 for list, 200/401 for get/unregister, etc.
  - Assert `If-None-Match`/`If-Modified-Since` behavior where applicable to list/get.
- Acceptance:
  - Storage tests pass and verify Apple-compliant behavior.

## Step 5 — Update passkit/certs tests to match current code paths

- Goal: Make tests reflect the new pass builder and certificate cache design.
- Change scope: Tests/mocks only.
  - Provide wallet-aware DB mocks (pass row with `id`, pass_type → cert_ref, wallet_pass_content).
  - Mock `VercelBlobAssetStorage` minimal behaviors and PNG header checks.
  - Keep failure-path assertions (missing assets, invalid data, cert errors) intact but schema-aware.
- Acceptance:
  - Passkit/certs tests pass, validating both happy and error paths.

## Step 6 — Apple spec audit tests (top-offs)

- Goal: Ensure complete compliance with `context/docs/apple-docs.md`.
- Change scope: Add/adjust tests only.
  - Register: idempotency 201/200, auth semantics.
  - List updated: 200 payload format with `serialNumbers` and `lastUpdated` (string), 204 when none.
  - Get pass: `Content-Type: application/vnd.apple.pkpass`, conditional 304, auth 401.
  - Unregister: 200/401 semantics.
  - Log: 200 on valid, 400 on empty logs, 413 on oversized.
- Acceptance:
  - New/updated tests pass; behavior matches Apple docs.

If approved, I’ll start with Step 1 (DB relations fix), then re-run tests and proceed sequentially.
