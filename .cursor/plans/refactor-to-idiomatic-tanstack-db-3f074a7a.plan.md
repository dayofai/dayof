<!-- 3f074a7a-e264-44b5-ae80-d850fa4a7756 92942fe6-3016-42fe-bd21-c87257f79ec8 -->
# Simplify Frontrow to TanStack Query + Jotai

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

---

## Overview

Replace TanStack DB with TanStack Query (for server data) + Jotai (for client state) in Frontrow. This dramatically simplifies the mental model while keeping the migration path to TanStack DB open for when real-time sync is needed.

**Key insight:** TanStack DB is the right tool for **Backstage** (admin dashboard with real-time updates, large tables, complex joins). For **Frontrow** (e-commerce with 6-12 tickets, client-only cart/filters), Query + Jotai is simpler and sufficient.

## UI State Semantics Reference

This section documents all UI states from a **semantic/business perspective** - what each state means to the user, when it occurs, and what behavior it drives.

### Ticket Card States

A ticket card can be in one of these semantic states:

**1. Available for Purchase**

- **Meaning**: User can add this ticket to cart right now
- **Triggers**: Status is "on_sale", within sales window, has capacity
- **Visual**: Default styling, green availability dot, "Add" button or quantity stepper
- **Behavior**: Clicking adds to cart (qty=0) or shows stepper (qty>0)

**2. In Cart (Selected)**

- **Meaning**: User has selected this ticket (qty > 0)
- **Triggers**: Cart contains this ticket
- **Visual**: Highlighted background, quantity stepper visible
- **Behavior**: Shows trash icon (qty=1) or minus icon (qty>1)

**3. At Maximum Limit**

- **Meaning**: User has reached the maximum allowed quantity
- **Triggers**: qty >= maxPerOrder OR qty >= maxPerPerson OR qty >= capacity
- **Visual**: Increment button disabled, helper text "Max N per order"
- **Behavior**: Cannot add more

**4. Below Minimum Requirement**

- **Meaning**: User added some, but not enough to meet minimum
- **Triggers**: qty > 0 AND qty < minPerOrder
- **Visual**: Helper text "Min N required", checkout button disabled
- **Behavior**: Can still increment/decrement, but can't checkout

**5. Low Inventory Warning**

- **Meaning**: Very few tickets remaining (scarcity signal)
- **Triggers**: remaining > 0 AND remaining <= 5 (critical) OR remaining <= 20 (warning)
- **Visual**: Orange dot, "Only 3 left!" or "Limited availability"
- **Behavior**: Still purchasable, but urgency messaging

**6. Locked (One Type Per Order)**

- **Meaning**: User added a different ticket type, can't mix
- **Triggers**: mixedTicketTypesAllowed=false AND cart has items AND this ticket not in cart
- **Visual**: Greyed out, "Remove other tickets to add this one"
- **Behavior**: Cannot add until cart is cleared

**7. Sold Out (No Capacity)**

- **Meaning**: No tickets remaining
- **Triggers**: soldLimit reached OR status = "sold_out"
- **Visual**: Greyed out, "Sold out" badge
- **Behavior**: Cannot purchase

**8. Scheduled (Future Sale)**

- **Meaning**: Ticket goes on sale at a future time
- **Triggers**: status = "scheduled" AND salesWindow.startsAt > now
- **Visual**: Greyed out, "On sale Oct 11, 10:30 AM PDT"
- **Behavior**: Cannot purchase yet

**9. Sale Ended**

- **Meaning**: Sales window has closed
- **Triggers**: status = "ended" OR salesWindow.endsAt < now
- **Visual**: Greyed out, "Sale ended Oct 11, 4:30 PM PDT"
- **Behavior**: Cannot purchase anymore

**10. Invite Only**

- **Meaning**: Requires unlock code to purchase
- **Triggers**: status = "invite_only"
- **Visual**: Greyed out, "Requires unlock code"
- **Behavior**: Shows unlock code input (future enhancement)

**11. Paused**

- **Meaning**: Temporarily disabled by event organizer
- **Triggers**: status = "paused"
- **Visual**: Greyed out, "Temporarily unavailable"
- **Behavior**: Cannot purchase

