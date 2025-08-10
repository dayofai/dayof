import {
  issuedTicketStatus,
  sessions,
  ticketTailorEventSessions,
  ticketTailorIssuedTickets,
  venues,
} from '@/schema'
import { InferSelectModel, and, eq } from 'drizzle-orm'
import { cache } from 'react'
import { db } from '../db'
import { checkScans, getSession } from './door-scanning-checks'

export type TTicketTailorIssuedTicket = Pick<
  InferSelectModel<typeof ticketTailorIssuedTickets>,
  'id' | 'ticketTailorOrderName' | 'ticketStatusId' | 'ticketTailorTicketId' | 'ticketTailorBarcode' | 'ticketTailorDescription'
> & {
  ticketStatus: InferSelectModel<typeof issuedTicketStatus>['status']
  ticketStatusTitle: InferSelectModel<typeof issuedTicketStatus>['title']
  sessionName: InferSelectModel<typeof sessions>['name']
  sessionStartTime: InferSelectModel<typeof sessions>['startTime']
  sessionVenueName: InferSelectModel<typeof venues>['name']
}

export type TCheckTicketTailorTicketResult = Awaited<ReturnType<typeof checkTicketTailorTicket>>

// Return data where possible!

export const checkTicketTailorTicket = cache(
  async ({
    currentTimeOverride,
    ticketTailorTicketBarcode,
    sessionId,
  }: {
    currentTimeOverride: Date | undefined
    ticketTailorTicketBarcode: string
    sessionId: string
  }): Promise<
    | {
        data?: {
          ticketTailorIssuedTicket?: TTicketTailorIssuedTicket
        }
        error: {
          id: string
          title: string
          description: string
        }
      }
    | {
        data: {
          ticketTailorIssuedTicket: TTicketTailorIssuedTicket
        }
        error: undefined
      }
  > => {
    const currentTime = currentTimeOverride || new Date()

    const ticketTailorIssuedTicketIdData = await db
      .select({
        id: ticketTailorIssuedTickets.id,
      })
      .from(ticketTailorIssuedTickets)
      .where(eq(ticketTailorIssuedTickets.ticketTailorBarcode, ticketTailorTicketBarcode))
      .limit(1)

    if (!ticketTailorIssuedTicketIdData.length) {
      return {
        data: undefined,
        error: {
          id: 'checkTicketTailorTicket',
          title: 'TT Ticket Not Found',
          description: `Ticket Tailor ticket not found for the given ticket: ${ticketTailorTicketBarcode}.`,
        },
      }
    }

    const ticketTailorIssuedTicketId = ticketTailorIssuedTicketIdData[0].id

    const ticketTailorIssuedTicketData = await db
      .select({
        id: ticketTailorIssuedTickets.id,
        ticketTailorTicketId: ticketTailorIssuedTickets.ticketTailorTicketId,
        ticketTailorOrderName: ticketTailorIssuedTickets.ticketTailorOrderName,
        ticketTailorBarcode: ticketTailorIssuedTickets.ticketTailorBarcode,
        ticketTailorDescription: ticketTailorIssuedTickets.ticketTailorDescription,
        ticketStatusId: ticketTailorIssuedTickets.ticketStatusId,
        sessionId: ticketTailorEventSessions.sessionId,
        ticketStatus: issuedTicketStatus.status,
        ticketStatusTitle: issuedTicketStatus.title,
        sessionName: sessions.name,
        sessionStartTime: sessions.startTime,
        sessionVenueName: venues.name,
      })
      .from(ticketTailorIssuedTickets)
      .innerJoin(
        ticketTailorEventSessions,
        eq(
          ticketTailorEventSessions.ticketTailorEventId,
          ticketTailorIssuedTickets.ticketTailorEventId,
        ),
      )
      .innerJoin(sessions, eq(sessions.id, ticketTailorEventSessions.sessionId))
      .innerJoin(venues, eq(venues.id, sessions.venueId))
      .innerJoin(
        issuedTicketStatus,
        eq(ticketTailorIssuedTickets.ticketStatusId, issuedTicketStatus.id),
      )
      .where(
        and(
          eq(ticketTailorIssuedTickets.ticketTailorBarcode, ticketTailorTicketBarcode),
          eq(ticketTailorEventSessions.sessionId, sessionId),
        ),
      )
      .limit(1)

    if (!ticketTailorIssuedTicketData.length) {
      return {
        data: undefined,
        error: {
          id: 'checkTicketTailorTicket',
          title: 'Session Not Found',
          description: `No session found for the given Ticket Tailor ticket: ${ticketTailorTicketBarcode}.`,
        },
      }
    }

    const ticketTailorIssuedTicket = ticketTailorIssuedTicketData[0]

    // throw new Error('Not implemented')

    if (ticketTailorIssuedTicket.ticketStatusId !== 'Ban0a0nbQAbY') {
      return {
        data: {
          ticketTailorIssuedTicket,
        },
        error: {
          id: 'checkTicketTailorTicket',
          title: 'TT Ticket Not Active',
          description: `Ticket Tailor ticket is ${ticketTailorIssuedTicket.ticketStatusTitle}.`,
        },
      }
    }

    const currentSessionData = await getSession({ sessionId })

    if (currentSessionData.error) {
      return {
        data: {
          ticketTailorIssuedTicket,
        },
        error: currentSessionData.error,
      }
    }

    const currentSession = currentSessionData.data

    if (ticketTailorIssuedTicket.sessionId !== currentSession.id) {
      return {
        data: {
          ticketTailorIssuedTicket,
        },
        error: {
          id: 'checkTicketTailorTicket',
          title: 'Session Mismatch',
          description: `The Ticket Tailor ticket is only valid for ${ticketTailorIssuedTicket.sessionName} at ${ticketTailorIssuedTicket.sessionVenueName}, starting at ${new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long' }).format(new Date(ticketTailorIssuedTicket.sessionStartTime))}.`,
        },
      }
    }

    const scans = await checkScans({
      sessionId: ticketTailorIssuedTicket.sessionId,
      ticketTailorIssuedTicketId: ticketTailorIssuedTicket.id,
    })

    if (!currentSession.reentryAllowed && scans.numberOfEntries > 0) {
      return {
        data: {
          ticketTailorIssuedTicket,
        },
        error: {
          id: 'checkTicketTailorTicket',
          title: 'NOT VALID',
          description: `No reentry allowed for ${currentSession.name}. Already redeemed.`,
        },
      }
    }

    return {
      data: {
        ticketTailorIssuedTicket,
      },
      error: undefined,
    }
  },
)
