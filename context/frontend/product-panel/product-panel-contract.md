# ProductPanel Payload — v0.2 (Event Page)

> **Purpose**  
> Single, complete contract for the ProductPanel on event pages. The panel is **purely presentational**: it renders exactly what the server provides—no schedule math, no pricing math, no business‑rule recomputation.
>
> **Ground rules**
>
> - All timestamps are **ISO 8601 UTC**.
> - Panel formats using **`context.displayTimezone`** (IANA) and **`context.locale`**.
> - The server/engine is authoritative for: `commercial.status`, `demandCapture`, `maxSelectable`, limits & remaining counts, schedules, and reason codes/texts.
> - Aligns with existing UI primitives (DynamicNotice, AccessCodeCTA/Drawer, SingleTypePrice) and states (Sold Out, Waitlist, Past Event).

_Design references:_ derived from your FigJam/PDF states (Sold Out + Waitlist, Past Event, Access Code behaviors, notices and hints).

---

## 0) Conventions & Non‑goals

- Amounts are **integer minor units** (e.g., cents). More specifically they are Dinero.js v2 objects that are persisted with the Dinero snapshot() function.
- Enums are shown inline.
- **Sections** are not tenant‑configurable. We ship two: “Get Tickets” (primary) and “Add‑ons”. Server can pass an optional `labelOverride` (see §1).
- **Gates**: currently only `access_code`. Logic is `all`. No separate “scope policy”; lock/waitlist interactions follow §6.

---

## 1) Top‑Level Object

```jsonc
{
  "context": {
    "eventId": "evt_123",
    // Formatting only; all payload times are UTC
    // display timezone for events will almost always be event timezone
    "displayTimezone": "America/Chicago",
    "locale": "en-US", // en-US will always be the case for now

    // Single, server‑merged preference object (Query key e.g.: ['effectivePrefs', orgId, eventId, 'public'])
    "effectivePrefs": {
      "displayRemainingThreshold": 10, // show "Only N left" when inventory <= threshold
      "showFeesHint": true, // card‑level hint (e.g., "Plus fees")
      // the deeper reason for showTypeListWhenSoldOut is to cover the edge case of a gated ticket being sold out. e.g. what shows when a correct access code is entered but the gated ticket type is sold out? nothing? or the the sold out ticket type greyed out? This should probably just be the dang default for gated types. Maybe this on a per-ticket basis?
      "showTypeListWhenSoldOut": true, // show sold‑out list instead of a bare waitlist panel
      "hideZeroInventoryVariants": false, // NOTE!!! we do not use the word inventory yet!!! hideZeroRemainingTypes is probably better. And in reality this may at some point be overrident on a type by type basis.
      // need to look at the two above in context with each other and how that effects display
      // for right now we show ticket types even with sold out just as greyed out and we ignore hideZeroInventoryVariants or remove it
      // ticket types probably should have a "disable" toggle on backend, like it never existed until enabled again
      "ctaLabelOverrides": {} // optional copy overrides, e.g. { "purchase": "Get Tickets", "Buy Cards" }
    }
  },

  // Optional axes for documentation/tests
  "axes": {
    "types": "single | multiple", // total product types represented
    "typesPerOrder": "single | multiple", // how many types can be in one order
    "ticketsPerType": "single | multiple" // per‑type quantity policy (summary)
  },

  // Sections are fixed for now (order respected). Server may pass labelOverride later.
  // NOTE: We need to determine what the section order options are. I suggest alphabetical and manual ordering with an optional "featured first toggle". Or we just make featured at the top and alphabetical the default for right now.
  // NOTE: child addons are always in the quantity of the ticket / card / product they belong to
  "sections": [
    {
      "id": "primary",
      "label": "Get Tickets",
      "order": 1,
      "labelOverride": null
    },
    { "id": "addons", "label": "Add-ons", "order": 2, "labelOverride": null }
  ],

  // Items render in section order; order within sections is preserved.
  "items": [
    /* PanelItem[] */
  ],

  // Optional pricing footer (see §7). All math is server‑side.
  // Pricing summary is default to true
  // Pricing Summary footer is a optional breakdown of tickets selected in the panel. e.g. subtotal, fees, taxes, total, etc.
  "pricing": {
    "showPriceSummary": true,
    "summary": null
  }
}
```

