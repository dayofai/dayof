# Frontrow App Documentation

## 📚 Quick Navigation

### Component System

- **[COMPONENT_ARCHITECTURE.md](./COMPONENT_ARCHITECTURE.md)** - Complete component structure guide
  - Directory layout (`vendor/reui/` → `ui/` wrappers)
  - Import patterns
  - Adding new components
  - 9 active wrappers + 68 vendor components

### Theme System

- **[theme-system.md](./theme-system.md)** - Complete OKLCH theme guide

  - Per-event theming
  - Brand scale (11-step OKLCH)
  - Light/dark mode
  - ReUI integration
  - Browser testing guide

- **[reui-darkmode-integration.md](./reui-darkmode-integration.md)** - Dark mode technical details

  - `@custom-variant dark` setup
  - CSS variable structure
  - Per-event + dark mode interaction

- **[theme-demo.md](./theme-demo.md)** - Legacy theme documentation (reference only)

### Deprecated

- **BASE-UI-MIGRATION.md** - Historical migration notes (reference only)

---

## 🚀 Quick Start

### Import Components

```tsx
// ✅ Always import from ui/
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
```

### Use ReUI Variants

```tsx
<Button variant="primary" size="md">
  Buy Tickets
</Button>

<Badge variant="success" size="sm">
  Available
</Badge>
```

### Add Event Theming

```tsx
// In route loader
const themeCSS = generateEventThemeCSS(
  `.event-${event.id}`,
  event.brandColor
);

// In component
<style dangerouslySetInnerHTML={{ __html: themeCSS }} />
<div className={`event-${event.id}`}>
  {/* All components use event's brand */}
  <Button variant="primary">Event Button</Button>
</div>
```

### Use Brand Scale

```tsx
<Button className="bg-brand-70 hover:bg-brand-80">
  Brand Color Button
</Button>

<Card className="border-brand-30 bg-brand-opacity-4">
  Subtle Brand Tint
</Card>
```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────┐
│ Your OKLCH Theme System                 │
│ - Per-event brand colors                │
│ - 11-step OKLCH scales                  │
│ - Auto-contrast semantic tokens         │
│ - Light/dark mode support               │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ Component Layer (Standard Shadcn)       │
│ ui/ → 9 wrappers (your public API)      │
│ vendor/reui/ → 68 components (CLI)      │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ Foundation                              │
│ - ReUI component library                │
│ - Base UI primitives (36 components)    │
│ - Tailwind v4                           │
│ - @custom-variant dark                  │
└─────────────────────────────────────────┘
```

---

## ⚙️ Configuration Files

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

### index.css

```css
@custom-variant dark (&:where(.dark, .dark *));  /* ReUI requirement */

:root {
  /* Light mode semantic tokens */
  --background: 0 0% 100%;
  --foreground: 0 0% 0%;

  /* Brand scale (defaults to gray) */
  --brand-5 through --brand-100
}

.dark {
  /* Dark mode semantic tokens */
  --background: 0 0% 0%;
  --foreground: 0 0% 100%;
}
```

---

## 📦 Available Components

### Wrapped (Ready to Use - 9)

Import from `@/components/ui/*`:

- Badge, Button, Card, Dropdown Menu, Item
- Separator, Skeleton, Sonner, Tooltip

### Available (Not Wrapped Yet - 59)

Install from vendor and create wrapper when needed:

**Base UI (31 more):**

- Accordion, Alert Dialog, Autocomplete, Avatar, Breadcrumb
- Checkbox, Collapsible, Combobox, Context Menu, Dialog
- Input, Menu, Menubar, Meter, Navigation Menu
- Number Field, Phone Input, Popover, Preview Card, Progress
- Radio Group, Scroll Area, Select, Sheet, Slider
- Switch, Tabs, Toast, Toggle, Toggle Group, Toolbar

**Radix UI (28 more):**

- Alert, Calendar, Carousel, Chart, Collapsible
- Command, Context Menu, Dialog, Drawer, Form
- Hover Card, Input, Input OTP, Label, Menubar
- Navigation Menu, Pagination, Popover, Progress, Radio Group
- Resizable, Scroll Area, Select, Sheet, Slider
- Switch, Table, Tabs, Textarea

---

## 🎯 When to Add a Wrapper

**Add wrapper when:**

- ✅ Component is used in active (non-deprecated) code
- ✅ Component is official Shadcn/ReUI
- ✅ You want type-safe re-exports

**Don't wrap:**

- ❌ Component only in deprecated code
- ❌ Custom/one-off components
- ❌ Vendor-specific utilities

---

## 🔧 Adding New Components

```bash
# 1. Install vendor component
pnpm dlx shadcn@latest add @reui/base-select

# 2. Create wrapper in ui/
# File: src/components/ui/select.tsx
export { Select } from "@/components/vendor/reui/base-select";
export type { SelectProps } from "@/components/vendor/reui/base-select";

# 3. Use in features
import { Select } from "@/components/ui/select";
```

---

## 🧪 Testing

### Theme Demo

```bash
bun run dev:frontrow
# Visit: http://localhost:3004/theme-demo
```

**Test:**

- Light/dark mode toggle
- ReUI component variants
- Brand scale buttons
- Event theming

### Verify Structure

```bash
# Count vendor components
ls src/components/vendor/reui/*.tsx | wc -l
# Should show: 68

# Count UI wrappers
ls src/components/ui/*.tsx | wc -l
# Should show: 9
```

---

## ✅ Checklist for New Features

When building new features:

- [ ] Import components from `@/components/ui/*`
- [ ] Use ReUI variants (`variant="primary"`, etc.)
- [ ] Add brand utilities via `className` when needed
- [ ] Wrap event pages in `.event-{id}`
- [ ] Inject theme CSS via `<style>` tag
- [ ] Test in both light and dark modes
- [ ] Verify WCAG contrast in theme demo

---

## 📖 Additional Resources

- [ReUI Documentation](https://reui.io/docs)
- [Shadcn UI Docs](https://ui.shadcn.com/)
- [Base UI Docs](https://base-ui.com/)
- [Tailwind v4 Docs](https://tailwindcss.com/docs)
- [OKLCH Color Space](https://oklch.com/)

---

## 🎉 Summary

**Your setup:**

- ✅ 68 ReUI components (Base UI + Radix UI + Shadcn)
- ✅ 9 clean wrappers (official components only)
- ✅ OKLCH per-event theming
- ✅ Light/dark mode support
- ✅ Standard Shadcn import patterns
- ✅ Production-ready architecture

**Start building!** Everything is wired up and tested. 🚀
