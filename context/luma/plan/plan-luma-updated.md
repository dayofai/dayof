# Luma-Inspired Event Page Greenfield Implementation Plan

## Context & Analysis

### Terminology & URL Patterns

We standardize on handle for URL identifiers. All new examples and APIs in this plan adopt handle over slug.

- Canonical term: “handle” (not “slug”)
- Route pattern: `/$orgHandle/$eventHandle`
- Param names: `orgHandle`, `eventHandle`
- Data fields: prefer `event.handle`, `org.handle`
- Legacy note: older snippets may still show “slug”; treat those as “handle” and update when touching code.

Example route (production page):

```tsx
// apps/frontrow/src/routes/$orgHandle/$eventHandle.tsx
export const Route = createFileRoute("/$orgHandle/$eventHandle")({
  // ...
});
```

Example link:

```tsx
<Link to="/$orgHandle" params={{ orgHandle: event.host.handle }}>
  {event.host.name}
</Link>
```

Example canonical URL template:

```ts
`https://dayof.com/${org.handle}/${event.handle}`;
```

### Current State Issues

1. **Typography wrapper component** - Plan-ui.md explicitly states to remove this (Section 5)
2. **No token system** - Using hardcoded Tailwind classes instead of Luma's layered CSS variable system
3. **No vendor/adapter separation** - Components directly use UI primitives
4. **Basic layout** - Missing Luma's sophisticated two-column sticky sidebar pattern
5. **No visual effects** - Missing glassmorphism, glow effects, hover micro-interactions
6. **Limited responsiveness** - Only basic responsive, not Luma's 3-breakpoint strategy

### Luma's Key Differentiators (from luma-design-analysis.md)

1. **Deeply layered theming** - 88 color variables per theme with OKLCH color space
2. **Glassmorphism navigation** - Frosted glass effect with backdrop blur
3. **Image glow effect** - Dual-layer image with blur/blend-mode underneath
4. **Two-column sticky layout** - 330px sidebar, responsive collapse at 650px
5. **Consistent card patterns** - Reusable card structure with semantic tokens
6. **Hover micro-interactions** - Transform animations, chevron movements
7. **Avatar patterns** - Overlapping heads with z-index, 7 fallback gradients

## Implementation Plan

### Phase 1: Foundation & Architecture (Alignment with plan-ui.md)

#### 1.1 Directory Restructure

Create the per-app foundation structure:

```none
apps/frontrow/src/
  design/
    tokens.css              # Luma token system (@theme inline)
  vendor/
    radix/                  # Scoped @radix-ui/react-* packages
    reui/                   # ReUI/BaseUI components (read-only)
    shadcn/                 # Sanctioned shadcn components
  ui/
    button.tsx              # Adapter with variants
    input.tsx               # Adapter
    menu.tsx                # Adapter
    dialog.tsx              # Adapter
    toaster.tsx             # Sonner adapter (rename from sonner.tsx)
    card.tsx                # Adapter
  features/
    layout/
      Navigation.tsx        # Glassmorphism nav
      Footer.tsx            # Move existing
      devtools/             # Move devtools here
    event/
      components/
        CoverImage.tsx      # With glow effect
        TitleBlock.tsx      # Native h1, time tags
        MetaInfo.tsx        # Icon + content rows
        RegistrationCard.tsx  # Multi-state CTA
        HostCard.tsx        # Avatar patterns
        AttendeesCard.tsx
        MapEmbed.tsx        # Blur/reveal
      index.tsx             # Layout orchestration
  routes/
    $orgHandle/
      $eventHandle.tsx        # Nested route pattern
```

**Understanding the 3-Layer Architecture:**

This structure enforces **vendor isolation** to protect against upstream churn:

1. **`src/vendor/`** - Read-only vendor code

   - ReUI/BaseUI primitives (Button, Input, Select, Dialog)
   - shadcn components (copied at specific commit, never modified)
   - Radix UI primitives (installed via npm, pinned to v1.x)
   - **Never imported directly by features**

2. **`src/ui/`** - Adapter layer (your code)

   - Wraps vendor primitives with stable API
   - Defines variants (`brand`, `primary`, `secondary`, `outline`, `ghost`, `destructive`)
   - Defines sizes (`sm`, `md`, `lg`, `icon`)
   - Enforces a11y defaults (`type="button"`, required `aria-label` for icons)
   - **Only layer that imports from `src/vendor/`**

3. **`src/features/`** - Domain UI (your code)
   - Event page components, layout, auth flows
   - Imports **only** from `@/ui/*` and `@/lib/*`
   - Never touches vendor code directly
   - Protected from vendor breaking changes

**Example Flow:**

```tsx
// ❌ WRONG - Feature imports vendor directly
// src/features/event/components/TitleBlock.tsx
import { Button } from "@/vendor/shadcn/button"; // FORBIDDEN

// ✅ CORRECT - Feature imports adapter
import { Button } from "@/ui/button"; // Adapter handles vendor

// src/ui/button.tsx (adapter)
import { Button as RadixButton } from "@/vendor/radix/button"; // OK here
export function Button({ variant, size, ...props }) {
  // Map your stable API to vendor props
  return <RadixButton className={variants({ variant, size })} {...props} />;
}
```

**Why This Matters:**

- When Radix releases v2.0 with breaking changes, you only update `src/ui/button.tsx`
- Your 50+ feature components using `<Button>` don't need changes
- Vendor churn is absorbed by the adapter layer

**Adapter Public API Specifications:**

Each adapter in `src/ui/` must define a **stable, documented API** that features depend on:

**Button Adapter** (`src/ui/button.tsx`):

```typescript
interface ButtonProps {
  variant?:
    | "brand"
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "link"
    | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  type?: "button" | "submit" | "reset"; // Defaults to 'button'
  asChild?: boolean; // For router Link composition
  "aria-label"?: string; // Required when size='icon'
}
```

**Card Adapter** (`src/ui/card.tsx`):

```typescript
// Use shadcn Card primitives directly (Section 3.4)
export {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/vendor/shadcn/card";

// Common patterns:
// - Glassmorphism: className="bg-card/80 backdrop-blur-[16px]"
// - Ring: className="ring-1 ring-border"
```

**Input Adapter** (`src/ui/input.tsx`):

```typescript
interface InputProps {
  size?: "sm" | "md" | "lg";
  error?: boolean; // Shows error state
  "aria-invalid"?: boolean; // Accessibility
  "aria-describedby"?: string; // Link to error message
}
```

**Dialog/Sheet Adapter** (`src/ui/dialog.tsx`, `src/ui/sheet.tsx`):

- Must use Radix Dialog primitive
- Include `aria-label` or `aria-labelledby` on root
- Trap focus within modal
- Close on Escape key

**Toaster Adapter** (`src/ui/toaster.tsx`):

- Uses Sonner (https://sonner.emilkowal.ski/)
- Mount `<Toaster />` once in root layout
- Consume via `toast(...)` function in features
- No `next-themes` dependency; theme via CSS tokens

**A11y Requirements (Enforced in Adapters):**

1. **Icon-only buttons MUST have `aria-label`**

   ```tsx
   // ✅ TypeScript enforces this
   <Button size="icon" aria-label="Close menu">
     <X className="h-4 w-4" />
   </Button>
   ```

2. **Buttons default `type="button"`**

   - Prevents accidental form submission
   - Must explicitly set `type="submit"` when needed

3. **Links with `target="_blank"` require `rel="noopener"`**

   ```tsx
   <Button asChild>
     <a href={url} target="_blank" rel="noopener noreferrer">
       Open
     </a>
   </Button>
   ```

4. **Focus rings via tokenized colors**
   - Use `ring-ring` token, not hardcoded colors
   - Visible on all interactive elements

#### 1.2 Token System (Tailwind v4 + shadcn Pattern)

**Strategy:** Extend existing `apps/frontrow/src/index.css` with Luma-inspired tokens using the established pattern:

- Define HSL/RGB values in `:root` and `.dark` (themeable)
- Convert to full colors in `@theme inline` (available as Tailwind utilities)
- Use Tailwind opacity modifiers (`/25`, `/80`) instead of variant variables

Add to `apps/frontrow/src/index.css`:

```css
/* === ADD to existing :root === */
:root {
  /* Keep all existing shadcn tokens (--background, --foreground, etc.) */

  /* ADD: Glassmorphism & effects */
  --nav-bg-opacity: 0.8;
  --card-backdrop-blur: 16px;
  --glow-opacity: 0.2;

  /* ADD: Structural */
  --max-width: 820px;
  --max-width-wide: 960px;
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
  --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.06), 0 8px 32px rgba(0, 0, 0, 0.08),
    0 16px 64px rgba(0, 0, 0, 0.1);

  /* ADD: Animation tokens (Luma sophistication) */
  --duration-instant: 100ms;
  --duration-fast: 200ms;
  --duration-normal: 300ms;
  --duration-slow: 600ms;
  --easing-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --easing-bounce: cubic-bezier(0.54, 1.12, 0.38, 1.11);

  /* Preset transitions */
  --transition: all var(--duration-normal) var(--easing-standard);
  --transition-fast: all var(--duration-fast) var(--easing-standard);
  --transition-bounce: all var(--duration-normal) var(--easing-bounce);

  /* ADD: Component-specific */
  --card-glow-opacity: var(--glow-opacity);
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