**12. External Purchase**

- **Meaning**: Must buy elsewhere (redirects to external site)
- **Triggers**: status = "external"
- **Visual**: Greyed out, "Available externally"
- **Behavior**: Shows external link (future enhancement)

### Cart Footer States

**1. Empty State**

- **Meaning**: No tickets selected yet
- **Triggers**: cart.length = 0
- **Visual**: Disabled button, "Select tickets to continue"
- **Behavior**: Cannot checkout

**2. Loading Pricing**

- **Meaning**: Calculating totals from server
- **Triggers**: cart.length > 0 AND pricing query pending
- **Visual**: Button shows "Calculating..."
- **Behavior**: Cannot checkout while loading

**3. Ready to Checkout**

- **Meaning**: Cart has items, pricing loaded, no validation errors
- **Triggers**: cart.length > 0 AND pricing available AND no violations
- **Visual**: Pricing breakdown visible, active "Get N tickets" button
- **Behavior**: Click proceeds to checkout

**4. Checkout Blocked (Validation Error)**

- **Meaning**: Cart violates a constraint (below min, exceeds max, etc.)
- **Triggers**: Any ticket with qty < minPerOrder
- **Visual**: Disabled button, error messaging on affected tickets
- **Behavior**: Cannot checkout until fixed

**5. Pricing Error**

- **Meaning**: Server failed to calculate totals
- **Triggers**: Pricing query error
- **Visual**: Error message, "Retry" button
- **Behavior**: User must retry or wait

### Helper Text Meanings (Priority Order)

Helper text provides contextual guidance. Only one shows per ticket (highest priority wins):

**Priority 1: At Limit**

- "Max 10 per order" - User hit maxPerOrder ceiling
- Meaning: Cannot add more due to event rules

**Priority 2: Critical Low Inventory**

- "Only 3 left!" - Fewer than 5 tickets remaining
- Meaning: High scarcity, act quickly

**Priority 3: Approaching Limit**

- "1 more available" - Within 2 of maxPerOrder
- Meaning: Almost at limit, heads up

**Priority 4: Low Inventory Warning**

- "Limited availability" - 6-20 tickets remaining
- Meaning: Moderate scarcity signal

**Priority 5: Per-Person Limit (Info)**

- "Max 4 per person" - Shows maxPerPerson when qty=0
- Meaning: Informational, not urgent

**Priority 6: Below Minimum**

- "Min 4 required" - User added qty < minPerOrder
- Meaning: Cannot checkout yet, add more

### Checkout Button States

**1. Disabled (Empty Cart)**

- Label: "Select tickets to continue"
- Meaning: No action possible yet

**2. Disabled (Validation Error)**

- Label: "Get N tickets" (dimmed)
- Meaning: Fix validation errors before proceeding

**3. Loading**

- Label: "Calculating..."
- Meaning: Wait for server pricing

**4. Ready**

- Label: "Get ticket" (singular) or "Get tickets" (plural)
- Meaning: Proceed to checkout flow

### Quantity Stepper States

**Icon Semantics:**

- **Trash icon** (qty=1): Removing will delete item entirely from cart
- **Minus icon** (qty>1): Decrement quantity but keep item in cart
- **Plus icon**: Add one more

**Button States:**

- Both enabled: Normal operation within limits
- Plus disabled: At maximum (capacity, maxPerOrder, or maxPerPerson)
- Minus disabled: Shouldn't happen (qty should never be <1 when stepper visible)

## Why Query + Jotai Solves Your Problems

### No Prop Drilling ✅

**Jotai atoms are global state** - accessible anywhere without props:

```typescript
// Define once
const cartAtom = atomWithStorage('cart:v1', []);

// Use anywhere (no props needed)
function TicketsPanel() {
  const cart = useAtomValue(cartAtom);
}

function CartSummary() {
  const cart = useAtomValue(cartAtom); // Same atom, no drilling
}
```

### No useMemo Hell ✅

**Derived atoms handle dependencies automatically:**

