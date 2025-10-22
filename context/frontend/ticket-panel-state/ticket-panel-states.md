# Ticket Panel: Complete State Hierarchy

> **Theme System:** Uses OKLCH theme system - see `THEME-SYSTEM.md` for complete token reference  
> **Focus:** Visual states and theme color applications  
> **Status:** Updated 2025-10-14

## 1. Panel Layouts (Purchasable Tickets)

```
📦 PANEL LAYOUTS
│
├─ multi-ticket ✅ Implemented
│   ├─ Use: Multiple tickets OR default single ticket
│   ├─ Cards: Standard vertical cards with qty steppers
│   ├─ Has: Header, Subtitle, TicketList, CartFooter
│   └─ Card States: default, selected, disabled, locked + featured-badge modifier
│
├─ single-ticket ❌ BUS-13 P1
│   ├─ Use: tickets.length === 1 && singleTicketLayout enabled
│   ├─ No cards! Large price section + single qty row
│   ├─ Has: Header, Price (24px), Divider, Qty Row (# icon), CartFooter
│   └─ Card States: N/A (no cards, just one qty stepper)
│
└─ single-select ❌ BUS-13 P1
    ├─ Use: All tickets maxPerOrder=1 && single-select only
    ├─ Cards: Horizontal checkbox cards (no qty stepper)
    ├─ Has: Header, Subtitle, TicketList (horizontal), CartFooter
    └─ Card States: unselected, selected (checked), disabled
```

---

## 2. Panel Empty States (No Tickets Available)

```
🚫 EMPTY STATES (full panel replacement)
│
├─ sold-out ❌ BUS-13 P2
│   ├─ Use: All tickets unavailable
│   ├─ Has: Icon (square), Title, Description
│   └─ CTA: Optional "Join Waitlist"
│
├─ waitlist ❌ BUS-13 P2
│   ├─ Use: Event full && waitlist enabled
│   ├─ Has: Icon (inbox), Title, Description, UserInfo
│   └─ CTA: "Join Waitlist" (required)
│
├─ event-paused ❌ BUS-13 P2
│   ├─ Use: No tickets on sale (paused/scheduled)
│   ├─ Has: Message, optional disabled ticket list
│   └─ CTA: Optional "Notify Me"
│
└─ cancelled ❌ BUS-13 P3
    ├─ Use: Event cancelled/closed
    ├─ Has: Icon (prohibition), Title, Description
    └─ CTA: Optional "Notify Me"
```

---

## 3. Card States (Within Layouts)

### Multi-Ticket Layout Cards

```
🎫 CARD STATES (mutually exclusive)
│
├─ default (qty=0, purchasable)
│   ├─ Background: bg-white
│   ├─ Border: border-gray-20 (default), hover:border-gray-30
│   ├─ Interaction: <button> element, click → qty becomes 1
│   └─ Can combine with: featured-badge modifier
│
├─ selected (qty>0, in cart)
│   ├─ Background: bg-white
│   ├─ Border: border-foreground border-2
│   ├─ Shadow: shadow-sm
│   ├─ Interaction: <div> element, stepper visible on right
│   └─ Can combine with: Nothing (featured-badge hides when selected)
│
├─ disabled (not purchasable)
│   ├─ Background: bg-white
│   ├─ Border: border-gray-20
│   ├─ Opacity: opacity-40
│   ├─ Cursor: cursor-not-allowed
│   ├─ Badge: bg-gray-10 text-muted-foreground
│   ├─ Interaction: <div> element, no interaction
│   └─ Triggers: sold_out, ended, scheduled, paused, invite_only, external
│
└─ locked (mixed-types blocked)
    ├─ Visual: Same as Disabled (opacity-40, border-gray-20)
    ├─ Interaction: <div> element, no interaction
    └─ Reason: "Remove other tickets to add this one"
```

```
✨ CARD MODIFIERS (combinable with states)
│
└─ featured-badge
    ├─ Background: bg-primary
    ├─ Text: text-primary-foreground
    ├─ Glow: blur-md opacity-60 (same color as background)
    ├─ Position: absolute -top-2 -right-2 z-10
    ├─ Shows on: default state only
    └─ Hides when: card becomes selected
```

### Single-Select Layout Cards

```
🎫 CARD STATES (single-select layout)
│
├─ unselected (checkbox empty)
│   ├─ Background: bg-white
│   ├─ Border: border-gray-20
│   ├─ Layout: Checkbox | Title + Badges | Price
│   └─ Interaction: Click anywhere → check this, uncheck others
│
├─ selected (checkbox checked)
│   ├─ Background: bg-white
│   ├─ Border: border-foreground border-2
│   ├─ Layout: Same horizontal layout
│   └─ Interaction: Click → uncheck (unless only option left)
│
└─ disabled (not purchasable)
    ├─ Background: bg-white
    ├─ Border: border-gray-20
    ├─ Opacity: opacity-40
    ├─ Layout: Same horizontal layout
    └─ Interaction: No clicks allowed
```

