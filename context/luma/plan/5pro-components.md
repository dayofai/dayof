# Components

> Compatibility note (TanStack Start): This plan is compatible with TanStack Start. Use `createServerFn` from `@tanstack/react-start`; add `@tanstack/react-db` and `@tanstack/query-db-collection`; construct LocalStorage collections client-side only (guard `typeof window !== 'undefined'`) to avoid SSR; and expose `/api/events/[eventId]/tickets` (GET) plus a `calculateCartTotal` server function for pricing.

---

> Notes grounded in Luma’s DOM
> The Luma event page exposes sections such as a “Hosted By” card, attendees/“Going” strip, title/featured pill, date/time rows, and location rows; you can see evidence of these in the page structure (e.g., `.hosts`, `.title`, `.calendar-card`, `.info-rows`, `.guests-button`, `.featured-pill`).

---

## 1) High‑level page composition

```none
<EventPage>
  <EventHero>
    <FeaturedInPill />        // “Featured in …”
    <EventTitle />
    <PresentedByBadge />      // “Presented by …”
    <HeroActions />           // Share/Subscribe
  </EventHero>

  <EventMeta>
    <EventDateTime />
    <EventLocation />
    <AddToCalendarButtons />       // optional; render only if calendar data available
  </EventMeta>

  <TicketsPanel>              // Drawer / card / modal (“Get Tickets”)
    <TicketList>
      <TicketCard featured />
      <TicketCard />
      <TicketCard />
    </TicketList>
    <CartFooter />            // total, CTA
  </TicketsPanel>

  <AboutCard />
  <HostedByCard />
  <AttendeesCard />
  <CategoryChips />
  <FooterActions />           // Contact host, Report event
</EventPage>
```

---

## 2) Key components and their **functional inputs**

Below, each component lists **what it needs** (props/data). Enums and types are expanded in §3.

### EventHero

- `event: Event`
- `featuredIn?: { name: string; url?: string; avatarUrl?: string }`
- Behavior: renders `<FeaturedInPill>` if `featuredIn` exists; shows event cover/title and calendar/host context.

### FeaturedInPill

- `collectionName: string`
- `collectionUrl?: string`
- `avatarUrl?: string`
- Visual: subtle pill with an avatar and chevron; acts as a link.

### PresentedByBadge

- `calendarOrSeries: { name: string; url: string; avatarUrl?: string }`
- Optional “Subscribe” button handler.
- Optional overall; if absent, surface “Presented with …” text inside AboutCard content.

### EventTitle

- `title: string`

### EventMeta (wrapper)

- `children` (one or more rows such as date/time, location, add-to-calendar if present)

#### EventDateTime

- `start: string | Date`
- `end?: string | Date`
- `timeZone: string` (e.g., `America/Los_Angeles`)
- `formatOptions?: Intl.DateTimeFormatOptions`
- Derived text: “Monday, October 13 · 5:00 PM – 7:00 PM GMT+1”

#### EventLocation

- `isOnline: boolean`
- If `isOnline`: `joinUrl?: string`, `instructions?: string`
- If in‑person:

  - `venueName?: string`
  - `addressLine1?: string`
  - `addressLine2?: string`
  - `city?: string`, `region?: string`, `postal?: string`, `country?: string`
  - `mapUrl?: string`, `geo?: { lat: number; lng: number }`

### TicketsPanel (the "Get Tickets" UI)

- **Props**

  - `eventId: string` - Event identifier (used for ticket QueryCollection)
  - `event: Pick<Event, 'mixedTicketTypesAllowed' | 'currency'>` - Event configuration
  - `onCheckout: (cartItems: CartItem[], pricing: ServerPricing) => void`
  - `onChange?: (cartItems: CartItem[]) => void` - Optional callback when cart changes
  - `ui?: { showHeader?: boolean; ctaLabel?: string }`

- **Data Sources** (not props)

  - `tickets: Ticket[]` - Loaded via **QueryCollection** from `/api/events/[eventId]/tickets`
  - `cart: CartItem[]` - Loaded from **LocalStorage** (`frontrow:ticket-cart`), persists across refresh

- **Behaviors to support (from your screenshot)**

  - Featured ticket with elevated background (visual styling only, not interaction).
  - Each ticket shows name, price, description, availability badge/dot, and "available until …" date.
  - All tickets start with Add button (qty=0); stepper appears when added to cart (qty>0).
  - Minus button becomes trash icon when qty === 1.
  - CTA at bottom ("Get Ticket") disabled until `cart.totalQty > 0`.
  - Enforces min/max per ticket and per order; blocks selecting outside sales window; respects status (e.g., sold out/waitlist).
  - Respects `Event.mixedTicketTypesAllowed` - locks other tickets when false and cart has items.
  - Real-time sold limit updates (polls every 30s); UI reflects "sold out" instantly when capacity exhausted.
  - Optional coupons/promo code field (hidden until needed).
  - Server-calculated fee breakdown (service fees, tax) before checkout.
  - Cart state **persists in LocalStorage** (survives refresh); supports CTA gating, fee/tax preview, and live sold-limit validation before redirecting to checkout.

#### TicketList

- `tickets: Ticket[]`
- Sorting strategy, e.g., featured first, then others by `sortOrder || createdAt`.

#### TicketCard

