# Ticket Panel Design Components & Visual States

> **Document Purpose**: This file defines all visual states and design components for the ticket panel, comparing Luma's reference implementation with DayOf's current approach.

---

## Executive Summary

### Key Architectural Differences

| Aspect                  | Luma                    | DayOf (Current)                            |
| ----------------------- | ----------------------- | ------------------------------------------ |
| **State Management**    | DOM-driven              | Jotai atoms                                |
| **Theme System**        | CSS vars (RGB/opacity)  | OKLCH with CSS relative colors             |
| **Card Interaction**    | Always clickable div    | Hybrid (button when qty=0, div when qty>0) |
| **Selection Indicator** | Checkmark icon (visual) | Border color + shadow                      |
| **Featured Badge**      | Inline pill with dot    | Absolute positioned CSS badge with glow    |
| **Disabled State**      | CSS classes only        | Opacity + cursor + border                  |

---

## Component Hierarchy

```
TicketsPanel (Card container)
├── Header Section (optional)
│   ├── Title (14px muted)
│   └── Subtitle (16px dark)
├── TicketList
│   └── TicketCard (multiple states)
│       ├── FeaturedBadge (conditional)
│       ├── TicketContentLayout
│       │   ├── Title + Badges
│       │   ├── Price + Tooltip
│       │   ├── Description
│       │   ├── Availability Status
│       │   └── Unavailable Reason
│       └── QuantityStepper (conditional)
└── CartFooter (always visible when included)
    ├── Pricing Breakdown
    ├── CTA Button
    └── Footnote (optional)
```

---

## 1. TicketCard States

### State Matrix

| State                        | Purchasable | Selected | Locked | Visual Treatment                                     |
| ---------------------------- | ----------- | -------- | ------ | ---------------------------------------------------- |
| **Default (Available)**      | ✅          | ❌       | ❌     | White bg, subtle border, hover effect                |
| **Selected (In Cart)**       | ✅          | ✅       | ❌     | White bg, **black border**, shadow                   |
| **Disabled (Not Available)** | ❌          | ❌       | ❌     | Opacity 50%, subtle border, no hover                 |
| **Locked (Mixed Types)**     | ✅\*        | ❌       | ✅     | Opacity 50%, subtle border, unavailable reason shown |
| **Featured (Available)**     | ✅          | ❌       | ❌     | Same as Default + FeaturedBadge overlay              |
| **Featured (Selected)**      | ✅          | ✅       | ❌     | Same as Selected (badge hidden)                      |

\*Technically purchasable but blocked by UI logic

---

### 1.1 Default State (Available, qty=0)

**Visual Properties:**

```tsx
// Container
className="rounded-lg transition-all duration-200 bg-white border border-[rgba(0,0,0,0.08)] hover:border-[rgba(0,0,0,0.16)]"

// Interactive wrapper (entire card is button)
<button
  type="button"
  className="w-full text-left p-3 cursor-pointer
    focus-visible:outline-none focus-visible:ring-2
    focus-visible:ring-[var(--theme-accent)] focus-visible:ring-offset-2"
>
```

**Colors:**

- Background: `bg-white` (pure white)
- Border: `rgba(0,0,0,0.08)` → hover `rgba(0,0,0,0.16)` (subtle grey)
- Text (title/price): `--dayof-dark` (neutral, readable black)
- Text (description/labels): `--dayof-muted` (softer grey)
- Status dot: `bg-green-500` (if available)

**Luma Comparison:**

- **Similar**: White background, subtle border, hover state
- **Different**: Luma uses checkmark icon when selected; we use border weight + shadow

---

### 1.2 Selected State (In Cart, qty>0)

**Visual Properties:**

```tsx
// Container (now a div, not button)
className="rounded-lg transition-all duration-200 bg-white border border-black shadow-sm"

// Content wrapper
<div className="p-3">
  <div className="flex items-start gap-2.5">
    {/* Content on left */}
    {/* Stepper on right */}
  </div>
</div>
```

**Colors:**

- Background: `bg-white` (unchanged)
- Border: `border-black` (solid black, 1px)
- Shadow: `shadow-sm` (subtle elevation)
- Text: Same as Default state

**Key Changes from Default:**

1. Card changes from `<button>` to `<div>`
2. Border changes from `rgba(0,0,0,0.08)` → `black`
3. Shadow appears (`shadow-sm`)
4. QuantityStepper appears on right side
5. FeaturedBadge hides (if was featured)

**Luma Comparison:**

- **Similar**: Selection is visually indicated by border/outline change
- **Different**:
  - Luma shows checkmark icon in top-left
  - Luma keeps entire card clickable (toggles off)
  - DayOf changes container semantic from button→div

---

### 1.3 Disabled State (Not Purchasable)

**Visual Properties:**

```tsx
// Container
className="rounded-lg transition-all duration-200 bg-white border border-[rgba(0,0,0,0.08)] opacity-50"

// Content wrapper (always div, never button)
<div className="p-3">
  {/* No stepper, no interaction */}
</div>
```

**Colors:**

- Background: `bg-white` (unchanged)
- Border: `rgba(0,0,0,0.08)` (subtle)
- Opacity: `50%` (entire card)
- Status dot: `bg-[var(--theme-accent-32)]` (muted grey)

**Unavailable Reason Badge:**

```tsx
<div className="mt-2 inline-flex items-center gap-1.5 rounded bg-[var(--theme-accent-08)] px-2 py-1 text-xs text-[var(--dayof-muted)]">
  <Info className="h-3.5 w-3.5" aria-hidden="true" />
  {unavailableReason} {/* e.g., "Sold out" */}
</div>
```

**Triggers:**

- `status === 'sold_out'`
- `status === 'ended'` or sales window expired
- `status === 'scheduled'` and not yet started
- `status === 'invite_only'` without code
- `status === 'paused'`
- `status === 'external'`
- Capacity exhausted (`soldCount >= soldLimit`)

**Luma Comparison:**

- **Similar**: Greyed out appearance, status badge
- **Different**:
  - Luma uses lighter opacity (~40%)
  - Luma shows "Require Approval" pills in yellow
  - DayOf uses themed badge with icon

---

### 1.4 Locked State (Mixed Ticket Types)

**Visual Properties:**
Same as Disabled State, plus:

**Unavailable Reason:**

```
"Remove other tickets to add this one"
```

**Trigger:**

- `event.mixedTicketTypesAllowed === false`
- Another ticket type already in cart
- Current ticket is not in cart

**Logic:**

```ts
const inCart = qty > 0;
const isLocked = !event.mixedTicketTypesAllowed && cart.hasItems && !inCart;
```

**Luma Comparison:**

- **N/A**: Luma doesn't appear to have this constraint in the examples

---

### 1.5 Featured State (qty=0)

**Visual Properties:**
Same as Default State, plus:

**FeaturedBadge Component:**

```tsx
<div className="pointer-events-none absolute -top-2 -right-2 z-10">
  {/* Glow layer (blur effect) */}
  <div
    className="absolute inset-0 blur-md opacity-60"
    style={{ background: "var(--theme-cta)" }}
    aria-hidden="true"
  />
  {/* Badge pill */}
  <div className="relative select-none rounded-full bg-[var(--theme-cta)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
    Best Value
  </div>
</div>
```

**Position:**

- Absolute positioned: `-top-2 -right-2`
- Appears above card content (`z-10`)
- Only visible when `ticket.featured === true` AND `currentQty === 0`

**Luma Comparison:**

- **Different**:
  - Luma uses inline pill with dot indicator (inside card flow)
  - DayOf uses absolute positioned badge with CSS glow
  - Luma's appears next to title; DayOf's floats top-right

**Luma Example (from HTML):**

```html
<!-- Luma approach: inline -->
<div class="pill light variant-color-yellow tiny rounded">
  <div>​</div>
  <!-- Dot -->
  <div class="pill-label">Require Approval</div>
</div>
```

---

## 2. Sub-Components

### 2.1 QuantityStepper

**States:**

1. **qty = 1**: Left button shows trash icon
2. **qty > 1**: Left button shows minus icon
3. **Disabled**: When `!canIncrement` or `!canDecrement`

**Visual Properties:**

```tsx
<div className="inline-flex items-center gap-2">
  {/* Decrement/Remove button */}
  <button
    type="button"
    className="flex items-center justify-center overflow-hidden rounded-[4px] transition-colors disabled:cursor-not-allowed
      p-1.5 bg-[var(--theme-accent-04)] hover:bg-[var(--theme-accent-08)] text-[var(--theme-accent-64)]"
  >
    {showTrashIcon ? <Trash2 /> : <Minus />}
  </button>

  {/* Quantity display */}
  <span className="min-w-9 px-2 text-center font-medium tabular-nums text-[var(--dayof-dark)]">
    {value}
  </span>

  {/* Increment button */}
  <button
    type="button"
    className="flex items-center justify-center rounded-[4px] p-1.5 transition-colors disabled:cursor-not-allowed
      bg-[var(--theme-accent-04)] hover:bg-[var(--theme-accent-08)] text-[var(--theme-accent-64)]"
  >
    <Plus />
  </button>
</div>
```

