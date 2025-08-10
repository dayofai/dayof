import { db } from '@/lib/db'
import { createSubscriptionSchedule } from '@/lib/stripe/setup-payment-plan'
import { handleCheckoutSessionCompleted, stripe } from '@/lib/stripe/stripe'
import { issuedTrips, orders, issuedTripStatus, users, issuedCards } from '@/schema'
import { eq, sql, and, gt } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import { headers } from 'next/headers'
import { NextRequest } from 'next/server'
import Stripe from 'stripe'

const endpointSecret = process.env.STRIPE_SECRET_WEBHOOK_KEY!

if (!endpointSecret) {
  throw new Error('STRIPE_SECRET_WEBHOOK_KEY is not defined')
}

export const maxDuration = 300 // 5 minutes max

const ALLOWED_APPLICATION_ID = 'ca_QpvN2rzkF1OM8vchXLyvXkpU7Uk5F86w'


export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature') as string
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    console.log(
      `🔔 Received event ${event.id} of type ${event.type} at ${new Date().toISOString()}`,
    )

    // Check if there's an application ID and if it matches ours
    // const eventApplication = (event.data.object as any).application
    // if (eventApplication && eventApplication !== ALLOWED_APPLICATION_ID) {
    //   console.log(`⚠️ Rejecting event from unauthorized application: ${eventApplication}`)
    //   return new Response('Unauthorized application', { status: 403 })
    // }
  }
  catch (err) {
    console.error(`Webhook signature verification failed: ${err}`)
    return new Response(`Webhook Error: ${err}`, {
      status: 400,
    })
  }

  // After constructing the event
  const connectedAccountId: string = event.account ?? 'no_account_id'
  console.log(`💸 Stripe: Connected Account Id: ${connectedAccountId}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const checkoutSessionCompleted = event.data.object as Stripe.Checkout.Session

        console.log(
          `[route.ts] 🛒✅ Processing Checkout Session Completed with id ${checkoutSessionCompleted.id}`,
        )

        // Check if order already exists
        const existingOrder = await db
          .select({ id: orders.id })
          .from(orders)
          .where(eq(orders.stripeCheckoutSessionId, checkoutSessionCompleted.id))
          .limit(1)

        if (existingOrder.length > 0) {
          console.log(
            `[route.ts] ⚠️ Order already exists for checkout session ${checkoutSessionCompleted.id}. Skipping processing.`
          )
          break
        }

        let subscriptionSchedule
        // Check if it's an installment plan for a trip
        if (
          checkoutSessionCompleted.metadata?.payment_method === 'installment-plan'
        ) {
          //log conditions
          console.log(`💸 Stripe: Setting up subscription schedule for installment plan...`)
          console.log(
            `💸 Stripe: route.ts | Payment Method: ${checkoutSessionCompleted.metadata?.payment_method}`,
          )
          console.log(`💸 Stripe: route.ts | Type: ${checkoutSessionCompleted.metadata?.type}`)

          // Get the customer ID and payment method ID
          const customerId = checkoutSessionCompleted.customer as string
          const paymentIntentId = checkoutSessionCompleted.payment_intent as string
          console.log(`💸 Stripe: route.ts | Customer Id: ${customerId}`)
          console.log(`💸 Stripe: route.ts | Payment Intent Id: ${paymentIntentId}`)

          // Retrieve PaymentIntent with connected account context
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
            stripeAccount: connectedAccountId,
          })

          const paymentMethodId = paymentIntent.payment_method as string

          // Create the subscription schedule within connected account
          subscriptionSchedule = await createSubscriptionSchedule({
            customerId,
            paymentMethodId,
            connectedAccountId,
            metadata: checkoutSessionCompleted.metadata,
          })
        }

        await handleCheckoutSessionCompleted(
          checkoutSessionCompleted,
          connectedAccountId,
          subscriptionSchedule?.schedule,
          subscriptionSchedule?.subscription
        )

        console.log(
          `[route.ts] 💸✅ Finished handling Checkout Session Completed with id ${checkoutSessionCompleted.id}`,
        )
        break

      case 'product.updated':
        console.log(`[route.ts] 🛍️🔄 ${event.type} with id ${event.data.object.id}`)
        revalidateTag('products')
        console.log(`[route.ts] 🛍️🔄 Products cache invalidated`)
        break

      case 'price.updated':
        console.log(`[route.ts] 🛍️🔄 ${event.type} with id ${event.data.object.id}`)
        revalidateTag('products')
        console.log(`[route.ts] 🛍️🔄 Products cache invalidated`)
        break

      // Handle additional event types as needed

      case 'checkout.session.async_payment_failed':
        const checkoutSessionAsyncPaymentFailed = event.data.object
        console.log(
          `[route.ts] 🛒❌ Checkout Session Async Payment Failed with id ${checkoutSessionAsyncPaymentFailed.id}`,
        )
        break
      case 'checkout.session.async_payment_succeeded':
        const checkoutSessionAsyncPaymentSucceeded = event.data.object
        console.log(
          `[route.ts] 🛒✅ Checkout Session Async Payment Succeeded with id ${checkoutSessionAsyncPaymentSucceeded.id}`,
        )
        break

      case 'payment_intent.succeeded':
        const paymentIntentSucceeded = event.data.object as Stripe.PaymentIntent
        console.log(`[route.ts] 💰✅ Payment Intent Succeeded: ${paymentIntentSucceeded.id}`)
        break

      case 'charge.succeeded':
        const chargeSucceeded = event.data.object as Stripe.Charge
        console.log(`[route.ts] 💳✅ Charge Succeeded: ${chargeSucceeded.id}`)
        break

      case 'payment_intent.created':
        const paymentIntentCreated = event.data.object as Stripe.PaymentIntent
        console.log(`[route.ts] 💰🆕 Payment Intent Created: ${paymentIntentCreated.id}`)
        break

      case 'customer.created':
        const customerCreated = event.data.object as Stripe.Customer
        console.log(`[route.ts] 👥🆕 Customer Created: ${customerCreated.id}`)
        break

      case 'customer.updated':
        const customerUpdated = event.data.object as Stripe.Customer
        console.log(`[route.ts] 👥🔄 Customer Updated: ${customerUpdated.id}`)
        break

      case 'product.created':
        const productCreated = event.data.object as Stripe.Product
        console.log(`[route.ts] 🛍️🆕 Product Created: ${productCreated.id}`)
        break

      case 'price.created':
        const priceCreated = event.data.object as Stripe.Price
        console.log(`[route.ts] 💲🆕 Price Created: ${priceCreated.id}`)
        break

      case 'plan.created':
        const planCreated = event.data.object as Stripe.Plan
        console.log(`[route.ts] 📅🆕 Plan Created: ${planCreated.id}`)
        break

      case 'subscription_schedule.created':
        const subscriptionScheduleCreated = event.data.object as Stripe.SubscriptionSchedule
        console.log(
          `[route.ts] 🔔📅 Subscription Schedule Created: ${subscriptionScheduleCreated.id}`,
        )
        break

      case 'customer.subscription.created':
        const subscriptionCreated = event.data.object as Stripe.Subscription
        console.log(`[route.ts] 👥🔔 Customer Subscription Created: ${subscriptionCreated.id}`)
        break

      case 'invoice.created':
        const invoiceCreated = event.data.object as Stripe.Invoice
        console.log(`[route.ts] 🧾🆕 Invoice Created: ${invoiceCreated.id}`)
        break

      case 'subscription_schedule.updated':
        const subscriptionScheduleUpdated = event.data.object as Stripe.SubscriptionSchedule
        console.log(
          `[route.ts] 🔔📅 Subscription Schedule Updated: ${subscriptionScheduleUpdated.id}`,
        )
        break

      case 'invoice.updated':
        const invoiceUpdated = event.data.object as Stripe.Invoice
        console.log(`[route.ts] 🧾🔄 Invoice Updated: ${invoiceUpdated.id}`)
        break

      case 'test_helpers.test_clock.created':
        const testClockCreated = event.data.object as Stripe.TestHelpers.TestClock
        console.log(`[route.ts] 🧪🕰️ Test Clock Created: ${testClockCreated.id}`)
        break

      case 'application_fee.created':
        const applicationFeeCreated = event.data.object as Stripe.ApplicationFee
        console.log(`[route.ts] 💼💰 Application Fee Created: ${applicationFeeCreated.id}`)
        break

      case 'invoice.paid':
        const invoicePaid = event.data.object as Stripe.Invoice
        console.log(`[route.ts] 🧾💵 Invoice Paid: ${invoicePaid.id}`)
        break

      case 'invoice.payment_succeeded':
        const invoicePaymentSucceeded = event.data.object as Stripe.Invoice
        console.log(`[route.ts] 🧾💳 Invoice Payment Succeeded: ${invoicePaymentSucceeded.id}`)
        break

      case 'invoice.finalized':
        const invoiceFinalized = event.data.object as Stripe.Invoice
        console.log(`[route.ts] 🧾✅ Invoice Finalized: ${invoiceFinalized.id}`)
        break

      case 'invoice.upcoming':
        const invoiceUpcoming = event.data.object as Stripe.Invoice
        console.log(`[route.ts] 🧾🔮 Invoice Upcoming: ${invoiceUpcoming.id}`)
        break

      case 'customer.subscription.updated':
        const subscriptionUpdated = event.data.object as Stripe.Subscription
        console.log(`[route.ts] 👥🔔 Customer Subscription Updated: ${subscriptionUpdated.id}`)
        break

      case 'test_helpers.test_clock.ready':
        const testClockReady = event.data.object as Stripe.TestHelpers.TestClock
        console.log(`[route.ts] 🧪🕰️ Test Clock Ready: ${testClockReady.id}`)
        break

      case 'subscription_schedule.expiring':
        const subscriptionScheduleExpiring = event.data.object as Stripe.SubscriptionSchedule
        console.log(
          `[route.ts] 🔔📅 Subscription Schedule Expiring: ${subscriptionScheduleExpiring.id}`,
        )
        break

      case 'test_helpers.test_clock.advancing':
        const testClockAdvancing = event.data.object as Stripe.TestHelpers.TestClock
        console.log(`[route.ts] 🧪🕰️ Test Clock Advancing: ${testClockAdvancing.id}`)
        break

      case 'subscription_schedule.completed':
        const subscriptionScheduleCompleted = event.data.object as Stripe.SubscriptionSchedule
        console.log(
          `[route.ts] 🔔📅 Subscription Schedule Completed: ${subscriptionScheduleCompleted.id}`,
        )
        break

      case 'customer.subscription.deleted':
        const subscriptionDeleted = event.data.object as Stripe.Subscription
        console.log(`[route.ts] 👥🔔 Customer Subscription Deleted: ${subscriptionDeleted.id}`)
        console.log(`[route.ts] 🔍 Subscription Details:`, JSON.stringify(subscriptionDeleted, null, 2))

        await db.transaction(async (tx) => {
          console.log(`[route.ts] 🔄 Starting database transaction...`)

          // Define the cutoff date
          const cutoffDate = new Date('2024-10-01T00:00:00Z')

          // First try to find by subscription ID with createdAt filter
          let issuedTripData = await tx
            .select()
            .from(issuedTrips)
            .where(
              sql`${issuedTrips.stripeSubscription}->>'id' = ${subscriptionDeleted.id}`
            )
            .limit(1)

          // If no result, try to find by customer ID with createdAt filter
          if (issuedTripData.length === 0 && subscriptionDeleted.customer) {
            console.log(`[route.ts] 🔍 No result by subscription ID, checking issued trips and cards by customer ID: ${subscriptionDeleted.customer}`)

            // Check both issuedTrips and issuedCards tables with createdAt filter
            const [tripResults, cardResults] = await Promise.all([
              tx
                .select()
                .from(issuedTrips)
                .innerJoin(orders, eq(orders.issuedTripsId, issuedTrips.id))
                .innerJoin(users, eq(users.id, issuedTrips.clerkUserId))
                .where(
                  and(
                    eq(users.stripeCustomerId, subscriptionDeleted.customer as string),
                    sql`${issuedTrips.createdAt} > ${cutoffDate}`
                  )
                )
                .limit(1),

              tx
                .select()
                .from(issuedCards)
                .innerJoin(orders, eq(orders.issuedCardsId, issuedCards.id))
                .innerJoin(users, eq(users.id, issuedCards.clerkUserId))
                .where(
                  and(
                    eq(users.stripeCustomerId, subscriptionDeleted.customer as string),
                    sql`${issuedCards.createdAt} > ${cutoffDate}`
                  )
                )
                .limit(1),
            ])

            if (tripResults.length > 0) {
              issuedTripData = [tripResults[0].issued_trips]
              console.log(`[route.ts] ✅ Found issued trip via customer ID lookup`)
            } else if (cardResults.length > 0) {
              console.log(`[route.ts] ℹ️ Found issued card instead of trip - skipping cancellation`)
              return // Exit early as this is a card subscription
            }
          }

          console.log(`[route.ts] 🔍 Query result:`, JSON.stringify(issuedTripData, null, 2))

          if (issuedTripData.length > 0) {
            const issuedTripId = issuedTripData[0].id
            console.log(`[route.ts] ✅ Found issued trip with ID: ${issuedTripId}`)

            // Update the issued trip status to cancelled
            console.log(`[route.ts] 🔄 Updating issued trip status to cancelled...`)
            await tx
              .update(issuedTrips)
              .set({
                status: 'FGYVLYwWNoqA', // Cancelled status
                updatedAt: new Date().toISOString(),
              })
              .where(eq(issuedTrips.id, issuedTripId))
            console.log(`[route.ts] ✅ Issued trip status updated successfully`)

            // Update the corresponding order status to refunded
            console.log(`[route.ts] 🔄 Updating order status to refunded...`)
            await tx
              .update(orders)
              .set({
                status: 'refunded',
                updatedAt: new Date().toISOString(),
              })
              .where(eq(orders.issuedTripsId, issuedTripId))
            console.log(`[route.ts] ✅ Order status updated successfully`)

            console.log(`IssuedTrip ${issuedTripId} and its corresponding order have been cancelled.`)
          } else {
            console.log(`[route.ts] ⚠️ No issuedTrip or issuedCard found for subscription ID: ${subscriptionDeleted.id} or customer ID: ${subscriptionDeleted.customer}`)
          }

          console.log(`[route.ts] ✅ Database transaction completed successfully`)
        })
        break

      case 'subscription_schedule.canceled':
        const subscriptionScheduleCanceled = event.data.object as Stripe.SubscriptionSchedule
        console.log(
          `[route.ts] 🔔📅 Subscription Schedule Canceled: ${subscriptionScheduleCanceled.id}`,
        )
        break

      default:
        console.log(`[route.ts] Unhandled event type ${event.type}`)
    }
  } catch (error) {
    console.error(`Error processing event type ${event.type}:`, error)
    return new Response(`Internal Server Error`, {
      status: 500,
    })
  }

  return new Response('OK', {
    status: 200,
  })
}

// things to do!
// handle any events that need to be passed through to customer.io
