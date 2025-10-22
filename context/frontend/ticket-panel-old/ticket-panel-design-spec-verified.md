# Ticket Panel Design Specification (Verified)

> **Purpose**: Visual design specifications with theme color applications. Focus on appearance, not implementation.
>
> **Theme System**: Uses OKLCH theme system - see `THEME-SYSTEM.md` for complete reference
>
> **Reference**: See `ticket-panel-states.md` for state hierarchy overview
>
> **Status**: 🟡 In Progress (Updated 2025-10-14)

---

## How to Use This Document

1. Reference for visual appearance and theme color usage
2. Compare against: screenshots (BUS-13), Luma examples, design requirements
3. Specifications describe visual outcome, not implementation details
4. Mark verified items with ✅ and date
5. Record decisions in Decision Log (Section 9)

---

## Table of Contents

1. [Panel Layouts](#1-panel-layouts)
2. [Panel Empty States](#2-panel-empty-states)
3. [Card States (Multi-Ticket)](#3-card-states-multi-ticket)
4. [Card States (Single-Select)](#4-card-states-single-select)
5. [Card Modifiers](#5-card-modifiers)
6. [Sub-Components](#6-sub-components)
7. [Typography & Colors (Theme System)](#7-typography--colors-theme-system)
8. [Implementation Checklist](#8-implementation-checklist)
9. [Decision Log](#9-decision-log)

---

## 1. Panel Layouts

### ✅ Layout: multi-ticket (standard)

**Verified:** 2025-10-14

**Status:** ✅ Implemented

**Trigger:** Default layout, multiple tickets OR single ticket without special layout

**Visual Structure:**

- Header section (title + subtitle)
- Vertical card list
- Footer section (pricing + CTA)

**Card Types:**

- Default, Selected, Disabled, Locked states
- Featured modifier (badge overlay)
- Quantity stepper (appears when selected)

---

### ⬜ Layout: single-ticket (simplified)

**Status:** ❌ Not implemented (P1 - BUS-13)

**Review Notes:**

<!-- After reviewing ss-004109 screenshot:
- Verify: Large price (24px) placement
- Verify: Divider line styling
- Verify: Hash (#) icon size and color
- Verify: "Per ticket" label positioning
- Document exact spacing values
-->

**Spec Template:**

```tsx
// Fill in after verification
```

---

### ⬜ Layout: single-select

**Status:** ❌ Not implemented (P1 - BUS-13)

**Review Notes:**

<!-- After reviewing ss-004104, ss-004108 screenshots:
- Verify: Horizontal card layout (checkbox | content | price)
- Verify: Auto-select behavior when only one option left
- Verify: Checkbox vs radio button choice
- Document exact spacing
-->

**Spec Template:**

```tsx
// Fill in after verification
```

---

## 2. Panel Empty States

### ⬜ Empty State: sold-out

**Status:** ❌ Not implemented (P2 - BUS-13)

**Review Notes:**

<!-- After reviewing ss-004102 screenshot:
- Verify: Icon style (square with rounded corners)
- Verify: Icon size (~40px?)
- Verify: Background color for icon
- Verify: Text hierarchy (title/description sizing)
- Document optional CTA behavior
-->

---

### ⬜ Empty State: waitlist

**Status:** ❌ Not implemented (P2 - BUS-13)

**Review Notes:**

<!-- After reviewing ss-004110 screenshot:
- Verify: Inbox icon
- Verify: UserInfo display (if logged in)
- Verify: CTA button styling
- Document required vs optional elements
-->

---

### ⬜ Empty State: event-paused

**Status:** ❌ Not implemented (P2 - BUS-13)

**Review Notes:**

<!-- After reviewing ss-004111 screenshot:
- Verify: Should disabled tickets be shown?
- Verify: Message placement
- Verify: "Notify Me" CTA styling
-->

---

### ⬜ Empty State: cancelled

**Status:** ❌ Not implemented (P3 - BUS-13)

**Review Notes:**

<!-- After reviewing ss-004112 screenshot:
- Verify: Prohibition icon styling
- Verify: Text content
- Verify: Optional CTA presence
-->

---

## 3. Card States (Multi-Ticket)

### ⬜ State: default (available, qty=0)

**Review Notes:**

<!-- After reviewing current code + screenshots:
- Verify: border-[rgba(0,0,0,0.08)] is correct
- Verify: hover state border-[rgba(0,0,0,0.16)]
- Verify: entire card is <button> element
- Verify: focus ring styling
- Test: click behavior adds to cart
-->

**Visual:**

- Background: `bg-white`
- Border: `border-gray-20` (default)
- Border (hover): `border-gray-30`
- Rounded corners, subtle transition

**Interaction:** Clickable, adds to cart  
**Theme:** `gray-20`, `gray-30`  
**Status:** _Pending verification_

---

### ✅ State: selected (in cart, qty>0)

**Verified:** 2025-10-14  
**Updated for Theme System:** 2025-10-14

**Visual:**

- Background: `bg-white`
- Border: `border-foreground border-2` (2px thick)
- Shadow: `shadow-sm`
- Quantity stepper visible on right

**Interaction:** Not clickable (stepper handles qty)  
**Theme:** `foreground` (semantic)  
**Note:** ⚠️ VERIFY `border-2` renders as 2px

---

### ⬜ State: disabled (not purchasable)

**Review Notes:**

<!-- Critical: Verify opacity value
- Current code: opacity-50
- Screenshots suggest: opacity-40
- Test both in browser side-by-side
- Make decision based on visual comparison
-->

**Visual:**

- Background: `bg-white`
- Border: `border-gray-20`
- Opacity: `opacity-40` (40%)
- Cursor: not-allowed indicator
- Reason badge: `bg-gray-10 text-muted-foreground`

**Interaction:** Not clickable  
**Theme:** `gray-20`, `gray-10`, `muted-foreground`  
**Triggers:** sold*out, ended, paused, invite_only, capacity exhausted  
**Note:** ⚠️ Verify opacity is 40% (not 50%)  
**Status:** \_Needs verification*

---

### ⬜ State: locked (mixed types blocked)

**Review Notes:**

<!-- After reviewing current implementation:
- Verify: same visual as Disabled
- Verify: reason text is correct
- Verify: trigger logic works correctly
- Test: unlocks when other tickets removed
-->

**Visual:** Same as Disabled state

- Background: `bg-white`, Border: `border-gray-20`, Opacity: `opacity-40`
- Reason text: "Remove other tickets to add this one"

**Trigger:** Mixed ticket types not allowed + other tickets in cart  
**Status:** _Pending verification_

---

## 4. Card States (Single-Select)

### ⬜ State: unselected (checkbox empty)

**Status:** ❌ Not implemented (P1)

**Review Notes:**

<!-- After reviewing ss-004104 screenshot:
- Document: horizontal layout exact spacing
- Document: checkbox size and styling
- Document: border treatment when unselected
-->

---

### ⬜ State: selected (checkbox checked)

**Status:** ❌ Not implemented (P1)

**Review Notes:**

<!-- After reviewing ss-004104, ss-004108 screenshots:
- Document: checkmark icon SVG
- Document: border changes to black 2px
- Document: auto-select behavior (when only option)
-->

---

### ⬜ State: disabled (checkbox disabled)

**Status:** ❌ Not implemented (P1)

**Review Notes:**

<!-- After reviewing screenshots:
- Verify: same 40% opacity as multi-ticket disabled
- Verify: checkbox disabled styling
-->

---

## 5. Card Modifiers

### ⬜ Modifier: featured-badge

**Review Notes:**

<!-- After reviewing current implementation:
- Verify: absolute positioning (-top-2 -right-2)
- Verify: glow effect implementation
- Verify: hides when qty > 0
- Verify: "Best Value" text or customizable?
- Test: z-index stacking with other elements
-->

**Visual:**

- 2-layer design: blur glow + solid pill
- Position: top-right corner, overlaying card
- Glow: blurred `primary` color at 60% opacity
- Badge: `bg-primary text-primary-foreground`, rounded pill, small uppercase text
- Visibility: Shows on default state only, hides when selected

**Theme:** `primary`, `primary-foreground` (auto-contrast)  
**Status:** _Pending verification_

<!-- After reviewing current implementation:
- Verify: borderless style with subtle brand tint
- UPDATE: bg-[var(--theme-accent-04)] → bg-brand-opacity-4 or bg-[var(--brand-opacity-4)]
- Verify: trash icon at qty=1, minus at qty>1
- Verify: entrance animation
- Verify: bump animation on value change
- Test: keyboard navigation
- Test: disabled states
-->

**Theme:** `bg-brand-opacity-4` (subtle brand tint)

---

### ⬜ Sub-Component: CartFooter

**Review Notes:**

<!-- After reviewing current implementation:
- Verify: pricing breakdown layout
- Verify: CTA button height (38px exact from Luma)
- Verify: CTA variants (neutral vs accented)
- Verify: empty state disabled button
- Verify: loading state
- MISSING: UserInfo component (P0)
-->

---

### ⬜ Sub-Component: UserInfo (NEW)

**Status:** ❌ Not implemented (P0)

**Review Notes:**

<!-- After reviewing ss-004094, ss-004109 screenshots:
- Document: avatar size (24px?)
- Document: text sizes (name/email)
- Document: placement in footer (above CTA)
- Document: gradient background for default avatar
- Verify: conditional render (only if logged in)
-->

**Visual:**

- Avatar: Small circle (24px), with gradient fallback
- Name: Regular weight
- Email: Muted color
- Placement: Above CTA button in footer

---

### ⬜ Sub-Component: DynamicNotice (NEW)

**Status:** ❌ Not implemented (P1)

**Review Notes:**

<!-- After reviewing ss-004097, ss-004103 screenshots:
- Verify: background color - use bg-gray-5 or bg-gray-10
- UPDATE: rgb(247,248,249) → bg-gray-10 (oklch(0.970 0 0))
- Verify: icon circle background - use bg-gray-20 or bg-[var(--black-opacity-8)]
- UPDATE: ✅ Use `bg-gray-20` (Tailwind utility)
- Verify: icon size and spacing
- Verify: stacking behavior (multiple notices)
- Document: icon variants (Clock, UserCheck, AlertCircle, Info)
-->

**Theme Colors:**

- Background: `bg-gray-10`
- Icon circle: `bg-gray-20`
- Title: `text-foreground`
- Description: `text-muted-foreground`
- Icon: `text-muted-foreground`

---

## 7. Typography & Colors (Theme System)

> **Theme Reference**: See `THEME-SYSTEM.md` for complete token documentation

### ⬜ Text: TicketCard Title

**Review Notes:**

<!-- After reviewing current code:
- Verify: 16px (text-base)
- Verify: 500 weight (font-medium)
- UPDATE: --dayof-dark → --foreground or text-foreground
- Verify: line-height
-->

**Visual:**

- Size: 16px
- Weight: 500 (medium)
- Color: `text-foreground`

**Theme:** `foreground` (semantic, auto-contrast)  
**Status:** _Pending verification_

---

### ⬜ Text: Secondary/Muted Text

**Visual:**

- Size: 14px (small)
- Color: `text-muted-foreground`

**Theme:** `muted-foreground` (semantic, auto-contrast)

---

### ⬜ Color: Disabled State Opacity

**Decision:** ✅ Use `opacity-40`

**Rationale:** Matches Luma reference and screenshot analysis

**Next Step:**

1. Open dev tools on current implementation
2. Temporarily change `opacity-50` to `opacity-40`
3. Compare visually
4. Choose based on preference
5. Document decision in Decision Log

**No theme token change needed** - opacity is independent of color system

---

### ✅ Color: Border Colors

**Default state:** `border-gray-20` (subtle neutral)  
**Default hover:** `border-gray-30` (slightly darker)  
**Selected state:** `border-foreground border-2` (high contrast, thicker)

**Status:** ✅ Decided

---

### ⬜ Color: Status Dots

**Colors:**

- Available: `bg-green-500`
- Unavailable: `bg-gray-40`
- Limited: `bg-orange-500`

**Size:** Small circle (2.5 units)

**Note:** Static colors (not theme-based)

---

### ⬜ Color: Backgrounds

**Surface Colors:**

- Cards: `bg-white`
- Page: `bg-background` (theme-aware)
- Secondary: `bg-gray-5`
- Brand tint (subtle): `bg-brand-opacity-4`
- Brand tint (visible): `bg-brand-5`

---

## 8. Implementation Checklist

### Phase 0: Theme System Integration (P0)

**Visual Polish:**

- [ ] Default card border: `border-gray-20` (hover: `border-gray-30`)
- [ ] Selected card border: `border-foreground border-2`
- [ ] Disabled state: `opacity-40` (verify not 50%)
- [ ] Quantity stepper bg: `bg-brand-opacity-4`
- [ ] Featured badge: `bg-primary text-primary-foreground`
- [ ] Text colors: `text-foreground`, `text-muted-foreground`

**Testing:**

- [ ] Test with different brand colors in `/dev/playground`
- [ ] Verify WCAG AA compliance in contrast matrix
- [ ] Verify all state transitions

---

### Phase 1: Current Layout Verification (P0)

**Verify Visual Specs:**

- [ ] Disabled opacity: 40% (not 50%)
- [ ] Selected border: 2px thick
- [ ] Border colors: gray-20, gray-30, foreground
- [ ] Typography: sizes and colors
- [ ] Featured badge: positioning and visibility

**Add Missing Elements:**

- [ ] User info display (when logged in)
- [ ] Variable pricing indicator (if needed)

---

### Phase 2: New Layouts (P1 - BUS-13)

- [ ] Single-Ticket layout: Large price + qty row (ss-004109)
- [ ] Single-Select layout: Horizontal checkbox cards (ss-004104, ss-004108)
- [ ] Dynamic notice: Informational messages (ss-004097, ss-004103)

### Phase 3: Empty States (P2 - BUS-13)

- [ ] Sold Out panel (ss-004102)
- [ ] Waitlist panel (ss-004110)
- [ ] Event Paused panel (ss-004111)

### Phase 4: Future (P3)

- [ ] Cancelled panel (ss-004112)

---

## 9. Decision Log

### Decision: Disabled State Opacity

**Date:** 2025-10-14

**Options:**

- A) Keep 50% (current implementation)
- B) Change to 40% (matches Luma screenshots)

**Decision:** _Pending browser test_

**Next Step:**

1. Test both values visually
2. Choose based on which looks better
3. Update this section with final decision

**Expected Result:**

```tsx
// After decision:
!uiState.isPurchasable && "opacity-40 cursor-not-allowed";
```

---

### Decision: Selected Border Width

**Date:** 2025-10-14

**Options:**

- A) Keep 1px (if current renders correctly)
- B) Change to 2px (screenshots suggest thicker border)

**Decision:** _Pending DevTools inspection_

**Next Step:**

1. Inspect element in browser
2. Measure actual rendered border width
3. If not 2px, update className to include `border-2`

**Expected Result:**

```tsx
// After decision:
isSelected && "border-black border-2 shadow-sm";
```

---

### Decision: Selection Indicator Pattern

**Date:** 2025-10-14

**Options:**

- A) Keep border + shadow (current)
- B) Add checkmark icon like Luma

**Decision:** ✅ Keep current (border + shadow)

**Rationale:**

- Already implemented and working
- Simpler to maintain
- Still clearly indicates selection
- Consistent with our design system

**Status:** ✅ Decided - No changes needed

---

### Decision: Featured Badge Style

**Date:** 2025-10-14

**Options:**

- A) Keep absolute positioned overlay with glow (current)
- B) Change to inline pill like Luma

**Decision:** ✅ Keep current (overlay)

**Rationale:**

- More visually striking
- Draws attention to featured item
- Doesn't interfere with card layout
- Matches our brand style

**Status:** ✅ Decided - No changes needed

---

### Decision: Panel Layout Terminology

**Date:** 2025-10-14

**Options:**

- A) Keep "Checkbox Layout" name
- B) Rename to "Single-Select Layout"

