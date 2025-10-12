import { createFileRoute } from '@tanstack/react-router';
import { TicketsPanel } from '@/features/ticket-panel/components/TicketsPanel';
import { getThemeStyles } from '@/lib/utils/theme';

export const Route = createFileRoute('/ticket-playground')({
  ssr: false,
  component: Playground,
});

function Playground() {
  // In production, this comes from event.brandColor in DB
  const brandColor = 'oklch(0.45 0.12 35)'; // Warm brown for playground

  return (
    <div
      className="min-h-screen bg-black p-8 text-white theme-root"
      style={getThemeStyles(brandColor)}
    >
      <div className="mx-auto max-w-2xl">
        <TicketsPanel
          event={{
            mixedTicketTypesAllowed: true,
            currency: 'USD',
            timeZone: 'America/Los_Angeles',
          }}
          eventId="evt_123"
          onCheckout={() => {
            /* no-op */
          }}
        />
      </div>
    </div>
  );
}
