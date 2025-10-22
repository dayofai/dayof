import { atom } from "jotai";
import { queryClientAtom } from "jotai-tanstack-query";
import { ticketsQuery } from "@/lib/queries/tickets";
import type { Ticket } from "@/lib/schemas/tickets";

/**
 * Bridge TanStack Query → Jotai
 *
 * This atom fetches tickets using TanStack Query under the hood
 * Easy to swap to TanStack DB collection later
 */
export const ticketsAtom = atom((get) => {
	const qc = get(queryClientAtom);
	// TODO: get eventId from route; playground uses evt_123
	const data = qc.getQueryData<Ticket[]>(["tickets", "evt_123"]);
	return data ?? [];
});
