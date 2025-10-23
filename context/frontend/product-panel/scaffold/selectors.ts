
// src/state/selectors.ts
import { atom } from "jotai";
import { contextAtom, itemsAtom, sectionsAtom, pricingAtom, totalSelectedAtom } from "./atoms";
import type { PanelViewModel, SectionViewModel } from "./types";
import { mapItemToRowVM } from "../utils/mapping";

export const panelViewModelAtom = atom<PanelViewModel>((get) => {
  const payloadContext = get(contextAtom);
  const items = get(itemsAtom);
  const sections = get(sectionsAtom);
  const pricing = get(pricingAtom);
  const selectionCount = get(totalSelectedAtom);

  // Map items to row view models
  const rowVMs = items.map((it) => mapItemToRowVM(it, { context: payloadContext, items, sections, pricing, axes: undefined } as any, selectionCount));

  // Group by sections with order preserved
  const sectionOrder = sections.slice().sort((a, b) => a.order - b.order);
  const grouped: SectionViewModel[] = sectionOrder.map((sec) => ({
    id: sec.id,
    label: sec.label,
    labelResolved: sec.labelOverride ?? sec.label,
    items: rowVMs.filter((r) => r.sectionId === sec.id),
  }));

  // Panel rollups
  const allOutOfStock = rowVMs.length > 0 && rowVMs.every((r) => r.presentation !== "normal" || r.cta.kind === "none") &&
    items.every((it) => it.commercial.status === "outOfStock");

  const anyGatedVisible = rowVMs.some((r) => r.presentation === "locked");
  const anyGatedHidden = items.some((it) => it.gates?.requirements?.length && (it.gates?.visibilityWhenGated ?? "visible") === "hidden");

  // Respect effectivePrefs.showTypeListWhenSoldOut
  const panelMode = (allOutOfStock && payloadContext.effectivePrefs && payloadContext.effectivePrefs.showTypeListWhenSoldOut === false)
    ? "compactWaitlistOnly"
    : "full";

  return {
    context: payloadContext,
    sections: grouped,
    panelMode,
    pricing,
    allOutOfStock,
    anyGatedVisible,
    anyGatedHidden,
  };
});