**Key Differences from Luma:**

- ✅ **Simpler:** Extends existing shadcn tokens instead of 88+ variables
- ✅ **Tailwind-native:** Use `bg-card/80` instead of `--card-bg-translucent`
- ✅ **Maintainable:** Follows established frontrow pattern
- ✅ **Powerful:** Still achieves all Luma visual effects

**⚠️ IMPORTANT - Tailwind v4 Token Placement Rules:**

- **`@theme` tokens** MUST be top-level, never nested under `.dark` or other selectors
- Keep **Tailwind-facing tokens** (shadows, easing, radii - things that generate utilities) in `@theme`
- Keep **CSS-only variables** (flags, opacity values that don't need utilities) in `:root` / `.dark`
- For dark mode: Switch values using CSS variables in `:root` / `.dark`, NOT by placing alternate values in `@theme`

```css
/* ✅ CORRECT */
@theme inline {
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.02); /* Same for all themes */
}

:root {
  --glow-opacity: 0.2;
}

.dark {
  --glow-opacity: 0.3; /* Override in dark mode */
}

/* ❌ WRONG - Never do this */
.dark {
  @theme {
    --shadow-sm: ...; /* @theme cannot be nested! */
  }
}
```

#### 1.3 Remove Typography Component

**DELETE**: `apps/frontrow/src/components/ui/typography.tsx`

**Rationale**: plan-ui.md Section 5 explicitly states:

> "Typography: no wrapper components; apply utilities/tokens to native tags (h1, h2, p, time). typographyVariants is not native to shadcn/ReUI/BaseUI; do not keep it."

Replace with utility classes applied directly to native HTML:

```tsx
// L Old way
<Typography variant="h1">Event Title</Typography>

//  New way
<h1 className="text-[3rem] leading-[110%] font-normal antialiased md:text-[1.75rem]">
  Event Title
</h1>
```

#### 1.4 Biome Import Restriction

Add to `biome.json`:

```json
{
  "linter": {
    "rules": {
      "correctness": {
        "noRestrictedImports": {
          "level": "error",
          "options": {
            "paths": {
              "@/vendor/*": "Import adapters from @/ui/* instead. Vendor imports are restricted to adapter layer only."
            }
          }
        }
      }
    }
  }
}
```

**Why Import Discipline Matters:**

This Biome rule **enforces the 3-layer architecture** at compile time:

**What's forbidden:**

```tsx
// ❌ Feature importing vendor directly
// src/features/event/components/TitleBlock.tsx
import { Button } from "@/vendor/shadcn/button";
import * as Dialog from "@radix-ui/react-dialog";

// Build fails with:
// "Import adapters from @/ui/* instead. Vendor imports are restricted to adapter layer only."
```

**What's allowed:**

```tsx
// ✅ Feature importing adapter
// src/features/event/components/TitleBlock.tsx
import { Button } from "@/ui/button";
import { Dialog } from "@/ui/dialog";
import { formatDate } from "@/lib/utils";

// ✅ Adapter importing vendor
// src/ui/button.tsx
import { Button as ShadcnButton } from "@/vendor/shadcn/button";
```

**Enforcement Strategy:**

1. **Biome rule blocks vendor imports** in `src/features/**`
2. **CI fails** if rule is violated (no merge possible)
3. **Only `src/ui/**`can import from`src/vendor/**`**
4. **Features import only from `@/ui/*` and `@/lib/*`**

**Benefits:**

- **Vendor upgrades isolated** - Change adapter, not 50 components
- **Breaking changes absorbed** - Adapter translates old API to new vendor API
- **Consistent API** - Features use stable `variant="brand"`, vendor details hidden
- **Team alignment** - No debate about which Button to import

**Allowed Import Paths by Directory:**

| Directory       | Can Import From                             | Cannot Import From          |
| --------------- | ------------------------------------------- | --------------------------- |
| `src/features/` | `@/ui/*`, `@/lib/*`, `react`, `@tanstack/*` | `@/vendor/*`, `@radix-ui/*` |
| `src/ui/`       | `@/vendor/*`, `@radix-ui/*`, `@/lib/*`      | _(no restrictions)_         |
| `src/vendor/`   | _(read-only, no modifications)_             | _(read-only)_               |

### Phase 2: Core Layout Components

#### 2.1 Glassmorphism Navigation

Create `apps/frontrow/src/features/layout/Navigation.tsx`:

```tsx
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/icons/logo";
import { Calendar } from "lucide-react";

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "sticky top-0 z-50",
        "bg-background/80 backdrop-blur-[16px]", // Glassmorphism
        "transition-all duration-300",
        scrolled && "border-b border-border"
      )}
    >
      <div className="mx-auto max-w-[820px] flex items-center justify-between px-4 py-4 md:px-6">
        {/* Logo - icon on mobile, wordmark on desktop */}
        <Logo className="h-8 w-8 md:w-32" />

        {/* Time widget (desktop only) */}
        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <time dateTime="2025-10-09T19:00">Thu, Oct 9 · 7:00 PM</time>
        </div>
      </div>
    </nav>
  );
}
```

**Changes from Luma:**

- ✅ Use Tailwind opacity (`bg-background/80`) instead of CSS variables
- ✅ Use Tailwind breakpoints (`md:`) instead of custom 651px
- ✅ Use shadcn color tokens (`text-muted-foreground`, `border-border`)
- ✅ Direct backdrop-blur value (Tailwind v4 supports this)

#### 2.2 Two-Column Layout Structure

Create `apps/frontrow/src/features/event/index.tsx`:

```tsx
import { Navigation } from "@/features/layout/Navigation";
import { CoverImage } from "./components/CoverImage";
import { TitleBlock } from "./components/TitleBlock";
import { RegistrationCard } from "./components/RegistrationCard";
import { AboutSection } from "./components/AboutSection";
import { LineupSection } from "./components/LineupSection";
import { VenueSection } from "./components/VenueSection";
import { HostCard } from "./components/HostCard";
import { Button } from "@/ui/button"; // ReUI adapter

export default function EventPage({ eventHandle }: { eventHandle: string }) {
  // NOTE: Use QueryCollection pattern from plan-ui.md
  const event = useLiveQuery((q) =>
    q.from({ event: getEventCollection(eventHandle) }).select({
      title: true,
      coverImage: true,
      date: true,
      price: true,
      // ... fields
    })
  );

  return (
    <div className="min-h-dvh bg-background">
      {" "}
      {/* dvh = dynamic viewport height */}
      <Navigation />
      {/* Two-column container */}
      <div className="mx-auto max-w-[820px] px-4 py-10 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
          {/* Sidebar - sticky on desktop */}
          <aside className="md:sticky md:top-24 md:h-fit md:w-[330px] md:self-start">
            <CoverImage src={event.coverImage} alt={event.title} />

            {/* Desktop-only content */}
            <div className="hidden md:block mt-6 space-y-4">
              <TopTrack />
              <AsideInfoNote />
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 space-y-6">
            <TitleBlock event={event} />
            <RegistrationCard event={event} />
            <AboutSection event={event} />
            <LineupSection event={event} />
            <VenueSection event={event} />
            <HostCard event={event} />
          </main>
        </div>
      </div>
      {/* Mobile sticky CTA */}
      <div className="md:hidden fixed bottom-0 inset-x-0 p-4 bg-background/95 backdrop-blur-[16px] border-t border-border">
        <Button variant="default" size="lg" className="w-full">
          Buy Tickets · from ${event.price}
        </Button>
      </div>
    </div>
  );
}
```

**Changes from Luma:**

- ✅ Use `min-h-dvh` (dynamic viewport height, better than `100vh` on mobile)
- ✅ Use Tailwind breakpoints (`md:`) instead of `min-[651px]:`
- ✅ Use Tailwind spacing (`gap-6`, `gap-8`) instead of CSS variables
- ✅ Use shadcn tokens (`bg-background/95`, `border-border`)
- ✅ Use ReUI Button via adapter (change `variant="brand"` to `variant="default"` per shadcn)

#### 2.3 Cover Image with Glow Effect

Create `apps/frontrow/src/features/event/components/CoverImage.tsx`:

```tsx
export function CoverImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative">
      {/* Glow layer (beneath, blurred) - with dark mode variant */}
      <div
        className="absolute top-4 inset-x-0 h-full rounded-xl opacity-20 dark:opacity-30"
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(24px) saturate(1.2) brightness(0.8)",
          mixBlendMode: "multiply",
          transform: "scale(1.005)", // Prevents edge artifacts
        }}
        aria-hidden="true"
      />

      {/* Main sharp image */}
      <img
        src={src}
        alt={alt}
        className="relative z-10 w-full aspect-square object-cover rounded-xl ring-1 ring-border/50"
        loading="eager"
        decoding="async"
        fetchPriority="high"
        // Responsive srcset (Luma pattern)
        srcSet={`
          ${src}?w=280&h=280&fit=cover&dpr=1 280w,
          ${src}?w=280&h=280&fit=cover&dpr=2 560w,
          ${src}?w=400&h=400&fit=cover&dpr=1 400w,
          ${src}?w=400&h=400&fit=cover&dpr=2 800w
        `}
        sizes="(max-width: 768px) 280px, (max-width: 1024px) 300px, 400px"
      />
    </div>
  );
}
```

**Changes from Luma:**

- ✅ Added `dark:opacity-30` for dark mode glow adjustment
- ✅ Use Tailwind `rounded-xl` instead of CSS variable
- ✅ Use `ring-border/50` for shadcn-compatible ring color
- ✅ Updated breakpoints to match Tailwind (`768px`, `1024px`)

### Phase 3: Event-Specific Components

**Semantic HTML Requirements:**

All event page components MUST use native HTML semantics with proper attributes:

**Required Elements & Attributes:**

1. **Event Title**

   - Use `<h1>` tag (not `<div>` or Typography wrapper)
   - Include `text-balance` utility for better text wrapping
   - One `<h1>` per page (heading hierarchy)

2. **Date/Time Information**

   - Use `<time>` element with `dateTime` attribute (ISO 8601 format)

   ```tsx
   <time dateTime="2025-10-09T19:00:00-04:00">
     Thu, Oct 9, 2025 · 7:00 PM EDT
   </time>
   ```

3. **Images**

   - Meaningful `alt` text for content images
   - Empty `alt=""` for decorative images
   - Include `width`/`height` or `aspect-ratio` to prevent CLS
   - Responsive `srcset` for cover images

4. **Links**

   - Use TanStack Router `<Link>` for internal navigation
   - External links: `target="_blank"` requires `rel="noopener noreferrer"`
   - Meaningful link text (not "click here")

5. **Buttons**

   - Navigation: Use `<Link asChild>` with Button
   - Actions: Use `<button type="button">`
   - Submit: Explicitly set `type="submit"`
   - Icon-only: Require `aria-label`

6. **Heading Hierarchy**
   - `<h1>` for event title (once)
   - `<h2>` for major sections (About, Lineup, Venue)
   - `<h3>` for subsections
   - No skipping levels (h1 → h3)

**JSON-LD Structured Data (SEO):**

Add structured data for rich search results. Place in route `head()` function:

```tsx
// apps/frontrow/src/routes/$orgHandle/$eventHandle.tsx
export const Route = createFileRoute("/$orgHandle/$eventHandle")({
  head: ({ loaderData }) => {
    const { event, org } = loaderData;

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Event",
      name: event.title,
      description: event.description,
      startDate: event.startDate, // ISO 8601: 2025-10-09T19:00:00-04:00
      endDate: event.endDate,
      eventStatus: event.isCancelled ? "EventCancelled" : "EventScheduled",
      eventAttendanceMode: event.isOnline
        ? "OnlineEventAttendanceMode"
        : "OfflineEventAttendanceMode",
      location: event.isOnline
        ? {
            "@type": "VirtualLocation",
            url: event.streamUrl,
          }
        : {
            "@type": "Place",
            name: event.venue.name,
            address: {
              "@type": "PostalAddress",
              streetAddress: event.venue.streetAddress,
              addressLocality: event.venue.city,
              addressRegion: event.venue.state,
              postalCode: event.venue.postalCode,
              addressCountry: event.venue.country,
            },
          },
      image: [
        event.coverImage, // Should be at least 1200x675px
      ],
      offers: {
        "@type": "Offer",
        url: `https://dayof.com/${org.handle}/${event.handle}`,
        price: event.price,
        priceCurrency: "USD",
        availability: event.soldOut ? "SoldOut" : "InStock",
        validFrom: event.salesStartDate,
      },
      organizer: {
        "@type": "Organization",
        name: org.name,
        url: `https://dayof.com/${org.handle}`,
      },
      performer: event.performers?.map((p) => ({
        "@type": "Person",
        name: p.name,
        url: p.url,
      })),
    };

    return {
      meta: [
        { title: `${event.title} | ${org.name}` },
        { name: "description", content: event.description },
        { property: "og:title", content: event.title },
        { property: "og:description", content: event.description },
        { property: "og:image", content: event.coverImage },
        { property: "og:type", content: "website" },
        {
          property: "og:url",
          content: `https://dayof.com/${org.handle}/${event.handle}`,
        },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: event.title },
        { name: "twitter:description", content: event.description },
        { name: "twitter:image", content: event.coverImage },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(jsonLd),
        },
      ],
    };
  },
  // ... loader, component
});
```

**Validation Tools:**

- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema.org Validator: https://validator.schema.org/
- JSON-LD Playground: https://json-ld.org/playground/

#### 3.1 Title Block (Native Semantics)

Create `apps/frontrow/src/features/event/components/TitleBlock.tsx`:

```tsx
import { ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function TitleBlock({ event }) {
  return (
    <div className="space-y-4">
      {/* Featured in badge (conditional) */}
      {event.calendarSeries && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-sm">
          <img
            src={event.calendarSeries.avatar}
            className="h-5 w-5 rounded"
            alt=""
          />
          <span>Featured in {event.calendarSeries.name}</span>
        </div>
      )}

      {/* Event title - NATIVE h1, no wrapper (plan-ui.md compliant) */}
      <h1 className="text-3xl md:text-5xl lg:text-6xl leading-[1.1] font-normal text-foreground text-balance">
        {event.title}
      </h1>

      {/* Host link with chevron animation */}
      <Link
        to="/$orgHandle"
        params={{ orgHandle: event.host.handle }}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 group"
      >
        {event.host.name}
        <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
```

**Changes from Luma:**

- ✅ Use Tailwind text sizes (`text-3xl md:text-5xl lg:text-6xl`) instead of rem values
- ✅ Use `text-balance` utility (added to index.css)
- ✅ Use TanStack Router `Link` instead of `<a>` (per plan-ui.md)
- ✅ Use shadcn tokens (`text-foreground`, `text-muted-foreground`)
- ✅ Direct duration values (`duration-200`) instead of CSS variables

#### 3.2 Meta Information Rows (Semantic HTML)

Create `apps/frontrow/src/features/event/components/MetaInfo.tsx`:

```tsx
export function MetaInfoRow({ icon: Icon, title, children }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5" aria-hidden="true" />
      <div className="flex-1">
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
        <div className="text-base text-foreground">{children}</div>
      </div>
    </div>
  );
}

// Usage in event page
<MetaInfoRow icon={Calendar} title="Date">
  <time dateTime="2025-10-09T19:00">
    Thursday, October 9, 2025 " 7:00 PM EDT
  </time>
</MetaInfoRow>

<MetaInfoRow icon={MapPin} title="Location">
  <a href={`https://maps.google.com/?q=${encodeURIComponent(event.venue.address)}`}
     target="_blank"
     rel="noopener noreferrer"
     className="hover:underline">
    {event.venue.name}
  </a>
</MetaInfoRow>
```

#### 3.3 Registration/CTA Card (Multi-State)

Create `apps/frontrow/src/features/event/components/RegistrationCard.tsx`:

```tsx
import { Button } from "@/ui/button";

export function RegistrationCard({ event }) {
  const renderCTA = () => {
    if (event.soldOut) {
      return (
        <Button variant="outline" size="lg" disabled className="w-full">
          Sold Out
        </Button>
      );
    }

    if (event.requiresApproval) {
      return (
        <Button variant="brand" size="lg" className="w-full">
          Request to Attend
        </Button>
      );
    }

    if (event.tokenGated) {
      return (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            Token Required: {event.tokenGating.collection}
          </div>
          <Button variant="brand" size="lg" className="w-full">
            Verify & Register
          </Button>
        </div>
      );
    }

    return (
      <Button variant="brand" size="lg" className="w-full">
        Buy Tickets " from ${event.price}
      </Button>
    );
  };

  return (
    <div className="rounded-xl p-6 bg-card/80 backdrop-blur-[16px] ring-1 ring-border shadow-[var(--shadow-sm)]">
      <div className="flex items-baseline justify-between mb-4">
        <span className="text-2xl font-semibold text-foreground">
          ${event.price}
        </span>
        {event.capacity && (
          <span className="text-sm text-muted-foreground">
            {event.attendees}/{event.capacity} attending
          </span>
        )}
      </div>

      {renderCTA()}
    </div>
  );
}
```

#### 3.4 Card Pattern (Use shadcn Card)

**Don't create custom ContentCard** - use shadcn Card components directly (per plan-ui.md):

```tsx
// Import shadcn Card primitives
import { Card, CardHeader, CardTitle, CardContent } from "@/ui/card";

// Usage in event components
<Card className="bg-card/80 backdrop-blur-[16px]">
  <CardHeader>
    <CardTitle>Hosted by</CardTitle>
  </CardHeader>
  <CardContent>{/* Card content */}</CardContent>
</Card>;
```

**For cards without titles:**

```tsx
<Card>
  <CardContent className="p-6">{/* Content */}</CardContent>
</Card>
```

**Glassmorphism variant:**

```tsx
<Card className="bg-card/80 backdrop-blur-[16px] shadow-[var(--shadow-sm)]">
  {/* ... */}
</Card>
```

**Why:** plan-ui.md specifies "Use shadcn 'dumb' components directly: Badge, Skeleton, Divider, **Card**"

#### 3.5 Host/Attendees Cards with Avatar Patterns

Create `apps/frontrow/src/features/event/components/HostCard.tsx`:

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/ui/card"; // shadcn
import { Button } from "@/ui/button"; // ReUI adapter
import { cn } from "@/lib/utils";

const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
  "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
];

export function HostCard({ host }) {
  const gradientIndex = host.id.charCodeAt(0) % FALLBACK_GRADIENTS.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hosted by</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {/* Avatar - square for calendars, round for individuals */}
          <div
            className={cn(
              "h-16 w-16 overflow-hidden flex items-center justify-center text-white font-semibold",
              host.type === "calendar" ? "rounded-lg" : "rounded-full"
            )}
            style={{
              background: host.avatar
                ? `url(${host.avatar}) center/cover`
                : FALLBACK_GRADIENTS[gradientIndex],
            }}
          >
            {!host.avatar && host.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1">
            <div className="font-medium text-foreground">{host.name}</div>
            {host.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {host.bio}
              </p>
            )}

            {/* Social links */}
            {host.social && (
              <div className="flex gap-2 mt-2">
                {host.social.twitter && (
                  <a
                    href={host.social.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <TwitterIcon className="h-4 w-4" />
                  </a>
                )}
                {/* ... other social links */}
              </div>
            )}
          </div>

          <Button variant="outline" size="sm">
            Follow
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Changes from Luma:**

- ✅ Use shadcn `Card` instead of custom `ContentCard`
- ✅ Use ReUI `Button` via adapter
- ✅ Use shadcn tokens (`text-foreground`, `text-muted-foreground`)
- ✅ Add `rel="noopener noreferrer"` for security (per plan-ui.md)

Create `apps/frontrow/src/features/event/components/AttendeesCard.tsx`:

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/ui/card";

export function AttendeesCard({ attendees, totalCount }) {
  const visibleCount = Math.min(attendees.length, 5);
  const overflow = totalCount - visibleCount;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendees</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {/* Overlapping avatar heads */}
          <div className="flex -space-x-2">
            {attendees.slice(0, visibleCount).map((attendee, i) => (
              <div
                key={attendee.id}
                className="h-10 w-10 rounded-full ring-2 ring-background overflow-hidden"
                style={{ zIndex: visibleCount - i }}
              >
                <img
                  src={attendee.avatar}
                  alt={attendee.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>

          <div className="text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? "person" : "people"} attending
            {overflow > 0 && ` (+${overflow} others)`}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Changes:** ✅ Use shadcn Card, ✅ Use `ring-background` and `text-muted-foreground` tokens

#### 3.6 Map Embed with Blur/Reveal

Create `apps/frontrow/src/features/event/components/MapEmbed.tsx`:

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/ui/card";
import { Button } from "@/ui/button";
import { Copy, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export function MapEmbed({ venue, isRegistered }) {
  return (
    <Card className="bg-card/80 backdrop-blur-[16px]">
      <CardHeader>
        <CardTitle>Location</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Address - blurred until registered */}
          <div
            className={cn(
              "text-base transition-all duration-[var(--dur-3)]",
              !isRegistered && "blur-sm select-none"
            )}
          >
            <p className="font-medium text-foreground">{venue.name}</p>
            <p className="text-muted-foreground">{venue.address}</p>
          </div>

          {/* Map embed */}
          <div className="relative aspect-video rounded-lg overflow-hidden">
            {isRegistered ? (
              <iframe
                src={`https://www.google.com/maps/embed/v1/place?key=YOUR_KEY&q=${encodeURIComponent(
                  venue.address
                )}`}
                className="w-full h-full border-0"
                loading="lazy"
                title="Venue map"
              />
            ) : (
              <div
                className="w-full h-full bg-muted blur-md"
                style={{
                  backgroundImage: `url(https://maps.googleapis.com/maps/api/staticmap?center=${venue.lat},${venue.lng}&zoom=14&size=600x300&key=YOUR_KEY)`,
                  backgroundSize: "cover",
                }}
              />
            )}

            {!isRegistered && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <Button variant="brand">Register to See Location</Button>
              </div>
            )}
          </div>

          {/* Copy address / Open in maps buttons */}
          {isRegistered && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(venue.address)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Address
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    venue.address
                  )}`}
                  target="_blank"
                  rel="noopener"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Open in Maps
                </a>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Phase 4: Visual Effects & Polish

#### 4.1 Hover State Micro-Interactions

Add to components with `group` pattern:

```tsx
// Button hover (in ReUI Button adapter)
<button
  className={cn(
    'transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)]',
    'hover:-translate-y-0.5 active:translate-y-0',
    'hover:shadow-[var(--shadow-md)] active:shadow-[var(--shadow-sm)]'
  )}
