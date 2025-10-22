# Non-Wrapped UI Components (Deprecated)

## Why Deprecated

These UI components were deprecated on 2025-10-19 because they do not follow the vendor wrapper pattern required by the Frontrow architecture.

### Vendor Wrapper Pattern

**Required Architecture:**
```
Primitive Layer:     src/vendor/{reui,shadcn}/*  (read-only, no edits)
                            ↓
Adapter Layer:       src/components/ui/*         (re-exports + light customization)
                            ↓
Feature Layer:       src/features/*, src/routes/* (ONLY imports adapters)
```

**Enforcement:**
Biome lint rule `noRestrictedImports` blocks direct imports from `@/vendor/*` in feature/route code.

## Deprecated Components

### `button.tsx`
- **Why**: Custom CVA implementation, not wrapping a vendor primitive
- **Issue**: Hardcoded styles, not using semantic tokens
- **New**: Wrap `@/vendor/reui/button` with semantic token variants

### `typography.tsx`
- **Why**: Custom implementation with hardcoded color variants
- **Issue**: Uses `text-white`, `text-white/80` instead of semantic tokens
- **New**: Either wrap vendor primitive OR rebuild with semantic tokens (`text-foreground`, `text-muted`)

## Migration Example

### Old (Non-Wrapped)
```tsx
// src/components/ui/button.tsx
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground", // OK
        secondary: "bg-gray-800 text-white", // HARDCODED - BAD
      }
    }
  }
);

export function Button({ variant, ...props }) {
  return <button className={buttonVariants({ variant })} {...props} />;
}
```

### New (Vendor-Wrapped)
```tsx
// src/components/ui/button.tsx
export { Button, buttonVariants } from "@/vendor/reui/button";

// OR if customization needed:
import { Button as ReUIButton } from "@/vendor/reui/button";

export function Button({ ...props }) {
  return <ReUIButton {...props} />;
}
```

## Testing Compliance

To verify a component follows the pattern:

1. **Check imports**: Should import from `@/vendor/*`
2. **Check semantic tokens**: Should use `bg-background`, `text-foreground`, etc.
3. **Check re-export**: Should re-export or lightly wrap vendor primitive
4. **Lint check**: Should pass `noRestrictedImports` rule

## Exceptions

The **only** components allowed to import from `@/vendor/*` are files in `src/components/ui/*` (the adapter layer).
