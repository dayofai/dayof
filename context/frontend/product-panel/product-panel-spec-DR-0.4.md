<!-- markdownlint-disable MD025 -->

# Product Panel Contract v0.4

> Deprecated and non‑authoritative. Refer to `context/frontend/product-panel/product-panel-spec-0.4.md` for the normative contract. This document is explanatory only and MUST NOT override the spec.

## Context and Guiding Principles

**A.** _Multi-axis state model:_ Each product’s status is broken down into independent axes (Temporal, Supply, Gating, Demand, etc.) rather than a single aggregate state. This lets the server explicitly signal **why** a ticket is or isn’t available at any moment. The client simply reflects these states, showing clear reasons (e.g. “Sold out”, “Requires code”) provided by the server instead of deducing logic.

**B.** _Server as single source of truth:_ The panel UI is a **pure view** of data from the server. All business rules – when sales start/end, how many tickets remain, who can see which tickets, etc. – are determined server-side. The client does **no calculations** for availability or pricing; it just renders what the payload describes. Real-time updates (via polling or push) ensure the client always reflects the authoritative state without guesswork.

**C.** _Gated access (access codes):_ Ticket types requiring a code are handled transparently via a `gating` policy. By default, such products appear in the list but in a **locked** state – the name is visible but the price is masked and no quantity can be selected until an access code is entered. A lock icon and message (“Requires access code”) indicate this. **New in v0.4:** The server can also choose to **omit** locked items entirely until unlocked (for zero information leakage). This behavior is controlled per product by `listingPolicy`: `"visible_locked"` (show as locked) vs. `"omit_until_unlocked"` (hide completely until the correct code is provided). In either case, once the user’s code is validated server-side, the items become visible and purchasable if available. If a gated item is sold out (after unlocking), it still appears (either as a disabled row if visible or via a sold-out notice) to confirm that the code worked – this confirmation differs based on listingPolicy (disabled row vs. a panel-level message if nothing new appears).

**D.** _Live inventory indicators:_ The server provides exact `remaining` counts and `outOfStock` status for each item. The client never assumes infinite supply or guesses “limited” – it uses server flags. When quantities run low, the server can mark an item as **low remaining** (e.g. if remaining <= 10) which the UI highlights (e.g. “Only 5 left!”). Conversely, when stock hits zero, the server marks the item as sold out and the UI shows a “Sold out” status. This consistency ensures inventory is displayed accurately and uniformly.

**E.** _Waitlist and notifications:_ For items that sell out or otherwise become unavailable, the server can enable a **waitlist** or **notify-me** mechanism via the demand capture axis. The panel will show a “Join Waitlist” button or “Notify Me” option automatically when provided in the data. The client doesn’t decide when to show these – it simply reflects `demandCapture` info from the server. All post-selection flows (joining waitlist, receiving notifications) are handled outside the panel but triggered from these server-driven UI elements.

**F.** _Unified selection flow:_ The panel consolidates choosing tickets (and add-ons) into one interface. Users can select quantities for one or multiple ticket types directly in the panel. There’s no separate “cart” page for ticket selection – adding tickets in the panel is effectively building the order. The server ensures any selection rules (max tickets, category requirements) are communicated so the client can enforce them as the user picks tickets. The result is a streamlined UX where the panel always knows if the selection is valid or not (using server-provided rules and limits).

**G.** _Payment plans indication:_ If an event offers installment plans (payment plans) for purchases, this is communicated at the panel level. Instead of per-ticket “Payment Plan” badges (which were considered in earlier versions), v0.4 uses a **panel notice** to inform the buyer (e.g. a banner stating “Payment plans available at checkout”). This avoids cluttering individual ticket rows with redundant badges. The availability of payment plans is an event-wide preference (`paymentPlanAvailable`), and the server will send a single clear message in the panel when true.

**H.** _No hardcoded copy:_ All user-facing text and labels in the panel come from the server or a configurable copy dictionary – nothing is hard-wired in the client code. This includes status messages (“Sold out”, “Sales start in…”, “Requires code”), button labels (“Add”, “Join Waitlist”), error prompts (“Max 4 tickets per order”) and so on. The server payload provides either the exact text or a template for the client to fill in dynamic values. This ensures consistency across platforms and easy localization or tweaking of wording without client releases.

**I.** _Dynamic panel notices:_ The engine can send high-level notices or banners to the panel for important event-wide statuses. For example, if all public tickets are gone, the server might send an “Event Sold Out” banner (possibly with a CTA to join a waitlist). If tickets remain but are hidden behind an access code, the server can prompt “Enter access code to view tickets.” These **panel-wide notices** ensure the user is never confused about what to do next. The client simply renders these notices in priority order as directed, without needing to infer the overall situation.

**J.** _Badge usage and details:_ Items can display **badges** – short labels like “Popular”, “New”, or “Members” – which highlight special attributes or restrictions. These badges are fully driven by server data (`display.badges` array for each item). The client does not generate badges or labels on its own. Some badges may have additional info; v0.4 supports attaching tooltips or hovercards to badges (for example, a “?” icon explaining what “Members” means). The server provides any such extra details in the payload (`display.badgeDetails` referencing context.tooltips or hovercards). This keeps all explanatory text centralized and consistent.

**K.** _Sold-out panel behavior:_ When an event is completely sold out (no inventory remaining in any ticket type), the panel UI can collapse into a compact state. The default setting (`showTypeListWhenSoldOut`) controls this: if false, the list of ticket types will be hidden entirely and only an “Event Sold Out” message (and possibly a waitlist signup button) will be shown. If true, sold-out items remain listed (disabled) for transparency. The server signals when an event is fully sold out (taking into account any hidden gated stock) so the client can choose the appropriate mode. This approach prevents an empty-looking panel and guides the user on next steps (like joining a waitlist) instead of presenting a dead end.

**L.** _Add-ons and dependencies:_ The panel handles add-on products (like parking passes, merch, or meal vouchers) as first-class items with defined relationships to main tickets. The server specifies any parent-child relationship – e.g., a meal voucher might require at least one main ticket in the order, or a parking pass might be limited to one per order. The client uses these rules to enable or disable add-on selection appropriately, but does not hardcode any specific logic (e.g., there’s no special-case code saying “parking is one per order” – it all comes from the data). This means the panel can adapt to new product dependency types without code changes.

**M.** _Fulfillment and delivery badges:_ Each product’s delivery method or redemption method is described by the server (in `product.fulfillment`). The panel may show icons or badges to represent these (for example, a mobile phone icon for mobile-only tickets, a shipping truck for physical merchandise, or an Apple Wallet logo if Apple Passes are available). These cues are all driven by the data. If multiple fulfillment options exist (say e-ticket and will-call), the server might provide a hovercard with details or the client can list them. But the key principle is that the client doesn’t assume anything about how a ticket is delivered – it reads and displays the provided info.

**N.** _Scope of panel:_ The Product Panel covers everything up to adding tickets and add-ons to an order. It ensures the user has selected what they need (meeting any min/max rules) and then hands off to the checkout process. Payment processing, seat assignment (in the case of reserved seating), and user authentication are outside the scope of this panel contract. This separation keeps the panel logic focused and simpler. The panel’s job is to accurately represent what can be bought, allow the user to choose, and communicate that choice forward.

**O.** _Security and fraud prevention:_ Because all logic lives server-side, the system is robust against tampering. The client cannot unlock hidden tickets or purchase more than allowed except by calling the server, which validates everything again on its end. Access codes are verified on the server, and if too many invalid attempts occur, the server can withhold further tries or delay responses (rate limiting). This design prevents users from discovering secret tickets or bypassing purchase limits via client manipulation. Essentially, the client is a dumb terminal respecting whatever the server says is the current state.

**P.** _Panel type & selection rules:_ The engine explicitly defines whether an event uses a **single-ticket panel** or a **multi-ticket panel**, and how selections can be made, via a new `orderRules` object in the payload. For example, some events allow only one ticket type per order (choose either VIP or GA, not both), whereas others allow mixing multiple types. Some events might allow buying multiple of the same type, others only one of each type. All such rules (single vs multiple types, max quantity per type, minimum required selections) are described by the server in `context.orderRules`. This removes any guesswork on the client – the UI will adapt (for instance, disabling multiple selections or defaulting quantities to 1) based purely on these server-provided rules. In short, v0.4 makes the panel configuration data-driven: the client doesn’t need separate “modes” hardcoded for one-ticket events vs. many-ticket events; it just reads the rules and renders accordingly.

## 0 – Why Greenfield Enables Clean Design

Building this panel from the ground up (a “greenfield” approach) has enabled a clean separation of concerns between the server and client. In earlier systems, clients had to embed a lot of business logic (when to enable a button, when to show a warning, etc.), leading to inconsistencies and bugs. With the new contract, **the server is the authority** on all such rules, and the client is a minimal, dumb view. Key benefits of this approach include:

- **Unified logic & less client code:** All complex conditions (timing, inventory, gating, limits) are handled on the server, so the client doesn’t replicate them. This reduces the surface for errors and means any change (like extending a sale or adding a new ticket type) only happens in one place – the backend.
- **Dynamic adaptability:** The payload fully describes the state, so the UI can adjust automatically to different scenarios. For example, the same panel code handles a normal on-sale event, a presale that hasn’t opened yet, or an event that’s sold out – all by checking flags in the data. We don’t need separate front-end components or modes for these cases.
- **Improved user clarity:** Because the server sends explicit reason codes and messages for each state, users see clear, context-specific messaging. Instead of a generic disabled button, they see “Sales ended” or “Enter access code” as appropriate. This is possible since the server knows exactly why an item is unavailable and communicates it directly.
- **Streamlined new features:** The contract-first design makes adding features easier – we add new fields and client just renders them. There’s no tangled logic to retrofit. For instance, adding a waitlist flow or a membership-only ticket type was done by extending the state and context schema, with minimal front-end changes.

**New in v0.4, the architecture is pushed even further:**