---

## 2) `PanelItem` — One Row/Card

```jsonc
{
  // NOTE: All products have a fulfillment type / process. For physical that will almost always be pickup with a pickup location, but could be shipping in the future. For tickets it's multiple fulfillments of email qr code / Apple Pass, etc.
  "product": {
    "id": "prod_ga", // nanoId
    "type": "ticket", // ticket | addon | physical | digital
    "name": "General Admission",
    "description": "Access to all sessions.",

    // Used only to tailor labels/hints; not for policy.
    "capabilities": {
      "timeBound": true,
      "supportsWaitlist": true, // not going to do waitlists right now, will be needed soon though, we should think more about how we want waitlists to work in the future
      "supportsBackorder": false, // we can just leave this out right now
      "shipRequired": false // we can leave this out as well, we can cross the physical product shipping bridge later
    }

    // If you ever add real coexisting choices (e.g., seats/sections), list the keys here.
    // "variantDifferentiators": []
  },

  "variant": {
    "id": "var_ga_default",
    // "name": "", // equals product name for 1:1 default‑variant tickets, not needed right now
    "variantAttributes": {}, // only attributes that *differentiate choices*

    // Inline price block (no math here).
    "price": {
      "mode": "fixed", // fixed | free
      "amount": 3500, // should probably be a dinero object
      "currency": "USD", // always USD for now we can assume this
      "caption": "Per ticket" // supports short hints; fees note managed via prefs (see uiHints)
    },

    // When gates unmet:
    //   'visible' -> locked row + AccessCodeCTA/Drawer / if visible we don't show price until unlocked
    //   'hidden'  -> row suppressed
    "visibilityWhenGated": "visible"
  },

  "commercial": {
    // Drives the major panel branch.
    "status": "available", // available | soldOut | notOnSale | paused / disabled | windowEnded | expired

    // Reasons & optional pre‑localized texts. Panel maps these to DynamicNotice and hints.
    "reasons": [], // e.g., ["outside_window","capacity_reached","requires_code"]
    "reasonTexts": {},

    // Demand‑capture behavior determined upstream.
    "demandCapture": "none", // none | waitlist | notifyMe
    // waitlist is ordered and sold in blocks based on tier, etc.
    // notify me is a concert that can't go on sale yet but the concert is announced and the event page is live
    // do we want to support sms and email or just email? both, sms first

    // Limits + remaining + authoritative clamp. Panel shows hints & clamps UI but never recomputes.
    "limits": {
      // limites opens up a bigger question of how we stack capacity and clamp based on org -> venue -> event -> ticket type
      // "perVariant": "infinite", // number | "infinite"
      "perUser": 6,
      "perOrder": 8 // usually using per order limits right now and we can just peg perUser to match perOrder
      // I think the discussions around fraud detection and mitigation is one for later
    },
    "remaining": {
      "remaining": 42, // number (mayyyybe infinite) basically quantity available in backend config, may not need infinite
      // if t-shirts with sized or something then we may very well have inventory here with per variant qtys
      "perUser": 6,
      "perOrder": 8
    },
    "maxSelectable": 6, // final clamp for stepper/toggle // always the lowest of the available e.g. if perOrder is 10 and perUser is 5 then this is 5
    // microcopy hint when max is reached should be standard / based on which max was reached e.g. "max 6 per user"

    // Schedule metadata for notices/hints (no calendar math in panel).
    // Probably a better way to handle this data structure and still support arbitrarily complex sale schedules simply
    // we can simplify this somehow?
    "schedule": {
      "currentWindow": {
        "startsAt": "2025-10-23T14:00:00Z",
        "endsAt": "2025-10-30T03:59:59Z",
        "reasonCode": "sale_window"
      },
      "nextWindow": null // or { startsAt, endsAt?, reasonCode? }
    }
  },

  // Gates are orthogonal to status.
  // Access codes should have purchase limits e.g. an access code can only be used to purchase X number of Y ticket type
  // Maybe CF turnstile on access code drawer
  "gates": {
    "logic": "all", // currently always 'all'
    "requirements": [{ "kind": "access_code", "satisfied": true }], // do we compute satisfied on server? is that check with a server function? does this update the derived atom?
    "visibilityWhenGated": "visible" // we always hide price on gated tickets that are visible right now
  },

  // Optional dependency & placement (e.g., add‑ons)
  // this also needs to account for nested display as well as the sectional display of addons
  "relations": {
    // Requires parent product(s). scope: 'selection' (in-cart) | 'ownership' (already own)
    "requires": null
    // Example:
    // "displaysWhere": section | nested (shows only when parent selected nested underneath)
    // "requires": { "scope": "selection", "anyOf": ["prod_ga"], "allOf": [] }
  },

  // NOTE: Some addon's (especially in sections) are less of addons and more of other kinds of products (parking pass)
  // So we need to rethink this just a bit

  // Placement & cosmetic hints only.
  "display": {
    "placement": "section", // 'section' | 'children'
    "sectionId": "primary", // 'primary' | 'addons'
    "badges": ["Popular"], // needs more thought!
    "lowInventory": true // set by server using effectivePrefs.threshold
  },

  // Optional niceties; don't shove policy here.
  "uiHints": {
    "feesNote": "Plus fees" // show only if context.effectivePrefs.showFeesHint=true
  }
}
```

