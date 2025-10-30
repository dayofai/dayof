import { useAtomValue } from 'jotai';
import { PanelAtomsProvider, usePanelAtoms } from '../../context';
import { PanelNotices } from '../primitives';
import { PanelHeader } from './PanelHeader';
import './index.css';

interface ProductPanelProps {
  eventId: string;
  className?: string; // theme override
}

/**
 * ProductPanel - Main product panel component
 *
 * Displays products with server-driven state, pricing, and selection.
 * Uses Jotai atoms for reactive state management.
 *
 * @example
 * ```tsx
 * <ProductPanel eventId="evt_123" />
 * ```
 */
export function ProductPanel({ eventId, className = '' }: ProductPanelProps) {
  return (
    <PanelAtomsProvider eventId={eventId}>
      <div className={`product-panel space-y-4 ${className}`}>
        <PanelContent />
      </div>
    </PanelAtomsProvider>
  );
}

function PanelContent() {
  const atoms = usePanelAtoms();
  const panel = useAtomValue(atoms.queryAtom);
  const welcomeText = useAtomValue(atoms.welcomeTextAtom);

  if (panel.isPending) {
    // TODO: Implement shimmer/skeleton loader
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 rounded bg-muted" />
        <div className="h-32 rounded bg-muted" />
      </div>
    );
  }

  if (panel.isError) {
    // TODO: Properly handle error design
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="font-semibold text-destructive">Error loading panel</p>
        <p className="text-muted-foreground text-sm">Please try again later</p>
      </div>
    );
  }

  if (!panel.data) {
    // This should never happen, but we'll handle it anyway.
    return null;
  }

  const { context } = panel.data;

  return (
    <div className="panel-card space-y-4">
      <PanelHeader welcomeText={welcomeText} />

      <PanelNotices notices={context.panelNotices} />

      {/* TODO: Access code CTA */}
      {/* TODO: Sections and items */}
      {/* TODO: Footer and pricing */}
    </div>
  );
}
