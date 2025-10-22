# Components Specification

> **Terminology Note**: We use "handle" (like Shopify) instead of "slug" for URL identifiers throughout the codebase. Routes follow the pattern `/$orgHandle/$eventHandle`.

## Component Hierarchy

```none
<TicketsPanel>
  <TicketList>
    <TicketCard featured />
    <TicketCard />
    <TicketCard />
  </TicketList>
  <CartFooter />
</TicketsPanel>
```

---

## Data Flow Architecture

**IMPORTANT**: Understanding the data flow pattern with TanStack DB.

### TicketsPanel (Container) - Does NOT take data props

**TicketsPanel** is a **smart container** that uses `useLiveQuery` internally. It does **NOT** receive `tickets` or `cart` as props:

```typescript
interface TicketsPanelProps {
  eventId: string; // Used to construct QueryCollection
  event: Pick<Event, "mixedTicketTypesAllowed" | "currency" | "timeZone">; // Config only
  onCheckout: (cartItems: CartItem[], pricing: ServerPricing) => void;
  onChange?: (cartItems: CartItem[]) => void;
  ui?: { showHeader?: boolean; ctaLabel?: string };

  // ❌ NOT included (data is queried internally):
  // tickets?: Ticket[]
  // cart?: CartItem[]
}
```

Inside TicketsPanel, data is loaded via live queries:

```typescript
function TicketsPanel({ eventId, event, onCheckout }: TicketsPanelProps) {
  // ✅ Data loaded via live queries (NOT props)
  const { data: tickets } = useLiveQuery((q) =>
    q.from({ ticket: ticketsCollection })
      .orderBy(({ ticket }) => coalesce(ticket.sortOrder, 999))
  );

  const { data: cartItems } = useLiveQuery((q) =>
    q.from({ cart: cartCollection })
  );

  const { data: ticketUIStates } = useLiveQuery((q) => /* validation query */);

  // ✅ Then passes queried data down as props to children
  return (
    <div>
      <TicketList
        tickets={tickets}           // ← Prop (from query)
        uiStates={ticketUIStates}   // ← Prop (from query)
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
      />
      <CartFooter
        cartState={cartState}       // ← Prop (from query)
        pricing={pricing}           // ← Prop (from server function)
        onCheckout={onCheckout}
      />
    </div>
  );
}
```

### Child Components - DO take data props

Presentation components receive data as props and **don't query anything**:

```typescript
// ✅ TicketCard receives data via props
function TicketCard({
  ticket,
  uiState,
  onIncrement,
  onDecrement,
}: TicketCardProps) {
  // Just renders, doesn't query
  return <div>{ticket.name}</div>;
}

// ✅ CartFooter receives data via props
function CartFooter({ cartState, pricing, onCheckout }: CartFooterProps) {
  // Just renders, doesn't query
  return <div>Total: {pricing.total}</div>;
}
```

### Collections are Defined Outside

Collections are created once and imported:

**For initial development (recommended approach):**

```typescript
// src/lib/schemas/tickets.ts
import * as z from "zod";

export const ticketSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  // ... full schema below
});
export type Ticket = z.output<typeof ticketSchema>;

// src/lib/collections/tickets.ts
import {
  createCollection,
  localOnlyCollectionOptions,
} from "@tanstack/react-db";
import { ticketSchema } from "@/lib/schemas/tickets";
import { mockTickets } from "@/lib/mock-data";

// In-memory collection with mock data (simplest for development)
export const ticketsCollection = createCollection(
  localOnlyCollectionOptions({
    id: "mock-tickets-collection",
    getKey: (ticket) => ticket.id,
    schema: ticketSchema,
    initialData: mockTickets, // Loads instantly, no server needed
  })
);

// src/lib/schemas/cart.ts
import * as z from "zod";

export const cartItemSchema = z.object({
  ticketId: z.string(),
  qty: z.number().int().min(0),
});
export type CartItem = z.output<typeof cartItemSchema>;

// src/lib/collections/cart.ts
import {
  createCollection,
  localOnlyCollectionOptions,
  localStorageCollectionOptions,
} from "@tanstack/react-db";
import { cartItemSchema } from "@/lib/schemas/cart";

/**
 * SSR-safe cart collection with versioned storage
 *
 * - Server: In-memory stub (prevents window/localStorage access)
 * - Browser: localStorage persistence (survives refresh)
 * - Versioning: Use versioned storage key for schema migrations
 *
 * Same type signature everywhere, no conditionals needed downstream.
 */

// Version the storage key for cache-busting when schema changes
const CART_VERSION = 1;
const STORAGE_KEY = `frontrow:ticket-cart:v${CART_VERSION}`;

// Clean up old cart versions on client init
if (typeof window !== "undefined") {
  const oldKeys = ["frontrow:ticket-cart", "frontrow:ticket-cart:v0"];
  oldKeys.forEach((key) => {
    if (localStorage.getItem(key)) {
      console.info(`Migrating cart from ${key} to ${STORAGE_KEY}`);
      // Optional: parse and migrate data here
      localStorage.removeItem(key);
    }
  });
}

export const cartCollection =
  typeof window === "undefined"
    ? createCollection(
        localOnlyCollectionOptions({
          id: "ticket-cart-ssr-stub",
          getKey: (item) => item.ticketId,
          schema: cartItemSchema,
          initialData: [],
        })
      )
    : createCollection(
        localStorageCollectionOptions({
          id: "ticket-cart",
          storageKey: STORAGE_KEY,
          getKey: (item) => item.ticketId,
          schema: cartItemSchema,
        })
      );

// Optional: safe helpers for cross-environment usage
export const isCartAvailable = typeof window !== "undefined";
export const safeCartOps = {
  getItems: () => (isCartAvailable ? cartCollection.toArray() : []),
  getItemCount: () => (isCartAvailable ? cartCollection.count() : 0),
  clear: () => {
    if (isCartAvailable) cartCollection.clear();
  },
};
```

**For production (swap to real data later):**

```typescript
// src/lib/collections/tickets.ts
import { createCollection } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { ticketSchema } from "@/lib/schemas/tickets";

// QueryCollection that fetches from server
export function getTicketsCollection(eventId: string) {
  return createCollection(
    queryCollectionOptions({
      queryKey: ["tickets", eventId],
      queryFn: async () =>
        fetch(`/api/events/${eventId}/tickets`).then((r) => r.json()),
      getKey: (ticket) => ticket.id,
      schema: ticketSchema, // Validates and infers types automatically

      // Multi-strategy refetching for optimal freshness
      staleTime: 20000, // Consider data stale after 20s
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      refetchOnReconnect: true, // Refetch when internet reconnects
      refetchInterval: 30000, // Fallback polling every 30s
    })
  );
}
```

### Why This Pattern?

1. **TicketsPanel = Smart container**

   - Takes: `eventId`, `event` config, callbacks
   - Queries: `tickets`, `cart`, `ticketUIStates` via `useLiveQuery`
   - Passes queried data down as props
   - Can be dropped into any page

2. **Child components = Dumb presenters**

   - Take: Data as props
   - Don't query anything
   - Just render
   - Easily testable

3. **Collections = Reusable data sources**
   - Defined once with Zod 4 schemas (use `localOnlyCollectionOptions` with `initialData` for mock data)
   - Schema provides runtime validation and type inference automatically
   - Used across components (same `useLiveQuery` API regardless of collection type)
   - Centralized data loading
   - Easy to swap from mock (`localOnlyCollectionOptions`) to real data (`queryCollectionOptions`)

**Key Takeaway**: Don't pass `tickets` or `cart` as props to TicketsPanel. It queries them internally and passes down to children.

---

## 1. TicketsPanel

