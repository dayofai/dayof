// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TicketPrice } from '../TicketPrice';

describe('TicketPrice', () => {
  it('renders basic ticket price', () => {
    const pricing = {
      ticket: { amount: 2500, currency: 'USD' },
    };

    render(<TicketPrice pricing={pricing} />);

    expect(screen.getByText('$25.00')).toBeDefined();
  });

  it('renders strike price when provided', () => {
    const pricing = {
      ticket: { amount: 2000, currency: 'USD' },
      strikePrice: { amount: 3000, currency: 'USD' },
    };

    render(<TicketPrice pricing={pricing} />);

    expect(screen.getByTestId('savings-badge')).toBeDefined();
  });
});
