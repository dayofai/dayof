# Layout & Visual Specifications

> **Terminology Note**: We use "handle" (like Shopify) instead of "slug" for URL identifiers throughout the codebase. Routes follow the pattern `/$orgHandle/$eventHandle`.

## Page Structure Context

The TicketsPanel component will eventually integrate into a larger two-column event page layout. For now, you're building it in isolation at `/ticket-playground`.

**Future integration point** (not part of this task):

```tsx
// apps/frontrow/src/features/event/EventPage.tsx (DON'T MODIFY)
<main className="flex-1 min-w-0 space-y-6">
  <TitleBlock event={event} />
  <EventMeta event={event} />

  {/* TicketsPanel integrates here */}
  <TicketsPanel
    eventId={event.id}
    event={{
      mixedTicketTypesAllowed: true,
      currency: "USD",
      timeZone: "America/Los_Angeles",
    }}
    onCheckout={(cartItems, pricing) => {
      // Navigate to checkout
    }}
  />

  <AboutSection event={event} />
  {/* ... more sections */}
</main>
```

**Your playground route** (`/ticket-playground`):

```tsx
function TicketPlayground() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Tickets Panel (Isolated)</h1>

        <TicketsPanel
          eventId="evt_123"
          event={{
            mixedTicketTypesAllowed: false,
            currency: "USD",
            timeZone: "America/Los_Angeles",
          }}
          onCheckout={(cartItems, pricing) => {
            console.log("Checkout clicked:", { cartItems, pricing });
          }}
        />
      </div>
    </div>
  );
}
```

---

## TicketsPanel Container Styling

### Ticket Interaction States

**All tickets** (featured or regular) follow the same state machine:

1. **qty = 0** (default): Show "Add" button with + icon
2. **qty = 1**: Show stepper with **trash icon** (not minus) on left button
3. **qty > 1**: Show stepper with **minus icon** on left button
4. **Removed**: Return to "Add" button state

Featured tickets have elevated visual styling (bg-primary/5, ring-primary/20) but the same interaction model as regular tickets.

### Visual Mockup (Complete HTML)

Reference: This is the exact structure to implement. Note: The mockup shows tickets in various states (some with qty=1 showing steppers, others at qty=0 showing Add buttons).

