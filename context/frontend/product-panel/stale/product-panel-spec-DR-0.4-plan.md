# Plan to integrate v0.3 and update content into v0.4

1. **Meeting Context (Sections A–O):**

   - **Section C (Gates / access codes):** Expand the visibility policy to include the new `listingPolicy` concept. The default remains showing gated items as locked (with price masked) until unlocked, but note that the server can alternatively **omit** gated items entirely until an access code is entered. Emphasize that `listingPolicy = "visible_locked"` vs `"omit_until_unlocked"` is a per-product setting. This addresses zero-leakage scenarios (where items shouldn't even appear until unlocked). Maintain the original guidance about showing sold-out gated types (to confirm a code worked) but clarify this is handled via disabled rows if `visible_locked` or via panel-level messaging if omitted.
   - **(Optional) New Section P – Panel Type & Selection Rules:** If appropriate, add a brief new context point summarizing **single vs. multi-ticket panel configurations**. Explain that the engine now explicitly defines whether an event has one ticket type or many, if multiple types can be selected in one order or not, and whether quantities per type can exceed one. (These rules will be formally detailed in the contract schema via a new `orderRules` field in `context`.) This sets the stage for reducing client-side guesswork about panel behavior.
   - **Other Context Sections (A, B, D–O):** Mostly remain the same. We'll double-check for any terminology changes (e.g., ensure we consistently use "remaining"/"outOfStock" instead of inventory/soldOut, already addressed in v0.3). If any context item conflicts with new features (for example, Section G initially showed a PaymentPlan badge on a product, but our update uses a panel notice for payment plans), we will update it. Specifically, remove mention of per-ticket **PaymentPlan** badges in context sections; instead, ensure the context reflects that payment plans are indicated at the panel level (as per initial Section G and the new approach).

2. **Section 0 – Why Greenfield Enables Clean Design:**

   Add a bullet or sentence highlighting the **new enhancements in v0.4** that further the "server as authority, client as pure view" principle:

   - The introduction of **`orderRules`** in `context` means the server now dictates single-vs-multiple selection logic, eliminating hardcoded panel variants on the client.
   - The **access code gating improvements**: a new `listingPolicy` field allows items to be completely omitted until unlocked (no leakage of gated content), and a panel-level `gatingSummary` signals when hidden ticket types exist behind a code. This reinforces the idea that the client does not infer or compute gating logic – it simply reacts to server-provided flags.
   - The separation of **panel-level notices** (banners) from inline messages ensures that important event-wide info (e.g. "Event Sold Out" or "Payment plans available") is delivered authoritatively from the server, maintaining consistency and reducing client logic.
     We'll integrate these points without removing any original v0.3 improvements – just extend the list of benefits enabled by our greenfield approach.

3. **Section 1 – Multi-Axis State Model:**

   Update the **`state.gating` axis definition** to reflect the new `listingPolicy` field. Specifically:

   - Replace `visibilityPolicy` with **`listingPolicy`**, enumerated as `"visible_locked"` or `"omit_until_unlocked"`. Make it clear that if `required=true` and `satisfied=false`, `listingPolicy` dictates whether the item is sent to the client (visible in locked form) or withheld entirely until the gate is satisfied.
   - In the JSON snippet illustrating the `state` structure, show `listingPolicy` instead of the old field.
   - Add a note explaining that **omitted gated items** will simply not appear in the `items` list until unlocked (the server filters them out). This ensures the spec captures the no-leakage design.
     We'll preserve all other axes (temporal, supply, demandCapture) as in v0.3. We will also keep the mention that the listing/admin axis is effectively removed (unpublished items are not sent). If needed, clarify that `admin.state` isn't part of `state` in the payload (the server just omits inactive items entirely, as previously decided).

4. **Section 2 – Contract Snapshot (JSON Shape):**

   Revise the example JSON payload to include the new fields and changes, ensuring no details from v0.3 are lost:

   - **`context` updates:** Add an **`orderRules`** object (with example values). For instance, if the sample event supports multiple ticket types, use `"types": "multiple", "typesPerOrder": "multiple", "ticketsPerType": "multiple", "minSelectedTypes": 0, "minTicketsPerSelectedType": 0` (these reflect a typical multi-ticket event – we'll choose values consistent with the scenario).
     Include **`gatingSummary`** with `hasAccessCode` and `hasHiddenGatedItems`. For the snapshot example, if we don't have an omitted item in the snapshot, `hasHiddenGatedItems` can be false; we might still illustrate `hasAccessCode: true` if we include a gated ticket type in the example.
     Replace any `dynamicNotices` field with **`panelNotices`**. We can demonstrate a panel-level notice if relevant – for example, if `effectivePrefs.paymentPlanAvailable` is true, include a `panelNotices` entry for a Payment Plan notice. Otherwise, we might show an access code prompt or a low supply banner as an example. (We'll ensure the example doesn't become confusing – perhaps a simple `"payment_plan_available"` notice with a text like "Payment plans available at checkout" to illustrate structure.)
     Also include an empty or sample `copyTemplates` array if we decide to illustrate template usage, though this could be omitted for brevity if not critical. The `clientCopy`, `tooltips`, and `hovercards` can be left out or shown as empty defaults in the snapshot to avoid overload, but we will mention them in the schema section.
   - **`items` updates:** Ensure each item's `state.gating` reflects the new schema. For example, a standard publicly available ticket would have `"required": false` (and we can omit listingPolicy since default is visible; or include it as `"visible_locked"` by default), whereas a gated ticket example would show `"required": true, "satisfied": false, "listingPolicy": "visible_locked"` (if we want it visible/locked) or we could illustrate an omitted scenario (though an omitted item wouldn't appear in `items` – we might skip showing an omitted one in the snapshot). We'll update any instance of `visibilityPolicy` to `listingPolicy`.
     We will also update the `display.badges` example: in v0.3, the example GA ticket had `["Popular", "PaymentPlanAvailable"]`. To align with our refined approach (and avoid implying PaymentPlan at item-level), we will remove `"PaymentPlanAvailable"` from the badges in the example. We might leave `"Popular"` or substitute another badge (like `"LimitedRelease"`) just to show the field usage without contradicting the new guidance. Payment plan indication will instead be shown via the panel notice in context if we choose to illustrate it.
   - Include the new `orderRules` and `gatingSummary` fields in the context portion of the JSON snippet, and possibly show a non-empty `panelNotices` if illustrating one of the new banner messages. Double-check that the currency of any example amounts and other values remain consistent (we'll keep using the USD and cents format as in v0.3).

5. **Section 3 – State Composition → Rendering:**

   Go through each subsection A–G and incorporate the updates:

   - **A) Row Presentation:** Modify the rules to use `listingPolicy`. For example:

     - If `admin.state == 'unpublished'` (though these are omitted server-side, we'll keep the logic for completeness) or if `gating.required && !gating.satisfied && gating.listingPolicy == "omit_until_unlocked"`, then the row is **suppressed** (not present in the panel).
     - If `gating.required && !gating.satisfied && gating.listingPolicy == "visible_locked"`, then the row is **locked** (visible but not selectable, with a lock icon and masked price).
     - Otherwise, the row is `normal`.
       This replaces the old visibilityPolicy check and ensures we capture both gating modes. We'll clearly note that "suppressed" means the server did not send the item at all when locked (hence it's invisible to the client).

   - **B) Purchasability:** Largely the same conditions, but ensure terminology is consistent (use `supply.status` instead of `availability.status` if not already unified). We'll double-check that `temporal.phase === "during"`, `supply.status === "available"`, and gating being satisfied (or not required) are all required for a row to be considered purchasable. These conditions remain correct. (No new conditions here, since whether something is omitted or not is handled by row presentation already.)
   - **C) CTA Resolution:** Expand the decision tree if needed to include the **"Request"** CTA for `approvalRequired` cases (since v0.3 mentioned `approvalRequired` as a state but didn't list it in the CTA table). We will insert a check: if not purchasable but `admin.approvalRequired = true`, the CTA is `request` with label "Request to Join" (for example), coming just after the purchasable case. (This was implicitly supported in v0.3; we'll make it explicit so as not to lose that nuance.)
     We will also mention (likely in a note) that the **bottom "Proceed" button** on the panel is disabled if nothing is selectable/purchasable – specifically, if all visible items are either sold out or gated. (This point came from Q3: if only hidden gated tickets remain, the main checkout button stays disabled until an unlock code is provided. We might incorporate that logic description here or in Section 5 with panel-level behavior.)
     The rest of the CTA logic (join_waitlist, notify_me) stays as written, but we'll ensure the text aligns with updated code naming (e.g., `requires_code` instead of `access_code_prompt` if that appears anywhere).
   - **D) UI Element Visibility:** Add a note clarifying that for `presentation = 'suppressed'` rows (i.e., omitted gated items), **no UI is rendered at all** (the item is not listed). In the matrix, we already cover that by saying quantity UI/price UI are "hidden" for suppressed, but we might explicitly mention that "suppressed" means the entire row is absent. This reinforces how `listingPolicy: "omit_until_unlocked"` works. All other parts of the matrix remain valid. We will double-check that the "locked" presentation is still described as having masked price and showing an access code field (the access code input itself is a panel-level UI element, not per-row, and we handle that separately).
   - **E) Notices:** We will broaden this subsection to distinguish **panel-level notices** versus **row-level notices**:

     - Start by describing **panel-level Dynamic Notices** (now called **panelNotices** in the contract). These are banner-like messages the server can send in `context.panelNotices` for important event-wide info or calls to action. For example: an "Event Sold Out" banner, possibly with an attached action like "Join Waitlist"; or an "Enter Access Code to view tickets" prompt when applicable. We'll state that these notices are not tied to a specific ticket type and appear at the top or bottom of the panel (placement is indicated by the `scope: "panel"` in their schema). We'll mention that the server may include parameters for templated messages (like `{count}` remaining) or direct text, and the client simply renders them according to priority.
     - Then, describe **row-level notices and microcopy**. This will cover what v0.3 originally described (the mapping of axis `reasons` to small inline messages on a ticket row). We keep the idea that each axis can contribute reason codes (like `outside_window`, `sold_out`, `requires_code`) that map to short phrases (via `reasonTexts` or now possibly via a structured `microcopy` array). We integrate the new concept of `state.microcopy`: i.e., the server can directly provide ready-to-display messages for a row, with a placement hint. This is useful for things like "Sales end at…" or "Only N left!" which are derived from server knowledge. We'll note that the client can also generate some microcopy based on live selection state (like "Max tickets per order reached") – but those messages use templates provided in `context.clientCopy`.
     - Ensure no original nuance is lost: we'll still mention that gating-related notices at the row level (for locked items) appear as info text prompting for an access code, etc., but now clarify that if an item is omitted, that prompt would instead be shown as a panel-level notice (since there is no row at all in that case). Essentially, we tie the presence of an Access Code input or prompt to whether `hasHiddenGatedItems` is true (panel-level scenario) versus a lock icon on a listed row (row-level scenario).

   - **F) Edge Cases:** Augment the scenario table with the new gating behaviors to capture all combinations, without removing any original cases:

     - Add a case for **"Public sold out, but hidden gated items available"** – i.e., all visible items have `supply.status='none'` and there is at least one omitted gated item (`hasHiddenGatedItems=true`). Outcome: The panel should display a special notice prompting the user to enter an access code (because there are tickets available, but only via code). The row list may either show a "Sold Out" message for the visible items or if `showTypeListWhenSoldOut` is false, even hide the list – but importantly, an **Access Code CTA** is shown. This case comes straight from the Q3/Q4 updates (the scenario of a secret allocation behind an access code).
     - Update the **"All items sold out"** scenario to clarify two sub-cases: (a) truly all items including any gated ones are sold out – then the panel shows a compact "Event Sold Out" banner (and possibly a waitlist CTA if enabled); and (b) all public items sold out but some gated items exist (which we covered above – the action is different, an access code prompt instead). We'll use the logic from the updates to articulate these differences.
     - The existing cases ("Gated + Sold Out" visible locked row, "Gated + Sold Out (unlocked + waitlist)") remain, but we'll verify they're consistent with new terms. For instance, "Gated + Sold Out" originally assumes the gated type is visible (so now `listingPolicy="visible_locked"`) – that's fine as one scenario. If a gated type is unlocked and has waitlist, that's just a normal row with join_waitlist CTA (already covered).
     - We will include any new reason codes or notice behavior in the narrative for these edge cases. For example, mention that in the "public sold out, gated available" scenario, the server would set `hasHiddenGatedItems=true` and likely send a `panelNotices` entry with `code: "requires_code"` (or similar) to tell the user to use their code. This ensures the spec guides how to handle that gracefully.

   - **G) Rendering Rules (Pure View):** These mostly stay the same, but we will update where necessary:

     - **Quantity Controls:** Emphasize that the `commercial.maxSelectable` clamp still rules, but now note that the server's `orderRules` also affects whether quantities start at 0 or 1 and if multiple types can be selected. For example, if `orderRules.minTicketsPerSelectedType = 1`, the UI might auto-select 1 when a user picks a type (no zero state); if `typesPerOrder = "single"`, the UI will enforce only one type can be active at once. We'll mention these as hints in the rendering rules, tying them to the fields rather than implicit behavior.
     - **Price Visibility:** No change except using the new terminology: if a row is `locked` (due to gating) the price is masked ("Unlock to see price" placeholder). If a product is omitted due to gating, it doesn't appear at all (so price is naturally not shown). We reassert that if the item is purchasable or requires approval, its price is shown; if not, price might be hidden. (This is consistent with v0.3, just ensure the phrasing aligns with listingPolicy logic.)
     - **Badges:** We keep the reserved badge values list, but we'll align it with our new guidance. Specifically mention reserved badges like `"Popular"` and `"Members"`. For `"PaymentPlanAvailable"`, we clarify that while it can exist as a badge, **the recommended approach** is to use a panel-level notice for payment plan availability (since it's an order-level feature). We won't remove it from the list of possible badges (to preserve the original mention), but we might add a note that the panel uses a banner to indicate this globally. Also introduce that badges can have associated tooltip/hovercard content now (via `display.badgeDetails`), which we'll elaborate in the schema section. This ensures we include the nuance from Q4 that some badges (like a "?" or info icon) can reveal more info on hover (e.g., explaining what "Members" means or details about "Limited Release").
     - **Copy Tokens/Microcopy:** We will incorporate that all static text shown (whether panel notices or row microcopy) should come from the server's provided copy or reason texts. The client shouldn't hardcode these strings. V0.3 already insisted no hardcoded copy in client logic; we will extend that to include using `context.clientCopy` for client-generated validation messages. For instance, when a user hits a max ticket limit, the client uses the template string from `clientCopy.quantity_max_reached` to display "Max X per order." This ties up the new clientCopy field with the rendering rules concept of hints and error messages.

