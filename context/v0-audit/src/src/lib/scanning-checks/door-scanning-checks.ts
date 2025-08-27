import { locations, scans, sessions, venues } from '@/schema'
import { auth } from '@clerk/nextjs/server'
import { and, count, eq, max, sql } from 'drizzle-orm'
import { cache } from 'react'
import { db } from '../db'
import { TCheckManiacCardResult, TSession, checkManiacCard } from './card-checks'
import { TCheckIssuedTicketResult, checkIssuedTicket } from './issued-tickets-checks'
import { TCheckTicketTailorTicketResult, checkTicketTailorTicket } from './ticket-tailor-checks'
import { markTicketCheckedIn } from '../ticket-tailor-api'

export type TCheckScansResult = Awaited<ReturnType<typeof checkScans>>

export const checkScans = async ({
  sessionId,
  issuedCardId,
  ticketTailorIssuedTicketId,
  issuedTicketId,
}: {
  sessionId: string
  issuedCardId?: string | undefined
  ticketTailorIssuedTicketId?: string | undefined
  issuedTicketId?: string | undefined
}) => {
  if (!issuedCardId && !ticketTailorIssuedTicketId && !issuedTicketId) {
    return {
      numberOfScans: 0,
      numberOfEntries: 0,
      lastScan: undefined,
      lastEntry: undefined,
    }
  }

  let whereCondition = and()

  if (issuedCardId) {
    whereCondition = and(whereCondition, eq(scans.issuedCardId, issuedCardId))
  }

  if (ticketTailorIssuedTicketId) {
    whereCondition = and(
      whereCondition,
      eq(scans.ticketTailorIssuedTicketId, ticketTailorIssuedTicketId),
    )
  }

  if (issuedTicketId) {
    whereCondition = and(whereCondition, eq(scans.issuedTicketId, issuedTicketId))
  }

  const numberOfScansPromise = db
    .select({
      count: count(),
    })
    .from(scans)
    .where(and(eq(scans.sessionId, sessionId), whereCondition))

  // Query for numberOfEntries
  const numberOfEntriesPromise = db
    .select({
      count: count(),
    })
    .from(scans)
    .where(and(eq(scans.sessionId, sessionId), whereCondition, eq(scans.isEntry, true)))

  // Query for lastScan
  const lastScanPromise = db
    .select({
      maxCreatedAt: max(scans.createdAt),
    })
    .from(scans)
    .where(and(eq(scans.sessionId, sessionId), whereCondition))
    .limit(1) // Optimization: Limit the results to the most recent scan

  // Query for lastEntry
  const lastEntryPromise = db
    .select({
      maxCreatedAt: max(scans.createdAt),
    })
    .from(scans)
    .where(and(eq(scans.sessionId, sessionId), whereCondition, eq(scans.isEntry, true)))
    .limit(1) // Optimization: Limit the results to the most recent entry

  // Execute all queries in parallel
  const [numberOfScansResult, numberOfEntriesResult, lastScanResult, lastEntryResult] =
    await Promise.all([
      numberOfScansPromise,
      numberOfEntriesPromise,
      lastScanPromise,
      lastEntryPromise,
    ])

  // Construct the final result object
  const result = {
    numberOfScans: numberOfScansResult[0]?.count || 0,
    numberOfEntries: numberOfEntriesResult[0]?.count || 0,
    lastScan: lastScanResult[0]?.maxCreatedAt || undefined,
    lastEntry: lastEntryResult[0]?.maxCreatedAt || undefined,
  }

  return result
}

export const registerScan = async ({
  scanId,
  venueId,
  sessionId,
  issuedCardId,
  ticketTailorIssuedTicketId,
  issuedTicketId,
  isEntry,
  scanResult,
  latitude,
  longitude,
}: {
  scanId: string
  venueId: string
  sessionId: string
  issuedCardId: string | undefined
  ticketTailorIssuedTicketId: string | undefined
  issuedTicketId: string | undefined
  isEntry: boolean
  scanResult: string
  latitude: string | undefined
  longitude: string | undefined
}) => {
  const { userId } = await auth()

  if (!userId) {
    return {
      error: {
        id: 'registerScan',
        title: 'Staff User not found',
        description: `StaffUser not found for the given clerkUserId: ${userId ?? ''}. Please contact Jon.`,
      },
      data: undefined,
    }
  }

  if (!issuedCardId && !ticketTailorIssuedTicketId && !issuedTicketId) {
    return
  }

  await db
    .insert(scans)
    .values({
      id: scanId,
      issuedCardId,
      ticketTailorIssuedTicketId,
      issuedTicketId,
      sessionId,
      isEntry,
      staffUserId: userId,
      scanResult,
      latitude,
      longitude,
    })
    .onConflictDoNothing()
}

