import type { TicketUIState } from '@/features/ticket-panel/lib/computeTicketUI';
import type { Ticket } from '@/lib/schemas/tickets';
import { TicketCard } from './TicketCard';

interface TicketListProps {
  tickets: Ticket[];
  uiStates: TicketUIState[];
  onIncrement: (ticketId: string) => void;
  onDecrement: (ticketId: string) => void;
}

export function TicketList({
  tickets,
  uiStates,
  onIncrement,
  onDecrement,
}: TicketListProps) {
  
  return (
    <div className="space-y-3" data-testid="ticket-list">
      {tickets.map((ticket) => {
        const uiState = uiStates.find((s) => s.ticketId === ticket.id);
        if (!uiState) {
          return null;
        }
        return (
          <TicketCard
            key={ticket.id}
            onDecrement={onDecrement}
            onIncrement={onIncrement}
            ticket={ticket}
            uiState={uiState}
          />
        );
      })}
    </div>
  );
}
