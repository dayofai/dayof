# TicketsPanel Enhancements & Error States

This document covers **error handling requirements** (Section 1) and **future enhancements** for post-MVP iterations (Section 2).

---

## Section 1: Error States (Implementation Required)

These error states should be handled in the MVP implementation to ensure robust user experience.

### A) Query/Data Errors

#### 1. Pricing Calculation Fails

**Scenario**: `calculateCartTotal` throws an error or times out

**Detection**:
```typescript
const {
  data: pricing,
  isPending,
  error,
  refetch,
} = useQuery({
  queryKey: ["cart-pricing", eventId, debouncedCartItems],
  queryFn: () => calculateCartTotal({ eventId, items: debouncedCartItems }),
  enabled: cartState?.hasItems ?? false,
  placeholderData: keepPreviousData,
});
```

**UI Behavior**:
- **Display**: Error message in CartFooter: "We're having trouble calculating totals. Try again in a bit."
- **NO fallback pricing** (no estimated label)
- **Footer**: Show Retry button (calls `refetch()`)
- **Recovery**: Manual retry via button

**Implementation** (in CartFooter):
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

---

#### 2. Cart Item References Deleted Ticket

**Scenario**: User has `ticketId` in cart but that ticket was removed from the event

**Detection**:
```typescript
// In TicketsPanelClient, after querying rows
useEffect(() => {
  if (!rows || !cartItems) return;

  const validTicketIds = new Set(rows.map(r => r.ticket.id));
  const orphanedItems = cartItems.filter(item => !validTicketIds.has(item.ticketId));

  if (orphanedItems.length > 0) {
    orphanedItems.forEach(item => cartCollection.delete(item.ticketId));
    toast.info("Some tickets are no longer available");
  }
}, [rows, cartItems]);
```

**UI Behavior**:
- **Action**: Auto-remove orphaned cart items silently on mount
- **Display**: Optional toast: "Some tickets are no longer available" (if items were removed)
- **No user action required**

---

#### 3. Tickets Collection Fails to Load (Future)

**Scenario**: When using `queryCollectionOptions` with real API, the fetch fails

**Detection**:
```typescript
const { data: rows, error } = useLiveQuery((q) => /* query */);
```

**UI Behavior**:
- **Display**: Error state in panel:
  ```tsx
  <div className="p-8 text-center">
    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
    <h3 className="mt-4 font-semibold">Unable to load tickets</h3>
    <button onClick={() => refetch()} className="mt-4">Retry</button>
  </div>
  ```
- **Skeleton**: Keep skeleton visible until retry succeeds
- **No cart operations allowed** until tickets load

---

### B) Validation Errors

#### 4. Server Validation Fails at Checkout (Future)

**Scenario**: Inventory changed between add-to-cart and checkout (race condition)

**Example**:
```typescript
// User adds 5 tickets, but only 3 remain when they click checkout
const validation = await validateCart({ eventId, items: cartItems });
```

**UI Behavior**:
- **Display**: Inline error per affected ticket:
  ```tsx
  <div className="text-xs text-destructive">
    Only {remaining} remaining, please adjust quantity
  </div>
  ```
- **Action**: Auto-update cart quantities to max available
- **Footer**: Re-enable checkout after adjustment
- **User can proceed** with adjusted quantities

---

#### 5. Unlock Code Validation Fails

**Scenario**: User enters invalid unlock code for invite-only ticket

**UI Behavior**:
- **Display**: Inline error below input: "Invalid code"
- **State**: Keep input focused for retry
- **Styling**: Red border on input, shake animation (optional)
- **No form clear**: Preserve entered code for easy correction

**Implementation**:
```tsx
{unlockError && (
  <p className="text-xs text-destructive mt-1">
    {unlockError}
  </p>
)}
```

---

#### 6. Promo Code Validation Fails

**Scenario**: User enters expired/invalid promo code

**UI Behavior**:
- **Display**: Inline error: "Code not found or expired"
- **State**: Clear invalid code input after 2s
- **Allow retry**: User can immediately try another code
- **Optional**: Show "Valid codes" hint if configured

---

### C) User Input Errors

#### 7. User Tries to Exceed Max Limit

**Prevention**: This is **prevented** via UI, not an error state

**Implementation**:
```typescript
// In computeTicketUI
const canIncrement = purchasable && !isLocked && qty < effectiveMax;
```

**UI Behavior**:
- **Disable** increment button when at limit
- **Helper text**: "Max N per order"
- **No error message needed** (button disabled)

---

#### 8. Cart Exceeds Event-Level Max

**Scenario**: Total cart quantity exceeds `EVENT_MAX_TICKETS_PER_ORDER` (e.g., 50)

**Detection**:
```typescript
const orderValidation = {
  totalQty: cartState?.totalQty ?? 0,
  exceedsEventMax: (cartState?.totalQty ?? 0) > EVENT_MAX_TICKETS_PER_ORDER,
  blockerReason: (cartState?.totalQty ?? 0) > EVENT_MAX_TICKETS_PER_ORDER
    ? `Maximum ${EVENT_MAX_TICKETS_PER_ORDER} tickets per order`
    : null,
};
```

