import { atom } from "jotai";
import {
	computeTicketUI,
	type TicketUIState,
} from "../../features/ticket-panel/lib/computeTicketUI";
import { cartAtom } from "./cart";
import { ticketFiltersAtom } from "./ticket-filters";
import { ticketsAtom } from "./tickets";

/**
 * Event configuration atom
 *
 * Store event config needed for ticket UI computation and display.
 * This avoids the need for useMemo in components and eliminates prop drilling.
 */
export const eventConfigAtom = atom<{
	mixedTicketTypesAllowed: boolean;
	timeZone: string;
	currency: string;
	locale?: string;
	ui?: {
		showHeader?: boolean;
		ctaLabel?: string;
		ctaVariant?: "neutral" | "accented";
		footnote?: string;
		showPricingBreakdown?: boolean;
		featuredBadgeVariant?: "css" | "none";
		showInfoOnHoverOnly?: boolean;
		density?: "compact" | "comfortable";
	};
} | null>(null);

/**
 * Derived ticket UI states
 *
 * IDIOMATIC JOTAI: Pure derived atom that automatically recomputes
 * when tickets, cart, filters, or event config change.
 *
 * This replaces the TanStack DB .fn.select() query.
 */
export const ticketUIStatesAtom = atom((get) => {
	const eventConfig = get(eventConfigAtom);

	// Return empty array if event config not yet set
	if (!eventConfig) return [];

	const tickets = get(ticketsAtom);
	const cart = get(cartAtom);
	const filters = get(ticketFiltersAtom);

	// 1. Apply filters
	const filtered = tickets
		.filter((t) => t.visibility !== "hidden")
		.filter((t) => filters.showSoldOut || t.status !== "sold_out")
		.filter((t) => filters.showScheduled || t.status !== "scheduled")
		.filter(
			(t) => !filters.categoryFilter || t.category === filters.categoryFilter,
		)
		.filter(
			(t) =>
				!filters.priceRange.min ||
				t.pricing.ticket.amount >= filters.priceRange.min,
		)
		.filter(
			(t) =>
				!filters.priceRange.max ||
				t.pricing.ticket.amount <= filters.priceRange.max,
		)
		.filter(
			(t) =>
				!filters.searchQuery ||
				t.name.toLowerCase().includes(filters.searchQuery.toLowerCase()),
		);

	// 2. Join with cart and compute UI states
	// Safety: cart might be null/undefined during SSR or initial hydration
	const cartArray = Array.isArray(cart) ? cart : [];
	const cartMap = new Map(cartArray.map((item) => [item.ticketId, item.qty]));
	const hasCartItems = cartArray.length > 0;

	const rows = filtered.map((ticket) => ({
		ticket,
		qty: cartMap.get(ticket.id) ?? 0,
	}));

	return computeTicketUI(rows, eventConfig, { hasItems: hasCartItems });
});

/**
 * Checkout validation (derived atom)
 *
 * Checks if any ticket violates minPerOrder constraint
 */
export const checkoutDisabledAtom = atom((get) => {
	const uiStates = get(ticketUIStatesAtom);
	return uiStates.some(
		(state: TicketUIState) =>
			state.currentQty > 0 &&
			state.ticket.limits?.minPerOrder &&
			state.currentQty < state.ticket.limits.minPerOrder,
	);
});
