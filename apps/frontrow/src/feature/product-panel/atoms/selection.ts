import type { Atom, WritableAtom } from 'jotai';
import { atom } from 'jotai';
import { atomFamily, atomWithStorage, createJSONStorage } from 'jotai/utils';
import type { PanelItem, ProductId } from '../schemas';

/**
 * Cart storage version for future migrations
 */
const CART_STORAGE_VERSION = 'v1';

/**
 * Cart item shape (localStorage persisted)
 */
export interface CartItem {
  productId: ProductId;
  quantity: number;
}

/**
 * Selection atoms return type
 */
export interface SelectionAtoms {
  cartStorageAtom: WritableAtom<CartItem[], [CartItem[]], void>;
  selectionMapAtom: Atom<Map<ProductId, number>>;
  selectionFamily: (
    productId: ProductId
  ) => WritableAtom<number, [number], void>;
  incrementFamily: (productId: ProductId) => WritableAtom<null, [], void>;
  decrementFamily: (productId: ProductId) => WritableAtom<null, [], void>;
  clearCartAtom: WritableAtom<null, [], void>;
  cartSummaryAtom: Atom<{
    totalQuantity: number;
    itemCount: number;
    hasItems: boolean;
  }>;
}

/**
 * Create selection atoms with per-event localStorage
 */
export function createSelectionAtoms(
  eventId: string,
  itemByIdFamily: (productId: ProductId) => Atom<PanelItem | null>
): SelectionAtoms {
  // Storage key per event (isolation) with versioning for future migrations
  const storageKey = `frontrow:pp:cart:${CART_STORAGE_VERSION}:${eventId}`;

  /**
   * Persisted cart array in localStorage
   * getOnInit: true reduces hydration flicker
   */
  const cartStorageAtom = atomWithStorage<CartItem[]>(
    storageKey,
    [],
    createJSONStorage(() => localStorage),
    { getOnInit: true }
  );

  /**
   * Derived map for O(1) lookups: productId → quantity
   */
  const selectionMapAtom = atom((get): Map<ProductId, number> => {
    const cart = get(cartStorageAtom);
    return new Map<ProductId, number>(
      cart.map((item) => [item.productId, item.quantity])
    );
  });

  /**
   * Per-product selection with clamping
   *
   * Read: current quantity clamped to [0, maxSelectable]
   * Write: updates cart, sanitizes and enforces bounds
   */
  const selectionFamily = atomFamily((productId: ProductId) => {
    return atom(
      // Read: get current quantity from cart with clamping
      (get): number => {
        const stored = get(selectionMapAtom).get(productId) ?? 0;
        const panelItem = get(itemByIdFamily(productId));
        const max = panelItem?.commercial.maxSelectable ?? 0;
        const clamped = Math.max(0, Math.min(stored, max));
        return Number.isFinite(clamped) ? Math.floor(clamped) : 0;
      },
      // Write: update cart with sanitization and clamping
      (get, set, requested: number) => {
        const panelItem = get(itemByIdFamily(productId));
        const max = panelItem?.commercial.maxSelectable ?? 0;

        const normalized = Number.isFinite(requested)
          ? Math.floor(requested)
          : 0;
        const clamped = Math.max(0, Math.min(normalized, max));

        set(cartStorageAtom, (prev) => {
          if (clamped === 0) {
            return prev.filter((cartItem) => cartItem.productId !== productId);
          }

          const existingIndex = prev.findIndex(
            (cartItem) => cartItem.productId === productId
          );

          if (existingIndex >= 0) {
            // Update existing (immutable)
            const updated = prev.slice();
            updated[existingIndex] = { productId, quantity: clamped };
            return updated;
          }
          return [...prev, { productId, quantity: clamped }];
        });
      }
    );
  });

  /**
   * Increment helper (convenience)
   */
  const incrementFamily = atomFamily((productId: ProductId) => {
    return atom(null, (get, set) => {
      const current = get(selectionFamily(productId));
      set(selectionFamily(productId), current + 1);
    });
  });

  /**
   * Decrement helper (convenience)
   */
  const decrementFamily = atomFamily((productId: ProductId) => {
    return atom(null, (get, set) => {
      const current = get(selectionFamily(productId));
      set(selectionFamily(productId), Math.max(0, current - 1));
    });
  });

  /**
   * Clear all selections
   */
  const clearCartAtom = atom(null, (_get, set) => {
    set(cartStorageAtom, []);
  });

  /**
   * Cart summary (total quantity, item count)
   */
  const cartSummaryAtom = atom((get) => {
    const cart = get(cartStorageAtom);

    return {
      totalQuantity: cart.reduce((sum, item) => sum + item.quantity, 0),
      itemCount: cart.length,
      hasItems: cart.length > 0,
    };
  });

  return {
    cartStorageAtom,
    selectionMapAtom,
    selectionFamily,
    incrementFamily,
    decrementFamily,
    clearCartAtom,
    cartSummaryAtom,
  };
}
