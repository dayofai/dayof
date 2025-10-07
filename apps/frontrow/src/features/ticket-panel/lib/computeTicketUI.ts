import type { Ticket } from '@/lib/schemas/tickets';
import { formatDate } from '@/lib/utils/format';

export interface TicketUIState {
  ticketId: string;
  currentQty: number;
  isPurchasable: boolean;
  isLocked: boolean;
  canIncrement: boolean;
  canDecrement: boolean;
  showTrashIcon: boolean;
  isGreyedOut: boolean;
  unavailableReason: string | null;
  helperText: string | null;
}

function isPurchasableNow(ticket: Ticket, now: Date): boolean {
  const startsOk =
    !ticket.salesWindow?.startsAt ||
    new Date(ticket.salesWindow.startsAt) <= now;
  const endsOk =
    !ticket.salesWindow?.endsAt || new Date(ticket.salesWindow.endsAt) >= now;
  return (
    (ticket.status === 'on_sale' || ticket.status === 'waitlist') &&
    startsOk &&
    endsOk
  );
}

function computeRemaining(ticket: Ticket): number | null {
  if (typeof ticket.soldLimit !== 'number') {
    return null;
  }
  const base = ticket.soldLimit - (ticket.soldCount ?? 0);
  return ticket.allowOversell ? base + (ticket.oversellBuffer ?? 0) : base;
}

function unavailableCopy(
  ticket: Ticket,
  remaining: number | null,
  now: Date,
  timeZone: string,
  isLocked: boolean
): string | null {
  if (isLocked) {
    return 'Remove other tickets to add this one';
  }
  if (ticket.status === 'sold_out' || (remaining !== null && remaining <= 0)) {
    return 'Sold out';
  }
  if (ticket.status === 'scheduled' && ticket.salesWindow?.startsAt) {
    return `On sale ${formatDate(ticket.salesWindow.startsAt, timeZone)}`;
  }
  if (
    ticket.status === 'ended' ||
    (ticket.salesWindow?.endsAt && new Date(ticket.salesWindow.endsAt) < now)
  ) {
    return ticket.salesWindow?.endsAt
      ? `Sale ended ${formatDate(ticket.salesWindow.endsAt, timeZone)}`
      : 'Sale ended';
  }
  if (ticket.status === 'invite_only') {
    return 'Requires unlock code';
  }
  if (ticket.status === 'paused') {
    return 'Temporarily unavailable';
  }
  if (ticket.status === 'external') {
    return 'Available externally';
  }
  return null;
}

function helperCopy(
  ticket: Ticket,
  qty: number,
  remaining: number | null
): string | null {
  if (ticket.limits?.maxPerOrder && qty >= ticket.limits.maxPerOrder) {
    return `Max ${ticket.limits.maxPerOrder} per order`;
  }
  if (remaining !== null && remaining > 0 && remaining <= 5) {
    return `Only ${remaining} left!`;
  }
  if (
    ticket.limits?.maxPerOrder &&
    qty > 0 &&
    qty >= ticket.limits.maxPerOrder - 2
  ) {
    const slotsLeft = ticket.limits.maxPerOrder - qty;
    return `${slotsLeft} more available`;
  }
  if (remaining !== null && remaining > 0 && remaining <= 20) {
    return 'Limited availability';
  }
  if (
    qty === 0 &&
    ticket.limits?.maxPerPerson &&
    ticket.limits.maxPerPerson <= 4
  ) {
    return `Max ${ticket.limits.maxPerPerson} per person`;
  }
  if (
    qty > 0 &&
    ticket.limits?.minPerOrder &&
    qty < ticket.limits.minPerOrder
  ) {
    return `Min ${ticket.limits.minPerOrder} required`;
  }
  return null;
}

export function computeTicketUI(
  rows: Array<{ ticket: Ticket; qty: number }> | undefined,
  event: { mixedTicketTypesAllowed: boolean; timeZone: string },
  cart: { hasItems?: boolean } | undefined
): TicketUIState[] {
  if (!rows) {
    return [];
  }

  const now = new Date();
  const hasItems = !!cart?.hasItems;

  return rows.map(({ ticket: t, qty }) => {
    const remaining = computeRemaining(t);
    let purchasable = isPurchasableNow(t, now);
    if (remaining !== null && remaining <= 0) {
      purchasable = false;
    }

    const inCart = qty > 0;
    const isLocked = !event.mixedTicketTypesAllowed && hasItems && !inCart;

    const maxOrder = t.limits?.maxPerOrder ?? 999;
    const maxPerson = t.limits?.maxPerPerson ?? 999;
    const capacityMax = remaining ?? 999;
    const effectiveMax = Math.min(maxOrder, maxPerson, capacityMax);

    const canIncrement = purchasable && !isLocked && qty < effectiveMax;
    const canDecrement = qty > 0;
    const showTrashIcon = qty === 1;

    const unavailableReason = unavailableCopy(
      t,
      remaining,
      now,
      event.timeZone,
      isLocked
    );
    const helperText = helperCopy(t, qty, remaining);

    return {
      ticketId: t.id,
      currentQty: qty,
      isPurchasable: purchasable,
      isLocked,
      canIncrement,
      canDecrement,
      showTrashIcon,
      isGreyedOut: !purchasable || isLocked,
      unavailableReason,
      helperText,
    };
  });
}