- **Server-driven panel configuration:** The new `context.orderRules` object lets the server declare how the selection UI should behave (single vs. multiple ticket types, quantity limits, etc.). The client no longer has to guess the panel “mode” or embed conditional layouts for one-type events – it reads `orderRules` and automatically conforms to the defined rules. This makes the UI more flexible and eliminates hard-coded assumptions about how many tickets can be bought.
- **Stronger gating controls:** Access-code-protected inventory is now fully under server control. A new `listingPolicy` for gated items allows the server to hide certain ticket types entirely until unlocked, preventing any unintended hints of their existence. Additionally, `context.gatingSummary` flags if hidden gated tickets are present, so the client knows to present an unlock prompt. The client itself has no logic to filter or reveal gated items – it just reacts to what the server includes or omits in the payload, ensuring **zero leakage** of secret inventory.
- **Clear global vs. local messaging:** We’ve separated event-level notices from item-level notes. The server can send **panel-level banners** (via `context.panelNotices`) for overarching messages like “Event Sold Out” or “Payment plans available”, while individual ticket rows focus on their own status (like “Sold out” or “Only 2 left”). This separation, introduced in v0.4, keeps the UI clean and the messaging unambiguous. It also reinforces the server’s role in deciding which messages are high-priority or global, versus those tied to specific tickets. The client simply renders each notice in the appropriate place with the provided text.

## 1 – Multi-Axis State Model

Every product in the panel has a `state` composed of multiple **axes** that each represent one dimension of its availability. This model lets us reason about different factors independently:

- **Temporal axis:** Is the product within its sale window? This axis includes a `phase` value like `"before"`, `"during"`, or `"after"` (relative to on-sale and off-sale times). If a ticket is not yet on sale or sales have ended, this axis will provide reason codes like `outside_window` or `sales_ended`. Temporal state is entirely decided by server-side schedule – the client does not calculate countdowns or check clocks beyond displaying what the server sends.
- **Supply (Inventory) axis:** Is there stock available? The `supply.status` can be `"available"` (tickets remaining), `"limited"` (remaining but below a threshold), or `"none"` (sold out). If available, a numeric `remaining` count may be provided (e.g., 5 tickets left). If none, a reason code `sold_out` is given. This axis purely reflects the backend inventory count or external system status – for example, if tied to a venue’s seat map, the engine will update this status accordingly. The client doesn’t try to infer sold-out status; it relies on `supply.status`.
- **Gating (Access) axis:** Is special access required to buy this product? If `required: true`, the item is gated behind an access condition (like an invite code or membership). The `satisfied` flag indicates if the user has met that condition (e.g., entered the correct code or logged in as a member). The new `listingPolicy` field defines how the item is treated _when the gate is not satisfied_: if `"visible_locked"`, the item is still included in the payload but marked locked (with a lock icon and a “requires code” message). If `"omit_until_unlocked"`, the item will **not appear at all** in the `items` list until the gate is satisfied (the server literally withholds it to prevent any hint of its existence). In the gating axis, `reasons` will typically include `requires_code` (or a similar code) when gating is in effect, and possibly `unlocked` when a code has been applied. The client uses these flags strictly – if an item isn’t in the list (omitted), it’s as if it doesn’t exist until the server says otherwise.
- **Demand capture axis:** This covers alternative options when a product isn’t directly purchasable, like joining a waitlist or registering for notification. If an item sells out but a waitlist is available, the server will set `demandCapture.kind = "waitlist"` (with details like an URL or action to launch it). Similarly, for “notify me” when tickets might be released later, `kind = "notifyMe"`. If none of these apply, `kind = "none"`. The server may also send reason codes here (for example, an item might have `demandCapture.reasons: ["waitlist_offered"]`). The client doesn’t contain custom logic for waitlists beyond displaying the button when told.
- **Admin/Listing axis:** This axis represented internal publication status (like whether a product is enabled for sale). In practice, however, any item not meant for the user (unpublished or deactivated) is simply **omitted from the payload**. Thus, there is no “inactive” item state visible to the client – if a ticket type is off the market, the server won’t include it. One exception is items requiring special approval: a product with `approvalRequired` (e.g., an invite-only event where organizers must approve requests) might be shown with a “Request Access” CTA instead of an Add button. This is indicated via a flag rather than a full axis, but it ties into admin logic (the server will treat such requests differently on the backend).

All these axes combine to form the overall `state` for an item. For example, a Members-Only ticket before the presale starts might have:

```jsonc
"state": {
  "temporal": { "phase": "before", "reasons": ["outside_window"] },
  "supply":   { "status": "available", "remaining": 50, "reasons": [] },
  "gating":   { "required": true, "satisfied": false, "listingPolicy": "visible_locked", "reasons": ["requires_code"] },
  "demand":   { "kind": "none", "reasons": [] }
  // (No "admin" field present; item is listed and active. If approvalRequired were true, it would be noted elsewhere.)
}
```

In this example, the ticket hasn’t gone on sale yet (temporal), has inventory waiting (supply), and needs an access code (gating) which the user hasn’t entered, so it’s locked. The client would render it as “Members Only – Coming Soon” with a lock, based on those states. Once the sale window opens (temporal phase flips to "during") and if the user enters the correct code (satisfied becomes true), the gating reason disappears and the item becomes selectable.

Crucially, if a gated item’s `listingPolicy` was `"omit_until_unlocked"`, it wouldn’t even appear in that JSON until the code is satisfied. The server would exclude it entirely, and `context.gatingSummary` (discussed later) would hint that some hidden item exists. This multi-axis approach, combined with server filtering, ensures the client only ever sees what it should, with explicit flags for every condition.

## 2 – Contract Snapshot (JSON Shape)

Below is a snapshot of the panel contract JSON for an example event. This event has multiple ticket types: a General Admission ticket (available, with low stock), a VIP Package (sold out, but offering a waitlist), and a Members-Only Presale ticket (locked behind an access code). We also illustrate an event-level notice (payment plans available) and the server-provided rules for selection. The JSON is shown with comments for explanation (comments prefixed by `//` are not actually in the payload):

```jsonc
{
  "context": {
    "orderRules": {
      "types": "multiple",
      "typesPerOrder": "multiple",
      "ticketsPerType": "multiple",
      "minSelectedTypes": 0,
      "minTicketsPerSelectedType": 0
    },
    "gatingSummary": {
      "hasAccessCode": true,
      "hasHiddenGatedItems": false
    },
    "panelNotices": [
      {
        "code": "payment_plan_available",
        "severity": "info",
        "text": "Payment plans are available at checkout"
      }
    ],
    "effectivePrefs": {
      "showTypeListWhenSoldOut": true,
      "paymentPlanAvailable": true
    },
    "reasonTexts": {
      "sold_out": "Sold out.",
      "requires_code": "Requires access code."
    },
    "hovercards": [
      {
        "id": "members_info",
        "title": "Members Only",
        "body": "This ticket is available exclusively to members with an access code."
      }
    ]
  },
  "items": [
    {
      "product": {
        "id": "prod_ga",
        "name": "General Admission",
        "type": "ticket"
      },
      "variant": {},
      "state": {
        "temporal": { "phase": "during", "reasons": [] },
        "supply": { "status": "limited", "remaining": 5, "reasons": [] },
        "gating": { "required": false, "satisfied": true, "reasons": [] },
        "demand": { "kind": "none", "reasons": [] },
        "microcopy": [
          {
            "code": "remaining_low",
            "placement": "row.under_quantity",
            "severity": "info",
            "text": "Only 5 left!"
          }
        ]
      },
      "commercial": {
        "faceValue": 5000,
        "currency": "USD",
        "feesIncluded": false,
        "limits": { "perOrder": 10, "perUser": 10 },
        "maxSelectable": 10
      },
      "display": {
        "badges": ["Popular"],
        "lowRemaining": true
      }
    },
    {
      "product": { "id": "prod_vip", "name": "VIP Package", "type": "ticket" },
      "variant": {},
      "state": {
        "temporal": { "phase": "during", "reasons": [] },
        "supply": { "status": "none", "reasons": ["sold_out"] },
        "gating": { "required": false, "satisfied": true, "reasons": [] },
        "demand": { "kind": "waitlist", "reasons": [] }
      },
      "commercial": {
        "faceValue": 15000,
        "currency": "USD",
        "feesIncluded": false,
        "limits": { "perOrder": 2, "perUser": 2 },
        "maxSelectable": 0 // sold out, not selectable
      },
      "display": {
        "badges": [],
        "lowRemaining": false
      }
      // The client would show a "Sold out" label and a "Join Waitlist" button for this item.
    },
    {
      "product": {
        "id": "prod_mem",
        "name": "Members-Only Presale",
        "type": "ticket"
      },
      "variant": {},
      "state": {
        "temporal": { "phase": "during", "reasons": [] },
        "supply": { "status": "available", "remaining": 30, "reasons": [] },
        "gating": {
          "required": true,
          "satisfied": false,
          "listingPolicy": "visible_locked",
          "reasons": ["requires_code"]
        },
        "demand": { "kind": "none", "reasons": [] }
      },
      "commercial": {
        "faceValue": 8000,
        "currency": "USD",
        "feesIncluded": false,
        "limits": { "perOrder": 4, "perUser": 4 },
        "maxSelectable": 0 // locked, cannot select until unlocked
      },
      "display": {
        "badges": ["Members"],
        "badgeDetails": {
          "Members": { "kind": "hovercard", "ref": "members_info" }
        },
        "lowRemaining": false
      }
      // This item is currently locked (requires code), so its price is hidden and quantity selection is disabled.
    }
  ],
  "pricing": {
    "currency": "USD",
    "lineItems": [
      { "code": "TICKETS", "label": "Tickets", "amount": 0 },
      { "code": "FEES", "label": "Fees", "amount": 0 },
      { "code": "TOTAL", "label": "Total", "amount": 0 }
    ],
    "mode": "reserve"
  }
}
```

**Notes on the example:** This demonstrates the overall shape of the payload:

- The `context` section contains global information about the panel and event: in this case `orderRules` indicating multiple types and tickets can be selected, a `gatingSummary` that tells the client an access code feature is in play (`hasAccessCode:true`) but no completely hidden items (`hasHiddenGatedItems:false` because our gated item is visible as locked). We also see a `panelNotices` array with one entry – a banner about payment plans – which the client will display prominently. The `effectivePrefs` here shows some boolean settings (like whether to list ticket types when sold out, and that payment plans are indeed available). There’s a `reasonTexts` object mapping common reason codes to the exact text to display (e.g. “Sold out.”). Finally, we include a `hovercards` list: in this case, a hovercard with ID `"members_info"` provides extra info about the "Members" badge, and the `display.badgeDetails` in the item links to it.
- The `items` array contains an object for each ticket type or add-on on sale (excluding any that the server intentionally omitted). Each item has a `product` (basic identity info), and crucially a `state` composed of our axes. For example, the GA ticket’s state shows `temporal.phase:"during"` (on sale now), `supply.status:"limited"` with `remaining:5` (low stock), no gating required, and no special demand capture. We also see a `microcopy` array under state: the server put a message “Only 5 left!” to emphasize the low quantity. The VIP ticket’s state has `supply.status:"none"` with a reason `sold_out`, and `demand.kind:"waitlist"` indicating a waitlist is available instead of purchase. The Members-Only ticket has `gating.required:true` and `satisfied:false` with `listingPolicy:"visible_locked"`, meaning it’s in the payload but locked. Its supply shows 30 remaining (though that number won’t be shown until unlocked), and we see the gating reason code `requires_code`. The presence of that code and the `hasAccessCode` flag in context tells the client to render an input for the user’s access code.
- Each item also has a `commercial` section for pricing and purchase limits. For instance, face value prices are given in cents (5000 = $50.00 for GA). The `limits.perOrder` and `perUser` show maximum allowed tickets as decided by server config, and `maxSelectable` is the effective cap taking into account current stock and those limits. In the VIP example, `maxSelectable:0` because it’s sold out (no tickets can be added). For the Members item, `maxSelectable:0` as well because it’s locked (not available for selection yet). The client uses `maxSelectable` to control the UI (e.g., disabling quantity steppers when 0).
- The `display` section of each item contains visual embellishments. GA has a `"Popular"` badge, and since its `lowRemaining` is true, the UI could highlight it (the microcopy already covers the text “Only 5 left!” in this case). VIP has no special badges. The Members-Only ticket has a `"Members"` badge, and `badgeDetails` provides a reference to a hovercard (`members_info`) that explains the badge on hover. Display also can include other hints (for example, icons for fulfillment methods, not shown in this snippet).
- The `pricing` section at the bottom is a summary of the order’s cost breakdown. Here it’s shown in a simplified form with placeholder amounts (all 0 since no tickets are selected yet). It lists line items for tickets, fees, and total, and indicates the `currency` (USD). The `mode:"reserve"` suggests that prices are in reservation mode (face value plus calculated fees); see Appendix B for details on pricing modes and calculations. The key point is the client does not compute these totals – it will receive an updated `pricing` block as the user selects tickets, with all calculations done by the server (including any taxes, discounts, or payment plan adjustments if applicable).

This snapshot includes many of the v0.4 features (like `orderRules`, `panelNotices`, and `badgeDetails`) in context. A real payload may omit fields that are empty or not needed (for example, if no access code is in use, `gatingSummary` would be absent or false; if no payment plan, the panel notice wouldn’t be sent). The schema in the next section defines which fields are optional and their default values.

## 3 – State Composition → Rendering

Given the rich state provided for each item, the client determines how to render each row and what interactive elements to show. This section breaks down the mapping from state to UI:

### A) Row Presentation & Inclusion

Each item’s high-level presentation in the list is derived from its gating/admin status:

- If an item is not sent by the server (e.g. because it’s unpublished or it’s a gated item withheld until code unlock), it is **suppressed** in the UI – essentially invisible, since the client doesn’t even know about it. There is no placeholder or indication that a suppressed item exists.
- If an item is included but **locked** (`gating.required=true` and `satisfied=false` with `listingPolicy="visible_locked"`), it is shown in the list in a disabled, non-selectable state. The row will typically appear greyed-out with a lock icon, and the price will be hidden or replaced with a “Locked” placeholder. The user cannot select a quantity for this row until they unlock it with a code.
- Otherwise (the item is either not gated or the gate is already satisfied), the row is shown normally (we’ll call this **normal** presentation). “Normal” here means the item is listed with its name, price, and a way to select tickets _if_ they are available. Note that “normal” can include an item that is sold out – it’s still listed (since it was included in the payload) even though it can’t be bought. Sold-out items remain visible to indicate their status, whereas suppressed items are completely hidden.

In summary, **suppressed vs. visible** is decided by the server (unpublished or `omit_until_unlocked` items simply won’t be in the data). If visible, a row is either in a normal state (which could be purchasable or sold-out) or a locked state. The client doesn’t arbitrarily hide or show rows beyond this logic.

### B) Purchasability Criteria

Not every visible row can be added to the cart; some are merely informational or require another action. A ticket type is considered **directly purchasable** (the user can pick a quantity) only if **all** of the following are true:

- **Within sale window:** The current time is during the selling phase for that item (`temporal.phase == "during"`).
- **In stock:** There is at least 1 item available (`supply.status` is `"available"` or `"limited"`, not `"none"`).
- **Access granted:** If the item is gated (`gating.required == true`), the user has unlocked it (`gating.satisfied == true`). If no special access is required (`required == false`), this condition is trivially satisfied.
- **No alternate process needed:** The item doesn’t require a request/approval flow (`approvalRequired` not active) and isn’t in a waitlist/notify state. (In practice, if an item has `demand.kind` of `"waitlist"` or `"notifyMe"`, it’s out of stock so it fails the stock check above anyway. If an item required manual approval, the server would not mark it as directly purchasable even if it has inventory.)

If any of those conditions fail, the user cannot immediately purchase that item. Instead of a quantity selector, the UI will show an appropriate message or alternative action (covered below). For example, if `temporal.phase` is "before", the item might display “On sale soon” instead of an Add button; if `supply.status` is "none", it will say “Sold out”; if `gating.satisfied` is false, it will remain locked until a code is provided.

### C) Call-to-Action (CTA) Resolution

Based on the above, the client decides what interactive control (if any) to show for each item:

- **Add/Select (Purchasable):** If an item meets all purchasability criteria, the user gets a control to select quantity. This could be a “+” button to add tickets or a number input. In a multi-ticket scenario, typically a stepper (increment/decrement) or dropdown is shown. The label might implicitly be “Add” (for 1) or just the control itself. Essentially, the CTA here is to pick tickets.
- **Request (Approval Required):** If an item is not directly purchasable but has `approvalRequired == true` (meaning the user must request permission or an invite), the panel should show a “Request Access” or “Request to Join” button. Clicking this would initiate whatever approval flow is appropriate (outside the panel scope). The key is that the client knows to show this CTA instead of an Add button because the server flagged the item as needing approval.
- **Join Waitlist:** If an item is sold out (`supply.status="none"`) but `demand.kind == "waitlist"`, the row should display a “Join Waitlist” button. This CTA invites the user to sign up for any openings. Similarly, if `demand.kind == "notifyMe"`, a “Notify Me” (or “Get Notified”) button is shown so the user can receive an alert if tickets become available. The presence of these CTAs is directly driven by `demand.kind` in the data.
- **No CTA (Unavailable):** If an item is not purchasable and none of the above alternatives apply, then the row is essentially just informational. For example, if tickets haven’t gone on sale yet (phase "before"), or have ended (phase "after" with no waitlist), or are sold out with no waitlist, the row will have no active button. Instead, it will just show a status text like “Sold out” or “Unavailable” as provided by the server’s reason text. Another case here is a gated item that hasn’t been unlocked – it shows as locked with a “Requires access code” note instead of any CTA button.
- **Access Code Flow:** In the case of locked gated tickets (requires code), the “action” to unlock is not a row-level button but a panel-level input (see Notices below). So the row itself shows no CTA, just the lock icon and message. The user must enter the code using the UI outside the row, after which the item’s state will update if the code is correct.

Additionally, the panel has a **global checkout button** (e.g. “Continue” or “Checkout”) that proceeds to the next step with the selected tickets. This button is enabled only when the selection is valid. Typically, that means at least one ticket has been added (and if `orderRules` specifies a minimum, that condition is met). If every visible item is unsellable (sold out or locked with no code entered), the main checkout button will remain disabled since there’s nothing to proceed with. The client doesn’t allow proceeding until there’s a valid selection in the cart.

### D) UI Element Visibility by State

Different parts of the row’s UI (name, price, quantity selector, etc.) appear or hide depending on the state:

- **Row not listed (suppressed):** No UI at all for that product. The user has no indication it exists. This occurs for fully gated items withheld until code unlock, or any product the server didn’t send due to being deactivated.
- **Name & Details:** The item’s name is always shown if the item is listed. Additional details like a subtitle or description would also always show (if provided in the product info), regardless of availability.
- **Price:** The price is shown for all listed items **except** when the item is locked behind a code. In the locked case, since the user isn’t supposed to know the price without authorization, the price field might display “Locked” or simply be blank/obscured. For sold-out items, the price can still be shown (often still useful information), although some UIs may style it in a muted way. In our design, we do not hide the price just because something sold out; we only hide it for gated locks.
- **Quantity/Selection Controls:** If an item is purchasable, a quantity selector (or at least an “Add” button) is visible. If the item is not purchasable (for any reason: sold out, not on sale yet, locked, etc.), the quantity input is not shown. Instead, the user sees either an alternate CTA (like the waitlist button) or just a status text. In practice, a sold-out row might show a “Sold Out” label right where the quantity control would have been, or a waitlist button in that spot. A locked row might show a lock icon in the quantity column. The exact layout can vary, but the principle is the client will not render an interactive quantity control when `maxSelectable` is 0 or the state indicates no.
- **Access code input:** The field or button to enter an access code is presented at the panel level (not within each row). If `context.gatingSummary.hasHiddenGatedItems` is true – meaning there are ticket types not currently visible due to gating – the panel will prominently display an “Enter Access Code” prompt (often as a banner or a special row at the top of the list). If instead all gated items are already visible (i.e., `hasAccessCode` true but `hasHiddenGatedItems` false, as in our example), the panel might still provide a smaller code entry UI (for example, a link or input near the top) so that users know how to unlock those locked types. In either case, the code input is a singular element affecting the panel as a whole, not repeated per item.

### E) Notices and Informational Text

The panel distinguishes between **panel-level notices** and **row-level notices/microcopy**:

