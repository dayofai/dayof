import { TUpgrade } from '@/app/(external)/cards/[slug]/page'
import camelcaseKeys from 'camelcase-keys'
import { add, halfUp, multiply, toDecimal, toSnapshot, transformScale } from 'dinero.js'
import { cookies } from 'next/headers'
import Stripe from 'stripe'
import { upsertClerkUser } from '../clerk'
import { GetCardResponse, GetTripsResponse, checkAndReplicateClerkUser } from '../db'
import {
  SPaymentMethod,
  TAttendeeInfo,
  TCardParams,
  TMergedCardSearchParams,
  TTripSearchParams,
} from '../models'
import { getDistinctIdFromCookies, posthog } from '../posthog'
import { formatLocation } from '../utils'
import {
  calculateAmountsPayNow,
  calculateAmountsPaymentPlan,
  toStripeMoney,
} from './calculate-amounts'
import { handleCardFulfillment } from './handle-card-fulfillment'
import { handleCardUpgradeFulfillment } from './handle-card-upgrade-fulfillment'
import { handleTicketFulfillment } from './handle-ticket-fulfillment'
import { handleTripFulfillment } from './handle-trip-fulfillment'
import {
  SMetadataAttendeeInfo,
  SMetadataCalculatedAmounts,
  SMetadataCardSearchParams,
  SMetadataCards,
  SMetadataCore,
  SMetadataProduct,
  SMetadataTripSearchParams,
  SMetadataTrips,
  TDiscount,
  createCalculatedAmountsMetadata,
} from './models'
const secretKey = process.env.STRIPE_SECRET_KEY

if (!secretKey) {
  throw new Error('Missing Stripe secret key')
}

export const stripe = new Stripe(secretKey, {
  apiVersion: '2025-01-27.acacia',
  typescript: true,
})

export interface Option {
  label: string
  value: string
}

export async function handleCheckoutSessionCompleted(
  checkoutSessionCompleted: Stripe.Checkout.Session,
  connectedAccountId: string,
  stripeSubscriptionSchedule?: Stripe.Response<Stripe.SubscriptionSchedule>,
  stripeSubscription?: Stripe.Response<Stripe.Subscription>,
) {
  const metadata = camelcaseKeys(
    checkoutSessionCompleted.metadata as readonly any[] | Record<string, unknown>,
  )

  // Common Logic
  const metadataCore = SMetadataCore.parse(metadata)

  if (metadataCore.type === 'card-upgrade') {
    await handleCardUpgradeFulfillment({
      checkoutSessionCompleted,
      metadata,
    })

    return // Early return
  }

  if (metadataCore.type === 'ticket') {
    await handleTicketFulfillment({
      checkoutSessionCompleted,
      metadata,
    })

    return // Early return
  }

  const metadataCoreProduct = SMetadataProduct.parse(metadata)
  const metadataCalculatedAmounts = SMetadataCalculatedAmounts.parse(metadata)

  const metadataAttendeeInfo = SMetadataAttendeeInfo.parse(metadata)

  const checkoutSessionId = checkoutSessionCompleted.id
  const stripeCustomer = checkoutSessionCompleted.customer
  let stripeCustomerId = typeof stripeCustomer === 'string' ? stripeCustomer : stripeCustomer?.id ?? undefined

  // 👤 Clerk Logic
  console.log(`👤 Clerk: Creating user...`)
  const clerkUser = await upsertClerkUser({
    metadataAttendeeInfo,
    stripeCustomerId,
  })
  console.log(`👤 Clerk: User upserted with id ${clerkUser.id}`)

  console.log(`👤 Clerk: Checking and replicating user...`)
  await checkAndReplicateClerkUser({
    clerkUser,
    stripeCustomerId,
  })
  console.log(`👤 Clerk: User checked and replicated with id ${clerkUser.id}`)


  const clerkUserId = clerkUser.id
  console.log(`👤 Clerk: Clerk User Id: ${clerkUserId}`)

  switch (metadataCore.type) {
    case 'card':
      await handleCardFulfillment({
        checkoutSessionCompleted,
        checkoutSessionId,
        clerkUserId,
        metadataAttendeeInfo,
        subscriptionId: stripeSubscription?.id,
        schedule: stripeSubscriptionSchedule,
        subscription: stripeSubscription,
        metadataCalculatedAmounts,
        metadataCore,
        metadataProduct: metadataCoreProduct,
        stripeCustomerId,
        posthog,
      })
      break
    case 'package':
      console.log('[stripe.ts] Trip Fulfillment - Schedule:', stripeSubscriptionSchedule?.id)
      console.log('[stripe.ts] Trip Fulfillment - Subscription:', stripeSubscription?.id)
      await handleTripFulfillment({
        checkoutSessionCompleted,
        checkoutSessionId,
        clerkUserId,
        metadataAttendeeInfo,
        subscriptionId: stripeSubscription?.id,
        schedule: stripeSubscriptionSchedule,
        subscription: stripeSubscription,
        metadataCalculatedAmounts,
        metadataCore,
        metadataProduct: metadataCoreProduct,
        stripeCustomerId,
        posthog,
      })
      break
    default:
      throw new Error(`Unknown type ${metadataCore.type}`)
  }

  // 📈 Posthog Logic
  console.log(
    `📈 Posthog: Aliasing Anonymous User Id ${metadataCore.distinct_id} with Clerk User Id ${clerkUserId}...`,
  )
  posthog.alias({
    distinctId: metadataCore.distinct_id,
    alias: clerkUserId,
  })

  console.log(`📈 Posthog: Identifying Posthog User...`)
  posthog.identify({
    distinctId: metadataCore.distinct_id,
    properties: {
      ...metadataAttendeeInfo,
      clerk_user_id: clerkUserId,
      stripeCustomerId,
    },
  })

  // console.log(`📈 Posthog: Sending Posthog Event...`)
  // await posthog.shutdownAsync()
  // console.log(`📈 Posthog: Posthog shutdown...`)
}

