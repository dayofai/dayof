import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { calculateCartTotal } from "@/lib/mock-data";
import { cartAtom } from "./cart";

/**
 * Pricing query atom (replaces useQuery in component)
 *
 * Automatically refetches when cart changes
 */
export const pricingQueryAtom = atomWithQuery((get) => {
	const cart = get(cartAtom);
	// Safety: cart might be null/undefined during SSR or initial hydration
	const cartArray = Array.isArray(cart) ? cart : [];

	const keyPart = cartArray
		.map((i) => `${i.ticketId}:${i.qty}`)
		.sort()
		.join("|");

	return {
		queryKey: ["cart-pricing", keyPart],
		queryFn: () =>
			calculateCartTotal({
				eventId: "evt_123", // TODO: get from route
				items: cartArray.map((i) => ({
					ticketId: i.ticketId,
					qty: i.qty,
				})),
			}),
		enabled: cartArray.length > 0,
		staleTime: 0,
	};
});

/**
 * Unwrap pricing data
 */
export const pricingAtom = atom((get) => {
	const query = get(pricingQueryAtom);
	return query.data;
});

/**
 * Pricing loading state
 */
export const pricingLoadingAtom = atom((get) => {
	const query = get(pricingQueryAtom);
	return query.isPending;
});

/**
 * Pricing error state
 */
export const pricingErrorAtom = atom((get) => {
	const query = get(pricingQueryAtom);
	return query.error;
});

/**
 * Retry pricing calculation (write-only atom)
 */
export const retryPricingAtom = atom(null, (get, _set) => {
	const query = get(pricingQueryAtom);
	query.refetch?.();
});
