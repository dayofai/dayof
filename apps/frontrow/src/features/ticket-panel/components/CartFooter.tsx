import { type Dinero, isZero } from 'dinero.js';
import { SummaryRow } from '@/components/ui/summary-row';
import { formatMoney, pluralizeTickets } from '@/lib/utils/format';

interface CartFooterProps {
  cartState: { totalQty: number; hasItems: boolean } | undefined;
  pricing?: {
    subtotal: Dinero<number>;
    fees: Dinero<number>;
    tax: Dinero<number>;
    total: Dinero<number>;
  };
  currency: string;
  isPricingLoading: boolean;
  error?: unknown;
  onRetry?: () => void;
  ctaLabel?: string;
  onCheckout: () => void;
}

export function CartFooter(props: CartFooterProps) {
  const {
    cartState,
    pricing,
    currency,
    isPricingLoading,
    error,
    onRetry,
    ctaLabel,
    onCheckout,
  } = props;
  const hasItems = !!cartState?.hasItems;

  const renderError = () => {
    if (!(hasItems && error)) {
      return null;
    }
    return (
      <div className="space-y-3">
        <div className="text-destructive text-sm">
          We're having trouble calculating totals. Try again in a bit.
        </div>
        {onRetry ? (
          <button
            className="h-11 w-full rounded-lg bg-secondary font-medium text-secondary-foreground transition-colors hover:bg-secondary/90"
            onClick={onRetry}
            type="button"
          >
            Retry
          </button>
        ) : null}
      </div>
    );
  };

  const renderPricing = () => {
    if (!(hasItems && pricing)) {
      return null;
    }
    return (
      <div className="space-y-3">
        <div
          aria-atomic="true"
          aria-live="polite"
          className="space-y-1.5 text-sm"
        >
          <SummaryRow
            label={
              <span className="text-muted-foreground">
                Subtotal ({cartState?.totalQty}{' '}
                {pluralizeTickets(cartState?.totalQty ?? 0)})
              </span>
            }
            value={formatMoney(pricing.subtotal, currency)}
          />
          {isZero(pricing.fees) ? null : (
            <SummaryRow
              className="text-xs"
              label={
                <span className="text-muted-foreground">Service fees</span>
              }
              muted
              value={`+${formatMoney(pricing.fees, currency)}`}
            />
          )}
          {isZero(pricing.tax) ? null : (
            <SummaryRow
              className="text-xs"
              label={<span className="text-muted-foreground">Tax</span>}
              muted
              value={`+${formatMoney(pricing.tax, currency)}`}
            />
          )}
          <div className="my-2 border-border border-t" />
          <SummaryRow
            label={<span>Total</span>}
            size="lg"
            value={formatMoney(pricing.total, currency)}
          />
        </div>
        <button
          className="h-11 w-full rounded-lg bg-primary font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          disabled={isPricingLoading || !hasItems}
          onClick={onCheckout}
          type="button"
        >
          {isPricingLoading
            ? 'Calculating...'
            : ctaLabel || `Get ${pluralizeTickets(cartState?.totalQty ?? 0)}`}
        </button>
      </div>
    );
  };

  const renderLoading = () => {
    if (!(hasItems && isPricingLoading)) {
      return null;
    }
    return (
      <button
        className="h-11 w-full rounded-lg bg-primary font-medium text-primary-foreground"
        disabled
        type="button"
      >
        Calculating...
      </button>
    );
  };

  const renderEmpty = () => {
    if (hasItems) {
      return null;
    }
    return (
      <button
        className="h-11 w-full cursor-not-allowed rounded-lg bg-secondary font-medium text-secondary-foreground opacity-50"
        disabled
        type="button"
      >
        Select tickets to continue
      </button>
    );
  };

  return (
    <div className="w-full border-border border-t bg-background/50 p-4">
      {renderError()}
      {renderPricing()}
      {renderLoading()}
      {renderEmpty()}
    </div>
  );
}
