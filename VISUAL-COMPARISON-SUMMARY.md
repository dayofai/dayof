# Visual Comparison Summary

## Quick Reference: Spec vs Implementation

---

## 🎨 Container Styling

```tsx
// SPEC (layout.md lines 81-89)
<section className="
  bg-card/80
  backdrop-blur-[16px]
  ring-1 ring-border
  rounded-xl          ← 12px radius
  overflow-hidden
">
  <div className="p-4 border-b border-border">  ← 16px padding
    <h2 className="text-xl font-semibold">Get Tickets</h2>
    <p className="text-sm text-muted-foreground mt-1">
      Select quantity for each ticket type  ← SUBTITLE
    </p>
  </div>
```

```tsx
// IMPLEMENTATION (TicketsPanel.tsx)
<Card className="
  rounded-sm          ← 2px radius (83% SMALLER)
  bg-card/80
  shadow-lg           ← EXTRA
  ring-1 ring-border
  backdrop-blur-[16px]
">
  <CardHeader className="
    min-h-lh
    border-border border-b
    py-2              ← 8px padding (50% SMALLER)
  ">
    <CardTitle>Get Tickets</CardTitle>
    {/* SUBTITLE MISSING ❌ */}
  </CardHeader>
```

**Visual Impact**: Much tighter, smaller corners, missing guidance text

---

## 🎫 Featured Ticket Card

```tsx
// SPEC (layout.md lines 92-130)
<div
  className="
  rounded-lg 
  ring-1 ring-primary/20 
  p-4              ← 16px padding
  bg-primary/5 
  relative
"
>
  {/* Badge overlay ← CRITICAL VISUAL */}
  <div className="absolute top-2 right-2">
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full 
                     bg-primary/10 text-xs font-medium"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      Best Value ← USER SEES THIS
    </span>
  </div>

  <div className="flex items-start justify-between gap-4">
    {/* ticket content */}
  </div>
</div>
```

```tsx
// IMPLEMENTATION (TicketCard.tsx)
<Card className={[
  'transition-all duration-200',
  'py-2 px-3',    ← 8px/12px padding (50%/25% SMALLER)
  ticket.featured
    ? 'bg-primary/5 ring-1 ring-primary/20'
    : 'hover:bg-muted/30',
    // ❌ NO DEFAULT RING on regular cards
]}>
  {/* ❌ NO BADGE OVERLAY - Users can't identify "Best Value" */}

  <div className='flex items-center justify-between gap-2'>
    {/* ticket content */}
  </div>
</Card>
```

**Visual Impact**: Featured tickets look the same as regular ones (no badge!)

---

## 🔢 Quantity Stepper Buttons

```
SPEC:                    IMPLEMENTATION:
┌─────────┐             ┌──────┐
│         │             │      │
│   36px  │             │ 26px │  ← 28% smaller
│    ×    │             │  ×   │
│   36px  │             │ 26px │
│         │             │      │
└─────────┘             └──────┘
rounded-lg              rounded-sm
```

---

## 💰 Price Display Layout

```
SPEC:                         IMPLEMENTATION:
┌──────────────┐              ┌────────────────────────┐
│    $55.00    │              │ $55.00 [Save $20] (i)  │
│   plus fees  │              │                        │
└──────────────┘              └────────────────────────┘
  (vertical,                    (horizontal, with
   right-aligned)                badge + popover)
```

**Visual Impact**: More compact, but not right-aligned per mockup

---

## 🚦 Status Indicators (Accessibility Issue)

### SPEC: CVD-Compliant (Shape Differentiation)

```
Available:    ● green filled circle
              ↑ sighted users see green

Limited:      ○ orange hollow circle
              ↑ shape change = accessible without color

Unavailable:  ✕ gray X mark
              ↑ distinct shape, no color dependency
```

### IMPLEMENTATION: Color-Only

