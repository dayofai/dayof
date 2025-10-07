import {
  createCollection,
  localOnlyCollectionOptions,
} from '@tanstack/react-db';
import { ticketSchema } from '@/lib/schemas/tickets';
import { mockTickets } from '../mock-data';

export const ticketsCollection = createCollection(
  localOnlyCollectionOptions({
    id: 'mock-tickets-collection',
    getKey: (ticket) => ticket.id,
    schema: ticketSchema,
    initialData: mockTickets.map((t) => ({
      ...t,
      badges: t.badges ? [...t.badges] : undefined,
    })),
  })
);