```tsx
<section className="bg-card/80 backdrop-blur-[16px] ring-1 ring-border rounded-xl overflow-hidden">
  {/* Header */}
  <div className="p-4 border-b border-border">
    <h2 className="text-xl font-semibold">Get Tickets</h2>
    <p className="text-sm text-muted-foreground mt-1">
      Select quantity for each ticket type
    </p>
  </div>

  {/* Ticket List */}
  <div className="p-4 space-y-3">
    {/* === FEATURED TICKET (qty=1 state, showing stepper with trash icon) === */}
    <div className="rounded-lg ring-1 ring-primary/20 p-4 bg-primary/5 relative">
      {/* Badge overlay */}
      <div className="absolute top-2 right-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-xs font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Best Value
        </span>
      </div>

      <div className="flex items-start justify-between gap-4">
        {/* Left: Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base">
            VIP All Day Plus Book & Food!
          </h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            Full day access with lunch, refreshments, and a signed book
          </p>

          {/* Availability label with green dot */}
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <span>Available until Oct 11 at 12:00 PM PDT</span>
          </div>

          {/* Bundle info */}
          <div className="mt-2 text-xs text-muted-foreground">
            Includes: All three movies · Lunch · Free book
          </div>
        </div>

        {/* Right: Price */}
        <div className="text-right shrink-0">
          <div className="font-semibold text-lg">$55.00</div>
          <div className="text-xs text-muted-foreground">plus fees</div>
        </div>
      </div>

      {/* Quantity Stepper (inline for featured) */}
      <div className="mt-4 flex items-center justify-between">
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            className="h-9 w-9 rounded-lg border border-border hover:bg-muted flex items-center justify-center transition-colors"
            aria-label="Remove ticket"
          >
            {/* Trash icon (shown when qty === 1) */}
            <svg
              className="h-4 w-4"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeWidth="1.5"
                strokeLinecap="round"
                d="M3 4h10M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1m1 0v9a1 1 0 01-1 1H5a1 1 0 01-1-1V4h8z"
              />
            </svg>
          </button>

          <span className="w-8 text-center font-medium tabular-nums">1</span>

          <button
            type="button"
            className="h-9 w-9 rounded-lg border border-border hover:bg-muted flex items-center justify-center transition-colors"
            aria-label="Increase quantity"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
            >
              <path strokeWidth="1.5" strokeLinecap="round" d="M8 4v8M4 8h8" />
            </svg>
          </button>
        </div>

        {/* Helper text */}
        <div className="text-xs text-muted-foreground">Max 10 per order</div>
      </div>
    </div>

    {/* === REGULAR TICKET (qty=0 state, showing Add button) === */}
    <div className="rounded-lg ring-1 ring-border p-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm">Show Her the Money</h3>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <span>Available until Oct 11 at 10:30 AM PDT</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="font-medium text-sm">$25.00</div>
            <div className="text-xs text-muted-foreground">plus fees</div>
          </div>

          {/* Add button */}
          <button
            type="button"
            className="h-8 px-3 rounded-lg border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors flex items-center gap-1"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
            >
              <path strokeWidth="1.5" strokeLinecap="round" d="M8 4v8M4 8h8" />
            </svg>
            <span className="text-sm font-medium">Add</span>
          </button>
        </div>
      </div>
    </div>

    {/* === TICKET WITH LOW INVENTORY WARNING === */}
    <div className="rounded-lg ring-1 ring-border p-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm">Lilly</h3>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            <span className="text-orange-600 dark:text-orange-400 font-medium">
              Only 3 left!
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="font-medium text-sm">$25.00</div>
            <div className="text-xs text-muted-foreground">plus fees</div>
          </div>
          <button
            type="button"
            className="h-8 px-3 rounded-lg border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors flex items-center gap-1"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
            >
              <path strokeWidth="1.5" strokeLinecap="round" d="M8 4v8M4 8h8" />
            </svg>
            <span className="text-sm font-medium">Add</span>
          </button>
        </div>
      </div>
    </div>

    {/* === LOCKED/UNAVAILABLE TICKET (greyed out) === */}
    <div className="rounded-lg ring-1 ring-border p-3 opacity-50 cursor-not-allowed">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm">Still Working 9–5</h3>
          <div className="mt-1 text-xs text-muted-foreground">
            Available until Oct 11 at 4:30 PM PDT
          </div>
          {/* Unavailable reason */}
          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 text-xs">
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeWidth="1.5"
                strokeLinecap="round"
                d="M8 4v4m0 4h.01M14 8A6 6 0 112 8a6 6 0 0112 0z"
              />
            </svg>
            Remove other tickets to add this one
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="font-medium text-sm">$25.00</div>
            <div className="text-xs text-muted-foreground">plus fees</div>
          </div>
          <button
            type="button"
            disabled
            className="h-8 px-3 rounded-lg border border-border bg-muted/50 text-muted-foreground cursor-not-allowed flex items-center gap-1"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
            >
              <path strokeWidth="1.5" strokeLinecap="round" d="M8 4v8M4 8h8" />
            </svg>
            <span className="text-sm font-medium">Add</span>
          </button>
        </div>
      </div>
    </div>

    {/* === SOLD OUT TICKET === */}
    <div className="rounded-lg ring-1 ring-border p-3 opacity-50 cursor-not-allowed">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm">Early Bird Special</h3>
            <span className="inline-flex px-2 py-0.5 rounded-full bg-destructive/10 text-xs font-medium text-destructive">
              Sold Out
            </span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Was $20.00 · plus fees
          </div>
        </div>

        <div className="text-sm text-muted-foreground shrink-0">Sold out</div>
      </div>
    </div>
  </div>

  {/* === CART FOOTER === */}
  <div className="border-t border-border bg-background/50 p-4">
    <div className="space-y-3">
      {/* Pricing breakdown - aria-live for screen reader updates */}
      <div
        className="space-y-1.5 text-sm"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal (2 tickets)</span>
          <span className="font-medium tabular-nums">$80.00</span>
        </div>

        {/* Service fees */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Service fees</span>
          <span className="tabular-nums">+$8.00</span>
        </div>

        {/* Tax */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Tax</span>
          <span className="tabular-nums">+$7.04</span>
        </div>

        {/* Separator */}
        <div className="border-t border-border my-2" />

        {/* Total */}
        <div className="flex items-center justify-between font-semibold">
          <span>Total</span>
          <span className="tabular-nums text-lg">$95.04</span>
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
      >
        Get Tickets
      </button>
    </div>
  </div>
</section>
```

---

## CSS Token System

### Required Token Additions

Add these to `apps/frontrow/src/index.css`:

