Jon — doing a thorough pass. Below is an alignment review focused **strictly** on Tailwind v4 + shadcn + your ReUI adapter layer. I’ve called out the “green” parts that already line up, then the “fix now” items with concrete patches.

---

## ✅ Already aligned

- **Tailwind v4 tokens via `@theme`** — You’re defining design tokens in `@theme inline` (correct place to mint utilities) and using `:root` for plain CSS vars (fine for non-utility variables). Tailwind v4 explicitly distinguishes these two roles. ([Tailwind CSS][1])
- **Opacity modifiers** — Using `bg-card/80`, `ring-border/50`, etc., fits Tailwind’s slash opacity modifier model. ([Tailwind CSS][2])
- **Backdrop blur utilities** — `backdrop-blur-[16px]` and `bg-…/80` are a legit “frosted” combo. ([Tailwind CSS][3])
- **Container queries** — The `@container` + `@md:` form you referenced is the new first‑class API in v4. Your example matches the docs’ pattern. ([Tailwind CSS][4])
- **Dynamic viewport units** — `min-h-dvh` is supported; using `dvh` over `vh` for mobile address bar jitter is a modern best practice. ([Tailwind CSS][5])
- **shadcn tokens** — Using classes like `bg-background`, `text-muted-foreground`, `border-border`, `bg-card` aligns with the shadcn variable convention. ([Shadcn UI][6])
- **TanStack Router preloading** — `preload="intent"` on `<Link>` is the documented API (your RelatedEventsRail is using it the right way). ([TanStack][7])

---

## ⚠️ Fix now (precise deltas)

### 1) **Lucide icon names**

You’re importing `CalendarIcon`, `CopyIcon`, `MapIcon` from `lucide-react`. In Lucide, the components are `Calendar`, `Copy`, and `MapPin`. Patch your imports and JSX. ([Lucide][8])

```tsx
// Before
import { CalendarIcon } from "lucide-react";
// After
import { Calendar } from "lucide-react";

// Before
import { CopyIcon, MapIcon } from "lucide-react";
// After
import { Copy, MapPin } from "lucide-react";
```

and in JSX:

```tsx
<Calendar className="h-4 w-4" />
<Copy className="h-4 w-4" />
<MapPin className="h-4 w-4" />
```

### 2) **Don’t re-introduce a custom “ContentCard”**

In Phase 3.6 (`MapEmbed.tsx`) you import `ContentCard`, but earlier you committed to **shadcn `Card`** only. Replace it with shadcn primitives. ([Shadcn UI][6])

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";

export function MapEmbed({ venue, isRegistered }) {
  return (
    <Card className="bg-card/80 backdrop-blur-[16px]">
      <CardHeader>
        <CardTitle>Location</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ...the rest stays the same... */}
      </CardContent>
    </Card>
  );
}
```

Same goes for **RegistrationCard** — you hand‑roll borders/radii/blur. Move that into `<Card>`:

```tsx
import { Card, CardContent } from "@/ui/card";

return (
  <Card className="bg-card/80 backdrop-blur-[16px] ring-1 ring-border shadow-[var(--shadow-sm)]">
    <CardContent className="p-6">{/* ... */}</CardContent>
  </Card>
);
```

### 3) **MetaInfo uses non-semantic custom color vars**

`text-[var(--tertiary-color)]`, etc., bypass shadcn’s token scheme and break opacity modifiers. Prefer shadcn tokens: `text-muted-foreground`, `text-foreground`, `text-primary`. ([Shadcn UI][6])

```tsx
export function MetaInfoRow({ icon: Icon, title, children }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5" aria-hidden />
      <div className="flex-1">
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
        <div className="text-base text-foreground">{children}</div>
      </div>
    </div>
  );
}
```

### 4) **Token placement: `@theme` vs `:root`**

- Keep **Tailwind-facing tokens** (things you want utilities for, like shadows, radii, easing) in `@theme`.
- Keep **CSS-only flags** (`--nav-bg-opacity`, etc.) in `:root`.
  Tailwind v4 calls this out explicitly; `@theme` must be top-level and not under selectors like `.dark`. For dark mode, you **don’t** put alternate values in `@theme`; switch them using standard CSS variables in `.dark`. ([Tailwind CSS][1])

**Minimal adjustment example:**

```css
@import "tailwindcss";

