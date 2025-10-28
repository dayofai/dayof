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

**See:** `lib/computeItemUI-spec.md` for complete decision matrix and test cases.

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

### State Axes (Orthogonal)

Server provides 4 independent dimensions per item:

1. **Temporal** - Time-based availability (`before | during | after`)
2. **Supply** - Inventory status (`available | none | unknown`)
3. **Gating** - Access control (`required, satisfied, listingPolicy`)
4. **Demand** - Alternative actions (`none | waitlist | notify_me`)

Client combines these via pure derivation—**no business logic**, **no schedule math**, **no price computation**.

---

## Implementation Phases

### ✅ Phase 1: Foundation (Current)

- [x] Schemas (Zod v4, strict validation)
- [x] API layer (mock data, TanStack Query)
- [x] State derivation (`computeItemUI` with ts-pattern)

### 🚧 Phase 2: Reactive State (Next)

- [ ] Jotai atoms (panel data, derived items, cart)
- [ ] Selection management (increment/decrement with clamping)

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
├── atoms/                    # Jotai state (to be implemented)
├── components/               # UI primitives (to be implemented)
├── lib/
│   ├── computeItemUI.ts      # State derivation (core logic)
│   ├── computeItemUI-spec.md # Implementation specification
│   └── FINAL-REVIEW.md       # Spec compliance verification
├── schemas/
│   ├── primitives.ts         # MachineCode, ProductId, SectionId
│   ├── context.ts            # OrderRules, Notices, Copy
│   ├── state.ts              # 4 orthogonal axes + messages
│   ├── item.ts               # Product, Variant, Commercial, Relations
│   ├── pricing.ts            # LineItems, Pricing
│   ├── sections.ts           # Section grouping
│   ├── panel.ts              # Root PanelData schema
│   └── index.ts              # Re-exports
├── index.ts                  # Public API
└── README.md                 # This file
```

---

## References

- **Spec:** `context/frontend/product-panel/product-panel-spec.md`
- **Normative Rules:** `context/frontend/product-panel/product-panel-normative-rules-5pro.md`
- **Money Schemas:** `src/lib/schemas/money.ts` (shared across app)