**Purpose**: Container component that orchestrates ticket selection and cart state.

### Props

```typescript
// Type alias for server pricing response
export type ServerPricing = Awaited<ReturnType<typeof calculateCartTotal>>;

interface TicketsPanelProps {
  eventId: string; // Event identifier for QueryCollection
  event: Pick<Event, "mixedTicketTypesAllowed" | "currency" | "timeZone">;
  onCheckout: (cartItems: CartItem[], pricing: ServerPricing) => void;
  onChange?: (cartItems: CartItem[]) => void; // Optional callback on cart change
  ui?: {
    showHeader?: boolean; // Default: true
    ctaLabel?: string; // Default: "Get Ticket"
  };
}
```

### Data Sources (NOT props)

```typescript
// Tickets loaded via QueryCollection
const tickets = useLiveQuery((q) =>
  q
    .from({ ticket: ticketsCollection })
    .orderBy(({ ticket }) => coalesce(ticket.sortOrder, 999))
);

// Cart loaded from LocalStorage
const cartItems = useLiveQuery((q) => q.from({ cart: cartCollection }));
```

### State Management

**1. Ticket UI States** (two-step derivation pattern):

```typescript
// Import formatDate for availability messages
import { formatDate } from "@/lib/utils/format";

// Step 1: Query raw joined data (tickets ⟂ cart)
const { data: rows } = useLiveQuery((q) =>
  q
    .from({ ticket: ticketsCollection })
    .where(({ ticket }) => ticket.visibility !== "hidden")
    .leftJoin({ cart: cartCollection }, ({ ticket, cart }) =>
      eq(ticket.id, cart.ticketId)
    )
    .select(({ ticket, cart }) => ({
      ticket,
      qty: coalesce(cart.qty, 0),
    }))
    .orderBy(({ ticket }) => coalesce(ticket.sortOrder, 999))
);

// Step 2: Derive UI states in React (reactive to both rows and cartSummary)
const ticketUIStates = React.useMemo(
  () => computeTicketUI(rows, event, cartSummary),
  [rows, event, cartSummary]
);

// Import the pure derivation logic from a shared module
// import { computeTicketUI } from "@/features/event/lib/computeTicketUI";

// For reference, the implementation (extract to separate file for testing):
function computeTicketUI(
  rows: Array<{ ticket: Ticket; qty: number }> | undefined,
  event: Pick<Event, "mixedTicketTypesAllowed" | "timeZone">,
  cart: { hasItems?: boolean } | undefined
): TicketUIState[] {
  if (!rows) return [];

  const hasItems = !!cart?.hasItems;
  const now = new Date();

  return rows.map(({ ticket: t, qty }) => {
    // 1. Base purchasable checks
    let purchasable =
      (t.status === "on_sale" || t.status === "waitlist") &&
      (!t.salesWindow?.startsAt || new Date(t.salesWindow.startsAt) <= now) &&
      (!t.salesWindow?.endsAt || new Date(t.salesWindow.endsAt) >= now);

    // 2. Capacity / remaining
    let remaining: number | null = null;
    if (typeof t.soldLimit === "number") {
      const base = t.soldLimit - (t.soldCount ?? 0);
      remaining = t.allowOversell ? base + (t.oversellBuffer ?? 0) : base;
      if (remaining <= 0) purchasable = false;
    }

    // 3. Locking (one-type-per-order)
    const inCart = qty > 0;
    const isLocked = !event.mixedTicketTypesAllowed && hasItems && !inCart;

    // 4. Limits
    const maxOrder = t.limits?.maxPerOrder ?? 999;
    const maxPerson = t.limits?.maxPerPerson ?? 999;
    const capacityMax = remaining ?? 999;
    const effectiveMax = Math.min(maxOrder, maxPerson, capacityMax);

    const canIncrement = purchasable && !isLocked && qty < effectiveMax;
    const canDecrement = qty > 0;
    const showTrashIcon = qty === 1;

    // 5. Unavailable reason
    let unavailableReason: string | null = null;
    if (isLocked) {
      unavailableReason = "Remove other tickets to add this one";
    } else if (
      t.status === "sold_out" ||
      (remaining !== null && remaining <= 0)
    ) {
      unavailableReason = "Sold out";
    } else if (t.status === "scheduled" && t.salesWindow?.startsAt) {
      unavailableReason = `On sale ${formatDate(
        t.salesWindow.startsAt,
        event.timeZone
      )}`;
    } else if (
      t.status === "ended" ||
      (t.salesWindow?.endsAt && new Date(t.salesWindow.endsAt) < now)
    ) {
      unavailableReason = t.salesWindow?.endsAt
        ? `Sale ended ${formatDate(t.salesWindow.endsAt, event.timeZone)}`
        : "Sale ended";
    } else if (t.status === "invite_only") {
      unavailableReason = "Requires unlock code";
    } else if (t.status === "paused") {
      unavailableReason = "Temporarily unavailable";
    } else if (t.status === "external") {
      unavailableReason = "Available externally";
    }

    // 6. Helper text (microcopy)
    let helperText: string | null = null;
    if (t.limits?.maxPerOrder && qty >= t.limits.maxPerOrder) {
      helperText = `Max ${t.limits.maxPerOrder} per order`;
    } else if (remaining !== null && remaining > 0 && remaining <= 5) {
      helperText = `Only ${remaining} left!`;
    } else if (
      t.limits?.maxPerOrder &&
      qty > 0 &&
      qty >= t.limits.maxPerOrder - 2
    ) {
      const slotsLeft = t.limits.maxPerOrder - qty;
      helperText = `${slotsLeft} more available`;
    } else if (remaining !== null && remaining > 0 && remaining <= 20) {
      helperText = "Limited availability";
    } else if (
      qty === 0 &&
      t.limits?.maxPerPerson &&
      t.limits.maxPerPerson <= 4
    ) {
      helperText = `Max ${t.limits.maxPerPerson} per person`;
    } else if (qty > 0 && t.limits?.minPerOrder && qty < t.limits.minPerOrder) {
      helperText = `Min ${t.limits.minPerOrder} required`;
    }

    return {
      ticketId: t.id,
      currentQty: qty,
      isPurchasable: purchasable,
      isLocked,
      canIncrement,
      canDecrement,
      showTrashIcon,
      isGreyedOut: !purchasable || isLocked,
      unavailableReason,
      helperText,
    };
  });
}
```

**2. Cart Summary Query** (global state):

```typescript
const {
  data: [cartSummary],
} = useLiveQuery((q) =>
  q.from({ cart: cartCollection }).select(({ cart }) => ({
    hasItems: gt(count(cart.ticketId), 0),
    totalQty: sum(cart.qty),
    uniqueTicketCount: count(cart.ticketId),
  }))
);
```

**2b. Order-level validation** (aggregates and composed blocker):

