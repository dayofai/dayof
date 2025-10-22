# Event V1 → V2 Migration Notes

## Component Mapping

### Old → New

| Legacy Component | New Approach | Notes |
|-----------------|--------------|-------|
| `EventPage` | `routes/$orgHandle.$eventHandle.tsx` | Now a route file, not a feature component |
| `TitleBlock` | TBD | Rebuild with semantic tokens |
| `CTAPanel` | TBD | Rebuild with semantic tokens |
| `PageBackground` | Scoped CSS gradient | Use `.event-{id}` scoped background styles |
| `AsideInfoNote` | TBD | Rebuild with adapter components |
| `TopTrack` | TBD | Rebuild with adapter components |
| `LineupSection` | TBD | Rebuild with adapter components |
| `VenueSection` | TBD | Rebuild with adapter components |
| `PromoterSection` | TBD | Rebuild with adapter components |
| `PromoCodeSection` | TBD | Rebuild with adapter components |
| `GetAppSection` | TBD | Rebuild with adapter components |
| `RelatedEventsSection` | TBD | Rebuild with adapter components |

## CSS Modules → Semantic Tokens

### Old (CSS Modules)
```css
/* styles.module.css */
.asideContainer {
  position: sticky;
  top: 5rem;
}
```

```tsx
<aside className={styles.asideContainer}>
```

### New (Tailwind + Semantic Tokens)
```tsx
<aside className="sticky top-20">
```

## Theme Variables Migration

### Old (Hardcoded CSS Variables)
```tsx
<div className="bg-gradient-to-t from-black/60">
```

### New (Semantic Tokens)
```tsx
<div className="bg-gradient-to-t from-background/60">
```

## Key Architectural Changes

1. **Route Pattern**: `/event/$eventName` → `/$orgHandle/$eventHandle`
2. **SSR Mode**: `loader` with `ssr: 'data-only'`
3. **Theme Injection**: Scoped CSS via `<style dangerouslySetInnerHTML>`
4. **Scope Wrapper**: Content wrapped in `<div className="event-{id}">`
5. **Layout Isolation**: Header/Footer remain OUTSIDE scoped wrapper (neutral theme)

## Data Fetching

### Old
```tsx
// Implicit eventName prop, no data fetching
<EventPage eventName={eventName} />
```

### New
```tsx
// Loader pattern with explicit data fetching
loader: async ({ params }) => {
  const { orgHandle, eventHandle } = params;
  const event = await fetchEvent(orgHandle, eventHandle);
  const themeCSS = generateEventThemeCSS(`.event-${event.id}`, event.brandColor);
  return { event, themeCSS };
}
```

## Import Changes

### Old
```tsx
import { Typography } from '@/components/ui/typography'; // Non-wrapped
```

### New
```tsx
import { Typography } from '@/components/ui/typography'; // Vendor-wrapped with semantic tokens
```

## Testing Checklist

When rebuilding event page components:

- [ ] Only import from `@/components/ui/*` (adapters)
- [ ] Use semantic tokens (`bg-primary`, `text-foreground`)
- [ ] NO CSS modules
- [ ] NO hardcoded colors
- [ ] Test in `.event-{id}` scope wrapper
- [ ] Verify header/footer remain neutral
- [ ] Check responsive behavior
- [ ] Validate accessibility patterns
