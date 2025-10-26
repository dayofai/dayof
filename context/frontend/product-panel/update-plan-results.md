<5pro-c1-r1>

Here’s a thorough validation + review of your **Update Plan** against the current `product-panel-spec-0.4.md`. I’ll flag conflicts, propose concrete fixes (including cut‑paste‑ready diffs), and call out any ripple effects. Overall: **solid plan** with two normative conflicts and one potential breaking schema change that we can eliminate with a backwards‑compatible tweak.

---

## Executive snapshot

| Section in your plan                          | Fit vs current spec                | Notes / changes needed                                                                                                                                                                           |            |                                        |            |                                                                                                                              |
| --------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | -------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **1. Primary Use Case callout**               | ✅ Compatible                      | Good placement right after the architecture context box; no competing text there.                                                                                                                |            |                                        |            |                                                                                                                              |
| **2. PanelNotice schema + rendering**         | ⚠️ Partially conflicting           | Adding `icon` + `description` is fine; but allowing a notice to render an **access‑code form** contradicts the “not primary CTAs” rule—needs a clearly scoped exception and code name alignment. |            |                                        |            |                                                                                                                              |
| **3. `welcomeText` + `clientCopy` additions** | ✅ Mostly compatible               | `welcomeText` is new and safe. Your new `clientCopy` keys would **remove** existing keys and break validation unless we keep both (deprecated) keys.                                             |            |                                        |            |                                                                                                                              |
| **4. PanelActionButton v2**                   | ⚠️ Normative change                | Current states are `"continue"                                                                                                                                                                   | "waitlist" | "disabled"`. Your model is `"checkout" | "waitlist" | "notify_me"`+`enabled`. We can adopt this without churn by mapping old → new and keeping old `clientCopy` keys as fallbacks. |
| **5. Layout modes (compact vs full)**         | ✅ Additive                        | Nice clarification; doesn’t exist explicitly yet. Ensure “consistency rule” is a **SHOULD** (presentation), not a business constraint. Existing §8 tables stay authoritative.                    |            |                                        |            |                                                                                                                              |
| **6. Reason code registry additions**         | ✅ Additive but standardize naming | Add `requires_code_entry`. Also standardize on `event_sold_out` (there’s a stray `event_sold_out_info` in examples today).                                                                       |            |                                        |            |                                                                                                                              |
| **7. Examples**                               | ✅ Additive                        | All examples fit the contract. They rely on new `clientCopy` keys → keep legacy keys for compatibility.                                                                                          |            |                                        |            |                                                                                                                              |
| **8. Checklists**                             | ✅ Additive                        | Aligns with §14.11 style.                                                                                                                                                                        |            |                                        |            |                                                                                                                              |
| **9. Type exports**                           | ✅ Trivial                         | Types are already exported; adding fields auto‑flows via `z.infer`.                                                                                                                              |            |                                        |            |                                                                                                                              |

---

## Key conflicts + how to resolve them

### A) **Notices are “informational only” vs. custom content access-code notice**

- **Spec today:** Panel notices are informational; primary actions (waitlist, access code entry) are **not** notice actions. Access‑code UI is modeled as **AccessCodeCTA** below the main button.
- **Your change:** Introduces a custom notice `requires_code_entry` that renders the **form inline**.

**Resolution:** Scope a **single exception**: “Custom notice `requires_code_entry` MAY render the access‑code form inline **only** in ‘gated‑only’ surfaces (no visible purchasable items).” Keep other primary CTAs out of notices. This keeps the earlier “no primary CTAs in notices” rule intact while enabling the gated‑entry screen you want. (You already hint at this in §4—let’s make it normative.)

### B) **PanelActionButton state names + labels**

- **Spec today:** `"continue" | "waitlist" | "disabled"`; labels come from server copy (`panel_cta_continue`, `panel_cta_waitlist`, `panel_cta_disabled`).
- **Your change:** `"checkout" | "waitlist" | "notify_me"` with `enabled` boolean, and pluralization logic (“Get Ticket” vs “Get Tickets”).

**Resolution (non‑breaking):**

1. **Adopt your new triplet** as the canonical model. Document a mapping for transition:

   - `continue` → `checkout`
   - `disabled` → `{ kind: "checkout", enabled: false }`
   - _(new)_ `notify_me` → panel button when no purchasables and at least one item has `temporal.before` + `demand.notify_me`