---

## 3) Status → UI Mapping (Authoritative)

| `commercial.status` | `demandCapture` | Gates satisfied?                     | Row presentation                                   | CTA                             | Quantity UI    | Price UI       |
| ------------------- | --------------- | ------------------------------------ | -------------------------------------------------- | ------------------------------- | -------------- | -------------- |
| `available`         | `none`          | ✅                                   | normal                                             | **Get Ticket(s)** (or override) | select/stepper | shown          |
| `approvalRequired`  | `none`          | ✅                                   | normal                                             | **Request to Join**             | select/stepper | shown          |
| `outOfStock`        | `waitlist`      | ✅                                   | notice “Event Full / Sold Out”                     | **Join Waitlist**               | hidden         | hidden         |
| `outOfStock`        | `none`          | ✅                                   | notice “Sold Out”                                  | none                            | hidden         | hidden         |
| `notOnSale`         | any             | n/a                                  | notice “Not on sale” + next window hint if present | none                            | hidden         | hidden         |
| `paused`            | any             | n/a                                  | notice “Sales paused”                              | none                            | hidden         | hidden         |
| `windowEnded`       | any             | n/a                                  | notice “Sales window ended”                        | none                            | hidden         | hidden         |
| `expired`           | any             | n/a                                  | notice “Event ended / Past event”                  | none                            | hidden         | hidden         |
| any                 | any             | ❌ + `visibilityWhenGated='visible'` | **locked** row + AccessCodeCTA/Drawer              | none (until unlocked)           | hidden         | masked/minimal |
| any                 | any             | ❌ + `visibilityWhenGated='hidden'`  | row suppressed                                     | —                               | —              | —              |

_This matches the sold‑out, waitlist, and past‑event patterns from your boards._

---

## 4) Add‑ons (Placement & Dependency)

> NOTE: Addons that go in sections are really just separate products that depend on the purchase of a ticket or other product. e.g. you have to buy a ticket to also buy a parking pass.

> NOTE: we may also have tickets that are dependent on the purchase of other tickets! 🎉😆

> NOTE: Maybe there's a nightmare situation where a product is dependent on the user having purchased another product in thier account! 🫠

