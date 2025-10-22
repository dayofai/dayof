# TanStack DB Implementation Handoff (Frontrow TicketsPanel)

> **Purpose**: This document contains everything a new context needs to understand the current TanStack DB implementation before refactoring to Jotai + TanStack Query.

## Current Architecture Overview

**Stack:**

- TanStack DB (collections + live queries)
- TanStack Query (pricing only - debounced server calls)
- Mock data (12 test tickets covering all edge cases)

**Key Files:**

- `apps/frontrow/src/features/ticket-panel/components/TicketsPanel.tsx` - Main component (402 lines)
- `apps/frontrow/src/lib/mock-data.ts` - Mock tickets + pricing calculator
- `apps/frontrow/src/lib/schemas/tickets.ts` - Ticket schema (Zod)
- `apps/frontrow/src/lib/schemas/cart.ts` - Cart schema
- `apps/frontrow/src/lib/schemas/ticket-filters.ts` - Filter schema

## Data Schemas

### Ticket Schema

**Key fields:**

```typescript
{
  id: string;                    // e.g., 'vip', 'film-1'
  name: string;                  // Display name
  category?: string;             // 'vip', 'general', 'group', 'special' (for filtering)
  pricing: {
    ticket: { amount: number; currency: string };  // Amount in cents
    strikePrice?: { amount: number; currency: string }; // Optional
    fees?: { amount: Dinero; included: boolean; showBreakdown?: boolean; label?: string };
    tax?: { amount: Dinero; included: boolean; showBreakdown?: boolean; label?: string };
  };
  status: 'on_sale' | 'scheduled' | 'sold_out' | 'waitlist' | 'ended' | 'hidden' | 'paused' | 'invite_only' | 'external';
  salesWindow?: {
    startsAt?: string;           // ISO datetime
    endsAt?: string;             // ISO datetime
  };
  limits?: {
    minPerOrder?: number;        // e.g., 4 for group packages
    maxPerOrder?: number;        // e.g., 10 for VIP
    maxPerPerson?: number;       // e.g., 4 for limited releases
  };
  soldLimit: number | 'unlimited';
  soldCount?: number;
  allowOversell?: boolean;       // Allow over capacity
  oversellBuffer?: number;       // e.g., 10 extra
  sortOrder?: number;            // Manual ordering
  visibility?: 'public' | 'unlisted' | 'hidden';
  featured?: boolean;
  badges?: Array<'new' | 'limited' | 'best_value' | 'sold_out' | 'members_only'>;
}
```

### Cart Schema

```typescript
{
  ticketId: string;
  qty: number; // Must be >= 0
}
```

**Storage:** TanStack DB `LocalStorageCollection` (persists across refresh, syncs cross-tab)

### Filter Schema

```typescript
{
  id: string; // Always 'main' (singleton)
  showSoldOut: boolean; // Default: false
  showScheduled: boolean; // Default: false
  categoryFilter: string | null; // null = show all
  priceRange: {
    min: number | null; // Cents
    max: number | null; // Cents
  }
  searchQuery: string; // Text search (case-insensitive)
  sortBy: "sortOrder" | "price" | "name" | "availability";
  sortDirection: "asc" | "desc";
  page: number; // Pagination (future)
  pageSize: number; // Default: 50
}
```

**Storage:** TanStack DB `LocalOnlyCollection` (ephemeral, resets on reload)

## Mock Data (12 Test Tickets)

**File:** `apps/frontrow/src/lib/mock-data.ts`

Each ticket tests a specific scenario:

