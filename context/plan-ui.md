# UI Architecture and Adapter Plan

## 0) Goals (quick)

- Maintainable, vendor-agnostic UI using Tailwind v4 tokens and adapters
- Per-app UI stacks (frontrow vs backstage) without shared components by default
- Vendor code is read-only; app code imports adapters only
- Native semantics, a11y-first, CLS-safe, and SSR-friendly

## 0.1) Context & rationale

- We expect `frontrow` (user-facing) and `backstage` (admin) to diverge in theme and UX. Keeping UI stacks per-app prevents unnecessary coupling now while allowing future promotion to packages if overlap emerges.
- Adapters wrap vendor primitives to protect app code from upstream churn (props, structure). Variants and sizes are declared once in adapters and stay stable for features.
- Tailwind v4 tokens (`@theme inline`) let us centralize style decisions without hard-coded values in components.

## 0.15) Decisions (current)

- Use `src/features/` for domain UI, with initial folders:
  - `features/layout`, `features/auth`, `features/event`
  - Place `devtools` under `features/layout` for now
- Keep `src/design/` and `src/vendor/` at the `src/` root on purpose
- Move current `src/components/ui/*` into `src/ui/*` (keep `src/ui/sonner.tsx` name for now)
- Import discipline: features import only from `@/ui/*` and `@/lib/*`; never from `@/vendor/*`
- Route pattern: prefer nested folders for slugs
  - `src/routes/$orgSlug/$eventSlug.tsx` → `/:orgSlug/:eventSlug`

## 0.2) Restructuring (Greenfield‑first)

Scaffold the following before feature work:

1. Create per‑app foundations

- `src/design/` with Tailwind v4 tokens (`@theme inline`): colors, radius, spacing, ring, motion
- `src/vendor/` for read‑only ReUI/BaseUI and sanctioned shadcn components (install and pin)
- `src/ui/` for adapters (Button, Input, Select/Combobox, Menu, Dialog/Sheet, Toaster)
- Migrate existing `src/components/ui/*` → `src/ui/*` (retain `src/ui/sonner.tsx` name for now)
- `src/features/` for domain UI pieces. Initial folders: `features/layout`, `features/auth`, `features/event` (place `devtools` under `features/layout` for now)
- `routes/` for file routes and loaders (e.g., nested `src/routes/$orgSlug/$eventSlug.tsx` → `/:orgSlug/:eventSlug`)

2. Enforce import discipline

- Add Biome rule: forbid `src/vendor/**` imports outside `src/ui/**`
- Standardize absolute imports from `@/ui/*` in features; no vendor imports

3. Semantics & a11y defaults

- No typography wrappers; use native tags with tokens
- Buttons default `type="button"`; icon‑only controls require `aria-label`
- Tokenized rings for focus; `prefers-reduced-motion` respected globally

4. Radix & Sonner setup

