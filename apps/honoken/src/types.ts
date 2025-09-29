/**
 * Consolidated environment interface for honoken
 * This includes all bindings and secrets used throughout the application
 */
export interface Env {
  // Neon database connection (set by Neon Vercel Previews Integration or manually for development)
  DATABASE_URL?: string; // Set automatically by Neon Vercel Integration for production/preview deployments

  // Development database connection override
  DEV_DATABASE_URL?: string; // For local development, points to Neon development branch

  HONOKEN_ADMIN_USERNAME: string; // Required for admin endpoints
  HONOKEN_ADMIN_PASSWORD: string; // Required for admin endpoints

  // Encryption key versioning - greenfield approach
  HONOKEN_ENCRYPTION_KEY_V1: string; // Base64 encoded AES-GCM 256-bit key
  HONOKEN_ENCRYPTION_KEY_CURRENT: string; // Current key version (e.g., "v1")
  // Future keys will be added as HONOKEN_ENCRYPTION_KEY_V2, V3, etc.

  // Legacy - deprecated, will be removed
  HONOKEN_PEM_BUNDLE_ENCRYPTION_KEY?: string; // Deprecated - use versioned keys

  SERVICE_NAME: string;
  ENVIRONMENT: string;
  VERBOSE_LOGGING?: string; // Optional verbose logging control

  // PostHog Configuration (Required)
  POSTHOG_PROJECT_API_KEY: string;
  POSTHOG_HOST?: string; // Default: 'https://us.i.posthog.com'

  // Performance tuning for Fluid Compute (Optional)
  POSTHOG_BATCH_SIZE?: string; // Default: "100" - events before auto-flush
  POSTHOG_FLUSH_INTERVAL?: string; // Default: "30000" - milliseconds between flushes

  // Remove these after migration is complete
  HONOKEN_SENTRY_DSN?: string; // Mark as deprecated
  HONOKEN_RELEASE_VERSION?: string; // Keep if you want release tracking
  GIT_SHA?: string; // Keep if you want release tracking
  LOG_SAMPLE_SUCCESS_RATE?: string; // For configurable success log sampling e.g. "0.01"

  // Vercel Blob
  HONOKEN_IMAGES_READ_WRITE_TOKEN: string; // replaces deprecated HONOKEN_IMAGES_READ_WRITE_TOKEN

  // Optional: Explicit base URL for Apple PassKit web service (e.g. https://example.com/api/v1/)
  // If present, new passes will embed this as webServiceURL (with trailing slash ensured)
  HONOKEN_WEB_SERVICE_URL?: string;
}

/**
 * Represents the exact structure returned by a database query on the passes table.
 * This matches the Drizzle ORM result with camelCase property names.
 */
export interface DatabasePassRow {
  serialNumber: string;
  passTypeIdentifier: string;
  eventId: string;
  authenticationToken: string;
  ticketStyle: 'coupon' | 'event' | 'storeCard' | 'generic' | null;
  poster: boolean;
  etag: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Extended PassRow interface that includes the database fields plus any additional
 * properties that may be added by application logic for pass generation.
 * This is the authoritative type used throughout the application.
 */
export interface PassRow extends DatabasePassRow {
  // Additional fields that might be populated by application logic
  passData?: {
    description: string; // Required by Apple
    organizationName: string; // Required
    logoText?: string;
    foregroundColor?: string; // "rgb(255, 255, 255)"
    backgroundColor?: string; // "rgb(0, 0, 0)"
    labelColor?: string; // "rgb(200, 200, 200)"

    barcode?: {
      message: string;
      format:
        | 'PKBarcodeFormatQR'
        | 'PKBarcodeFormatPDF417'
        | 'PKBarcodeFormatAztec'
        | 'PKBarcodeFormatCode128'
        | string;
      messageEncoding: string; // e.g., "iso-8859-1"
      altText?: string;
    };

    // Example fields for an event ticket
    eventName?: string;
    venueName?: string;
    eventDateISO?: string; // ISO 8601 string
    seat?: string;
    section?: string;
    posterVersion?: number; // For managing image updates

    // Allow other dynamic fields from the database JSON blob
    // biome-ignore lint/suspicious/noExplicitAny: Dynamic pass data fields from database JSON blob
    [key: string]: any;
  };

  // Optional fields that might be used in some contexts
  id?: string; // For testing or extended functionality
  tenantId?: string; // If multi-tenant
  userId?: string;
  status?: 'active' | 'voided' | 'expired';

  // Allow for additional properties that might be added dynamically
  // biome-ignore lint/suspicious/noExplicitAny: Dynamic pass data fields from database JSON blob
  [key: string]: any;
}
declare module 'hono' {
  interface ContextVariableMap {
    requestId?: string;
    posthog?: import('posthog-node').PostHog | null;
    userContext?: {
      distinctId?: string;
      userId?: string;
      tenantId?: string;
      attendeeId?: string;
      // biome-ignore lint/suspicious/noExplicitAny: Dynamic pass data fields from database JSON blob
      [key: string]: any;
    };
  }
}