**Key Features:**

- **Borderless**: Uses subtle background (`--theme-accent-04`) instead of borders
- **No width collapse**: Maintains `min-w-9` to prevent layout shift
- **Entrance animation**: Fades in when first appears
- **Bump animation**: Quantity number scales briefly on change

**Luma Comparison:**

```html
<!-- Luma stepper from examples -->
<div class="count-selector flex-center">
  <div class="count-button button-reset flex-center-center animated">
    <!-- Minus icon SVG -->
  </div>
  <div class="count fw-medium mono-number text-center px-2 animated">1</div>
  <div class="count-button button-reset flex-center-center animated">
    <!-- Plus icon SVG -->
  </div>
</div>
```

**Differences:**
| Aspect | Luma | DayOf |
|--------|------|-------|
| Button style | Transparent + border on hover | Subtle bg (`--theme-accent-04`) |
| Spacing | Tighter (`px-2`) | More generous (`min-w-9 px-2`) |
| Disabled state | Opacity + collapsed width | Opacity + cursor-not-allowed |
| Trash behavior | At qty=1 | At qty=1 |

---

### 2.2 Status Indicators

#### Availability Dot

**States:**

1. **Available (green)**: `bg-green-500`
2. **Unavailable (muted)**: `bg-[var(--theme-accent-32)]`
3. **Limited (orange)**: Used for low inventory warnings

**Implementation:**

```tsx
{
  /* Available */
}
<div className="flex items-center gap-1.5 text-[13px] mt-1 text-[var(--dayof-muted)]">
  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
  <span>{availabilityLabel}</span>
</div>;

{
  /* Low inventory warning (orange) */
}
<div className="flex items-center gap-1.5 text-[13px] mt-1">
  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
  <span className="text-orange-600 dark:text-orange-400 font-medium">
    Only 3 left!
  </span>
</div>;
```

**Luma Comparison:**

- **Similar**: Uses colored dots for status
- **Different**:
  - Luma's dots are SVG-based
  - DayOf uses simple `rounded-full` spans
  - Luma's are slightly smaller (appears to be ~6-8px vs 10px)

#### Unavailable Reason Badge

**Implementation:**

```tsx
<div className="mt-2 inline-flex items-center gap-1.5 rounded bg-[var(--theme-accent-08)] px-2 py-1 text-xs text-[var(--dayof-muted)]">
  <Info className="h-3.5 w-3.5" aria-hidden="true" />
  {unavailableReason}
</div>
```

**Always Visible**: Not hidden behind hover (accessibility consideration)

**Luma Comparison:**

```html
<!-- Luma uses period/availability rows -->
<div class="period flex-center fs-xs text-tinted ticket-info-row">
  <div class="icon"></div>
  <span>Sales ended <span>Sep 8, 11:59 PM PDT</span></span>
</div>
```

**Differences:**

- **Luma**: Uses icon + inline formatted date
- **DayOf**: Uses `Info` icon + plain text explanation
- **Luma**: Separate treatment for different states (available, ended, future)
- **DayOf**: Single component with dynamic text

---

### 2.3 Badges & Pills

#### Helper Text Badge (Inline)

**Triggers:**

- Max per order reached
- Low inventory (1-5 remaining)
- Slots remaining warning (2 left)
- Limited availability (6-20 remaining)
- Min per order requirement

**Implementation:**

```tsx
{
  uiState.helperText && (
    <Badge variant="secondary" className="text-xs">
      {uiState.helperText}
    </Badge>
  );
}
```

**Luma Comparison:**

- **Similar**: Uses inline pills for constraints
- **Different**:
  - Luma shows "Require Approval" in yellow
  - DayOf shows inventory/limit warnings in grey
  - Luma's pills have dot indicators

#### Featured Badge (Overlay)

See section 1.5 above.

---

### 2.4 Typography & Text Hierarchy

#### TicketCard Text Sizes

| Element            | Font Size | Line Height | Color          | Weight       |
| ------------------ | --------- | ----------- | -------------- | ------------ |
| Title              | 16px      | 1           | `--dayof-dark`  | medium (500) |
| Price              | 16px      | 1           | `--dayof-dark`  | medium (500) |
| Description        | 13px      | 1.5         | `--dayof-muted` | normal (400) |
| Availability label | 13px      | 1           | `--dayof-muted` | normal (400) |
| Helper text badge  | 12px      | 1           | (badge colors) | normal (400) |
| Unavailable reason | 12px      | 1           | `--dayof-muted` | normal (400) |

**Luma Comparison:**

```css
/* From Luma CSS vars */
--font-size-md: 1rem; /* 16px */
--font-size-sm: 0.875rem; /* 14px */
--font-size-xs: 0.8125rem; /* 13px */
--font-size-xxs: 0.75rem; /* 12px */

/* Font weights */
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-bold: 600;
```

**Key Differences:**

- DayOf uses `--dayof-dark` for neutral text (more semantic)
- Luma uses `--primary-color` / `--secondary-color` (opacity-based)
- DayOf's 13px for descriptions matches Luma's `fs-xs`

---

### 2.5 Pricing Display

#### TicketCard Price (Inline)

**Implementation:**

```tsx
<div className="flex items-center gap-1 mt-0.5">
  <span className="font-medium text-base text-[var(--dayof-dark)] tabular-nums">
    {TicketPrice({ pricing, currency, locale })}
  </span>
  {/* Tooltip trigger (optional) */}
</div>
```

**With Fee/Tax Breakdown Tooltip:**

```tsx
<Tooltip>
  <TooltipTrigger>
    <Info className="h-3.5 w-3.5 text-[var(--dayof-muted)] hover:text-[var(--dayof-dark)]" />
  </TooltipTrigger>
  <TooltipContent variant="light">
    <div className="space-y-1">
      <div className="flex justify-between gap-4 text-xs">
        <span className="text-[var(--dayof-muted)]">Fees</span>
        <span className="font-medium text-[var(--dayof-dark)]">$5.50</span>
      </div>
    </div>
  </TooltipContent>
</Tooltip>
```

**Luma Comparison:**

- **Similar**: Inline price display, tabular nums
- **Different**:
  - Luma shows "±" symbol for fee tooltips (lux-menu-trigger)
  - DayOf uses Info icon
  - Luma's tooltip appears to use their custom menu system

---

## 3. CartFooter States

### 3.1 Empty State

**Visual:**

```tsx
<button
  type="button"
  disabled
  className="h-11 w-full rounded-lg bg-secondary text-secondary-foreground font-medium opacity-50 cursor-not-allowed"
>
  Select tickets to continue
</button>
```

**Luma Example:**

```html
<button
  class="btn lux-button flex-center medium primary solid variant-color-primary full-width no-icon"
  disabled
>
  <div class="label">Select tickets</div>
</button>
```

---

### 3.2 Loading State

**Visual:**

```tsx
<button
  type="button"
  disabled
  className="h-11 w-full rounded-lg bg-primary text-primary-foreground font-medium"
>
  Calculating...
</button>
```

---

### 3.3 Ready State (With Pricing)

**Implementation:**

```tsx
<div className="space-y-3">
  {/* Pricing breakdown */}
  <div className="space-y-1.5 text-sm" aria-live="polite" aria-atomic="true">
    {/* Subtotal */}
    <div className="flex items-center justify-between">
      <span className="text-[var(--dayof-muted)]">
        Subtotal ({totalQty} {pluralizeTickets(totalQty)})
      </span>
      <span className="font-medium tabular-nums text-[var(--dayof-dark)]">
        {formatMoney(subtotal, currency)}
      </span>
    </div>

    {/* Fees (if non-zero) */}
    {!isZero(fees) && (
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--dayof-muted)]">Service fees</span>
        <span className="font-medium tabular-nums text-[var(--dayof-muted)]">
          +{formatMoney(fees, currency)}
        </span>
      </div>
    )}

    {/* Tax (if non-zero) */}
    {/* ... similar to fees */}

    {/* Separator */}
    <div className="border-t border-[var(--theme-accent-08)]" />

    {/* Total */}
    <div className="flex items-center justify-between">
      <span className="font-semibold text-base text-[var(--dayof-muted)]">
        Total
      </span>
      <span className="font-semibold text-lg tabular-nums text-[var(--dayof-dark)]">
        {formatMoney(total, currency)}
      </span>
    </div>
  </div>

  {/* CTA Button */}
  <button
    type="button"
    className="w-full h-[38px] rounded-lg px-3.5
      bg-[rgb(105,115,125)] hover:bg-[rgb(95,105,115)]
      font-semibold text-base text-white
      disabled:opacity-50 disabled:cursor-not-allowed
      transition-colors duration-200"
  >
    {ctaLabel || `Get ${pluralizeTickets(totalQty)}`}
  </button>

  {/* Footnote (optional) */}
  {footnote && (
    <div className="pt-2 flex items-center justify-center gap-2 text-[13px] text-[var(--dayof-muted)]">
      <svg>{/* Plus icon */}</svg>
      {footnote}
    </div>
  )}
</div>
```

