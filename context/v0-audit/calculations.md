Non-Rule Calculation Logic (to keep in domain/effects)

Pricing & Fees (Dinero)
- calculateAmountsPayNow(price, discount, fees, upgrade) → subtotal, discount, fees, tax, total, applicationFeePayNow
  - Source: src/lib/stripe/calculate-amounts.ts:70-153
  - Special case: 100% percent discount zeroes processing/booking/payment-plan fees
    - Source: src/lib/stripe/calculate-amounts.ts:82-86
- calculateInstallmentsEvenly(calculatedAmounts, numberOfInstallments, productType) → per-installment amounts
  - Source: src/lib/stripe/calculate-amounts.ts:185-324
- calculateInstallmentDates(interval, intervalCount, installments, productType) → dates
  - Source: src/lib/stripe/calculate-amounts.ts:326-401
- calculateAmountsPaymentPlan(...) → includes schedule, applicationFeePaymentPlan, percentages
  - Source: src/lib/stripe/calculate-amounts.ts:414-585
- toStripeMoney Dinero → Stripe minor units mapping
  - Source: src/lib/stripe/calculate-amounts.ts:35-48
- toCurrency formatting helper
  - Source: src/lib/stripe/calculate-amounts.ts:22-33

Upgrade Computation
- getUpgradeData(userId) computes VIP upgrade for Standard cards (same week/location), priceDiff = max(0, vipPrice - currentPrice)
  - Source: src/data/cards/upgrade.ts:138-194

Checkout Session Construction
- createCardCheckoutSessionParams: builds session params and fee/tax/upgrade amounts for cards
  - Source: src/lib/stripe/stripe.ts:544-613
- createTripCheckoutSessionParams: builds session params for trips
  - Source: src/lib/stripe/stripe.ts:284-542
- createCheckoutSession(action): orchestrates session creation and connected account targeting
  - Source: src/actions.ts:186-316

Ticket Purchase Calculations
- createTicketCheckoutSession: computes subtotal/fees/tax for tickets and builds line items
  - Source: src/actions.ts:663-819


