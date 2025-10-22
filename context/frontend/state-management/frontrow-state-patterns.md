# Frontrow State Management Patterns

## Stack

- **Server data:** TanStack Query (simple fetching, caching, refetching)
- **Client state:** Jotai (atoms for cart, filters, UI state)
- **Derived state:** Jotai derived atoms (no useMemo needed)

## Why Not TanStack DB?

TanStack DB is reserved for **Backstage** where we need:

- Real-time admin updates
- Large tables (100+ rows)
- Complex server joins

For Frontrow e-commerce, Query + Jotai is simpler and sufficient.

## Patterns

### Fetching Server Data

```typescript
// TanStack Query for tickets
const { data: tickets } = useQuery({
  queryKey: ["tickets", eventId],
  queryFn: () => fetch(`/api/tickets/${eventId}`).then((r) => r.json()),
  refetchOnWindowFocus: true,
  staleTime: 20000,
});
```

### Client State (Cart, Filters)

```typescript
// Atoms (global state, no prop drilling)
const cartAtom = atomWithStorage("cart:v1", []);
const filtersAtom = atom({ showSoldOut: false });

// Use anywhere - read-only subscription
function Component() {
  const cart = useAtomValue(cartAtom);
  const filters = useAtomValue(filtersAtom);
}
```

### Derived State (No useMemo!)

```typescript
// Derived atom auto-tracks dependencies
const eventConfigAtom = atom(null);

const ticketUIStatesAtom = atom((get) => {
  const eventConfig = get(eventConfigAtom);
  if (!eventConfig) return [];

  const tickets = get(ticketsAtom);
  const cart = get(cartAtom);
  const filters = get(filtersAtom);

  return deriveTicketUI(tickets, cart, filters, eventConfig);
});

// Component (clean, no useMemo!)
function Component() {
  const uiStates = useAtomValue(ticketUIStatesAtom);
}
```

### Actions (Write-Only Derived Atoms)

```typescript
// IDIOMATIC: Write-only derived atoms for mutations
const incrementTicketAtom = atom(null, (get, set, ticketId: string) => {
  const cart = get(cartAtom);
  // mutation logic
  set(cartAtom, updatedCart);
});

// Component - no helper functions needed!
function Component() {
  const incrementTicket = useSetAtom(incrementTicketAtom);

  return <button onClick={() => incrementTicket(ticketId)}>Add</button>;
}
```

## Testing

Pure functions remain testable:

```typescript
describe("computeTicketUI", () => {
  it("enforces min quantity", () => {
    const rows = [{ ticket: groupTicket, qty: 2 }];
    const ui = computeTicketUI(rows, event, { hasItems: true });

    expect(ui[0].helperText).toBe("Min 4 required");
  });
});
```

## Migration Path to TanStack DB (Future)

When you need real-time sync:

```typescript
// Before (TanStack Query + Jotai)
const { data: tickets } = useQuery(["tickets", eventId], fetchTickets);

// After (TanStack DB)
const ticketsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["tickets", eventId],
    queryFn: fetchTickets,
  })
);
const { data: tickets } = useLiveQuery((q) =>
  q.from({ ticket: ticketsCollection })
);
```

The Jotai atoms can stay - they'll just read from TanStack DB collections instead of Query.