/* 1) Utilities-generating tokens */
@theme {
  /* shadows become `shadow-[token]` utilities */
  --shadow-xs: 0 1px 4px rgba(0, 0, 0, 0.1);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.02), 0 2px 7px rgba(0, 0, 0, 0.03),
    0 3px 14px rgba(0, 0, 0, 0.04), 0 7px 29px rgba(0, 0, 0, 0.05),
    0 20px 80px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.06),
    0 8px 32px rgba(0, 0, 0, 0.08);

  /* easing becomes `ease-[name]` */
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.54, 1.12, 0.38, 1.11);
}

/* 2) Plain CSS vars (no utilities needed) */
:root {
  --nav-bg-opacity: 0.8;
  --card-backdrop-blur: 16px;
  --glow-opacity: 0.2;
}

.dark {
  --glow-opacity: 0.3;
}
```

This matches Tailwind v4’s “theme variables vs. regular variables” guidance. ([Tailwind CSS][1])

### 5) **Container queries syntax**

Your `@container` examples look good; make sure you actually set the container on the parent (`class="@container"`) before using `@md:*` variants on children (a common “works in dev, breaks in prod” gotcha). ([Tailwind CSS][4])

```tsx
<div className="@container">
  <div className="flex flex-col @md:grid @md:grid-cols-2">{/* ... */}</div>
</div>
```

### 6) **Use `min-h-dvh` correctly**

You’re using `min-h-dvh` (great). Ensure your Tailwind build includes the v4 utilities so this class exists (it does in v3.4+ and remains in v4). If you need partial height, use arbitrary values like `min-h-[75dvh]`. ([Tailwind CSS][5])

### 7) **Keep backdrop-blur utilities, skip custom `backdropFilter` inline**

Prefer `backdrop-blur-*` utilities over inline `style={{backdropFilter:"..."}}` so you inherit Tailwind’s variant system and purge/safety. If you need composite filters (blur+contrast+brightness) it’s fine to stack `backdrop-contrast-*`/`backdrop-brightness-*` utilities. ([Tailwind CSS][9])

```tsx
<nav className="bg-background/80 backdrop-blur-md">
  {/* not style={{ backdropFilter: 'blur(16px)' }} */}