```typescript
// Order-level constraints via filtered aggregates
const {
  data: [overLimitAgg],
} = useLiveQuery((q) =>
  q
    .from({ cart: cartCollection })
    .join({ ticket: ticketsCollection }, ({ cart, ticket }) =>
      eq(cart.ticketId, ticket.id)
    )
    .where(({ cart, ticket }) =>
      gt(cart.qty, coalesce(ticket.limits.maxPerOrder, 999))
    )
    .select(({ cart }) => ({
      offendingCount: count(cart.ticketId),
    }))
);

const {
  data: [belowMinAgg],
} = useLiveQuery((q) =>
  q
    .from({ cart: cartCollection })
    .join({ ticket: ticketsCollection }, ({ cart, ticket }) =>
      eq(cart.ticketId, ticket.id)
    )
    .where(({ cart, ticket }) =>
      and(
        gt(coalesce(ticket.limits.minPerOrder, 0), 0),
        lt(cart.qty, coalesce(ticket.limits.minPerOrder, 0))
      )
    )
    .select(({ cart }) => ({
      offendingCount: count(cart.ticketId),
    }))
);

// Compose validation state (UI)
const orderValidation = {
  totalQty: cartSummary?.totalQty ?? 0,
  exceedsEventMax: (cartSummary?.totalQty ?? 0) > EVENT_MAX_TICKETS_PER_ORDER,
  hasOverLimitTicket: (overLimitAgg?.offendingCount ?? 0) > 0,
  hasBelowMinTicket: (belowMinAgg?.offendingCount ?? 0) > 0,
  blockerReason:
    (cartSummary?.totalQty ?? 0) > EVENT_MAX_TICKETS_PER_ORDER
      ? `Maximum ${EVENT_MAX_TICKETS_PER_ORDER} tickets per order`
      : (overLimitAgg?.offendingCount ?? 0) > 0
      ? "Some tickets exceed their limit"
      : (belowMinAgg?.offendingCount ?? 0) > 0
      ? "Some tickets don't meet minimum quantity"
      : null,
};
```

**3. Server Pricing Query** (debounced):

```typescript
import { useDebouncedValue } from "@tanstack/react-pacer/debouncer";
import { keepPreviousData } from "@tanstack/react-query";

// Debounce cart changes to avoid excessive pricing calls
// 500ms is recommended for search-like interactions (balances responsiveness with server load)
const [debouncedCartItems] = useDebouncedValue(cartItems, { wait: 500 });

const { data: pricing, isPending } = useQuery({
  queryKey: ["cart-pricing", eventId, debouncedCartItems],
  queryFn: () =>
    calculateCartTotal({
      eventId,
      items: debouncedCartItems.map((item) => ({
        ticketId: item.ticketId,
        qty: item.qty,
      })),
    }),
  enabled: cartState?.hasItems ?? false,
  // React Query v5: use placeholderData with keepPreviousData helper
  placeholderData: keepPreviousData,
});
```

### Cart Operations

```typescript
// Increment quantity
const handleIncrement = (ticketId: string) => {
  const existing = cartCollection.get(ticketId);

  if (existing) {
    cartCollection.update(ticketId, (draft) => {
      draft.qty += 1;
    });
  } else {
    cartCollection.insert({
      ticketId,
      qty: 1,
    });
  }

  // Optional callback
  onChange?.(cartCollection.toArray());
};

// Decrement quantity (with trash behavior at qty=1)
const handleDecrement = (ticketId: string) => {
  const existing = cartCollection.get(ticketId);

  if (!existing) return;

  if (existing.qty === 1) {
    // Remove from cart entirely
    cartCollection.delete(ticketId);
  } else {
    cartCollection.update(ticketId, (draft) => {
      draft.qty -= 1;
    });
  }

  onChange?.(cartCollection.toArray());
};

// Clear cart (version-safe: loop through items individually)
const handleClearCart = () => {
  const items = cartCollection.toArray();
  for (const item of items) {
    cartCollection.delete(item.ticketId);
  }
};
```

### Implementation (SSR-friendly export)

```typescript
import { ClientOnly } from "@tanstack/react-router";

// Public export with ClientOnly wrapper to avoid SSR/hydration pitfalls
export function TicketsPanel(props: TicketsPanelProps) {
  return (
    <ClientOnly fallback={<TicketsPanelSkeleton />}>
      <TicketsPanelClient {...props} />
    </ClientOnly>
  );
}

// SSR-safe skeleton (no hooks, just JSX)
function TicketsPanelSkeleton() {
  return (
    <section className="bg-card/80 backdrop-blur-[16px] ring-1 ring-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        <div className="h-4 w-48 bg-muted animate-pulse rounded mt-2" />
      </div>
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
      <div className="border-t border-border bg-background/50 p-4">
        <div className="h-11 w-full bg-muted animate-pulse rounded-lg" />
      </div>
    </section>
  );
}

function TicketsPanelClient({
  eventId,
  event,
  onCheckout,
  onChange,
  ui,
}: TicketsPanelProps) {
  // 1) Raw ticket rows (tickets ⟂ cart with quantities)
  const { data: rows } = useLiveQuery((q) =>
    q
      .from({ ticket: ticketsCollection })
      .where(({ ticket }) => ticket.visibility !== "hidden")
      .leftJoin({ cart: cartCollection }, ({ ticket, cart }) =>
        eq(ticket.id, cart.ticketId)
      )
      .select(({ ticket, cart }) => ({
        ticket,
        qty: coalesce(cart.qty, 0),
      }))
      .orderBy(({ ticket }) => coalesce(ticket.sortOrder, 999))
  );

  // 2) Cart list (for pricing input)
  const { data: cartItems } = useLiveQuery((q) =>
    q.from({ cart: cartCollection })
  );

  // 3) Cart summary aggregates
  const {
    data: [cartState],
  } = useLiveQuery((q) =>
    q.from({ cart: cartCollection }).select(({ cart }) => ({
      totalQty: sum(cart.qty),
      hasItems: gt(count(cart.ticketId), 0),
    }))
  );

  // 4) Derive tickets list + UI states in single memo (ensures consistency)
  // This pattern guarantees both are derived from the same snapshot of rows/event/cartState
  const [tickets, ticketUIStates] = React.useMemo(() => {
    if (!rows) return [[], []];
    return [
      rows.map((r) => r.ticket),
      computeTicketUI(rows, event, cartState),
    ];
  }, [rows, event, cartState]);

  // 5) Pricing (debounced to reduce server load)
  const [debouncedCartItems] = useDebouncedValue(cartItems, { wait: 500 });
  const {
    data: pricing,
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: ["cart-pricing", eventId, debouncedCartItems],
    queryFn: () =>
      calculateCartTotal({
        eventId,
        items: debouncedCartItems.map((i) => ({
          ticketId: i.ticketId,
          qty: i.qty,
        })),
      }),
    enabled: cartState?.hasItems ?? false,
    placeholderData: keepPreviousData,
  });

  // 6) Handlers
  const handleIncrement = (ticketId: string) => {
    const existing = cartCollection.get(ticketId);

    if (existing) {
      cartCollection.update(ticketId, (draft) => {
        draft.qty += 1;
      });
    } else {
      cartCollection.insert({
        ticketId,
        qty: 1,
      });
    }

    onChange?.(cartCollection.toArray());
  };

  const handleDecrement = (ticketId: string) => {
    const existing = cartCollection.get(ticketId);

    if (!existing) return;

    if (existing.qty === 1) {
      cartCollection.delete(ticketId);
    } else {
      cartCollection.update(ticketId, (draft) => {
        draft.qty -= 1;
      });
    }

    onChange?.(cartCollection.toArray());
  };

  // 7) Render
  return (
    <div>
      {ui?.showHeader !== false && (
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-semibold">Get Tickets</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Select quantity for each ticket type
          </p>
        </div>
      )}

      <TicketList
        tickets={tickets}
        uiStates={ticketUIStates}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
      />

      <CartFooter
        cartState={cartState}
        pricing={pricing}
        currency={event.currency}
        isPricingLoading={isPending}
        error={error}
        onRetry={() => refetch()}
        ctaLabel={ui?.ctaLabel}
        onCheckout={() => onCheckout(cartItems, pricing)}
      />
    </div>
  );
}
```

---

## 2. TicketList

**Purpose**: Renders sorted array of tickets.

### Props TicketList

```typescript
interface TicketListProps {
  tickets: Ticket[];
  uiStates: TicketUIState[];
  onIncrement: (ticketId: string) => void;
  onDecrement: (ticketId: string) => void;
}
```

### Sorting Strategy

Featured tickets first, then by `sortOrder || createdAt`:

