// Public API exports - feature is completely self-contained

// API queries
export { panelQueryOptions } from './api/panel';
// Core business logic
export { computeItemUI, type ItemUIState } from './lib/computeItemUI';
// Re-export all schemas and types
export * from './schemas';

// Atom factories (to be implemented)
// export {
//   checkoutDisabledAtom,
//   eventConfigAtom,
//   ticketUIStatesAtom,
// } from './atoms/ui-states';