2. **Copy keys:** Keep **both** old and new keys in `ClientCopySchema`. Label resolution checks new keys first, then falls back to old.
3. **Pluralization:** Keep your logic, but **never hardcode** “Get Ticket(s)” in client; strings still come from `clientCopy`.

This preserves existing payloads while enabling your new UX.

---

## Concrete schema diffs (copy‑paste safe)

> All schemas remain `.strict()`; new fields are optional; old keys remain (deprecated) to avoid validation breaks. Citations show current shapes.

### 1) **NoticeSchema** (add `icon`, `description`)

```diff
 const NoticeSchema = z
   .object({
     code: MachineCodeSchema,
     scope: z.enum(["panel", "item"]).default("panel"),
     variant: z.enum(["neutral", "info", "warning", "error"]).default("info"),
+    icon: z.string().optional(),            // NEW
     title: z.string().optional(),
     text: z.string().optional(),
+    description: z.string().optional(),     // NEW
     params: z.record(z.unknown()).optional(),
     action: NoticeActionSchema.optional(),
     priority: z.number().default(0),
     expiresAt: z.string().datetime().optional(),
   })
   .strict();
```

(Extends current schema: title/text/params/action/priority/expiresAt already exist. )

### 2) **ClientCopySchema** (add keys, keep legacy)

```diff
 const ClientCopySchema = z
   .object({
     // Selection validation
     selection_min_reached: z.string().optional(),
     selection_max_types: z.string().optional(),
     quantity_min_reached: z.string().optional(),
     quantity_max_reached: z.string().optional(),
     addon_requires_parent: z.string().optional(),

-    panel_cta_continue: z.string().optional(),
-    panel_cta_waitlist: z.string().optional(),
-    panel_cta_disabled: z.string().optional(),
+    // Panel action button labels — NEW
+    panel_cta_checkout: z.string().optional(),         // singular (compact + maxSelectable=1)
+    panel_cta_checkout_plural: z.string().optional(),  // plural (compact + >1, or full)
+    panel_cta_waitlist: z.string().optional(),
+    panel_cta_notify_me: z.string().optional(),
+
+    // Welcome text defaults — NEW
+    welcome_default: z.string().optional(),
+    welcome_waitlist: z.string().optional(),
+    welcome_notify_me: z.string().optional(),
+
+    // Legacy (deprecated) — keep for back-compat
+    panel_cta_continue: z.string().optional(), // maps to checkout/checkout_plural
+    panel_cta_disabled: z.string().optional(), // maps to checkout + enabled=false
   })
   .strict();
```

(Prevents breaking current payloads which reference `panel_cta_continue` etc. )

### 3) **ContextSchema** (add `welcomeText`)

```diff
 const ContextSchema = z
   .object({
     orderRules: OrderRulesSchema,
     gatingSummary: GatingSummarySchema.optional(),
     panelNotices: z.array(NoticeSchema).default([]),
     effectivePrefs: EffectivePrefsSchema,
+    welcomeText: z.string().optional(), // NEW
     copyTemplates: z.array(CopyTemplateSchema).optional(),
     clientCopy: ClientCopySchema.optional(),
     tooltips: z.array(TooltipSchema).optional(),
     hovercards: z.array(HoverCardSchema).optional(),
   })
   .strict();
```

(Declared shape aligns with how §4.1 describes context responsibilities. )

---

## PanelActionButton v2 — normative text + bridging

> Current §5.3a enumerates `"continue" | "waitlist" | "disabled"` and explicitly sources labels from `clientCopy`.

**Replace §5.3a with your model**, but preserve compatibility notes:

- **State:**

  ```ts
  { kind: "checkout" | "waitlist" | "notify_me", enabled: boolean, label: string }
  ```

- **Derivation:** Keep your rules exactly (purchasable → checkout; else waitlist; else notify_me; else checkout disabled) and add a **mapping note**:

  > _Compatibility_: Legacy state `"continue"` maps to `{ kind: "checkout", enabled: true }`. Legacy `"disabled"` maps to `{ kind: "checkout", enabled: false }`. Clients **MUST** accept legacy copy keys and map them as described.