- **Panel-level notices:** These are banner-style messages that apply to the event or panel as a whole. They come from the `context.panelNotices` array. The client renders them prominently (often at the top of the panel, or sometimes at the bottom). Examples include an **event sold out** notice (“All tickets are sold out”), an **access code prompt** (“Enter an access code to view available tickets”), an **urgency alert** (“Selling fast – only 20 tickets left across all sections”), or a **payment plan offer** (“Payment plans available – choose SplitPay at checkout”). Each notice can have a severity (info/warning) which might influence its styling (e.g., a warning for urgent or final sale notices), and optionally an `action` (like a button to “Join Waitlist” or “Learn More”). The server decides when a panel notice is needed and provides all content for it (text and optional action). The client simply displays them in the order or priority given. If multiple notices are present, the client will stack them or otherwise ensure they’re all visible (the server can also prioritize them to avoid overload).
- **Row-level notices and microcopy:** These are tied to specific items, giving the user context about that item’s status. They usually derive from the `state.reasons` of each axis or the `state.microcopy` messages. For instance, if a ticket is not yet on sale, the temporal axis might include a reason code `outside_window` and the server could provide a human-friendly text like “On sale Fri 10 AM” – the client would show this text just below the ticket name or in place of the Add button. If an item has very few left, the server might include a microcopy message like “Only 2 left!” (as we saw in the example) which the client shows beneath the quantity selector. Other examples: “Max 4 per customer” (if the user tried to select more than allowed – this could be a dynamic client-side validation message using a template from `context.clientCopy`), or “Includes VIP lounge access” (a static note that could be in `state.microcopy` as neutral info). The server can send pre-formatted microcopy for any special case it knows (e.g., “Presale ends tomorrow” for a limited time offer), and it also supplies generic templates for the client to use when needed (like the max ticket limit message). The client’s job is to collate these and display them in the designated spots (usually as smaller, italic or grey text under the relevant row or input).

In gating scenarios, the approach to notices differs based on the `listingPolicy`:

- If a gated item is **visible but locked**, the fact that it’s locked is conveyed as a row-level notice (often just the text from `reasonTexts.requires_code` next to a lock icon). The user sees the item but knows a code is needed.
- If a gated item is **hidden until unlocked**, then a panel-level notice covers it (e.g., “This event has tickets available for certain audiences. Enter access code to unlock.”). The user doesn’t see any specific item, but the notice tells them that entering a code might reveal something. Once they enter a valid code and the server sends the updated payload including the item, that panel notice might be replaced or removed, since now the unlocked item will appear (possibly with its own row-level status if needed).

The separation of panel vs row notices ensures that broad messages (like event-wide sold out or code prompts) don’t get lost among the list, and that each item’s specific status is clearly labeled right next to it.

### F) Notable Edge Cases & Scenarios

Thanks to server-driven logic, the client can handle edge cases by following the data. Here are some scenarios and how the panel responds:

- **Event completely sold out (no inventory at all):** The server will mark every item’s `supply.status` as "none" and typically send a panel notice like _“Event Sold Out”_. If a waitlist is configured for the event, that notice might include a “Join Waitlist” action. If the preference `showTypeListWhenSoldOut` is false, the client will hide the list of ticket types entirely and just show the sold-out message (and waitlist button). If that preference is true, the client will still list each ticket type with a “Sold out” label, but it may also show a banner at the top for emphasis. In either case, the checkout button is disabled because nothing can be selected.
- **All public tickets sold out, but hidden gated tickets exist:** This is a tricky scenario where, to a normal user, the event looks sold out, but there _are_ tickets available if you have an access code (for example, a secret allotment for VIPs or members). In this case, the server sets `hasHiddenGatedItems=true` in context (since those items were omitted). The client, seeing that flag, will _not_ display an “Event Sold Out” final state. Instead, it will show an **access code prompt** notice, e.g. “Enter access code to unlock tickets.” The visible list might either be empty (since all public items are gone and `showTypeListWhenSoldOut=false`) or show just the sold-out public items (if true), but the key is the user is being told that entering a code could reveal availability. Until they enter a code, the main checkout button stays disabled because, from the client’s perspective, nothing is selectable yet.
- **Mix of sold-out and locked (visible gated) tickets:** Suppose an event has one ticket type that’s sold out and another that’s gated and currently locked (visible). The panel will show both rows: one marked “Sold out” and the other with a lock icon and “Requires access code.” The user can’t select anything at first (sold-out one is gone, locked one is disabled), so the checkout button is disabled. However, because `hasHiddenGatedItems` would be false (the gated item is visible), the server might not show a big code prompt banner – it might assume the user will understand to use their code for the locked item. To avoid confusion, our client could still surface a smaller hint (like an “Unlock” button or an icon near the locked row to open the code input). Once the user enters the code and if it’s correct, the server will respond with a new payload where that gated item’s `gating.satisfied` is true (and possibly now `supply.status` might still be available or could turn out to be sold out as well). If it becomes available, the row switches to normal and the user can select tickets. If it was actually sold out behind the gate, see next point.
- **Gated item unlocked but no inventory (or waitlist):** It’s possible that by the time a user enters their access code, the reserved tickets are gone (e.g., the presale allocation sold out). In that case, when the payload refreshes, the formerly hidden or locked item will appear (or become unlocked) but with `supply.status:"none"`. The outcome is the panel will effectively look sold out. We handle this gracefully by showing the item as sold out (and if a waitlist is configured for that group, a join waitlist CTA). The panel notices might update too – if previously we had an “Enter code” prompt, the server might replace it with an “All tickets sold out” notice once everything (including the gated ones) are indeed gone. The user thus gets confirmation that their code worked (they see the item) but unfortunately it’s no longer available. They could then join a waitlist if offered. The client doesn’t treat this as an error; it’s just a state update based on new data.
- **Inventory available, but sales paused:** In rare cases, an event organizer might pause ticket sales (perhaps due to a technical issue or at their discretion). If the server wants to indicate “no one can buy right now” but not due to stock or timing, it can utilize a special reason code (e.g., `sales_paused` or `temporarily_unavailable`) likely via the admin axis or as a panel notice. The client should then treat all items as unavailable (no Add buttons) and show the provided message. For example, the panel could display a warning notice “Ticket sales are temporarily paused. Please check back later.” All rows might be disabled accordingly even if `supply.status` still says available. (In our model, the server could simulate this by flipping `temporal.phase` to a custom value or simply not allowing purchase attempts server-side; regardless, a clear notice would be provided to avoid confusion.) As soon as the server resumes sales, a new payload would restore the normal state.
- **Other combinations:** The client code doesn’t explicitly hardcode responses for every combo of states – it relies on the server’s flags. For example, if a ticket is both time-restricted and quantity-limited and gated, all those conditions will be reflected in its state (reasons might include “sales end at 5PM”, “members only”). The client will show all relevant notices for that item (there could be multiple lines of microcopy). By following the data, even unusual combinations (like a gated item that also has a waitlist after unlocking) are handled without additional client if/else logic beyond what we’ve described.

### G) Rendering Rules Recap (Client as Pure View)

To ensure consistency, the front-end follows a set of rendering rules directly derived from the data:

- **Quantity selection enforcement:** The client strictly uses `orderRules` to manage selection UI. If `orderRules.typesPerOrder` is `"single"`, the UI will limit the user to choosing only one type (for example, radio buttons might be used instead of checkboxes or multiple steppers). If `orderRules.minSelectedTypes` is greater than 0 (say 1), the panel may automatically select one ticket type by default or at least require one before enabling checkout. Similarly, if `orderRules.minTicketsPerSelectedType` is 1, the UI might start each selected item at quantity 1 (disallowing a zero selection once a type is chosen). These behaviors are all driven by the numeric rules; the client does not hardcode assumptions (like “single event means auto-select one”) – it reads these values and applies them.
- **Max tickets and validation:** The `commercial.maxSelectable` field tells the client the maximum quantity the user can pick for that item (taking into account inventory and any per-order limit). The quantity input will be clamped to this value. If the user tries to exceed it (somehow), the client will simply not allow it or will show an error message. For example, if maxSelectable is 4 and they attempt to type “5”, it could revert to 4 and show a small “Max 4 per order” message. The text for such messages comes from `context.clientCopy` (e.g., a template like `"You can only select up to {max} tickets."`). Likewise, if there’s a minimum (some events might require at least 2 tickets, etc.), the client would enforce that via templates (“Select at least {min} tickets.”). All these limits are communicated by the server (either in `limits` or as explicit orderRules fields); the client does not implement any arbitrary caps on its own.
- **Price and fee display:** The client shows the pricing info exactly as given. Each item’s price (and any fee breakdown if provided per item) is displayed using the currency and formatting from the data. If fees are included or excluded, the client trusts the `feesIncluded` flag to maybe show a note (“+ fees” if feesIncluded=false, for instance, using copy provided for such context). The summary at the bottom updates live as the user changes quantities, but those updates come from the server recalculating and sending a new `pricing` object. In short, the client never re-calculates prices or fees – it only renders the numbers provided.
- **Badges and indicators:** As noted, any badges in `display.badges` are rendered as small labels near the item name. The client doesn’t add any beyond what’s provided. If a badge has an entry in `badgeDetails`, the client will enable a hover tooltip or popover: e.g., for the “Members” badge, hovering might show the text from our `members_info` hovercard. This is all configured by the payload – the client just connects the dots (badge text -> detail ref -> display content). Some badges are purely decorative (“Popular”), others might indicate status (“21+” or “Mobile Only”) which could also be conveyed elsewhere, but the principle is the server is the one populating those.
- **No implicit text – use provided copy:** Whenever the UI needs to show text that isn’t just a data value, it should come from the payload. We’ve covered this, but to reiterate: labels like “Sold out”, “Join Waitlist”, “Enter Code”, error messages for invalid inputs, etc., are all sourced from either `reasonTexts`, `panelNotices.text`, `clientCopy` templates, or similar fields. The client has a copy map for these keys (populated from context), so it doesn’t have strings like `"Sold out"` hardcoded. This makes it easy to support multiple locales or just change wording (e.g., “Fully booked” instead of “Sold out” could be delivered by the server without a client deployment). Developers implementing the client should ensure every piece of text displayed corresponds to some entry in the contract data.