- Use scoped Radix packages `@radix-ui/react-*` per primitive; pin v1.x
- Add a thin Sonner adapter (`src/ui/toaster.tsx`); mount `<Toaster />` once at root
- References: shadcn Sonner (https://ui.shadcn.com/docs/components/sonner), Sonner (https://sonner.emilkowal.ski/)

5. Query Collections pattern (future‑proof data)

- Define `getEventCollection(slug)` returning a cached QueryCollection
- Route loaders call `.preload()`; rails and links use `<Link preload="intent">` + hover/focus preloads
- Components bind with `useLiveQuery` to avoid prop drilling

This baseline minimizes later refactors and keeps upgrades safe (vendor churn absorbed by adapters).

## 1) Directory layout (per-app; no shared packages for now)

- src/design/ — Tailwind v4 tokens (colors, radius, spacing, motion). App-owned
- src/vendor/ — read-only drops of ReUI/BaseUI and sanctioned shadcn components
- src/ui/ — adapters wrapping vendor primitives (Button, Input, Menu, Dialog, etc.)
- src/features/ — layout/auth/event domain UI. Import only from `@/ui/*` and `@/lib/*`; never from vendor. Include `features/layout/devtools` for now.
- routes/ — file routes, loaders, head() composition. Use nested folders for slugs (e.g., `$orgSlug/$eventSlug.tsx` → `/:orgSlug/:eventSlug`)

Rationale: frontrow and backstage will diverge thematically and structurally. Avoid premature sharing. If convergence appears later, consider promoting to `packages/`.

## 2) Tokens and theming (Tailwind v4)

- Use `@theme inline` for all tokens
- Define minimal set: brand, foreground, background, accent, ring, radius, spacing, motion
- Prefer tokens over literal colors in adapters/features
- Motion tokens: durations/easings + `prefers-reduced-motion` overrides
  - Even if ReUI offers sensible defaults, owning tokens locally ensures consistency and avoids coupling vendor theme into app invariants.

Example tokens (indicative)

- Colors: `--brand`, `--bg`, `--fg`, `--muted`, `--accent`, `--ring`
- Radius: `--radius` (and derived sm/md/lg)
- Motion: `--dur-1` 100ms, `--dur-2` 150ms, `--dur-3` 200ms, `--dur-4` 300ms; `--ease-standard` cubic-bezier(0.2,0,0,1)
- Reduced motion: in media query, set transitions to 0ms for non-essential transitions

## 3) Vendor policy

- Vendor drops live under `src/vendor/**` per app, and are read-only
- Sanctioned components for v1:
  - Prefer ReUI/BaseUI: Button, Input/Textarea, Select/Combobox, Menu, Dialog/Sheet, Toaster (Sonner)
  - Use shadcn “dumb” components directly: Badge, Skeleton, Divider, Card
- Keep versions pinned (lockfile + `UPGRADES.md` per app)

## 4) Radix imports policy

- Always use official scoped packages, never a generic `radix-ui` aggregator
  - Slot: `@radix-ui/react-slot`
  - Dropdown Menu: `@radix-ui/react-dropdown-menu`
  - Dialog: `@radix-ui/react-dialog`
  - Popover: `@radix-ui/react-popover`
  - Hover Card: `@radix-ui/react-hover-card`
  - Label: `@radix-ui/react-label`
  - VisuallyHidden: `@radix-ui/react-visually-hidden`
  - ScrollArea: `@radix-ui/react-scroll-area`
  - Select: `@radix-ui/react-select`
- Why never `radix-ui`? The per-primitive scoped packages are the official distribution with correct ESM/SSR shape, typings, and tree-shaking. Aggregated/unofficial entrypoints can break SSR, pull mismatched versions, and bloat bundles. Pin v1.x to keep primitives aligned.

## 5) Adapters (src/ui)

- Public API: variants (`brand`, `primary`, `secondary`, `outline`, `ghost`, `link`, `destructive`) and sizes (`sm`, `md`, `lg`, `icon`)
- Map adapter variants one-way into vendor props/classes; do not rely on vendor classnames in features
- A11y guarantees: icon-only controls require `aria-label`; `type="button"` by default for `<button>`; focus ring via tokens
- Link vs button: navigation uses router `Link` (via `asChild`), actions use `button`. Always set `rel="noopener"` when `target="_blank"`.
- Typography: no wrapper components; apply utilities/tokens to native tags (`h1`, `h2`, `p`, `time`). `typographyVariants` is not native to shadcn/ReUI/BaseUI; do not keep it. If ever reintroduced, it must be a class generator applied to native tags only.

## 6) Toasts (Sonner)

- Use Sonner instead of deprecated shadcn “toast”
  - References: shadcn Sonner docs (https://ui.shadcn.com/docs/components/sonner), Sonner official docs (https://sonner.emilkowal.ski/)
- Implementation:
  - Keep the existing `src/ui/sonner.tsx` adapter that renders `<Toaster />` (rename to `toaster.tsx` later if desired)
  - No `next-themes` dependency; theme via CSS tokens (or `theme="dark"`) per app decision
- Mount once (root layout) and consume via `toast(...)` in features

## 7) Event feature: structure and semantics

- Route: `/:orgSlug/:eventSlug` (nested route in `routes/$orgSlug/$eventSlug.tsx`); keep `/event/$eventName` as an additional route if needed
- Page pieces under `src/features/event/components/` (presentational only):
  - Artwork (sticky on desktop)
  - Title Block (`h1`, venue text, `<time dateTime="...">`)
  - CTA Panel (price from, Buy button)
  - About (bullets + description + refund note)
  - Lineup (headliner affordance, follow buttons for primary acts)
  - Venue (address, copy-to-clipboard, open in maps)
  - Promoter (avatar/name/follow)
  - Promo code entry
  - Related events rail (horizontal → grid via container queries)
  - Background layer (blurred low-res hero)
- Use adapters only (`@/ui/*`). No vendor imports.
- A11y: icon-only buttons get `aria-label`; visible focus; `alt` text is meaningful or empty for decorative

## 8) Data loading with TanStack DB (Query Collections)

- Create `getEventCollection(slug)` that returns a cached QueryCollection per slug
- Route-level prefetch:
  - In file-route loader, call `await getEventCollection(slug).preload()` to start query before render
- Related rail prefetch:
  - `<Link preload="intent">` and on `mouseenter`/`focus` call `getEventCollection(nextSlug).preload()`
  - Optionally warm the first N related events on idle
- Components bind via `useLiveQuery((q) => q.from({ event: getEventCollection(slug) }).select(...))` to avoid prop drilling

## 9) Analytics (PostHog)

- Instrument later (note now). Track:
  - page_view (event page)
  - buy_click (eventId)
  - follow_click (entityId, entityType)
  - copy_address (eventId)
  - open_maps (eventId)
  - favorite_toggle (eventId, state)
  - related_rail_click (eventId, position)
- Provide a small helper to standardize payload shape

## 10) Governance

- Biome import restriction:
  - Forbid `src/vendor/**` imports outside `src/ui/**`
  - Encourage absolute `@/ui/*` imports in features
  - Features import only from `@/ui/*` and `@/lib/*`; never from `@/vendor/*`
- `UPGRADES.md` per app: record vendor updates and decisions
- CI (later): lint + type-check + smoke build

## 11) Performance & a11y defaults

- Intrinsic sizing or aspect ratio for all images; avoid inline aspect hacks
- Respect `prefers-reduced-motion`; limit non-essential transforms
- Visible focus ring using tokenized rings
- Avoid CLS via reserved space and responsive `srcset`

## 12) Definition of Done (this milestone)

- Per-app foundations established (Sections 0.2, 1–6)
- Tokens defined and referenced in adapters; no hex in components
- Adapters exist for Button, Input, Menu, Dialog/Sheet, Toaster (Sonner)
- Event page uses adapters only; headings are native tags; `<time>` used
- Radix imports corrected to `@radix-ui/react-*`
- Biome rule added for vendor import restriction
- QueryCollection pattern in place; route and rail prefetch hooks identified

## 13) Next phase (out of scope here, tracked)

- Route-level SEO & JSON-LD in file route `head()` (TanStack Start route-level head)
- Storybook and adapter unit tests (screenshot baseline optional)
- PostHog wiring: provider init + event helpers + instrumentation
- Potential centralization (future): if we discover overlap, promote shared adapters to packages/

## 14) Optional migration notes (non‑greenfield repos)

- Replace legacy toasts with Sonner adapter; mount `<Toaster />` at root
- Update any `radix-ui` imports to scoped `@radix-ui/react-*`
- Remove typography wrappers in favor of native tags + tokens
- Extract hard‑coded content into props; add callbacks for actions (copy, follow, buy)
- Convert rails to container query grid switches; ensure intrinsic image sizes

## 15) Original Notes → Plan mapping (assurance)

- A1 Principles → Sections 0.2, 3, 5, 10, 11 (vendor read-only, adapters only, tokens, a11y)
- A2 File layout → Sections 0.2, 1 (per-app directories)
- A3 Install/pin vendor → Sections 0.2, 3, 10 (`UPGRADES.md`)
- A4 Import discipline (ESLint) → Section 10 (Biome restriction instead of ESLint)
- A5 Adapter conventions → Section 5 (variants/sizes, mapping, a11y, semantics)
- A6 Token system → Section 2 (colors/radius/motion/spacing; reduced motion)
- A7 Tests/docs → Section 13 (next phase)
- A8 Upgrade playbook → Sections 3, 10, 13
- B1 Route/data shape → Sections 7, 8 (loader/collections; typed later)
- B2 Composition → Section 7 (pieces, semantics, toaster)
- B3 Responsiveness → Sections 7, 11 (container queries, aspect ratios)
- B4 Accessibility → Sections 5, 7, 11
- B5 Perf/hydration/SEO → Sections 7, 11, 13 (SEO next)
- B6 Analytics → Section 9 (PostHog plan)
- C1/C2 Component sourcing → Sections 3, 5, 6
- D1–D7 Execution → Sections 0.2, 2–9 consolidated; optional migration notes in Section 14
- E1–E3 Governance → Section 10 (Biome), Section 13 (tests/Storybook registry later)
- F DoD → Section 12

This mapping ensures no guidance from the original notes was lost and clarifies a greenfield‑first flow with optional migration guidance.

---

Create a detailed component spec for any specific component?
Build a starter theme configuration file for your project?
Create a Mermaid diagram of the component hierarchy?
Generate a migration plan from your current event page?
Prototype a specific feature (registration card, cover glow effect)?
