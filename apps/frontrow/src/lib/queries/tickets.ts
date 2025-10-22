import { queryOptions } from "@tanstack/react-query";
import type { Ticket } from "@/lib/schemas/tickets";

export const ticketsQuery = (eventId: string) =>
	queryOptions({
		queryKey: ["tickets", eventId],
		queryFn: async (): Promise<Ticket[]> => {
			// Replace with real fetch when API is ready
			const { mockTickets } = await import("@/lib/mock-data");
			return mockTickets;
		},
		staleTime: 60_000,
	});
