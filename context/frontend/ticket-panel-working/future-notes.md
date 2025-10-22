# Ticket Panel – Future Notes (SSR-Query, Inference, Preferences)

This note preserves integration decisions and options for the ticket panel, including SSR-Query wiring, server-side pricing inference (no cart persistence), a Preference Service strategy, and manual validation guidance.

## SSR-Query Integration (Integration Wrap + Server Inference)

- Router wiring: `apps/frontrow/src/router.tsx`
  - Fresh `QueryClient` per SSR request
  - `setupRouterSsrQueryIntegration({ router, queryClient })`
  - Client: hydrate Jotai default store with `queryClient` by setting `queryClientAtom`
- Tickets: `apps/frontrow/src/lib/queries/tickets.ts` → `ticketsQuery(eventId)`
- Pricing: `apps/frontrow/src/lib/queries/pricing.ts` → `pricingQuery({ eventId, items })`
- Inference (no cart persistence): `apps/frontrow/src/lib/utils/inferInitialSelection.ts`
  - Returns `{ items: [{ ticketId, qty }] } | undefined` based on: single available ticket, explicit defaults, or query params

### Route behavior

- Playground `apps/frontrow/src/routes/ticket-playground.tsx`
  - `ssr: false` (fast dev); loader still `ensureQueryData(ticketsQuery('evt_123'))`
- Event route `apps/frontrow/src/routes/event.$eventName.tsx`
  - `ensureQueryData(ticketsQuery(eventId))`
  - Infer items; if present, prefetch pricing:
    - Blocking: `ensureQueryData(pricingQuery({ eventId, items }))` for immediate totals
    - Streaming: `fetchQuery(pricingQuery(...))` for faster first paint

### Consumption in UI state

- `apps/frontrow/src/lib/atoms/tickets.ts`: `ticketsAtom` reads from Query cache (`getQueryData(['tickets', eventId])`)
- `apps/frontrow/src/lib/atoms/ticket-ui-states.ts`: derives per-ticket UI from tickets + cart + filters (no prop drilling)

### Acceptance snapshot

- Fresh `QueryClient` per SSR request; no data leaks
- Tickets render on first paint without a client waterfall (SSR route)
- Pricing shows immediately when inference applies; otherwise streams client-side
- No cart persistence; client cart remains the source of truth

### Notes

- Pick blocking vs streaming per route/UX
- Keep inference conservative (only obvious defaults)
- Validate SSR on `/event/<name>`; playground remains `ssr: false`

## Preference Service (separate from DB)

Some UI/style/config preferences may come from a backend Preference Service instead of the DB. Treat as a separate server-owned source and merge with event defaults.

### Query options (Preferences)

```ts
// apps/frontrow/src/lib/queries/preferences.ts
import { queryOptions } from "@tanstack/react-query";

export type Preferences = {
  ui?: {
    showHeader?: boolean;
    ctaVariant?: "neutral" | "accented";
    footnote?: string;
    showPricingBreakdown?: boolean;
    featuredBadgeVariant?: "css" | "none";
    showInfoOnHoverOnly?: boolean;
    density?: "compact" | "comfortable";
  };
  theme?: { brand?: string };
};

export const preferencesQuery = (args: { userId: string; eventId: string }) =>
  queryOptions({
    queryKey: ["preferences", args.userId, args.eventId],
    queryFn: async (): Promise<Preferences> => {
      const res = await fetch(`/api/preferences?eventId=${args.eventId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Preferences request failed");
      return res.json();
    },
    staleTime: 60_000,
    retry: false,
  });
```

### Merge defaults + preferences (derived atom)

```ts
// apps/frontrow/src/lib/atoms/event-config.ts (example)
import { atom } from "jotai";
import { queryClientAtom } from "jotai-tanstack-query";
import type { Preferences } from "@/lib/queries/preferences";

export const eventDefaultsAtom = atom((get) => ({
  currency: "USD",
  timeZone: "UTC",
  ui: { showHeader: true, ctaVariant: "accented", showPricingBreakdown: true },
}));

export const preferencesAtom = atom((get) => {
  const qc = get(queryClientAtom);
  const userId = "anon"; // from auth/session
  const eventId = "evt_123"; // from route
  return qc.getQueryData<Preferences>(["preferences", userId, eventId]);
});

export const resolvedEventConfigAtom = atom((get) => {
  const defaults = get(eventDefaultsAtom);
  const prefs = get(preferencesAtom);
  return {
    ...defaults,
    ui: { ...defaults.ui, ...(prefs?.ui ?? {}) },
    theme: prefs?.theme ?? undefined,
  };
});
```

### Loader prefetch example (SSR route)

```ts
loader: async ({ context, params }) => {
  const eventId = params.eventName;
  const userId = "anon";
  await context.queryClient.ensureQueryData(ticketsQuery(eventId));
  // Block if prefs are critical to first paint; otherwise use fetchQuery to stream
  await context.queryClient.ensureQueryData(
    preferencesQuery({ userId, eventId })
  );
  // Pricing inference as needed (see pricing section above)
};
```

### Keys, caching, security

- Keys include `userId` + `eventId` to avoid cross-user cache leaks
- Always fetch preferences via server/BFF (forward auth); never expose service tokens client-side
- Sensible `staleTime`/`retry`; fall back to event defaults if the service is down

## Manual Validation (until automated tests)

- Playground (`/ticket-playground`): SSR off; tickets cache prefilled; fast iteration
- SSR route (`/event/<name>`):
  - Tickets visible on first paint (no client waterfall)
  - Pricing immediate with inference, otherwise streams
  - Preferences merged into resolved config

## Backlog / Enhancements

- Optional streaming for pricing on SSR: switch `ensureQueryData` → `fetchQuery`
- Sticky `CartFooter` with backdrop blur
- `density = 'comfortable'` (Apple HIG ≥ 44×44 pt) for touch targets
- Move pricing to Start server functions (type-safe, faster)
- Add SSR/component tests per `context/ticket-panel-state/test-plan.md` when we resume tests

## Related Files

- Router: `apps/frontrow/src/router.tsx`
- Tickets query: `apps/frontrow/src/lib/queries/tickets.ts`
- Pricing query: `apps/frontrow/src/lib/queries/pricing.ts`
- Inference: `apps/frontrow/src/lib/utils/inferInitialSelection.ts`
- Tickets atom: `apps/frontrow/src/lib/atoms/tickets.ts`
- UI state: `apps/frontrow/src/lib/atoms/ticket-ui-states.ts`
- Playground route: `apps/frontrow/src/routes/ticket-playground.tsx`
- Event route: `apps/frontrow/src/routes/event.$eventName.tsx`
- Test plan: `context/ticket-panel-state/test-plan.md`
