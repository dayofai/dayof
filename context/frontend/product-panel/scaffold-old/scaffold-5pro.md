Jon — here’s a **contract‑first** scaffold that matches your **ProductPanel Payload v0.2** and your runtime stack (Jotai + ts‑pattern + zod v4 + TanStack Query). It treats the UI as a **pure projection** of server data. No recomputation of status, demand capture, or clamps.

---

## Downloads

**Full scaffold folder:** `/mnt/data/productpanel/src`

Open individual files:

- **Contract & types**

  - [src/contract/schemas.ts](sandbox:/mnt/data/productpanel/src/contract/schemas.ts)

- **State & selectors**

  - [src/state/atoms.ts](sandbox:/mnt/data/productpanel/src/state/atoms.ts) — Jotai + `atomWithQuery`, selection family
  - [src/utils/mapping.ts](sandbox:/mnt/data/productpanel/src/utils/mapping.ts) — payload → RowViewModel mapping
  - [src/state/selectors.ts](sandbox:/mnt/data/productpanel/src/state/selectors.ts) — section grouping, prefs, rollups
  - [src/state/types.ts](sandbox:/mnt/data/productpanel/src/state/types.ts)

- **Fixtures & README**

  - [src/state/fixtures.ts](sandbox:/mnt/data/productpanel/src/state/fixtures.ts) — example payloads
  - [src/components/ProductPanel.tsx](sandbox:/mnt/data/productpanel/src/components/ProductPanel.tsx) — minimal presentational example
  - [src/README.md](sandbox:/mnt/data/productpanel/src/README.md)

---

## What it implements (aligned with your contract)

- **zod v4 schemas** for the entire payload: context/effectivePrefs, sections, items (product/variant/commercial/gates/relations/display/uiHints), pricing footer.
- **TanStack Query integration** via `atomWithQuery` (`jotai-tanstack-query`): supply a `fetcherAtom` and `eventIdAtom`, done.
- **Selection per row** (`productId/variantId`) via `atomFamily`, **clamped only** by server‐provided `commercial.maxSelectable`.
- **Mapping** from `PanelItem` → `RowViewModel`:

  - `presentation`: `normal | locked | suppressed` (gates + visibilityWhenGated)
  - `quantityUI`: `hidden | select | stepper` (driven by `maxSelectable`)
  - `priceUI`: `hidden | shown | masked` (masked when locked)
  - `cta`: contract table (`purchase`, `request`, `join_waitlist`, `none`) + optional `notify_me`, `backorder` (off by default—you can keep them)
  - `notices`: from `commercial.status` + `reasons/reasonTexts`

- **PanelViewModel** groups rows by sections, honors `effectivePrefs.showTypeListWhenSoldOut` → `panelMode: 'compactWaitlistOnly' | 'full'`.
- **Pricing footer** is rendered verbatim when `pricing.showPriceSummary` is true; **no math in the panel**.

---

## How to wire it (TanStack Start / server functions)

1. **Provide a fetcher** that returns the **exact** contract JSON:

```ts
// Your server function or API route
async function fetchProductPanel({ eventId }: { eventId: string }) {
  const res = await fetch(
    `/api/product-panel?eventId=${encodeURIComponent(eventId)}`
  );
  return await res.json();
}
```

2. **Inject it into atoms**:

```tsx
import { useSetAtom } from "jotai";
import { fetcherAtom, eventIdAtom } from "./state/atoms";

function Page() {
  const setFetcher = useSetAtom(fetcherAtom);
  const setEventId = useSetAtom(eventIdAtom);

  React.useEffect(() => {
    setFetcher(() => fetchProductPanel);
    setEventId("evt_123");
  }, []);

  return <ProductPanel />; // purely presentational
}
```

3. **Render** `ProductPanel`. It reads `panelViewModelAtom` and shows sections/rows based on the payload.

---

## Notes / Gotchas handled

- **Gates precedence**: unmet + `visibilityWhenGated:'visible'` → **locked** row with AccessCodeCTA; `'hidden'` → suppressed.
- **Authoritative clamps**: UI never recomputes; it only respects `maxSelectable`.
- **Low inventory**: server computes via `effectivePrefs.displayRemainingThreshold`.
- **Waitlist-only mode**: if everything is outOfStock and `effectivePrefs.showTypeListWhenSoldOut === false`, the panel collapses to a simple waitlist presentation.
- **Add‑ons**: `display.placement: 'children'` renders near parent; `relations.requires` is declared (you can gray out the row if parent requirement isn’t met).

---

## Extra states supported (beyond FigJam)

- `notOnSale`, `paused`, `windowEnded` → mapped to notices; CTA `none`.
- Optional demand capture variants:

  - `notify_me` for not-on-sale windows
  - `backorder` for physical goods

If you don’t want those yet, remove the branches in `mapping.ts`.

---

## Next steps (fast wins)

- Add a **Storybook** harness that renders the `fixtures.ts` payload through `panelViewModelAtom`.
- Wire the **AccessCodeCTA** and per-row flow atoms (`waitlist/request/purchase`) using your server functions.
- If you want row dependency UX (add‑on requires GA), gray the row and add a small meta notice in `mapItemToRowVM`.

If you want, I can zip this scaffold or generate a Storybook stories file that iterates through `fxAvailableAndSoldOut` and a couple additional payloads to sanity-check all branches.