- **Label resolution (never hardcoded):**

  1. For `checkout`: use `panel_cta_checkout` (singular) or `panel_cta_checkout_plural` (plural) depending on layout context (see Layout §8.9).
  2. For `waitlist`: use `panel_cta_waitlist`.
  3. For `notify_me`: use `panel_cta_notify_me`.
  4. **Fallbacks to legacy keys:** if the new keys are not provided, fall back to `panel_cta_continue` (plural intent) and `panel_cta_disabled` when disabled.

- **Why this is safe:** You maintain the existing “copy comes from server” invariant and avoid breaking current payloads that set `panel_cta_continue`.

**Implementation note (Jotai example):** In the spec’s Jotai snippet, `panelDataQueryAtom` is defined as a **function that takes `eventId`**; ensure the sample `panelActionButtonAtom` references the correct bound atom (e.g., `get(panelDataQueryAtom(eventId))`). The current doc shows both patterns in different places; tighten the example for consistency.

---

## Layout Modes & Quantity UI (new §8.9)

- This section is **additive** and helpful. It doesn’t change the authoritative row truth tables (§8.1–8.3).
- **Nits:**

  - Make the “**Quantity UI Consistency Rule**” a **SHOULD**, not a MUST (presentation guideline) so it doesn’t conflict with the per‑row `quantityUI` derivation, which remains the business truth.
  - When you say “Full layout always plural,” tie it back to the copy keys (plural = `panel_cta_checkout_plural` or legacy `panel_cta_continue`) to preserve the “no hardcoded strings” rule.

---

## Notices: text, custom content, and stacking

- Your expanded description of `context.panelNotices[]` is aligned with today’s priority/stacking rules.
- Add a bold note under “Custom content notice”:

  > Only `code: "requires_code_entry"` may render the access‑code form inline, and only when there are **no visible purchasable items** (gated‑only surface). All other primary actions remain out of notices (use PanelActionButton / AccessCodeCTA).

---

## Reason Code Registry updates

- Add **`requires_code_entry`** under panel‑level codes.
- Standardize on **`event_sold_out`**. The doc has a stray `event_sold_out_info` in an example—either alias it in the table or update the example to the canonical code to prevent confusion.

---

## Examples & tests

- Your compact/full examples match the schema and state axes (temporal/supply/gating/demand). The “not on sale yet” and “public sold out + hidden gated” scenarios align with current rules for waitlist/notify derivation and banner separation.
- Keep “labels from copy” discipline in examples—no string literals outside `clientCopy`/`messages` unless you clearly mark them as example text.
- Add a small acceptance test to **verify legacy `clientCopy` fallback** works when new keys are absent.

---

## Minor consistency nits to tighten while you’re in there

1. **Jotai atoms usage**: In one snippet `get(panelDataQueryAtom)` is used without the `eventId` parameter; align with the function form.
2. **“Informational only” phrasing**: Where you introduce custom content in notices, carve the specific exception (see above) to avoid contradicting §5’s current “not primary CTAs” wording.

---

## Ready‑to‑merge spec text (drop‑in)

Add this **compatibility note** under your new §5.3a:

```markdown
> **Compatibility with v0.4 wording:** Earlier drafts used `PanelActionButton` states `"continue" | "waitlist" | "disabled"`. These map to the new model as:
>
> - `"continue"` → `{ kind: "checkout", enabled: true }`
> - `"disabled"` → `{ kind: "checkout", enabled: false }`
>   Labels continue to come from `context.clientCopy`. New keys (`panel_cta_checkout*`, `panel_cta_notify_me`) take precedence; legacy keys (`panel_cta_continue`, `panel_cta_disabled`) remain supported for a deprecation window and are ignored once new keys are present.
```

And this **exception note** under Panel‑level banners:

```markdown
> **Exception (access code entry):** While panel notices are informational, a single custom notice code
> `requires_code_entry` MAY render the access code form inline **only** when the surface is gated‑only
> (no visible purchasable items). In all other cases, access code entry is provided by the
> **AccessCodeCTA** element below the PanelActionButton.
```

---

## Decision: **Approve with the adjustments above**

You keep the spirit of 0.4 (server is the oracle; client derives UI) while giving us a cleaner compact layout, better copy control, and a pragmatic gated‑entry flow.

---

## Implementation checklist (tight)

**Schemas**

