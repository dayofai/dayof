# Jay's Notes

## Wallet Pass ETag

- `computeEtag` in `src/db/etag.ts` hashes the pass metadata and stored JSON content with canonical ordering to create a deterministic hex token.
- The value is saved on the pass row and reused by `pkpass-etag` middleware so GET requests for passes can return standard HTTP `ETag` and `Last-Modified` headers.
- Apple Wallet does not dictate the ETag format; we use it as an internal change detector that happens to satisfy the Wallet client’s conditional request flow.

## Middleware Overview

- `applePassAuthMiddleware` (`src/middleware/auth.ts`) runs on `GET /v1/passes/:passTypeIdentifier/:serialNumber`; it validates the `Authorization` header token against storage for that pass before we fetch content.
- `applePassAuthForListMiddleware` (`src/middleware/auth.ts`) guards `GET /v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier`; it ensures the provided ApplePass token corresponds to a registered device for that pass type before listing serials.
- `pkpass-etagMiddleware` (`src/middleware/pkpass-etag.ts`) wraps the pass download route after auth to serve cached 304 responses when the stored ETag/Last-Modified show nothing changed, otherwise it attaches those headers for the handler.

## Pass Registration Flow

- Email links deliver a `.pkpass` bundle that already includes `passTypeIdentifier`, `serialNumber`, `authenticationToken`, and `webServiceURL`, but no device is registered at download time.
- When the user taps the link and chooses “Add” in Wallet, iOS generates a device-specific `deviceLibraryIdentifier` and calls our `/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber` endpoint with the token from the pass payload.
- The registration handler saves the device mapping and allows push updates; until the user completes this step, no device registration exists.
- We cannot pre-register on behalf of the user, so pass downloads must be permitted before registration, and our auth middleware ensures the embedded token matches the stored pass record.

## Pass Auth Token Generation

- Apple requires each updatable pass to carry a shared-secret `authenticationToken`; devices echo it back as `Authorization: ApplePass <token>` when registering, unregistering, or fetching updates (`context/docs/apple-docs.md`).
- The pass-creation flow (frontend purchase UI + API) must generate a cryptographically secure random string ≥16 characters, store it with the new pass row, and send it to Honoken so the generated `.pkpass` embeds the same value.
- For web clients use `crypto.getRandomValues` (or `window.crypto.randomUUID` + padding) and persist alongside the pass metadata; server-side endpoints should validate length/entropy before inserting into `wallet_pass.authentication_token`.
- Once saved, `buildPass` simply copies the stored token into `pass.json`, and the middleware compares incoming headers to the same value—no downstream regeneration happens.

## APNs Push Path

- `src/passkit/apnsKeys.ts` encrypts and stores the `.p8` auth keys per team, caches decrypted PEMs with last-updated timestamps, and exposes invalidation so everything reloads when a key changes.
- `src/passkit/apnsFetch.ts` pulls that decrypted key to mint provider JWTs, manages HTTP/2 agents, retry/circuit-breaker logic, and fires parallel pushes via the APNs `/3/device/:token` endpoint.
- Cache invalidation is bidirectional: when `apnsKeys` drops a key it calls back into `apnsFetch` to clear its token/agent caches, ensuring pushes pick up new credentials on the next attempt.

## Passkit Certificates

- `src/passkit/certs.ts` keeps signer bundles encrypted at rest, decrypts them on demand, and caches results with DB `updatedAt` guards so pass generation avoids redundant decrypts.
- `loadCertBundle` handles dogpile prevention, JSON-unpacks the PEM bundle, and returns WWDR, signer cert/key, passphrase, enhancement flag, and team ID to callers.
- `storeCertBundle` re-encrypts incoming PEM data, upserts `walletCert`, and refreshes the in-memory cache, while `invalidateCertCache` lets admins purge a single `certRef` when revoking credentials.

## Pass Builder

- `src/passkit/passkit.ts` orchestrates `buildPass`: loads pass rows/content, validates `passData`, and merges it with certificate metadata to produce the final `pass.json`.
- Asset helpers stream PNG headers from Vercel Blob to verify signatures and dimensions before downloading full images, cascading from pass-specific to global fallbacks.
- With the certificate bundle loaded, it bootstraps `passkit-generator`, attaches all verified assets, and emits a `.pkpass` buffer that carries the correct team ID, auth token, and optional enhanced/NFC metadata.

### buildPass Flow

- Pulls pass metadata from `wallet_pass`, resolves the owning certificate via `wallet_pass_type`, and decrypts the signer bundle from `wallet_cert` before any rendering work.
- Reads structured pass content (`wallet_pass_content.data`), validates it against `PassDataEventTicketSchema`, then merges the fields into the base `pass.json`, respecting enhanced-cert NFC requirements.
- Streams artwork from Vercel Blob storage, validating PNG headers/dimensions, falling back to shared `brand-assets/*` when per-pass files are missing, and enforcing required assets (`icon.png`, `logo.png`).
- Instantiates `passkit-generator` with the assembled model files and certificate chain to produce the signed `.pkpass` buffer that `GET /passes` routes return.