| ID                  | Name                 | Purpose                                             |
| ------------------- | -------------------- | --------------------------------------------------- |
| `vip`               | On Sale (Featured)   | Happy path: on_sale, capacity available, has limits |
| `film-1`            | On Sale (Standard)   | Basic ticket, no limits                             |
| `film-2`            | Limited Availability | Tests "Limited availability" helper (20 left)       |
| `film-3`            | Scheduled            | Tests `salesWindow.startsAt` (future)               |
| `group-package`     | Min 4 Required       | Tests `minPerOrder` constraint                      |
| `last-chance`       | Low Stock            | Tests "Only 3 left!" helper                         |
| `sold-out-status`   | Sold Out (Status)    | Tests `status: 'sold_out'`                          |
| `sold-out-capacity` | Sold Out (Capacity)  | Tests `soldCount >= soldLimit`                      |
| `ended-window`      | Ended                | Tests `salesWindow.endsAt` (past)                   |
| `invite-only`       | Invite Only          | Tests `status: 'invite_only'`                       |
| `paused`            | Paused               | Tests `status: 'paused'`                            |
| `external`          | External             | Tests `status: 'external'`                          |
| `max-per-order-2`   | Max 2 per order      | Tests `maxPerOrder: 2`                              |
| `max-per-person-4`  | Max 4 per person     | Tests `maxPerPerson: 4`                             |
| `oversell-buffer`   | Oversell enabled     | Tests `allowOversell + oversellBuffer`              |

**Pricing Calculator:**

```typescript
calculateCartTotal({ eventId, items }): Promise<{
  lines: Array<{ ticketId, name, qty, unitPrice, lineTotal }>;
  subtotal: Dinero;
  fees: Dinero;       // 10% of subtotal
  tax: Dinero;        // 8% of subtotal
  total: Dinero;
}>
```

- Simulates 300ms network delay
- Uses Dinero.js for currency math
- Returns full breakdown

## Current TanStack DB Implementation

### Collections (3)

**1. ticketsCollection** - `QueryCollection`

- Fetches from `mockTickets` (mocked API)
- Used for: ticket data, availability checks
- Key: `ticket.id`

**2. cartCollection** - `LocalStorageCollection`

- Stores: `Array<{ ticketId: string; qty: number }>`
- Key: `ticketId`
- Cross-tab sync: Yes (localStorage)
- Persists: Yes (survives reload)

**3. ticketFiltersCollection** - `LocalOnlyCollection`

- Stores: Single filter object (singleton with id='main')
- Key: `'main'`
- Ephemeral: Yes (resets on reload)

### Live Queries (4)

**Query 1: Cart Summary (Aggregate)**

```typescript
const {
  data: [cartState],
} = useLiveQuery((q) =>
  q.from({ cart: cartCollection }).select(({ cart }) => ({
    totalQty: sum(cart.qty),
    itemCount: count(cart.ticketId),
  }))
);
```

**Returns:** `{ totalQty: number; itemCount: number }`

---

**Query 2: Ticket UI States (Main Query - Complex)**

```typescript
const { data: ticketUIStates } = useLiveQuery((q) =>
  q.from({ ticket: ticketsCollection })
   .leftJoin({ cart: cartCollection }, ({ ticket, cart }) => eq(ticket.id, cart.ticketId))
   .fn.where((row) => {
     // Filtering logic (uses `filters` from singleton query)
     // - Hidden check: ticket.visibility !== 'hidden'
     // - Sold out filter: filters.showSoldOut
     // - Scheduled filter: filters.showScheduled
     // - Category: filters.categoryFilter
     // - Price range: filters.priceRange.{min,max}
     // - Search: ticket.name includes filters.searchQuery
   })
   .fn.select((row) => {
     // Complex UI state derivation (160 lines of logic)
     // - Compute remaining capacity
     // - Check if purchasable (status, date window, capacity)
     // - Locking logic (mixedTicketTypesAllowed)
     // - Helper text (priority-based)
     // - Unavailable reason (status-dependent)
     return { ticketId, ticket, currentQty, isPurchasable, isLocked, ... };
   })
   .orderBy(({ ticket }) => coalesce(ticket.sortOrder, 999))
   .orderBy(({ ticket }) => ticket.id)
);
```

**Key Logic in `.fn.select()`:**

1. **Remaining capacity calculation:**

   ```typescript
   const remaining =
     typeof ticket.soldLimit === "number"
       ? ticket.soldLimit - (ticket.soldCount ?? 0)
       : null;
   ```

2. **Purchasability check:**

   ```typescript
   const validStatus =
     ticket.status === "on_sale" || ticket.status === "waitlist";
   const startsOk =
     !ticket.salesWindow?.startsAt ||
     new Date(ticket.salesWindow.startsAt).getTime() <= now;
   const endsOk =
     !ticket.salesWindow?.endsAt ||
     new Date(ticket.salesWindow.endsAt).getTime() >= now;
   const hasCapacity = remaining === null || remaining > 0;
   const isPurchasable = validStatus && startsOk && endsOk && hasCapacity;
   ```

