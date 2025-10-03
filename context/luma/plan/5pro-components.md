# Components

> Notes grounded in Luma’s DOM
> The Luma event page exposes sections such as a “Hosted By” card, attendees/“Going” strip, title/featured pill, date/time rows, and location rows; you can see evidence of these in the page structure (e.g., `.hosts`, `.title`, `.calendar-card`, `.info-rows`, `.guests-button`, `.featured-pill`).

---

## 1) High‑level page composition

```none
<EventPage>
  <EventHero>
    <FeaturedInPill />        // “Featured in …”
    <EventTitle />
    <PresentedByBadge />      // “Presented by …”
    <HeroActions />           // Share/Subscribe
  </EventHero>

  <EventMeta>
    <EventDateTime />
    <EventLocation />
    <AddToCalendarButtons />       // optional; render only if calendar data available
  </EventMeta>

  <TicketsPanel>              // Drawer / card / modal (“Get Tickets”)
    <TicketList>
      <TicketCard featured />
      <TicketCard />
      <TicketCard />
    </TicketList>
    <CartFooter />            // total, CTA
  </TicketsPanel>

  <AboutCard />
  <HostedByCard />
  <AttendeesCard />
  <CategoryChips />
  <FooterActions />           // Contact host, Report event
</EventPage>
```

---

## 2) Key components and their **functional inputs**

Below, each component lists **what it needs** (props/data). Enums and types are expanded in §3.

### EventHero

- `event: Event`
- `featuredIn?: { name: string; url?: string; avatarUrl?: string }`
- Behavior: renders `<FeaturedInPill>` if `featuredIn` exists; shows event cover/title and calendar/host context.

### FeaturedInPill

- `collectionName: string`
- `collectionUrl?: string`
- `avatarUrl?: string`
- Visual: subtle pill with an avatar and chevron; acts as a link.

### PresentedByBadge

- `calendarOrSeries: { name: string; url: string; avatarUrl?: string }`
- Optional “Subscribe” button handler.
- Optional overall; if absent, surface “Presented with …” text inside AboutCard content.

### EventTitle

- `title: string`

### EventMeta (wrapper)

- `children` (one or more rows such as date/time, location, add-to-calendar if present)

#### EventDateTime

- `start: string | Date`
- `end?: string | Date`
- `timeZone: string` (e.g., `America/Los_Angeles`)
- `formatOptions?: Intl.DateTimeFormatOptions`
- Derived text: “Monday, October 13 · 5:00 PM – 7:00 PM GMT+1”

#### EventLocation

- `isOnline: boolean`
- If `isOnline`: `joinUrl?: string`, `instructions?: string`
- If in‑person:

  - `venueName?: string`
  - `addressLine1?: string`
  - `addressLine2?: string`
  - `city?: string`, `region?: string`, `postal?: string`, `country?: string`
  - `mapUrl?: string`, `geo?: { lat: number; lng: number }`

### TicketsPanel (the “Get Tickets” UI)

- **Props**

  - `tickets: Ticket[]` (see §3)
  - `currency: string` (ISO 4217)
  - `initialSelected?: Record<Ticket['id'], number>`
  - `onCheckout: (cart: Cart, ctx: { eventId: string }) => void`
  - `onChange?: (cart: Cart) => void`
  - `ui?: { showHeader?: boolean; ctaLabel?: string }`

- **Behaviors to support (from your screenshot)**

  - Featured ticket with elevated background.
  - Each ticket shows name, price, description, availability badge/dot, and “available until …” date.
  - Quantity stepper (– / +) inline for featured; collapsed rows with just a [+] button for others.
  - CTA at bottom (“Get Ticket”) disabled until `cart.totalQty > 0`.
  - Enforces min/max per ticket and per order; blocks selecting outside purchase window; respects status (e.g., sold out/waitlist).
  - Optional coupons/promo code field (hidden until needed).
  - Optional fee breakdown (service fees, tax) before checkout.
  - The “cart” here is ephemeral selection state for this panel (not a multi-step storefront cart); it supports CTA gating, fee/tax preview, and live inventory/window validation before redirecting to checkout.

#### TicketList

- `tickets: Ticket[]`
- Sorting strategy, e.g., featured first, then others by `sortOrder || createdAt`.

#### TicketCard

- `ticket: Ticket`
- `selectedQty: number`
- `onIncrement: (id) => void`
- `onDecrement: (id) => void`
- **Non‑obvious inputs you’ll likely need**

  - `status` (enum: `on_sale`, `scheduled`, `sold_out`, `waitlist`, `ended`, `hidden`, `paused`, `invite_only`, `external`)
  - `purchaseWindow?: { startsAt?: Date; endsAt?: Date }`
  - `availabilityLabel?: string` (e.g., “Available until Oct 11 at 12:00 PM PDT”)
  - `limits?: { minPerOrder?: number; maxPerOrder?: number; maxPerPerson?: number }`
  - `inventory?: { total?: number; remaining?: number; oversell?: boolean }`
  - `featured?: boolean` (fancy background/badge)
  - `badges?: Array<'new' | 'limited' | 'best_value' | 'sold_out' | 'members_only'>`
  - `requiresCode?: boolean` / `eligibleUserIdsOrRoles?: string[]`
  - `isAddon?: boolean` (requires base ticket)
  - `bundle?: { includes: string[] }` (e.g., “includes lunch + book”)
  - `pricing?: { price: Money; strikePrice?: Money; feeMode?: 'included' | 'plus_fees'; taxMode?: 'included' | 'plus_tax' }`
  - UI: optionally surface helper microcopy derived from `limits`/`inventory` (e.g., “Max 2 per person”, “Limited availability”) when caps are tight.

