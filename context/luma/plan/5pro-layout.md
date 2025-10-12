# Event page layout skeleton (Tailwind v4 + shadcn/ReUI‑friendly)

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

            {/* Map / other sidebar cards go here */}
            <div className="space-y-3">
              <div className="bg-card/80 backdrop-blur-[16px] ring-1 ring-border rounded-xl p-4">
                Map / Location
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

              {/* PresentedByBadge — Plan §5pro-components: PresentedByBadge */}
              <div className="inline-flex items-center gap-2 text-sm">
                <div
                  className="h-5 w-5 rounded bg-muted ring-1 ring-border"
                  aria-hidden
                />
                <span className="text-muted-foreground">Presented by</span>
                <a
                  href="/series"
                  className="underline-offset-2 hover:underline"
                >
                  Calendar / Series Name
                </a>
              </div>

              {/* HeroActions — share / subscribe (placeholder) */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  className="h-8 px-3 rounded border border-border hover:bg-muted"
                >
                  Share
                </button>
                <button
                  type="button"
                  className="h-8 px-3 rounded bg-primary text-primary-foreground"
                >
                  Subscribe
                </button>
              </div>
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

              {/* AddToCalendarButtons — Plan §5pro-components */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  className="h-8 px-3 rounded border border-border hover:bg-muted"
                >
                  Add to Google
                </button>
                <button
                  type="button"
                  className="h-8 px-3 rounded border border-border hover:bg-muted"
                >
                  Add to Apple
                </button>
                <button
                  type="button"
                  className="h-8 px-3 rounded border border-border hover:bg-muted"
                >
                  Download .ics
                </button>
              </div>
            </section>

            {/* 
              === TICKETS PANEL VISUAL MOCKUP ===
              
              This section demonstrates all visual states from 5pro-components.md.
              When implementing, this will be replaced with:
              
              <TicketsPanel 
                eventId={eventId}
                event={{ mixedTicketTypesAllowed, currency }}
                onCheckout={(cartItems, pricing) => {...}}
              />
              
              Key visual patterns shown:
              
              IMPORTANT: All tickets follow the same state machine:
              - qty=0: Add button with + icon
              - qty=1: Stepper with TRASH icon (not minus)
              - qty>1: Stepper with MINUS icon
              
              1. Featured ticket (qty=1 state in mockup)
                 - Elevated bg (bg-primary/5, ring-primary/20)
                 - Badge with dot indicator
                 - Quantity stepper showing (because qty=1)
                 - Bundle info display
                 - Trash icon visible (spec line 495, 956-961)
              
              2. Regular ticket (qty=0 state in mockup)
                 - Standard border styling
                 - "Add" button with + icon (spec line 978-988)
                 - Green availability dot
              
              3. Low inventory warning
                 - Orange dot + "Only X left!" text
                 - From spec line 583-585: shown when remaining <= 5
              
              4. Locked ticket
                 - Greyed out (opacity-50)
                 - Info badge with reason (spec line 501-559)
                 - Disabled button
                 - From spec line 452-467: occurs when mixedTicketTypesAllowed=false
              
              5. Sold out ticket
                 - Greyed out
                 - "Sold Out" badge (spec line 511-513)
                 - No stepper/button
              
              6. CartFooter pricing
                 - Line-by-line breakdown (spec lines 1028-1054)
                 - Separator before total
                 - Dynamic CTA label with pluralization (spec line 1065)
                 - Disabled state when empty (spec line 1069-1072)
              
              Data layer (not shown in this visual mockup):
              - TanStack DB Collections (tickets via QueryCollection, cart via LocalStorage)
              - useLiveQuery for ticketUIStates (validation, button states, microcopy)
              - Server function calculateCartTotal for fees/tax
              - Real-time polling every 30s for sold limits (spec line 321)
            */}
            <section className="bg-card/80 backdrop-blur-[16px] ring-1 ring-border rounded-xl overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-border">
                <h2 className="text-xl font-semibold">Get Tickets</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Select quantity for each ticket type
                </p>
              </div>

              {/* Ticket List */}
              <div className="p-4 space-y-3">
                {/* === FEATURED TICKET (qty=1 state, showing stepper with trash icon) === */}
                {/* Stepper appears when ticket is added; trash icon shown at qty=1 */}
                <div className="rounded-lg ring-1 ring-primary/20 p-4 bg-primary/5 relative">
                  {/* Badge overlay */}
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-xs font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Best Value
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base">
                        VIP All Day Plus Book & Food!
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        Full day access with lunch, refreshments, and a signed
                        book
                      </p>

                      {/* Availability label with green dot */}
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        <span>Available until Oct 11 at 12:00 PM PDT</span>
                      </div>

                      {/* Bundle info (from spec: bundle.includes) */}
                      <div className="mt-2 text-xs text-muted-foreground">
                        Includes: All three movies · Lunch · Free book
                      </div>
                    </div>

                    {/* Right: Price */}
                    <div className="text-right shrink-0">
                      <div className="font-semibold text-lg">$55.00</div>
                      <div className="text-xs text-muted-foreground">
                        plus fees
                      </div>
                    </div>
                  </div>

                  {/* Quantity Stepper (inline for featured) */}
                  {/* From spec line 947-977: Shows trash icon when qty === 1 */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        className="h-9 w-9 rounded-lg border border-border hover:bg-muted flex items-center justify-center transition-colors"
                        aria-label="Remove ticket"
                      >
                        {/* Trash icon shown when qty === 1 (spec line 495, 961) */}
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            d="M3 4h10M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1m1 0v9a1 1 0 01-1 1H5a1 1 0 01-1-1V4h8z"
                          />
                        </svg>
                      </button>

                      <span className="w-8 text-center font-medium tabular-nums">
                        1
                      </span>

                      <button
                        type="button"
                        className="h-9 w-9 rounded-lg border border-border hover:bg-muted flex items-center justify-center transition-colors"
                        aria-label="Increase quantity"
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            d="M8 4v8M4 8h8"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Helper text (spec line 562-613: contextual microcopy) */}
                    <div className="text-xs text-muted-foreground">
                      Max 10 per order
                    </div>
                  </div>
                </div>

                {/* === REGULAR TICKET (qty=0 state, showing Add button) === */}
                {/* All tickets show Add button when qty=0; stepper appears after adding */}
                <div className="rounded-lg ring-1 ring-border p-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm">
                        Show Her the Money
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        <span>Available until Oct 11 at 10:30 AM PDT</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="font-medium text-sm">$25.00</div>
                        <div className="text-xs text-muted-foreground">
                          plus fees
                        </div>
                      </div>

                      {/* Add button (spec line 980-987) */}
                      <button
                        type="button"
                        className="h-8 px-3 rounded-lg border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors flex items-center gap-1"
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            d="M8 4v8M4 8h8"
                          />
                        </svg>
                        <span className="text-sm font-medium">Add</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* === TICKET WITH LOW INVENTORY WARNING === */}
                {/* From spec line 583-585: Show "Only X left!" when remaining <= 5 */}
                <div className="rounded-lg ring-1 ring-border p-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm">Lilly</h3>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                        <span className="text-orange-600 dark:text-orange-400 font-medium">
                          Only 3 left!
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="font-medium text-sm">$25.00</div>
                        <div className="text-xs text-muted-foreground">
                          plus fees
                        </div>
                      </div>
                      <button
                        type="button"
                        className="h-8 px-3 rounded-lg border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors flex items-center gap-1"
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            d="M8 4v8M4 8h8"
                          />
                        </svg>
                        <span className="text-sm font-medium">Add</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* === LOCKED/UNAVAILABLE TICKET (greyed out) === */}
                {/* From spec line 452-467: Locked when mixedTicketTypesAllowed=false and cart has other tickets */}
                <div className="rounded-lg ring-1 ring-border p-3 opacity-50 cursor-not-allowed">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm">Still Working 9–5</h3>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Available until Oct 11 at 4:30 PM PDT
                      </div>
                      {/* Unavailable reason (spec line 501-559) */}
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 text-xs">
                        <svg
                          className="h-3.5 w-3.5"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            d="M8 4v4m0 4h.01M14 8A6 6 0 112 8a6 6 0 0112 0z"
                          />
                        </svg>
                        Remove other tickets to add this one
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="font-medium text-sm">$25.00</div>
                        <div className="text-xs text-muted-foreground">
                          plus fees
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled
                        className="h-8 px-3 rounded-lg border border-border bg-muted/50 text-muted-foreground cursor-not-allowed flex items-center gap-1"
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            d="M8 4v8M4 8h8"
                          />
                        </svg>
                        <span className="text-sm font-medium">Add</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* === SOLD OUT TICKET === */}
                {/* From spec line 511-513, 547-556: Status-based unavailable reasons */}
                <div className="rounded-lg ring-1 ring-border p-3 opacity-50 cursor-not-allowed">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm">
                          Early Bird Special
                        </h3>
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-destructive/10 text-xs font-medium text-destructive">
                          Sold Out
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Was $20.00 · plus fees
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground shrink-0">
                      Sold out
                    </div>
                  </div>
                </div>
              </div>

              {/* === CART FOOTER === */}
              {/* From spec lines 1012-1075: Detailed pricing breakdown */}
              <div className="border-t border-border bg-background/50 p-4">
                <div className="space-y-3">
                  {/* Pricing breakdown (spec lines 1028-1054) */}
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Subtotal (2 tickets)
                      </span>
                      <span className="font-medium tabular-nums">$80.00</span>
                    </div>

                    {/* Service fees (spec lines 1034-1039) */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Service fees</span>
                      <span className="tabular-nums">+$8.00</span>
                    </div>

                    {/* Tax (spec lines 1041-1046) */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Tax</span>
                      <span className="tabular-nums">+$7.04</span>
                    </div>

                    {/* Separator (spec line 1048) */}
                    <div className="border-t border-border my-2" />

                    {/* Total (spec lines 1050-1053) */}
                    <div className="flex items-center justify-between font-semibold">
                      <span>Total</span>
                      <span className="tabular-nums text-lg">$95.04</span>
                    </div>
                  </div>

                  {/* CTA (spec lines 1057-1066) */}
                  <button
                    type="button"
                    className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                  >
                    Get Tickets
                  </button>

                  {/* Empty state variant (spec lines 1069-1072) - commented for reference */}
                  {/* 
                  <button
                    type="button"
                    disabled
                    className="w-full h-11 rounded-lg bg-secondary text-secondary-foreground font-medium opacity-50 cursor-not-allowed"
                  >
                    Select tickets to continue
                  </button>
                  */}
                </div>
              </div>
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

            {/* AttendeesCard — Plan §5pro-components */}
            <section className="bg-card/80 backdrop-blur-[16px] ring-1 ring-border rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-2">People going</h2>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-10 w-10 rounded-full ring-2 ring-background overflow-hidden bg-muted"
                    />
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  57 people attending
                </div>
              </div>
            </section>

            {/* CategoryChips — Plan §5pro-components */}
            <section className="bg-card/80 backdrop-blur-[16px] ring-1 ring-border rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-2">Categories</h2>
              <div className="flex flex-wrap gap-2">
                {["film", "documentary", "networking"].map((c) => (
                  <a
                    key={c}
                    href={`/category/${c}`}
                    className="px-3 py-1 rounded-full border border-border text-sm hover:bg-muted"
                  >
                    {c}
                  </a>
                ))}
              </div>
            </section>

            {/* FooterActions — Plan §5pro-components */}
            <section className="bg-card/80 backdrop-blur-[16px] ring-1 ring-border rounded-xl p-6">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="h-10 px-4 rounded border border-border hover:bg-muted"
                >
                  Contact host
                </button>
                <button
                  type="button"
                  className="h-10 px-4 rounded border border-border hover:bg-muted"
                >
                  Report event
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
      {/* Mirrors CartFooter state machine (spec lines 1057-1072) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur-[16px] border-t border-border">
        <div className="p-4 space-y-2">
          {/* Quick total preview */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total (2 tickets)</span>
            <span className="font-semibold tabular-nums">$95.04</span>
          </div>

          {/* CTA - matches desktop CartFooter */}
          <button
            type="button"
            className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Get Tickets
          </button>

          {/* Empty state variant (commented for reference) */}
          {/* 
          <button
            type="button"
            disabled
            className="w-full h-12 rounded-lg bg-secondary text-secondary-foreground font-medium opacity-50 cursor-not-allowed"
          >
            Select tickets to continue
          </button>
          */}
        </div>
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