export const getCurrentScanningSession = cache(
  async (venueId: string, currentTimeOverride: Date | undefined) => {
    const currentTime = currentTimeOverride || new Date()

    const venueData = await db
      .select({ id: venues.id, name: venues.name })
      .from(venues)
      .where(eq(venues.id, venueId))
      .limit(1)

    if (!venueData.length) {
      return {
        data: undefined,
        error: {
          id: 'getCurrentScanningSession',
          title: 'Venue Not Found',
          description: `No venue found for the given venueId: ${venueId}.`,
        },
      }
    }

    const venue = venueData[0]

    // const currentTimeMinus30 = new Date(currentTime.getTime() - 30 * 60000)
    // const currentTimePlus30 = new Date(currentTime.getTime() + 30 * 60000)

    const sessionData = await db
      .select({
        id: sessions.id,
        name: sessions.name,
        venueId: sessions.venueId,
        reentryAllowed: sessions.reentryAllowed,
        fastPassEnabled: sessions.fastPassEnabled,
        maniacCardCutoffTime: sessions.maniacCardCutoffTime,
        maniacVipCardCutoffTime: sessions.maniacVipCardCutoffTime,
        maniacCardFreeEntry: sessions.maniacCardFreeEntry,
        maniacVipCardFreeEntry: sessions.maniacVipCardFreeEntry,
        venueLocationId: venues.locationId,
        venueLocationName: locations.name,
        startTime: sessions.startTime,
        endTime: sessions.endTime,
      })
      .from(sessions)
      .innerJoin(venues, eq(venues.id, sessions.venueId))
      .innerJoin(locations, eq(locations.id, venues.locationId))
      .where(
        and(
          eq(sessions.venueId, venueId),
          and(
            sql<Date>`${sessions.startTime} <= ${currentTime.toISOString()}`,
            sql<Date>`${sessions.endTime} >= ${currentTime.toISOString()}`,
          ),
        ),
      )

    if (sessionData.length === 0) {
      return {
        data: undefined,
        error: {
          id: 'checkSession',
          title: 'No Active Session',
          description: `${venue.name} has no session scheduled at the current time.`,
        },
      }
    }

    if (sessionData.length > 1) {
      return {
        data: undefined,
        error: {
          id: 'checkSession',
          title: 'Multiple Sessions Found',
          description: `Multiple sessions found for ${venue.name} and currentTime: ${currentTime.toISOString()} Call Chris or Jon.`,
        },
      }
    }

    const session = sessionData[0]

    return {
      data: session,
      error: undefined,
    }
  },
)

export const getSession = async ({
  sessionId,
}: {
  sessionId: string
}): Promise<
  | {
    data: TSession
    error: undefined
  }
  | {
    data: undefined
    error: {
      id: string
      title: string
      description: string
    }
  }
> => {
  const sessionData = await db
    .select({
      id: sessions.id,
      name: sessions.name,
      venueId: sessions.venueId,
      venueName: venues.name,
      reentryAllowed: sessions.reentryAllowed,
      fastPassEnabled: sessions.fastPassEnabled,
      maniacCardCutoffTime: sessions.maniacCardCutoffTime,
      maniacVipCardCutoffTime: sessions.maniacVipCardCutoffTime,
      maniacCardFreeEntry: sessions.maniacCardFreeEntry,
      maniacVipCardFreeEntry: sessions.maniacVipCardFreeEntry,
      startTime: sessions.startTime,
      endTime: sessions.endTime,
      venueLocationId: venues.locationId,
      venueLocationName: locations.name,
      timezone: sessions.timezone,
    })
    .from(sessions)
    .innerJoin(venues, eq(venues.id, sessions.venueId))
    .innerJoin(locations, eq(locations.id, venues.locationId))
    .where(eq(sessions.id, sessionId))
    .limit(1)

  if (sessionData.length === 0) {
    return {
      data: undefined,
      error: {
        id: 'getSession',
        title: 'Session Not Found',
        description: `No session found for the given sessionId: ${sessionId}.`,
      },
    }
  }

  const session = sessionData[0]

  return {
    data: session,
    error: undefined,
  }
}

