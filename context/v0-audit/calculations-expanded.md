Calculation Logic (Expanded, with code references and nuances)

Overview
- This doc elaborates on the core calculation utilities and checkout session builders, with source references and behavioral notes.

1) calculateAmountsPayNow
- File: src/lib/stripe/calculate-amounts.ts:70-153
- Inputs:
  - priceAmountCents (number | undefined)
  - upgradeAmountCents (number | undefined)
  - fees: { bookingAmountCents, processingAmountPercent, paymentPlanFeeAmountCents? }
  - discountConfig?: { type: 'amount' | 'percent', amount?: number, percentage?: number, ... }
- Flow:
  - Convert fee inputs to Dinero; special case: if discount is 100% percent, zero out processing/booking/payment plan fees (lines 82-86).
  - price + upgrade → subtotal (line 93).
  - Apply discount (lines 155-183):
    - amount: subtract and clamp to zero via `maximum` (lines 165-173).
    - percent: multiply subtotal by percentage, then subtract and scale to 2 (lines 175-183).
  - Compute feeProcessing as percentage of discounted subtotal (line 103).
  - totalFees = booking + processing (line 105-108).
  - applicationFeePayNow = 50% of processing fee (line 110).
  - totalBeforeTax = discounted subtotal + total fees (line 112).
  - tax = totalBeforeTax * 7.5% (taxConfig { amount:75, scale:3 }) rounded halfUp to 2 (lines 114-116).
  - totalAfterTax = totalBeforeTax + tax (line 117).
- Returns: Dinero objects for price, upgrade, fees, tax, totals, discount, etc.
- Nuances:
  - All Dinero values scaled to 2 using `scaleTo2` helper; prevents mixed-scale inconsistencies.
  - The 100% discount branch eliminates all fees (including booking/payment plan) intentionally to make zero-cost flows truly zero-fee.
  - applicationFeePayNow is derived from feeProcessing only (not booking fee).

2) calculateInstallmentsEvenly
- File: src/lib/stripe/calculate-amounts.ts:185-324
- Inputs:
  - calculatedAmounts: output of calculateAmountsPayNow (uses discounted subtotal & fees)
  - numberOfInstallments (>=1)
  - productType: 'trip' | 'card' (drives first installment policy)
- Flow:
  - totalBeforeTax = discounted subtotal + (booking + payment plan + processing) (lines 205-211).
  - tax = totalBeforeTax * taxConfig (line 213).
  - totalAfterTax computed (line 216).
  - First installment minimums:
    - trip: $100.00 (line 221)
    - card: $49.99 (line 223)
    - If totalAfterTax < first minimum, set to $5.00 (line 228-233)
  - Remainder = totalAfterTax - firstInstallment; spread evenly across remaining installments via floor division; remainder kept as `remainder` (lines 235-268, 313-319).
  - For each installment, split amountAfterTax into amountBeforeTax and tax using algebraic inversion with the same tax rate (lines 283-305).
- Returns: { installments: { amountBeforeTax, tax, amountAfterTax }[], remainder }
- Nuances:
  - Ensures a minimum “first payment” by product type; protects against micro-transactions.
  - Uses consistent tax rate for inverse split to keep internal consistency.
  - Remainder preserved to be handled later (e.g., subtracted from fees in payment plan calc).

3) calculateInstallmentDates
- File: src/lib/stripe/calculate-amounts.ts:326-401
- Inputs: interval ('month' | 'week' | 'day'), intervalCount, installments[], productType
- Flow:
  - trip:
    - 1st payment: now
    - 2nd payment: on the 10th of current/next month (ensures >= day 10) (lines 347-365)
    - Remaining: add interval*count from previous date
  - card (and others): simple linear schedule using interval*index (lines 383-397)
- Returns: Date[] aligned with installments
- Nuances:
  - Trip logic enforces a user-friendly/billing-friendly second payment anchor (10th).
  - Card uses evenly spaced schedule from purchase date.