#### QuantityStepper

- `value: number`
- `min: number`
- `max: number`
- `disabled?: boolean`
- Emits `onChange(nextVal)`.

#### CartFooter

- `cart: Cart`
- Shows subtotal (and optionally fees/tax), total qty, and primary CTA.
- `ctaLabel?: string` (default “Get Ticket”)
- `ctaDisabledReason?: string` (e.g., outside purchase window)
- `onCheckout()`

### AboutCard

- `html: string | ReactNode` (sanitized)
- Optional “Read more/less” expansion; optional translation toggle.

### HostedByCard

- `hosts: Host[]` (name, avatar, profile URL, socials)
- Optional “Contact host” action.

### AttendeesCard

- `count: number`
- `sample: Array<{ id: string; avatarUrl: string; name?: string }>`
- “Alexandra Nadel, Alice Colligan and 49 others” style collapsed string.

### CategoryChips

- `categories: Array<{ slug: string; name: string; url?: string }>`

---

## 3) Suggested **TypeScript data contracts**

These are intentionally conservative; add/remove fields as your back‑end allows.

```ts
type ID = string;

type Money = { amount: number; currency: string }; // cents-minor recommended

type Event = {
  id: ID;
  title: string;
  summary?: string;
  descriptionHtml?: string;
  coverImageUrl?: string;
  timeZone: string; // e.g., "Europe/London"
  startsAt: string; // ISO
  endsAt?: string; // ISO
  featuredIn?: { name: string; url?: string; avatarUrl?: string };
  presentedBy?: { name: string; url?: string; avatarUrl?: string };
  categories?: Array<{ slug: string; name: string; url?: string }>;
  location: Venue;
  tickets: Ticket[];
};

type Venue =
  | { kind: "online"; joinUrl?: string; instructions?: string }
  | {
      kind: "in_person";
      venueName?: string;
      address?: {
        line1?: string;
        line2?: string;
        city?: string;
        region?: string;
        postal?: string;
        country?: string;
      };
      mapUrl?: string;
      geo?: { lat: number; lng: number };
    };

type TicketStatus =
  | "on_sale"
  | "scheduled"
  | "sold_out"
  | "waitlist"
  | "ended"
  | "hidden"
  | "paused"
  | "invite_only"
  | "external";

type Ticket = {
  id: ID;
  name: string;
  description?: string;
  pricing: {
    price: Money;
    strikePrice?: Money;
    feeMode?: "included" | "plus_fees";
    taxMode?: "included" | "plus_tax";
  };
  status: TicketStatus;
  availabilityLabel?: string; // i18n-ready copy (“Available until …”)
  purchaseWindow?: { startsAt?: string; endsAt?: string }; // ISO
  limits?: {
    minPerOrder?: number;
    maxPerOrder?: number;
    maxPerPerson?: number;
  };
  inventory?: { total?: number; remaining?: number; oversell?: boolean };
  sortOrder?: number;
  featured?: boolean; // highlighted treatment
  badges?: Array<
    "new" | "limited" | "best_value" | "sold_out" | "members_only"
  >;
  requiresCode?: boolean;
  eligibleUserIdsOrRoles?: string[];
  isAddon?: boolean; // requires base ticket
  bundle?: { includes: string[] }; // e.g., ["All three movies", "Lunch", "Free book"]
  metadata?: Record<string, unknown>; // escape hatch
};

type Host = {
  id: ID;
  name: string;
  avatarUrl?: string;
  profileUrl?: string;
  socials?: Partial<{ x: string; linkedin: string; website: string }>;
};

type CartLine = { ticketId: ID; name: string; unitPrice: Money; qty: number };
// UI-only selection state used to compute totals and validate before redirecting to checkout; not a persisted storefront cart.
type Cart = {
  lines: CartLine[];
  subtotal: Money;
  fees?: Money;
  tax?: Money;
  total: Money;
  totalQty: number;
};
```

---

## 4) Tickets **state & rules** to wire in

- **Visibility**

  - Show tickets with `status !== 'hidden'`.
  - If `status === 'scheduled'`, show row but disable stepper and label as “On sale {date}”.

- **Availability window**

  - If `purchaseWindow.endsAt` < now → treat as `ended` (disable selection, show “Unavailable since …”).
  - If `purchaseWindow.startsAt` > now → `scheduled`.

- **Inventory**

  - `remaining <= 0` → `sold_out` unless `waitlist` explicitly enabled.
  - Support **per‑order** and **per‑person** caps (enforce in UI and server).

