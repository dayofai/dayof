Yes—let’s turn Luma’s DOM/CSS into a clean, Tailwind v4‑ready layout skeleton that matches your plan (glass nav, two‑column sticky, cover glow, mobile sticky CTA, shadcn/ReUI‑friendly).

Below is a minimal **React/TSX skeleton** you can drop into `apps/frontrow/src/features/event/index.tsx` (or a scratch file) to prove the structure. I’ve annotated where it aligns to phases in your plan and mirrored Luma’s layout decisions with Tailwind utilities.

---

## Event page layout skeleton (Tailwind v4 + shadcn/ReUI‑friendly)

```tsx
// apps/frontrow/src/features/event/EventPageSkeleton.tsx
// Phases: 2.1 (Glass Nav), 2.2 (Two-column), 2.3 (Cover glow), 3.x sections

export default function EventPageSkeleton() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* === Glassmorphism Navigation — Plan §2.1 === */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-[16px] border-b border-border transition-all">
        <div className="mx-auto max-w-[820px] px-4 md:px-6 py-3 flex items-center justify-between">
          {/* Left: Logo / wordmark */}
          <a href="/" className="inline-flex items-center gap-2">
            <span className="sr-only">Home</span>
            {/* Replace with your <Logo/> */}
            <div className="h-8 w-8 bg-muted rounded" />
            <div className="hidden md:block text-sm font-medium">
              Your Brand
            </div>
          </a>

          {/* Right: time + links (hidden on small screens) */}
          <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
            <time className="tabular-nums" dateTime="2025-10-09T19:00">
              Thu 7:00 PM
            </time>
            <a href="/discover" className="hover:text-foreground">
              Explore Events
            </a>
            <a href="/signin" className="hover:text-foreground">
              Sign In
            </a>
          </div>
        </div>
      </nav>

      {/* === Optional background gradient/matte === */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
      </div>

      {/* === Page container (matches Luma’s centered column) — Plan §2.2 === */}
      <div className="mx-auto max-w-[820px] px-4 md:px-6 py-8 md:py-10">
        <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8">
          {/* === LEFT COLUMN (sticky on desktop) === */}
          <aside className="w-full md:w-[280px] lg:w-[330px] md:sticky md:top-24 md:self-start flex flex-col gap-4">
            {/* Cover with glow — Plan §2.3 */}
            <div className="relative">
              {/* Glow layer (beneath) */}
              <div
                aria-hidden
                className="absolute inset-x-0 top-4 h-full rounded-xl opacity-20 dark:opacity-30"
                style={{
                  backgroundImage: "url(/placeholder-cover.jpg)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "blur(24px) saturate(1.2) brightness(0.8)",
                  mixBlendMode: "multiply",
                  transform: "scale(1.005)",
                }}
              />
              {/* Main image */}
              <img
                src="/placeholder-cover.jpg"
                alt="Event cover"
                className="relative z-10 w-full aspect-square object-cover rounded-xl ring-1 ring-border/50"
                loading="eager"
                decoding="async"
              />
            </div>

            {/* Desktop-only: “Presented by”/Calendar card — Plan §3.5 */}
            <div className="hidden md:block">
              <div className="bg-card/80 backdrop-blur-[16px] ring-1 ring-border rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded bg-muted ring-1 ring-border" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">
                      Presented by
                    </div>
                    <div className="text-sm font-medium">
                      Calendar / Host Name
                    </div>
                  </div>
                  <button
                    type="button"
                    className="h-8 px-3 rounded bg-muted text-foreground hover:-translate-y-0.5 transition"
                  >
                    Subscribe
                  </button>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Short description shown on desktop only.
                </p>
              </div>
            </div>

            {/* Map / categories / admin links go here (cards) */}
            <div className="space-y-3">
              <div className="bg-card/80 backdrop-blur-[16px] ring-1 ring-border rounded-xl p-4">
                Map / Location
              </div>
              <div className="bg-card/80 backdrop-blur-[16px] ring-1 ring-border rounded-xl p-4">
                Categories
              </div>
              <div className="bg-card/80 backdrop-blur-[16px] ring-1 ring-border rounded-xl p-4">
                Contact / Report
              </div>
            </div>
          </aside>

          {/* === RIGHT COLUMN (main) === */}
          <main className="flex-1 min-w-0 flex flex-col gap-6">
            {/* Featured pill (conditional) — Plan §3.1 */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-sm">
              <div className="h-5 w-5 rounded bg-muted ring-1 ring-border" />
              <span>Featured in Calendar Name</span>
            </div>

            {/* Title block — native <h1> — Plan §3.1 */}
            <header className="space-y-2">
              <h1 className="text-3xl md:text-5xl lg:text-6xl leading-[1.1] font-normal text-balance">
                Event Title That Can Span Multiple Lines
              </h1>
              <a
                href="/host"
                className="group inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Host / Org Name
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m9 18 6-6-6-6"
                  />
                </svg>
              </a>
            </header>

            {/* Meta info rows (date/time, location) — Plan §3.2 */}
            <section className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 flex items-center justify-center rounded border border-border text-muted-foreground">
                  {/* Calendar icon/card */}
                  <div className="text-center">
                    <div className="text-xs uppercase leading-none">Oct</div>
                    <div className="text-base font-medium leading-none">13</div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Monday, October 13</div>
                  <div className="text-sm text-muted-foreground">
                    5:00 PM – 7:00 PM GMT+1
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 flex items-center justify-center rounded border border-border text-muted-foreground">
                  {/* Map pin icon */}
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                  >
                    <g
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 6.854C2 11.02 7.04 15 8 15s6-3.98 6-8.146C14 3.621 11.314 1 8 1S2 3.62 2 6.854"></path>
                      <path d="M9.5 6.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"></path>
                    </g>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    Register to See Address
                  </div>
                  <div className="text-sm text-muted-foreground">
                    London, England
                  </div>
                </div>
              </div>
            </section>

            {/* Registration / CTA card — Plan §3.3 */}
            <section className="bg-card/80 backdrop-blur-[16px] ring-1 ring-border rounded-xl p-4">
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-semibold">$50</div>
                <div className="text-sm text-muted-foreground">
                  123 / 200 attending
                </div>
              </div>
              <button
                type="button"
                className="mt-4 w-full h-11 rounded bg-primary text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-md"
              >
                Buy Tickets
              </button>
            </section>

            {/* Content sections — About / Lineup / Venue / Host / Attendees */}
            <section className="bg-card/80 backdrop-blur-[16px] ring-1 ring-border rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-2">About</h2>
              <p className="text-sm text-muted-foreground">Body copy here…</p>
            </section>

            <section className="bg-card/80 backdrop-blur-[16px] ring-1 ring-border rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-2">Host</h2>
              {/* Host/Attendees cards from Plan §3.5 */}
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-muted overflow-hidden ring-1 ring-border" />
                <div className="flex-1">
                  <div className="font-medium">Host Name</div>
                  <p className="text-sm text-muted-foreground">Short bio…</p>
                </div>
                <button className="h-8 px-3 rounded border border-border hover:bg-muted">
                  Follow
                </button>
              </div>
            </section>
          </main>
        </div>

        {/* Mobile-only “Presented by” card (moves below main on phones) */}
        <div className="md:hidden mt-6">
          <div className="bg-card/80 backdrop-blur-[16px] ring-1 ring-border rounded-xl p-4">
            Mobile “Presented by” content…
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA — Plan §2.2 */}
      <div className="md:hidden fixed bottom-0 inset-x-0 p-4 bg-background/95 backdrop-blur-[16px] border-t border-border">
        <button className="w-full h-12 rounded bg-primary text-primary-foreground">
          Buy Tickets
        </button>
      </div>
    </div>
  );
}
```

