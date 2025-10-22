import { atom } from "jotai";
import type { CartItem } from "@/lib/schemas/cart";

/**
 * Optional callback for cart changes (analytics, URL updates, etc.)
 *
 * Parent can register a callback without prop drilling.
 * Called automatically when cart is modified.
 */
export const onCartChangeCallbackAtom = atom<
	((cart: CartItem[]) => void) | null
>(null);

/**
 * Optional callback for checkout action
 *
 * Parent can register a checkout handler without prop drilling.
 */
export const onCheckoutCallbackAtom = atom<
	((cart: CartItem[], pricing: unknown) => void) | null
>(null);
