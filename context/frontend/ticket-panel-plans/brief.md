# TicketsPanel Implementation Brief

This brief is the map. Full code, queries, and visual specs live in the companion docs. It removes duplication and points you to the single source of truth for details.

---

## 1. How to navigate these docs

- Building the feature: Follow Section 4 (step-by-step). Use [components.md](context/luma/brief/components.md) for data/logic and [layout.md](context/luma/brief/layout.md) for visuals/styling.
- Reviewing the design: Read Section 2 (overview) and skim Section 3 (architecture).
- Debugging: See “Common gotchas” under Section 4; query and UI logic live in [components.md](context/luma/brief/components.md).
- Terminology note (handles, routes) is defined once in [components.md](context/luma/brief/components.md).

---

## 2. Project overview and scope

### 2.1 What you’re building

A standalone ticket selection widget with cart functionality, built in isolation at /ticket-playground and later dropped into the event page without modification.

Core features:

- Ticket display with all states (featured, available, locked, sold out)
- Cart management via +/- steppers (trash icon at qty=1)
- Persistent cart (localStorage)
- Real‑time pricing (mocked locally; server-authoritative later)
- Smart validation via reactive queries (inventory limits, mixed‑type rules, sales windows)

### 2.2 Project goal and key characteristics

- TanStack DB for reactive state; TanStack Query for fetching
- Mock‑first; easy swap to real API later (same hooks/collections)
- Component isolation; can be embedded on any event page
- Hybrid SSR strategy tuned for widgets

### 2.3 SSR strategy (canonical)

- Production: ssr: "data-only" so the loader fetches on the server and the widget renders on the client (no waterfalls; localStorage works).
- Playground: ssr: false for simplicity.
- SEO‑critical pages: ssr: true + wrap TicketsPanel in ClientOnly with a skeleton.

#### Production route example (data-only SSR)

```typescript
// apps/frontrow/src/routes/$orgHandle/$eventHandle.tsx
import { createFileRoute } from "@tanstack/react-router";
// import { db } from "@/lib/db"            // Example: your DB access layer
// import { EventPage } from "@/features/event/EventPage" // Example: page component

export const Route = createFileRoute("/$orgHandle/$eventHandle")({
  ssr: "data-only",
  loader: async ({ params }) => {
    // Fetch on the server (no client waterfall)
    const event = await db.event.findUnique({
      where: { handle: params.eventHandle },
    });
    const tickets = await db.ticket.findMany({ where: { eventId: event.id } });

    // TanStack Start serializes this to the client
    return { event, tickets };
  },
  component: EventPage,
});
```

Notes:

- Playground stays `ssr: false` (client-only) for simplicity.
- SEO‑critical pages can use `ssr: true` and wrap TicketsPanel in `<ClientOnly>` with a skeleton fallback.

### 2.4 Scope boundaries

What you will create (15 files):

**Core implementation (13 files):**

- apps/frontrow/src/lib/schemas/tickets.ts
- apps/frontrow/src/lib/schemas/cart.ts
- apps/frontrow/src/lib/schemas/event.ts
- apps/frontrow/src/lib/collections/tickets.ts
- apps/frontrow/src/lib/collections/cart.ts
- apps/frontrow/src/lib/utils/format.ts
- apps/frontrow/src/lib/mock-data.ts
- apps/frontrow/src/features/ticket-panel/components/TicketsPanel.tsx
- apps/frontrow/src/features/ticket-panel/components/TicketList.tsx
- apps/frontrow/src/features/ticket-panel/components/TicketCard.tsx
- apps/frontrow/src/features/ticket-panel/components/QuantityStepper.tsx
- apps/frontrow/src/features/ticket-panel/components/CartFooter.tsx
- apps/frontrow/src/features/ticket-panel/components/TicketPrice.tsx
- apps/frontrow/src/routes/ticket-playground.tsx

**Optional (recommended for MVP):**

- apps/frontrow/src/features/ticket-panel/lib/computeTicketUI.ts
- apps/frontrow/src/features/ticket-panel/lib/computeTicketUI.test.ts

Detailed specs for each live in [components.md](context/luma/brief/components.md).

What you don’t touch:

- apps/frontrow/src/features/event/index.tsx (existing EventPage, if present)
- Existing shared components under apps/frontrow/src/components/
- Existing routes (apart from adding the new playground route)
- Vendor primitives (import from @/ui/\* adapters instead)

### 2.5 Success criteria

