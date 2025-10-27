# Product Panel Add-ons FAQ

> **Quick Reference Guide** for implementing add-on relationships in the Product Panel contract.

## 1. Quick Start

### What is an add-on?

An **add-on** is any product item that includes a `relations` field. It's not a separate `product.type`—add-ons can be `ticket`, `digital`, or `physical` products that depend on other products (parents) being selected first.

```ts
// Standalone product (no relations)
{
  "product": { "id": "prod_ga", "name": "GA Ticket", "type": "ticket" },
  // ... no relations field
}

// Add-on product (has relations)
{
  "product": { "id": "addon_meal", "name": "Meal Voucher", "type": "digital" },
  "relations": {
    "parentProductIds": ["prod_ga"],
    "displayMode": "nested",
    "constraint": "match_parent"
  }
}
```

### Three constraint types at a glance

| Constraint     | Quantity Rule                       | Use Case                  | Example                              |
| -------------- | ----------------------------------- | ------------------------- | ------------------------------------ |
| `match_parent` | Must exactly match parent qty       | Required 1:1 items        | Meal voucher: 3 tickets = 3 vouchers |
| `optional`     | 0 to parent qty                     | Optional per-ticket items | Insurance: 0-3 for 3 tickets         |
| `independent`  | Order-level cap, ignores parent qty | Order-level items         | Parking: max 2 regardless of tickets |

### When to use nested vs section display

| Display Mode | When to Use                                     | Renders                             |
| ------------ | ----------------------------------------------- | ----------------------------------- |
| `nested`     | Tightly coupled, per-attendee, shown inline     | Under parent product row            |
| `section`    | Loosely coupled, order-level, separate decision | In assigned section via `sectionId` |

---

## 2. Common Patterns

### Meal vouchers (match_parent, nested)

**Use case:** Every ticket holder needs a meal voucher.

```jsonc
{
  "product": { "id": "addon_meal", "name": "Meal Voucher", "type": "digital" },
  "relations": {
    "parentProductIds": ["prod_ga", "prod_vip"],
    "displayMode": "nested",
    "constraint": "match_parent"
  },
  "commercial": { "maxSelectable": 0 }, // Updates to parent count
  "display": { "badges": ["Required"], "showLowRemaining": false }
}
```

**Behavior:**

- Renders nested under GA/VIP ticket rows
- Quantity auto-matches parent (3 tickets = 3 vouchers)
- UI shows "Required" badge, disables manual quantity controls
- Server sets `maxSelectable = parentSelectedCount`

### Optional insurance (optional, nested)

**Use case:** Buyers can optionally purchase insurance for some or all tickets.

```jsonc
{
  "product": {
    "id": "addon_insurance",
    "name": "Event Insurance",
    "type": "digital"
  },
  "relations": {
    "parentProductIds": ["prod_ga", "prod_vip"],
    "displayMode": "nested",
    "constraint": "optional"
  },
  "commercial": { "maxSelectable": 5 }, // Parent count = 5
  "display": { "badges": ["Optional"], "showLowRemaining": false }
}
```

**Behavior:**

- Renders nested under ticket rows
- User can select 0 to 5 insurance (parent count = 5)
- UI shows standard quantity picker
- Server sets `maxSelectable = parentSelectedCount`

### Parking passes (independent, section)

**Use case:** One or two parking passes per order, regardless of ticket count.

```jsonc
{
  "product": {
    "id": "addon_parking",
    "name": "Parking Pass",
    "type": "physical"
  },
  "relations": {
    "parentProductIds": ["prod_ga", "prod_vip"],
    "displayMode": "section",
    "constraint": "independent",
    "minQuantity": 1
  },
  "commercial": { "maxSelectable": 2, "limits": { "perOrder": 2 } },
  "display": {
    "badges": ["Add-on"],
    "sectionId": "add_ons",
    "showLowRemaining": false
  }
}
```

**Behavior:**

- Renders in "Add-ons" section (not nested)
- Cap is 2 regardless of ticket count (10 tickets still max 2 parking)
- `minQuantity: 1` means if user selects any, must select at least 1
- Server sets `maxSelectable` based on stock/limits, not parent quantity

### Merchandise bundles (optional with minQuantity, section)

**Use case:** T-shirt bundle with minimum purchase requirement.

