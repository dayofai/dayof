import { createDerivedItemAtoms } from './derived-items';
import { createPanelStateAtoms } from './panel-state';
import { createQueryAtom } from './query';
import { createSelectionAtoms } from './selection';

/**
 * Create scoped panel atoms for a specific event
 *
 * Factory pattern enables:
 * - Multiple panel instances (isolated state per eventId)
 * - Clean dependency injection
 * - Testable (mock atoms via custom provider)
 *
 * @param eventId - Event identifier for scoping
 * @returns Complete atom set for panel
 */
export function createPanelAtoms(eventId: string) {
  // 1. Query atom (source of truth)
  const queryAtom = createQueryAtom(eventId);

  // 2. Item derivation atoms
  const derivedItems = createDerivedItemAtoms(queryAtom);

  // 3. Selection atoms (depends on itemByIdFamily for clamping)
  const selection = createSelectionAtoms(eventId, derivedItems.itemByIdFamily);

  // 4. Panel state atoms (simplified, mostly server pass-through)
  const panelState = createPanelStateAtoms(queryAtom);

  // Return complete atom set (typed for IntelliSense)
  return {
    // Query
    queryAtom,

    // Item derivation
    ...derivedItems,

    // Selection
    ...selection,

    // Panel state
    ...panelState,
  };
}

/**
 * Panel atoms type (for Context typing)
 */
export type PanelAtoms = ReturnType<typeof createPanelAtoms>;
