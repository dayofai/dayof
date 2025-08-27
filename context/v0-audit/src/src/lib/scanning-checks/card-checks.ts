import {
  cardTiers,
  cards,
  issuedCardStatus,
  issuedCards,
  linkedCards,
  locations,
  physicalCards,
  sessions,
  users,
  venues,
  weeks,
} from '@/schema'
import { formatDuration, intervalToDuration } from 'date-fns'
import { InferSelectModel, eq } from 'drizzle-orm'
import { db } from '../db'
import { checkScans, getSession } from './door-scanning-checks'

export type TCheckManiacCardResult = Awaited<ReturnType<typeof checkManiacCard>>

export const checkManiacCard = async ({
  currentTimeOverride,
  sessionId,
  issuedCardStripeCheckoutSessionId,
  physicalCardNanoId,
}: {
  currentTimeOverride: Date | undefined
  sessionId: string
  issuedCardStripeCheckoutSessionId: string | undefined
  physicalCardNanoId: string | undefined
}): Promise<
  | {
      data: {
        session: TSession
        card: TCard
        user: TUser
        issuedCard: TIssuedCard
      }
      error: undefined
    }
  | {
      data?: {
        session?: TSession
        card?: TCard
        user?: TUser
        issuedCard?: TIssuedCard
      }
      error: {
        id: string
        title: string
        description: string
      }
    }
> => {
  const currentTime = currentTimeOverride || new Date()

  const checkCardResult = await checkCard({
    issuedCardStripeCheckoutSessionId,
    physicalCardNanoId,
    sessionId,
  })

  if (checkCardResult.error) {
    return {
      data: {
        card: checkCardResult.data?.card,
        user: checkCardResult.data?.user,
        issuedCard: checkCardResult.data?.issuedCard,
        session: checkCardResult.data?.session,
      },
      error: checkCardResult.error,
    }
  }

  const { card, user, issuedCard, session } = checkCardResult.data

  const scans = await checkScans({
    sessionId: session.id,
    issuedCardId: issuedCard.id,
  })

  if (issuedCard.godMode) {
    return {
      data: {
        session,
        card,
        user,
        issuedCard,
      },
      error: undefined,
    }
  }

  if (currentTime < new Date(session.startTime)) {
    const startTime = new Date(session.startTime)
    const duration = intervalToDuration({ start: currentTime, end: startTime })
    const formattedDuration = formatDuration(duration)
    return {
      data: {
        session,
        card,
        user,
        issuedCard,
      },
      error: {
        id: 'checkManiacCard',
        title: 'Session Not Started',
        description: `The session ${session.name} will start in ${formattedDuration}.`,
      },
    }
  }
  if (session.endTime && currentTime > new Date(session.endTime)) {
    const endTime = new Date(session.endTime)
    const duration = intervalToDuration({ start: endTime, end: currentTime })
    const formattedDuration = formatDuration(duration)
    return {
      data: {
        session,
        card,
        user,
        issuedCard,
      },
      error: {
        id: 'checkManiacCard',
        title: 'Session Ended',
        description: `The session ${session.name} has ended ${formattedDuration} ago.`,
      },
    }
  }

  // @KOAJON currently god mode only skipping these checks
  if (card.tierName === 'Maniac Card') {
    if (!session.maniacCardFreeEntry) {
      return {
        data: {
          session,
          card,
          user,
          issuedCard,
        },
        error: {
          id: 'checkManiacCard',
          title: `${card.tierName} No Free Entry`,
          description: `${card.tierName} does not have free entry to this session.`,
        },
      }
    }
    // @KOAJON once Chris fixed the cutoff time we can enable this
    // if (session.maniacCardCutoffTime && currentTime > new Date(session.maniacCardCutoffTime)) {
    //   return {
    //     data: {
    //       session,
    //       card,
    //       user,
    //       issuedCard,
    //     },
    //     error: {
    //       id: 'checkManiacCard',
    //       title: 'Past Maniac Card Cutoff Time',
    //       description: `It's past the cutoff time for this Maniac Card.`,
    //     },
    //   }
    // }
  }

  if (card.tierName === 'Maniac VIP Card') {
    if (!session.maniacVipCardFreeEntry) {
      return {
        data: {
          session,
          card,
          user,
          issuedCard,
        },
        error: {
          id: 'checkManiacCard',
          title: `${card.tierName} No Free Entry`,
          description: `${card.tierName} does not have free entry to this session.`,
        },
      }
    }
    // @KOAJON once Chris fixed the cutoff time we can enable this
    // if (
    //   session.maniacVipCardCutoffTime &&
    //   currentTime > new Date(session.maniacVipCardCutoffTime)
    // ) {
    //   return {
    //     data: {
    //       session,
    //       card,
    //       user,
    //       issuedCard,
    //     },
    //     error: {
    //       id: 'checkManiacCard',
    //       title: 'Past Maniac VIP Card Cutoff Time',
    //       description: `It's past the cutoff time for this Maniac VIP Card.`,
    //     },
    //   }
    // }
  }

  if (!session.reentryAllowed && scans.numberOfEntries >= 1) {
    console.log(session.timezone)
    return {
      data: {
        session,
        card,
        user,
        issuedCard,
      },
      error: {
        id: 'checkManiacCard',
        title: 'No Reentry Allowed',
        description: `Last scanned on ${new Intl.DateTimeFormat('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
          timeZone: session.timezone
        }).format(new Date(scans.lastScan || new Date()))}.`,
      },
    }
  }

  // @KOAJON as discussed we currently don't check for this
  // if (sessions.maxReentries && scans.numberOfEntries >= Number(sessions.maxReentries)) {
  //   return {
  //     data: {
  //       session,
  //       card,
  //       user,
  //       issuedCard,
  //     },
  //     error: {
  //       id: 'checkManiacCard',
  //       title: `Max Reentries (${sessions.maxReentries}) Reached`,
  //       description: `The maximum number of reentries has been reached for this session.`,
  //     },
  //   }
  // }

  return {
    data: {
      session,
      card,
      user,
      issuedCard,
    },
    error: undefined,
  }
}

