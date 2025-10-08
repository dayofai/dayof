import { coalesce, eq, useLiveQuery } from '@tanstack/react-db';
import { useDebouncedValue } from '@tanstack/react-pacer/debouncer';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ClientOnly } from '@tanstack/react-router';
import * as React from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { computeTicketUI } from '@/features/ticket-panel/lib/computeTicketUI';
import { cartCollection } from '@/lib/collections/cart';
import { ticketsCollection } from '@/lib/collections/tickets';
import { calculateCartTotal } from '@/lib/mock-data';
import type { CartItem } from '@/lib/schemas/cart';
import type { Event } from '@/lib/schemas/event';
import { CartFooter } from './CartFooter';
import { TicketList } from './TicketList';

export type ServerPricing = Awaited<ReturnType<typeof calculateCartTotal>>;

interface TicketsPanelProps {
  eventId: string;
  event: Pick<Event, 'mixedTicketTypesAllowed' | 'currency' | 'timeZone'>;
  onCheckout: (
    cartItems: CartItem[],
    pricing: ServerPricing | undefined
  ) => void;
  onChange?: (cartItems: CartItem[]) => void;
  ui?: { showHeader?: boolean; ctaLabel?: string };
}

export function TicketsPanel(props: TicketsPanelProps) {
  return (
    <ClientOnly fallback={<TicketsPanelSkeleton />}>
      <TicketsPanelClient {...props} />
    </ClientOnly>
  );
}

// TODO: Improve design for skeleton
function TicketsPanelSkeleton() {
  return (
    <Card className="bg-card/80 shadow-lg ring-1 ring-border backdrop-blur-[16px]">
      <CardHeader className="border-border border-b">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-2 h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton className="h-24 rounded-lg" key={i} />
        ))}
      </CardContent>
      <CardFooter className="border-border border-t bg-background/50">
        <Skeleton className="h-11 w-full rounded-lg" />
      </CardFooter>
    </Card>
  );
}

function TicketsPanelClient({
  eventId,
  event,
  onCheckout,
  onChange,
  ui,
}: TicketsPanelProps) {
  const { data: rows } = useLiveQuery((q) =>
    q
      .from({ ticket: ticketsCollection })
      .leftJoin({ cart: cartCollection }, ({ ticket, cart }) =>
        eq(ticket.id, cart.ticketId)
      )
      .select(({ ticket, cart }) => ({ ticket, qty: coalesce(cart?.qty, 0) }))
      .orderBy(({ ticket }) => coalesce(ticket.sortOrder, 999))
      .orderBy(({ ticket }) => ticket.id)
  );

  const { data: cartItems } = useLiveQuery((q) =>
    q.from({ cart: cartCollection })
  );

  // Compute cart state from cartItems array
  const cartState = React.useMemo(() => {
    if (!cartItems) {
      return { totalQty: 0, hasItems: false };
    }
    const totalQty = cartItems.reduce((sum, item) => sum + item.qty, 0);
    return {
      totalQty,
      hasItems: cartItems.length > 0,
    };
  }, [cartItems]);

  const memo = React.useMemo(() => {
    if (!rows) {
      return { tickets: [], ui: [] };
    }
    return {
      tickets: rows.map((r) => r.ticket),
      ui: computeTicketUI(rows, event, cartState),
    };
  }, [rows, event, cartState]);

  const cartItemsArray = cartItems ?? [];
  const [debouncedCartItems] = useDebouncedValue(cartItemsArray, { wait: 500 });
  const {
    data: pricing,
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: ['cart-pricing', eventId, debouncedCartItems],
    queryFn: () =>
      calculateCartTotal({
        eventId,
        items: debouncedCartItems.map((i) => ({
          ticketId: i.ticketId,
          qty: i.qty,
        })),
      }),
    enabled: cartState?.hasItems ?? false,
    placeholderData: keepPreviousData,
  });

  const handleIncrement = (ticketId: string) => {
    const existing = cartCollection.get(ticketId);
    if (existing) {
      cartCollection.update(ticketId, (draft) => {
        draft.qty += 1;
      });
    } else {
      cartCollection.insert({ ticketId, qty: 1 });
    }
    onChange?.(cartCollection.toArray);
  };

  const handleDecrement = (ticketId: string) => {
    const existing = cartCollection.get(ticketId);
    if (!existing) {
      return;
    }
    if (existing.qty === 1) {
      cartCollection.delete(ticketId);
    } else {
      cartCollection.update(ticketId, (draft) => {
        draft.qty -= 1;
      });
    }
    onChange?.(cartCollection.toArray);
  };

  return (
    <Card className="rounded-sm bg-card/80 shadow-lg ring-1 ring-border backdrop-blur-[16px]">
      {ui?.showHeader !== false && (
        <CardHeader className="min-h-lh border-border border-b py-2">
          <CardTitle>Get Tickets</CardTitle>
        </CardHeader>
      )}

      <CardContent className="px-3 py-4">
        <TicketList
          onDecrement={handleDecrement}
          onIncrement={handleIncrement}
          tickets={memo.tickets}
          uiStates={memo.ui}
        />
      </CardContent>

      <CardFooter className="border-border border-t bg-background/50 p-0">
        <CartFooter
          cartState={cartState}
          ctaLabel={ui?.ctaLabel}
          currency={event.currency}
          error={error}
          isPricingLoading={isPending}
          onCheckout={() => onCheckout(cartItemsArray, pricing)}
          onRetry={() => refetch()}
          pricing={pricing}
        />
      </CardFooter>
    </Card>
  );
}