**Note:** single-ticket layout has no cards, so no card states apply.

---

## 4. Quick Decision Tree

```
START: Determine Panel Layout/State
│
├─ All tickets unavailable?
│   ├─ YES → EMPTY STATES
│   │         ├─ Waitlist enabled? → waitlist
│   │         ├─ Cancelled? → cancelled
│   │         ├─ Paused? → event-paused
│   │         └─ default → sold-out
│   │
│   └─ NO → Has purchasable tickets ↓
│
├─ Single ticket + special layout?
│   ├─ YES → single-ticket layout
│   └─ NO ↓
│
├─ All tickets maxPerOrder=1 + single-select?
│   ├─ YES → single-select layout
│   └─ NO ↓
│
└─ default → multi-ticket layout
```

---

## 5. Visual Component Parts

**Elements in All Layouts:**

- Header (title + subtitle text)
- Ticket display area (cards or price section)
- Footer (pricing + CTA button)

**Additional Elements (conditional):**

- Featured badge (on select cards)
- Quantity stepper (on selected cards)
- Dynamic notice (informational messages)
- User info display (when logged in)

**Empty State Elements:**

- Icon
- Title + description text
- Optional CTA button
- Optional user info

---

## 6. Implementation Priority

### P0: Multi-Ticket Layout Polish

- Disabled state: `opacity-40`
- Selected border: `border-2` with `border-foreground`
- User info display (when logged in)

### P1: New Layouts (BUS-13)

- Single-Ticket layout (large price + qty row)
- Single-Select layout (horizontal checkbox cards)
- Dynamic notice (informational messages)

### P2: Empty States (BUS-13)

- Sold Out panel
- Waitlist panel
- Event Paused panel

### P3: Future

- Cancelled panel

---

## 7. State Transition Examples

### Multi-Ticket Card Transitions

| From           | Action              | To               | Visual Change                           |
| -------------- | ------------------- | ---------------- | --------------------------------------- |
| Default        | Click card          | Selected (qty=1) | Border: grey 1px → black 2px, shadow    |
| Featured       | Click card          | Selected         | Badge hides, border+shadow appear       |
| Selected (1)   | Click trash         | Default          | Border: black 2px → grey 1px, no shadow |
| Selected (n>1) | Click minus         | Selected (n-1)   | Qty number bump animation               |
| Selected       | Click plus          | Selected (n+1)   | Qty number bump animation               |
| Default        | Other type selected | Locked           | Opacity → 40%, reason shown             |

### Single-Select Card Transitions

| From       | Action           | To         | Visual Change                   |
| ---------- | ---------------- | ---------- | ------------------------------- |
| Unselected | Click card       | Selected   | Checkbox fills, border → black  |
| Selected   | Click card       | Unselected | Checkbox empties, border → grey |
| Selected   | Click other card | Unselected | Auto-unchecks, other checks     |

---

## 8. Theme & Color Token Reference

> **See:** `THEME-SYSTEM.md` for complete theme documentation

### Theme Tokens

**Brand Scale** (event-specific, auto-generated):

```css
--brand-5 through --brand-100      /* 11-step OKLCH scale */
--brand-opacity-4 through -80      /* Opacity ladder */
```

**Gray Scale** (static, neutral):

```css
--gray-5 through --gray-100        /* 11-step neutral scale */
--black-opacity-4 through -80      /* Black with opacity */
--white-opacity-4 through -80      /* White with opacity */
```

**Semantic Tokens** (auto-contrast, WCAG AA):

```css
--primary / --primary-foreground   /* Primary buttons, auto-picked */
--accent / --accent-foreground     /* Brand accents, auto-picked */
--secondary / --secondary-foreground  /* Gray buttons */
--muted / --muted-foreground       /* Gray subtle */
--destructive / --destructive-foreground  /* Error states */
--foreground / --background        /* Page-level */
--border / --input / --ring        /* Borders, inputs, focus */
```

**Tailwind Utilities** (preferred approach):

```tsx
bg-brand-70                        /* Brand color step 70 */
text-brand-30/80                   /* Brand color step 30 at 80% opacity */
border-gray-20                     /* Gray step 20 border */
bg-brand-opacity-4                 /* 4% brand opacity */
text-foreground                    /* Auto-contrast text */
bg-primary text-primary-foreground /* Auto-contrast button */
```

---

## 9. Terminology Summary

**Clear Distinctions:**

- **Panel Layout** = How purchasable tickets are displayed (multi-ticket, single-ticket, single-select)
- **Panel Empty State** = Full panel replacement when no tickets (sold-out, waitlist, event-paused, cancelled)
- **Card State** = Mutually exclusive states (default, selected, disabled, locked)
- **Card Modifier** = Optional additions to states (featured-badge)

**Why "single-select" not "checkbox"?**

- Describes behavior (single selection) not UI (checkbox component)
- Clarifies radio-like behavior despite using checkboxes visually
- Consistent with "Multi-Ticket" and "Single-Ticket" naming pattern