**UI Behavior**:
- **Display**: Error in footer: "Maximum 50 tickets per order"
- **Footer**: Disable checkout button
- **Recovery**: User must remove items to proceed
- **Styling**: Red border around footer, destructive text color

---

### D) Storage Errors

#### 9. localStorage Quota Exceeded

**Scenario**: Cart data exceeds browser's localStorage limit (~5-10MB)

**Detection**:
```typescript
try {
  localStorage.setItem(key, value);
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    // Handle quota error
  }
}
```

**UI Behavior**:
- **Fallback**: Switch to in-memory cart (session-only, no persistence)
- **Display**: Toast warning: "Cart will not persist across sessions (storage limit reached)"
- **Continue**: Allow cart operations in-memory
- **Recovery**: Clear old localStorage keys, suggest browser cleanup

**Implementation Note**: TanStack DB's `localStorageCollectionOptions` may handle this internally. Verify behavior and add fallback if needed.

---

## Section 2: Future Enhancements (Post-MVP)

These improvements add value but are **not required** for the initial implementation.

---

### Enhancement 1: TanStack Form for Unlock/Promo Inputs

**Why**: Declarative form state, tight Zod integration, sync/async validation

**Benefits**:
- Single source of truth for validation rules
- Built-in error handling and touched/dirty states
- Easy async validation (e.g., server code lookup)
- Consistent UX with other forms in the app

**Example Implementation**:

```typescript
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';

const unlockCodeSchema = z.object({
  code: z.string().min(1, 'Code is required').regex(/^[A-Z0-9-]+$/, 'Invalid format'),
});

function UnlockCodeInput({ ticketId, onSuccess }: UnlockCodeInputProps) {
  const form = useForm({
    defaultValues: { code: '' },
    validators: {
      onChange: zodValidator(unlockCodeSchema),
    },
    onSubmit: async ({ value }) => {
      const result = await validateUnlockCode(ticketId, value.code);
      if (result.valid) {
        onSuccess(ticketId);
      } else {
        form.setFieldMeta('code', { error: result.message });
      }
    },
  });

  return (
    <form.Field name="code">
      {(field) => (
        <div>
          <input
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            className={field.state.meta.error ? 'border-destructive' : ''}
          />
          {field.state.meta.error && (
            <p className="text-xs text-destructive mt-1">
              {field.state.meta.error}
            </p>
          )}
        </div>
      )}
    </form.Field>
  );
}
```

**When to Implement**: When adding unlock codes or promo code features

---

### Enhancement 2: Query Cache Persistence

**Why**: Faster cold starts by persisting tickets/event data across sessions

**Benefits**:
- Avoid re-fetching tickets on every page load
- Still refetch on window focus/reconnect for freshness
- Reduced server load for public events

**Implementation**:

```typescript
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'frontrow:query-cache:v1', // Version for cache-busting
});

// Only persist safe queries (not user-specific data)
const shouldDehydrateQuery = (query) => {
  return query.queryKey[0] === 'tickets' || query.queryKey[0] === 'event';
};

// In app setup
<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{
    persister,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    dehydrateOptions: { shouldDehydrateQuery },
  }}
>
  <App />
</PersistQueryClientProvider>
```

**When to Implement**: After switching from mock data to real API queries

**Reference**: [TanStack Query Persistence Docs](https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient)

---

### Enhancement 3: Error Boundaries

**Why**: Graceful degradation when components crash, better error reporting

**Implementation**:

```typescript
import { ErrorBoundary } from 'react-error-boundary';

function TicketsPanelErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="p-8 text-center">
      <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
      <h3 className="mt-4 font-semibold">Something went wrong</h3>
      <p className="text-sm text-muted-foreground mt-2">
        Unable to load ticket selection
      </p>
      <button onClick={resetErrorBoundary} className="mt-4">
        Try again
      </button>
    </div>
  );
}

// Wrap TicketsPanelClient
export function TicketsPanel(props: TicketsPanelProps) {
  return (
    <ErrorBoundary
      FallbackComponent={TicketsPanelErrorFallback}
      onError={(error) => {
        // Log to error tracking service
        console.error('TicketsPanel error:', error);
      }}
    >
      <ClientOnly fallback={<TicketsPanelSkeleton />}>
        <TicketsPanelClient {...props} />
      </ClientOnly>
    </ErrorBoundary>
  );
}
```

**When to Implement**: Before production deploy, after core functionality is stable

---

### Enhancement 4: Advanced Debounce Strategies

**Why**: Dynamic wait times based on cart state can optimize UX and server load

**Example - Adaptive Debounce**:

```typescript
// Longer debounce when cart is large (more expensive pricing calc)
const getDebounceDuration = (cartItems: CartItem[]) => {
  const itemCount = cartItems.reduce((sum, item) => sum + item.qty, 0);
  if (itemCount > 20) return 1000; // 1s for large carts
  if (itemCount > 10) return 750;  // 750ms for medium carts
  return 500;                       // 500ms for small carts
};

const [debouncedCartItems] = useDebouncedValue(cartItems, {
  wait: (debouncer) => getDebounceDuration(debouncer.store.state.value),
});
```

**When to Implement**: If analytics show performance issues with large carts

---

### Enhancement 5: Optimistic Updates for Cart Operations

**Why**: Instant UI feedback before localStorage/server confirms

**Implementation**:

```typescript
const handleIncrement = (ticketId: string) => {
  // Optimistic UI update
  const tempQty = (cartCollection.get(ticketId)?.qty ?? 0) + 1;

  // Update local state immediately
  const existing = cartCollection.get(ticketId);
  if (existing) {
    cartCollection.update(ticketId, (draft) => { draft.qty += 1; });
  } else {
    cartCollection.insert({ ticketId, qty: 1 });
  }

  // Callback fires immediately (UI responds instantly)
  onChange?.(cartCollection.toArray());

  // TanStack DB handles persistence automatically
};
```

**Note**: TanStack DB with `localStorageCollectionOptions` already provides near-instant updates. This enhancement is primarily for **server-synced carts** (future).

---

### Enhancement 6: Real-Time Inventory Updates (WebSocket/SSE)

**Why**: Prevent overselling in high-demand events with live inventory sync

**Approach**:
- Use WebSocket/SSE connection to receive inventory updates
- Invalidate tickets query when inventory changes server-side
- Show toast: "Ticket availability updated" when changes occur
- Auto-adjust cart if user's items exceed new limits

**When to Implement**: For high-traffic events (concerts, limited releases)

**Note**: Requires server-side infrastructure (Pusher, Ably, or custom WebSocket)

---

### Enhancement 7: A11y Announcements for Cart Changes

**Why**: Screen readers don't automatically announce dynamic cart updates

**Implementation**:

```typescript
import { useAnnouncer } from '@react-aria/live-announcer';

function TicketsPanelClient(/* ... */) {
  const { announce } = useAnnouncer();

  const handleIncrement = (ticketId: string) => {
    // ... cart logic ...

    const ticket = rows?.find(r => r.ticket.id === ticketId)?.ticket;
    const newQty = (cartCollection.get(ticketId)?.qty ?? 0) + 1;

    announce(`Added ${ticket?.name}. ${newQty} in cart.`, 'polite');
  };

  const handleDecrement = (ticketId: string) => {
    // ... cart logic ...

    const ticket = rows?.find(r => r.ticket.id === ticketId)?.ticket;
    const newQty = Math.max(0, (cartCollection.get(ticketId)?.qty ?? 0) - 1);

    if (newQty === 0) {
      announce(`Removed ${ticket?.name} from cart.`, 'polite');
    } else {
      announce(`Decreased ${ticket?.name}. ${newQty} in cart.`, 'polite');
    }
  };

  // ... rest of component
}
```

**When to Implement**: During a11y audit or if user feedback indicates confusion

---

### Enhancement 8: Link Helper Text with `aria-describedby`

**Why**: Screen readers should associate helper microcopy (e.g., "Only 3 left!", "Max 10 per order") with the control that affects it.

**Implementation**:
```tsx
// In TicketCard
const helperId = uiState.helperText ? `ticket-${ticket.id}-helper` : undefined;

<button
  type="button"
  aria-describedby={helperId}
  /* ... */
/>

<QuantityStepper
  aria-describedby={helperId}
  /* ... */
/>

{uiState.helperText && (
  <div
    id={`ticket-${ticket.id}-helper`}
    role="note"
    aria-live="polite"
  >
    {uiState.helperText}
  </div>
)}
```

**When to Implement**: Now; it's low-cost and improves a11y immediately.

---

## Summary: Implementation Priority

### ✅ Implement Now (MVP):
- All **Section 1** error states (A-D)
- Basic error handling in `CartFooter` and `TicketCard`
- Orphaned cart item cleanup
- Pricing error retry UI
- Helper text a11y (Enhancement 8)

### 🔜 Implement Next (Post-MVP):
- Error boundaries (Enhancement 3)
- TanStack Form for unlock/promo (Enhancement 1)
- Query cache persistence (Enhancement 2)

### 🚀 Implement Later (Scale):
- Real-time inventory (Enhancement 6)
- Advanced debounce strategies (Enhancement 4)
- A11y announcements (Enhancement 7)

---

## References

- [TanStack Query Error Handling](https://tanstack.com/query/latest/docs/framework/react/guides/query-functions#handling-and-throwing-errors)
- [TanStack Form Documentation](https://tanstack.com/form/latest/docs/overview)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [WCAG 2.1 Success Criterion 1.4.1 (Use of Color)](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html)