- /ticket-playground loads; no errors
- Cart persists across refresh
- All ticket states render correctly
- Add/remove and stepper transitions behave as specified
- Mixed‑type locking and max/min limits enforced via query state
- Pricing shows subtotal/fees/tax breakdown from the mock
- Meets visual and accessibility requirements defined in [layout.md](context/luma/brief/layout.md)

---

## 3. Technical stack and architecture (concise)

### 3.1 Three-Layer Architecture Pattern

This project follows a strict vendor isolation pattern to **protect against upstream dependency churn**:

**Layer 1: `src/vendor/`** (Read-only)

- Contains vendor primitives from **ReUI** (Base UI variants, preferred) and shadcn (fallback)
- ReUI provides headless, accessible components built on Radix primitives
- Never imported directly by feature components
- Pinned to specific versions

**Layer 2: `src/ui/`** (Adapter layer)

- Wraps vendor primitives (prefers ReUI Base UI variants) with stable API
- Defines brand-specific variants (brand, primary, secondary, etc.)
- Enforces accessibility defaults
- **Only layer that imports from `src/vendor/`**

**Layer 3a: `src/routes/`** (TanStack Start Routes)

- Route files that map to URLs (e.g., `routes/$orgHandle/$eventHandle.tsx`)
- Define route configuration including `ssr: false` for client-rendered routes
- Import and render feature components from `src/features/`
- Must follow TanStack Start file-based routing conventions

**Layer 3b: `src/features/`** (Domain UI Components)

- Event page components, ticketing logic (e.g., `features/ticket-panel/components/TicketsPanel.tsx`)
- Imports **only** from `@/ui/*` and `@/lib/*`
- Protected from vendor breaking changes
- Organized by feature domain, not by route structure

**Enforcement**: A Biome lint rule blocks vendor imports in features directory:

```json
{
  "linter": {
    "rules": {
      "correctness": {
        "noRestrictedImports": {
          "level": "error",
          "options": {
            "paths": {
              "@/vendor/*": "Import adapters from @/ui/* instead."
            }
          }
        }
      }
    }
  }
}
```

**Project Structure Example**:

```text
apps/frontrow/
├── src/
│   ├── routes/                          # TanStack Start file-based routing
│   │   ├── __root.tsx                   # Root layout (always rendered)
│   │   ├── index.tsx                    # Homepage route
│   │   ├── ticket-playground.tsx        # Your test route (ssr: false)
│   │   └── $orgHandle/
│   │       ├── index.tsx                # Organization profile page
│   │       └── $eventHandle.tsx         # Event detail route (ssr: false)
│   │
│   ├── features/                        # Feature-organized components
│   │   └── event/
│   │       ├── EventPage.tsx            # Main page component (imported by route)
│   │       ├── lib/
│   │       │   ├── computeTicketUI.ts   # Pure business logic
│   │       │   └── computeTicketUI.test.ts
│   │       └── components/
│   │           ├── TicketsPanel.tsx     # Smart container with useLiveQuery
│   │           ├── TicketList.tsx       # Presentation component
│   │           ├── TicketCard.tsx       # Presentation component
│   │           ├── QuantityStepper.tsx  # Reusable UI component
│   │           ├── CartFooter.tsx       # Pricing display component
│   │           └── TicketPrice.tsx      # Price formatting component
│   │
│   ├── lib/                             # Shared utilities
│   │   ├── schemas/
│   │   │   ├── tickets.ts
│   │   │   ├── cart.ts
│   │   │   └── event.ts
│   │   ├── collections/
│   │   │   ├── tickets.ts               # QueryCollection definition
│   │   │   └── cart.ts                  # LocalStorageCollection definition
│   │   ├── utils/
│   │   │   └── format.ts
│   │   └── mock-data.ts
│   │
│   ├── ui/                              # Adapter layer (wraps vendor primitives)
│   │   ├── button.tsx                   # Wraps @/vendor/reui/button
│   │   ├── card.tsx                     # Wraps @/vendor/reui/card
│   │   └── ...
│   │
│   └── vendor/                          # Vendor primitives (read-only)
│       ├── reui/                        # ReUI Base UI variants (preferred)
│       │   ├── button.tsx
│       │   ├── card.tsx
│       │   └── ...
│       └── shadcn/                      # shadcn/ui components (fallback)
│           ├── dialog.tsx
│           └── ...
```

**Key Rules:**

- ✅ Routes import from `@/features/*` and `@/lib/*`
- ✅ Features import from `@/ui/*` and `@/lib/*`
- ❌ Features **never** import from `@/vendor/*` (enforced by lint)

### 3.2 Data and schemas