**CTA Button Variants:**

1. **Neutral (default):**

   - Background: `rgb(105,115,125)` (grey)
   - Hover: `rgb(95,105,115)` (darker grey)

2. **Accented:**
   - Background: `var(--theme-cta)`
   - Hover: `var(--theme-cta-hover)`

**Luma Comparison:**

- **Different**: Luma doesn't show pricing breakdown in footer (simpler CTA)
- **Similar**: Both pluralize ticket count in button text

---

### 3.4 Error State

**Implementation:**

```tsx
<div className="space-y-3">
  <div className="text-sm text-destructive">
    We're having trouble calculating totals. Try again in a bit.
  </div>
  {onRetry && (
    <button
      type="button"
      onClick={onRetry}
      className="h-11 w-full rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/90"
    >
      Retry
    </button>
  )}
</div>
```

---

## 4. Color System Comparison

### DayOf Tokens (OKLCH-based)

```css
/* Surfaces (accent-based) */
--theme-accent-04: oklch(from var(--theme-accent) l c h / 0.04);
--theme-accent-08: oklch(from var(--theme-accent) l c h / 0.08);
--theme-accent-32: oklch(from var(--theme-accent) l c h / 0.32);
--theme-accent-48: oklch(from var(--theme-accent) l c h / 0.48);
--theme-accent-64: oklch(from var(--theme-accent) l c h / 0.64);
--theme-accent-80: oklch(from var(--theme-accent) l c h / 0.8);

/* CTA (boosted) */
--theme-cta: oklch(from var(--theme-accent) calc(l * 1.15) calc(c * 1.3) h);
--theme-cta-hover: oklch(
  from var(--theme-accent) calc(l * 1.1) calc(c * 1.3) h
);

/* Neutral text (not accent-based) */
--dayof-dark: rgb(0, 0, 0); /* Primary text */
--dayof-muted: rgb(115, 119, 123); /* Secondary text */
```

**Strategy**: Neutral-first for content, accent for interaction

---

### Luma Tokens (RGB/Opacity-based)

```css
/* Base colors */
--black-base-rgb: 19, 21, 23;
--white-base-rgb: 255, 255, 255;

/* Opacity variants */
--black-opacity-0: rgba(var(--black-base-rgb), 0);
--black-opacity-4: rgba(var(--black-base-rgb), 0.04);
--black-opacity-8: rgba(var(--black-base-rgb), 0.08);
--black-opacity-16: rgba(var(--black-base-rgb), 0.16);
/* ... up to 80 */

--white-opacity-0: rgba(var(--white-base-rgb), 0);
--white-opacity-4: rgba(var(--white-base-rgb), 0.04);
/* ... */

/* Semantic colors */
--primary-color: var(--black);
--secondary-color: var(--gray-70);
--tertiary-color: var(--gray-50);

/* Surfaces */
--primary-bg-color: var(--white);
--secondary-bg-color: var(--gray-10);
--card-bg-color: var(--elevated-primary-bg-color);
```

**Strategy**: Grayscale-first with semantic overlays

---

## 5. Interaction Patterns

### Card Click Behavior

| State               | Interaction            | Result              |
| ------------------- | ---------------------- | ------------------- |
| qty=0, purchasable  | Click anywhere on card | Add to cart (qty→1) |
| qty=0, !purchasable | No interaction         | N/A (card is div)   |
| qty>0               | No card click          | Use stepper buttons |

**Luma Comparison:**

- **Luma**: Entire card stays clickable (toggles selection on/off)
- **DayOf**: Card becomes non-clickable when selected (use stepper to adjust)

---

### Focus Management

**DayOf:**

```tsx
// Card as button (qty=0)
className =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] focus-visible:ring-offset-2";

// Stepper buttons
// (uses default focus ring from Tailwind)
```

**Luma:**

```css
/* From Luma CSS */
--outline-color: -webkit-focus-ring-color;
/* Applied via .focus:outline-hidden .focus:ring-2 pattern */
```

---

## 6. Animation & Motion

### DayOf Animations

1. **Card hover:**

   ```tsx
   className = "transition-all duration-200";
   // Border color changes smoothly
   ```

2. **Stepper entrance:**

   ```tsx
   // Fade in + scale up (via React state)
   className =
     "motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out";
   entered
     ? "motion-safe:scale-100 motion-safe:opacity-100"
     : "motion-safe:scale-95 motion-safe:opacity-0";
   ```

3. **Quantity bump:**
   ```tsx
   // Scale up briefly when value changes
   bump ? "motion-safe:scale-110" : "motion-safe:scale-100";
   ```

### Luma Animations

```css
/* From Luma tokens */
--transition-duration: 0.3s;
--fast-transition-duration: 0.2s;
--transition-fn: cubic-bezier(0.4, 0, 0.2, 1);
--bounce-transition-fn: cubic-bezier(0.54, 1.12, 0.38, 1.11);

/* Applied via .animated class */
```

**Comparison:**

- Both use ~200-300ms for most transitions
- Both respect `prefers-reduced-motion`
- DayOf uses explicit motion-safe prefixes
- Luma uses `.animated` class convention

---

## 7. Accessibility Considerations

### Screen Reader Support

**DayOf:**

```tsx
// Icon-only buttons
<button aria-label="Remove ticket">
  <Trash2 className="h-4 w-4" />
</button>

// Live regions for pricing
<div aria-live="polite" aria-atomic="true">
  {/* Pricing breakdown */}
</div>

// Decorative icons
<Info className="h-3.5 w-3.5" aria-hidden="true" />
```

**Luma:**

```html
<!-- Similar patterns -->
<button aria-label="Increase quantity">
  <svg>...</svg>
</button>
```

---

### Keyboard Navigation

Both implementations:

- ✅ All interactive elements reachable via Tab
- ✅ Enter/Space activate buttons
- ✅ Visible focus indicators
- ✅ Logical tab order

---

## 8. Missing Components from BUS-13

