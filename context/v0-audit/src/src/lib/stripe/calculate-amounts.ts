import { paymentPlans } from '@/schema'
import { USD } from '@dinero.js/currencies'
import {
  Dinero,
  add,
  dinero,
  down,
  maximum,
  multiply,
  subtract,
  toDecimal,
  toSnapshot,
  transformScale,
  halfUp,
  allocate,
} from 'dinero.js'
import { InferSelectModel } from 'drizzle-orm'
import { TDiscount } from './models'

const scaleTo2 = (amount: Dinero<number>) => transformScale(amount, 2, down)

export const toCurrency = (amount: Dinero<number>) => {
  const scaled = scaleTo2(amount)

  const decimal = toDecimal(scaled)

  // console.log({ amount: toDecimal(amount) })
  // console.log({ decimal })

  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(decimal),
  )
}

export function toStripeMoney(dineroObject: Dinero<number>) {
  const scaled = scaleTo2(dineroObject)

  const { currency, amount } = toSnapshot(scaled)

  const result = {
    currency: currency.code.toLowerCase(),
    unit_amount: amount,
  }

  // console.log({ result })

  return result
}

export enum Interval {
  MONTH = 'month',
  WEEK = 'week',
  DAY = 'day',
}

const taxConfig = { amount: 75, scale: 3 }

export type TCalculateAmountsPayNowResponse = ReturnType<typeof calculateAmountsPayNow>
export type TCalculateAmountsPayNowParams = {
  priceAmountCents?: number
  upgradeAmountCents?: number
  fees: {
    bookingAmountCents: number
    processingAmountPercent: number
    paymentPlanFeeAmountCents?: number
  }
  discountConfig?: TDiscount
}

export const calculateAmountsPayNow = ({
  priceAmountCents,
  upgradeAmountCents,
  fees: { bookingAmountCents, processingAmountPercent, paymentPlanFeeAmountCents },
  discountConfig,
}: TCalculateAmountsPayNowParams) => {
  //   Fees

  let feeConfigProcessing = { amount: processingAmountPercent, scale: 2 }
  let feeBooking = dinero({ amount: bookingAmountCents, currency: USD })
  let feePaymentPlan = dinero({ amount: paymentPlanFeeAmountCents ?? 0, currency: USD })

  if (discountConfig?.type === 'percent' && discountConfig.percentage === 100) {
    feeConfigProcessing = { amount: 0, scale: 2 }
    feeBooking = dinero({ amount: 0, currency: USD })
    feePaymentPlan = dinero({ amount: 0, currency: USD })
  }

  //   Constants
  const price = dinero({ amount: priceAmountCents ?? 0, currency: USD })
  const upgrade = dinero({ amount: upgradeAmountCents ?? 0, currency: USD })

  //   Calculations
  const subtotal = add(price, upgrade)

  // Subtotal - Discount
  const subtotalDiscounted = calculateDiscountedSubtotal({
    subtotal,
    discountConfig: discountConfig,
  })

  const discount = subtract(subtotal, subtotalDiscounted)

  const feeProcessing = scaleTo2(multiply(subtotalDiscounted, feeConfigProcessing))

  const totalFees = [feeBooking, feeProcessing].reduce(
    (acc, fee) => add(acc, fee),
    dinero({ amount: 0, currency: USD }),
  )

  const applicationFeePayNow = multiply(feeProcessing, { amount: 50, scale: 2 })

  const totalBeforeTax = add(subtotalDiscounted, totalFees)

  const taxAtScale3 = multiply(totalBeforeTax, taxConfig)
  const tax = transformScale(taxAtScale3, 2, halfUp)

  const totalAfterTax = add(totalBeforeTax, tax)

  // console log price, subtotal, feeprocessing, feebooking, feepaymentplan, totalfees, applicationfeepaynow, totalbeforetax, tax, totalaftertax with emoji's
  console.log('💵 Price:', toDecimal(price))
  console.log('💵 Subtotal:', toDecimal(subtotal))
  console.log('💵 Fee Processing:', toDecimal(feeProcessing))
  console.log('💵 Fee Booking:', toDecimal(feeBooking))
  console.log('💵 Fee Payment Plan:', toDecimal(feePaymentPlan))
  console.log('💵 Total Fees:', toDecimal(totalFees))
  console.log('💵 Application Fee Pay Now:', toDecimal(applicationFeePayNow))
  console.log('💵 Total Before Tax:', toDecimal(totalBeforeTax))
  console.log('💵 Tax:', toDecimal(tax))
  console.log('💵 Total After Tax:', toDecimal(totalAfterTax))
  console.log('💵 Fee Percentage:', toDecimal(feeProcessing))


  return {
    // Config,
    discountConfig,
    // Constants
    price,
    upgrade,
    // Fees
    feeBooking,
    feePaymentPlan,
    feeProcessing,
    applicationFeePayNow,
    // Calculations
    subtotal,
    subtotalDiscounted,
    discount,
    totalFees,
    totalBeforeTax,
    tax,
    totalAfterTax,
  }
}