## 4 – Schema Definitions (TypeScript / Zod)

To formally define the contract, we use Zod schemas (a TypeScript-friendly validation library). These schemas serve both as documentation and as runtime validators to ensure the client is handling the payload correctly. Below is the complete schema with all fields, including the new additions for v0.4 (marked with comments `// (v0.4)` where applicable):

```typescript
// Schemas defining the structure of the panel contract (context, items, state, etc.)

// 1. Context-level schemas (global panel data)
const OrderRulesSchema = z.object({
  types: z.enum(["single", "multiple"]).default("multiple"), // Does the event have one ticket type or multiple types in the listing
  typesPerOrder: z.enum(["single", "multiple"]).default("multiple"), // Can the buyer select only one type per order, or multiple types in the same order
  ticketsPerType: z.enum(["single", "multiple"]).default("multiple"), // Can the buyer select only one ticket per type, or multiple tickets of a given type
  minSelectedTypes: z.number().int().default(0), // Minimum number of distinct types that must be selected to proceed (usually 0 or 1)
  minTicketsPerSelectedType: z.number().int().default(0), // Minimum quantity per type if a type is selected (usually 0, meaning no enforced minimum beyond 0)
});

const GatingSummarySchema = z.object({
  hasAccessCode: z.boolean().default(false), // True if at least one product in this event requires an access code (whether visible or hidden)
  hasHiddenGatedItems: z.boolean().default(false), // True if there are gated products that are currently omitted from the items list (locked and not visible to the user yet)
});

const NoticeActionSchema = z.object({
  label: z.string(), // Text on the action button (e.g. "Join Waitlist", "Learn more")
  kind: z.enum(["link", "drawer"]), // The type of action: open an external link, or open an internal panel/drawer
  target: z.string().optional(), // Target destination: e.g. a URL if kind=="link", or an identifier for an internal route/drawer
});

const NoticeSchema = z.object({
  code: z.string(), // Machine-readable code for this notice (e.g. "event_sold_out", "requires_code", "payment_plan_available")
  scope: z.enum(["panel", "item"]).default("panel"), // Scope of the notice: "panel" for global notices (all notices in context.panelNotices use "panel")
  severity: z.enum(["info", "warn", "error"]).default("info"), // How urgent/important the notice is (info=normal, warn=highlight, error=problem)
  title: z.string().optional(), // Optional title or heading for the notice (if the UI wants to bold a summary)
  text: z.string().optional(), // The main text of the notice (could include template placeholders if params provided)
  params: z.record(z.any()).optional(), // Dynamic parameters for the text template, if applicable (e.g. {count: 5} for "Only {count} left")
  action: NoticeActionSchema.optional(), // Optional action button the user can click as part of this notice
  priority: z.number().optional(), // Optional priority ordering (lower number = higher priority, or vice versa, as defined by server)
  expiresAt: z.string().optional(), // Optional timestamp after which this notice is no longer relevant (could be used to auto-expire banners)
});

const MessageTemplateSchema = z.object({
  key: z.string(), // Identifier for the template (e.g., "quantity_max_reached")
  template: z.string(), // The template string, possibly with placeholders, e.g. "You can only select {max} tickets."
  locale: z.string().optional(), // Locale for which this template is intended, if this is localized copy
});

const ClientCopySchema = z.object({
  selection_min_reached: z.string().optional(), // e.g. "Please select at least one ticket to continue"
  selection_max_types: z.string().optional(), // e.g. "You can only select one ticket type"
  quantity_min_reached: z.string().optional(), // e.g. "Minimum {min} tickets required for this type"
  quantity_max_reached: z.string().optional(), // e.g. "Maximum {max} tickets per order for this type"
  // (Additional client-side validation messages or labels can be included as needed)
});

const TooltipSchema = z.object({
  id: z.string(),
  text: z.string(), // Short text to display on hover as a tooltip
});
const HoverCardSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  body: z.string(),
  action: NoticeActionSchema.optional(), // Optional action for a hovercard (e.g., a "Learn more" link if needed)
});

// ContextSchema ties all the above together
const ContextSchema = z.object({
  orderRules: OrderRulesSchema.optional(), // (v0.4) Panel selection rules
  gatingSummary: GatingSummarySchema.optional(), // (v0.4) Summary of gating usage
  panelNotices: z.array(NoticeSchema).default([]), // (v0.4) Replaces previous dynamicNotices
  effectivePrefs: z
    .object({
      // Effective preferences or settings for this panel (usually derived from event configuration)
      showTypeListWhenSoldOut: z.boolean().default(true),
      paymentPlanAvailable: z.boolean().default(false),
      // ...other preferences like display options can be added here
    })
    .default({}),
  reasonTexts: z.record(z.string()).default({}), // Mapping of reason code -> user-facing text (for common inline statuses like "Sold out", "Requires access code")
  copyTemplates: z.array(MessageTemplateSchema).optional(), // (v0.4) Optional template messages
  clientCopy: ClientCopySchema.optional(), // (v0.4) Custom strings for client validation messages
  tooltips: z.array(TooltipSchema).optional(), // (v0.4) Tooltip definitions for badges/info
  hovercards: z.array(HoverCardSchema).optional(), // (v0.4) Hovercard definitions for richer info
});

// 2. Item-level schemas (for each product entry in the panel)
const TemporalSchema = z.object({
  phase: z.enum(["before", "during", "after"]).default("before"), // Sales phase for this item relative to now
  // Optionally, could include start/end times, but those can be derived from context if needed
  reasons: z.array(z.string()).default([]), // Reason codes explaining temporal state (e.g. ["outside_window"] if before start)
});
const SupplySchema = z.object({
  status: z
    .enum(["available", "limited", "none", "unknown"])
    .default("available"), // Inventory status
  remaining: z.number().int().optional(), // Tickets remaining (exact count, if known and applicable)
  reasons: z.array(z.string()).default([]), // Reason codes for supply (e.g. ["sold_out"] if status is none)
});
const GatingSchema = z.object({
  required: z.boolean().default(false), // True if an access code or membership is required for this item
  satisfied: z.boolean().default(false), // True if the user has already met/unlocked the requirement (or not required in the first place)
  listingPolicy: z
    .enum(["visible_locked", "omit_until_unlocked"])
    .default("visible_locked"),
  // (v0.4 replaces visibilityPolicy) How to handle the item when not unlocked: show as locked vs omit entirely
  reasons: z.array(z.string()).default([]), // Reason codes for gating (e.g. ["requires_code"] if locked, or ["unlocked_via_code"] if just unlocked)
});
const DemandSchema = z.object({
  kind: z.enum(["none", "waitlist", "notifyMe", "backorder"]).default("none"), // Alternate availability method
  reasons: z.array(z.string()).default([]), // Reason codes for demand capture (e.g. ["waitlist_offered"] if waitlist is present)
});
const AdminSchema = z.object({
  approvalRequired: z.boolean().optional().default(false), // True if this item must be requested (cannot be directly bought)
  reasons: z.array(z.string()).default([]), // Reason codes for admin/state (e.g. ["sales_paused"] if admin paused this item)
});

// Inline microcopy message schema for item-specific messages
const MicrocopyMessageSchema = z.object({
  code: z.string(), // Identifier for the message (e.g., "remaining_low", "sales_end_time")
  placement: z.string(), // Where to display (e.g., "row.under_title", "row.under_quantity")
  severity: z.enum(["info", "warn", "error"]).default("info"),
  text: z.string().optional(), // The actual text to display (if already formatted)
  params: z.record(z.any()).optional(), // Parameters if the text is a template (e.g., {minutes: 10} for "Sales end in 10 minutes")
  priority: z.number().optional(), // If multiple messages, priority can dictate order (lower = higher priority or vice versa)
});

const StateSchema = z.object({
  temporal: TemporalSchema,
  supply: SupplySchema,
  gating: GatingSchema,
  demand: DemandSchema,
  admin: AdminSchema.optional(),
  microcopy: z.array(MicrocopyMessageSchema).optional(), // (v0.4) Inline messages provided by server
});

// Product info and related schemas
const FulfillmentSchema = z.object({
  methods: z.array(z.string()).default([]), // Delivery methods for this product (e.g., ["eticket", "apple_pass", "physical_mail"])
  // Additional fulfillment details (like estimated delivery, redemption info) could be included as needed
});
const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["ticket", "add_on", "physical", "digital"]).default("ticket"),
  fulfillment: FulfillmentSchema.optional(),
  // Other product metadata like category, description, etc., can appear here if relevant
});
const VariantSchema = z.object({}).passthrough().optional(); // Placeholder for variant-specific data (e.g. seat info, time slot). Empty for GA tickets.

// Pricing and commercial limits for an item
const CommercialSchema = z.object({
  faceValue: z.number().int(), // Base price of one unit (in cents, or minor currency unit)
  currency: z.string(), // Currency code, e.g. "USD"
  feesIncluded: z.boolean().default(false), // True if faceValue already includes fees, false if fees will be added on top
  limits: z
    .object({
      perOrder: z.number().int().optional(), // Max tickets of this type allowed per order (if any)
      perUser: z.number().int().optional(), // Max tickets of this type allowed for one user across all orders (if tracked)
    })
    .default({}),
  maxSelectable: z.number().int().default(0), // The maximum quantity that can currently be selected (clamped by inventory and per-order limit)
});

// Relations between products (e.g., add-on linkage)
const RelationsSchema = z.object({
  parentProductIds: z.array(z.string()).default([]), // If this item is an add-on, which product(s) it depends on
  matchBehavior: z.enum(["per_ticket", "per_order"]).optional(),
  // "per_ticket": one of this add-on can be bought for each parent ticket (e.g., 1 parking pass per ticket)
  // "per_order": only one (or a fixed number) of this add-on can be added regardless of ticket quantity
});

// Display hints for the item (badges, flags)
const BadgeDetailRefSchema = z.object({
  kind: z.enum(["tooltip", "hovercard"]),
  ref: z.string(), // Matches an id in context.tooltips or context.hovercards
});
const DisplaySchema = z.object({
  badges: z.array(z.string()).default([]), // Short labels to show on the item (e.g. "Popular", "VIP", "Members")
  badgeDetails: z.record(BadgeDetailRefSchema).optional(), // (v0.4) Links badges to tooltips/hovercards
  lowRemaining: z.boolean().optional().default(false), // True if this item is below the low-stock threshold (triggers urgency styling)
});

// Putting it all together for each panel item
const PanelItemSchema = z.object({
  product: ProductSchema,
  variant: VariantSchema.default({}),
  state: StateSchema,
  commercial: CommercialSchema,
  relations: RelationsSchema.optional().default({}),
  display: DisplaySchema,
  // (If needed, we could also include an item-level reasonTexts override or copy override, but generally not required as global context covers it)
});

// The overall panel contract schema:
const PricingSummarySchema = z.object({
  currency: z.string(),
  lineItems: z
    .array(
      z.object({
        code: z.string(),
        label: z.string(),
        amount: z.number().int(),
      })
    )
    .default([]),
  total: z.number().int().optional(), // Total amount (could be derived from summing lineItems, included here for convenience)
  mode: z.enum(["reserve", "final"]).default("reserve"),
  // "reserve": interim pricing (e.g., before final taxes or before payment selection), "final": final price locked in
});
const PanelDataSchema = z.object({
  context: ContextSchema,
  items: z.array(PanelItemSchema).default([]),
  pricing: PricingSummarySchema,
});
```