>
  {children}
</button>

// Chevron animation (already used in TitleBlock)
<ChevronRight className="transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5" />

// Card hover with primary ring
<Card className="transition-all duration-[var(--duration-normal)] hover:ring-2 hover:ring-primary">
  {/* ... */}
</Card>
```

**Using custom animation tokens (preferred for consistency and theming):**

```tsx
// Always use tokenized values for durations and easing
<div className="transition-all duration-[var(--duration-normal)] ease-[var(--easing-bounce)]">

// ❌ Avoid hardcoded values
<div className="transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
```

#### 4.2 Responsive Strategy (Tailwind-First)

**Use Tailwind breakpoints instead of custom hooks:**

```tsx
// ❌ Don't create useBreakpoint hook - use Tailwind classes
// ✅ Do this instead:

// Conditional rendering with Tailwind
<div className="hidden md:block">
  <TimeWidget />
</div>

// Responsive spacing
<div className="gap-4 md:gap-6 lg:gap-8">

// Responsive text
<h1 className="text-3xl md:text-5xl lg:text-6xl">
```

**Tailwind v4 breakpoints (default):**

- `sm:` 640px
- `md:` 768px (tablet)
- `lg:` 1024px (desktop)
- `xl:` 1280px
- `2xl:` 1536px

**Container queries (when needed):**

**⚠️ CRITICAL:** You MUST add `@container` to the parent element before using `@md:`, `@lg:` etc. variants on children. Forgetting this is a common bug that works in dev but breaks in production.

```tsx
{
  /* ✅ CORRECT - Parent has @container */
}
<div className="@container">
  <div className="@md:grid @md:grid-cols-2">
    {/* Responsive to container, not viewport */}
  </div>