const calculateDiscountedSubtotal = ({
  subtotal,
  discountConfig,
}: {
  subtotal: Dinero<number>
  discountConfig?: TDiscount
}) => {
  //  If there is no discount, return the subtotal
  if (!discountConfig) return subtotal

  // If the discount is an amount, subtract it from the subtotal
  if (discountConfig.type === 'amount') {
    let subtotalDiscounted = subtract(
      subtotal,
      dinero({ amount: discountConfig.amount, currency: USD }),
    )
    subtotalDiscounted = maximum([subtotalDiscounted, dinero({ amount: 0, currency: USD })])
    return subtotalDiscounted
  }

  const discount = multiply(subtotal, {
    amount: discountConfig.percentage,
    scale: 2,
  })

  const subtotalDiscounted = subtract(subtotal, discount)

  return scaleTo2(subtotalDiscounted)
}

export const calculateInstallmentsEvenly = ({
  calculatedAmounts,
  numberOfInstallments,
  productType,
}: {
  calculatedAmounts: ReturnType<typeof calculateAmountsPayNow>;
  numberOfInstallments: number;
  productType: 'trip' | 'card'; // Define allowed payment types
}) => {
  const {
    subtotalDiscounted,
    feeBooking,
    feePaymentPlan,
    feeProcessing,
  } = calculatedAmounts;

  if (numberOfInstallments < 1) {
    throw new Error('Number of installments must be at least 1');
  }

  // Calculate totalBeforeTax by adding fees to the discounted subtotal
  const totalFees = [feeBooking, feePaymentPlan, feeProcessing].reduce(
    (acc, fee) => add(acc, fee),
    dinero({ amount: 0, currency: USD }),
  );
  const totalBeforeTax = add(subtotalDiscounted, totalFees);

  // Calculate the tax
  const tax = scaleTo2(multiply(totalBeforeTax, taxConfig));

  // Calculate totalAfterTax
  const totalAfterTax = add(totalBeforeTax, tax);

  // Set first installment amount based on payment type
  let firstInstallmentAmountMinorUnits: number;
  if (productType === 'trip') {
    firstInstallmentAmountMinorUnits = 10000; // $100.00
  } else if (productType === 'card') {
    firstInstallmentAmountMinorUnits = 4999; // $49.99
  } else {
    throw new Error('Invalid payment type');
  }

  const minimumFirstInstallment = 500; // $5 in minor units (cents)

  if (toSnapshot(totalAfterTax).amount < firstInstallmentAmountMinorUnits) {
    console.log(`Total amount is less than $${(firstInstallmentAmountMinorUnits / 100).toFixed(2)}. Adjusting first installment to $5.`);
    firstInstallmentAmountMinorUnits = minimumFirstInstallment;
  }

  // Calculate the remaining amount to be distributed
  const remainingAmountMinorUnits =
    toSnapshot(totalAfterTax).amount - firstInstallmentAmountMinorUnits;

  const remainingInstallments = numberOfInstallments - 1;

  let allocatedAmounts: Dinero<number>[] = [];

  if (remainingInstallments > 0) {
    // Calculate the base amount for remaining installments
    const baseAmountMinorUnits = Math.floor(
      remainingAmountMinorUnits / remainingInstallments,
    );

    // Calculate the remainder
    const remainderMinorUnits = remainingAmountMinorUnits % remainingInstallments;

    // Create installments for remaining payments
    allocatedAmounts = Array.from(
      { length: remainingInstallments },
      (_, index) => {
        let amount = baseAmountMinorUnits;
        // Add remainder to the last installment
        if (index === remainingInstallments - 1) {
          amount += 0;
        }
        return dinero({
          amount,
          currency: USD,
          scale: toSnapshot(totalAfterTax).scale,
        });
      },
    );
  }

  // Create the first installment
  const firstInstallment = dinero({
    amount: firstInstallmentAmountMinorUnits,
    currency: USD,
    scale: toSnapshot(totalAfterTax).scale,
  });

  // Combine the first installment with the allocated amounts
  const allInstallmentsAfterTax = [firstInstallment, ...allocatedAmounts];

  // Calculate amountBeforeTax and tax for each installment
  const taxRate = taxConfig.amount / Math.pow(10, taxConfig.scale); // e.g., 75 / 1000 = 0.075

  const calculateAmountBeforeTax = (
    amountAfterTax: Dinero<number>,
    taxRate: number,
  ): Dinero<number> => {
    const amountAfterTaxDecimal = Number(toDecimal(amountAfterTax));

    const amountBeforeTaxDecimal = amountAfterTaxDecimal / (1 + taxRate);

    const amountBeforeTaxMinorUnits = Math.round(
      amountBeforeTaxDecimal * Math.pow(10, toSnapshot(amountAfterTax).scale),
    );

    return dinero({
      amount: amountBeforeTaxMinorUnits,
      currency: USD,
      scale: toSnapshot(amountAfterTax).scale,
    });
  };

  const installments = allInstallmentsAfterTax.map((amountAfterTax) => {
    const amountBeforeTax = calculateAmountBeforeTax(amountAfterTax, taxRate);
    const taxAmount = subtract(amountAfterTax, amountBeforeTax);

    return {
      amountBeforeTax,
      tax: taxAmount,
      amountAfterTax,
    };
  });

  // Calculate any remaining discrepancy due to rounding
  const sumOfInstallments = installments.reduce(
    (acc, installment) => add(acc, installment.amountAfterTax),
    dinero({ amount: 0, currency: USD }),
  );
  const remainder = subtract(totalAfterTax, sumOfInstallments);

  return {
    installments,
    remainder,
  };
};

