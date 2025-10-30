// __tests__/atoms/panel-state.test.ts

import { atom, createStore } from 'jotai';
import { beforeEach, describe, expect, test } from 'vitest';
import { createPanelStateAtoms } from '../../atoms/panel-state';

describe('Panel State Atoms', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe('layoutModeAtom', () => {
    test('returns compact for single item', () => {
      const mockQueryAtom = atom({ data: { items: [{}], context: {} } }) as any;
      const atoms = createPanelStateAtoms(mockQueryAtom);

      expect(store.get(atoms.layoutModeAtom)).toBe('compact');
    });

    test('returns full for multiple items', () => {
      const mockQueryAtom = atom({
        data: { items: [{}, {}], context: {} },
      }) as any;
      const atoms = createPanelStateAtoms(mockQueryAtom);

      expect(store.get(atoms.layoutModeAtom)).toBe('full');
    });
  });

  describe('allVisibleSoldOutAtom', () => {
    test('returns true when all items have status none or unknown', () => {
      const mockQueryAtom = atom({
        data: {
          items: [
            { state: { supply: { status: 'none' } } },
            { state: { supply: { status: 'unknown' } } },
          ],
          context: {},
        },
      }) as any;
      const atoms = createPanelStateAtoms(mockQueryAtom);

      expect(store.get(atoms.allVisibleSoldOutAtom)).toBe(true);
    });

    test('returns false when any item is available', () => {
      const mockQueryAtom = atom({
        data: {
          items: [
            { state: { supply: { status: 'none' } } },
            { state: { supply: { status: 'available' } } },
          ],
          context: {},
        },
      }) as any;
      const atoms = createPanelStateAtoms(mockQueryAtom);

      expect(store.get(atoms.allVisibleSoldOutAtom)).toBe(false);
    });
  });

  describe('anyLockedVisibleAtom', () => {
    test('returns true when any item is locked', () => {
      const mockQueryAtom = atom({
        data: {
          items: [
            {
              state: {
                gating: {
                  required: true,
                  satisfied: false,
                  listingPolicy: 'visible_locked',
                },
              },
            },
          ],
          context: {},
        },
      }) as any;
      const atoms = createPanelStateAtoms(mockQueryAtom);

      expect(store.get(atoms.anyLockedVisibleAtom)).toBe(true);
    });

    test('returns false when gating satisfied', () => {
      const mockQueryAtom = atom({
        data: {
          items: [
            {
              state: {
                gating: { required: true, satisfied: true },
              },
            },
          ],
          context: {},
        },
      }) as any;
      const atoms = createPanelStateAtoms(mockQueryAtom);

      expect(store.get(atoms.anyLockedVisibleAtom)).toBe(false);
    });
  });

  describe('primaryCTAAtom', () => {
    test('returns server-provided CTA', () => {
      const mockQueryAtom = atom({
        data: {
          items: [],
          context: {
            primaryCTA: {
              label: 'Join Waitlist',
              action: 'waitlist',
              enabled: true,
            },
          },
        },
      }) as any;
      const atoms = createPanelStateAtoms(mockQueryAtom);

      expect(store.get(atoms.primaryCTAAtom)).toEqual({
        label: 'Join Waitlist',
        action: 'waitlist',
        enabled: true,
      });
    });

    test('returns null when no CTA provided', () => {
      const mockQueryAtom = atom({ data: { items: [], context: {} } }) as any;
      const atoms = createPanelStateAtoms(mockQueryAtom);

      expect(store.get(atoms.primaryCTAAtom)).toBeNull();
    });
  });

  describe('welcomeTextAtom', () => {
    test('returns server-provided welcome text', () => {
      const mockQueryAtom = atom({
        data: {
          items: [],
          context: {
            welcomeText: 'Welcome to our event!',
          },
        },
      }) as any;
      const atoms = createPanelStateAtoms(mockQueryAtom);

      expect(store.get(atoms.welcomeTextAtom)).toBe('Welcome to our event!');
    });

    test('returns null when no welcome text provided', () => {
      const mockQueryAtom = atom({ data: { items: [], context: {} } }) as any;
      const atoms = createPanelStateAtoms(mockQueryAtom);

      expect(store.get(atoms.welcomeTextAtom)).toBeNull();
    });
  });

  describe('showAccessCodeCTAAtom', () => {
    test('returns true when hasHiddenGatedItems is true', () => {
      const mockQueryAtom = atom({
        data: {
          items: [],
          context: {
            gatingSummary: { hasHiddenGatedItems: true },
          },
        },
      }) as any;
      const atoms = createPanelStateAtoms(mockQueryAtom);

      expect(store.get(atoms.showAccessCodeCTAAtom)).toBe(true);
    });

    test('returns true when any visible item is locked', () => {
      const mockQueryAtom = atom({
        data: {
          items: [
            {
              state: {
                gating: {
                  required: true,
                  satisfied: false,
                  listingPolicy: 'visible_locked',
                },
              },
            },
          ],
          context: {},
        },
      }) as any;
      const atoms = createPanelStateAtoms(mockQueryAtom);

      expect(store.get(atoms.showAccessCodeCTAAtom)).toBe(true);
    });

    test('returns false when no gating conditions are met', () => {
      const mockQueryAtom = atom({ data: { items: [], context: {} } }) as any;
      const atoms = createPanelStateAtoms(mockQueryAtom);

      expect(store.get(atoms.showAccessCodeCTAAtom)).toBe(false);
    });
  });
});