6. **Section 4 – Zod/TypeScript Schemas:**

   This section gets a significant update to define all new fields introduced in v0.4. We will carefully integrate all changes, ensuring every detail from both documents is present:

   - **Context Schema Additions:**

     - Add a new **`OrderRulesSchema`** and include `context.orderRules`. Use the structure from the updates: `types`, `typesPerOrder`, `ticketsPerType`, `minSelectedTypes`, `minTicketsPerSelectedType` (all with defaults). We'll incorporate the explanations via code comments (as in the updates) so none of the meaning is lost – e.g., explain that `"single"` vs `"multiple"` determine if only one type can be selected, and that minimums define if a selection is required or if a type selection implies at least one ticket.
     - Add **`GatingSummarySchema`** and `context.gatingSummary` with `hasAccessCode` and `hasHiddenGatedItems`. Provide defaults (false) and a comment that this summarizes if any access code gating is in effect for the event and whether any gated types were omitted from `items`.
     - Replace the `dynamicNotices` field with a new **`panelNotices`** array in `ContextSchema`. Define a **`NoticeSchema`** to structure each notice (including fields like `code`, `scope`, `severity`, optional `title`, `text`, `params`, `action`, `priority`, `expiresAt`). Use the definitions from Response 4 to capture everything – e.g., the `NoticeActionSchema` for actions (like opening a drawer or URL) and mention default scope is always `"panel"` here. We will ensure this aligns with or supersedes the old `dynamicNotices`. (We'll also mention that the UI can have multiple notices, hence an array, and that they should be sorted by priority.)
     - Add a `copyTemplates` field in context if we decide to include it: a list of `MessageTemplateSchema` items. This would allow the server to provide template strings for standard messages. If including, define `MessageTemplateSchema` with `key`, `template`, and optional locale-specific overrides, as per the update content. (However, if we think this adds complexity, we might mention it as optional; since the original spec didn't delve into template registries, this could be left as an advanced feature. We'll decide based on keeping "no nuance lost" – the updates mention it, so we likely include it for completeness.)
     - Add a **`ClientCopySchema`** and `context.clientCopy`. This will house strings for client-generated microcopy (like validation errors). We'll include keys such as `selection_min_reached`, `selection_max_types`, `quantity_min_reached`, `quantity_max_reached` with default templates ("Select at least {min}.", "You can only choose one type.", etc., as given). This ensures the client can fetch the appropriate wording for things like "Max X per order" without hardcoding it.
     - Add **`tooltips`** and **`hovercards`** arrays in context, along with defining their schemas (`TooltipSchema` and `HoverCardSchema`). These allow the server to send any explanatory text that can be attached to badges or other UI elements. We'll include fields like `id` and `text` for tooltips, and `id`, `title`, `body`, `action` for hovercards, matching the structure from the updates. (This is an optional feature in terms of usage, but we'll spec it out since the update provided details, preserving that nuance about Payment Plan details, etc.)
     - Retain `effectivePrefs` and other existing context fields from v0.3. We might update `effectivePrefs.paymentPlanAvailable` default to remain `false`, but note it can trigger a panel notice if true.

   - **State & Item Schema Updates:**

     - Update the **`GatingSchema`** definition: remove `visibilityPolicy` and introduce **`listingPolicy`** (`"visible_locked" | "omit_until_unlocked"`). Ensure the default is `"visible_locked"`. We'll also adjust comments to clarify what each means (visible but locked vs. not sent until unlocked).
     - The rest of `GatingSchema` remains (requirements, reasons), and we keep `required`/`satisfied` flags.
     - We will **add a `microcopy` array** to the StateAxesSchema. Define a `MicrocopyMessageSchema` with fields `code`, `placement` (e.g., `"row.under_title"`, etc.), `severity` (neutral/info/warning), `text` or `params` for templating, and `priority`. This aligns with Q4's description of server-driven inline messages (like hints about sales end time or low remaining count). We'll note that this is optional and typically small text shown under a product's name, price, or quantity control.
     - (Double-check if we should include `AdminSchema` at all. In v0.3, `AdminSchema` was defined but not integrated into the payload since unpublished items are omitted. We will likely leave `AdminSchema` out of `StateAxesSchema` to keep that approach. If we keep an admin axis for completeness, we'll update any references to ensure paused/unpublished semantics are clear, but likely we'll stick to "omitted if unpublished" as per earlier decision.)
     - No changes to `TemporalSchema` or `SupplySchema` beyond possibly adjusting naming (we should confirm that in the schema code we consistently call it `supply` everywhere – the initial spec toggled between `availability` and `supply`. We'll standardize on `supply` in the final text and code for clarity).
     - **PanelItemSchema:** incorporate the new structures: it already contains `product, variant, state, commercial, relations, display, uiHints`. We will update `display` to include the new `badgeDetails` field (a map of badge text to a `BadgeDetailRefSchema` that points to a tooltip or hovercard by id). We'll define `BadgeDetailRefSchema` as having `kind: "tooltip" | "hovercard"` and a `ref` (which correlates to an entry in context.tooltips or hovercards). This ties into how additional badge info is provided.
     - Add any new enum values or types as needed. For example, if any new `demandCapture.kind` was introduced in updates (it wasn't – still none, waitlist, notifyMe, backorder), or any new product types (none were – still ticket, physical, digital). We will also verify the `ProductSchema` remains with no `addon` type (since add-ons are modeled via relations, as in v0.3).
     - We will include the `NoticeSchema`, `MicrocopyMessageSchema`, etc., likely outside of PanelItem but under context or state as appropriate. (The spec code block might need to show these new schemas inline for completeness. It will be a long block, but it's important to have it all in one place.)
     - After updating the schemas, double-check that all default values and optional fields reflect what we want (e.g., panelNotices default to [], orderRules has a default representing the "multiple" case, etc.) so that older payloads validate and the new fields are indeed optional as intended.
       In summary, Section 4 will be heavily modified to insert all these schema definitions, following the style of the original (with `.default()` and `.optional()` where appropriate, and code comments pulled from the updates to retain nuance, like explaining what each new field does in context).

7. **Section 5 – Jotai Alignment (Server vs Client Boundaries):**

   Update the enumerated lists of responsibilities to reflect the new fields and logic separation:

   - In the **Server (authoritative) list**, add entries for the new decisions:

     - "`context.orderRules` – the server defines whether the panel is single or multi-ticket and related selection constraints (the client must respect these rules for selection UI and validation)."
     - "`context.gatingSummary` – signals presence of access-code gated inventory not shown to the public. The server uses this to tell the client when to display an access code prompt (client should not try to deduce hidden items on its own)."
     - "`context.panelNotices` – any panel-level banner messages (like sold-out or low inventory warnings) are fully composed and decided by the server."
     - Also mention "All copy text for notices and errors is provided by the server (`reasonTexts`, `panelNotices.text`, `clientCopy` templates, etc.), ensuring consistent messaging."
       We'll keep the existing items (phase, supply.status, etc.) as they are.

   - In the **Client (derived atoms) list**, incorporate how the client now uses these server fields purely for presentation:

     - Explain that the client uses `orderRules` to configure the UI (for example, if `typesPerOrder` is single, the UI might render radio buttons or otherwise enforce only one type at a time; if `minSelectedTypes` is 1 and there's only one type, the client might auto-select it). This is purely using server info – the client doesn't decide these behaviors on its own.
     - Note that `rowPresentation` logic now uses `listingPolicy` (with exactly the conditions we outlined in Section 3A). So update that bullet: e.g., "`rowPresentation`: computed as `suppressed` if the item is effectively hidden (unpublished or gated with `omit_until_unlocked`), `locked` if gated and unsatisfied (`visible_locked`), else `normal`. (This mapping is done in the client from server flags.)"
     - The bullet for `cta` in v0.3 will remain but we might add: "Additionally, a new CTA kind `request` is used if `approvalRequired` is true (server indicates it in item state). The client will label it accordingly (e.g. 'Request Access')."
     - For `notices`, previously the client would compile axis reason texts. Now, we clarify: "Notices: the client merges any server-provided `state.reasons`/`reasonTexts` and `state.microcopy` for each row to show inline messages. The client also displays any `panelNotices` at the panel level as given (possibly combining or ordering them by priority). The client does not generate messaging beyond what's provided except to fill in dynamic values in the provided templates."
     - Add a bullet about **bottom CTA (Proceed button)** enablement being purely based on server data + selection state: e.g., "The main Purchase button is enabled only when the selection meets `orderRules` requirements and at least one purchasable item is selected. If all purchasable items are gated (i.e., the user hasn't unlocked required items yet), the button remains disabled – the panel will prompt for an access code in that scenario via a server notice." (This aligns with the Q3 logic on disabling CTA when only gated options remain.)
     - We'll also adjust the **panel rollups** bullet from v0.3:

       - `allOutOfStock`: originally defined as every sent item being out of stock. We'll keep that but also note that if the server explicitly sets `context.eventAllOutOfStock=true` (if they still use it) that's an authoritative signal too. If `hasHiddenGatedItems=true`, then technically not "all" inventory is gone – it's just hidden. So we might refine: "`allOutOfStock` = true if all **known/visible** items are out of stock **and** the server did not indicate any hidden gated stock (i.e., `hasHiddenGatedItems=false`)." This ensures the client doesn't mistakenly consider the event fully sold out when some tickets are just behind a gate.
       - `anyGatedVisible`: unchanged (just checks if any locked row is present).
       - `anyGatedHidden`: we remove this computed check from the client's responsibility and instead rely on `gatingSummary.hasHiddenGatedItems` from the server. So we'll say the client can directly use the server flag rather than computing from hidden data (which it can't because hidden items aren't sent).
       - `panelMode`: still `'compactSoldOut'` (or similar) vs `'full'` depending on preferences and sold-out status. If we want, we could mention that when `showTypeListWhenSoldOut=false` and the event is effectively sold out, the panel might hide the list and just show a notice. This was in v0.3 and still holds; we just ensure to incorporate the access-code scenario into that logic (if sold out publicly but with code-locked tickets, you wouldn't go into compact mode because you still need to show the access code field). The server likely handles this by not setting eventAllOutOfStock in that case and by sending a code prompt notice instead. We'll articulate that interplay.
         Overall, Section 5 will stress that **even more of the logic is now on the server** (which is a positive extension of v0.3): the client atoms are just mapping these new inputs to UI state (e.g., using `orderRules` to validate selections, using `panelNotices` to display banners, etc.). We'll make sure none of the v0.3 points (like not doing schedule math or capacity checks on the client) are lost.

8. **Section 6 – Client Code Implementation:**

   We will update the pseudo-code examples (if we keep them in the spec) to align with v0.4:

   - **Mapping (`mapItemToRowVM`):** Adjust the `rowPresentation` function to use `listingPolicy`. For example:

     (Replace the old `visibilityPolicy` logic accordingly.)
     Ensure this logic matches what we described in 3A.

   - In the `ctaFor` function, after our changes in Section 3C, we might include the `approvalRequired` check. For example, before falling back to none, check:

     (We'll assume admin state may be included or at least that info is known; the spec can mention it even if admin isn't a formal axis. It's a minor point, but preserving nuance.)

   - The mapping code for `noticesFor` will now consider `state.microcopy`. In v0.3 it collected notices from `temporal.reasons`, `supply.reasons`, etc., and `reasonTexts`. Now we should mention that in addition to those, the client will append any messages from `state.microcopy` array for that item (which are presumably already fully formed text strings the server provided). Also, if a row is locked (`pres === "locked"`), previously we pushed a notice like "Requires Access Code" (using `reasonTexts["requires_code"]`). We can keep that, but note that if the server provided a custom message in `reasonTexts` or `microcopy` (like the example `reasonTexts.requires_code = "Enter your access code to proceed."` in the fixture), that exact text is shown instead. Essentially ensure the code reflects: if locked and there's a reasonText for requires_code, use it.
   - **Selectors (`allOutOfStock`, etc.):** The initial spec included a diff for selectors (like using the new `state.availability.status === "none"` and so forth). We will update these selectors to incorporate the new gating logic:

     - `allOutOfStock`: Use the refined logic as described above (all items have supply none, and no hidden gated stock). In practice, since hidden items aren't in `items`, it's enough to say all items in the list are out of stock. But to be safe, the server also provides `eventAllOutOfStock` or we use `gatingSummary.hasHiddenGatedItems` to avoid declaring "event sold out" if that flag is true. We can encode that:

       This way, if there are hidden gated tickets, allOutOfStock will be false (preventing the panel from showing the wrong state).

     - `anyGatedVisible`: stays as any row with presentation locked.
     - We remove `anyGatedHidden` calculation in favor of the direct flag from context (gatingSummary). So we'll not compute it client-side. If needed, we mention that conceptually `hasHiddenGatedItems` represents what `anyGatedHidden` was trying to capture.

   - **New atoms for selection & order rules:** The spec might not have originally shown code for selection validation, but given the update details, we could outline how the client uses `orderRules`: e.g., computing if the current cart selection is valid. We might add a snippet or description: "The client can derive that the selection is valid if at least `minSelectedTypes` different types are in the cart and each selected type has at least `minTicketsPerSelectedType` tickets chosen. If `typesPerOrder` is "single", the UI will restrict the selection to one type at a time (for example, by using radio-button style selection). These rules are applied purely in the UI layer using the values from `context.orderRules`." This ensures we capture the nuance that in single-type panels the client will default a selection of 1.
   - **Access Code Unlock Flow:** We should describe at a high level how the client handles entering an access code given the new contract pieces. For example, plan to mention: "When the user inputs an access code (via a prompt the panel shows if `hasHiddenGatedItems=true`), the client sends it to a server endpoint (not detailed in this contract, but presumably `/panel/unlock`). The server then responds (if the code is valid) by sending a new panel payload where previously omitted items are now included (with `gating.satisfied=true`). The client will merge this update, causing the locked items to appear or become selectable. All of this logic is server-driven; the client just triggers the refresh on success. Rate limiting or error messages (like 'invalid code' or 'too many attempts') are delivered via `panelNotices` or similar fields (`reasonTexts`) so the client can display them." This may fit best as a short paragraph either in Section 6 or in Section 11 (Security/Abuse), but we should include it somewhere.
     We will keep any code examples up-to-date with the final schemas, and include comments from Q3/Q4 where appropriate to preserve rationale (for instance, explaining why we disable the main CTA when only gated items remain – because the user needs to unlock a code first).

9. **Section 7 – Relations & Dependencies:**

   No changes needed in the structure (v0.3's content stands), but as a sanity check, ensure nothing in Q3/Q4 conflicts. The updates didn't mention add-ons or relations, so we will keep Section 7 as is. We might just double-check that the presence of `orderRules` doesn't conflict with how add-ons behave (it shouldn't – add-ons are still products listed in either the add-ons section or nested under a parent). We will retain all examples like the "fast-pass per ticket" and "parking per order" JSON snippets.

10. **Section 8 – Fulfillment & Redemption:**

    Likewise, no direct changes from the updates. We will leave this content intact. (The Q4 addition of tooltips/hovercards could allow more description for things like Apple Wallet availability, but that's an implementation detail – we already mention showing a badge or hint when `channels` includes `apple_pass`. We'll keep that as is.)

11. **Section 9 – Reference Fixture (Four Scenarios):**

    Update the `fxGreenfield` example payload to v0.4:

    - **Context:** Add the `orderRules` and `gatingSummary` fields. For this multi-ticket example event:

      We will also replace `dynamicNotices` (if present) with `panelNotices`. If, for example, we want to show that payment plans are available in this scenario, we could set `effectivePrefs.paymentPlanAvailable: true` and include a panelNotice for it. However, to keep the fixture concise, we might leave paymentPlan out (or include just one panelNotice example such as a low-supply warning or the access code prompt – though in this fixture all types are either available or visible locked, none fully hidden or event sold out).
      It might be simplest to **not** include a panelNotice in this fixture to avoid confusion, since it's illustrating the normal mix of tickets. We'll ensure the context has `showTypeListWhenSoldOut:true` (the default) and no eventAllOutOfStock.

    - **Items:** Update each item:

      - For the GA ticket (`prod_ga`), no gating, so no change except if we want to illustrate `display.lowRemaining` logic: perhaps we set `remaining.count: 42` which is above the threshold, so lowRemaining stays false (like originally). That's fine.

      - VIP ticket (`prod_vip`) is sold out with waitlist: update its state to use `supply.status: "none"` (already the case) and ensure `state.gating.required:false` (as it's not gated) remains. That's fine. Its `reasonTexts.sold_out` was given as "Sold out." – we can leave that or rely on default copy. Either way is fine.

      - Meal Voucher add-on (`prod_meal`): no gating changes needed, just ensure its gating object is `required:false`.

      - Members Only ticket (`prod_locked`): change `state.gating.visibilityPolicy` to `listingPolicy: "visible_locked"`. Everything else (required true, satisfied false, requirements with kind unlock_code, reason "requires_code") remains, except we might remove the `temporal.phase: "before", reasons: ["outside_window"]` if it complicates things – actually, that item in the fixture was marked `phase: "before"` presumably to show an item not yet on sale plus gated. It's a bit complex scenario (both time-gated and access-gated). We could keep it to demonstrate multiple reasons (the item is locked both because it's before its sale window and requires a code). But since it's labeled "Members Only", maybe it is on sale but only to members – not necessarily before window. Possibly the original fixture wanted to illustrate multiple axes at once.
        To keep things simpler and focus on gating, we might set `temporal.phase: "during"` for prod_locked (meaning it would be on sale now if unlocked) and drop the `outside_window` reason. This way, the only thing stopping purchase is the access code. (This better highlights the gating mechanism without the extra complexity of a time lock.) We will ensure `reasonTexts.requires_code` is still present to provide the UI message.

      - Verify each item's `state` now includes a `microcopy` array if applicable. The fixture didn't explicitly include any microcopy arrays; we can keep it that way (for brevity) or add one example, e.g., on the GA ticket, add a `microcopy` entry for a low remaining hint if count was low. But GA has 42 remaining, so no. Alternatively, we could simulate that GA is nearing sold out (e.g., count 5 which is below the threshold 10) and then add a microcopy: `{ code: "remaining_low", text: "Only 5 left!", placement: "row.under_quantity" }` and also mark `display.lowRemaining: true`. This would demonstrate the feature. However, our context `displayRemainingThreshold` is 10 by default, so if GA had count 5, `lowRemaining:true` could be set by server. That might actually be a nice example to include.
        But since the fixture already has VIP sold out and a waitlist example, adding GA "only 5 left" would show a FOMO notice usage. Let's do that: change GA remaining to 5, set `display.lowRemaining: true`, and include a microcopy message in GA's state like:

        (We'll use a code like "low_supply_warning" or "remaining_low"; the exact code can be whatever we define in our templates or just an identifier – it's mainly illustrative.)

      - Remove any traces of `visibilityWhenGated` or `access.gated` from the fixture (since we now use the new gating format). The initial fixture might have slightly different field names (there was a bit of inconsistency between `availability` vs `supply`, or `access` vs `gating` in the snippet). We'll normalize all those to the new schema naming.

    - After these tweaks, we'll double-check that the fixture covers all interesting cases: an available type, a sold-out type with waitlist, an add-on with `matchParent`, and a gated type locked. This aligns with demonstrating the multi-axis states and the new panel behavior. The context now also demonstrates `orderRules` (multi-type scenario) and gatingSummary (indicating an access code exists in the event).

    - We will include this full updated `fxGreenfield` JSON in the spec, as was done in v0.3, ensuring it's consistent with our earlier definitions.

12. **Section 10 – Reason Code Registry:**

    Expand or adjust the registry of reason codes to include any new codes introduced by our panel notices or microcopy approach:

    - The axis-specific codes (temporal, availability/supply, gating, admin) remain the same (we double-check consistency: use `out_of_stock` everywhere instead of mixing `sold_out`, and ensure the gating codes use `requires_code`, etc., which they already did). We'll align terms: e.g., v0.3 listed a mix of "sold_out" and "outOfStock" – let's standardize on one machine term (likely `sold_out` as a reason code, since that's been used in examples). The initial spec pointed that out as an inconsistency; we can resolve it in v0.4 text.

    - Add **event-level panel notice codes** explicitly. In v0.3, they only mentioned `all_types_out_of_stock` (for event sold out) under event-level. Now, based on updates, we should list:

      - `event_sold_out` – neutral/info – "Event sold out." (This might be the same as `all_types_out_of_stock` but we'll use one terminology for clarity. We can note that the server uses this for panel banner when everything is gone.)

      - `event_sold_out_waitlist` – info – e.g. "Event sold out – join waitlist for openings." (If waitlist is enabled, possibly accompanied by an action button "Join Waitlist.")

      - `requires_code` – info – for panel scope, "Enter access code to view tickets." (Even though this is the same code as gating reason, we list it under panel context too, since it can appear as a panel notice prompting the action. Its severity might be info.)

      - `fomo_low_supply` or `event_total_remaining` – info – for things like "Only X tickets left for the event." (If we have such a banner when total remaining across all types is below a threshold. The initial dynamicNotices code had `fomo_low_supply`; Q4 suggests an example code `event_total_remaining`. We can include one of these as a machine code meaning the same concept. Possibly use `fomo_low_supply` to stay consistent with v0.3 naming and note it corresponds to a message like "Only N left".)

      - `sale_window_final` – warning – "Less than 1 hour left to purchase" (for example, a last-minute urgency banner).

      - `payment_plan_available` – info – "Payment plans available" (for when effectivePrefs says so).

    - We will clarify that these codes are used in `panelNotices.code` and often correspond to important high-level statuses or CTAs. They may have associated actions (like open waitlist or open access code dialog).

    - For consistency, we'll ensure that when we listed `access_code_prompt` in v0.3 (if it was there), we replace it with `requires_code`. The Q4 update clearly favors `requires_code` as the terminology for both gating reason and the panel notice. We won't lose that nuance.

    - We'll also integrate any mention of `unlocked_via_code` (which was used in Q3's example for a row-level microcopy after unlocking). That might not need to be in the "registry" since it's more like an informational confirmation, but we might include it under gating or general codes if appropriate.

    - Lastly, if not already covered, ensure `max_per_order_reached` and `max_per_user_reached` (client-side messages) are at least mentioned as part of "Clamps/Microcopy" in the registry or elsewhere. In v0.3's registry table, they had those listed at the bottom (as info severity). We'll keep them listed, indicating these are used when the client needs to show "Max X per order" etc. (The actual text comes from `clientCopy`, but the reason code naming helps document the intent.)

13. **Section 11 – Invariants & Guardrails:**

    Augment the axis-by-axis rules with the new constraints introduced:

    - **Temporal Axis:** No changes (just reaffirm server is sole decider of phase). Possibly mention the server may send a special final-hour notice when appropriate (but that's more a dynamic notice thing than an invariant; so we likely won't add that here).
    - **Supply Axis:** Reiterate server is authoritative on availability. We might note that if the event uses an external seating system, `supply.status` might be 'unknown' or the engine will handle that complexity – but that was already in v0.3 (the seats.io note). No new changes needed here.
    - **Gating Axis:** Add the new guardrails:

      - The server **must not send** gated items that should be hidden (i.e., if `listingPolicy = "omit_until_unlocked"` and the user hasn't unlocked, those items are completely omitted from `items`). Conversely, once a valid code is applied (server-side), the server can include them (with `satisfied=true`). We emphasize that the client doesn't know about omitted items unless the server reveals them – so there's no way for the client to circumvent this or accidentally show a hidden product.

      - If all ticket types (public and gated) are sold out, the server should not prompt for an access code. (This was noted in Q3 logic: in that scenario `gatingSummary.hasHiddenGatedItems` would be false even if there were gated items, because none have stock, and the panel would just show "Event Sold Out".) This rule ensures the user isn't misled into thinking a code would help when nothing is actually available. We'll phrase that as a server invariant.

      - Rate limiting and brute-force protection remain server concerns: mention that if too many wrong attempts happen, the server might temporarily refuse unlock attempts and could send a notice (like a `rate_limited` error message) for the client to display. The client should simply present that message and not try to enforce additional logic. (This was implied before; we'll make sure it's stated given the Q4 mention of such messages.)

    - **Admin Axis:** No major change. Reiterate that `unpublished` items are omitted entirely (so the invariant is the client never sees them). If `paused` state were ever included, the server would send it with a reason code (e.g., `tenant_paused_sales`) and the client would show a notice – which is as in v0.3. We'll keep that.

    - **Demand Capture Axis:** Unchanged invariants (still server decides if waitlist is available, etc.). We ensure to mention that the presence of waitlist vs notify-me is simply taken from server's `demandCapture.kind`, not computed by the client from timing or inventory.

    - **Commercial (Clamps):** Still the same – server calculates `maxSelectable`. We might add: the server ensures `maxSelectable` respects any new `orderRules` (for example, if only one ticket type can be selected per order, the server could still set maxSelectable per type but the client will also be limiting selection to one type via orderRules). However, since `orderRules` covers that scenario separately, there's no direct conflict. We just reaffirm the client uses `maxSelectable` exactly and doesn't try to apply `limits.perOrder` or `perUser` on its own beyond displaying them.

    - **Panel-Level Rules:** Since orderRules and gatingSummary are not axes but important contract elements, we might add a short subsection or bullet in this section summarizing their invariants:

      - The server will correctly set `orderRules` to reflect the selling policy (e.g., if only one type allowed per order, `typesPerOrder` will be "single"). The client should trust these rules and not override them.

      - The server uses `gatingSummary.hasHiddenGatedItems` truthfully to indicate hidden stock. The client should only show the Access Code UI if this flag is true (and conversely, hide or remove the code UI if false).

      - Also possibly note that **panelNotices** are the server's mechanism to convey important states – the client should display them as-is and not suppress or alter them (except perhaps not duplicating information that's already obvious from UI, but in general treat them as authoritative messages).
        This section's additions ensure we don't lose any nuance about the responsibilities introduced by the new fields – it's basically encoding Q3/Q4's "why we do it this way" in the formal rules of the contract.

14. **Section 12 – Implementation Checklist:**

    Merge the to-do items from v0.3 and the new ones from the updates, separating them into server and client sections for clarity (as in the original):

    - **Server-side checklist:**

      - "Add support for `context.orderRules` – determine panel type (single vs multiple) based on event configuration and populate fields accordingly (types, typesPerOrder, etc.). e.g., single ticket events should output `types:"single"` and likely `minSelectedTypes:1` so the client auto-selects it."

      - "Emit `context.gatingSummary`: set `hasAccessCode=true` if any product requires an access code; set `hasHiddenGatedItems=true` if any such product is currently omitted due to gating. Ensure to update this after an unlock code is applied (i.e., in the refreshed payload for an unlocked state)."

      - "Replace `gating.visibilityPolicy` with `gating.listingPolicy` in outputs. During payload assembly, **omit** any item where `required=true, satisfied=false, listingPolicy="omit_until_unlocked"`. These should not appear in the `items` array until conditions change."

      - "Continue to **exclude unpublished/disabled** products from the payload entirely (no changes there)."

      - "Include `product.fulfillment` info for all products (carried from v0.3) – unchanged."

      - "Calculate `commercial.maxSelectable` as before (min of remaining, per-order limit, per-user limit), and include `limits` for reference. No client-side recalculation."

      - "Compute and include all pricing breakdown lines in `pricing.summary` (no client calculation of fees/taxes). Unchanged from v0.3."

      - **New: Panel Notices** – "Determine if any panel-level notices should be shown: e.g., if the event is nearly sold out (`totalRemaining` falls below some threshold) add a notice; if sales are about to end, add a notice; if paymentPlanAvailable is true, add a notice. Use the `panelNotices` structure for these, possibly with appropriate actions (like waitlist or access code dialogs). Provide localized text or rely on known templates for these notices."

      - "If waitlist is available event-wide (all items sold out and at least one has waitlist), consider showing an event-level notice guiding the user to the waitlist signup."

      - **Access Code handling:** "Implement the `/panel/unlock` (or equivalent) endpoint: validate submitted access codes server-side (respecting limits and validity windows). On success, mark the relevant gated items as `satisfied=true` and include them (with appropriate state) in a new payload. On failure, return an error reason (e.g., `code_invalid` or `code_expired`) which the client can display – likely via a `panelNotices` entry or an error field – or use the existing `reasonTexts` mechanism to inform the user. Enforce brute-force protection (e.g., temporary lockout, and maybe send a `rate_limited` notice if triggered)."

      - "Testing: Ensure combinations of gating and sold-out are handled (e.g., if an event is entirely sold out except for a hidden VIP section behind a code, the initial payload should prompt for code; if that hidden section also sells out, the subsequent payload should not prompt for code anymore but just show sold out)."

    - **Client-side checklist:**

      - "Update client model to **consume `orderRules`**: configure the UI according to these rules. For example, if `typesPerOrder` is "single", selecting one ticket type should automatically deselect any other (or present options as radio buttons). If `minTicketsPerSelectedType` is 1 and the user selects a type, default the quantity to 1 (don't allow 0 in the stepper for a selected type in that case). Use `orderRules` also to validate the selection before enabling the checkout button (ensure at least `minSelectedTypes` types are chosen, etc.)."

      - "Render an **access code prompt CTA** if `context.gatingSummary.hasHiddenGatedItems=true`. Typically this might be a special button or banner saying "Enter Access Code" that opens a dialog for code entry. Ensure this is only visible when that flag is true. On code submission, call the server unlock endpoint, then refresh the panel with the returned `gatingToken` or updated payload. If the server responds with an error notice (like `code_invalid`), display it to the user (could be via the DynamicNotice component or inline by the code field). When a new payload arrives with the unlocked items, update the UI accordingly (the previously hidden items should now appear as 'normal' or at least 'locked=false' if still time-gated or such)."

      - "Incorporate **panelNotices** rendering: create or use the `DynamicNotice` component to display each notice in `context.panelNotices` in the specified order or priority. Support optional actions on these notices (e.g., if `notice.action` is present, clicking the button performs the indicated action, such as opening the waitlist signup or redirecting to an info page). Use the severity to style them (info vs warning, etc.) and the provided text or title. This component was already planned (shadcn UI Item based), just ensure it now aligns with the new Notice schema."

      - "Inline microcopy: ensure the UI shows any `state.microcopy` messages for each item at the designated placement. For instance, if an item's state.microcopy includes an entry with `placement: "row.under_quantity"`, render that text right below the quantity selector in the item's card. This covers things like "Sales end at…" or low inventory warnings. Also integrate dynamic hints: e.g., if `display.lowRemaining=true` and no explicit microcopy was given, the client might show a generic "Only a few left!" message; however, if the server provides a specific message (like "Only 3 left!"), prefer that."

      - "Use `context.clientCopy` for any client-generated messages. For example, when the user tries to exceed the max quantity, show `clientCopy.quantity_max_reached` (formatted with the max number). When the user hasn't selected any tickets and hits checkout, the panel might show a message – e.g., we might use `selection_min_reached` if we have a rule that at least one must be selected. By pulling these from `clientCopy`, we allow easy copy changes without code changes."

      - "Tooltips/Hovercards: implement showing additional info when hovering or clicking on badges, if `display.badgeDetails` links to an entry in `context.tooltips` or `context.hovercards`. E.g., if a badge "Payment Plan" has a hovercard ref, show a popover with the content from that hovercard (title, body text, maybe a link). This is more of a nice-to-have, but it's defined in the contract now. Prioritize at least basic support (tooltips for short text, hovercard for richer info)."

      - "Testing: verify that single-type vs multi-type selection flows work (e.g., a single-type event should auto-select one ticket and not allow quantity 0, multi-type events should allow independent quantities). Test a gated event where the code unlocks new items (the UI should refresh and maintain any current selections if still relevant). Test that all panelNotices (sold out, low supply, payment plan, etc.) display correctly according to different scenarios."

    - We will include every relevant item from the updates in these lists to ensure no detail is omitted. The goal is that someone implementing v0.4 can follow this checklist and cover all new functionality beyond v0.3.

15. **Appendix A – Design Rationale:**

    The original Appendix A is still largely valid (it celebrated the multi-axis approach and client simplicity). We might add a small paragraph at the end to highlight how the v0.4 enhancements reinforce those principles:

    - For example, mention that by moving **panel configuration (orderRules)** and **access-code gating logic** entirely to the server, we further minimize any guesswork or duplicated logic on the client. The client doesn't need separate code paths for single vs multiple ticket events – it's driven by data. Similarly, the client doesn't need to "sniff" whether to show an access code field – the server explicitly tells it via `gatingSummary` and `panelNotices`.

    - Also mention that **user experience is improved** by having structured ways to display messages (no more ambiguous status; now clear banners and inline hints can be provided with context).

    - We ensure to mention that these changes came out of the iterative design (the Q&A context) to solve edge cases like secret ticket types and to generalize the panel across different use cases. This ties back to why starting greenfield allowed these refinements.
      This addition will preserve the forward-looking tone and acknowledge the adjustments made from v0.3 to v0.4 as part of the design maturation.

16. **Appendix B – Pricing Summary Footer:**

    No structural changes here, since pricing calculation isn't touched by the updates. We will keep this appendix as is, simply ensuring consistency if we changed any field names (shouldn't be needed here). We might add a one-line note that if payment plans are enabled, they are indicated via panel notice rather than in the pricing lines – but that might be unnecessary detail in the pricing context. The examples and mode definitions remain the same as v0.3.

By following this plan, we will produce a **Product Panel Contract v0.4** document that merges all the new features and clarifications into the original spec structure. Each section will be carefully updated to include the new schema fields (`orderRules`, `gatingSummary`, `panelNotices`, etc.), and all examples and rules will reflect the enhancements (like gating item omission and panel-level messaging) without dropping any existing detail from v0.3.

---

Short answer: **yes**—the deep‑research plan adds real, shippable improvements. It doesn’t overturn your update plan; it hardens it with concrete schema deltas, doc structure, and a few critical correctness fixes.

---

## What’s net‑new (and worth adopting)

| Deep‑research delta                                                                | Why it helps (practical impact)                                                                                                                                           |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`context.orderRules`** (types vs. typesPerOrder vs. ticketsPerType + mins)       | Removes all “panel variant” guesswork from the client; atoms can enforce radio/checkbox semantics and 0/1 defaults without policy math.                                   |
| \*\*`gating.listingPolicy` = `visible_locked`                                      | `omit_until_unlocked` + `context.gatingSummary`\*\*                                                                                                                       | Clean, no‑leak access‑code story: server decides if locked SKUs even exist client‑side; client shows AccessCodeCTA only when `hasHiddenGatedItems=true`. |
| **`context.panelNotices[]` + `Notice{code,severity,action,priority}`**             | Makes top‑level banners first‑class and server‑authored (Sold Out, Waitlist, Payment Plan, “1 hour left”). No client recomputation of urgency.                            |
| **`state.microcopy[]` with placement**                                             | Lets server pin inline row text (sale window, “Only N left”) without the client reverse‑engineering dates/counts.                                                         |
| **`context.clientCopy{}`**                                                         | Client‑generated, interaction‑driven messages (“Max {max} per order”, “You can only choose one type”) become server‑controlled strings—consistent copy, easy to localize. |
| **Badge details (`display.badgeDetails` → `context.tooltips[]` / `hovercards[]`)** | Progressive disclosure for things like Payment Plan terms; keeps badges terse, details centralized.                                                                       |
| **`context.eventRollup.totalRemainingCount` (optional)**                           | Enables event‑level “Only 31 tickets left” banner without client summing rows.                                                                                            |
| **CTA tree explicitly includes `request`**                                         | Squashes the lingering “approvalRequired” ambiguity; aligns button behavior across panel types.                                                                           |
| **`allOutOfStock` selector guarded by `gatingSummary`**                            | Prevents false “Event Sold Out” when public SKUs are gone but code‑locked stock exists.                                                                                   |
| **Doc scaffolding (RFC MUST/SHOULD style, ToC, acceptance criteria, fixtures)**    | Turns the update into a repeatable spec deliverable; easier reviews, fewer regressions.                                                                                   |

---

## Conflicts / gaps to resolve (so we don’t ship ambiguity)

1. **Admin axis contradiction (present vs removed).**

   - You say “listing/admin axis removed,” but code still reads `state.admin.state/approvalRequired`.
   - **Pick one**:

     - **Keep a minimal Admin axis**: `{ state: 'active'|'paused', approvalRequired: boolean }`. _Never_ send `unpublished` (server omits). Use `paused` via panelNotices **and** axis reason for row hints.
     - **Or remove Admin entirely**: encode **paused** as a **panelNotice** (`tenant_paused_sales`) and **approvalRequired** as a top‑level flag on the item state (not under admin).

   - **Recommendation**: keep the **minimal Admin axis** (active/paused + approvalRequired). It preserves orthogonality and matches your existing mapping code with least churn.

2. **Naming drift (`availability` vs `supply`).**

   - Deep plan standardizes on **`supply`**. Update schemas, mapping, selectors, fixtures, docs. Avoid mixed terms.

3. **Default for `gating.listingPolicy`.**

   - Schema shows default **`visible_locked`**, while the rollout guidance calls **`omit_until_unlocked`** the “secure default.”
   - **Decision**: set **schema default = `visible_locked`** for backward compatibility; **recommend** `omit_until_unlocked` as the per‑SKU choice for code‑protected releases that must not leak. Document both with clear defaults.

4. **Payment plan signaling.**

   - Remove `PaymentPlanAvailable` **badge** from examples; prefer **panelNotice** gated by `effectivePrefs.paymentPlanAvailable`. Keep badge support only for b/c if you must.

5. **Reason codes.**

   - Standardize machine terms: use **`sold_out`** everywhere (drop `outOfStock` strings); use **`requires_code`** (drop `access_code_prompt`). Align fixtures & selectors.

6. **`state.microcopy[]` precedence vs `reasonTexts`.**

   - Clarify: when both exist, **`microcopy[]` wins** for placement and text; `reasonTexts` is fallback for terse labels.

7. **Selectors from earlier diffs.**

   - Replace any `anyGatedHidden` client inference with **`context.gatingSummary.hasHiddenGatedItems`**. Don’t try to infer what the server intentionally omitted.

---

## Adopt now (minimal, high‑leverage diffs)

### Schemas

- [ ] Rename **availability → supply** end‑to‑end.
- [ ] Add **`context.orderRules`**, **`context.gatingSummary`**, **`context.panelNotices[]`**, **`context.clientCopy{}`**, **`context.tooltips[]` / `hovercards[]`**.
- [ ] Add **`state.microcopy[]`**; add **`display.badgeDetails{}`**.
- [ ] Replace **`gating.visibilityPolicy` → `gating.listingPolicy`**.
- [ ] Keep **Admin axis minimal**: `state.admin.state: 'active'|'paused'`, `approvalRequired: boolean`. Never send `unpublished`.

### Mapping / selectors

- [ ] `rowPresentation`: suppressed if `listingPolicy='omit_until_unlocked'` & unsatisfied; locked if `visible_locked` & unsatisfied; normal otherwise.
- [ ] `isPurchasable`: `admin.active && temporal.during && supply.available && (!gating.required || gating.satisfied)`.
- [ ] CTA tree: include **`request`** when `approvalRequired=true` in an otherwise purchasable context.
- [ ] `allOutOfStock`: true only if **all visible items** `supply.status='none'` **and** `!gatingSummary.hasHiddenGatedItems`.
- [ ] Notices: render `panelNotices` by priority; in rows merge `microcopy[]` + axis `reasonTexts`.

### Fixtures

- [ ] Update `fxGreenfield` to v0.4 names; remove per‑row PaymentPlan badge; add one `microcopy` example; include `orderRules` + `gatingSummary`.

### Docs

- [ ] Promote RFC MUST/SHOULD language; add acceptance criteria; include migration map (old→new field names).

---

## Defer (useful but not required for first cut)

- **`copyTemplates`** registry (keep the interface; you can ship with empty defaults and backfill later).
- **`eventRollup.totalRemainingCount`** if you’re not ready to compute it server‑side.
- **Hovercards** UX polish (tooltips alone may be enough initially).

---

## Specific pushback (to keep you from foot‑guns)

- Don’t let the client synthesize **Sold Out**, **“final hour”**, or **low remaining**. If you want relative language, generate it server‑side via `panelNotices` or `state.microcopy`.
- Don’t compute or expose **hidden-gated** state on the client. `hasHiddenGatedItems` is the single source of truth.
- Don’t re‑min() clamps in the client. `commercial.maxSelectable` is the one clamp; `limits.*` are copy only.

---

## Ready‑to‑ship wording decisions (so copy doesn’t stall you)

- **Sold out (row):** “Sold Out”
- **Access code prompt (panel):** “Enter access code to view tickets”
- **Max per order reached (client):** “Max {max} per order.”
- **Approval required CTA:** “Request to Join”

Wire those via `reasonTexts` / `panelNotices` / `clientCopy`.

---

## Bottom line

The deep‑research plan **strengthens** your update plan. It adds the missing “panel‑level facts” (`orderRules`, `gatingSummary`), formalizes banners and inline copy, fixes the sold‑out + gated edge cases, and gives you a clean editorial/migration path to **v0.4** without re‑litigating policy in the client.

### Next steps

1. Lock **Admin axis** stance (minimal axis vs removed) and **`listingPolicy` default** in the spec.
2. Apply the schema diffs and rename to **`supply`** across code/docs.
3. Update mapping/selectors + fixtures; run Storybook snapshots on the four key scenarios (available, sold‑out+waitlist, gated locked, hidden gated).
4. Add acceptance tests for **only‑gated‑remaining ⇒ bottom CTA disabled + AccessCodeCTA shown**.

---