export const calculateInstallmentDates = (
  interval: InferSelectModel<typeof paymentPlans>['interval'],
  intervalCount: number,
  installments: {
    amountBeforeTax: Dinero<number>;
    tax: Dinero<number>;
    amountAfterTax: Dinero<number>;
  }[],
  productType: 'trip' | 'card',
): Date[] => {
  const dates: Date[] = [];
  const startDate = new Date(); // Current date and time

  if (productType === 'trip') {
    for (let i = 0; i < installments.length; i++) {
      let installmentDate: Date;

      if (i === 0) {
        // First payment is now
        installmentDate = new Date(startDate);
      } else if (i === 1) {
        // Second payment on the 10th of the current or next month
        const today = new Date();
        const currentDay = today.getDate();
        let month = today.getMonth(); // Months are zero-based in JavaScript
        let year = today.getFullYear();

        if (currentDay >= 10) {
          // If today is on or after the 10th, set to next month
          if (month === 11) {
            // December rolls over to January
            month = 0;
            year += 1;
          } else {
            month += 1;
          }
        }

        installmentDate = new Date(year, month, 10);
      } else {
        // Subsequent payments occur at the specified interval and intervalCount
        const previousDate = dates[i - 1];
        installmentDate = new Date(previousDate);

        if (interval === Interval.MONTH) {
          installmentDate.setMonth(installmentDate.getMonth() + intervalCount);
        } else if (interval === Interval.WEEK) {
          installmentDate.setDate(installmentDate.getDate() + 7 * intervalCount);
        } else if (interval === Interval.DAY) {
          installmentDate.setDate(installmentDate.getDate() + intervalCount);
        }
        // Add additional interval types if necessary
      }

      dates.push(installmentDate);
    }
  } else {
    // Existing logic for other product types (e.g., 'card')
    for (let i = 0; i < installments.length; i++) {
      const installmentDate = new Date(startDate);

      if (interval === Interval.MONTH) {
        installmentDate.setMonth(installmentDate.getMonth() + i * intervalCount);
      } else if (interval === Interval.WEEK) {
        installmentDate.setDate(installmentDate.getDate() + i * 7 * intervalCount);
      } else if (interval === Interval.DAY) {
        installmentDate.setDate(installmentDate.getDate() + i * intervalCount);
      }
      // Add additional interval types if necessary

      dates.push(installmentDate);
    }
  }

  return dates;
};

