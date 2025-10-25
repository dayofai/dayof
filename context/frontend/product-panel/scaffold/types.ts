// src/state/types.ts
import type { ProductPanelPayload } from '../contract/schemas';

export type RowPresentation = 'normal' | 'locked' | 'suppressed';
export type QuantityUI = 'hidden' | 'select' | 'stepper';
export type PriceUI = 'hidden' | 'shown' | 'masked';

export type CTAKind =
  | 'purchase'
  | 'request'
  | 'join_waitlist'
  | 'notify_me' // not in the primary mapping table, but supported by contract
  | 'backorder' // for physical goods if enabled
  | 'none';

export interface RowCTA {
  kind: CTAKind;
  label: string;
  enabled: boolean;
  disabledReason?: string;
}

export interface RowNotice {
  icon?: 'info' | 'warning' | 'success' | 'error';
  title?: string;
  text?: string;
  badge?: string;
  meta?: string;
}

export interface RowViewModel {
  key: string; // productId/variantId
  sectionId: string;
  productId: string;
  variantId: string;
  name: string;

  presentation: RowPresentation;
  quantityUI: QuantityUI;
  priceUI: PriceUI;

  lowInventory?: boolean;
  badges?: string[];

  maxSelectable: number; // authoritative clamp (never recomputed)
  remainingInventory: number | 'infinite' | null | undefined;

  cta: RowCTA;
  notices: RowNotice[];

  isGated: boolean;
  gatesVisible: boolean;
  reasons: string[];
}

export interface SectionViewModel {
  id: string;
  label: string;
  labelResolved: string;
  items: RowViewModel[];
}

export interface PanelViewModel {
  context: ProductPanelPayload['context'];
  sections: SectionViewModel[];
  panelMode: 'full' | 'compactWaitlistOnly'; // driven by effectivePrefs & item states
  pricing: ProductPanelPayload['pricing'];
  // roll-ups
  allOutOfStock: boolean;
  anyGatedVisible: boolean;
  anyGatedHidden: boolean;
}