```typescript
function TicketList({
  tickets,
  uiStates,
  onIncrement,
  onDecrement,
}: TicketListProps) {
  const ticketsSorted = React.useMemo(() => {
    const copy = [...(tickets ?? [])];
    copy.sort((a, b) => {
      // featured first
      const af = a.featured ? 1 : 0;
      const bf = b.featured ? 1 : 0;
      if (bf - af !== 0) return bf - af;
      // then sortOrder asc (nulls last)
      const soA = a.sortOrder ?? 999;
      const soB = b.sortOrder ?? 999;
      if (soA !== soB) return soA - soB;
      // then createdAt desc (parse for correct timezone handling)
      const tsA = (a as any).createdAt ? Date.parse((a as any).createdAt) : 0;
      const tsB = (b as any).createdAt ? Date.parse((b as any).createdAt) : 0;
      return tsB - tsA; // desc (newest first)
    });
    return copy;
  }, [tickets]);

  return (
    <div className="p-4 space-y-3">
      {ticketsSorted.map((ticket) => {
        const uiState = uiStates?.find((s) => s.ticketId === ticket.id);

        return (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            uiState={uiState}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
          />
        );
      })}
    </div>
  );
}
```

---

## 3. TicketCard

**Purpose**: Presentation component for single ticket with all visual states.

### Props TicketCard

```typescript
// Use the schema type instead of redeclaring fields
// import type { Ticket } from "@/lib/schemas/tickets";

interface TicketCardProps {
  ticket: Ticket;
  uiState: TicketUIState;
  onIncrement: (ticketId: string) => void;
  onDecrement: (ticketId: string) => void;
}

interface TicketUIState {
  ticketId: string;
  currentQty: number;
  isPurchasable: boolean;
  isLocked: boolean;
  canIncrement: boolean;
  canDecrement: boolean;
  showTrashIcon: boolean;
  isGreyedOut: boolean;
  unavailableReason: string | null;
  helperText: string | null;
}
```

### Ticket Visibility Behavior

The `visibility` property controls how tickets appear in the list:

- **`public`** - Shown to all users, purchasable if other conditions met (default)
- **`unlisted`** - Not shown in list by default, but accessible via direct link or unlock code
- **`hidden`** - Never shown in public list, only accessible to admins or via special access

**Implementation**: Filter tickets in the query based on visibility:

```typescript
const { data: tickets } = useLiveQuery((q) =>
  q
    .from({ ticket: ticketsCollection })
    .where(
      ({ ticket }) =>
        // Only show public and unlisted tickets (hidden tickets excluded)
        ticket.visibility !== "hidden"
    )
    .orderBy(({ ticket }) => coalesce(ticket.sortOrder, 999))
);
```

### Mock Server Functions

These functions should be mocked for the implementation:

**1. Pricing Calculation:**

Add to `lib/mock-data.ts`:

```typescript
import { dinero, add, multiply } from "dinero.js";
import { USD } from "@dinero.js/currencies";

export const calculateCartTotal = async ({
  eventId,
  items,
}: {
  eventId: string;
  items: Array<{ ticketId: string; qty: number }>;
}) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const zero = dinero({ amount: 0, currency: USD });

  // Calculate line totals
  const lines = items.map((item) => {
    const ticket = mockTickets.find((t) => t.id === item.ticketId);
    if (!ticket) throw new Error(`Ticket ${item.ticketId} not found`);

    const unit = dinero({
      amount: ticket.pricing.ticket.amount,
      currency: USD,
    });
    // Use integers for quantities (no scale)
    const lineTotal = multiply(unit, { amount: item.qty, scale: 0 });

    return {
      ticketId: item.ticketId,
      name: ticket.name,
      qty: item.qty,
      unitPrice: unit,
      lineTotal,
    };
  });

  // Sum subtotal
  const subtotal = lines.reduce((acc, line) => add(acc, line.lineTotal), zero);

  // Use scaled integers for percentages (avoid floats)
  const fees = multiply(subtotal, { amount: 10, scale: 2 }); // 10% = 0.10
  const tax = multiply(subtotal, { amount: 8, scale: 2 }); // 8% = 0.08
  const total = add(add(subtotal, fees), tax);

  return { lines, subtotal, fees, tax, total };
};
```

**Key patterns:**

- Uses `multiply` with **scaled integers** for percentages (10% = `{ amount: 10, scale: 2 }`)
- Uses **integers** for quantities: `{ amount: qty, scale: 0 }`
- Returns Dinero objects (NOT formatted strings)
- Simulates 300ms network delay

**2. Unlock Code Validation**:

```typescript
const validateUnlockCode = async (ticketId: string, code: string) => {
  await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate network

  // Mock: accept specific codes per ticket
  const validCodes: Record<string, string> = {
    ticket_vip_locked: "VIP-2025",
    ticket_early_access: "EARLY-BIRD",
    ticket_member_only: "MEMBER123",
  };

  return {
    valid: validCodes[ticketId]?.toUpperCase() === code.toUpperCase(),
    message: validCodes[ticketId] === code ? "Code accepted!" : "Invalid code",
  };
};
```

**3. Helper: Calculate Subtotal**:

```typescript
/**
 * Calculate cart subtotal in cents (for promo code logic)
 * Returns raw number in cents, not Dinero object
 */
function calculateSubtotal(cartItems: CartItem[]): number {
  return cartItems.reduce((total, item) => {
    const ticket = mockTickets.find((t) => t.id === item.ticketId);
    if (!ticket) return total;
    return total + ticket.pricing.ticket.amount * item.qty;
  }, 0);
}
```

**4. Promo Code Application** (non-deferred):

```typescript
import { dinero } from "dinero.js";
import { USD } from "@dinero.js/currencies";
import { formatMoney } from "@/lib/utils/format";

const applyPromoCode = async (code: string, cartItems: CartItem[]) => {
  await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate network

  const promoCodes: Record<
    string,
    { discount: number; type: "percent" | "fixed" }
  > = {
    SAVE10: { discount: 0.1, type: "percent" }, // 10% off
    SAVE20: { discount: 0.2, type: "percent" }, // 20% off
    FLAT5: { discount: 500, type: "fixed" }, // $5.00 off (cents)
  };

  const promo = promoCodes[code.toUpperCase()];

  if (!promo) {
    return {
      valid: false,
      message: "Invalid promo code",
      discount: 0,
    };
  }

  const subtotalCents = calculateSubtotal(cartItems);
  const discountCents =
    promo.type === "percent"
      ? Math.floor(subtotalCents * promo.discount)
      : promo.discount;

  const message =
    promo.type === "percent"
      ? `${promo.discount * 100}% discount applied!`
      : `${formatMoney(dinero({ amount: promo.discount, currency: USD }), "USD")} discount applied!`;

  return {
    valid: true,
    message,
    discount: discountCents,
    code: code.toUpperCase(),
  };
};
```

---

## Server Validation (Pre-checkout)

Use a server function to validate cart items before checkout to prevent overselling and enforce limits.