export type TCalculateAmountsPaymentPlan = ReturnType<typeof calculateAmountsPaymentPlan>

export interface TCalculateAmountsPaymentPlanParams extends TCalculateAmountsPayNowParams {
  interval: InferSelectModel<typeof paymentPlans>['interval']
  intervalCount: number
  numberOfInstallments: number
  productType: 'trip' | 'card'
}

export type TCalculateAmountsPaymentPlanResponse = ReturnType<typeof calculateAmountsPaymentPlan>

export const calculateAmountsPaymentPlan = ({
  priceAmountCents,
  upgradeAmountCents,
  fees: { bookingAmountCents, processingAmountPercent, paymentPlanFeeAmountCents },
  discountConfig,
  interval,
  intervalCount,
  numberOfInstallments,
  productType,
}: TCalculateAmountsPaymentPlanParams) => {
  // Calculate initial amounts based on "Pay Now" configuration
  const calculatedAmountsPayNow = calculateAmountsPayNow({
    priceAmountCents,
    upgradeAmountCents,
    fees: { bookingAmountCents, processingAmountPercent, paymentPlanFeeAmountCents },
    discountConfig,
  });

  // Calculate installments and remainder evenly
  const { installments, remainder } = calculateInstallmentsEvenly({
    calculatedAmounts: calculatedAmountsPayNow,
    numberOfInstallments,
    productType,
  });

  console.log({
    installmentsEvenly: installments.map(i => toDecimal(i.amountAfterTax)),
    remainderEvenly: toDecimal(remainder),
  });

  // Calculate total fees before subtracting the remainder
  const totalFeesPreRemainder = [
    calculatedAmountsPayNow.feeBooking,
    calculatedAmountsPayNow.feePaymentPlan,
    calculatedAmountsPayNow.feeProcessing,
  ].reduce((acc, fee) => add(acc, fee), dinero({ amount: 0, currency: USD }));

  console.log({ totalFeesPreRemainder: toDecimal(totalFeesPreRemainder) });

  // Adjust total fees by subtracting the remainder
  const totalFees = subtract(totalFeesPreRemainder, remainder);
  // const totalFees = totalFeesPreRemainder;

  console.log({ totalFees: toDecimal(totalFees) });

  // Calculate total before tax by adding discounted subtotal and total fees
  const totalBeforeTax = add(calculatedAmountsPayNow.subtotalDiscounted, totalFees);

  // Calculate tax based on the total before tax
  const tax = scaleTo2(multiply(totalBeforeTax, taxConfig));

  // Calculate total after tax
  const totalAfterTax = add(totalBeforeTax, tax);

  // Calculate total before tax for the first installment
  const totalBeforeTaxFirstInstallment = add(
    installments[0].amountAfterTax,
    dinero({ amount: 0, currency: USD })
  );

  // Calculate tax for the first installment
  const taxFirstInstallment = scaleTo2(multiply(totalBeforeTaxFirstInstallment, taxConfig));

  // Set total after tax for the first installment
  const totalAfterTaxFirstInstallment = installments[0].amountAfterTax;

  // Generate installment dates based on interval settings
  const dates = calculateInstallmentDates(interval, intervalCount, installments, productType);

  // Calculate the application fee for the payment plan
  const applicationFeePaymentPlan = subtract(
    add(
      calculatedAmountsPayNow.applicationFeePayNow,
      multiply(calculatedAmountsPayNow.feePaymentPlan, { amount: 50, scale: 2 })
    ),
    remainder
  );

  console.log({ applicationFeePaymentPlan: toDecimal(applicationFeePaymentPlan) });

  // Helper function to calculate percentage
  function calculatePercentage(
    part: Dinero<number>,
    total: Dinero<number>
  ): Dinero<number> {
    if (toSnapshot(total).amount === 0) {
      // Avoid division by zero by returning zero Dinero
      return dinero({ amount: 0, currency: USD, scale: 4 });
    }

    const partAmount = toSnapshot(part).amount;
    const totalAmount = toSnapshot(total).amount;

    // Calculate percentage: (partAmount / totalAmount) * 1000000 for 6 decimal places
    const percentageAmount = Math.floor((partAmount * 1000000) / totalAmount);

    return dinero({ amount: percentageAmount, currency: USD, scale: 8 });
  }
  
  // Calculate the application fee percentage based on total after tax
  const applicationFeePaymentPlanPercent = calculatePercentage(
    applicationFeePaymentPlan,
    totalAfterTax
  );

  console.log("[calculate-amounts.ts] applicationFeePaymentPlanPercent Scale", toSnapshot(applicationFeePaymentPlanPercent).scale)
  console.log("[calculate-amounts.ts] applicationFeePaymentPlanPercent Amount", toSnapshot(applicationFeePaymentPlanPercent).amount)
  console.log("[calculate-amounts.ts] installment.amountBeforeTax", toDecimal(installments[0].amountBeforeTax))
  
  // Map installments to include their corresponding dates and application fees
  const payments = installments.map((installment, index) => {
    const installmentDate = dates[index];
  
    // Calculate the application fee for this installment based on amount after tax
    const applicationFeeRaw = multiply(
      installment.amountAfterTax,
      { 
        amount: toSnapshot(applicationFeePaymentPlanPercent).amount, 
        scale: toSnapshot(applicationFeePaymentPlanPercent).scale 
      }
    );
  
    // Scale back to 2 decimal places
    const applicationFee = transformScale(applicationFeeRaw, 2, halfUp);
  
    return {
      amountBeforeTax: installment.amountBeforeTax,
      tax: installment.tax,
      amountAfterTax: installment.amountAfterTax,
      applicationFee: applicationFee,
      date: installmentDate,
    };
  });
  
  console.log('Payment Schedule:');
  payments.forEach((payment, index) => {
    console.log(`Payment ${index + 1}:`);
    console.log(`  Date: ${payment.date.toISOString()}`);
    console.log(`  Amount Before Tax: ${toCurrency(payment.amountBeforeTax)}`);
    console.log(`  Tax: ${toCurrency(payment.tax)}`);
    console.log(`  Amount After Tax: ${toCurrency(payment.amountAfterTax)}`);
    console.log(`  Application Fee: ${toCurrency(payment.applicationFee)}`);
    console.log('---');
  });

  const scaledPercentage = multiply(applicationFeePaymentPlanPercent, 
    { amount: 100, scale: 0 }
  );

  const roundedPercentage = transformScale(scaledPercentage, 2, halfUp);

  console.log("💵 [calculate-amounts.ts] roundedPercentage", toDecimal(roundedPercentage))

  return {
    ...calculatedAmountsPayNow,
    totalFees,
    applicationFeePaymentPlan,
    applicationFeePaymentPlanPercent,
    totalBeforeTax,
    tax,
    totalAfterTax,
    taxFirstInstallment,
    totalBeforeTaxFirstInstallment,
    totalAfterTaxFirstInstallment,
    remainder,
    schedule: {
      interval,
      intervalCount,
      payments,
    },
  };
}


