# Comparison Why

## The Tangled Mess (What Most APIs Do)

### Typical "Product Availability" API Response

```json
{
  "product_id": "ticket_vip",
  "name": "VIP Pass",
  "available": false,
  "reason": "presale_requires_code",
  "price": 150.0,
  "inventory": 23,
  "max_quantity": 4,
  "presale_active": true,
  "presale_code_required": true,
  "presale_code_valid": false,
  "sale_starts_at": "2025-11-01T10:00:00Z",
  "sale_ends_at": "2025-11-15T23:59:59Z",
  "waitlist_enabled": true,
  "sold_out": false
}
```

### The Client Has to Untangle This

```typescript
// ❌ Client code in most systems
function getProductStatus(product) {
  // Wait, which field is authoritative?
  if (product.sold_out) {
    return { status: "sold_out", cta: "Join Waitlist" };
  }

  if (!product.available) {
    // Why isn't it available?
    if (product.reason === "presale_requires_code") {
      if (product.presale_code_valid) {
        // Code is valid but still not available?
        // Maybe inventory is 0?
        if (product.inventory === 0) {
          return { status: "sold_out", cta: "Join Waitlist" };
        }
        // Or maybe presale hasn't started?
        if (new Date() < new Date(product.sale_starts_at)) {
          return { status: "not_on_sale", cta: "Notify Me" };
        }
      } else {
        return { status: "locked", cta: "Enter Code" };
      }
    }

    if (product.reason === "not_on_sale_yet") {
      return { status: "coming_soon", cta: "Notify Me" };
    }

    // What if reason is something else? 🤷
    return { status: "unavailable", cta: null };
  }

  // Available = true, but can we actually buy it?
  if (product.presale_active && !product.presale_code_valid) {
    // Wait, why is available=true if we need a code?
    return { status: "locked", cta: "Enter Code" };
  }

  if (product.inventory === 0) {
    // Contradicts available=true? Server bug or race condition?
    return { status: "sold_out", cta: "Join Waitlist" };
  }

  return { status: "available", cta: "Add to Cart" };
}
```

### The Problems