- **Sectioned**: `display.placement='section'`, `display.sectionId='addons'`  
  Renders in an “Add‑ons” section; unmet parent requirement disables the row with a hint (“Requires General Admission”).

- **Nested**: `display.placement='children'` near the parent row; same disable/hint behavior.

### **Dependency expression**

```jsonc
"relations": {
  "requires": {
    "scope": "selection",            // or 'ownership'
    "anyOf": ["prod_ga"],            // supports future flexibility
    "allOf": []
  }
}
```

_Rules engine decides eligibility; the panel only disables/hints based on this + current selection/ownership context._

---

## 5) Gates (Simple, Explicit)

> NOTE: We need to adjust this to account for purchase limits related to an access code.
> NOTE: Access codes need a valid from and valid to window.

- Set of requirements; currently `{ kind: 'access_code' }` only.
- `logic: 'all'` (every requirement must be satisfied).
- **Presentation** when unmet:
  - `visibilityWhenGated:'visible'` → **locked** row (AccessCodeCTA/Drawer), **price hidden**.
  - `visibilityWhenGated:'hidden'` → row suppressed, shows when unlocked.
- Interactions with purchaseLimitReached / validWindow:
- Interactions with sold‑out:
  - **Locked + noneRemaining** + demandCaputre='none' ⇒ no waitlist/backorder shown, but we still show type when unlocked.
  - **Unlocked + noneRemaining + demandCapture='waitlist'** ⇒ show **Join Waitlist**.

---

## 6) Limits & Clamping

- `limits` + `remaining` + `maxSelectable` are **inputs**.
- Panel clamps stepper to `maxSelectable` and uses `remaining` to show hints (“Only 3 left”, “Limit 2 per order”).
- If `remaining.inventory === null`, inventory is unknown; omit “Only N left” hints. // we'll have to look closer at some of these invariants

---

## 7) Pricing Summary Footer (Optional; Server‑Computed)

Shown when `pricing.showPriceSummary=true`. The server returns a ready‑to‑render `summary`; panel performs **zero** arithmetic.

> NOTE: maybe need options for adjusting the display below based on inclusive settings for fees and taxes.

> NOTE: do we show fee breakdowns, etc.

Ticket Price: $10 + 8%

Subtotal, prices added up

Fees: total fees both per ticket and order

Taxes

Total

LineItem, LineItemFee, LineItemFeeTax

OrderFee, OrderFeeTax

Could be either % of absolute value, and you can have as many of as many type as you want

When you configure a ticket type you should see any "global default" fees or applicable fees shown.
If you want to override it that's an option on the fee shown.
You can add additional per order and per ticket type fees as well.

> NOTE: we need to think about fee tracking and reporting

```jsonc
"pricing": {
  "showPriceSummary": true,
  "summary": {
    "mode": "simple",                // simple | detailed
    "lines": [
      { "type": "subtotal",      "amount": { "amount": 7000, "currency": "USD" } },

      // Choose either separate fees+taxes OR a combined line:
      { "type": "fees",          "amount": { "amount": 350,  "currency": "USD" } },
      { "type": "taxes",         "amount": { "amount": 420,  "currency": "USD" } },
      // or: { "type": "feesAndTaxes", "amount": { "amount": 770, "currency": "USD" } },

      { "type": "total",         "amount": { "amount": 7770, "currency": "USD" } }
    ],
    // If inclusive, set these and omit the separate lines (or set to zero).
    "inclusions": { "feesIncluded": false, "taxesIncluded": false },

    // ACTUALLY PAYMENT PLAN STUFF IS IN THE CHECKOUT FLOW
    // "paymentPlan": {
    //   "kind": "installments",        // installments | subscription
    //   "deposit": { "amount": 2000, "currency": "USD" },
    //   "installments": {
    //     "count": 4,
    //     "perInstallment": { "amount": 1442, "currency": "USD" },
    //     "interval": "month",         // day | week | month
    //     "schedule": [                // include only for mode='detailed' or if server chooses to show
    //       { "dueAt": "2025-11-01T00:00:00Z", "amount": { "amount": 1442, "currency": "USD" } }
    //     ]
    //   }
    }
  }
}
```