**Decision:** ✅ "Single-Select Layout"

**Rationale:**

- Describes behavior (single selection) not UI (checkbox)
- Clarifies radio-like behavior despite checkbox visuals
- Consistent with "Multi-Ticket" and "Single-Ticket" naming

**Status:** ✅ Decided - Use "Single-Select" everywhere

---

### Decision: Theme System Integration

**Date:** 2025-10-14

**Type:** Architectural

**Context:**
New OKLCH theme system with 11-step brand scales, auto-contrast semantics, and Tailwind v4 integration. Need to migrate all ticket panel components from old color tokens.

**Options:**

#### Option A: Tailwind Utilities (Recommended)

```tsx
className = "bg-white border border-gray-20 hover:border-gray-30";
className = "bg-primary text-primary-foreground";
```

**Pros:**

- Cleaner code (less verbose)
- IntelliSense support
- Consistent with Tailwind best practices
- Easier to scan/read

**Cons:**

- Slightly less explicit about exact token used
- Tied to Tailwind (but we're already committed)

**Effort:** Low - simple find/replace

**Risk:** Low - Tailwind is core to stack

#### Option B: CSS Variables

```tsx
className="bg-white border border-[var(--black-opacity-8)]"
style={{ background: 'var(--primary)' }}
```

**Pros:**

- More explicit
- Can use in inline styles
- Framework agnostic

**Cons:**

- More verbose
- No IntelliSense
- Harder to read

**Effort:** Low - simple find/replace

**Risk:** Low

**Decision:** ✅ Use **Tailwind utilities** as default, CSS variables only when needed for dynamic/inline styles

**Rationale:**

- Cleaner, more maintainable code
- Better DX with IntelliSense
- Consistent with shadcn/ui patterns
- Reduces className verbosity

**Implementation Strategy:**

```tsx
// ✅ Preferred: Tailwind utilities
<div className="bg-white border border-gray-20 text-foreground">

// ✅ When needed: Dynamic brand colors via Tailwind
<div className="bg-brand-70 text-white">

// ✅ When needed: Inline styles for runtime values
<div style={{ background: `var(--brand-${step})` }}>

// ❌ Avoid: CSS variables in className unless necessary
<div className="border-[var(--black-opacity-8)]">
```

**Files to Update:**

- All ticket panel components (`TicketCard`, `QuantityStepper`, `CartFooter`, etc.)
- Remove old `--dayof-*` and `--theme-*` variable definitions from `index.css`

**Status:** ✅ Decided - Migrate to Tailwind utilities + theme system

---

### Decision: [Template - Copy for New Decisions]

**Date:** YYYY-MM-DD

**Options:**

- A) Option 1
- B) Option 2

