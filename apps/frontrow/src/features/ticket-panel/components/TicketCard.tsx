import { AnimatePresence, motion } from 'framer-motion';
import { Info } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { StatusDot } from '@/components/ui/status-dot';
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
    <div className="flex flex-col items-end gap-1">
      <div className="flex min-h-8 items-center justify-end">
        {uiState.isPurchasable ? (
          <QuantityStepper
            ariaDescribedById={uiState.helperText ? helperId : undefined}
            canDecrement={uiState.canDecrement}
            canIncrement={uiState.canIncrement}
            onDecrement={() => onDecrement(ticketId)}
            onIncrement={() => onIncrement(ticketId)}
            showTrashIcon={uiState.showTrashIcon}
            value={uiState.currentQty}
          />
        ) : null}
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
  const [showUnavailableReason, setShowUnavailableReason] =
    React.useState(false);

  const handleMouseEnter = () => {
    setShowUnavailableReason(true);
  };

  const handleMouseLeave = () => {
    setShowUnavailableReason(false);
  };

  const cardClasses = [
    'transition-all duration-200 py-2 px-3',
    ticket.featured
      ? 'bg-primary/5 ring-1 ring-primary/20'
      : 'hover:bg-muted/30',
    uiState.isGreyedOut ? 'cursor-not-allowed opacity-60' : '',
  ].join(' ');

  const availabilityDot = (
    <StatusDot status={uiState.isPurchasable ? 'success' : 'muted'} />
  );

  return (
    <Card
      aria-disabled={uiState.isGreyedOut}
      className={cardClasses}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left column: title, price, description, meta */}
        <div className="w-full min-w-0">
          <div className='flex items-center justify-between gap-2'>
          <h3 className="font-semibold text-base">
            {ticket.name}
            {uiState.helperText && (
              <Badge className="text-xs" variant="secondary">
                {uiState.helperText}
              </Badge>
            )}
          </h3>
          <TicketControls
            helperId={helperId}
            onDecrement={onDecrement}
            onIncrement={onIncrement}
            ticketId={ticket.id}
            uiState={uiState}
          />
          </div>
          <TicketPrice pricing={ticket.pricing} />
          {ticket.description && (
            <p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
              {ticket.description}
            </p>
          )}

          {ticket.availabilityLabel && (
            <div className="mt-2 flex items-center gap-1.5 text-muted-foreground text-xs">
              {availabilityDot}
              <span>{ticket.availabilityLabel}</span>
            </div>
          )}

          {/* Unavailable reason - shown on hover with Framer Motion animation */}
          <AnimatePresence>
            {uiState.unavailableReason && showUnavailableReason && (
              <motion.div
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="mt-2 inline-flex items-center gap-1.5 rounded bg-muted/50 px-2 py-1 text-xs"
                exit={{
                  opacity: 0,
                  y: 5,
                  scale: 0.98,
                  transition: {
                    duration: 0.2,
                    ease: [0.4, 0.0, 1, 1],
                  },
                }}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                layout
                transition={{
                  duration: 0.15,
                  ease: [0.4, 0.0, 0.2, 1],
                }}
              >
                <Info aria-hidden="true" className="h-3.5 w-3.5" />
                {uiState.unavailableReason}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
}
