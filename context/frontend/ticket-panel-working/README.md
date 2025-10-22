# Ticket Panel – Current State & File Map

This document tracks the current implementation state of the Frontrow Ticket Panel after the Jotai refactor and Luma-aligned visual updates.

## Overview

- Architecture: Jotai + TanStack Query (no prop drilling; components read atoms directly)
- Theming: OKLCH tokens (via CSS relative colors) with route-level theme injection
- Interaction: Hybrid pattern
  - qty=0 → whole ticket is a button (add to cart)
  - qty>0 → ticket is a div with a quantity stepper on the right
- Footer policy: If included, `CartFooter` is always visible (no collapsed mode). Omit entirely when not needed.

## Key Files (Feature UI)

- apps/frontrow/src/features/ticket-panel/components/TicketsPanel.tsx
  - Container card, header section (tinted), mounts `TicketList` and `CartFooter`
- apps/frontrow/src/features/ticket-panel/components/TicketList.tsx
  - Maps `ticketUIStates` to `TicketCard`
- apps/frontrow/src/features/ticket-panel/components/TicketCard.tsx
  - Hybrid button/div pattern, tooltip for fee/tax, availability/labels, featured badge
- apps/frontrow/src/features/ticket-panel/components/QuantityStepper.tsx
  - Borderless, subtle themed background; no width-collapse (prevents layout shift)
- apps/frontrow/src/features/ticket-panel/components/CartFooter.tsx
  - Always visible when included; optional pricing breakdown; CTA set to 38px
- apps/frontrow/src/features/ticket-panel/components/FeaturedBadge.tsx
  - CSS-only badge with subtle glow (no SVG for now)

## State & Atoms

- apps/frontrow/src/lib/atoms/cart.ts
  - `cartAtom` (atomWithStorage), `cartSummaryAtom`, `incrementTicketAtom`, `decrementTicketAtom`, `clearCartAtom`
- apps/frontrow/src/lib/atoms/pricing.ts
  - `pricingQueryAtom` (atomWithQuery) + `pricingAtom`, `pricingLoadingAtom`, `pricingErrorAtom`, `retryPricingAtom`
- apps/frontrow/src/lib/atoms/ticket-ui-states.ts
  - `eventConfigAtom` – includes event + UI config (see below)
  - `ticketUIStatesAtom` – derived, computes per-ticket UI from tickets + cart + filters
  - `checkoutDisabledAtom` – derived validation (e.g., minPerOrder)
- apps/frontrow/src/lib/atoms/cart-callbacks.ts
  - `onCartChangeCallbackAtom`, `onCheckoutCallbackAtom` (optional; registered by parent)

## UI Config (eventConfigAtom.ui)

- showHeader?: boolean
- ctaLabel?: string
- ctaVariant?: 'neutral' | 'accented'
- footnote?: string
- showPricingBreakdown?: boolean
- featuredBadgeVariant?: 'css' | 'none'
- showInfoOnHoverOnly?: boolean
- density?: 'compact' | 'comfortable' (reserved for future touch-target scaling)

## Theming

- OKLCH tokens in apps/frontrow/src/index.css
  - Surfaces: `--theme-accent-04`, `--theme-accent-08`, `--theme-accent-32`
  - Text (neutral): `--luma-dark`, `--luma-muted` (primary text colors for readable content)
  - Text (accent): `--theme-accent`, `--theme-accent-64` (used for interactive/selected states)
  - CTA: `--theme-cta`, `--theme-cta-hover`
- Route-level injection utility: apps/frontrow/src/lib/theme/calculate-theme.ts
  - Apply via inline styles in the route (see ticket playground)
- Color Strategy: Neutral-first approach
  - Use `--luma-dark` / `--luma-muted` for primary content (ticket details, pricing, descriptions)
  - Use `--theme-accent` variants only for interactive elements, selection states, and themed surfaces

## Business Logic (Pure Function)

- apps/frontrow/src/features/ticket-panel/lib/computeTicketUI.ts
  - Computes `TicketUIState` with fields like `currentQty`, `isPurchasable`, `helperText`, `isSelected`, etc.