- `ticket: Ticket`
- `selectedQty: number`
- `onIncrement: (id) => void`
- `onDecrement: (id) => void`
- **Non‑obvious inputs you’ll likely need**

  - `status` (enum: `on_sale`, `scheduled`, `sold_out`, `waitlist`, `ended`, `hidden`, `paused`, `invite_only`, `external`)
  - `purchaseWindow?: { startsAt?: Date; endsAt?: Date }`
  - `availabilityLabel?: string` (e.g., “Available until Oct 11 at 12:00 PM PDT”)
  - `limits?: { minPerOrder?: number; maxPerOrder?: number; maxPerPerson?: number }`
  - `inventory?: { total?: number; remaining?: number; oversell?: boolean }`
  - `featured?: boolean` (fancy background/badge)
  - `badges?: Array<'new' | 'limited' | 'best_value' | 'sold_out' | 'members_only'>`
  - `accessControl?: { ... }` - Access restrictions and eligibility:

    ```typescript
    {
      requiresCode?: boolean;          // Requires promo/access code to purchase
      eligibleRoles?: string[];        // Restrict to specific roles (e.g., 'member', 'vip')
    }
    ```

  - `visibility?: 'public' | 'unlisted' | 'hidden'` - Controls ticket visibility in the list:
    - `'public'` - Shown to all users, purchasable if access control requirements met
    - `'unlisted'` - Shown only when access code entered, purchasable if eligible
    - `'hidden'` - Not shown in list, accessible only via direct link
  - `isAddon?: boolean` - Requires base ticket, we include the property but _do not_ implement it
  - `bundle?: { includes: string[] }` - E.g., "includes lunch + book", include property but _do not_ implement it
  - `pricing?: { ... }` - Flexible pricing structure with optional fee/tax breakdown:

    ```typescript
    {
      ticket: Dinero<number>;          // Base ticket price (may or may not include fees/tax)
                                       // Uses Dinero.js v2: dinero({ amount: 3142, currency: USD }) = $31.42
      strikePrice?: Dinero<number>;    // Original price before discount (shows savings)

      fees?: {
        amount: Dinero<number>;        // Fee amount (e.g., service fee, platform fee)
        included: boolean;             // true = ticket price includes fees, false = added at checkout
        showBreakdown?: boolean;       // true = show "Service fee: $X.XX" even if included
        label?: string;                // Custom label (default: "Service fee")
      };

      tax?: {
        amount: Dinero<number>;        // Tax amount (e.g., sales tax, VAT)
        included: boolean;             // true = ticket price includes tax, false = added at checkout
        showBreakdown?: boolean;       // true = show "Tax: $X.XX" even if included
        label?: string;                // Custom label (default: "Tax")
      };
    }
    ```

**Example pricing scenarios:**

```typescript
// Scenario 1: Ticket $50, fees $5 added at checkout, show breakdown
{
  ticket: dinero({ amount: 5000, currency: USD }),
  fees: {
    amount: dinero({ amount: 500, currency: USD }),
    included: false,
    showBreakdown: true
  }
}
// UI displays:
// Ticket: $50.00
// Service fee: $5.00
// ─────────────────
// Total: $55.00

// Scenario 2: Ticket $50 with fees included, show breakdown for transparency
{
  ticket: dinero({ amount: 5000, currency: USD }),
  fees: {
    amount: dinero({ amount: 476, currency: USD }),
    included: true,
    showBreakdown: true
  }
}
// UI displays:
// Ticket: $50.00
// (Includes $4.76 in fees)

// Scenario 3: Ticket $50 with fees included, don't show breakdown
{
  ticket: dinero({ amount: 5000, currency: USD }),
  fees: {
    amount: dinero({ amount: 476, currency: USD }),
    included: true,
    showBreakdown: false
  }
}
// UI displays:
// Ticket: $50.00

// Scenario 4: Complex - fees added at checkout, tax included, both shown
{
  ticket: dinero({ amount: 5000, currency: USD }),
  fees: {
    amount: dinero({ amount: 500, currency: USD }),
    included: false,
    showBreakdown: true
  },
  tax: {
    amount: dinero({ amount: 450, currency: USD }),
    included: true,
    showBreakdown: true
  }
}
// UI displays:
// Ticket: $50.00 (includes $4.50 tax)
// Service fee: $5.00
// ─────────────────
// Total: $55.00
```

- UI: optionally surface helper microcopy derived from `limits`/`inventory` (e.g., "Max 2 per person", "Limited availability") when caps are tight.
  // we likely aso need a way to specify that only one type of ticket can be purchased per order e.g. 1 type of ticket and up to max qty per order

  // how ts db enables us to show quantity related info

#### QuantityStepper

- `value: number`
- `min: number`
- `max: number`
- `disabled?: boolean`
- Emits `onChange(nextVal)`.

#### CartFooter

- `cart: Cart`
- Shows subtotal (and optionally fees/tax), total qty, and primary CTA. // or optionally just shows all combined fees!
- `ctaLabel?: string` (default "Get Ticket")
- `ctaDisabledReason?: string` (e.g., outside purchase window)
- `onCheckout()`

---

## TanStack DB Integration for Tickets & Cart

### Overview

Use **TanStack DB** for reactive cart state and validation logic, while **server functions** handle fee/tax calculations. This gives instant UI updates for quantity changes while maintaining authoritative pricing from the backend.

### Data Architecture

#### Collections

**1. Cart Collection** (persistent across refresh, LocalStorage)

```typescript
import {
  createCollection,
  localStorageCollectionOptions,
} from "@tanstack/react-db";
import { z } from "zod";

const cartItemSchema = z.object({
  ticketId: z.string(),
  qty: z.number().int().min(0),
});

const cartCollection = createCollection(
  localStorageCollectionOptions({
    id: "ticket-cart",
    storageKey: "frontrow:ticket-cart",
    getKey: (item) => item.ticketId,
    schema: cartItemSchema,
  })
);
```