// if (metadataCore.type === 'package') {
// console.log(`📊 Google Analytics: Sending analytics event...`)
// const items = [
//   {
//     item_id: metadataCoreProduct.product_id,
//     item_category: metadataTrips.name,
//     item_category2: metadataTrips.details,
//     price: metadataCalculatedAmounts.subtotal,
//   },
//   {
//     item_id: metadataCoreProduct.product_id,
//     item_category: metadataTrips.name,
//     item_category2: metadataTrips.details,
//     price: metadataCalculatedAmounts.processing_fee,
//   },
// ] as TSendGoogleAnylticsEventItems
// if (metadataCore.payment_method === 'installment-plan') {
//   items.push({
//     item_id: metadataCoreProduct.product_id,
//     item_category: metadataTrips.name,
//     item_category2: metadataTrips.details,
//     price: metadataCalculatedAmounts.payment_plan_fee,
//   })
// }
// const params = {
//   client_id: metadataCore.ga_client_id,
//   user_id: clerkUserId,
//   events: [
//     {
//       params: {
//         transaction_id: checkoutSessionId,
//         items,
//         session_id: metadataCore.ga_client_session_id,
//         value: metadataCalculatedAmounts.total_pay_now,
//         gclid: metadataCore.gclid,
//       },
//     },
//   ],
// } as TSendGoogleAnalyticsEventParams
// await sendGoogleAnalyticsEvent(params)
// TODO: @KOAJON set up google ads logic for trips
// 📺 Google Ads Logic
// console.log(`📺 Google Ads: Sending conversion event...`)
// await sendGoogleAdsConversionEvent({
//   google_conversion_value: metadataCalculatedAmounts.total_pay_now,
//   google_conversion_label: 'ZFqvCLfxj4QZEM_Ch_AD',
//   google_conversion_id: '1040310607',
// } as TSendGoogleAdsConversionEventParams)
// }

// if (metadataCore.type === 'card') {
// console.log('💳 Card Event logic executing...')

// 📊 Google Analytics Event
// console.log(`📊 Google Analytics: Sending analytics event...`)

// // TODO: @KOAJON please double check what to send here, there's quite a bit available in the metadata models
// const items = [
//   {
//     item_id: metadataCoreProduct.product_id,
//     item_category: metadataCardSearchParams.location,
//     item_category2: metadataCardSearchParams.week,
//     price: metadataCalculatedAmounts.subtotal,
//   },
//   {
//     item_id: metadataCoreProduct.product_id,
//     item_category: metadataCard.location,
//     item_category2: metadataCard.week,
//     price: metadataCalculatedAmounts.processing_fee,
//   },
// ] as TSendGoogleAnylticsEventItems

// if (metadataCore.payment_method === 'installment-plan') {
//   items.push({
//     // TODO: @KOAJON please double check what to send here, there's quite a bit available in the metadata models
//     item_id: metadataCoreProduct.product_id,
//     item_category: metadataCard.location,
//     item_category2: metadataCard.week,
//     price: metadataCalculatedAmounts.payment_plan_fee,
//   })
// }

