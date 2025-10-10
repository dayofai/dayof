// @vitest-environment jsdom
/** biome-ignore-all lint/style/noNonNullAssertion: <explanation> */
import { USD } from '@dinero.js/currencies';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { dinero } from 'dinero.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CartFooter } from '../CartFooter';

const money = (amount: number) => dinero({ amount, currency: USD });

describe('CartFooter', () => {
  afterEach(() => {
    cleanup();
  });
  describe('Empty state', () => {
    it('renders empty state when no items selected', () => {
      render(
        <CartFooter
          cartState={{ totalQty: 0, hasItems: false }}
          currency="USD"
          isPricingLoading={false}
          onCheckout={vi.fn()}
        />
      );
      expect(Boolean(screen.queryByText('Select tickets to continue'))).toBe(
        true
      );
    });

    it('renders empty state when cartState is undefined', () => {
      render(
        <CartFooter
          cartState={undefined}
          currency="USD"
          isPricingLoading={false}
          onCheckout={vi.fn()}
        />
      );
      expect(Boolean(screen.queryByText('Select tickets to continue'))).toBe(
        true
      );
    });

    it('renders empty state when hasItems is false despite totalQty > 0', () => {
      render(
        <CartFooter
          cartState={{ totalQty: 5, hasItems: false }}
          currency="USD"
          isPricingLoading={false}
          onCheckout={vi.fn()}
        />
      );
      expect(Boolean(screen.queryByText('Select tickets to continue'))).toBe(
        true
      );
    });
  });

  describe('Pricing display', () => {
    it('renders pricing and handles checkout click', () => {
      const onCheckout = vi.fn();
      render(
        <CartFooter
          cartState={{ totalQty: 2, hasItems: true }}
          currency="USD"
          isPricingLoading={false}
          onCheckout={onCheckout}
          pricing={{
            subtotal: money(2000),
            fees: money(200),
            tax: money(160),
            total: money(2360),
          }}
        />
      );
      expect(Boolean(screen.queryByText('Subtotal (2 tickets)'))).toBe(true);
      const buttons = screen.getAllByRole('button');
      const checkoutBtn = buttons.find((btn) =>
        btn.textContent?.includes('Get tickets')
      );
      expect(checkoutBtn).toBeDefined();
      fireEvent.click(checkoutBtn!);
      expect(onCheckout).toHaveBeenCalledTimes(1);
    });

    it('renders single ticket pricing correctly', () => {
      render(
        <CartFooter
          cartState={{ totalQty: 1, hasItems: true }}
          currency="USD"
          isPricingLoading={false}
          onCheckout={vi.fn()}
          pricing={{
            subtotal: money(1000),
            fees: money(0),
            tax: money(0),
            total: money(1000),
          }}
        />
      );
      expect(Boolean(screen.queryByText('Subtotal (1 ticket)'))).toBe(true);
      expect(Boolean(screen.queryByText('Get ticket'))).toBe(true);
    });

    it('hides fees when zero', () => {
      render(
        <CartFooter
          cartState={{ totalQty: 1, hasItems: true }}
          currency="USD"
          isPricingLoading={false}
          onCheckout={vi.fn()}
          pricing={{
            subtotal: money(1000),
            fees: money(0),
            tax: money(100),
            total: money(1100),
          }}
        />
      );
      expect(Boolean(screen.queryByText('Service fees'))).toBe(false);
      expect(Boolean(screen.queryByText('Tax'))).toBe(true);
    });

    it('hides tax when zero', () => {
      render(
        <CartFooter
          cartState={{ totalQty: 1, hasItems: true }}
          currency="USD"
          isPricingLoading={false}
          onCheckout={vi.fn()}
          pricing={{
            subtotal: money(1000),
            fees: money(50),
            tax: money(0),
            total: money(1050),
          }}
        />
      );
      expect(Boolean(screen.queryByText('Service fees'))).toBe(true);
      expect(Boolean(screen.queryByText('Tax'))).toBe(false);
    });

    it('shows both fees and tax when both are non-zero', () => {
      render(
        <CartFooter
          cartState={{ totalQty: 1, hasItems: true }}
          currency="USD"
          isPricingLoading={false}
          onCheckout={vi.fn()}
          pricing={{
            subtotal: money(1000),
            fees: money(50),
            tax: money(100),
            total: money(1150),
          }}
        />
      );
      expect(Boolean(screen.queryByText('Service fees'))).toBe(true);
      expect(Boolean(screen.queryByText('Tax'))).toBe(true);
    });

    it('does not render pricing when pricing is undefined', () => {
      render(
        <CartFooter
          cartState={{ totalQty: 1, hasItems: true }}
          currency="USD"
          isPricingLoading={false}
          onCheckout={vi.fn()}
        />
      );
      expect(Boolean(screen.queryByText('Subtotal'))).toBe(false);
      expect(Boolean(screen.queryByText('Total'))).toBe(false);
    });
  });

  describe('Loading states', () => {
    it('shows loading button when isPricingLoading is true', () => {
      render(
        <CartFooter
          cartState={{ totalQty: 1, hasItems: true }}
          currency="USD"
          isPricingLoading={true}
          onCheckout={vi.fn()}
        />
      );
      const buttons = screen.getAllByRole('button');
      const loadingBtn = buttons.find(
        (btn) => btn.textContent === 'Calculating...'
      );
      expect(loadingBtn).toBeDefined();
      expect((loadingBtn as HTMLButtonElement).disabled).toBe(true);
    });

    it('disables checkout button when loading', () => {
      const onCheckout = vi.fn();
      render(
        <CartFooter
          cartState={{ totalQty: 1, hasItems: true }}
          currency="USD"
          isPricingLoading={true}
          onCheckout={onCheckout}
          pricing={{
            subtotal: money(1000),
            fees: money(0),
            tax: money(0),
            total: money(1000),
          }}
        />
      );
      const buttons = screen.getAllByRole('button');
      const loadingBtn = buttons.find(
        (btn) => btn.textContent === 'Calculating...'
      );
      expect((loadingBtn as HTMLButtonElement).disabled).toBe(true);
      fireEvent.click(loadingBtn!);
      expect(onCheckout).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('shows error message when error is present', () => {
      render(
        <CartFooter
          cartState={{ totalQty: 1, hasItems: true }}
          currency="USD"
          error="Network error"
          isPricingLoading={false}
          onCheckout={vi.fn()}
        />
      );
      expect(
        Boolean(
          screen.queryByText(
            "We're having trouble calculating totals. Try again in a bit."
          )
        )
      ).toBe(true);
    });

    it('does not show error when no items', () => {
      render(
        <CartFooter
          cartState={{ totalQty: 0, hasItems: false }}
          currency="USD"
          error="Network error"
          isPricingLoading={false}
          onCheckout={vi.fn()}
        />
      );
      expect(
        Boolean(
          screen.queryByText(
            "We're having trouble calculating totals. Try again in a bit."
          )
        )
      ).toBe(false);
    });

    it('shows retry button when onRetry is provided', () => {
      const onRetry = vi.fn();
      render(
        <CartFooter
          cartState={{ totalQty: 1, hasItems: true }}
          currency="USD"
          error="Network error"
          isPricingLoading={false}
          onCheckout={vi.fn()}
          onRetry={onRetry}
        />
      );
      const buttons = screen.getAllByRole('button');
      const retryBtn = buttons.find((btn) => btn.textContent === 'Retry');
      expect(retryBtn).toBeDefined();
      fireEvent.click(retryBtn!);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('does not show retry button when onRetry is not provided', () => {
      render(
        <CartFooter
          cartState={{ totalQty: 1, hasItems: true }}
          currency="USD"
          error="Network error"
          isPricingLoading={false}
          onCheckout={vi.fn()}
        />
      );
      expect(Boolean(screen.queryByText('Retry'))).toBe(false);
    });
  });

  describe('Checkout disabled states', () => {
    it('disables checkout when checkoutDisabled is true', () => {
      const onCheckout = vi.fn();
      render(
        <CartFooter
          cartState={{ totalQty: 1, hasItems: true }}
          checkoutDisabled
          currency="USD"
          isPricingLoading={false}
          onCheckout={onCheckout}
          pricing={{
            subtotal: money(1000),
            fees: money(0),
            tax: money(0),
            total: money(1000),
          }}
        />
      );
      const buttons = screen.getAllByRole('button');
      const checkoutBtn = buttons.find((btn) =>
        btn.textContent?.includes('Get ticket')
      );
      expect((checkoutBtn as HTMLButtonElement).disabled).toBe(true);
    });

    it('disables checkout when checkoutDisabled is false', () => {
      const onCheckout = vi.fn();
      render(
        <CartFooter
          cartState={{ totalQty: 1, hasItems: true }}
          checkoutDisabled={false}
          currency="USD"
          isPricingLoading={false}
          onCheckout={onCheckout}
          pricing={{
            subtotal: money(1000),
            fees: money(0),
            tax: money(0),
            total: money(1000),
          }}
        />
      );
      const buttons = screen.getAllByRole('button');
      const checkoutBtn = buttons.find((btn) =>
        btn.textContent?.includes('Get ticket')
      );
      expect((checkoutBtn as HTMLButtonElement).disabled).toBe(false);
    });

    it('disables checkout when checkoutDisabled is undefined', () => {
      const onCheckout = vi.fn();
      render(
        <CartFooter
          cartState={{ totalQty: 1, hasItems: true }}
          currency="USD"
          isPricingLoading={false}
          onCheckout={onCheckout}
          pricing={{
            subtotal: money(1000),
            fees: money(0),
            tax: money(0),
            total: money(1000),
          }}
        />
      );
      const buttons = screen.getAllByRole('button');
      const checkoutBtn = buttons.find((btn) =>
        btn.textContent?.includes('Get ticket')
      );
      expect((checkoutBtn as HTMLButtonElement).disabled).toBe(false);
    });
  });

  describe('CTA label variations', () => {
    it('uses custom ctaLabel when provided', () => {
      render(
        <CartFooter
          cartState={{ totalQty: 1, hasItems: true }}
          ctaLabel="Purchase Now"
          currency="USD"
          isPricingLoading={false}
          onCheckout={vi.fn()}
          pricing={{
            subtotal: money(1000),
            fees: money(0),
            tax: money(0),
            total: money(1000),
          }}
        />
      );
      expect(Boolean(screen.queryByText('Purchase Now'))).toBe(true);
    });

    it('uses default label when ctaLabel is undefined', () => {
      render(
        <CartFooter
          cartState={{ totalQty: 1, hasItems: true }}
          currency="USD"
          isPricingLoading={false}
          onCheckout={vi.fn()}
          pricing={{
            subtotal: money(1000),
            fees: money(0),
            tax: money(0),
            total: money(1000),
          }}
        />
      );
      expect(Boolean(screen.queryByText('Get ticket'))).toBe(true);
    });

    it('uses default label when ctaLabel is empty string', () => {
      render(
        <CartFooter
          cartState={{ totalQty: 1, hasItems: true }}
          ctaLabel=""
          currency="USD"
          isPricingLoading={false}
          onCheckout={vi.fn()}
          pricing={{
            subtotal: money(1000),
            fees: money(0),
            tax: money(0),
            total: money(1000),
          }}
        />
      );
      expect(Boolean(screen.queryByText('Get ticket'))).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('handles zero totalQty with hasItems true', () => {
      render(
        <CartFooter
          cartState={{ totalQty: 0, hasItems: true }}
          currency="USD"
          isPricingLoading={false}
          onCheckout={vi.fn()}
          pricing={{
            subtotal: money(0),
            fees: money(0),
            tax: money(0),
            total: money(0),
          }}
        />
      );
      expect(Boolean(screen.queryByText('Subtotal (0 tickets)'))).toBe(true);
    });

    it('handles very large quantities', () => {
      render(
        <CartFooter
          cartState={{ totalQty: 999, hasItems: true }}
          currency="USD"
          isPricingLoading={false}
          onCheckout={vi.fn()}
          pricing={{
            subtotal: money(999_000),
            fees: money(0),
            tax: money(0),
            total: money(999_000),
          }}
        />
      );
      expect(Boolean(screen.queryByText('Subtotal (999 tickets)'))).toBe(true);
      expect(Boolean(screen.queryByText('Get tickets'))).toBe(true);
    });

    it('handles different currencies', () => {
      render(
        <CartFooter
          cartState={{ totalQty: 1, hasItems: true }}
          currency="EUR"
          isPricingLoading={false}
          onCheckout={vi.fn()}
          pricing={{
            subtotal: money(1000),
            fees: money(0),
            tax: money(0),
            total: money(1000),
          }}
        />
      );
      // Currency formatting is handled by formatMoney utility
      expect(Boolean(screen.queryByText('Subtotal (1 ticket)'))).toBe(true);
    });
  });
});
