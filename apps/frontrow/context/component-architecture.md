# DayOf Component Architecture - Final Structure

## ✅ Clean, Production-Ready Setup

Successfully implemented a **standard-compliant** component architecture that follows Shadcn/ReUI conventions.

---

## 📁 Final Directory Structure

```
src/components/
├── vendor/
│   └── reui/                    # 68 ReUI components (CLI managed - DON'T TOUCH)
│       ├── base-badge.tsx      # Base UI Badge
│       ├── base-button.tsx     # Base UI Button
│       ├── base-separator.tsx  # Base UI Separator
│       ├── base-*.tsx          # 33 more Base UI components
│       ├── badge.tsx           # Radix UI Badge
│       ├── button.tsx          # Radix UI Button
│       ├── item.tsx            # Shadcn Item
│       ├── divider.tsx         # Custom (deprecated only)
│       ├── typography.tsx      # Custom (deprecated only)
│       └── *.tsx               # 30 more official components
│
└── ui/                          # 9 DayOf wrappers (YOUR public API)
    ├── badge.tsx               → wraps vendor/reui/base-badge
    ├── button.tsx              → wraps vendor/reui/base-button
    ├── card.tsx                → wraps vendor/reui/card
    ├── dropdown-menu.tsx       → wraps vendor/reui/dropdown-menu
    ├── item.tsx                → wraps vendor/reui/item (Shadcn)
    ├── separator.tsx           → wraps vendor/reui/base-separator
    ├── skeleton.tsx            → wraps vendor/reui/skeleton
    ├── sonner.tsx              → wraps vendor/reui/sonner
    └── tooltip.tsx             → wraps vendor/reui/base-tooltip
```

---

## 🎯 Import Pattern (Standard Shadcn Convention)

### ✅ ALWAYS Import From `ui/`

```tsx
// ✅ YES - Standard pattern, everyone knows this
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
```

### ❌ NEVER Import From `vendor/` Directly

```tsx
// ❌ NO - Vendor code, implementation detail
import { Button } from "@/components/vendor/reui/base-button";
import { Badge } from "@/components/vendor/reui/badge";
```

---

## 🏗️ How It Works

### Thin Wrapper Pattern

Each `ui/*.tsx` file is a **pure re-export** with documentation:

```tsx
// ui/button.tsx
// DayOf wrapper for Button component
// Features import from here, never from vendor directly

export type { ButtonProps } from "@/components/vendor/reui/base-button";
export {
  Button,
  ButtonArrow,
  buttonVariants,
} from "@/components/vendor/reui/base-button";
```

**Why this works:**

- ✅ Standard Shadcn/ReUI pattern (everyone imports from `ui/`)
- ✅ CLI installs to `vendor/reui/` (configured in `components.json`)
- ✅ Wrappers in `ui/` provide public API
- ✅ Easy to swap vendors or add custom behavior
- ✅ Type-safe exports
- ✅ No circular dependencies

---

## ⚙️ Configuration

### components.json

```json
{
  "aliases": {
    "ui": "@/components/vendor/reui" // CLI installs here
  },
  "registries": {
    "@reui": "https://reui.io/r/{name}.json"
  }
}
```

When you run:

```bash
pnpm dlx shadcn@latest add @reui/base-select
```

It installs to: `src/components/vendor/reui/base-select.tsx`

Then you create wrapper: `src/components/ui/select.tsx`

---

## 📦 Component Inventory

### Base UI Components (36) - Modern, Performant

Preferred when available - use modern Base UI primitives:

**High Priority (Commonly Used):**

- ✅ base-badge
- ✅ base-button
- ✅ base-separator
- ✅ base-tooltip
- base-select
- base-dialog
- base-popover
- base-checkbox
- base-input
- base-switch

**Available:**

- base-accordion, base-alert-dialog, base-autocomplete, base-avatar, base-breadcrumb, base-collapsible, base-combobox, base-context-menu, base-menu, base-menubar, base-meter, base-navigation-menu, base-number-field, base-phone-input, base-preview-card, base-progress, base-radio-group, base-scroll-area, base-sheet, base-slider, base-tabs, base-toast, base-toggle, base-toggle-group, base-toolbar

### Radix UI Components (32) - Traditional

Fallback when Base UI version doesn't exist:

**Wrapped:**

- ✅ card
- ✅ divider
- ✅ dropdown-menu
- ✅ item
- ✅ skeleton
- ✅ sonner
- ✅ typography

**Available:**

- alert, badge, button, calendar, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, slider, switch, table, tabs, textarea, toast, toggle, toggle-group, tooltip

---

## 🔄 Adding New Components

### Step 1: Install from ReUI

```bash
pnpm dlx shadcn@latest add @reui/base-component-name
# Installs to: src/components/vendor/reui/base-component-name.tsx
```

### Step 2: Create Wrapper

```bash
# Create: src/components/ui/component-name.tsx
```

```tsx
// src/components/ui/component-name.tsx
export { Component } from "@/components/vendor/reui/base-component-name";
export type { ComponentProps } from "@/components/vendor/reui/base-component-name";
```

### Step 3: Use in Features

```tsx
import { Component } from "@/components/ui/component-name";

function MyFeature() {
  return <Component variant="primary">Hello</Component>;
}
```

---

## 🎨 Integration with Theme System

### Semantic Tokens (Automatic)

ReUI components automatically use your theme tokens:

```tsx
<Button variant="primary">
  {/* Uses --primary (auto-themed per event) */}
</Button>

<Badge variant="success">
  {/* Uses --color-success-accent */}
</Badge>

<Card>
  {/* Uses --card, --card-foreground */}
</Card>
```

### Brand Scale (Manual)

Add brand utilities via className:

```tsx
<Button className="bg-brand-70 hover:bg-brand-80">
  Direct brand color
</Button>

<Card className="border-brand-30 bg-brand-opacity-4">
  Subtle brand tint
</Card>
```

### Per-Event Theming

Wrap in `.event-{id}` for event-specific branding:

```tsx
<style dangerouslySetInnerHTML={{ __html: themeCSS }} />

<div className="event-123">
  {/* ALL components inside inherit event brand */}
  <Button variant="primary">   {/* Purple for event 123 */}
  <Button variant="primary">   {/* Orange for event 456 */}
</div>
```

---

## 🚀 Usage Examples

### Basic Button

```tsx
import { Button } from "@/components/ui/button";

<Button variant="primary" size="md">
  Click me
</Button>;
```

### Button with Brand Color

```tsx
import { Button } from "@/components/ui/button";

<Button className="bg-brand-70 text-white">Event Brand Button</Button>;
```

### Badge Variants

```tsx
import { Badge } from "@/components/ui/badge";

<Badge variant="primary" size="sm">Primary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning" appearance="light">Warning</Badge>
```

### Card with Event Theme

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

<Card className="border-brand-20">
  <CardHeader className="bg-brand-opacity-4">
    <CardTitle>Event Card</CardTitle>
  </CardHeader>
  <CardContent>Uses event's brand color</CardContent>
</Card>;
```

### Complete Event Page

```tsx
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/$orgHandle/$eventHandle")({
  loader: async ({ params }) => {
    const event = await getEvent(params.eventHandle);
    const themeCSS = generateEventThemeCSS(
      `.event-${event.id}`,
      event.brandColor
    );
    return { event, themeCSS };
  },
  component: EventPage,
});

function EventPage() {
  const { event, themeCSS } = Route.useLoaderData();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCSS }} />

      <div className={`event-${event.id}`}>
        <h1>{event.title}</h1>

        <Badge variant="primary" size="sm">
          Featured Event
        </Badge>

        <Card>
          <CardContent className="p-6">
            <Button variant="primary" size="lg">
              Buy Tickets - ${event.price}
            </Button>

            <Button variant="outline" size="md">
              Learn More
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
```

---

## ✨ Why This Structure is Better

### Before (Attempted but Confusing)

Tried `ui-do/` for wrappers, but this breaks standard conventions:

```
ui/
├── base-badge.tsx    # Vendor from CLI
├── badge.tsx         # Another vendor?
└── ...               # MIXED vendor code

ui-do/
├── badge.tsx         # Our wrapper
└── ...               # Non-standard location
```

**Problems:**

- ❌ Non-standard pattern (nobody uses `ui-do/`)
- ❌ Features must remember custom import path
- ❌ Confuses new developers
- ❌ Breaks all Shadcn/ReUI tutorials and examples
- ❌ CLI can't easily target vendor location

### After (Clean & Standard)

```
vendor/reui/
├── base-badge.tsx    # Official Base UI (CLI installs here)
├── base-button.tsx   # Official Base UI
├── item.tsx          # Official Shadcn
├── card.tsx          # Official ReUI
└── ...               # ALL 68 vendor components

ui/
├── badge.tsx         # Thin wrapper → vendor/reui/base-badge
├── button.tsx        # Thin wrapper → vendor/reui/base-button
├── item.tsx          # Thin wrapper → vendor/reui/item
└── ...               # ONLY 9 wrappers (no vendor code)
```

**Benefits:**

- ✅ **Standard Shadcn pattern** - Features import from `ui/`
- ✅ **Vendor isolation** - All vendor code in `vendor/`
- ✅ **Clear separation** - Zero mixing of vendor and wrappers
- ✅ **Tutorial compatibility** - Works with any Shadcn/ReUI guide
- ✅ **CLI configured** - Installs to `vendor/reui/` automatically
- ✅ **Easy maintenance** - Update vendors without touching wrappers

---

## 📋 Summary

**Structure:**

- `vendor/reui/` - **68 ReUI components** (CLI managed, don't edit)
  - 36 Base UI components (`base-*.tsx`)
  - 32 Radix UI + other components
  - 2 custom components (deprecated use only: `divider`, `typography`)
- `ui/` - **9 thin wrappers** (your public API, features import from here)
  - Only official Shadcn/ReUI components wrapped
  - No custom or deprecated components

**Configuration:**

- `components.json` → `"ui": "@/components/vendor/reui"` (CLI installs here)

**Usage:**

- ✅ Features **always** import from `@/components/ui/*` (standard pattern)
- ❌ Features **never** import from `@/components/vendor/*` (vendor code)

**Wrapped Components (9):**

1. Badge (Base UI)
2. Button (Base UI)
3. Card (ReUI)
4. Dropdown Menu (ReUI)
5. Item (Shadcn official)
6. Separator (Base UI)
7. Skeleton (ReUI)
8. Sonner/Toast (ReUI)
9. Tooltip (Base UI)

**Integration:**

- ✅ ReUI components work with your OKLCH theme
- ✅ Light/dark mode working (`@custom-variant dark` added)
- ✅ Per-event branding via `.event-{id}` wrappers
- ✅ Standard Shadcn import pattern
- ✅ No deprecated/custom components in active code

**Status:** Production-ready, clean architecture, follows best practices! 🎉