**2. Tickets Collection** (QueryCollection with real-time updates)

```typescript
import { queryCollectionOptions } from "@tanstack/query-db-collection";

const ticketsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["tickets", eventId],
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}/tickets`);
      return response.json();
    },
    queryClient,
    getKey: (ticket) => ticket.id,
    schema: ticketSchema, // Zod schema for validation

    // Real-time inventory updates via refetch
    refetchInterval: 30000, // Poll every 30s for sold limits
  })
);
```

**Note:** Tickets are fetched from server (not props) to support real-time sold limit updates during high-demand sales.

### Data Flow & Layer Responsibilities

#### Collections & Storage Layers

| Collection          | Type                   | Storage                               | Purpose                                   | Updates                |
| ------------------- | ---------------------- | ------------------------------------- | ----------------------------------------- | ---------------------- |
| `ticketsCollection` | QueryCollection        | TanStack Query cache                  | Ticket metadata, sold limits, pricing     | Server polls every 30s |
| `cartCollection`    | LocalStorageCollection | localStorage (`frontrow:ticket-cart`) | User's ticket selections (qty per ticket) | Client-side only       |

#### Server Functions (TanStack Start)

**`/api/events/[eventId]/tickets` (GET)**

- Returns: `Ticket[]` with current `soldCount` and `soldLimit`
- Updates: Real-time (polled every 30s by QueryCollection)
- Purpose: Keeps UI in sync with actual availability

**`calculateCartTotal` (server function)**

- Input: `{ eventId, items: Array<{ ticketId, qty }> }`
- Returns: `{ lines, subtotal, fees, tax, total, currency }`
- Called: Debounced when cart changes (1s delay)
- Purpose: Authoritative pricing with jurisdiction-aware tax/fees

**`reserveTickets` (server function, future checkout flow)**

- Input: Cart items + user info
- Returns: Reservation ID + payment intent
- Purpose: Atomically reserve tickets before payment

#### Data Flow (User Adds Ticket)

1. User clicks `+` → `cartCollection.update(ticketId, d => d.qty++)`
2. **Instant** (< 1ms):
   - `ticketUIStates` query recomputes (button states, microcopy, locking)
   - UI updates: trash icon appears, other tickets grey out (if mixed types disabled)
3. **Debounced** (~1s after last change):
   - `calculateCartTotal` server function called
   - CartFooter shows "Calculating..." → pricing breakdown updates
4. **Background** (every 30s):
   - `ticketsCollection` refetches → `soldCount` updates
   - If ticket sells out while user is on page, UI reflects it immediately

---

### Comprehensive Ticket UI State Queries

Use **separate live queries** for tickets and cart summary. TanStack DB will efficiently cache and update them independently:

```typescript
import {
  useLiveQuery,
  eq,
  gt,
  coalesce,
  sum,
  count,
  and,
  or,
  not,
  inArray,
} from "@tanstack/react-db";

// Query 1: Cart summary for global locking state
const { data: cartSummary } = useLiveQuery((q) =>
  q.from({ cart: cartCollection }).select(({ cart }) => ({
    hasItems: gt(count(cart.ticketId), 0),
    totalQty: sum(cart.qty),
    uniqueTicketCount: count(cart.ticketId),
  }))
);