- [ ] Add `icon` + `description` to `NoticeSchema`.
- [ ] Add `welcomeText` to `ContextSchema`.
- [ ] Extend `ClientCopySchema`: new keys (`panel_cta_checkout*`, `panel_cta_notify_me`, `welcome_*`) **and** keep legacy keys.

**Normative text**

- [ ] Replace §5.3a with new state model + compatibility mapping.
- [ ] Add §8.9 Layout Modes (mark consistency rule as **SHOULD**).
- [ ] Add the single **exception** for `requires_code_entry`.
- [ ] Update Reason Code table; standardize `event_sold_out`.

**Examples / tests**

- [ ] Include compact/minimal + compact/qty + full/mixed examples (as you wrote).
- [ ] Add acceptance tests for legacy → new `clientCopy` fallback.
- [ ] Ensure no examples hardcode labels outside `clientCopy`/`messages`.

**Doc hygiene**

- [ ] Fix Jotai example to pass `eventId` to `panelDataQueryAtom`.
- [ ] Remove or alias `event_sold_out_info` in examples.

---

## Optional polish

- Add a miniature “**Label resolution matrix**” in §5.3a that shows **(layout, maxSelectable)** → **copy key** (singular/plural). Keeps future contributors from re‑introducing hardcoded strings.

---

### Where the current spec already supports your direction (for confidence)

- **Price UI modes** (`shown`/`masked`/`hidden`), quantity derivation, and CTA truth tables are already crisp in §8; your layout rules are a presentation layer on top.
- **Access code UX** is already modeled as its own CTA element, so surfacing a **prominent** variant for gated‑only via a custom notice is an incremental enhancement, not a new pattern.

---

**Next step options**

- Ship a PR with the schema diffs and the §5/§8 text swaps; I can produce a unified diff spanning the doc plus updated example fixtures.
- Or stage this as a “0.4.1” patch: land the schemas + compatibility notes first, then the §8.9 layout text and examples.

</5pro-c1-r1>

<5pro-c1-r2>

Short answer: **yes—modestly.** The deep‑research note mostly confirms the spec is internally consistent, and it adds one concrete “do this or you’ll break strict validation” call‑out (the **welcomeText** idea). It also suggests a couple of tidy doc tweaks. Net effect: small but real value.

Here’s the breakdown, with what it adds vs. what’s already guaranteed by the spec:

**What it usefully adds**

- **Welcome text needs a schema + invariant update.** There’s no `context.welcomeText` today; strict validation means any unknown field will hard‑fail. If you want it, you must add it to `ContextSchema` and explicitly treat it as **static introductory copy** (not a status banner) so it coexists with the “single speech channel per level” rule. Otherwise payloads will be rejected.
- **Doc polish on notices.** The prose in §5.2 talks about notice fields but doesn’t mention two that exist in the schema: `title` and `scope` (default `"panel"`). Surfacing those in §5.2 will avoid “where did this field come from?” confusion.
- **Reiterate the priority default where authors look.** The default `priority: 0` is clearly stated under the payment‑plan banner rule (§5.3), but repeating it in §5.2 would help authors who skip ahead. Not a blocker, just clarity.

**What it correctly confirms**

- **Notice action shape** (`{ label, kind: "link"|"drawer", target? }`) and `expiresAt` exist and match prose + schema. Sorting by descending `priority` is normative.
- **CTA derivation is consistent** and preserves **gate precedence**: if an item is locked, no waitlist/notify leaks through; row and panel CTAs get their labels from server copy.
- **Compact sold‑out layout** is a pure presentation toggle driven by `effectivePrefs.showTypeListWhenSoldOut`; the client never invents a “Sold out” banner (server must send a notice).

**Extra nits it didn’t catch (worth fixing while you’re here)**

- **Schema vs. examples mismatch: `display.showLowRemaining` is required in the schema but omitted in several examples.** Either make it optional with a default (likely `false`) or update every example to include it explicitly. As written, those examples won’t validate under `.strict()`.
- **Code registry mismatch:** examples use `event_sold_out_info` in one place while the registry/table elsewhere prefers `event_sold_out`. Pick one canonical code and use it everywhere (I’d keep the shorter `event_sold_out`). In a strict, code‑as‑contract world, two names for one concept is a papercut.

**Concrete patch list (low effort, high signal)**

