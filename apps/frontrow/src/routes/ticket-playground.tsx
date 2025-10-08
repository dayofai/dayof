import { createFileRoute } from '@tanstack/react-router';
import { TicketsPanel } from '@/features/ticket-panel/components/TicketsPanel';

export const Route = createFileRoute('/ticket-playground')({
  ssr: false,
  component: Playground,
});

function Playground() {
  return (
    <div className="min-h-screen bg-black p-8 text-white">
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
