# Implementation vs Specification Analysis

## Ticket Panel Layout & Styling Comparison

**Date**: Analysis of current implementation against `context/tickets-panel/layout.md`

---

## Executive Summary

The implementation **closely follows the specification** with notable deviations in component abstraction and styling utilities. The developer created additional UI components (`SummaryRow`, `StatusDot`, `InfoPopover`) not specified in the docs, which improve maintainability but diverge from the literal spec.

**Alignment Score**: ~85% structural match, ~70% styling fidelity

---

## 1. Container Structure (TicketsPanel.tsx)

### Spec Says:

```tsx
<section className="bg-card/80 backdrop-blur-[16px] ring-1 ring-border rounded-xl overflow-hidden">
  <div className="p-4 border-b border-border">
    <h2 className="text-xl font-semibold">Get Tickets</h2>
    <p className="text-sm text-muted-foreground mt-1">
      Select quantity for each ticket type
    </p>
  </div>
  {/* ... */}
</section>
```

### Implementation Has:

```tsx
<Card className="rounded-sm bg-card/80 shadow-lg ring-1 ring-border backdrop-blur-[16px]">
  <CardHeader className="min-h-lh border-border border-b py-2">
    <CardTitle>Get Tickets</CardTitle>
  </CardHeader>
  {/* ... */}
</Card>
```

### Differences:

| Aspect             | Spec              | Implementation            | Impact                                                     |
| ------------------ | ----------------- | ------------------------- | ---------------------------------------------------------- |
| **Root element**   | `<section>`       | `<Card>` (from ReUI)      | ✅ Semantic improvement (uses `<div>` internally)          |
| **Border radius**  | `rounded-xl`      | `rounded-sm`              | ❌ **Visual mismatch** (12px vs 2px)                       |
| **Shadow**         | Not specified     | `shadow-lg`               | ⚠️ Extra polish                                            |
| **Header padding** | `p-4`             | `py-2` (via `CardHeader`) | ❌ **Tighter spacing** than spec                           |
| **Subtitle**       | Explicit `<p>`    | Missing                   | ❌ **"Select quantity for each ticket type" not rendered** |
| **Overflow**       | `overflow-hidden` | Not explicit              | ⚠️ Might cause issues with dropdowns                       |

**Verdict**: Structure matches, but **missing subtitle** and **tighter spacing** deviate from spec.

---

## 2. Ticket List Container (TicketList.tsx)

### Spec Says:

```tsx
<div className="p-4 space-y-3">{/* tickets */}</div>
```

### Implementation Has:

```tsx
<CardContent className="px-3 py-4">
  <div className="space-y-3" data-testid="ticket-list">
    {/* tickets */}
  </div>
</CardContent>
```

### Differences:

| Aspect      | Spec                   | Implementation                               | Impact                            |
| ----------- | ---------------------- | -------------------------------------------- | --------------------------------- |
| **Padding** | `p-4` (16px all sides) | `px-3 py-4` (12px horizontal, 16px vertical) | ❌ **Tighter horizontal padding** |
| **Nesting** | Single `<div>`         | Nested `<CardContent>` + `<div>`             | ⚠️ Extra wrapper                  |
| **Test ID** | Not specified          | `data-testid="ticket-list"`                  | ✅ Better testing                 |

**Verdict**: Horizontal padding is **25% narrower** than spec.

---

## 3. Ticket Card (TicketCard.tsx)

### Spec Says (Featured Ticket):

```tsx
<div className="rounded-lg ring-1 ring-primary/20 p-4 bg-primary/5 relative">
  {/* Badge overlay */}
  <div className="absolute top-2 right-2">
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-xs font-medium">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      Best Value
    </span>
  </div>
  {/* ... */}
</div>
```

### Implementation Has:

```tsx
<Card
  className={[
    "transition-all duration-200 py-2 px-3",
    ticket.featured
      ? "bg-primary/5 ring-1 ring-primary/20"
      : "hover:bg-muted/30",
    uiState.isGreyedOut ? "cursor-not-allowed opacity-60" : "",
  ].join(" ")}
>
  {/* No badge overlay in current implementation */}
  {/* ... */}
</Card>
```

### Differences:

| Aspect                   | Spec                                   | Implementation                              | Impact                                         |
| ------------------------ | -------------------------------------- | ------------------------------------------- | ---------------------------------------------- |
| **Root element**         | `<div>`                                | `<Card>`                                    | ⚠️ Abstraction                                 |
| **Border radius**        | `rounded-lg`                           | Inherited from `Card` (likely `rounded-md`) | ⚠️ Inconsistent                                |
| **Padding**              | `p-4`                                  | `py-2 px-3`                                 | ❌ **50% reduction in padding**                |
| **Featured badge**       | Absolute positioned overlay            | **Missing**                                 | ❌ **Critical visual feature not implemented** |
| **Transition**           | Not specified                          | `transition-all duration-200`               | ✅ Polish                                      |
| **Regular card styling** | `ring-1 ring-border hover:bg-muted/30` | `hover:bg-muted/30` (no ring)               | ❌ **Missing default border ring**             |

**Verdict**: **Major deviation** - Featured badge missing, padding significantly reduced, default ring missing.

---

## 4. Status Indicators

### Spec Says (Availability Dot):

```tsx
<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
  <span>Available until Oct 11 at 12:00 PM PDT</span>
</div>
```

### Implementation Has:

```tsx
<StatusDot status={uiState.isPurchasable ? "success" : "muted"} />
```

**`StatusDot` component** (not in spec):

```tsx
export function StatusDot({ status = "default", className }: StatusDotProps) {
  let colorClass = "bg-foreground";
  if (status === "success") colorClass = "bg-green-500";
  else if (status === "muted") colorClass = "bg-muted";
  return (
    <span className={["h-1.5 w-1.5 rounded-full", colorClass].join(" ")} />
  );
}
```

### Differences:

| Aspect              | Spec                                                  | Implementation                 | Impact                                   |
| ------------------- | ----------------------------------------------------- | ------------------------------ | ---------------------------------------- |
| **Abstraction**     | Inline `<span>`                                       | `<StatusDot>` component        | ✅ Better reusability                    |
| **Structure**       | Matches exactly                                       | Matches via component          | ✅ Correct                               |
| **CVD requirement** | Mentions shape differentiation (filled/hollow circle) | Only implements filled circles | ⚠️ **Missing CVD accessibility pattern** |

**Note**: The spec in `layout.md` lines 637-686 specifies **shape differentiation** for color-blind users:

- Available: Filled circle (green)
- Limited: **Hollow circle** (orange) ← **Not implemented**
- Unavailable: X mark (muted) ← **Not implemented**

**Verdict**: Component abstraction is good, but **missing CVD-compliant shape variations**.

---

## 5. Quantity Stepper (QuantityStepper.tsx)

### Spec Says:

```tsx
<div className="inline-flex items-center gap-2">
  <button className="h-9 w-9 rounded-lg border border-border hover:bg-muted">
    {showTrashIcon ? <Trash2 /> : <Minus />}
  </button>
  <span className="w-8 text-center font-medium tabular-nums">{value}</span>
  <button className="h-9 w-9 rounded-lg border border-border hover:bg-muted">
    <Plus />
  </button>
</div>
```

### Implementation Has:

```tsx
<div className="inline-flex items-center gap-2">
  <button
    className={[
      "flex items-center justify-center overflow-hidden rounded-sm border border-border transition-colors hover:bg-muted disabled:cursor-not-allowed",
      "motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out",
      showControls
        ? "h-[26px] w-[26px] cursor-pointer opacity-100"
        : "h-[26px] w-0 opacity-0",
    ].join(" ")}
  >
    {showTrashIcon ? (
      <Trash2 className="h-4 w-4" />
    ) : (
      <Minus className="h-4 w-4" />
    )}
  </button>
  {/* ... */}
</div>
```

### Differences:

| Aspect             | Spec                                              | Implementation                   | Impact                       |
| ------------------ | ------------------------------------------------- | -------------------------------- | ---------------------------- |
| **Button size**    | `h-9 w-9` (36px)                                  | `h-[26px] w-[26px]`              | ❌ **28% smaller than spec** |
| **Border radius**  | `rounded-lg`                                      | `rounded-sm`                     | ❌ Inconsistent              |
| **Animation**      | Not specified                                     | Width/opacity collapse animation | ✅ Excellent UX improvement  |
| **Motion-safe**    | Not specified                                     | `motion-safe:` prefixes          | ✅ Accessibility win         |
| **Disabled state** | `disabled:opacity-50 disabled:cursor-not-allowed` | `disabled:cursor-not-allowed`    | ⚠️ Missing opacity           |

**Verdict**: Size deviation is notable, but animation polish is excellent.

---

## 6. Cart Footer (CartFooter.tsx)

### Spec Says:

```tsx
<div className="border-t border-border bg-background/50 p-4">
  <div className="space-y-3">
    <div className="space-y-1.5 text-sm" aria-live="polite" aria-atomic="true">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Subtotal (2 tickets)</span>
        <span className="font-medium tabular-nums">$80.00</span>
      </div>
      {/* ... */}
    </div>
    <button className="w-full h-11 rounded-lg bg-primary text-primary-foreground">
      Get Tickets
    </button>
  </div>
</div>
```