> NOTE: We may want to show some sort of hint or notice that you can use a payment plan to purchase with. Badge, microcopy, etc.

---

## 8) Minimal Field Glossary (Quick Reference)

**`context`**: `eventId`, `displayTimezone`, `locale`, `effectivePrefs{ displayRemainingThreshold, showFeesHint, showTypeListWhenSoldOut, hideZeroInventoryVariants, ctaLabelOverrides }`

**`axes`** _(optional)_: `types`, `typesPerOrder`, `ticketsPerType`

**`sections`**: `[{ id:'primary'|'addons', label, order, labelOverride|null }]`

**`product`**: `id`, `type`, `name`, `description?`, `capabilities{ timeBound, supportsWaitlist, supportsBackorder, shipRequired, subscription }`, `variantDifferentiators[]`

**`variant`**: `id`, `name`, `variantAttributes{}`, `price{ mode, amount?, currency?, caption? }`, `visibilityWhenGated`

**`commercial`**: `status`, `reasons[]`, `reasonTexts?`, `demandCapture`, `limits{ perVariant?, perUser?, perOrder? }`, `remaining{ inventory?, perUser?, perOrder? }`, `maxSelectable`, `schedule{ currentWindow?, nextWindow? }`

**`gates`**: `logic:'all'|'any'` (now: `'all'`), `requirements[{ kind, satisfied }]`, `visibilityWhenGated:'visible'|'hidden'`

**`relations`**: `requires?{ scope:'selection'|'ownership', anyOf[], allOf[] } | null`

**`display`**: `placement:'section'|'children'`, `sectionId:'primary'|'addons'`, `badges[]?`, `lowInventory?`

**`uiHints`** _(optional)_: `feesNote?`

**`pricing`** _(top‑level optional)_: `showPriceSummary:boolean`, `summary?{ mode, lines[], inclusions, paymentPlan? }`

---

## 9) Invariants & Guardrails

- `commercial.maxSelectable` is **authoritative**; panel must **not** recompute clamps.
- If any gate is unmet and `visibilityWhenGated='visible'`, show **locked** row and **no purchase/waitlist CTA**.
- If `commercial.status='outOfStock'` & `demandCapture='waitlist'` & gates satisfied ⇒ **Join Waitlist** CTA.
- If **all items sold‑out** and `context.effectivePrefs.showTypeListWhenSoldOut=false`, render compact waitlist‑only state.
- UTC everywhere; the panel only formats with `displayTimezone` and `locale`.
- Sections are server‑defined, not tenant‑configurable; item order is respected.

---

## 10) Examples

### A) GA (available) + VIP (sold out, waitlist)

> _(See previous example payload—you can reuse it unchanged with this spec.)_

### B) Add‑on as child of GA

```jsonc
{
  "product": {
    "id": "prod_add_meal",
    "type": "addon",
    "name": "Meal Voucher",
    "capabilities": {
      "timeBound": true,
      "supportsWaitlist": false,
      "supportsBackorder": false,
      "shipRequired": false,
      "subscription": false
    },
    "variantDifferentiators": []
  },
  "variant": {
    "id": "var_add_meal_default",
    "name": "Meal Voucher",
    "variantAttributes": {},
    "price": {
      "mode": "fixed",
      "amount": 2500,
      "currency": "USD",
      "caption": "Per voucher" // supports short hints; fees note managed via prefs (see uiHints)
    },
    "visibilityWhenGated": "visible"
  },
  "commercial": {
    "status": "available",
    "reasons": [],
    "demandCapture": "none",
    "limits": { "perVariant": 2, "perUser": 2, "perOrder": 2 },
    "remaining": { "inventory": 50, "perUser": 2, "perOrder": 2 },
    "maxSelectable": 2
  },
  "gates": {
    "logic": "all",
    "requirements": [],
    "visibilityWhenGated": "visible"
  },
  "relations": {
    "requires": { "scope": "selection", "anyOf": ["prod_ga"], "allOf": [] }
  },
  "display": { "placement": "children", "sectionId": "primary" }
}
```

