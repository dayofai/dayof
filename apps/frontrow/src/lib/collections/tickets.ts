import {
  createCollection,
  localOnlyCollectionOptions,
} from '@tanstack/react-db';
import { ticketSchema } from '@/lib/schemas/tickets';

export const ticketsCollection = createCollection(
  localOnlyCollectionOptions({
    id: 'tickets-collection',
    getKey: (ticket) => ticket.id,
    schema: ticketSchema,
    initialData: [],
  })
);