```jsonc
{
  "product": {
    "id": "addon_merch",
    "name": "T-Shirt Bundle",
    "type": "physical"
  },
  "relations": {
    "parentProductIds": ["prod_ga"],
    "displayMode": "section",
    "constraint": "optional",
    "minQuantity": 2
  },
  "commercial": { "maxSelectable": 5 }, // Parent count = 5
  "display": {
    "badges": ["Bundle"],
    "sectionId": "add_ons",
    "showLowRemaining": false
  },
  "state": {
    "messages": [
      {
        "code": "addon_minimum",
        "text": "Minimum 2 shirts per order",
        "placement": "row.under_quantity",
        "variant": "neutral",
        "priority": 40
      }
    ]
  }
}
```

**Behavior:**

- Renders in "Add-ons" section
- User can select 0, 2, 3, 4, or 5 shirts (not 1)
- Client shows "Minimum 2 shirts" hint
- Server validates on order submission

### Multi-parent add-ons

**Use case:** Add-on available for multiple ticket types (sum quantities).

```jsonc
{
  "product": { "id": "addon_fastpass", "name": "Fast Pass", "type": "digital" },
  "relations": {
    "parentProductIds": ["prod_ga", "prod_vip"],
    "displayMode": "nested",
    "constraint": "optional"
  },
  "commercial": { "maxSelectable": 7 } // GA=3 + VIP=4 = 7
}
```

**Behavior:**

- If user selects 3 GA + 4 VIP, `parentSelectedCount = 7`
- Server sets `maxSelectable = 7`
- User can select 0-7 fast passes

---

## 3. Display Mode Decision Tree

### Use `nested` when:

- ✅ Tightly coupled to parent (meal voucher per ticket)
- ✅ Per-attendee decision (insurance per person)
- ✅ Shown inline with ticket selection
- ✅ User thinks "this goes with that ticket"

### Use `section` when:

- ✅ Loosely coupled (parking for the group)
- ✅ Order-level decision (one swag bag per order)
- ✅ Separate shopping step
- ✅ User thinks "this is a separate purchase"

---

## 4. Constraint Type Decision Tree

### Use `match_parent` when:

- ✅ Required 1:1 with tickets
- ✅ Every ticket holder needs one
- ✅ Examples: meal vouchers, name badges, wristbands
- ❌ Cannot use `minQuantity` (validation error)

### Use `optional` when:

- ✅ 0 to N per ticket
- ✅ User decides how many (up to ticket count)
- ✅ Examples: insurance, upgrades, add-on sessions
- ✅ Can use `minQuantity` for "0 or at least X"

### Use `independent` when:

- ✅ Order-level cap regardless of tickets
- ✅ Not tied to individual tickets
- ✅ Examples: parking passes, swag bags, group photos
- ✅ Can use `minQuantity` for "at least X per order"

---

## 5. Server Implementation Checklist

### Computing maxSelectable

**For `match_parent`:**

```ts
maxSelectable = parentSelectedCount;
```

**For `optional`:**

```ts
maxSelectable = parentSelectedCount;
// Enforce minQuantity on order submission
```

**For `independent`:**

```ts
maxSelectable = min(stock, limits.perOrder);
// Ignore parent quantity, but require parent presence
```

### Handling parent selection changes

1. User changes parent quantity → client POSTs selection
2. Server recomputes `maxSelectable` for all add-ons
3. Server returns fresh payload
4. Client re-derives UI from new `maxSelectable`

### Multi-parent sum logic

```ts
// For match_parent and optional
const parentSelectedCount = parentProductIds
  .map((id) => currentSelection[id] || 0)
  .reduce((sum, qty) => sum + qty, 0);

maxSelectable = parentSelectedCount;

// For independent
maxSelectable = min(stock, limits.perOrder);
// Parent quantity doesn't affect cap
```

### Gating and zero-leak rules

```ts
// If ALL parents are omitted due to gating
if (allParentsOmitted) {
  // Option 1: Omit add-on entirely (preferred)
  // Don't include in items[]

  // Option 2: Send with maxSelectable=0 and own gating
  return {
    ...addon,
    commercial: { maxSelectable: 0 },
    gating: { required: true, satisfied: false },
  };
}
```

### Validation on order submission

```ts
// Validate minQuantity
if (addon.relations.minQuantity) {
  const selected = order.items[addon.product.id];
  if (selected > 0 && selected < addon.relations.minQuantity) {
    throw new Error(`Minimum ${addon.relations.minQuantity} required`);
  }
}

// Validate constraint
if (addon.relations.constraint === "match_parent") {
  const parentCount = sumParentQuantities(
    order,
    addon.relations.parentProductIds
  );
  if (order.items[addon.product.id] !== parentCount) {
    throw new Error("Add-on quantity must match parent quantity");
  }
}
```

