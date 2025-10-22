<!-- 24cde2cd-82da-44d1-ab77-95dc21075a70 085d417e-1e14-4cfc-a52a-4e8cc6d9f2b3 -->
# TanStack Start SSR-Query Integration Plan

## Context

- Pricing query: The pricing query is our client-only calculation of cart totals. In code it’s `pricingQueryAtom` (apps/frontrow/src/lib/atoms/pricing.ts) which calls `calculateCartTotal({ eventId, items })` and automatically refetches when `cartAtom` changes. It intentionally runs on the client (cart lives client-side), so we won’t move it to SSR in this pass.
- Goal: Integrate `@tanstack/react-router-ssr-query` to prefetch server-owned data (e.g., tickets) in route loaders and hydrate it automatically. Pricing remains client-only.

## Integration Choice

- **Use integration wrap (recommended)**: Call `setupRouterSsrQueryIntegration({ router, queryClient })` and let it wrap the router with `QueryClientProvider`. Simpler, less boilerplate, first-class SSR dehydration/hydration/streaming. We will keep the Jotai default-store hydration step (`store.set(queryClientAtom, queryClient)`) unchanged.
- Manual wrap is possible (`wrapQueryClient:false`), but adds duplication and is easier to misconfigure.

## Implementation Steps

### Phase 1 — Install & Wire Integration

1. Add dependency: `@tanstack/react-router-ssr-query`.
2. Update `apps/frontrow/src/router.tsx`:

- Create `queryClient` per request (already present).
- Create router with `context:{ queryClient }` (already present).
- Call `setupRouterSsrQueryIntegration({ router, queryClient })`.
- Remove manual `Wrap` if using integration’s provider (preferred). Keep Jotai default store hydration (`queryClientAtom`) on client.

### Phase 2 — Tickets Query (Server Data) with Loader Prefetch

1. Create `apps/frontrow/src/lib/queries/tickets.ts`:

- `ticketsQuery = queryOptions({ queryKey: ['tickets', eventId], queryFn: () => fetchTickets(eventId) })`.

2. Update the event route (or the playground route) loader to prefetch:

- `loader: ({ context, params }) => context.queryClient.ensureQueryData(ticketsQuery(params.eventId))`.

3. Expose tickets to atoms without prop drilling:

- Create `ticketsCacheAtom` (derived) that reads from `queryClientAtom` + `getQueryData(ticketsQuery.key)`.
- Update `ticketsAtom` (or consumers) to read from `ticketsCacheAtom`.
- `ticketUIStatesAtom` continues to derive UI from `ticketsAtom` + `cartAtom` + filters.
- Result: On SSR, tickets are ensured in the cache → available immediately on hydration; no waterfalls or spinners.

### Phase 3 — (Optional) Streaming Queries

- Where appropriate, start queries server-side without blocking SSR:
- `loader: ({ context, params }) => { context.queryClient.fetchQuery(userQuery(params.id)) }`.
- Use for low-priority server data that doesn’t need to block first paint.

### Phase 4 — Keep Pricing Client-Only (Current Behavior)

- Keep `pricingQueryAtom` bound to `cartAtom` (client) with `atomWithQuery`.
- If/when we persist cart to a cookie, optionally prefetch pricing on the server (see below), or kick it off as a streamed query.

### Phase 5 — Persist Cart (Optional, Future)

- Write cart snapshot to a cookie (`frontrow:ticket-cart`) on each change.
- Loader can read cookie and prefetch pricing on SSR:
- Benefit: First paint shows totals immediately; CTA state is correct (no flash of disabled/enabled).
- Caveat: Treat cookie as untrusted input; validate server-side.
- Alternative: Use streaming fetchQuery in loader to start pricing on the server without delaying initial HTML.

### Phase 6 — Tests & Docs

- Tests:
- Router integration: smoke test that loader-prefetched tickets are visible immediately (no loading state in TicketList).
- Atoms: `ticketsCacheAtom` returns data from Query cache when loader prefetched.
- Docs:
- Add a section to `context/ticket-panel-state/README.md` describing SSR-Query integration and where tickets query lives.
- Note pricing remains client-only; outline cookie-based prefetch as an enhancement.

## Acceptance Criteria

- `setupRouterSsrQueryIntegration` is wired; router builds in dev/SSR without manual provider wrap.
- Tickets are pre-fetched in the route loader with `ensureQueryData` and available instantly on hydration in TicketList without client fetch.
- Jotai atoms (`ticketsAtom` or `ticketsCacheAtom`) read tickets from the Query cache (no prop drilling).
- Pricing behavior unchanged (client-only), documented. Optional future: cookie-based SSR prefetch.

## Risks & Mitigations

- Query cache read before loader prefetch (empty): ensure route with loader is the one rendering the panel.
- React 19 SSR + Jotai: keep using the default-store hydration (already working) — this plan doesn’t reintroduce Provider SSR issues.

## Notes

- This plan focuses on tickets (server-owned) first. Pricing remains client-only by design; persisting cart enables SSR-prefetch or streaming later.

### To-dos

- [ ] Add @tanstack/react-router-ssr-query and wire setupRouterSsrQueryIntegration in router.tsx
- [ ] Create tickets queryOptions and fetching util
- [ ] Prefetch tickets in event/playground route loader with ensureQueryData
- [ ] Add ticketsCacheAtom reading from Query cache; plug Ticket UI derivation into it
- [ ] Optionally kick off non-blocking server queries via loader fetchQuery
- [ ] Draft cookie-based cart persistence strategy enabling SSR pricing prefetch
- [ ] Add tests for loader-prefetched tickets visible without client fetch
- [ ] Document SSR-Query integration, tickets query location, and pricing policy