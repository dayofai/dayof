import { describe, expect, it } from 'vitest';
import type { Ticket } from '@/lib/schemas/tickets';
import { computeTicketUI } from '../computeTicketUI';

function baseTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 't1',
    name: 'Test',
    pricing: {
      ticket: { amount: 1000, currency: 'USD' },
    },
    status: 'on_sale',
    soldLimit: 100,
    ...overrides,
  } as Ticket;
}

const event = { mixedTicketTypesAllowed: true, timeZone: 'UTC' };

describe('computeTicketUI', () => {
  it('marks purchasable tickets correctly within capacity', () => {
    const rows = [{ ticket: baseTicket(), qty: 0 }];
    const ui = computeTicketUI(rows, event, { hasItems: false });
    expect(ui[0].isPurchasable).toBe(true);
    expect(ui[0].isGreyedOut).toBe(false);
  });

  it('sets unavailable when sold out by capacity', () => {
    const t = baseTicket({ soldLimit: 10, soldCount: 10 });
    const rows = [{ ticket: t, qty: 0 }];
    const ui = computeTicketUI(rows, event, { hasItems: false });
    expect(ui[0].isPurchasable).toBe(false);
    expect(ui[0].unavailableReason).toBe('Sold out');
  });

  it('respects maxPerOrder when computing canIncrement', () => {
    const t = baseTicket({ limits: { maxPerOrder: 2 } });
    const rows = [{ ticket: t, qty: 2 }];
    const ui = computeTicketUI(rows, event, { hasItems: true });
    expect(ui[0].canIncrement).toBe(false);
    expect(ui[0].helperText).toBe('Max 2 per order');
  });

  it('returns helper for approaching maxPerOrder', () => {
    const t = baseTicket({ limits: { maxPerOrder: 3 } });
    const rows = [{ ticket: t, qty: 2 }];
    const ui = computeTicketUI(rows, event, { hasItems: true });
    expect(ui[0].helperText).toBe('1 more available');
  });

  it('returns helper for minPerOrder when qty below min', () => {
    const t = baseTicket({ limits: { minPerOrder: 4, maxPerOrder: 10 } });
    const rows = [{ ticket: t, qty: 2 }];
    const ui = computeTicketUI(rows, event, { hasItems: true });
    expect(ui[0].helperText).toBe('Min 4 required');
  });

  it('locks when mixedTicketTypesAllowed=false and another item is in cart', () => {
    const notMixed = {
      mixedTicketTypesAllowed: false,
      timeZone: 'UTC',
    } as const;
    const t1 = baseTicket({ id: 'a' });
    const t2 = baseTicket({ id: 'b' });
    const rows = [
      { ticket: t1, qty: 1 },
      { ticket: t2, qty: 0 },
    ];
    const ui = computeTicketUI(rows, notMixed, { hasItems: true });
    const locked = ui.find((u) => u.ticketId === 'b');
    expect(locked?.isLocked).toBe(true);
    expect(locked?.unavailableReason).toBe(
      'Remove other tickets to add this one'
    );
  });

  it('shows scheduled copy with start time when scheduled in future', () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const t = baseTicket({
      status: 'scheduled',
      salesWindow: { startsAt: future },
    });
    const rows = [{ ticket: t, qty: 0 }];
    const ui = computeTicketUI(rows, event, { hasItems: false });
    expect(ui[0].unavailableReason?.startsWith('On sale')).toBe(true);
  });

  it('shows "Sale ended" when ended or window passed', () => {
    const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const t = baseTicket({ status: 'ended', salesWindow: { endsAt: past } });
    const rows = [{ ticket: t, qty: 0 }];
    const ui = computeTicketUI(rows, event, { hasItems: false });
    expect(ui[0].unavailableReason?.includes('Sale ended')).toBe(true);
  });
});
