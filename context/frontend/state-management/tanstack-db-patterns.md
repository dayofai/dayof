# TanStack DB Patterns and Best Practices

> **Scope:** These patterns apply to **Backstage** (admin dashboard) where TanStack DB's power is justified. For **Frontrow** (e-commerce), we use TanStack Query + Jotai for simplicity.

## When to Use TanStack DB

**Use TanStack DB when you have:**

- Real-time sync requirements (ElectricSQL, WebSocket)
- Large tables (100+ rows where differential dataflow matters)
- Complex server-side joins on the client (events + tickets + attendees + orders)
- Multi-user collaboration (admins seeing same live data)

**Examples:** Backstage admin dashboard, real-time analytics, collaborative tools

**Don't use TanStack DB when you have:**

- Simple data fetching (6-12 items)
- Client-only state (cart, UI filters)
- No real-time sync needs
- Team prefers simpler mental models

**Examples:** Frontrow ticket selection, simple product pages, forms

## Frontrow: Query + Jotai Pattern

For the e-commerce frontend, we use a simpler stack:

```typescript
// Server data - TanStack Query
const { data: tickets } = useQuery({
  queryKey: ["tickets", eventId],
  queryFn: () => fetch(`/api/tickets/${eventId}`).then((r) => r.json()),
});

// Client state - Jotai
const cartAtom = atomWithStorage<CartItem[]>("cart:v1", []);
const filtersAtom = atom({ showSoldOut: false, categoryFilter: null });

// Derived state - Jotai
const ticketUIStatesAtom = atom((get) => {
  const ticketsData = tickets ?? [];
  const cart = get(cartAtom);
  const filters = get(filtersAtom);

  return deriveTicketUI(ticketsData, cart, filters, event);
});
```

**Migration path:** When Frontrow needs real-time sync, swap `useQuery` → `createCollection(queryCollectionOptions(...))`. The rest stays the same.

## Why We Use TanStack DB (Backstage)

TanStack DB is our **reactive state and data layer** for the frontend. It's not just a data fetcher - it's a fine-grained reactive system that provides:

1. **Differential Dataflow**: When data changes, only affected computations recompute (not everything)
2. **Automatic Reactivity**: No manual dependency tracking with useMemo/useEffect
3. **Cross-Collection Queries**: Join and aggregate data from multiple sources with SQL-like syntax
4. **Optimistic Mutations**: Instant UI updates with automatic rollback on errors
5. **Unified Data Model**: Same API for server data, local storage, and ephemeral UI state

### The Problem We're Solving

Traditional React state management requires:

- Manual `useMemo` with dependency arrays (easy to get wrong)
- Manual cache invalidation and synchronization
- Separate systems for server data, local storage, and UI state
- Full recomputation when any dependency changes

TanStack DB eliminates these problems through reactive queries and collections.

## Core Concepts

### Collections

Collections are typed sets of objects. Three main types:

1. **QueryCollection** - Server data fetched via TanStack Query
2. **LocalStorageCollection** - Persistent local data (cart, preferences)
3. **LocalOnlyCollection** - Ephemeral UI state (form data, UI flags, filters)

```typescript
// Server data
const ticketsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["tickets", eventId],
    queryFn: async () => fetch("/api/tickets").then((r) => r.json()),
    getKey: (ticket) => ticket.id,
    schema: ticketSchema,
  })
);

// Persistent local data
const cartCollection = createCollection(
  localStorageCollectionOptions({
    id: "cart",
    storageKey: "app:cart:v1",
    getKey: (item) => item.id,
    schema: cartItemSchema,
  })
);

// Ephemeral UI state (filters, sort, pagination)
const ticketFiltersCollection = createCollection(
  localOnlyCollectionOptions({
    id: "ticket-filters",
    getKey: (filter) => filter.id,
    schema: ticketFiltersSchema,
    initialData: [
      {
        id: "main",
        showSoldOut: false,
        sortBy: "sortOrder",
        categoryFilter: null,
        priceRange: { min: null, max: null },
        searchQuery: "",
      },
    ],
  })
);
```

## The Three-Collection Pattern

**Pattern:** Define a domain Collection backed by TanStack Query for server data, and a Local Collection for shareable UI state that influences rendering (filters, pagination, multi-select) so both can be joined reactively in the client.

Use a live query that reads from both Collections and returns the view model the component needs; subscribe once in the component so updates flow via incremental recomputation without re-render cascades.