```typescript
// apps/frontrow/src/lib/server/validate-cart.ts
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/lib/db";
import type { CartItem } from "@/lib/schemas/cart";

export const validateCart = createServerFn({ method: "POST" })
  .validator((data: { eventId: string; items: CartItem[] }) => data)
  .handler(async ({ data }) => {
    const { eventId, items } = data;

    const ticketIds = items.map((i) => i.ticketId);
    const tickets = await db.ticket.findMany({
      where: { id: { in: ticketIds }, eventId },
    });

    const errors: Array<{ ticketId: string; reason: string }> = [];

    for (const item of items) {
      const t = tickets.find((x) => x.id === item.ticketId);
      if (!t) {
        errors.push({ ticketId: item.ticketId, reason: "Ticket not found" });
        continue;
      }
      if (t.status !== "on_sale") {
        errors.push({
          ticketId: item.ticketId,
          reason: t.status === "sold_out" ? "Sold out" : "Not available",
        });
        continue;
      }
      if (typeof t.soldLimit === "number") {
        const remaining = t.soldLimit - (t.soldCount || 0);
        if (item.qty > remaining) {
          errors.push({
            ticketId: item.ticketId,
            reason: `Only ${remaining} tickets left (you requested ${item.qty})`,
          });
          continue;
        }
      }
      if (t.limits?.maxPerOrder && item.qty > t.limits.maxPerOrder) {
        errors.push({
          ticketId: item.ticketId,
          reason: `Maximum ${t.limits.maxPerOrder} per order`,
        });
        continue;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      tickets: errors.length === 0 ? tickets : null,
    };
  });
```

### Accessibility & i18n checklist

- Steppers are buttons with proper `aria-label` (e.g., "Increase quantity of {ticket}").
- Status text exposed for screen readers (consider `aria-live` for announcements like "Sold Out").
- Dates formatted with `formatDate(iso, event.timeZone)` using IANA timezone (handles DST automatically).
- Currency formatted with `formatMoney(dineroObject, event.currency)` using `Intl.NumberFormat`.
- Provide visible focus styles; trap focus if `TicketsPanel` is presented as a modal.

### Sample Tickets Data for Mock Collection

Use this JSON to populate a mock tickets QueryCollection in local development:

```json
[
  {
    "id": "vip",
    "name": "VIP All Day Plus Book & Food!",
    "description": "Enjoy the full day of events including all three movies and lunch...",
    "pricing": { "ticket": { "amount": 5500, "currency": "USD" } },
    "status": "on_sale",
    "visibility": "public",
    "availabilityLabel": "Available until Oct 11 at 12:00 PM PDT",
    "salesWindow": { "endsAt": "2025-10-11T19:00:00Z" },
    "limits": { "minPerOrder": 1, "maxPerOrder": 10 },
    "soldLimit": 100,
    "soldCount": 58,
    "featured": true,
    "badges": ["best_value"],
    "bundle": { "includes": ["All three movies", "Lunch", "Free book"] }
  },
  {
    "id": "film-1",
    "name": "Show Her the Money",
    "pricing": { "ticket": { "amount": 2500, "currency": "USD" } },
    "status": "on_sale",
    "visibility": "public",
    "availabilityLabel": "Available until Oct 11 at 10:30 AM PDT",
    "salesWindow": { "endsAt": "2025-10-11T17:30:00Z" }
  },
  {
    "id": "film-2",
    "name": "Lilly",
    "pricing": { "ticket": { "amount": 2500, "currency": "USD" } },
    "status": "on_sale",
    "visibility": "public",
    "availabilityLabel": "Available until Oct 11 at 1:30 PM PDT"
  },
  {
    "id": "film-3",
    "name": "Still Working 9–5",
    "pricing": { "ticket": { "amount": 2500, "currency": "USD" } },
    "status": "on_sale",
    "visibility": "public",
    "availabilityLabel": "Available until Oct 11 at 4:30 PM PDT"
  },
  {
    "id": "group-package",
    "name": "Group Package (4+ people)",
    "description": "Special rate for groups of 4 or more. Includes reserved seating.",
    "pricing": { "ticket": { "amount": 2000, "currency": "USD" } },
    "status": "on_sale",
    "visibility": "public",
    "limits": { "minPerOrder": 4, "maxPerOrder": 20 },
    "soldLimit": 50,
    "sortOrder": 2
  },
  {
    "id": "last-chance",
    "name": "Last Chance Tickets",
    "description": "Final remaining tickets for this event!",
    "pricing": { "ticket": { "amount": 3000, "currency": "USD" } },
    "status": "on_sale",
    "visibility": "public",
    "limits": { "maxPerOrder": 4 },
    "soldLimit": 100,
    "soldCount": 97,
    "sortOrder": 3
  }
]
```

**Sample Event Data**:

```json
{
  "id": "evt_123",
  "mixedTicketTypesAllowed": false,
  "currency": "USD",
  "timeZone": "America/Los_Angeles",
  "venueUtcOffset": "-07:00"
}
```

_Note: All `salesWindow` timestamps are stored in UTC (ISO 8601). The `timeZone` field (IANA timezone like `"America/Los_Angeles"`) is used with `Intl.DateTimeFormat` to properly format dates and handle DST transitions. The optional `venueUtcOffset` field (e.g., `"-07:00"` for PDT) can be displayed as supplementary information like "UTC-07:00"._

**UI Integration Notes**:

- Unlock code input appears when `ticket.status === 'invite_only'` and `ticket.requiresCode === true`
- Promo code input can be shown in CartFooter or as expandable section
- Both should show loading state during validation
- Display success/error messages inline

### Visual States

**1. Featured Ticket** (elevated styling):

```tsx
<div className={cn(
  'rounded-lg p-4 relative',
  ticket.featured && 'ring-1 ring-primary/20 bg-primary/5'
)}>
```

**2. Greyed Out** (not purchasable):

```tsx
<div className={cn(
  'rounded-lg ring-1 ring-border p-3',
  uiState.isGreyedOut && 'opacity-50 cursor-not-allowed'
)}>
```

**3. Availability Indicator**:

```tsx
{
  ticket.availabilityLabel && (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {/* Green dot when available */}
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          uiState.isPurchasable ? "bg-green-500" : "bg-muted"
        )}
      />
      <span>{ticket.availabilityLabel}</span>
    </div>
  );
}
```

**4. Low Inventory Warning** (orange):

```tsx
{
  uiState.helperText?.includes("left!") && (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
      <span className="text-orange-600 dark:text-orange-400 font-medium">
        {uiState.helperText}
      </span>
    </div>
  );
}
```

**5. Unavailable Reason Badge**:

```tsx
import { Info } from "lucide-react";

{
  uiState.unavailableReason && (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 text-xs">
      <Info className="h-3.5 w-3.5" />
      {uiState.unavailableReason}
    </div>
  );
}
```

### Implementation Visual States

```typescript
import { Info, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

function TicketCard({
  ticket,
  uiState,
  onIncrement,
  onDecrement,
}: TicketCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg p-4 relative transition-colors",
        ticket.featured
          ? "ring-1 ring-primary/20 bg-primary/5"
          : "ring-1 ring-border hover:bg-muted/30",
        uiState.isGreyedOut && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Featured badge (top-right overlay) */}
      {ticket.featured && (
        <div className="absolute top-2 right-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-xs font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Best Value
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        {/* Left: Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base">{ticket.name}</h3>

          {ticket.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {ticket.description}
            </p>
          )}

          {/* Availability label with dot */}
          {ticket.availabilityLabel && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  uiState.isPurchasable ? "bg-green-500" : "bg-muted"
                )}
              />
              <span>{ticket.availabilityLabel}</span>
            </div>
          )}

          {/* Bundle info */}
          {ticket.bundle && (
            <div className="mt-2 text-xs text-muted-foreground">
              Includes: {ticket.bundle.includes.join(" · ")}
            </div>
          )}

          {/* Unavailable reason badge */}
          {uiState.unavailableReason && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 text-xs">
              <Info className="h-3.5 w-3.5" />
              {uiState.unavailableReason}
            </div>
          )}
        </div>

        {/* Right: Price */}
        <div className="text-right shrink-0">
          <TicketPrice pricing={ticket.pricing} />
        </div>
      </div>

      {/* Quantity Controls (state-driven: Add button → stepper after add) */}
      {uiState.isPurchasable && !uiState.isLocked ? (
        <div className="mt-4 flex items-center justify-between">
          {uiState.currentQty > 0 ? (
            // Stepper visible when in cart (qty > 0)
            <QuantityStepper
              value={uiState.currentQty}
              showTrashIcon={uiState.showTrashIcon}
              canIncrement={uiState.canIncrement}
              canDecrement={uiState.canDecrement}
              onIncrement={() => onIncrement(ticket.id)}
              onDecrement={() => onDecrement(ticket.id)}
              aria-describedby={
                uiState.helperText ? `ticket-${ticket.id}-helper` : undefined
              }
            />
          ) : (
            // Collapsed - just Add button
            <button
              type="button"
              onClick={() => onIncrement(ticket.id)}
              disabled={!uiState.canIncrement}
              className="h-8 px-3 rounded-lg border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors flex items-center gap-1"
              aria-describedby={
                uiState.helperText ? `ticket-${ticket.id}-helper` : undefined
              }
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">Add</span>
            </button>
          )}

          {/* Helper text */}
          {uiState.helperText && (
            <div
              id={`ticket-${ticket.id}-helper`}
              className="text-xs text-muted-foreground"
              role="note"
              aria-live="polite"
            >
              {uiState.helperText}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
```

