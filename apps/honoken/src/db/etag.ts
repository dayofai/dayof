import stringify from 'json-stable-stringify';

/**
 * Represents combined pass data for ETag computation
 */
export interface PassWithContent {
  // Pass metadata (from passes table)
  serialNumber: string;
  passTypeIdentifier: string;
  authenticationToken: string;
  ticketStyle: 'coupon' | 'event' | 'storeCard' | 'generic' | null;
  poster: boolean;
  passContentId?: string; // FK to pass content
  updatedAt: Date;

  // Pass content data (from pass_content table or equivalent)
  passContent?: {
    id: string;
    description: string;
    organizationName: string;
    updatedAt: Date;
    [key: string]: unknown; // Allow for additional content fields
  };
}

/**
 * Computes a deterministic ETag for a pass with its content
 * Excludes volatile fields like etag, createdAt from both pass and content
 * Uses canonical JSON serialization to ensure consistent hashing regardless of property order
 */
export async function computeEtag(
  passWithContent: PassWithContent
): Promise<string> {
  // Build pass metadata object excluding volatile fields (createdAt, updatedAt, etag)
  const passStable = {
    serialNumber: passWithContent.serialNumber,
    passTypeIdentifier: passWithContent.passTypeIdentifier,
    authenticationToken: passWithContent.authenticationToken,
    ticketStyle: passWithContent.ticketStyle,
    poster: passWithContent.poster,
    passContentId: passWithContent.passContentId,
  };

  // Extract pass content, excluding volatile fields without using delete
  let contentStable: Record<string, unknown> = {};
  if (passWithContent.passContent) {
    contentStable = Object.fromEntries(
      Object.entries(passWithContent.passContent).filter(
        ([key]) => key !== 'createdAt' && key !== 'updatedAt'
      )
    );
  }

  // Combine both pass metadata and content for hashing
  const combinedData = {
    pass: passStable,
    content: contentStable,
  };

  // Use canonical stringify to ensure deterministic serialization regardless of property order
  const data = new TextEncoder().encode(stringify(combinedData));
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Ensures a pass has an ETag, computing and storing it if needed
 * Returns the ETag without the surrounding quotes
 */
// Deprecated: ETags are computed and written on write paths only.