</div>;

{
  /* ❌ WRONG - No @container on parent, @md: won't work */
}
<div>
  <div className="@md:grid @md:grid-cols-2">{/* This will NOT work! */}</div>
</div>;
```

### Phase 5: Data Integration & Performance

#### 5.1 Route Structure with QueryCollection

Create `apps/frontrow/src/routes/$orgHandle/$eventHandle.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { getEventCollection } from "@/lib/collections";
import EventPage from "@/features/event";

export const Route = createFileRoute("/$orgHandle/$eventHandle")({
  // Preload data before render
  loader: async ({ params }) => {
    const collection = getEventCollection(params.eventHandle);
    await collection.preload();
    return { eventHandle: params.eventHandle };
  },

  // Route-level head composition for SEO
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData.event.title} | ${loaderData.org.name}`,
      },
      {
        name: "description",
        content: loaderData.event.description,
      },
      // Open Graph
      { property: "og:title", content: loaderData.event.title },
      { property: "og:image", content: loaderData.event.coverImage },
      // ... more meta tags
    ],
  }),

  component: EventPageComponent,
});

function EventPageComponent() {
  const { eventHandle } = Route.useLoaderData();
  return <EventPage eventHandle={eventHandle} />;
}
```

#### 5.2 Data Loading Implementation (TanStack Query)

**⚠️ IMPORTANT:** `@tanstack/db` mentioned in plan-ui.md does not exist. Use **TanStack Query v5** instead.

**Strategy:**

- Route loader: Server-side fetch with streaming
- Client components: TanStack Query for reactive updates
- Prefetching: Related events on hover/focus

**Installation:**

```bash
bun add @tanstack/react-query@5 @tanstack/react-query-devtools@5
```

**1. Setup Query Client**

Create `apps/frontrow/src/lib/query-client.ts`:

```typescript
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

**2. Mount Provider in Root**

Update `apps/frontrow/src/router.tsx`:

```tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/query-client";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
```

**3. Event Query Hook**

Create `apps/frontrow/src/lib/queries/event.ts`:

```typescript
import { queryOptions, useQuery } from "@tanstack/react-query";

export interface Event {
  id: string;
  handle: string;
  title: string;
  description: string;
  coverImage: string;
  startDate: string;
  price: number;
  venue: {
    name: string;
    address: string;
    city: string;
    state: string;
  };
  host: {
    name: string;
    slug: string;
  };
  // ... other fields
}

// Query options factory (reusable for loader + component)
export const eventQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["event", slug],
    queryFn: async (): Promise<Event> => {
      const res = await fetch(`/api/events/${slug}`);
      if (!res.ok) throw new Error("Failed to fetch event");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

// Hook for components
export function useEvent(slug: string) {
  return useQuery(eventQueryOptions(slug));
}

// Prefetch utility
export async function prefetchEvent(slug: string) {
  await queryClient.prefetchQuery(eventQueryOptions(slug));
}
```

**4. Route Loader (Server-Side Fetch)**

Update `apps/frontrow/src/routes/$orgHandle/$eventHandle.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { eventQueryOptions } from "@/lib/queries/event";
import { queryClient } from "@/lib/query-client";

export const Route = createFileRoute("/$orgHandle/$eventHandle")({
  // Loader runs on server (SSR) or client (SPA navigation)
  loader: async ({ params }) => {
    // Prefetch event data - will populate TanStack Query cache
    await queryClient.ensureQueryData(eventQueryOptions(params.eventHandle));

    return { eventHandle: params.eventHandle };
  },

  component: EventPageComponent,
});

function EventPageComponent() {
  const { eventHandle } = Route.useLoaderData();
  const { data: event, isLoading, error } = useEvent(eventHandle);

  if (isLoading) return <EventPageSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (!event) return null;

  return <EventPage event={event} />;
}
```

**5. Component Usage (No Prop Drilling)**

Use the query hook directly in nested components:

```tsx
// apps/frontrow/src/features/event/components/TitleBlock.tsx
import { useEvent } from "@/lib/queries/event";
import { Route } from "@/routes/$orgHandle/$eventHandle"; // For params

export function TitleBlock() {
  const { eventHandle } = Route.useLoaderData();
  const { data: event } = useEvent(eventHandle); // Already cached from loader

  return (
    <div>
      <h1 className="text-3xl md:text-5xl lg:text-6xl leading-[1.1]">
        {event.title}
      </h1>
      <time dateTime={event.startDate}>{formatDate(event.startDate)}</time>
    </div>
  );
}
```

**6. Prefetching Related Events**

```tsx
// apps/frontrow/src/features/event/components/RelatedEventsRail.tsx
import { Link } from "@tanstack/react-router";
import { prefetchEvent } from "@/lib/queries/event";

export function RelatedEventsRail({
  relatedEvents,
}: {
  relatedEvents: Event[];
}) {
  const handlePrefetch = (slug: string) => {
    // Prefetch on hover/focus - instant navigation
    prefetchEvent(slug);
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {relatedEvents.map((event) => (
        <Link
          key={event.handle}
          to="/$orgHandle/$eventHandle"
          params={{ orgSlug: event.host.handle, eventHandle: event.handle }}
          preload="intent" // TanStack Router's built-in prefetch
          onMouseEnter={() => handlePrefetch(event.handle)}
          onFocus={() => handlePrefetch(event.handle)}
          className="group"
        >
          <img src={event.coverImage} alt={event.title} />
          <h3>{event.title}</h3>
        </Link>
      ))}
    </div>
  );
}
```

**Benefits Over Custom QueryCollection:**

- ✅ Battle-tested library (100k+ weekly downloads)
- ✅ Built-in devtools for debugging
- ✅ Automatic background refetching
- ✅ Request deduplication
- ✅ TypeScript-first
- ✅ Works with TanStack Router loaders

**Cache Invalidation:**

```typescript
// After successful ticket purchase
import { queryClient } from "@/lib/query-client";

async function buyTickets(eventHandle: string) {
  await fetch("/api/tickets", { method: "POST" /* ... */ });

  // Invalidate event query to refetch updated data
  await queryClient.invalidateQueries({
    queryKey: ["event", eventHandle],
  });
}
```

#### 5.3 Related Events Rail with Prefetch

Create `apps/frontrow/src/features/event/components/RelatedEventsRail.tsx`:

```tsx
import { Link } from "@tanstack/react-router";
import { getEventCollection } from "@/lib/collections";

export function RelatedEventsRail({ relatedEvents }) {
  const handlePrefetch = (eventHandle: string) => {
    getEventCollection(eventHandle).preload();
  };

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-semibold mb-6">You might also like</h2>

      {/* Horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible">
        {relatedEvents.map((event) => (
          <Link
            key={event.handle}
            to="/$orgHandle/$eventHandle"
            params={{ orgSlug: event.orgSlug, eventHandle: event.handle }}
            preload="intent"
            onMouseEnter={() => handlePrefetch(event.handle)}
            onFocus={() => handlePrefetch(event.handle)}
            className="snap-start shrink-0 w-64 md:w-auto group"
          >
            <div className="relative aspect-square rounded-lg overflow-hidden ring-1 ring-white/10 transition-all duration-[var(--duration-normal)] group-hover:ring-2 group-hover:ring-primary">
              <img
                src={event.coverImage}
                alt={event.title}
                className="w-full h-full object-cover transition-transform duration-[var(--duration-normal)] group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="font-medium text-white line-clamp-2">
                  {event.title}
                </p>
                <time className="text-sm text-white/70" dateTime={event.date}>
                  {formatDate(event.date)}
                </time>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

### Phase 6: Migration & Cleanup

**⚠️ GREENFIELD vs MIGRATION:**

This plan implements a **greenfield Luma-inspired event page**. The event page (`src/features/event/`) will be **completely rewritten** following the new architecture, while other parts of frontrow use the existing structure.

**Two-Track Approach:**

1. **New Event Page** (greenfield) - Full Luma implementation
2. **Existing App** (gradual migration) - Migrate incrementally

**Greenfield Strategy for Event Page:**

The event page is a **complete rewrite** from scratch:

- Build new components following all Luma patterns
- Use native semantic HTML from day 1
- Never import Typography component
- Delete old `styles.module.css` when done

**Incremental Strategy for Existing App:**

Other parts of frontrow migrate gradually:

- Add infrastructure (tokens, adapters) without breaking changes
- Migrate components one at a time
- Keep old import paths working during transition
- Delete deprecated code only after full migration

#### 6.1 Migration Checklist

**Move existing components:**

1. `src/components/layout/Header` � `src/features/layout/Navigation` (rewrite with glassmorphism)
2. `src/components/layout/Footer` � `src/features/layout/Footer` (keep as-is)
3. `src/components/devtools` � `src/features/layout/devtools`
4. `src/components/ui/*` � `src/ui/*` (convert to adapters)

**Delete:**

1. `src/components/ui/typography.tsx` L
2. `src/features/event/styles.module.css` (replace with tokens)

**Replace throughout codebase:**

```tsx
// Find all Typography usages
<Typography variant="h1"> � <h1 className="...">
<Typography variant="h2"> � <h2 className="...">
<Typography variant="body"> � <p className="...">
// etc.
```

#### 6.2 Import Path Updates

Update all imports:

```tsx
// L Old
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

//  New
import { Button } from "@/ui/button";
// No typography import - use native tags
```

### Phase 7: Testing & Validation

#### 7.1 Accessibility Checklist

- [ ] All icon-only buttons have `aria-label`
- [ ] All buttons have `type="button"` (unless submit)
- [ ] Visible focus rings on all interactive elements
- [ ] Proper heading hierarchy (h1 � h2 � h3)
- [ ] `<time>` elements have `dateTime` attribute
- [ ] Images have meaningful alt text or empty alt for decorative
- [ ] Links with `target="_blank"` have `rel="noopener"`
- [ ] Form inputs have associated labels

#### 7.2 Performance Checklist

- [ ] All images have `width`/`height` or `aspect-ratio`
- [ ] Responsive `srcset` on cover images
- [ ] Lazy loading on below-fold images
- [ ] Route-level data prefetch in loader
- [ ] Related events prefetch on hover/focus
- [ ] Reduced motion respected globally
- [ ] No CLS (layout shifts) on page load

#### 7.3 Responsive Checklist

Test at breakpoints:

- [ ] 450px: Mobile (smallest)
- [ ] 650px: Tablet (column collapse)
- [ ] 820px: Desktop (sidebar width adjustment)
- [ ] 1200px: Wide desktop

Verify:

- [ ] Sidebar sticky on desktop only
- [ ] Mobile sticky CTA appears <650px
- [ ] Time widget hidden on mobile
- [ ] Related events rail: horizontal scroll � grid
- [ ] Touch targets e44px on mobile

## Definition of Done

### Architecture

- [ ] Directory structure matches plan-ui.md (design/, vendor/, ui/, features/)
- [ ] Luma-inspired token system implemented in `design/tokens.css`
- [ ] Typography component removed, native tags used throughout
- [ ] Biome import restriction rule added
- [ ] Radix imports corrected to scoped `@radix-ui/react-*`

### Layout

- [ ] Two-column responsive layout (330px sidebar, flex-1 main)
- [ ] Sticky sidebar on desktop (>650px)
- [ ] Column collapse on mobile (d650px)
- [ ] Glassmorphism navigation with scroll detection

### Components

- [ ] Cover image with glow effect
- [ ] Title block with native `<h1>`, `<time>` tags
- [ ] Registration CTA card (multi-state logic)
- [ ] Content card base pattern
- [ ] Host/attendees cards with avatar patterns
- [ ] Map embed with blur/reveal based on registration
- [ ] Related events rail with prefetch

### Data & Performance

- [ ] QueryCollection pattern implemented
- [ ] Route-level preload in loader
- [ ] Related rail prefetch on hover/focus
- [ ] Intrinsic image sizing
- [ ] Responsive srcset on cover images

### Polish

- [ ] Hover micro-interactions (transforms, chevrons)
- [ ] Focus states with tokenized rings
- [ ] Reduced motion support
- [ ] All accessibility requirements met

## Next Steps (Out of Scope)

1. **Analytics instrumentation** (PostHog)
2. **Storybook setup** for adapter docs
3. **Unit tests** for adapters
4. **JSON-LD structured data** for SEO
5. **Error boundaries** and loading states
6. **Optimistic updates** for RSVP/tickets

---

## Luma Source Code Analysis - Key Implementation Findings

This document captures additional implementation patterns discovered from analyzing Luma's actual HTML/CSS source code. These findings supplement the original implementation plan.

### 1. CSS Variable System Architecture

#### Color Scale Implementation

Luma uses a **sophisticated 11-step color scale** with 4 variants for each step:

```css
/* Base color */
--gray-50: #9e9e9f;

/* Variants */
--gray-50-transparent: #9e9e9f00; /* Fully transparent */
--gray-50-translucent: #9e9e9f40; /* 25% opacity (40 in hex) */
--gray-50-thick-translucent: #9e9e9fcc; /* 80% opacity (cc in hex) */
```

**Key Finding**: The opacity values are standardized:

- `transparent`: 00 (0%)
- `translucent`: 40 (25%)
- `thick-translucent`: cc (80%)

**Steps**: 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100

#### Brand Color System

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

### 2. Responsive Breakpoints

Luma uses **3 primary breakpoints**:

```css
@media (max-width: 450px) {
  /* Phone */
}
@media (max-width: 650px) {
  /* Tablet/Small Desktop */
}
@media (max-width: 800px) {
  /* Medium Desktop (less common) */
}
```

**Key Pattern**: Most responsive behavior happens at 450px and 650px. The 800px breakpoint is used sparingly for specific components.

**Width Queries**: Luma uses modern `(width <= 450px)` syntax alongside traditional `(max-width: 450px)`.

### 3. Glassmorphism & Backdrop Effects

#### Navigation Implementation

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

### 4. Cover Image Glow Effect

#### Dual-Layer Technique

```css
.cover-with-glow .cover-image img {
  transform: scale(1.005); /* Slight scale to prevent edge artifacts */
}

.cover-with-glow .cover-image-under {
  opacity: 0.2;
  filter: brightness(0.8) blur(24px) saturate(1.2);
  mix-blend-mode: multiply;
  position: absolute;
  top: 1rem; /* Offset from top */
  transform: translate(0);
}

/* Dark mode variant */
.theme-root.dark .cover-with-glow .cover-image-under {
  opacity: 0.3;
  filter: brightness(0.7) blur(24px) saturate(1.2);
}
```

**Key Details**:

- Uses `mix-blend-mode: multiply` for the glow layer
- Different opacity/brightness in dark mode
- 1rem top offset creates depth
- 24px blur with 1.2x saturation boost

### 5. Animation & Transition System

#### Standardized Timing

```css
--transition-duration: 0.3s;
--fast-transition-duration: 0.2s;
--slow-transition-duration: 0.6s;
--transition-fn: cubic-bezier(0.4, 0, 0.2, 1); /* Material Design easing */
--bounce-transition-fn: cubic-bezier(0.54, 1.12, 0.38, 1.11);
```

#### Preset Transitions

```css
--transition: all var(--transition-duration) var(--transition-fn);
--bounce-transition: all var(--transition-duration) var(--bounce-transition-fn);
--fast-transition: all var(--fast-transition-duration) var(--transition-fn);
--slow-transition: all var(--slow-transition-duration) var(--transition-fn);
```

### 6. Typography System

#### Font Sizes

```css
--font-size-xxxl: 2.5rem; /* 40px */
--font-size-xxl: 2rem; /* 32px */
--font-size-xl: 1.5rem; /* 24px */
--font-size-lg: 1.125rem; /* 18px */
--font-size-md: 1rem; /* 16px */
--font-size-sm: 0.875rem; /* 14px */
--font-size-xs: 0.75rem; /* 12px */
--font-size-xxs: 0.6875rem; /* 11px */
--font-size-xxxs: 0.625rem; /* 10px */
```

#### Font Weights

```css
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-bold: 600;
```

#### Line Heights

```css
--reduced-line-height: 1.2;
--title-line-height: 1.3;
--reduced-title-line-height: 1.1; /* For large titles */
```

#### Title Component Pattern

```css
.title {
  font-size: 3rem;
  font-family: var(--title-font);
  line-height: var(--reduced-title-line-height);
  word-break: break-word;
}

/* Responsive scaling */
@media (width <= 1000px) {
  .title {
    font-size: 2.5rem;
  }
}
@media (width <= 820px) {
  .title {
    font-size: 2.25rem;
  }
}
@media (width <= 650px) {
  .title {
    font-size: 2rem;
  }
}
@media (width <= 450px) {
  .title {
    font-size: 1.75rem;
  }
}
```

### 7. Shadow System

#### Light Mode Shadows

```css
--light-shadow-xs: 0 1px 4px rgba(0, 0, 0, .1);
--light-shadow-sm: 0 1px 3px rgba(0, 0, 0, .02), 0 2px 7px rgba(0, 0, 0, .03),
                   0 3px 14px rgba(0, 0, 0, .04), 0 7px 29px rgba(0, 0, 0, .05),
                   0 20px 80px rgba(0, 0, 0, .06);
--light-shadow: /* 5-layer shadow for depth */
--light-shadow-lg: /* Larger version */
--light-shadow-xl: /* Largest version */
```

#### Dark Mode Overrides

```css
.theme-root.dark {
  --shadow-xs: 0 1px 4px rgba(0, 0, 0, 0.25);
  /* Stronger shadows in dark mode for better contrast */
}
```

#### Modal Shadow

```css
--shadow-modal: 0 0 0 1px var(--opacity-8), /* Subtle border */ 0 3px 3px rgba(0, 0, 0, 0.03),
  /* Close shadow */ 0 8px 7px rgba(0, 0, 0, 0.04), /* Mid shadow */ 0 17px 14px
    rgba(0, 0, 0, 0.05), /* Far shadow */ 0 35px 29px rgba(0, 0, 0, 0.06), /* Very far shadow */
    0px -4px 4px 0px rgba(0, 0, 0, 0.04) inset; /* Subtle inset */
```

**Pattern**: Multi-layer shadows with increasing blur radius and offset for realistic depth.

### 8. Avatar System

#### Gradient Fallbacks

```css
/* 7 gradient patterns for missing avatars */
.avatar-wrapper .missing-0 {
  background: linear-gradient(120deg, #ff5f6d, #ffc371);
}
.avatar-wrapper .missing-1 {
  background: linear-gradient(120deg, #4ca1af, #c4e0e5);
}
.avatar-wrapper .missing-2 {
  background: linear-gradient(120deg, #4568dc, #b06ab3);
}
.avatar-wrapper .missing-3 {
  background: linear-gradient(120deg, #7b4397, #dc2430);
}
.avatar-wrapper .missing-4 {
  background: linear-gradient(120deg, #56ab2f, #a8e063);
}
.avatar-wrapper .missing-5 {
  background: linear-gradient(120deg, #ee9ca7, #ffdde1);
}
.avatar-wrapper .missing-6 {
  background: linear-gradient(120deg, #2193b0, #6dd5ed);
}
```

#### Avatar Cutout (Stacked Heads)

```css
.heads .head:not(:last-child) .avatar-wrapper {
  mask-image: url('data:image/svg+xml,<svg>...<circle r="0.5" cx="0.5" cy="0.5"/></svg>'),
    url('data:image/svg+xml,<svg>...<circle r="0.6" cx="1.1" cy="0.5"/></svg>');
  -webkit-mask-composite: source-out;
  mask-composite: subtract;
}
```

**Pattern**: Uses SVG masks to create overlapping avatar effect.

### 9. Layout Patterns

#### Page Structure

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

#### Card System

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

### 10. CSS-in-JS Pattern

Luma uses **scoped inline styles** with unique IDs:

```html
<style id="__jsx-3384040117">
  .nav-wrapper.jsx-3384040117 {
    /* styles */
  }
  .sticky.jsx-3384040117 {
    /* styles */
  }
</style>
```

**Pattern**: Each component gets a unique hash for style scoping.

## 11. Shimmer Loading Effect

```css
@keyframes shimmer {
  0% {
    background-position: -568px 0;
  }
  100% {
    background-position: 568px 0;
  }
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
--easing-standard: cubic-bezier(0.4, 0, 0.2, 1);
--easing-bounce: cubic-bezier(0.54, 1.12, 0.38, 1.11);
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

---

## Greenfield Adaptation Summary

This plan adapts Luma's visual patterns to our greenfield stack (shadcn + ReUI + Tailwind v4 + plan-ui.md architecture).

### ✅ What We Kept from Luma

**Visual Patterns:**

- Cover image glow effect with dual-layer blur
- Glassmorphism navigation with backdrop blur
- Two-column sticky layout (330px sidebar)
- Avatar gradient fallbacks (7 colors)
- Hover micro-interactions (chevron slide, button lift)
- Multi-layer shadow system for depth
- Overlapping avatar heads pattern

**Technical Patterns:**

- QueryCollection data loading
- Route-level preload strategy
- Related events prefetch
- Responsive image srcsets
- Native HTML semantics (`<h1>`, `<time>`)

### 🔄 What We Adapted

**From Luma → To Our Stack:**

1. **Token System**

   - ❌ 88+ CSS variables (11 steps × 4 variants)
   - ✅ Extend existing shadcn tokens + Tailwind opacity modifiers

2. **Components**

   - ❌ Custom `ContentCard`, custom Button
   - ✅ shadcn `Card`, ReUI `Button` via adapter

3. **Responsive**

   - ❌ CSS variables in media queries + custom 651px breakpoint
   - ✅ Tailwind utilities (`md:`, `lg:`) + standard breakpoints

4. **Colors**

   - ❌ `var(--gray-50-translucent)`
   - ✅ `bg-muted/25` (Tailwind opacity modifier)

5. **Viewport Height**

   - ❌ `100vh` with fallback logic
   - ✅ `min-h-dvh` (Tailwind v4 dynamic viewport)

6. **Directory Structure**
   - ❌ Luma's proprietary structure
   - ✅ plan-ui.md: `src/design/`, `src/vendor/`, `src/ui/`, `src/features/`

### 🎯 Alignment with plan-ui.md

| Requirement                   | Implementation                                   |
| ----------------------------- | ------------------------------------------------ |
| Typography: Native tags only  | ✅ Delete `typography.tsx`, use `<h1>`, `<time>` |
| Components: Use shadcn/ReUI   | ✅ Import from `@/ui/card`, `@/ui/button`        |
| Tokens: Minimal + extensions  | ✅ Extend index.css, not 88+ variables           |
| Vendor: Read-only, no imports | ✅ Features import from `@/ui/*` only            |
| Responsive: Tailwind-first    | ✅ Use `md:`, `lg:` not custom breakpoints       |
| Security: `rel="noopener"`    | ✅ Added to all `target="_blank"` links          |

### 📦 Final Stack

**CSS/Styling:**

- Tailwind v4 with `@import "tailwindcss"`
- `@theme inline` for custom tokens
- Existing shadcn token system (HSL → hsl() pattern)
- Multi-layer shadows, animation tokens

**Components:**

- shadcn: Card, Badge, Skeleton, Divider
- ReUI: Button, Input, Select, Menu, Dialog (via adapters in `@/ui/`)
- Features: Custom event components in `@/features/event/`

**Data:**

- QueryCollection pattern from plan-ui.md
- Route-level preload
- TanStack Router navigation

**Responsive:**

- Tailwind breakpoints (md: 768px, lg: 1024px)
- Container queries where needed
- Dynamic viewport height (`dvh`)

### 🚀 Benefits of Our Approach

1. **Simpler** - ~10 token additions vs 88+ variables
2. **Faster** - Tailwind utilities compile-time optimized
3. **Maintainable** - Follows established frontrow patterns
4. **Powerful** - Achieves all Luma visual effects
5. **Compliant** - 100% aligned with plan-ui.md
6. **Scalable** - shadcn/ReUI patterns proven at scale

### 📝 Implementation Checklist

**Phase 1: Foundation** (1-2 days)

- [ ] Add tokens to `apps/frontrow/src/index.css`
- [ ] Delete `src/components/ui/typography.tsx`
- [ ] Move `src/components/ui/*` → `src/ui/*`
- [ ] Add Biome import restriction rule

**Phase 2: Layout** (1 day)

- [ ] Create `Navigation.tsx` with glassmorphism
- [ ] Create two-column event layout
- [ ] Add cover image with glow effect

**Phase 3: Components** (2-3 days)

- [ ] TitleBlock with native `<h1>`
- [ ] RegistrationCard (multi-state CTA)
- [ ] HostCard & AttendeesCard (using shadcn Card)
- [ ] MetaInfo rows with semantic HTML
- [ ] MapEmbed with blur/reveal

**Phase 4: Polish** (1 day)

- [ ] Hover micro-interactions
- [ ] Focus states
- [ ] Loading states (Skeleton)
- [ ] Reduced motion support

**Phase 5: Data & Performance** (1 day)

- [ ] Implement QueryCollection pattern
- [ ] Route loader preload
- [ ] Related events rail with prefetch
- [ ] Image optimization (srcset)

**Total Estimated Time:** 6-8 days

---

**Next Steps:** Start with Phase 1 foundation work, ensuring all changes align with plan-ui.md architecture before building features.

---

// apps/frontrow/src/features/event/EventPage.tsx
import { Head } from '@tanstack/react-start';
import type { Event, Ticket } from '@/lib/schemas';

function generateEventJsonLd(event: Event, tickets: Ticket[]) {
return {
"@context": "https://schema.org",
"@type": "Event",
"name": event.title,
"description": event.description,
"startDate": event.startsAt, // ISO 8601
"endDate": event.endsAt,
"eventStatus": "https://schema.org/EventScheduled",
"eventAttendanceMode": event.venue.isOnline
? "https://schema.org/OnlineEventAttendanceMode"
: "https://schema.org/OfflineEventAttendanceMode",
"location": event.venue.isOnline ? {
"@type": "VirtualLocation",
"url": event.venue.url,
} : {
"@type": "Place",
"name": event.venue.name,
"address": {
"@type": "PostalAddress",
"streetAddress": event.venue.address,
"addressLocality": event.venue.city,
"addressRegion": event.venue.state,
"postalCode": event.venue.zip,
"addressCountry": event.venue.country,
},
},
"image": event.coverImage?.url,
"offers": tickets.map(ticket => ({
"@type": "Offer",
"name": ticket.name,
"price": (ticket.pricing.ticket.amount / 100).toFixed(2),
"priceCurrency": ticket.pricing.ticket.currency,
"availability": ticket.status === 'on_sale'
? "https://schema.org/InStock"
: ticket.status === 'sold_out'
? "https://schema.org/SoldOut"
: "https://schema.org/PreOrder",
"url": `${window.location.origin}/${event.handle}?ticket=${ticket.id}`,
"validFrom": ticket.salesWindow?.startsAt,
"validThrough": ticket.salesWindow?.endsAt,
})),
"organizer": {
"@type": "Organization",
"name": event.organization.name,
"url": `${window.location.origin}/${event.organization.handle}`,
},
};
}

function EventPage() {
const { event, tickets } = Route.useLoaderData();
const jsonLd = generateEventJsonLd(event, tickets);

return (
<>

<Head>
<title>{event.title}</title>
<meta name="description" content={event.description} />

        {/* OpenGraph */}
        <meta property="og:title" content={event.title} />
        <meta property="og:description" content={event.description} />
        <meta property="og:image" content={event.coverImage?.url} />
        <meta property="og:type" content="website" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={event.title} />
        <meta name="twitter:description" content={event.description} />
        <meta name="twitter:image" content={event.coverImage?.url} />

        {/* JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Head>

      {/* Rest of page */}
    </>

);
}
