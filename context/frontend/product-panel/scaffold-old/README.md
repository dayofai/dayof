
# ProductPanel Scaffold (Jotai + ts-pattern + zod v4 + TanStack Query)

Contract-first implementation for the **ProductPanel Payload v0.2**. The UI is a pure projection of server data.

## Structure

- `src/contract/schemas.ts` — zod schemas & TS types matching the contract (context, sections, items, pricing).
- `src/state/atoms.ts` — Jotai atoms, TanStack Query integration (`atomWithQuery`), selection family.
- `src/utils/mapping.ts` — mapping from a `PanelItem` to a `RowViewModel` (presentation, CTA, notices).
- `src/state/selectors.ts` — `panelViewModelAtom` groups rows by sections, applies prefs (e.g., compactWaitlistOnly).
- `src/state/types.ts` — view-model types.
- `src/state/fixtures.ts` — example payloads for storybooks/tests.
- `src/components/ProductPanel.tsx` — minimal presentational example.

## Key points

- **Authoritative server fields** are not recomputed: `commercial.status`, `demandCapture`, `maxSelectable`, schedules, reasons.
- **Gates** obey `requirements` with `logic:'all'|'any'`; unmet + `visibilityWhenGated:'visible'` → **locked** row; `'hidden'` → suppressed.
- **CTAs** follow the contract mapping; optional support for `notify_me` and `backorder` is included but can be disabled.
- **EffectivePrefs** drive minor presentation choices (low-inventory, fees note, waitlist-only panel).

## Using with TanStack Query + Jotai

```ts
import { Provider, useSetAtom } from "jotai";
import { fetcherAtom, eventIdAtom, productPanelQueryAtom } from "./state/atoms";
import { ProductPanel } from "./components/ProductPanel";

// Your server function (TanStack Start) calling an API/loader
async function fetchProductPanel({ eventId }: { eventId: string }) {
  const res = await fetch(`/api/product-panel?eventId=${encodeURIComponent(eventId)}`);
  return await res.json();
}

function Page() {
  const setFetcher = useSetAtom(fetcherAtom);
  const setEventId = useSetAtom(eventIdAtom);

  React.useEffect(() => {
    setFetcher(() => fetchProductPanel);
    setEventId("evt_123");
  }, []);

  // productPanelQueryAtom can be used to gate loading UI if needed
  return <ProductPanel />;
}
```

## Notes / Extension points

- **notifyMe** and **backorder** are supported but not part of the primary mapping table — keep them behind flags until productized.
- **Dependencies** (`relations.requires`) are declared; enforcement should be done upstream. You can gray out row UIs in `mapItemToRowVM` based on current selection if desired.
- **Selection** is per row (key = `productId/variantId`); clamps to `maxSelectable` with no additional math.

## Tests

- Validate payloads with `ProductPanelPayloadSchema.parse()`.
- Snapshot `panelViewModelAtom` for fixtures representing each status/demandCapture/gates combination.
