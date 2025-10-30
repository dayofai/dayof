import { describe, expect, test } from 'vitest';
import { computeItemUI } from '../../lib/computeItemUI';
import {
  DineroSnapshotSchema,
  MachineCodeSchema,
  type PanelItem,
} from '../../schemas';

/**
 * Test helper: Create a minimal valid PanelItem for testing
 */
function createMockItem(overrides?: Partial<PanelItem>): PanelItem {
  const defaultItem: PanelItem = {
    product: {
      id: 'test-product-id',
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
  };

  return { ...defaultItem, ...overrides } as PanelItem;
}

describe('computeItemUI', () => {
  describe('isPurchasable', () => {
    test('happy path: all axes green → purchasable', () => {
      const item = createMockItem();
      const ui = computeItemUI(item);

      expect(ui.isPurchasable).toBe(true);
    });

    test('temporal.phase="before" → not purchasable', () => {
      const item = createMockItem({
        state: {
          ...createMockItem().state,
          temporal: { phase: 'before', reasons: [] },
        },
      });

      expect(computeItemUI(item).isPurchasable).toBe(false);
    });

    test('temporal.phase="after" → not purchasable', () => {
      const item = createMockItem({
        state: {
          ...createMockItem().state,
          temporal: { phase: 'after', reasons: [] },
        },
      });

      expect(computeItemUI(item).isPurchasable).toBe(false);
    });

    test('supply.status="none" → not purchasable', () => {
      const item = createMockItem({
        state: {
          ...createMockItem().state,
          supply: { status: 'none', reasons: [] },
        },
      });

      expect(computeItemUI(item).isPurchasable).toBe(false);
    });

    test('supply.status="unknown" → not purchasable', () => {
      const item = createMockItem({
        state: {
          ...createMockItem().state,
          supply: { status: 'unknown', reasons: [] },
        },
      });

      expect(computeItemUI(item).isPurchasable).toBe(false);
    });

    test('gating.required=true, satisfied=false → not purchasable', () => {
      const item = createMockItem({
        state: {
          ...createMockItem().state,
          gating: {
            required: true,
            satisfied: false,
            listingPolicy: 'visible_locked',
            reasons: [],
          },
        },
      });

      expect(computeItemUI(item).isPurchasable).toBe(false);
    });

    test('gating.required=true, satisfied=true → purchasable', () => {
      const item = createMockItem({
        state: {
          ...createMockItem().state,
          gating: {
            required: true,
            satisfied: true,
            listingPolicy: 'visible_locked',
            reasons: [],
          },
        },
      });

      expect(computeItemUI(item).isPurchasable).toBe(true);
    });

    test('maxSelectable=0 → not purchasable', () => {
      const item = createMockItem({
        commercial: {
          ...createMockItem().commercial,
          maxSelectable: 0,
        },
      });

      expect(computeItemUI(item).isPurchasable).toBe(false);
    });

    test('demand.kind="waitlist" does NOT affect purchasability', () => {
      const item = createMockItem({
        state: {
          ...createMockItem().state,
          demand: { kind: 'waitlist', reasons: [] },
        },
      });

      expect(computeItemUI(item).isPurchasable).toBe(true);
    });
  });

  describe('presentation', () => {
    test('normal: no gating → normal', () => {
      const item = createMockItem();
      expect(computeItemUI(item).presentation).toBe('normal');
    });

    test('normal: gating required but satisfied → normal', () => {
      const item = createMockItem({
        state: {
          ...createMockItem().state,
          gating: {
            required: true,
            satisfied: true,
            listingPolicy: 'visible_locked',
            reasons: [],
          },
        },
      });

      expect(computeItemUI(item).presentation).toBe('normal');
    });

    test('locked: gating required, not satisfied, visible_locked → locked', () => {
      const item = createMockItem({
        state: {
          ...createMockItem().state,
          gating: {
            required: true,
            satisfied: false,
            listingPolicy: 'visible_locked',
            reasons: [],
          },
        },
      });

      expect(computeItemUI(item).presentation).toBe('locked');
    });

    test('normal: gating required, not satisfied, but omit_until_unlocked → normal (item should not be sent)', () => {
      const item = createMockItem({
        state: {
          ...createMockItem().state,
          gating: {
            required: true,
            satisfied: false,
            listingPolicy: 'omit_until_unlocked',
            reasons: [],
          },
        },
      });

      expect(computeItemUI(item).presentation).toBe('normal');
    });
  });

  describe('priceUI', () => {
    test('shown: normal + purchasable → shown', () => {
      const item = createMockItem();
      const ui = computeItemUI(item);

      expect(ui.priceUI).toBe('shown');
    });

    test('masked: locked → masked', () => {
      const item = createMockItem({
        state: {
          ...createMockItem().state,
          gating: {
            required: true,
            satisfied: false,
            listingPolicy: 'visible_locked',
            reasons: [],
          },
        },
      });

      expect(computeItemUI(item).priceUI).toBe('masked');
    });

    test('hidden: normal + not purchasable → hidden', () => {
      const item = createMockItem({
        state: {
          ...createMockItem().state,
          temporal: { phase: 'before', reasons: [] },
        },
      });

      expect(computeItemUI(item).priceUI).toBe('hidden');
    });
  });

  describe('quantityUI', () => {
    test('stepper: purchasable + maxSelectable > 1 → stepper', () => {
      const item = createMockItem({
        commercial: {
          ...createMockItem().commercial,
          maxSelectable: 10,
        },
      });

      expect(computeItemUI(item).quantityUI).toBe('stepper');
    });

    test('select: purchasable + maxSelectable = 1 → select', () => {
      const item = createMockItem({
        commercial: {
          ...createMockItem().commercial,
          maxSelectable: 1,
        },
      });

      expect(computeItemUI(item).quantityUI).toBe('select');
    });

    test('hidden: locked → hidden', () => {
      const item = createMockItem({
        state: {
          ...createMockItem().state,
          gating: {
            required: true,
            satisfied: false,
            listingPolicy: 'visible_locked',
            reasons: [],
          },
        },
      });

      expect(computeItemUI(item).quantityUI).toBe('hidden');
    });

    test('hidden: not purchasable → hidden', () => {
      const item = createMockItem({
        state: {
          ...createMockItem().state,
          supply: { status: 'none', reasons: [] },
        },
      });

      expect(computeItemUI(item).quantityUI).toBe('hidden');
    });

    test('hidden: maxSelectable = 0 → hidden', () => {
      const item = createMockItem({
        commercial: {
          ...createMockItem().commercial,
          maxSelectable: 0,
        },
      });

      expect(computeItemUI(item).quantityUI).toBe('hidden');
    });
  });

  describe('ctaKind', () => {
    test('quantity: purchasable → quantity', () => {
      const item = createMockItem();
      expect(computeItemUI(item).ctaKind).toBe('quantity');
    });

    test('none: locked → none (gate precedence)', () => {
      const item = createMockItem({
        state: {
          ...createMockItem().state,
          gating: {
            required: true,
            satisfied: false,
            listingPolicy: 'visible_locked',
            reasons: [],
          },
        },
      });

      expect(computeItemUI(item).ctaKind).toBe('none');
    });

    test('waitlist: sold out + waitlist → waitlist', () => {
      const item = createMockItem({
        state: {
          ...createMockItem().state,
          supply: { status: 'none', reasons: [] },
          demand: { kind: 'waitlist', reasons: [] },
        },
      });

      expect(computeItemUI(item).ctaKind).toBe('waitlist');
    });

    test('notify: before sale + notify_me → notify', () => {
      const item = createMockItem({
        state: {
          ...createMockItem().state,
          temporal: { phase: 'before', reasons: [] },
          demand: { kind: 'notify_me', reasons: [] },
        },
      });

      expect(computeItemUI(item).ctaKind).toBe('notify');
    });

    test('none: gated + waitlist → none (gate precedence over demand)', () => {
      const item = createMockItem({
        state: {
          ...createMockItem().state,
          gating: {
            required: true,
            satisfied: false,
            listingPolicy: 'visible_locked',
            reasons: [],
          },
          demand: { kind: 'waitlist', reasons: [] },
        },
      });

      expect(computeItemUI(item).ctaKind).toBe('none');
    });

    test('none: after sale + no demand → none', () => {
      const item = createMockItem({
        state: {
          ...createMockItem().state,
          temporal: { phase: 'after', reasons: [] },
        },
      });

      expect(computeItemUI(item).ctaKind).toBe('none');
    });
  });

  describe('showLowRemaining', () => {
    test('true: flag + remaining + available → show', () => {
      const item = createMockItem({
        state: {
          ...createMockItem().state,
          supply: {
            status: 'available',
            remaining: 5,
            reasons: [],
          },
        },
        display: {
          ...createMockItem().display,
          showLowRemaining: true,
        },
      });

      const ui = computeItemUI(item);
      expect(ui.showLowRemaining).toBe(true);
      expect(ui.remainingCount).toBe(5);
    });

    test('false: flag off → no show', () => {
      const item = createMockItem({
        state: {
          ...createMockItem().state,
          supply: {
            status: 'available',
            remaining: 5,
            reasons: [],
          },
        },
        display: {
          ...createMockItem().display,
          showLowRemaining: false,
        },
      });

      const ui = computeItemUI(item);
      expect(ui.showLowRemaining).toBe(false);
      expect(ui.remainingCount).toBeUndefined();
    });

    test('false: missing remaining → no show', () => {
      const item = createMockItem({
        display: {
          ...createMockItem().display,
          showLowRemaining: true,
        },
      });

      const ui = computeItemUI(item);
      expect(ui.showLowRemaining).toBe(false);
      expect(ui.remainingCount).toBeUndefined();
    });

    test('false: status=none → no show', () => {
      const item = createMockItem({
        state: {
          ...createMockItem().state,
          supply: {
            status: 'none',
            remaining: 0,
            reasons: [],
          },
        },
        display: {
          ...createMockItem().display,
          showLowRemaining: true,
        },
      });

      const ui = computeItemUI(item);
      expect(ui.showLowRemaining).toBe(false);
      expect(ui.remainingCount).toBeUndefined();
    });
  });

  describe('messages sorting', () => {
    test('sorts by priority descending', () => {
      const item = createMockItem({
        state: {
          ...createMockItem().state,
          messages: [
            {
              code: MachineCodeSchema.parse('low_priority'),
              placement: 'row.footer',
              priority: 10,
              variant: 'neutral',
            },
            {
              code: MachineCodeSchema.parse('high_priority'),
              placement: 'row.footer',
              priority: 90,
              variant: 'neutral',
            },
            {
              code: MachineCodeSchema.parse('mid_priority'),
              placement: 'row.footer',
              priority: 50,
              variant: 'neutral',
            },
          ],
        },
      });

      const ui = computeItemUI(item);
      expect(ui.messages[0].code).toBe('high_priority');
      expect(ui.messages[1].code).toBe('mid_priority');
      expect(ui.messages[2].code).toBe('low_priority');
    });
  });

  describe('edge cases (§6.6)', () => {
    test('maxSelectable=0 beats all green axes', () => {
      const item = createMockItem({
        state: {
          temporal: { phase: 'during', reasons: [] },
          supply: { status: 'available', reasons: [] },
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
          ...createMockItem().commercial,
          maxSelectable: 0,
        },
      });

      const ui = computeItemUI(item);
      expect(ui.isPurchasable).toBe(false);
      expect(ui.quantityUI).toBe('hidden');
    });

    test('gated but satisfied → purchasable', () => {
      const item = createMockItem({
        state: {
          ...createMockItem().state,
          gating: {
            required: true,
            satisfied: true,
            listingPolicy: 'visible_locked',
            reasons: [],
          },
        },
      });

      expect(computeItemUI(item).isPurchasable).toBe(true);
    });

    test('locked row masks price and hides quantity', () => {
      const item = createMockItem({
        state: {
          ...createMockItem().state,
          gating: {
            required: true,
            satisfied: false,
            listingPolicy: 'visible_locked',
            reasons: [],
          },
        },
      });

      const ui = computeItemUI(item);
      expect(ui.presentation).toBe('locked');
      expect(ui.priceUI).toBe('masked');
      expect(ui.quantityUI).toBe('hidden');
      expect(ui.ctaKind).toBe('none');
    });
  });

  describe('ctaEnabled flag', () => {
    test('enabled when ctaKind is not "none"', () => {
      const item = createMockItem();
      const ui = computeItemUI(item);

      expect(ui.ctaKind).toBe('quantity');
      expect(ui.ctaEnabled).toBe(true);
    });

    test('disabled when ctaKind is "none"', () => {
      const item = createMockItem({
        state: {
          ...createMockItem().state,
          temporal: { phase: 'after', reasons: [] },
        },
      });

      const ui = computeItemUI(item);
      expect(ui.ctaKind).toBe('none');
      expect(ui.ctaEnabled).toBe(false);
    });
  });

  describe('pass-through fields', () => {
    test('includes raw state for advanced use', () => {
      const item = createMockItem();
      const ui = computeItemUI(item);

      expect(ui.state).toBe(item.state);
      expect(ui.commercial).toBe(item.commercial);
      expect(ui.display).toBe(item.display);
    });

    test('includes product identity', () => {
      const item = createMockItem({
        product: {
          id: 'prod-123',
          name: 'VIP Ticket',
          type: 'ticket',
        },
      });

      const ui = computeItemUI(item);
      expect(ui.productId).toBe('prod-123');
      expect(ui.product.name).toBe('VIP Ticket');
    });

    test('includes commercial constraints', () => {
      const item = createMockItem({
        commercial: {
          ...createMockItem().commercial,
          maxSelectable: 6,
          limits: { perOrder: 10, perUser: 6 },
        },
      });

      const ui = computeItemUI(item);
      expect(ui.maxSelectable).toBe(6);
      expect(ui.limits).toEqual({ perOrder: 10, perUser: 6 });
    });
  });
});