// dunno if we still need this...
// export const calculateAmountsPaymentPlanBackup = ({
//   priceAmountCents,
//   upgradeAmountCents,
//   fees: { bookingAmountCents, processingAmountPercent, paymentPlanFeeAmountCents },
//   discountConfig,
//   interval,
//   intervalCount,
//   numberOfInstallments,
// }: TCalculateAmountsPaymentPlanParams) => {
//   const calculatedAmountsPayNow = calculateAmountsPayNow({
//     priceAmountCents,
//     upgradeAmountCents,
//     fees: { bookingAmountCents, processingAmountPercent, paymentPlanFeeAmountCents },
//     discountConfig,
//   })

//   // const { installments, remainder } = calculateInstallments({
//   //   calculatedAmounts: calculatedAmountsPayNow,
//   //   interval,
//   //   numberOfInstallments,
//   // })

//   const { installments, remainder } = calculateInstallmentsEvenly({
//     calculatedAmounts: calculatedAmountsPayNow,
//     numberOfInstallments,
//   })
//   console.log({
//     installmentsEvenly: installments.map(i => toDecimal(i.amountAfterTax)),
//     remainderEvenly: toDecimal(remainder)
//   })

//   const totalFeesPreRemainder = [
//     calculatedAmountsPayNow.feeBooking,
//     calculatedAmountsPayNow.feePaymentPlan,
//     calculatedAmountsPayNow.feeProcessing,
//   ].reduce((acc, fee) => add(acc, fee), dinero({ amount: 0, currency: USD }))