**Decision:** _Pending_ or _Decided: X_

**Rationale:** Why this choice was made

**Next Step:** What needs to happen next

---

## 10. Review Workflow

### Step-by-Step Process

1. **Pick an item** from ticket-panel-states.md
2. **Gather sources:**
   - Current code implementation (read files)
   - Screenshots from BUS-13
   - Luma HTML examples (if relevant)
3. **Test in browser** (if applicable):
   - Inspect element
   - Measure sizes/spacing
   - Test interactions
4. **Make decision:**
   - Keep as-is?
   - Needs changes?
   - New implementation required?
5. **Document here:**
   - Add to appropriate section
   - Fill in "Verified" date and status
   - Mark with ✅
   - Add decision to Decision Log (if needed)
6. **Update checklist** in Section 8

### Suggested Review Order

**Round 1: Visual Polish (Quick wins - P0)**

1. Disabled state opacity (test both values)
2. Selected border width (inspect in DevTools)
3. Text colors verification (compare to Luma)
4. Status dot sizes

**Round 2: Missing Components (P0)**

1. UserInfo component - needed?
2. Variable pricing ± symbol - needed?

**Round 3: New Layouts (P1)**

1. Single-Ticket layout - review ss-004109
2. Single-Select layout - review ss-004104, ss-004108
3. DynamicNotice - review ss-004097, ss-004103

