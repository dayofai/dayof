# Frontrow Theme System Documentation

## Overview

The Frontrow app uses a Luma-inspired theme system built on OKLCH color space with per-event scoped overrides. This provides:
- **Global neutral baseline** with gray scale and semantic tokens
- **Per-event branding** via scoped CSS injection
- **Automatic contrast handling** for accessibility
- **Dark mode support** via semantic token remapping

## Architecture

### Two-Tier Theme Model

```
┌─────────────────────────────────────────┐
│         Global Baseline Theme           │
│  (Neutral gray brand scale in :root)    │
│                                         │
│  Always active in Header/Footer         │
└─────────────────────────────────────────┘
                    │
                    ├─────────────────────────────┐
                    │                             │
                    ▼                             ▼
          ┌──────────────────┐         ┌──────────────────┐
          │ Event Page A     │         │ Event Page B     │
          │ .event-{id-a}    │         │ .event-{id-b}    │
          │                  │         │                  │
          │ Scoped brand     │         │ Scoped brand     │
          │ color override   │         │ color override   │
          └──────────────────┘         └──────────────────┘
```

### Key Principles

1. **Global Neutral**: Root CSS variables use gray scale by default
2. **Scoped Override**: Each event gets a `.event-{id}` wrapper with custom brand CSS
3. **Isolation**: Header/Footer stay OUTSIDE event wrapper (always neutral)
4. **Semantic Tokens**: Components use `bg-primary`, `text-foreground`, etc.
5. **Auto-Adaptation**: Tokens automatically use scoped brand when inside `.event-{id}`

## File Structure

### Core Theme Files

```
apps/frontrow/src/
├── lib/theme/
│   ├── theme.runtime.ts           # OKLCH scale generator + CSS builder
│   ├── resolve-brand-color.ts     # Brand color resolution logic
│   └── extract-color.ts           # Image color extraction
├── index.css                      # Global baseline tokens
└── routes/
    ├── $orgHandle.$eventHandle.tsx # Event route with scoped theme
    └── theme.demo.tsx             # Interactive theme demo
```

### DO NOT MODIFY

- `lib/theme/theme.runtime.ts` - Already working and tested
- `lib/theme/resolve-brand-color.ts` - Already working and tested

## Global Baseline (index.css)

### 11-Step Brand Scale

Defaults to neutral gray, overridden per-event:

```css
:root {
  /* Gray scale (always available) */
  --gray-5: oklch(0.985 0 0);   /* Lightest */
  --gray-10: oklch(0.97 0 0);
  --gray-20: oklch(0.922 0 0);
  --gray-30: oklch(0.87 0 0);
  --gray-40: oklch(0.8 0 0);
  --gray-50: oklch(0.7 0 0);    /* Mid-point */
  --gray-60: oklch(0.56 0 0);
  --gray-70: oklch(0.4 0 0);
  --gray-80: oklch(0.3 0 0);
  --gray-90: oklch(0.19 0 0);
  --gray-100: oklch(0.15 0 0);  /* Darkest */

  /* Brand scale (defaults to gray) */
  --brand-5: var(--gray-5);
  --brand-10: var(--gray-10);
  /* ... same for all steps ... */
  --brand-100: var(--gray-100);
}
```

### Semantic Tokens

Components use these, which auto-adapt to scoped themes:

```css
:root {
  --background: 0 0% 0%;          /* Main background */
  --foreground: 0 0% 100%;        /* Main text */
  --primary: 48 96% 53%;          /* Primary actions */
  --primary-foreground: 0 0% 7%;  /* Text on primary */
  --card: 0 0% 7%;                /* Card background */
  --border: 0 0% 16%;             /* Border color */
  --ring: 48 96% 53%;             /* Focus ring */
  /* ... more tokens ... */
}
```

## Per-Event Scoped Overrides

### How It Works

1. **Event loader** fetches event data with `themeBrandColor`
2. **resolveBrandColors()** determines final color (auto-extract, manual, or default)
3. **generateEventThemeCSS()** creates scoped CSS with `.event-{id}` selector
4. **Inject** via `<style dangerouslySetInnerHTML>` in component
5. **Wrap content** in `<div className="event-{id}">`

### Example Implementation

```tsx
// In route loader
export const Route = createFileRoute('/$orgHandle/$eventHandle')({
  ssr: 'data-only',

  loader: async ({ params }) => {
    const event = await fetchEvent(params);

    // Resolve brand color
    const resolved = resolveBrandColors({
      themeMode: event.themeMode,
      themeColors: event.themeBrandColor
        ? { primary: event.themeBrandColor }
        : undefined,
      coverExtractedColors: event.coverExtractedColors,
    });

    // Generate scoped CSS
    const themeCSS = generateEventThemeCSS(
      `.event-${event.id}`,
      resolved.primary
    );

    return { event, themeCSS };
  },

  component: EventComponent,
});

function EventComponent() {
  const { event, themeCSS } = Route.useLoaderData();

  return (
    <>
      {/* Inject scoped CSS */}
      <style dangerouslySetInnerHTML={{ __html: themeCSS }} />

      {/* Content wrapped in scoped class */}
      <div className={`event-${event.id}`}>
        {/* Event content here uses scoped brand */}
        <Button variant="default">
          Buy Tickets {/* Uses event brand color */}
        </Button>
      </div>
    </>
  );
}
```

### Generated CSS Example

For `generateEventThemeCSS('.event-abc123', '#FF5733')`:

```css
.event-abc123 {
  --brand-5: oklch(0.98 0.05 35);
  --brand-10: oklch(0.95 0.08 35);
  --brand-20: oklch(0.88 0.12 35);
  /* ... all 11 steps ... */
  --brand-100: oklch(0.25 0.15 35);

  --brand-base-rgb: 255, 87, 51;
  --brand-opacity-8: rgba(255, 87, 51, 0.08);
  /* ... opacity ladder ... */

  /* Semantic token overrides */
  --primary: var(--brand-60);
  --ring: var(--brand-50);
  /* ... auto-contrast mappings ... */
}
```

## Using Semantic Tokens

### In Components

Always use semantic tokens, never hardcoded colors:

```tsx
// ✅ GOOD - Auto-adapts to theme
<div className="bg-primary text-primary-foreground">
  <Button variant="default">Click Me</Button>
</div>

// ❌ BAD - Hardcoded colors
<div className="bg-[#FF5733] text-white">
  <button>Click Me</button>
</div>
```

### Common Semantic Tokens

| Token | Usage | Example |
|-------|-------|---------|
| `bg-background` | Main background | Page background |
| `text-foreground` | Main text | Body text |
| `bg-primary` | Primary actions | Buy ticket button |
| `text-primary-foreground` | Text on primary | Button text |
| `bg-card` | Card backgrounds | Event card |
| `border-border` | Borders | Card borders |
| `bg-accent` | Accent elements | Highlights |
| `ring-ring` | Focus rings | Input focus |

### Brand Scale Steps

Use for custom branding needs:

```tsx
// Light backgrounds
<div className="bg-brand-5">Lightest</div>
<div className="bg-brand-10">Very light</div>
<div className="bg-brand-20">Light</div>

// Mid-range (primary colors)
<div className="bg-brand-50">Mid-tone</div>
<div className="bg-brand-60">Primary</div>

// Dark (text on light)
<div className="bg-brand-80">Dark</div>
<div className="bg-brand-100">Darkest</div>
```

## Dark Mode

Dark mode works via semantic token remapping:

```css
.dark {
  --background: 0 0% 0%;     /* Dark background */
  --foreground: 0 0% 100%;   /* Light text */
  --card: 0 0% 7%;           /* Slightly lighter cards */
  /* ... all tokens remap ... */
}
```

Components automatically adapt when `<html class="dark">` is set.

## Auto-Contrast System

The theme system automatically picks appropriate contrast levels:

1. **Light backgrounds** (brand-5 to brand-30): Use dark text (brand-80+)
2. **Mid-tones** (brand-40 to brand-60): Use high contrast pairing
3. **Dark backgrounds** (brand-70 to brand-100): Use light text (brand-5 to brand-20)

This ensures WCAG AA compliance automatically.

## Best Practices

### DO

✅ Use semantic tokens (`bg-primary`, `text-foreground`)
✅ Import ONLY from `@/components/ui/*` adapters
✅ Keep Header/Footer OUTSIDE `.event-{id}` wrapper
✅ Test with multiple brand colors
✅ Verify dark mode compatibility

### DON'T

❌ Use hardcoded colors (`bg-[#FF5733]`)
❌ Import directly from `@/vendor/*`
❌ Apply `.event-{id}` to Header/Footer
❌ Modify `theme.runtime.ts` or `resolve-brand-color.ts`
❌ Create CSS modules

## Testing

### Interactive Demo

Visit `/theme/demo` to:
- See all brand scale swatches
- Test component variants
- Try custom brand colors (color picker)
- Toggle dark mode
- Inspect computed token values

### Manual Testing Checklist

- [ ] Visit event page: `/:orgHandle/:eventHandle`
- [ ] Verify Header/Footer use neutral theme
- [ ] Verify event content uses scoped brand
- [ ] Test color picker in `/theme/demo`
- [ ] Toggle dark mode in demo
- [ ] Check WCAG contrast ratios
- [ ] Test with extreme colors (very light, very dark, very saturated)

## Troubleshooting

### Issue: Event theme not applying

**Cause**: Content not wrapped in `.event-{id}` class
**Fix**: Ensure all event content inside `<div className={event-${event.id}}>`

### Issue: Header/Footer showing event colors

**Cause**: Header/Footer inside `.event-{id}` wrapper
**Fix**: Move Header/Footer to `__root.tsx`, OUTSIDE `<Outlet />`

### Issue: Components using wrong colors

**Cause**: Hardcoded colors instead of semantic tokens
**Fix**: Replace with semantic tokens (see table above)

### Issue: FOUC (Flash of Unstyled Content)

**Cause**: Theme CSS injected after first paint
**Fix**: Use `ssr: 'data-only'` to fetch theme on server, inject before render

## Advanced Usage

### Custom Semantic Mappings

Modify generated CSS to customize which brand steps map to semantic tokens:

```typescript
// In generateEventThemeCSS() options
const themeCSS = generateEventThemeCSS('.event-abc123', '#FF5733', {
  // Override default semantic mappings
  primaryStep: 70,      // Use brand-70 for --primary (darker)
  accentStep: 40,       // Use brand-40 for --accent (lighter)
});
```

### Multi-Brand Events

For events with multiple brand colors (gradients):

```typescript
const resolved = resolveBrandColors({
  themeMode: 'manual',
  themeColors: {
    primary: '#FF5733',
    secondary: '#33C3FF',
    accent: '#FFD700',
  },
});

// Generates scales for all three colors
const themeCSS = generateEventThemeCSS(`.event-${event.id}`, resolved);
```

## References

- **Luma inspiration**: Linear's event platform theme system
- **OKLCH resources**: https://oklch.com
- **Contrast calculator**: https://contrast-ratio.com
- **Tailwind v4 docs**: https://tailwindcss.com/docs/v4-beta
