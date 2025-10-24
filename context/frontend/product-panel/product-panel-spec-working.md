# Product Panel Contract v0.3 (Greenfield, Multi-Axis)

## Purpose & Scope

This document specifies the **Product Panel Contract v0.3**—a JSON payload contract between the server-side pricing/availability engine and the client-side purchase panel UI.

**Core Principle**: The panel is **presentational only**. The server provides all authoritative state decisions (timing, availability, access, pricing, clamps). The client uses Jotai derived atoms to map these orthogonal server decisions into UI presentation states—no business logic, no schedule math, no price computation.

---

## Meeting Context: Issues & Decisions

The following sections (A-N) capture key decisions and edge cases discovered during product design meetings. They provide essential context for WHY the contract is structured as it is.

### A) Terminology & visibility

- **Avoid “inventory” in UI/contract.** Prefer “remaining” / “count”.
- **Show sold‑out ticket types.** Default behavior is to **display sold‑out rows as disabled/greyed**, not hidden. If the entire event is sold out and nothing purchasable remains, show compact “Event Sold Out” state; otherwise list types with a sold‑out indicator.
- **Gated but sold‑out edge case.** When access code unlocks a type that’s already sold out, still **show the type**, disabled, with sold‑out state (don’t make it disappear—avoid “did my code work?” confusion).
- **Disable/unpublish toggle.** Need a server‑side switch to fully **suppress** a product type from the panel without deleting it (unpublished/disabled).

### B) Status & state mapping

- **Inconsistency:** Spec uses both `soldOut` and `outOfStock`. Pick one machine value (recommend `outOfStock`) and map to “Sold Out” in copy.
- **`paused` vs `disabled` vs `unpublished`.** Clarify semantics:

  - `paused`: temporarily not purchasable but listed (shows “Sales Paused”).
  - `unpublished/disabled`: do **not** send to panel at all (row suppressed by server).

- **`approvalRequired`** is a legitimate state (CTA: Request to Join).
- **Whole‑event sold‑out vs per‑type sold‑out** needs distinct presentation.

### C) Gates / access codes

- **Default visibility:** gated items are **visible** but **locked** with price hidden until code is validated.
- **Access‑code limits & windows:** codes must support **max uses** and **validFrom / validTo**; surface relevant hints/reasons in panel (server authoritative).
- **Brute‑force protection:** rate limiting + Turnstile recommended (server concern; panel just shows rate‑limited/try‑later notice).
- **Interactions:**

  - Locked + 0 remaining + `demandCapture='none'` ⇒ show locked row, no waitlist.
  - Unlocked + 0 remaining + `demandCapture='waitlist'` ⇒ “Join Waitlist”.

### D) Add‑ons & relationships

- **“Addon” is not a product type.** Keep product types as `ticket | physical | digital`. Treat add‑ons as **products with relations**.
- **Two placements:**

  - **Sectioned**: appears in the “Add‑ons” section; quantity independent.
  - **Nested (children)**: appears under its parent selection; **quantity matches parent** (no per‑child stepper)—effectively a toggle that applies to each selected parent unit.

- **Requires expression** stays (`scope: 'selection' | 'ownership'`, `anyOf`, `allOf`).
- **Order‑level add‑ons** (e.g., parking passes “per car”) can be modeled as independent products in the Add‑ons section with their own quantity.
- **Scanning/redeem behavior** differs by product, so fulfillment needs to be explicit (see F).

### E) Limits & clamping

- **Authoritative clamp:** `commercial.maxSelectable` is the only clamp the panel honors.
- **Hints:** Use `remaining.count`, `limits.perOrder`, `limits.perUser` solely for copy (“Only N left”, “Max 6 per order”).
- **Prefer per‑order limits** for now; can mirror per‑user to per‑order unless fraud/abuse policy changes.

### F) Fulfillment / redemption

- Every product needs a **fulfillment** description for display hints and downstream scanning:

  - **Delivery**: `digital | physical_pickup | shipping`.
  - **Channels**: `email_qr | apple_pass | barcode | nfc` (array).
  - **Redemption contexts**: `entry | parking | merch_pickup | benefit` (array).
  - **Scan behavior**: `consumable | multi_use | view_only` (optional).

- Panel doesn’t compute any of this, but can show badges/hints (e.g., “Apple Wallet available”).

### G) Pricing, fees, taxes

- **Taxes ≠ fees.** Keep distinct lines.
- **Defaults & overrides:** system supports **per‑order** and **per‑line (line‑item)** fees; each can be **percent or absolute**; show which defaults apply on the ticket config screen; allow per‑type overrides.
- **Pricing summary**: server computes; the panel can show **simple (subtotal/fees/taxes/total)** or **detailed** breakdown.
- **Inclusive flags:** support `feesIncluded` and `taxesIncluded` booleans to alter presentation.
- **Payment plans:** don’t show schedule here; **badge** or microcopy “Payment plan available”.

### H) Schedules

- Keep **metadata only**: `currentWindow` and optional `nextWindow`; panel never computes.
- Long‑tail “weekends only” complexities live in the engine; the panel only shows the provided hints (“On sale Oct 30, 2:00 PM CT”).

### I) Variants & catalog

- Today: single default variant per product; keep `variant` for forward‑compat (seats/sections later).
- Don’t require `variant.name` for default variants; keep `variantAttributes` placeholder.
- **Prices are immutable**; new price object instead of editing.

### J) Sections & sort

- Keep two sections: **primary** and **add‑ons**.
- **Ordering of items**: default **alphabetical**, optional **featured‑first**; manual ordering later. Server decides and sends the order; panel renders as‑is.

### K) Preferences & copy

- Keep `effectivePrefs` merged on server.
- Remove/ignore `hideZeroInventoryVariants` (counter to “always show sold‑out types”).
- Keep `showTypeListWhenSoldOut = true` as default (covers gated‑sold‑out edge case).
- `ctaLabelOverrides` stays.

### L) Reason codes / notices

- Maintain a **code registry** (machine) plus optional `reasonTexts` (localized). Include codes for `outside_window`, `capacity_reached`, `requires_code`, `tenant_paused_sales`, `limit_reached`, `access_code_expired`, `access_code_maxed`, etc.

### M) Security/abuse & errors (panel-visible)

- Panel should be able to show: “Too many attempts, try later”, “Code expired”, “Code max uses reached”. All copy driven by reason codes/texts.

### N) Inconsistencies & minor nits in v0.2

- `commercial.status` table mixes `soldOut` (elsewhere) and `outOfStock` (in matrix).
- `remaining.remaining` is redundant naming; prefer `remaining.count`.
- `product.type` includes `addon`; meeting direction contradicts this.
- `variant.name` is set to product name in examples—confusing; should be optional/omitted for default variants.

### O) Schedule complexity