**Why this layout matches Luma’s structure (and your plan):**

- Luma’s event page uses a **two‑column wrapper** with a left column sized ~330px, shrinking to ~300/280 at narrower widths, and collapsing on small screens. The Tailwind skeleton mirrors that with `md:w-[280px] lg:w-[330px]`, `md:sticky md:top-24`, and a column collapse to a single column on mobile.
- Their main wrapper (`.event-page-content-wrapper`) is a flex container with `align-items:start`, padding, and a variable gap; we replicate with `flex items-start gap-6 md:gap-8 px-4 md:px-6`.
- The **glass nav** pattern matches Luma’s mixed‑blend/blurred top area; we keep the important bits that matter visually—sticky, border divider on scroll, background translucency, backdrop blur.
- The **cover glow** uses a _dual-layer image_ with a blurred, multiplied, offset underlay (opacity ↑ in dark mode). That’s rendered inline here so you don’t need extra CSS.
- The **meta rows** (calendar card + location pin) follow their “icon container + title/desc” pattern and copy the calendar card idea.
- The left column has **desktop-only** “Presented by” content and a **mobile-only** version below the main column, matching Luma’s `.event-page-desktop-only`/`.event-page-mobile-only`.

---

## Mapping to your plan

- **Phase 2.1 Glassmorphism Navigation** — implemented with `bg-background/80 backdrop-blur-[16px] border-b` (Tailwind opacity instead of custom CSS var).
- **Phase 2.2 Two‑column sticky layout** — `md:sticky md:top-24` on the left column, `md:flex-row` with `gap-6 md:gap-8`, and a hard **330px** slot at desktop.
  _Note:_ Luma collapses at **≤650px**; we standardized on Tailwind’s `md` (768px) which is what you already proposed—good tradeoff for maintainability.
