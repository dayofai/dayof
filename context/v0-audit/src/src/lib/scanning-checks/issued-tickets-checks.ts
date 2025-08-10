import { issuedTicketStatus, issuedTickets, locations, sessions, users, venues } from '@/schema'
import { InferSelectModel, eq } from 'drizzle-orm'
import { cache } from 'react'
import { db } from '../db'
import { checkScans, getSession } from './door-scanning-checks'

export type TIssuedTicket = Pick<
  InferSelectModel<typeof issuedTickets>,
  'id' | 'fastPassEnabled' | 'ticketStatusId'
> & {
  sessionId: InferSelectModel<typeof sessions>['id']
  sessionName: InferSelectModel<typeof sessions>['name']
  sessionVenueId: InferSelectModel<typeof sessions>['venueId']
  ticketStatus: InferSelectModel<typeof issuedTicketStatus>['status']
  fullName: InferSelectModel<typeof users>['fullName']
}

export type TCheckIssuedTicketResult = Awaited<ReturnType<typeof checkIssuedTicket>>

export const checkIssuedTicket = cache(
  async (
    issuedTicketId: string,
    sessionId: string,
  ): Promise<
    | {
        data?: {
          issuedTicket?: TIssuedTicket
        }
        error: {
          id: string
          title: string
          description: string
        }
      }
    | {
        data: {
          issuedTicket: TIssuedTicket
        }
        error: undefined
      }
  > => {
    const issuedTicketData = await db
      .select({
        id: issuedTickets.id,
        fastPassEnabled: issuedTickets.fastPassEnabled,
        ticketStatusId: issuedTickets.ticketStatusId,
        ticketStatus: issuedTicketStatus.status,
        sessionId: issuedTickets.sessionId,
        sessionName: sessions.name,
        sessionVenueId: sessions.venueId,
        fullName: users.fullName,
      })
      .from(issuedTickets)
      .innerJoin(users, eq(issuedTickets.clerkUserId, users.id))
      .innerJoin(sessions, eq(issuedTickets.sessionId, sessions.id))
      .innerJoin(venues, eq(sessions.venueId, venues.id))
      .innerJoin(locations, eq(venues.locationId, locations.id))
      .innerJoin(issuedTicketStatus, eq(issuedTickets.ticketStatusId, issuedTicketStatus.id))
      .where(eq(issuedTickets.id, issuedTicketId))
      .limit(1)

    if (!issuedTicketData.length) {
      return {
        data: undefined,
        error: {
          id: 'checkIssuedTicket',
          title: 'Issued Ticket Not Found',
          description: `Issued Ticket not found for the given issuedTicketId: ${issuedTicketId}.`,
        },
      }
    }

    const issuedTicket = issuedTicketData[0]

    if (issuedTicket.ticketStatusId !== 'Ban0a0nbQAbY') {
      return {
        data: {
          issuedTicket,
        },
        error: {
          id: 'checkIssuedTicket',
          title: 'Issued Ticket Not Valid',
          description: `Issued Ticket is ${issuedTicket.ticketStatus}.`,
        },
      }
    }

    const sessionData = await db
      .select({
        id: sessions.id,
        name: sessions.name,
        venueId: sessions.venueId,
        reentryAllowed: sessions.reentryAllowed,
        fastPassEnabled: sessions.fastPassEnabled,
        maniacCardFreeEntry: sessions.maniacCardFreeEntry,
        maniacVipCardFreeEntry: sessions.maniacVipCardFreeEntry,
        maniacVipCardCutoffTime: sessions.maniacVipCardCutoffTime,
        maniacCardCutoffTime: sessions.maniacCardCutoffTime,
        startTime: sessions.startTime,
        endTime: sessions.endTime,
        venueLocationId: venues.locationId,
        venueLocationName: locations.name,
        venueName: venues.name,
      })
      .from(sessions)
      .innerJoin(venues, eq(sessions.venueId, venues.id))
      .innerJoin(locations, eq(venues.locationId, locations.id))
      .where(eq(sessions.id, issuedTicket.sessionId))
      .limit(1)

    if (!sessionData.length) {
      return {
        data: undefined,
        error: {
          id: 'checkTicketTailorTicket',
          title: 'Session Not Found',
          description: `No session found for the given sessionId: ${issuedTicket.sessionId}.`,
        },
      }
    }

    const session = sessionData[0]

    const currentSessionData = await getSession({ sessionId })

    if (currentSessionData.error) {
      return {
        data: {
          issuedTicket,
        },
        error: currentSessionData.error,
      }
    }

    const currentSession = currentSessionData.data

    if (session.id !== currentSession.id) {
      return {
        data: {
          issuedTicket,
        },
        error: {
          id: 'checkTicketTailorTicket',
          title: 'Session Mismatch',
          description: `Ticket is only valid for ${session.name} at ${session.venueName} in ${session.venueLocationName} on ${new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long' }).format(new Date(session.startTime))}.`,
        },
      }
    }

    const scans = await checkScans({
      sessionId: issuedTicket.sessionId,
      issuedTicketId: issuedTicket.id,
    })

    if (!session.reentryAllowed && scans.numberOfEntries > 0) {
      return {
        data: {
          issuedTicket,
        },
        error: {
          id: 'checkTicketTailorTicket',
          title: 'NOT VALID',
          description: `No reentry allowed for ${session.name}. Already redeemed.`,
        },
      }
    }

    return {
      data: {
        issuedTicket,
      },
      error: undefined,
    }
  },
)
