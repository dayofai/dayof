<!-- 9d591914-54ef-45ff-b699-21329ec6ea71 bca27eba-dbc4-4295-afab-b9a638c28865 -->
# Eliminate All Prop Drilling - Pure Jotai Implementation

## Audit Summary

**Current Issues:**

- ❌ Handler drilling: 3 layers (TicketsPanel → TicketList → TicketCard → QuantityStepper)
- ❌ Data drilling: tickets/uiStates already in atoms but still drilled
- ❌ Cart state drilling: cartSummary already in atom but still drilled
- ❌ Query state drilling: pricing query in component, not atom
- ❌ Validation drilling: checkoutDisabled computed in parent, drilled down

**Goal:** Components access atoms directly (zero drilling except config props)

## Phase 1: Move Pricing Query to Atom

Create `apps/frontrow/src/lib/atoms/pricing.ts`:

```typescript
import { atom } from 'jotai';
import { atomWithQuery } from 'jotai-tanstack-query';
import { cartAtom } from './cart';
import { calculateCartTotal } from '@/lib/mock-data';

// Pricing query atom (replaces useQuery in component)
export const pricingQueryAtom = atomWithQuery((get) => {
  const cart = get(cartAtom);
  
  return {
    queryKey: ['cart-pricing', cart],
    queryFn: () =>
      calculateCartTotal({
        eventId: 'evt_123', // TODO: get from route
        items: cart.map((i) => ({
          ticketId: i.ticketId,
          qty: i.qty,
        })),
      }),
    enabled: cart.length > 0,
    staleTime: 0,
  };
});

// Unwrap pricing data
export const pricingAtom = atom((get) => {
  const query = get(pricingQueryAtom);
  return query.data;
});

// Pricing loading state
export const pricingLoadingAtom = atom((get) => {
  const query = get(pricingQueryAtom);
  return query.isPending;
});

// Pricing error state
export const pricingErrorAtom = atom((get) => {
  const query = get(pricingQueryAtom);
  return query.error;
});

// Retry action (write-only atom)
export const retryPricingAtom = atom(null, (get, set) => {
  const query = get(pricingQueryAtom);
  query.refetch?.();
});
```

## Phase 2: Move Checkout Validation to Atom

Update `apps/frontrow/src/lib/atoms/ticket-ui-states.ts`:

```typescript
// Add at end of file:

/**
 * Checkout validation (derived atom)
 * 
 * Checks if any ticket violates minPerOrder constraint
 */
export const checkoutDisabledAtom = atom((get) => {
  const uiStates = get(ticketUIStatesAtom);
  return uiStates.some(
    (state) =>
      state.currentQty > 0 &&
      state.ticket.limits?.minPerOrder &&
      state.currentQty < state.ticket.limits.minPerOrder
  );
});
```

## Phase 3: Move onChange Callback to Atom (Optional)

Create `apps/frontrow/src/lib/atoms/cart-callbacks.ts`:

```typescript
import { atom } from 'jotai';
import type { CartItem } from '@/lib/schemas/cart';

/**
 * Optional callback for cart changes (analytics, URL updates, etc.)
 * Parent can register a callback without prop drilling
 */
export const onCartChangeCallbackAtom = atom<((cart: CartItem[]) => void) | null>(null);
```

Update cart action atoms to call the callback:

```typescript
// In cart.ts - update incrementTicketAtom
export const incrementTicketAtom = atom(
  null,
  (get, set, ticketId: string) => {
    const cart = get(cartAtom);
    const existing = cart.find(item => item.ticketId === ticketId);

    if (existing) {
      set(cartAtom, cart.map(item =>
        item.ticketId === ticketId
          ? { ...item, qty: item.qty + 1 }
          : item
      ));
    } else {
      set(cartAtom, [...cart, { ticketId, qty: 1 }]);
    }
    
    // Trigger callback if registered
    const callback = get(onCartChangeCallbackAtom);
    callback?.(get(cartAtom));
  }
);
```

