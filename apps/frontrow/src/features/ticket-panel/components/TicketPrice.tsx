import * as currencies from '@dinero.js/currencies';
import { type Currency, dinero } from 'dinero.js';
import { formatMoney } from '@/lib/utils/format';

interface TicketPriceProps {
  pricing: {
    ticket: { amount: number; currency: string };
    strikePrice?: { amount: number; currency: string };
    fees?: {
      amount: { amount: number; currency: string };
      included: boolean;
      showBreakdown?: boolean;
      label?: string;
    };
    tax?: {
      amount: { amount: number; currency: string };
      included: boolean;
      showBreakdown?: boolean;
      label?: string;
    };
  };
}

const resolveCurrency = (code: string): Currency<number> => {
  const map = currencies as unknown as Record<string, Currency<number>>;
  return map[code] ?? currencies.USD;
};

export function TicketPrice({ pricing }: TicketPriceProps) {
  const unit = dinero({
    amount: pricing.ticket.amount,
    currency: resolveCurrency(pricing.ticket.currency),
  });
  const strike = pricing.strikePrice
    ? dinero({
        amount: pricing.strikePrice.amount,
        currency: resolveCurrency(pricing.strikePrice.currency),
      })
    : null;

  const feesInfo = pricing.fees;
  const taxInfo = pricing.tax;

  return (
    <div>
      {strike && pricing.strikePrice && (
        <div className="text-muted-foreground text-sm line-through">
          {formatMoney(strike, pricing.strikePrice.currency)}
        </div>
      )}
      <div className="font-semibold text-lg">
        {formatMoney(unit, pricing.ticket.currency)}
      </div>
      <div className="text-muted-foreground text-xs">
        {!(feesInfo?.included || taxInfo?.included) && 'plus fees'}
        {feesInfo?.included && feesInfo.showBreakdown && (
          <div>
            (Includes{' '}
            {formatMoney(
              dinero({
                amount: feesInfo.amount.amount,
                currency: resolveCurrency(feesInfo.amount.currency),
              }),
              feesInfo.amount.currency
            )}{' '}
            in fees)
          </div>
        )}
        {taxInfo?.included && taxInfo.showBreakdown && (
          <div>
            (Includes{' '}
            {formatMoney(
              dinero({
                amount: taxInfo.amount.amount,
                currency: resolveCurrency(taxInfo.amount.currency),
              }),
              taxInfo.amount.currency
            )}{' '}
            tax)
          </div>
        )}
      </div>
    </div>
  );
}

