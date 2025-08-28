// Import DbClient AND the schema instance it was created with from ./index.ts
import type { DbClient } from './index';
import { schema } from './index'; // Use the re-exported schema from index.ts
import { eq, and } from 'drizzle-orm';
import type { Logger } from '../utils/logger';
import stringify from 'json-stable-stringify';

/**
 * Represents combined pass data for ETag computation
 */
export interface PassWithContent {
  // Pass metadata (from passes table)
  serialNumber: string;
  passTypeIdentifier: string;
  authenticationToken: string;
  ticketStyle: "coupon" | "event" | "storeCard" | "generic" | null;
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
export async function computeEtag(passWithContent: PassWithContent): Promise<string> {
  // Extract pass metadata, excluding volatile fields
  const { etag, createdAt, updatedAt, ...passStable } = passWithContent as any;
  
  // Extract pass content, excluding volatile fields
  let contentStable = {};
  if (passWithContent.passContent) {
    const { createdAt: contentCreatedAt, updatedAt: contentUpdatedAt, ...restContent } = passWithContent.passContent;
    contentStable = restContent;
  }
  
  // Combine both pass metadata and content for hashing
  const combinedData = {
    pass: passStable,
    content: contentStable
  };
  
  // Use canonical stringify to ensure deterministic serialization regardless of property order
  const data = new TextEncoder().encode(stringify(combinedData));
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
              .map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Ensures a pass has an ETag, computing and storing it if needed
 * Returns the ETag without the surrounding quotes
 */
export async function ensureStoredEtag(
  db: DbClient,
  passWithContent: PassWithContent,
  logger?: Logger
): Promise<string> {
  // Always compute fresh since it includes content changes
  // In the future, we might cache this more intelligently based on both updatedAt timestamps
  const tag = await computeEtag(passWithContent);
  
  // Fire-and-forget – don't block the response path
  // Note: In a real implementation, you might want to only update if the computed ETag
  // is different from the stored one, to avoid unnecessary writes
  db.update(schema.passes)
    .set({ etag: tag })
    .where(and(
      eq(schema.passes.passTypeIdentifier, passWithContent.passTypeIdentifier),
      eq(schema.passes.serialNumber, passWithContent.serialNumber)
    ))
    .catch((error: unknown) => {
      if (logger) {
        logger.error('Failed to store ETag during fire-and-forget update', error instanceof Error ? error : new Error(String(error)), {
          passTypeIdentifier: passWithContent.passTypeIdentifier,
          serialNumber: passWithContent.serialNumber,
        });
      } else {
        console.error('Failed to store ETag:', error);
      }
    });
  
  return tag;
} 