---

## 6. Client Implementation Checklist

### Rendering nested add-ons

```tsx
// Pseudo-code
function ProductRow({ productId }) {
  const item = useItem(productId);
  const addons = useNestedAddons(productId);

  return (
    <div>
      <ProductRowContent item={item} />
      {addons.map((addon) => (
        <NestedAddonRow key={addon.product.id} addonId={addon.product.id} />
      ))}
    </div>
  );
}

function useNestedAddons(parentId) {
  const allItems = usePanelItems();
  return allItems.filter(
    (item) =>
      item.relations?.displayMode === "nested" &&
      item.relations?.parentProductIds.includes(parentId)
  );
}
```

### Rendering section add-ons

```tsx
// Pseudo-code
function Section({ sectionId }) {
  const items = useSectionItems(sectionId);

  // Section items include add-ons with displayMode="section"
  return items.map((item) => (
    <ProductRow key={item.product.id} productId={item.product.id} />
  ));
}
```

### Showing constraint-appropriate UI

```tsx
function QuantityControls({ item }) {
  if (!item.relations) {
    // Standalone product: standard quantity picker
    return <QuantityPicker max={item.commercial.maxSelectable} />;
  }

  switch (item.relations.constraint) {
    case "match_parent":
      // Auto-match parent quantity, disable controls
      return <QuantityDisplay value={item.commercial.maxSelectable} disabled />;

    case "optional":
    case "independent":
      // Standard quantity picker with optional minQuantity hint
      return (
        <>
          <QuantityPicker max={item.commercial.maxSelectable} />
          {item.relations.minQuantity && (
            <MinQuantityHint min={item.relations.minQuantity} />
          )}
        </>
      );
  }
}
```

### Refreshing on parent selection changes

```tsx
// Pseudo-code
function handleQuantityChange(productId, newQuantity) {
  // Update local selection
  setSelection((prev) => ({ ...prev, [productId]: newQuantity }));

  // Check if this product is a parent for any add-ons
  const hasAddons = items.some((item) =>
    item.relations?.parentProductIds.includes(productId)
  );

  if (hasAddons) {
    // Trigger server refresh to update add-on maxSelectable
    refetchPanel();
  }
}
```

### Clamping when maxSelectable drops

```tsx
// Pseudo-code
function applyPayloadUpdate(newPayload) {
  // For each item in new payload
  newPayload.items.forEach((item) => {
    const currentSelection = selection[item.product.id] || 0;

    // If current selection exceeds new maxSelectable, clamp down
    if (currentSelection > item.commercial.maxSelectable) {
      setSelection((prev) => ({
        ...prev,
        [item.product.id]: item.commercial.maxSelectable,
      }));
    }
  });
}
```

---

## 7. Edge Cases & Gotchas

### What happens when parent is deselected?

**Scenario:** User selects 3 GA tickets + 3 meal vouchers, then deselects all tickets.

**Behavior:**

1. Client POSTs new selection (GA=0)
2. Server recomputes: `maxSelectable = 0` for meal vouchers
3. Client receives refresh, clamps meal voucher selection to 0
4. Quantity UI hidden (because `maxSelectable=0`)

### Multi-parent add-ons with mixed selection

**Scenario:** Fast pass available for GA and VIP. User selects 2 GA, 0 VIP.

**Behavior:**

- `parentSelectedCount = 2 + 0 = 2`
- Server sets `maxSelectable = 2`
- User can select 0-2 fast passes

**Then:** User adds 3 VIP tickets.

**Behavior:**

- Client refreshes payload
- `parentSelectedCount = 2 + 3 = 5`
- Server sets `maxSelectable = 5`
- User can now select 0-5 fast passes

### minQuantity validation

**Client-side (hint):**

- Show "Minimum 2 required" message
- Optionally disable "1" in quantity picker
- Allow user to proceed (server validates)

**Server-side (enforcement):**

```ts
if (selected > 0 && selected < minQuantity) {
  return { error: `Minimum ${minQuantity} required` };
}
```

### Gated parents and add-on visibility

**Scenario:** VIP ticket is gated (requires access code). Meal voucher depends on VIP.

**Behavior (before unlock):**