- **Decided against complex recurring schedules** (e.g., "weekends only for venue cover charges").
- Workaround: Create separate events/ticket types for complex time patterns rather than building schedule complexity into single ticket types.
- Keep panel schedule representation simple: `currentWindow` and `nextWindow` only.
- Engine complexity (recurring patterns, blackout dates, etc.) stays hidden; panel only displays pre-computed windows.

---

## 0) Why Greenfield Enables Clean Design

Starting from scratch allows us to avoid the compromises of migrating legacy code. Key improvements enabled by greenfield:

- **Delete** the one‑dimensional `commercial.status`.
- **Introduce** a **state vector** with five orthogonal axes: `temporal`, `inventory`, `access`, `admin`, `demandCapture`.
- **Keep server as authority** for money and clamps: `price`, `fees/taxes` (in `pricing.summary`), and `commercial.maxSelectable`.
- **Product types**: `ticket | physical | digital` (no `addon`, no `subscription`). Add a **fulfillment** object.
- **Naming**: banish "inventory" from field names — use **`remaining.count`**; **`showFeesHint`** (not `showFeesNote`).
- **Gates** live inside `state.access` (drop the old `gates` block).
- **Unpublished** items never get sent (server omits them).
- **Event-level sold out flag**: optional `context.eventAllOutOfStock` to explicitly signal compact sold-out mode when prefs require it.

---

## 1) Multi-Axis State Model (Replacing Single Status)

**Why axes?** Compressing multiple orthogonal dimensions (timing, inventory, access control, admin state, demand capture) into a single `status` string creates combinatorial explosion and makes business logic leak into the client.

Instead, the server provides **five independent axes**, each representing one dimension of truth. The client's Jotai derived atoms compose these axes into presentation states through pure view mapping—no schedule math, no price computation, no re-evaluation of business rules.

**Core principle**: Your panel is purely presentational; the engine delivers authoritative, orthogonal decisions. Jotai derived atoms map those inputs → view.

### State block structure (authoritative, server‑computed; no client math)

```jsonc
"state": {
  "temporal": {
    "phase": "before" | "during" | "after" | "expired",   // precomputed
    "currentWindow": { "startsAt": "...", "endsAt": "...", "reasonCode": "sale_window" } | null,
    "nextWindow":    { "startsAt": "...", "endsAt": "...", "reasonCode": "next_window" } | null,
    "reasons": ["outside_window"]                          // machine codes
  },
  "inventory": {
    "availability": "available" | "none" | "unknown",      // precomputed
    "remaining": { "count": 42, "perUser": 6, "perOrder": 8 },
    "reasons": ["capacity_reached"]                        // e.g., when none
  },
  "access": {
    "gated": true,                                         // product requires gates
    "satisfied": false,                                    // precomputed (server‑side check)
    "visibilityWhenGated": "visible" | "hidden",
    "requirements": [{
      "kind": "access_code",
      "satisfied": false,
      "validWindow": { "startsAt": "...", "endsAt": "..." },
      "limit": { "maxUses": 20, "usesRemaining": 5 }
    }],
    "reasons": ["requires_code","access_code_expired"]     // as applicable
  },
  "admin": {
    "state": "active" | "paused" | "unpublished",          // if 'unpublished', omit item entirely
    "approvalRequired": false,
    "reasons": ["tenant_paused_sales"]
  },
  "demandCapture": {
    "kind": "none" | "waitlist" | "notifyMe" | "backorder" // server decision
  }
}
```

**Notes on demand capture:**

- **`waitlist`**: User signs up for notification when capacity opens (e.g., cancellations). First N in queue get access code when available.
- **`notifyMe`**: User requests notification when sales begin (for events announced but not yet on sale). **Preferred delivery: SMS** (higher engagement than email for target demographic).
- **`backorder`**: User can purchase now, fulfilled when available (typically for physical products; not used for tickets currently).

---

## 2) Contract Snapshot (JSON Shape)

```jsonc
{
  "context": {
    "eventId": "evt_123",
    "displayTimezone": "America/Chicago",
    "locale": "en-US",
    "eventAllOutOfStock": false,
    "effectivePrefs": {
      "displayRemainingThreshold": 10,
      "showFeesHint": true,
      "showTypeListWhenSoldOut": true,
      "ctaLabelOverrides": {}
    }
  },
  "sections": [
    {
      "id": "primary",
      "label": "Get Tickets",
      "order": 1,
      "labelOverride": null
    },
    { "id": "addons", "label": "Add-ons", "order": 2, "labelOverride": null }
  ],
  "items": [
    {
      "product": {
        "id": "prod_ga",
        "type": "ticket",
        "name": "General Admission",
        "description": "Access to all sessions.",
        "fulfillment": {
          "delivery": "digital",
          "channels": ["email_qr", "apple_pass"],
          "redemption": ["entry"],
          "scanBehavior": "consumable"
        },
        "capabilities": {
          "timeBound": true,
          "supportsWaitlist": true,
          "shipRequired": false
        },
        "variantDifferentiators": []
      },
      "variant": {
        "id": "var_ga_default",
        "variantAttributes": {},
        "price": {
          "mode": "fixed",
          "amount": 3500,
          "currency": "USD",
          "caption": "Per ticket"
        }
      },
      "state": {
        "temporal": {
          "phase": "during",
          "currentWindow": {
            "startsAt": "2025-10-23T14:00:00Z",
            "endsAt": "2025-10-30T03:59:59Z"
          },
          "nextWindow": null,
          "reasons": []
        },
        "inventory": {
          "availability": "available",
          "remaining": { "count": 42, "perUser": 6, "perOrder": 8 },
          "reasons": []
        },
        "access": {
          "gated": false,
          "satisfied": true,
          "visibilityWhenGated": "visible",
          "requirements": [],
          "reasons": []
        },
        "admin": {
          "state": "active",
          "approvalRequired": false,
          "reasons": []
        },
        "demandCapture": { "kind": "none" },
        "reasons": [],
        "reasonTexts": {}
      },
      "commercial": {
        "maxSelectable": 6,
        "limits": { "perUser": 6, "perOrder": 8 }
      },
      "relations": {
        "requires": null,
        "applyQuantity": "independent"
      },
      "display": {
        "placement": "section",
        "sectionId": "primary",
        "badges": ["Popular", "PaymentPlanAvailable"],
        "featured": true,
        "rank": 0,
        "lowInventory": false
      },
      "uiHints": { "feesNote": "Plus fees" }
    }
  ],
  "pricing": {
    "showPriceSummary": true,
    "summary": {
      "mode": "simple",
      "lines": [
        { "type": "subtotal", "amount": { "amount": 7000, "currency": "USD" } },
        { "type": "fees", "amount": { "amount": 350, "currency": "USD" } },
        { "type": "taxes", "amount": { "amount": 420, "currency": "USD" } },
        { "type": "total", "amount": { "amount": 7770, "currency": "USD" } }
      ],
      "inclusions": { "feesIncluded": false, "taxesIncluded": false }
    }
  }
}
```

---

## 3) State Composition → Rendering