export const checkAllTicketTypes = cache(
  async (
    venueId: string,
    sessionId: string,
    scanId: string,
    issuedCardStripeCheckoutSessionId: string | undefined,
    physicalCardNanoId: string | undefined,
    ticketTailorTicketBarcode: string | undefined,
    issuedTicketId: string | undefined,
    currentTimeOverride: Date | undefined,
  ): Promise<
    | { type: 'ticketTailor'; result: TCheckTicketTailorTicketResult; scans: TCheckScansResult }
    | { type: 'issuedCard'; result: TCheckManiacCardResult; scans: TCheckScansResult }
    | { type: 'issuedTicket'; result: TCheckIssuedTicketResult; scans: TCheckScansResult }
    | undefined
  > => {
    // Check for Issued Card
    if (issuedCardStripeCheckoutSessionId || physicalCardNanoId) {
      const type = 'issuedCard'
      const result = await checkManiacCard({
        sessionId,
        issuedCardStripeCheckoutSessionId,
        physicalCardNanoId,
        currentTimeOverride,
      })
      // Register scan regardless of result
      await registerScan({
        issuedCardId: result.data?.issuedCard?.id,
        scanResult: result.error ? result.error.title : 'Checks Passed',
        isEntry: !result.error,
        sessionId,
        venueId,
        scanId,
        issuedTicketId: undefined,
        ticketTailorIssuedTicketId: undefined,
        latitude: undefined,
        longitude: undefined,
      })

      const scans = await checkScans({
        sessionId: sessionId,
        issuedCardId: result.data?.issuedCard?.id,
      })

      return { type, result, scans }
    } else if (ticketTailorTicketBarcode) {
      // Check for Ticket Tailor Ticket
      const type = 'ticketTailor'
      const result = await checkTicketTailorTicket({
        ticketTailorTicketBarcode,
        sessionId,
        currentTimeOverride,
      })

      // Register scan regardless of result
      await registerScan({
        ticketTailorIssuedTicketId: result.data?.ticketTailorIssuedTicket?.id,
        scanResult: result.error ? result.error.title : 'Checks Passed',
        isEntry: !result.error,
        sessionId,
        venueId,
        scanId,
        issuedCardId: undefined,
        issuedTicketId: undefined,
        latitude: undefined,
        longitude: undefined,
      })

      const scans = await checkScans({
        sessionId: sessionId,
        ticketTailorIssuedTicketId: result.data?.ticketTailorIssuedTicket?.id,
      })

      // Mark ticket as checked in via Ticket Tailor API ONLY if the scan is successful
      // This happens after registering the scan in our system to ensure we don't lose our record
      if (!result.error && result.data?.ticketTailorIssuedTicket?.ticketTailorTicketId) {
        try {
          await markTicketCheckedIn(result.data.ticketTailorIssuedTicket.ticketTailorTicketId)
        } catch (error) {
          console.error('Failed to mark ticket as checked in with Ticket Tailor API:', error)
          // Continue with the process even if the Ticket Tailor API call fails
          // We've already registered the scan in our system
        }
      }

      return { type, result, scans }
    } else if (issuedTicketId) {
      // Check for Issued Ticket
      const type = 'issuedTicket'
      const result = await checkIssuedTicket(issuedTicketId, sessionId)

      // Register scan regardless of result
      await registerScan({
        issuedTicketId: result.data?.issuedTicket?.id,
        scanResult: result.error ? result.error.title : 'Checks Passed',
        isEntry: !result.error,
        sessionId,
        venueId,
        scanId,
        issuedCardId: undefined,
        ticketTailorIssuedTicketId: undefined,
        latitude: undefined,
        longitude: undefined,
      })

      const scans = await checkScans({
        sessionId: sessionId,
        issuedTicketId: result.data?.issuedTicket?.id,
      })

      return { type, result, scans }
    }
    return undefined
  },
)
