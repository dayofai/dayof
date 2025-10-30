import type { Atom } from 'jotai';
import { atom } from 'jotai';
import type { Context, PanelItem, PrimaryCTA } from '../schemas';

/**
 * Panel state atoms return type
 */
export interface PanelStateAtoms {
  layoutModeAtom: Atom<'compact' | 'full'>;
  allVisibleSoldOutAtom: Atom<boolean>;
  anyLockedVisibleAtom: Atom<boolean>;
  anyItemMultiQtyAtom: Atom<boolean>;
  primaryCTAAtom: Atom<PrimaryCTA | null>;
  welcomeTextAtom: Atom<string | null>;
  showAccessCodeCTAAtom: Atom<boolean>;
}

/**
 * Create panel-level derived state atoms
 *
 * Most panel state is now server-provided. These atoms simply pass through
 * server data or derive simple UI flags (layout mode, visibility).
 */
export function createPanelStateAtoms(
  queryAtom: Atom<{ data?: { items: PanelItem[]; context: Context } }>
): PanelStateAtoms {
  /**
   * Layout mode: compact vs full
   * Compact: single item, streamlined card
   * Full: multiple items, row-based list
   */
  const layoutModeAtom = atom((get): 'compact' | 'full' => {
    const panel = get(queryAtom);
    return panel.data?.items.length === 1 ? 'compact' : 'full';
  });

  /**
   * All visible items are sold out or unavailable
   * Used with effectivePrefs.showTypeListWhenSoldOut
   *
   * Treats 'none' and 'unknown' as unavailable for conservative UX.
   *
   * NOTE: This atom intentionally does NOT check gatingSummary.hasHiddenGatedItems.
   * Per spec §9.6: "All visible items sold out (no hidden gated considered)".
   * UI components must separately check hasHiddenGatedItems to decide between:
   * - Show AccessCodeCTA (if hasHiddenGatedItems=true)
   * - Show "Event Sold Out" finale (if hasHiddenGatedItems=false)
   */
  const allVisibleSoldOutAtom = atom((get): boolean => {
    const panel = get(queryAtom);
    if (!panel.data) {
      return false;
    }

    return (
      panel.data.items.length > 0 &&
      panel.data.items.every(
        (item) =>
          item.state.supply.status === 'none' ||
          item.state.supply.status === 'unknown'
      )
    );
  });

  /**
   * Any visible item is locked
   * Determines if AccessCodeCTA should show
   * NOTE: This atom has higher precedence than allVisibleSoldOutAtom.
   */
  const anyLockedVisibleAtom = atom((get): boolean => {
    const panel = get(queryAtom);
    if (!panel.data) {
      return false;
    }

    return panel.data.items.some(
      (item) =>
        item.state.gating.required &&
        !item.state.gating.satisfied &&
        item.state.gating.listingPolicy === 'visible_locked'
    );
  });

  /**
   * Any item has maxSelectable > 1
   * Used for quantity UI consistency rule (§8.9)
   */
  const anyItemMultiQtyAtom = atom((get): boolean => {
    const panel = get(queryAtom);
    if (!panel.data) {
      return false;
    }

    return panel.data.items.some((item) => item.commercial.maxSelectable > 1);
  });

  /**
   * Primary CTA (server-provided)
   *
   * Server determines the CTA label, action, and enabled state.
   * Client simply passes through the server decision.
   */
  const primaryCTAAtom = atom((get): PrimaryCTA | null => {
    const panel = get(queryAtom);
    return panel.data?.context.primaryCTA ?? null;
  });

  /**
   * Welcome text (server-provided)
   *
   * Server provides the final welcome text based on panel state.
   * Client simply renders it.
   */
  const welcomeTextAtom = atom((get): string | null => {
    const panel = get(queryAtom);
    return panel.data?.context.welcomeText ?? null;
  });

  /**
   * Show AccessCodeCTA flag (§9.1, §5.3a)
   * Shows when hidden gated items exist OR any visible item is locked
   */
  const showAccessCodeCTAAtom = atom((get): boolean => {
    const panel = get(queryAtom);
    if (!panel.data) {
      return false;
    }

    const { context } = panel.data;
    const hasHidden = context.gatingSummary?.hasHiddenGatedItems ?? false;
    const anyLocked = get(anyLockedVisibleAtom);

    return hasHidden || anyLocked;
  });

  return {
    layoutModeAtom,
    allVisibleSoldOutAtom,
    anyLockedVisibleAtom,
    anyItemMultiQtyAtom,
    primaryCTAAtom,
    welcomeTextAtom,
    showAccessCodeCTAAtom,
  };
}