_(The schema above is quite detailed. In summary: the **ContextSchema** holds event-wide settings, notices, and copy; each **PanelItem** has a structured **state** (temporal, supply, gating, etc.), pricing info in **commercial**, optional **relations** to other items, and display hints. The **PricingSummarySchema** at the end outlines how the cost breakdown is provided. Developers should use these schemas as a guide to what each field means and to ensure their code accounts for all possibilities.)_

## 5 – Client/Server Responsibilities & State Derivations

One of the core principles of this design is a clear separation of responsibilities:  
the **server is authoritative** for all business logic and state, and the **client derives** its UI state solely from the server data (often using simple Jotai atoms or similar state management). This ensures consistency and eliminates redundant logic. Here we outline what each side is responsible for:

### Server – Source of Truth (Authoritative)

- **Event timing & availability:** The server determines the `temporal.phase` for each item (based on configured on-sale/off-sale times) and includes any countdown info or “sales paused” flags if needed. The client does not calculate or assume anything about current time vs. sale time beyond displaying what’s in the payload.
- **Inventory status & limits:** The server is the sole arbiter of how many tickets remain (`supply.remaining` and `status`). It marks items sold out or limited. It also applies any purchase limits (per order or per user) and conveys them via `limits` and the computed `maxSelectable`. The client never enforces hidden limits; it only respects the numbers given (e.g., disabling the “+” button if maxSelectable is reached).
- **Gating & item visibility:** The server controls which items appear in the list. Gated items that shouldn’t be seen are simply omitted. Gated items that are visible show up with `required:true` and `satisfied:false`, and the server chooses `listingPolicy` to indicate if they’re shown locked or kept hidden. The client does not try to filter or hide anything on its own – it will render whatever is in `items`. Only the server knows if the user has provided a valid code (and will send updated state accordingly).
- **Panel configuration:** The server declares the panel’s selection rules in `context.orderRules` (v0.4). This covers whether multiple types can be bought together, and any minimum selection requirements. The client doesn’t have separate code paths for one-type events or multi-type events; it looks at these rules and adjusts the UI. (For example, if `typesPerOrder` is "single", the server will also ensure only one type appears selected at a time by how it accepts input – the client just follows the rule and might auto-deselect others if needed.)
- **Dynamic notices and messages:** The server decides when to send panel-level notices (banners) and provides all their content. If the event is sold out or nearly sold out, the server may include a notice about that. If an access code is available, it might include a notice prompting the user. The client will not invent such banners; it only shows what’s given in `panelNotices`. Likewise, for each item, the server can attach reason codes and text (via `reasons` and `reasonTexts` or `microcopy`) to explain that item’s status (e.g., “Sold out”, “Waitlist available”). The client doesn’t have a list of conditions to check to then display messages – it relies on the server’s provided reasons.
- **Pricing calculations:** All pricing (ticket prices, fees, totals, discounts, installment info) is computed by the server. The `pricing` object in the payload is the source of truth for display. If the user changes a quantity, the client will request an updated pricing summary from the server (or the server may push an update). The client never tries to calculate totals or fees itself, as business rules like taxes or discounts could be complex.
- **Security checks:** The server validates any user input that affects state – for example, if the user enters an access code, the server checks it (and rate-limits attempts). If the user tries to select more tickets than allowed, the server will also enforce that on submission (the client’s UI will prevent it, but the server double-checks). Essentially, the server treats the client as untrusted beyond UI convenience, re-confirming that all selection rules, gating, and limits are satisfied when an order is submitted.
- **Final authority on alternates:** If a waitlist or notification list is available, the server includes that in the payload (`demand.kind`). The client doesn’t decide “if sold out then show waitlist” – it only does so if instructed. Similarly, if something like a “Backorder” or future delivery option exists, the server would represent that in data, and the client would adapt. No conditional flows are hardcoded on the client; they’re data-driven.

### Client – Derived State & UI Reactions

- **Row presentation derivation:** The client computes a simple presentation state for each item based on server data (as described in 3A): for example, `rowPresentation(item) = "locked"` if `item.state.gating.required` is true and not satisfied (and the item is present), or `"normal"` otherwise. If an item isn’t in the list at all, it’s effectively “suppressed”. This derived value is used to decide CSS styling (e.g., greyed out with lock vs. normal).
- **CTA logic:** The client maps the state to the correct CTA or lack thereof (as in 3C). It checks `state` fields like `supply.status`, `temporal.phase`, `demand.kind`, and `admin.approvalRequired` to decide: show an Add button/quantity stepper, or a “Sold out” label, or a “Join Waitlist” button, etc. For example, if `approvalRequired=true` on an item, the client will show the “Request” button instead of “Add”. If `demand.kind=="waitlist"`, it shows the waitlist join button. These decisions are straightforward translations of server flags – the client isn’t making any guess beyond following the mapping rules defined earlier.
- **Combined state flags:** The client can derive some helpful panel-level flags from the item list. For instance, it may compute `allVisibleSoldOut = true` if every item in `items` has `supply.status=="none"`. (However, it will also check `context.gatingSummary.hasHiddenGatedItems`; if that is true, then it knows the event is not truly sold out, there’s just hidden inventory.) It might compute `anyLocked = true` if any item is in a locked state (to decide whether to render a code input UI). These derived booleans simply summarize the server data for easier rendering logic.
- **Selection validation:** Using `context.orderRules` and item data, the client handles enabling/disabling the main checkout button. For example, it can derive `selectionValid = (numberOfSelectedTypes >= minSelectedTypes)` and also ensure each selected type has at least `minTicketsPerSelectedType`. If not, it can disable the proceed button and perhaps show a message (using `clientCopy.selection_min_reached`, for instance). This is a reactive step – whenever the user adjusts a quantity, the client recalculates these conditions.
- **Panel mode logic:** The client uses preferences and state to decide the panel layout. For instance, `context.effectivePrefs.showTypeListWhenSoldOut` combined with an `allVisibleSoldOut` condition will tell the client whether to hide the list and just show a sold-out notice. If `hasHiddenGatedItems` is true (hidden code-locked tickets exist), the client knows it should render the panel in a mode that encourages code entry (showing the access code banner instead of a final sold-out state). These mode decisions are again direct reactions to the flags the server provides.
- **User input handling:** The client is responsible for capturing user interactions – like entering an access code, clicking “Join Waitlist”, incrementing a quantity, etc. However, for any such action that affects state, the client just sends a request to the server and awaits updated data. For example, when the user enters a code and hits “Apply”, the client calls the unlock endpoint and, on success, receives a new `items` list (with previously hidden items now included or a locked item’s `satisfied` now true). The client then merges or replaces the panel state with the new data. It doesn’t locally flip an item to unlocked without server confirmation. Similarly, clicking “Join Waitlist” might open a server-provided link or trigger an API call – the client doesn’t remove the item or anything; any change (like marking the user as on the waitlist) would come in a subsequent payload if relevant.
- **Displaying messages and errors:** The client takes all the text provided (panelNotices, reasonTexts, microcopy, clientCopy templates) and chooses where to display it, as specified. If multiple microcopy messages exist for an item, it might sort by priority or just display in the order given. If the user triggers a validation error (say tries to go to checkout without selecting required tickets), the panel might show a message – e.g., we might use `selection_min_reached` if we have a rule that at least one must be selected. By pulling these from `clientCopy`, we allow easy copy changes without code changes. In essence, the client is the presenter: it decides _when_ to show a certain message (e.g., when the user clicks checkout without meeting conditions), but _what_ message to show has been provided beforehand.
- **No business logic duplication:** Importantly, the client does **not** duplicate core business logic. It doesn’t recalculate inventory, it doesn’t enforce purchase limits beyond what the server says, it doesn’t implement its own idea of who can access a ticket. All of that is derived from the data. This keeps the client logic simple: mostly computing simple booleans or selecting which UI element corresponds to a state. By following this discipline, we avoid issues where the server and client disagree – the server’s view always wins.

In a React/Jotai context, many of the above derive naturally. For example, one could have a `useVisibleItems` atom that filters out any items with `state.gating.required && !state.gating.satisfied && listingPolicy=="omit_until_unlocked"` (though in practice those items aren’t in the array at all). A `rowPresentation` selector can map each item to `"normal" | "locked"` based on gating flags. An `allOutOfStock` selector can reduce over items to see if any `supply.status` is not "none". And so on. Each of these uses the server state as input. By structuring the data this way, the client’s derived state stays in sync with the server with minimal effort. When in doubt, **the server data is the single source of truth**, and the client should not override or ignore it.

## 6 – Client Implementation Pseudo-code

To illustrate how the client might implement the above logic, here are some pseudo-code snippets (in a React/Jotai style) that map server data to UI state. These are simplified for clarity:

```js
// Determine the presentation style of a row based on gating and inclusion
function getRowPresentation(item) {
  if (item.state.gating.required && !item.state.gating.satisfied) {
    if (item.state.gating.listingPolicy === "omit_until_unlocked") {
      return "suppressed"; // (This item wouldn't even be in the list normally)
    } else {
      return "locked"; // Visible but locked
    }
  }
  return "normal"; // Not gated (or already unlocked)
}

// Determine which call-to-action to display for an item
function getRowCTA(item) {
  // If the row is locked or suppressed, there's no direct action
  if (getRowPresentation(item) === "locked") {
    return { type: "none" }; // locked items have no immediate CTA (handled via global code input)
  }
  // If item requires approval instead of direct purchase
  if (item.state.admin?.approvalRequired) {
    return { type: "request", label: "Request Access" };
  }
  // If a waitlist is available
  if (item.state.demand.kind === "waitlist") {
    return { type: "waitlist", label: "Join Waitlist" };
  }
  // If a notify-me (coming soon) is available
  if (item.state.demand.kind === "notifyMe") {
    return { type: "notify", label: "Notify Me" };
  }
  // If not in sale window yet or already after, no purchase possible
  if (item.state.temporal.phase !== "during") {
    return { type: "none" }; // e.g., "Sale not started" or "Sale ended" message will be shown via reason text
  }
  // If sold out (and no waitlist, because waitlist case is handled above)
  if (item.state.supply.status === "none") {
    return { type: "none" }; // "Sold out" will be shown via reason text
  }
  // Otherwise, item is available for purchase
  return { type: "add", label: "Add to Order" };
}

// Gather all notices/microcopy to display for an item
function getRowNotices(item, context) {
  const messages = [];
  // 1. Collect reason-based messages from each state axis
  const reasonCodes = [
    ...item.state.temporal.reasons,
    ...item.state.supply.reasons,
    ...item.state.gating.reasons,
    ...item.state.demand.reasons,
    ...(item.state.admin?.reasons || []),
  ];
  for (const code of reasonCodes) {
    const text = context.reasonTexts[code];
    if (text) {
      messages.push({ text, severity: "info" });
    }
  }
  // 2. Include any explicit microcopy messages provided by the server for this item
  if (item.state.microcopy) {
    for (const mc of item.state.microcopy) {
      let msgText = mc.text;
      if (!msgText && mc.params) {
        // Fill in template if needed (assuming context.copyTemplates has the template string)
        const tplEntry = context.copyTemplates?.find((t) => t.key === mc.code);
        msgText = tplEntry
          ? tplEntry.template.replace(
              /\{(\w+)\}/g,
              (_, key) => mc.params[key] ?? ""
            )
          : "";
      }
      messages.push({ text: msgText, severity: mc.severity || "info" });
    }
  }
  return messages;
}

// Example usage for rendering each item row:
panelData.items.forEach((item) => {
  const pres = getRowPresentation(item);
  if (pres === "suppressed") {
    // skip rendering this item entirely
    return;
  }
  const cta = getRowCTA(item);
  const notices = getRowNotices(item, panelData.context);
  // ...then use `pres`, `cta`, and `notices` to render the row accordingly in the UI
});
```

In the above pseudo-code, `context.reasonTexts` provides the base text for reason codes like "sold_out" or "requires_code". For example, if `item.state.supply.reasons` contains `"sold_out"`, the loop will find `"Sold out."` in `reasonTexts` and add that to `messages`. Microcopy messages, which may already have `text` (like "Only 5 left!") are added directly. If a microcopy message came with a code and params but no preformatted text, the client can look up a template in `context.copyTemplates` (not shown for brevity) and interpolate the params.

The client would also set up **derived atoms/selectors** for cross-item logic:

```js
// Example: derived flag for whether all visible items are sold out
const allVisibleSoldOut = computed(() => {
  const items = panelData.items;
  const anyInStock = items.some((it) => it.state.supply.status !== "none");
  return !anyInStock;
});
// Example: whether to show the access code prompt banner
const showAccessCodePrompt = computed(() => {
  return panelData.context.gatingSummary?.hasHiddenGatedItems === true;
});
```

In practice, the server might also provide a direct `eventAllOutOfStock` boolean, but the client can derive it as shown (making sure to consider hidden gated items, as in `hasHiddenGatedItems`).

Finally, handling the **access code entry** flow might look like:

```js
async function submitAccessCode(code) {
  try {
    const response = await api.post("/panel/unlock", { code });
    // The server returns updated panel data if the code is correct
    panelData = response.data; // replace or merge the state with new unlocked items
  } catch (error) {
    // If the code was wrong or expired, the server might return an error code
    if (error.code === "invalid_code") {
      // Update panelNotices to show an error banner (server can also provide this text)
      panelData.context.panelNotices.unshift({
        code: "invalid_code",
        scope: "panel",
        severity: "error",
        text: "Invalid access code. Please try again.",
      });
    }
    // The UI would re-render and show the above error notice to the user.
  }
}
```

In summary, the client’s implementation is mostly about **mapping** server state to UI state and triggering server calls for user actions. The logic is straightforward: check a few flags and decide what to show or enable. If tomorrow we introduce a new state (say, a "Standby Queue" for high-traffic events), the server would send a new `demand.kind` or notice, and the client code can handle it with minimal changes (perhaps just another branch in getRowCTA or a new notice type to display). This aligns with the goal that adding features mostly means updating the server and data, while the client remains a generic renderer of that data.

## 7 – Item Relations & Add-On Dependencies

In some events, certain products depend on others. Common examples are **add-ons** like parking passes, merchandise, or meal vouchers that should only be purchasable alongside a main ticket. The contract represents these relationships in the `relations` field of a PanelItem:

- `parentProductIds`: lists one or more product IDs that this item is tied to. If those “parent” products are not in the order, the add-on might be invalid.
- `matchBehavior`: indicates how the quantity selection of the add-on relates to the parent’s quantity:
  - `"per_ticket"` means the add-on is meant to be bought on a per-ticket basis. For each ticket of the parent type, you can (optionally) get one of these add-ons. The client should constrain the add-on’s quantity to be at most the total number of parent tickets selected. (In some cases, it might even auto-select or strongly encourage a 1:1 match, but that’s a UX decision.)
  - `"per_order"` means the add-on is limited to once per order (regardless of how many parent tickets). The client would typically allow at most one of this item in the cart (or whatever fixed number the server sets). For example, one parking pass per order.

Using these fields, the server informs the client how to enforce rules. The client might implement this by listening to changes in parent ticket quantities and adjusting the add-on’s max selectable quantity. The server also uses `commercial.limits` and `maxSelectable` to reinforce these rules. For instance, a per-order add-on might come with `limits.perOrder = 1`, so `maxSelectable` will be 1 from the get-go. A per-ticket add-on might have a higher limit, but its effective usable quantity will be governed by how many parent tickets are in the cart (which the client ensures). Of course, the server will also validate on its end when the order is submitted (it will reject an order that has an add-on without the parent, or too many add-ons relative to parents, etc.).

**Example:**

```jsonc
// A "Fast Pass" add-on that can be bought for each main ticket (per-ticket match)
{
  "product": { "id": "add_fastpass", "name": "Fast Pass", "type": "add_on" },
  "relations": {
    "parentProductIds": ["prod_ga", "prod_vip"],
    "matchBehavior": "per_ticket"
  },
  "state": { "...": "..." },    // state axes would show if it's available
  "commercial": { "faceValue": 1000, "currency": "USD", "maxSelectable": 0 },
  "display": { "badges": ["Add-On"] }
}
// A "Parking" add-on that is limited to one per order (per-order match)
{
  "product": { "id": "add_parking", "name": "Parking Pass", "type": "add_on" },
  "relations": {
    "parentProductIds": ["prod_ga", "prod_vip"],
    "matchBehavior": "per_order"
  },
  "state": { "...": "..." },
  "commercial": { "faceValue": 2000, "currency": "USD", "limits": { "perOrder": 1 }, "maxSelectable": 1 },
  "display": { "badges": ["Add-On"] }
}
```

In the first case, if a user selects 3 VIP tickets, the client should allow up to 3 Fast Passes to match. In the second case, no matter how many GA or VIP tickets they get, only one Parking Pass can be added (the UI would disable adding a second). The `matchBehavior` is a guide for the client UI, but importantly, the server is the final gatekeeper: it will enforce these rules on the backend as well. If a user somehow bypassed the UI and tried to add 5 parking passes, the server’s `maxSelectable` (1) and order validation would catch it.

The panel contract doesn’t mandate exactly _how_ the client presents these add-ons (some UIs might nest add-ons under the parent ticket, others list them separately and use explanatory text). What matters is that the data makes the dependency clear. The client should convey this to the user (often by labeling add-ons as such and possibly using badges or hover info like “Requires a GA ticket”) and restrict selection appropriately. We also include these relationships in the schema so any consumer of the data (not just our client) can enforce the business rule coherently.

**Note:** _(No changes were needed to this section for v0.4 aside from using the updated field names — v0.3 already handled add-on relations in this way.)_

## 8 – Fulfillment & Redemption

Each product includes information about **fulfillment** – how the ticket or item will be delivered or used by the buyer. This data is typically in `product.fulfillment.methods` and can contain values such as:

- `"eticket"` (electronic ticket delivered via email or app),
- `"will_call"` (pick up at venue),
- `"physical_mail"` (physical item shipped to the buyer),
- `"apple_pass"` (Apple Wallet digital ticket),
- etc.

The client uses this to display appropriate icons or labels. For example, an event ticket with `["eticket", "apple_pass"]` might show a mobile phone icon and an Apple Wallet logo, indicating the ticket will be emailed and can be added to the Wallet. A merchandise item with `["physical_mail"]` might show a shipping truck icon or text like "Ships to your address."

These fulfillment indicators are surfaced as **badges or inline text** in the UI, ensuring the buyer knows what to expect. If multiple methods apply, the UI can list them. If there are special requirements, the server might provide a note via `display.badges` or `state.microcopy`. For instance, a VIP credential that must be picked up might have a badge "Will Call" and a hovercard explaining "Pick up your credential at the event entrance with ID." With v0.4's hovercard support, such details can be included for clarity.

Similarly, if an item has age restrictions or other redemption conditions (e.g., "21+ Only" or "Present membership card on entry"), these can be conveyed either as badges or microcopy. The contract allows for these messages to be part of the payload, so the client doesn’t hardcode any assumptions. The server could, for example, add a microcopy line: _"Must present valid ID (21+)"_ for an alcohol voucher item, or a badge "Members" for a ticket that requires showing a membership card, with a tooltip explaining the requirement.

