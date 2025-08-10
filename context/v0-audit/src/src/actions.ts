'use server'

import {
  GetCardResponse,
  GetDiscountFromCodeParams,
  GetDiscountFromCodeResponse,
  GetTripsResponse,
  TGetSessionsResponse,
  db,
  getDiscountFromCode,
} from '@/lib/db'
import {
  STicketSearchParams,
  TAttendeeInfo,
  TCardParams,
  TMergedCardSearchParams,
  TTicketSearchParams,
  TTripParams,
  TTripSearchParams,
} from '@/lib/models'
import {
  createCardCheckoutSessionParams,
  createTripCheckoutSessionParams,
  stripe,
} from '@/lib/stripe/stripe'
import { absoluteUrl, formatDateTimeWithTimezone, formatLocation } from '@/lib/utils'
import { USD } from '@dinero.js/currencies'
import { dinero } from 'dinero.js'
import { InferSelectModel, and, eq, ilike, inArray, or, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import snakecaseKeys from 'snakecase-keys'
import Stripe from 'stripe'
import { TUpgrade } from './app/(external)/cards/[slug]/page'
import { upsertClerkUser } from './lib/clerk'
import { cio } from './lib/customer-io'
import { createQRCodeImage, enrollNewMember } from './lib/passkit'
import { getDistinctIdFromCookies } from './lib/posthog'
import { calculateAmountsPayNow, toStripeMoney } from './lib/stripe/calculate-amounts'
import {
  SMetadataAttendeeInfo,
  SMetadataCardSearchParams,
  SMetadataCards,
  SMetadataProduct,
  SSessionMetadata,
  TDiscount,
  TMetadataCardSearchParams,
  createCalculatedAmountsMetadata,
} from './lib/stripe/models'
import {
  cardTiers,
  cards,
  issuedCardStatus,
  issuedCards,
  linkedCards,
  linkedCardsHistory,
  locations,
  orders,
  physicalCards,
  users as usersTable,
  weeks,
} from './schema'
import { TToast } from './types/toast'
import { auth, clerkClient, User } from '@clerk/nextjs/server'

export async function userDetailsExists({
  email,
  phone,
}: {
  email: string
  phone: string
}): Promise<{
  emailExists: boolean
  phoneExists: boolean
  userId: string | undefined
}> {
  let emailExists = false
  let phoneExists = false
  let userId: string | undefined = undefined

  const client = await clerkClient()
  try {
    const emailUserList = await client.users.getUserList({
      emailAddress: [email],
      limit: 1,
    })

    emailExists = emailUserList.data.length > 0

    if (emailExists) {
      return { emailExists, phoneExists, userId: emailUserList.data[0].id }
    }

    const phoneUserList = await client.users.getUserList({
      phoneNumber: [phone],
      limit: 1,
    })

    phoneExists = phoneUserList.data.length > 0

    if (phoneExists) {
      return { emailExists, phoneExists, userId: phoneUserList.data[0].id }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error retrieving user list: ${error.message}`)
    }
    throw error
  }

  return { emailExists, phoneExists, userId }
}

const taxRates =
  process.env.VERCEL_ENV === 'production'
    ? ['txr_1OYPfKAp3wrt5iDHsGfPOUI5']
    : ['txr_1OYPdxAp3wrt5iDHiaZXl0KD']

const cardStripeAccountId = process.env.STRIPE_CA_CARDS
const tripStripeAccountId = process.env.STRIPE_CA_TRIPS

if (!cardStripeAccountId) throw new Error('STRIPE_CA_CARDS is not set')
if (!tripStripeAccountId) throw new Error('STRIPE_CA_TRIPS is not set')

export async function findOrCreateStripeCustomer(
  attendeeInfo: TAttendeeInfo,
  connectedAccountId: string,
): Promise<Stripe.Customer> {
  const { email, firstName, lastName, phone } = attendeeInfo

  try {
    // Search for an existing customer by email within the connected account
    const customers = await stripe.customers.search(
      {
        query: `email:"${email}"`,
        limit: 1,
      },
      {
        stripeAccount: connectedAccountId, // Ensure the search is within the connected account
      },
    )

    if (customers.data.length > 0) {
      // Customer exists, update their information
      const existingCustomer = customers.data[0]
      const updatedCustomer = await stripe.customers.update(
        existingCustomer.id,
        {
          name: `${firstName} ${lastName}`,
          phone,
          metadata: {
            // Add or update any additional metadata here
            updatedAt: new Date().toISOString(),
          },
        },
        {
          stripeAccount: connectedAccountId, // Update within the connected account
        },
      )
      return updatedCustomer
    } else {
      // Customer does not exist, create a new one
      const newCustomer = await stripe.customers.create(
        {
          email,
          name: `${firstName} ${lastName}`,
          phone,
          metadata: {
            // Add any initial metadata here
            createdAt: new Date().toISOString(),
          },
        },
        {
          stripeAccount: connectedAccountId, // Create within the connected account
        },
      )
      return newCustomer
    }
  } catch (error) {
    console.error('Error in findOrCreateStripeCustomer:', error)
    throw error
  }
}

export async function createCheckoutSession<
  TProduct extends GetCardResponse | GetTripsResponse[0],
  TParsedParams extends TTripParams | TCardParams,
  TParsedSearchParams extends TTripSearchParams | TMergedCardSearchParams,
>({
  attendeeInfo,
  product,
  paymentMethod,
  parsedParams,
  parsedSearchParams,
  pathname,
  gaClientId,
  gaClientSessionId,
  discount,
  upgrade,
}: {
  attendeeInfo: TAttendeeInfo
  product: TProduct
  paymentMethod: 'pay-now' | 'installment-plan'
  parsedParams: TParsedParams
  parsedSearchParams: TParsedSearchParams
  pathname: string
  gaClientId: string | undefined
  gaClientSessionId: string | undefined
  discount: TDiscount
  upgrade?: TUpgrade
}) {
  const searchParams = new URLSearchParams(
    Object.entries(parsedSearchParams).map(([key, value]) => [key, String(value)]),
  )
  let success_url = absoluteUrl(`${pathname}/success?session_id={CHECKOUT_SESSION_ID}`)
  const cancel_url = absoluteUrl(`${pathname}?${searchParams.toString()}`)
  let line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = []
  let sessionParams: Stripe.Checkout.SessionCreateParams = {}

  if (pathname.includes('/trips')) {
    const trip = product as GetTripsResponse[0]
    const searchParams = parsedSearchParams as TTripSearchParams

    let success_url = absoluteUrl(
      `${pathname}/success?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(attendeeInfo.email)}&phone=${encodeURIComponent(attendeeInfo.phone)}&location=${encodeURIComponent(trip.locations.slug)}&locationName=${encodeURIComponent(trip.locations.name)}&week=${encodeURIComponent(trip.weeks.slug)}&firstName=${encodeURIComponent(attendeeInfo.firstName)}&lastName=${encodeURIComponent(attendeeInfo.lastName)}`,
    )

    const tripSessionParams = await createTripCheckoutSessionParams({
      product: trip,
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
    })

    sessionParams = tripSessionParams
  }

  if (pathname.includes('/cards')) {
    const card = product as GetCardResponse

    const params = parsedParams as TCardParams
    const searchParams = parsedSearchParams as TMergedCardSearchParams

    const cardSessionParams = await createCardCheckoutSessionParams({
      product: card,
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
    })

    sessionParams = cardSessionParams
  }

  // Add attendee Info Session Params
  const metadataAttendeeInfo = SMetadataAttendeeInfo.parse(attendeeInfo)

  sessionParams.metadata = {
    ...sessionParams.metadata,
    ...metadataAttendeeInfo,
  }

  const connectedAccountId = pathname.includes('/cards') ? cardStripeAccountId : tripStripeAccountId

  if (!connectedAccountId) {
    throw new Error('Connected Account ID is not set')
  }
  console.log(`[actions.ts] Creating checkout session: Preparing to find or create Stripe customer`)

  // Find or create the Stripe customer within the connected account
  const customer = await findOrCreateStripeCustomer(attendeeInfo, connectedAccountId)

  console.log(
    `[actions.ts] Creating checkout session: Stripe customer found/created with ID: ${customer.id}`,
  )

  // Assign the customer ID to sessionParams
  sessionParams.customer = customer.id

  console.log(`[actions.ts] Creating checkout session: Assigned customer ID to sessionParams`)
  console.log(
    `[actions.ts] Creating checkout session: sessionParams:`,
    JSON.stringify(sessionParams, null, 2),
  )

  // Create the Checkout Session with the connected account
  const session = await stripe.checkout.sessions.create(sessionParams, {
    stripeAccount: pathname.includes('/cards') ? cardStripeAccountId : tripStripeAccountId,
  })

  if (!session || !session.url) throw new Error('Could not create Stripe checkout session')

  console.log(`🔔 Created Stripe checkout session with id ${session.id} and url ${session.url}`)
  console.log({
    url: session.url,
    metadata: session.metadata,
  })

  redirect(session.url)
}

export async function getOrdersByClerkUserId({ userId }: { userId: string }) {
  const orderData = await db.select().from(orders).where(eq(orders.clerkUserId, userId))
  return orderData
}

export async function isValidDiscount({ discountCode }: GetDiscountFromCodeParams) {
  return !!(await getDiscountFromCode({ discountCode }))
}

export async function linkCards({
  issuedCardId,
  physicalCardNanoId,
  status,
}: {
  issuedCardId: string
  physicalCardNanoId: string
  status: string
}): Promise<
  | {
    data: undefined
    error: TToast
  }
  | {
    data: Pick<InferSelectModel<typeof linkedCards>, 'id' | 'issuedCardId' | 'physicalCardId'>
    error: undefined
  }
> {
  const { userId } = await auth()

  if (!userId) {
    return {
      data: undefined,
      error: {
        title: 'Staff User not found',
        description:
          'The staff user who scanned the card is not properly authenticated. Please log out and log in again. If the problem persists, please contact Jon.',
      },
    }
  }

  const cardData = await db
    .select({
      id: issuedCards.id,
      productCardId: issuedCards.productCardId,
      weekId: cards.weekId,
      weekName: weeks.name,
      locationId: cards.locationId,
      locationName: locations.name,
      cardTierId: cards.cardTierId,
      cardTierName: cardTiers.name,
      issuedCardStatusId: issuedCards.issuedCardStatusId,
      issuedCardStatus: issuedCardStatus.status,
    })
    .from(issuedCards)
    .innerJoin(cards, eq(issuedCards.productCardId, cards.id))
    .innerJoin(weeks, eq(cards.weekId, weeks.id))
    .innerJoin(locations, eq(cards.locationId, locations.id))
    .innerJoin(cardTiers, eq(cards.cardTierId, cardTiers.id))
    .innerJoin(issuedCardStatus, eq(issuedCards.issuedCardStatusId, issuedCardStatus.id))
    .where(eq(issuedCards.stripeCheckoutSessionId, issuedCardId))
    .limit(1)

  if (!cardData.length) {
    return {
      data: undefined,
      error: {
        title: 'Card ID not found',
        description:
          'The corresponding CardId to the Issued Mobile Wallet could not be found. Please contact Jon.',
      },
    }
  }

  const issuedCard = cardData[0]

  const physicalCardData = await db
    .select({
      id: physicalCards.id,
      weekId: physicalCards.weekId,
      weekName: weeks.name,
      locationId: physicalCards.locationId,
      locationName: locations.name,
      cardTierId: physicalCards.cardTierId,
      cardTierName: cardTiers.name,
    })
    .from(physicalCards)
    .leftJoin(weeks, eq(physicalCards.weekId, weeks.id)) // Using leftJoin for weeks since not every physical card has a week
    .leftJoin(locations, eq(physicalCards.locationId, locations.id)) // Using leftJoin for locations since not every physical card has a location
    .innerJoin(cardTiers, eq(physicalCards.cardTierId, cardTiers.id))
    .where(eq(physicalCards.nanoid, physicalCardNanoId))
    .limit(1)

  if (!physicalCardData.length) {
    return {
      data: undefined,
      error: {
        title: 'Physical Card ID not found',
        description:
          'The corresponding Physical CardId to the Scanned Card could not be found. Please contact Jon.',
      },
    }
  }

  const physicalCard = physicalCardData[0]

  const targetWeek5Id = 'kNkus0tXHbao'; // ID for Week 5
  const targetWeek6Id = '1sDK7NiGsZFg'; // ID for Week 6

  // Determine if the special Week 5 rule applies *first*
  const isSpecialWeek5Case =
    issuedCard.weekId === targetWeek5Id &&
    physicalCard.weekId === targetWeek5Id;
    
  // New special case allowing Week 5 physical cards to link to Week 6 passes
  const isWeek5ToWeek6Case = 
    physicalCard.weekId === targetWeek5Id && 
    issuedCard.weekId === targetWeek6Id;

  if (
    typeof physicalCard.weekId === 'string' // @KOAJON: here checking that if no week then it should return false and skip week check
  ) {
    // Skip the week match check if we have the special Week 5 to Week 6 case
    if (physicalCard.weekId !== issuedCard.weekId && !isWeek5ToWeek6Case) {
      return {
        data: undefined,
        error: {
          title: 'Weeks Do Not Match',
          description: `The physical card is valid for ${physicalCard.weekName} and the issued card is valid for ${issuedCard.weekName}.`,
        },
      }
    }
  }

  if (typeof physicalCard.locationId === 'string') {
    if (physicalCard.locationId !== issuedCard.locationId) {
      return {
        data: undefined,
        error: {
          title: 'Locations Do Not Match',
          description: `Their physical card is valid for ${physicalCard.locationName} and the issued card is valid for ${issuedCard.locationName}.`,
        },
      }
    }
  }

  // @KOAJON: Also added this check to make sure we only link active issued cards
  // Check for tier mismatch, *unless* it's the special Week 5 case or Week 5 to Week 6 case
  if (!isSpecialWeek5Case && !isWeek5ToWeek6Case && physicalCard.cardTierId !== issuedCard.cardTierId) {
    return {
      data: undefined,
      error: {
        title: 'Card Tiers do not match',
        description: `Their physical card is a ${physicalCard.cardTierName} and the issued card is a ${issuedCard.cardTierName}.`,
      },
    }
  }

  const txnData = await db.transaction(async (tx) => {
    const linkedCardsData = await tx
      .insert(linkedCards)
      .values({
        issuedCardId: issuedCard.id,
        physicalCardId: physicalCard.id,
        linkedBy: userId,
      })
      .returning({
        id: linkedCards.id,
        issuedCardId: linkedCards.issuedCardId,
        physicalCardId: linkedCards.physicalCardId,
        linkedLattitude: linkedCards.linkedLattitude,
        linkedLongitude: linkedCards.linkedLongitude,
        linkedBy: linkedCards.linkedBy,
        createdAt: linkedCards.createdAt,
        updatedAt: linkedCards.updatedAt,
      })

    const linkedCardData = linkedCardsData[0]

    const { id, ...linkedCardsHistoryData } = linkedCardData

    await tx.insert(linkedCardsHistory).values({
      ...linkedCardsHistoryData,
      linkedCardId: linkedCardData.id,
      action: 'link',
    })

    console.log(linkedCardData)

    return linkedCardData
  })

  // redirect(`/team/link-cards/action/${physicalCardNanoId}/${issuedCardId}`)
  // revalidatePath(`/team/link-cards/action/${physicalCardNanoId}/${issuedCardId}`, 'page')

  return {
    data: txnData,
    error: undefined,
  }
}

export const unlinkCards = async ({
  physicalCardNanoId,
  issuedCardId,
  pathname,
}: {
  physicalCardNanoId: string | undefined
  issuedCardId: string | undefined
  pathname: string
}): Promise<
  | {
    data: InferSelectModel<typeof linkedCards>[]
    error: undefined
  }
  | {
    data: undefined
    error: TToast
  }
> => {
  const txnData = await db.transaction(
    async (
      tx,
    ): Promise<
      | { data: InferSelectModel<typeof linkedCards>[]; error: undefined }
      | {
        data: undefined
        error: TToast
      }
    > => {
      let physicalCardId: string | undefined = undefined
      let IssuedCardId: string | undefined = undefined

      if (issuedCardId) {
        const issuedCardData = await tx
          .select()
          .from(issuedCards)
          .where(eq(issuedCards.stripeCheckoutSessionId, issuedCardId))
          .limit(1)

        if (!issuedCardData.length) {
          return {
            data: undefined,
            error: {
              title: 'Issued Card not found',
              description: 'The issued card could not be found. Please contact Jon.',
            },
          }
        }

        const issuedCard = issuedCardData[0]
        issuedCardId = issuedCard.id
      }

      if (physicalCardNanoId) {
        const physicalCardData = await tx
          .select()
          .from(physicalCards)
          .where(eq(physicalCards.nanoid, physicalCardNanoId))
          .limit(1)

        if (!physicalCardData.length) {
          return {
            data: undefined,
            error: {
              title: 'Physical Card not found',
              description: 'The physical card could not be found. Please contact Jon.',
            },
          }
        }

        const physicalCard = physicalCardData[0]
        physicalCardId = physicalCard.id
      }

      if (!physicalCardId || !issuedCardId) {
        return {
          data: undefined,
          error: {
            title: 'Physical Card or Issued Card not found',
            description:
              'The physical card or issued card id could not be found. Please contact Jon.',
          },
        }
      }

      const recordToDeleteData = await tx
        .select()
        .from(linkedCards)
        .where(
          or(
            eq(linkedCards.physicalCardId, physicalCardId),
            eq(linkedCards.issuedCardId, issuedCardId),
          ),
        )

      console.log({ recordToDeleteData })

      const unlinkAction = 'unlink' as const

      await tx.insert(linkedCardsHistory).values(
        recordToDeleteData.map((record) => {
          const { id, ...rest } = record

          return {
            ...rest,
            linkedCardId: id,
            action: unlinkAction,
          }
        }),
      )

      const deleteLinkedCardIds = recordToDeleteData.map((record) => record.id)

      await tx.delete(linkedCards).where(inArray(linkedCards.id, deleteLinkedCardIds))

      console.log(`🐘 Neon: Deleted linked cards with ids ${deleteLinkedCardIds.join(',')}`)

      return {
        data: recordToDeleteData,
        error: undefined,
      }
    },
  )

  revalidatePath(pathname, 'page')

  return txnData
}

export const createTicketCheckoutSession = async ({
  ticket,
  discount,
  upgradeType,
  attendeeInfo,
  searchParams,
  success_url,
  cancel_url,
}: {
  ticket: TGetSessionsResponse[0]
  discount: GetDiscountFromCodeResponse
  upgradeType: TTicketSearchParams['upgradeType']
  attendeeInfo: TAttendeeInfo
  searchParams: TTicketSearchParams
  success_url: string
  cancel_url: string
}) => {
  const parsedSearchParams = STicketSearchParams.parse(searchParams)

  const quantityPriceAmountCents =
    ticket.ticketPrice.amountCent * (parsedSearchParams.quantity || 1)

  const quantityUpgradeAmountCents =
    upgradeType === 'fastPass'
      ? ticket.fastPassPrice.amountCent * (parsedSearchParams.quantity || 1)
      : undefined

  const calculatedAmountsPayNow = calculateAmountsPayNow({
    priceAmountCents: quantityPriceAmountCents,
    discountConfig: discount,
    fees: {
      bookingAmountCents: ticket.bookingFee.amountCent,
      processingAmountPercent: ticket.processingFee.amountPercent,
      paymentPlanFeeAmountCents: 0,
    },
    upgradeAmountCents: quantityUpgradeAmountCents,
  })

  let sessionParams: Stripe.Checkout.SessionCreateParams = {
    cancel_url,
    success_url,
    customer_email: attendeeInfo.email,
    customer_creation: 'always',
  }

  const startTimeFormatted = new Date(ticket.session.startTime).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: ticket.session.timezone || undefined,
  })

  const subtotalDiscounted = toStripeMoney(calculatedAmountsPayNow.subtotalDiscounted)
  const ticketLineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
    quantity: 1,
    price_data: {
      product_data: {
        name: `${ticket.session.name} - ${startTimeFormatted}`,
        description: `${ticket.venue.name} - ${ticket.location.name}`,
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

  sessionParams.line_items = [ticketLineItem, feeLineItem, taxLineItem]

  sessionParams.mode = 'payment'

  const description = `${ticket.session.name} - ${startTimeFormatted} - ${ticket.venue.name}`

  sessionParams.payment_intent_data = {
    description,
  }

  const calculatedAmountsMetadata = createCalculatedAmountsMetadata({
    calculatedAmountsPayNow,
    calculatedAmountsPaymentPlan: {
      ...calculatedAmountsPayNow,
      applicationFeePaymentPlan: dinero({ amount: 0, currency: USD }),
      applicationFeePaymentPlanPercent: dinero({ amount: 0, currency: USD }),
      taxFirstInstallment: dinero({ amount: 0, currency: USD }),
      tax: dinero({ amount: 0, currency: USD }),
      totalFees: dinero({ amount: 0, currency: USD }),
      remainder: dinero({ amount: 0, currency: USD }),
      totalBeforeTaxFirstInstallment: dinero({ amount: 0, currency: USD }),
      totalAfterTaxFirstInstallment: dinero({ amount: 0, currency: USD }),
      schedule: {
        interval: 'month',
        intervalCount: 1,
        payments: [],
      },
    },
    paymentMethod: 'pay-now',
  })

  const sessionMetadata: SSessionMetadata = {
    sessionId: ticket.session.id,
    name: ticket.session.name,
    startTime: formatDateTimeWithTimezone({
      date: ticket.session.startTime,
      timezone: ticket.session.timezone,
    }),
    endTime: ticket.session.endTime?.toString() ?? undefined,
    fastPassEnabled: `${ticket.session.fastPassEnabled}`,
    venueId: ticket.venue.id,
    venueName: ticket.venue.name,
    locationId: ticket.location.id,
    locationName: ticket.location.name,
    locationSlug: ticket.location.slug,
  }

  const snakeCaseSessionMetadata = snakecaseKeys(sessionMetadata)

  const { sessionId, date, ...rest } = searchParams

  const snakeCaseSearchParams = snakecaseKeys(rest)

  const cookieStore = await cookies()
  const distinctId = getDistinctIdFromCookies({ cookieStore })

  const metadataAttendeeInfo = SMetadataAttendeeInfo.parse(attendeeInfo)

  sessionParams.metadata = {
    ...snakeCaseSessionMetadata,
    ...calculatedAmountsMetadata,
    ...snakeCaseSearchParams,
    ...metadataAttendeeInfo,
    distinct_id: distinctId,
    type: 'ticket',
    payment_method: 'pay-now',
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  if (!session || !session.url) throw new Error('Could not create Stripe checkout session')

  console.log(`🔔 Created Stripe checkout session with id ${session.id} and url ${session.url}`)
  console.log({
    url: session.url,
    metadata: session.metadata,
  })

  redirect(session.url)
}

export type TActivatePhysicalCardResponse = Awaited<ReturnType<typeof activatePhysicalCard>>

export async function activatePhysicalCard({
  attendeeInfo,
  physicalCardNanoId,
}: {
  attendeeInfo: TAttendeeInfo
  physicalCardNanoId: string
}): Promise<
  | {
    data: undefined
    error: TToast
  }
  | {
    data: {
      orderId: string
      issuedCardId: string
      linkedCardId: string
      enrollmentId: string | undefined
      qrCode: string | undefined
      attendeeFirstName: string
    }
    error: undefined
  }
> {
  console.log('🔔 Activating physical card...')

  const metadataAttendeeInfo = SMetadataAttendeeInfo.parse(attendeeInfo)

  // Check if physical card exists
  const physicalCardsData = await db
    .select()
    .from(physicalCards)
    .where(eq(physicalCards.nanoid, physicalCardNanoId))
    .limit(1)

  // Check if Physical Card exists
  if (!physicalCardsData.length) {
    return {
      data: undefined,
      error: {
        title: 'Physical Card not found',
        description: 'The physical card could not be found. Please contact Jon.',
        variant: 'destructive',
      },
    }
  }

  const physicalCard = physicalCardsData[0]
  const physicalCardWeekId = physicalCard.weekId
  const physicalCardLocationId = physicalCard.locationId

  if (typeof physicalCardWeekId !== 'string') {
    return {
      data: undefined,
      error: {
        title: 'Physical Card Has No Week',
        description: 'The physical card does not have a week assigned. Please contact Jon.',
        variant: 'destructive',
      },
    }
  }

  if (typeof physicalCardLocationId !== 'string') {
    return {
      data: undefined,
      error: {
        title: 'Physical Card Has No Location',
        description: 'The physical card does not have a location assigned. Please contact Jon.',
        variant: 'destructive',
      },
    }
  }

  // physicalCardWeekId
  // Check if physical card is already activated/linked
  const linkedCardsData = await db
    .select({
      id: linkedCards.id,
      physicalCardId: linkedCards.physicalCardId,
      issuedCardId: linkedCards.issuedCardId,
    })
    .from(linkedCards)
    .where(eq(linkedCards.physicalCardId, physicalCard.id))
    .limit(1)

  if (linkedCardsData.length) {
    return {
      data: undefined,
      error: {
        title: 'Physical Card already activated',
        description: 'The physical card is already activated. Please contact Jon.',
        variant: 'destructive',
      },
    }
  }

  // Link Physical Card

  try {
    const txnData = await db.transaction(async (tx) => {
      const cardData = await tx
        .select()
        .from(cards)
        .innerJoin(weeks, eq(weeks.id, cards.weekId))
        .innerJoin(cardTiers, eq(cardTiers.id, cards.cardTierId))
        .innerJoin(locations, eq(locations.id, physicalCardLocationId))
        .where(
          and(
            eq(cards.cardTierId, physicalCard.cardTierId),
            eq(cards.locationId, physicalCardLocationId),
            eq(cards.weekId, physicalCardWeekId),
          ),
        )
        .limit(1)

      if (!cardData.length) {
        throw new Error(`A matching Maniac Card could not be found. Please contact Jon.`)
      }

      const card = cardData[0]

      const metadataCard = SMetadataCards.parse({
        location: card.locations.slug,
        week: card.weeks.slug,
        tier: card.card_tiers.passkitId,
        locationFormatted: card.locations.name,
        tierFormatted: card.card_tiers.name,
        weekFormatted: card.weeks.name,
      })

      const description = `${metadataCard.tier_formatted} - ${formatLocation(
        metadataCard.location_formatted,
      )} - ${metadataCard.week_formatted}`

      const metadataProduct = SMetadataProduct.parse({
        productId: card.cards.id,
        name: card.cards.name,
        description: description,
      })

      const metadataCardParamsInput: TMetadataCardSearchParams = {
        locked: true,
        discount_code: undefined,
        email: attendeeInfo.email,
        phone: attendeeInfo.phone,
        first_name: attendeeInfo.firstName,
        last_name: attendeeInfo.lastName,
        group_code: undefined,
        location: metadataCard.location,
        week: metadataCard.week,
      }

      const metadataSearchParams = SMetadataCardSearchParams.parse(metadataCardParamsInput)

      let user: User | undefined = undefined

      try {
        console.log(`👤 Clerk: Creating user...`)
        const createdUser = await upsertClerkUser({
          metadataAttendeeInfo,
          stripeCustomerId: undefined,
        })

        user = createdUser
        console.log(`👤 Clerk: Created user with id ${user.id}`)
      } catch (error) {
        console.error(`Error creating user:`, error)
        throw new Error(`An error occurred while creating the user. Please contact Jon.`)
      }

      console.log(`🐘 Neon: Synching user with id ${user.id}...`)
      const upsertedUser = await tx
        .insert(usersTable)
        .values({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          primaryEmailAddress: metadataAttendeeInfo.email,
          primaryPhoneNumber: metadataAttendeeInfo.phone,
          fullName: `${metadataAttendeeInfo.first_name} ${metadataAttendeeInfo.last_name}`,
        })
        .onConflictDoNothing()

      const activeStatusData = await tx
        .select({
          id: issuedCardStatus.id,
        })
        .from(issuedCardStatus)
        .where(eq(issuedCardStatus.status, 'active'))
        .limit(1)

      if (activeStatusData.length === 0) {
        throw new Error(`An active status could not be found. Please contact Jon.`)
      }

      const activeStatusId = activeStatusData[0].id
      console.log(`🐘 Neon: Retrieved active card sttus with id ${activeStatusId}`)

      const issuedCardData = await tx
        .insert(issuedCards)
        .values({
          productCardId: card.cards.id,
          clerkUserId: user.id,
          issuedCardStatusId: activeStatusId,
          stripeCheckoutSession: 'N/A',
          stripeCheckoutSessionId: `cash_${physicalCardNanoId}`,
        })
        .returning({
          id: issuedCards.id,
        })

      if (!issuedCardData.length) {
        throw new Error(`An error occurred while creating the issued card. Please contact Jon.`)
      }

      const issuedCard = issuedCardData[0]
      console.log(`🐘 Neon: Created issued card with id ${issuedCard.id}`)

      const linkedCardsData = await tx
        .insert(linkedCards)
        .values({
          issuedCardId: issuedCard.id,
          physicalCardId: physicalCard.id,
          linkedBy: user.id,
        })
        .returning({
          id: linkedCards.id,
        })

      if (!linkedCardsData.length) {
        throw new Error(`An error occurred while linking the cards. Please contact Jon.`)
      }

      const linkedCard = linkedCardsData[0]
      console.log(
        `🐘 Neon: Linked physicalCardNanoId ${physicalCardNanoId} to issuedCardId ${issuedCard.id} with linkedCardId ${linkedCard.id}`,
      )

      const orderData = await tx
        .insert(orders)
        .values({
          issuedCardsId: issuedCard.id,
          clerkUserId: user.id,
          stripeCheckoutSessionId: `cash_${physicalCardNanoId}`,
          stripeCheckoutSession: 'N/A',
          cardId: card.cards.id,
        })
        .returning({
          id: orders.id,
        })

      if (!orderData.length) {
        throw new Error(`An error occurred while creating the order. Please contact Jon.`)
      }

      const order = orderData[0]
      console.log(`🐘 Neon: Created order with id ${order.id}`)

      // 🎫 Passkit Logic
      let qrCode: string | undefined = undefined
      console.log(`🎫 Passkit: Enrolling member into Passkit...`)

      const enrolledMember = await enrollNewMember({
        checkoutSessionId: `cash_${physicalCardNanoId}`,
        clerkUserId: user.id,
        metadataProduct,
        metadataAttendeeInfo,
        metadataCardSearchParams: metadataSearchParams,
        metadataCoreProduct: metadataProduct,
        metadataCard,
        subscriptionId: undefined,
      })

      const enrollmentId = enrolledMember?.id

      if (typeof enrollmentId === 'string') {
        console.log(`🎫 Passkit: Creating QR code image...`)

        const fileName = `${enrollmentId}.png`
        const qrCodeText = `https://pub2.pskt.io/${enrollmentId}`

        const blob = await createQRCodeImage({
          qrCodeText,
          fileName,
        })
        qrCode = blob.url
        console.log(`🎫 Passkit: Created QR code image with url ${qrCode}`)
      } else {
        console.log(`🎫 Passkit: Not creating QR code image as member already exists...`)
      }

      // 📧 Customer.io Logic
      console.log(`📧 Customer.io: Identifying Customer.io Customer...`)
      await cio.identify(metadataAttendeeInfo.email, {
        first_name: metadataAttendeeInfo.first_name,
        last_name: metadataAttendeeInfo.last_name,
        phone: metadataAttendeeInfo.phone,
        created_at: new Date().toISOString(),
        clerk_user_id: user.id,
        stripe_customer_id: undefined,
        full_name: `${metadataAttendeeInfo.first_name} ${metadataAttendeeInfo.last_name}`,
        qr_code: qrCode,
        passkit_id: enrollmentId,
        upgrade_type: undefined,
      })
      console.log(`📧 Customer.io: Identified customer.`)

      console.log(`📧 Customer.io: Tracking Customer.io Order Completed Event...`)
      await cio.track(metadataAttendeeInfo.email, {
        name: 'Card Activated',
        data: {
          ...metadataAttendeeInfo,
          ...metadataProduct,
          ...metadataCard,
          checkout_session_id: `cash_${physicalCardNanoId}`,
          clerk_user_id: user.id,
          passkit_id: enrollmentId,
          qr_code: qrCode,
          subscription_id: undefined,
          upgrade_type: undefined,
        },
      })

      return {
        orderId: order.id,
        issuedCardId: issuedCard.id,
        linkedCardId: linkedCard.id,
        enrollmentId,
        qrCode,
        attendeeFirstName: attendeeInfo.firstName,
      }
    })

    return {
      data: txnData,
      error: undefined,
    }
  } catch (error) {
    console.error(`Error activating physical card:`, error)
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred. Please contact Jon.'
    return {
      data: undefined,
      error: {
        title: 'Error activating physical card',
        description: errorMessage,
        variant: 'destructive',
      },
    }
  }
}

export async function getUserOptions({ searchQuery = '' }: { searchQuery?: string } = {}) {
  const usersData = await db
    .select({
      label: sql<string>`COALESCE(${usersTable.fullName}, '')`, // Assuming 'fullName' is the column for the user's full name
      value: issuedCards.stripeCheckoutSessionId, // Assuming this is the column for the user's stripe checkout session ID
    })
    .from(issuedCards)
    .innerJoin(usersTable, eq(issuedCards.clerkUserId, usersTable.id))
    .where(ilike(usersTable.fullName, `%${searchQuery}%`)) // Use ilike for case-insensitive matching
    .limit(20)

  return usersData.map((user) => ({
    label: user.label,
    value: user.value,
  }))
}