- **Phase 2.3 Cover image glow** — exact effect: blur 24px + saturate(1.2) + brightness tweak + `mix-blend-mode:multiply`; dark mode increases opacity.
- **Phase 3.x Cards** — use `bg-card/80 backdrop-blur-[16px] ring-1 ring-border rounded-xl` so shadcn’s tokens drive colors; drop shadcn `<Card>` primitives in later if you prefer the JSX wrappers.
- **Phase 4 Micro‑interactions** — added simple lift/chevron transitions via Tailwind utilities; you can swap in your tokenized `--easing-*`/`--duration-*` later.
- **Phase 5 Performance** — the skeleton leaves room for `srcSet` on the cover (Luma uses responsive sources); plug your image loader once data is wired.

---

## Small Tailwind token helpers

Add/confirm these utilities/tokens once (as in your plan’s Phase 1):

```css
/* apps/frontrow/src/index.css (excerpt) */
/* Utilities already in your plan: */
@layer utilities {
  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }
  .text-balance {
    text-wrap: balance;
  }
}

/* Shadows & animation tokens from your plan are compatible with this skeleton. */
```

This keeps everything Tailwind‑native while staying compatible with shadcn variables (`bg-card`, `border-border`, `text-muted-foreground`, etc.).

---

## What we intentionally _didn’t_ copy 1:1 (and why)

- **Exact breakpoints (650/450/820)** — Luma’s CSS uses custom cutoffs; your plan standardizes to Tailwind (`sm`/`md`/`lg`). That’s the right call; the layout still behaves the same and is easier to maintain.
- **Three.js gradient canvas + “shader overlays”** — purely visual garnish; you can add a decorative background later if desired.

---

## Quick validation checklist

- Sticky left column at `md+`; collapses to single column below.
- Cover glow uses underlay blur + multiply + dark‑mode opacity.
- Desktop shows “Presented by” card in the left column; mobile version moves below main.
- Nav is sticky, translucent, blurred; time/links hide on small screens.

---

## Next steps

- Wire in **real data** via your `QueryCollection` (Plan §5.2) and replace placeholders (`host`, `calendar`, `price`).
- Swap generic `<div>` cards with **shadcn Card** primitives to standardize spacing and headers (Plan §3.4).
- Add the **mobile sticky CTA** state machine (sold out / approval / token‑gated) per your RegistrationCard logic (Plan §3.3).
- If you want pixel‑parity with Luma, add responsive `srcset` on the cover and fine‑tune left widths to `md:280px, lg:300px, xl:330px` (optional).

If you’d like, I can refactor this skeleton directly into your `/features/event/index.tsx` scaffold from the plan and split out `Navigation`, `CoverImage`, and `TitleBlock` so you can plug your adapters immediately.

Medical References:

1. None — DOI: file-3YLytSvZV3iczpSDN6czsY