## Phase 4: Refactor TicketCard - Direct Atom Access

**Remove props:** `onIncrement`, `onDecrement`

```typescript
import { useSetAtom } from 'jotai';
import { incrementTicketAtom, decrementTicketAtom } from '@/lib/atoms/cart';

interface TicketCardProps {
  ticket: Ticket;
  uiState: TicketUIState;
  // No handlers!
}

export function TicketCard({ ticket, uiState }: TicketCardProps) {
  // Access atoms directly
  const increment = useSetAtom(incrementTicketAtom);
  const decrement = useSetAtom(decrementTicketAtom);
  
  const handleAddClick = () => {
    if (!uiState.isPurchasable) return;
    increment(ticket.id);
  };
  
  // ... rest of component uses increment/decrement directly
  <QuantityStepper
    value={uiState.currentQty}
    ticketId={ticket.id}  // Pass ID, not handlers!
    showTrashIcon={uiState.showTrashIcon}
    canIncrement={uiState.canIncrement}
    canDecrement={uiState.canDecrement}
  />
}
```

## Phase 5: Refactor QuantityStepper - Direct Atom Access

**Remove props:** `onIncrement`, `onDecrement`

**Add prop:** `ticketId`

```typescript
import { useSetAtom } from 'jotai';
import { incrementTicketAtom, decrementTicketAtom } from '@/lib/atoms/cart';

interface QuantityStepperProps {
  value: number;
  ticketId: string;  // NEW: needs ID to call atoms
  showTrashIcon: boolean;
  canIncrement: boolean;
  canDecrement: boolean;
  ariaDescribedById?: string;
}

export function QuantityStepper({ value, ticketId, ... }) {
  // Access atoms directly
  const increment = useSetAtom(incrementTicketAtom);
  const decrement = useSetAtom(decrementTicketAtom);
  
  return (
    <div>
      <button onClick={() => decrement(ticketId)}>-</button>
      <span>{value}</span>
      <button onClick={() => increment(ticketId)}>+</button>
    </div>
  );
}
```

## Phase 6: Refactor TicketList - Direct Atom Access

**Remove props:** `tickets`, `uiStates`, `onIncrement`, `onDecrement`

```typescript
import { useAtomValue } from 'jotai';
import { ticketUIStatesAtom } from '@/lib/atoms/ticket-ui-states';

// NO PROPS except configuration!
export function TicketList() {
  // Read directly from atoms
  const ticketUIStates = useAtomValue(ticketUIStatesAtom);
  
  return (
    <div className="space-y-2" data-testid="ticket-list">
      {ticketUIStates.map((uiState) => (
        <TicketCard
          key={uiState.ticketId}
          ticket={uiState.ticket}
          uiState={uiState}
          // No handlers!
        />
      ))}
    </div>
  );
}
```

## Phase 7: Refactor CartFooter - Direct Atom Access

**Remove props:** `cartState`, `checkoutDisabled`, `pricing`, `isPricingLoading`, `error`, `onRetry`

**Keep props:** `onCheckout` (parent callback), `currency`, `ctaLabel`, `ctaVariant`, `footnote` (config)

```typescript
import { useAtomValue, useSetAtom } from 'jotai';
import { cartSummaryAtom } from '@/lib/atoms/cart';
import { checkoutDisabledAtom } from '@/lib/atoms/ticket-ui-states';
import { pricingAtom, pricingLoadingAtom, pricingErrorAtom, retryPricingAtom } from '@/lib/atoms/pricing';

interface CartFooterProps {
  currency: string;
  onCheckout: () => void;
  ctaLabel?: string;
  ctaVariant?: "neutral" | "accented";
  footnote?: string;
}

export function CartFooter({ currency, onCheckout, ctaLabel, ctaVariant, footnote }: CartFooterProps) {
  // Read from atoms directly
  const cartSummary = useAtomValue(cartSummaryAtom);
  const pricing = useAtomValue(pricingAtom);
  const isPricingLoading = useAtomValue(pricingLoadingAtom);
  const error = useAtomValue(pricingErrorAtom);
  const isCheckoutDisabled = useAtomValue(checkoutDisabledAtom);
  const retryPricing = useSetAtom(retryPricingAtom);
  
  // ... rest uses atoms, no props!
}
```

