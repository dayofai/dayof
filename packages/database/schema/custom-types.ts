import { type Dinero, dinero, toSnapshot } from 'dinero.js';
import { customType } from 'drizzle-orm/pg-core';

/**
 * Custom type for storing Dinero.js snapshots in a JSONB column.
 * Stores the snapshot but returns a Dinero object when retrieved.
 */
export const dineroType = customType<{
  data: Dinero<number>;
  driverData: string;
}>({
  dataType: () => 'jsonb',

  toDriver(value: Dinero<number>): string {
    // Serialize the Dinero object to a snapshot string
    return JSON.stringify(toSnapshot(value));
  },

  fromDriver(value: string): Dinero<number> {
    // Deserialize the snapshot string to a Dinero object
    const snapshot = JSON.parse(value);
    return dinero(snapshot);
  },
});

// Custom type for IANA timezone identifiers (e.g., "America/New_York")
export const ianaTimezone = customType<{
  data: string;
}>({
  dataType() {
    return 'text';
  },
  toDriver(value: string): string {
    // Validate timezone using Intl API
    try {
      // This will throw if timezone is invalid
      Intl.DateTimeFormat(undefined, { timeZone: value });
      return value;
    } catch {
      throw new Error(`Invalid IANA timezone identifier: ${value}`);
    }
  },
});
