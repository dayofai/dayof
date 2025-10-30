import { atomWithQuery } from 'jotai-tanstack-query';
import { panelQueryOptions } from '../api/panel';

/**
 * Create query atom for panel data
 */
export function createQueryAtom(eventId: string) {
  return atomWithQuery(() => panelQueryOptions(eventId));
}