**Redemption** in this context simply refers to how the buyer gets or uses the item after purchase, and it’s mostly informational in the panel. The actual redemption (scanning the ticket QR code, shipping the item, etc.) happens outside the scope of this UI. The panel’s job is to let the user know of any special fulfillment conditions before they buy.

_(No changes in v0.4 were needed for fulfillment display, other than the ability to provide more detailed info via tooltips/hovercards as noted. The panel continues to rely on the `product.fulfillment` data and associated badges to communicate delivery methods to the user.)_

## 9 – Reference Scenarios

To validate the design, we considered several example scenarios (beyond the multi-ticket example already shown). Each scenario demonstrates different combinations of states and how the contract handles them:

- **A. Standard multi-tier event (Mixed availability):** _Example:_ An event selling General Admission and VIP tickets, with a special Members-Only presale ticket and an optional add-on. This is essentially the scenario we’ve used throughout the spec. GA might be on sale with low stock (`remaining_low` message shown), VIP might be sold out with a waitlist (`demand.kind="waitlist"`), the Members ticket is gated (visible but locked until code entry), and an add-on like a parking pass is available per order. The payload shows multiple items in various states (available, sold out, locked), and the context includes `orderRules` set to allow multiple types. The UI lists all ticket types (except any hidden gated ones), disables selection for sold-out and locked ones, shows the waitlist button for VIP, and has a “Have an access code?” prompt for the Members ticket. We walked through this scenario in detail with the JSON snapshot in Section 2.
- **B. Single-ticket event (All-general admission):** _Example:_ A small show where there’s only one ticket type, “General Admission”, perhaps with a capacity limit. In this case, the server still provides an `items` array (with one item) and a `context.orderRules` optimized for a single-type scenario. For instance, it may set `orderRules.types = "single"` and `minSelectedTypes = 1` (meaning the user must select that one type to proceed). The client can use that info to simplify the UI – it might not even show the ticket list as a list, but rather just a quantity selector since there’s no choice between types. If tickets are available, the panel shows the quantity picker immediately (maybe even defaulting to 1 ticket selected, because it knows at least one must be chosen). If the show sells out, the server will mark `supply.status="none"` for that item and likely send an `event_sold_out` notice. The panel in that case could collapse into a simple “Sold Out” message (especially if `showTypeListWhenSoldOut` is false, it wouldn’t bother showing the single item row at all when it’s empty). This scenario validates that our contract doesn’t need a completely different structure for single-type events – the rules and data just degenerate to a simpler case, and the client adapts accordingly.
- **C. Code-gated presale (Hidden inventory):** _Example:_ An invite-only presale where no tickets are visible to the general public until a code is entered. In this scenario, when a user without a code loads the panel, the server might send an empty `items` list or only show a message that access is restricted. More specifically, any ticket types that exist are marked with `listingPolicy="omit_until_unlocked"` and thus omitted. The context would have `gatingSummary.hasAccessCode=true` and `hasHiddenGatedItems=true`. The server would also likely include a panel notice prompting code entry (e.g., a notice with `code: "requires_code"` and text like "Enter your access code to view tickets"). The client then primarily displays an input for the code. Once the user enters a valid code, the server responds with a new payload where `hasHiddenGatedItems` is false (since now those items are included) and the actual ticket items appear in `items` with `gating.satisfied=true`. From the user’s perspective, the panel “unlocks” and they see perhaps a special ticket type available only to insiders. This scenario tests the zero-leakage aspect: before unlocking, the user has no clue what or how many tickets are behind the gate, and the contract ensures that by not sending those details until allowed.
- **D. Fully sold-out event with waitlist:** _Example:_ An event where all tickets (maybe there was just one type or many) have been sold, but the organizer enables a waitlist for potential openings. The server would mark every item as sold out (`supply.status="none"` on all), and set up a waitlist. There are two ways this might be represented: (1) Each item could individually have `demand.kind="waitlist"`, meaning you join the waitlist for that specific ticket type (useful if the event had GA and VIP and they maintain separate waitlists). The panel would then show a “Join Waitlist” button on each sold-out row. Or (2) the event might have a single waitlist for any ticket that opens up, in which case the server might choose to send a panel-level notice like _“Event Sold Out – join the waitlist to be notified if tickets become available”_ with one action button. In either case, the contract can express this: method (1) uses the per-item demandCapture field, method (2) uses a panelNotice with an action. The client would likely go into a compact mode (no ticket selections, just the message) because nothing can be selected. This scenario shows how the design handles graceful degradation – even when the main function (selling tickets) isn’t available, the panel can still provide next steps to the user (like waitlist) using the same data structure.

Each of these scenarios was modeled with our state axes and payload structure, and we found that no additional client logic was needed beyond what we’ve described. The differences between them are entirely captured by different combinations of `state` values and `context` flags:  
a single vs. multi ticket event is just `orderRules` and one item vs. many, a hidden presale is just `listingPolicy="omit_until_unlocked"` with an access code prompt, etc. This gives us confidence that the contract is flexible enough to accommodate a wide range of situations without changes to the code – adding a new scenario is mostly a matter of configuring the server output appropriately.

## 10 – Reason Code Registry

For reference, here’s a summary of common reason codes and notice codes used in the panel, along with their purpose and typical messaging:

- **Temporal / Scheduling:**
  - `outside_window` – _Info._ The item is not yet on sale (user is too early). The UI might say “On sale soon” or display the sale start time.
  - `sales_ended` – _Info._ The item’s selling window has closed (too late). Often shown as “Sales ended”.
  - `sale_window_final` – _Warn._ The sale is approaching its end (e.g., less than an hour remaining). Could trigger a warning banner like “Sale ends in 1 hour!” to create urgency.
- **Inventory / Availability:**
  - `sold_out` – _Info._ No inventory remains for this item. Displayed as “Sold out”.
  - `low_stock` (or `remaining_low`) – _Info/Urgent._ Inventory is running low (below a server-defined threshold). The server may send a message like “Only X left!” via microcopy rather than this raw code.
  - `all_types_out_of_stock` (or `event_sold_out`) – _Info._ All items are sold out. Triggers an event-level notice, e.g., “Event is sold out”.
  - `fomo_low_supply` – _Info._ Low stock across the event. For example, “Only {N} tickets left in total!” as a panel-level notice to spur action.
- **Gating / Access:**
  - `requires_code` – _Info._ This ticket requires an access code (or membership) to purchase. Shown on locked items as “Requires access code”, or as a panel prompt “Enter access code to unlock tickets”.
  - `code_invalid` – _Error._ The entered access code was not recognized. Likely shown as a red banner “Invalid code. Please try again.”
  - `code_verified` – _Info._ (Less commonly surfaced directly) Indicates an access code was accepted and items unlocked. The client might not show a specific message for this; it just proceeds to show the unlocked state.
- **Demand / Alternate Options:**
  - `waitlist_available` – _Info._ A waitlist is available for this item or event. The UI will show a “Join Waitlist” option. (The text “Join Waitlist” itself is typically a button label rather than a notice, but this code can appear in `demand.reasons`.)
  - `notify_me` – _Info._ A notification sign-up is available (similar to waitlist). The UI shows “Notify Me” option.
  - `waitlist_full` – _Info._ The waitlist has reached capacity or is closed. The UI might show “Waitlist full” or simply disable the waitlist button if this occurs.
- **Admin / Other:**
  - `sales_paused` – _Warn._ Sales are temporarily paused (perhaps due to an admin hold). The panel may show a notice like “Ticket sales are temporarily paused. Please check back later.”
  - `approval_required` – _Info._ Purchase of this item requires approval (cannot be bought outright). The client shows a “Request Access” CTA and possibly an inline note like “Requires approval”.
  - _(Note: An `unpublished` item wouldn’t appear at all; there wouldn’t be a reason code sent for it since the item is omitted entirely.)_
- **Panel-Level Notices:**
  - `event_sold_out` – _Info._ All tickets sold out. Typically triggers a banner “Event Sold Out” (often combined with a suggestion like joining a waitlist).
  - `event_sold_out_waitlist` – _Info._ All tickets sold out, but waitlist open. Banner example: “Event sold out – join the waitlist for updates.”
  - `requires_code` – _Info._ (Same code as the gating reason, but when used as a panel notice) Indicates the user can enter a code to reveal tickets. E.g., “Enter access code to view available tickets.”
  - `payment_plan_available` – _Info._ Payment plan option is available for this event. Shown as a panel-level info banner (“Payment plans available at checkout”).
  - `event_low_remaining` (aka `fomo_low_supply`) – _Info._ A banner to indicate only a few tickets remain overall. For example, “Only 20 tickets left for this event!” if the total inventory across types is low.
  - `sales_end_soon` – _Warn._ A banner to indicate the sale will end soon. E.g., “Sales end tonight at 11:59 PM.”
- **Client-Side Validation (Selection Errors):**
  - `max_per_order_reached` – _Error._ The user tried to exceed the per-order limit for an item. The UI might show “Maximum {max} tickets per order for this item.” (Text coming from `clientCopy.quantity_max_reached` template.)
  - `max_types_reached` – _Error._ The user tried to select too many different ticket types when only one is allowed. Message example: “You can only purchase tickets for one type in this order.”
  - `min_selection_required` – _Error._ The user hasn’t selected the minimum required tickets/types when attempting to checkout. E.g., “Please select at least one ticket to continue.”
  - _(...and similar messages for other client-enforced rules, all using templates provided in `clientCopy`.)_

**Severity legend:** “Info” codes are normal statuses (blue or neutral color, no user action needed besides awareness). “Warn” codes imply urgency or a time-sensitive notice (often styled with amber/orange to draw attention). “Error” codes represent a problem that the user should address (red styling), such as invalid input or an action that can’t proceed.

Many of these codes will be accompanied by text in the payload (either in `reasonTexts`, `panelNotices.text`, or `clientCopy`). The client should not need to hardcode any of the user-facing strings for them. This registry is to help developers understand the meaning of each code. As the system evolves, new codes might be added here (and in the schema), but the client’s job remains the same: react to the codes it sees by displaying the provided message in the appropriate way.
