import { USD } from '@dinero.js/currencies';
import { add, type Dinero, dinero, multiply } from 'dinero.js';
import type { Ticket } from '@/lib/schemas/tickets';

export const mockTickets: Ticket[] = [
  {
    id: 'vip',
    name: 'VIP All Day Plus Book & Food!',
    description:
      'Enjoy the full day of events including all three movies and lunch...',
    pricing: {
      ticket: { amount: 5500, currency: 'USD' },
      fees: {
        amount: { amount: 550, currency: 'USD' },
        included: false,
        showBreakdown: true,
        label: 'Service Fee',
      },
      tax: {
        amount: { amount: 440, currency: 'USD' },
        included: false,
        showBreakdown: true,
        label: 'Tax',
      },
    },
    status: 'on_sale',
    visibility: 'public',
    availabilityLabel: 'Available until Oct 11 at 12:00 PM PDT',
    salesWindow: { endsAt: '2025-10-11T19:00:00Z' },
    limits: { minPerOrder: 1, maxPerOrder: 10 },
    soldLimit: 100,
    soldCount: 58,
    featured: true,
    badges: ['best_value'],
  },
  {
    id: 'film-1',
    name: 'Show Her the Money',
    pricing: {
      ticket: { amount: 2500, currency: 'USD' },
      fees: {
        amount: { amount: 250, currency: 'USD' },
        included: false,
        showBreakdown: true,
        label: 'Service Fee',
      },
      tax: {
        amount: { amount: 200, currency: 'USD' },
        included: false,
        showBreakdown: true,
        label: 'Tax',
      },
    },
    status: 'on_sale',
    visibility: 'public',
    availabilityLabel: 'Available until Oct 11 at 10:30 AM PDT',
    salesWindow: { endsAt: '2025-10-11T17:30:00Z' },
    soldLimit: 1000,
  },
  {
    id: 'film-2',
    name: 'Lilly',
    pricing: {
      ticket: { amount: 2500, currency: 'USD' },
      fees: {
        amount: { amount: 250, currency: 'USD' },
        included: false,
        showBreakdown: true,
        label: 'Service Fee',
      },
      tax: {
        amount: { amount: 200, currency: 'USD' },
        included: false,
        showBreakdown: true,
        label: 'Tax',
      },
    },
    status: 'on_sale',
    visibility: 'public',
    availabilityLabel: 'Available until Oct 11 at 1:30 PM PDT',
    soldLimit: 1000,
  },
  {
    id: 'film-3',
    name: 'Still Working 9–5',
    pricing: {
      ticket: { amount: 2500, currency: 'USD' },
      fees: {
        amount: { amount: 250, currency: 'USD' },
        included: false,
        showBreakdown: true,
        label: 'Service Fee',
      },
      tax: {
        amount: { amount: 200, currency: 'USD' },
        included: false,
        showBreakdown: true,
        label: 'Tax',
      },
    },
    status: 'on_sale',
    visibility: 'public',
    availabilityLabel: 'Available until Oct 11 at 4:30 PM PDT',
    soldLimit: 1000,
  },
  {
    id: 'group-package',
    name: 'Group Package (4+ people)',
    description:
      'Special rate for groups of 4 or more. Includes reserved seating.',
    pricing: {
      ticket: { amount: 2000, currency: 'USD' },
      fees: {
        amount: { amount: 200, currency: 'USD' },
        included: true,
        showBreakdown: true,
        label: 'Service Fee',
      },
      tax: {
        amount: { amount: 160, currency: 'USD' },
        included: true,
        showBreakdown: true,
        label: 'Tax',
      },
    },
    status: 'on_sale',
    visibility: 'public',
    limits: { minPerOrder: 4, maxPerOrder: 20 },
    soldLimit: 50,
    sortOrder: 2,
  },
  {
    id: 'last-chance',
    name: 'Last Chance Tickets',
    description: 'Final remaining tickets for this event!',
    pricing: {
      ticket: { amount: 3000, currency: 'USD' },
      fees: {
        amount: { amount: 300, currency: 'USD' },
        included: false,
        showBreakdown: true,
        label: 'Service Fee',
      },
      tax: {
        amount: { amount: 240, currency: 'USD' },
        included: false,
        showBreakdown: true,
        label: 'Tax',
      },
    },
    status: 'on_sale',
    visibility: 'public',
    limits: { maxPerOrder: 4 },
    soldLimit: 100,
    soldCount: 97,
    sortOrder: 3,
  },
];

export type MockTicket = (typeof mockTickets)[number];

export const calculateCartTotal = async ({
  eventId: _eventId,
  items,
}: {
  eventId: string;
  items: Array<{ ticketId: string; qty: number }>;
}): Promise<{
  lines: Array<{
    ticketId: string;
    name: string;
    qty: number;
    unitPrice: Dinero<number>;
    lineTotal: Dinero<number>;
  }>;
  subtotal: Dinero<number>;
  fees: Dinero<number>;
  tax: Dinero<number>;
  total: Dinero<number>;
}> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const zero = dinero({ amount: 0, currency: USD });

  // Calculate line totals
  const lines = items.map((item) => {
    const ticket = mockTickets.find((t) => t.id === item.ticketId);
    if (!ticket) {
      throw new Error(`Ticket ${item.ticketId} not found`);
    }

    const unit = dinero({
      amount: ticket.pricing.ticket.amount,
      currency: USD,
    });
    const lineTotal = multiply(unit, { amount: item.qty, scale: 0 });

    return {
      ticketId: item.ticketId,
      name: ticket.name,
      qty: item.qty,
      unitPrice: unit,
      lineTotal,
    };
  });

  const subtotal = lines.reduce((acc, line) => add(acc, line.lineTotal), zero);

  // Percentages as scaled integers
  const fees = multiply(subtotal, { amount: 10, scale: 2 });
  const tax = multiply(subtotal, { amount: 8, scale: 2 });
  const total = add(add(subtotal, fees), tax);

  return { lines, subtotal, fees, tax, total };
};