3. **Locking (one ticket type per order):**

   ```typescript
   const inCart = qty > 0;
   const hasCartItems = (cartState?.itemCount ?? 0) > 0;
   const isLocked = !event.mixedTicketTypesAllowed && hasCartItems && !inCart;
   ```

4. **Helper text (priority cascade):**

   - Priority 1: "Max N per order" (at limit)
   - Priority 2: "Only N left!" (remaining <= 5)
   - Priority 3: "N more available" (within 2 of max)
   - Priority 4: "Limited availability" (remaining <= 20)
   - Priority 5: "Max N per person" (qty=0, info only)
   - Priority 6: "Min N required" (below minPerOrder)

5. **Unavailable reason (conditional):**
   ```typescript
   if (isLocked) return "Remove other tickets to add this one";
   if (sold_out || !hasCapacity) return "Sold out";
   if (scheduled && startsAt) return `On sale ${formatDate(...)}`;
   if (ended || !endsOk) return `Sale ended ${formatDate(...)}`;
   if (invite_only) return "Requires unlock code";
   if (paused) return "Temporarily unavailable";
   if (external) return "Available externally";
   ```

**Returns:** `Array<TicketUIState>`

```typescript
interface TicketUIState {
  ticketId: string;
  ticket: Ticket;
  currentQty: number;
  isPurchasable: boolean;
  isLocked: boolean;
  canIncrement: boolean;
  canDecrement: boolean;
  showTrashIcon: boolean; // qty === 1
  isGreyedOut: boolean;
  isSelected: boolean; // qty > 0
  unavailableReason: string | null;
  helperText: string | null;
}
```

---

**Query 3: Checkout Validation (Aggregate)**

```typescript
const {
  data: [orderValidation],
} = useLiveQuery((q) =>
  q
    .from({ cart: cartCollection })
    .join({ ticket: ticketsCollection }, ({ cart, ticket }) =>
      eq(cart.ticketId, ticket.id)
    )
    .fn.where((row) => {
      const minPerOrder = row.ticket?.limits?.minPerOrder;
      return (
        typeof minPerOrder === "number" &&
        minPerOrder > 0 &&
        row.cart.qty < minPerOrder
      );
    })
    .select(() => ({ violationCount: count() }))
);
```

**Returns:** `{ violationCount: number }`  
**Purpose:** Disable checkout if any ticket has `qty < minPerOrder`

---

**Query 4: Cart Items (For Pricing)**

```typescript
const { data: cartItems } = useLiveQuery((q) =>
  q.from({ cart: cartCollection })
);
```

**Returns:** `Array<CartItem>`  
**Purpose:** Pass to `calculateCartTotal()` for server pricing

---

**Singleton Filter Query:**

```typescript
const filters = ticketFiltersCollection.get("main");
```

**Returns:** `TicketFilters | undefined`  
**Purpose:** Used inside Query 2's `.fn.where()` for filtering

## Cart Operations (Mutations)

**Increment:**

```typescript
const handleIncrement = (ticketId: string) => {
  const existing = cartCollection.get(ticketId);
  if (existing) {
    cartCollection.update(ticketId, (draft) => {
      draft.qty += 1;
    });
  } else {
    cartCollection.insert({ ticketId, qty: 1 });
  }
  onChange?.(cartCollection.toArray);
};
```

**Decrement:**

```typescript
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
  onChange?.(cartCollection.toArray);
};
```

## Pricing Integration (TanStack Query)

**Debounced cart → server pricing:**

```typescript
const [debouncedCartItems] = useDebouncedValue(cartItems ?? [], { wait: 500 });

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
  enabled: (cartState?.itemCount ?? 0) > 0,
  placeholderData: keepPreviousData,
});
```

**Key details:**

- Debounced 500ms (avoid hammering API during rapid changes)
- Disabled when cart is empty
- Uses `keepPreviousData` to avoid flash during recalc
- Returns Dinero.js pricing breakdown

## Component Hierarchy

```
TicketsPanel (wrapper with TooltipProvider + ClientOnly)
└─ TicketsPanelClient
   ├─ TicketList
   │  └─ TicketCard (x12)
   │     └─ QuantityStepper
   └─ CartFooter
      └─ Checkout button + pricing
```

