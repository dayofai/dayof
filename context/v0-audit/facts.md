Observed Facts (v1 code)

- session.id — string
- session.name — string
- session.venueId — string
- session.venueName — string
- session.venueLocationId — string
- session.venueLocationName — string
- session.startTime — ISO datetime
- session.endTime — ISO datetime | null
- session.timezone — IANA TZ
- session.reentryAllowed — boolean
- session.fastPassEnabled — boolean
- session.maniacCardFreeEntry — boolean
- session.maniacVipCardFreeEntry — boolean
- session.maniacCardCutoffTime — ISO datetime | null
- session.maniacVipCardCutoffTime — ISO datetime | null

- card.id — string
- card.tierId — string
- card.tierName — string
- card.locationId — string
- card.locationName — string
- card.weekId — string
- card.weekName — string
- card.startDate — ISO date
- card.endDate — ISO date
- card.endDateExtended4am — ISO datetime (derived)

- issuedCard.id — string
- issuedCard.fastPass — boolean
- issuedCard.fastPassPlus — boolean
- issuedCard.godMode — boolean
- issuedCard.clerkUserId — string
- issuedCard.issuedCardStatusId — string
- issuedCard.issuedCardStatus — string

- ticketTailorIssuedTicket.id — string
- ticketTailorIssuedTicket.ticketStatusId — string
- ticketTailorIssuedTicket.ticketStatusTitle — string
- ticketTailorIssuedTicket.sessionId — string
- ticketTailorIssuedTicket.sessionName — string
- ticketTailorIssuedTicket.sessionVenueName — string

- issuedTicket.id — string
- issuedTicket.ticketStatusId — string
- issuedTicket.ticketStatus — string
- issuedTicket.sessionId — string
- issuedTicket.sessionName — string

- scans.numberOfEntries — number
- scans.numberOfScans — number
- scans.lastScan — ISO datetime | undefined
- scans.lastEntry — ISO datetime | undefined

- staff.userId — string | undefined

- webhook.checkoutSession.id — string
- webhook.checkoutSession.metadata.payment_method — string
- webhook.connectedAccountId — string
- webhook.subscription.id — string
- webhook.subscription.customer — string
- webhook.cutoffDate — ISO datetime (config)

Derived Facts
- now — current datetime
- dateWindowOverlaps(cardWindow, sessionWindow) — boolean

Additional domains (used in rules; added for completeness)

- physicalCard.id — string
- physicalCard.weekId — string | undefined
- physicalCard.weekName — string | undefined
- physicalCard.locationId — string | undefined
- physicalCard.locationName — string | undefined
- physicalCard.cardTierId — string
- physicalCard.cardTierName — string

- currentSession.id — string
- currentSession.name — string
- currentSession.reentryAllowed — boolean
- currentSession.startTime — ISO datetime
- currentSession.endTime — ISO datetime | null

- linkedCards.physicalCardId — string
- linkedCards.issuedCardId — string
- linkedCards.unique — boolean (conceptual uniqueness enforced by DB uniqueness)