## Router & Testing Utilities

- apps/frontrow/src/router.tsx – hydrates Jotai default store with QueryClient (React 19-safe)
- apps/frontrow/src/test/utils/renderWithJotai.tsx – test helper to hydrate atoms

## SSR-Query Integration (Frontrow)

- Router wiring: `apps/frontrow/src/router.tsx`
  - Creates a fresh `QueryClient` per SSR request
  - Calls `setupRouterSsrQueryIntegration({ router, queryClient })`
  - Hydrates Jotai default store on the client by setting `queryClientAtom`
- Tickets prefetch:
  - Query options: `apps/frontrow/src/lib/queries/tickets.ts` (`ticketsQuery(eventId)`)
  - Playground route: `apps/frontrow/src/routes/ticket-playground.tsx` preloads tickets cache (ssr: false)
  - Event route: `apps/frontrow/src/routes/event.$eventName.tsx` loader `ensureQueryData(ticketsQuery(eventId))`
- Pricing prefetch (no cart persistence):
  - Inference util: `apps/frontrow/src/lib/utils/inferInitialSelection.ts`
  - Pricing query options: `apps/frontrow/src/lib/queries/pricing.ts`
  - Event route loader infers initial items; if present, prefetches pricing via `ensureQueryData(pricingQuery({ eventId, items }))`
  - If no inference matches, pricing remains client-only via `pricingQueryAtom`
- Atoms consumption:
  - `ticketsAtom` reads from the Query cache (`queryClient.getQueryData(['tickets', eventId])`)
  - `ticketUIStatesAtom` derives UI state from tickets + cart + filters (no prop drilling)

### Validation

- Playground (`/ticket-playground`): SSR disabled for speed; still preloads tickets cache
- SSR route (`/event/<name>`):
  - Tickets should appear without a client fetch waterfall
  - If inference matches (single available ticket, default ticket, or query param), totals render on first paint
  - Otherwise, totals stream in client-side as the cart changes

### Notes

- No persistent cart is stored; inference is conservative and optional
- Use blocking `ensureQueryData` for immediate totals or `fetchQuery` to stream, per route UX needs

## Visual Details Snapshot

- Header: true section; tinted `--theme-accent-04`; border `--theme-accent-08`; title 14px `--luma-muted`; subtitle 16px `--luma-dark`
- TicketCard:
  - Title/price 16px `--luma-dark` (neutral, readable)
  - Description/availability 13px `--luma-muted`
  - Unavailable reason: always visible (no hover state), 12px `--luma-muted`
  - Tooltip info icon/breakdowns: `--luma-muted` with `--luma-dark` hover
  - Status dot 9px (green or `--theme-accent-32`)
- Selection highlight: `isSelected` → border `--theme-accent` + bg `--theme-accent-32`
- QuantityStepper: borderless; `p-1.5`; bg `--theme-accent-04` / hover `--theme-accent-08`; quantity `min-w-9` `--luma-dark`
- CartFooter:
  - Always visible; CTA `h-[38px]`
  - Pricing labels (Subtotal, Fees, Tax, Total): `--luma-muted`
  - Pricing amounts: `--luma-dark` (Subtotal, Total) and `--luma-muted` (Fees, Tax)
  - Footnote: 13px `--luma-muted`

## How to Verify

1. Dev server: `bun run dev:frontrow`
2. Open `/ticket-playground`
3. Confirm:
   - Themed header tint + typography
   - Ticket button add on qty=0; stepper appears on qty>0
   - No layout shift when stepper appears
   - Featured badge shows only when `featured` && qty=0
   - Footer is visible with 38px CTA; breakdown toggles via `eventConfigAtom.ui.showPricingBreakdown`

## Enhancements (Backlog)

- Sticky `CartFooter` (position: sticky; bottom: 0) with optional backdrop blur
- `density = 'comfortable'` to increase touch targets (Apple HIG ≥44×44 pt)
- Move pricing to TanStack Start server functions for type-safety and performance