</nav>
```

### 8) **Micro-interactions**

Arbitrary easing like `ease-[cubic-bezier(...)]` is valid; you also defined `--ease-*` in `@theme`. Prefer the tokenized `ease-[var(--ease-bounce)]` so you can theme it. ([Tailwind CSS][1])

```tsx
<div className="transition-all duration-300 ease-[var(--ease-bounce)] hover:-translate-y-0.5" />
```

### 9) **Sonner adapter naming**

Renaming `sonner.tsx` to `toaster.tsx` is fine; docs still refer to `<Toaster />` and `toast()` from `sonner`. Your adapter can export your design‑system shape while delegating to Sonner. ([GitHub][10])

---

## Minor nits & polish

- **Arbitrary blur size** — `backdrop-blur-[16px]` is legal, but Tailwind v4 has renamed some scales; keep an eye on the v4 upgrade notes if you rely on named sizes (e.g., `blur-xs` vs `blur-sm`). ([Tailwind CSS][11])
- **Title fluid sizing** — Your `text-3xl md:text-5xl lg:text-6xl` is fine; you can also move a semantic size into `@theme` (`--text-display-1`) if you want a `text-display-1` utility later. ([Tailwind CSS][1])
- **Line clamp** — Using `line-clamp-2` is built-in; no plugin needed on v4. ([Tailwind CSS][12])

---

## Architecture review (shadcn + ReUI + Radix)

- **Adapters in `@/ui/*`** that wrap vendor primitives (Radix, Sonner, etc.) is the right separation. Radix docs assume you’ll bring your own styling and composition, which is what your adapters do. ([radix-ui.com][13])
- **Biome rule** to forbid `@/vendor/*` imports outside adapters is a good guardrail; no change needed.

> **Heads‑up (non-blocking):** You reference `QueryCollection` from `@tanstack/db`. That package is not a standard TanStack artifact; the official Router docs show route loaders and preloading, but “db” is not part of their released surface. If this is an internal abstraction, keep it. If not, consider switching to TanStack Query or the Router loader pattern. ([TanStack][14])

---

## Quick-fix patch list (copy/paste)

1. **Icons**

```diff
- import { CalendarIcon } from "lucide-react";
+ import { Calendar } from "lucide-react";

- import { CopyIcon, MapIcon } from "lucide-react";
+ import { Copy, MapPin } from "lucide-react";
```

2. **MapEmbed & RegistrationCard: use shadcn Card**

```diff
- import { ContentCard } from "./ContentCard";
+ import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
```

3. **MetaInfo colors**

```diff
- <Icon className="h-5 w-5 text-[var(--tertiary-color)] mt-0.5" />
+ <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />

- <div className="text-sm font-medium text-[var(--secondary-color)]">{title}</div>
+ <div className="text-sm font-medium text-muted-foreground">{title}</div>

- <div className="text-base text-[var(--primary-color)]">{children}</div>
+ <div className="text-base text-foreground">{children}</div>
```

4. **Tokens split**

- Keep **shadows/easing** inside `@theme`.
- Keep **glow/nav opacity** in `:root` / `.dark`. ([Tailwind CSS][1])

5. **Replace inline `backdropFilter`**

```diff
- style={{ backdropFilter: "var(--backdrop-blur)" }}
+ className="backdrop-blur-[16px]"
```

---

## Verdict

You’re **very close** to a clean Tailwind v4 + shadcn + ReUI alignment. The main corrections are **icon names**, **stop re-adding a custom `ContentCard`**, **use shadcn tokens for text/icon colors**, and **place tokens in the proper `@theme` vs `:root` buckets**.

---

## Next steps (no ceremony)

- [ ] Apply the diffs above (icons, MetaInfo colors, Card usage, token placement, backdrop-blur utilities).
- [ ] Grep for `ContentCard` and delete/replace usages with shadcn `Card`.
- [ ] Grep for `var(--tertiary-color)` / `--primary-color` / `--secondary-color` and replace with shadcn class tokens.
- [ ] Ensure every container-query section actually marks a parent with `@container`. ([Tailwind CSS][4])
- [ ] If `@tanstack/db` isn’t your own package, swap to Router loaders + (optionally) TanStack Query.

If you want, I can draft the `@/ui/button` and `@/ui/card` adapters so everything composes cleanly with Radix and Sonner without leaking vendor APIs.

[1]: https://tailwindcss.com/docs/theme "Theme variables - Core concepts - Tailwind CSS"
[2]: https://tailwindcss.com/docs/background-color?utm_source=chatgpt.com "background-color"
[3]: https://tailwindcss.com/docs/backdrop-filter-blur?utm_source=chatgpt.com "backdrop-filter: blur()"
[4]: https://tailwindcss.com/docs/responsive-design?utm_source=chatgpt.com "Responsive design - Core concepts"
[5]: https://tailwindcss.com/blog/tailwindcss-v3-4?utm_source=chatgpt.com "Tailwind CSS v3.4: Dynamic viewport units, :has() support, ..."
[6]: https://ui.shadcn.com/docs/theming?utm_source=chatgpt.com "Theming - shadcn/ui"
[7]: https://tanstack.com/router/v1/docs/framework/react/guide/navigation?utm_source=chatgpt.com "Navigation | TanStack Router React Docs"
[8]: https://lucide.dev/icons/calendar?utm_source=chatgpt.com "calendar - Icons"
[9]: https://tailwindcss.com/docs/backdrop-filter?utm_source=chatgpt.com "backdrop-filter"
[10]: https://github.com/emilkowalski/sonner?utm_source=chatgpt.com "emilkowalski/sonner: An opinionated toast component for ..."
[11]: https://tailwindcss.com/docs/upgrade-guide?utm_source=chatgpt.com "Upgrade guide - Getting started"
[12]: https://tailwindcss.com/docs/line-clamp?utm_source=chatgpt.com "line-clamp - Typography"
[13]: https://www.radix-ui.com/primitives/docs/overview/introduction?utm_source=chatgpt.com "Introduction – Radix Primitives"
[14]: https://tanstack.com/router/v1/docs/framework/react/guide/data-loading?utm_source=chatgpt.com "Data Loading | TanStack Router React Docs"
