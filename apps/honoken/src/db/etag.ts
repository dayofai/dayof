// Import DbClient AND the schema instance it was created with from ./index.ts

import { and, eq } from 'drizzle-orm';
import stringify from 'json-stable-stringify';
import type { Logger } from '../utils/logger';
import type { DbClient } from './index';
import { schema } from './index'; // Use the re-exported schema from index.ts

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
    [key: string]: any; // Allow for additional content fields
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
  // Extract pass metadata, excluding volatile fields
  const { etag, createdAt, updatedAt, ...passStable } = passWithContent as any;

  // Extract pass content, excluding volatile fields
  let contentStable = {};
  if (passWithContent.passContent) {
    const {
      createdAt: contentCreatedAt,
      updatedAt: contentUpdatedAt,
      ...restContent
    } = passWithContent.passContent;
    contentStable = restContent;
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