// Query 2: Ticket UI states (references cartSummary in fn.select callbacks)
const { data: ticketUIStates } = useLiveQuery((q) => {
  return q
    .from({ ticket: ticketsCollection })
    .leftJoin({ cart: cartCollection }, ({ ticket, cart }) =>
      eq(ticket.id, cart.ticketId)
    )
    .select(({ ticket, cart }) => ({
      ticketId: ticket.id,

      // ─── Raw State ───
      currentQty: coalesce(cart.qty, 0),

      // ─── Availability Checks ───
      isPurchasable: fn.select((row) => {
        const now = new Date();
        const t = row.ticket;

        // Status check
        if (!["on_sale", "waitlist"].includes(t.status)) {
          return false;
        }

        // Sales window - starts at
        if (t.salesWindow?.startsAt && new Date(t.salesWindow.startsAt) > now) {
          return false;
        }

        // Sales window - ends at
        if (t.salesWindow?.endsAt && new Date(t.salesWindow.endsAt) < now) {
          return false;
        }

        // Sold limit check (capacity)
        if (typeof t.soldLimit === "number") {
          const remaining = t.soldLimit - (t.soldCount || 0);
          // Check buffer allowance
          const effectiveRemaining = t.allowOversell
            ? remaining + (t.oversellBuffer || 0)
            : remaining;

          if (effectiveRemaining <= 0) {
            return false;
          }
        }
        // If soldLimit is 'unlimited', always available (no check)

        return true;
      }),

      // ─── Locking (One Ticket Type Per Order) ───
      // Only applies if event restricts mixed ticket types
      isLocked: fn.select((row) => {
        // If event allows mixed tickets, nothing is ever locked
        if (event.mixedTicketTypesAllowed) return false;

        // Access cart summary from outer scope (React closure)
        const summary = cartSummary?.[0];

        // If cart is empty, nothing is locked
        if (!summary?.hasItems) return false;

        // If this specific ticket is in cart, it's not locked
        if (row.cart?.qty > 0) return false;

        // Cart has other tickets = this one is locked
        return true;
      }),

      // ─── Button States ───
      canIncrement: fn.select((row) => {
        // Can't increment if not purchasable or locked
        if (!row.isPurchasable || row.isLocked) return false;

        const current = row.cart?.qty || 0;
        const maxByOrder = row.ticket.limits?.maxPerOrder || 999;
        const maxByPerson = row.ticket.limits?.maxPerPerson || 999;

        // Calculate remaining capacity
        let maxByCapacity = 999;
        if (typeof row.ticket.soldLimit === "number") {
          const remaining = row.ticket.soldLimit - (row.ticket.soldCount || 0);
          maxByCapacity = row.ticket.allowOversell
            ? remaining + (row.ticket.oversellBuffer || 0)
            : remaining;
        }

        // Check against lowest limit
        const effectiveMax = Math.min(maxByOrder, maxByPerson, maxByCapacity);
        return current < effectiveMax;
      }),

      canDecrement: gt(coalesce(cart.qty, 0), 0),

      // Show trash icon when qty === 1
      showTrashIcon: eq(coalesce(cart.qty, 0), 1),

      // ─── Visual Treatment ───
      isGreyedOut: fn.select((row) => {
        const now = new Date();
        const t = row.ticket;

        // Recompute purchasable
        let purchasable = true;
        if (!["on_sale", "waitlist"].includes(t.status)) {
          purchasable = false;
        }
        if (t.salesWindow?.startsAt && new Date(t.salesWindow.startsAt) > now) {
          purchasable = false;
        }
        if (t.salesWindow?.endsAt && new Date(t.salesWindow.endsAt) < now) {
          purchasable = false;
        }
        if (typeof t.soldLimit === "number") {
          const remaining = t.soldLimit - (t.soldCount || 0);
          const effectiveRemaining = t.allowOversell
            ? remaining + (t.oversellBuffer || 0)
            : remaining;
          if (effectiveRemaining <= 0) {
            purchasable = false;
          }
        }

        // Recompute locked
        let locked = false;
        if (!event.mixedTicketTypesAllowed) {
          const summary = cartSummary?.[0];
          if (summary?.hasItems && !(row.cart?.qty > 0)) {
            locked = true;
          }
        }

        return !purchasable || locked;
      }),

      // ─── Unavailable Reason (Why Greyed Out?) ───
      unavailableReason: fn.select((row) => {
        const t = row.ticket;
        const now = new Date();

        // Locked by one-type-per-order rule
        if (row.isLocked) {
          return "Remove other tickets to add this one";
        }

        // Status-based
        if (t.status === "sold_out") {
          return "Sold out";
        }

        if (t.status === "scheduled" && t.salesWindow?.startsAt) {
          const startsAt = new Date(t.salesWindow.startsAt);
          return `On sale ${formatDate(startsAt)}`;
        }

        if (t.status === "ended") {
          return "Sale ended";
        }

        if (t.status === "invite_only") {
          return "Requires unlock code";
        }

        if (t.status === "paused") {
          return "Temporarily unavailable";
        }

        if (t.status === "external") {
          return "Available externally";
        }

        // Sales window - ended
        if (t.salesWindow?.endsAt && new Date(t.salesWindow.endsAt) < now) {
          return `Sale ended ${formatDate(t.salesWindow.endsAt)}`;
        }

        // Sales window - not started
        if (t.salesWindow?.startsAt && new Date(t.salesWindow.startsAt) > now) {
          return `On sale ${formatDate(t.salesWindow.startsAt)}`;
        }

        // Sold out (capacity exhausted)
        if (typeof t.soldLimit === "number") {
          const remaining = t.soldLimit - (t.soldCount || 0);
          const effectiveRemaining = t.allowOversell
            ? remaining + (t.oversellBuffer || 0)
            : remaining;

          if (effectiveRemaining <= 0) {
            return "Sold out";
          }
        }

        return null;
      }),

      // ─── Helper Text (Contextual Microcopy) ───
      helperText: fn.select((row) => {
        const current = row.cart?.qty || 0;
        const t = row.ticket;
        const maxOrder = t.limits?.maxPerOrder;
        const maxPerson = t.limits?.maxPerPerson;

        // Calculate remaining capacity
        let remaining: number | null = null;
        if (typeof t.soldLimit === "number") {
          const baseRemaining = t.soldLimit - (t.soldCount || 0);
          remaining = t.allowOversell
            ? baseRemaining + (t.oversellBuffer || 0)
            : baseRemaining;
        }

        // Already at max for this ticket
        if (maxOrder && current >= maxOrder) {
          return `Max ${maxOrder} per order`;
        }

        // Low capacity warning (< 5 remaining)
        if (remaining !== null && remaining > 0 && remaining <= 5) {
          return `Only ${remaining} left!`;
        }

        // Approaching limit
        if (maxOrder && current > 0 && current >= maxOrder - 2) {
          const slotsLeft = maxOrder - current;
          return `${slotsLeft} more available`;
        }

        // Limited availability (general, < 20 remaining)
        if (remaining !== null && remaining > 0 && remaining <= 20) {
          return "Limited availability";
        }

        // Max per person hint (when not in cart yet)
        if (current === 0 && maxPerson && maxPerson <= 4) {
          return `Max ${maxPerson} per person`;
        }

        // Min per order requirement
        if (
          current > 0 &&
          t.limits?.minPerOrder &&
          current < t.limits.minPerOrder
        ) {
          return `Min ${t.limits.minPerOrder} required`;
        }

        return null;
      }),
    }));
});
```

**Why separate queries?**

1. **Documented API**: TanStack DB doesn't support conditionless cross joins; equality-based joins require `eq()` conditions.
2. **Efficient caching**: Both queries share the same `cartCollection` source, so updates propagate instantly.
3. **Cleaner separation**: Cart summary is independent global state; tickets are per-row computations.
4. **React closure**: The `fn.select` callbacks can reference `cartSummary` from the outer scope (React will re-run when either query updates).

### Future Considerations & Notes

#### Calendar & Blackout Dates

**TODO:** Sales windows currently use simple `startsAt`/`endsAt` dates. Future enhancement should support:

- Recurring availability schedules (e.g., "Every Tuesday 6-9 PM")
- Blackout dates/times (holidays, maintenance windows)
- Multiple sales windows per ticket (early bird, general, last chance)

Consider a `salesSchedule` structure that replaces simple start/end dates with a more flexible calendar model.

#### Fee Absorption & Display

**TODO:** Track who absorbs fees (host vs. guest) for UX messaging:

```typescript
pricing: {
  // ... existing
  feeAbsorbedBy?: 'host' | 'guest'  // Controls microcopy
}
```

Use cases:

- `'host'`: Show "Host covers fees!" badge or silent treatment
- `'guest'`: Show "Service fee added at checkout"
- `undefined`: Default behavior (show fees transparently)

#### AI/Human Chat Integration

**FUTURE:** When a user has questions about ticket types, eligibility, or restrictions, provide a help affordance that:

- Triggers AI chat assistant for instant answers
- Falls back to human chat during business hours
- Context: Pass current ticket selection state for contextual help

Implementation hook point:

```typescript
<Button
  variant="ghost"
  size="sm"
  onClick={() =>
    openHelpChat({
      context: "tickets",
      ticketId: activeTicketId,
      question: "auto-generated based on UI state",
    })
  }