> **Source**: [Linear BUS-13](https://linear.app/dayof/issue/BUS-13) - Ticket Styles specification

### 8.1 Dynamic Notice Component

**Purpose**: Alert/notice banner shown between header and ticket list

**Use Cases:**

- Inventory warnings ("Only X tickets left")
- Sales status ("Sales end in 2 hours")
- Event status ("Event full", "Registration paused")
- Multiple notices can stack

**Proposed Structure:**

```tsx
<div className="p-3 rounded-lg bg-[var(--notice-bg)] border border-[var(--notice-border)] flex items-start gap-3">
  {/* Icon (left) */}
  <div className="shrink-0 mt-0.5">
    <AlertCircle className="h-4 w-4 text-[var(--notice-icon)]" />
  </div>

  {/* Content */}
  <div className="flex-1 min-w-0">
    <div className="font-medium text-sm text-[var(--notice-title)]">
      {title}
    </div>
    {description && (
      <div className="text-xs text-[var(--notice-description)] mt-0.5">
        {description}
      </div>
    )}
  </div>
</div>
```

**Color Variants Needed:**

1. **Info (grey)** - General notices

   - `--notice-bg: var(--theme-accent-04)`
   - `--notice-border: var(--theme-accent-08)`
   - `--notice-icon: var(--theme-accent-64)`

2. **Warning (yellow)** - Action needed

   - `--notice-bg: rgba(234, 179, 8, 0.1)` (yellow-500 at 10%)
   - `--notice-border: rgba(234, 179, 8, 0.2)`
   - `--notice-icon: rgb(161, 98, 7)` (yellow-700)

3. **Error (red)** - Critical issues
   - `--notice-bg: rgba(239, 68, 68, 0.1)` (red-500 at 10%)
   - `--notice-border: rgba(239, 68, 68, 0.2)`
   - `--notice-icon: rgb(185, 28, 28)` (red-700)

**Status**: ❌ Not implemented

---

### 8.2 "Require Approval" Badge

**Visual**: Yellow pill with dot indicator (inline, next to ticket title)

**Implementation:**

```tsx
<Badge variant="warning" size="sm" className="inline-flex items-center gap-1">
  <BadgeDot />
  <span>Require Approval</span>
</Badge>
```

**Needed Badge Variants:**

- `variant="warning"` - Yellow (action needed)
- `variant="info"` - Grey (informational)
- `variant="destructive"` - Red (critical)

**Status**: ⚠️ Partially implemented (Badge exists, but color variants may need adjustment)

---

### 8.3 Variable Pricing Indicator

**Visual**: ± symbol next to price for "name your own price" scenarios

**Implementation:**

```tsx
<div className="flex items-center gap-1">
  <span className="font-medium text-base tabular-nums">{price}</span>
  <span className="text-[var(--dayof-muted)] text-sm">±</span>
</div>
```

**Trigger**: When `ticket.pricing.variable === true`

**Status**: ❌ Not implemented

---

### 8.4 Checkbox Layout Pattern

**Use Case**: Single-select tickets with max 1 per type, no quantity selector

**Layout:**

```tsx
<div className="rounded-lg border p-3 flex items-center gap-3">
  {/* Checkbox (left) */}
  <Checkbox checked={isSelected} />

  {/* Content (center, flex-1) */}
  <div className="flex-1 min-w-0">
    <div className="font-medium text-sm">{ticket.name}</div>
  </div>

  {/* Price (right) */}
  <div className="font-medium text-sm tabular-nums">{price}</div>
</div>
```

**Trigger Logic:**

- `event.allowMultipleTypes === false`
- All tickets have `limits.maxPerOrder === 1`

**Status**: ❌ Not implemented

---

### 8.5 User Info Display

**Visual**: Shows logged-in user above CTA button in footer

**Implementation:**

```tsx
<div className="flex items-center gap-2 px-4 py-2">
  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-orange-400 to-pink-600" />
  <div className="flex-1 min-w-0">
    <span className="font-medium text-sm">{user.name}</span>
    <span className="text-xs text-[var(--dayof-muted)] ml-1">{user.email}</span>
  </div>
</div>
```

**Status**: ❌ Not implemented

---

### 8.6 Sold Out Panel State

**Visual**: Full panel replacement when all tickets sold out

**Implementation:**

```tsx
<Card className="p-6 text-center">
  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
    <AlertCircle className="h-6 w-6 text-muted-foreground" />
  </div>
  <h3 className="font-semibold text-lg mb-1">Sold Out</h3>
  <p className="text-sm text-muted-foreground">
    This event has reached capacity.
  </p>
  {/* Optional: Join Waitlist button */}
</Card>
```

**Status**: ❌ Not implemented

---

### 8.7 Customizable Terminology System

**Requirement**: Support configurable nouns for different event types

**Examples:**

- Concert: "ticket" / "tickets"
- Theater: "seat" / "seats"
- Transportation: "trip" / "trips"
- Workshop: "spot" / "spots"

**Proposed Schema Addition:**

```ts
// event.terminology
{
  singular: "ticket" | "seat" | "trip" | "spot",
  plural: "tickets" | "seats" | "trips" | "spots",
  priceLabel: "Ticket Price" | "Seat Price" | "Trip Price",
  ctaPrefix: "Get" | "Book" | "Reserve"
}
```

**Affected Components:**

- CartFooter CTA: "Get {plural}"
- Subtotal label: "Subtotal (2 {plural})"
- Helper text: "Max 10 per order" → context-aware
- Availability: "X {plural} left"

**Status**: ❌ Not implemented

---

### 8.8 Cursor State Fixes

**Issue**: Disabled tickets currently may show pointer cursor

**Fix Required:**

```tsx
// Ensure disabled cards don't show pointer
className={cn(
  uiState.isPurchasable ? "cursor-pointer" : "cursor-not-allowed"
)}
```

**Status**: ✅ Implemented in current code

---

### 8.9 Panel Layout Variants

**Identified from BUS-13:**

1. **Standard (Current)** - Tickets with qty selectors
2. **Checkbox Mode** - Single select, max 1 each, radio-like behavior
3. **Registration Mode** - RSVP/Request to Join (single CTA, no tickets)
4. **Waitlist Mode** - "Join Waitlist" CTA, no ticket selection
5. **Sold Out Mode** - Notice + optional "Notify Me" CTA
6. **Cancelled Mode** - Event cancelled message, optional notification signup

**Proposed Prop:**

```ts
interface TicketsPanelProps {
  // ... existing props
  mode?:
    | "tickets"
    | "checkbox"
    | "registration"
    | "waitlist"
    | "sold-out"
    | "cancelled";
}
```

**Status**: ❌ Not implemented (only 'tickets' mode exists)

---

## 9. Recommendations & Open Questions

### Visual Alignment Opportunities

1. **Checkmark vs Border for Selection**

   - **Luma**: Uses checkmark icon in top-left when selected
   - **DayOf**: Uses border weight + shadow
   - **Question**: Should we adopt Luma's checkmark pattern?

2. **Stepper Button Style**

   - **Luma**: Transparent with border on hover
   - **DayOf**: Subtle background (--theme-accent-04)
   - **Question**: Which provides better affordance?

3. **Featured Badge Position**

   - **Luma**: Inline pill next to title
   - **DayOf**: Absolute positioned overlay (top-right)
   - **Question**: Is overlay too "flashy" compared to Luma's restraint?

4. **Unavailable State Opacity**

   - **Luma**: ~40% opacity
   - **DayOf**: 50% opacity
   - **Question**: Should we match Luma's lighter treatment?

5. **Status Indicators**
   - **Luma**: SVG-based dots
   - **DayOf**: CSS `rounded-full` spans
   - **Question**: Does SVG provide better control/consistency?

---

### Component Gaps

**Not in Luma examples but in DayOf:**

- ✅ Tooltip for fee/tax breakdown
- ✅ Helper text badges (inline)
- ✅ Low inventory warnings (orange)
- ✅ Pricing breakdown in footer

**In Luma but not in DayOf (from BUS-13):**

- ❌ "Require Approval" workflow/pills (yellow badge with dot)
- ❌ Checkmark selection indicator (top-left icon)
- ❌ User avatar + email display in footer
- ❌ Dynamic Notice component (stacking alerts)
- ❌ Variable pricing ± indicator
- ❌ Checkbox layout mode (single-select pattern)
- ❌ Sold Out / Waitlist / Registration panel modes
- ❌ Customizable terminology system (ticket/seat/trip)

---

### Testing Scenarios

**Visual regression tests needed:**

**Core States (Implemented):**

1. Default ticket (available, qty=0)
2. Selected ticket (in cart, qty=1)
3. Selected ticket (in cart, qty=5)
4. Disabled ticket (sold out)
5. Locked ticket (mixed types constraint)
6. Featured ticket (available)
7. Featured ticket (selected - badge should hide)
8. Low inventory warning (orange dot)
9. Pricing breakdown (all fees shown)
10. Error state (pricing failed)

**New Requirements from BUS-13:** 11. Dynamic notice (info variant) 12. Dynamic notice (warning variant) 13. Dynamic notice (error variant) 14. "Require Approval" badge on ticket 15. Variable pricing indicator (± symbol) 16. Checkbox layout mode (single select) 17. User info display in footer 18. Sold out panel state 19. Waitlist panel mode 20. Multiple notices stacked

---

## 9. File Reference Map

### Components

- `TicketsPanel.tsx` - Container, header, layout
- `TicketList.tsx` - Maps tickets to cards
- `TicketCard.tsx` - **Main state machine** (button/div hybrid)
- `TicketContentLayout` - Pure presentation (inside TicketCard)
- `QuantityStepper.tsx` - +/- controls, trash icon
- `FeaturedBadge.tsx` - Overlay badge with glow
- `CartFooter.tsx` - Pricing + CTA
- `TicketPrice.tsx` - Price formatting + tooltip

### Atoms (State)

- `cart.ts` - Cart items, increment/decrement actions
- `pricing.ts` - Server pricing query (debounced)
- `ticket-ui-states.ts` - **Derived UI states** for all tickets
- `ticket-filters.ts` - Optional filters (not in playground)

### Utilities

- `computeTicketUI.ts` - **Pure business logic** (testable)
- `format.ts` - Money, dates, pluralization

### Styles

- `index.css` - Global tokens (OKLCH system)
- `calculate-theme.ts` - Route-level theme injection

---

## Appendix: Luma HTML Examples (Annotated)

### Example 1: Ticket with Stepper (Selected)

```html
<button
  type="button"
  class="jsx-427f393d8eebd120 btn ticket-type-btn selected multi"
>
  <div class="jsx-427f393d8eebd120 top flex-start">
    <!-- Checkmark icon (selected indicator) -->
    <div class="jsx-427f393d8eebd120 flex-center-center icon animated">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
        <path fill="currentColor" d="..."></path>
      </svg>
    </div>

    <div class="jsx-427f393d8eebd120 flex-1">
      <div class="jsx-427f393d8eebd120 flex-start spread gap-2">
        <!-- Title + Price -->
        <div class="jsx-427f393d8eebd120 flex-start min-width-0 flex-column">
          <div class="jsx-427f393d8eebd120 name flex-center flex-wrap">
            <span>Pink</span>
          </div>
          <div class="jsx-427f393d8eebd120">
            <span>$20.00</span>
          </div>
        </div>

        <!-- Stepper -->
        <div class="jsx-b81a950127e7f0cc count-selector flex-center">
          <div
            type="button"
            class="jsx-b81a950127e7f0cc count-button button-reset flex-center-center animated"
          >
            <!-- Minus icon -->
          </div>
          <div
            class="jsx-b81a950127e7f0cc count fw-medium mono-number text-center px-2 animated"
          >
            1
          </div>
          <div
            type="button"
            class="jsx-b81a950127e7f0cc count-button button-reset flex-center-center animated"
          >
            <!-- Plus icon -->
          </div>
        </div>
      </div>

      <!-- Description -->
      <div
        class="jsx-427f393d8eebd120 fs-xs text-tinted description break-word"
      >
        Thank you for supporting the cause!
      </div>
    </div>
  </div>
</button>
```

**Key observations:**

- ✅ Entire card is `<button>` (even when selected)
- ✅ Checkmark icon visible when `.selected`
- ✅ Stepper is inside the button (not separate)
- ✅ Description below title/price

---

### Example 2: Disabled Ticket (Sales Ended)

```html
<button type="button" disabled class="jsx-427f393d8eebd120 btn ticket-type-btn">
  <!-- ... title/price ... -->

  <!-- Period/status indicator -->
  <div
    class="jsx-262dc6f54ab6950f period flex-center fs-xs text-tinted ticket-info-row"
  >
    <div class="jsx-262dc6f54ab6950f icon"></div>
    <span>Sales ended <span title="...">Sep 8, 11:59 PM PDT</span></span>
  </div>
</button>
```

**Key observations:**

- ✅ Uses `<button disabled>` (not opacity on container)
- ✅ Shows formatted end date
- ✅ Icon placeholder (empty div with class)

---

## Summary Table: Luma vs DayOf

| Feature                 | Luma                | DayOf                 | Alignment    |
| ----------------------- | ------------------- | --------------------- | ------------ |
| **Selection Indicator** | Checkmark icon      | Border + shadow       | ⚠️ Different |
| **Card Interaction**    | Always button       | Button→Div transition | ⚠️ Different |
| **Disabled Style**      | Button disabled     | Opacity + cursor      | ✅ Similar   |
| **Stepper Style**       | Transparent buttons | Subtle bg             | ⚠️ Different |
| **Featured Badge**      | Inline pill         | Absolute overlay      | ⚠️ Different |
| **Status Dots**         | SVG                 | CSS rounded           | ⚠️ Different |
| **Color System**        | RGB + opacity       | OKLCH + relative      | ⚠️ Different |
| **Pricing Tooltip**     | ± symbol            | Info icon             | ⚠️ Different |
| **Footer Breakdown**    | Simple CTA          | Full breakdown        | ⚠️ Different |

**Legend:**

- ✅ Well aligned
- ⚠️ Different approach (review needed)
- ❌ Missing feature

---

---

## 10. BUS-13 Requirements Checklist

### Layout Patterns Specified

| Pattern                             | Description                                                    | Status             | Notes                            |
| ----------------------------------- | -------------------------------------------------------------- | ------------------ | -------------------------------- |
| **Single ticket + qty selector**    | Price in "Dynamic Notice", divider, qty selector right-aligned | ⚠️ Partial         | Dynamic Notice not implemented   |
| **Multi-type, exclusive selection** | Title/price left, qty right, one type at a time                | ✅ Implemented     | Locking logic working            |
| **Multi-type, multi-select**        | Title/price left, qty right, multiple types allowed            | ✅ Implemented     | Default ticket selection working |
| **Checkbox mode**                   | Checkbox left, title center, price right, max 1 each           | ❌ Not implemented | New layout pattern needed        |

### Component Variations Needed

| Component      | Variant                           | Status | Image Reference              |
| -------------- | --------------------------------- | ------ | ---------------------------- |
| Dynamic Notice | Info (grey)                       | ❌     | ss-004097.png, ss-004103.png |
| Dynamic Notice | Warning (yellow)                  | ❌     | (pending)                    |
| Dynamic Notice | Multiple stacked                  | ❌     | ss-004103.png                |
| Badge          | "Require Approval" (yellow + dot) | ⚠️     | ss-004099.png, ss-004101.png |
| Badge          | Color variants (red/yellow/grey)  | ⚠️     | ss-004099.png                |
| Price Display  | Variable pricing (± symbol)       | ❌     | ss-004093.png                |
| Header         | Right-aligned notice text         | ❌     | ss-004095.png                |
| Footer         | User info display                 | ❌     | ss-004094.png                |

### Panel Modes Needed

| Mode         | Description             | CTA Button                 | Status |
| ------------ | ----------------------- | -------------------------- | ------ |
| Standard     | Current implementation  | "Get Ticket(s)"            | ✅     |
| Sold Out     | All tickets unavailable | Optional "Notify Me"       | ❌     |
| Waitlist     | Event full              | "Join Waitlist"            | ❌     |
| Registration | RSVP/Request only       | "Request to Join" / "RSVP" | ❌     |
| Cancelled    | Event cancelled         | Optional "Notify Me"       | ❌     |

### Terminology Configuration Needed

| Context   | Singular | Plural  | Price Label  | CTA             |
| --------- | -------- | ------- | ------------ | --------------- |
| Default   | ticket   | tickets | Ticket Price | Get ticket(s)   |
| Theater   | seat     | seats   | Seat Price   | Reserve seat(s) |
| Transport | trip     | trips   | Trip Price   | Book trip(s)    |
| Workshop  | spot     | spots   | Spot Price   | Reserve spot(s) |

**Implementation Approach:**

```ts
// Add to eventConfigAtom or new terminologyAtom
const terminology = {
  singular: event.terminology?.singular ?? "ticket",
  plural: event.terminology?.plural ?? "tickets",
  // ...
};

// Use in components
`Get ${pluralize(count, terminology.singular, terminology.plural)}`;
```

### Visual Details Requiring Screenshots

**Would be helpful to see:**

1. ✅ **ss-004109.png** - Single ticket with qty selector layout
2. ✅ **ss-004105.png** - Multiple tickets initial state
3. ✅ **ss-004106.png** - All tickets removed (empty state)
4. ✅ **ss-004107.png** - Multiple tickets selected
5. ✅ **ss-004104.png** - Checkbox layout pattern
6. ✅ **ss-004092.png** - Default ticket selection when others sold out
7. ✅ **ss-004108.png** - Last ticket auto-selected state
8. ✅ **ss-004093.png** - Variable pricing ± indicator
9. ✅ **ss-004094.png** - User info in footer
10. ✅ **ss-004095.png** - Header with right-aligned notice
11. ✅ **ss-004097.png** - Dynamic Notice styling (first variant)
12. ✅ **ss-004103.png** - Dynamic Notice (second variant / stacked)
13. ✅ **ss-004098.png** - Message between title and tickets
14. ✅ **ss-004099.png** - "Require Approval" badge (first example)
15. ✅ **ss-004101.png** - "Require Approval" badge (second example)
16. ✅ **ss-004102.png** - Sold Out panel state
17. ✅ **ss-004110.png** - Waitlist panel
18. ✅ **ss-004111.png** - Event paused / Notify Me variant
19. ✅ **ss-004112.png** - Registration closed / Event cancelled

**Note**: Screenshots provided - see detailed visual analysis in Section 11.

---

## 11. Visual Analysis from BUS-13 Screenshots

### Screenshot 1: Single Ticket + Qty Selector Layout (ss-004109)

**Key Observations:**

1. **Layout Structure:**

   ```
   ┌─ Get Tickets (header) ─────────────────────┐
   │                                             │
   │ Ticket Price                                │
   │ $65.00  Per ticket                          │
   │ ─────────────────────────────────────────── │ (divider)
   │ #  Tickets                    [-] [1] [+]   │
   │                                             │
   │ 👤 Jon Page  jon@jonpage.io                 │
   │ ┌─────────────────────────────────────────┐ │
   │ │          Get Ticket                     │ │
   │ └─────────────────────────────────────────┘ │
   └─────────────────────────────────────────────┘
   ```

2. **Ticket Price Display:**

   - Large price: ~24px, bold
   - "Per ticket" label: ~13px, muted grey, right-aligned to price
   - Not inside ticket card - in its own section above divider

3. **Quantity Row:**

   - "#" icon (hash/number symbol) - grey, ~16px
   - "Tickets" label - ~16px, medium weight
   - Stepper right-aligned (same as current implementation)

4. **User Info:**
   - Avatar: ~24px circle, gradient background (blue tones)
   - Name: ~14px, medium weight, black
   - Email: ~13px, regular weight, grey, margin-left: ~4px

**Implementation Needed:**

```tsx
{
  /* Price Section (above tickets) */
}
<div className="px-4 pb-3">
  <div className="text-xs text-[var(--dayof-muted)] mb-1">Ticket Price</div>
  <div className="flex items-baseline gap-2">
    <span className="text-2xl font-semibold text-[var(--dayof-dark)] tabular-nums">
      $65.00
    </span>
    <span className="text-sm text-[var(--dayof-muted)]">Per ticket</span>
  </div>
</div>;

{
  /* Divider */
}
<div className="border-t border-[var(--theme-accent-08)]" />;

{
  /* Quantity Row */
}
<div className="px-4 py-3 flex items-center justify-between">
  <div className="flex items-center gap-2">
    <Hash className="h-4 w-4 text-[var(--dayof-muted)]" />
    <span className="font-medium text-base text-[var(--dayof-dark)]">
      Tickets
    </span>
  </div>
  <QuantityStepper ticketId={singleTicketId} />
</div>;
```

---

### Screenshot 2-4: Multi-Type Selection States (ss-004105, 004106, 004107)

**Key Observations:**

1. **Subtitle Below Header:**

   ```tsx
   <p className="text-base text-[var(--dayof-dark)] mt-1">
     Welcome! Please choose your desired ticket type:
   </p>
   ```

   - Font: 16px (base), regular weight
   - Color: Dark (not muted)
   - Currently implemented ✅

2. **Selected Ticket Border:**

   - Border: Solid black, appears ~2px thick (heavier than unselected)
   - Inner padding consistent
   - Shadow visible

3. **Stepper When Selected:**

   - Appears inline on same row as title/price
   - Right-aligned
   - Shows immediately when qty > 0

4. **Variable Pricing (±):**

   - Symbol: "±" character
   - Position: Immediately after price
   - Size: Same as price (~16px)
   - Color: Muted grey

   ```tsx
   <span className="font-medium text-base">$40.00</span>
   <span className="text-base text-[var(--dayof-muted)]">±</span>
   ```

5. **Footnote Styling:**
   - Icon: "±" symbol (same style as pricing indicator)
   - Text: ~13px, muted grey
   - Centered below CTA
   - Currently implemented with different icon ✅

---

### Screenshot 5: Checkbox Mode (ss-004104)

**Key Visual Details:**

1. **Checkmark Icon:**

   - Position: Left edge, ~16px from left padding
   - Size: ~16px circle
   - Style: Filled black circle with white checkmark when selected
   - Empty circle outline when unselected (appears ~1px stroke)

2. **Card Layout (Horizontal):**

   ```
   ┌─────────────────────────────────────────────┐
   │ ✓  General Admission      [Req Approval]  $39.99 │
   │    Note: Includes 3% credit card fee.      │
   └─────────────────────────────────────────────┘
   ```

3. **Selected State:**

   - Checkmark: Filled black with white check icon
   - Border: Black, ~2px (same as qty selector mode)
   - Background: White

4. **Disabled Tickets:**
   - Entire card opacity: ~40% (lighter than our 50%)
   - Text hierarchy preserved but all dimmed uniformly
   - Cursor: not-allowed (confirmed in issue description)

**Implementation:**

```tsx
<div
  className={cn(
    "rounded-lg border p-3 flex items-center gap-3 transition-all",
    isSelected && "border-black border-2 shadow-sm",
    !isSelected && "border-[rgba(0,0,0,0.08)]",
    !isPurchasable && "opacity-40 cursor-not-allowed"
  )}
>
  {/* Checkbox */}
  <Checkbox
    checked={isSelected}
    disabled={!isPurchasable}
    className="shrink-0"
  />

  {/* Content */}
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2 flex-wrap">
      <span className="font-medium text-sm text-[var(--dayof-dark)]">
        {ticket.name}
      </span>
      {requiresApproval && (
        <Badge variant="warning" size="sm">
          Require Approval
        </Badge>
      )}
    </div>
    {note && (
      <div className="text-xs text-[var(--dayof-muted)] mt-0.5">{note}</div>
    )}
  </div>

  {/* Price (right-aligned) */}
  <div className="shrink-0 font-medium text-sm tabular-nums">{price}</div>
</div>
```

---

### Screenshot 6: "Require Approval" Badge Details (ss-004099, 004101)

**Visual Analysis:**

1. **Badge Styling:**

   - Background: `rgba(234, 179, 8, 0.15)` (yellow-500 at ~15% opacity)
   - Text: `rgb(161, 98, 7)` (yellow-700, darker for contrast)
   - Border: None visible (or matches background)
   - Padding: ~4px horizontal, ~2px vertical
   - Border radius: ~4px (small pill)
   - Font: ~11px, medium weight

2. **With Dot Indicator:**

   - Some badges show dot, some don't
   - Dot: ~4px circle, same color as text
   - Gap: ~4px between dot and text

3. **Badge Variants Observed:**
   - "Require Approval" - Yellow/orange
   - "4 Left" - Grey/muted (circled in screenshot)
   - "Sold Out" - Grey (disabled state)

**Exact Implementation:**

```tsx
{
  /* Warning variant (Require Approval) */
}
<Badge
  variant="warning"
  appearance="light"
  size="sm"
  className="inline-flex items-center gap-1"
>
  <BadgeDot className="bg-yellow-700" />
  <span>Require Approval</span>
</Badge>;

{
  /* Info variant (inventory count) */
}
<Badge
  variant="secondary"
  appearance="light"
  size="sm"
  className="inline-flex items-center gap-1"
>
  <span>4 Left</span>
</Badge>;
```

**Badge Component Updates Needed:**

```tsx
// In vendor/reui/badge.tsx variants
{
  variant: 'warning',
  appearance: 'light',
  className: 'bg-yellow-50 text-yellow-700 border-yellow-100'
}
```

---

### Screenshot 7: Checkmark Selection Indicator (ss-004108)

**Key Observations:**

1. **Checkmark Position:**

   - Left edge of card
   - ~20px from left edge
   - Vertically centered with title row

2. **Checkmark Style:**

   - Filled circle: Black background
   - Icon: White checkmark (Luma's custom SVG)
   - Size: ~16px diameter

3. **Selected Card:**

   - Border: Black, appears 2px
   - Checkmark visible
   - Same white background

4. **Unselected Card:**

   - No checkmark visible
   - Light grey border
   - Hover shows border darkening

5. **Auto-Selected Behavior:**
   - When only 1 ticket available (others sold out/scheduled)
   - That ticket shows checkmark + cannot be deselected
   - CTA enabled ("Request to Join")

**Implementation for Checkmark Pattern:**

```tsx
{
  /* Selection indicator (left) */
}
{
  isSelected && (
    <div className="absolute top-3 left-3 flex items-center justify-center w-4 h-4 rounded-full bg-black">
      <Check className="h-3 w-3 text-white" />
    </div>
  );
}
```

---

### Screenshot 8: Dynamic Notice Stacking (ss-004103)

**Observations:**

1. **Multiple Notices:**

   - Stack vertically with `space-y-2` or `gap-2`
   - Each notice has same styling
   - Different icons for different types

2. **Icons Observed:**

   - Clock icon - Time/urgency ("4 Spots Remaining")
   - User with check icon - Approval ("Approval Required")

3. **Background:**
   - Consistent light grey: `rgb(247,248,249)`
   - Rounded corners: ~8px

---

### Screenshot 9: Sold Out Panel State (ss-004102)

**Visual Details:**

1. **Layout:**

   ```
   ┌─ Registration ──────────────────────┐
   │                                     │
   │  🔲 Sold Out                        │
   │  This event is sold out and no      │
   │  longer taking registrations.       │
   │                                     │
   └─────────────────────────────────────┘
   ```

2. **Icon:**

   - Square with rounded corners (not circle)
   - Grey background
   - Size: ~40px

3. **Text:**
   - Title: ~18px, semibold, black
   - Description: ~14px, regular, grey
   - Centered alignment

**Implementation:**

```tsx
<Card className="p-6 text-center">
  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[rgba(0,0,0,0.08)] mb-3">
    <Square className="h-5 w-5 text-[var(--dayof-dark)]" />
  </div>
  <h3 className="font-semibold text-lg text-[var(--dayof-dark)] mb-1">
    Sold Out
  </h3>
  <p className="text-sm text-[var(--dayof-muted)]">
    This event is sold out and no longer taking registrations.
  </p>
</Card>
```

---

### Screenshot 10: Event Full / Waitlist (ss-004110)

**Visual Details:**

1. **Icon:**

   - Same square style as Sold Out
   - Appears to be inbox/tray icon
   - Grey background

2. **Title:** "Event Full"

3. **Subtitle:** "If you'd like, you can join the waitlist."

4. **Description:**
   "Please click on the button below to join the waitlist. You will be notified if additional spots become available."

5. **CTA:** "Join Waitlist" (full width, dark)

**Implementation:**

```tsx
<Card className="p-6">
  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[rgba(0,0,0,0.08)] mb-3">
    <Inbox className="h-5 w-5 text-[var(--dayof-dark)]" />
  </div>

  <h3 className="font-semibold text-lg text-[var(--dayof-dark)] mb-1">
    Event Full
  </h3>
  <p className="text-sm text-[var(--dayof-muted)] mb-3">
    If you'd like, you can join the waitlist.
  </p>
  <p className="text-sm text-[var(--dayof-muted)] mb-4">
    Please click on the button below to join the waitlist. You will be notified
    if additional spots become available.
  </p>

  {/* User info */}
  <UserInfo user={user} />

  {/* CTA */}
  <button className="w-full h-11 rounded-lg bg-[rgb(105,115,125)] text-white font-semibold">
    Join Waitlist
  </button>
</Card>
```

---

### Screenshot 11: "Notify Me" Variant (ss-004111)

**Key Difference:**

- Message: "Welcome! No ticket is on sale at the moment. Please check back later."
- Shows disabled ticket list (all greyed)
- CTA: "Register" (appears disabled/muted)
- Optional: Could add "Notify Me" secondary button

---

### Screenshot 12: Registration Closed (ss-004112)

**Visual:**

- Icon: Circle with minus/prohibition symbol
- Title: "Registration Closed"
- Description: "This event is not currently taking registrations. You may contact the host or subscribe to receive updates."
- No CTA button (or optional "Notify Me" button)

---

### Screenshot Analysis: Single Ticket Mode

**Critical Finding:** The single ticket layout is VERY different from multi-ticket mode.

**Single Ticket Mode Structure:**

```tsx
<Card>
  <Header>Get Tickets</Header>

  {/* Price section (not a card) */}
  <div className="px-4 pb-3">
    <div className="text-xs text-[var(--dayof-muted)]">Ticket Price</div>
    <div className="flex items-baseline gap-2 mt-1">
      <span className="text-2xl font-semibold">$65.00</span>
      <span className="text-sm text-[var(--dayof-muted)]">Per ticket</span>
    </div>
  </div>

  <Divider />

  {/* Qty row (not a card) */}
  <div className="px-4 py-3 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Hash className="h-4 w-4" />
      <span className="font-medium">Tickets</span>
    </div>
    <QuantityStepper />
  </div>

  <UserInfo />

  <div className="p-4">
    <Button>Get Ticket</Button>
  </div>
</Card>
```

**Multi-Ticket Mode Structure (Current):**

```tsx
<Card>
  <Header>Get Tickets</Header>
  <Subtitle>Welcome! Please choose...</Subtitle>

  <TicketList>
    <TicketCard /> {/* Price inside card */}
    <TicketCard />
  </TicketList>

  <CartFooter />
</Card>
```

**Trigger Logic:**

```ts
const isSingleTicketMode =
  tickets.length === 1 && tickets[0].visibility === "public";
```

---

### Badge Color Specifications (from Screenshots)

**"Require Approval" (Yellow/Orange):**

- Background: Very light yellow, ~`rgba(234, 179, 8, 0.12)`
- Text: Dark yellow/brown, ~`rgb(146, 107, 24)` (yellow-800)
- Border: None or imperceptible
- Font: ~11px, medium weight (500)
- Padding: ~3px horizontal, ~1.5px vertical
- Border radius: ~3px

**"4 Left" (Grey - circled):**

- Background: Light grey, ~`rgba(0, 0, 0, 0.06)`
- Text: Medium grey, ~`rgb(115, 119, 123)` (matches --dayof-muted)
- Style: More subtle than warning badges

**"Sold Out" (Grey - disabled context):**

- Same styling as "4 Left" but within disabled card
- Inherits opacity from parent card

---

### Checkmark Icon (from ss-004108)

**SVG Path:**

```tsx
<svg className="h-3 w-3 text-white" viewBox="0 0 16 16" fill="currentColor">
  <path
    fillRule="evenodd"
    d="M7.467.017a8.03 8.03 0 0 0-5.859 3.176C.799 4.26.296 5.477.073 6.906c-.082.523-.082 1.665 0 2.188.342 2.194 1.403 3.995 3.122 5.299 1.062.806 2.286 1.312 3.711 1.534.523.082 1.665.082 2.188 0 1.944-.303 3.596-1.179 4.836-2.565 1.1-1.229 1.735-2.587 1.997-4.268.082-.523.082-1.665 0-2.188-.222-1.425-.728-2.649-1.534-3.711A8 8 0 0 0 9 .066 13 13 0 0 0 7.467.017m3.717 4.505a1.14 1.14 0 0 0-.54.315c-.073.074-.945 1.098-1.94 2.274a128 128 0 0 1-1.827 2.14c-.012 0-.374-.368-.803-.816-1.144-1.196-1.19-1.234-1.558-1.299a1.2 1.2 0 0 0-.67.091 1.11 1.11 0 0 0-.5 1.435c.07.157.209.31 1.655 1.814.66.686 1.262 1.29 1.339 1.34.146.1.416.184.589.184.174 0 .434-.083.595-.19.117-.077.684-.729 2.478-2.85 1.562-1.846 2.354-2.802 2.41-2.916.077-.15.088-.2.089-.43 0-.346-.064-.524-.271-.748a1.12 1.12 0 0 0-1.046-.344"
  />
</svg>
```

---

### User Info Component (from Screenshots)

**Visual Specs:**

1. **Avatar:**

   - Size: 24px (h-6 w-6)
   - Border radius: Full circle
   - Background: Gradient or default avatar pattern
   - Observed gradient: Blue/purple tones

2. **Text Layout:**

   - Horizontal flex
   - Name: 14px, medium weight (500), black
   - Email: 13px, regular weight (400), grey, separated by space

3. **Container:**
   - Padding: ~8px (py-2)
   - Background: None (transparent)
   - Position: Above CTA button in footer

**Implementation:**

```tsx
<div className="flex items-center gap-2 py-2">
  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
  <div className="flex items-baseline gap-1 min-w-0">
    <span className="font-medium text-sm text-[var(--dayof-dark)]">
      {user.name}
    </span>
    <span className="text-xs text-[var(--dayof-muted)]">{user.email}</span>
  </div>
</div>
```

---

### Disabled State Opacity Correction

**From Screenshots:**

- Disabled tickets: ~40% opacity (not 50%)
- Entire card gets opacity treatment
- Text remains black/grey but dimmed by card opacity
- Border remains subtle grey

**Update Required:**

```tsx
!uiState.isPurchasable && "opacity-40 cursor-not-allowed";
// Change from: opacity-50
```

---

---

## 12. Implementation Priorities (Based on Screenshot Analysis)

### P0 - Critical Visual Fixes (Current Mode)

1. **Disabled State Opacity**

   - Change: `opacity-50` → `opacity-40`
   - Files: `TicketCard.tsx`
   - Impact: Better matches Luma's lighter disabled treatment

2. **Selected Border Weight**

   - Confirm: Black border appears 2px in screenshots
   - Current: `border-black` (1px)
   - Consider: `border-black border-2`

3. **User Info in Footer**

   - Add: UserInfo component above CTA
   - Conditional: Only when user is logged in
   - Files: `CartFooter.tsx`, new `UserInfo.tsx`

4. **Variable Pricing Indicator**
   - Add: `±` symbol after price
   - Trigger: `ticket.pricing.variable === true`
   - Files: `TicketPrice.tsx`

---

### P1 - New Layout Modes (High Priority)

1. **Single Ticket Mode**

   - Completely different layout (see Screenshot 1 analysis)
   - Price displayed above divider (not in card)
   - Qty row with # icon + "Tickets" label
   - Files: New `SingleTicketLayout.tsx` or conditional in `TicketsPanel.tsx`
   - Trigger: `tickets.length === 1`

2. **Checkbox Mode**

   - Horizontal layout: Checkbox → Title/Badges → Price
   - No qty selector
   - Radio-like behavior (single select)
   - Files: New `CheckboxTicketCard.tsx`
   - Trigger: All tickets have `maxPerOrder === 1`

3. **Dynamic Notice Component**
   - Reusable alert banner
   - Icon variants: Clock, UserCheck, Alert, etc.
   - Stacking support
   - Files: New `DynamicNotice.tsx`
   - Position: Between header and ticket list

---

### P2 - Panel State Modes (Medium Priority)

1. **Sold Out State**

   - Full panel replacement
   - Icon + title + description
   - Optional: "Join Waitlist" button variant
   - Files: New `SoldOutPanel.tsx`

2. **Waitlist Mode**

   - Similar to Sold Out but with CTA
   - "Join Waitlist" button
   - User info display
   - Files: Extend `SoldOutPanel.tsx` or new `WaitlistPanel.tsx`

3. **Event Paused / No Sales Mode**
   - Message with disabled ticket list shown
   - Optional "Notify Me" CTA
   - Files: Conditional in `TicketsPanel.tsx`

---

### P3 - Enhanced Features (Future)

1. **Customizable Terminology**

   - Schema: `event.terminology` object
   - Replace: "ticket" → "seat" / "trip" / "spot"
   - Files: Update all display strings in components
   - Utility: New `getTerminology()` helper

2. **"Require Approval" Badge Improvements**

   - Add dot indicator option
   - Ensure yellow variant works correctly
   - Files: `badge.tsx` (check warning variant)

3. **Header Right-Aligned Notice**
   - Optional notice text in header (right side)
   - Files: `TicketsPanel.tsx` header section

---

## 13. Specific CSS Value Corrections

### From Screenshot Analysis

| Element                 | Current              | Should Be                     | Source            |
| ----------------------- | -------------------- | ----------------------------- | ----------------- |
| Disabled card opacity   | `opacity-50`         | `opacity-40`                  | ss-004104, 004108 |
| Selected border         | `border-black` (1px) | `border-black border-2` (2px) | ss-004107, 004108 |
| Price (single mode)     | Inside card          | Separate section, 24px        | ss-004109         |
| Hash icon size          | N/A                  | 16px (h-4 w-4)                | ss-004109         |
| User avatar size        | N/A                  | 24px (h-6 w-6)                | ss-004109, others |
| Notice background       | N/A                  | `rgb(247,248,249)`            | ss-004097, 004103 |
| Notice icon background  | N/A                  | `rgba(0,0,0,0.08)` circle     | ss-004097, 004103 |
| "Require Approval" bg   | N/A                  | `rgba(234,179,8,0.12)`        | ss-004099, 004101 |
| "Require Approval" text | N/A                  | `rgb(146,107,24)`             | ss-004099, 004101 |

---

## 14. New Component Specifications

### DynamicNotice Component

**Props:**

```tsx
interface DynamicNoticeProps {
  variant?: "info" | "warning" | "error";
  icon?: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}
```

**Implementation:**

```tsx
export function DynamicNotice({
  variant = "info",
  icon,
  title,
  description,
  className,
}: DynamicNoticeProps) {
  return (
    <div
      className={cn(
        "p-3 rounded-lg flex items-start gap-3",
        "bg-[rgb(247,248,249)]", // Luma's --gray-10
        className
      )}
    >
      {/* Icon with circle background */}
      <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-[rgba(0,0,0,0.08)]">
        {icon || <AlertCircle className="h-4 w-4 text-[var(--dayof-dark)]" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-[var(--dayof-dark)]">
          {title}
        </div>
        {description && (
          <div className="text-sm text-[var(--dayof-muted)] mt-0.5">
            {description}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### UserInfo Component

**Props:**

```tsx
interface UserInfoProps {
  user: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
  className?: string;
}
```

**Implementation:**

```tsx
export function UserInfo({ user, className }: UserInfoProps) {
  return (
    <div className={cn("flex items-center gap-2 py-2", className)}>
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.name}
          className="h-6 w-6 rounded-full object-cover"
        />
      ) : (
        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
      )}
      <div className="flex items-baseline gap-1 min-w-0">
        <span className="font-medium text-sm text-[var(--dayof-dark)] truncate">
          {user.name}
        </span>
        <span className="text-xs text-[var(--dayof-muted)] truncate">
          {user.email}
        </span>
      </div>
    </div>
  );
}
```

---

### SingleTicketLayout Component

**Conditional Wrapper:**

```tsx
export function TicketsPanel(props: TicketsPanelProps) {
  const isSingleMode = tickets.length === 1;

  return (
    <TooltipProvider>
      <ClientOnly fallback={<TicketsPanelSkeleton />}>
        {isSingleMode ? (
          <SingleTicketMode {...props} />
        ) : (
          <MultiTicketMode {...props} />
        )}
      </ClientOnly>
    </TooltipProvider>
  );
}
```

**Single Mode Structure:**

```tsx
function SingleTicketMode({ event, ticket }: Props) {
  const qty = useAtomValue(/* cart qty for this ticket */);

  return (
    <Card>
      {/* Header */}
      <div className="px-4 pt-2 pb-3">
        <h2 className="text-sm font-medium text-[var(--dayof-muted)]">
          Get Tickets
        </h2>
      </div>

      {/* Price Section */}
      <div className="px-4 pb-3">
        <div className="text-xs text-[var(--dayof-muted)] mb-1">
          Ticket Price
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold tabular-nums">
            {formatPrice(ticket.pricing.ticket)}
          </span>
          <span className="text-sm text-[var(--dayof-muted)]">
            Per {terminology.singular}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--theme-accent-08)]" />

      {/* Quantity Row */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-[var(--dayof-muted)]" />
          <span className="font-medium text-base">{terminology.plural}</span>
        </div>
        <QuantityStepper ticketId={ticket.id} />
      </div>

      {/* User Info (if logged in) */}
      {user && (
        <div className="px-4">
          <UserInfo user={user} />
        </div>
      )}

      {/* CTA */}
      <div className="p-4">
        <button className="w-full h-11 rounded-lg bg-[rgb(105,115,125)] text-white font-semibold">
          Get {terminology.singular}
        </button>
      </div>
    </Card>
  );
}
```

---

## 15. Decision Matrix

Use this to track decisions on visual alignment:

| Feature                    | Luma Approach   | DayOf Current      | Decision         | Priority |
| -------------------------- | --------------- | ------------------ | ---------------- | -------- |
| **Disabled opacity**       | 40%             | 50%                | ✅ Change to 40% | P0       |
| **Selected border**        | 2px black       | 1px black          | ⚠️ Review        | P0       |
| **Selection indicator**    | Checkmark icon  | Border/shadow      | ⏸️ Keep current  | P2       |
| **Stepper style**          | Transparent     | Subtle bg          | ⏸️ Keep current  | P2       |
| **Featured badge**         | Inline pill     | Overlay            | ⏸️ Keep current  | P2       |
| **Single ticket mode**     | Separate layout | N/A                | ✅ Implement     | P1       |
| **Checkbox mode**          | Yes             | No                 | ✅ Implement     | P1       |
| **Dynamic Notice**         | Yes             | No                 | ✅ Implement     | P1       |
| **User info display**      | Yes             | No                 | ✅ Implement     | P0       |
| **Variable pricing ±**     | Yes             | No                 | ✅ Implement     | P0       |
| **Require Approval badge** | Yellow + dot    | Grey               | ✅ Fix variant   | P1       |
| **Terminology system**     | Contextual      | Hardcoded "ticket" | ✅ Implement     | P1       |

**Legend:**

- ✅ Implement / change
- ⏸️ Keep current approach
- ⚠️ Needs team review

---

## Next Steps

1. **Immediate (P0 fixes):**

   - Update opacity: 50% → 40% for disabled state
   - Add UserInfo component to CartFooter
   - Implement ± indicator for variable pricing
   - Verify/update selected border weight

2. **Short-term (P1 features):**

   - Build DynamicNotice component
   - Implement SingleTicketLayout mode
   - Add Checkbox mode layout
   - Update "Require Approval" badge styling
   - Implement terminology configuration

3. **Medium-term (P2 modes):**

   - Sold Out panel state
   - Waitlist panel mode
   - Event paused / Notify Me variant
   - Registration closed state

4. **Documentation:**
   - Update design tokens in `index.css` with new color values
   - Create Storybook stories for all states
   - Document mode prop API
   - Add terminology configuration guide