```typescript
// Derived atom (auto-tracks dependencies)
const ticketUIStatesAtom = atom((get) => {
  const tickets = get(ticketsAtom);
  const cart = get(cartAtom);
  const filters = get(filtersAtom);
  
  // Jotai re-runs this when tickets/cart/filters change
  return deriveTicketUI(tickets, cart, filters);
});

// Component (clean)
const ticketUIStates = useAtomValue(ticketUIStatesAtom);
// No useMemo, no dependency array, just works
```

### Still Reactive ✅

Jotai provides fine-grained reactivity - only components using changed atoms re-render.

## Phase 0: Update TanStack DB Documentation Scope

### 0.1 Update tanstack-db-patterns.md

**File:** `context/tanstack-db-patterns.md`

Add scope section at the top:

````markdown
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
  queryKey: ['tickets', eventId],
  queryFn: () => fetch(`/api/tickets/${eventId}`).then(r => r.json()),
});

// Client state - Jotai
const cartAtom = atomWithStorage<CartItem[]>('cart:v1', []);
const filtersAtom = atom({ showSoldOut: false, categoryFilter: null });

// Derived state - Jotai
const ticketUIStatesAtom = atom((get) => {
  const ticketsData = tickets ?? [];
  const cart = get(cartAtom);
  const filters = get(filtersAtom);
  
  return deriveTicketUI(ticketsData, cart, filters, event);
});
````

**Migration path:** When Frontrow needs real-time sync, swap `useQuery` → `createCollection(queryCollectionOptions(...))`. The rest stays the same.

[Rest of TanStack DB patterns remain for Backstage reference]