### C) Access‑code gated (locked, visible)

```jsonc
{
  "gates": {
    "logic": "all",
    "requirements": [{ "kind": "access_code", "satisfied": false }],
    "visibilityWhenGated": "visible"
  },
  "commercial": {
    "status": "notOnSale",
    "reasons": ["requires_code"]
  }
}
```

---

## 11) Open Extension Points

- **Reason codes**: keep a server registry (code → default copy); override via `reasonTexts` as needed.
- **Additional gates** (membership/age/geo/approval): add to `gates.requirements` (logic stays `all`).
- **More sections**: payload is forward‑compatible (add a section; items target it via `display.sectionId`).
- **Variants/Seats**: when seats.io or similar arrives, populate `variantDifferentiators` and `variantAttributes` for real coexisting options.
- **Backorder**: for physical goods, set `demandCapture='backorder'` (CTA label differs, behavior parallel to waitlist).

---

## 12) Changelog

- **v0.2** — Adds sections, add‑on placement, pricing footer contract, explicit gates behavior, reason codes & texts, and invariants.
- **v0.1** — Initial event‑page panel contract (context, items, commercial, gates, hints).

---

_Notes & lineage:_  
This spec aligns with the states and components captured in your FigJam/PDF export (Sold Out & Waitlist, Past Event, AccessCodeCTA/Drawer, DynamicNotice stacks, SingleTypePrice, EventActionButton, axes for types/quantities per order).

_Consistency check against prior bullets & decisions:_

- **Multiple gates** supported via `requirements[]` with `logic:'all'` (no scope policy flag).
- **Preferences** are **one merged object** (`effectivePrefs`) returned by a single server call (Query key can include orgId/eventId).
- **Add-ons** can render **as section or children** via `display.placement` + `relations.requires`.
- **Display context** carries `displayTimezone` + `locale`.
- **Snapshots** are a server/storage concern (JSON blob or deduped snapshot rows); **not** part of this contract.
- **Fees note** shows only when `effectivePrefs.showFeesHint=true`; rich price footer is **server‑computed** and optional.
- **Panel does not recompute business rules** (status, demand capture, clamping) — those are **inputs**, not logic.

---

## Addendum: Architectural Principles (Why This Contract Works This Way)

> _This section explains the design decisions behind the contract structure. Understanding these principles helps prevent common mistakes like moving business logic into the UI or merging orthogonal concerns._

---

### A) The Panel Never Computes Business Rules

**The Boundary:**

**What the engine MUST decide (authoritative):**

- `commercial.status`, `reasons`, `demandCapture`
- `commercial.maxSelectable` and its components (`remaining.inventory`, `remaining.perUser`, `remaining.perOrder`)
- Gate satisfaction state
- Schedule evaluation and "next window" metadata

**What the panel CAN do (view‑only):**

- Choose **labels** and **controls** based on `(status, demandCapture, product.type, selection)`
- **Clamp UI** to `maxSelectable` (already computed) and disable/enable CTA accordingly
- Render **notices/hints** from `reasons` and schedule metadata
- Apply **tenant copy/branding** tokens via `effectivePrefs.ctaLabelOverrides`

**Why:** The panel is purely presentational. All policy computation happens server‑side (rules engine), ensuring consistent business logic across all client types (web, mobile, API consumers). The panel receives decisions, not raw data to decide from.

**Impact:** No price math, no policy recomputation, no schedule evaluation in the panel. Zod validation at the edges keeps payloads trustworthy; pattern matching keeps branches explicit and safe.

---

### B) Schedules Are Metadata, Not Computation

**The Pattern:**

The engine evaluates calendars, blackouts, and time windows, then produces:

- **Effective status** (`notOnSale`, `windowEnded`, `expired`, etc.)
- **Window metadata** (`commercial.schedule.currentWindow`, `nextWindow`)

The panel **never** computes schedules. It only renders hints (e.g., countdown to `nextWindow.startsAt`) if window metadata exists.

**Why:** Keeps the panel "dumb" while supporting both simple ("sales start Oct 30") and complex ("weekends only except blackout periods") rules. All timezone math, business‑day calculations, and blackout logic stay server‑side.

**Impact:** The contract supports arbitrarily complex scheduling without increasing panel complexity. Adding holiday blackouts or multi‑window sales requires zero UI changes.

---

### C) Demand Capture Is a Decision, Not an Inference

**The Split:**

- **Catalog (static capability):** `product.capabilities.supportsWaitlist`, `supportsBackorder`
- **Engine (dynamic decision):** `commercial.demandCapture: 'none' | 'waitlist' | 'notifyMe' | 'backorder'`
- **Panel (display):** Shows the CTA the engine decided on

**Why:** Whether to offer waitlist/notify‑me/backorder depends on product type + inventory policy + tenant settings + compliance rules. That's domain logic that belongs in the rules engine, not inferred in the UI.

**Example:** A product might support waitlist capability, but the engine decides _not_ to offer it because the event is too close or tenant settings disable it. The panel displays what the engine decided.

**Impact:** Business rule changes (like "disable waitlist 24h before event") require no UI deployment—just engine logic updates.

---

### D) Reason Codes Enable Extensibility

**The Pattern:**

Carry **codes** (stable, machine‑readable) and optional **texts** (server‑provided, localized):

```jsonc
"commercial": {
  "status": "notOnSale",
  "reasons": ["outside_window", "requires_code"],
  "reasonTexts": { "outside_window": "Sales open October 30 at 2pm CT" }
}
```

**Panel's job:** Map `reasons` → presentation:

- `"requires_code"` → locked UI + AccessCodeCTA
- `"outside_window"` → DynamicNotice with "Sales open…" hint
- `"capacity_reached"` → "Sold Out" notice
- `"tenant_paused_sales"` → warning notice

**Why:** This mirrors Stripe's pattern for coupons/promos (separate code from copy). Stable codes let you add new reasons server‑side with fallback UI, then refine presentation later. Optional `reasonTexts` let you override copy per‑product without changing code.

**Impact:** Tenant‑specific messaging ("VIP pre‑sale starts soon") or custom reasons don't require UI changes. Server can A/B test copy by varying `reasonTexts`.

---

### E) Limits: Components + Result for Transparency

**The Pattern:**

Send **limit components** + **remaining components** + **final clamp**:

```jsonc
"commercial": {
  "limits": { "perVariant": "infinite", "perUser": 6, "perOrder": 8 },
  "remaining": { "inventory": 42, "perUser": 6, "perOrder": 8 },
  "maxSelectable": 6
}
```

**Panel behavior:**

- Uses `maxSelectable` directly for UI control (stepper max, toggle clamp)
- Uses `remaining.*` to show **honest hints** like "Only 3 left" or "Max 2 per order"

**Why:** Gives transparency (helpful user hints) without moving policy computation into the panel. The engine pre‑clamps to the lowest applicable limit; the panel just displays it and explains _why_ via hints.

**Impact:** Complex limit interactions (inventory + per‑user + promotional limits) are handled once in the engine. Panel stays simple: display the clamp, show the hint.

---

### F) Eligibility, Visibility, and Presentation Are Orthogonal

**The Model:**

Three separate concerns, not one "locked" boolean:

1. **Eligibility (gates):** Can the user purchase this? (`gates.requirements[].satisfied`)
2. **Visibility policy:** Show or hide when gates unmet? (`gates.visibilityWhenGated: 'visible' | 'hidden'`)
3. **Presentation (derived):** How does the panel render it?
   - Gates satisfied → normal
   - Gates unsatisfied + `visible` → **locked** (show AccessCodeCTA)
   - Gates unsatisfied + `hidden` → suppress row