1. **If you want welcome text:** add `welcomeText?: string` to `ContextSchema`; in §1 and/or §4.1 explicitly mark it as static, non‑status copy that sits above the list and **does not** count as a banner (so it coexists with “one speech channel per level” without ambiguity). Adjust the “no ad‑hoc banners” guardrail to carve out this exception by name.
2. In §5.2, add one line noting notices may include **`title`** (for two‑line banners) and that **`scope` defaults to `"panel"`** (rarely needed by authors, but good to mention).
3. In §5.2, restate: **“If `priority` is omitted, treat as `0` (lowest).”** Keep the global rule in §5.3 too.
4. **Make `display.showLowRemaining` optional** (or add it as `false` in every example). This restores schema↔examples alignment under strict validation.
5. **Normalize the sold‑out banner code** (`event_sold_out` vs `event_sold_out_info`) across examples, tests, and the registry.

If you apply those small edits, the contract remains tight, the schema and prose line up, and the “welcome text” addition won’t surprise validation. From there, the next worthwhile upgrades are adding a tiny “Where to use `title` vs `text` in notices” authoring note and a Storybook fixture for the **compact sold‑out** path with and without a server‑sent sold‑out notice—keeps everyone honest about “no client‑invented banners.”

</5pro-c1-r2>

<5pro-c2-r1>

Jon — I read your update‑plan against the current **product-panel-spec-0.4.md** and did a line‑by‑line consistency check. Short version: most of what you propose is already aligned with the spec’s philosophy (server facts → derived UI), and a bunch is additive + safe. Two parts **do** collide with existing normative rules and need tweaks before merging: (1) the **PanelActionButton** state model and copy keys, and (2) a **full‑layout “uniform steppers”** rule that contradicts the current quantity visibility truth table.

Below is a merge checklist (what’s green to ship, what needs edits), followed by the exact conflicts, suggested patches (Zod + spec text), and test cases to add.

---

## Merge checklist by section

| Section in your plan                                                                  | Verdict              | Notes / Where it maps into current spec                                                                                                                                                                                                                                                                                                                                                           |            |                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **§1 Primary use case note (“Ticket Sales”)**                                         | ✅ Merge             | Editorial clarification after the architecture context; harmless and helpful. Slots cleanly into §1 Purpose & Scope.                                                                                                                                                                                                                                                                              |            |                                                                                                                                                                                                                                                                                                                                                                                                         |
| **§2 PanelNotice schema: `icon`, `description`; stacking; custom content**            | ⚠️ Merge with edits  | Adding `icon` & `description` is safe (schema is strict; we must extend). But “custom content notice” that renders an **access‑code form** contradicts “not for primary CTAs” in §5.2/§5.3. Keep AccessCode form as the separate **AccessCodeCTA**; allow a _notice_ to _prompt_ the code (no inline form) or explicitly carve a narrow exception.                                                |            |                                                                                                                                                                                                                                                                                                                                                                                                         |
| **§3 `welcomeText` + clientCopy `welcome_*` defaults**                                | ✅ Merge             | New optional context field + optional clientCopy keys fits our atomic‑deploy model; add to Zod. No conflicts elsewhere.                                                                                                                                                                                                                                                                           |            |                                                                                                                                                                                                                                                                                                                                                                                                         |
| **§4 PanelActionButton model (checkout/waitlist/notify_me + singular/plural labels)** | ❌ Conflict → revise | Current spec’s panel CTA uses states `"continue"                                                                                                                                                                                                                                                                                                                                                  | "waitlist" | "disabled"`and is gated by`selectionValid`(derived from`orderRules`). Your version enables “checkout” whenever *any* item is purchasable and swaps copy keys. That breaks existing derivation + copy contract. Recommended: **keep gating by `selectionValid`**, keep _support_ for “Continue/Checkout” labels, add **optional\*\* singular/plural convenience labels but don’t flip the state machine. |
| **§5 New §8.9 Layout modes (compact vs full) and quantity rules**                     | ⚠️ Merge with edits  | The _mode_ distinction (items.length === 1 → compact) is fine as presentational guidance. But the “if any item has maxSelectable > 1 then show steppers on **all** rows” rule **contradicts the normative truth table** that returns **select** when `maxSelectable===1`. Make this a _non‑normative_ visual consistency **MAY** (not MUST), or update the truth table and the atoms accordingly. |            |                                                                                                                                                                                                                                                                                                                                                                                                         |
| **§6 Reason code registry additions**                                                 | ✅ Merge             | Adding `requires_code_entry` (if you keep it as a _notice code without inline form_) and clarifying panel‑level codes is fine. We already have `requires_code`, `event_sold_out`, and `payment_plan_available`.                                                                                                                                                                                   |            |                                                                                                                                                                                                                                                                                                                                                                                                         |
| **§7–§8 Examples + developer checklists**                                             | ⚠️ Merge with edits  | Examples are good, but any examples that: (a) render an inline access‑code **form** inside a notice, or (b) assume panel “checkout” without `selectionValid`, should be aligned to the spec edits above.                                                                                                                                                                                          |            |                                                                                                                                                                                                                                                                                                                                                                                                         |

