import { atom } from "jotai";
import type { TicketFilters } from "@/lib/schemas/ticket-filters";

/**
 * Ephemeral filter state (resets on page reload)
 * For persistent filters, use atomWithStorage instead
 */
export const ticketFiltersAtom = atom<TicketFilters>({
	id: "main",
	showSoldOut: false,
	showScheduled: false,
	categoryFilter: null,
	priceRange: { min: null, max: null },
	searchQuery: "",
	sortBy: "sortOrder",
	sortDirection: "asc",
	page: 1,
	pageSize: 50,
});

/**
 * Update filter state (write-only derived atom)
 */
export const updateFiltersAtom = atom(
	null,
	(get, set, updates: Partial<TicketFilters>) => {
		set(ticketFiltersAtom, (prev) => ({
			...prev,
			...updates,
		}));
	},
);

/**
 * Reset filters to defaults (write-only derived atom)
 */
export const resetFiltersAtom = atom(null, (_get, set) => {
	set(ticketFiltersAtom, {
		id: "main",
		showSoldOut: false,
		showScheduled: false,
		categoryFilter: null,
		priceRange: { min: null, max: null },
		searchQuery: "",
		sortBy: "sortOrder",
		sortDirection: "asc",
		page: 1,
		pageSize: 50,
	});
});
