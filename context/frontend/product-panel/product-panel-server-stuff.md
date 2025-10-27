Based on the Product Panel spec, here's a comprehensive list of backend calculations required via server functions:

## 1. **Temporal State (§3.1)**

- [ ] Calculate current `phase`: `"before" | "during" | "after"`
- [ ] Determine if item is in active sale window (accounting for timezone, DST, pauses)
- [ ] Generate `temporal.reasons[]` (e.g., `outside_window`, `sales_ended`)
- [ ] Optionally format pre-formatted sale timing text (e.g., "On sale Fri 10:00 AM CT")
- [ ] Provide `currentWindow` and `nextWindow` ISO timestamps (display metadata only)

## 2. **Supply/Inventory State (§3.2)**

- [ ] Calculate `supply.status`: `"available" | "none" | "unknown"`
- [ ] Determine actual remaining inventory count
- [ ] Account for holds, reserved seats, pending transactions
- [ ] Generate `supply.reasons[]` (e.g., `sold_out`)
- [ ] Decide when to set `display.showLowRemaining` based on `displayRemainingThreshold`

## 3. **Gating/Access Control (§3.3, §9)**

- [ ] Validate access codes server-side (NEVER client-side)
- [ ] Check if gate `required` and `satisfied` for each item
- [ ] Determine `listingPolicy` per item
- [ ] Calculate `gatingSummary.hasHiddenGatedItems` (only for items with stock)
- [ ] Generate unlock tokens with TTL
- [ ] Enforce rate limiting on code attempts
- [ ] Validate `requirements[]` (time windows, usage limits, etc.)
- [ ] Decide which items to omit vs send as visible_locked

## 4. **Commercial Constraints (§6, §10, §13)**

- [ ] **Calculate `commercial.maxSelectable`** (THE authoritative clamp):
  - [ ] Current stock/inventory
  - [ ] `limits.perOrder` cap
  - [ ] `limits.perUser` cap (cross-session tracking)
  - [ ] Existing holds/reservations
  - [ ] Fraud/abuse rules
  - [ ] Seat map constraints (adjacency, availability)
  - [ ] Parent product selection (for add-ons with `matchBehavior`)
- [ ] Set `limits.perOrder` and `limits.perUser` (informational only)
- [ ] For add-ons: calculate effective `maxSelectable` based on parent selection

## 5. **Pricing & Money (§11, all Dinero.js V2)**

- [ ] Calculate all line items (tickets, fees, taxes, discounts)
- [ ] Apply promotional codes/discounts
- [ ] Compute payment plan effects (installments, interest)
- [ ] Calculate fees (service fees, delivery fees, etc.)
- [ ] Calculate taxes (jurisdiction-specific rules)
- [ ] Generate `pricing.lineItems[]` with Dinero snapshots
- [ ] Determine `pricing.mode`: `"reserve" | "final"`
- [ ] Ensure currency consistency across all items
- [ ] Handle negative amounts (discounts)
- [ ] Recompute on EVERY quantity change

## 6. **Relations & Add-ons (§10)**

- [ ] Track parent product selections
- [ ] Calculate add-on `maxSelectable` based on:
  - [ ] `matchBehavior: "per_ticket"` → sum of parent quantities
  - [ ] `matchBehavior: "per_order"` → order-level cap
- [ ] Enforce multi-parent constraints (sum across all parents)
- [ ] Update add-on availability when parent selection changes

## 7. **Messages & Copy (§5, §7)**

- [ ] Generate `state.messages[]` with:
  - [ ] Appropriate `text` or template params
  - [ ] Correct `placement` and `priority`
  - [ ] Proper `variant` styling hints
- [ ] Generate `context.panelNotices[]`:
  - [ ] Event-level banners
  - [ ] Access code entry prompts
  - [ ] Payment plan availability notices
- [ ] Interpolate template parameters server-side (counts, dates, limits)
- [ ] Localize all text content (no client translation)
- [ ] Format timestamps in user's timezone

## 8. **Order Rules Validation (§4.1)**

- [ ] Determine `orderRules.types` composition
- [ ] Set `minSelectedTypes` and `minTicketsPerSelectedType`
- [ ] Validate submitted orders against these rules
- [ ] Generate appropriate validation error messages

## 9. **Display Hints & Metadata (§4.3, §6)**