Instead of a single status value determining presentation, the panel composes five orthogonal axes. The server provides authoritative decisions for each axis; the client maps them to UI through decision trees.

### A) Row Presentation (visibility & interaction mode)

| Condition                                                                                  | Result                      |
| ------------------------------------------------------------------------------------------ | --------------------------- |
| `admin.state = 'unpublished'`                                                              | `suppressed` (server omits) |
| `access.gated = true` AND `access.satisfied = false` AND `visibilityWhenGated = 'hidden'`  | `suppressed`                |
| `access.gated = true` AND `access.satisfied = false` AND `visibilityWhenGated = 'visible'` | `locked`                    |
| Otherwise                                                                                  | `normal`                    |

### B) Purchasability (boolean composition)

Purchasable when **ALL** of:

- `admin.state = 'active'`
- `temporal.phase = 'during'`
- `inventory.availability = 'available'`
- `access.gated = false` OR `access.satisfied = true`

### C) CTA Resolution (priority-ordered decision tree)

| Conditions (checked in order)                                                                               | CTA             | Label             |
| ----------------------------------------------------------------------------------------------------------- | --------------- | ----------------- |
| Row presentation ≠ `normal`                                                                                 | `none`          | —                 |
| Is purchasable AND `admin.approvalRequired = false`                                                         | `purchase`      | "Get Ticket(s)"   |
| Is purchasable AND `admin.approvalRequired = true`                                                          | `request`       | "Request to Join" |
| `inventory.availability = 'none'` AND `demandCapture.kind = 'waitlist'` AND gate satisfied AND admin active | `join_waitlist` | "Join Waitlist"   |
| `temporal.phase = 'before'` AND `demandCapture.kind = 'notifyMe'` AND admin active                          | `notify_me`     | "Notify Me"       |
| Otherwise                                                                                                   | `none`          | —                 |

### D) UI Element Visibility Matrix

| Row Presentation | Purchasable      | Quantity UI      | Price UI   | Access Code UI        |
| ---------------- | ---------------- | ---------------- | ---------- | --------------------- |
| `suppressed`     | —                | hidden           | hidden     | hidden                |
| `locked`         | false            | hidden           | **masked** | visible               |
| `normal`         | true             | stepper/select\* | shown      | hidden                |
| `normal`         | false (sold out) | hidden           | hidden     | hidden (unless gated) |
| `normal`         | false (paused)   | hidden           | hidden     | hidden                |

\* stepper if `maxSelectable > 1`, select if `= 1`, hidden if `= 0`

### E) Notices (informational messages composed from axis reasons)

Notices are composed from axis-specific reasons mapped through `reasonTexts`:

- **Temporal**: `outside_window` → "Not on sale yet", `window_ended` → "Sales ended", `expired` → "Past event"
- **Inventory**: `capacity_reached` → "Sold Out"
- **Access**: `requires_code` → "Enter access code", `access_code_expired` → "Code expired", `rate_limited` → "Too many attempts"
- **Admin**: `tenant_paused_sales` → "Sales paused"

### F) Edge Cases

| Scenario                    | Temporal | Inventory | Access                 | Admin  | Demand   | Result                                                      |
| --------------------------- | -------- | --------- | ---------------------- | ------ | -------- | ----------------------------------------------------------- |
| Gated + Sold Out            | any      | none      | not satisfied, visible | active | any      | Show locked row, no waitlist CTA                            |
| Gated + Sold Out (unlocked) | any      | none      | satisfied              | active | waitlist | Show normal row with waitlist CTA                           |
| All items sold out          | any      | all none  | any                    | active | any      | Compact "Event Sold Out" if `showTypeListWhenSoldOut=false` |
| Paused + Available          | during   | available | satisfied              | paused | any      | Show row with "Sales Paused" notice, no CTA                 |

### G) Rendering Rules (Pure View)

**Quantity Controls:**

- **Clamp**: Always use `commercial.maxSelectable` (authoritative).
- **Hints**: Use `inventory.remaining.count/perUser/perOrder` for microcopy only.
  - Display which limit was reached: "Max 6 per user" or "Max 8 per order" based on which limit equals `maxSelectable`
  - Low inventory hint: "Only 3 left" when `remaining.count` below `displayRemainingThreshold`
- Never compute or re-validate clamps client-side.

**Price Visibility:**

- `locked` presentation → **mask price** (show "•••" or "Unlock to see price")
- `normal` presentation AND (purchasable OR `approvalRequired=true`) → **show price**
- Otherwise → **hide price**

**Badges:**

- Reserved values: `Popular`, `PaymentPlanAvailable`, `LimitedRelease`, `Members`
- Displayed when row is `normal` or `locked` (not when suppressed)
- Custom badges allowed (server-controlled)

**Copy Tokens:**

- All notices from `state.{axis}.reasons[]` + `state.reasonTexts{}`
- No hardcoded copy in client logic
- Severity by axis: access/temporal=info, admin=warning, inventory=neutral

---

## 4) Zod/TypeScript Schemas

Drop‑in schemas for **`/context/frontend/product-panel/scaffold/schemas.ts`**

> Replace the file contents with the block below (keeps your import style and iso datetimes).

