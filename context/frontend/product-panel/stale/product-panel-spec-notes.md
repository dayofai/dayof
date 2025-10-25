# Product Panel Spec & Contract

## Misc Notes

- We should streamline the subtotal, fee, tax, and total display in the Pricing Summary footer so that it's as small as possible with a focus on the total value.
- Reasons for things that are "presentational" should be standardized and client-side. e.g. max_per_order_reached, max_per_user_reached which happen when max_selectable_reached.
- Remove _all_ mentions of inventory or tangentially related words.

## Behavior Notes

- Default applyQuantity='matchParent' when display.placement='children'; default 'independent' when 'section'.

## UI Display Notes

- If all top level product / ticket types (not including their dependent products) are fully sold out (or disabled, or otherwise not purchaseable for a reason other than access code gating), including gated types, show the "fully sold out view" and _do not_ show the access code CTA.
- If only public, ungated, product / ticket types (not including their dependent products) are sold out, but there are hidden gated types still available, either show (TODO: decide) all unpurchaseable ungated visible types or show sold out view but with a DynamicNotice for access code entry.
- TODO: decide if we show payment plan availability on the panel level, on the product type level, or on both?

## DynamicNotice Types

- Payment plan availability / details
- Access code entry (for situations where we want to make access code gating high-visibility)
- FOMO notice ("23 tickets left so hurry!", "only one day left to purchase!", etc.)
- Sold Out / Event Full
  - Microcopy can vary "You can ++enter an access code++ or join the waitlist", "You can join the waitlist to be notified if tickets become available", etc.
  - TODO: how do we determine the various microcopy variations?

## Rules & Preferences

- If humans toggle or set it directly → **preference**.
  - An explicit org‑level setting (e.g., org.pref.hideCodeGatedProductTypes = true). Stored as first‑class data and surfaced as a fact (read‑only to the rules-engine).
- If the system decides it based on conditions → **rule** (that may read preference facts).

- pricing
- visibility
- purchasability