1. **Overlapping fields**: `available`, `sold_out`, `inventory`, `presale_code_required` all affect purchasability
2. **Ambiguous precedence**: Which field "wins" when they contradict?
3. **Client business logic**: The client has to **decide** what the status is
4. **Untestable combinations**: What if `available=true` AND `sold_out=true`? (Yes, I've seen this in production)
5. **Time-based logic**: Client computes "is sale active?" from timestamps (timezone bugs incoming)
6. **Hidden assumptions**: Why is `presale_code_valid` even in the response if the code check happens server-side?

---

## Orthogonal Axes Approach (Clean Separation)

### API Response

```json
{
  "product": { "id": "ticket_vip", "name": "VIP Pass", "type": "ticket" },
  "state": {
    "temporal": {
      "phase": "during",
      "reasons": []
    },
    "supply": {
      "status": "available",
      "remaining": 23,
      "reasons": []
    },
    "gating": {
      "required": true,
      "satisfied": false,
      "listingPolicy": "visible_locked",
      "reasons": ["requires_code"]
    },
    "demand": {
      "kind": "none",
      "reasons": []
    },
    "messages": [
      {
        "code": "requires_code",
        "text": "Requires access code",
        "placement": "row.under_title",
        "variant": "info"
      }
    ]
  },
  "commercial": {
    "price": { "amount": 15000, "currency": {...}, "scale": 2 },
    "maxSelectable": 0
  }
}
```

### The Client Just Maps (No Decisions)

```typescript
// ✅ Our approach (from §8.1)
function isPurchasable(item: PanelItem): boolean {
  return (
    item.state.temporal.phase === "during" &&
    item.state.supply.status === "available" &&
    (!item.state.gating.required || item.state.gating.satisfied) &&
    item.commercial.maxSelectable > 0
  );
}

function getCTA(item: PanelItem): CTA {
  if (getPresentation(item) === "locked") {
    return { kind: "none" };
  }

  if (isPurchasable(item)) {
    return { kind: "quantity" };
  }

  if (
    item.state.supply.status === "none" &&
    item.state.demand.kind === "waitlist"
  ) {
    return { kind: "waitlist" };
  }

  if (
    item.state.temporal.phase === "before" &&
    item.state.demand.kind === "notify_me"
  ) {
    return { kind: "notify" };
  }

  return { kind: "none" };
}
```

### Why This is Better

1. **Each axis is independent**:

   - `temporal.phase` = time-based availability
   - `supply.status` = inventory-based availability
   - `gating.satisfied` = access-based availability
   - `demand.kind` = alternate action when not purchasable

2. **No contradictions possible**:

   - Server computes `maxSelectable` from ALL constraints (supply + limits + gating + fraud rules)
   - If `maxSelectable > 0`, you **know** you can select it (if other axes allow)

3. **Testable in isolation**:

   ```typescript
   // Test temporal axis alone
   { temporal: { phase: "before" }, supply: "available", gating: { satisfied: true } }
   // → Not purchasable (wrong time)

   // Test supply axis alone
   { temporal: { phase: "during" }, supply: "none", gating: { satisfied: true } }
   // → Not purchasable (no stock)

   // Test gating axis alone
   { temporal: { phase: "during" }, supply: "available", gating: { required: true, satisfied: false } }
   // → Not purchasable (locked)
   ```

4. **Extensible without breaking existing logic**:

   ```typescript
   // Future: add geo-gating
   geoGating: { required: true, satisfiedForRegion: false }

   // Update isPurchasable:
   && (!item.state.geoGating.required || item.state.geoGating.satisfiedForRegion)

   // Everything else stays the same!
   ```

---

## Real-World Example: The Presale Scenario

Let's walk through a **complex presale with code unlock**:

### Typical API (Tangled)

**Before code entered:**

```json
{
  "available": false,
  "reason": "presale_code_required",
  "inventory": 50,
  "presale_active": true,
  "presale_code_valid": false
}
```

**After valid code:**

```json
{
  "available": true, // Changed!
  "reason": null, // Changed!
  "inventory": 50,
  "presale_active": true,
  "presale_code_valid": true // Changed!
}
```

**After someone buys 49 tickets:**

```json
{
  "available": true,
  "reason": null,
  "inventory": 1, // Changed!
  "presale_active": true,
  "presale_code_valid": true,
  "low_inventory_warning": true // New field!
}
```

**After last ticket sold:**

```json
{
  "available": false, // Changed back!
  "reason": "sold_out", // New reason!
  "inventory": 0,
  "presale_active": true,
  "presale_code_valid": true,
  "sold_out": true, // New field!
  "waitlist_enabled": true // New field!
}
```

**Client logic nightmare:**

```typescript
// How do I know what changed and why?
// Do I compare old vs new state?
// Which field is the source of truth?
// What if `available=true` but `inventory=0`?
```

---

### API (Orthogonal)

**Before code entered (item omitted entirely):**

```json
{
  "items": [], // Empty! Zero-leak gating
  "context": {
    "gatingSummary": { "hasHiddenGatedItems": true },
    "panelNotices": [
      {
        "code": "requires_code",
        "text": "Enter access code to view tickets"
      }
    ]
  }
}
```

**After valid code:**

```json
{
  "items": [
    {
      "product": { "id": "presale_vip", "name": "VIP Presale" },
      "state": {
        "temporal": { "phase": "during" }, // ✅ On sale now
        "supply": { "status": "available", "remaining": 50 }, // ✅ In stock
        "gating": { "required": true, "satisfied": true }, // ✅ Unlocked
        "demand": { "kind": "none" }
      },
      "commercial": { "maxSelectable": 4 } // ✅ Can buy up to 4
    }
  ],
  "context": {
    "gatingSummary": { "hasHiddenGatedItems": false }
  }
}
```

**After 49 tickets sold (low inventory):**

```json
{
  "items": [
    {
      "state": {
        "temporal": { "phase": "during" }, // ← Unchanged
        "supply": {
          "status": "available", // ← Still available!
          "remaining": 1 // ← Only this changed
        },
        "gating": { "satisfied": true }, // ← Unchanged
        "messages": [
          {
            "code": "remaining_low",
            "text": "Only 1 left!", // ← New message
            "placement": "row.under_quantity",
            "variant": "warning"
          }
        ]
      },
      "commercial": { "maxSelectable": 1 }, // ← Server updated clamp
      "display": { "showLowRemaining": true } // ← Urgency flag
    }
  ]
}
```

**After last ticket sold:**

```json
{
  "items": [
    {
      "state": {
        "temporal": { "phase": "during" }, // ← Still during sale window
        "supply": { "status": "none" }, // ← Only this axis changed!
        "gating": { "satisfied": true }, // ← Still unlocked
        "demand": { "kind": "waitlist" }, // ← Alternate action
        "messages": [
          {
            "code": "sold_out",
            "text": "Sold Out",
            "placement": "row.under_quantity"
          }
        ]
      },
      "commercial": { "maxSelectable": 0 } // ← Can't select anymore
    }
  ]
}
```

**Client logic (simple):**

```typescript
// Same function, four different states
isPurchasable(item);
// State 1: false (omitted)
// State 2: true  (unlocked + available)
// State 3: true  (still available, just low)
// State 4: false (supply.status = "none")

getCTA(item);
// State 1: none (not even rendered)
// State 2: "quantity"
// State 3: "quantity"
// State 4: "waitlist" (demand.kind changed)
```

---

## The Key Insight

### Tangled API Philosophy

**"Give client all the data, let them figure out what it means"**.

Result: Client has business logic. Server and client can disagree. Bugs hide in edge cases.

### Orthogonal Philosophy

**"Server decides WHAT is true (axes), client derives HOW to present it"**.

Result: Client has **zero business logic**. Server and client **cannot** disagree (contract enforces it). Bugs are impossible in entire categories.

---

## Why "Orthogonal" Matters

**Orthogonal** means axes are **independent**:

- Changing `temporal.phase` from `"before"` to `"during"` **cannot** affect `supply.status`
- Changing `gating.satisfied` from `false` to `true` **cannot** affect `temporal.phase`
- Each axis answers **one question**:
  - Temporal: "Is it the right **time**?"
  - Supply: "Do we have **stock**?"
  - Gating: "Does user have **access**?"
  - Demand: "What if they **can't buy**?"

In tangled APIs, fields **interfere** with each other:

- `available` depends on presale AND inventory AND time
- `sold_out` contradicts `inventory > 0` in edge cases
- `presale_code_valid` is redundant with `available` sometimes

This spec **eliminates interference** by separating concerns at the data model level, not just the code level.
