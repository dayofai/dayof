import { match } from 'ts-pattern';
import type {
  Commercial,
  Display,
  Message,
  PanelItem,
  Product,
  State,
} from '../schemas';

/**
 * UI state derived from a PanelItem
 *
 * Transforms server facts (axes) into UI decisions (presentation, CTA, visibility).
 * See {@link ./computeItemUI-spec.md} for full specification.
 */
export interface ItemUIState {
  productId: string;
  product: Product;
  isPurchasable: boolean;
  presentation: 'normal' | 'locked';
  ctaKind: 'quantity' | 'waitlist' | 'notify' | 'none';
  ctaEnabled: boolean;
  priceUI: 'hidden' | 'masked' | 'shown';
  quantityUI: 'hidden' | 'select' | 'stepper';
  showLowRemaining: boolean;
  remainingCount?: number;
  maxSelectable: number;
  limits?: { perOrder?: number; perUser?: number };
  messages: Message[];
  state: State;
  commercial: Commercial;
  display: Display;
}

/**
 * Compute UI state from a PanelItem
 *
 * @see {@link ./computeItemUI-spec.md} for full specification
 */
export function computeItemUI(item: PanelItem): ItemUIState {
  const isPurchasable =
    item.state.temporal.phase === 'during' &&
    item.state.supply.status === 'available' &&
    (!item.state.gating.required || item.state.gating.satisfied) &&
    item.commercial.maxSelectable > 0;

  const presentation: 'normal' | 'locked' =
    item.state.gating.required &&
    !item.state.gating.satisfied &&
    item.state.gating.listingPolicy === 'visible_locked'
      ? 'locked'
      : 'normal';

  let priceUI: 'hidden' | 'masked' | 'shown';
  if (presentation === 'locked') {
    priceUI = 'masked';
  } else if (isPurchasable) {
    priceUI = 'shown';
  } else {
    priceUI = 'hidden';
  }

  let quantityUI: 'hidden' | 'select' | 'stepper';
  if (
    presentation === 'locked' ||
    !isPurchasable ||
    item.commercial.maxSelectable === 0
  ) {
    quantityUI = 'hidden';
  } else if (item.commercial.maxSelectable === 1) {
    quantityUI = 'select';
  } else {
    quantityUI = 'stepper';
  }

  const ctaKind = match([presentation, isPurchasable, item.state] as const)
    .when(
      ([pres]) => pres === 'locked',
      () => 'none' as const
    )
    .when(
      ([_pres, isPurch]) => isPurch === true,
      () => 'quantity' as const
    )
    .when(
      ([_pres, _isPurch, state]) =>
        state.supply.status === 'none' && state.demand.kind === 'waitlist',
      () => 'waitlist' as const
    )
    .when(
      ([_pres, _isPurch, state]) =>
        state.temporal.phase === 'before' && state.demand.kind === 'notify_me',
      () => 'notify' as const
    )
    .otherwise(() => 'none' as const);

  const showLowRemaining =
    item.display.showLowRemaining &&
    item.state.supply.remaining !== undefined &&
    item.state.supply.status === 'available';

  const remainingCount = showLowRemaining
    ? item.state.supply.remaining
    : undefined;

  const messages = [...item.state.messages].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
  );

  return {
    productId: item.product.id,
    product: item.product,
    isPurchasable,
    presentation,
    ctaKind,
    ctaEnabled: ctaKind !== 'none',
    priceUI,
    quantityUI,
    showLowRemaining,
    remainingCount,
    maxSelectable: item.commercial.maxSelectable,
    limits: item.commercial.limits,
    messages,
    state: item.state,
    commercial: item.commercial,
    display: item.display,
  };
}
