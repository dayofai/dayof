// __tests__/atoms/selection.test.ts

import { atom, createStore } from 'jotai';
import { beforeEach, describe, expect, test } from 'vitest';
import { createSelectionAtoms } from '../../atoms/selection';
import type { PanelItem } from '../../schemas';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

global.localStorage = localStorageMock as Storage;

describe('Selection Atoms', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    localStorage.clear();
  });

  test('selectionFamily clamps to maxSelectable', () => {
    // Mock itemByIdFamily
    const mockItemByIdFamily = (productId: string) =>
      atom(
        () =>
          ({
            product: { id: productId },
            commercial: { maxSelectable: 5 },
          }) as PanelItem
      );

    const atoms = createSelectionAtoms('evt_123', mockItemByIdFamily);

    // Try to set quantity to 10 (over max of 5)
    store.set(atoms.selectionFamily('prod_1'), 10);

    // Should clamp to 5
    const qty = store.get(atoms.selectionFamily('prod_1'));
    expect(qty).toBe(5);
  });

  test('zero quantity removes item from cart', () => {
    const mockItemByIdFamily = (productId: string) =>
      atom(
        () =>
          ({
            product: { id: productId },
            commercial: { maxSelectable: 10 },
          }) as PanelItem
      );

    const atoms = createSelectionAtoms('evt_123', mockItemByIdFamily);

    // Add item
    store.set(atoms.selectionFamily('prod_1'), 3);
    expect(store.get(atoms.cartSummaryAtom).itemCount).toBe(1);

    // Set to zero
    store.set(atoms.selectionFamily('prod_1'), 0);

    // Should be removed
    expect(store.get(atoms.cartSummaryAtom).itemCount).toBe(0);
  });

  test('increment/decrement helpers work', () => {
    const mockItemByIdFamily = (productId: string) =>
      atom(
        () =>
          ({
            product: { id: productId },
            commercial: { maxSelectable: 10 },
          }) as PanelItem
      );

    const atoms = createSelectionAtoms('evt_123', mockItemByIdFamily);

    // Increment from 0
    store.set(atoms.incrementFamily('prod_1'));
    expect(store.get(atoms.selectionFamily('prod_1'))).toBe(1);

    // Increment again
    store.set(atoms.incrementFamily('prod_1'));
    expect(store.get(atoms.selectionFamily('prod_1'))).toBe(2);

    // Decrement
    store.set(atoms.decrementFamily('prod_1'));
    expect(store.get(atoms.selectionFamily('prod_1'))).toBe(1);
  });

  test('cartSummaryAtom calculates totals correctly', () => {
    const mockItemByIdFamily = (productId: string) =>
      atom(
        () =>
          ({
            product: { id: productId },
            commercial: { maxSelectable: 10 },
          }) as PanelItem
      );

    const atoms = createSelectionAtoms('evt_123', mockItemByIdFamily);

    store.set(atoms.selectionFamily('prod_1'), 3);
    store.set(atoms.selectionFamily('prod_2'), 5);

    const summary = store.get(atoms.cartSummaryAtom);
    expect(summary.totalQuantity).toBe(8);
    expect(summary.itemCount).toBe(2);
    expect(summary.hasItems).toBe(true);
  });

  test('per-event isolation works', () => {
    const mockItemByIdFamily = (productId: string) =>
      atom(
        () =>
          ({
            product: { id: productId },
            commercial: { maxSelectable: 10 },
          }) as PanelItem
      );

    const atoms1 = createSelectionAtoms('evt_123', mockItemByIdFamily);
    const atoms2 = createSelectionAtoms('evt_456', mockItemByIdFamily);

    // Set qty in event 1
    store.set(atoms1.selectionFamily('prod_1'), 3);

    // Event 2 should be empty
    expect(store.get(atoms2.selectionFamily('prod_1'))).toBe(0);
    expect(store.get(atoms2.cartSummaryAtom).itemCount).toBe(0);
  });
});