`````

## Phase 1: Install Jotai and Integration Libraries

### 1.1 Add Dependencies

```bash
cd apps/frontrow
bun add jotai jotai-tanstack-query @tanstack/react-query @tanstack/react-pacer
```

**What each package does:**
- `jotai` - Core state management (atoms)
- `jotai-tanstack-query` - Bridge between Jotai atoms and TanStack Query ([GitHub](https://github.com/jotaijs/jotai-tanstack-query))
- `@tanstack/react-query` - React adapter for TanStack Query (peer for jotai-tanstack-query)
- `@tanstack/react-pacer` - Debounce/rate-limit utilities (we use `useDebouncedValue`)

### 1.2 Setup SSR Integration (TanStack Start + Jotai)

**File:** `apps/frontrow/src/routes/__root.tsx` (update existing)

Add Jotai Provider and hydrate the queryClientAtom to share TanStack Start's QueryClient with Jotai atoms:

```typescript
import { Provider as JotaiProvider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { queryClientAtom } from 'jotai-tanstack-query';

// Hydration component to sync QueryClient
function HydrateAtoms({ children }: { children: React.ReactNode }) {
  const { queryClient } = Route.useRouteContext();
  
  // KEY: Initialize Jotai's queryClientAtom with TanStack Start's QueryClient
  // This ensures atoms and route loaders share the same QueryClient instance
  useHydrateAtoms([[queryClientAtom, queryClient]]);
  
  return children;
}

function RootComponent() {
  return (
    <html lang="en">
      <head>{/* ... existing head content ... */}</head>
      <body>
        <JotaiProvider>
          <HydrateAtoms>
            {/* Your existing app structure */}
            <Outlet />
          </HydrateAtoms>
        </JotaiProvider>
        <Scripts />
      </body>
    </html>
  );
}
```

**Why this is needed:**

Without this setup:
- ❌ Route loaders prefetch data into TanStack Start's QueryClient
- ❌ Jotai atoms create their own separate QueryClient
- ❌ Data gets fetched twice (server + client)

With this setup:
- ✅ Route loaders prefetch data (server-side)
- ✅ Jotai atoms read from the same QueryClient (no duplicate fetch)
- ✅ Proper SSR hydration

**Reference:** [jotai-tanstack-query SSR docs](https://jotai.org/docs/extensions/query#ssr-support)

## Phase 2: Create Jotai Atoms

### 2.1 Create Cart Atom

**File:** `apps/frontrow/src/lib/atoms/cart.ts` (new file)

```typescript
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { CartItem } from '@/lib/schemas/cart';

/**
 * Persistent cart state (localStorage)
 * 
 * Cross-tab sync: Jotai's atomWithStorage syncs across tabs automatically
 * SSR-safe: Only hydrates on client (window check built-in)
 */
export const cartAtom = atomWithStorage<CartItem[]>(
  'frontrow:ticket-cart:v1',
  []
);

/**
 * Cart aggregates (derived atom)
 * Auto-updates when cartAtom changes
 */
export const cartSummaryAtom = atom((get) => {
  const cart = get(cartAtom);
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  
  return {
    totalQty,
    hasItems: cart.length > 0,
    itemCount: cart.length,
  };
});

/**
 * Helper actions (not atoms, just functions)
 */
export const cartActions = {
  increment: (set: any, ticketId: string) => {
    set(cartAtom, (prev: CartItem[]) => {
      const existing = prev.find(item => item.ticketId === ticketId);
      if (existing) {
        return prev.map(item =>
          item.ticketId === ticketId
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [...prev, { ticketId, qty: 1 }];
    });
  },
  
  decrement: (set: any, ticketId: string) => {
    set(cartAtom, (prev: CartItem[]) => {
      const existing = prev.find(item => item.ticketId === ticketId);
      if (!existing) return prev;
      
      if (existing.qty === 1) {
        return prev.filter(item => item.ticketId !== ticketId);
      }
      
      return prev.map(item =>
        item.ticketId === ticketId
          ? { ...item, qty: item.qty - 1 }
          : item
      );
    });
  },
};
```

### 2.2 Create Filter Atom

**File:** `apps/frontrow/src/lib/atoms/ticket-filters.ts` (new file)

```typescript
import { atom } from 'jotai';
import type { TicketFilters } from '@/lib/schemas/ticket-filters';

/**
 * Ephemeral filter state (resets on page reload)
 * For persistent filters, use atomWithStorage instead
 */
export const ticketFiltersAtom = atom<TicketFilters>({
  id: 'main',
  showSoldOut: false,
  showScheduled: false,
  categoryFilter: null,
  priceRange: { min: null, max: null },
  searchQuery: '',
  sortBy: 'sortOrder',
  sortDirection: 'asc',
  page: 1,
  pageSize: 50,
});

/**
 * Helper actions
 */
export const filterActions = {
  update: (set: any, updates: Partial<TicketFilters>) => {
    set(ticketFiltersAtom, (prev: TicketFilters) => ({
      ...prev,
      ...updates,
    }));
  },
  
  reset: (set: any) => {
    set(ticketFiltersAtom, {
      id: 'main',
      showSoldOut: false,
      showScheduled: false,
      categoryFilter: null,
      priceRange: { min: null, max: null },
      searchQuery: '',
      sortBy: 'sortOrder',
      sortDirection: 'asc',
      page: 1,
      pageSize: 50,
    });
  },
};
```

### 2.3 Create Tickets Atom (Bridge from Query)

**File:** `apps/frontrow/src/lib/atoms/tickets.ts` (new file)

```typescript
import { atom } from 'jotai';
import { atomsWithQuery } from 'jotai-tanstack-query';
import type { Ticket } from '@/lib/schemas/tickets';

/**
 * Bridge TanStack Query → Jotai
 * 
 * This atom fetches tickets using TanStack Query under the hood
 * Easy to swap to TanStack DB collection later
 */
export const ticketsQueryAtom = atomsWithQuery((get) => ({
  queryKey: ['tickets', 'evt_123'], // In real app, get eventId from route
  queryFn: async (): Promise<Ticket[]> => {
    // For now, return mock data
    // Later: fetch(`/api/events/${eventId}/tickets`).then(r => r.json())
    const { mockTickets } = await import('@/lib/mock-data');
    return mockTickets;
  },
  refetchOnWindowFocus: true,
  staleTime: 20000,
}));

// Unwrap the query result for easier use
export const ticketsAtom = atom((get) => {
  const query = get(ticketsQueryAtom);
  return query.data ?? [];
});
```

### 2.4 Create Derived UI States Atom

**File:** `apps/frontrow/src/lib/atoms/ticket-ui-states.ts` (new file)

```typescript
import { atom } from 'jotai';
import { cartAtom } from './cart';
import { ticketFiltersAtom } from './ticket-filters';
import { ticketsAtom } from './tickets';
import { computeTicketUI } from '@/features/ticket-panel/lib/computeTicketUI';
import type { Event } from '@/lib/schemas/event';

/**
 * Derived ticket UI states
 * 
 * Automatically recomputes when tickets, cart, or filters change
 * This replaces the TanStack DB .fn.select() query
 */
export const ticketUIStatesAtomFamily = (event: Pick<Event, 'mixedTicketTypesAllowed' | 'timeZone'>) =>
  atom((get) => {
    const tickets = get(ticketsAtom);
    const cart = get(cartAtom);
    const filters = get(ticketFiltersAtom);
    
    // 1. Apply filters
    const filtered = tickets
      .filter(t => t.visibility !== 'hidden')
      .filter(t => filters.showSoldOut || t.status !== 'sold_out')
      .filter(t => filters.showScheduled || t.status !== 'scheduled')
      .filter(t => !filters.categoryFilter || t.category === filters.categoryFilter)
      .filter(t => !filters.priceRange.min || t.pricing.ticket.amount >= filters.priceRange.min)
      .filter(t => !filters.priceRange.max || t.pricing.ticket.amount <= filters.priceRange.max)
      .filter(t => !filters.searchQuery || t.name.toLowerCase().includes(filters.searchQuery.toLowerCase()));
    
    // 2. Join with cart and compute UI states
    const cartMap = new Map(cart.map(item => [item.ticketId, item.qty]));
    const hasCartItems = cart.length > 0;
    
    const rows = filtered.map(ticket => ({
      ticket,
      qty: cartMap.get(ticket.id) ?? 0,
    }));
    
    return computeTicketUI(rows, event, { hasItems: hasCartItems });
  });
```

## Phase 3: Restore computeTicketUI Pure Function

### 3.1 Recreate computeTicketUI.ts

**File:** `apps/frontrow/src/features/ticket-panel/lib/computeTicketUI.ts` (restore)

Copy from git history or recreate the pure function that takes:

- `rows: Array<{ ticket: Ticket; qty: number }>`
- `event: { mixedTicketTypesAllowed: boolean; timeZone: string }`
- `cart: { hasItems: boolean }`

Returns: `TicketUIState[]`

This is the same logic that's currently in `.fn.select()`, just extracted to a testable pure function.

### 3.2 Restore computeTicketUI Tests

**File:** `apps/frontrow/src/features/ticket-panel/lib/__tests__/computeTicketUI.test.ts` (restore)

Restore the unit tests from git history. These are valuable and should be kept.

## Phase 4: Refactor TicketsPanel to Use Atoms

### 4.1 Simplify TicketsPanel Component

**File:** `apps/frontrow/src/features/ticket-panel/components/TicketsPanel.tsx`

**Remove:**

- All TanStack DB imports (`useLiveQuery`, `eq`, `sum`, `count`, etc.)
- All collection imports (`ticketsCollection`, `cartCollection`, `ticketFiltersCollection`)
- All query definitions (cart state query, ticket UI states query, validation query)

**Replace with:**

```typescript
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useDebouncedValue } from '@tanstack/react-pacer/debouncer';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ClientOnly } from '@tanstack/react-router';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cartAtom, cartSummaryAtom, cartActions } from '@/lib/atoms/cart';
import { ticketUIStatesAtomFamily } from '@/lib/atoms/ticket-ui-states';
import { calculateCartTotal } from '@/lib/mock-data';
import type { Event } from '@/lib/schemas/event';
import { CartFooter } from './CartFooter';
import { TicketList } from './TicketList';