export type TSession = Pick<
  InferSelectModel<typeof sessions>,
  | 'id'
  | 'name'
  | 'venueId'
  | 'reentryAllowed'
  | 'fastPassEnabled'
  | 'maniacCardCutoffTime'
  | 'maniacVipCardCutoffTime'
  | 'maniacCardFreeEntry'
  | 'maniacVipCardFreeEntry'
  | 'startTime'
  | 'endTime'
  | 'timezone'
> & {
  venueLocationId: InferSelectModel<typeof venues>['locationId']
  venueLocationName: InferSelectModel<typeof locations>['name']
  venueName: InferSelectModel<typeof venues>['name']
}

export type TCard = Pick<
  InferSelectModel<typeof cards>,
  'id' | 'name' | 'weekId' | 'locationId' | 'details'
> & {
  startDateCards: InferSelectModel<typeof weeks>['startDateCards']
  endDateCards: InferSelectModel<typeof weeks>['endDateCards']
} & {
  tierId: InferSelectModel<typeof cards>['cardTierId']
  tierName: InferSelectModel<typeof cardTiers>['name']
} & {
  locationName: InferSelectModel<typeof locations>['name']
} & {
  weekName: InferSelectModel<typeof weeks>['name']
} & {
  imageUrl: InferSelectModel<typeof cards>['cardImageUrl']
}

export type TIssuedCard = Pick<
  InferSelectModel<typeof issuedCards>,
  'id' | 'fastPass' | 'fastPassPlus' | 'godMode' | 'clerkUserId' | 'issuedCardStatusId'
> & {
  issuedCardStatus: InferSelectModel<typeof issuedCardStatus>['status']
}

export type TUser = Pick<
  InferSelectModel<typeof users>,
  'id' | 'fullName' | 'imageUrl' | 'hasImage'
>

export const checkCard = async ({
  issuedCardStripeCheckoutSessionId,
  physicalCardNanoId,
  sessionId,
}: {
  issuedCardStripeCheckoutSessionId: string | undefined
  physicalCardNanoId: string | undefined
  sessionId: string
}): Promise<
  | {
      data: {
        card: TCard
        issuedCard: TIssuedCard
        user: TUser
        session: TSession
      }
      error: undefined
    }
  | {
      data?: {
        card?: TCard
        issuedCard?: TIssuedCard
        user?: TUser
        session?: TSession
      }
      error: {
        id: string
        title: string
        description: string
      }
    }
