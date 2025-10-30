import { dinero, toDecimal } from 'dinero.js';
import type { DineroSnapshot } from '@/lib/schemas/money';

interface PriceProps {
  amount: DineroSnapshot;
  className?: string;
  showCurrency?: boolean;
  strikethrough?: boolean;
}

/**
 * Price display component
 *
 * Formats Dinero.js snapshots using Intl.NumberFormat for proper
 * currency display with locale support.
 *
 * Currently supports USD only. Extend with additional currency imports as needed.
 *
 * @example
 * ```tsx
 * <Price amount={priceSnapshot} />
 * // → "$25.00"
 *
 * <Price amount={priceSnapshot} showCurrency={false} />
 * // → "25.00"
 *
 * <Price amount={originalPrice} strikethrough />
 * // → "$50.00" (strikethrough)
 * ```
 */
export function Price({
  amount,
  className = '',
  showCurrency = true,
  strikethrough = false,
}: PriceProps) {

  if (!amount.currency.code) {
    return <span className={className}>—</span>;
  }

  const money = dinero(amount);
  const decimal = toDecimal(money);

  // Format using Intl.NumberFormat for proper locale support
  const formatted = new Intl.NumberFormat('en-US', {
    style: showCurrency ? 'currency' : 'decimal',
    currency: showCurrency ? amount.currency.code : undefined,
    minimumFractionDigits: amount.scale,
    maximumFractionDigits: amount.scale,
  }).format(Number(decimal));

  return (
    <span
      className={`${strikethrough ? 'line-through' : ''} ${className}`.trim()}
      data-currency={amount.currency.code}
    >
      {formatted}
    </span>
  );
}