// ... TicketsPanelProps, TicketUIState types remain

function TicketsPanelClient({ eventId, event, onCheckout, onChange, ui }: TicketsPanelProps) {
  // 1. Cart state (Jotai atom)
  const [cart, setCart] = useAtom(cartAtom);
  const cartSummary = useAtomValue(cartSummaryAtom);
  
  // 2. Ticket UI states (derived atom - no useMemo needed!)
  const ticketUIStatesAtomInstance = React.useMemo(
    () => ticketUIStatesAtomFamily(event),
    [event.mixedTicketTypesAllowed, event.timeZone]
  );
  const ticketUIStates = useAtomValue(ticketUIStatesAtomInstance);
  
  // 3. Checkout validation (simple derived state)
  const hasMinViolation = React.useMemo(() => {
    return ticketUIStates.some(state => 
      state.currentQty > 0 && 
      state.ticket.limits?.minPerOrder &&
      state.currentQty < state.ticket.limits.minPerOrder
    );
  }, [ticketUIStates]);
  
  // 4. Pricing (debounced server call)
  const [debouncedCart] = useDebouncedValue(cart, { wait: 500 });
  const {
    data: pricing,
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: ['cart-pricing', eventId, debouncedCart],
    queryFn: () =>
      calculateCartTotal({
        eventId,
        items: debouncedCart.map(i => ({
          ticketId: i.ticketId,
          qty: i.qty,
        })),
      }),
    enabled: cartSummary.hasItems,
    placeholderData: keepPreviousData,
  });
  
  // 5. Handlers (use Jotai actions)
  const handleIncrement = (ticketId: string) => {
    cartActions.increment(setCart, ticketId);
    onChange?.(cart);
  };
  
  const handleDecrement = (ticketId: string) => {
    cartActions.decrement(setCart, ticketId);
    onChange?.(cart);
  };
  
  // 6. Render
  const tickets = ticketUIStates.map(state => state.ticket);
  
  return (
    <Card className="...">
      {/* ... same render logic ... */}
      <TicketList
        tickets={tickets}
        uiStates={ticketUIStates}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
      />
      
      <CartFooter
        cartState={cartSummary}
        checkoutDisabled={hasMinViolation}
        pricing={pricing}
        currency={event.currency}
        isPricingLoading={isPending}
        error={error}
        onRetry={() => refetch()}
        onCheckout={() => onCheckout(cart, pricing)}
        ctaLabel={ui?.ctaLabel}
        ctaVariant={ui?.ctaVariant}
        footnote={ui?.footnote}
      />
    </Card>
  );
}
```

## Phase 5: Remove TanStack DB Infrastructure

### 5.1 Delete Collection Files

**Delete:**

- `apps/frontrow/src/lib/collections/tickets.ts`
- `apps/frontrow/src/lib/collections/cart.ts`
- `apps/frontrow/src/lib/collections/ticket-filters.ts`

These are replaced by Jotai atoms.

### 5.2 Keep Filter Schema

**Keep:** `apps/frontrow/src/lib/schemas/ticket-filters.ts`

The schema is still useful for type safety, just used with Jotai instead of TanStack DB.

### 5.3 Update Package Dependencies

**Optional:** If TanStack DB is only used in Backstage, move it to backstage-specific dependencies.

## Phase 6: Update Documentation

### 6.1 Create Frontrow State Management Guide

**File:** `context/frontrow-state-patterns.md` (new file)

````markdown
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
  queryKey: ['tickets', eventId],
  queryFn: () => fetch(`/api/tickets/${eventId}`).then(r => r.json()),
  refetchOnWindowFocus: true,
  staleTime: 20000,
});
`````