- VIP ticket omitted from `items[]` (listingPolicy="omit_until_unlocked")
- Meal voucher also omitted (zero-leak rule)
- `gatingSummary.hasHiddenGatedItems = true`

**Behavior (after unlock):**

- VIP ticket appears in `items[]`
- Meal voucher appears in `items[]`
- Both follow normal add-on rules

### Add-on with maxSelectable=0 (no stock)

**Scenario:** Parking pass add-on, but parking is sold out.

**Behavior:**

- Server sends parking pass with `maxSelectable=0`
- `supply.status = "sold_out"`
- Quantity UI hidden (per §8 purchasability rules)
- Row may show "Sold Out" message via `state.messages[]`

---

## 8. Examples by Use Case

### Concert: GA ticket + optional parking + required wristband

```jsonc
{
  "items": [
    {
      "product": { "id": "prod_ga", "name": "GA Ticket", "type": "ticket" }
      // ... no relations (standalone)
    },
    {
      "product": {
        "id": "addon_wristband",
        "name": "Wristband",
        "type": "physical"
      },
      "relations": {
        "parentProductIds": ["prod_ga"],
        "displayMode": "nested",
        "constraint": "match_parent"
      },
      "display": { "badges": ["Required"] }
    },
    {
      "product": {
        "id": "addon_parking",
        "name": "Parking Pass",
        "type": "physical"
      },
      "relations": {
        "parentProductIds": ["prod_ga"],
        "displayMode": "section",
        "constraint": "independent"
      },
      "commercial": { "maxSelectable": 2, "limits": { "perOrder": 2 } },
      "display": { "sectionId": "add_ons" }
    }
  ]
}
```

### Conference: ticket + optional workshop + meal plan

```jsonc
{
  "items": [
    {
      "product": {
        "id": "prod_conf",
        "name": "Conference Pass",
        "type": "ticket"
      }
    },
    {
      "product": {
        "id": "addon_workshop",
        "name": "Advanced Workshop",
        "type": "ticket"
      },
      "relations": {
        "parentProductIds": ["prod_conf"],
        "displayMode": "section",
        "constraint": "optional"
      },
      "display": { "sectionId": "add_ons" }
    },
    {
      "product": { "id": "addon_meal", "name": "Meal Plan", "type": "digital" },
      "relations": {
        "parentProductIds": ["prod_conf"],
        "displayMode": "nested",
        "constraint": "match_parent"
      },
      "display": { "badges": ["Required"] }
    }
  ]
}
```

### Festival: multi-day pass + camping + shuttle

```jsonc
{
  "items": [
    {
      "product": { "id": "prod_3day", "name": "3-Day Pass", "type": "ticket" }
    },
    {
      "product": {
        "id": "addon_camping",
        "name": "Camping Spot",
        "type": "physical"
      },
      "relations": {
        "parentProductIds": ["prod_3day"],
        "displayMode": "section",
        "constraint": "independent",
        "minQuantity": 1
      },
      "commercial": { "maxSelectable": 1, "limits": { "perOrder": 1 } },
      "display": { "sectionId": "add_ons" }
    },
    {
      "product": {
        "id": "addon_shuttle",
        "name": "Shuttle Pass",
        "type": "digital"
      },
      "relations": {
        "parentProductIds": ["prod_3day"],
        "displayMode": "nested",
        "constraint": "optional"
      },
      "display": { "badges": ["Optional"] }
    }
  ]
}
```

---

## 9. Migration from Old matchBehavior

### Mapping old to new

| Old                                      | New                          | Notes             |
| ---------------------------------------- | ---------------------------- | ----------------- |
| `matchBehavior: "per_ticket"` (required) | `constraint: "match_parent"` | Exact 1:1 match   |
| `matchBehavior: "per_ticket"` (optional) | `constraint: "optional"`     | 0 to N per ticket |
| `matchBehavior: "per_order"`             | `constraint: "independent"`  | Order-level cap   |

### Adding displayMode

**Default strategy:** Start with `displayMode: "section"` for all add-ons (backward compatible), then optimize:

- Move tightly-coupled add-ons (meals, badges) to `"nested"`
- Keep loosely-coupled add-ons (parking, swag) as `"section"`

### Example migration

**Before:**

```jsonc
{
  "relations": {
    "parentProductIds": ["prod_ga"],
    "matchBehavior": "per_ticket"
  }
}
```

**After (required 1:1):**

```jsonc
{
  "relations": {
    "parentProductIds": ["prod_ga"],
    "displayMode": "nested",
    "constraint": "match_parent"
  }
}
```

