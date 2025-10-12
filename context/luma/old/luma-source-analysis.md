# Luma Source Code Analysis - Key Implementation Findings

This document captures additional implementation patterns discovered from analyzing Luma's actual HTML/CSS source code. These findings supplement the original implementation plan.

## 1. CSS Variable System Architecture

### Color Scale Implementation
Luma uses a **sophisticated 11-step color scale** with 4 variants for each step:

```css
/* Base color */
--gray-50: #9e9e9f;

/* Variants */
--gray-50-transparent: #9e9e9f00;      /* Fully transparent */
--gray-50-translucent: #9e9e9f40;      /* 25% opacity (40 in hex) */
--gray-50-thick-translucent: #9e9e9fcc; /* 80% opacity (cc in hex) */
```

**Key Finding**: The opacity values are standardized:
- `transparent`: 00 (0%)
- `translucent`: 40 (25%)
- `thick-translucent`: cc (80%)

**Steps**: 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100

### Brand Color System
Per-event brand colors are injected dynamically:

```css
--brand-50: #7646ad; /* Primary brand color */
--brand-color: #a471e3;
--brand-content-color: #975cdb;
--brand-bg-color: #7646ad;
--brand-active-color: #975cdb;
--brand-active-bg-color: #563081;
```

**Implementation Note**: Brand colors appear to be calculated from a base color (brand-50) with lighter/darker variants derived algorithmically.

## 2. Responsive Breakpoints

Luma uses **3 primary breakpoints**:

```css
@media (max-width: 450px) { /* Phone */ }
@media (max-width: 650px) { /* Tablet/Small Desktop */ }
@media (max-width: 800px) { /* Medium Desktop (less common) */ }
```

**Key Pattern**: Most responsive behavior happens at 450px and 650px. The 800px breakpoint is used sparingly for specific components.

**Width Queries**: Luma uses modern `(width <= 450px)` syntax alongside traditional `(max-width: 450px)`.

## 3. Glassmorphism & Backdrop Effects

### Navigation Implementation
```css
.nav-wrapper.sticky {
  border-bottom: 1px solid var(--opacity-0); /* Invisible initially */
  backdrop-filter: var(--backdrop-blur);
  position: fixed;
  z-index: 10;
}

.nav-wrapper.sticky.show-divider {
  border-bottom: 1px solid var(--divider-color); /* Shows on scroll */
}
```

**Backdrop Blur Values**:
```css
--backdrop-blur: blur(16px);
--high-legibility-backdrop-blur: blur(24px) contrast(50%) brightness(130%);
/* Dark mode variant */
--high-legibility-backdrop-blur: blur(24px) contrast(50%) brightness(70%);
```

## 4. Cover Image Glow Effect

### Dual-Layer Technique
```css
.cover-with-glow .cover-image img {
  transform: scale(1.005); /* Slight scale to prevent edge artifacts */
}

.cover-with-glow .cover-image-under {
  opacity: .2;
  filter: brightness(.8) blur(24px) saturate(1.2);
  mix-blend-mode: multiply;
  position: absolute;
  top: 1rem; /* Offset from top */
  transform: translate(0);
}

/* Dark mode variant */
.theme-root.dark .cover-with-glow .cover-image-under {
  opacity: .3;
  filter: brightness(.7) blur(24px) saturate(1.2);
}
```

**Key Details**:
- Uses `mix-blend-mode: multiply` for the glow layer
- Different opacity/brightness in dark mode
- 1rem top offset creates depth
- 24px blur with 1.2x saturation boost

## 5. Animation & Transition System

### Standardized Timing
```css
--transition-duration: .3s;
--fast-transition-duration: .2s;
--slow-transition-duration: .6s;
--transition-fn: cubic-bezier(.4, 0, .2, 1); /* Material Design easing */
--bounce-transition-fn: cubic-bezier(.54, 1.12, .38, 1.11);
```

### Preset Transitions
```css
--transition: all var(--transition-duration) var(--transition-fn);
--bounce-transition: all var(--transition-duration) var(--bounce-transition-fn);
--fast-transition: all var(--fast-transition-duration) var(--transition-fn);
--slow-transition: all var(--slow-transition-duration) var(--transition-fn);
```

## 6. Typography System

