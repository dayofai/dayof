# Product Panel Feature

Location: `src/feature/product-panel`

Self-contained, reusable product panel for ticket/product sales with full state management, server-driven UI, and accessibility compliance.

---

## Public API

### Queries

#### `panelQueryOptions(eventId: string)`

Fetches the complete product panel data for an event.

**Returns:** TanStack Query options suitable for prefetching in route loaders

**SSR Usage:**

```ts
export const Route = createFileRoute("/events/$eventId")({
  loader: ({ params, context: { queryClient } }) =>
    queryClient.ensureQueryData(panelQueryOptions(params.eventId)),
});
```

**Query Key:** `['panel', eventId]` | **Stale Time:** 60s

---

### Core Logic

#### `computeItemUI(item: PanelItem): ItemUIState`

Transforms server-provided item into UI-ready state by evaluating orthogonal axes.

**Returns:**

```ts
{
  isPurchasable: boolean; // Can add to cart?
  presentation: "normal" | "locked"; // Show price or lock?
  ctaKind: "quantity" | "waitlist" | "notify" | "none";
  priceUI: "hidden" | "masked" | "shown";
  quantityUI: "hidden" | "select" | "stepper";
  // ... + messages, constraints, raw state
}
```

**Key Rules:**

- **Gate Precedence:** Locked items show no CTA (even with waitlist/notify)
- **No Price Tease:** Price hidden when not purchasable (masked when locked)
- **Server Authority:** Never recompute temporal/supply/gating on client

---

## Architecture

### Data Flow

```
Server → PanelData → computeItemUI → ItemUIState → Atoms → Components
```

### Server-First Principle

**All business logic, copy, and CTA decisions live on the server.** The client is a pure presentation layer.

**Server Provides:**

- Final CTA label, action, and enabled state (`context.primaryCTA`)
- Welcome text based on panel state (`context.welcomeText`)
- Item-level messages with priority and placement
- Computed constraints (maxSelectable, temporal phase, supply status)

**Client Derives:**

- UI flags (isPurchasable, presentation, ctaKind)
- Layout mode (compact vs full)
- Visibility rules (showLowRemaining, showAccessCodeCTA)

**Rationale:**

1. **Single Source of Truth** – Business rules in one place (server), reducing drift
2. **i18n Simplicity** – All localization server-side, no client catalogs
3. **Complexity Reduction** – No state-to-copy mapping on client
4. **Spec Alignment** – "Server is single source of truth"
5. **Dynamic Content** – Server personalizes based on context

**Server Contract:**

```typescript
context: {
  primaryCTA: {
    label: "Checkout",           // or "Join Waitlist", "Get Notified"
    action: "checkout",           // or "waitlist", "notify_me", "disabled"
    enabled: true                 // button enabled state
  },
  welcomeText: "Select your tickets to continue"
}
```

### State Axes (Orthogonal)

Server provides 4 independent dimensions per item:

1. **Temporal** - Time-based availability (`before | during | after`)
2. **Supply** - Inventory status (`available | none | unknown`)
3. **Gating** - Access control (`required, satisfied, listingPolicy`)
4. **Demand** - Alternative actions (`none | waitlist | notify_me`)

Client combines these via pure derivation—**no business logic**, **no schedule math**, **no price computation**.

**Supply Status Handling:**

- `available` - Item can be purchased (if other axes allow)
- `none` - Explicitly sold out, blocked from purchase
- `unknown` - Inventory status unclear (API error, cache miss, etc.)
  - **Treated as unavailable** for conservative UX
  - Prevents purchases and triggers sold-out UI states
  - Server should resolve to `available` or `none` when possible

**Gating & Sold-Out Interaction:**

The `allVisibleSoldOutAtom` reports only visible items' status and **intentionally ignores** `gatingSummary.hasHiddenGatedItems`. This is correct per spec §9.6.

UI components must check **both** flags to decide the final state:

```typescript
const allSoldOut = useAtomValue(atoms.allVisibleSoldOutAtom);
const hasHidden = panel.context.gatingSummary?.hasHiddenGatedItems;

if (allSoldOut && hasHidden) {
  // Show AccessCodeCTA - gated inventory might be available
  return <AccessCodePrompt />;
}

if (allSoldOut && !hasHidden) {
  // Now safe to show finale - truly nothing left
  return <EventSoldOutFinale />;
}
```

**Why**: Prevents misleading users when gated inventory exists. Even if all public tickets are sold out, the user should be prompted to unlock before seeing "Event Sold Out".

---

## Implementation Phases

### ✅ Phase 1: Foundation (Complete)

- [x] Schemas (Zod v4, strict validation)
- [x] API layer (mock data, TanStack Query)
- [x] State derivation (`computeItemUI` with ts-pattern)
- [x] Server-first CTA/copy strategy

### ✅ Phase 2: Reactive State (Complete)

- [x] Query atom (TanStack Query bridge)
- [x] Derived items (lookup + UI state)
- [x] Selection management (cart with clamping)
- [x] Panel state (layout, CTA, welcome)
- [x] Atom factory (compose all modules)
- [x] Context provider (usePanelAtoms hook)

### 📋 Phase 3: UI Components

- [ ] Display primitives (Price, Badges)
- [ ] Interactive controls (QuantityStepper)
- [ ] Item composition (ItemCard, ItemList)
- [ ] Demo route for testing

### 🔮 Phase 4: Advanced Features

- [ ] Relations & add-ons (parent dependencies)
- [ ] Message interpolation (copy templates)
- [ ] Access code unlock flow

---

## Guidelines

### Code Quality