**Round 4: Empty States (P2)**

1. Sold Out panel - review ss-004102
2. Waitlist panel - review ss-004110
3. Event Paused panel - review ss-004111

---

## 11. Testing Scenarios

<!-- Add verified test cases as you implement -->

### Multi-Ticket Layout Tests

- [ ] Default state: appearance, hover, click adds to cart
- [ ] Selected state: border (2px?), shadow visible, stepper works
- [ ] Disabled state: opacity (40%?), cursor not-allowed, no interaction
- [ ] Locked state: reason text correct, unlocks properly
- [ ] Featured state: badge visible, positioned correctly
- [ ] Featured → Selected: badge disappears smoothly

### Single-Select Layout Tests (After P1)

- [ ] Unselected state: checkbox empty, grey border
- [ ] Selected state: checkbox filled, black border
- [ ] Single-select behavior: only one can be checked
- [ ] Auto-select: when only one option left, cannot uncheck
- [ ] Disabled state: greyed out, not clickable

---

## Notes & Open Questions

### Current Open Questions

- [ ] Border width: is border-black already 2px or need border-2?
- [ ] Opacity: 40% or 50% for disabled state?
- [ ] UserInfo: required for MVP?
- [ ] Variable pricing: common enough to implement now?
- [ ] Single-Ticket mode: when does it trigger exactly?