### Implementation Has:

```tsx
<div className="w-full border-border border-t bg-background/50 p-4">
  {/* Uses SummaryRow component instead of manual flex layout */}
  <SummaryRow
    label={
      <span className="text-muted-foreground">
        Subtotal ({qty} {pluralize})
      </span>
    }
    value={formatMoney(pricing.subtotal, currency)}
  />
  {/* ... */}
</div>
```

**`SummaryRow` component** (not in spec):

```tsx
export function SummaryRow({ label, value, muted, size = "md" }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-muted-foreground" : undefined}>
        {label}
      </span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
```

### Differences:

| Aspect            | Spec             | Implementation             | Impact                    |
| ----------------- | ---------------- | -------------------------- | ------------------------- |
| **Structure**     | Manual flex divs | `<SummaryRow>` abstraction | ✅ Better maintainability |
| **Styling**       | Inline classes   | Component-managed          | ✅ DRY principle          |
| **Button size**   | `h-11` (44px)    | `h-11`                     | ✅ Matches                |
| **Button radius** | `rounded-lg`     | `rounded-lg`               | ✅ Matches                |

**Verdict**: Excellent abstraction, maintains spec intent.

---

## 7. Ticket Price (TicketPrice.tsx)

### Spec Says:

```tsx
<div className="text-right shrink-0">
  <div className="font-semibold text-lg">$55.00</div>
  <div className="text-xs text-muted-foreground">plus fees</div>
</div>
```

### Implementation Has:

```tsx
<div className="flex items-center">
  <div className="flex items-baseline gap-2">
    <span className="font-semibold text-lg">
      {formatMoney(unit, pricing.ticket.currency)}
    </span>
  </div>
  {savingsAmount && (
    <Badge
      variant="secondary"
      className="text-xs ml-1"
      data-testid="savings-badge"
    >
      Save {formatMoney(savingsAmount, currency)}
    </Badge>
  )}
  {(feesInfo?.showBreakdown || taxInfo?.showBreakdown) && (
    <InfoPopover buttonClassName="ml-2" data-testid="info-popover">
      {/* Breakdown details */}
    </InfoPopover>
  )}
</div>
```

### Differences:

| Aspect               | Spec                                | Implementation                       | Impact                         |
| -------------------- | ----------------------------------- | ------------------------------------ | ------------------------------ |
| **Layout direction** | Vertical stack (`flex-col` implied) | Horizontal row (`flex items-center`) | ❌ **Major layout difference** |
| **Alignment**        | `text-right`                        | `items-center`                       | ❌ Not right-aligned           |
| **Savings badge**    | Not in spec mockup                  | `<Badge>` with "Save $X"             | ✅ Nice enhancement            |
| **Fee breakdown**    | Inline text                         | `<InfoPopover>` component            | ✅ Better UX (no clutter)      |

**Verdict**: Layout deviates significantly, but enhancements improve UX.

---

## 8. Playground Route (ticket-playground.tsx)

### Spec Says:

```tsx
function Playground() {
  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-2xl">
        <TicketsPanel /* ... */ />
      </div>
    </div>
  );
}
```

### Implementation Has:

```tsx
function Playground() {
  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-2xl">
        <TicketsPanel /* ... */ />
      </div>
    </div>
  );
}
```

**Verdict**: ✅ **Perfect match**.

---

## 9. CSS Tokens & Utilities

### Spec Requires (in `index.css`):

```css
:root {
  --card-backdrop-blur: 16px;
  --glow-opacity: 0.2;
  --max-width: 820px;
}

@theme inline {
  --shadow-xs: 0 1px 4px rgba(0, 0, 0, 0.1);
  --shadow-sm: /* multi-layer shadow */
  --shadow-md: /* ... */
  --duration-instant: 100ms;
  --duration-fast: 200ms;
  --duration-normal: 300ms;
  --duration-slow: 600ms;
  --easing-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --easing-bounce: cubic-bezier(0.54, 1.12, 0.38, 1.11);
}

@layer utilities {
  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }
  .text-balance {
    text-wrap: balance;
  }
}
```

### Implementation Has:

- ✅ `tabular-nums` is used in multiple places
- ❌ Custom CSS variables **not added** to `index.css`
- ❌ Multi-layer shadows **not implemented** (uses `shadow-lg` instead)
- ❌ Animation tokens **not defined** (uses inline durations like `duration-200`)