```css
/* === ADD to existing :root === */
:root {
  /* Keep all existing design tokens (--background, --foreground, etc.) */

  /* ADD: Glassmorphism & effects */
  --card-backdrop-blur: 16px;
  --glow-opacity: 0.2;

  /* ADD: Structural */
  --max-width: 820px;
}

.dark {
  /* Keep existing dark mode overrides */

  /* ADD: Dark mode adjustments */
  --glow-opacity: 0.3;
}

/* === ADD to existing @theme inline === */
@theme inline {
  /* Keep all existing color conversions (--color-background, etc.) */

  /* ADD: Multi-layer shadows (Luma pattern) */
  --shadow-xs: 0 1px 4px rgba(0, 0, 0, 0.1);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.02), 0 2px 7px rgba(0, 0, 0, 0.03),
    0 3px 14px rgba(0, 0, 0, 0.04), 0 7px 29px rgba(0, 0, 0, 0.05),
    0 20px 80px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.06),
    0 8px 32px rgba(0, 0, 0, 0.08);

  /* ADD: Animation tokens */
  --duration-instant: 100ms;
  --duration-fast: 200ms;
  --duration-normal: 300ms;
  --duration-slow: 600ms;
  --easing-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --easing-bounce: cubic-bezier(0.54, 1.12, 0.38, 1.11);
}

/* ADD: Utility classes */
@layer utilities {
  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }

  .text-balance {
    text-wrap: balance;
  }
}

/* Dark mode shadow adjustments */
.dark {
  --shadow-xs: 0 1px 4px rgba(0, 0, 0, 0.25);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* CRITICAL: Reduced motion support for accessibility */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Override animation tokens for reduced motion */
  :root {
    --duration-instant: 0ms;
    --duration-fast: 0ms;
    --duration-normal: 0ms;
    --duration-slow: 0ms;
  }
}
```

### Key Patterns

**1. Glassmorphism** (frosted glass effect):

```css
bg-card/80 backdrop-blur-[16px] ring-1 ring-border
```

**2. Multi-layer shadows**:

```css
shadow-[var(--shadow-sm)]
```

**3. Tailwind opacity modifiers** (instead of separate variables):

```css
bg-primary/5      /* 5% opacity */
bg-primary/10     /* 10% opacity */
text-primary/80   /* 80% opacity */
```

**4. Tabular numbers** (for pricing):

```css
className="tabular-nums"
```

---

## Responsive Behavior

### Breakpoint Strategy

Use Tailwind's standard breakpoints:

| Breakpoint | Size   | Usage                        |
| ---------- | ------ | ---------------------------- |
| `sm:`      | 640px  | Phone landscape              |
| `md:`      | 768px  | Tablet (sidebar stacks here) |
| `lg:`      | 1024px | Desktop (wider sidebar)      |
| `xl:`      | 1280px | Wide desktop                 |

### TicketsPanel Responsive Changes

**Mobile (<768px)**:

- Stacks vertically
- Full width
- All tickets show Add button when qty=0
- Stepper appears when ticket added to cart

**Desktop (≥768px)**:

- Fixed width in content area
- Same interaction model (Add button → stepper based on cart state)
- No layout changes (single column component)

### Example Responsive Classes

```tsx
// Responsive padding
className = "px-4 md:px-6";

// Responsive text size
className = "text-sm md:text-base";

// Responsive flex direction
className = "flex flex-col md:flex-row";
```

---

## Semantic HTML Requirements

All components MUST use proper semantic HTML:

### Event Title

```tsx
// ✅ CORRECT
<h1 className="text-3xl md:text-5xl lg:text-6xl leading-[1.1] font-normal text-balance">
  {event.title}
</h1>

// ❌ WRONG
<Typography variant="h1">{event.title}</Typography>
<div className="text-3xl">{event.title}</div>
```

### Date/Time Information

```tsx
// ✅ CORRECT
<time dateTime="2025-10-09T19:00:00-04:00" className="tabular-nums">
  Thu, Oct 9, 2025 · 7:00 PM EDT
</time>

// ❌ WRONG
<span>Thu, Oct 9, 2025 · 7:00 PM EDT</span>
```

### Buttons

```tsx
import { Plus } from "lucide-react";

// ✅ CORRECT - defaults to type="button"
<button type="button" onClick={handleClick}>Add</button>

// ✅ CORRECT - icon-only with aria-label
<button type="button" aria-label="Increase quantity">
  <Plus className="h-4 w-4" />
</button>

// ❌ WRONG - missing type, will submit forms
<button onClick={handleClick}>Add</button>

// ❌ WRONG - icon-only without label
<button type="button"><Plus /></button>
```

### Links