//   console.log({ totalFeesPreRemainder: toDecimal(totalFeesPreRemainder) })

//   const totalFees = subtract(totalFeesPreRemainder, remainder)
//   // const totalFees = totalFeesPreRemainder
  
//   console.log({ totalFees: toDecimal(totalFees) })

//   const totalBeforeTax = add(calculatedAmountsPayNow.subtotalDiscounted, totalFees)

//   const tax = scaleTo2(multiply(totalBeforeTax, taxConfig))

//   const totalAfterTax = add(totalBeforeTax, tax)

//   // const totalBeforeTaxFirstInstallment = [
//   //   installments[0].amountBeforeTax,
//   //   totalFees,
//   //   remainder,
//   // ].reduce((acc, fee) => add(acc, fee), dinero({ amount: 0, currency: USD }))

//   const totalBeforeTaxFirstInstallment = [
//     installments[0].amountAfterTax,
//   ].reduce((acc, fee) => add(acc, fee), dinero({ amount: 0, currency: USD }))

//   const taxFirstInstallment = scaleTo2(multiply(totalBeforeTaxFirstInstallment, taxConfig))
//   // const totalAfterTaxFirstInstallment = add(totalBeforeTaxFirstInstallment, taxFirstInstallment)
//   const totalAfterTaxFirstInstallment = installments[0].amountAfterTax

//   const dates = calculateInstallmentDates(interval, intervalCount, installments)

//   const applicationFeePaymentPlan = subtract(add(
//     calculatedAmountsPayNow.applicationFeePayNow,
//     multiply(calculatedAmountsPayNow.feePaymentPlan, { amount: 50, scale: 2 }),
//   ), remainder)
//   console.log({ applicationFeePaymentPlan: toDecimal(applicationFeePaymentPlan) })  

//   const calculatePercentage = (part: Dinero<number>, total: Dinero<number>): Dinero<number> => {
//     if (toSnapshot(total).amount === 0) {
//       // Avoid division by zero
//       return dinero({ amount: 0, currency: USD, scale: 2 })
//     }

//     const partAmount = toSnapshot(part).amount
//     const totalAmount = toSnapshot(total).amount

//     // Calculate percentage: (partAmount / totalAmount) * 100
//     const percentageAmount = Math.floor((partAmount * 10000) / totalAmount)

//     return dinero({ amount: percentageAmount, currency: USD, scale: 4 })
//   }

//   const applicationFeePaymentPlanPercent = calculatePercentage(
//     applicationFeePaymentPlan,
//     totalBeforeTax,
//   )

//   console.log({ applicationFeePaymentPlanPercent: toDecimal(applicationFeePaymentPlanPercent) })

// // this is absurd. it needs to be simpler and dinero. fuck

// // Convert percentage to a decimal fraction
// const applicationFeeFraction = Number(toDecimal(applicationFeePaymentPlanPercent)) / 100;

// // Calculate the first installment application fee amount
// const firstInstallmentApplicationFeeAmountNumber =
//   parseFloat(toDecimal(totalAfterTaxFirstInstallment)) * applicationFeeFraction;

// // Round to two decimal places and convert to minor units (cents)
// const roundedFirstInstallmentApplicationFeeAmount = Math.round(
//   firstInstallmentApplicationFeeAmountNumber * 100
// );

// // Create a Dinero object for the fee amount
// const firstInstallmentApplicationFeeAmount = dinero({
//   amount: roundedFirstInstallmentApplicationFeeAmount,
//   currency: USD,
//   scale: 2,
// });