---

## The two real conflicts (and how to fix them)

### 1) PanelActionButton state model & copy keys

**Current spec (normative):**

- States: `"continue" | "waitlist" | "disabled"`. Labels come from `context.clientCopy` (e.g., `panel_cta_continue`, `panel_cta_waitlist`, `panel_cta_disabled`). The **“Continue”** button is **gated** by `selectionValid` from `orderRules`.
- Access code is a separate **AccessCodeCTA**, not a notice action.

**Your change:**

- Switch to `{ kind: "checkout" | "waitlist" | "notify_me", enabled: boolean, label }`, enable “checkout” if **any** item purchasable, and add singular/plural `"Get Ticket(s)"` label logic.

**Why it conflicts:**

- It bypasses `selectionValid` gating (spec says “derive; don’t decide”, and panel is responsible for validating selection before handoff).
- It renames labels and removes existing keys (`panel_cta_continue`, `panel_cta_disabled`) used across §5.3 and examples.

**Recommended reconciliation (minimal + future‑proof):**

- **Keep the existing state machine** (continue/waitlist/disabled) and validation gating.
- **Add optional copy aliases** for singular/plural:

  - `panel_cta_checkout` (alias for `panel_cta_continue` when compact + single selection),
  - `panel_cta_checkout_plural` (alias for multi‑selection/fill‑cart contexts).
  - Keep `panel_cta_continue` for backwards consistency; client can prefer checkout labels when layout is compact.

- **Compact one‑item/one‑qty quality‑of‑life:** allow the panel button to proceed immediately (implicit qty=1) **only** when:

  - `items.length === 1` **and** `commercial.maxSelectable === 1` **and** `selectionValid` is satisfied by selecting 1 of the single item according to `orderRules`. This preserves the invariant that the panel ensures a valid selection before handoff. (Non‑normative authoring note is fine.)

> This preserves the server‑driven contract while giving you the UX you want for the “single ticket, single qty” lane.

**Schema patch (ClientCopy) — add keys, keep existing:**

```ts
// extend existing ClientCopySchema (keep prior keys)
const ClientCopySchema = z
  .object({
    // Selection validation
    selection_min_reached: z.string().optional(),
    selection_max_types: z.string().optional(),
    quantity_min_reached: z.string().optional(),
    quantity_max_reached: z.string().optional(),
    addon_requires_parent: z.string().optional(),

    // Existing panel CTA labels
    panel_cta_continue: z.string().optional(),
    panel_cta_waitlist: z.string().optional(),
    panel_cta_disabled: z.string().optional(),

    // NEW optional aliases (singular/plural)
    panel_cta_checkout: z.string().optional(), // e.g., "Get Ticket"
    panel_cta_checkout_plural: z.string().optional(), // e.g., "Get Tickets"
    panel_cta_notify_me: z.string().optional(), // optional row→panel parity
  })
  .strict();
```

(This extends the current schema at §14.2 without breaking existing callers. )

---

### 2) “Uniform steppers” rule in full layout

**Current spec (normative):**

- Quantity UI is derived per row: `select` when `maxSelectable === 1`, `stepper` when `> 1`. No cross‑row override.

**Your change:**

- In full layout: _if any_ row has `maxSelectable > 1`, **all** rows show steppers (even those with `maxSelectable === 1`) for visual consistency.

**Why it conflicts:**

- It contradicts the truth table and the existing `quantityUIAtom` derivation (which only looks at the row).

**Two acceptable paths:**