### Font Sizes
```css
--font-size-xxxl: 2.5rem;   /* 40px */
--font-size-xxl: 2rem;      /* 32px */
--font-size-xl: 1.5rem;     /* 24px */
--font-size-lg: 1.125rem;   /* 18px */
--font-size-md: 1rem;       /* 16px */
--font-size-sm: 0.875rem;   /* 14px */
--font-size-xs: 0.75rem;    /* 12px */
--font-size-xxs: 0.6875rem; /* 11px */
--font-size-xxxs: 0.625rem; /* 10px */
```

### Font Weights
```css
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-bold: 600;
```

### Line Heights
```css
--reduced-line-height: 1.2;
--title-line-height: 1.3;
--reduced-title-line-height: 1.1; /* For large titles */
```

### Title Component Pattern
```css
.title {
  font-size: 3rem;
  font-family: var(--title-font);
  line-height: var(--reduced-title-line-height);
  word-break: break-word;
}

/* Responsive scaling */
@media (width <= 1000px) { .title { font-size: 2.5rem; } }
@media (width <= 820px)  { .title { font-size: 2.25rem; } }
@media (width <= 650px)  { .title { font-size: 2rem; } }
@media (width <= 450px)  { .title { font-size: 1.75rem; } }
```

## 7. Shadow System

### Light Mode Shadows
```css
--light-shadow-xs: 0 1px 4px rgba(0, 0, 0, .1);
--light-shadow-sm: 0 1px 3px rgba(0, 0, 0, .02), 0 2px 7px rgba(0, 0, 0, .03),
                   0 3px 14px rgba(0, 0, 0, .04), 0 7px 29px rgba(0, 0, 0, .05),
                   0 20px 80px rgba(0, 0, 0, .06);
--light-shadow: /* 5-layer shadow for depth */
--light-shadow-lg: /* Larger version */
--light-shadow-xl: /* Largest version */
```

### Dark Mode Overrides
```css
.theme-root.dark {
  --shadow-xs: 0 1px 4px rgba(0, 0, 0, .25);
  /* Stronger shadows in dark mode for better contrast */
}
```

### Modal Shadow
```css
--shadow-modal: 0 0 0 1px var(--opacity-8),        /* Subtle border */
                0 3px 3px rgba(0, 0, 0, .03),      /* Close shadow */
                0 8px 7px rgba(0, 0, 0, .04),      /* Mid shadow */
                0 17px 14px rgba(0, 0, 0, .05),    /* Far shadow */
                0 35px 29px rgba(0, 0, 0, .06),    /* Very far shadow */
                0px -4px 4px 0px rgba(0, 0, 0, .04) inset; /* Subtle inset */
```

**Pattern**: Multi-layer shadows with increasing blur radius and offset for realistic depth.

## 8. Avatar System

### Gradient Fallbacks
```css
/* 7 gradient patterns for missing avatars */
.avatar-wrapper .missing-0 { background: linear-gradient(120deg, #ff5f6d, #ffc371); }
.avatar-wrapper .missing-1 { background: linear-gradient(120deg, #4ca1af, #c4e0e5); }
.avatar-wrapper .missing-2 { background: linear-gradient(120deg, #4568dc, #b06ab3); }
.avatar-wrapper .missing-3 { background: linear-gradient(120deg, #7b4397, #dc2430); }
.avatar-wrapper .missing-4 { background: linear-gradient(120deg, #56ab2f, #a8e063); }
.avatar-wrapper .missing-5 { background: linear-gradient(120deg, #ee9ca7, #ffdde1); }
.avatar-wrapper .missing-6 { background: linear-gradient(120deg, #2193b0, #6dd5ed); }
```

### Avatar Cutout (Stacked Heads)
```css
.heads .head:not(:last-child) .avatar-wrapper {
  mask-image:
    url('data:image/svg+xml,<svg>...<circle r="0.5" cx="0.5" cy="0.5"/></svg>'),
    url('data:image/svg+xml,<svg>...<circle r="0.6" cx="1.1" cy="0.5"/></svg>');
  -webkit-mask-composite: source-out;
  mask-composite: subtract;
}
```

**Pattern**: Uses SVG masks to create overlapping avatar effect.

## 9. Layout Patterns