### Client State (Cart, Filters)

```typescript
// Atoms (global state, no prop drilling)
const cartAtom = atomWithStorage('cart:v1', []);
const filtersAtom = atom({ showSoldOut: false });

// Use anywhere
function Component() {
  const cart = useAtomValue(cartAtom);
  const filters = useAtomValue(filtersAtom);
}
```

### Derived State (No useMemo!)

```typescript
// Derived atom auto-tracks dependencies
const ticketUIStatesAtom = atom((get) => {
  const tickets = get(ticketsAtom);
  const cart = get(cartAtom);
  const filters = get(filtersAtom);
  
  return deriveTicketUI(tickets, cart, filters);
});

// Component (clean)
const uiStates = useAtomValue(ticketUIStatesAtom);
```

### Actions (Update State)

```typescript
// Update atom
const setCart = useSetAtom(cartAtom);
setCart(prev => [...prev, newItem]);

// Or use helper functions
cartActions.increment(setCart, ticketId);
```

## Testing

Pure functions remain testable:

```typescript
describe('computeTicketUI', () => {
  it('enforces min quantity', () => {
    const rows = [{ ticket: groupTicket, qty: 2 }];
    const ui = computeTicketUI(rows, event, { hasItems: true });
    
    expect(ui[0].helperText).toBe('Min 4 required');
  });
});
```

