import * as currencies from '@dinero.js/currencies';
import { type Currency, dinero } from 'dinero.js';
import { InfoPopover } from '@/components/ui/info-popover';
import { formatMoney } from '@/lib/utils/format';
import { Badge } from '@/components/ui/badge';
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

  // Pre-format breakdown amounts if available
  const feesAmount = feesInfo
    ? dinero({
        amount: feesInfo.amount.amount,
        currency: resolveCurrency(feesInfo.amount.currency),
      })
    : null;
  const taxAmount = taxInfo
    ? dinero({
        amount: taxInfo.amount.amount,
        currency: resolveCurrency(taxInfo.amount.currency),
      })
    : null;

  const savingsAmount =
    strike && pricing.strikePrice
      ? dinero({
          amount: pricing.strikePrice.amount - pricing.ticket.amount,
          currency: resolveCurrency(pricing.strikePrice.currency),
        })
      : null;

  return (
    <div className="flex items-center">
      <div className="flex items-baseline gap-2">
        <span className="font-semibold text-lg">
          {formatMoney(unit, pricing.ticket.currency)}
        </span>
      </div>

      {savingsAmount && (
        <Badge variant="secondary" className='text-xs ml-1' data-testid="savings-badge">
          Save {formatMoney(savingsAmount, pricing.strikePrice!.currency)}
        </Badge>
      )}
      
      {(feesInfo?.showBreakdown || taxInfo?.showBreakdown) && (
        <InfoPopover buttonClassName="ml-2" data-testid="info-popover">
          {feesInfo?.showBreakdown && feesAmount ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">
                {feesInfo?.label ?? 'Fees'}
              </span>
              <span className="font-medium">
                {formatMoney(feesAmount, feesInfo.amount.currency)}
              </span>
            </div>
          ) : null}
          {taxInfo?.showBreakdown && taxAmount ? (
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="text-muted-foreground">
                {taxInfo?.label ?? 'Tax'}
              </span>
              <span className="font-medium">
                {formatMoney(taxAmount, taxInfo.amount.currency)}
              </span>
            </div>
          ) : null}
        </InfoPopover>
        
      )}


    </div>
  );
}