```ts
import * as z from "zod";

// ---------- Money & Price ----------
export const MoneySchema = z.object({
  amount: z.number().int().nonnegative(),
  currency: z.string().min(1),
});

export const PriceSchema = z
  .object({
    mode: z.enum(["fixed", "free"]),
    amount: z.number().int().nonnegative().optional(),
    currency: z.string().min(1).optional(),
    caption: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.mode !== "free") {
      if (val.amount == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["amount"],
          message: "amount required for fixed",
        });
      }
      if (!val.currency) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["currency"],
          message: "currency required for fixed",
        });
      }
    }
  });
// Price snapshots are immutable; changing a price creates a new price object/version.
// Note: Prices are immutable snapshots; changing price should create a new price object/version.

// ---------- Context & Prefs ----------
export const EffectivePrefsSchema = z.object({
  displayRemainingThreshold: z.number().int().nonnegative().default(10),
  showFeesHint: z.boolean().default(true),
  showTypeListWhenSoldOut: z.boolean().default(true),
  ctaLabelOverrides: z.record(z.string(), z.string()).default({}),
});

export const ContextSchema = z.object({
  eventId: z.string().min(1),
  displayTimezone: z.string().min(1),
  locale: z.string().min(2),
  eventAllOutOfStock: z.boolean().optional(),
  effectivePrefs: EffectivePrefsSchema,
});

export const SectionIdSchema = z.string().min(1);
export const SectionSchema = z.object({
  id: SectionIdSchema,
  label: z.string().min(1),
  order: z.number().int(),
  labelOverride: z.string().nullable(),
});

// ---------- Product & Variant ----------
export const ProductSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["ticket", "physical", "digital"]),
  name: z.string().min(1),
  description: z.string().optional(),
  fulfillment: z.object({
    delivery: z.enum(["digital", "physical_pickup", "shipping"]),
    channels: z
      .array(z.enum(["email_qr", "apple_pass", "barcode", "nfc"]))
      .optional(),
    redemption: z
      .array(z.enum(["entry", "parking", "merch_pickup", "benefit"]))
      .optional(),
    scanBehavior: z.enum(["consumable", "multi_use", "view_only"]).optional(),
  }),
  capabilities: z.object({
    timeBound: z.boolean(),
    supportsWaitlist: z.boolean(),
    shipRequired: z.boolean(),
  }),
  variantDifferentiators: z.array(z.string()).default([]),
});

export const VariantSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(), // default variant: no name needed
  variantAttributes: z.record(z.string(), z.unknown()).default({}),
  price: PriceSchema,
});

// ---------- State Axes ----------
const TemporalSchema = z.object({
  phase: z.enum(["before", "during", "after", "expired"]),
  currentWindow: z
    .object({
      startsAt: z.iso.datetime(),
      endsAt: z.iso.datetime().optional(),
      reasonCode: z.string().optional(),
    })
    .nullable()
    .optional(),
  nextWindow: z
    .object({
      startsAt: z.iso.datetime(),
      endsAt: z.iso.datetime().optional(),
      reasonCode: z.string().optional(),
    })
    .nullable()
    .optional(),
  reasons: z.array(z.string()).default([]),
});

const InventorySchema = z.object({
  availability: z.enum(["available", "none", "unknown"]),
  remaining: z
    .object({
      count: z.number().int().nonnegative().nullable().optional(),
      perUser: z.number().int().nonnegative().nullable().optional(),
      perOrder: z.number().int().nonnegative().nullable().optional(),
    })
    .default({}),
  reasons: z.array(z.string()).default([]),
});

const AccessRequirementSchema = z.object({
  kind: z.enum(["access_code"]),
  satisfied: z.boolean(),
  validWindow: z
    .object({ startsAt: z.iso.datetime(), endsAt: z.iso.datetime() })
    .partial()
    .optional(),
  limit: z
    .object({
      maxUses: z.number().int().nonnegative(),
      usesRemaining: z.number().int().nonnegative(),
    })
    .partial()
    .optional(),
});

const AccessSchema = z.object({
  gated: z.boolean().default(false),
  satisfied: z.boolean().default(true),
  visibilityWhenGated: z.enum(["visible", "hidden"]).default("visible"),
  requirements: z.array(AccessRequirementSchema).default([]),
  reasons: z.array(z.string()).default([]),
});

const AdminSchema = z.object({
  state: z.enum(["active", "paused", "unpublished"]).default("active"),
  approvalRequired: z.boolean().default(false),
  reasons: z.array(z.string()).default([]),
});

const DemandCaptureSchema = z.object({
  kind: z.enum(["none", "waitlist", "notifyMe", "backorder"]).default("none"),
});

export const StateAxesSchema = z.object({
  temporal: TemporalSchema,
  inventory: InventorySchema,
  access: AccessSchema,
  admin: AdminSchema,
  demandCapture: DemandCaptureSchema,
  reasons: z.array(z.string()).default([]),
  reasonTexts: z.record(z.string(), z.string()).default({}),
});

// ---------- Commercial (authoritative clamps only) ----------
export const CommercialSchema = z.object({
  maxSelectable: z.number().int().nonnegative().default(0),
  limits: z
    .object({
      perUser: z.number().int().nonnegative().nullable().optional(),
      perOrder: z.number().int().nonnegative().nullable().optional(),
    })
    .default({}),
});

// ---------- Relations, Display, UI Hints ----------
export const RelationsSchema = z
  .object({
    requires: z
      .object({
        scope: z.enum(["selection", "ownership"]),
        anyOf: z.array(z.string()).default([]),
        allOf: z.array(z.string()).default([]),
      })
      .nullable()
      .optional(),
    applyQuantity: z
      .enum(["matchParent", "independent"])
      .default("matchParent"),
  })
  .default({ applyQuantity: "matchParent" });

export const DisplaySchema = z.object({
  placement: z.enum(["section", "children"]).default("section"),
  sectionId: SectionIdSchema.default("primary"),
  // Reserved badge values recognized by the UI include: "PaymentPlanAvailable". Custom badges allowed.
  badges: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  rank: z.number().int().default(0),
  lowInventory: z.boolean().optional(),
});

export const UiHintsSchema = z.object({
  feesNote: z.string().optional(), // presence controlled by prefs.showFeesHint
});

// ---------- Panel Item ----------
export const PanelItemSchema = z.object({
  product: ProductSchema,
  variant: VariantSchema,
  state: StateAxesSchema,
  commercial: CommercialSchema,
  relations: RelationsSchema,
  display: DisplaySchema,
  uiHints: UiHintsSchema.optional(),
});

// ---------- Pricing Footer ----------
export const PricingLineSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("subtotal"), amount: MoneySchema }),
  z.object({ type: z.literal("fees"), amount: MoneySchema }),
  z.object({ type: z.literal("taxes"), amount: MoneySchema }),
  z.object({ type: z.literal("feesAndTaxes"), amount: MoneySchema }),
  z.object({ type: z.literal("total"), amount: MoneySchema }),
]);

export const PricingSummarySchema = z.object({
  mode: z.enum(["simple", "detailed"]).default("simple"),
  lines: z.array(PricingLineSchema),
  inclusions: z
    .object({ feesIncluded: z.boolean(), taxesIncluded: z.boolean() })
    .default({ feesIncluded: false, taxesIncluded: false }),
  // schedule details intentionally NOT shown here
});

export const PricingSchema = z.object({
  showPriceSummary: z.boolean().default(false),
  summary: PricingSummarySchema.nullable().optional(),
});

// ---------- Top-level payload ----------
export const ProductPanelPayloadSchema = z.object({
  context: ContextSchema,
  sections: z.array(SectionSchema),
  items: z.array(PanelItemSchema),
  pricing: PricingSchema,
});

// ---------- Types ----------
export type Money = z.output<typeof MoneySchema>;
export type Price = z.output<typeof PriceSchema>;
export type EffectivePrefs = z.output<typeof EffectivePrefsSchema>;
export type Context = z.output<typeof ContextSchema>;
export type Section = z.output<typeof SectionSchema>;
export type Product = z.output<typeof ProductSchema>;
export type Variant = z.output<typeof VariantSchema>;
export type StateAxes = z.output<typeof StateAxesSchema>;
export type Commercial = z.output<typeof CommercialSchema>;
export type Relations = z.output<typeof RelationsSchema>;
export type Display = z.output<typeof DisplaySchema>;
export type UiHints = z.output<typeof UiHintsSchema>;
export type PanelItem = z.output<typeof PanelItemSchema>;
export type Pricing = z.output<typeof PricingSchema>;
export type PricingSummary = z.output<typeof PricingSummarySchema>;
export type ProductPanelPayload = z.output<typeof ProductPanelPayloadSchema>;
```