## Migration Path to TanStack DB (Future)

When you need real-time sync:

```typescript
// Before (TanStack Query + Jotai)
const { data: tickets } = useQuery(['tickets', eventId], fetchTickets);

// After (TanStack DB)
const ticketsCollection = createCollection(
  queryCollectionOptions({ 
    queryKey: ['tickets', eventId],
    queryFn: fetchTickets,
  })
);
const { data: tickets } = useLiveQuery(q => q.from({ ticket: ticketsCollection }));
```

The Jotai atoms can stay - they'll just read from TanStack DB collections instead of Query.

````

## Phase 7: Testing

### 7.1 Run Tests

```bash
bun test apps/frontrow/src/features/ticket-panel
````

The existing component tests should pass unchanged (they test props, not implementation).

### 7.2 Manual Testing

Test in `/ticket-playground`:

- Add/remove tickets
- Verify helper text ("Min 4 required", "Max 2 per order")
- Check cart persistence (refresh page)
- Verify pricing calculations

## Expected Outcomes

After this refactoring:

1. **Simpler mental model** - Just atoms and derived atoms (no collections, no query DSL)
2. **No prop drilling** - Atoms are global, accessible anywhere
3. **No useMemo** - Derived atoms handle dependencies automatically
4. **Easier onboarding** - Team learns Jotai (atoms) instead of TanStack DB (collections/queries/expressions)
5. **Still reactive** - Jotai provides fine-grained reactivity
6. **Easy migration** - Clear path to TanStack DB when you add real-time sync
7. **Better separation** - TanStack DB for Backstage, Query+Jotai for Frontrow

## Files Created

- `apps/frontrow/src/lib/atoms/cart.ts`
- `apps/frontrow/src/lib/atoms/ticket-filters.ts`
- `apps/frontrow/src/lib/atoms/tickets.ts`
- `apps/frontrow/src/lib/atoms/ticket-ui-states.ts`
- `apps/frontrow/src/features/ticket-panel/lib/computeTicketUI.ts` (restored)
- `apps/frontrow/src/features/ticket-panel/lib/__tests__/computeTicketUI.test.ts` (restored)
- `context/frontrow-state-patterns.md`

## Files Deleted

- `apps/frontrow/src/lib/collections/tickets.ts`
- `apps/frontrow/src/lib/collections/cart.ts`
- `apps/frontrow/src/lib/collections/ticket-filters.ts`

## Files Modified

- `apps/frontrow/package.json` (add jotai, optional: add jotai-tanstack-query)
- `apps/frontrow/src/features/ticket-panel/components/TicketsPanel.tsx` (major simplification)
- `context/tanstack-db-patterns.md` (add scope - Backstage only)

## Success Criteria

- ✅ No TanStack DB in Frontrow (Query + Jotai only)
- ✅ All tests pass
- ✅ Ticket selection works in playground
- ✅ Cart persists across refresh (atomWithStorage)
- ✅ No prop drilling (atoms are global)
- ✅ No useMemo for derived state (derived atoms)
- ✅ Clean migration path to TanStack DB documented

### To-dos

- [ ] Update dependencies to @tanstack/react-query and add @tanstack/react-pacer
- [ ] Use atomWithQuery (singular, not atomsWithQuery) for tickets atom
- [ ] Implement manual hydration with useHydrateAtoms (already specified in Phase 1.2)
- [ ] Audit imports for keepPreviousData from @tanstack/react-query
- [ ] Verify useDebouncedValue import from @tanstack/react-pacer/debouncer