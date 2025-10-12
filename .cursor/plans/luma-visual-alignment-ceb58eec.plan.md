<!-- ceb58eec-9eee-45c0-97aa-fa784d144bc3 db981860-c6f2-42df-841d-7d3f868f4a87 -->
# Luma-Exact Design Alignment Plan

## Goal

Transform the current ticket panel to match Luma's visual design exactly while keeping our superior functionality (cart validation, pricing breakdown, limits). Use OKLCH color space for programmatic theming and semantic HTML patterns.

## Current State vs Target State

**Current Issues:**

- Tickets are `<div>` elements → Should be `<button>` elements
- Header is `text-xl` (20px) → Should be `text-sm` (14px)
- Missing subtitle "Welcome! Please choose..."
- Container is `rounded-sm` → Should be `rounded-xl` (12px)
- Missing tinted header background that bleeds to edges
- Status dots are 6px → Should be 9px
- CTA button is 44px → Should be 38px
- Tickets gap is 12px → Should be 8px
- Featured badge is missing
- No selection highlight state

**What We're Keeping (Our Improvements):**

- Configurable pricing breakdown (Luma doesn't have this)
- Real-time validation and limits
- Min/max quantity enforcement
- Cart persistence

---

## Phase 1: OKLCH Theming Foundation (Programmatic)

**Why:** Luma uses per-event theming. We need a system that reads `event.brandColor` from the database and programmatically generates all theme variants without touching CSS files.

### 1.1 Add OKLCH Theme Slots to index.css

**File:** `apps/frontrow/src/index.css`

**Action:** Add theme variable slots (define once, never edit again)

**Add after existing shadcn tokens:**

```css
/* === THEME SYSTEM (Programmatic per-event) === */
/* These are SLOTS - values are injected at runtime via inline styles */
:root {
  /* Theme accent color (from event.brandColor in DB) */
  --theme-accent: oklch(0.45 0.12 35);           /* Placeholder - will be overridden */
  
  /* Derived variants (calculated via CSS relative colors) */
  --theme-accent-light: oklch(from var(--theme-accent) l c h / 0.04);   /* 4% opacity backgrounds */
  --theme-accent-border: oklch(from var(--theme-accent) l c h / 0.08);  /* 8% opacity borders */
  --theme-accent-muted: oklch(from var(--theme-accent) l c h / 0.64);   /* 64% opacity text */
  --theme-accent-subtle: oklch(from var(--theme-accent) l c h / 0.48);  /* 48% opacity */
  
  /* CTA color (brighter, more saturated) */
  --theme-cta: oklch(from var(--theme-accent) calc(l * 1.15) calc(c * 1.3) h);
}

.dark {
  /* Dark mode keeps same accent but different alpha handling */
  --theme-accent-light: oklch(from var(--theme-accent) l c h / 0.08);
}
```

**Why this works:**

- CSS relative color syntax lets the browser calculate variants automatically
- No JavaScript color math libraries needed
- Single `--theme-accent` value drives everything
- Compatible with shadcn's existing OKLCH tokens

### 1.2 Create Theme Calculation Utility

**File:** `apps/frontrow/src/lib/utils/theme.ts` (new file)

**Action:** Create utility to convert event brand color to OKLCH if needed

```typescript
/**
 * Converts hex/rgb color to OKLCH for theme injection
 * Falls back to warm brown if no color provided
 */
export function normalizeThemeColor(color: string | undefined): string {
  if (!color) {
    return 'oklch(0.45 0.12 35)';  // Default warm brown
  }
  
  // If already OKLCH, return as-is
  if (color.startsWith('oklch(')) {
    return color;
  }
  
  // If hex, convert to OKLCH
  // (For MVP, we can require OKLCH in DB or use a library like culori)
  return color;  // For now, assume DB stores OKLCH
}

/**
 * Generate inline style object for theme injection
 */
export function getThemeStyles(brandColor: string | undefined) {
  return {
    '--theme-accent': normalizeThemeColor(brandColor),
  } as React.CSSProperties;
}
```

**Why:**

- Single source of truth for theme color normalization
- Easy to expand with color conversion later
- Type-safe for React inline styles

### 1.3 Inject Theme at Route Level

**File:** `apps/frontrow/src/routes/ticket-playground.tsx`

**Action:** Wrap TicketsPanel with theme injection

**Change from:**

```tsx
function Playground() {
  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-2xl">
        <TicketsPanel {...props} />
      </div>
    </div>
  );
}
```

**To:**

```tsx
import { getThemeStyles } from '@/lib/utils/theme';

function Playground() {
  // In production, this comes from event.brandColor in DB
  const brandColor = 'oklch(0.45 0.12 35)';  // Warm brown for playground
  
  return (
    <div 
      className="min-h-screen bg-black p-8 text-white theme-root"
      style={getThemeStyles(brandColor)}
    >
      <div className="mx-auto max-w-2xl">
        <TicketsPanel {...props} />
      </div>
    </div>
  );
}
```

**Why:**

- Theme context wraps the entire panel
- All child components inherit theme variables
- Zero prop drilling needed
- Works identically in production event pages

---

## Phase 2: Fix Container Structure and Styling

**Why:** Luma's container has specific glassmorphism, padding, and header structure that we're missing.

### 2.1 Fix Container Border Radius and Padding

**File:** `apps/frontrow/src/features/ticket-panel/components/TicketsPanel.tsx`

**Action:** Update container classes to match Luma exactly

**Line 166 - Change from:**

```tsx
<Card className="rounded-sm bg-card/80 shadow-lg ring-1 ring-border backdrop-blur-[16px]">
```

**To:**

```tsx
<Card className="rounded-xl bg-white/32 shadow-[0_1px_4px_rgba(0,0,0,0.1)] border border-white/16 backdrop-blur-[16px] overflow-hidden">
```

**Why:**

- `rounded-xl` = 12px (Luma actual)
- `bg-white/32` = exact Luma glassmorphism (32% white)
- `shadow-[0_1px_4px_rgba(0,0,0,0.1)]` = Luma's exact shadow
- `border border-white/16` = subtle 16% white border
- `overflow-hidden` = prevents content overflow with tinted header

**Note:** In dark mode, this would be `bg-black/32` with similar opacity.

### 2.2 Add Tinted Header with Negative Margins

**File:** `apps/frontrow/src/features/ticket-panel/components/TicketsPanel.tsx`

**Action:** Replace CardHeader with custom tinted header

**Lines 167-171 - Change from:**

```tsx
<CardHeader className="min-h-lh border-border border-b py-2">
  <CardTitle>Get Tickets</CardTitle>
</CardHeader>
```

**To:**

```tsx
<div className="
  -mx-4 -mt-3 mb-3
  px-4 pt-2 pb-3
  bg-[var(--theme-accent-light)]
  border-b border-[var(--theme-accent-border)]
  rounded-t-[10px]
">
  <h2 className="text-sm font-medium text-[var(--theme-accent-muted)]">
    Get Tickets
  </h2>
  <p className="text-base text-[var(--theme-accent)] mt-1">
    Welcome! Please choose your desired ticket type:
  </p>
</div>
```

**Why:**

- Negative margins (`-mx-4 -mt-3`) make header bleed to container edges (Luma pattern)
- `bg-[var(--theme-accent-light)]` = 4% theme color tint
- Header is `text-sm` (14px), not `text-xl`
- Subtitle is `text-base` (16px), not `text-sm`
- Uses theme color variables for text colors

**Visual effect:** Header appears as a distinct colored section that bleeds edge-to-edge.

### 2.3 Fix Card Content Padding

**File:** `apps/frontrow/src/features/ticket-panel/components/TicketsPanel.tsx`

**Line 173 - Change from:**

```tsx
<CardContent className="px-3 py-4">
```

**To:**

```tsx
<div className="px-4 pt-0 pb-3">
```

**Why:**

- `px-4` = 16px horizontal (matches Luma)
- `pt-0` = no top padding (header margin handles this)
- `pb-3` = 12px bottom padding
- Remove CardContent wrapper (using plain div for precise control)

---

## Phase 3: Transform Tickets to Semantic Buttons

**Why:** Luma tickets are `<button>` elements with selection states, not static divs. This enables keyboard navigation and proper semantics.

### 3.1 Convert TicketCard to Button Element

**File:** `apps/frontrow/src/features/ticket-panel/components/TicketCard.tsx`

**Action:** Restructure entire component to use button as root

**Lines 69-152 - Major refactor:**

**Current structure:**

```tsx
<Card className={cardClasses}>
  <div className="flex items-start justify-between">
    {/* content */}
  </div>
</Card>
```

**New structure:**

```tsx
<button
  type="button"
  disabled={!uiState.isPurchasable}
  className={[
    'w-full px-3 py-2 text-left',
    'bg-[var(--theme-accent-light)] border border-transparent rounded-lg',
    'font-medium transition-all duration-300',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    // Selection state (KEY FEATURE)
    uiState.currentQty > 0 
      ? 'bg-[var(--theme-accent-light)] border-[var(--theme-accent)]'
      : 'hover:bg-[var(--theme-accent-light)]',
  ].join(' ')}
>
  <div className="flex items-start justify-between gap-2.5">
    {/* Left: title + price inline */}
    <div className="flex-1">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-medium text-base mr-1.5">{ticket.name}</span>
        <span className="font-medium text-base">{formatPrice(ticket.pricing)}</span>
      </div>
      
      {/* Description */}
      {ticket.description && (
        <div className="text-[13px] leading-[19.5px] mt-0.5 text-left text-[var(--theme-accent-muted)]">
          {ticket.description}
        </div>
      )}
      
      {/* Status dot + label */}
      {ticket.availabilityLabel && (
        <div className="flex items-center gap-1.5 text-[13px] mt-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--theme-accent)]" />
          <span className="text-[var(--theme-accent-muted)]">{ticket.availabilityLabel}</span>
        </div>
      )}
    </div>
    
    {/* Right: Stepper (when qty > 0) */}
    {uiState.currentQty > 0 && (
      <div className="flex items-center gap-2">
        <QuantityStepper {...stepperProps} />
      </div>
    )}
  </div>
</button>
```

**Why:**

- Entire ticket is a semantic `<button>` (Luma pattern)
- Selection state: `currentQty > 0` adds border and darker background
- Title and price on same row (Luma layout)
- Text sizes match Luma exactly (16px title/price, 13px description)
- Uses theme color variables for all colors
- Disabled state for sold out/unavailable tickets

**Selection Visual:**

- Unselected: Subtle light background, no border
- Selected (qty > 0): Darker background + colored border

### 3.2 Update TicketList Spacing

**File:** `apps/frontrow/src/features/ticket-panel/components/TicketList.tsx`

**Line 20 - Change from:**

```tsx
<div className="space-y-3" data-testid="ticket-list">
```

**To:**

```tsx
<div className="space-y-2" data-testid="ticket-list">
```

**Why:** Luma uses 8px gap between tickets (`space-y-2`), not 12px.

---

## Phase 4: Fix Typography Sizes

**Why:** Current implementation follows the spec which oversized everything. Luma uses smaller, tighter typography.

### 4.1 Update TicketPrice Component

**File:** `apps/frontrow/src/features/ticket-panel/components/TicketPrice.tsx`

**Action:** Change price display to match ticket name size and remove vertical stacking

**Lines 68-109 - Change from:**

```tsx
<div className="flex items-center">
  <div className="flex items-baseline gap-2">
    <span className="font-semibold text-lg">
      {formatMoney(unit, pricing.ticket.currency)}
    </span>
  </div>
  {/* badges and popover */}
</div>
```

**To:**

```tsx
<span className="font-medium text-base">
  {formatMoney(unit, pricing.ticket.currency)}
</span>
```

**Why:**

- Luma shows price inline with name at same size (`text-base` = 16px)
- No vertical stacking needed
- `font-medium` (500) not `font-semibold` (600)
- Savings badge and info popover handled separately (keep these features)

**Note:** This component will be called from TicketCard's title row, not as separate right column.

### 4.2 Fix Status Dot Size

**File:** `apps/frontrow/src/components/ui/status-dot.tsx`

**Line 17 - Change from:**

```tsx
<span className={['h-1.5 w-1.5 rounded-full', colorClass].join(' ')} />
```

**To:**

```tsx
<span className={['h-2.5 w-2.5 rounded-full', colorClass].join(' ')} />
```

**Why:** Luma uses 9px dots (`w-2.5 h-2.5`), not 6px (`w-1.5 h-1.5`).

---

## Phase 5: Quantity Stepper Refinements

**Why:** Stepper needs subtle size and spacing adjustments to match Luma exactly.

### 5.1 Adjust Stepper Button Size and Padding

**File:** `apps/frontrow/src/features/ticket-panel/components/QuantityStepper.tsx`

**Lines 54-73 - Change button classes from:**

```tsx
className={[
  'flex items-center justify-center overflow-hidden rounded-sm border border-border',
  showControls ? 'h-[26px] w-[26px]' : 'h-[26px] w-0 opacity-0',
].join(' ')}
```

**To:**

```tsx
className={[
  'flex items-center justify-center overflow-hidden rounded-[4px] border border-[var(--theme-accent-subtle)]',
  'p-1.5 bg-[var(--theme-accent-light)]',
  showControls ? 'opacity-100' : 'w-0 opacity-0 pointer-events-none',
].join(' ')}
```

**Why:**

- `rounded-[4px]` = Luma's exact 4px radius
- `p-1.5` = 6px padding (Luma uses 5px, this is closest Tailwind)
- `bg-[var(--theme-accent-light)]` = themed background
- `border-[var(--theme-accent-subtle)]` = themed border at 48% opacity
- Remove fixed width, let padding define size

### 5.2 Adjust Quantity Display Width

**Lines 75-86 - Change from:**

```tsx
<span className={[
  'overflow-hidden text-center font-medium tabular-nums',
  showControls ? 'w-8 opacity-100' : 'w-0 opacity-0',
].join(' ')}>
```

**To:**

```tsx
<span className={[
  'overflow-hidden text-center font-medium tabular-nums',
  'min-w-9 px-2',
  showControls ? 'opacity-100' : 'w-0 opacity-0',
].join(' ')}>
```

**Why:** Luma uses `min-width: 36px` (`min-w-9`) for consistent stepper width.

---

## Phase 6: Cart Footer Modifications

**Why:** Make pricing breakdown configurable and adjust CTA button to match Luma dimensions.

### 6.1 Add Configuration Prop

**File:** `apps/frontrow/src/features/ticket-panel/components/TicketsPanel.tsx`

**Action:** Add `ui.showPricingBreakdown` option to props

**Lines 25-34 - Update interface:**

```tsx
interface TicketsPanelProps {
  eventId: string;
  event: Pick<Event, 'mixedTicketTypesAllowed' | 'currency' | 'timeZone'>;
  onCheckout: (cartItems: CartItem[], pricing: ServerPricing | undefined) => void;
  onChange?: (cartItems: CartItem[]) => void;
  ui?: { 
    showHeader?: boolean; 
    ctaLabel?: string;
    showPricingBreakdown?: boolean;  // NEW: Default true
  };
}
```

### 6.2 Make CartFooter Conditional

**File:** `apps/frontrow/src/features/ticket-panel/components/CartFooter.tsx`

**Action:** Add prop to conditionally show/hide pricing

**Add to props interface:**

```tsx
interface CartFooterProps {
  // ... existing props
  showPricingBreakdown?: boolean;  // Default: true
}
```

**Lines 58-115 - Wrap pricing section:**

```tsx
const renderPricing = () => {
  if (!(hasItems && pricing)) {
    return null;
  }
  
  return (
    <div className="space-y-3">
      {/* Show breakdown only if enabled */}
      {props.showPricingBreakdown !== false && (
        <div aria-atomic="true" aria-live="polite" className="space-y-1.5 text-sm">
          {/* existing pricing rows */}
        </div>
      )}
      
      <button
        className="h-[38px] w-full rounded-lg bg-[var(--theme-cta)] px-3.5 py-2.5 font-medium text-white transition-colors hover:brightness-110 disabled:opacity-50"
        disabled={isPricingLoading || !hasItems || isCheckoutDisabled}
        onClick={onCheckout}
        type="button"
      >
        {/* existing button content */}
      </button>
    </div>
  );
};
```

**Why:**

- Height changed from `h-11` (44px) to `h-[38px]` (Luma exact)
- Background uses `--theme-cta` variable (themed)
- `hover:brightness-110` matches Luma's hover effect
- Pricing breakdown is conditional based on prop
- Default is `true` (show breakdown) for better UX

### 6.3 Remove Footer Border-Top

**File:** `apps/frontrow/src/features/ticket-panel/components/CartFooter.tsx`

**Line 148 - Change from:**

```tsx
<div className="w-full border-border border-t bg-background/50 p-4">
```

**To:**

```tsx
<div className="w-full bg-background/50 px-4 pt-3 pb-4">
```

**Why:**

- Luma has no `border-top` on footer
- Padding matches Luma: 16px horizontal, 12px top, 16px bottom
- Spacing creates natural separation without border

---

## Phase 7: Featured Ticket Badge (Eye-Catching Overlay)

**Why:** Need a visually striking badge that looks like a print ad stamp, not a basic UI component.

### 7.1 Create Featured Badge Component

**File:** `apps/frontrow/src/features/ticket-panel/components/FeaturedBadge.tsx` (new file)

**Action:** Create SVG-based animated badge overlay

```tsx
export function FeaturedBadge({ label = 'Best Value' }: { label?: string }) {
  return (
    <div className="absolute -top-2 -right-2 z-10">
      {/* Glow effect underneath */}
      <div 
        className="absolute inset-0 blur-md opacity-60"
        style={{ background: 'var(--theme-cta)' }}
        aria-hidden="true"
      />
      
      {/* Badge SVG */}
      <svg 
        width="80" 
        height="80" 
        viewBox="0 0 80 80" 
        className="relative drop-shadow-lg"
      >
        {/* Star/burst shape */}
        <g transform="rotate(-15 40 40)">
          <circle 
            cx="40" 
            cy="40" 
            r="28" 
            fill="var(--theme-cta)"
            stroke="white"
            strokeWidth="2"
          />
          {/* Radial rays */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <line
              key={angle}
              x1="40"
              y1="40"
              x2={40 + Math.cos((angle * Math.PI) / 180) * 35}
              y2={40 + Math.sin((angle * Math.PI) / 180) * 35}
              stroke="white"
              strokeWidth="1.5"
              opacity="0.4"
            />
          ))}
        </g>
        
        {/* Text */}
        <text
          x="40"
          y="45"
          textAnchor="middle"
          className="text-[11px] font-bold fill-white uppercase tracking-wider"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          {label}
        </text>
      </svg>
    </div>
  );
}
```

**Why:**

- SVG allows complete visual control
- Glow effect creates "stamp" appearance
- Rotated for dynamic feel
- Uses theme CTA color
- Positioned absolute with negative offset (overlaps container edge)
- Much more eye-catching than flat badge component

### 7.2 Add Badge to Featured Tickets

**File:** `apps/frontrow/src/features/ticket-panel/components/TicketCard.tsx`

**Action:** Add badge at top of button (before content)

**Add after button opening tag:**

```tsx
{ticket.featured && uiState.currentQty === 0 && (
  <FeaturedBadge label="Best Value" />
)}
```

**Why:**

- Only show on unselected featured tickets (don't clutter selected state)
- Positioned absolute, won't affect layout
- Eye-catching visual cue

---

## Phase 8: Selection Highlight System

**Why:** Luma visually highlights selected tickets with darker background and border. This is the primary visual feedback.

### 8.1 Update computeTicketUI to Include Selection State

**File:** `apps/frontrow/src/features/ticket-panel/lib/computeTicketUI.ts`

**Action:** Add `isSelected` to UI state

**Add to TicketUIState interface (line 4):**

```typescript
export interface TicketUIState {
  ticketId: string;
  currentQty: number;
  isSelected: boolean;  // NEW: true when qty > 0
  isPurchasable: boolean;
  isLocked: boolean;
  // ... rest
}
```

**Add to return object (line 153):**

```typescript
return {
  ticketId: t.id,
  currentQty: qty,
  isSelected: qty > 0,  // NEW
  isPurchasable: purchasable,
  // ... rest
};
```

**Why:** Centralize selection state logic for consistency across components.

### 8.2 Apply Selection Classes

**Already handled in 3.1** - The button's conditional classes apply different background/border when `uiState.currentQty > 0`.

**Visual states:**

- **Unselected** (qty = 0): `bg-[var(--theme-accent-light)]` with transparent border
- **Selected** (qty > 0): Same background + `border-[var(--theme-accent)]` (visible colored border)
- **Hover** (unselected): Slightly darker background

---

## Phase 9: Update Component Integration

**Why:** Ensure all components reference theme variables correctly.

### 9.1 Pass showPricingBreakdown Through

**File:** `apps/frontrow/src/features/ticket-panel/components/TicketsPanel.tsx`

**Line 182-192 - Update CartFooter call:**

```tsx
<CartFooter
  cartState={cartState}
  checkoutDisabled={checkoutDisabled}
  ctaLabel={ui?.ctaLabel}
  showPricingBreakdown={ui?.showPricingBreakdown}  // NEW
  currency={event.currency}
  error={error}
  isPricingLoading={isPending}
  onCheckout={() => onCheckout(cartItemsArray, pricing)}
  onRetry={() => refetch()}
  pricing={pricing}
/>
```

### 9.2 Update Playground to Use Minimal Footer

**File:** `apps/frontrow/src/routes/ticket-playground.tsx`

**Action:** Test both configurations in playground

**Add toggle for testing:**

```tsx
function Playground() {
  const [showPricing, setShowPricing] = React.useState(true);
  const brandColor = 'oklch(0.45 0.12 35)';
  
  return (
    <div 
      className="min-h-screen bg-black p-8 text-white theme-root"
      style={getThemeStyles(brandColor)}
    >
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Toggle for testing */}
        <button 
          onClick={() => setShowPricing(!showPricing)}
          className="px-4 py-2 bg-white/20 rounded"
        >
          {showPricing ? 'Hide' : 'Show'} Pricing Breakdown
        </button>
        
        <TicketsPanel
          event={{
            mixedTicketTypesAllowed: true,
            currency: 'USD',
            timeZone: 'America/Los_Angeles',
          }}
          eventId="evt_123"
          ui={{ showPricingBreakdown: showPricing }}
          onCheckout={() => {}}
        />
      </div>
    </div>
  );
}
```

**Why:** Allows testing both minimal (Luma-style) and full (our enhancement) modes.

---

## Phase 10: Add Notice Text for Minimal Footer

**Why:** When pricing breakdown is hidden, we should show helpful notice text like Luma does.

### 10.1 Add Notice Prop to CartFooter

**File:** `apps/frontrow/src/features/ticket-panel/components/CartFooter.tsx`

**Add to interface:**

```typescript
interface CartFooterProps {
  // ... existing
  noticeText?: string;  // Optional notice below CTA
}
```

**Add after button in renderPricing:**

```tsx
<button className="h-[38px] ...">
  {ctaLabel || `Get ${pluralizeTickets(cartState?.totalQty ?? 0)}`}
</button>

{/* Notice text (optional, like Luma's wallet notice) */}
{props.noticeText && (
  <div className="flex items-center gap-2 text-[13px] text-[var(--theme-accent-muted)]">
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor">
      <circle cx="8" cy="8" r="6" strokeWidth="1.5" />
      <path d="M8 5v3M8 11h.01" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
    <span>{props.noticeText}</span>
  </div>
)}
```

**Why:** Luma shows helpful context below CTA (e.g., "You will be asked to verify token ownership...").

---

## Phase 11: Update Tests

**Why:** Tests need to reflect new button-based structure and configurable footer.

### 11.1 Update TicketCard Tests

**File:** `apps/frontrow/src/features/ticket-panel/components/__tests__/TicketCard.test.tsx`

**Action:** Update mock to expect button element

**Lines 10-32 - Update mock:**

```tsx
vi.mock('../QuantityStepper', () => ({
  QuantityStepper: ({ value, onIncrement, onDecrement }: any) => (
    <div data-testid="quantity-stepper">
      <button data-testid="increment-btn" onClick={onIncrement} type="button">+</button>
      <span data-testid="quantity-value">{value}</span>
      <button data-testid="decrement-btn" onClick={onDecrement} type="button">-</button>
    </div>
  ),
}));
```

**Add test for button semantics:**

```tsx
it('renders ticket as button element', () => {
  const ticket = createMockTicket();
  const uiState = createMockUIState({ isPurchasable: true });
  
  render(<TicketCard ticket={ticket} uiState={uiState} onIncrement={vi.fn()} onDecrement={vi.fn()} />);
  
  const buttons = screen.getAllByRole('button');
  const ticketButton = buttons.find(btn => btn.textContent?.includes('Test Ticket'));
  expect(ticketButton).toBeDefined();
  expect(ticketButton?.tagName).toBe('BUTTON');
});
```

### 11.2 Update CartFooter Tests

**File:** `apps/frontrow/src/features/ticket-panel/components/__tests__/CartFooter.test.tsx`

**Action:** Add tests for showPricingBreakdown prop

**Add new describe block:**

```tsx
describe('Pricing breakdown visibility', () => {
  it('shows pricing when showPricingBreakdown is true', () => {
    render(
      <CartFooter
        cartState={{ totalQty: 1, hasItems: true }}
        showPricingBreakdown={true}
        pricing={{
          subtotal: money(1000),
          fees: money(100),
          tax: money(80),
          total: money(1180),
        }}
        currency="USD"
        isPricingLoading={false}
        onCheckout={vi.fn()}
      />
    );
    
    expect(Boolean(screen.queryByText('Subtotal (1 ticket)'))).toBe(true);
  });
  
  it('hides pricing when showPricingBreakdown is false', () => {
    render(
      <CartFooter
        cartState={{ totalQty: 1, hasItems: true }}
        showPricingBreakdown={false}
        pricing={{
          subtotal: money(1000),
          fees: money(100),
          tax: money(80),
          total: money(1180),
        }}
        currency="USD"
        isPricingLoading={false}
        onCheckout={vi.fn()}
      />
    );
    
    expect(Boolean(screen.queryByText('Subtotal'))).toBe(false);
    expect(Boolean(screen.queryByText('Get ticket'))).toBe(true);
  });
});
```

---

## Phase 12: Documentation Updates

**Why:** Spec docs need to reflect the Luma-exact patterns we've discovered.

### 12.1 Update layout.md with Actual Luma Measurements

**File:** `context/tickets-panel/layout.md`

**Action:** Add section documenting actual Luma values

**Add before line 81:**

```markdown
## Luma Reference Measurements (Extracted from Source)

These are the ACTUAL measurements from Luma's production code:

**Container:**
- Padding: `12px 16px` (py-3 px-4)
- Border radius: `12px` (rounded-xl)
- Background: `rgba(255, 255, 255, 0.32)` (bg-white/32)
- Border: `1px solid rgba(255, 255, 255, 0.16)`
- Shadow: `0 1px 4px rgba(0, 0, 0, 0.1)`

**Header:**
- Font size: `14px` (text-sm)
- Font weight: `500` (font-medium)
- Padding: `8px 16px 12px`
- Negative margins: `-11px -15px 12px` (bleeds to edges)
- Background: `rgba(73, 35, 0, 0.04)` (4% theme color)

**Subtitle:**
- Font size: `16px` (text-base)
- Content: "Welcome! Please choose your desired ticket type:"

**Ticket Cards:**
- Element: `<button>` (semantic HTML)
- Padding: `8px 12px` (px-3 py-2)
- Gap between tickets: `8px` (space-y-2)
- Border radius: `8px` (rounded-lg)
- Background: `rgba(73, 35, 0, 0.04)` when unselected
- Border: `1px solid [theme-color]` when selected (qty > 0)

**Typography:**
- Ticket name: `16px / 500` (text-base font-medium)
- Ticket price: `16px / 500` (same as name)
- Description: `13px / 400` (text-[13px])
- Status label: `13px` (text-[13px])

**Status Dot:**
- Size: `9px × 9px` (w-2.5 h-2.5)

**CTA Button:**
- Height: `38px` (h-[38px])
- Padding: `10px 14px` (py-2.5 px-3.5)

**Stepper:**
- Button padding: `5px` (p-1.5 closest)
- Button radius: `4px` (rounded-[4px])
- Quantity min-width: `36px` (min-w-9)
```

### 12.2 Document Theming System

**File:** `context/tickets-panel/layout.md`

**Action:** Add theming section

**Add new section:**

````markdown
## Theming System (OKLCH Programmatic)

The ticket panel supports per-event theming using OKLCH color space.

### How It Works

1. **Database stores base color:**
   ```typescript
   event.brandColor = "oklch(0.45 0.12 35)"  // Warm brown
   ```

2. **Route loader injects theme:**
   ```tsx
   <div style={{ '--theme-accent': event.brandColor }}>
     <TicketsPanel />
   </div>
   ```

3. **CSS calculates variants automatically:**
   ```css
   --theme-accent-light: oklch(from var(--theme-accent) l c h / 0.04);
   --theme-cta: oklch(from var(--theme-accent) calc(l * 1.15) calc(c * 1.3) h);
   ```

4. **Components reference via Tailwind:**
   ```tsx
   className="bg-[var(--theme-accent-light)]"
   ```

### Available Theme Colors

- `--theme-accent`: Primary text color
- `--theme-accent-light`: 4% backgrounds
- `--theme-accent-border`: 8% borders
- `--theme-accent-muted`: 64% secondary text
- `--theme-accent-subtle`: 48% tertiary text
- `--theme-cta`: Brightened CTA button color

### Example Themes

**Warm Brown (Default):**
```typescript
brandColor: "oklch(0.45 0.12 35)"
````

**Cool Blue:**

```typescript
brandColor: "oklch(0.50 0.15 250)"
```

**Vibrant Purple:**

```typescript
brandColor: "oklch(0.55 0.20 310)"
```

```

---

## Implementation Order Summary

**Phase 1:** OKLCH theme foundation (CSS slots + utilities)

**Phase 2:** Container structure (border radius, padding, tinted header)

**Phase 3:** Tickets as buttons with selection state

**Phase 4:** Typography size corrections

**Phase 5:** Stepper refinements

**Phase 6:** Configurable footer

**Phase 7:** Featured badge overlay

**Phase 8:** Selection highlighting

**Phase 9:** Component integration

**Phase 10:** Notice text support

**Phase 11:** Test updates

**Phase 12:** Documentation

**Estimated Effort:** 6-8 hours of focused work

**Testing Checklist:**

- [ ] Theme colors inject correctly from playground
- [ ] Tickets are keyboard accessible (Tab, Enter, Space)
- [ ] Selection state shows visual border
- [ ] Featured badge overlays correctly
- [ ] Pricing breakdown toggles via prop
- [ ] All measurements match Luma reference
- [ ] Dark mode theme colors work correctly

---

## Future Expansion Path

**When you need full Luma theming:**

1. Add color calculation service:
   ```typescript
   generateLumaTheme(baseColor: string) → 88 CSS variables
   ```

2. Inject full variable set via `<style>` tag

3. No component changes needed (already using variables)

**Complexity:** ~1 day to build generator, instant per-event theming after that.

### To-dos

- [ ] Add OKLCH theme variable slots to index.css with CSS relative color calculations
- [ ] Create theme.ts utility with normalizeThemeColor and getThemeStyles functions
- [ ] Fix TicketsPanel container: rounded-xl, correct glassmorphism, overflow-hidden
- [ ] Replace CardHeader with tinted header using negative margins and theme colors
- [ ] Refactor TicketCard from div to button element with selection state styling
- [ ] Update all typography sizes to match Luma (header text-sm, price text-base, dots w-2.5)
- [ ] Adjust QuantityStepper button sizing, padding, and theming
- [ ] Add showPricingBreakdown prop and make CartFooter conditional
- [ ] Update CTA button to h-[38px] with theme-cta color and brightness hover
- [ ] Create FeaturedBadge component with SVG overlay and glow effect
- [ ] Add isSelected to TicketUIState and apply selection styling in TicketCard button
- [ ] Update ticket-playground with theme injection and pricing toggle
- [ ] Update TicketCard and CartFooter tests for button semantics and new props
- [ ] Update layout.md with actual Luma measurements and theming documentation