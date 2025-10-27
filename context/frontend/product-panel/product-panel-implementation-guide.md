# Product Panel Implementation Guide

**Version:** 1.1 (based on Spec v0.4)
**Last Updated:** 2025-10-27
**Purpose:** Primary implementation reference for building the Product Panel component

**What's New in v1.1**:

- Architecture context explaining TanStack Start deployment model and validation strategy
- Complete Jotai factory pattern with scoped atoms and Context provider
- Comprehensive layout modes (compact/full) with quantity UI consistency rules
- Atom-driven PanelActionButton labels (singular/plural, state-adaptive)
- Specialized notice variants (standard text vs. inline form)
- Complete unlock flow user journey with edge case handling
- Expanded testing strategy with canonical fixtures
- Enhanced reason code registry with visual treatment guidance
- Validation error handling patterns (fatal vs. graceful)
- Dinero formatting approaches (with utils vs. direct)

  ***

## Table of Contents

1. [Quick Start & Overview](#1-quick-start--overview)
   - 1.1 What is the Product Panel?
   - 1.2 Core Principles
   - 1.3 The Orthogonal Axes Model
   - 1.4 Tech Stack
   - 1.5 Architecture Context: Why These Choices?
2. [Data Contract & Validation](#2-data-contract--validation)
   - 2.1 Root Payload Schema
   - 2.2 Context Schema
   - 2.3 Sections Schema
   - 2.4 Item Schema
   - 2.5 Dinero Snapshot Schema
   - 2.6 Pricing Schema
   - 2.7 Validation Strategy
   - 2.8 Validation Error Handling
3. [State Management Architecture](#3-state-management-architecture)
   - 3.1 Atom Structure Overview
   - 3.2 Jotai Factory Pattern (Scoped Atoms)
   - 3.3 Context Provider Setup
   - 3.4 Component Usage Pattern
   - 3.5 Selection State Management
   - 3.6 Message Resolution
4. [Component Structure](#4-component-structure)
   - 4.1 Component Hierarchy
   - 4.2 ProductPanel (Container)
   - 4.3 PanelNoticeArea
   - 4.4 PanelContent & Sections
   - 4.5 ItemRow
   - 4.6 ItemQuantity
   - 4.7 PricingFooter
   - 4.8 PanelActionButton (Atom-Driven Labels)
   - 4.9 AccessCodeCTA
5. [Rendering Logic](#5-rendering-logic)
6. [User Interactions](#6-user-interactions)
   - 6.1 Quantity Selection Flow
   - 6.2 Access Code Submission Flow (Complete User Journey)
   - 6.3 Waitlist & Notify-Me Actions
   - 6.4 Checkout Submission
7. [Edge Cases & Testing](#7-edge-cases--testing)
   - 7.1 What Client MUST NEVER Do
   - 7.2 Common Edge Cases
   - 7.3 Testing Strategy
   - 7.4 Test Coverage Matrix
   - 7.8 Canonical Fixtures
8. [Quick Reference](#8-quick-reference)

   - 8.1 Purchasability Formula
   - 8.2 CTA Decision Tree
   - 8.3 Price/Quantity Visibility Matrix
   - 8.4 Reason Code Registry (Comprehensive)
   - 8.5 Key Atoms Reference
   - 8.6 Server Refresh Triggers
   - 8.7 Validation Checklist
   - 8.8 Accessibility Requirements
   - 8.9 Layout Modes & Quantity UI Rules
   - 8.10 Performance Patterns
   - 8.11 Error Handling Patterns

   ***

## 1. Quick Start & Overview

### 1.1 What is the Product Panel?

The Product Panel is a **server-driven commerce UI** for selecting tickets, digital items, and physical products. Key
characteristics:

- **Server Authority**: All business logic (pricing, availability, limits) computed server-side
- **Client as View**: Client validates, derives UI state, and enforces server rules—never invents them
- **Orthogonal Axes**: Four independent state dimensions compose into final presentation
- **Strict Validation**: Zod schemas enforce contract; unknown fields = errors
- **Zero Math**: No price calculations, quantity limits, or eligibility checks client-side

### 1.2 Core Principles

````typescript
// ✅ Client role
const presentation = derivePresentation(serverPayload);
const isPurchasable = checkPurchasability(serverPayload);
const cta = selectCTA(serverPayload);

// ❌ Client MUST NEVER
// - Compute totals/fees/taxes
// - Derive limits from stock counts
// - Validate access codes
// - Predict state transitions
// - Invent UI text

1.3 The Orthogonal Axes Model

Four independent state dimensions per item:

| Axis     | Question                | Values                             |
|----------|-------------------------|------------------------------------|
| Temporal | Is it the right time?   | before, during, after              |
| Supply   | Do we have stock?       | available, none, unknown           |
| Gating   | Does user have access?  | required, satisfied, listingPolicy |
| Demand   | What if they can't buy? | none, waitlist, notify_me          |

Purchasable = all four axes allow it AND maxSelectable > 0.

1.4 Tech Stack

- Framework: React with TypeScript
- State: Jotai (atomic state management)
- Data Fetching: TanStack Query
- Validation: Zod 4
- Money: Dinero.js V2 snapshots

---

## 1.5 Architecture Context: Why These Choices?

**Understanding the deployment model shapes everything.**

This contract is designed for **TanStack Start with server functions** on Vercel, not a traditional REST API. This fundamentally changes validation strategy, schema design, and error handling.

### Deployment Model: Atomic Deploys

**Key fact**: Server and client code deploy together as a single Vercel project. There is **no version skew**.

- Old clients hitting new servers: **doesn't happen** (atomic deploy)
- Cached responses surviving deployments: **doesn't happen** (fresh contract every deploy)
- Multiple frontends with independent release schedules: **doesn't happen** (monorepo, coordinated)

**What this means**:
- Unknown fields = bugs, not future features → use `.strict()` validation
- Missing required fields = server bugs, not backward compatibility → fail fast, no `.default()`
- Enum changes = just deploy → strict enums catch typos immediately

### Why `.strict()` Validation (Not `.passthrough()`)

Traditional REST API approach:

```typescript
// ❌ Forward compatibility priority (not needed for us)
const Schema = z.object({
types: z.enum(["single", "multiple"]).default("multiple"), // Hide server bugs
}).passthrough(); // Ignore unknown fields
````

TanStack Start approach (what we do):

```typescript
// ✅ Bug detection priority (SSR/hydration consistency)
const Schema = z
  .object({
    types: z.enum(["single", "multiple"]), // Required; fail if missing
  })
  .strict(); // Reject unknown fields immediately
```

**Why strict validation matters**:

1. **Catches server bugs early**: Missing fields fail validation, not at render time
2. **SSR/hydration safety**: Schema mismatches surface immediately, preventing hydration errors
3. **Type safety**: No optional-everywhere types that hide bugs
4. **Clear contracts**: Required fields document server obligations explicitly

### Why Required Fields Lack `.default()`

```typescript
// ❌ Hides server bugs
orderRules: OrderRulesSchema.default({ types: "multiple", ... })

// ✅ Server must send explicitly
orderRules: OrderRulesSchema // Required; validation fails if missing
```

**Rationale**: If the server forgets to send `orderRules`, that's a critical bug (user can't check out correctly). Hiding it with a default makes debugging harder and delays discovery.

### Why Strict Enums (Not `z.string()`)

```typescript
// ❌ Traditional API (version skew concerns)
phase: z.string(); // Accept any value, hope for the best

// ✅ TanStack Start (coordinated deploys)
phase: z.enum(["before", "during", "after"]); // Catch typos immediately
```

**When adding enum values**: Update schema → deploy atomically → done. No multi-version support needed.

### Comparison Table

| Concern            | Traditional REST API      | TanStack Start (Our Approach)           |
| ------------------ | ------------------------- | --------------------------------------- |
| Unknown fields     | `.passthrough()` (ignore) | `.strict()` (reject)                    |
| Missing fields     | `.default()` (hide bugs)  | Required (fail fast)                    |
| Enum extensibility | `z.string()` (open)       | `z.enum()` (strict)                     |
| Version skew       | Old clients exist         | No old clients (atomic deploy)          |
| SSR/Hydration      | N/A (client-only)         | Critical (same schemas server + client) |
| **Goal**           | Old clients don't break   | Server/client stay in sync              |

### When Would We Need Forward Compatibility?

- Long-lived mobile apps (we're web-only for panel)
- Cached API responses surviving deployments (we don't cache across deploys)
- Multiple frontends with independent release schedules (our frontends deploy atomically)

**We have none of these**, so strict validation is the correct choice.

### Practical Impact

**DO** (aligned with deployment model):

- Use `.strict()` on all schemas
- Require business-meaningful fields (no silent defaults)
- Use strict enums; adding values = coordinated deploy
- Validate on both server (SSR/loaders) and client (hydration)

**DON'T** (would break SSR/hydration):

- Add `.default()` to hide missing business fields
- Use `.passthrough()` to ignore unknown fields
- Make everything optional "just in case"
- Validate only client-side

  ***

  2. Data Contract & Validation

  2.1 Root Payload Schema

  import { z } from "zod";

  // Root shape: exactly four top-level keys
  const PanelDataSchema = z.object({
  context: ContextSchema, // Panel config, rules, copy
  sections: SectionsSchema, // Grouping/navigation
  items: ItemsSchema, // Products with state
  pricing: PricingSchema, // Server-computed money
  }).strict(); // Unknown keys = validation error

  type PanelData = z.infer<typeof PanelDataSchema>;

  Rule: Payloads MUST have exactly these four keys. Unknown keys rejected.

  2.2 Context Schema

  Server configuration, ordering rules, and copy artifacts.

  const ContextSchema = z.object({
  // Selection rules (REQUIRED)
  orderRules: z.object({
  types: z.enum(["single", "multiple"]),
  typesPerOrder: z.enum(["single", "multiple"]),
  ticketsPerType: z.enum(["single", "multiple"]),
  minSelectedTypes: z.number().int().min(0),
  minTicketsPerSelectedType: z.number().int().min(0),
  }),

  // Gating summary (REQUIRED if gating exists)
  gatingSummary: z.object({
  hasHiddenGatedItems: z.boolean(), // Only hint about omitted items
  hasAccessCode: z.boolean().optional(),
  }).optional(),

  // Panel-level banners (REQUIRED, may be empty)
  panelNotices: z.array(z.object({
  code: z.string().regex(/^[a-z][a-z0-9_]\*$/), // snake_case
  icon: z.string().optional(),
  title: z.string().optional(),
  text: z.string().optional(),
  description: z.string().optional(),
  params: z.record(z.unknown()).optional(),
  variant: z.enum(["neutral", "info", "warning", "error"]).optional(),
  priority: z.number().default(0),
  action: z.object({
  label: z.string(),
  kind: z.enum(["link", "drawer"]),
  target: z.string().optional(),
  }).optional(),
  expiresAt: z.string().optional(), // ISO timestamp
  })),

  // Display preferences (UI hints)
  effectivePrefs: z.object({
  showTypeListWhenSoldOut: z.boolean(),
  displayPaymentPlanAvailable: z.boolean(),
  displayRemainingThreshold: z.number().optional(),
  }),

  // Optional welcome text
  welcomeText: z.string().optional(),

  // Copy artifacts
  copyTemplates: z.array(z.object({
  key: z.string(),
  template: z.string(),
  locale: z.string().optional(),
  })).optional(),

  clientCopy: z.record(z.string()).optional(),

  tooltips: z.array(z.object({
  id: z.string(),
  text: z.string(),
  })).optional(),

  hovercards: z.array(z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  })).optional(),
  });

  Implementation Note: Context is read-only config. Store in a contextAtom and reference throughout the UI.

  2.3 Sections Schema

  const SectionSchema = z.object({
  id: z.string(),
  label: z.string(),
  order: z.number().int(),
  labelOverride: z.string().nullable().optional(),
  });

  const SectionsSchema = z.array(SectionSchema).min(1); // At least one section

  Rendering Rule: Sections with no assigned items MAY be hidden. Items without display.sectionId render in first section
  by order.

  2.4 Item Schema (The Big One)

  Each item represents a purchasable product (ticket, digital, physical) or an add-on.

  const ItemSchema = z.object({
  // Identity
  product: z.object({
  id: z.string(), // Unique in payload
  name: z.string(),
  type: z.enum(["ticket", "digital", "physical"]),
  description: z.string().optional(),
  subtitle: z.string().optional(),
  category: z.string().optional(),
  fulfillment: z.object({
  methods: z.array(z.enum([
  "eticket", "apple_pass", "will_call",
  "physical_mail", "shipping", "nfc"
  ])),
  details: z.record(z.unknown()).optional(),
  }).optional(),
  }).strict(),

  // Variant (forward-compat, often empty for GA tickets)
  variant: z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  attributes: z.record(z.unknown()).optional(),
  }).optional(),

  // STATE: Four orthogonal axes + messages
  state: z.object({
  temporal: z.object({
  phase: z.enum(["before", "during", "after"]),
  reasons: z.array(z.string()),
  currentWindow: z.object({
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  }).optional(),
  nextWindow: z.object({
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  }).optional(),
  }),

      supply: z.object({
        status: z.enum(["available", "none", "unknown"]),
        remaining: z.number().int().min(0).optional(),
        reasons: z.array(z.string()),
      }),

      gating: z.object({
        required: z.boolean(),
        satisfied: z.boolean(),
        listingPolicy: z.enum(["omit_until_unlocked", "visible_locked"]),
        reasons: z.array(z.string()),
        requirements: z.array(z.object({
          kind: z.string(),
          satisfied: z.boolean(),
          validWindow: z.object({
            startsAt: z.string(),
            endsAt: z.string(),
          }).optional(),
          limit: z.object({
            maxUses: z.number().optional(),
            usesRemaining: z.number().optional(),
          }).optional(),
        })).optional(),
      }),

      demand: z.object({
        kind: z.enum(["none", "waitlist", "notify_me"]),
        reasons: z.array(z.string()),
      }),

      // Unified message channel (row display text)
      messages: z.array(z.object({
        code: z.string().regex(/^[a-z][a-z0-9_]*$/),
        text: z.string().optional(),
        params: z.record(z.unknown()).optional(),
        placement: z.enum([
          "row.under_title",
          "row.under_price",
          "row.under_quantity",
          "row.footer",
          "row.cta_label",
        ]),
        variant: z.enum(["neutral", "info", "warning", "error"]).optional(),
        priority: z.number().default(0),
      })),

  }),

  // COMMERCIAL: Price + authoritative clamp
  commercial: z.object({
  price: DineroSnapshotSchema, // See below
  feesIncluded: z.boolean(),
  maxSelectable: z.number().int().min(0), // THE clamp
  limits: z.object({
  perOrder: z.number().int().optional(),
  perUser: z.number().int().optional(),
  }).optional(),
  }),

  // DISPLAY: View hints
  display: z.object({
  badges: z.array(z.string()),
  badgeDetails: z.record(z.object({
  kind: z.enum(["tooltip", "hovercard"]),
  ref: z.string(),
  })).optional(),
  sectionId: z.string().optional(),
  showLowRemaining: z.boolean(),
  }),

  // RELATIONS: Add-on dependencies (optional)
  relations: z.object({
  parentProductIds: z.array(z.string()).optional(),
  matchBehavior: z.enum(["per_ticket", "per_order"]).optional(),
  }).optional(),
  }).strict();

  const ItemsSchema = z.array(ItemSchema); // May be empty

  Key Validation Rules:

  - product.id must be unique across payload
  - Items with gating.required && !satisfied && listingPolicy="omit_until_unlocked" should NOT be in items[]
  - All commercial.price.currency.code must match pricing.currency.code

    2.5 Dinero Snapshot Schema

  All money is represented as Dinero.js V2 snapshots.

  const CurrencySchema = z.object({
  code: z.string(), // e.g., "USD"
  base: z.number(), // e.g., 10
  exponent: z.number(), // e.g., 2
  });

  const DineroSnapshotSchema = z.object({
  amount: z.number().int(), // Minor units (e.g., 5000 = $50.00)
  currency: CurrencySchema,
  scale: z.number(), // Precision (usually 2)
  });

### Two Formatting Approaches

You can format Dinero snapshots for display using one of two approaches. Choose based on bundle size vs. type safety tradeoffs.

**Approach A: Using Dinero.js utils (type-safe, handles edge cases)**

```typescript
import { dinero, toDecimal } from "dinero.js";

function formatPrice(snapshot: DineroSnapshot): string {
  const price = dinero(snapshot);
  return toDecimal(price, ({ value, currency }) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.code,
    }).format(Number(value))
  );
}
```

**Benefits**: Type-safe, handles edge cases (negative amounts, non-decimal currencies), maintains Dinero API consistency.

**Tradeoff**: Adds Dinero.js to client bundle (~5KB gzipped).

**Approach B: Direct from snapshot (no Dinero import, smaller bundle)**

```typescript
function formatDineroSnapshot(snapshot: DineroSnapshot): string {
  const { amount, currency, scale } = snapshot;
  const divisor = Math.pow(currency.base, scale);
  const value = amount / divisor;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.code,
  }).format(value);
}
```

**Benefits**: No additional imports, smaller bundle, simple logic for display-only formatting.

**Tradeoff**: Manual calculation (but only for display), need to handle edge cases yourself if they arise.

### Critical Rule: No Client-Side Arithmetic

**Client MUST NOT perform arithmetic on money beyond display formatting.**

```typescript
// ❌ NEVER compute totals client-side
const total = items.reduce(
  (sum, item) => sum + item.commercial.price.amount * quantity,
  0
);

// ❌ NEVER compute fees client-side
const fees = subtotal * 0.15;

// ❌ NEVER compute discounts client-side
const discounted = price.amount - price.amount * 0.1;

// ✅ ONLY format server-provided Dinero snapshots
const formatted = formatDineroSnapshot(item.commercial.price);

// ✅ Display server-computed pricing footer
<PricingFooter pricing={data.pricing} />;
```

**Why**: All calculations (totals, fees, taxes, discounts, payment plan effects) happen **server-side** and return as new Dinero snapshots. The client is a pure view that formats for display only.

**Rule**: Nothing happens to money outside Dinero.js V2 and Dinero utils (server-side) or direct snapshot formatting (client-side display).

2.6 Pricing Schema

Server-computed breakdown of totals, fees, taxes, discounts.

const PricingSchema = z.object({
currency: CurrencySchema, // Must match all item currencies
mode: z.enum(["reserve", "final"]).optional(), // Status hint
lineItems: z.array(z.object({
code: z.string(), // e.g., "TICKETS", "FEES", "TAX", "TOTAL"
label: z.string(), // Display text
amount: DineroSnapshotSchema, // Can be negative for discounts
})),
});

Rendering Rule: Display lineItems in exact payload order. Never reorder, compute, or insert rows.

2.7 Validation Strategy

// At API boundary (TanStack Query)
export function usePanelData() {
return useQuery({
queryKey: ["panel", eventId],
queryFn: async () => {
const response = await fetch(`/api/panel/${eventId}`);
const json = await response.json();

        // Validate immediately
        const result = PanelDataSchema.safeParse(json);

        if (!result.success) {
          // Log detailed errors in dev
          console.error("Panel validation failed:", result.error.format());

          // Throw for error boundary
          throw new Error("Invalid panel data received from server");
        }

        // Additional checks
        validateCurrencyConsistency(result.data);
        validateUniqueProductIds(result.data);

        return result.data;
      },
    });

}

function validateCurrencyConsistency(data: PanelData) {
const currencyCode = data.pricing.currency.code;

    for (const item of data.items) {
      if (item.commercial.price.currency.code !== currencyCode) {
        throw new Error(
          `Currency mismatch: item ${item.product.id} has ${item.commercial.price.currency.code}, ` +
          `but pricing uses ${currencyCode}`
        );
      }
    }

}

function validateUniqueProductIds(data: PanelData) {
const ids = new Set<string>();

    for (const item of data.items) {
      if (ids.has(item.product.id)) {
        throw new Error(`Duplicate product ID: ${item.product.id}`);
      }
      ids.add(item.product.id);
    }

}

Error Handling:

- Validation errors → show generic error UI, log details
- Unknown fields → reject payload (strict mode)
- Currency mismatch → fatal error, cannot render

### 2.8 Validation Error Handling

Different error types require different handling strategies. Understanding which errors are fatal vs. graceful helps maintain good UX while preventing broken states.

#### Currency Mismatch (Fatal Error - Cannot Render)

**What it is**: Items have different currency codes than the pricing footer, or items have mixed currencies.

**Why fatal**: Cannot display coherent pricing. This is a server configuration bug, not a runtime state.

**Implementation**:

```typescript
function validateCurrencyConsistency(data: PanelData): void {
  const currencyCode = data.pricing.currency.code;

  for (const item of data.items) {
    if (item.commercial.price.currency.code !== currencyCode) {
      throw new Error(
        `Currency mismatch: item ${item.product.id} has ${item.commercial.price.currency.code}, ` +
          `but pricing uses ${currencyCode}`
      );
    }
  }
}

// Call during validation
const result = PanelDataSchema.safeParse(json);
if (!result.success) {
  throw new Error("Invalid panel data");
}
validateCurrencyConsistency(result.data); // Fatal if mismatch
```

**User experience**: Display error boundary with "Configuration error. Please contact support." message. Log full error details for debugging.

#### Stale Pricing (Graceful - Keep Last Valid State)

**What it is**: Server pricing refresh fails (network error, timeout, 500 response).

**Why graceful**: Last pricing is better than no pricing. User can still see their selection; retry often succeeds.

**Implementation**:

```typescript
function PricingFooter({ pricing }: { pricing: Pricing }) {
  const { isStale, refetch } = usePanelData();

  return (
    <div className="pricing-footer">
      {pricing.lineItems.map((line, idx) => (
        <div key={idx} className="price-line">
          <span>{line.label}</span>
          <span>{formatDinero(line.amount)}</span>
        </div>
      ))}

      {isStale && (
        <div className="pricing-stale-indicator" role="alert">
          <Icon name="alert" />
          <span>Prices may be outdated</span>
          <button onClick={refetch}>Update Prices</button>
        </div>
      )}
    </div>
  );
}
```

**Retry strategy**: Automatic retry after 3s, max 3 attempts. Show manual "Update Prices" button if auto-retry exhausted.

#### Unknown Fields (Strict Validation Error - Development)

**What it is**: Payload contains fields not defined in schema (typos, schema drift, new fields not yet in client).

**Why strict**: With atomic deploys, unknown fields are bugs. Failing immediately helps catch schema drift.

**Implementation**:

```typescript
export function usePanelData(eventId: string) {
  return useQuery({
    queryKey: ["panel", eventId],
    queryFn: async () => {
      const response = await fetch(`/api/panel/${eventId}`);
      const json = await response.json();

      const result = PanelDataSchema.safeParse(json);

      if (!result.success) {
        // Development: log detailed errors
        if (process.env.NODE_ENV === "development") {
          console.group("[Panel Validation Error]");
          console.error("Raw payload:", json);
          console.error("Validation errors:", result.error.format());
          console.groupEnd();
        }

        // Production: log to error tracking
        logValidationError({
          context: "panel-data-load",
          eventId,
          error: result.error,
        });

        // User experience: generic error
        throw new Error("Invalid panel data received from server");
      }

      // Additional cross-field validations
      validateCurrencyConsistency(result.data);
      validateUniqueProductIds(result.data);

      return result.data;
    },
  });
}
```

**User experience**: Show generic error boundary. Never expose raw Zod errors to users (technical jargon). Log full details for debugging.

#### Duplicate Product IDs (Fatal Error - Data Integrity)

**What it is**: Multiple items in `items[]` have the same `product.id`.

**Why fatal**: React key conflicts, selection state corruption, ambiguous references.

**Implementation**:

```typescript
function validateUniqueProductIds(data: PanelData): void {
  const ids = new Set<string>();

  for (const item of data.items) {
    if (ids.has(item.product.id)) {
      throw new Error(`Duplicate product ID: ${item.product.id}`);
    }
    ids.add(item.product.id);
  }
}
```

#### Error Handling Strategy Summary

| Error Type        | Severity | User Experience              | Retry Strategy                |
| ----------------- | -------- | ---------------------------- | ----------------------------- |
| Currency mismatch | Fatal    | "Configuration error"        | Manual (contact support)      |
| Unknown fields    | Fatal    | "Invalid data"               | Manual (requires deploy)      |
| Duplicate IDs     | Fatal    | "Data error"                 | Manual (server bug)           |
| Stale pricing     | Graceful | Show last valid + warning    | Auto (3s × 3) + manual button |
| Network timeout   | Graceful | Show loading/retry           | Auto exponential backoff      |
| 404/401 errors    | Fatal    | "Not found" / "Unauthorized" | Manual (auth/permissions)     |

**Key principle**: Fatal errors block rendering and require intervention. Graceful errors preserve last valid state and enable user retry.

---

3. State Management Architecture

3.1 Atom Structure Overview

panelDataAtom (server payload)
↓
selectionAtom (user selections: Map<productId, quantity>)
↓
Derived Atoms (computed from above): - itemPresentationAtoms - itemPurchasabilityAtoms - itemCTAAtoms - panelActionButtonAtom - accessCodeCTAAtom - pricingFooterAtom

Key Principle: Atoms are pure functions over server state + user selections. They NEVER contain business logic—only
transformation of server data into UI state.

3.2 Jotai Factory Pattern (Scoped Atoms)

**Why factory pattern?** Global atoms don't scale to multiple panel instances (e.g., admin preview + customer view) and can create memory leaks with dynamic collections. The factory pattern is the idiomatic Jotai approach for scoped, instance-specific state.

**Architecture overview**:

- `createPanelAtoms(eventId)` factory creates isolated atom instances
- Context provider scopes atoms to component tree (no global pollution)
- atomFamily provides stable atom references per productId (prevents memory leaks)
- Writable atom pattern wraps primitives with validation

**Benefits**:

- Multiple panel instances supported (isolated state)
- Zero props drilling (atoms accessed via Context hook)
- Type-safe by construction (factory return type enforces shape)
- SSR/hydration safe (stable ID references)
- Testable (mock atoms via custom provider)

### Factory Implementation

```typescript
import { atom } from "jotai";
import { atomFamily } from "jotai/utils";
import { atomWithQuery } from "jotai-tanstack-query";
import type { PanelData, PanelItem, ProductId } from "./schemas";
import { panelKeys, fetchPanelData } from "./api";

// ============================================================================
// Scoped Atom Factory (one per panel instance)
// ============================================================================

export function createPanelAtoms(eventId: string) {
  // Query atom (single source of truth for server data)
  const queryAtom = atomWithQuery<PanelData>(() => ({
    queryKey: panelKeys.event(eventId),
    queryFn: () => fetchPanelData(eventId),
  }));

  // Helper: lookup item by productId
  const itemByIdFamily = atomFamily((productId: ProductId) =>
    atom((get) => {
      const panel = get(queryAtom);
      return panel.items.find((i) => i.product.id === productId) ?? null;
    })
  );

  // ============================================================================
  // Per-Item Derived State (§8 rendering composition)
  // ============================================================================

  /** Row presentation: normal | locked */
  const presentationFamily = atomFamily((productId: ProductId) =>
    atom((get) => {
      const item = get(itemByIdFamily(productId));
      if (!item) return "normal" as const;

      const { gating } = item.state;
      return gating.required &&
        !gating.satisfied &&
        gating.listingPolicy === "visible_locked"
        ? ("locked" as const)
        : ("normal" as const);
    })
  );

  /** Purchasable boolean (§8.1 formula) */
  const isPurchasableFamily = atomFamily((productId: ProductId) =>
    atom((get) => {
      const item = get(itemByIdFamily(productId));
      if (!item) return false;

      const { temporal, supply, gating } = item.state;
      const { maxSelectable } = item.commercial;

      return (
        temporal.phase === "during" &&
        supply.status === "available" &&
        (!gating.required || gating.satisfied) &&
        maxSelectable > 0
      );
    })
  );

  /** CTA kind (§8.1 decision tree) */
  const ctaKindFamily = atomFamily((productId: ProductId) =>
    atom((get) => {
      const presentation = get(presentationFamily(productId));
      if (presentation === "locked") return "none" as const;

      const item = get(itemByIdFamily(productId));
      if (!item) return "none" as const;

      const isPurchasable = get(isPurchasableFamily(productId));
      if (isPurchasable && item.commercial.maxSelectable > 0) {
        return "quantity" as const;
      }

      const { supply, demand, temporal } = item.state;
      if (supply.status === "none" && demand.kind === "waitlist") {
        return "waitlist" as const;
      }
      if (temporal.phase === "before" && demand.kind === "notify_me") {
        return "notify" as const;
      }

      return "none" as const;
    })
  );

  /** Quantity UI mode (§8.1 + §8.9 consistency rule) */
  const quantityUIFamily = atomFamily((productId: ProductId) =>
    atom((get) => {
      const panel = get(queryAtom);
      const presentation = get(presentationFamily(productId));
      const isPurchasable = get(isPurchasableFamily(productId));
      const item = get(itemByIdFamily(productId));

      if (!item || presentation !== "normal" || !isPurchasable) {
        return "hidden" as const;
      }

      const { maxSelectable } = item.commercial;
      if (maxSelectable <= 0) return "hidden" as const;

      // Full layout consistency rule (§8.9)
      const isFullLayout = panel.items.length > 1;
      const anyItemMultiQty = panel.items.some(
        (i) => i.commercial.maxSelectable > 1
      );

      if (isFullLayout && anyItemMultiQty) {
        return "stepper" as const; // Enforce visual consistency
      }

      return maxSelectable === 1 ? ("select" as const) : ("stepper" as const);
    })
  );

  /** Price UI mode (§8.1) */
  const priceUIFamily = atomFamily((productId: ProductId) =>
    atom((get) => {
      const presentation = get(presentationFamily(productId));
      if (presentation === "locked") return "masked" as const;

      const isPurchasable = get(isPurchasableFamily(productId));
      return isPurchasable ? ("shown" as const) : ("hidden" as const);
    })
  );

  // ============================================================================
  // Selection State (writable)
  // ============================================================================

  /** Per-product selection state with clamping */
  const selectionFamily = atomFamily((productId: ProductId) => {
    const valueAtom = atom(0);

    return atom(
      (get) => get(valueAtom),
      (get, set, newQty: number) => {
        const item = get(itemByIdFamily(productId));
        const max = item?.commercial.maxSelectable ?? 0;
        const clamped = Math.max(0, Math.min(newQty, max));
        set(valueAtom, clamped);
      }
    );
  });

  // ============================================================================
  // Panel-Level Rollups
  // ============================================================================

  /** All visible items are sold out */
  const allVisibleSoldOutAtom = atom((get) => {
    const panel = get(queryAtom);
    return panel.items.every((item) => item.state.supply.status === "none");
  });

  /** Any visible item is locked */
  const anyLockedVisibleAtom = atom((get) => {
    const panel = get(queryAtom);
    return panel.items.some(
      (item) =>
        item.state.gating.required &&
        !item.state.gating.satisfied &&
        item.state.gating.listingPolicy === "visible_locked"
    );
  });

  /** Access code CTA visibility */
  const accessCodeCTAAtom = atom((get) => {
    const panel = get(queryAtom);

    // Show if hidden items exist
    if (panel.context.gatingSummary?.hasHiddenGatedItems) {
      return true;
    }

    // Or if any visible item is locked
    return get(anyLockedVisibleAtom);
  });

  /** Selection is valid per orderRules */
  const selectionValidAtom = atom((get) => {
    const panel = get(queryAtom);
    const { orderRules } = panel.context;

    const selectedItems = panel.items.filter(
      (item) => get(selectionFamily(item.product.id)) > 0
    );

    if (selectedItems.length < orderRules.minSelectedTypes) {
      return false;
    }

    for (const item of selectedItems) {
      const qty = get(selectionFamily(item.product.id));
      if (qty < orderRules.minTicketsPerSelectedType) {
        return false;
      }
    }

    return true;
  });

  /** Panel action button state (§5.3a - complete atom-driven implementation in §4.8) */
  const panelActionButtonAtom = atom((get) => {
    const panel = get(queryAtom);
    const { clientCopy = {} } = panel.context;

    const isCompactLayout = panel.items.length === 1;
    const isSingular =
      isCompactLayout && panel.items[0]?.commercial.maxSelectable === 1;

    const defaultLabels = {
      checkout: { singular: "Get Ticket", plural: "Get Tickets" },
      waitlist: { singular: "Join Waitlist", plural: "Join Waitlist" },
      notify_me: { singular: "Notify Me", plural: "Notify Me" },
    };

    const getLabel = (kind: "checkout" | "waitlist" | "notify_me") => {
      const override = isSingular
        ? clientCopy.panel_action_button_cta
        : clientCopy.panel_action_button_cta_plural;
      return (
        override ||
        (isSingular ? defaultLabels[kind].singular : defaultLabels[kind].plural)
      );
    };

    // Check if any visible item is purchasable
    const anyPurchasable = panel.items.some((item) => {
      const isPurchasable = get(isPurchasableFamily(item.product.id));
      return isPurchasable && item.commercial.maxSelectable > 0;
    });

    if (anyPurchasable) {
      return {
        kind: "checkout" as const,
        enabled: get(selectionValidAtom),
        label: getLabel("checkout"),
      };
    }

    // All non-purchasable: check for waitlist
    const hasWaitlist = panel.items.some((item) => {
      const gateSatisfied =
        !item.state.gating.required || item.state.gating.satisfied;
      return gateSatisfied && item.state.demand.kind === "waitlist";
    });

    if (hasWaitlist) {
      return {
        kind: "waitlist" as const,
        enabled: true,
        label: getLabel("waitlist"),
      };
    }

    // Check for notify_me
    const hasNotifyMe = panel.items.some((item) => {
      return (
        item.state.temporal.phase === "before" &&
        item.state.demand.kind === "notify_me"
      );
    });

    if (hasNotifyMe) {
      return {
        kind: "notify_me" as const,
        enabled: true,
        label: getLabel("notify_me"),
      };
    }

    // Default: disabled checkout
    return {
      kind: "checkout" as const,
      enabled: false,
      label: getLabel("checkout"),
    };
  });

  // ============================================================================
  // Return scoped atoms
  // ============================================================================

  return {
    queryAtom,
    itemByIdFamily,
    presentationFamily,
    isPurchasableFamily,
    ctaKindFamily,
    quantityUIFamily,
    priceUIFamily,
    selectionFamily,
    allVisibleSoldOutAtom,
    anyLockedVisibleAtom,
    accessCodeCTAAtom,
    selectionValidAtom,
    panelActionButtonAtom,
  };
}

export type PanelAtoms = ReturnType<typeof createPanelAtoms>;
```

**Why this structure works**:

- **Factory closure**: All atoms close over `eventId`; no parameter juggling
- **atomFamily caching**: Each `productId` gets one stable atom instance (React re-renders don't create new atoms)
- **Writable atom pattern**: Primitive holds value, derived atom wraps with validation/clamping
- **Type-safe return**: Factory return type enforces shape; IntelliSense works perfectly

### 3.3 Context Provider Setup

**Why Context?** Atoms need to be scoped to component tree, not global. Multiple panel instances must have isolated state.

```typescript
import { createContext, useContext, useMemo } from "react";

/** Context for scoped panel atoms */
const PanelAtomsContext = createContext<PanelAtoms | null>(null);

/** Hook to access panel atoms (must be used within ProductPanel) */
export function usePanelAtoms() {
  const atoms = useContext(PanelAtomsContext);
  if (!atoms) {
    throw new Error("usePanelAtoms must be used within ProductPanel component");
  }
  return atoms;
}

/** Panel root component - creates and provides scoped atoms */
export function ProductPanel({ eventId }: { eventId: string }) {
  const atoms = useMemo(() => createPanelAtoms(eventId), [eventId]);

  return (
    <PanelAtomsContext.Provider value={atoms}>
      <PanelContent />
    </PanelAtomsContext.Provider>
  );
}
```

**Pattern**:

1. Factory creates atoms scoped to `eventId`
2. Provider wraps component tree
3. Components access atoms via `usePanelAtoms()` hook
4. No props drilling; atoms are dependency injection

### 3.4 Component Usage Pattern

**Key principle**: Components receive **only IDs** at collection boundaries (`.map()`), not data objects. Non-collection components receive zero props.

**Why IDs at collection boundaries?**

This pattern solves three problems specific to SSR/hydration/real-time contexts:

1. **SSR/Hydration Consistency**

   - Server renders items array → HTML with data-product-id attributes
   - Client hydrates → React matches by stable string IDs
   - Object references would cause hydration mismatches (new object every render)

2. **Efficient Re-Renders for Dynamic Collections**

   - Items appear (unlock), disappear (re-lock), or update (inventory changes)
   - React reconciles by ID: same string = same component instance (skip render if unchanged)
   - Object props = new reference every update = all rows re-render unnecessarily
   - Example: 10 ticket types, user changes qty on row 5 → only row 5 re-renders

3. **Real-Time Sync Without Thrashing**
   - Server pushes updated panel data → client replaces items array
   - React reconciles via stable IDs, atomFamily caches by productId
   - Unchanged rows skip render; changed rows update atoms only
   - No flashing, no full-list re-renders

**IDs passed ONLY where `.map()` happens**:

- Sections array → pass `sectionId`
- Items array → pass `productId`
- Non-collection components (PricingFooter, PanelActionButton, PanelNotices) → **zero props**

```typescript
/** Panel content - accesses atoms via Context */
function PanelContent() {
  const atoms = usePanelAtoms();
  const panel = useAtomValue(atoms.queryAtom);

  return (
    <div>
      <PanelNotices notices={panel.context.panelNotices} />

      {panel.sections.map((section) => (
        <Section key={section.id} sectionId={section.id} />
      ))}

      <PricingFooter />
      <PanelActionButton />
    </div>
  );
}

/** Section - filters items, passes only productId to rows */
function Section({ sectionId }: { sectionId: string }) {
  const atoms = usePanelAtoms();
  const panel = useAtomValue(atoms.queryAtom);

  const sectionItems = panel.items.filter(
    (item) => item.display.sectionId === sectionId
  );

  return (
    <div>
      <h2>{panel.sections.find((s) => s.id === sectionId)?.label}</h2>
      {sectionItems.map((item) => (
        <ProductRow
          key={item.product.id}
          productId={item.product.id} // ID only, not whole object
        />
      ))}
    </div>
  );
}

/** Product row - fetches all data via atoms using productId */
function ProductRow({ productId }: { productId: ProductId }) {
  const atoms = usePanelAtoms();

  // Fetch item data
  const item = useAtomValue(atoms.itemByIdFamily(productId));
  if (!item) return null;

  // Fetch derived presentation state
  const presentation = useAtomValue(atoms.presentationFamily(productId));
  const cta = useAtomValue(atoms.ctaKindFamily(productId));
  const quantityUI = useAtomValue(atoms.quantityUIFamily(productId));
  const priceUI = useAtomValue(atoms.priceUIFamily(productId));

  // Fetch & update selection
  const [quantity, setQuantity] = useAtom(atoms.selectionFamily(productId));

  if (presentation === "locked") {
    return <LockedRow item={item} />;
  }

  return (
    <NormalRow
      item={item}
      cta={cta}
      quantityUI={quantityUI}
      priceUI={priceUI}
      quantity={quantity}
      onQuantityChange={setQuantity}
    />
  );
}

/** Non-collection component - zero props, atoms only */
function PanelActionButton() {
  const atoms = usePanelAtoms();
  const buttonState = useAtomValue(atoms.panelActionButtonAtom);
  const isValid = useAtomValue(atoms.selectionValidAtom);

  return (
    <button disabled={!isValid || !buttonState.enabled}>
      {buttonState.label}
    </button>
  );
}
```

**IDs are the glue between**:

- React reconciliation (key prop for efficient DOM updates)
- Jotai atomFamily (lookup parameter for cached atom instances)
- SSR hydration (stable string references across server/client boundary)

### 3.5 Selection State Management

**How selection works**: Selection state lives in per-product atoms (via `selectionFamily`). Changes trigger debounced server refresh to update pricing and `maxSelectable` values.

**Writable atom pattern explained**:

```typescript
// Inside createPanelAtoms factory
const selectionFamily = atomFamily((productId: ProductId) => {
  const valueAtom = atom(0); // Primitive storage

  return atom(
    (get) => get(valueAtom), // Read: return current value
    (get, set, newQty: number) => {
      // Write: validate & clamp
      const item = get(itemByIdFamily(productId));
      const max = item?.commercial.maxSelectable ?? 0;
      const clamped = Math.max(0, Math.min(newQty, max));
      set(valueAtom, clamped);

      // Trigger server refresh (debounced)
      debouncedRefreshPricing();
    }
  );
});
```

**Why this pattern**:

- Primitive atom holds raw value (internal state)
- Derived atom wraps with validation (public API)
- Write function enforces `maxSelectable` clamp automatically
- No invalid states possible (clamped before storage)

### Server Refresh on Selection Change

**Critical rule**: Any selection change MUST trigger server refresh to update pricing and `maxSelectable` for dependencies (e.g., add-ons).

```typescript
// Debounced refresh (outside factory, shared across app)
let refreshTimer: NodeJS.Timeout;

function debouncedRefreshPricing() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(async () => {
    // Collect current selections
    const selections = {}; // Build from selectionFamily atoms

    // POST to server with current selections
    const response = await fetch("/api/panel/refresh", {
      method: "POST",
      body: JSON.stringify({ selections }),
    });

    const newPayload = await response.json();
    const validated = PanelDataSchema.parse(newPayload);

    // Update queryAtom → atoms re-derive → React re-renders
    updatePanelData(validated);
  }, 300); // 300ms debounce prevents excessive server calls
}
```

**Why debounce**: User rapidly clicks +/+ → one server call after 300ms idle, not three calls.

**What server recalculates**:

- `pricing.lineItems` (tickets, fees, taxes, total)
- Each item's `commercial.maxSelectable` (accounts for stock, limits, add-on dependencies)
- Panel notices if needed (e.g., "Max 10 tickets per order" if user hits limit)

### Clamp-Down on Server Updates

**Problem**: User selects 5 parking passes. Server refresh reveals `maxSelectable=1` (per-order limit). What happens?

**Solution**: Client must clamp selection down to match new `maxSelectable`.

```typescript
// Inside component or effect watching queryAtom updates
useEffect(
  () => {
    const atoms = usePanelAtoms();
    const panel = useAtomValue(atoms.queryAtom);

    for (const item of panel.items) {
      const currentQty = useAtomValue(atoms.selectionFamily(item.product.id));
      const newMax = item.commercial.maxSelectable;

      if (currentQty > newMax) {
        // Server lowered the cap; clamp down
        atoms.selectionFamily(item.product.id).write(newMax);
      }
    }
  },
  [
    /* queryAtom data dependency */
  ]
);
```

**User experience**: Quantity immediately adjusts to new max (with optional toast: "Quantity adjusted to maximum allowed").

---

### 3.6 Message Resolution

Resolve message text (either direct text or via template):

```typescript
export function resolveMessage(
    message: z.infer<typeof MessageSchema>,
    templates: z.infer<typeof ContextSchema>["copyTemplates"]
  ): string | null {
    // Use direct text if provided
    if (message.text) {
      return message.text;
    }

    // Find template by code
    const template = templates?.find(t => t.key === message.code);
    if (!template) {
      return null; // Omit message
    }

    // Interpolate params
    let result = template.template;
    if (message.params) {
      for (const [key, value] of Object.entries(message.params)) {
        result = result.replace(`{${key}}`, String(value ?? ""));
      }
    }

    // Replace unknown placeholders with empty string
    result = result.replace(/\{[^}]+\}/g, "");

    return result;
  }

  Rule: Messages without text or matching template are omitted.

  ---
  4. Component Structure

  4.1 Component Hierarchy

  <ProductPanel>
    ├─ <PanelHeader>
    │   └─ Welcome text / event info
    ├─ <PanelNoticeArea>
    │   └─ <PanelNotice> × N (sorted by priority)
    ├─ <PanelContent>
    │   ├─ <Section> × N
    │   │   └─ <ItemRow> × N
    │   │       ├─ <ItemHeader>
    │   │       │   ├─ Name, badges
    │   │       │   └─ Messages (under_title)
    │   │       ├─ <ItemPrice>
    │   │       │   └─ Price display or mask
    │   │       ├─ <ItemQuantity>
    │   │       │   ├─ Stepper or select
    │   │       │   └─ Messages (under_quantity)
    │   │       └─ <ItemCTA>
    │   │           └─ Quantity control or waitlist button
    │   └─ <AccessCodeCTA> (if needed)
    ├─ <PricingFooter>
    │   └─ Line items from server
    └─ <PanelActionButton>
        └─ Main checkout/waitlist/notify button

  4.2 ProductPanel (Container)

  export function ProductPanel() {
    const { data, isLoading, error } = usePanelData();
    const [panelData, setPanelData] = useAtom(panelDataAtom);

    // Sync server data to atom on load/change
    useEffect(() => {
      if (data) {
        setPanelData(data);
      }
    }, [data, setPanelData]);

    if (isLoading) return <LoadingState />;
    if (error) return <ErrorState error={error} />;
    if (!data) return null;

    return (
      <div className="product-panel">
        <PanelHeader welcomeText={data.context.welcomeText} />
        <PanelNoticeArea notices={data.context.panelNotices} />
        <PanelContent
          sections={data.sections}
          items={data.items}
          context={data.context}
        />
        <AccessCodeCTA />
        <PricingFooter pricing={data.pricing} />
        <PanelActionButton />
      </div>
    );
  }

  4.3 PanelNoticeArea

**Purpose**: Display panel-level notices (banners) at the top of the panel, sorted by priority. Notices come in TWO variants: standard text and specialized inline forms.

**Why two variants?** Different scenarios need different UI. Standard notices announce information ("Payment plans available"). Specialized notices embed interactive controls (access code entry form) for focused workflows.

  type PanelNotice = z.infer<typeof PanelNoticeSchema>;

  export function PanelNoticeArea({ notices }: { notices: PanelNotice[] }) {
  // Sort by descending priority (higher numbers first)
    const sorted = [...notices].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    return (
      <div className="panel-notice-area">
        {sorted.map((notice, idx) => (
          <PanelNotice key={idx} notice={notice} />
        ))}
      </div>
    );
  }

  function PanelNotice({ notice }: { notice: PanelNotice }) {
  // Specialized variant: inline access code form
    if (notice.code === "requires_code_entry") {
      return (
      <div className={`notice notice-${notice.variant ?? "info"} notice-specialized`}>
          {notice.icon && <Icon name={notice.icon} />}
        <div className="notice-content">
            {notice.title && <h3>{notice.title}</h3>}
            {notice.description && <p>{notice.description}</p>}
            <AccessCodeForm />
          </div>
        </div>
      );
    }

  // Standard text notice
    return (
      <div className={`notice notice-${notice.variant ?? "info"}`}>
        {notice.icon && <Icon name={notice.icon} />}
      <div className="notice-content">
          {notice.title && <h3>{notice.title}</h3>}
          {notice.text && <p>{notice.text}</p>}
          {notice.description && <p className="text-muted">{notice.description}</p>}
        </div>
        {notice.action && (
          <Button onClick={() => handleNoticeAction(notice.action!)}>
            {notice.action.label}
          </Button>
        )}
      </div>
    );
  }
```

### Notice Variants Explained

**Standard Text Notice** (most common):

```jsonc
{
  "code": "payment_plan_available",
  "variant": "info",
  "icon": "credit-card",
  "title": "Payment Plans Available",
  "description": "Split your purchase into installments at checkout.",
  "priority": 50
}
```

**Renders**: Icon + heading + body + optional description. Informational only; no form controls.

**Use for**: Payment plan announcements, event-wide urgency ("Sales end tonight!"), waitlist context ("All tickets sold out").

**Specialized Inline Form Notice** (`requires_code_entry`):

```jsonc
{
  "code": "requires_code_entry",
  "variant": "info",
  "icon": "lock",
  "title": "Have an access code?",
  "description": "Enter your code below to unlock exclusive tickets.",
  "priority": 100
}
```

**Renders**: Icon + title + description + **inline access code form** (input field + "Apply Code" button).

**Use for**: Gated-only scenarios where no purchasable items exist (`items.length === 0` and `gatingSummary.hasHiddenGatedItems === true`). This becomes the primary UI affordance.

### When to Use Each Variant

| Scenario                                     | Variant                  | Rationale                                                                            |
| -------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------ |
| Gated-only (no visible purchasable items)    | `requires_code_entry`    | Inline form is primary action; most prominent placement                              |
| Mixed (some public items, some hidden gated) | Standard + AccessCodeCTA | Standard notice provides context; AccessCodeCTA below button is secondary affordance |
| Visible locked items + hidden gated          | Standard + AccessCodeCTA | Notice explains gating; CTA handles unlock                                           |
| No gating at all                             | N/A                      | No code-related notices                                                              |

### Notice Stacking & Priority

**How stacking works**:

- Multiple notices render vertically
- Sorted by descending `priority` (higher first)
- Ties preserve server order

**Example payload**:

```jsonc
"panelNotices": [
  { "code": "requires_code", "text": "Enter access code to view tickets", "priority": 90 },
  { "code": "payment_plan_available", "text": "Payment plans available at checkout", "priority": 50 }
]
```

**Renders**: "Enter access code..." notice above "Payment plans..." notice.

**Visual hierarchy**: Higher priority notices may use bolder styling or larger icons to draw attention.

4.4 PanelContent & Sections

export function PanelContent({
sections,
items,
context
}: {
sections: z.infer<typeof SectionsSchema>;
items: z.infer<typeof ItemsSchema>;
context: z.infer<typeof ContextSchema>;
}) {
// Group items by section
const itemsBySection = new Map<string, typeof items>();

    for (const item of items) {
      const sectionId = item.display.sectionId ?? sections[0]?.id;
      if (!itemsBySection.has(sectionId)) {
        itemsBySection.set(sectionId, []);
      }
      itemsBySection.get(sectionId)!.push(item);
    }

    // Sort sections by order
    const sortedSections = [...sections].sort((a, b) => a.order - b.order);

    return (
      <div className="panel-content">
        {sortedSections.map(section => {
          const sectionItems = itemsBySection.get(section.id) ?? [];

          // Hide empty sections
          if (sectionItems.length === 0) return null;

          return (
            <Section
              key={section.id}
              section={section}
              items={sectionItems}
              context={context}
            />
          );
        })}
      </div>
    );

}

function Section({
section,
items,
context
}: {
section: z.infer<typeof SectionSchema>;
items: z.infer<typeof ItemSchema>[];
context: z.infer<typeof ContextSchema>;
}) {
return (

<div className="section" data-section-id={section.id}>
<h2>{section.labelOverride ?? section.label}</h2>
<div className="section-items">
{items.map(item => (
<ItemRow key={item.product.id} item={item} context={context} />
))}
</div>
</div>
);
}

4.5 ItemRow

type Item = z.infer<typeof ItemSchema>;

export function ItemRow({ item, context }: { item: Item; context: Context }) {
const presentations = useAtomValue(itemPresentationAtom);
const purchasable = useAtomValue(itemPurchasabilityAtom);
const ctas = useAtomValue(itemCTAAtom);
const [selection, updateSelection] = useAtom(selectionAtom);

    const presentation = presentations.get(item.product.id);
    const isPurchasable = purchasable.get(item.product.id);
    const cta = ctas.get(item.product.id);
    const currentQty = selection.get(item.product.id) ?? 0;

    const isLocked = presentation === "locked";

    // Derive visibility flags
    const showQuantity = !isLocked && isPurchasable && item.commercial.maxSelectable > 0;
    const showPrice = isPurchasable && !isLocked;
    const maskPrice = isLocked;

    return (
      <div className={`item-row ${isLocked ? "locked" : ""}`}>
        <ItemHeader
          item={item}
          context={context}
          messages={filterMessagesByPlacement(item.state.messages, "row.under_title")}
        />

        <ItemPrice
          price={item.commercial.price}
          feesIncluded={item.commercial.feesIncluded}
          show={showPrice}
          mask={maskPrice}
        />

        {showQuantity && (
          <ItemQuantity
            productId={item.product.id}
            currentQty={currentQty}
            maxSelectable={item.commercial.maxSelectable}
            onUpdate={(qty) => updateSelection({ productId: item.product.id, quantity: qty })}
            messages={filterMessagesByPlacement(item.state.messages, "row.under_quantity")}
          />
        )}

        <ItemCTA
          cta={cta}
          item={item}
          context={context}
        />
      </div>
    );

}

4.6 ItemQuantity

function ItemQuantity({
productId,
currentQty,
maxSelectable,
onUpdate,
messages,
}: {
productId: string;
currentQty: number;
maxSelectable: number;
onUpdate: (qty: number) => void;
messages: Message[];
}) {
// UI variant based on maxSelectable
const variant = maxSelectable === 1 ? "select" : "stepper";

    if (variant === "select") {
      return (
        <div className="item-quantity-select">
          <button
            onClick={() => onUpdate(currentQty === 0 ? 1 : 0)}
            className={currentQty > 0 ? "selected" : ""}
          >
            {currentQty > 0 ? "Added" : "Add"}
          </button>
          {messages.map((msg, idx) => (
            <MessageDisplay key={idx} message={msg} />
          ))}
        </div>
      );
    }

    return (
      <div className="item-quantity-stepper">
        <button
          onClick={() => onUpdate(Math.max(0, currentQty - 1))}
          disabled={currentQty === 0}
        >
          −
        </button>
        <span>{currentQty}</span>
        <button
          onClick={() => onUpdate(Math.min(maxSelectable, currentQty + 1))}
          disabled={currentQty >= maxSelectable}
        >
          +
        </button>
        {messages.map((msg, idx) => (
          <MessageDisplay key={idx} message={msg} />
        ))}
      </div>
    );

}

4.7 PricingFooter

export function PricingFooter({ pricing }: { pricing: z.infer<typeof PricingSchema> }) {
// Empty state: no selection
if (pricing.lineItems.length === 0) {
return null;
}

    return (
      <div className="pricing-footer">
        {pricing.lineItems.map((line, idx) => {
          const isTotal = line.code === "TOTAL";

          return (
            <div
              key={idx}
              className={`price-line ${isTotal ? "total" : ""}`}
            >
              <span className="label">{line.label}</span>
              <span className="amount">{formatDinero(line.amount)}</span>
            </div>
          );
        })}
      </div>
    );

}

Rule: Render line items in exact payload order. Never reorder or insert computed rows.

4.8 PanelActionButton (Atom-Driven Labels)

**Critical principle**: Button labels are **derived from panel state via atoms**, never hardcoded. The atom knows the state and context; clientCopy provides optional overrides.

**Why atom-driven?** Button labels must adapt to:

- Panel state (checkout vs. waitlist vs. notify_me)
- Layout context (singular vs. plural)
- Server overrides (clientCopy customization)

Hardcoding labels breaks localization, A/B testing, and semantic accuracy.

### State Model

```typescript
type PanelActionButtonState = {
  kind: "checkout" | "waitlist" | "notify_me";
  enabled: boolean;
  label: string; // Derived by atom, never hardcoded in component
};
```

### Derivation Logic (Complete Implementation)

**Already implemented in `panelActionButtonAtom` within `createPanelAtoms` factory (see §3.2).**

**Step 1: Determine kind**

```typescript
// Derivation order (first match wins):
const anyPurchasable = panel.items.some(
  (item) => isPurchasable(item) && item.commercial.maxSelectable > 0
);

if (anyPurchasable) {
  kind = "checkout"; // At least one item can be purchased
  enabled = selectionValidAtom; // Only if selection meets orderRules
} else if (hasWaitlist) {
  // Any item has demand.kind="waitlist" (respects gating)
  kind = "waitlist";
  enabled = true;
} else if (hasNotifyMe) {
  // Any item has temporal.phase="before" + demand.kind="notify_me"
  kind = "notify_me";
  enabled = true;
} else {
  kind = "checkout"; // Default fallback
  enabled = false; // Greyed out
}
```

**Step 2: Determine singular vs. plural context**

```typescript
const isCompactLayout = panel.items.length === 1;
const isSingular =
  isCompactLayout && panel.items[0]?.commercial.maxSelectable === 1;

// Examples:
// - Compact, maxSelectable=1 → singular ("Get Ticket")
// - Compact, maxSelectable=6 → plural ("Get Tickets")
// - Full layout (items.length > 1) → always plural ("Get Tickets")
```

**Why this logic?** Singular makes sense only when exactly one ticket can be selected. All other cases imply cart-like behavior → plural.

**Step 3: Resolve label (atom provides default, clientCopy overrides)**

```typescript
const defaultLabels = {
  checkout: { singular: "Get Ticket", plural: "Get Tickets" },
  waitlist: { singular: "Join Waitlist", plural: "Join Waitlist" },
  notify_me: { singular: "Notify Me", plural: "Notify Me" },
};

function getLabel(kind: "checkout" | "waitlist" | "notify_me"): string {
  // Server override takes precedence
  const override = isSingular
    ? clientCopy.panel_action_button_cta // Singular override
    : clientCopy.panel_action_button_cta_plural; // Plural override

  if (override) return override;

  // Atom default based on kind and context
  return isSingular ? defaultLabels[kind].singular : defaultLabels[kind].plural;
}
```

### Label Resolution Examples

| Layout  | maxSelectable | kind      | clientCopy.panel_action_button_cta | Label                                  |
| ------- | ------------- | --------- | ---------------------------------- | -------------------------------------- |
| Compact | 1             | checkout  | undefined                          | "Get Ticket" (atom default)            |
| Compact | 1             | checkout  | "Buy Now"                          | "Buy Now" (server override)            |
| Compact | 6             | checkout  | undefined                          | "Get Tickets" (atom default plural)    |
| Full    | mixed         | checkout  | undefined                          | "Get Tickets" (full always plural)     |
| Any     | N/A           | waitlist  | undefined                          | "Join Waitlist" (same singular/plural) |
| Any     | N/A           | notify_me | undefined                          | "Notify Me" (same singular/plural)     |

### Component Implementation

```typescript
export function PanelActionButton() {
  const atoms = usePanelAtoms();
  const buttonState = useAtomValue(atoms.panelActionButtonAtom);
  // buttonState: { kind, enabled, label } - all derived by atom

  const handleClick = () => {
    switch (buttonState.kind) {
      case "checkout":
        // Navigate to checkout with current selections
        navigateToCheckout();
        break;
      case "waitlist":
        // Open waitlist signup modal
        openWaitlistModal();
        break;
      case "notify_me":
        // Open notify-me modal
        openNotifyMeModal();
        break;
    }
  };

  return (
    <button
      type="button"
      className={`panel-action-button panel-action-${buttonState.kind}`}
      disabled={!buttonState.enabled}
      onClick={handleClick}
    >
      {buttonState.label}
      {/* ☝️ Label from atom - never hardcoded string */}
    </button>
  );
}
```

**Notice**: Component has zero knowledge of label logic. It just renders `buttonState.label` which the atom computed. This keeps components simple and state logic centralized.

### Common Scenarios

**Single ticket event (compact, max=1)**:

- Panel loads with 1 item, `maxSelectable=1`
- Atom detects: `isSingular=true`
- Label: "Get Ticket" (singular, unless clientCopy overrides)
- User clicks → implicit qty=1, proceed to checkout

**Multiple tickets available (compact, max=6)**:

- Panel loads with 1 item, `maxSelectable=6`
- Atom detects: `isSingular=false` (plural context)
- Label: "Get Tickets" (plural)
- User selects qty → button stays "Get Tickets"

**Event sold out with waitlist**:

- All items: `supply.status="none"`, `demand.kind="waitlist"`
- Atom detects: no purchasable items, `hasWaitlist=true`
- Kind: `"waitlist"`, label: "Join Waitlist", enabled: `true`
- User clicks → open waitlist modal (not checkout)

**Not on sale yet with notify**:

- All items: `temporal.phase="before"`, `demand.kind="notify_me"`
- Atom detects: `hasNotifyMe=true`
- Kind: `"notify_me"`, label: "Notify Me", enabled: `true`
- User clicks → open notification signup modal

**No valid action (disabled state)**:

- All items locked or otherwise unavailable
- Atom detects: no purchasable, no waitlist, no notify
- Kind: `"checkout"`, label: "Get Tickets", enabled: `false`
- Button greyed out (same label, visual disabled styling only)

  4.9 AccessCodeCTA

  export function AccessCodeCTA() {
  const showAccessCode = useAtomValue(accessCodeCTAAtom);
  const [expanded, setExpanded] = useState(false);

      if (!showAccessCode) return null;

      return (
        <div className="access-code-cta">
          {!expanded ? (
            <button onClick={() => setExpanded(true)}>
              🔒 Have an access code? Enter it here
            </button>
          ) : (
            <AccessCodeForm onCancel={() => setExpanded(false)} />
          )}
        </div>
      );

  }

  function AccessCodeForm({ onCancel }: { onCancel?: () => void }) {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
          // POST to server
          const response = await fetch("/api/panel/unlock", {
            method: "POST",
            body: JSON.stringify({ code }),
          });

          if (response.ok) {
            const newPayload = await response.json();
            // Validate and update panelDataAtom
            const validated = PanelDataSchema.parse(newPayload);
            setPanelData(validated);
            setCode("");
          } else {
            // Error handling: server returns updated payload with error notice
            const errorPayload = await response.json();
            const validated = PanelDataSchema.parse(errorPayload);
            setPanelData(validated);
          }
        } finally {
          setIsSubmitting(false);
        }
      };

      return (
        <form onSubmit={handleSubmit} className="access-code-form">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter access code"
            disabled={isSubmitting}
          />
          <button type="submit" disabled={isSubmitting || !code}>
            {isSubmitting ? "Applying..." : "Apply Code"}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel}>Cancel</button>
          )}
        </form>
      );

  }

  ***

  5. Rendering Logic

  5.1 Presentation State Derivation

  Decision Table:

  | Condition                                                       | Presentation                     |
  | --------------------------------------------------------------- | -------------------------------- |
  | gating.required && !satisfied && listingPolicy="visible_locked" | locked                           |
  | All other cases                                                 | normal                           |
  | Item with listingPolicy="omit_until_unlocked" and unsatisfied   | Not in items[] (server omission) |

  Implementation:

  function derivePresentation(item: Item): "normal" | "locked" {
  const { gating } = item.state;

      if (gating.required && !gating.satisfied && gating.listingPolicy === "visible_locked") {
        return "locked";
      }

      return "normal";

  }

  5.2 Purchasability Rules

  Formula: All four conditions must be true.

  function isPurchasable(item: Item): boolean {
  const { temporal, supply, gating } = item.state;
  const { maxSelectable } = item.commercial;

      return (
        temporal.phase === "during" &&
        supply.status === "available" &&
        (!gating.required || gating.satisfied) &&
        maxSelectable > 0
      );

  }

  Truth Table:

  | temporal.phase | supply.status | Gate OK? | maxSelectable | isPurchasable      |
  | -------------- | ------------- | -------- | ------------- | ------------------ |
  | during         | available     | ✅       | > 0           | true               |
  | before         | available     | ✅       | > 0           | false (wrong time) |
  | during         | none          | ✅       | > 0           | false (no stock)   |
  | during         | available     | ❌       | > 0           | false (locked)     |
  | during         | available     | ✅       | 0             | false (clamp)      |

  5.3 CTA Selection

  Decision Flow (first match wins):

  function selectCTA(item: Item, presentation: Presentation): CTA {
  // 1. Gate precedence
  if (presentation === "locked") {
  return { kind: "none" };
  }

      // 2. Purchasable → quantity control
      if (isPurchasable(item)) {
        return {
          kind: "quantity",
          enabled: item.commercial.maxSelectable > 0
        };
      }

      // 3. Sold out + waitlist
      if (item.state.supply.status === "none" && item.state.demand.kind === "waitlist") {
        return { kind: "waitlist", enabled: true };
      }

      // 4. Before sale + notify
      if (item.state.temporal.phase === "before" && item.state.demand.kind === "notify_me") {
        return { kind: "notify", enabled: true };
      }

      // 5. Default: none
      return { kind: "none" };

  }

  5.4 Price & Quantity Visibility

  Price UI:

  | Presentation | isPurchasable | Price UI                  |
  | ------------ | ------------- | ------------------------- |
  | locked       | —             | masked ("—" or "Locked")  |
  | normal       | true          | shown (formatted amount)  |
  | normal       | false         | hidden (no price element) |

  Quantity UI:

  | Presentation | isPurchasable | maxSelectable | Quantity UI            |
  | ------------ | ------------- | ------------- | ---------------------- |
  | locked       | —             | —             | hidden                 |
  | normal       | false         | —             | hidden                 |
  | normal       | true          | 1             | select (single toggle) |
  | normal       | true          | > 1           | stepper (+/− buttons)  |

  Implementation:

  function deriveVisibility(item: Item, presentation: Presentation, isPurchasable: boolean) {
  const isLocked = presentation === "locked";

      return {
        priceUI: isLocked ? "masked" : (isPurchasable ? "shown" : "hidden"),
        quantityUI: (isLocked || !isPurchasable || item.commercial.maxSelectable === 0)
          ? "hidden"
          : (item.commercial.maxSelectable === 1 ? "select" : "stepper"),
      };

  }

  5.5 Message Display & Priority

  Rules:

  1. Filter by placement (e.g., "row.under_title")
  2. Sort by descending priority (higher first)
  3. Resolve text via message.text or template interpolation
  4. Omit if no text can be resolved

  Implementation:

  function filterAndSortMessages(
  messages: Message[],
  placement: string,
  templates: CopyTemplate[]
  ): ResolvedMessage[] {
  return messages
  .filter(m => m.placement === placement)
  .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  .map(m => ({
  ...m,
  resolvedText: resolveMessage(m, templates),
  }))
  .filter(m => m.resolvedText !== null);
  }

  Example: Displaying messages under quantity

    <div className="item-quantity">
      <QuantityStepper {...props} />
      <div className="messages">
        {filterAndSortMessages(item.state.messages, "row.under_quantity", context.copyTemplates)
          .map((msg, idx) => (
            <div key={idx} className={`message message-${msg.variant ?? "info"}`}>
              {msg.resolvedText}
            </div>
          ))}
      </div>
    </div>

  ***

  6. User Interactions

  6.1 Quantity Selection Flow

  User clicks +/− or "Add"
  ↓
  Update selectionAtom locally (immediate UI feedback)
  ↓
  Debounce 300ms
  ↓
  POST to server with full selection map
  ↓
  Server recalculates: - pricing (fees, taxes, total) - maxSelectable for all items (stock, limits, add-on dependencies)
  ↓
  Server responds with updated payload
  ↓
  Validate payload
  ↓
  Update panelDataAtom
  ↓
  Atoms re-derive UI state
  ↓
  React re-renders

  Key Points:

  - Optimistic update for instant feedback
  - Server is source of truth; client never computes limits
  - If server returns lower maxSelectable, clamp selection down

  Clamp-down logic:

  useEffect(() => {
  const data = panelDataAtom;
  if (!data) return;

      const currentSelection = get(selectionAtom);
      const needsClamp = new Map<string, number>();

      for (const [productId, qty] of currentSelection.entries()) {
        const item = data.items.find(i => i.product.id === productId);
        if (!item) continue;

        if (qty > item.commercial.maxSelectable) {
          needsClamp.set(productId, item.commercial.maxSelectable);
        }
      }

      if (needsClamp.size > 0) {
        const updated = new Map(currentSelection);
        for (const [id, clampedQty] of needsClamp.entries()) {
          if (clampedQty === 0) {
            updated.delete(id);
          } else {
            updated.set(id, clampedQty);
          }
        }
        set(selectionAtom, updated);
      }

  }, [panelDataAtom]);

  6.2 Access Code Submission Flow (Complete User Journey)

**Purpose**: Understanding the complete unlock sequence helps handle edge cases correctly (post-unlock sold out, invalid codes, public sold + hidden gated).

### Pre-Unlock State (What User Sees)

**Scenario A: Gated-only (no visible items)**

```jsonc
{
  "items": [], // Empty - all items are gated
  "context": {
    "gatingSummary": { "hasHiddenGatedItems": true },
    "panelNotices": [
      {
        "code": "requires_code_entry",
        "icon": "lock",
        "title": "Have an access code?",
        "description": "Enter your code below to unlock exclusive tickets.",
        "priority": 100
      }
    ]
  }
}
```

**User sees**:

- Prominent notice with **inline access code form** (input + "Apply Code" button)
- No product list (items array is empty)
- PanelActionButton disabled
- Welcome text may say "Access code required to view tickets"

**Scenario B: Mixed (some public items sold out, some hidden gated)**

```jsonc
{
  "items": [
    {
      "product": { "id": "prod_ga", "name": "General Admission" },
      "state": { "supply": { "status": "none" } }, // Sold out
      "commercial": { "maxSelectable": 0 }
    }
  ],
  "context": {
    "gatingSummary": { "hasHiddenGatedItems": true },
    "panelNotices": [
      {
        "code": "requires_code",
        "text": "Enter access code to view tickets",
        "variant": "info",
        "priority": 90
      }
    ]
  }
}
```

**User sees**:

- Public GA ticket row showing "Sold Out"
- Standard notice banner at top suggesting access code
- **AccessCodeCTA** below PanelActionButton (secondary affordance)
- **Important**: Do NOT show "Event Sold Out" finale (hidden gated inventory exists)

### Unlock Attempt (Client → Server)

**User action**: Enters code in form, clicks "Apply Code"

**Client implementation**:

```typescript
async function handleAccessCodeSubmit(code: string) {
  setIsSubmitting(true);

  try {
    const response = await fetch("/api/panel/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    // Server always returns a payload (success or error state)
    const newPayload = await response.json();

    // Validate immediately
    const validated = PanelDataSchema.parse(newPayload);

    // Update panel data → atoms re-derive → React re-renders
    updatePanelData(validated);

    // Clear form on success (new items appear or locked items unlock)
    if (response.ok) {
      setCode("");
    }
  } catch (error) {
    // Network/validation error (not invalid code)
    showError("Could not validate code. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
}
```

**Key points**:

- Client performs **zero validation** of code format/length
- Server is authoritative for all validation (signature, expiry, usage limits)
- Client just sends code → receives new payload → re-renders

### Post-Unlock Success (Updated Payload)

**Server response** (previously omitted items now included):

```jsonc
{
  "items": [
    // Public GA (was visible, still sold out)
    {
      "product": { "id": "prod_ga" },
      "state": { "supply": { "status": "none" } }
    },

    // VIP (was omitted, now unlocked and available)
    {
      "product": { "id": "prod_vip", "name": "VIP Pass" },
      "state": {
        "gating": { "required": true, "satisfied": true },
        "supply": { "status": "available" }
      },
      "commercial": { "maxSelectable": 4 }
    }
  ],
  "context": {
    "gatingSummary": { "hasHiddenGatedItems": false }, // Updated
    "panelNotices": [] // Success notice optional
  }
}
```

**User sees**:

- VIP Pass row appears (new item)
- Row shows "normal" presentation (not locked)
- Price visible, quantity controls enabled (if purchasable)
- GA row still shows "Sold Out" (confirms public inventory state)

**For previously visible-locked items** (not shown above):

```jsonc
// Before unlock
"state": {
  "gating": { "required": true, "satisfied": false, "listingPolicy": "visible_locked" }
}

// After unlock (same item)
"state": {
  "gating": { "required": true, "satisfied": true, "listingPolicy": "visible_locked" }
}
```

Row transitions: locked → unlocked (price unmasks, quantity controls appear).

### Post-Unlock Error (Invalid/Expired Code)

**Server response** (error state):

```jsonc
{
  "items": [], // Or same locked items as before
  "context": {
    "gatingSummary": { "hasHiddenGatedItems": true }, // Unchanged
    "panelNotices": [
      {
        "code": "invalid_code",
        "variant": "error",
        "text": "Invalid access code. Please try again.",
        "priority": 100
      }
    ]
  }
}
```

**User sees**:

- Red error banner at top (high priority)
- Items remain locked/omitted (state unchanged)
- Form stays visible (can retry with correct code)
- No items unlocked

**Client does NOT**:

- Generate error text locally
- Rate-limit attempts (server handles this)
- Validate code format before submission

### Critical Edge Case: Public Sold Out + Hidden Gated

**Problem**: All visible items are sold out, but `gatingSummary.hasHiddenGatedItems=true`. What should user see?

**Wrong approach** ❌:

```typescript
// DON'T show final "Event Sold Out" state
if (allVisibleSoldOut) {
  return <EventSoldOutFinale />; // Misleading - gated inventory exists!
}
```

**Correct approach** ✅:

```typescript
// Check for hidden gated before showing finale
const atoms = usePanelAtoms();
const allSoldOut = useAtomValue(atoms.allVisibleSoldOutAtom);
const hasHidden = panel.context.gatingSummary?.hasHiddenGatedItems;

if (allSoldOut && hasHidden) {
  // Show access code prompt, NOT "Event Sold Out" finale
  // User should try unlocking before assuming nothing is available
  return <AccessCodePromptLayout />;
}

if (allSoldOut && !hasHidden) {
  // Now it's safe to show finale (truly nothing left)
  return <EventSoldOutFinale />;
}
```

**Why**: Prevents misleading users into thinking nothing is available when gated inventory exists. Guide them toward unlocking.

**After unlock in this scenario**: If gated items are also sold out, THEN show "Event Sold Out" (but user got confirmation their code worked and saw what was available).

### Unlock Confirmation Pattern

**Problem**: User unlocks code but item is sold out. Did the code work?

**Solution**: Show unlocked item even if sold out (as disabled row).

```jsonc
// Unlocked but sold out item (still appears in payload)
{
  "product": { "id": "prod_vip", "name": "VIP Pass" },
  "state": {
    "gating": { "required": true, "satisfied": true }, // Unlocked ✅
    "supply": { "status": "none" }, // But sold out
    "messages": [
      {
        "code": "sold_out",
        "text": "Sold Out",
        "placement": "row.under_quantity"
      }
    ]
  },
  "commercial": { "maxSelectable": 0 }
}
```

**User sees**:

- VIP Pass row appears (confirmation: code worked)
- Row shows "Sold Out" message (clear status)
- Quantity controls hidden (maxSelectable=0)
- No ambiguity: "Your code worked, but this ticket sold out"

**Rationale**: Explicit feedback prevents confusion. User knows code was valid; they just missed the window.

### Implementation Checklist

- [ ] Client never validates codes locally (format, length, signature)
- [ ] All unlock attempts POST to server
- [ ] Success: validate new payload, update atoms, clear form
- [ ] Error: display server-provided error notice (never invent text)
- [ ] Check `hasHiddenGatedItems` before showing "Event Sold Out" finale
- [ ] Show unlocked-but-unavailable items for confirmation
- [ ] Handle partial unlocks (some items unlocked, others remain hidden)

  6.3 Waitlist & Notify-Me Actions

  Waitlist:

  async function handleWaitlistSignup(productId: string) {
  // POST to waitlist endpoint
  await fetch("/api/waitlist/join", {
  method: "POST",
  body: JSON.stringify({ productId }),
  });

  // Show confirmation modal
  showModal("You're on the waitlist! We'll email you if tickets become available.");
  }

  Notify-Me:

  async function handleNotifyMe(productId: string) {
  // POST to notify endpoint
  await fetch("/api/notify/subscribe", {
  method: "POST",
  body: JSON.stringify({ productId }),
  });

  // Show confirmation
  showModal("We'll email you when tickets go on sale!");
  }

  6.4 Checkout Submission

  async function handleCheckout() {
  const selections = get(selectionAtom);
  const data = get(panelDataAtom);

  // Validate order rules client-side (for UX)
  const validation = validateOrderRules(data.context.orderRules, selections, data.items);

  if (!validation.valid) {
  showError(validation.message); // From clientCopy
  return;
  }

  // Submit to checkout endpoint
  const response = await fetch("/api/checkout/create", {
  method: "POST",
  body: JSON.stringify({
  selections: Array.from(selections.entries()).map(([id, qty]) => ({ id, qty })),
  }),
  });

  if (response.ok) {
  const { checkoutUrl } = await response.json();
  window.location.href = checkoutUrl;
  } else {
  // Server validation failed (stock changed, etc.)
  const error = await response.json();
  showError(error.message);
  }
  }

  Order Rules Validation:

  function validateOrderRules(
  rules: OrderRules,
  selections: Map<string, number>,
  items: Item[]
  ): { valid: boolean; message?: string } {
  const selectedItems = items.filter(item => selections.has(item.product.id));

  // Count types selected
  const typesSelected = new Set(selectedItems.map(i => i.product.type)).size;

  if (typesSelected < rules.minSelectedTypes) {
  return {
  valid: false,
  message: `Please select at least ${rules.minSelectedTypes} ticket type(s).`,
  };
  }

  // Check min per type
  for (const item of selectedItems) {
  const qty = selections.get(item.product.id) ?? 0;
  if (qty < rules.minTicketsPerSelectedType) {
  return {
  valid: false,
  message: `Minimum ${rules.minTicketsPerSelectedType} ticket(s) required for ${item.product.name}.`,
  };
  }
  }

  return { valid: true };
  }

  ***

  7. Edge Cases & Testing

  7.1 What Client MUST NEVER Do

  Prohibited Actions:

  // ❌ NEVER compute schedules
  const isOnSale = new Date() >= new Date(item.temporal.currentWindow.startsAt);

  // ❌ NEVER derive availability from counts
  const isSoldOut = item.supply.remaining === 0;

  // ❌ NEVER compute price math
  const total = selections.reduce((sum, [id, qty]) => {
  const item = items.find(i => i.product.id === id);
  return sum + (item.commercial.price.amount \* qty);
  }, 0);

  // ❌ NEVER derive limits from fields
  const effectiveMax = Math.min(
  item.commercial.limits.perOrder ?? Infinity,
  item.supply.remaining ?? Infinity
  );

  // ❌ NEVER validate codes locally
  if (accessCode.length < 6) return "Code too short";

  // ❌ NEVER invent UI text
  if (item.state.supply.status === "none") {
  return "Sold Out"; // Use state.messages[] instead
  }

  Correct Patterns:

  // ✅ Use server-provided phase
  const isOnSale = item.state.temporal.phase === "during";

  // ✅ Use server-provided status
  const isSoldOut = item.state.supply.status === "none";

  // ✅ Use server-provided pricing
  const footer = <PricingFooter pricing={data.pricing} />;

  // ✅ Use server-provided clamp
  const max = item.commercial.maxSelectable;

  // ✅ Submit codes to server
  const response = await fetch("/api/panel/unlock", { body: { code } });

  // ✅ Use server-provided text
  const message = resolveMessage(item.state.messages[0], templates);

  7.2 Common Edge Cases

  Case 1: Unlocked but Sold Out

  {
  "state": {
  "gating": { "required": true, "satisfied": true },
  "supply": { "status": "none" },
  "demand": { "kind": "waitlist" }
  },
  "commercial": { "maxSelectable": 0 }
  }

  Expected:

  - Row is visible (unlocked)
  - Presentation = normal
  - Price is hidden (not purchasable)
  - Quantity UI hidden
  - CTA = waitlist (demand takes over)
  - Message: "Sold Out" (from state.messages[])

  Case 2: Public Sold Out + Hidden Gated

  {
  "items": [
  {
  "product": { "id": "ga", "name": "General Admission" },
  "state": { "supply": { "status": "none" } }
  }
  ],
  "context": {
  "gatingSummary": { "hasHiddenGatedItems": true }
  }
  }

  Expected:

  - Show access code CTA prominently
  - Do NOT show "Event Sold Out" final state
  - After unlock, if hidden items also sold out, THEN show "Event Sold Out"

  Case 3: Add-on Without Parent

  {
  "product": { "id": "parking", "name": "Parking Pass" },
  "relations": { "parentProductIds": ["ga", "vip"] },
  "commercial": { "maxSelectable": 0 }
  }

  Expected:

  - Quantity UI hidden (maxSelectable = 0)
  - Show message: "Add at least one ticket to select this add-on" (from clientCopy)
  - After parent selected → server refresh → maxSelectable updates → UI enables

  Case 4: Stale Data (Fetch Error)

  // Last valid pricing displayed with indicator
  <PricingFooter pricing={lastValidPricing} />
  <div className="pricing-stale-indicator">
    ⚠️ Prices may be outdated
    <button onClick={retryPricingFetch}>Retry</button>
  </div>

  7.3 Testing Strategy

**Purpose**: Systematically validate that the implementation correctly derives UI state from server facts, never invents business logic, and handles all edge cases.

### Test Layers

1. **Unit tests** → Atoms & pure derivation logic
2. **Integration tests** → Component rendering from state
3. **E2E tests** → Complete user workflows

### Unit Tests (Atoms & Logic)

**Goal**: Test each axis independently and verify cross-axis invariants.

**Pattern**: Use fixture data (not inline JSON) to test atoms in isolation.

```typescript
import { describe, it, expect } from "vitest";
import { createPanelAtoms } from "./atoms";
import { createMockPanelData } from "./fixtures";

describe("isPurchasableFamily", () => {
  it("returns true when all four axes allow purchase", () => {
    const panel = createMockPanelData({
      items: [
        {
          product: { id: "prod_ga" },
          state: {
            temporal: { phase: "during" }, // ✅
            supply: { status: "available" }, // ✅
            gating: { required: false }, // ✅
            demand: { kind: "none" },
          },
          commercial: { maxSelectable: 5 }, // ✅
        },
      ],
    });

    const atoms = createPanelAtoms("test-event");
    const isPurchasable = get(atoms.isPurchasableFamily("prod_ga"));

    expect(isPurchasable).toBe(true);
  });

  it("returns false when temporal phase is before", () => {
    const panel = createMockPanelData({
      items: [
        {
          state: {
            temporal: { phase: "before" }, // ❌ Wrong time
            supply: { status: "available" },
            gating: { required: false },
          },
          commercial: { maxSelectable: 5 },
        },
      ],
    });

    const atoms = createPanelAtoms("test-event");
    const isPurchasable = get(atoms.isPurchasableFamily("prod_ga"));

    expect(isPurchasable).toBe(false);
  });

  it("returns false when supply status is none", () => {
    const panel = createMockPanelData({
      items: [
        {
          state: {
            temporal: { phase: "during" },
            supply: { status: "none" }, // ❌ Sold out
            gating: { required: false },
          },
          commercial: { maxSelectable: 5 },
        },
      ],
    });

    expect(get(atoms.isPurchasableFamily("prod_ga"))).toBe(false);
  });

  it("returns false when gating required but not satisfied", () => {
    const panel = createMockPanelData({
      items: [
        {
          state: {
            temporal: { phase: "during" },
            supply: { status: "available" },
            gating: { required: true, satisfied: false }, // ❌ Locked
          },
          commercial: { maxSelectable: 5 },
        },
      ],
    });

    expect(get(atoms.isPurchasableFamily("prod_ga"))).toBe(false);
  });

  it("returns false when maxSelectable is 0", () => {
    const panel = createMockPanelData({
      items: [
        {
          state: {
            temporal: { phase: "during" },
            supply: { status: "available" },
            gating: { required: false },
          },
          commercial: { maxSelectable: 0 }, // ❌ Clamped to zero
        },
      ],
    });

    expect(get(atoms.isPurchasableFamily("prod_ga"))).toBe(false);
  });

  // Test all four axes independently (each can veto purchasability)
});

describe("ctaKindFamily", () => {
  it("returns none when presentation is locked", () => {
    // Gate precedence test
    const panel = createMockPanelData({
      items: [
        {
          state: {
            gating: {
              required: true,
              satisfied: false,
              listingPolicy: "visible_locked",
            },
            demand: { kind: "waitlist" }, // Even with waitlist...
          },
        },
      ],
    });

    const atoms = createPanelAtoms("test-event");
    const cta = get(atoms.ctaKindFamily("prod_ga"));

    expect(cta).toBe("none"); // ...gate precedence means no CTA
  });

  it("returns waitlist when sold out with waitlist enabled", () => {
    const panel = createMockPanelData({
      items: [
        {
          state: {
            supply: { status: "none" },
            demand: { kind: "waitlist" },
            gating: { required: false },
          },
        },
      ],
    });

    expect(get(atoms.ctaKindFamily("prod_ga"))).toBe("waitlist");
  });
});

describe("quantityUIFamily (layout consistency rule)", () => {
  it("returns stepper for all items in full layout when any has max>1", () => {
    const panel = createMockPanelData({
      items: [
        { product: { id: "ga" }, commercial: { maxSelectable: 10 } }, // Multi
        { product: { id: "vip" }, commercial: { maxSelectable: 1 } }, // Single
      ],
    });

    const atoms = createPanelAtoms("test-event");

    // Both should show stepper (consistency rule)
    expect(get(atoms.quantityUIFamily("ga"))).toBe("stepper");
    expect(get(atoms.quantityUIFamily("vip"))).toBe("stepper"); // Even max=1
  });
});
```

### Integration Tests (Component Rendering)

**Goal**: Verify components correctly render derived state.

```typescript
describe("ProductRow", () => {
  it("shows quantity stepper when purchasable with max>1", () => {
    const panel = loadFixture("fixture-available.json");
    render(<ProductPanel eventId="test" />, { initialPanel: panel });

    expect(
      screen.getByRole("button", { name: "Increase quantity" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Decrease quantity" })
    ).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument(); // Initial qty
  });

  it("masks price when locked", () => {
    const panel = loadFixture("fixture-visible-locked.json");
    render(<ProductPanel eventId="test" />, { initialPanel: panel });

    expect(screen.queryByText(/\$\d+\.\d{2}/)).not.toBeInTheDocument(); // No price
    expect(screen.getByText("—")).toBeInTheDocument(); // Masked placeholder
    expect(screen.getByText("Requires access code")).toBeInTheDocument(); // Message
  });

  it("hides price when not purchasable", () => {
    const panel = createMockPanelData({
      items: [
        {
          state: {
            temporal: { phase: "before" }, // Not on sale yet
            supply: { status: "available" },
          },
          commercial: { price: { amount: 5000 } },
        },
      ],
    });

    render(<ProductRow productId="prod_ga" />);

    // Price should be hidden (not masked, just absent)
    expect(screen.queryByText("$50.00")).not.toBeInTheDocument();
  });

  it("shows waitlist CTA when sold out with waitlist", () => {
    const panel = loadFixture("fixture-sold-out-waitlist.json");
    render(<ProductPanel eventId="test" />, { initialPanel: panel });

    expect(
      screen.getByRole("button", { name: "Join Waitlist" })
    ).toBeInTheDocument();
    expect(screen.getByText("Sold Out")).toBeInTheDocument();
  });
});

describe("PanelActionButton", () => {
  it("shows singular label in compact layout with max=1", () => {
    const panel = createMockPanelData({
      items: [{ commercial: { maxSelectable: 1 } }],
    });

    render(<PanelActionButton />);
    expect(screen.getByText("Get Ticket")).toBeInTheDocument(); // Singular
  });

  it("shows plural label in compact layout with max>1", () => {
    const panel = createMockPanelData({
      items: [{ commercial: { maxSelectable: 6 } }],
    });

    render(<PanelActionButton />);
    expect(screen.getByText("Get Tickets")).toBeInTheDocument(); // Plural
  });

  it("uses clientCopy override when provided", () => {
    const panel = createMockPanelData({
      context: { clientCopy: { panel_action_button_cta: "Buy Now" } },
      items: [{ commercial: { maxSelectable: 1 } }],
    });

    render(<PanelActionButton />);
    expect(screen.getByText("Buy Now")).toBeInTheDocument(); // Override
  });
});
```

### E2E Tests (User Flows)

**Goal**: Validate complete workflows from user action to final state.

```typescript
describe("Access code unlock flow", () => {
  it("unlocks hidden items when valid code entered", async () => {
    // Step 1: Initial state (hidden items)
    mockServerResponse(
      "/api/panel/test-event",
      loadFixture("fixture-omit-until-unlock.json")
    );

    const { user } = render(<ProductPanel eventId="test-event" />);

    // Verify initial state
    expect(screen.queryByText("VIP Pass")).not.toBeInTheDocument(); // Hidden
    expect(
      screen.getByText("Enter access code to view tickets")
    ).toBeInTheDocument();

    // Step 2: User enters code
    const input = screen.getByPlaceholderText("Enter access code");
    await user.type(input, "VALID123");
    await user.click(screen.getByRole("button", { name: "Apply Code" }));

    // Step 3: Mock successful unlock
    mockServerResponse(
      "/api/panel/unlock",
      loadFixture("fixture-unlocked-vip.json")
    );

    // Step 4: Verify new item appears
    await waitFor(() => {
      expect(screen.getByText("VIP Pass")).toBeInTheDocument();
    });

    // Step 5: Verify state updated
    expect(screen.queryByText("Enter access code")).not.toBeInTheDocument(); // Notice removed
  });

  it("shows error when invalid code entered", async () => {
    mockServerResponse(
      "/api/panel/unlock",
      loadFixture("fixture-invalid-code-error.json")
    );

    const { user } = render(<ProductPanel eventId="test-event" />);

    await user.type(
      screen.getByPlaceholderText("Enter access code"),
      "INVALID"
    );
    await user.click(screen.getByRole("button", { name: "Apply Code" }));

    await waitFor(() => {
      expect(
        screen.getByText("Invalid access code. Please try again.")
      ).toBeInTheDocument();
      expect(screen.getByRole("alert")).toBeInTheDocument(); // Error notice
    });
  });
});

describe("Quantity selection and pricing refresh", () => {
  it("updates pricing when quantity changes", async () => {
    const { user } = render(<ProductPanel eventId="test-event" />);

    // Initial: no selection, $0 total
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("$0.00")).toBeInTheDocument();

    // User selects 2 tickets
    const increaseButton = screen.getByRole("button", {
      name: "Increase quantity",
    });
    await user.click(increaseButton);
    await user.click(increaseButton);

    // Mock server refresh response (after debounce)
    mockServerResponse("/api/panel/refresh", {
      ...panel,
      pricing: {
        lineItems: [
          { code: "TICKETS", label: "Tickets", amount: { amount: 10000 } },
          { code: "FEES", label: "Fees", amount: { amount: 1200 } },
          { code: "TOTAL", label: "Total", amount: { amount: 11200 } },
        ],
      },
    });

    // Verify pricing updated
    await waitFor(() => {
      expect(screen.getByText("$112.00")).toBeInTheDocument();
    });
  });
});
```

### 7.4 Test Coverage Matrix

**What to test** (organized by contract section):

| Area                 | Unit Tests                               | Integration Tests            | E2E Tests                         |
| -------------------- | ---------------------------------------- | ---------------------------- | --------------------------------- |
| **Purchasability**   | All 4 axes independently                 | Row shows/hides controls     | N/A                               |
| **CTA selection**    | Gate precedence, demand fallback         | Correct button appears       | Waitlist/notify modals open       |
| **Price visibility** | Locked=masked, !purchasable=hidden       | Price element present/absent | N/A                               |
| **Quantity UI**      | Layout consistency rule                  | Stepper vs. select rendering | Selection persists across refresh |
| **Access codes**     | Atom visibility logic                    | AccessCodeCTA appears        | Unlock flow (valid/invalid)       |
| **Pricing refresh**  | N/A (integration concern)                | Footer updates on selection  | Debounced server calls            |
| **Layout modes**     | Compact/full detection                   | Welcome text adaptive        | N/A                               |
| **Messages**         | Priority sorting, template interpolation | Correct placement rendering  | N/A                               |

### 7.8 Canonical Fixtures

**Purpose**: Named fixtures provide shared vocabulary for team communication and ensure implementation covers all major states.

Create and snapshot these six fixtures in `tests/fixtures/`:

#### 1. `fixture-available.json`

**What it tests**: Happy path - on sale, stock available, all axes allow purchase.

```jsonc
{
  "context": {
    /* standard orderRules, no gating */
  },
  "sections": [{ "id": "main", "label": "Tickets", "order": 1 }],
  "items": [
    {
      "product": {
        "id": "prod_ga",
        "name": "General Admission",
        "type": "ticket"
      },
      "state": {
        "temporal": { "phase": "during", "reasons": [] },
        "supply": { "status": "available", "remaining": 50, "reasons": [] },
        "gating": {
          "required": false,
          "satisfied": true,
          "listingPolicy": "omit_until_unlocked",
          "reasons": []
        },
        "demand": { "kind": "none", "reasons": [] },
        "messages": []
      },
      "commercial": {
        "price": {
          "amount": 5000,
          "currency": { "code": "USD", "base": 10, "exponent": 2 },
          "scale": 2
        },
        "feesIncluded": false,
        "maxSelectable": 10
      },
      "display": { "badges": ["Popular"], "showLowRemaining": false }
    }
  ],
  "pricing": {
    "currency": { "code": "USD", "base": 10, "exponent": 2 },
    "lineItems": []
  }
}
```

**Proves**: Purchasable derivation, quantity stepper enabled, price shown, PanelActionButton enabled.

#### 2. `fixture-sold-out-waitlist.json`

**What it tests**: Sold out state with waitlist CTA.

```jsonc
{
  "items": [
    {
      "state": {
        "temporal": { "phase": "during", "reasons": [] },
        "supply": { "status": "none", "reasons": ["sold_out"] },
        "gating": {
          "required": false,
          "satisfied": true,
          "listingPolicy": "omit_until_unlocked",
          "reasons": []
        },
        "demand": { "kind": "waitlist", "reasons": ["waitlist_available"] },
        "messages": [
          {
            "code": "sold_out",
            "text": "Sold Out",
            "placement": "row.under_quantity",
            "priority": 100
          }
        ]
      },
      "commercial": { "maxSelectable": 0 }
    }
  ]
}
```

**Proves**: CTA selection (waitlist), price hidden (not purchasable), quantity UI hidden, PanelActionButton becomes "Join Waitlist".

#### 3. `fixture-visible-locked.json`

**What it tests**: Gated item with visible_locked policy.

```jsonc
{
  "items": [
    {
      "product": { "id": "prod_vip", "name": "VIP Pass", "type": "ticket" },
      "state": {
        "temporal": { "phase": "during", "reasons": [] },
        "supply": { "status": "available", "reasons": [] },
        "gating": {
          "required": true,
          "satisfied": false,
          "listingPolicy": "visible_locked",
          "reasons": ["requires_code"]
        },
        "demand": { "kind": "none", "reasons": [] },
        "messages": [
          {
            "code": "requires_code",
            "text": "Requires access code",
            "placement": "row.under_title",
            "priority": 80
          }
        ]
      },
      "commercial": {
        "price": {
          "amount": 9000,
          "currency": { "code": "USD", "base": 10, "exponent": 2 },
          "scale": 2
        },
        "maxSelectable": 0
      },
      "display": { "badges": ["Members"], "showLowRemaining": false }
    }
  ]
}
```

**Proves**: Presentation=locked, price masked, quantity UI hidden, CTA=none (gate precedence), AccessCodeCTA appears.

#### 4. `fixture-omit-until-unlock.json`

**What it tests**: Hidden gated items with zero-leak hint.

```jsonc
{
  "items": [], // All gated items omitted
  "context": {
    "gatingSummary": { "hasHiddenGatedItems": true },
    "panelNotices": [
      {
        "code": "requires_code_entry",
        "icon": "lock",
        "title": "Have an access code?",
        "description": "Enter your code below to unlock exclusive tickets.",
        "priority": 100
      }
    ]
  }
}
```

**Proves**: No row placeholders, only boolean hint, inline access form notice renders, AccessCodeCTA logic.

#### 5. `fixture-public-sold-hidden-gated.json`

**What it tests**: Critical edge case - public items sold out but hidden gated inventory exists.

```jsonc
{
  "items": [
    {
      "product": { "id": "prod_ga", "name": "General Admission" },
      "state": {
        "supply": { "status": "none", "reasons": ["sold_out"] },
        "messages": [
          {
            "code": "sold_out",
            "text": "Sold Out",
            "placement": "row.under_quantity"
          }
        ]
      },
      "commercial": { "maxSelectable": 0 }
    }
  ],
  "context": {
    "gatingSummary": { "hasHiddenGatedItems": true },
    "panelNotices": [
      {
        "code": "requires_code",
        "text": "Enter access code to view tickets",
        "priority": 90
      }
    ]
  }
}
```

**Proves**: NO "Event Sold Out" finale shown (would be misleading), access code prompt appears instead, user guided to unlock.

#### 6. `fixture-payment-plan.json`

**What it tests**: Panel notice rendering (not per-row badge).

```jsonc
{
  "context": {
    "effectivePrefs": { "displayPaymentPlanAvailable": true },
    "panelNotices": [
      {
        "code": "payment_plan_available",
        "variant": "info",
        "icon": "credit-card",
        "title": "Payment Plans Available",
        "description": "Split your purchase into installments at checkout.",
        "priority": 50
      }
    ]
  }
}
```

**Proves**: Panel notice renders at top (not per-row), priority sorting, no auto-banners from prefs alone.

### Fixture Usage in Tests

```typescript
import availableFixture from "./fixtures/fixture-available.json";
import soldOutWaitlistFixture from "./fixtures/fixture-sold-out-waitlist.json";

describe("Canonical state rendering", () => {
  it("renders available state correctly", () => {
    render(<ProductPanel eventId="test" />, {
      initialPanel: PanelDataSchema.parse(availableFixture),
    });

    // Verify all expected UI elements per fixture
    expect(screen.getByText("General Admission")).toBeInTheDocument();
    expect(screen.getByText("$50.00")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Increase quantity" })
    ).toBeInTheDocument();
  });
});
```

**Benefits**:

- Shared fixtures = team speaks same language ("test with sold-out-waitlist fixture")
- Validates complete payloads (not partial mocks)
- Easy to add new fixtures for edge cases
- Fixtures serve as documentation (example payloads)

  ***

  8. Quick Reference

  8.1 Purchasability Formula (One-Liner)

  isPurchasable =
  temporal.phase === "during" &&
  supply.status === "available" &&
  (!gating.required || gating.satisfied) &&
  maxSelectable > 0;

### Purchasability Truth Table

All four conditions must be true. Any single failure makes item non-purchasable.

| temporal.phase | supply.status | Gate OK? | maxSelectable | isPurchasable | Reason                          |
| -------------- | ------------- | -------- | ------------- | ------------- | ------------------------------- |
| `during`       | `available`   | ✅       | `> 0`         | **true**      | All conditions met              |
| `before`       | `available`   | ✅       | `> 0`         | false         | Wrong time (not on sale yet)    |
| `after`        | `available`   | ✅       | `> 0`         | false         | Sales ended                     |
| `during`       | `none`        | ✅       | `> 0`         | false         | Sold out                        |
| `during`       | `unknown`     | ✅       | `> 0`         | false         | Status indeterminate            |
| `during`       | `available`   | ❌       | `> 0`         | false         | Gate not satisfied (locked)     |
| `during`       | `available`   | ✅       | `0`           | false         | Server clamp prevents selection |

**Key insight**: Each axis can independently veto purchasability. Test them separately to ensure orthogonality.

8.2 CTA Decision Tree

presentation === "locked"?
→ none

isPurchasable?
→ quantity (enabled if maxSelectable > 0)

supply.status === "none" && demand.kind === "waitlist"?
→ waitlist

temporal.phase === "before" && demand.kind === "notify_me"?
→ notify

else:
→ none

8.3 Price/Quantity Visibility Matrix

| Locked? | Purchasable? | Price  | Quantity       |
| ------- | ------------ | ------ | -------------- |
| ✅      | —            | Masked | Hidden         |
| ❌      | ✅           | Shown  | Select/Stepper |
| ❌      | ❌           | Hidden | Hidden         |

### Why Hide Price When Not Purchasable?

**Policy**: Price is shown **only** when purchasable (except masked for locked rows).

**Rationale**: Displaying a price for something you cannot buy creates psychological "tease" and "anchor" effects:

- **User confusion**: "Why show it if I can't buy it?"
- **Frustration**: Users fixate on unavailable price, feel misled
- **False signals**: Price implies actionability; showing it without action is dishonest

**By hiding price when not purchasable**:

- Clear, honest signals: if you see a price, you can act on it
- Locked rows use masking (not hiding) to preserve gating UX
- Sold-out rows show status message, not price
- Before-sale rows show timing message, not price

**Examples**:

```typescript
// ✅ Purchasable: show price
temporal.phase="during" + supply.status="available" + gate satisfied
→ priceUI="shown" → Display "$50.00"

// ❌ Sold out: hide price (not mask)
supply.status="none"
→ priceUI="hidden" → Show "Sold Out" message instead

// 🔒 Locked: mask price (preserve gating UX)
gating.required=true + satisfied=false + listingPolicy="visible_locked"
→ priceUI="masked" → Display "—" or "Locked" placeholder

// ⏰ Not on sale yet: hide price
temporal.phase="before"
→ priceUI="hidden" → Show "On sale Fri 10 AM" message instead
```

**Exception**: Locked rows mask (don't hide) to communicate "this item exists but requires access" without leaking exact price to unauthorized users.

8.4 Reason Code Registry (Comprehensive)

**Remember**: Codes are machine facts. They never render by themselves. User-facing text comes from `state.messages[]` or `context.panelNotices[]`.

### Temporal Codes (Axis: `state.temporal.reasons[]`)

| Code             | Meaning (Machine Fact)                      | Typical Surface                       | Example Text                    |
| ---------------- | ------------------------------------------- | ------------------------------------- | ------------------------------- |
| `outside_window` | Not on sale yet; phase=`before`             | Row message under title               | "On sale Friday 10:00 AM CT"    |
| `sales_ended`    | Sale window closed; phase=`after`           | Row message under title               | "Sales ended"                   |
| `sales_end_soon` | Sale ending soon (server threshold)         | Row message (warning) or panel notice | "Sales end tonight at 11:59 PM" |
| `on_sale_at`\*   | Preformatted sale start time (message-only) | Row message under title               | "On sale Fri 10:00 AM CT"       |

\*`on_sale_at` is a **message code** (not axis reason). Server supplies `text` directly; no template needed.

### Supply Codes (Axis: `state.supply.reasons[]`)

| Code              | Meaning (Machine Fact)            | Typical Surface            | Visual Treatment                       |
| ----------------- | --------------------------------- | -------------------------- | -------------------------------------- |
| `sold_out`        | No stock remaining; status=`none` | Row message under quantity | "Sold Out" (info variant)              |
| `remaining_low`\* | Low stock urgency (message-only)  | Row message under quantity | "Only {count} left!" (warning variant) |

\*`remaining_low` is a **message code** resolved via `copyTemplates` with `{count}` param. Use `display.showLowRemaining=true` for urgency styling.

**Note**: `supply.status` is authoritative. Never infer "sold out" from `remaining=0`; only use `status="none"`.

### Gating Codes (Axis: `state.gating.reasons[]` + notices)

| Code             | Meaning (Machine Fact)                      | Typical Surface                    | Visual Treatment                 |
| ---------------- | ------------------------------------------- | ---------------------------------- | -------------------------------- |
| `requires_code`  | Access gate present, not satisfied          | Locked row message OR panel notice | 🔒 Lock icon, grey/muted styling |
| `invalid_code`\* | Last unlock attempt failed (notice-only)    | Panel notice (error variant)       | ⚠️ Alert icon, red banner        |
| `unlocked`\*     | Gate satisfied (celebratory copy, optional) | Row message under title            | ✓ Check icon, normal styling     |

\*`invalid_code`/`unlocked` are **message/notice codes** only. Access validation is server-side; no requirement to add them to axis `reasons[]`.

### Demand Codes (Axis: `state.demand.reasons[]`)

| Code                 | Meaning (Machine Fact)         | Typical Surface       | Notes                  |
| -------------------- | ------------------------------ | --------------------- | ---------------------- |
| `waitlist_available` | Waitlist enabled for this item | Row CTA label message | Label: "Join Waitlist" |
| `notify_available`   | Notify-me enabled (pre-sale)   | Row CTA label message | Label: "Notify Me"     |

**Gating precedence**: If `gating.required && !satisfied`, demand CTAs MUST NOT surface until unlocked (prevents leakage).

### Panel-Level Notice Codes (Context: `panelNotices[].code`)

| Code                     | Meaning                         | Notice Type                   | When to Use                                            |
| ------------------------ | ------------------------------- | ----------------------------- | ------------------------------------------------------ |
| `requires_code`          | Event has gated inventory       | Standard text                 | Mixed scenarios (some public, some gated)              |
| `requires_code_entry`    | Prominent access gate           | **Specialized** (inline form) | Gated-only (no visible purchasable items)              |
| `event_sold_out`         | All visible inventory gone      | Standard text                 | When `allSoldOut=true` AND `hasHiddenGatedItems=false` |
| `payment_plan_available` | Payment plans exist at checkout | Standard text                 | Order-level concept; NEVER per-row badge               |
| `sales_end_soon`         | Event-wide urgency              | Standard text                 | Server decides threshold                               |

**Critical**: If public items sold out BUT `hasHiddenGatedItems=true`, use `requires_code` (not `event_sold_out`) to avoid misleading users.

### Visual Treatment Reference

| Code             | Icon       | Styling                         | Variant |
| ---------------- | ---------- | ------------------------------- | ------- |
| `requires_code`  | 🔒 Lock    | Grey/muted                      | info    |
| `invalid_code`   | ⚠️ Alert   | Red border                      | error   |
| `unlocked`       | ✓ Check    | Normal                          | neutral |
| `sold_out`       | —          | Normal                          | info    |
| `remaining_low`  | ⚡ Urgency | Attention-grabbing (pulse/bold) | warning |
| `sales_end_soon` | ⏰ Clock   | Attention-grabbing              | warning |

### Client-Triggered Validation Codes (Context: `clientCopy` keys)

| Key                     | Purpose                                        | When Used                                               |
| ----------------------- | ---------------------------------------------- | ------------------------------------------------------- |
| `selection_min_reached` | User tried checkout without required selection | Validate against `orderRules.minSelectedTypes`          |
| `selection_max_types`   | User tried to select > allowed ticket types    | Validate against `orderRules.typesPerOrder`             |
| `quantity_min_reached`  | User set quantity below minimum for type       | Validate against `orderRules.minTicketsPerSelectedType` |
| `quantity_max_reached`  | User tried to exceed maxSelectable             | Clamp to `commercial.maxSelectable`                     |
| `addon_requires_parent` | Add-on selected without parent ticket          | Check `relations.parentProductIds`                      |

**Usage**: Client interpolates params (e.g., `{max}`, `{min}`) from current runtime values into server-provided template strings.

### Quick Lookup Table

**Need to show "Sold Out"?** → Check `supply.status="none"` + render `state.messages[]` with `code="sold_out"`

**Need to show "Requires code"?** → Check `gating.required && !satisfied` + render message OR show AccessCodeCTA

**Need waitlist button?** → Check `demand.kind="waitlist"` + render CTA (respects gate precedence)

**Need panel banner?** → Server must send `context.panelNotices[]` entry; never invent

8.5 Key Atoms Reference

| Atom                   | Purpose                | Returns                      |
| ---------------------- | ---------------------- | ---------------------------- | ---- |
| panelDataAtom          | Server payload         | PanelData                    | null |
| selectionAtom          | User selections        | Map<productId, qty>          |
| itemPresentationAtom   | Locked/normal per item | Map<productId, Presentation> |
| itemPurchasabilityAtom | Can buy? per item      | Map<productId, boolean>      |
| itemCTAAtom            | CTA kind per item      | Map<productId, CTA>          |
| panelActionButtonAtom  | Main button state      | { kind, enabled, label }     |
| accessCodeCTAAtom      | Show unlock UI?        | boolean                      |

8.6 Server Refresh Triggers

Understanding when to refresh (and when not to) prevents excessive server calls and maintains responsive UI.

### MUST Refresh (Business State Changes)

| Trigger                              | Debounce  | Why                                                                   |
| ------------------------------------ | --------- | --------------------------------------------------------------------- |
| User changes item quantity           | 300ms     | Server recalculates pricing, fees, taxes, maxSelectable for all items |
| User applies access code             | Immediate | Server validates, returns new items or unlocks visible-locked items   |
| User applies discount code           | Immediate | Server recalculates pricing with discount applied                     |
| Server pushes update (WebSocket/SSE) | N/A       | Real-time inventory/pricing sync                                      |
| Time-based transition (polling)      | 30s-60s   | Sale window opens/closes (if not using WebSocket)                     |

**Debouncing strategy**:

- Quantity changes: 300ms idle (user stops clicking +/− → then call server)
- Prevents 10 rapid clicks = 10 server calls
- Provides instant UI feedback (optimistic update) while batching server calls

### MUST NOT Refresh (Pure UI Events)

| Non-Trigger                | Why Not                                                             |
| -------------------------- | ------------------------------------------------------------------- |
| Expand/collapse sections   | Pure UI state; no business logic changes                            |
| Hover badges/tooltips      | Progressive disclosure; no data changes                             |
| Client validation errors   | Max quantity warnings, min selection errors - local validation only |
| Rendering/scrolling events | Performance (would spam server)                                     |
| Opening/closing modals     | UI state; no selection changes                                      |

### While Awaiting Refresh (Loading States)

**DO** (maintains responsive UX):

```typescript
// Keep displaying previous pricing
<PricingFooter pricing={lastValidPricing} />;

// Show subtle "updating" indicator only if >500ms
{
  isRefreshing && elapsedTime > 500 && (
    <div className="pricing-updating">
      <Spinner size="small" />
    </div>
  );
}
```

**DON'T** (creates jarring UX):

```typescript
// ❌ Never flash empty state during refresh
{
  isRefreshing ? <LoadingSpinner /> : <PricingFooter />;
}

// ❌ Never block UI during refresh
<div className={isRefreshing ? "disabled" : ""}>...</div>;

// ❌ Never show immediate spinner (<500ms feels sluggish)
{
  isRefreshing && <Spinner />;
}
```

**Principle**: Previous state is better than no state. Show loading indicators only for extended waits (>500ms).

8.7 Validation Checklist

Before rendering, ensure:

- Root payload has exactly 4 keys: context, sections, items, pricing
- All product.id are unique
- All commercial.price.currency.code match pricing.currency.code
- No items with listingPolicy="omit_until_unlocked" and unsatisfied gates
- All messages[].placement are valid enum values
- All money is Dinero snapshots (no raw numbers)
- Sections array has at least one element

  8.8 Accessibility Requirements

- All form fields have accessible labels
- Validation errors announced with role="alert"
- No positive tabIndex values
- Semantic HTML elements used (not div with role)
- Images have meaningful alt text
- Keyboard navigation works for all controls

---

## 8.9 Layout Modes & Quantity UI Rules

**Purpose**: Define when to render compact vs. full layouts, and establish normative quantity UI consistency rules that prevent user confusion.

### Layout Detection Matrix

The client chooses presentation mode based on payload structure:

| Condition                                   | Layout          | Description                                      |
| ------------------------------------------- | --------------- | ------------------------------------------------ |
| `items.length === 1`                        | **Compact**     | Single product display (card-based, streamlined) |
| `items.length > 1`                          | **Full**        | Multiple products (row-based list with sections) |
| `items.length === 0 && hasHiddenGatedItems` | **Gated-entry** | Not a product layout; access code entry screen   |

### Compact Layout

**When**: Single item in `items[]` array

**Visual structure**:

1. **Panel header** (title, close button)
2. **PanelNoticeArea** (stacked notices, priority-ordered)
3. **Welcome text**
   - From `context.welcomeText` (if provided)
   - OR state-adaptive default (see below)
4. **Product card** (full-width, prominent)
   - Left: Product name, price, consolidated messages
   - Right (conditional): Quantity stepper (only if `maxSelectable > 1`)
5. **Pricing footer** (conditional)
   - Shown if `maxSelectable > 1`
   - May be omitted if `maxSelectable === 1`
6. **PanelActionButton** (full-width)
7. **AccessCodeCTA** (when applicable)

### Compact Variations

**A) Minimal compact (single ticket, implicit qty=1)**:

```typescript
items.length === 1 && maxSelectable === 1;
```

**UI**:

- Product card: name + price (left only, no right side)
- NO quantity stepper (implicit qty=1)
- Pricing footer: **Optional** (may be omitted)
- PanelActionButton: "Get Ticket" (singular)

**Example**: Simple event admission - user just clicks "Get Ticket", proceeds directly to checkout with qty=1.

**B) Compact with quantity (multiple tickets available)**:

```typescript
items.length === 1 && maxSelectable > 1;
```

**UI**:

- Product card: name + price (left), quantity stepper (right)
- Pricing footer: **Required** (updates as qty changes)
- PanelActionButton: "Get Tickets" (plural)

**Example**: GA tickets with max=6 - user adjusts quantity, sees total update, clicks "Get Tickets".

**C) Gated-only (no items, access code entry)**:

```typescript
items.length === 0 && gatingSummary.hasHiddenGatedItems === true;
```

**UI**:

- **Cannot use compact product layout** (no product exists)
- Render gated-entry screen:
  - Prominent `requires_code_entry` notice with inline form
  - Welcome text: "Access code required to view tickets"
  - PanelActionButton disabled
  - No product card

**Example**: Presale with all items gated - user sees prominent code entry form as primary affordance.

### Full Layout

**When**: Multiple items in `items[]` array

**Visual structure**:

1. Panel header
2. PanelNoticeArea (same as compact)
3. Welcome text (optional, less prominent than compact)
4. Section headers + product rows (grouped by `display.sectionId`)
5. **ALL rows have consistent quantity UI** (see consistency rule below)
6. Pricing footer (always shown)
7. PanelActionButton (always plural label)
8. AccessCodeCTA (when applicable)

### Quantity UI Consistency Rule (Normative)

**Critical rule for full layout**: Prevents user confusion about interaction patterns.

**IF** any item has `commercial.maxSelectable > 1`:

- **THEN** ALL items MUST display quantity **steppers** (even items with `maxSelectable === 1`)
- Items with `maxSelectable === 1` show stepper constrained to 0-1 range

**ELSE** (all items have `maxSelectable === 1`):

- **THEN** ALL items display simple "Add" button or single-select affordance

**Why this rule?**

- **Visual consistency**: Mixed UI (some steppers, some buttons) creates confusion
- **User expectation**: "Why does this row have +/− but that row doesn't?"
- **Interaction model**: Consistent controls = users learn once, apply everywhere

**Implementation**:

```typescript
function deriveQuantityUI(
  item: PanelItem,
  panelContext: { isFullLayout: boolean; anyItemMultiQty: boolean }
): "hidden" | "select" | "stepper" {
  if (presentation !== "normal" || !isPurchasable || maxSelectable <= 0) {
    return "hidden";
  }

  // Full layout consistency rule
  if (panelContext.isFullLayout && panelContext.anyItemMultiQty) {
    return "stepper"; // Even if this specific item's maxSelectable === 1
  }

  // Standard per-row derivation (compact layout or all-single full layout)
  return maxSelectable === 1 ? "select" : "stepper";
}
```

**Examples**:

**Full layout - all single qty**:

- GA: `maxSelectable=1` → "Add" button
- VIP: `maxSelectable=1` → "Add" button
- Consistent: all buttons, no steppers

**Full layout - mixed quantities**:

- GA: `maxSelectable=10` → Stepper (-, 0, +)
- VIP: `maxSelectable=1` → **Stepper** constrained to 0-1 (consistency)
- Consistent: all steppers, even though VIP limited to 1

**Full layout - all multi qty**:

- GA: `maxSelectable=10` → Stepper max 10
- VIP: `maxSelectable=6` → Stepper max 6
- Consistent: all steppers with different caps

### State-Adaptive Welcome Text

When `context.welcomeText` is omitted, client derives default based on panel state:

```typescript
const panelButtonState = get(atoms.panelActionButtonAtom);
const welcomeKey = {
  checkout: "welcome_default",
  waitlist: "welcome_waitlist",
  notify_me: "welcome_notify_me",
}[panelButtonState.kind];

const welcomeText =
  context.welcomeText || // Server override takes precedence
  context.clientCopy?.[welcomeKey] || // clientCopy override
  defaultFallbacks[panelButtonState.kind]; // Atom default
```

**Default fallbacks** (hardcoded in atom as last resort):

| Panel State      | Default Welcome Text                                                                    |
| ---------------- | --------------------------------------------------------------------------------------- |
| kind="checkout"  | "Welcome! To join the event, please get your ticket below."                             |
| kind="waitlist"  | "This event is sold out. Join the waitlist to be notified if tickets become available." |
| kind="notify_me" | "Tickets aren't on sale yet. Get notified when they're available."                      |

**Precedence**: `context.welcomeText` (highest) → `clientCopy.welcome_*` → atom default (fallback)

### Message Consolidation in Compact Mode

**Full layout**: Messages render at their declared placements (`row.under_title`, `row.under_quantity`, etc.)

**Compact layout**: All row message placements consolidate into unified zone under price:

**Placement mapping**:

- `row.under_title` → Under product name (above price)
- `row.under_price` → Primary message zone (under price)
- `row.under_quantity` → Same zone (no separate quantity area in minimal compact)
- `row.footer` → Same zone
- `row.cta_label` → Not used (PanelActionButton handles labels)

**Rendering strategy**:

1. Group all messages by priority (descending)
2. Render in consolidated zone under price
3. Apply variant styling per message
4. Stack vertically with spacing

**Example** (compact with multiple messages):

```
General Admission
$50.00

⏰ On sale Friday at 10:00 AM CT (priority: 90)
⚠️ Only 3 tickets available (priority: 80)

[Notify Me]
```

### Layout Decision Examples

**Example 1: Single Type, Single Ticket**

```jsonc
{ "items": [{ "commercial": { "maxSelectable": 1 } }] }
```

→ **Minimal compact** (no qty stepper, singular CTA, footer optional)

**Example 2: Single Type, Multi Ticket**

```jsonc
{ "items": [{ "commercial": { "maxSelectable": 6 } }] }
```

→ **Compact with quantity** (stepper on right, plural CTA, footer required)

**Example 3: Multi Type, All Single**

```jsonc
{
  "items": [
    { "product": { "id": "ga" }, "commercial": { "maxSelectable": 1 } },
    { "product": { "id": "vip" }, "commercial": { "maxSelectable": 1 } }
  ]
}
```

→ **Full layout** with "Add" buttons (no steppers, all max=1)

**Example 4: Multi Type, Mixed Quantities**

```jsonc
{
  "items": [
    { "product": { "id": "ga" }, "commercial": { "maxSelectable": 10 } },
    { "product": { "id": "vip" }, "commercial": { "maxSelectable": 1 } }
  ]
}
```

→ **Full layout** with steppers on ALL rows (even VIP with max=1, for consistency)

### Edge Cases in Compact Layout

**Sold out with waitlist**:

- Layout: Compact (1 item)
- Price: Hidden (not purchasable)
- Quantity: Hidden (maxSelectable=0)
- Welcome: Waitlist variant ("This event is sold out...")
- PanelActionButton: kind="waitlist", "Join Waitlist" (enabled)

**Locked visible**:

- Layout: Compact (1 item)
- Price: Masked ("—" or "Locked")
- Quantity: Hidden
- Messages: "Requires access code" in consolidated zone
- PanelActionButton: kind="checkout", disabled
- AccessCodeCTA: Shown below button

**Not on sale yet**:

- Layout: Compact (maxSelectable > 1 in state, but not purchasable yet)
- Price: Hidden (temporal.phase=before)
- Quantity: Hidden
- Messages: "On sale Friday at 10:00 AM CT"
- PanelActionButton: kind="notify_me", "Notify Me" (enabled)

### Implementation Checklist

- [ ] Detect compact vs. full based on `items.length`
- [ ] In compact minimal, hide quantity stepper and pricing footer
- [ ] In compact with quantity, show stepper on right and pricing footer
- [ ] In full layout, enforce consistency rule (all steppers if any max>1)
- [ ] Update `quantityUIFamily` atom to check panel context
- [ ] Derive welcome text from panelActionButtonAtom state when not provided
- [ ] Consolidate message placements in compact mode
- [ ] PanelActionButton uses singular/plural based on layout and maxSelectable

---

8.10 Performance Patterns

Debouncing:

```typescript
// Quantity changes debounced 300ms before server call
const debouncedRefresh = debounce(refreshPricing, 300);
```

Optimistic Updates:

```typescript
// Update selection atom immediately for instant feedback
updateSelection({ productId, quantity });
// Then refresh from server (debounced)
```

Loading States:

```typescript
// Keep displaying previous pricing during refresh
// Show subtle "updating" indicator if > 500ms
// Never flash empty state
```

8.11 Error Handling Patterns

Validation Errors (strict mode):

```typescript
try {
  const validated = PanelDataSchema.parse(serverData);
} catch (error) {
  console.error("Validation failed:", error.format());
  throw new Error("Invalid panel data");
}
```

Currency Mismatch (fatal):

```typescript
if (item.commercial.price.currency.code !== pricing.currency.code) {
  throw new Error("Currency mismatch detected");
}
```

Fetch Errors (graceful):

```typescript
// Keep last valid state, show retry button
<PricingFooter pricing={lastValidPricing} />;
{
  isStale && <RetryButton onClick={refetch} />;
}
```

---

Appendix: Complete Type Definitions

// All schemas exported as TypeScript types
export type PanelData = z.infer<typeof PanelDataSchema>;
export type Context = z.infer<typeof ContextSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type Product = Item["product"];
export type ItemState = Item["state"];
export type Commercial = Item["commercial"];
export type Display = Item["display"];
export type Pricing = z.infer<typeof PricingSchema>;
export type DineroSnapshot = z.infer<typeof DineroSnapshotSchema>;
export type Message = ItemState["messages"][number];
export type PanelNotice = Context["panelNotices"][number];
export type OrderRules = Context["orderRules"];

// Derived UI states
export type Presentation = "normal" | "locked";
export type PriceUI = "hidden" | "masked" | "shown";
export type QuantityUI = "hidden" | "select" | "stepper";
export type CTA = {
kind: "none" | "quantity" | "waitlist" | "notify";
enabled?: boolean;
};
export type PanelActionButton = {
kind: "checkout" | "waitlist" | "notify_me";
enabled: boolean;
label: string;
};

---

Summary Checklist

Before shipping, verify:

**Architecture & Validation (§1.5, §2.8)**:

- [ ] Understand atomic deploy model (no version skew)
- [ ] Use `.strict()` validation on all schemas
- [ ] No `.default()` on business-meaningful fields
- [ ] Validate on both server (SSR) and client (hydration)
- [ ] Currency consistency validated on every payload
- [ ] Unique product IDs validated
- [ ] Fatal errors block rendering; graceful errors preserve state

**State Management (§3)**:

- [ ] Use `createPanelAtoms(eventId)` factory pattern
- [ ] Atoms scoped via Context provider
- [ ] atomFamily for per-item state (stable references)
- [ ] Components receive only IDs at collection boundaries
- [ ] Non-collection components have zero props
- [ ] Atoms derive from server data only (no business logic)

**Money & Pricing (§2.5, §4.7)**:

- [ ] All money is Dinero snapshots
- [ ] Choose formatting approach (with utils vs. direct)
- [ ] No client-side arithmetic beyond display formatting
- [ ] Pricing footer renders lineItems in exact server order
- [ ] No local computation of totals/fees/taxes

**Layout & Quantity UI (§8.9)**:

- [ ] Detect compact vs. full layout based on items.length
- [ ] Compact minimal (max=1): no stepper, singular CTA, footer optional
- [ ] Compact with quantity (max>1): stepper on right, footer required
- [ ] Full layout consistency: if ANY item max>1, ALL show steppers
- [ ] State-adaptive welcome text when context.welcomeText omitted

**Notices & CTAs (§4.3, §4.8)**:

- [ ] PanelNotices render two variants (standard text vs. requires_code_entry inline form)
- [ ] Notices sorted by descending priority
- [ ] PanelActionButton labels atom-driven (never hardcoded)
- [ ] Singular/plural context: compact max=1 vs. other cases
- [ ] clientCopy provides overrides; atom provides defaults

**Gating & Unlock (§6.2, §9)**:

- [ ] Access code submission goes to server (no client validation)
- [ ] Pre-unlock: show correct variant (gated-only vs. mixed)
- [ ] Post-unlock: handle success (new items) and error (error notice)
- [ ] Critical edge: public sold + hidden gated → NO "Event Sold Out" finale
- [ ] Unlock confirmation: show unlocked items even if sold out
- [ ] Gating precedence: locked items show no demand CTAs

**Rendering & Visibility (§5, §8.1-8.3)**:

- [ ] Price visibility: shown only when purchasable (except masked for locked)
- [ ] Price hidden (not masked) for sold-out/before-sale rows
- [ ] Quantity UI hidden when locked or not purchasable
- [ ] All four axes independently veto purchasability
- [ ] CTA decision tree: gate precedence → purchasable → waitlist → notify → none

**Messages & Copy (§3.4, §8.4)**:

- [ ] Components render server text verbatim (no invented strings)
- [ ] Message resolution: text or template interpolation; omit if neither
- [ ] Reason codes are machine facts (never render directly)
- [ ] Use comprehensive reason code registry for proper codes
- [ ] Client-triggered validation uses clientCopy templates

**Server Integration (§3.5, §8.6)**:

- [ ] Selection changes trigger debounced refresh (300ms)
- [ ] Server recalculates pricing + maxSelectable on every refresh
- [ ] Clamp selection down if server lowers maxSelectable
- [ ] Refresh on: quantity change, unlock, discount; NOT on: UI events, validation errors
- [ ] Keep previous state visible during refresh (>500ms → subtle indicator)

**Testing (§7.3, §7.8)**:

- [ ] Unit tests cover all four axes independently
- [ ] Integration tests verify component rendering from state
- [ ] E2E tests validate complete workflows (unlock, quantity, waitlist)
- [ ] All six canonical fixtures created and tested
- [ ] Fixtures: available, sold-out-waitlist, visible-locked, omit-until-unlock, public-sold-hidden-gated, payment-plan

---

End of Implementation Guide

**For full spec details**: product-panel-spec.md  
**For normative rule checklist**: product-panel-spec-rules.md  
**For 5-principle summary**: product-panel-normative-rules-5pro.md