**Why:** Separating these axes avoids mixing "locked" into purchasability logic. Works equally for Tickets, Add‑ons, Physical, Digital, or Subscription products. Adding new gate types (membership, age, geo) requires no UI restructuring.

**Impact:** "Locked + Sold Out" cleanly means "no waitlist until unlocked." The panel doesn't need special‑case branches; it just interprets orthogonal flags.

---

### G) Immutability Enables History and Auditability

**The Pattern (borrowed from Stripe and DDD):**

- **Prices** are immutable. Don't edit the amount; create a **new Price** and archive the old.
- **Snapshots** captured at purchase embed the exact product/variant/price the buyer saw.

> NOTE: Do we want to store snapshots in a snapshots table and reference that in the order record and dedup with a hash or etag or just fuckit it's not that big and postgres is fast embedd in order directly.

**Why:**

- Preserves legal/audit history (what terms/price did the buyer agree to?)
- Supports A/B testing and gradual rollouts without destroying history

**Impact:** The `product_snapshot` table (or embedded JSON on order lines) becomes the source of truth for "what was sold." Rollbacks, disputes, and compliance audits have complete data. Changes are additive, not destructive.

---

### H) Why `effectivePrefs` Is One Merged Object

**The Pattern:**

Server merges org‑level + product‑level preferences into a single `effectivePrefs` object before sending to panel:

```jsonc
"context": {
  "effectivePrefs": {
    "displayRemainingThreshold": 30,  // product override (org default was 10)
    "showFeesHint": true,
    "showTypeListWhenSoldOut": true,
    "hideZeroInventoryVariants": false,
    "ctaLabelOverrides": {}
  }
}
```

**Why:**

- Panel doesn't need merge logic (simpler, fewer bugs)
- Atomic, cacheable via TanStack Query (`['effectivePrefs', orgId, eventId, 'public']`)
- Versionable (add `prefsVersion` field for fast invalidation)

**Impact:** Preference changes are server‑controlled. If you later need fine‑grained caching, you can split the server‑side query without changing the panel contract.

---

### I) Why Add‑ons Use Relations, Not Product‑Type Branching

**The Pattern:**

Add‑ons are **first‑class products** with a dependency expressed via `relations.requires`:

```jsonc
"relations": {
  "requires": {
    "scope": "selection",      // or "ownership"
    "anyOf": ["prod_ga"],
    "allOf": []
  }
}
```

> NOTE: Do we have addons that come for free with a purchase (or purchase of multiple tickets)? FUTURE US PROBLEM

> NOTE: "addon" is a confusing word - **any product could be an addon based on relationships**

**Why:**

- Avoids special‑casing add‑ons in the panel (they're just products with a parent requirement)
- Supports future product types (physical goods, memberships) with the same pattern
- `scope` differentiates "must be in cart" vs "must already own"

**Impact:** The panel disables/hints based on `relations.requires` + current selection/ownership context. No branching on `product.type='addon'`. Rules engine decides eligibility; panel displays the result. We probably shouldn't ever have a product of "type addon" exactly.

tickets, digital, physical

---

### J) Why Sections Are Fixed (For Now)

**Current constraint:**

> NOTE: TWO SECTIONS BY DEFAULT SHOULD PROBABLY BE primary and something like "dependent" with a configurable title?

Sections (`"primary"`, `"dependent"`) are server‑defined, not tenant‑configurable. Optional `labelOverride` allows one‑off renaming.

**Why:**

- Reduces complexity (no section management UI needed yet)
- Covers 95% of use cases (tickets + optional add‑ons)
- Easy to extend later (add section array management) without breaking the contract

**Impact:** Adding more sections (e.g., `"merch"`, `"upgrades"`) is forward‑compatible: add a section, point items at it via `display.sectionId`. The panel already supports rendering arbitrary sections in order.