```tsx
// ✅ CORRECT - external link
<a href={url} target="_blank" rel="noopener noreferrer">
  Open
</a>

// ❌ WRONG - missing rel attribute
<a href={url} target="_blank">Open</a>
```

---

## Accessibility Checklist

### Focus Rings

All interactive elements MUST have visible focus rings:

```css
/* Enforced via design tokens */
ring-ring     /* Use this token, not hardcoded colors */
```

### Keyboard Navigation

- All buttons reachable via Tab
- Enter/Space activate buttons
- Escape closes modals (if applicable)

### Screen Reader Support

```tsx
import { Trash2 } from "lucide-react";

// Hidden decorative elements
<div aria-hidden="true">
  {/* Glow layer, etc. */}
</div>

// Icon-only buttons MUST have labels
<button type="button" aria-label="Remove ticket">
  <Trash2 className="h-4 w-4" />
</button>

// Skip to main content (if needed)
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

### Reduced Motion

All animations must respect user preferences (already handled in CSS tokens).

### Color & Shape Cues (CVD-friendly)

**Critical**: Status indicators must use **both color and shape** (or text) for users with color vision deficiencies.

**Status Dot Implementation** (inline SVG with distinct shapes):

```tsx
{/* Available - Filled circle (green) */}
<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
  <svg
    className="h-1.5 w-1.5 shrink-0"
    viewBox="0 0 6 6"
    fill="currentColor"
    aria-hidden="true"
  >
    <circle cx="3" cy="3" r="3" className="text-green-500" />
  </svg>
  <span>Available until Oct 11 at 12:00 PM PDT</span>
</div>

{/* Limited/Warning - Hollow circle (orange) */}
<div className="flex items-center gap-1.5 text-xs">
  <svg
    className="h-1.5 w-1.5 shrink-0"
    viewBox="0 0 6 6"
    fill="none"
    stroke="currentColor"
    aria-hidden="true"
  >
    <circle cx="3" cy="3" r="2.5" strokeWidth="1" className="text-orange-500" />
  </svg>
  <span className="text-orange-600 dark:text-orange-400 font-medium">
    Only 3 left!
  </span>
</div>

{/* Unavailable - X mark (muted) */}
<div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 text-xs">
  <svg
    className="h-3.5 w-3.5 shrink-0"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path
      strokeWidth="1.5"
      strokeLinecap="round"
      d="M4 4l8 8M12 4l-8 8"
      className="text-muted-foreground"
    />
  </svg>
  <span>Remove other tickets to add this one</span>
</div>
```

**Why this approach:**
- **Shape differentiation**: Filled circle vs hollow circle vs X mark
- **Text pairing**: Every indicator includes descriptive text
- **ARIA-hidden on decorative SVGs**: Icons are decorative; text conveys the info
- **CSS classes for color**: Easy to theme and maintain consistency

---

## Summary: Implementation Checklist

### TicketsPanel Container

- ✅ Glassmorphism card: `bg-card/80 backdrop-blur-[16px] ring-1 ring-border rounded-xl`
- ✅ Responsive: full width on mobile, constrained on desktop
- ✅ Client-side only (`ssr: false` in route)

### Visual States (All Implemented)

- ✅ Featured ticket elevated styling (bg-primary/5, elevated ring)
- ✅ All tickets start with Add button (qty=0)
- ✅ Stepper with trash icon appears at qty=1
- ✅ Stepper with minus icon appears at qty>1
- ✅ Low inventory warning (orange dot, "Only X left!")
- ✅ Locked ticket (greyed with reason badge)
- ✅ Sold out ticket (greyed, badge, no button)
- ✅ Cart footer pricing breakdown

### Responsive Behavior (Implementation Checklist)

- ✅ Single column component (no sidebar in playground)
- ✅ Responsive padding and text sizes
- ✅ Works at all breakpoints

### CSS Tokens Required

- ✅ Glassmorphism variables
- ✅ Multi-layer shadows
- ✅ Animation tokens
- ✅ Utility classes (tabular-nums, text-balance)

### Accessibility

- ✅ Semantic HTML (h1, h2, time, button with type)
- ✅ Visible focus rings
- ✅ Screen reader labels (aria-label for icon buttons)
- ✅ Reduced motion support

---

## Future Integration Notes

When integrating TicketsPanel back into EventPage:

1. **No code changes needed** - component is self-contained
2. **Props remain the same** - `eventId`, `event`, `onCheckout`
3. **Placement** - Goes between EventMeta and AboutSection
4. **Responsive** - Already handles all breakpoints
5. **State** - Cart persists in localStorage across pages

The playground route can remain as a visual testing sandbox even after integration.