---

## 4. QuantityStepper

**Purpose**: Reusable increment/decrement control with trash icon behavior.

### Props QuantityStepper

```typescript
interface QuantityStepperProps {
  value: number;
  showTrashIcon: boolean; // true when value === 1
  canIncrement: boolean;
  canDecrement: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
}
```

### Implementation QuantityStepper

```typescript
import { Plus, Minus, Trash2 } from "lucide-react";

function QuantityStepper({
  value,
  showTrashIcon,
  canIncrement,
  canDecrement,
  onIncrement,
  onDecrement,
}: QuantityStepperProps) {
  return (
    <div className="inline-flex items-center gap-2">
      {/* Decrement / Remove button */}
      <button
        type="button"
        onClick={onDecrement}
        disabled={!canDecrement}
        className="h-9 w-9 rounded-lg border border-border hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={showTrashIcon ? "Remove ticket" : "Decrease quantity"}
      >
        {showTrashIcon ? (
          <Trash2 className="h-4 w-4" />
        ) : (
          <Minus className="h-4 w-4" />
        )}
      </button>

      {/* Quantity display */}
      <span className="w-8 text-center font-medium tabular-nums">{value}</span>

      {/* Increment button */}
      <button
        type="button"
        onClick={onIncrement}
        disabled={!canIncrement}
        className="h-9 w-9 rounded-lg border border-border hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
```

**Key behavior**: When `value === 1`, the minus button shows a trash icon and removes the item entirely from cart on click.

---

## 5. CartFooter

**Purpose**: Displays pricing breakdown and checkout CTA.

### Props CartFooter

```typescript
interface CartFooterProps {
  cartState: {
    totalQty: number;
    hasItems: boolean;
  };
  pricing?: {
    subtotal: ReturnType<typeof dinero>;
    fees: ReturnType<typeof dinero>;
    tax: ReturnType<typeof dinero>;
    total: ReturnType<typeof dinero>;
  };
  currency: string; // For formatting (e.g., "USD")
  isPricingLoading: boolean;
  error?: unknown; // Pricing error (if any)
  onRetry?: () => void; // Call refetch()
  ctaLabel?: string; // Optional override
  onCheckout: () => void;
}
```

### States (Priority Order)

**1. Error state** (highest priority when cart has items):

```tsx
{cartState.hasItems && error ? (
  <div className="space-y-3">
    <div className="text-sm text-destructive">
      We're having trouble calculating totals. Try again in a bit.
    </div>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="w-full h-11 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/90 transition-colors"
      >
        Retry
      </button>
    )}
  </div>
) : null}
```

**2. Ready to checkout** (cart has items + pricing available):

```tsx
{cartState.hasItems && pricing ? (
  <div className="space-y-3">
    {/* Pricing breakdown with aria-live */}
    <div
      className="space-y-1.5 text-sm"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* ... pricing rows ... */}
    </div>

    <button
      type="button"
      onClick={onCheckout}
      disabled={isPricingLoading || !cartState.hasItems}
      className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
    >
      {isPricingLoading
        ? "Calculating..."
        : ctaLabel || `Get ${pluralizeTickets(cartState.totalQty)}`}
    </button>
  </div>
) : null}
```

**3. Loading pricing** (cart has items but no pricing data yet):

```tsx
{cartState.hasItems && isPricingLoading ? (
  <button
    type="button"
    disabled
    className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium"
  >
    Calculating...
  </button>
) : null}
```

**4. Empty cart**:

```tsx
<button
  type="button"
  disabled
  className="w-full h-11 rounded-lg bg-secondary text-secondary-foreground font-medium opacity-50 cursor-not-allowed"
>
  Select tickets to continue
</button>
```

### Implementation CartFooter

```typescript
import { isZero } from "dinero.js";
import { formatMoney, pluralizeTickets } from "@/lib/utils/format";

function CartFooter({
  cartState,
  pricing,
  currency,
  isPricingLoading,
  error,
  onRetry,
  ctaLabel,
  onCheckout,
}: CartFooterProps) {
  return (
    <div className="border-t border-border bg-background/50 p-4">
      {/* Error state (priority when cart has items) */}
      {cartState.hasItems && error ? (
        <div className="space-y-3">
          <div className="text-sm text-destructive">
            We're having trouble calculating totals. Try again in a bit.
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="w-full h-11 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/90 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      ) : cartState.hasItems && pricing ? (
        // Normal pricing state
        <div className="space-y-3">
          {/* Pricing breakdown (polite SR updates) */}
          <div
            className="space-y-1.5 text-sm"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Subtotal ({cartState.totalQty}{" "}
                {pluralizeTickets(cartState.totalQty)})
              </span>
              <span className="font-medium tabular-nums">
                {formatMoney(pricing.subtotal, currency)}
              </span>
            </div>

            {/* Service fees */}
            {!isZero(pricing.fees) && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Service fees</span>
                <span className="tabular-nums">
                  +{formatMoney(pricing.fees, currency)}
                </span>
              </div>
            )}

            {/* Tax */}
            {!isZero(pricing.tax) && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Tax</span>
                <span className="tabular-nums">
                  +{formatMoney(pricing.tax, currency)}
                </span>
              </div>
            )}

            {/* Separator */}
            <div className="border-t border-border my-2" />

            {/* Total */}
            <div className="flex items-center justify-between font-semibold">
              <span>Total</span>
              <span className="tabular-nums text-lg">
                {formatMoney(pricing.total, currency)}
              </span>
            </div>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={onCheckout}
            disabled={isPricingLoading || !cartState.hasItems}
            className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPricingLoading
              ? "Calculating..."
              : ctaLabel || `Get ${pluralizeTickets(cartState.totalQty)}`}
          </button>
        </div>
      ) : cartState.hasItems && isPricingLoading ? (
        // Loading pricing (no data yet)
        <button
          type="button"
          disabled
          className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium"
        >
          Calculating...
        </button>
      ) : (
        // Empty cart
        <button
          type="button"
          disabled
          className="w-full h-11 rounded-lg bg-secondary text-secondary-foreground font-medium opacity-50 cursor-not-allowed"
        >
          Select tickets to continue
        </button>
      )}
    </div>
  );
}
```

---

## 6. TicketPrice

**Purpose**: Displays ticket price with optional fees/tax breakdown.

### Props TicketPrice