- Collections use the three-collection pattern: domain (tickets), user data (cart), UI controls (filters)
- Use Zod schemas; pass schema to createCollection for runtime validation and type inference
- All derived state computed via TanStack DB live queries using .fn.select() for complex logic
- No useMemo for derived state - TanStack DB handles reactivity via differential dataflow

Full query implementations and types live in [components.md](context/luma/brief/components.md).

### 3.3 Adapter API requirements

**Component registry**: Use **ReUI** (Base UI variants) as the primary source for vendor primitives. ReUI provides accessible, headless components built on Radix UI primitives with better TypeScript support and composition patterns.

- **Preferred**: `@/vendor/reui/*` (Base UI variants from ReUI registry)
- **Fallback**: `@/vendor/shadcn/*` (standard shadcn/ui components for anything not in ReUI)
- **Adapters**: Import from `@/ui/*` only (never directly from vendor)

**Key rules**:

- Import Button/Card from `@/ui/*` adapters only
- Icon-only buttons must have `aria-label`
- Adapters wrap ReUI Base UI variants with brand-specific styling

**ReUI Registry**: https://reui.dev (Base UI components built on Radix primitives)

Adapter details and examples: [components.md](context/luma/brief/components.md).

### 3.4 Required dependencies

**Version matrix** (use latest within these major versions):

| Package                       | Version | Notes                                 |
| ----------------------------- | ------- | ------------------------------------- |
| Bun                           | ≥1.1    | Runtime                               |
| TypeScript                    | ≥5.4    | Type checking                         |
| React                         | 18.x    | UI framework                          |
| @tanstack/react-db            | Latest  | Reactive collections                  |
| @tanstack/query-db-collection | Latest  | Server data integration               |
| @tanstack/react-query         | 5.x     | Data fetching                         |
| @tanstack/react-router        | 1.x     | Routing                               |
| @tanstack/react-start         | 1.x     | SSR framework                         |
| @tanstack/react-pacer         | 1.x     | Debouncing (use `/debouncer` subpath) |
| zod                           | 4.x     | Schema validation                     |
| dinero.js                     | 2.x     | Money calculations                    |
| @dinero.js/currencies         | 2.x     | Currency constants                    |

**One-shot install command**:

```bash
bun add -E \
  @tanstack/react-db \
  @tanstack/query-db-collection \
  @tanstack/react-query \
  @tanstack/react-router \
  @tanstack/react-start \
  @tanstack/react-pacer \
  zod \
  dinero.js \
  @dinero.js/currencies
```

**Import path conventions**:

- Pacer: `import { useDebouncedValue } from '@tanstack/react-pacer/debouncer'`
- Zod: `import * as z from 'zod'` (standard import, not `zod/v4`)
- Dinero: `import { USD } from '@dinero.js/currencies'` (use constants, not manual objects)
- Dinero currencies helper: `import * as currencies from '@dinero.js/currencies'` (for dynamic currency lookup)

---

## 4. Getting started (single source of truth)

1. Playground route

   - Use the exact snippet from [layout.md](context/luma/brief/layout.md) ("Your playground route"). Keep ssr: false here.

2. Create directories

   ```text
   apps/frontrow/src/lib/{schemas,utils,collections}
   apps/frontrow/src/features/ticket-panel/components
   ```

3. Implementation order

   - Schemas: lib/schemas/{tickets,cart,event}.ts — copy from [components.md](context/luma/brief/components.md) Section 10 (uses `import * as z from 'zod'`)
   - Formatting utilities: lib/utils/format.ts — copy from [components.md](context/luma/brief/components.md) Section 9
   - Mock data + pricing: lib/mock-data.ts — copy fixtures and calculateCartTotal from [components.md](context/luma/brief/components.md) (use `USD` constant from `@dinero.js/currencies`)
   - Collections: lib/collections/{tickets,cart}.ts — follow the "Collections are Defined Outside" pattern in [components.md](context/luma/brief/components.md)
   - TicketsPanel queries + cart ops: implement basic useLiveQuery calls and increment/decrement per [components.md](context/luma/brief/components.md) (note: debouncer import is `@tanstack/react-pacer/debouncer`)
   - Presentation components: TicketList, QuantityStepper, TicketCard, CartFooter — follow specs in [components.md](context/luma/brief/components.md); styling from [layout.md](context/luma/brief/layout.md)
   - Advanced: ticketUIStates query (two-step derivation with useMemo) and debounced pricing — see "State Management" in [components.md](context/luma/brief/components.md)