>
  <HelpCircle /> Questions?
</Button>
```

---

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
};

// Clear cart
const handleClearCart = () => {
  const items = cartCollection.toArray();
  cartCollection.delete(items.map((item) => item.ticketId));
};
```

### Global Cart State Query

```typescript
// Overall cart validation and metadata
const {
  data: [cartState],
} = useLiveQuery((q) =>
  q.from({ cart: cartCollection }).select(({ cart }) => ({
    totalQty: sum(cart.qty),
    ticketCount: count(cart.ticketId),
    hasItems: gt(count(cart.ticketId), 0),
    isEmpty: eq(count(cart.ticketId), 0),
  }))
);

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
  totalQty: cartState.totalQty,
  exceedsEventMax: cartState.totalQty > EVENT_MAX_TICKETS_PER_ORDER,
  hasOverLimitTicket: (overLimitAgg?.offendingCount ?? 0) > 0,
  hasBelowMinTicket: (belowMinAgg?.offendingCount ?? 0) > 0,
  blockerReason:
    cartState.totalQty > EVENT_MAX_TICKETS_PER_ORDER
      ? `Maximum ${EVENT_MAX_TICKETS_PER_ORDER} tickets per order`
      : (overLimitAgg?.offendingCount ?? 0) > 0
      ? "Some tickets exceed their limit"
      : (belowMinAgg?.offendingCount ?? 0) > 0
      ? "Some tickets don't meet minimum quantity"
      : null,
};
```

### Server Function for Pricing

```typescript
// src/server/ticket-pricing.ts
import { createServerFn } from "@tanstack/start";

export const calculateCartTotal = createServerFn()
  .validator(
    (data: {
      eventId: string;
      items: Array<{ ticketId: string; qty: number }>;
    }) => data
  )
  .handler(async ({ data }) => {
    // Fetch tickets from database
    const tickets = await db.query.ticket.findMany({
      where: inArray(
        ticket.id,
        data.items.map((i) => i.ticketId)
      ),
    });

    // Build line items
    const lines = data.items.map((item) => {
      const ticket = tickets.find((t) => t.id === item.ticketId)!;
      return {
        ticketId: item.ticketId,
        name: ticket.name,
        qty: item.qty,
        unitPrice: ticket.basePrice,
        lineTotal: ticket.basePrice * item.qty,
      };
    });

    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);

    // ✅ Server-side calculations
    const fees = calculateServiceFees(subtotal, tickets);
    const tax = calculateTax(subtotal, data.eventId); // Jurisdiction-aware

    return {
      lines,
      subtotal,
      fees,
      tax,
      total: subtotal + fees + tax,
      currency: tickets[0]?.currency || "USD",
    };
  });
```

### Server Function for Promo Codes (implemented)

```typescript
// src/server/promo-codes.ts
import { createServerFn } from "@tanstack/start";

export const applyPromoCode = createServerFn()
  .validator(
    (data: {
      eventId: string;
      code: string;
      items: Array<{ ticketId: string; qty: number }>;
    }) => data
  )
  .handler(async ({ data }) => {
    // Fetch tickets from database
    const tickets = await db.query.ticket.findMany({
      where: inArray(
        ticket.id,
        data.items.map((i) => i.ticketId)
      ),
    });

    // Look up promo by code (case-insensitive)
    const promo = await db.query.promo.findFirst({
      where: eq(sql`upper(code)`, data.code.toUpperCase()),
    });

    if (!promo || !promo.active) {
      return { valid: false, message: "Invalid promo code", discount: 0 };
    }

    const subtotal = data.items.reduce((sum, item) => {
      const ticket = tickets.find((t) => t.id === item.ticketId)!;
      return sum + ticket.basePrice * item.qty;
    }, 0);

    const discount =
      promo.type === "percent"
        ? Math.round(subtotal * promo.value)
        : Math.min(promo.value, subtotal);

    return {
      valid: true,
      message:
        promo.type === "percent"
          ? `${promo.value * 100}% off applied`
          : `$${(promo.value / 100).toFixed(2)} off applied`,
      discount,
      code: promo.code,
    };
  });
```

### Component Implementation

#### TicketsPanel