- [ ] Determine which `badges` to show per item
- [ ] Calculate `display.showLowRemaining` per item
- [ ] Assign items to `sections` via `display.sectionId`
- [ ] Populate `badgeDetails` tooltips/hovercards
- [ ] Determine `welcomeText` (or let client use adaptive defaults)

## 10. **Real-time Updates (§1, §8.3)**

- [ ] Detect inventory changes (other users purchasing)
- [ ] Detect sale window transitions (phase changes)
- [ ] Detect access code unlocks (for this user)
- [ ] Push updated payloads via WebSocket/SSE or polling
- [ ] Invalidate holds/reservations on timeout
- [ ] Track concurrent selection conflicts

## 11. **Security & Fraud (§13)**

- [ ] Rate limit access code attempts
- [ ] Detect and block suspicious purchase patterns
- [ ] Enforce per-user limits across sessions
- [ ] Log (but don't expose) access codes and tokens
- [ ] Validate all submitted selections server-side
- [ ] Prevent TOCTOU attacks (time-of-check vs time-of-use)

## 12. **Session & User State**

- [ ] Track user's unlock status (which codes entered)
- [ ] Track user's purchase history (for `limits.perUser`)
- [ ] Maintain temporary holds/reservations
- [ ] Associate selection with session/cart
- [ ] Handle session expiry and cleanup

## 13. **Payload Assembly**

- [ ] Filter items based on gating (omit unsatisfied omit_until_unlocked)
- [ ] Sort items and sections by `order`
- [ ] Ensure product ID uniqueness
- [ ] Ensure currency consistency
- [ ] Strip any admin/internal fields before sending
- [ ] Validate entire payload against schema before sending

## From §13 "What the client MUST NOT do":

```
- **No schedule math.** Do **not** compute countdowns or sale windows.
- **No availability math.** Do **not** infer "sold out" or "low stock" from numbers.
- **No price math.** Do **not** compute totals, fees, taxes, discounts, or installment effects.
- **No clamp math.** Do **not** derive selection limits from counts or limits.
- **No gate logic.** Do **not** validate access codes, apply rate limits, or reveal omitted SKUs.
```

## Server Function Endpoints (Implied)

Based on the spec, you'll need these server functions:

1. **`getPanelData(eventId, sessionId?)`**

   - Returns full `PanelData` payload
   - Called on initial load

2. **`updateSelection(eventId, selection: Record<ProductId, number>)`**

   - Accepts new quantities
   - Returns updated `PanelData` (new pricing, possibly updated maxSelectable)
   - Debounced client-side (300ms)

3. **`validateAccessCode(eventId, code: string)`**

   - Server-side only validation
   - Returns updated `PanelData` with unlocked items
   - Rate-limited

4. **`joinWaitlist(eventId, productId, email, ...)`**

   - Demand capture action
   - Returns confirmation

5. **`subscribeToNotifications(eventId, productId, email, ...)`**

   - Notify-me action
   - Returns confirmation

6. **`validateOrder(eventId, selection)`**
   - Pre-checkout validation
   - Checks `orderRules`, stock, limits
   - Returns validation errors or success

## Key Architectural Principle

From the spec's opening:

> "The server is the **single source of truth** for all business decisions; the client is a **pure view** that derives presentation from server facts."

**Everything that affects** `isPurchasable`, pricing, limits, or user-facing business decisions **MUST** be calculated server-side.

---

Based on the spec, here's what **MUST** be recalculated on quantity increment/decrement:

## Core Calculations (Always)

### 1. **Pricing (§11) - ALWAYS**

- [x] Recalculate all `pricing.lineItems[]`:
  - [x] Tickets subtotal (qty × price)
  - [x] Fees (often qty-dependent)
  - [x] Taxes
  - [x] Discounts (may have qty thresholds)
  - [x] Total
- [x] All amounts as Dinero.js V2 snapshots
- [x] Update `pricing.mode` if needed

**From §11:**

> "User changes any item quantity (debounce 300ms recommended)"
> "The server recalculates `pricing` including all fees, taxes, discounts, payment plan effects"

### 2. **Commercial.maxSelectable (§10) - CONDITIONAL**

Needs recalculation if:

- [x] **The changed item is a parent product** → Update all child add-ons:

  ```
  If user changes GA tickets from 2 → 3:
    - Meal voucher maxSelectable: 2 → 3 (per_ticket)
    - Parking pass maxSelectable: stays 1 (per_order)
  ```

- [x] **Fraud/abuse triggers** → May reduce maxSelectable:

  ```
  If user tries to add 100 tickets → fraud rule kicks in
    - maxSelectable drops to prevent abuse
  ```

- [x] **Hold/reservation logic** → If you reserve on qty change:
  ```
  User selects 5 tickets → hold them → reduces available stock
    - Other users' maxSelectable decreases
  ```

**From §10:**

> "The server **MUST** recompute `maxSelectable` for add‑ons on every payload refresh to reflect... the current selection of their parents (per `matchBehavior`)."

### 3. **Relations (§10) - IF PARENT CHANGED**

When a parent product quantity changes:

- [x] Recalculate `maxSelectable` for all child add-ons:
  - **per_ticket**: `maxSelectable = sum of parent quantities`
  - **per_order**: `maxSelectable = order-level cap` (unchanged by parent qty)

### 4. **Messages (§7) - CONDITIONAL**

May need new messages if:

- [x] Quantity triggers a threshold (e.g., "You've selected the maximum")
- [x] Approaching limits generates warnings
- [x] Promotional thresholds ("Add 1 more for free shipping")

**Example:**

```jsonc
// User selects 6 tickets, hits perOrder limit of 6
"state": {
  "messages": [
    {
      "code": "at_max_limit",
      "text": "Maximum 6 tickets per order",
      "placement": "row.under_quantity",
      "variant": "info"
    }
  ]
}
```

## NOT Recalculated on Quantity Change

- ❌ **Temporal** - Time-based, not quantity-based
- ❌ **Supply.status** - Changes via real-time updates (other users), not this user's qty
- ❌ **Gating** - Access control doesn't change based on quantity
- ❌ **Demand** - Waitlist/notify settings are static
- ❌ **Display hints** - Badges, sections don't change with qty
- ❌ **Order rules validation** - Happens at checkout, not during selection

## Server Function Flow

```typescript
// Debounced (300ms)
async function handleQuantityChange(
  eventId: string,
  selection: Record<ProductId, number>
) {
  // 1. Validate new quantities against current maxSelectable

  // 2. Create/update holds if needed

  // 3. Recalculate pricing
  const pricing = calculatePricing(selection); // All Dinero snapshots

  // 4. IF any changed items are parents:
  const addOnsToUpdate = findAffectedAddOns(selection);
  for (const addon of addOnsToUpdate) {
    addon.commercial.maxSelectable = calculateAddOnMax(
      selection,
      addon.relations
    );
  }

  // 5. Check fraud/abuse rules
  const fraudCheck = checkFraudRules(selection);
  if (fraudCheck.triggered) {
    // Reduce maxSelectable or add warnings
  }

  // 6. Generate any quantity-triggered messages
  const messages = generateQuantityMessages(selection);

  // 7. Return updated PanelData
  return {
    ...currentPanel,
    items: updatedItems,
    pricing: pricing,
  };
}
```

## Response Time Optimization

Since this happens frequently (debounced every 300ms), optimize:

1. **Cache static data** (temporal, supply, gating) - don't recalculate
2. **Only recalculate** pricing + affected add-ons
3. **Use database indexes** for limit lookups
4. **Consider edge caching** for pricing calculation rules

## Example: Full vs Partial Update

**Minimal update** (just pricing):

```jsonc
{
  "pricing": {
    "lineItems": [
      { "code": "TICKETS", "label": "Tickets", "amount": { ... } },
      { "code": "FEES", "label": "Fees", "amount": { ... } },
      { "code": "TOTAL", "label": "Total", "amount": { ... } }
    ]
  }
  // items[] unchanged if no maxSelectable updates needed
}
```

**Full update** (pricing + add-on constraints):

```jsonc
{
  "items": [
    // Parent unchanged
    { "product": { "id": "ga" }, ... },
    // Child add-on updated
    {
      "product": { "id": "meal" },
      "commercial": {
        "maxSelectable": 3, // Was 2, parent qty increased
        ...
      }
    }
  ],
  "pricing": { ... }
}
```

## Summary: On Quantity Change

**Always recalculate:**

- ✅ Pricing (all line items)

**Recalculate if applicable:**

- ✅ Add-on maxSelectable (if parent changed)
- ✅ Fraud/abuse maxSelectable adjustments
- ✅ Quantity-triggered messages

**Never recalculate:**

- ❌ Temporal phase
- ❌ Supply status (unless holding)
- ❌ Gating state
