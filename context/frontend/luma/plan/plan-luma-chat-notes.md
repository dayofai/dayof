I updated the plan as requested. The spec now matches the live Luma page while keeping our implementation boundaries explicit.

Files touched

- [5pro-components.md](context/luma/plan/5pro-components.md)

What changed

- Add-to-calendar is explicitly optional

  - Annotated the EventMeta tree and the AddToCalendarButtons line to render only when data exists.

- Presented-by placement clarified

  - PresentedByBadge remains optional; if absent, we note the “Presented with …” copy can live inside About content.

- Optional helper microcopy for limits/inventory

  - TicketCard section now calls out optional helper text (e.g., “Max 2 per person”, “Limited availability”) derived from limits/inventory when caps are tight.

- Cart semantics documented (no storefront cart)

  - We do not expose a multi-page shopping cart. The “cart” is an ephemeral selection state living inside TicketsPanel used to:
    - gate the CTA (disabled until totalQty > 0 and all constraints pass),
    - compute subtotal/fees/tax preview (if enabled),
    - run live validations (inventory, purchase windows) via onChange before redirecting to checkout.
  - Clarified this in three places:
    - TicketsPanel behaviors block,
    - Cart type comment (“UI-only selection state … before redirecting to checkout”),
    - Hooks section (“Cart semantics: no persistent cart—just selection state that becomes checkout line items”).

- Token/wallet gating: out of scope, noted
  - Left a clear note under Eligibility stating we do not implement on-chain/token gating (even if Luma sometimes shows a wallet verification notice). This retains our requiresCode/eligibleUserIdsOrRoles path while making the non-goal explicit.

Quick explanation: how “cart” works on Luma-style pages

- Luma’s UI presents ticket selection inline within the event page. Users tap +/− to pick quantities, and then press a single CTA (e.g., “Get Ticket”) to jump straight to checkout. There’s no standalone “view cart” step.
- Our Cart object models this transient selection so we can:
  - validate limits and availability as the user changes quantities,
  - show an accurate total for the CTA,
  - optionally display fee/tax previews.
- On checkout, this selection becomes the line items; nothing persists as a cross-page cart.

Validation notes in the document

- EventMeta now mentions add-to-calendar as optional.
- PresentedByBadge section mentions the About fallback.
- TicketCard lists optional helper microcopy derived from limits/inventory.
- Eligibility section includes the explicit non-goal note for token/wallet gating.
- Cart type and hooks include the “ephemeral selection state” clarification (direct checkout flow).

Reference used for alignment

- [luma-tm15enb1-builder.json](context/luma/source/luma-tm15enb1-builder.json)

No schema fields were added for wallet gating (per your decision); the plan stays minimal but precise, with clear optionality and non-goals documented.
