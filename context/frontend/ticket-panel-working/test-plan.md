# Ticket Panel Test Plan – States, Invariants, and Rationale

This document defines the behavioral states we want covered by tests for the Ticket Panel and its components. It explains the “why” behind each state, the minimal setup needed (atoms/config), and the key invariants assertions should enforce. Use it as a checklist and an audit aid before writing or modifying tests.

## Scope

- Components: `TicketsPanel`, `TicketList`, `TicketCard`, `QuantityStepper`, `CartFooter`, `FeaturedBadge`
- Architecture: Jotai + TanStack Query (tests hydrate atoms via `renderWithJotai`)
- Theming: OKLCH tokens only – class assertions should prefer semantic checks over exact class snapshots

## Global Test Harness Invariants

- Hydrate atoms with `renderWithJotai`:
  - `eventConfigAtom` (with `ui` config for each test case)
  - `ticketsAtom` (or mock source feeding `ticketUIStatesAtom` via `computeTicketUI`)
  - `cartAtom` (as initial cart state)
  - `pricingQueryAtom` (stub via mock when network-like behavior is present)
- Accessibility:
  - All interactive elements have appropriate `aria-*` labels
  - Keyboard navigation: focus-visible styles are present; tooltip trigger is not a native `<button>` nested inside a button
- Theming:
  - Colors and surfaces come from OKLCH tokens, not rgba literals

## TicketsPanel

- Header section (true section, no negative margins)
  - Invariant: `bg-[var(--theme-accent-04)]` and border `--theme-accent-08`
  - Title `text-sm`, subtitle `text-base`
- Content padding
  - Invariant: outer card `px-4 py-3`; inner content area `px-4 pt-0 pb-3`
- Ticket list spacing
  - Invariant: vertical gap `space-y-2`

## TicketCard – Ticket-Level States

1. Available for purchase

- Setup: `status:on_sale`, within salesWindow, positive capacity
- Invariants:
  - qty=0 → whole card is a button (click to add)
  - Tooltip only renders when fees/tax breakdown requested and not free
  - Title & price `text-base` and `--theme-accent`; secondary text 13px `--theme-accent-64`

2. In cart (selected)

- Setup: cart contains ticket (qty>0)
- Invariants:
  - Card becomes container (not button)
  - Selection highlight: border `--theme-accent` + bg `--theme-accent-32`
  - QuantityStepper visible on the right

3. Max limits reached

- Setup: `limits.maxPerOrder` or `maxPerPerson` reached
- Invariants:
  - Stepper increment disabled
  - Helper text indicates max constraint

4. Below minimum requirement

- Setup: `limits.minPerOrder` > qty > 0
- Invariants:
  - Helper text indicates min requirement
  - `checkoutDisabledAtom` disables CTA

5. Low inventory

- Setup: `remaining` in (1..5] and (6..20]
- Invariants:
  - Helper text reflects scarcity (“Only 3 left!” or “Limited availability”)

6. Locked (mixed types not allowed)

- Setup: `eventConfig.mixedTicketTypesAllowed=false`, cart has different ticket
- Invariants:
  - Ticket greyed/locked and not purchasable
  - Helper text: remove other tickets

7. Sold out / Scheduled / Ended / Invite only / Paused / External

- Setup per status and sales window
- Invariants:
  - Not purchasable; correct unavailable reason text displayed on hover

8. Featured

- Setup: `ticket.featured=true`
- Invariants:
  - CSS-only `FeaturedBadge` shows only when qty=0

9. Tooltip breakdown conditions

- Setup: fees/tax `showBreakdown` toggles; price is free vs non-free
- Invariants:
  - Tooltip visible only when breakdown requested AND ticket not free

## QuantityStepper – Control-Level States

1. Base rendering

- Setup: qty=0 and qty>0
- Invariants:
  - No border on buttons; background `--theme-accent-04` / hover `--theme-accent-08`
  - Visible buttons only when qty>0 (minus disabled/hidden otherwise)

2. Value transitions

- Setup: bump animation when value changes; rapid changes
- Invariants:
  - Quantity text has `min-w-9` (no layout shift) and `tabular-nums`

3. Icons and labels

- Setup: `showTrashIcon` true/false at qty=1
- Invariants:
  - aria-label switches between “Remove ticket” and “Decrease quantity”

4. Constraints

- Setup: `canIncrement=false`, `canDecrement=false`
- Invariants:
  - Buttons disabled accordingly

5. Accessibility

- Setup: optional `ariaDescribedById` present/absent
- Invariants:
  - `aria-describedby` set on increment button when provided

## CartFooter – Footer-Level States

1. Always visible when included

- Invariants:
  - Footer container present; no top border; padding `px-4 pt-3 pb-4`

2. Breakdown toggle

- Setup: `eventConfig.ui.showPricingBreakdown` true/false
- Invariants:
  - When false → only CTA (and optional footnote)
  - When true → subtotal/fees/tax/total present with tokens `--theme-accent`/`--theme-accent-64`

3. CTA properties

- Invariants:
  - Height `h-[38px]` and `font-semibold text-base`
  - Variant neutral vs accented respected
  - Label singular/plural based on `cartSummary.totalQty`

4. States

- Empty (no items): disabled button with guidance text
- Loading: shows “Calculating…” and disables CTA
- Error: error text present; “Retry” button appears only when onRetry provided
- Checkout disabled: CTA disabled when `checkoutDisabledAtom` is true

5. Callbacks

- Setup: `onCheckoutCallbackAtom` registered
- Invariants:
  - Clicking CTA calls the callback with `(cart, pricing)` when enabled

## TicketList

- Renders items based on `ticketUIStatesAtom` – no props in production usage
- Skips tickets without matching UI state
- Maintains vertical spacing and ordering

## Theming & Tokens

- Invariants:
  - All colors originate from OKLCH tokens: `--theme-accent-*`, `--theme-cta`/`--theme-cta-hover`
  - No rgba literals in component classes

## Router/SSR Safety

- Invariants:
  - Tests can run without Jotai Provider SSR issues (use default store + renderWithJotai)
  - `atomWithStorage` values guarded (Array.isArray) during hydration

## Performance

- Invariants:
  - No debounce on cart UI; pricing uses placeholderData pattern (stability of UI during fetch)

## What Not To Over-Test

- Do not snapshot full class names; assert semantic presence (e.g., `h-[38px]`, `min-w-9`) and text/aria signals
- Avoid relying on exact box-shadow strings or all Tailwind classes – prefer targeted assertions

## Matrix Seed (to expand)

- Tickets: on_sale / sold_out / scheduled / ended / invite_only / paused / external
- Limits: minPerOrder, maxPerOrder, maxPerPerson
- Capacity: unlimited / low / none
- UI Config toggles: showHeader, showPricingBreakdown, ctaVariant, featuredBadgeVariant, density
- Cart: empty / one item / many / mixed types forbidden
- Pricing: free / fees only / tax only / both

## Future Additions

- Sticky footer behavior (position: sticky)
- Density = comfortable for touch targets (≥44×44 pt)
- Server functions (TanStack Start) for pricing – type-safe tests around server boundaries