// const params = {
//   client_id: metadataCore.ga_client_id,
//   user_id: clerkUserId,
//   events: [
//     {
//       params: {
//         transaction_id: checkoutSessionId,
//         items,
//         session_id: metadataCore.ga_client_session_id,
//         value: metadataCalculatedAmounts.total_pay_now,
//         gclid: metadataCore.gclid,
//       },
//     },
//   ],
// } as TSendGoogleAnalyticsEventParams

// await sendGoogleAnalyticsEvent(params)

// 📺 Google Ads Logic
// console.log(`📺 Google Ads: Sending conversion event...`)
// await sendGoogleAdsConversionEvent({
//   // TODO: @KOAJON please double check that all of this looks good
//   // Felix: I think you did everything as right as possible with google without testing it
//   google_conversion_value: metadataCalculatedAmounts.total_pay_now,
// } as TSendGoogleAdsConversionEventParams)

export const createTripCheckoutSessionParams = async ({
  product,
  sessionParams,
  success_url,
  cancel_url,
  paymentMethod,
  attendeeInfo,
  line_items,
  searchParams,
  gaClientId,
  gaClientSessionId,
  discount,
}: {
  product: GetTripsResponse[0]
  sessionParams: Stripe.Checkout.SessionCreateParams
  success_url: string
  cancel_url: string
  paymentMethod: 'pay-now' | 'installment-plan'
  attendeeInfo: TAttendeeInfo
  line_items: Stripe.Checkout.SessionCreateParams.LineItem[]
  searchParams: TTripSearchParams
  gaClientId: string | undefined
  gaClientSessionId: string | undefined
  discount: TDiscount
}) => {
  const trip = product as GetTripsResponse[0]

  const priceAmountCents = trip.prices.amountCents

  const discountConfig = discount

  const calculatedAmountsPayNow = calculateAmountsPayNow({
    priceAmountCents,
    discountConfig,
    fees: {
      bookingAmountCents: trip.booking_fees.amountCents,
      processingAmountPercent: trip.processing_fees.amountPercent,
      paymentPlanFeeAmountCents: 0,
    },
    upgradeAmountCents: 0,
  })

  const calculatedAmountsPaymentPlan = calculateAmountsPaymentPlan({
    priceAmountCents,
    discountConfig,
    fees: {
      bookingAmountCents: trip.booking_fees.amountCents,
      processingAmountPercent: trip.processing_fees.amountPercent,
      paymentPlanFeeAmountCents: trip.payment_plan_fees.amountCents,
    },
    upgradeAmountCents: 0,
    interval: trip.payment_plans.interval,
    intervalCount: trip.payment_plans.intervalCount,
    numberOfInstallments: trip.payment_plans.numberOfInstallments,
    productType: 'trip',
  })

  const Fees = toStripeMoney(
    add(calculatedAmountsPayNow.feeProcessing, calculatedAmountsPaymentPlan.feeBooking),
  )
  const FeeLineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
    quantity: 1,

    price_data: {
      product_data: {
        name: 'Fees',
        description: `Processing and Booking Fees`,
      },
      ...Fees,
    },
  }

  sessionParams = {
    cancel_url,
    success_url,
    line_items,
  }

  const applicationFeePayNowAmount = toStripeMoney(calculatedAmountsPayNow.applicationFeePayNow)

  if (paymentMethod === 'pay-now') {
    const subtotalDiscounted = toStripeMoney(calculatedAmountsPayNow.subtotalDiscounted)
    const tripLineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
      quantity: 1,

      price_data: {
        product_data: {
          name: trip.trips.name,
        },
        ...subtotalDiscounted,
      },
    }

    const totalFees = toStripeMoney(calculatedAmountsPayNow.totalFees)

    const feeLineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
      quantity: 1,

      price_data: {
        product_data: {
          name: 'Fees',
          description: `Processing and Booking Fees`,
        },
        ...totalFees,
      },
    }

    const tax = toStripeMoney(calculatedAmountsPayNow.tax)

    const taxLineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
      quantity: 1,
      price_data: {
        product_data: {
          name: 'Tax',
          description: `Sales Tax`,
        },
        ...tax,
      },
    }

    sessionParams.line_items = [tripLineItem, feeLineItem, taxLineItem]

    sessionParams.mode = 'payment'

    sessionParams.payment_intent_data = {
      ...sessionParams.payment_intent_data,
      description: trip.trips.name,
      application_fee_amount: applicationFeePayNowAmount.unit_amount,
    }
  } else if (paymentMethod === 'installment-plan') {
    // convert first installment amount to stripe money
    const firstInstallmentAmount = toStripeMoney(
      calculatedAmountsPaymentPlan.schedule.payments[0].amountAfterTax,
    )

    // convert application fee to stripe money
    const firstInstallmentApplicationFee = toStripeMoney(
      calculatedAmountsPaymentPlan.schedule.payments[0].applicationFee,
    )

    // Change mode to 'payment' for the initial $50 payment
    sessionParams.mode = 'payment'

    // Line item for the initial $50 payment
    const initialPaymentLineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
      quantity: 1,
      price_data: {
        currency: 'usd',
        unit_amount: firstInstallmentAmount.unit_amount,
        product_data: {
          name: 'Initial Payment',
          description: `The first payment in your installment plan with ${calculatedAmountsPaymentPlan.schedule.payments.length - 1} remaining payments of $${toSnapshot(calculatedAmountsPaymentPlan.schedule.payments[1].amountAfterTax).amount / 100} each.`,
        },
        tax_behavior: 'inclusive',
      },
    }

    sessionParams.line_items = [initialPaymentLineItem]

    console.log(
      `[stripe.ts] First Installment Application Fee Amount: $${firstInstallmentApplicationFee.unit_amount}`,
    )

    sessionParams.payment_intent_data = {
      ...sessionParams.payment_intent_data,
      setup_future_usage: 'off_session', // Save the payment method
      application_fee_amount: firstInstallmentApplicationFee.unit_amount,
      description: trip.trips.name,
    }

    sessionParams.metadata = {
      ...sessionParams.metadata,
      payment_method: 'installment-plan',
      // installment_count: calculatedAmountsPaymentPlan.schedule.payments.length.toString(),
      installment_amounts: JSON.stringify(
        calculatedAmountsPaymentPlan.schedule.payments.map(
          (i) => toSnapshot(i.amountAfterTax).amount,
        ),
      ),
      // installment_interval: calculatedAmountsPaymentPlan.schedule.interval,
      // installment_interval_count: calculatedAmountsPaymentPlan.schedule.intervalCount.toString(),
      installment_currency: toSnapshot(
        calculatedAmountsPaymentPlan.schedule.payments[0].amountAfterTax,
      ).currency.code,
      installment_dates: JSON.stringify(
        calculatedAmountsPaymentPlan.schedule.payments.map((i) => i.date.toISOString()),
      ),
    }

    sessionParams.consent_collection = {
      ...sessionParams.consent_collection,
      // terms_of_service: 'required',
      payment_method_reuse_agreement: {
        position: 'hidden',
      },
    }

    sessionParams.custom_text = {
      ...sessionParams.custom_text,
      after_submit: {
        message:
          'By confirming your payment, you authorize StudentEscape to charge you for this payment and future payments according to the payment schedule you agreed to during purchasing. Cancellation will result in forfeiture of payments already made.',
      },
    }

    // Remove subscription_data and trial_end since we're not using subscriptions here
    delete sessionParams.subscription_data
  }

  const cookieStore = await cookies()
  const distinctId = getDistinctIdFromCookies({ cookieStore })

  const metadataCore = SMetadataCore.parse({
    type: 'package',
    paymentMethod,
    distinctId,
    gaClientId,
    gaClientSessionId,
  })

  const metadataPaymentMethod = SPaymentMethod.parse(paymentMethod)
  const metadataSearchParams = SMetadataTripSearchParams.parse(searchParams)
  const metadataTrip = SMetadataTrips.parse(trip.trips)

  let metadataCalculatedAmounts = createCalculatedAmountsMetadata({
    paymentMethod,
    calculatedAmountsPayNow,
    calculatedAmountsPaymentPlan,
  })

  const metadataProduct = SMetadataProduct.parse({
    productId: trip.trips.id,
    name: trip.trips.name,
    description: 'Your Spring Break experience!',
  })

  const scaledPercentage = multiply(calculatedAmountsPaymentPlan.applicationFeePaymentPlanPercent, {
    amount: 100,
    scale: 0,
  })

  const roundedPercentage = transformScale(scaledPercentage, 2, halfUp)

  const applicationFeePercent = Number(toDecimal(roundedPercentage))

  sessionParams.metadata = {
    ...sessionParams.metadata,
    ...metadataCore,
    ...metadataSearchParams,
    ...metadataCalculatedAmounts,
    ...metadataProduct,
    ...metadataTrip,
    free_card: trip.trips.freeCard ? 'true' : 'false',
    payment_method: metadataPaymentMethod,
    application_fee: Number(toDecimal(calculatedAmountsPaymentPlan.applicationFeePayNow)),
    application_fee_percent: applicationFeePercent,
  }
  return sessionParams
}