**Architecture:**

1. **Domain Collection** (QueryCollection) - Server data (tickets, events, users)
2. **User Data Collection** (LocalStorageCollection) - Persistent user state (cart, preferences)
3. **UI Controls Collection** (LocalOnlyCollection) - Ephemeral UI state (filters, sort, pagination, search)

**Example - Tickets Panel:**

```typescript
// 1. Domain: Server tickets data
const ticketsCollection = createCollection(queryCollectionOptions({
  queryKey: ['tickets', eventId],
  queryFn: () => fetch('/api/tickets').then(r => r.json()),
  getKey: (ticket) => ticket.id,
  schema: ticketSchema,
}));

// 2. User Data: Persistent cart
const cartCollection = createCollection(localStorageCollectionOptions({
  id: 'cart',
  storageKey: 'frontrow:ticket-cart:v1',
  getKey: (item) => item.ticketId,
  schema: cartItemSchema,
}));

// 3. UI Controls: Filters and sort preferences
const ticketFiltersCollection = createCollection(localOnlyCollectionOptions({
  id: 'ticket-filters',
  getKey: (filter) => filter.id,
  initialData: [{
    id: 'main',
    showSoldOut: false,
    sortBy: 'sortOrder',
    categoryFilter: null,
    priceRange: { min: null, max: null },
    searchQuery: '',
  }],
}));

// Join all three to produce the view model
const { data: ticketUIStates } = useLiveQuery((q) =>
  q
    .from({ ticket: ticketsCollection })
    .leftJoin({ cart: cartCollection }, ({ ticket, cart }) =>
      eq(ticket.id, cart.ticketId)
    )
    .leftJoin({ filter: ticketFiltersCollection }, () => eq(1, 1)) // Singleton cross join
    .where(({ ticket, filter }) =>
      and(
        ne(ticket.visibility, 'hidden'),
        // Filter by sold out toggle
        filter.showSoldOut || ne(ticket.status, 'sold_out'),
        // Filter by category (if selected)
        !filter.categoryFilter || eq(ticket.category, filter.categoryFilter),
        // Filter by price range (if set)
        !filter.priceRange.min || gte(ticket.pricing.ticket.amount, filter.priceRange.min),
        !filter.priceRange.max || lte(ticket.pricing.ticket.amount, filter.priceRange.max),
        // Text search (if present)
        !filter.searchQuery || ilike(ticket.name, `%${filter.searchQuery}%`)
      )
    )
    .fn.select((row) => {
      // Complex UI state derivation
      const ticket = row.ticket;
      const cart = row.cart;
      const filter = row.filter;

      // ... validation logic

      return { ticketId, isPurchasable, helperText, ... };
    })
    .orderBy(({ ticket, filter }) =>
      // Dynamic sort based on filter
      filter.sortBy === 'price'
        ? ticket.pricing.ticket.amount
        : coalesce(ticket.sortOrder, 999)
    )
);
```

**Benefits:**

- Filter changes instantly update the ticket list
- No prop drilling - filters live in collection
- TanStack Form can write directly to collection
- Sorting, filtering, search all reactive
- Single query subscription - no cascading re-renders

**Integration with TanStack Form:**

```typescript
// Filter form updates the collection directly
const form = useForm({
  defaultValues: ticketFiltersCollection.get("main"),
  onSubmit: (values) => {
    ticketFiltersCollection.update("main", (draft) => {
      draft.showSoldOut = values.showSoldOut;
      draft.categoryFilter = values.categoryFilter;
      // ... more fields
    });
    // Query automatically recomputes and UI updates
  },
});
```

### Live Queries

Live queries are reactive: when underlying data changes, results update automatically via differential dataflow.

```typescript
const { data: activeUsers } = useLiveQuery((q) =>
  q
    .from({ user: usersCollection })
    .where(({ user }) => eq(user.active, true))
    .select(({ user }) => ({
      id: user.id,
      name: user.name,
    }))
);
```

## Idiomatic Patterns

### Pattern 1: All Derived State in Queries (NOT useMemo)

**WRONG:**

```typescript
// ❌ Manual React computation
const cartState = React.useMemo(() => {
  if (!cartItems) return { totalQty: 0, hasItems: false };
  const totalQty = cartItems.reduce((sum, item) => sum + item.qty, 0);
  return { totalQty, hasItems: cartItems.length > 0 };
}, [cartItems]);
```

