// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TicketUIState } from '@/features/ticket-panel/lib/computeTicketUI';
import type { Ticket } from '@/lib/schemas/tickets';
import { TicketList } from '../TicketList';

// Mock the TicketCard component
vi.mock('../TicketCard', () => ({
  TicketCard: ({ ticket, onIncrement, onDecrement }: any) => (
    <div data-testid={`ticket-card-${ticket.id}`}>
      <span>{ticket.name}</span>
      <button onClick={() => onIncrement(ticket.id)} type="button">
        +
      </button>
      <button onClick={() => onDecrement(ticket.id)} type="button">
        -
      </button>
    </div>
  ),
}));

const createMockTicket = (overrides: Partial<Ticket> = {}): Ticket => ({
  id: 'test-ticket',
  name: 'Test Ticket',
  description: 'A test ticket description',
  pricing: {
    ticket: {
      amount: 1000,
      currency: 'USD',
    },
  },
  availabilityLabel: 'Available',
  featured: false,
  status: 'on_sale',
  soldLimit: 'unlimited',
  ...overrides,
});

const createMockUIState = (ticketId: string): TicketUIState => ({
  ticketId,
  isPurchasable: true,
  isGreyedOut: false,
  canIncrement: true,
  canDecrement: true,
  currentQty: 0,
  showTrashIcon: false,
  helperText: null,
  unavailableReason: null,
  isLocked: false,
});

describe('TicketList', () => {
  it('renders empty list when no tickets provided', () => {
    render(
      <TicketList
        onDecrement={vi.fn()}
        onIncrement={vi.fn()}
        tickets={[]}
        uiStates={[]}
      />
    );

    const container = screen.getByTestId('ticket-list');
    expect(container.children).toHaveLength(0);
  });

  it('renders tickets with matching UI states', () => {
    const tickets = [
      createMockTicket({ id: 'ticket-1', name: 'VIP Pass' }),
      createMockTicket({ id: 'ticket-2', name: 'General Admission' }),
    ];
    const uiStates = [
      createMockUIState('ticket-1'),
      createMockUIState('ticket-2'),
    ];

    render(
      <TicketList
        onDecrement={vi.fn()}
        onIncrement={vi.fn()}
        tickets={tickets}
        uiStates={uiStates}
      />
    );

    expect(screen.getByTestId('ticket-card-ticket-1')).toBeDefined();
    expect(screen.getByTestId('ticket-card-ticket-2')).toBeDefined();
    expect(screen.getByText('VIP Pass')).toBeDefined();
    expect(screen.getByText('General Admission')).toBeDefined();
  });

  it('skips tickets without matching UI state', () => {
    const tickets = [
      createMockTicket({ id: 'ticket-1', name: 'VIP Pass' }),
      createMockTicket({ id: 'ticket-2', name: 'General Admission' }),
    ];
    const uiStates = [createMockUIState('ticket-1')]; 

    render(
      <TicketList
        onDecrement={vi.fn()}
        onIncrement={vi.fn()}
        tickets={tickets}
        uiStates={uiStates}
      />
    );

    expect(screen.getByTestId('ticket-card-ticket-1')).toBeDefined();
    expect(screen.queryByTestId('ticket-card-ticket-2')).toBeNull();
  });

  it('calls event handlers with correct ticket IDs', () => {
    const ticket = createMockTicket({ id: 'ticket-1' });
    const uiState = createMockUIState('ticket-1');
    const onIncrement = vi.fn();
    const onDecrement = vi.fn();

    render(
      <TicketList
        onDecrement={onDecrement}
        onIncrement={onIncrement}
        tickets={[ticket]}
        uiStates={[uiState]}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons[0].click(); // increment
    buttons[1].click(); // decrement

    expect(onIncrement).toHaveBeenCalledWith('ticket-1');
    expect(onDecrement).toHaveBeenCalledWith('ticket-1');
  });
});