4) calculateAmountsPaymentPlan
- File: src/lib/stripe/calculate-amounts.ts:414-585
- Inputs: priceAmountCents, upgradeAmountCents, fees, discountConfig, interval, intervalCount, numberOfInstallments, productType
- Flow:
  - Start from calculateAmountsPayNow (line 424-431).
  - Build installments with calculateInstallmentsEvenly (line 433-437) → (installments, remainder).
  - totalFeesPreRemainder = booking + payment plan + processing (line 444-449).
  - totalFees = totalFeesPreRemainder - remainder (line 453-455). Rationale: align fee burden with first-payment rounding.
  - totalBeforeTax = discounted subtotal + totalFees (line 459-466).
  - tax, totalAfterTax recomputed (lines 462-466).
  - First installment amounts set based on amountAfterTax (line 468-479).
  - Dates computed via calculateInstallmentDates (line 480-482).
  - applicationFeePaymentPlan = applicationFeePayNow + 50% of paymentPlan fee − remainder (lines 484-491).
  - applicationFeePaymentPlanPercent = percentage(applicationFeePaymentPlan / totalAfterTax) with high precision (scale 8) (lines 494-517).
  - Build payments array: include per-payment application fee by multiplying amountAfterTax by that percentage and scale to 2 (lines 523-546).
  - Provide totals and `schedule` (interval, count, payments) (lines 567-584).
- Nuances:
  - Remainder subtraction from total fees is a smoothing heuristic to balance rounding artifacts into fees rather than principal.
  - applicationFeePaymentPlanPercent avoids division-by-zero (line 499-502) and uses high precision to minimize compounding errors.
  - applicationFeePayNow in metadata for payment plan is derived from PayNow’s application fee (naming quirk; see stripe builders below for usage).

5) toStripeMoney / toCurrency
- File: src/lib/stripe/calculate-amounts.ts:22-48
- toStripeMoney: scales to 2, returns { currency: 'usd', unit_amount } for Stripe usage.
- toCurrency: human-readable formatting using Intl.NumberFormat; always scales to 2 first.

6) createTripCheckoutSessionParams
- File: src/lib/stripe/stripe.ts:284-542
- Flow (shared):
  - Compute both PayNow and PaymentPlan numbers via the calculators.
  - Build line_items + set `sessionParams.mode` and `payment_intent_data` per paymentMethod.
  - Attach rich metadata (core, search params, calculated amounts, product details).
- Pay Now branch:
  - Line items: product subtotal (discounted), fees, tax (lines 364-404).
  - application_fee_amount is set to applicationFeePayNow (line 411-412).
- Installment Plan branch:
  - Mode 'payment' for initial charge only (lines 424-441); unit_amount is first installment after tax (inclusive).
  - application_fee_amount is application fee for the first installment (lines 420-452).
  - Metadata includes arrays of amounts and dates for the full schedule (lines 454-471).
  - Consent/custom_text configured to show agreement text (lines 473-487).
- Nuances:
  - Uses connected account context elsewhere in webhook handling; this builder focuses on per-session correctness.
  - Sets human-friendly line item description indicating remaining payments (line 434-436).

7) createCardCheckoutSessionParams
- File: src/lib/stripe/stripe.ts:544-805
- Flow mirrors the Trip builder with card-specific data and descriptions.
- Pay Now branch:
  - Line items: discounted card price, fees, tax (lines 613-651).
  - application_fee_amount set from applicationFeePayNow (line 659-663).
- Installment Plan branch:
  - Mode 'payment', initial payment line item built from first installment (lines 665-689).
  - application_fee_amount applies to first installment (lines 693-698).
  - Metadata includes amounts + dates; consent configured; line items set (lines 700-734, 726-733).
  - Note: a commented alternative path leaves `line_items` assignment just above; final code sets it at line 726.
- Nuances:
  - Description strings include tier/location/week for clarity (lines 656-663, 772-780).
  - For `card` installment plan, the text informs the number/amount of remaining payments (lines 681-686).

Cross-cutting nuances & tangents
 - Tax config is a module constant ({ amount: 75, scale: 3 }) representing 7.5%; changing tax requires a code change.
- 100% percent discount sets all fees to zero in PayNow calculator (lines 82-86); ensure UX and business policy accept that behavior.
- Application fee semantics:
  - PayNow: 50% of processing fee.
  - PaymentPlan: prior application fee + 50% of payment plan fee, minus rounding remainder; per-installment application fee allocated proportionally by amountAfterTax.
- Installment schedules:
  - Trip: 2nd payment anchored on the 10th; subsequent by interval.
  - Card: strictly interval-based from purchase date.
- Metadata richness:
  - Session metadata carries calculated breakdowns and schedule arrays, enabling fulfillment and analytics without re-computation.
- Rounding:
  - Uses Dinero with controlled scaling and halfUp transforms to reduce Stripe rounding discrepancies.