**RIGHT:**

```typescript
// ✅ TanStack DB aggregate query
const {
  data: [cartState],
} = useLiveQuery((q) =>
  q.from({ cart: cartCollection }).select(({ cart }) => ({
    totalQty: sum(cart.qty),
    hasItems: gt(count(cart.ticketId), 0),
  }))
);
```

### Pattern 2: Use .fn.select() for Complex Logic

When validation has complex JavaScript logic (string formatting, conditionals, date math), use `.fn.select()`:

```typescript
const { data: userProfiles } = useLiveQuery((q) =>
  q.from({ user: usersCollection }).fn.select((row) => {
    // Full JavaScript with conditionals, string formatting, etc.
    const user = row.user;
    let status = "pending";
    if (user.verified && user.active) {
      status = "active";
    } else if (user.banned) {
      status = "banned";
    }

    return {
      userId: user.id,
      displayName: `${user.firstName} ${user.lastName}`,
      status,
      joinedRecently:
        Date.now() - new Date(user.createdAt).getTime() < 86400000,
    };
  })
);
```

### Pattern 3: Reusable Predicates with Ref<T>

Extract simple predicates as reusable functions:

```typescript
import type { Ref } from "@tanstack/react-db";

const isActiveUser = (user: Ref<User>) => eq(user.active, true);
const isAdultUser = (user: Ref<User>) => gt(user.age, 18);

// Use in queries
const { data: users } = useLiveQuery((q) =>
  q
    .from({ user: usersCollection })
    .where(({ user }) => and(isActiveUser(user), isAdultUser(user)))
);
```

### Pattern 4: Aggregate Queries for Validation

Use aggregate queries to compute validation state:

```typescript
// Check if any items violate a constraint
const {
  data: [validation],
} = useLiveQuery((q) =>
  q
    .from({ item: itemsCollection })
    .where(({ item }) => gt(item.qty, item.maxQty))
    .select(() => ({ hasViolations: gt(count(), 0) }))
);

// Disable button based on validation
<button disabled={validation?.hasViolations}>Submit</button>;
```

### Pattern 5: Cross-Collection Joins

Query across multiple collections:

```typescript
const { data: userPosts } = useLiveQuery((q) =>
  q
    .from({ user: usersCollection })
    .join({ post: postsCollection }, ({ user, post }) =>
      eq(user.id, post.userId)
    )
    .where(({ user }) => eq(user.active, true))
    .select(({ user, post }) => ({
      userName: user.name,
      postTitle: post.title,
      postDate: post.createdAt,
    }))
);
```

## What We Gain

### 1. Differential Dataflow (Performance)

When one item changes, only that item's derivations recompute:

```typescript
// Update one cart item
cartCollection.update("item-1", (draft) => {
  draft.qty += 1;
});

// Result: Only item-1's UI state recomputes
// Other 99 items: no recomputation needed
```

With `useMemo`, the entire array would recompute.

### 2. No Manual Dependencies

```typescript
// ❌ useMemo: Manual dependency tracking (easy to miss)
const result = React.useMemo(() => compute(a, b, c), [a, b, c]);

// ✅ TanStack DB: Automatic dependency tracking
const { data: result } = useLiveQuery((q) =>
  q.from({ data: collection }).select(...)
);
```

### 3. Optimistic Updates

```typescript
// Update is instant, rollback is automatic on error
todoCollection.update(id, (draft) => {
  draft.completed = true;
});
// UI updates immediately
// Server sync happens in background
// Auto-rollback if server rejects
```

### 4. Cross-Tab Sync

LocalStorageCollections sync across browser tabs automatically:

```typescript
// Tab 1: Add to cart
cartCollection.insert({ id: "1", qty: 1 });

// Tab 2: Cart updates automatically (no code needed)
```

## When to Use What

### Use Standard Query Syntax

For simple comparisons and transformations:

```typescript
.where(({ user }) => eq(user.active, true))
.select(({ user }) => ({ id: user.id, name: user.name }))
```

### Use .fn.select() / .fn.where()

For complex JavaScript logic:

- String interpolation: `Max ${limit} per order`
- Complex conditionals with multiple branches
- Date formatting with timezones
- Priority-based logic (if A then X, else if B then Y, else Z)

### Use Ref<T> Predicates

For reusable simple predicates:

```typescript
const isActiveUser = (user: Ref<User>) => eq(user.active, true);
```