### Things to Test in Browser

- [ ] Disabled state at 40% vs 50% opacity (side by side)
- [ ] Selected border measurement (DevTools)
- [ ] Badge color variants (warning/info/etc)
- [ ] Status dot sizes (currently 10px w-2.5 h-2.5)
- [ ] Featured badge z-index (stacking with other elements)

---

**Next Action:** Start with Round 1 (Visual Polish), test opacity and border width in browser, make decisions, document here.

---

---

# Addendum: Context and Usage

> A short guide to understand and use this document effectively.

---

## What this document is

- The canonical visual spec for ticket panel layouts, card states, and modifiers
- Focuses on appearance and theme tokens, not code structure
- Uses the OKLCH theme system (see `THEME-SYSTEM.md`)

## How to use it

- Start in `ticket-panel-states.md` for the high-level hierarchy
- Use this doc to find exact visual treatment and theme tokens
- Mark items as ✅ once verified against screenshots/requirements

## Scope and non-goals

- Scope: Visual states, theme color usage, interactions at a glance
- Non-goals: Component architecture, file locations, implementation details

## Key decisions (condensed)

- Theme system: Tailwind utilities for tokens; CSS variables only for dynamic/inline values
- Borders: `border-gray-20` default, `hover:border-gray-30`, `border-foreground border-2` when selected
- Disabled: `opacity-40`
- Featured badge: `bg-primary text-primary-foreground` with glow

## When to update

- After verifying visuals against current screenshots/requirements
- When theme tokens change or new states/layouts are added
- When decisions in Section 9 are made or revised

## Relationship to other docs

- `ticket-panel-states.md`: Overview and hierarchy
- `THEME-SYSTEM.md`: Token definitions and usage
- Historical analysis docs: Reference only

---

Return to: [Table of Contents](#table-of-contents)