```typescript
function TicketsPanel({ eventId, event, onCheckout }: TicketsPanelProps) {
  // Tickets are loaded via QueryCollection (no props needed)
  const { data: tickets } = useLiveQuery((q) =>
    q
      .from({ ticket: ticketsCollection })
      .orderBy(({ ticket }) => coalesce(ticket.sortOrder, 999))
  );

  // Get all cart items
  const { data: cartItems } = useLiveQuery((q) =>
    q.from({ cart: cartCollection })
  );

  // Get global cart state
  const {
    data: [cartState],
  } = useLiveQuery((q) =>
    q.from({ cart: cartCollection }).select(({ cart }) => ({
      totalQty: sum(cart.qty),
      hasItems: gt(count(cart.ticketId), 0),
    }))
  );

  // Get ticket UI states (all validation/button logic)
  const { data: ticketUIStates } = useLiveQuery(/* query from above */);

  // Server-calculated pricing (debounced)
  const { data: pricing, isPending } = useQuery({
    queryKey: ["cart-pricing", eventId, cartItems],
    queryFn: () =>
      calculateCartTotal({
        eventId,
        items: cartItems.map((item) => ({
          ticketId: item.ticketId,
          qty: item.qty,
        })),
      }),
    enabled: cartState?.hasItems ?? false,
    staleTime: 1000, // Debounce
  });

  return (
    <div>
      <TicketList
        tickets={tickets}
        uiStates={ticketUIStates}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
      />
      <CartFooter
        cartState={cartState}
        pricing={pricing}
        isPricingLoading={isPending}
        onCheckout={() => onCheckout(cartItems, pricing)}
      />
    </div>
  );
}
```

#### TicketCard (Presentation)

```typescript
function TicketCard({
  ticket,
  uiState,
  onIncrement,
  onDecrement,
}: {
  ticket: Ticket;
  uiState: ReturnType<typeof ticketUIStates>[number];
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "ticket-card",
        ticket.featured && "ticket-featured",
        uiState.isGreyedOut && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Ticket Info */}
      <div>
        <h3>{ticket.name}</h3>
        {ticket.description && <p>{ticket.description}</p>}
        <TicketPrice pricing={ticket.pricing} />

        {ticket.availabilityLabel && (
          <Text variant="caption" color="muted">
            {ticket.availabilityLabel}
          </Text>
        )}

        {uiState.unavailableReason && (
          <Badge variant="outline">{uiState.unavailableReason}</Badge>
        )}
      </div>

      {/* Quantity Controls */}
      <div>
        {uiState.isPurchasable && !uiState.isLocked ? (
          <>
            {uiState.currentQty > 0 ? (
              // Stepper shown when ticket in cart (qty > 0)
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => onDecrement(ticket.id)}
                  disabled={!uiState.canDecrement}
                  aria-label={
                    uiState.showTrashIcon
                      ? "Remove ticket"
                      : "Decrease quantity"
                  }
                >
                  {uiState.showTrashIcon ? <Trash2 /> : <Minus />}
                </Button>

                <span className="w-8 text-center font-medium">
                  {uiState.currentQty}
                </span>

                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => onIncrement(ticket.id)}
                  disabled={!uiState.canIncrement}
                  aria-label="Increase quantity"
                >
                  <Plus />
                </Button>
              </div>
            ) : (
              // Collapsed - just a plus button
              <Button
                size="sm"
                onClick={() => onIncrement(ticket.id)}
                disabled={!uiState.canIncrement}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            )}

            {/* Helper text */}
            {uiState.helperText && (
              <Text variant="caption" color="muted" className="mt-1">
                {uiState.helperText}
              </Text>
            )}
          </>
        ) : (
          // Not purchasable - show reason
          <div className="text-sm text-muted-foreground">
            {uiState.unavailableReason}
          </div>
        )}
      </div>
    </div>
  );
}
```

#### CartFooter (with Server Pricing)

```typescript
function CartFooter({
  cartState,
  pricing,
  isPricingLoading,
  onCheckout,
}: {
  cartState: { totalQty: number; hasItems: boolean };
  pricing?: Awaited<ReturnType<typeof calculateCartTotal>>;
  isPricingLoading: boolean;
  onCheckout: () => void;
}) {
  return (
    <div className="border-t bg-background p-4 sticky bottom-0">
      {cartState.hasItems && pricing ? (
        <div className="space-y-3">
          {/* Pricing Breakdown */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <Text>Subtotal</Text>
              <Text>{formatMoney(pricing.subtotal, pricing.currency)}</Text>
            </div>

            {pricing.fees > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <Text>Service fees</Text>
                <Text>+{formatMoney(pricing.fees, pricing.currency)}</Text>
              </div>
            )}

            {pricing.tax > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <Text>Tax</Text>
                <Text>+{formatMoney(pricing.tax, pricing.currency)}</Text>
              </div>
            )}

            <Separator className="my-2" />

            <div className="flex justify-between font-semibold">
              <Text>Total</Text>
              <Text>{formatMoney(pricing.total, pricing.currency)}</Text>
            </div>
          </div>

          {/* CTA */}
          <Button
            className="w-full"
            size="lg"
            onClick={onCheckout}
            disabled={isPricingLoading || !cartState.hasItems}
          >
            {isPricingLoading
              ? "Calculating..."
              : `Get Ticket${cartState.totalQty > 1 ? "s" : ""}`}
          </Button>
        </div>
      ) : (
        <Button className="w-full" size="lg" disabled variant="secondary">
          Select tickets to continue
        </Button>
      )}
    </div>
  );
}
```

### Benefits Summary

#### TanStack DB Handles (Client-Side, Instant)

