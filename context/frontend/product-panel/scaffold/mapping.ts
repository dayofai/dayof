
// src/utils/mapping.ts
import { match } from "ts-pattern";
import type { PanelItem, ProductPanelPayload } from "../contract/schemas";
import type { CTAKind, RowViewModel, RowNotice, QuantityUI, PriceUI } from "../state/types";

function gatesSatisfied(item: PanelItem): boolean {
  const reqs = item.gates?.requirements ?? [];
  const logic = item.gates?.logic ?? "all";
  if (reqs.length === 0) return true;
  const satisfiedCount = reqs.filter((r) => r.satisfied).length;
  return logic === "all" ? satisfiedCount === reqs.length : satisfiedCount > 0;
}

function rowPresentation(item: PanelItem, satisfied: boolean): "normal" | "locked" | "suppressed" {
  if (!satisfied) {
    const visible = (item.gates?.visibilityWhenGated ?? "visible") === "visible"
      || (item.variant?.visibilityWhenGated ?? "visible") === "visible";
    return visible ? "locked" : "suppressed";
  }
  return "normal";
}

function quantityUI(item: PanelItem, pres: RowViewModel["presentation"]): QuantityUI {
  if (pres !== "normal") return "hidden";
  const st = item.commercial.status;
  if (st === "available" || st === "approvalRequired") {
    const max = item.commercial.maxSelectable ?? 0;
    if (max <= 0) return "hidden";
    if (max === 1) return "select";
    return "stepper";
  }
  return "hidden";
}

function priceUI(item: PanelItem, pres: RowViewModel["presentation"]): PriceUI {
  if (pres === "locked") return "masked";
  if (pres === "suppressed") return "hidden";
  const st = item.commercial.status;
  return (st === "available" || st === "approvalRequired") ? "shown" : "hidden";
}

function labelWithOverrides(kind: CTAKind, payload: ProductPanelPayload, defaultLabel: string): string {
  const overrides = payload.context.effectivePrefs?.ctaLabelOverrides ?? {};
  const key = (
    kind === "purchase" ? "purchase" :
    kind === "request" ? "request" :
    kind === "join_waitlist" ? "join_waitlist" :
    kind === "notify_me" ? "notify_me" :
    kind === "backorder" ? "backorder" : ""
  );
  return (key && overrides[key]) || defaultLabel;
}

function ctaFor(item: PanelItem, pres: RowViewModel["presentation"], payload: ProductPanelPayload, selectionCount: number): { kind: CTAKind; label: string; enabled: boolean; disabledReason?: string } {
  if (pres !== "normal") {
    return { kind: "none", label: "", enabled: false };
  }

  const st = item.commercial.status;
  const dc = item.commercial.demandCapture;
  const max = item.commercial.maxSelectable ?? 0;

  // primary mapping per contract
  if (st === "available") {
    const label = labelWithOverrides("purchase", payload, selectionCount > 1 ? "Get Tickets" : "Get Ticket");
    // Enabled if maxSelectable > 0; selection rules are app-specific
    const enabled = max > 0;
    return { kind: "purchase", label, enabled };
  }
  if (st === "approvalRequired") {
    const label = labelWithOverrides("request", payload, "Request to Join");
    return { kind: "request", label, enabled: true };
  }
  if (st === "outOfStock") {
    if (dc === "waitlist") {
      const label = labelWithOverrides("join_waitlist", payload, "Join Waitlist");
      return { kind: "join_waitlist", label, enabled: true };
    }
    // Optional extensions (not in primary mapping): backorder
    if (dc === "backorder" && item.product.capabilities.supportsBackorder) {
      const label = labelWithOverrides("backorder", payload, "Backorder");
      return { kind: "backorder", label, enabled: true };
    }
    return { kind: "none", label: "", enabled: false };
  }
  // Optional extension (not in primary mapping): notify me
  if ((st === "notOnSale" || st === "paused" || st === "windowEnded") && dc === "notifyMe") {
    const label = labelWithOverrides("notify_me", payload, "Notify Me");
    return { kind: "notify_me", label, enabled: true };
  }
  return { kind: "none", label: "", enabled: false };
}

function noticesFor(item: PanelItem, pres: RowViewModel["presentation"]): RowNotice[] {
  const st = item.commercial.status;
  const reasons = item.commercial.reasons ?? [];
  const reasonTexts = item.commercial.reasonTexts ?? {};
  const out: RowNotice[] = [];
  if (pres === "locked") {
    out.push({ icon: "info", title: "Requires Access Code", text: reasonTexts["requires_code"] || undefined });
    return out;
  }
  switch (st) {
    case "notOnSale":
      out.push({ icon: "info", title: "Not on Sale" });
      break;
    case "paused":
      out.push({ icon: "warning", title: "Sales Paused" });
      break;
    case "windowEnded":
      out.push({ icon: "info", title: "Sales Window Ended" });
      break;
    case "expired":
      out.push({ icon: "info", title: "Past Event" });
      break;
    case "outOfStock":
      out.push({ icon: "info", title: "Sold Out" });
      break;
    case "approvalRequired":
      out.push({ icon: "info", title: "Requires Approval" });
      break;
  }
  // Attach reasonTexts as meta if present
  for (const r of reasons) {
    if (reasonTexts[r]) out.push({ meta: reasonTexts[r] });
  }
  return out;
}

export function mapItemToRowVM(item: PanelItem, payload: ProductPanelPayload, selectionCount: number): RowViewModel {
  const satisfied = gatesSatisfied(item);
  const pres = rowPresentation(item, satisfied);
  const qUI = quantityUI(item, pres);
  const pUI = priceUI(item, pres);
  const cta = ctaFor(item, pres, payload, selectionCount);
  const notices = noticesFor(item, pres);

  return {
    key: `${item.product.id}/${item.variant.id}`,
    sectionId: item.display.sectionId,
    productId: item.product.id,
    variantId: item.variant.id,
    name: item.variant.name || item.product.name,

    presentation: pres,
    quantityUI: qUI,
    priceUI: pUI,

    lowInventory: item.display.lowInventory,
    badges: item.display.badges,

    maxSelectable: item.commercial.maxSelectable ?? 0,
    remainingInventory: item.commercial.remaining?.inventory,

    cta,
    notices,

    isGated: !satisfied,
    gatesVisible: pres === "locked",
    reasons: item.commercial.reasons ?? [],
  };
}