4. Testing / Validate in /ticket-playground:
   - Add: "Add" → stepper with trash (qty=1); + changes trash to minus (qty=2)
   - Remove: qty=2 → minus to 1; qty=1 → trash removes item → back to Add
   - Limits: max/min per order; helper text reflects limits
   - Mixed types off: adding one type greys others with reason; removing unlocks
   - Low inventory: shows orange state and helper text
   - Cart footer: disabled when empty; pricing breakdown and pluralized CTA when items present
   - Refresh: cart persists via localStorage (frontrow:ticket-cart:v1)
   - Cross-tab sync: Open two tabs, add items in tab A → tab B updates automatically (built-in via localStorage events)

### 4b. **5-minute sanity test (edge checks)**

Run through these checks to validate all critical behaviors:

- **Stepper semantics**: For any on‑sale ticket, click **Add** → see stepper with **trash** at qty=1 → press **+** → left button becomes **minus**; decrement back to 0 returns to **Add**.
- **One‑type lock** (when `mixedTicketTypesAllowed: false`): Add one ticket type; other tickets are greyed out with reason "Remove other tickets to add this one". Remove it → others unlock.
- **Per‑ticket limits**:
  - Increment the VIP ticket until disabled; helper text shows "Max 10 per order"
  - Add Group Package ticket; must add at least 4 (shows "Min 4 required" if below min)
- **Low inventory microcopy**: The "Last Chance Tickets" ticket (3 remaining) displays "Only 3 left!" with orange dot.
- **Pricing debounce**: Make 2–3 rapid increments; the footer should show **Calculating...** briefly, but totals shouldn't thrash on every keystroke (~500ms debounce).
- **Persistence**: Add 1–2 items, reload the page; cart remains via `localStorage` key **frontrow:ticket-cart:v1**.

> **Tip**: The mock data includes tickets specifically designed for these tests (Group Package for minPerOrder, Last Chance for low inventory).

5. Common gotchas (single list)
   - Route must be client-only (ssr: false) in the playground for useLiveQuery/localStorage
   - Cart collection needs typeof window guard (SSR-safe stub on server, localStorage in browser)
   - Use leftJoin (not join) when combining tickets and cart
   - Trash icon condition is eq(coalesce(cart.qty, 0), 1)
   - Pass schema to createCollection to get type inference (no explicit generics)
   - Use versioned storage key: `frontrow:ticket-cart:v1` (increment version when schema changes)
   - **Import paths**: Pacer uses `/debouncer` subpath; Zod imports as `zod`, not `zod/v4`
   - **Currency objects**: Always use `USD` from `@dinero.js/currencies`, not manual `{ code, base, exponent }`
   - **Date sorting**: Use `Date.parse()` for robust timezone handling, not string comparison
   - **React Query v5**: Use `placeholderData: keepPreviousData` (import helper), not the deprecated `keepPreviousData: true` option

---

## 5. References

- **Components, queries, types, and logic**: [components.md](context/luma/brief/components.md)
- **Visual mockups, CSS tokens, responsive and accessibility**: [layout.md](context/luma/brief/layout.md)
- **Error handling and future enhancements**: [enhancements.md](context/luma/brief/enhancements.md)

---

## Appendix A: Data Flow Overview (kept here to avoid loss)

```none
User clicks + button
  ↓
cartCollection.update(ticketId, draft => draft.qty += 1)
  ↓
Instant (<1ms): All queries recompute automatically
  ├─ ticketUIStates updates (button states, validation)
  ├─ cartSummary updates (total qty, item count)
  └─ localStorage syncs in background
  ↓
Debounced (~1s): Server pricing recalculates
  └─ calculateCartTotal() called with new cart items
  ↓
Background: Tickets collection auto-refetches
  ├─ On window focus (user returns to tab)
  ├─ On network reconnect (internet restored)
  └─ Polling fallback (every 30s, configurable)
```

This sequence diagram is explanatory and not duplicated verbatim in the companion docs. The underlying queries and logic are defined in [components.md](context/luma/brief/components.md).

## Appendix B: Lint Enforcement (Biome rule)

Use Biome to enforce the adapter boundary (features import only from @/ui/ and @/lib/):

```json
{
  "linter": {
    "rules": {
      "correctness": {
        "noRestrictedImports": {
          "level": "error",
          "options": {
            "paths": {
              "@/vendor/*": "Import adapters from @/ui/* instead."
            }
          }
        }
      }
    }
  }
}
```

If your repository centralizes lint rules, keep the canonical copy there. This snippet remains here as a single-source reference for the policy.
