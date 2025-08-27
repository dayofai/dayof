import { db } from '@/lib/db'
import {
  bookingFees,
  cardTiers,
  cards,
  issuedCardStatus,
  issuedCards,
  locations,
  prices,
  processingFees,
  users,
  weeks,
} from '@/schema'
import { InferSelectModel, and, eq, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { cache } from 'react'

export type TUpgradeDataResponse = Awaited<ReturnType<typeof getUpgradeData>>

export type TCurrentCard = {
  issuedCardId: InferSelectModel<typeof issuedCards>['id']
  cardImageUrl: InferSelectModel<typeof cards>['cardImageUrl']
  cardTierName: InferSelectModel<typeof cardTiers>['name']
  fastPassPlus: InferSelectModel<typeof issuedCards>['fastPassPlus']
  fastPass: InferSelectModel<typeof issuedCards>['fastPass']
  locationName: InferSelectModel<typeof locations>['name']
  weekName: InferSelectModel<typeof weeks>['name']
  userFullName: InferSelectModel<typeof users>['fullName']
  userEmailAddress: InferSelectModel<typeof users>['primaryEmailAddress']
  userId: InferSelectModel<typeof issuedCards>['clerkUserId']
  issuedCardStatus: InferSelectModel<typeof issuedCardStatus>['title']
  isFastPassPlusEnabled: InferSelectModel<typeof cards>['fastPassPlusEnabled']
  isFastPassEnabled: InferSelectModel<typeof cards>['fastPassEnabled']
  hasFastPass: InferSelectModel<typeof issuedCards>['fastPass']
  hasFastPassPlus: InferSelectModel<typeof issuedCards>['fastPassPlus']
  fastPassPriceAmountCents: InferSelectModel<typeof prices>['amountCents']
  fastPassPlusPriceAmountCents: InferSelectModel<typeof prices>['amountCents']
  cardPrice: InferSelectModel<typeof prices>['amountCents']
  weekId: InferSelectModel<typeof cards>['weekId']
  locationId: InferSelectModel<typeof cards>['locationId']
  bookingFeeAmountCents: InferSelectModel<typeof bookingFees>['amountCents']
  processingFeeAmountPercent: InferSelectModel<typeof processingFees>['amountPercent']
  stripeCheckoutSessionId: InferSelectModel<typeof issuedCards>['stripeCheckoutSessionId']
  locationSlug: InferSelectModel<typeof locations>['slug']
}

export type TUpgrade =
  | {
    cardId: InferSelectModel<typeof cards>['id']
    cardName: InferSelectModel<typeof cardTiers>['name']
    cardImageUrl: InferSelectModel<typeof cards>['cardImageUrl']
    locationName: InferSelectModel<typeof locations>['name']
    weekName: InferSelectModel<typeof weeks>['name']
    cardPrice: InferSelectModel<typeof prices>['amountCents']
    vipCardUpgradePriceAmountCents?: number
  }
  | undefined

export const getUpgradeData = cache(
  async (
    userId: string,
  ): Promise<
    | {
      data: {
        currentCard: TCurrentCard
        upgrade?: TUpgrade
      }
      error: undefined
    }
    | {
      data: undefined
      error: {
        title: string
        message: string
      }
    }
  > => {
    const fastPassPrices = alias(prices, 'fastPassPrices')
    const fastPassPlusPrices = alias(prices, 'fastPassPlusPrices')

    const currentCardData = await db
      .select({
        issuedCardId: issuedCards.id,
        cardImageUrl: cards.cardImageUrl,
        cardTierName: cardTiers.name,
        fastPassPlus: issuedCards.fastPassPlus,
        fastPass: issuedCards.fastPass,
        locationName: locations.name,
        weekName: weeks.name,
        userFullName: users.fullName,
        userEmailAddress: users.primaryEmailAddress,
        userId: issuedCards.clerkUserId,
        issuedCardStatus: issuedCardStatus.title,
        isFastPassPlusEnabled: cards.fastPassPlusEnabled,
        isFastPassEnabled: cards.fastPassEnabled,
        hasFastPass: issuedCards.fastPass,
        hasFastPassPlus: issuedCards.fastPassPlus,
        fastPassPriceAmountCents: fastPassPrices.amountCents,
        fastPassPlusPriceAmountCents: fastPassPlusPrices.amountCents,
        cardPrice: sql<number>`COALESCE(
          NULLIF(ROUND((${issuedCards.stripeCheckoutSession} -> 'metadata' ->> 'price')::numeric, 2) * 100, 0),
          (SELECT p.amount_cents FROM prices p WHERE p.id = cards.card_price_id)
        )`,
        weekId: cards.weekId,
        locationId: cards.locationId,
        bookingFeeAmountCents: bookingFees.amountCents,
        processingFeeAmountPercent: processingFees.amountPercent,
        stripeCheckoutSessionId: issuedCards.stripeCheckoutSessionId,
        locationSlug: locations.slug,
      })
      .from(issuedCards)
      .innerJoin(cards, eq(cards.id, issuedCards.productCardId))
      .innerJoin(weeks, eq(weeks.id, cards.weekId))
      .innerJoin(locations, eq(locations.id, cards.locationId))
      .innerJoin(cardTiers, eq(cardTiers.id, cards.cardTierId))
      .innerJoin(users, eq(users.id, issuedCards.clerkUserId))
      .innerJoin(issuedCardStatus, eq(issuedCardStatus.id, issuedCards.issuedCardStatusId))
      .innerJoin(fastPassPrices, eq(cards.fastPassPriceId, fastPassPrices.id))
      .innerJoin(fastPassPlusPrices, eq(cards.fastPassPlusPriceId, fastPassPlusPrices.id))
      .innerJoin(bookingFees, eq(cards.bookingFeeId, bookingFees.id))
      .innerJoin(processingFees, eq(cards.processingFeeId, processingFees.id))
      .where(eq(issuedCards.clerkUserId, userId))

    // user_2ck5ytYgF8pLcj4Kzjby0NtqQ6h

    if (currentCardData.length === 0) {
      return {
        data: undefined,
        error: {
          title: 'Card Not Found',
          message: `We couldn't find any purchased cards for you.`,
        },
      }
    }

    const currentCard = currentCardData[0]

    if (currentCard.cardTierName === 'Maniac Card') {
      const upgradeData = await db
        .select({
          cardId: cards.id,
          cardName: cardTiers.name,
          cardImageUrl: cards.cardImageUrl,
          locationName: locations.name,
          weekName: weeks.name,
          cardPrice: prices.amountCents,
          vipCardUpgradePriceAmountCents: sql<number>`GREATEST(0, (CAST(CAST(${prices.amountCents} AS numeric) AS integer) - CAST(CAST(${currentCard.cardPrice} AS numeric) AS integer)))`,
        })
        .from(cards)
        .innerJoin(prices, eq(prices.id, cards.cardPriceId))
        .innerJoin(weeks, eq(weeks.id, cards.weekId))
        .innerJoin(locations, eq(locations.id, cards.locationId))
        .innerJoin(cardTiers, eq(cardTiers.id, cards.cardTierId))
        .where(
          and(
            eq(cardTiers.name, 'Maniac VIP Card'),
            eq(cards.weekId, currentCard.weekId),
            eq(locations.id, currentCard.locationId),
          ),
        )

      console.log('DEBUG Upgrade Query:', {
        cardTierName: currentCard.cardTierName,
        weekId: currentCard.weekId,
        locationId: currentCard.locationId,
        currentCardPrice: currentCard.cardPrice,
        resultsFound: upgradeData.length > 0,
        upgradeData: upgradeData.length > 0 ? {
          ...upgradeData[0],
          vipPrice: upgradeData[0].cardPrice,
          priceDiff: upgradeData[0].vipCardUpgradePriceAmountCents,
        } : null,
        environment: process.env.NODE_ENV
      })

      if (upgradeData.length === 0) {
        return {
          data: {
            currentCard,
          },
          error: undefined,
        }
      }

      const upgrade = upgradeData[0]

      return {
        data: {
          currentCard,
          upgrade,
        },
        error: undefined,
      }
    }

    return {
      data: {
        currentCard,
      },
      error: undefined,
    }
  },
)