### Page Structure
```css
.page-wrapper {
  background-color: var(--page-bg-color);
  min-height: 100dvh; /* Uses dvh for mobile viewport */
  padding-bottom: 4rem;
}

.page-content.sticky-topnav {
  padding-top: calc(3.25rem + 1px); /* Accounts for nav height + border */
}
```

### Card System
```css
.base-11-card {
  padding: var(--event-card-padding);
  background-color: var(--one-to-one-card-bg-color);
  border: 1px solid var(--one-to-one-card-border-color);
  border-radius: var(--card-border-radius);
  backdrop-filter: var(--card-backdrop-filter);
  box-shadow: var(--one-to-one-card-shadow);
}
```

**Key Finding**: Cards use both backdrop-filter AND background-color for glassmorphism effect.

## 10. CSS-in-JS Pattern

Luma uses **scoped inline styles** with unique IDs:

```html
<style id="__jsx-3384040117">
  .nav-wrapper.jsx-3384040117 { /* styles */ }
  .sticky.jsx-3384040117 { /* styles */ }
</style>
```

**Pattern**: Each component gets a unique hash for style scoping.

## 11. Shimmer Loading Effect

```css
@keyframes shimmer {
  0%   { background-position: -568px 0; }
  100% { background-position: 568px 0; }
}

.shimmer {
  background: var(--shimmer-gradient);
  background-size: 1200px 104px;
  animation: shimmer 1.2s linear infinite;
}

--shimmer-gradient: linear-gradient(
  to right,
  var(--pale-gray) 8%,
  var(--faint-gray) 18%,
  var(--pale-gray) 33%
);
```

## 12. Utility Classes

### Text Utilities
```css
.text-ellipses {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.lux-line-clamp {
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  display: -webkit-box;
  overflow: hidden;
}

.text-balance {
  text-wrap: balance; /* Modern CSS for better text wrapping */
}
```

### Font Features
```css
.mono-number {
  font-variant-numeric: tabular-nums; /* Monospaced numbers */
}

.high-legibility {
  font-feature-settings: "ss06" on; /* Stylistic set 6 */
}

.text-datetime {
  font-feature-settings: "ss01" on, "ss02" on;
}
```

## Implementation Recommendations

### 1. Token System Refinement
Update the token system in the plan to include:
- Opacity variants (transparent, translucent, thick-translucent)
- RGB base values for rgba() usage
- Separate light/dark mode shadow definitions

### 2. Component-Specific Variables
Create component-scoped CSS variables:
```css
/* Card component */
--card-border-radius: 12px;
--card-padding: 1rem;
--card-backdrop-filter: blur(16px);
```

### 3. Responsive Title Scaling
Implement fluid typography with 4 breakpoints for titles rather than fixed sizes.

### 4. Animation Presets
Create semantic animation tokens:
```css
--duration-instant: 100ms;
--duration-fast: 200ms;
--duration-normal: 300ms;
--duration-slow: 600ms;
--easing-standard: cubic-bezier(.4, 0, .2, 1);
--easing-bounce: cubic-bezier(.54, 1.12, .38, 1.11);
```

### 5. Multi-Layer Shadows
Use the multi-layer shadow approach for depth rather than single box-shadow declarations.

### 6. Glassmorphism Pattern
Always combine:
- `backdrop-filter: blur(Npx)`
- Semi-transparent background color (use -translucent variant)
- Subtle border (1px solid var(--opacity-light))

## Notable Differences from Original Plan

1. **More Color Steps**: Original plan suggested 9 steps, Luma uses 11
2. **Opacity Variants**: Original plan didn't include the 4-variant system
3. **Shadow Complexity**: Original plan used simple shadows, Luma uses multi-layer
4. **Breakpoints**: Original plan suggested 768px, Luma uses 650px
5. **Backdrop Blur**: More sophisticated filters with contrast/brightness adjustments
6. **Cover Glow**: Uses mix-blend-mode multiply (not in original plan)

## Files to Update

Based on this analysis, update:
1. `/context/luma/luma-plan.md` - Enhance Phase 1 token system
2. Token definitions to match Luma's 11-step + 4-variant pattern
3. Shadow system to use multi-layer approach
4. Responsive breakpoints from 768px to 650px
5. Glassmorphism implementation to include backdrop-filter refinements
