import { createContext, type ReactNode, useContext, useMemo } from 'react';
import { createPanelAtoms, type PanelAtoms } from '../atoms';

/**
 * Context for scoped panel atoms
 */
const PanelAtomsContext = createContext<PanelAtoms | null>(null);

/**
 * Hook to access panel atoms
 *
 * @throws Error if used outside ProductPanel
 */
export function usePanelAtoms(): PanelAtoms {
  const atoms = useContext(PanelAtomsContext);

  if (!atoms) {
    throw new Error(
      'usePanelAtoms must be used within ProductPanel component tree'
    );
  }

  return atoms;
}

/**
 * Panel atoms provider
 *
 * Creates scoped atoms per eventId and provides via Context.
 * Components access atoms via usePanelAtoms() hook.
 *
 * @example
 * ```tsx
 * function ProductPanel({ eventId }: { eventId: string }) {
 *   return (
 *     <PanelAtomsProvider eventId={eventId}>
 *       <PanelContent />
 *     </PanelAtomsProvider>
 *   );
 * }
 *
 * function PanelContent() {
 *   const atoms = usePanelAtoms();
 *   const panel = useAtomValue(atoms.queryAtom);
 *   // ... use atoms
 * }
 * ```
 */
export function PanelAtomsProvider({
  eventId,
  children,
}: {
  eventId: string;
  children: ReactNode;
}) {
  // Memoize atoms (stable across re-renders)
  const atoms = useMemo(() => createPanelAtoms(eventId), [eventId]);

  return (
    <PanelAtomsContext.Provider value={atoms}>
      {children}
    </PanelAtomsContext.Provider>
  );
}