**Props flow:**

- `TicketsPanel` → `TicketsPanelClient`: eventId, event config, callbacks, UI options
- `TicketsPanelClient` → `TicketList`: tickets, uiStates, handlers
- `TicketList` → `TicketCard`: individual ticket + uiState + handlers
- `TicketsPanelClient` → `CartFooter`: cartState, pricing, validation

## Key Business Logic (UI State Derivation)

**All currently in `.fn.select()` callback (lines 162-270):**

1. **Capacity calculation** (lines 168-172)
2. **Purchasability check** (lines 175-185)
3. **Locking logic** (lines 188-191)
4. **Effective max** (lines 194-197)
5. **Helper text priority cascade** (lines 200-226)
6. **Unavailable reason conditional** (lines 229-254)
7. **Return TicketUIState** (lines 257-270)

**This is the main logic to extract to `computeTicketUI()` pure function.**

## Testing Surface

**Current state:**

- No `computeTicketUI()` unit tests (logic is in query DSL)
- Component tests exist but test props/render, not logic
- Manual testing in `/ticket-playground` route

**After refactor:**

- Restore `computeTicketUI()` unit tests (from git history)
- Keep component tests unchanged (test interface, not impl)

## Pain Points (Why We're Refactoring)

1. **Complex query DSL** - 160 lines of business logic embedded in `.fn.select()`
2. **Singleton filter workaround** - Can't join singleton in TanStack DB, must query separately
3. **Hard to test** - Business logic is in query callback, not pure function
4. **Overkill for scale** - TanStack DB's power (differential dataflow, cross-collection joins) unused for 6-12 tickets
5. **Team onboarding** - Learning TanStack DB query DSL vs. simpler atoms

## Files to Keep After Refactor

**Schemas (still needed for Jotai):**

- `apps/frontrow/src/lib/schemas/tickets.ts`
- `apps/frontrow/src/lib/schemas/cart.ts`
- `apps/frontrow/src/lib/schemas/ticket-filters.ts`

**Mock data:**

- `apps/frontrow/src/lib/mock-data.ts` (used in atomWithQuery)

**Components (unchanged):**

- `TicketList.tsx`, `TicketCard.tsx`, `CartFooter.tsx`, `QuantityStepper.tsx`

## Files to Delete After Refactor

**Collections (replaced by atoms):**

- `apps/frontrow/src/lib/collections/tickets.ts`
- `apps/frontrow/src/lib/collections/cart.ts`
- `apps/frontrow/src/lib/collections/ticket-filters.ts`

## Migration Strategy Summary

**Before (TanStack DB):**

```
ticketsCollection (QueryCollection)
  ↓
  leftJoin cartCollection (LocalStorageCollection)
  ↓
  .fn.where() with filters from ticketFiltersCollection (LocalOnlyCollection)
  ↓
  .fn.select() with 160 lines of business logic
  ↓
  TicketUIState[]
```

**After (Jotai + Query):**

```
atomWithQuery (TanStack Query)  →  ticketsAtom (data)
                                    ↓
atomWithStorage (Jotai)         →  cartAtom
                                    ↓
atom (Jotai)                    →  filtersAtom
                                    ↓
                              ticketUIStatesAtom (derived)
                                    ↓
                              computeTicketUI(tickets, cart, filters, event)
                                    ↓
                              TicketUIState[]
```

**Key change:** Business logic moves from query DSL → pure function called by derived atom.

## Quick Reference: Current Query Count

- **4 live queries** (cart summary, ticket UI states, checkout validation, cart items)
- **1 singleton get** (filter state)
- **1 debounced React Query** (server pricing)

**After refactor:**

- **0 live queries** (all replaced by atoms)
- **1 React Query** (server pricing - unchanged)
- **3 base atoms** (tickets, cart, filters)
- **2 derived atoms** (cartSummary, ticketUIStates)

## Environment & Execution Context

- **Runtime:** Browser only (no SSR for TicketsPanel yet, uses `ClientOnly`)
- **Storage:** LocalStorage (cart persists, filters ephemeral)
- **Package versions:** TanStack DB (latest), TanStack Query v5, TanStack Pacer