- **A. Make it non‑normative (preferred)**: “Clients **MAY** normalize controls visually in full layout for consistency, provided it **does not change behavior** (e.g., stepper hard‑clamped to 1 is visually a stepper but functionally a single selection).”

  - No schema change. Add a note in §8 as a _rendering heuristic_.

- **B. Change the truth table (heavier)**: Update §8’s derived table and `quantityUIAtom` to accept a panel‑level flag (“layoutConsistency: stepper_all_rows”), then document exactly how it’s computed (from panel state) and ensure it never changes business meaning (clamp still 1). This is more invasive and demands code changes to atoms.

I recommend **A** to keep the spec tight and avoid “panel‑derived row UI” surprises.

---

## What’s safe to add as‑is

### Panel notices: `icon` and `description`

- **Extend NoticeSchema** with `icon?: string` and `description?: string`. Rest of the fields and semantics already exist (`scope`, `variant`, `action`, `priority`, `expiresAt`).

```ts
const NoticeSchema = z
  .object({
    code: MachineCodeSchema,
    scope: z.enum(["panel", "item"]).default("panel"),
    variant: z.enum(["neutral", "info", "warning", "error"]).default("info"),
    icon: z.string().optional(), // NEW
    title: z.string().optional(),
    text: z.string().optional(),
    description: z.string().optional(), // NEW
    params: z.record(z.unknown()).optional(),
    action: NoticeActionSchema.optional(),
    priority: z.number().default(0),
    expiresAt: z.string().datetime().optional(),
  })
  .strict();
```

- **Keep** the explicit rule: **not for primary CTAs**. If you want a “prominent gate” surface, keep using a **notice** to _explain_ and the **AccessCodeCTA** to _act_. This is already spelled out in §5.2/§5.3.

> If you _really_ want the inline access‑code form inside a notice when `items=[] && hasHiddenGatedItems=true`, then add a **narrow exception** to §5.2 that **only** this code (`requires_code_entry`) may render a custom form. Otherwise it conflicts with the “no primary CTAs in notices” principle.

### `welcomeText` and `welcome_*` defaults

- Add `welcomeText?: string` to **ContextSchema** and `welcome_default|welcome_waitlist|welcome_notify_me` to `clientCopy`. No existing behavior conflicts.
- This dovetails with current copy strategy (“server supplies copy; client interpolates”).

**Schema patch (Context):**

```ts
const ContextSchema = z
  .object({
    orderRules: OrderRulesSchema,
    gatingSummary: GatingSummarySchema.optional(),
    panelNotices: z.array(NoticeSchema).default([]),
    effectivePrefs: EffectivePrefsSchema,
    welcomeText: z.string().optional(), // NEW
    copyTemplates: z.array(CopyTemplateSchema).optional(),
    clientCopy: ClientCopySchema.optional(),
    tooltips: z.array(TooltipSchema).optional(),
    hovercards: z.array(HoverCardSchema).optional(),
  })
  .strict();
```

**Schema patch (ClientCopy additions already shown above).**

### Layout modes: document “compact vs full”

- Good to add as **presentation guidance**: “**Compact** when `items.length===1`; **Full** when `>1`.” Keep it clearly **non‑business** (no server decisions). This aligns with §8’s “derive presentation; never decide business” principle.

### Reason code registry

- Add table rows for `requires_code_entry`, `sales_end_soon` etc. Existing registry already contains `requires_code`, `event_sold_out`, `payment_plan_available`.

---

## Spec text nits to align with your plan (small edits)

1. **§5.2 Panel notices description**
   Add `icon` and `description` to the normative list; keep “Not for primary CTAs” sentence; optionally add a one‑line **exception** for `requires_code_entry` if you choose that route.

2. **§5.3a Panel CTAs**

- Keep state machine; add a paragraph: _“In a compact, single‑item/single‑quantity case, clients MAY treat the PanelActionButton as an immediate proceed control using `panel_cta_checkout` if pressing it results in a selection that satisfies `orderRules` (e.g., implicit quantity = 1).”_
  This preserves invariants and gives you the UX you want.

3. **§8 Rendering composition**

- If you keep “uniform steppers” as a style, add a **non‑normative note**: “Clients MAY render a stepper clamped to 1 for rows with `maxSelectable===1` to maintain visual consistency in full layout; this MUST NOT change selection semantics.” The derived truth table remains authoritative.