## Phase 8: Refactor TicketsPanel - Orchestration Only

**Final clean component:**

```typescript
function TicketsPanelClient({ eventId, event, onCheckout, onChange, ui }) {
  // 1. Set event config
  const setEventConfig = useSetAtom(eventConfigAtom);
  React.useEffect(() => {
    setEventConfig({
      mixedTicketTypesAllowed: event.mixedTicketTypesAllowed,
      timeZone: event.timeZone,
    });
  }, [event.mixedTicketTypesAllowed, event.timeZone, setEventConfig]);
  
  // 2. Optional: Register onChange callback
  const setOnChangeCallback = useSetAtom(onCartChangeCallbackAtom);
  React.useEffect(() => {
    setOnChangeCallback(onChange ?? null);
  }, [onChange, setOnChangeCallback]);
  
  // 3. Get cart for onCheckout only
  const cart = useAtomValue(cartAtom);
  const pricing = useAtomValue(pricingAtom);
  
  // 4. Render - NO PROPS drilled!
  return (
    <Card>
      {ui?.showHeader && <Header />}
      <TicketList />  {/* Zero props! */}
      <CartFooter 
        currency={event.currency}
        onCheckout={() => onCheckout(cart, pricing)}
        ctaLabel={ui?.ctaLabel}
        ctaVariant={ui?.ctaVariant}
        footnote={ui?.footnote}
      />
    </Card>
  );
}
```

## Success Criteria

- ✅ TicketCard uses atoms directly (no handler props)
- ✅ TicketList uses atoms directly (no data props)
- ✅ CartFooter uses atoms directly (no state props)
- ✅ QuantityStepper uses atoms directly (receives ticketId only)
- ✅ Only config props remain (event, ui, callbacks)
- ✅ Change analytics: 1 file (atom) vs 5 files (prop chain)

## Files to Modify

- `apps/frontrow/src/lib/atoms/pricing.ts` (NEW)
- `apps/frontrow/src/lib/atoms/cart-callbacks.ts` (NEW)
- `apps/frontrow/src/lib/atoms/cart.ts` (add callback trigger)
- `apps/frontrow/src/lib/atoms/ticket-ui-states.ts` (add checkoutDisabledAtom)
- `apps/frontrow/src/features/ticket-panel/components/TicketsPanel.tsx` (simplify)
- `apps/frontrow/src/features/ticket-panel/components/TicketList.tsx` (use atoms)
- `apps/frontrow/src/features/ticket-panel/components/TicketCard.tsx` (use atoms)
- `apps/frontrow/src/features/ticket-panel/components/QuantityStepper.tsx` (use atoms)
- `apps/frontrow/src/features/ticket-panel/components/CartFooter.tsx` (use atoms)

### To-dos

- [ ] Create pricing.ts with query atom and derived atoms for data/loading/error states
- [ ] Create cart-callbacks.ts for optional onChange callback registration
- [ ] Add checkoutDisabledAtom to ticket-ui-states.ts
- [ ] Update increment/decrement atoms to trigger registered callbacks
- [ ] QuantityStepper: remove handler props, add ticketId, use atoms directly
- [ ] TicketCard: remove handler props, use atoms directly, pass ticketId to stepper
- [ ] TicketList: remove all props, read ticketUIStatesAtom directly
- [ ] CartFooter: remove state props, read from atoms directly
- [ ] TicketsPanel: remove prop drilling, orchestration only