- ✅ **Button states** (`canIncrement`, `canDecrement`, `showTrashIcon`)
- ✅ **Visual treatment** (`isGreyedOut`, opacity changes)
- ✅ **Locking logic** (respects `Event.mixedTicketTypesAllowed`)
- ✅ **Microcopy** ("Only 3 left!", "Max 2 per order", "Remove other tickets first")
- ✅ **Sales window validation** (client-side date checks)
- ✅ **Capacity awareness** (sold limit checks with oversell buffer)
- ✅ **Min/max enforcement** (disable buttons at limits)
- ✅ **Cart persistence** (LocalStorage survives refresh)

#### Server Function Handles (Authoritative)

- ✅ **Fee calculation** (business rules, tiered pricing)
- ✅ **Tax calculation** (jurisdiction-aware, rates from DB)
- ✅ **Promo code application** (when implemented)
- ✅ **Final total** (authoritative for checkout)

#### The User Experience

1. **Instant** - Click `+` → button states update immediately (< 1ms)
2. **Smooth** - Microcopy updates, trash icon appears, other tickets grey out (if mixed types disabled)
3. **Background** - Server pricing recalculates (~100-500ms), shows in footer
4. **No flicker** - UI never blocks on server calls for basic interactions
5. **Resilient** - Cart persists across refresh; sold limits update every 30s automatically

#### Type Refinements Summary

Key changes from initial spec:

- ✅ **Event**: Added `mixedTicketTypesAllowed` (default: true), `timeZoneOffset`
- ✅ **Ticket**: Changed `inventory` → `soldLimit` (number | 'unlimited') + `soldCount`, `allowOversell`, `oversellBuffer`
- ✅ **Ticket**: Renamed `purchaseWindow` → `salesWindow` with required dates when present
- ✅ **Cart**: Changed from LocalOnly → LocalStorage for refresh persistence
- ✅ **Tickets**: Changed from props → QueryCollection for real-time updates
- 📝 **Removed**: Approval workflow (use unlock codes instead)
- 📝 **Future**: Fee absorption, calendar/blackout dates, AI chat help

---

### AboutCard

- `html: string | ReactNode` (sanitized)
- Optional “Read more/less” expansion; optional translation toggle.

### HostedByCard

- `hosts: Host[]` (name, avatar, profile URL, socials)
- Optional “Contact host” action.

### AttendeesCard

- `count: number`
- `sample: Array<{ id: string; avatarUrl: string; name?: string }>`
- “Alexandra Nadel, Alice Colligan and 49 others” style collapsed string.

### CategoryChips

- `categories: Array<{ slug: string; name: string; url?: string }>`

---

## 3) Suggested **TypeScript data contracts**

These are intentionally conservative; add/remove fields as your back‑end allows.

```ts
type ID = string;

type Money = { amount: number; currency: string }; // cents-minor recommended

type Event = {
  id: ID;
  title: string;
  summary?: string;
  descriptionHtml?: string;
  coverImageUrl?: string;
  timeZone: string; // e.g., "Europe/London" - venue timezone
  timeZoneOffset: string; // e.g., "+01:00" - venue UTC offset (for display)
  startsAt: string; // ISO 8601 UTC
  endsAt?: string; // ISO 8601 UTC
  featuredIn?: { name: string; url?: string; avatarUrl?: string };
  presentedBy?: { name: string; url?: string; avatarUrl?: string };
  categories?: Array<{ slug: string; name: string; url?: string }>;
  location: Venue;
  tickets: Ticket[]; // Populated via QueryCollection (not embedded)
  mixedTicketTypesAllowed: boolean; // Default: true. Controls "one type per order" rule
};

type Venue =
  | { kind: "online"; joinUrl?: string; instructions?: string }
  | {
      kind: "in_person";
      venueName?: string;
      address?: {
        line1?: string;
        line2?: string;
        city?: string;
        region?: string;
        postal?: string;
        country?: string;
      };
      mapUrl?: string;
      geo?: { lat: number; lng: number };
    };

type TicketStatus =
  | "on_sale"
  | "scheduled"
  | "sold_out"
  | "waitlist"
  | "ended"
  | "hidden"
  | "paused"
  | "invite_only"
  | "external";

type Ticket = {
  id: ID;
  name: string;
  description?: string;
  pricing: {
    ticket: Dinero<number>;
    strikePrice?: Dinero<number>;
    fees?: {
      amount: Dinero<number>;
      included: boolean;
      showBreakdown?: boolean;
      label?: string;
    };
    tax?: {
      amount: Dinero<number>;
      included: boolean;
      showBreakdown?: boolean;
      label?: string;
    };
  };
  status: TicketStatus;
  availabilityLabel?: string; // i18n-ready copy ("Available until …")

  // Sales window with required dates when present
  salesWindow?: {
    startsAt: string; // ISO 8601 UTC
    endsAt: string; // ISO 8601 UTC
    // Future: support recurring schedules & blackout dates - see Future Considerations
  };

  limits?: {
    minPerOrder?: number;
    maxPerOrder?: number;
    maxPerPerson?: number;
  };

  // Capacity model (NOT "inventory" - that implies physical stock management)
  soldLimit: number | "unlimited"; // Total capacity for this ticket type
  soldCount?: number; // Current sold count (server-managed)
  allowOversell?: boolean; // Allow sales beyond soldLimit
  oversellBuffer?: number; // How many extra to allow if oversell enabled

  sortOrder?: number; // Controls display order in list
  featured?: boolean; // Elevated visual treatment
  badges?: Array<
    "new" | "limited" | "best_value" | "sold_out" | "members_only"
  >;

  // Access control
  requiresCode?: boolean; // Requires unlock/promo code
  eligibleUserIdsOrRoles?: string[]; // Role-based access restrictions
  visibility?: "public" | "unlisted" | "hidden";

  // Not implemented yet (note for future)
  isAddon?: boolean; // requires base ticket - NOT IMPLEMENTED
  bundle?: { includes: string[] }; // e.g., ["All three movies", "Lunch", "Free book"] - NOT IMPLEMENTED

  metadata?: Record<string, unknown>; // Escape hatch
};

type Host = {
  id: ID;
  name: string;
  avatarUrl?: string;
  profileUrl?: string;
  socials?: Partial<{ x: string; linkedin: string; website: string }>;
};

type CartLine = { ticketId: ID; name: string; unitPrice: Money; qty: number };
// UI-only selection state used to compute totals and validate before redirecting to checkout; not a persisted storefront cart.
type Cart = {
  lines: CartLine[];
  subtotal: Money;
  fees?: Money;
  tax?: Money;
  total: Money;
  totalQty: number;
};
```