---

## Example updates (safe patterns)

- **Compact — single ticket, qty=1**: keep price shown (because purchasable), no row‑level quantity control, panel button label from `panel_cta_checkout` (or fallback to `panel_cta_continue`), and ensure pressing it yields a valid selection. This is consistent with current price/quantity rules.

- **Waitlist and notify**: Examples already exist and match your intent; ensure CTA labels are sourced from messages/templates (row) and the panel button derives state per §5.3a.

- **Gated‑only surface**: Keep **notice prompt** + **AccessCodeCTA**; do not render the form _inside_ the notice unless you add the explicit exception in §5.2.

---

## Tests to add (beyond what’s already in §9/§14)

- **ClientCopy fallbacks (new keys):**

  - If `panel_cta_checkout*` missing, fall back to `panel_cta_continue`.
  - If both missing, test that UI doesn’t hardcode strings; relies on app‑level copy (still server‑sourced).

- **Compact implicit selection (quality‑of‑life):**

  - Given compact 1× item with `maxSelectable=1` and `orderRules` allowing 1, expect panel button enabled and submitting produces a valid selection payload before checkout.

- **Uniform stepper visual (if adopted):**

  - Given full layout with a mix of `maxSelectable` (1 and >1), expect rows with `maxSelectable=1` still clamp to 1 and selection validity rules remain unchanged. (Visual only.)

- **Notice icon/description:**

  - Given a notice with `icon` and `description`, expect rendering without changing priority/variant logic.

---

## What would be a schema‑breaking change (don’t ship as‑is)

- Replacing `panel_cta_continue` with `panel_cta_checkout` instead of **adding** it → current spec is strict `.strict()`; unknown removal/rename breaks payloads and examples. Keep both.

- Making notices do primary actions by default → violates §5.2/§5.3 separation of concerns; either keep AccessCodeCTA as the only action surface, or carve a one‑code exception and document it loudly.

---

## Ready‑to‑merge patches (concise)

**1) Zod additions (drop‑in):**

- Add `icon?` and `description?` to `NoticeSchema`.
- Add `welcomeText?` to `ContextSchema`.
- Extend `ClientCopySchema` with `panel_cta_checkout`, `panel_cta_checkout_plural`, `panel_cta_notify_me` **without removing** existing `panel_cta_continue/panel_cta_disabled`.

**2) Spec text:**

- §5.2: extend the “Panel‑level banners” field list and keep the “not for primary CTAs” rule; optionally add a **tightly scoped** exception statement if you insist on `requires_code_entry` rendering a form inline in gated‑only screens.
- §5.3a: keep states; add compact/singular label note and alias behavior for `panel_cta_checkout*`.
- New §8.9: add “Layout Modes (compact vs full)” as presentational guidance; ensure it references, not overrides, §8’s truth tables.

---

## Missing edge cases worth adding

- **Selection gating in compact mode:** Explicitly state that in compact one‑item/one‑qty, pressing the panel CTA implies selection=1 **only if** that satisfies `orderRules`. Otherwise, show the validation string from `clientCopy` and keep the button disabled.

- **Notify‑me at panel level:** Clarify that the **panel** may present a “Notify Me” _state_ only when **no** items are purchasable and **some** item’s `temporal.phase="before"` with `demand.kind="notify_me"`. (Aligns with current row derivation + your plan.)

- **Icon semantics:** Define that `notice.icon` is a presentational hint (no business meaning), with a short list of suggested names (e.g., `lock`, `credit-card`, `clock`). (Non‑normative.)

---

### Bottom line

- **Ship now:** Primary use case note; `welcomeText` + `welcome_*`; Notice `icon`/`description`; expanded reason‑code table; layout mode documentation (non‑normative).
- **Edit before merge:** Keep panel CTAs gated by `selectionValid` (preserve “derive; don’t decide”). Add checkout label aliases without removing `panel_cta_continue`. Treat “uniform steppers” as a _MAY_, not a _MUST_ — or update the truth table + atoms if you really want it enforced.
- **Avoid regression:** Don’t let notices perform primary actions unless you explicitly carve a one‑code exception.

If you want, I can produce a consolidated patch block (schemas + the precise §5/§8 insertions) so you can paste it into the spec file as a single commit, with the acceptance tests list appended as a checklist.

</5pro-c2-r1>