> => {
  if (!issuedCardStripeCheckoutSessionId && !physicalCardNanoId) {
    return {
      error: {
        id: 'checkCard',
        title: 'No Card ID',
        description: `No Card ID was provided based on the given issuedCardStripeCheckoutSessionId: ${issuedCardStripeCheckoutSessionId?.substring(0, 20)} and physicalCardNanoId: ${physicalCardNanoId}.`,
      },
      data: undefined,
    }
  }

  let cardId: string | undefined
  let issuedCardId: string | undefined

  if (issuedCardStripeCheckoutSessionId) {
    const issuedCardResults = await db
      .select({
        id: issuedCards.id,
        cardId: issuedCards.productCardId,
      })
      .from(issuedCards)
      .where(eq(issuedCards.stripeCheckoutSessionId, issuedCardStripeCheckoutSessionId))
      .limit(1)

    if (!issuedCardResults.length) {
      return {
        error: {
          id: 'checkCard',
          title: 'Issued Card Not Found',
          description: `Issued Card with ID ${issuedCardStripeCheckoutSessionId.substring(0, 20)}... not found.`,
        },
        data: undefined,
      }
    }

    const issuedCard = issuedCardResults[0]

    cardId = issuedCard.cardId
    issuedCardId = issuedCard.id
  }

  if (physicalCardNanoId) {
    const physicalCardResults = await db
      .select({
        id: physicalCards.id,
      })
      .from(physicalCards)
      .where(eq(physicalCards.nanoid, physicalCardNanoId))
      .limit(1)

    if (!physicalCardResults.length) {
      return {
        error: {
          id: 'checkCard',
          title: 'Physical Card Not Found',
          description: `Physical Card with ID ${physicalCardNanoId} not found.`,
        },
        data: undefined,
      }
    }

    const linkedCardResults = await db
      .select({
        issuedCardId: linkedCards.issuedCardId,
        cardId: issuedCards.productCardId,
      })
      .from(linkedCards)
      .innerJoin(issuedCards, eq(linkedCards.issuedCardId, issuedCards.id))
      .innerJoin(physicalCards, eq(linkedCards.physicalCardId, physicalCards.id))
      .innerJoin(cards, eq(issuedCards.productCardId, cards.id))
      .where(eq(physicalCards.nanoid, physicalCardNanoId))
      .limit(1)

    if (!linkedCardResults.length) {
      return {
        error: {
          id: 'checkCard',
          title: 'Card Not Active',
          description: `Please activate the Maniac Card before use!`,
        },
        data: undefined,
      }
    }

    const linkedCard = linkedCardResults[0]

    cardId = linkedCard.cardId
    issuedCardId = linkedCard.issuedCardId
  }

  if (!cardId) {
    return {
      error: {
        id: 'checkCard',
        title: 'Could Not Retrieve Card',
        description: `Could not retrieve a card ID based on the given issuedCardId ${physicalCardNanoId}.`,
      },
      data: undefined,
    }
  }

  if (!issuedCardId) {
    return {
      error: {
        id: 'checkCard',
        title: 'Could Not Retrieve Issued Card',
        description: `Could not retrieve an issued card ID based on the given  ${physicalCardNanoId}.`,
      },
      data: undefined,
    }
  }

  const issuedCardData = await db
    .select({
      id: issuedCards.id,
      fastPass: issuedCards.fastPass,
      fastPassPlus: issuedCards.fastPassPlus,
      godMode: issuedCards.godMode,
      clerkUserId: issuedCards.clerkUserId,
      issuedCardStatusId: issuedCards.issuedCardStatusId,
      issuedCardStatus: issuedCardStatus.status,
    })
    .from(issuedCards)
    .innerJoin(issuedCardStatus, eq(issuedCardStatus.id, issuedCards.issuedCardStatusId))
    .where(eq(issuedCards.id, issuedCardId))
    .limit(1)

  if (!issuedCardData.length) {
    return {
      error: {
        id: 'checkCard',
        title: 'Issued Card ID Not Found',
        description: `Issued Card ID not found for the given issuedCardId: ${issuedCardId}.`,
      },
      data: undefined,
    }
  }

  const issuedCard = issuedCardData[0]

  const userData = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      imageUrl: users.imageUrl,
      hasImage: users.hasImage,
    })
    .from(users)
    .where(eq(users.id, issuedCard.clerkUserId))

  if (!userData.length) {
    return {
      error: {
        id: 'checkCard',
        title: 'User Not Found',
        description: `User not found for the given clerkUserId: ${issuedCard.clerkUserId}.`,
      },
      data: {
        issuedCard,
        card: undefined,
        user: undefined,
      },
    }
  }

  const user = userData[0]

  const cardData = await db
    .select({
      id: cards.id,
      name: cards.name,
      weekId: cards.weekId,
      locationId: cards.locationId,
      details: cards.details,
      startDateCards: weeks.startDateCards,
      endDateCards: weeks.endDateCards,
      tierId: cards.cardTierId,
      tierName: cardTiers.name,
      weekName: weeks.name,
      locationName: locations.name,
      imageUrl: cards.cardImageUrl,
    })
    .from(cards)
    .innerJoin(weeks, eq(weeks.id, cards.weekId))
    .innerJoin(locations, eq(locations.id, cards.locationId))
    .innerJoin(cardTiers, eq(cardTiers.id, cards.cardTierId))
    .where(eq(cards.id, cardId))
    .limit(1)

  if (!cardData.length) {
    return {
      error: {
        id: 'checkCard',
        title: 'Card ID Not Found',
        description: `No card ID was found for ${cardId}.`,
      },
      data: {
        issuedCard,
        user,
      },
    }
  }

  const card = cardData[0]

  if (issuedCard.issuedCardStatus !== 'active') {
    return {
      error: {
        id: 'checkCard',
        title: `Card Status ${issuedCard.issuedCardStatus.toUpperCase()}`,
        description: `This Maniac Card has a status of ${issuedCard.issuedCardStatus} and is not active.`,
      },
      data: {
        issuedCard,
        card,
        user,
      },
    }
  }

  const sessionResult = await getSession({ sessionId })

  if (sessionResult.error) {
    return {
      error: sessionResult.error,
      data: {
        issuedCard,
        user,
        card,
      },
    }
  }

  const session = sessionResult.data

  if (card.locationId !== session.venueLocationId) {
    return {
      data: {
        card,
        issuedCard,
        user,
        session,
      },
      error: {
        id: 'checkSession',
        title: 'Card Location Mismatch',
        description: `This Maniac Card is only valid in ${card.locationName} but ${session.venueName} is in ${session.venueLocationName}.`,
      },
    }
  }

  const cardStartDate = new Date(card.startDateCards)
  const cardEndDate = new Date(card.endDateCards)
  // Extend the card's validity to 4 AM of the next day
  cardEndDate.setDate(cardEndDate.getDate() + 1) // Move to the next day
  cardEndDate.setHours(4, 0, 0, 0) // Set to 4 AM
  const sessionStartTime = new Date(session.startTime)
  const sessionEndTime = session.endTime ? new Date(session.endTime) : null

  // Check if the session overlaps with the card's validity period
  if (sessionEndTime && cardStartDate <= sessionEndTime) {
    // The session is ongoing when the card becomes valid or ends after the card becomes valid
    if (cardEndDate < sessionStartTime) {
      // The card expired before the session started
      return {
        error: {
          id: 'checkManiacCard',
          title: `${card.tierName} Card Expired`,
          description: `${card.tierName} expired on ${cardEndDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}.`,
        },
        data: {
          issuedCard,
          user,
          card,
          session,
        },
      }
    }
  } else if (cardStartDate > sessionStartTime) {
    // The card is not yet valid at the start of the session
    return {
      error: {
        id: 'checkManiacCard',
        title: `${card.tierName} Not Yet Valid`,
        description: `${card.tierName} is for ${card.weekName} and not valid until ${cardStartDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}.`,
      },
      data: {
        issuedCard,
        user,
        card,
        session,
      },
    }
  } else if (sessionEndTime && cardEndDate < sessionEndTime) {
    // The card expired before the session ends
    return {
      error: {
        id: 'checkManiacCard',
        title: 'Maniac Card Expired',
        description: `${card.tierName} for ${card.weekName} expired on ${cardEndDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}.`,
      },
      data: {
        issuedCard,
        user,
        card,
        session,
      },
    }
  }

  return {
    error: undefined,
    data: {
      card,
      issuedCard,
      user,
      session,
    },
  }
}