## Anti-Patterns to Avoid

### ❌ Don't Use useMemo for Derived State

```typescript
// ❌ WRONG
const { data: items } = useLiveQuery(...);
const total = React.useMemo(() =>
  items.reduce((sum, item) => sum + item.price, 0),
  [items]
);

// ✅ RIGHT - Compute in the query
const { data: [totals] } = useLiveQuery((q) =>
  q.from({ item: itemsCollection })
   .select(({ item }) => ({ total: sum(item.price) }))
);
```

### ❌ Don't Manually Track Dependencies

```typescript
// ❌ WRONG
const [cartItems, setCartItems] = useState([]);
const [tickets, setTickets] = useState([]);
// Manually sync states... complex and error-prone

// ✅ RIGHT - Use collections and queries
const { data: cartItems } = useLiveQuery((q) =>
  q.from({ cart: cartCollection })
);
const { data: tickets } = useLiveQuery((q) =>
  q.from({ ticket: ticketsCollection })
);
```

### ❌ Don't Mix Patterns

```typescript
// ❌ WRONG - Half TanStack DB, half manual
const { data: items } = useLiveQuery(...);
const filtered = React.useMemo(() =>
  items.filter(item => item.active),
  [items]
);

// ✅ RIGHT - All in query
const { data: items } = useLiveQuery((q) =>
  q.from({ item: itemsCollection })
   .where(({ item }) => eq(item.active, true))
);
```

## Testing Strategy

### Test Reusable Predicates

Ref<T> predicates are pure functions - test them directly:

```typescript
describe("isActiveUser", () => {
  it("returns true for active users", () => {
    const user = { active: true } as Ref<User>;
    expect(isActiveUser(user)).toBe(true);
  });
});
```

### Integration Tests for Queries

Test full query behavior with actual collections:

```typescript
it("filters items reactively", async () => {
  const collection = createCollection(
    localOnlyCollectionOptions({
      id: "test",
      getKey: (item) => item.id,
    })
  );

  collection.insert({ id: "1", active: true });
  collection.insert({ id: "2", active: false });

  const { result } = renderHook(() =>
    useLiveQuery((q) =>
      q.from({ item: collection }).where(({ item }) => eq(item.active, true))
    )
  );

  expect(result.current.data).toHaveLength(1);
});
```

## Key Learnings

### 1. .fn.select() Is Idiomatic for Complex Logic

From TanStack DB docs: "Use functional variants when you need complex JavaScript logic that can't be expressed with built-in functions."

This is NOT a fallback or escape hatch - it's the intended way to handle:

- String formatting with template literals
- Complex conditional logic (10+ branches)
- Date manipulation and formatting
- Custom business logic

### 2. Collections Are Not Just for Server Data

Use collections for ALL state:

- Server data → QueryCollection
- Persistent local → LocalStorageCollection
- UI state → LocalOnlyCollection

### 3. Queries Return Collections

Every query result is itself a collection, enabling chained queries:

```typescript
const activeUsers = createLiveQueryCollection((q) =>
  q.from({ user: usersCollection })
   .where(({ user }) => eq(user.active, true))
);

// Use the result in another query
const userPosts = createLiveQueryCollection((q) =>
  q.from({ user: activeUsers }) // Query a query result!
   .join({ post: postsCollection }, ...)
);
```

### 4. Performance Comes from Differential Dataflow

The optimization isn't about avoiding React renders - it's about:

- Only recomputing affected rows when data changes
- Incremental updates propagating through query pipelines
- No need to process unchanged data

## Migration Checklist

When refactoring to idiomatic TanStack DB:

- [ ] Replace all `useMemo` for derived state with live queries
- [ ] Move aggregations to TanStack DB queries (sum, count, etc.)
- [ ] Use `.fn.select()` for complex validation/formatting logic
- [ ] Extract reusable predicates as `Ref<T>` functions
- [ ] Remove manual dependency arrays
- [ ] Update tests to test queries, not pure functions
- [ ] Verify differential dataflow with React DevTools Profiler

## Reference Links

- [TanStack DB Overview](https://tanstack.com/db/latest/docs/overview)
- [Live Queries Guide](https://tanstack.com/db/latest/docs/guides/live-queries)
- [Functional Variants](https://tanstack.com/db/latest/docs/guides/live-queries#functional-variants)
- [Collections API](https://tanstack.com/db/latest/docs/overview#collections)
