import type { Atom } from 'jotai';
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { computeItemUI } from '../lib/computeItemUI';
import type { PanelItem, ProductId } from '../schemas';

/**
 * Create derived item atoms
 *
 * Uses atomFamily for stable references (prevents memory leaks).
 * Each productId gets one cached atom instance.
 */
export function createDerivedItemAtoms(
  queryAtom: Atom<{ data?: { items: PanelItem[] } }>
) {
  /**
   * Lookup item by productId
   * Returns null if item not found (unlocked items, dynamic inventory)
   */
  const itemByIdFamily = atomFamily((productId: ProductId) => {
    return atom((get) => {
      const panel = get(queryAtom);
      return (
        panel.data?.items.find((i: PanelItem) => i.product.id === productId) ??
        null
      );
    });
  });

  /**
   * Derived UI state per item
   * Runs computeItemUI on each item, memoized by productId
   */
  const itemUIFamily = atomFamily((productId: ProductId) => {
    return atom((get) => {
      const item = get(itemByIdFamily(productId));
      if (!item) {
        return null;
      }
      return computeItemUI(item);
    });
  });

  /**
   * All items with UI state (for rendering lists)
   * Re-derives when panel data changes
   */
  const allItemsUIAtom = atom((get) => {
    const panel = get(queryAtom);
    if (!panel.data) {
      return [];
    }

    return panel.data.items.map((item: PanelItem) => ({
      productId: item.product.id,
      ui: computeItemUI(item),
      item, 
    }));
  });

  return {
    itemByIdFamily,
    itemUIFamily,
    allItemsUIAtom,
  };
}