```typescript
interface TicketPriceProps {
  pricing: {
    ticket: { amount: number; currency: string };
    strikePrice?: { amount: number; currency: string };
    fees?: {
      amount: { amount: number; currency: string };
      included: boolean;
      showBreakdown?: boolean;
      label?: string;
    };
    tax?: {
      amount: { amount: number; currency: string };
      included: boolean;
      showBreakdown?: boolean;
      label?: string;
    };
  };
}
```

### Scenarios

**1. Simple pricing (no fees/tax)**:

```tsx
<div className="font-semibold text-lg">$55.00</div>
```

**2. With strike price (show savings)**:

```tsx
<div>
  <div className="text-sm line-through text-muted-foreground">$75.00</div>
  <div className="font-semibold text-lg">$55.00</div>
</div>
```

**3. Fees added at checkout**:

```tsx
<div className="font-semibold text-lg">$55.00</div>
<div className="text-xs text-muted-foreground">plus fees</div>
```

**4. Fees included with breakdown**:

```tsx
<div className="font-semibold text-lg">$55.00</div>
<div className="text-xs text-muted-foreground">(Includes $5.00 in fees)</div>
```

### Implementation TicketPrice

```typescript
import { dinero, type Currency } from "dinero.js";
import * as currencies from "@dinero.js/currencies";
import { formatMoney } from "@/lib/utils/format";

// Helper: resolve currency from string code (today always USD, but reads from data)
const resolveCurrency = (code: string): Currency<number> => {
  const map = currencies as unknown as Record<string, Currency<number>>;
  return map[code] ?? currencies.USD;
};

function TicketPrice({ pricing }: TicketPriceProps) {
  const unit = dinero({
    amount: pricing.ticket.amount,
    currency: resolveCurrency(pricing.ticket.currency),
  });

  const strike = pricing.strikePrice
    ? dinero({
        amount: pricing.strikePrice.amount,
        currency: resolveCurrency(pricing.strikePrice.currency),
      })
    : null;

  const feesInfo = pricing.fees;
  const taxInfo = pricing.tax;

  return (
    <div className="text-right">
      {strike && (
        <div className="text-sm line-through text-muted-foreground">
          {formatMoney(strike, pricing.strikePrice!.currency)}
        </div>
      )}

      <div className="font-semibold text-lg">
        {formatMoney(unit, pricing.ticket.currency)}
      </div>

      {/* Fee/tax microcopy */}
      <div className="text-xs text-muted-foreground">
        {!feesInfo?.included && !taxInfo?.included && "plus fees"}

        {feesInfo?.included && feesInfo.showBreakdown && (
          <div>
            (Includes{" "}
            {formatMoney(
              dinero({
                amount: feesInfo.amount.amount,
                currency: resolveCurrency(feesInfo.amount.currency),
              }),
              feesInfo.amount.currency
            )}{" "}
            in fees)
          </div>
        )}

        {taxInfo?.included && taxInfo.showBreakdown && (
          <div>
            (Includes{" "}
            {formatMoney(
              dinero({
                amount: taxInfo.amount.amount,
                currency: resolveCurrency(taxInfo.amount.currency),
              }),
              taxInfo.amount.currency
            )}{" "}
            tax)
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 7. Adapter Components (UI Layer)

These are NOT feature components - they wrap vendor primitives from **ReUI** (Base UI variants, preferred) or shadcn (fallback).

### Button Adapter (`src/ui/button.tsx`)

```typescript
import { Button as ReUIButton } from "@/vendor/reui/button";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border border-border hover:bg-muted",
        ghost: "hover:bg-muted hover:text-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-11 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <ReUIButton
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
```

**Critical**: Features import `Button` from `@/ui/button`, NEVER from `@/vendor/reui/*` or `@/vendor/shadcn/*`.

### Card Components (`src/ui/card.tsx`)

```typescript
// Export ReUI Card primitives directly (Base UI variant)
export {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/vendor/reui/card";
```

**Usage in TicketsPanel**:

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/ui/card";

<Card className="bg-card/80 backdrop-blur-[16px]">
  <CardHeader>
    <CardTitle>Get Tickets</CardTitle>
  </CardHeader>
  <CardContent>{/* ticket list */}</CardContent>
</Card>;
```

---

## 8. Icons

**Purpose**: Standard icon library for UI elements.

### Library

Use **lucide-react** (already in project):

```typescript
import { Plus, Minus, Trash2, Info, AlertCircle } from "lucide-react";
```

### Usage in Components

```tsx
// Plus icon (Add button, increment)
<Plus className="h-4 w-4" />

// Minus icon (decrement when qty > 1)
<Minus className="h-4 w-4" />

// Trash icon (remove when qty === 1)
<Trash2 className="h-4 w-4" />

// Info icon (unavailable reason badge)
<Info className="h-3.5 w-3.5" />

// Alert icon (warnings)
<AlertCircle className="h-3.5 w-3.5" />
```

### Inline SVG Alternative

For maximum control (e.g., trash icon with custom path), use inline SVG:

```tsx
<svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor">
  <path
    strokeWidth="1.5"
    strokeLinecap="round"
    d="M3 4h10M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1m1 0v9a1 1 0 01-1 1H5a1 1 0 01-1-1V4h8z"
  />
</svg>
```

---

## 9. Formatting Utilities

**Purpose**: Centralized formatting functions for money, dates, and common UI strings.

### Location

**Create:** `apps/frontrow/src/lib/utils/format.ts`

### Implementation

```typescript
import type { Dinero } from "dinero.js";
import { toDecimal } from "dinero.js";

/**
 * Format Dinero money object with currency symbol
 * Uses Intl.NumberFormat for proper localization and currency symbols
 */
export function formatMoney(
  amount: Dinero<number>,
  currency: string,
  locale = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(Number.parseFloat(toDecimal(amount)));
}

/**
 * Format ISO datetime string with IANA timezone
 * Automatically handles DST transitions
 */
export function formatDate(
  isoString: string,
  timeZone: string,
  locale = "en-US",
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
    ...options,
  }).format(new Date(isoString));
}

/**
 * Format ISO datetime string with full context
 * Example: "Thu, Oct 9, 2025 · 7:00 PM PDT"
 */
export function formatEventDate(
  isoString: string,
  timeZone: string,
  locale = "en-US"
): string {
  const formatted = new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(isoString));

  // Convert "Thu, Oct 9, 2025, 7:00 PM PDT" → "Thu, Oct 9, 2025 · 7:00 PM PDT"
  return formatted.replace(/, (\d)/, " · $1");
}

/**
 * Pluralize ticket label
 */
export function pluralizeTickets(count: number): string {
  return count === 1 ? "ticket" : "tickets";
}

/**
 * Format availability label with timezone
 * Example: "Available until Oct 11 at 12:00 PM PDT"
 */