- **Eligibility**

  - `requiresCode` / `eligibleUserIdsOrRoles` should gate the stepper until verified.
  - Note: Token/wallet-gated eligibility is out of scope for us; while Luma sometimes shows a wallet-verification notice, we do not implement on-chain gating (intentional non-goal).

- **CTA enablement**

  - Enable “Get Ticket” only when `cart.totalQty >= minOrderTotal` and **all** chosen lines satisfy limits & windows.

- **Featured**

  - `ticket.featured === true` → expanded card with inline quantity stepper and elevated background/badge.

> Your screenshot examples (“VIP All Day Plus Book & Food!” featured with inline –/+, other $25 rows with just a [+], green dot + “Available until …”, and a single **Get Ticket** CTA) fall out cleanly from the above props and rules.

---

## 5) Other section inputs

### AboutCard

- `descriptionHtml` (sanitized), optional “Expand” if exceeds N characters.
- Optional: “Translate” affordance, if applicable.

### HostedByCard

- `hosts: Host[]` with optional X/LinkedIn links.
- Optional “Contact Host” handler.

### AttendeesCard

- `count` and `sample` avatars; on click, open attendees modal/list.

### FooterActions

- `onContactHost()`, `onReportEvent()`

---

## 6) Hooks / state management (optional but handy)

- `useEvent(eventId)` → loads `Event`
- `useTickets(eventId)` → returns `tickets`, hydration/refresh
- `useCart()` → `{ cart, add(ticketId), remove(ticketId), setQty(ticketId, n) }`
- `useCheckout()` → handles server validation, reserves inventory, redirects to payment
- Cart semantics: no persistent “shopping cart”—just ephemeral selection state that becomes checkout line items. We keep a minimal `Cart` to compute totals, gate the CTA, and perform `onChange` validations (inventory, windows).

---

## 7) Accessibility & i18n checklist

- Steppers are buttons with proper `aria-label` (“Increase quantity of {ticket}”).
- Status text exposed for screen readers (e.g., `aria-live` on “Sold Out”, “Available until …”).
- All dates run through `Intl.DateTimeFormat` with `timeZone`.
- Currency rendered with `Intl.NumberFormat` using `event.currency`.
- Provide keyboard focus rings and trap focus if the TicketsPanel is a modal.

---

## 8) Minimal file layout (example)

```none
/components/event/
  EventPage.tsx
  EventHero.tsx
  FeaturedInPill.tsx
  PresentedByBadge.tsx
  EventTitle.tsx
  EventMeta/
    EventDateTime.tsx
    EventLocation.tsx
    AddToCalendarButtons.tsx
  Tickets/
    TicketsPanel.tsx
    TicketList.tsx
    TicketCard.tsx
    QuantityStepper.tsx
    CartFooter.tsx
  AboutCard.tsx
  HostedByCard.tsx
  AttendeesCard.tsx
  CategoryChips.tsx

/types/
  event.ts          // types from §3

/hooks/
  useEvent.ts
  useTickets.ts
  useCart.ts
  useCheckout.ts
```

---

## 9) Sample ticket payloads mapped to your screenshot

```json
[
  {
    "id": "vip",
    "name": "VIP All Day Plus Book & Food!",
    "description": "Enjoy the full day of events including all three movies and lunch...",
    "pricing": { "price": { "amount": 5500, "currency": "USD" } },
    "status": "on_sale",
    "availabilityLabel": "Available until Oct 11 at 12:00 PM PDT",
    "purchaseWindow": { "endsAt": "2025-10-11T19:00:00Z" },
    "limits": { "minPerOrder": 1, "maxPerOrder": 10 },
    "inventory": { "remaining": 42 },
    "featured": true,
    "badges": ["best_value"],
    "bundle": { "includes": ["All three movies", "Lunch", "Free book"] }
  },
  {
    "id": "film-1",
    "name": "Show Her the Money",
    "pricing": { "price": { "amount": 2500, "currency": "USD" } },
    "status": "on_sale",
    "availabilityLabel": "Available until Oct 11 at 10:30 AM PDT",
    "purchaseWindow": { "endsAt": "2025-10-11T17:30:00Z" }
  },
  {
    "id": "film-2",
    "name": "Lilly",
    "pricing": { "price": { "amount": 2500, "currency": "USD" } },
    "status": "on_sale",
    "availabilityLabel": "Available until Oct 11 at 1:30 PM PDT"
  },
  {
    "id": "film-3",
    "name": "Still Working 9–5",
    "pricing": { "price": { "amount": 2500, "currency": "USD" } },
    "status": "on_sale",
    "availabilityLabel": "Available until Oct 11 at 4:30 PM PDT"
  }
]
```

---

### Wrap‑up

If you wire the page using the component map in §1 and the data contracts in §3, you’ll have everything needed to reproduce:

- the **Get Tickets** behavior (featured card, per‑ticket caps, availability windows, CTA gating),
- the **Title/pills/Presented by** area,
- **Event Date & Location** rows,
- **About**, **Hosted By**, **People going**, and **Categories**.

If you want, I can turn these into concrete `*.tsx` component skeletons next.

Medical References:

1. None — DOI: file-3YLytSvZV3iczpSDN6czsY