**After (optional per-ticket):**

```jsonc
{
  "relations": {
    "parentProductIds": ["prod_ga"],
    "displayMode": "nested",
    "constraint": "optional"
  }
}
```

---

## 10. FAQ

### Can an add-on have multiple parents?

**Yes.** List all parent IDs in `parentProductIds[]`. The server sums their quantities for `match_parent` and `optional` constraints.

```jsonc
{
  "relations": {
    "parentProductIds": ["prod_ga", "prod_vip", "prod_student"],
    "constraint": "optional"
  }
}
```

If user selects 2 GA + 3 VIP + 1 Student, `parentSelectedCount = 6`.

### Can a parent have multiple add-ons?

**Yes.** Unlimited add-ons can reference the same parent.

```jsonc
// All reference prod_ga
{ "relations": { "parentProductIds": ["prod_ga"], "constraint": "match_parent" } }  // Meal
{ "relations": { "parentProductIds": ["prod_ga"], "constraint": "optional" } }      // Insurance
{ "relations": { "parentProductIds": ["prod_ga"], "constraint": "independent" } }   // Parking
```

### Can add-ons have add-ons?

**No.** Only single-level dependencies. An add-on cannot be a parent for another add-on.

```jsonc
// ❌ NOT ALLOWED
{
  "product": { "id": "addon_meal" },
  "relations": { "parentProductIds": ["prod_ga"] }
}
{
  "product": { "id": "addon_dessert" },
  "relations": { "parentProductIds": ["addon_meal"] }  // ❌ Can't depend on add-on
}
```

### What if displayMode=nested but parent is in different section?

**Render with parent, ignore section.** Nested add-ons always render under their parent product, regardless of section assignment.

```jsonc
{
  "product": { "id": "prod_ga" },
  "display": { "sectionId": "tickets" }
}
{
  "product": { "id": "addon_meal" },
  "relations": {
    "parentProductIds": ["prod_ga"],
    "displayMode": "nested"
  },
  "display": { "sectionId": "add_ons" }  // Ignored! Renders under prod_ga
}
```

### Does minQuantity apply to match_parent?

**No.** Using `minQuantity` with `constraint: "match_parent"` is a validation error.

```jsonc
// ❌ VALIDATION ERROR
{
  "relations": {
    "constraint": "match_parent",
    "minQuantity": 2 // ❌ Not allowed
  }
}
```

`match_parent` already enforces exact quantity match; `minQuantity` doesn't make sense.

### Can independent add-ons have minQuantity?

**Yes.** `minQuantity` is valid for both `optional` and `independent` constraints.

```jsonc
// ✅ VALID
{
  "relations": {
    "constraint": "independent",
    "minQuantity": 1 // "If you buy parking, minimum 1"
  }
}
```

### How does gating affect add-ons?

Add-ons follow the **same axes rules** as any item (temporal, supply, gating, demand), **plus** parent visibility rules:

1. **Add-on's own gating:** If add-on requires access code, it follows normal gating rules
2. **Parent gating (zero-leak):** If ALL parents are omitted due to gating, add-on must also be omitted
3. **Mixed parent gating:** If SOME parents are visible, add-on can be shown (depends on visible parents only)

```jsonc
// Scenario: VIP gated, GA visible
{
  "product": { "id": "addon_fastpass" },
  "relations": {
    "parentProductIds": ["prod_ga", "prod_vip"] // Mixed visibility
  }
}
```

**Behavior:** Fast pass is visible (GA is visible). `maxSelectable` reflects only GA quantity until VIP is unlocked.

---

## Summary

**Key Principles:**

1. Server is authoritative (`maxSelectable` is king)
2. Client refreshes on parent changes
3. Three constraint types cover all patterns
4. Display mode controls presentation
5. `minQuantity` for "0 or at least X" cases
6. Zero-leak rule for gated parents

**Implementation Checklist:**

- [ ] Server recomputes `maxSelectable` on every refresh
- [ ] Client never invents caps (uses `maxSelectable` only)
- [ ] Nested add-ons render under parent (ignore `sectionId`)
- [ ] Section add-ons render in assigned section
- [ ] `match_parent` shows "Required" badge, auto-matches quantity
- [ ] `optional`/`independent` show quantity picker with optional `minQuantity` hint
- [ ] Client clamps selection when `maxSelectable` drops
- [ ] Server validates `minQuantity` and constraint rules on submission