- Import UI from `@/components/ui/*` wrappers
- Avoid prop drilling; use derived atoms for data
- All money uses `DineroSnapshot` from `@/lib/schemas/money`
- Keep components pure and presentational
- State derivation in atoms, not components

### Spec Compliance

- Server is single source of truth
- Client derives presentation, never decides business logic
- Strict Zod validation at API boundaries
- No hardcoded copy (all text from server)
- Gating precedence over demand CTAs

### Testing

- Unit tests for each orthogonal axis
- Edge cases: locked, sold out, gated, maxSelectable=0
- Integration tests via demo route

---

## File Organization

```
feature/product-panel/
├── api/
│   └── panel.ts              # TanStack Query integration
├── atoms/
│   ├── query.ts              # Query bridge (TanStack → Jotai)
│   ├── derived-items.ts      # Item lookup + UI state
│   ├── selection.ts          # Cart with localStorage
│   └── panel-state.ts        # Panel-wide derived state
├── components/               # UI primitives (to be implemented)
├── lib/
│   └── computeItemUI.ts      # State derivation (core logic)
├── schemas/
│   ├── primitives.ts         # MachineCode, ProductId, SectionId
│   ├── context.ts            # OrderRules, Notices, Copy, PrimaryCTA
│   ├── state.ts              # 4 orthogonal axes + messages
│   ├── item.ts               # Product, Variant, Commercial, Relations
│   ├── pricing.ts            # LineItems, Pricing
│   ├── sections.ts           # Section grouping
│   ├── panel.ts              # Root PanelData schema
│   └── index.ts              # Re-exports
├── __tests__/
│   └── lib/
│       └── computeItemUI.test.ts  # Unit tests
├── index.ts                  # Public API
└── README.md                 # This file
```

---

## Server Implementation Guide

When building the backend API, compute CTA and welcome text based on panel state:

```typescript
// 1. Compute CTA
if (anyPurchasableItems) {
  primaryCTA = { label: "Checkout", action: "checkout", enabled: true };
} else if (allSoldOutWithWaitlist) {
  primaryCTA = { label: "Join Waitlist", action: "waitlist", enabled: true };
} else if (beforeSaleWithNotify) {
  primaryCTA = { label: "Get Notified", action: "notify_me", enabled: true };
} else {
  primaryCTA = { label: "Checkout", action: "checkout", enabled: false };
}

// 2. Compute welcome text
if (allSoldOut) {
  welcomeText = "Join the waitlist to secure your spot!";
} else if (beforeSale) {
  welcomeText = "Get notified when tickets go on sale.";
} else {
  welcomeText = "Select your tickets to continue.";
}

// 3. Apply locale and personalization
// - Use server-side i18n system
// - Personalize based on user tier, previous purchases, etc.
// - Apply A/B test variants
```

**Client Responsibilities:**

- Render `context.primaryCTA.label` as button text
- Route based on `context.primaryCTA.action`
- Enable/disable based on `context.primaryCTA.enabled`

---

## Recent Changes

### Server-First Refactoring (2025-10-29)

**What Changed:**

- Added `PrimaryCTASchema` to `schemas/context.ts`
- Simplified `atoms/panel-state.ts` from 257 → 133 lines (-48%)
- Removed complex CTA derivation logic (~100 lines)
- Atoms now pass through server data instead of deriving business logic

**Results:**

- ✅ Single source of truth (server)
- ✅ Simpler client (pass-through atoms)
- ✅ i18n ready (all copy server-side)
- ✅ Smaller bundle (removed derivation code)
- ✅ No business logic drift

**Migration:** If reverting to client-side derivation is needed, keep `PrimaryCTASchema` optional and implement fallback logic.

---

## Usage Example

```typescript
import {
  PanelAtomsProvider,
  usePanelAtoms,
  panelQueryOptions,
} from "@/feature/product-panel";
import { useAtomValue } from "jotai";

// Route loader (SSR prefetch)
export const Route = createFileRoute("/events/$eventId")({
  loader: ({ params, context: { queryClient } }) =>
    queryClient.ensureQueryData(panelQueryOptions(params.eventId)),
});

// Component
function ProductPanel({ eventId }: { eventId: string }) {
  return (
    <PanelAtomsProvider eventId={eventId}>
      <PanelContent />
    </PanelAtomsProvider>
  );
}

function PanelContent() {
  const atoms = usePanelAtoms();
  const panel = useAtomValue(atoms.queryAtom);

  if (!panel.data) return <Loading />;

  return (
    <div>
      {panel.data.context.welcomeText && (
        <p>{panel.data.context.welcomeText}</p>
      )}

      {panel.data.items.map((item) => (
        <ProductRow key={item.product.id} productId={item.product.id} />
      ))}

      <CartFooter />
    </div>
  );
}

function ProductRow({ productId }: { productId: string }) {
  const atoms = usePanelAtoms();
  const ui = useAtomValue(atoms.itemUIFamily(productId));
  const [quantity, setQuantity] = useAtom(atoms.selectionFamily(productId));

  if (!ui) return null;

  return (
    <div>
      <h3>{ui.product.name}</h3>
      {ui.priceUI === "shown" && <Price amount={ui.commercial.price} />}
      {ui.quantityUI === "stepper" && (
        <QuantityStepper
          value={quantity}
          max={ui.maxSelectable}
          onChange={setQuantity}
        />
      )}
    </div>
  );
}
```

---

## References

- **Spec:** `context/frontend/product-panel/product-panel-spec.md`
- **Normative Rules:** `context/frontend/product-panel/product-panel-normative-rules-5pro.md`
- **Money Schemas:** `src/lib/schemas/money.ts` (shared across app)
- **Implementation Plan:** `context-local/product-panel-implementation-plan.md`
