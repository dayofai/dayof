// Public API exports - feature is completely self-contained

// API queries
export { panelQueryOptions } from './api/panel';
// Types for external consumption
export type { CartItem } from './atoms';

// Atom factory & context
export { createPanelAtoms, type PanelAtoms } from './atoms';
export { PanelAtomsProvider, usePanelAtoms } from './context';
// Core business logic
export { computeItemUI, type ItemUIState } from './lib/computeItemUI';

// Re-export all schemas and types
export * from './schemas';
