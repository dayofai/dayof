
// src/state/atoms.ts
import { atom } from "jotai";
import { atomFamily } from "jotai/utils";
import { atomWithQuery } from "jotai-tanstack-query";
import { ProductPanelPayloadSchema, type ProductPanelPayload } from "../contract/schemas";
import type { RowViewModel } from "./types";

// ---- Fetch integration (TanStack Query via jotai-tanstack-query) ----
type Fetcher = (args: { eventId: string }) => Promise<unknown>;

// Inject your server function at runtime (TanStack Start: call /api route or server fn)
export const fetcherAtom = atom<Fetcher | null>(null);

// Query key derived from context
export const eventIdAtom = atom<string | null>(null);

export const productPanelQueryAtom = atomWithQuery<ProductPanelPayload>((get) => ({
  queryKey: ["productPanel", get(eventIdAtom)],
  queryFn: async () => {
    const eventId = get(eventIdAtom);
    const fetcher = get(fetcherAtom);
    if (!eventId || !fetcher) throw new Error("fetcher or eventId not set");
    const raw = await fetcher({ eventId });
    return ProductPanelPayloadSchema.parse(raw);
  },
  staleTime: 30_000,
}));

// Convenience split atoms
export const contextAtom = atom((get) => get(productPanelQueryAtom).context);
export const itemsAtom = atom((get) => get(productPanelQueryAtom).items);
export const sectionsAtom = atom((get) => get(productPanelQueryAtom).sections);
export const pricingAtom = atom((get) => get(productPanelQueryAtom).pricing);

// ---- Selection state (per product/variant) ----
// Key as "productId/variantId" to keep it unique and stable
export const selectionFamily = atomFamily(
  (key: string) =>
    atom(
      0,
      (get, set, nextQty: number) => {
        const items = get(itemsAtom);
        const item = items.find((it) => `${it.product.id}/${it.variant.id}` === key);
        const max = item?.commercial?.maxSelectable ?? 0;
        // Authoritative clamp: do not exceed server-provided maxSelectable
        const clamped = Math.max(0, Math.min(Math.floor(nextQty), max));
        set(selectionFamily(key), clamped);
      }
    ),
  Object.is
);

// Derived: total selected count across items (handy for label tweaks)
export const totalSelectedAtom = atom((get) => {
  const items = get(itemsAtom);
  return items.reduce((sum, it) => {
    const key = `${it.product.id}/${it.variant.id}`;
    return sum + (get(selectionFamily(key)) ?? 0);
  }, 0);
});

// ---- Per-item flows (families) for async UI (waitlist/request/purchase) ----
export type Flow =
  | { tag: "idle" }
  | { tag: "submitting" }
  | { tag: "success"; ref?: string }
  | { tag: "error"; message: string };

export const waitlistFlowFamily = atomFamily((_key: string) => atom<Flow>({ tag: "idle" }));
export const requestFlowFamily = atomFamily((_key: string) => atom<Flow>({ tag: "idle" }));
export const purchaseFlowFamily = atomFamily((_key: string) => atom<Flow>({ tag: "idle" }));

// Commands are application-specific; wire to your server functions in your app layer.
// This scaffold keeps commands out so the state/selector stays portable and testable.