---

## 4) Tickets **state & rules** to wire in

- **Visibility**

  - Prefer `visibility` for display control: show tickets where `visibility !== 'hidden'`.
  - Keep `status` for sale state (e.g., `on_sale`, `scheduled`, `waitlist`, `ended`) and button/label logic.
  - If `status === 'scheduled'`, show row but disable stepper and label as “On sale {date}”.

- **Availability window**

  - If `salesWindow.endsAt` < now → treat as `ended` (disable selection, show “Unavailable since …”).
  - If `salesWindow.startsAt` > now → `scheduled`.

- **Inventory**

  - `remaining <= 0` → `sold_out` unless `waitlist` explicitly enabled.
  - Support **per‑order** and **per‑person** caps (enforce in UI and server).

- **Eligibility**

  - `requiresCode` / `eligibleUserIdsOrRoles` should gate the stepper until verified.
  - Note: Token/wallet-gated eligibility is out of scope for us; while Luma sometimes shows a wallet-verification notice, we do not implement on-chain gating (intentional non-goal).

- **CTA enablement**

  - Enable “Get Ticket” only when `cart.totalQty >= minOrderTotal` and **all** chosen lines satisfy limits & windows.

- **Featured**

  - `ticket.featured === true` → expanded card with inline quantity stepper and elevated background/badge.

> Your screenshot examples (“VIP All Day Plus Book & Food!” featured with inline –/+, other $25 rows with just a [+], green dot + “Available until …”, and a single **Get Ticket** CTA) fall out cleanly from the above props and rules.

---

## 5) Other section inputs

### AboutCard Inputs

- `descriptionHtml` (sanitized), optional “Expand” if exceeds N characters.
- Optional: “Translate” affordance, if applicable.

### HostedByCard Inputs

- `hosts: Host[]` with optional X/LinkedIn links.
- Optional “Contact Host” handler.

### AttendeesCard Inputs

- `count` and `sample` avatars; on click, open attendees modal/list.

### FooterActions Inputs

- `onContactHost()`, `onReportEvent()`

---

## 6) Hooks / state management (optional but handy)

- `useEvent(eventId)` → loads `Event`
- `useTickets(eventId)` → returns `tickets`, hydration/refresh
- `useCart()` → `{ cart, add(ticketId), remove(ticketId), setQty(ticketId, n) }`
- `useCheckout()` → handles server validation, reserves inventory, redirects to payment
- Cart semantics: no persistent “shopping cart”—just ephemeral selection state that becomes checkout line items. We keep a minimal `Cart` to compute totals, gate the CTA, and perform `onChange` validations (inventory, windows).

---

## 7) Accessibility & i18n checklist

- Steppers are buttons with proper `aria-label` (“Increase quantity of {ticket}”).
- Status text exposed for screen readers (e.g., `aria-live` on “Sold Out”, “Available until …”).
- All dates run through `Intl.DateTimeFormat` with `timeZone`.
- Currency rendered with `Intl.NumberFormat` using `event.currency`.
- Provide keyboard focus rings and trap focus if the TicketsPanel is a modal.

---

## 8) Minimal file layout (example)

```none
/components/event/
  EventPage.tsx
  EventHero.tsx
  FeaturedInPill.tsx
  PresentedByBadge.tsx
  EventTitle.tsx
  EventMeta/
    EventDateTime.tsx
    EventLocation.tsx
    AddToCalendarButtons.tsx
  Tickets/
    TicketsPanel.tsx
    TicketList.tsx
    TicketCard.tsx
    QuantityStepper.tsx
    CartFooter.tsx
  AboutCard.tsx
  HostedByCard.tsx
  AttendeesCard.tsx
  CategoryChips.tsx

/types/
  event.ts          // types from §3

/hooks/
  useEvent.ts
  useTickets.ts
  useCart.ts
  useCheckout.ts
```

---

## 9) Sample ticket payloads mapped to your screenshot

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
  }
]
```

Note: Transport payloads represent money as `{ amount, currency }`. On the client, adapt these to `Dinero<number>` (`pricing.ticket`, `pricing.strikePrice`) before UI consumption.

---

### Wrap‑up

If you wire the page using the component map in §1 and the data contracts in §3, you’ll have everything needed to reproduce:

- the **Get Tickets** behavior (featured card, per‑ticket caps, availability windows, CTA gating),
- the **Title/pills/Presented by** area,
- **Event Date & Location** rows,
- **About**, **Hosted By**, **People going**, and **Categories**.

If you want, I can turn these into concrete `*.tsx` component skeletons next.

Medical References:

1. None — DOI: file-3YLytSvZV3iczpSDN6czsY
