import { Info, Plus } from 'lucide-react';
import * as React from 'react';
import type { TicketUIState } from '@/features/ticket-panel/lib/computeTicketUI';
import type { Ticket } from '@/lib/schemas/tickets';
import { QuantityStepper } from './QuantityStepper';
import { TicketPrice } from './TicketPrice';

interface TicketCardProps {
  ticket: Ticket;
  uiState: TicketUIState;
  onIncrement: (ticketId: string) => void;
  onDecrement: (ticketId: string) => void;
}

function TicketControls({
  ticketId,
  uiState,
  helperId,
  onIncrement,
  onDecrement,
}: {
  ticketId: string;
  uiState: TicketUIState;
  helperId: string;
  onIncrement: (ticketId: string) => void;
  onDecrement: (ticketId: string) => void;
}) {
  return (
    <div className="flex w-full flex-col items-end gap-1">
      <div className="flex min-h-8 items-center justify-end">
        {uiState.isPurchasable && !uiState.isLocked ? (
          uiState.currentQty > 0 ? (
            <QuantityStepper
              aria-describedby={uiState.helperText ? helperId : undefined}
              canDecrement={uiState.canDecrement}
              canIncrement={uiState.canIncrement}
              onDecrement={() => onDecrement(ticketId)}
              onIncrement={() => onIncrement(ticketId)}
              showTrashIcon={uiState.showTrashIcon}
              value={uiState.currentQty}
            />
          ) : (
            <button
              aria-describedby={uiState.helperText ? helperId : undefined}
              className="flex h-8 items-center gap-1 rounded-lg border border-border px-3 transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
              disabled={!uiState.canIncrement}
              onClick={() => onIncrement(ticketId)}
              type="button"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
            </button>
          )
        ) : null}
      </div>

      <div
        aria-live="polite"
        className="min-h-4 text-muted-foreground text-xs"
        id={helperId}
        role="note"
      >
        {uiState.helperText ?? '\u00A0'}
      </div>
    </div>
  );
}

export function TicketCard({
  ticket,
  uiState,
  onIncrement,
  onDecrement,
}: TicketCardProps) {
  const helperId = React.useId();
  const containerClasses = [
    'relative rounded-lg p-4 transition-colors',
    ticket.featured
      ? 'bg-primary/5 ring-1 ring-primary/20'
      : 'ring-1 ring-border hover:bg-muted/30',
    uiState.isGreyedOut ? 'cursor-not-allowed opacity-50' : '',
  ].join(' ');

  const availabilityDotClasses = [
    'h-1.5 w-1.5 rounded-full',
    uiState.isPurchasable ? 'bg-green-500' : 'bg-muted',
  ].join(' ');

  return (
    <div aria-disabled={uiState.isGreyedOut} className={containerClasses}>
      {ticket.featured && (
        <div className="absolute top-2 right-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Best Value
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        {/* Left column: title, price, description, meta */}
        <div className="min-w-0">
          <h3 className="font-semibold text-base">{ticket.name}</h3>
          <TicketPrice pricing={ticket.pricing} />
          {ticket.description && (
            <p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
              {ticket.description}
            </p>
          )}

          {ticket.availabilityLabel && (
            <div className="mt-2 flex items-center gap-1.5 text-muted-foreground text-xs">
              <span className={availabilityDotClasses} />
              <span>{ticket.availabilityLabel}</span>
            </div>
          )}

          {uiState.unavailableReason && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded bg-muted/50 px-2 py-1 text-xs">
              <Info aria-hidden="true" className="h-3.5 w-3.5" />
              {uiState.unavailableReason}
            </div>
          )}
        </div>

        {/* Right column: controls */}
        <div className="w-[152px] flex-shrink-0">
          <TicketControls
            helperId={helperId}
            onDecrement={onDecrement}
            onIncrement={onIncrement}
            ticketId={ticket.id}
            uiState={uiState}
          />
        </div>
      </div>
    </div>
  );
}