---

## 5) Jotai Alignment: Server vs. Client Boundaries

**Server (authoritative)**

- `state.temporal.phase`, `currentWindow`, `nextWindow`
- `state.inventory.availability`, `remaining.count`, `limits`
- `state.access.gated/satisfied/visibility/requirements (+ code limits & windows)`
- `state.admin.state`, `approvalRequired`
- `state.demandCapture.kind`
- `commercial.maxSelectable` (final clamp)
- `pricing.summary` (all money math)

**Client (derived atoms = presentation only)**

- `rowPresentation`:

  - `suppressed` if `admin.state='unpublished'` (but server shouldn’t send it) or `(gated && !satisfied && visibility='hidden')`
  - `locked` if `gated && !satisfied && visibility='visible'`
  - `normal` otherwise

- `isPurchasable`:
  `admin.active && temporal.during && inventory.available && (!gated || satisfied)`

- `quantityUI`:
  if not `normal` → hidden; else `maxSelectable` 0 → hidden; 1 → select; >1 → stepper

- `priceUI`:
  locked → masked; purchasable or approvalRequired → shown; else hidden

- `cta`:

  - purchasable → `purchase` (label override allowed)
  - approvalRequired (and otherwise purchasable context) → `request`
  - `inventory.none && demandCapture.waitlist && (!gated || satisfied)` → `join_waitlist`
  - `temporal.before && demandCapture.notifyMe` → `notify_me`
  - otherwise `none`

- `notices`: union of axis `reasons` mapped via `reasonTexts` (no recomputation)

- Panel rollups:

  - `allOutOfStock` = every **sent** item has `inventory.availability='none'`
  - `anyGatedVisible` = any row locked
  - `panelMode` = `'compactWaitlistOnly'` when `allOutOfStock` and `prefs.showTypeListWhenSoldOut=false`; else `'full'`

---

## 6) Client Code Implementation

### A) **`types.ts`**

- Keep as‑is, but rename the count:

```diff
- remainingInventory: number | "infinite" | null | undefined;
+ remainingCount?: number | null;
```

### B) **`mapping.ts`** (replace file)

```ts
import { match } from "ts-pattern";
import type { PanelItem, ProductPanelPayload } from "../contract/schemas";
import type {
  CTAKind,
  RowViewModel,
  RowNotice,
  QuantityUI,
  PriceUI,
} from "../state/types";

function rowPresentation(item: PanelItem): RowViewModel["presentation"] {
  const { access, admin } = item.state;
  if (admin.state === "unpublished") return "suppressed";
  if (access.gated && !access.satisfied) {
    return access.visibilityWhenGated === "visible" ? "locked" : "suppressed";
  }
  return "normal";
}

function isPurchasable(item: PanelItem): boolean {
  const { temporal, inventory, access, admin } = item.state;
  return (
    admin.state === "active" &&
    temporal.phase === "during" &&
    inventory.availability === "available" &&
    (!access.gated || access.satisfied)
  );
}

function quantityUI(
  item: PanelItem,
  pres: RowViewModel["presentation"]
): QuantityUI {
  if (pres !== "normal") return "hidden";
  const { temporal, access, admin } = item.state;
  if (
    !(
      admin.state === "active" &&
      temporal.phase === "during" &&
      (!access.gated || access.satisfied)
    )
  )
    return "hidden";
  const max = item.commercial.maxSelectable ?? 0;
  if (max <= 0) return "hidden";
  if (max === 1) return "select";
  return "stepper";
}

function priceUI(item: PanelItem, pres: RowViewModel["presentation"]): PriceUI {
  if (pres === "locked") return "masked";
  if (pres === "suppressed") return "hidden";
  const buyable = isPurchasable(item);
  const approval = item.state.admin.approvalRequired === true;
  return buyable || approval ? "shown" : "hidden";
}

function labelWithOverrides(
  kind: CTAKind,
  payload: ProductPanelPayload,
  fallback: string
): string {
  const overrides = payload.context.effectivePrefs?.ctaLabelOverrides ?? {};
  const key =
    kind === "purchase"
      ? "purchase"
      : kind === "request"
      ? "request"
      : kind === "join_waitlist"
      ? "join_waitlist"
      : kind === "notify_me"
      ? "notify_me"
      : kind === "backorder"
      ? "backorder"
      : "";
  return (key && overrides[key]) || fallback;
}

function ctaFor(
  item: PanelItem,
  pres: RowViewModel["presentation"],
  payload: ProductPanelPayload,
  selectionCount: number
) {
  if (pres !== "normal")
    return { kind: "none" as const, label: "", enabled: false };

  const buyable = isPurchasable(item);
  const approval = item.state.admin.approvalRequired === true;
  const { inventory, access, admin, temporal, demandCapture } = item.state;

  if (buyable) {
    const label = labelWithOverrides(
      "purchase",
      payload,
      selectionCount > 1 ? "Get Tickets" : "Get Ticket"
    );
    return {
      kind: "purchase" as const,
      label,
      enabled: item.commercial.maxSelectable > 0,
    };
  }

  if (
    approval &&
    admin.state === "active" &&
    temporal.phase === "during" &&
    (!access.gated || access.satisfied)
  ) {
    const label = labelWithOverrides("request", payload, "Request to Join");
    return { kind: "request" as const, label, enabled: true };
  }

  if (
    inventory.availability === "none" &&
    demandCapture.kind === "waitlist" &&
    (!access.gated || access.satisfied) &&
    admin.state === "active"
  ) {
    const label = labelWithOverrides("join_waitlist", payload, "Join Waitlist");
    return { kind: "join_waitlist" as const, label, enabled: true };
  }

  if (
    temporal.phase === "before" &&
    demandCapture.kind === "notifyMe" &&
    admin.state === "active"
  ) {
    const label = labelWithOverrides("notify_me", payload, "Notify Me");
    return { kind: "notify_me" as const, label, enabled: true };
  }

  return { kind: "none" as const, label: "", enabled: false };
}

function noticesFor(
  item: PanelItem,
  pres: RowViewModel["presentation"]
): RowNotice[] {
  const out: RowNotice[] = [];
  const { temporal, inventory, access, admin, reasonTexts } = item.state;
  if (pres === "locked") {
    out.push({
      icon: "info",
      title: "Requires Access Code",
      text: reasonTexts["requires_code"],
    });
    return out;
  }
  if (admin.state === "paused")
    out.push({ icon: "warning", title: "Sales Paused" });
  if (temporal.phase === "before")
    out.push({ icon: "info", title: "Not on Sale" });
  if (temporal.phase === "after")
    out.push({ icon: "info", title: "Sales Window Ended" });
  if (temporal.phase === "expired")
    out.push({ icon: "info", title: "Past Event" });
  if (inventory.availability === "none")
    out.push({ icon: "info", title: "Sold Out" });

  // Axis-specific reasonTexts
  for (const r of [
    ...temporal.reasons,
    ...inventory.reasons,
    ...access.reasons,
    ...admin.reasons,
  ]) {
    if (reasonTexts[r]) out.push({ meta: reasonTexts[r] });
  }
  return out;
}

export function mapItemToRowVM(
  item: PanelItem,
  payload: ProductPanelPayload,
  selectionCount: number
): RowViewModel {
  const pres = rowPresentation(item);
  const qUI = quantityUI(item, pres);
  const pUI = priceUI(item, pres);
  const cta = ctaFor(item, pres, payload, selectionCount);
  const notices = noticesFor(item, pres);

  return {
    key: `${item.product.id}/${item.variant.id}`,
    sectionId: item.display.sectionId,
    productId: item.product.id,
    variantId: item.variant.id,
    name: item.variant.name || item.product.name,

    presentation: pres,
    quantityUI: qUI,
    priceUI: pUI,

    lowInventory: item.display.lowInventory,
    badges: item.display.badges,

    maxSelectable: item.commercial.maxSelectable ?? 0,
    remainingCount: item.state.inventory.remaining?.count ?? null,

    cta,
    notices,

    isGated: item.state.access.gated,
    gatesVisible: pres === "locked",
    reasons: [...item.state.reasons],
  };
}
```