export function formatAvailabilityLabel(
  endsAt: string,
  timeZone: string,
  locale = "en-US"
): string {
  const formatted = new Intl.DateTimeFormat(locale, {
    timeZone,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(endsAt));

  return `Available until ${formatted}`;
}
```

### Usage Examples

```typescript
import { formatMoney, formatDate, pluralizeTickets } from "@/lib/utils/format";
import { dinero } from "dinero.js";
import { USD } from "@dinero.js/currencies";

// Money formatting
const price = dinero({ amount: 5500, currency: USD });
formatMoney(price, "USD"); // "$55.00"

// Date formatting
formatDate("2025-10-11T19:00:00Z", "America/Los_Angeles");
// "Oct 11, 2025, 12:00 PM"

// Ticket pluralization
`${count} ${pluralizeTickets(count)}`; // "1 ticket" or "2 tickets"
```

---

## 10. Type Definitions (Zod Schemas)

```typescript
// src/lib/schemas/tickets.ts
import * as z from "zod";

const dineroSchema = z.object({
  amount: z.number().int().nonnegative(),
  currency: z.string(),
});

const ticketPricingSchema = z.object({
  ticket: dineroSchema,
  strikePrice: dineroSchema.optional(),
  fees: z
    .object({
      amount: dineroSchema,
      included: z.boolean(),
      showBreakdown: z.boolean().optional(),
      label: z.string().optional(),
    })
    .optional(),
  tax: z
    .object({
      amount: dineroSchema,
      included: z.boolean(),
      showBreakdown: z.boolean().optional(),
      label: z.string().optional(),
    })
    .optional(),
});

export const ticketSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  pricing: ticketPricingSchema,
  status: z.enum([
    "on_sale",
    "scheduled",
    "sold_out",
    "waitlist",
    "ended",
    "hidden",
    "paused",
    "invite_only",
    "external",
  ]),
  availabilityLabel: z.string().optional(),
  salesWindow: z
    .object({
      startsAt: z.iso.datetime().optional(), // ISO 8601 UTC (e.g., "2025-10-11T19:00:00Z")
      endsAt: z.iso.datetime().optional(),
    })
    .optional(),
  limits: z
    .object({
      minPerOrder: z.number().int().positive().optional(),
      maxPerOrder: z.number().int().positive().optional(),
      maxPerPerson: z.number().int().positive().optional(),
    })
    .optional(),
  soldLimit: z.union([z.number().int().nonnegative(), z.literal("unlimited")]),
  soldCount: z.number().int().nonnegative().optional(),
  allowOversell: z.boolean().optional(),
  oversellBuffer: z.number().int().nonnegative().optional(),
  sortOrder: z.number().int().optional(),
  featured: z.boolean().optional(),
  badges: z
    .array(z.enum(["new", "limited", "best_value", "sold_out", "members_only"]))
    .optional(),
  requiresCode: z.boolean().optional(),
  visibility: z.enum(["public", "unlisted", "hidden"]).optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.iso.datetime().optional(), // For sorting fallback
});

export type Ticket = z.output<typeof ticketSchema>;
export type TicketInput = z.input<typeof ticketSchema>;

// src/lib/schemas/cart.ts
import * as z from "zod";

export const cartItemSchema = z.object({
  ticketId: z.string(),
  qty: z.number().int().min(0),
});

export type CartItem = z.output<typeof cartItemSchema>;
export type CartItemInput = z.input<typeof cartItemSchema>;

// src/lib/schemas/event.ts
import * as z from "zod";

export const eventSchema = z.object({
  id: z.string(),
  mixedTicketTypesAllowed: z.boolean(),
  currency: z.string(),
  timeZone: z.string(), // IANA timezone (e.g., "America/Los_Angeles") - for Intl.DateTimeFormat
  venueUtcOffset: z
    .string()
    .regex(/^[+-]\d{2}:\d{2}$/)
    .optional(), // e.g., "-07:00" - display only
});

export type Event = z.output<typeof eventSchema>;
```

**Note**: Types are automatically inferred from Zod schemas via `z.output<typeof schema>`. TanStack DB uses these schemas for both validation and type inference when you pass them to `createCollection({ schema })`.

---

## Summary: Component Responsibilities

| Component           | Responsibility                               | State              |
| ------------------- | -------------------------------------------- | ------------------ |
| **TicketsPanel**    | Orchestration, data loading, cart operations | Stateful (queries) |
| **TicketList**      | Rendering sorted tickets                     | Stateless          |
| **TicketCard**      | Ticket presentation, visual states           | Stateless          |
| **QuantityStepper** | Increment/decrement UI                       | Stateless          |
| **CartFooter**      | Pricing display, CTA                         | Stateless          |
| **TicketPrice**     | Price formatting with fees/tax               | Stateless          |

**Data flows down, events flow up**. All validation logic lives in the `ticketUIStates` query, not in individual components.

---

## Testing Strategy

### Extracting `computeTicketUI` for Testing

The `computeTicketUI` function is a pure derivation that should be extracted to a separate module for unit testing.

**Module:** `apps/frontrow/src/features/event/lib/computeTicketUI.ts`

```typescript
import { formatDate } from "@/lib/utils/format";
import type { Ticket } from "@/lib/schemas/tickets";

export interface TicketUIState {
  ticketId: string;
  currentQty: number;
  isPurchasable: boolean;
  isLocked: boolean;
  canIncrement: boolean;
  canDecrement: boolean;
  showTrashIcon: boolean;
  isGreyedOut: boolean;
  unavailableReason: string | null;
  helperText: string | null;
}

export function computeTicketUI(
  rows: Array<{ ticket: Ticket; qty: number }> | undefined,
  event: { mixedTicketTypesAllowed: boolean; timeZone: string },
  cart: { hasItems?: boolean } | undefined
): TicketUIState[] {
  // ... implementation from above (lines 333-437)
}
```

**Import in TicketsPanelClient:**

```typescript
import { computeTicketUI } from "@/features/event/lib/computeTicketUI";
```

### Test Coverage

**File:** `apps/frontrow/src/features/event/lib/computeTicketUI.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { computeTicketUI } from "./computeTicketUI";
import type { Ticket } from "@/lib/schemas/tickets";

const baseEvent = {
  mixedTicketTypesAllowed: false,
  timeZone: "America/Los_Angeles",
};

describe("computeTicketUI", () => {
  it("enforces minPerOrder for Group Package and shows 'Min 4 required'", () => {
    const group: Ticket = {
      id: "group-package",
      name: "Group Package (4+ people)",
      pricing: { ticket: { amount: 2000, currency: "USD" } },
      status: "on_sale",
      visibility: "public",
      limits: { minPerOrder: 4, maxPerOrder: 20 },
      soldLimit: 50,
    };

    const rows = [{ ticket: group, qty: 2 }];
    const ui = computeTicketUI(rows, baseEvent, { hasItems: true });

    expect(ui[0].helperText).toBe("Min 4 required");
    expect(ui[0].canDecrement).toBe(true);
    expect(ui[0].canIncrement).toBe(true);
    expect(ui[0].showTrashIcon).toBe(false); // qty=2 → minus icon, not trash
  });

  it("shows 'Only 3 left!' and blocks increment at capacity for Last Chance", () => {
    const lastChance: Ticket = {
      id: "last-chance",
      name: "Last Chance Tickets",
      pricing: { ticket: { amount: 3000, currency: "USD" } },
      status: "on_sale",
      visibility: "public",
      limits: { maxPerOrder: 4 },
      soldLimit: 100,
      soldCount: 97, // 3 remaining
    };

    // qty=3 should block increment (capacity reached)
    let ui = computeTicketUI([{ ticket: lastChance, qty: 3 }], baseEvent, {
      hasItems: true,
    });
    expect(ui[0].helperText).toBe("Only 3 left!");
    expect(ui[0].canIncrement).toBe(false); // capacity reached

    // qty=2 should allow increment to 3
    ui = computeTicketUI([{ ticket: lastChance, qty: 2 }], baseEvent, {
      hasItems: true,
    });
    expect(ui[0].helperText).toBe("Only 3 left!");
    expect(ui[0].canIncrement).toBe(true);
  });
});
```

### Vitest Configuration

**File:** `apps/frontrow/vitest.config.ts`

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts?(x)"],
  },
  esbuild: {
    jsx: "automatic",
  },
});
```

**Run tests:**

```bash
bun run test          # Run all tests
bun run test:watch    # Watch mode
```

**Why this matters:**

- **Pure functions are easy to test**: No mocking of React hooks or TanStack DB
- **Protects business logic**: The "min 4" and "3 left" behaviors are critical
- **Fast feedback**: Tests run in milliseconds, no DOM or async operations
- **Prevents regressions**: Helper text and button state changes are caught immediately
