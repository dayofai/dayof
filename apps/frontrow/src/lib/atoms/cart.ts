import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { CartItem } from "@/lib/schemas/cart";
import { onCartChangeCallbackAtom } from "./cart-callbacks";

/**
 * Base cart state (localStorage-backed)
 *
 * Cross-tab sync: Jotai's atomWithStorage syncs across tabs automatically
 * SSR-safe: Only hydrates on client (window check built-in)
 */
export const cartAtom = atomWithStorage<CartItem[]>(
	"frontrow:ticket-cart:v1",
	[],
);

/**
 * Cart aggregates (read-only derived atom)
 * Auto-updates when cartAtom changes
 */
export const cartSummaryAtom = atom((get) => {
	const cart = get(cartAtom);
	// Safety: cart might be null/undefined during SSR or initial hydration
	const cartArray = Array.isArray(cart) ? cart : [];
	const totalQty = cartArray.reduce((sum, item) => sum + item.qty, 0);

	return {
		totalQty,
		hasItems: cartArray.length > 0,
		itemCount: cartArray.length,
	};
});

/**
 * Increment ticket quantity (write-only derived atom)
 *
 * IDIOMATIC JOTAI: Encapsulates mutation logic in a derived atom.
 * This is more composable and type-safe than helper functions.
 */
export const incrementTicketAtom = atom(
	null, // write-only (no read function)
	(get, set, ticketId: string) => {
		const cart = get(cartAtom);
		const cartArray = Array.isArray(cart) ? cart : [];
		const existing = cartArray.find((item) => item.ticketId === ticketId);

		if (existing) {
			set(
				cartAtom,
				cartArray.map((item) =>
					item.ticketId === ticketId ? { ...item, qty: item.qty + 1 } : item,
				),
			);
		} else {
			set(cartAtom, [...cartArray, { ticketId, qty: 1 }]);
		}

		// Trigger callback if registered
		const callback = get(onCartChangeCallbackAtom);
		const updatedCart = get(cartAtom);
		if (Array.isArray(updatedCart)) {
			callback?.(updatedCart);
		}
	},
);

/**
 * Decrement ticket quantity (write-only derived atom)
 */
export const decrementTicketAtom = atom(null, (get, set, ticketId: string) => {
	const cart = get(cartAtom);
	const cartArray = Array.isArray(cart) ? cart : [];
	const existing = cartArray.find((item) => item.ticketId === ticketId);

	if (!existing) return;

	if (existing.qty === 1) {
		set(
			cartAtom,
			cartArray.filter((item) => item.ticketId !== ticketId),
		);
	} else {
		set(
			cartAtom,
			cartArray.map((item) =>
				item.ticketId === ticketId ? { ...item, qty: item.qty - 1 } : item,
			),
		);
	}

	// Trigger callback if registered
	const callback = get(onCartChangeCallbackAtom);
	const updatedCart = get(cartAtom);
	if (Array.isArray(updatedCart)) {
		callback?.(updatedCart);
	}
});

/**
 * Clear entire cart (write-only derived atom)
 */
export const clearCartAtom = atom(null, (_get, set) => {
	set(cartAtom, []);
});
