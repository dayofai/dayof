# 炎钥 Honoken - Apple Wallet PassKit Web Service

## TL;DR for the Impatient

**Honoken** is a production-ready Apple Wallet PassKit Web Service built with Hono on Vercel, featuring:

- ✅ Apple PassKit Web Service endpoint implementation
- 🚀 Vercel Node.js serverless deployment (not Cloudflare!)
- 🗄️ Neon PostgreSQL with direct connections
- 📦 Upstash Redis for pass asset storage
- 🔐 Multi-tenant certificate & APNs key management
- 📱 Custom APNs HTTP/2 implementation optimized for serverless
- 🎯 Zero-downtime certificate rotation
- 📊 PostHog analytics and error tracking optimized for Fluid Compute

**Quick Start**: `bun install` → `bun run dev:vercel`

---

## Table of Contents

- [炎钥 Honoken - Apple Wallet PassKit Web Service](#炎钥-honoken---apple-wallet-passkit-web-service)
  - [TL;DR for the Impatient](#tldr-for-the-impatient)
  - [Table of Contents](#table-of-contents)
  - [About 炎钥 (Honoken)](#about-炎钥-honoken)
  - [Understanding Apple PassKit](#understanding-apple-passkit)
    - [What are Apple Wallet Passes?](#what-are-apple-wallet-passes)
    - [How PassKit Web Service Works](#how-passkit-web-service-works)
    - [Pass Lifecycle](#pass-lifecycle)
    - [Key Concepts for Developers](#key-concepts-for-developers)
      - [Authentication \& Security](#authentication--security)
      - [Update Mechanism](#update-mechanism)
      - [Pass Type Identifier](#pass-type-identifier)
      - [Device Registration](#device-registration)
    - [Apple's Requirements](#apples-requirements)
    - [NFC \& Enhanced Passes](#nfc--enhanced-passes)
  - [Architecture Overview](#architecture-overview)
  - [Core Technologies](#core-technologies)
  - [Prerequisites](#prerequisites)
  - [Development Setup](#development-setup)
    - [1. Install Dependencies](#1-install-dependencies)
    - [2. Environment Configuration](#2-environment-configuration)
    - [3. Database Setup](#3-database-setup)
    - [4. Start Development Server](#4-start-development-server)
  - [Deployment](#deployment)
    - [Preview Deployment](#preview-deployment)
    - [Production Deployment](#production-deployment)
  - [API Implementation](#api-implementation)
    - [PassKit Web Service Endpoints](#passkit-web-service-endpoints)
    - [Admin Management Endpoints](#admin-management-endpoints)
  - [Key Features](#key-features)
    - [🔐 Multi-Tenant Certificate Management](#-multi-tenant-certificate-management)
    - [🔑 Encryption Key Versioning](#-encryption-key-versioning)
      - [Key Rotation Process](#key-rotation-process)
    - [📱 Optimized APNs Implementation](#-optimized-apns-implementation)
    - [🎨 Dynamic Pass Generation](#-dynamic-pass-generation)
    - [🏃 Performance Optimizations](#-performance-optimizations)
    - [📊 Observability](#-observability)
    - [🚀 PostHog Analytics (Fluid Compute Optimized)](#-posthog-analytics-fluid-compute-optimized)
  - [Environment Variables](#environment-variables)
    - [Required](#required)
    - [Optional](#optional)
  - [Database Schema](#database-schema)
  - [Testing](#testing)
  - [Certificate Rotation](#certificate-rotation)
  - [Architecture Decisions](#architecture-decisions)
    - [Why Vercel over Cloudflare Workers?](#why-vercel-over-cloudflare-workers)
    - [Why Upstash Redis over R2?](#why-upstash-redis-over-r2)
    - [Why Custom APNs Implementation?](#why-custom-apns-implementation)
  - [Implementation Best Practices](#implementation-best-practices)
    - [Pass Data Management](#pass-data-management)
    - [Performance Optimization](#performance-optimization)
    - [Update Patterns](#update-patterns)
    - [Security Considerations](#security-considerations)
    - [Error Handling Patterns](#error-handling-patterns)
  - [Troubleshooting](#troubleshooting)
    - [Debug Mode](#debug-mode)

---

## About 炎钥 (Honoken)

The name **炎钥 (Honoken)**, meaning "Flame Key," reflects the core technologies of this project. `炎` (yán - flame) represents the Hono framework (from Japanese `honō` for flame), while `钥` (yào - key) symbolizes the PassKit functionality for managing digital passes that act as keys or credentials.

This project implements a complete Apple Wallet PassKit Web Service API using the Hono web framework, deployed on Vercel's Node.js serverless platform.

## Understanding Apple PassKit

### What are Apple Wallet Passes?

Apple Wallet passes are digitally signed bundles (`.pkpass` files) that contain:

- **Visual representation**: What users see in their Wallet app
- **Data payload**: JSON structure defining the pass content
- **Assets**: Images like logos, icons, and backgrounds
- **Digital signature**: Cryptographic proof of authenticity

Pass types we support with honoken currently:

- 🎫 **Event Tickets**: Concert tickets, sports events (supports new iOS 18 poster format)

We may add support for these in the near future:

- 🎬 **Coupons**: Discount codes with location-based notifications

### How PassKit Web Service Works

The PassKit Web Service protocol enables **dynamic pass updates** after installation:

```mermaid
sequenceDiagram
    participant User as iPhone User
    participant Wallet as Apple Wallet
    participant Service as Your PassKit Service
    participant APNs as Apple Push Service

    User->>Wallet: Install pass
    Wallet->>Service: Register device (POST /v1/devices/.../registrations/...)
    Service->>Service: Store device token

    Note over Service: When pass data changes...

    Service->>APNs: Send push notification
    APNs->>Wallet: Wake up Wallet app
    Wallet->>Service: Check for updates (GET /v1/devices/.../registrations/...)
    Service->>Wallet: Return modified passes list
    Wallet->>Service: Download updated pass (GET /v1/passes/...)
    Service->>Wallet: Return new .pkpass file
    Wallet->>User: Display updated pass
```

### Pass Lifecycle

1. **Generation**: Your service creates a pass with unique `serialNumber` and `authenticationToken`
2. **Distribution**: User receives pass via email, web download, or in-app
3. **Installation**: User adds pass to Apple Wallet
4. **Registration**: Wallet registers with your service for updates
5. **Updates**: You push changes when pass data changes (e.g., change to event, ticket update, etc.)
6. **Expiration/Deletion**: User removes pass or it expires

### Key Concepts for Developers

#### Authentication & Security

- **Pass Signing**: Every pass must be signed with an Apple-issued certificate
- **Authentication Token**: Secret shared between pass and service for API auth
- **Transport Security**: All communication uses HTTPS/HTTP2

#### Update Mechanism

Updates are **pull-based**, not push:

1. Your service sends a **silent push notification** (empty payload)
2. This wakes up Wallet, which then **requests** the updated pass
3. Wallet decides whether to actually update based on timestamps/ETags

#### Pass Type Identifier

- Format: `pass.com.yourcompany.passtype`
- Must match your Apple Developer certificate
- One certificate can sign multiple pass types
- Used as the "topic" for push notifications

#### Device Registration

When a pass is added to Wallet:

- Wallet sends device ID and push token to your service
- You store this to send future update notifications
- One device can have multiple passes of the same type
- Registration persists until pass deletion

### Apple's Requirements

Your service **MUST**:

- ✅ Implement all required endpoints (even if some return empty responses)
- ✅ Validate authentication tokens on pass download
- ✅ Support conditional GET with ETag/Last-Modified
- ✅ Handle device registration/unregistration properly
- ✅ Sign all passes with valid certificates
- ✅ Use HTTPS for all endpoints
- ✅ Respond quickly (Apple enforces timeouts)

### NFC & Enhanced Passes

iOS 18 introduced new capabilities:

- **Poster Format**: Large-format event tickets with background images
- **NFC Support**: Requires enhanced certificate + encryption keys
- **Semantic Tags**: Structured data for Siri and system integrations
- **Live Activities**: Real-time updates on lock screen

This service handles these automatically when configured with appropriate certificates.

## Architecture Overview

```mermaid
flowchart TD
    A[Vercel Edge Network] --> B[api/index.ts]
    B --> C[Hono Application]
    C --> D[PassKit Web Service Routes]
    C --> E[Admin Management Routes]

    D --> F[(Neon PostgreSQL)]
    D --> G[(Upstash Redis)]
    D --> H[Apple Push Notification Service]

    E --> F
    E --> I[Certificate Management]

    C --> J[PostHog Analytics]
    J --> K[Fluid Compute Optimizations]

    style A fill:#000,color:#fff
    style B fill:#0070f3,color:#fff
    style F fill:#00e599,color:#000
    style G fill:#dc2626,color:#fff
    style H fill:#007aff,color:#fff
```

## Core Technologies

- **[Hono](https://hono.dev/)**: Ultra-fast web framework optimized for edge computing
- **[Vercel](https://vercel.com/)**: Serverless platform with global edge network (Node.js 22.x runtime)
- **[Neon](https://neon.tech/)**: Serverless PostgreSQL with branching for dev/prod isolation
- **[Upstash Redis](https://upstash.com/)**: Serverless Redis for pass asset storage
- **[passkit-generator](https://github.com/alexandercerutti/passkit-generator)**: Pass generation library
- **[Drizzle ORM](https://orm.drizzle.team/)**: TypeScript-first ORM with zero dependencies
- **[Zod](https://zod.dev/)**: TypeScript-first schema validation
- **[undici](https://undici.nodejs.org/)**: HTTP/2 client for APNs (replaced `@fivesheepco/cloudflare-apns2`)
- **[jose](https://github.com/panva/jose)**: JWT generation for APNs authentication
- **[posthog-node](https://github.com/PostHog/posthog-node)**: Analytics and error tracking with batching for Fluid Compute

## Prerequisites

- **[Bun](https://bun.sh/)** runtime (v1.0+)
- **[Vercel CLI](https://vercel.com/cli)** for local development
- **Neon** account with database provisioned
- **Upstash** account with Redis database
- **Apple Developer** account with PassKit certificates

## Development Setup

### 1. Install Dependencies

```bash
bun install
```

### 2. Environment Configuration

Create a `.env.local` file for Vercel development by copying `.env.example`. You will need to configure:

- Database connections (Neon branching pattern)
- Upstash Redis credentials
- Admin authentication credentials
- Encryption keys for certificate storage

See the [Environment Variables](#environment-variables) section for a complete list.

### 3. Database Setup

The project uses Neon's branching pattern:

- **Production**: `DATABASE_URL` (set by Neon Vercel Integration)
- **Development**: `DEV_DATABASE_URL` (points to development branch)

Generate and apply migrations:

```bash
# Drizzle Kit uses the HONOKEN_DATABASE_URL variable for migrations.
# Set it to your development branch URL before running generate.
export HONOKEN_DATABASE_URL="your_neon_dev_branch_url"

bun run generate:pg

# Apply migrations via the Neon Console or your preferred SQL client.
```

### 4. Start Development Server

```bash
bun run dev:vercel  # Starts Vercel dev server
```

The API will be available at `http://localhost:3000/api`

## Deployment

### Preview Deployment

```bash
bun run deploy:preview
```

### Production Deployment

```bash
bun run deploy:prod
```

Vercel automatically:

- Sets up preview environments with isolated Neon branches
- Manages environment variables
- Handles SSL certificates
- Provides global edge distribution

## API Implementation

### PassKit Web Service Endpoints

All Apple-required endpoints are implemented with full compliance:

| Endpoint                                                  | Method | Description                            |
| --------------------------------------------------------- | ------ | -------------------------------------- |
| `/api/v1/devices/:deviceId/registrations/:typeId/:serial` | POST   | Register device for push notifications |
| `/api/v1/devices/:deviceId/registrations/:typeId/:serial` | DELETE | Unregister device                      |
| `/api/v1/devices/:deviceId/registrations/:typeId`         | GET    | List updatable passes for device       |
| `/api/v1/passes/:typeId/:serial`                          | GET    | Download pass (with auth & caching)    |
| `/api/v1/log`                                             | POST   | Receive device logs                    |

### Path Prefixes

On Vercel, all endpoints are exposed under the `/api` prefix (e.g., `/api/v1/...`). The local development harness and smoke tests address the routes directly at their mounted paths (e.g., `/v1/...`).

### Admin Management Endpoints

Protected endpoints for operational tasks:

| Endpoint                               | Method | Description                        |
| -------------------------------------- | ------ | ---------------------------------- |
| `/api/admin/certs/:certRef`            | PUT    | Rotate PassKit signing certificate |
| `/api/admin/invalidate/certs/:certRef` | POST   | Invalidate certificate cache       |

Authentication via Basic Auth using `HONOKEN_ADMIN_USERNAME` and `HONOKEN_ADMIN_PASSWORD`.

### Storage Adapter Contract

The route handlers in this service are decoupled from the database via a storage adapter contract. The following functions are expected to be implemented by a storage layer (e.g., in `src/storage/index.ts`) to handle persistence.

| Function             | Description                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------- |
| `registerDevice`     | Creates or updates a device registration for a pass. Handles `ApplePass` authentication token validation. |
| `unregisterDevice`   | Deactivates or deletes a device registration. Must be idempotent.                                         |
| `listUpdatedSerials` | Returns a list of serial numbers for a given device that have been updated since a specified timestamp.   |
| `logMessages`        | Receives and stores logs from Apple devices for debugging.                                                |
| `healthCheck`        | Verifies the database connection is active.                                                               |

## Key Features

### 🔐 Multi-Tenant Certificate Management

- Encrypted certificate storage in PostgreSQL (AES-GCM-256)
- Support for multiple Team IDs and pass types
- Zero-downtime certificate rotation
- **Reliable Cache Invalidation**: Guarantees cache freshness by re-validating against the database timestamp on each read, ensuring that rotated or updated certificates are loaded immediately.

### 🔑 Encryption Key Versioning

Honoken implements a versioned encryption key system that supports key rotation without data loss:

- **Versioned Keys**: Each encryption key has a version identifier (v1, v2, etc.)
- **Seamless Rotation**: Add new keys without breaking existing encrypted data
- **Ciphertext Format**: `version:iv:encryptedData` - self-describing format
- **Zero Downtime**: Rotate keys without re-encrypting existing data immediately

#### Key Rotation Process

1. **Initial Setup** (current state):

   ```bash
   HONOKEN_ENCRYPTION_KEY_V1=<base64_key>  # Generate: openssl rand -base64 32
   HONOKEN_ENCRYPTION_KEY_CURRENT=v1
   ```

2. **Adding a New Key**:

   ```bash
   # Keep the old key
   HONOKEN_ENCRYPTION_KEY_V1=<existing_key>
   # Add the new key
   HONOKEN_ENCRYPTION_KEY_V2=<new_base64_key>
   # Update current version
   HONOKEN_ENCRYPTION_KEY_CURRENT=v2
   ```

3. **Migration** (optional):
   - New data automatically uses the current key version
   - Old data remains readable with its original key
   - Implement background job to re-encrypt if needed

4. **Cleanup** (after full migration):
   - Remove old key only after all data is migrated
   - Update minimum supported version in code

This design ensures that encryption keys can be rotated for security compliance without service interruption or data loss.

### 📱 Optimized APNs Implementation

Custom implementation replacing Cloudflare-specific libraries:

- Host-specific HTTP/2 agents (separate for production/sandbox APNs)
- JWT token caching with automatic refresh
- Individual device retry logic with exponential backoff + Retry-After header support
- Automatic unregistration on device token failures

### 🎨 Dynamic Pass Generation

- Runtime pass assembly (no static templates)
- Asset storage in Upstash Redis with Base64 encoding
- PNG validation (signature, dimensions, IHDR verification)
- Automatic fallback to brand assets
- NFC support with enhanced certificate detection

### 🏃 Performance Optimizations

- Persistent ETag storage for instant cache validation
- Singleton database connections per worker
- **Optimized Certificate Caching**: Uses a bounded in-memory cache for certificates with built-in request coalescing to prevent "dog-piling" (multiple concurrent requests for the same uncached resource), significantly reducing database load during high-concurrency scenarios.
- Conditional GET support with `ETag` and `Last-Modified`
- Inngest per-pass concurrency: updates for the same pass are serialized (keyed by `event.data.serialNumber`) to prevent interleaving writes; other passes run in parallel. Combined with no-change short-circuiting, this yields idempotent APNs behavior.

### 📊 Observability

- Structured JSON logging optimized for production
- PostHog integration with intelligent event batching
- Container-aware metrics (PID, uptime, memory usage)
- Request tracing with correlation IDs
- Configurable success rate sampling

### 🚀 PostHog Analytics (Fluid Compute Optimized)

Honoken uses PostHog for analytics and error tracking, specifically optimized for Vercel's Fluid Compute environment:

- **Efficient Batching**: Events are batched (100 events or 30s intervals) to reduce API calls
- **Container Awareness**: Tracks process ID, uptime, and memory usage to understand container lifecycle
- **Smart Event Filtering**: Only significant events are captured to reduce noise
- **Automatic User Tracking**: Links events to users, devices, passes, and tenants
- **Circuit Breaker**: Prevents PostHog outages from affecting your application

Event Types:

- `$exception`: Errors with full stack traces
- `server_warning`: All warning events
- `server_error`: Error events with context
- `slow_request`: Requests taking >1 second
- Custom events for pass operations (generation, registration, etc.)

## Environment Variables

### Required

| Variable                          | Description                                            | Example                   |
| --------------------------------- | ------------------------------------------------------ | ------------------------- |
| `DATABASE_URL`                    | Neon PostgreSQL connection (set by Vercel integration) | Auto-configured           |
| `DEV_DATABASE_URL`                | Development database connection                        | `postgresql://...`        |
| `UPSTASH_REDIS_REST_URL`          | Upstash Redis REST endpoint                            | `https://...upstash.io`   |
| `UPSTASH_REDIS_REST_TOKEN`        | Upstash Redis auth token                               | `AX...`                   |
| `HONOKEN_ENCRYPTION_KEY_V1`       | Base64 AES-256 key (version 1)                         | `openssl rand -base64 32` |
| `HONOKEN_ENCRYPTION_KEY_CURRENT`  | Current key version                                    | `v1`                      |
| `HONOKEN_ADMIN_USERNAME`          | Admin panel username (required)                        | Choose secure username    |
| `HONOKEN_ADMIN_PASSWORD`          | Admin panel password (required)                        | Choose strong password    |
| `SERVICE_NAME`                    | Service identifier                                     | `honoken`                 |
| `ENVIRONMENT`                     | Runtime environment (inferred if missing)              | `production`              |
| `HONOKEN_RELEASE_VERSION`         | Version for tracking                                   | `1.0.0`                   |
| `POSTHOG_PROJECT_API_KEY`         | PostHog project API key                                | `phc_...`                 |
| `HONOKEN_IMAGES_READ_WRITE_TOKEN` | Vercel Blob RW token for images                        | `vercel_rw_...`           |

### Optional

| Variable                  | Description              | Default                    |
| ------------------------- | ------------------------ | -------------------------- |
| `POSTHOG_HOST`            | PostHog instance URL     | `https://us.i.posthog.com` |
| `POSTHOG_BATCH_SIZE`      | Events before auto-flush | `100`                      |
| `POSTHOG_FLUSH_INTERVAL`  | Ms between flushes       | `30000`                    |
| `VERBOSE_LOGGING`         | Enable debug logs        | `false`                    |
| `LOG_SAMPLE_SUCCESS_RATE` | Success log sampling     | `0.01`                     |
| `GIT_SHA`                 | Git commit SHA           | Auto-detected              |

## Database Schema (shared package)

Wallet tables are provided by the shared `packages/database` schema:

- **`wallet_pass`**: Individual pass instances with metadata and stored `etag`.
- **`wallet_pass_content`**: 1‑to‑1 JSONB payload for dynamic content used to build the pass.
- **`wallet_device`**: Registered Apple devices with push tokens.
- **`wallet_registration`**: Device-to-pass associations (`active` boolean).
- **`wallet_cert`**: Encrypted PassKit signing certificates.
- **`wallet_pass_type`**: Maps pass type IDs to certificates.
- **`wallet_apns_key`**: Encrypted APNs authentication keys.

## Testing

```bash
bun run test          # Run all tests
bun run test:unit     # Unit tests only
bun run test:smoke    # Integration tests
bun run test:watch    # Watch mode
```

## Certificate Rotation

Certificates expire annually and must be rotated without service interruption:

1. Generate new certificate in Apple Developer Portal
2. Prepare PEM bundle with private key and WWDR G4
3. Use admin endpoint to update:

```bash
curl -X PUT https://your-domain.vercel.app/api/admin/certs/YOUR_CERT_REF \
  -u "admin:password" \
  -H "Content-Type: application/json" \
  -d '{
    "bundleData": {
      "wwdr": "-----BEGIN CERTIFICATE-----...",
      "signerCert": "-----BEGIN CERTIFICATE-----...",
      "signerKey": "-----BEGIN PRIVATE KEY-----...",
      "signerKeyPassphrase": ""
    },
    "isEnhanced": false,
    "teamId": "YOUR_TEAM_ID",
    "description": "Updated certificate for Event Tickets"
  }'
```

## Architecture Decisions

### Why Vercel over Cloudflare Workers?

- **Node.js compatibility**: Full Node.js API support vs Workers' limited runtime
- **Package ecosystem**: Direct npm/bun package usage without polyfills
- **HTTP/2 control**: Native `undici` for APNs instead of library workarounds
- **Development experience**: Familiar Node.js debugging and tooling

### Why Upstash Redis over R2?

- **Serverless-first**: No persistent connections, perfect for edge functions
- **Global replication**: Automatic edge caching for pass assets
- **Simple API**: REST-based, no complex SDK required
- **Cost effective**: Pay-per-request model ideal for sporadic access

### Why Custom APNs Implementation?

- **Cloudflare library incompatible**: `@fivesheepco/cloudflare-apns2` requires Workers
- **Better control**: Direct HTTP/2 management for connection pooling
- **Optimized for serverless**: Host-specific agents prevent socket exhaustion
- **Simplified dependencies**: Just `undici` + `jose` vs complex APNs library

## Implementation Best Practices

### Pass Data Management

#### Separate Static from Dynamic Content

- Static: Pass type, logo, colors → Defined at generation
- Dynamic: Balances, dates, seat numbers → Store in `passData` field
- Updates: Only dynamic content changes trigger push notifications

#### Unique Serial Numbers

- Use UUIDs or similar globally unique identifiers
- Never reuse serial numbers, even after pass deletion
- Consider namespacing: `event-12345-67890` for organization

#### Authentication Tokens

- Generate cryptographically secure random tokens (≥16 bytes)
- Store hashed versions in your database
- One token per pass instance, not per pass type

### Performance Optimization

#### ETag Strategy (write-time)

ETags are computed and stored on write (when pass metadata or `wallet_pass_content` changes). GET paths are read‑only and return stored ETags. This ensures consistent conditional responses (`If-None-Match` and `If-Modified-Since`) without recomputation on the hot path.

Composition (stable, excludes auth token):

- passTypeIdentifier, serialNumber, ticketStyle, poster
- updatedAt (rounded to whole seconds)
- JSONB content from `wallet_pass_content.data`

#### Asset Caching

- Store pass assets (logos, backgrounds) once per pass type
- Use consistent naming: `${passTypeId}/icon.png`
- Set long TTLs in Redis for static assets
- Version assets with query parameters for cache busting

### Update Patterns

#### Batch Updates

```typescript
// When multiple passes need updates (e.g., event cancellation)
const devices = await getAffectedDevices(eventId);
const chunks = chunkArray(devices, 100); // APNs batch limits

for (const chunk of chunks) {
  await pushToMany(env, chunk, passTypeId, logger);
  await sleep(100); // Rate limiting
}
```

#### Conditional Updates

- Always check if data actually changed before pushing
- Use database triggers or comparison logic
- Respect Apple's rate limits (avoid notification spam)

### Security Considerations

#### Certificate Storage

- Never commit certificates to version control
- Encrypt at rest (this service uses AES-GCM-256)
- Rotate certificates well before expiration
- Keep WWDR intermediate certificate updated
- Encryption keys are non-extractable (cannot be exported)

#### API Security

- Validate authentication tokens on every pass download
- Log suspicious activity (repeated 401s)
- Consider rate limiting per device
- Implement request signing for admin endpoints
- Admin credentials are required (no defaults)
- Apple's `/v1/log` endpoint remains unauthenticated per spec

#### Pass Delivery

- Cache-Control headers prevent stale passes (`no-store, must-revalidate`)
- ETags provide cache validation while ensuring freshness
- No caching at CDN or browser level for .pkpass files

### Error Handling Patterns

#### Graceful Degradation

```typescript
// If asset loading fails, continue with pass generation
const icon = await storage
  .retrieve(`${passTypeId}/icon.png`)
  .catch(() => storage.retrieve("default/icon.png"));
```

#### Device Cleanup

- Remove devices that consistently fail (410 Gone)
- Implement exponential backoff for retries
- Log device unregistration for debugging

## Troubleshooting

### Debug Mode

Enable verbose logging for development:

```bash
VERBOSE_LOGGING=true bun run dev:vercel
```
