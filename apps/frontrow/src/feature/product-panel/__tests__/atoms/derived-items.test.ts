// __tests__/atoms/derived-items.test.ts

import { atom, createStore } from 'jotai';
import { beforeEach, describe, expect, test } from 'vitest';
import { createDerivedItemAtoms } from '../../atoms/derived-items';
import {
  DineroSnapshotSchema,
  MachineCodeSchema,
  type PanelItem,
} from '../../schemas';

describe('Derived Item Atoms', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  // Helper to create a minimal valid PanelItem
  function createMockItem(
    productId: string,
    overrides?: Partial<PanelItem>
  ): PanelItem {
    return {
      product: {
        id: productId,
        name: 'Test Product',
        type: 'ticket',
      },
      state: {
        temporal: {
          phase: 'during',
          reasons: [],
        },
        supply: {
          status: 'available',
          reasons: [],
        },
        gating: {
          required: false,
          satisfied: true,
          listingPolicy: 'visible_locked',
          reasons: [],
        },
        demand: {
          kind: 'none',
          reasons: [],
        },
        messages: [],
      },
      commercial: {
        price: DineroSnapshotSchema.parse({
          amount: 5000,
          currency: { code: 'USD', base: 10, exponent: 2 },
          scale: 2,
        }),
        feesIncluded: false,
        maxSelectable: 10,
      },
      display: {
        badges: [],
        showLowRemaining: false,
      },
      ...overrides,
    } as PanelItem;
  }

  describe('itemByIdFamily', () => {
    test('returns item when productId exists', () => {
      const item1 = createMockItem('prod_1');
      const item2 = createMockItem('prod_2');
      const mockQueryAtom = atom({ data: { items: [item1, item2] } }) as any;

      const atoms = createDerivedItemAtoms(mockQueryAtom);
      const result = store.get(atoms.itemByIdFamily('prod_1'));

      expect(result).toEqual(item1);
    });

    test('returns null when productId does not exist', () => {
      const item1 = createMockItem('prod_1');
      const mockQueryAtom = atom({ data: { items: [item1] } }) as any;

      const atoms = createDerivedItemAtoms(mockQueryAtom);
      const result = store.get(atoms.itemByIdFamily('prod_999'));

      expect(result).toBeNull();
    });

    test('returns null when data is undefined', () => {
      const mockQueryAtom = atom({ data: undefined }) as any;

      const atoms = createDerivedItemAtoms(mockQueryAtom);
      const result = store.get(atoms.itemByIdFamily('prod_1'));

      expect(result).toBeNull();
    });

    test('returns null when items array is empty', () => {
      const mockQueryAtom = atom({ data: { items: [] } }) as any;

      const atoms = createDerivedItemAtoms(mockQueryAtom);
      const result = store.get(atoms.itemByIdFamily('prod_1'));

      expect(result).toBeNull();
    });

    test('atomFamily returns same atom instance for same productId', () => {
      const mockQueryAtom = atom({ data: { items: [] } }) as any;
      const atoms = createDerivedItemAtoms(mockQueryAtom);

      const atom1 = atoms.itemByIdFamily('prod_1');
      const atom2 = atoms.itemByIdFamily('prod_1');

      expect(atom1).toBe(atom2); // Same instance (memoized)
    });

    test('atomFamily returns different atom instances for different productIds', () => {
      const mockQueryAtom = atom({ data: { items: [] } }) as any;
      const atoms = createDerivedItemAtoms(mockQueryAtom);

      const atom1 = atoms.itemByIdFamily('prod_1');
      const atom2 = atoms.itemByIdFamily('prod_2');

      expect(atom1).not.toBe(atom2); // Different instances
    });
  });

  describe('itemUIFamily', () => {
    test('returns computed UI state for existing item', () => {
      const item = createMockItem('prod_1');
      const mockQueryAtom = atom({ data: { items: [item] } }) as any;

      const atoms = createDerivedItemAtoms(mockQueryAtom);
      const ui = store.get(atoms.itemUIFamily('prod_1'));

      expect(ui).not.toBeNull();
      expect(ui?.productId).toBe('prod_1');
      expect(ui?.isPurchasable).toBe(true);
      expect(ui?.presentation).toBe('normal');
      expect(ui?.ctaKind).toBe('quantity');
      expect(ui?.priceUI).toBe('shown');
      expect(ui?.quantityUI).toBe('stepper');
    });

    test('returns null for non-existent productId', () => {
      const item = createMockItem('prod_1');
      const mockQueryAtom = atom({ data: { items: [item] } }) as any;

      const atoms = createDerivedItemAtoms(mockQueryAtom);
      const ui = store.get(atoms.itemUIFamily('prod_999'));

      expect(ui).toBeNull();
    });

    test('computes UI state correctly for locked item', () => {
      const item = createMockItem('prod_1', {
        state: {
          temporal: { phase: 'during', reasons: [] },
          supply: { status: 'available', reasons: [] },
          gating: {
            required: true,
            satisfied: false,
            listingPolicy: 'visible_locked',
            reasons: [MachineCodeSchema.parse('requires_access_code')],
          },
          demand: { kind: 'none', reasons: [] },
          messages: [],
        },
      });
      const mockQueryAtom = atom({ data: { items: [item] } }) as any;

      const atoms = createDerivedItemAtoms(mockQueryAtom);
      const ui = store.get(atoms.itemUIFamily('prod_1'));

      expect(ui?.isPurchasable).toBe(false);
      expect(ui?.presentation).toBe('locked');
      expect(ui?.ctaKind).toBe('none');
      expect(ui?.priceUI).toBe('masked');
      expect(ui?.quantityUI).toBe('hidden');
    });

    test('computes UI state correctly for sold out item', () => {
      const item = createMockItem('prod_1', {
        state: {
          temporal: { phase: 'during', reasons: [] },
          supply: {
            status: 'none',
            reasons: [MachineCodeSchema.parse('sold_out')],
          },
          gating: {
            required: false,
            satisfied: true,
            listingPolicy: 'visible_locked',
            reasons: [],
          },
          demand: { kind: 'waitlist', reasons: [] },
          messages: [],
        },
        commercial: {
          price: DineroSnapshotSchema.parse({
            amount: 5000,
            currency: { code: 'USD', base: 10, exponent: 2 },
            scale: 2,
          }),
          feesIncluded: false,
          maxSelectable: 0,
        },
      });
      const mockQueryAtom = atom({ data: { items: [item] } }) as any;

      const atoms = createDerivedItemAtoms(mockQueryAtom);
      const ui = store.get(atoms.itemUIFamily('prod_1'));

      expect(ui?.isPurchasable).toBe(false);
      expect(ui?.presentation).toBe('normal');
      expect(ui?.ctaKind).toBe('waitlist');
      expect(ui?.maxSelectable).toBe(0);
    });

    test('atomFamily returns same atom instance for same productId', () => {
      const mockQueryAtom = atom({ data: { items: [] } }) as any;
      const atoms = createDerivedItemAtoms(mockQueryAtom);

      const atom1 = atoms.itemUIFamily('prod_1');
      const atom2 = atoms.itemUIFamily('prod_1');

      expect(atom1).toBe(atom2); // Same instance (memoized)
    });
  });

  describe('allItemsUIAtom', () => {
    test('returns all items with computed UI state', () => {
      const item1 = createMockItem('prod_1');
      const item2 = createMockItem('prod_2');
      const mockQueryAtom = atom({ data: { items: [item1, item2] } }) as any;

      const atoms = createDerivedItemAtoms(mockQueryAtom);
      const allItems = store.get(atoms.allItemsUIAtom);

      expect(allItems).toHaveLength(2);
      expect(allItems[0].productId).toBe('prod_1');
      expect(allItems[0].ui.isPurchasable).toBe(true);
      expect(allItems[0].item).toEqual(item1);

      expect(allItems[1].productId).toBe('prod_2');
      expect(allItems[1].ui.isPurchasable).toBe(true);
      expect(allItems[1].item).toEqual(item2);
    });

    test('returns empty array when data is undefined', () => {
      const mockQueryAtom = atom({ data: undefined }) as any;

      const atoms = createDerivedItemAtoms(mockQueryAtom);
      const allItems = store.get(atoms.allItemsUIAtom);

      expect(allItems).toEqual([]);
    });

    test('returns empty array when items array is empty', () => {
      const mockQueryAtom = atom({ data: { items: [] } }) as any;

      const atoms = createDerivedItemAtoms(mockQueryAtom);
      const allItems = store.get(atoms.allItemsUIAtom);

      expect(allItems).toEqual([]);
    });

    test('preserves order of items from query data', () => {
      const item1 = createMockItem('prod_1');
      const item2 = createMockItem('prod_2');
      const item3 = createMockItem('prod_3');
      const mockQueryAtom = atom({
        data: { items: [item1, item2, item3] },
      }) as any;

      const atoms = createDerivedItemAtoms(mockQueryAtom);
      const allItems = store.get(atoms.allItemsUIAtom);

      expect(allItems.map((i) => i.productId)).toEqual([
        'prod_1',
        'prod_2',
        'prod_3',
      ]);
    });

    test('includes raw item in result for advanced use cases', () => {
      const item = createMockItem('prod_1');
      const mockQueryAtom = atom({ data: { items: [item] } }) as any;

      const atoms = createDerivedItemAtoms(mockQueryAtom);
      const allItems = store.get(atoms.allItemsUIAtom);

      expect(allItems[0].item).toEqual(item);
      expect(allItems[0].item.product.id).toBe('prod_1');
      expect(allItems[0].item.commercial.maxSelectable).toBe(10);
    });

    test('recomputes when query data changes', () => {
      const item1 = createMockItem('prod_1');
      const mockQueryAtom = atom({ data: { items: [item1] } });

      const atoms = createDerivedItemAtoms(mockQueryAtom);

      // Initial state
      let allItems = store.get(atoms.allItemsUIAtom);
      expect(allItems).toHaveLength(1);

      // Update query data
      const item2 = createMockItem('prod_2');
      store.set(mockQueryAtom, { data: { items: [item1, item2] } });

      // Should recompute
      allItems = store.get(atoms.allItemsUIAtom);
      expect(allItems).toHaveLength(2);
    });
  });

  describe('Integration', () => {
    test('itemUIFamily uses itemByIdFamily internally', () => {
      const item = createMockItem('prod_1');
      const mockQueryAtom = atom({ data: { items: [item] } }) as any;

      const atoms = createDerivedItemAtoms(mockQueryAtom);

      // Get item via itemByIdFamily
      const rawItem = store.get(atoms.itemByIdFamily('prod_1'));

      // Get UI via itemUIFamily (which uses itemByIdFamily)
      const ui = store.get(atoms.itemUIFamily('prod_1'));

      expect(rawItem).toEqual(item);
      expect(ui?.product).toEqual(item.product);
    });

    test('all atoms work together correctly', () => {
      const item1 = createMockItem('prod_1');
      const item2 = createMockItem('prod_2', {
        state: {
          temporal: { phase: 'during', reasons: [] },
          supply: { status: 'none', reasons: [] },
          gating: {
            required: false,
            satisfied: true,
            listingPolicy: 'visible_locked',
            reasons: [],
          },
          demand: { kind: 'none', reasons: [] },
          messages: [],
        },
        commercial: {
          price: DineroSnapshotSchema.parse({
            amount: 5000,
            currency: { code: 'USD', base: 10, exponent: 2 },
            scale: 2,
          }),
          feesIncluded: false,
          maxSelectable: 0,
        },
      });

      const mockQueryAtom = atom({ data: { items: [item1, item2] } }) as any;
      const atoms = createDerivedItemAtoms(mockQueryAtom);

      // Test itemByIdFamily
      expect(store.get(atoms.itemByIdFamily('prod_1'))).toEqual(item1);
      expect(store.get(atoms.itemByIdFamily('prod_2'))).toEqual(item2);

      // Test itemUIFamily
      const ui1 = store.get(atoms.itemUIFamily('prod_1'));
      const ui2 = store.get(atoms.itemUIFamily('prod_2'));

      expect(ui1?.isPurchasable).toBe(true);
      expect(ui2?.isPurchasable).toBe(false);

      // Test allItemsUIAtom
      const allItems = store.get(atoms.allItemsUIAtom);
      expect(allItems).toHaveLength(2);
      expect(allItems[0].ui.isPurchasable).toBe(true);
      expect(allItems[1].ui.isPurchasable).toBe(false);
    });
  });
});