export const createCardCheckoutSessionParams = async ({
  product,
  sessionParams,
  success_url,
  cancel_url,
  paymentMethod,
  attendeeInfo,
  line_items,
  params,
  searchParams,
  gaClientId,
  gaClientSessionId,
  discount,
  upgrade,
}: {
  product: GetCardResponse
  sessionParams: Stripe.Checkout.SessionCreateParams
  success_url: string
  cancel_url: string
  paymentMethod: 'pay-now' | 'installment-plan'
  attendeeInfo: TAttendeeInfo
  line_items: Stripe.Checkout.SessionCreateParams.LineItem[]
  params: TCardParams
  searchParams: TMergedCardSearchParams
  gaClientId: string | undefined
  gaClientSessionId: string | undefined
  discount: TDiscount
  upgrade?: TUpgrade
}) => {
  const card = product as GetCardResponse

  const priceAmountCents = card.prices.amountCents

  const discountConfig = discount

  const calculatedAmountsPayNow = calculateAmountsPayNow({
    priceAmountCents,
    discountConfig,
    fees: {
      bookingAmountCents: card.booking_fees.amountCents,
      processingAmountPercent: card.processing_fees.amountPercent,
      paymentPlanFeeAmountCents: 0,
    },
    upgradeAmountCents: upgrade?.amountCents ?? 0,
  })

  const calculatedAmountsPaymentPlan = calculateAmountsPaymentPlan({
    priceAmountCents,
    discountConfig,
    fees: {
      bookingAmountCents: card.booking_fees.amountCents,
      processingAmountPercent: card.processing_fees.amountPercent,
      paymentPlanFeeAmountCents: card.payment_plan_fees.amountCents,
    },
    upgradeAmountCents: upgrade?.amountCents ?? 0,
    interval: card.payment_plans.interval,
    intervalCount: card.payment_plans.intervalCount,
    numberOfInstallments: card.payment_plans.numberOfInstallments,
    productType: 'card',
  })

  sessionParams = {
    cancel_url,
    success_url,
    line_items,
  }

  const applicationFeePayNowAmount = toStripeMoney(calculatedAmountsPayNow.applicationFeePayNow)

  if (paymentMethod === 'pay-now') {
    const subtotalDiscounted = toStripeMoney(calculatedAmountsPayNow.subtotalDiscounted)

    const cardLineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
      quantity: 1,
      price_data: {
        product_data: {
          name: card.cards.name,
        },
        ...subtotalDiscounted,
      },
    }

    const totalFees = toStripeMoney(calculatedAmountsPayNow.totalFees)

    const feeLineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
      quantity: 1,
      price_data: {
        product_data: {
          name: 'Fees',
          description: `Processing and Booking Fees`,
        },
        ...totalFees,
      },
    }

    const tax = toStripeMoney(calculatedAmountsPayNow.tax)

    const taxLineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
      quantity: 1,
      price_data: {
        product_data: {
          name: 'Tax',
          description: `Sales Tax`,
        },
        ...tax,
      },
    }

    sessionParams.line_items = [cardLineItem, feeLineItem, taxLineItem]

    sessionParams.mode = 'payment'

    const description = `${card.card_tiers.name} - ${card.locations.name} - ${card.weeks.name}`
    console.log(`[stripe.ts] Description: ${description}`)

    sessionParams.payment_intent_data = {
      ...sessionParams.payment_intent_data,
      description,
      application_fee_amount: applicationFeePayNowAmount.unit_amount,
    }
  } else if (paymentMethod === 'installment-plan') {
    const firstInstallmentAmount = toStripeMoney(
      calculatedAmountsPaymentPlan.schedule.payments[0].amountAfterTax,
    )

    const firstInstallmentApplicationFee = toStripeMoney(
      calculatedAmountsPaymentPlan.schedule.payments[0].applicationFee,
    )

    sessionParams.mode = 'payment'

    const initialPaymentLineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
      quantity: 1,
      price_data: {
        currency: 'usd',
        unit_amount: firstInstallmentAmount.unit_amount,
        product_data: {
          name: 'Initial Payment',
          description: `The first payment in your installment plan with ${calculatedAmountsPaymentPlan.schedule.payments.length - 1
            } remaining payments of $${toSnapshot(calculatedAmountsPaymentPlan.schedule.payments[1].amountAfterTax).amount /
            100
            } each.`,
        },
        tax_behavior: 'inclusive',
      },
    }

    // sessionParams.line_items = [initialPaymentLineItem]

    sessionParams.payment_intent_data = {
      ...sessionParams.payment_intent_data,
      setup_future_usage: 'off_session',
      application_fee_amount: firstInstallmentApplicationFee.unit_amount,
      description: card.cards.name,
    }

    sessionParams.metadata = {
      ...sessionParams.metadata,
      payment_method: 'installment-plan',
      // installment_count: calculatedAmountsPaymentPlan.schedule.payments.length.toString(),
      installment_amounts: JSON.stringify(
        calculatedAmountsPaymentPlan.schedule.payments.map(
          (i) => toSnapshot(i.amountAfterTax).amount,
        ),
      ),
      // installment_interval: calculatedAmountsPaymentPlan.schedule.interval,
      // installment_interval_count: calculatedAmountsPaymentPlan.schedule.intervalCount.toString(),
      installment_currency: toSnapshot(
        calculatedAmountsPaymentPlan.schedule.payments[0].amountAfterTax,
      ).currency.code,
      installment_dates: JSON.stringify(
        calculatedAmountsPaymentPlan.schedule.payments.map((i) => i.date.toISOString()),
      ),
    }

    sessionParams.consent_collection = {
      ...sessionParams.consent_collection,
      payment_method_reuse_agreement: {
        position: 'hidden',
      },
    }

    sessionParams.line_items = [initialPaymentLineItem]

    sessionParams.custom_text = {
      ...sessionParams.custom_text,
      after_submit: {
        message:
          'By confirming your payment, you authorize Maniac to charge you for this payment and future payments according to the payment schedule you agreed to during purchasing. Cancellation will result in forfeiture of payments already made.',
      },
    }

    // 'By confirming your payment, you authorize Maniac to charge you for this payment and future payments according to the payment schedule you agreed to during purchasing. This authorization is subject to our [terms of service](https://www.example.com/terms) and [payment policy](https://www.example.com/payment-policy). If you choose to cancel, please review our [cancellation policy](https://www.example.com/cancellation-policy). Note that cancellation will result in forfeiture of payments already made.',

  }

  const cookieStore = await cookies()
  const distinctId = getDistinctIdFromCookies({ cookieStore })

  const metadataCore = SMetadataCore.parse({
    type: 'card',
    paymentMethod,
    distinctId,
    gaClientId,
    gaClientSessionId,
  })

  const metadataPaymentMethod = SPaymentMethod.parse(paymentMethod)
  const metadataSearchParams = SMetadataCardSearchParams.parse({
    ...searchParams,
    locked: searchParams.locked,
  })

  const metadataCalculatedAmounts = createCalculatedAmountsMetadata({
    paymentMethod,
    calculatedAmountsPayNow,
    calculatedAmountsPaymentPlan,
  })

  const metadataCards = SMetadataCards.parse({
    location: searchParams.location,
    week: searchParams.week,
    tier: params.slug,
    locationFormatted: searchParams.location,
    tierFormatted: params.slug,
    weekFormatted: searchParams.week,
  })

  const description = `${metadataCards.tier_formatted} - ${formatLocation(
    metadataCards.location_formatted,
  )} - ${metadataCards.week_formatted}`

  const metadataProduct = SMetadataProduct.parse({
    productId: card.cards.id,
    name: card.cards.name,
    description: description,
  })

  const scaledPercentage = multiply(calculatedAmountsPaymentPlan.applicationFeePaymentPlanPercent, {
    amount: 100,
    scale: 0,
  })

  const roundedPercentage = transformScale(scaledPercentage, 2, halfUp)

  const applicationFeePercent = Number(toDecimal(roundedPercentage))

  sessionParams.metadata = {
    ...sessionParams.metadata,
    ...metadataCore,
    ...metadataSearchParams,
    ...metadataCalculatedAmounts,
    ...metadataProduct,
    ...metadataCards,
    payment_method: metadataPaymentMethod,
    application_fee: Number(toDecimal(calculatedAmountsPaymentPlan.applicationFeePayNow)),
    application_fee_percent: applicationFeePercent,
    locked: searchParams.locked ? 'true' : 'false',
  }

  return sessionParams
}