```
Available:    ● green filled circle
Limited:      ● orange filled circle  ← SAME SHAPE
Unavailable:  ● gray filled circle    ← SAME SHAPE

❌ Fails WCAG 1.4.1 (Use of Color)
```

**Impact**: Users with color vision deficiencies can't distinguish states

---

## 📐 Padding Comparison Chart

| Element          | Spec             | Impl                  | Reduction      |
| ---------------- | ---------------- | --------------------- | -------------- |
| Container header | `p-4` (16px)     | `py-2` (8px)          | **-50%**       |
| List container   | `p-4` (16px)     | `px-3 py-4` (12/16px) | **-25%** horiz |
| Ticket card      | `p-4` (16px)     | `py-2 px-3` (8/12px)  | **-50%/-25%**  |
| Stepper buttons  | `h-9 w-9` (36px) | `26px`                | **-28%**       |

**Overall**: Implementation is **30-40% more compact** than spec

---

## ✅ What Was Done Well

1. **Functional architecture** matches perfectly (TanStack DB, queries, cart ops)
2. **Component abstractions** improve maintainability (`SummaryRow`, `StatusDot`)
3. **Animation polish** with `motion-safe:` prefixes
4. **Accessibility foundation** (aria-labels, semantic HTML, reduced motion)
5. **Test coverage** with data-testid attributes

---

## ❌ Critical Gaps

1. **Featured badge** ("Best Value") completely missing
2. **Subtitle** ("Select quantity...") not rendered
3. **CVD compliance** - only one shape (circle) used for all states
4. **Default border ring** on regular tickets missing
5. **Padding 30-50% tighter** than specified
6. **Border radius** 83% smaller (`rounded-sm` vs `rounded-xl`)

---

## 🎯 Priority Fixes (High Impact)

### 1. Add Featured Badge Overlay

```tsx
// TicketCard.tsx
{
  ticket.featured && (
    <div className="absolute top-2 right-2">
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full 
                     bg-primary/10 text-xs font-medium"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        Best Value
      </span>
    </div>
  );
}
```

### 2. Add Subtitle to Header

```tsx
// TicketsPanel.tsx
<CardHeader>
  <CardTitle>Get Tickets</CardTitle>
  <p className="text-sm text-muted-foreground mt-1">
    Select quantity for each ticket type
  </p>
</CardHeader>
```

### 3. Fix Status Dot Shapes (CVD)

```tsx
// StatusDot.tsx - add shape variants
export function StatusDot({ status, variant }: StatusDotProps) {
  if (status === "limited") {
    // Hollow circle
    return (
      <span className="h-1.5 w-1.5 rounded-full border border-orange-500" />
    );
  }
  if (status === "unavailable") {
    // X mark
    return (
      <svg className="h-1.5 w-1.5">
        <path d="M2 2 L10 10 M10 2 L2 10" stroke="currentColor" />
      </svg>
    );
  }
  // Filled circle (default/success)
  return <span className="h-1.5 w-1.5 rounded-full bg-green-500" />;
}
```

### 4. Restore Specified Padding

```diff
// TicketsPanel.tsx
- <CardHeader className="min-h-lh border-border border-b py-2">
+ <CardHeader className="border-border border-b p-4">

// TicketCard.tsx
- className="py-2 px-3"
+ className="p-4"
```

### 5. Restore Border Radius

```diff
- <Card className="rounded-sm ...">
+ <Card className="rounded-xl overflow-hidden ...">
```

---

## 📊 Alignment Scores

| Category                | Score | Status         |
| ----------------------- | ----- | -------------- |
| **Functional Logic**    | 95%   | ✅ Excellent   |
| **Data Architecture**   | 95%   | ✅ Excellent   |
| **Visual Layout**       | 70%   | ⚠️ Needs work  |
| **Component Structure** | 85%   | ✅ Good        |
| **Accessibility**       | 80%   | ⚠️ Missing CVD |
| **Polish/Enhancements** | 90%   | ✅ Excellent   |

**Overall**: Strong engineering foundation, visual polish needed for production.