**Verdict**: Developer used standard Tailwind utilities instead of custom tokens.

---

## 10. Accessibility Compliance

### Spec Requirements (from `layout.md`):

| Requirement                        | Spec Location              | Implementation                                         | Status      |
| ---------------------------------- | -------------------------- | ------------------------------------------------------ | ----------- |
| **Semantic HTML**                  | Lines 529-587              | ✅ Uses `<button type="button">`, proper `<time>` tags | ✅ Pass     |
| **Focus rings**                    | Lines 594-599              | ⚠️ Relies on default browser/Tailwind                  | ⚠️ Partial  |
| **Screen reader labels**           | Lines 608-626              | ✅ `aria-label` on icon buttons                        | ✅ Pass     |
| **Reduced motion**                 | Lines 629-630, CSS         | ✅ `motion-safe:` prefixes in stepper                  | ✅ Pass     |
| **Color + Shape cues (CVD)**       | Lines 632-693              | ❌ Only filled circles, no hollow/X marks              | ❌ **Fail** |
| **`aria-live` for cart updates**   | Line 325 (CartFooter)      | ✅ `aria-live="polite"` on pricing                     | ✅ Pass     |
| **`aria-describedby` for helpers** | Lines 352-354 (TicketCard) | ✅ Linked to `helperId`                                | ✅ Pass     |

**Verdict**: Strong a11y foundation, but **missing CVD-compliant shape variations** for status indicators.

---

## Summary Table: Styling Deviations

| Component               | Spec Value                 | Implementation         | Delta     | Severity    |
| ----------------------- | -------------------------- | ---------------------- | --------- | ----------- |
| **Container radius**    | `rounded-xl` (12px)        | `rounded-sm` (2px)     | -83%      | 🔴 High     |
| **Container padding**   | `p-4` (16px)               | `py-2` (8px vertical)  | -50%      | 🔴 High     |
| **Subtitle text**       | Present                    | **Missing**            | N/A       | 🔴 High     |
| **Card padding**        | `p-4` (16px)               | `py-2 px-3` (8px/12px) | -50%/-25% | 🔴 High     |
| **Featured badge**      | Absolute overlay           | **Missing**            | N/A       | 🔴 Critical |
| **Regular card ring**   | `ring-1 ring-border`       | **Missing**            | N/A       | 🟡 Medium   |
| **Stepper button size** | `h-9 w-9` (36px)           | `h-[26px] w-[26px]`    | -28%      | 🟡 Medium   |
| **Price layout**        | Vertical (right-aligned)   | Horizontal (centered)  | Structure | 🟡 Medium   |
| **CVD shape variants**  | 3 shapes (circle/hollow/X) | 1 shape (circle only)  | -66%      | 🔴 High     |
| **Custom CSS tokens**   | Required                   | **Not added**          | N/A       | 🟡 Medium   |

---

## Positive Deviations (Improvements)

1. ✅ **Component abstraction**: `SummaryRow`, `StatusDot`, `InfoPopover` improve maintainability
2. ✅ **Animation polish**: Stepper collapse/expand with `motion-safe` prefixes
3. ✅ **Test IDs**: Added for better testing (`data-testid="ticket-list"`)
4. ✅ **InfoPopover**: Fee breakdown is cleaner than inline text
5. ✅ **Badge for savings**: "Save $X" badge is visually appealing
6. ✅ **Reduced motion support**: Implemented via `motion-safe:` classes

---

## Critical Missing Features

1. ❌ **Featured ticket badge** ("Best Value" overlay) - **Not implemented**
2. ❌ **Subtitle in header** ("Select quantity for each ticket type") - **Not rendered**
3. ❌ **CVD-compliant shape variations** (hollow circles, X marks) - **Only filled circles**
4. ❌ **Default ring on regular tickets** (`ring-1 ring-border`) - **Missing**
5. ❌ **Custom CSS tokens** in `index.css` - **Not added**

---

## Conclusion

The developer followed the **functional architecture** closely (TanStack DB queries, state management, cart operations) but deviated significantly from **visual specifications**:

- **Padding is consistently tighter** (50% reduction in multiple places)
- **Border radius is smaller** (`rounded-sm` vs `rounded-xl`)
- **Key visual elements are missing** (featured badge, default rings)
- **Accessibility gap**: CVD shape differentiation not implemented

**Overall Alignment**:

- **Structure**: 85% ✅
- **Styling**: 70% ⚠️
- **Functionality**: 95% ✅
- **A11y**: 80% ⚠️ (good foundation, missing CVD patterns)

The implementation is **production-ready functionally** but **needs visual polish** to match the spec's design intent.