### C) **`selectors.ts`** (only the rollups need edits)

```diff
- const allOutOfStock = rowVMs.length > 0 && rowVMs.every((r) => r.presentation !== "normal" || r.cta.kind === "none") &&
-   items.every((it) => it.commercial.status === "outOfStock");
+ const allOutOfStock =
+   items.length > 0 &&
+   items.every((it) => it.state.admin.state !== "unpublished") &&
+   items.every((it) => it.state.inventory.availability === "none");

- const anyGatedVisible = rowVMs.some((r) => r.presentation === "locked");
- const anyGatedHidden = items.some((it) => it.gates?.requirements?.length && (it.gates?.visibilityWhenGated ?? "visible") === "hidden");
+ const anyGatedVisible = rowVMs.some((r) => r.presentation === "locked");
+ const anyGatedHidden = items.some((it) => it.state.access.gated && !it.state.access.satisfied && it.state.access.visibilityWhenGated === "hidden");
```

---

## 7) Relations & Dependencies

Product dependencies are expressed through the `relations` field, enabling add-ons and bundled products.

### Scope Semantics

- **`selection`**: Requires the parent product to be in the current cart selection
- **`ownership`**: Requires the user to already own the parent product (for post-purchase add-ons)

### Apply Quantity Rule

- **`matchParent`**: Child quantity matches parent quantity (nested toggle behavior)
  - Used for: per-ticket add-ons like "Fast Pass" or "Meal Voucher"
  - UI: No separate quantity stepper; selecting/deselecting parent applies to all units
- **`independent`**: Child has its own quantity stepper
  - Used for: order-level add-ons like "Parking Pass" (one per order, not per ticket)
  - UI: Separate quantity control in Add-ons section

### Examples

**Nested child (fast-pass per ticket):**

```jsonc
{
  "relations": {
    "requires": { "scope": "selection", "anyOf": ["prod_ga"], "allOf": [] },
    "applyQuantity": "matchParent"
  },
  "display": { "placement": "children", "sectionId": "primary" }
}
```

**Order-level add-on (parking per car):**

```jsonc
{
  "relations": {
    "requires": {
      "scope": "selection",
      "anyOf": ["prod_ga", "prod_vip"],
      "allOf": []
    },
    "applyQuantity": "independent"
  },
  "display": { "placement": "section", "sectionId": "addons" }
}
```

**Physical pickup merch:**

```jsonc
{
  "product": {
    "type": "physical",
    "fulfillment": { "delivery": "physical_pickup" }
  },
  "relations": {
    "requires": { "scope": "ownership", "anyOf": ["prod_ticket"], "allOf": [] }
  }
}
```

---

## 8) Fulfillment & Redemption

The `product.fulfillment` object provides display-only hints for scanning and redemption UX. The panel does not execute business logic based on these fields.

### Fulfillment Fields

**`delivery`**: How the customer receives the product

- `digital`: Email QR code, Apple Wallet, etc.
- `physical_pickup`: Pick up at venue/booth
- `shipping`: Mailed to customer

**`channels`** (optional): Delivery mechanisms

- `email_qr`: QR code sent via email
- `apple_pass`: Apple Wallet pass
- `barcode`: Standard barcode
- `nfc`: NFC tap/scan

**`redemption`** (optional): Where/how the product is used

- `entry`: Event entry gate
- `parking`: Parking lot entry
- `merch_pickup`: Merchandise booth
- `benefit`: Ongoing benefit (no single redemption)

**`scanBehavior`** (optional): Redemption rules

- `consumable`: Single-use (typical ticket)
- `multi_use`: Scan multiple times (e.g., multi-day pass)
- `view_only`: Display only, no scanning

### Panel Usage

- **Badges**: Show "Apple Wallet available" when `channels` includes `apple_pass`
- **Microcopy**: "Pick up at venue" for `physical_pickup`
- **No business logic**: Scanner permissions and redemption validation happen server-side

---

## 9) Reference Fixture (Four Scenarios)

Use this as **`fixtures.ts`** reference payload and Storybook sanity:

```ts
import { ProductPanelPayload } from "../contract/schemas";

export const fxGreenfield: ProductPanelPayload = {
  context: {
    eventId: "evt_123",
    displayTimezone: "America/Chicago",
    locale: "en-US",
    effectivePrefs: {
      displayRemainingThreshold: 10,
      showFeesHint: true,
      showTypeListWhenSoldOut: true,
      ctaLabelOverrides: {},
    },
  },
  sections: [
    { id: "primary", label: "Get Tickets", order: 1, labelOverride: null },
    { id: "addons", label: "Add-ons", order: 2, labelOverride: null },
  ],
  items: [
    // Available GA
    {
      product: {
        id: "prod_ga",
        type: "ticket",
        name: "General Admission",
        description: "Access to all sessions.",
        fulfillment: {
          delivery: "digital",
          channels: ["email_qr", "apple_pass"],
          redemption: ["entry"],
          scanBehavior: "consumable",
        },
        capabilities: {
          timeBound: true,
          supportsWaitlist: true,
          shipRequired: false,
        },
        variantDifferentiators: [],
      },
      variant: {
        id: "var_ga",
        variantAttributes: {},
        price: {
          mode: "fixed",
          amount: 3500,
          currency: "USD",
          caption: "Per ticket",
        },
      },
      state: {
        temporal: {
          phase: "during",
          currentWindow: { startsAt: "2025-10-23T14:00:00Z" },
          nextWindow: null,
          reasons: [],
        },
        inventory: {
          availability: "available",
          remaining: { count: 42, perUser: 6, perOrder: 8 },
          reasons: [],
        },
        access: {
          gated: false,
          satisfied: true,
          visibilityWhenGated: "visible",
          requirements: [],
          reasons: [],
        },
        admin: { state: "active", approvalRequired: false, reasons: [] },
        demandCapture: { kind: "none" },
        reasons: [],
        reasonTexts: {},
      },
      commercial: { maxSelectable: 6, limits: { perUser: 6, perOrder: 8 } },
      relations: { requires: null, applyQuantity: "independent" },
      display: {
        placement: "section",
        sectionId: "primary",
        badges: ["Popular"],
        featured: true,
        rank: 0,
      },
      uiHints: { feesNote: "Plus fees" },
    },
    // VIP sold out with waitlist
    {
      product: {
        id: "prod_vip",
        type: "ticket",
        name: "VIP",
        fulfillment: {
          delivery: "digital",
          channels: ["email_qr"],
          redemption: ["entry"],
          scanBehavior: "consumable",
        },
        capabilities: {
          timeBound: true,
          supportsWaitlist: true,
          shipRequired: false,
        },
        variantDifferentiators: [],
      },
      variant: {
        id: "var_vip",
        variantAttributes: {},
        price: { mode: "fixed", amount: 12000, currency: "USD" },
      },
      state: {
        temporal: {
          phase: "during",
          currentWindow: { startsAt: "2025-10-23T14:00:00Z" },
          nextWindow: null,
          reasons: [],
        },
        inventory: {
          availability: "none",
          remaining: { count: 0, perUser: 1, perOrder: 1 },
          reasons: ["capacity_reached"],
        },
        access: {
          gated: false,
          satisfied: true,
          visibilityWhenGated: "visible",
          requirements: [],
          reasons: [],
        },
        admin: { state: "active", approvalRequired: false, reasons: [] },
        demandCapture: { kind: "waitlist" },
        reasons: [],
        reasonTexts: { capacity_reached: "Capacity reached." },
      },
      commercial: { maxSelectable: 0, limits: { perUser: 1, perOrder: 1 } },
      relations: { requires: null, applyQuantity: "independent" },
      display: { placement: "section", sectionId: "primary", badges: [] },
    },
    // Child add-on (digital voucher), quantity matches parent
    {
      product: {
        id: "prod_meal",
        type: "digital",
        name: "Meal Voucher",
        fulfillment: {
          delivery: "digital",
          channels: ["barcode"],
          redemption: ["merch_pickup"],
          scanBehavior: "consumable",
        },
        capabilities: {
          timeBound: true,
          supportsWaitlist: false,
          shipRequired: false,
        },
        variantDifferentiators: [],
      },
      variant: {
        id: "var_meal",
        variantAttributes: {},
        price: { mode: "fixed", amount: 2500, currency: "USD" },
      },
      state: {
        temporal: { phase: "during", reasons: [] },
        inventory: {
          availability: "available",
          remaining: { count: 50, perUser: 2, perOrder: 2 },
          reasons: [],
        },
        access: {
          gated: false,
          satisfied: true,
          visibilityWhenGated: "visible",
          requirements: [],
          reasons: [],
        },
        admin: { state: "active", approvalRequired: false, reasons: [] },
        demandCapture: { kind: "none" },
        reasons: [],
        reasonTexts: {},
      },
      commercial: { maxSelectable: 2, limits: { perUser: 2, perOrder: 2 } },
      relations: {
        requires: { scope: "selection", anyOf: ["prod_ga"], allOf: [] },
        applyQuantity: "matchParent",
      },
      display: { placement: "children", sectionId: "primary", badges: [] },
    },
    // Locked gated ticket (visible, price masked)
    {
      product: {
        id: "prod_locked",
        type: "ticket",
        name: "Members Only",
        fulfillment: {
          delivery: "digital",
          channels: ["email_qr"],
          redemption: ["entry"],
          scanBehavior: "consumable",
        },
        capabilities: {
          timeBound: true,
          supportsWaitlist: true,
          shipRequired: false,
        },
        variantDifferentiators: [],
      },
      variant: {
        id: "var_locked",
        variantAttributes: {},
        price: { mode: "fixed", amount: 10000, currency: "USD" },
      },
      state: {
        temporal: { phase: "before", reasons: ["outside_window"] },
        inventory: {
          availability: "available",
          remaining: { count: 5, perUser: 1, perOrder: 1 },
          reasons: [],
        },
        access: {
          gated: true,
          satisfied: false,
          visibilityWhenGated: "visible",
          requirements: [
            {
              kind: "access_code",
              satisfied: false,
              validWindow: {
                startsAt: "2025-10-22T00:00:00Z",
                endsAt: "2025-10-25T23:59:59Z",
              },
            },
          ],
          reasons: ["requires_code"],
        },
        admin: { state: "active", approvalRequired: false, reasons: [] },
        demandCapture: { kind: "none" },
        reasons: [],
        reasonTexts: { requires_code: "Enter your access code to unlock." },
      },
      commercial: { maxSelectable: 0, limits: { perUser: 1, perOrder: 1 } },
      relations: { requires: null, applyQuantity: "independent" },
      display: {
        placement: "section",
        sectionId: "primary",
        badges: ["Members"],
      },
    },
  ],
  pricing: {
    showPriceSummary: true,
    summary: {
      mode: "simple",
      lines: [
        { type: "subtotal", amount: { amount: 7000, currency: "USD" } },
        { type: "fees", amount: { amount: 350, currency: "USD" } },
        { type: "taxes", amount: { amount: 420, currency: "USD" } },
        { type: "total", amount: { amount: 7770, currency: "USD" } },
      ],
      inclusions: { feesIncluded: false, taxesIncluded: false },
    },
  },
};
```

---

## 10) Reason Code Registry

Machine reason codes with recommended severity and icon mapping:

### By Axis

**Temporal:**

- `outside_window` – info – "Not on sale yet"
- `inside_window` – (no notice, active state)
- `window_ended` – info – "Sales window ended"
- `expired` – info – "Past event"

**Inventory:**

- `capacity_reached` – neutral – "Sold Out"
- `unknown_remaining` – warning – "Availability unknown"

**Access:**

- `requires_code` – info – "Enter access code to unlock"
- `access_code_expired` – warning – "Code expired"
- `access_code_maxed` – warning – "Code max uses reached"
- `rate_limited` – error – "Too many attempts, try later"

**Admin:**

- `tenant_paused_sales` – warning – "Sales paused"
- `unpublished` – (row omitted, never sent)

**Event-level** (optional):

- `all_types_out_of_stock` – info – "Event sold out"

**Clamps/Microcopy:**

- `max_per_order_reached` – info – "Max per order reached"
- `max_per_user_reached` – info – "Max per user reached"

### Display Mapping

Panel maps codes → notices via `state.reasonTexts` (server‑localized or per‑item custom). Severity determines icon:

- **info**: ℹ️ informational
- **warning**: ⚠️ attention needed
- **error**: 🚫 action blocked
- **neutral**: no icon, state indicator only

Notices surface in row UI (below title) or footer (event-level messages).