// console.log(
//   `[calculateAmountsPaymentPlan.ts] 💰 First Installment Application Fee Amount: $${toDecimal(
//     firstInstallmentApplicationFeeAmount
//   )}`
// );

//   const payments = installments.map((installment, index) => {
//     const installmentDate = dates[index]
//     return {
//       amountBeforeTax: installment.amountBeforeTax,
//       tax: installment.tax,
//       amountAfterTax: installment.amountAfterTax,
//       date: installmentDate,
//     }
//   })

//   // console.log('feeBooking:', toSnapshot(calculatedAmountsPayNow.feeBooking).amount)
//   // console.log('feePaymentPlan:', toSnapshot(calculatedAmountsPayNow.feePaymentPlan).amount)
//   // console.log('feeProcessing:', toSnapshot(calculatedAmountsPayNow.feeProcessing).amount)
//   // console.log('calculatedAmountsPayNow:', calculatedAmountsPayNow)
//   // console.log('totalFees:', toSnapshot(totalFees).amount)
//   // console.log('totalBeforeTax:', toSnapshot(totalBeforeTax).amount)
//   // console.log('tax:', toSnapshot(tax).amount)
//   // console.log('totalAfterTax:', toSnapshot(totalAfterTax).amount)
//   // console.log('taxFirstInstallment:', toSnapshot(taxFirstInstallment).amount)
//   // console.log('totalBeforeTaxFirstInstallment:', toSnapshot(totalBeforeTaxFirstInstallment).amount)
//   // console.log('totalAfterTaxFirstInstallment:', toSnapshot(totalAfterTaxFirstInstallment).amount)
//   // console.log('remainder:', toSnapshot(remainder).amount)
//   // // console.log("schedule:", { interval, intervalCount, payments });
//   // console.log(
//   //   'paymentsBeforeTax',
//   //   payments.map((p) => toSnapshot(p.amountBeforeTax).amount),
//   // )
//   // console.log(
//   //   'paymentsTax',
//   //   payments.map((p) => toSnapshot(p.tax).amount),
//   // )
//   // console.log(
//   //   'paymentsAfterTax',
//   //   payments.map((p) => toSnapshot(p.amountAfterTax).amount),
//   // )

//   return {
//     ...calculatedAmountsPayNow,
//     totalFees,
//     applicationFeePaymentPlan,
//     applicationFeePaymentPlanPercent,
//     firstInstallmentApplicationFeeAmount,
//     totalBeforeTax,
//     tax,
//     totalAfterTax,
//     taxFirstInstallment,
//     totalBeforeTaxFirstInstallment,
//     totalAfterTaxFirstInstallment,
//     remainder,
//     schedule: {
//       interval,
//       intervalCount,
//       payments,
//     },
//   }
// }


// const calculateInstallments = ({
//   calculatedAmounts,
//   numberOfInstallments,
// }: {
//   calculatedAmounts: ReturnType<typeof calculateAmountsPayNow>
//   interval: InferSelectModel<typeof paymentPlans>['interval']
//   numberOfInstallments: number
// }) => {
//   const { subtotalDiscounted } = calculatedAmounts

//   const { amount: totalAmountMinorUnits, scale } = toSnapshot(subtotalDiscounted)
//   const basePaymentAmountMinorUnits = Math.floor(totalAmountMinorUnits / numberOfInstallments)

//   const remainderMinorUnits = totalAmountMinorUnits % numberOfInstallments
//   const remainder = dinero({ amount: remainderMinorUnits, currency: USD })

//   let installments = Array.from({ length: numberOfInstallments }, (_, index) => {
//     const baseAmount = dinero({ amount: basePaymentAmountMinorUnits, currency: USD, scale })

//     const taxAmount = scaleTo2(multiply(baseAmount, taxConfig))
//     const amountAfterTax = scaleTo2(add(baseAmount, taxAmount))

//     return {
//       amountBeforeTax: baseAmount,
//       tax: taxAmount,
//       amountAfterTax: amountAfterTax,
//     }
//   })

//   // console.log({ remainder })
//   // console.log({ installments: installments.map((i) => toDecimal(i.tax)) })

//   return {
//     installments,
//     remainder,
//   }
// }