---

## 11) Invariants & Guardrails

Axis-specific rules to prevent business logic creep into the client. Mark these as **authoritative** in code reviews.

### Temporal Axis

- ✓ Server computes `phase` from schedule engine; client never compares timestamps
- ✓ `currentWindow` and `nextWindow` are display metadata only
- ✗ Client must not decide "during" vs "before" vs "after"
- ✗ Client must not parse or compute date/time values

### Inventory Axis

- ✓ Server decides `availability`; client never compares `remaining.count` to zero
- ✓ `remaining.count/perUser/perOrder` are hints only; `commercial.maxSelectable` is the clamp
- ✗ Client must not compute "sold out" from remaining count
- ✗ Client must not calculate availability from capacity math

### Access Axis

- ✓ Server evaluates all gate requirements; client only shows/hides based on `satisfied`
- ✓ Client submits access codes to server; server returns updated `satisfied` state
- ✗ Client must not validate access codes, windows, or limits
- ✗ Client must not implement brute-force protection (server concern)

### Admin Axis

- ✓ Items with `state='unpublished'` must not be sent to client
- ✓ `paused` shows notices; `unpublished` omits entirely
- ✗ Client must not decide pause/unpublish presentation
- ✗ Client must not implement admin permission checks

### Demand Capture Axis

- ✓ Server decides waitlist/notifyMe eligibility; client only renders the configured CTA
- ✗ Client must not choose waitlist vs notifyMe based on timing or inventory
- ✗ Client must not implement waitlist capacity logic

### Commercial (Clamps)

- ✓ `maxSelectable` is the single authoritative clamp; client enforces this value only
- ✓ Server computes `maxSelectable = min(limits.perUser, limits.perOrder, remaining.count)`
- ✓ `limits.perUser/perOrder` are hints for microcopy, not enforced clamps
- ✗ Client must not compute maxSelectable from remaining or limits
- ✗ Client must not recompute min() calculation; use server value verbatim
- ✗ Client must not implement fraud/abuse detection

### Pricing

- ✓ Server computes all money math; client displays `pricing.summary` verbatim
- ✗ Client must not calculate fees, taxes, or totals
- ✗ Client must not apply promotional discounts

---

## 12) Implementation Checklist

**Server**

- [ ] Emit `items[].state` (five axes) and delete `commercial.status`.
- [ ] Rename `remaining.inventory` → `remaining.count`; never send the word “inventory” elsewhere.
- [ ] Omit items with `admin.state='unpublished'`.
- [ ] Add `product.fulfillment`.
- [ ] Ensure `commercial.maxSelectable` is correct; keep `limits` for hints only.
- [ ] Keep all money math in `pricing.summary`.
- [ ] Default `effectivePrefs.showTypeListWhenSoldOut = true`.

**Client**

- [ ] Replace `schemas.ts` with v0.3 above.
- [ ] Update `mapping.ts`, `selectors.ts` per patches.
- [ ] Adjust `types.ts` to use `remainingCount`.
- [ ] Load the new `fxGreenfield` fixture in Storybook and snapshot `panelViewModelAtom`.

---

## Appendix A: Design Rationale

**Why this design will hold under load and scale gracefully:**

- **Axes are orthogonal** → Easy to test (toggle one dimension at a time), easy to extend (add `geo` or `age` gates later without surgery). Each axis can evolve independently.

- **Jotai derived atoms do display‑only composition** → No business decisions in the client. The engine remains the single source of truth for rules, schedules, and clamps. UI freedom to add tooltips, animations, or layout variations without touching business logic.

- **Fulfillment is explicit** → Scanner UX and permissions can key off fulfillment fields without inventing new product types. Future redemption contexts (e.g., "lounge_access", "merch_exclusive") slot in cleanly.

- **Waitlist vs notify‑me** is just the `demandCapture` axis → Flip a server value, the UI shifts. No branching combinatorics, no client conditionals based on timing or inventory state.

- **No magic types** → `addon` is not a type—it's a product with relations. This keeps the type system clean and prevents special-case proliferation as new product categories emerge.

**Backstage consideration:** This same multi-axis approach works for admin UIs (toggles for pause/unpublish, access‑code limit editors, demand-capture config). The axes provide a consistent mental model across both customer-facing and admin surfaces.

---

## Appendix B: Pricing Summary Footer

The `pricing.summary` object provides a server-computed breakdown of order costs. The panel displays these values verbatim—no client-side calculation.

### Line Types

**Standard lines** (discriminated union by `type`):

- `subtotal`: Sum of all item prices before fees and taxes
- `fees`: Service fees, processing fees, facility fees (separate line)
- `taxes`: Sales tax, VAT, etc. (separate line)
- `feesAndTaxes`: Combined line when `mode='simple'` and both exist
- `total`: Final amount charged

### Modes

- **`simple`**: Show subtotal, combined fees+taxes (optional), total (3 lines max)
- **`detailed`**: Show subtotal, itemized fees, itemized taxes, total (5+ lines)

### Inclusions

Flags alter presentation without changing amounts:

- **`feesIncluded: true`**: Price already includes fees; show "(incl. fees)" microcopy
- **`taxesIncluded: true`**: Price already includes taxes; show "(incl. taxes)" microcopy

### Examples

**Simple mode (exclusive):**

```jsonc
{
  "mode": "simple",
  "lines": [
    { "type": "subtotal", "amount": { "amount": 7000, "currency": "USD" } },
    { "type": "fees", "amount": { "amount": 350, "currency": "USD" } },
    { "type": "taxes", "amount": { "amount": 420, "currency": "USD" } },
    { "type": "total", "amount": { "amount": 7770, "currency": "USD" } }
  ],
  "inclusions": { "feesIncluded": false, "taxesIncluded": false }
}
```

**Simple mode (inclusive):**

```jsonc
{
  "mode": "simple",
  "lines": [
    { "type": "total", "amount": { "amount": 7000, "currency": "USD" } }
  ],
  "inclusions": { "feesIncluded": true, "taxesIncluded": true }
}
```

**Detailed mode:**

```jsonc
{
  "mode": "detailed",
  "lines": [
    { "type": "subtotal", "amount": { "amount": 7000, "currency": "USD" } },
    {
      "type": "fees",
      "amount": { "amount": 250, "currency": "USD" },
      "label": "Service Fee"
    },
    {
      "type": "fees",
      "amount": { "amount": 100, "currency": "USD" },
      "label": "Facility Fee"
    },
    {
      "type": "taxes",
      "amount": { "amount": 420, "currency": "USD" },
      "label": "Sales Tax"
    },
    { "type": "total", "amount": { "amount": 7770, "currency": "USD" } }
  ],
  "inclusions": { "feesIncluded": false, "taxesIncluded": false }
}
```

### Panel Behavior

- Display lines in order provided by server
- Format amounts with currency symbol/code from `amount.currency`
- Show inclusions microcopy when applicable
- No validation, no recomputation—trust server math
