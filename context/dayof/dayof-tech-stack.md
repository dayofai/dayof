# DayOf Technical Stack Documentation

## Core Principles

### Single Language Philosophy

**TypeScript Everywhere**: The entire stack—frontend, backend, mobile, orchestration—uses TypeScript exclusively.

**Rationale**:

- No context switching between backend and frontend languages
- Unified type system across all layers
- Better code sharing in monorepo
- Consistent developer experience

### Version Control First

**Rule**: If it can't be version controlled in our repository, we try not to use it.

**Exceptions**: Some necessary external services (Stripe, Inngest, Neon), but even these integrate deeply with our codebase.

### Monorepo Architecture

**Turborepo**: Everything lives in a single repository with shared packages and separate apps.

**Benefits**:

- Shared code and types across all applications
- Atomic commits across multiple apps
- Unified build and deployment pipeline
- Single source of truth

---

## Database Layer

### Primary Database: Neon Postgres

**Current**: Postgres 17 (via Neon)
**Migration Plan**: Move to Postgres 18 when it hits GA

**Why Neon**:

- Serverless Postgres with excellent scaling
- Region flexibility (can match Vercel IAD1)
- Branching for development environments
- Cost-effective for our workload

**Region Strategy**:

- Hosting: Vercel IAD1
- Database: Neon IAD1
- **Critical**: Low latency between app and database

### ORM/Query Builder: Drizzle

**Current**: Drizzle Relations v2 (alpha/beta)

**Why Drizzle (vs traditional ORMs)**:

- Lightweight, not a full ORM (more of a query builder)
- TypeScript-first with excellent type inference
- SQL-like syntax (easier mental model)
- Better performance than Prisma
- No runtime overhead

**Version Strategy**:

- Running v2 alpha/beta for Relations API
- Significant performance and DX improvements over v1
- Accepting bleeding-edge risk because v2 should be stable by production
- Avoiding complete rewrite of queries when v2 releases (already migrated from v1)

**Not an ORM**: Calling Drizzle an "ORM" is a misnomer—it's a database access library with type safety.

---

## Monorepo Structure

### Apps (7 Total)

1. **Auth** (Hono + BetterAuth)

   - Authentication and authorization service
   - Deploys to: `auth.dayof.ai`
   - Standalone to avoid coupling with other apps

2. **Honoken** (Hono + Apple PassKit)

   - Apple Wallet pass generation and management
   - Apple PassKit Web Service API (push updates, registrations, downloads)
   - APNs callbacks for pass updates
   - Deploys to: `honoken.dayof.ai`
   - API shape constrained by Apple's PassKit specification
   - Using **PassKit-generator** library from GitHub
   - Certificate management detailed in Honoken README

3. **Front Row** (TanStack Start, SSR)

   - Customer-facing e-commerce application
   - Event pages and marketplace
   - Checkout flows
   - Deploys to: `dayof.ai` (main domain)
   - Rendering: Default SSR with selective client components

4. **Backstage** (TanStack Start, SPA)

   - Management dashboard and admin interface
   - Multi-tenant user portals
   - Event creation and management
   - Deploys to: `backstage.dayof.ai`
   - Rendering: Full SPA for performance
   - **PowerSync Collections backing**: Full database sync for offline-first dashboard
   - **Dynamic loading by role**: Attendee-only → minimal collections, Venue owner → full collections

5. **Crew** (React Native + Expo)

   - Staff scanning application for door operations
   - Offline-first with PowerSync
   - iOS only (iPhone 12 Pro/13+ minimum)
   - Deploys to: App Store
   - **Rename pending** (to be decided in 2-3 weeks)
   - **PowerSync Collections backing**: Offline-first scanning, sync when online

6. **Events** (Hono)

   - Inngest endpoint for centralized function execution
   - Deploys to: `events.dayof.ai`
   - Simple Hono server exposing Inngest handler
   - No other functionality currently
   - All apps call this endpoint when triggering Inngest functions
   - See: [Inngest Vercel Deployment](https://www.inngest.com/docs/deploy/vercel)

7. **Handbook** (Status: Likely to be removed)
   - Internal documentation app
   - Not in active use
   - Will probably be deleted

**Critical Separation**: Front Row (revenue) stays online even if Backstage or other apps have issues.

### Packages

Shared packages in the monorepo (simple naming, no scopes):

- **`database`**: Drizzle schemas, migrations, DB client, types
- **`inngest`**: Inngest functions and orchestration code
- **`cli-utils`**: Command-line utilities for monorepo/devops tasks
- **`posting`**: API testing configurations (uses [posting.sh](https://posting.sh/))

**Package Philosophy**: Version-controlled, CLI-based testing (like Postman but in code).

---

## Frontend Architecture

### Framework: TanStack Start v1

**Just Released**: Moved to version 1 stable (correct timing prediction)

**Why TanStack Start**:

- Strong community momentum
- Modern React framework
- Flexible rendering strategies (SSR, SPA, hybrid)
- Integrates seamlessly with TanStack ecosystem
- Built on Vite (Void Zero ecosystem)
- Server functions for backend logic

**Two Deployment Strategy**:

| App           | Rendering Mode | Purpose              | Domain               |
| ------------- | -------------- | -------------------- | -------------------- |
| **Front Row** | SSR (default)  | Revenue generation   | `dayof.ai`           |
| **Backstage** | SPA            | Management interface | `backstage.dayof.ai` |

**Critical Separation**: If Backstage has issues, Front Row (revenue) stays online.

**Selective Rendering**:

- Front Row: Mostly SSR with some client components for interactivity
- Backstage: Full SPA for dashboard performance
- Can selectively SSR specific routes in Backstage if needed (e.g., attendee-only views)

### API Pattern: TanStack Start Server Functions

**Current Approach**: Keep it simple - use **TanStack Start server functions** for app-side server work.

**Why This Approach**:

- Minimize API surface area while core workflows mature
- Accelerate development velocity
- Reduce cognitive load
- Server functions can emit events to Inngest for orchestration
- Avoid premature abstraction

**Not Using** (currently):

- REST APIs
- GraphQL
- tRPC
- oRPC (maybe later, but not now)

**Server Functions Pattern**:

```typescript
// Apps trigger Inngest via server functions
export async function createTicket(data) {
  // Emit event to Inngest
  await inngest.send("ticket.created", data);
}
```

**Rationale**: Focus on building features, not API infrastructure. Server functions provide enough flexibility for current needs.

⚠️ **Open Question**: How does BetterAuth context pass to server functions? Need to research this.

### Honoken API Exception

**Honoken** (Apple PassKit service) has a **constrained API shape** dictated by Apple's PassKit Web Service specification:

- Pass registration/unregistration
- Push notification handling
- Pass updates and downloads
- APNs callbacks

The API must conform to Apple's requirements, not DayOf's internal patterns.

### State Management & Data Access: TanStack DB

**Philosophy**: Single data access paradigm across all platforms (web + mobile)

**Why TanStack DB**:

- Fine-grained reactivity
- Eliminates prop drilling (absolute 100% refusal to prop drill)
- Avoids Next.js pattern of 15 nested components passing props
- Maintains composability
- Works across web and React Native
- Unified data access layer

**Frontend Data Tools** (Not API layers):

| Tool               | Purpose                          | Usage                         |
| ------------------ | -------------------------------- | ----------------------------- |
| **TanStack Query** | Server state management, caching | Frontend only, NOT an API     |
| **TanStack Table** | Data table/grid components       | Frontend only, display tables |
| **TanStack DB**    | State management, data access    | Unified across web + mobile   |

**Implementation by App**:

| App               | Backing                    | Why                                         |
| ----------------- | -------------------------- | ------------------------------------------- |
| **Front Row**     | TanStack Query Collections | Server data fetching, caching               |
| **Backstage**     | PowerSync Collections      | Full database sync, offline-first dashboard |
| **Crew (Mobile)** | PowerSync Collections      | Offline-first scanning, sync when online    |

**Backstage Dynamic Loading Strategy**:

- Load different PowerSync collections based on user roles
- Example: Attendee-only user → load minimal transaction/ticket collections
- Example: Venue owner → load full event/venue/analytics collections
- Example: Affiliate + Attendee → load both affiliate and attendee collections
- Avoids loading unnecessary data
- Can selectively SSR routes for faster initial load if needed

**Goal**: Single data access layer via TanStack DB across:

- Front Row (web, SSR)
- Backstage (web, SPA)
- Crew (React Native/Expo)

### Forms: TanStack Form

**Why**: Stay in the TanStack ecosystem—consistency, less context switching.

### Query Management: TanStack Query

**Used in**: Front Row (backing TanStack DB with Query Collections)

**Why**: Industry-standard for server state management, caching, background refetching.

---

## Mobile Architecture

### Platform: React Native + Expo

**App Name**: Crew (rename pending in 2-3 weeks)

**In Monorepo**: Shares code with web apps (types, utilities, some business logic)

**Why Expo**:

- Simplified React Native development
- Managed workflow
- Over-the-air updates
- Good ecosystem support

**iOS Only**: No Android support

**Why iOS Only**:

- iPhone 12 Pro/13+ minimum (camera sensor quality threshold)
- Low-light scanning capability required for nightclub/venue conditions
- Android fragmentation adds significant complexity
- Target demographic has high iPhone penetration
- Easier to support single platform well

**Styling**: Native Wind (Tailwind for React Native)

**UI Components**: shadcn for React Native (consistency with web)

### Offline-First Architecture with PowerSync

**Critical Requirement**: Must function without network connectivity

**Sync Solution**: **PowerSync** (confirmed choice)

**Deployment**: **Managed PowerSync** (unless costs balloon)

- Not concerned about cost initially (only ~100 devices for first Spring Break)
- Connected to same Neon database as everything else

**Why PowerSync**:

- Most mature option for offline-first in React Native/Expo
- Postgres to SQLite sync
- Well-documented React Native support
- Proven in production environments
- Queued writes with automatic sync on reconnection

**Operational Behavior**:

- Collections synced locally to device
- App continues operating offline without special-case logic
- Writes are queued and pushed when connectivity returns
- **No meaningful data conflicts expected** for typical door operations (scan attempts, scan entries)

**Rare Edge Conflicts** (tolerated):

- Example: Device offline for hours, re-entry policy changes, another scanner admits someone after change
- Eventual reconciliation might differ between devices
- Impact is **minimal and acceptable** for business operations

**Historical Context**: Previous Maniac MVP used Next.js web app for scanning (worked surprisingly well—no app installation required, just login and scan).

**Data Storage**:

- Not a concern: "This isn't 1992 anymore, and this isn't a Nokia"
- Modern iPhones have more than enough storage
- Even pulling full org data (30 events) is minimal after initial sync
- Storage optimization is deprioritized vs security/tenant isolation

**Sync Scoping**:

- Initially scoped by Organization ID
- PowerSync filters will be investigated for more granular control
- ⚠️ **Action item**: Create Linear issue for sync scoping strategy

**Real-time Purchase Sync**:

- Tickets created in DB → PowerSync watches tables → syncs to devices
- Expected sync time: 1-2 seconds
- PowerSync handles push notification mechanism

### Access Control Rules Engine: Effect TypeScript

**Implementation**: Effect-TS-based rules engine

**Why Effect TypeScript**:

- Runs identically on server (Node 22) AND device (Expo)
- Full parity between online and offline modes
- No capability gaps in offline scenarios
- Entire stack stays in TypeScript
- Composable, functional approach to complex rule evaluation

**Execution Environments**:

- **Server-side**: Node 22 (validation, real-time checks)
- **On-device**: Expo (offline validation, instant feedback)

**Rules Persistence**:

- **Rules stored in database** (critical for PowerSync sync)
- Synced to mobile devices via PowerSync
- Same engine code runs server + device = guaranteed parity

**Rule Structure**:

- DSL exists but details deferred
- Rules engine is "its own island" for now
- Separate deep dive planned

**Scope**: Evaluates complex access control rules:

- Time of day (e.g., "free entry before 10pm")
- Day of week
- Week of season (e.g., Week 3 of March)
- Location/venue
- Ticket tier (Card vs VIP vs Black)
- Re-entry logic and limits
- Session constraints
- Schedule-based access

**Status**: In development; rule DSL and configuration patterns being finalized.

**Testing**: Likely property-based testing approach

**Goal**: Identical rule evaluation server-side and on-device ensures consistent access control regardless of connectivity.

**Scanning Flow**:

- **Always local-first**: PowerSync collections queried on device
- Immediate response from Effect-TS rules
- No "online vs offline" logic needed - always operates the same
- No ledger updates on scan (not a financial transaction)

---

## Authentication & Authorization

### Auth Service: BetterAuth

**Deployment**: Standalone Hono app at `auth.dayof.ai`

**Why BetterAuth (vs Clerk/WorkOS)**:

- **Cost at Scale**: WorkOS/Clerk get expensive with SSO/enterprise clients
- **Data Ownership**: OAuth and user data in our database
- **Privacy**: Keep sensitive user data under our control
- **Flexibility**: Complex multi-tenant model support
- **Open Source**: Own the code if needed

**Why Standalone App**:

- Don't want it embedded in Front Row or Backstage
- Avoids coupling and tight dependencies
- Easier to reason about auth layer
- Clean separation of concerns

**Current Implementation**: Proxying auth requests through apps to `auth.dayof.ai`

**Future Optimization**: May adjust to use domain/subdomain features better (avoid proxy layer)

**Session Security**:

- Session expiration: Standard/default (TBD specific duration)
- Concurrent sessions: Standard/default limits
- Nothing extreme initially

### Multi-Tenant Authorization Model

**Complexity**: Many-to-many relationship between Users and Organizations

**Scenarios Supported**:

- User owns one organization (venue owner)
- User is member of multiple organizations with different roles (GM at Venue A, promoter at Venue B)
- User has no organization (attendee only)
- User owns venue AND is attendee at others
- User is affiliate at one venue, growth partner at another, owner at third

**Unified Portal Philosophy**:

- One login for all roles/organizations
- Single pane of glass
- Load/show relevant data based on user's roles
- Industry reality: Same people wear multiple hats
- Avoid forcing users to log in/out or maintain multiple accounts

**User Scenarios**:

| User Type            | What They See                                          |
| -------------------- | ------------------------------------------------------ |
| Attendee only        | Past transactions, tickets                             |
| Venue owner          | Workspace, events, analytics, venues                   |
| Owner + Attendee     | Personal profile (tickets) + workspace (venues/events) |
| Affiliate + Attendee | Affiliate earnings/tools + personal tickets            |

**Organization Types**:

- Venue/tenant organizations
- Sponsor organizations
- Group trip organizations (e.g., fraternity spring break)
- Users can belong to one, many, or all types

**Future Use Case: Group Trip Organizations**:

- Spin up organizations for group trips (e.g., fraternity spring break)
- Organizer manages room assignments, ticket distribution, paperwork
- Not paying per-organization (BetterAuth advantage)
- Enables group coordination features

---

## UI Layer

### Component Libraries: shadcn/ui + re-ui

**Two Separate UI Libraries**:

1. **Front Row UI**: Themeable, skinnable, adaptable to organizer branding
2. **Backstage UI**: Functional, "slightly cooler Shopify backend"

**Why Separate**:

- Front Row needs extensive theming for event pages
- Backstage needs utilitarian, functional design
- Too different to unify without compromising both
- May share some UI between Backstage and Mobile (scanning app)

### Vendor Folder Pattern

**Structure**:

```text
/vendor
  /shadcn
  /re-ui
/ui
  /button (wraps vendor/shadcn/button)
  /input (wraps vendor/re-ui/input)
```

**Why This Pattern**:

- Never modify original registry components
- Create variants by wrapping
- Easy to update shadcn/re-ui (just replace vendor folder)
- No merge conflicts on updates
- Unless deep changes occur, updates are straightforward
- Allows rapid iteration right now

**Trade-off**: May lock into wrapped versions long-term, but acceptable for current velocity.

---

## Backend Architecture

### Orchestration: Inngest

**Purpose**: Event-driven orchestration layer with durable workflows

**Architecture**: Centralized endpoint via **Events app**

- All Inngest functions deployed to `events.dayof.ai`
- Apps emit events; Inngest calls Events app to execute functions
- See: [Inngest Vercel Deployment](https://www.inngest.com/docs/deploy/vercel)

**Code Location**: `packages/inngest` (all Inngest functions and orchestration logic)

**Why Inngest**:

- Durable workflows with guaranteed execution
- Built-in concurrency management
- Event dependency orchestration (major reason for choosing Inngest)
- Long-running task support
- Event-driven native (not bolted on like Temporal)
- Avoids function chaining hell
- Serverless-compatible
- Excellent observability

**Event Taxonomy Status**:

- **Not yet defined in-repo** (tracked in Linear and other tools)
- Expected total: **Hundreds of events** over time
- Will be incrementally added as features are built
- Considering **eventcatalog.dev** for mapping EDA

**Initial Events** (Priority):

- Stripe-related events (charges, refunds, payouts)
- Purchase/checkout events
- PassKit/ticket issuance events
- Priority determined by hot path to selling tickets

**Event Naming**:

- Following Inngest idioms
- Likely domain.action format (e.g., `ticket.purchased`)

**Event Emission**:

- Server functions emit to Inngest client
- Standard pattern: `await inngest.send('event.name', data)`

**Function Organization**:

- Probably organized by DDD domains
- Not by current app structure
- Not flat (structure TBD as complexity grows)

**Design Intent**:

- Server functions emit events to Inngest
- Inngest orchestrates multi-step workflows
- Built-in concurrency control prevents race conditions
- Dependencies between events handled by Inngest
- Retry logic and error handling via Inngest platform

**Philosophy**: Event-Driven Architecture (EDA)

**Problem Solved**: Avoiding this anti-pattern:

```typescript
// DON'T WANT THIS:
API route → imports function1 → imports function2 → imports function3
             ↓
           3000 lines of if-else statements determining what happens on checkout
```

**Instead**: Event-driven with clear separation:

```typescript
// Server function emits event
await inngest.send("checkout.completed", data);

// Inngest orchestrates:
// - checkout.completed → validate payment
// - payment.validated → create order
// - order.created → send email (parallel)
// - order.created → update inventory (parallel)
// - order.created → notify webhook (parallel)
```

**Benefits**:

- Make changes without worrying about function parameter passing
- Clear dependencies between operations
- Avoid tight coupling
- Better observability
- Easier to reason about system state
- Parallel execution where possible

**Concerns & Trade-offs**:

- Don't love that it's a cloud service (not fully owned)
- Complexity hidden behind service
- **However**: Open source (requirement for us)
- Only TypeScript option for serverless event-driven orchestration
- Operational complexity offloaded to Inngest vs building from scratch

**Trade-off Accepted**: Would like something different, but nothing else exists in the TypeScript serverless space.

**Testing**:

- Inngest dev server will be set up
- Automated in Turborepo for easy local testing
- Multi-step workflow testing approach TBD

---

## Payment Processing & Financial Architecture

### Timeline

**Product/E-commerce Schema**: Live within 1 week  
**Payment Processing**: Live within 2 weeks  
**FormanceLedger Integration**: ~2 weeks (with payment processing)

### Payment Architecture: Stripe + Database Records

**Primary Provider**: Stripe (deeply integrated)

**Multi-Provider Strategy**: Architecting for future payment provider flexibility

**Critical Design Decision**: Keep full transaction records in database

**Why Database Records Matter**:

- Don't constantly reach back to Stripe for every detail
- Essential for customer service workflows
- Need local records of refunds, purchases, disputes
- Faster query performance for support tools
- Reduces API call costs and latency

**Stripe Connect Account Type**: **Standard Connected Accounts**

**Current Accounts**:

- Maniac's Stripe account (Standard)
- Student Escape's Stripe account (Standard)

**Future Accounts**:

- New venues likely have existing Stripe accounts OR will create Standard accounts
- Custom Connect possible in future but not immediate priority

**Onboarding Flow**:

- Not fully defined yet
- Initial onboarding includes white-glove assistance
- Will evolve over time based on needs
- Hand-holding approach for early partners

**Payment Flow - Direct Charges with Application Fees**:

```text
Customer → Direct Charge → Connected Account (Venue)
                         ↓
                    Stripe Fee (to Stripe)
                         ↓
                    Application Fee (to DayOf platform)
```

**Money Movement**: Single transaction

1. Money moves from customer to connected account (venue) via direct charge
2. Stripe takes its processing fee
3. Stripe issues DayOf the application fee
4. Standard connected account application fee setup

**Why Direct Charges**:

- All current accounts are Standard connected accounts
- Direct charges are natural fit for Standard accounts
- Simple, proven pattern

**Application Fee Extraction**:

- Specify application fee when processing transaction
- Stripe automatically pays DayOf the fee
- Standard Stripe behavior for connected accounts

**Stripe Integration**:

- Connected Accounts ecosystem (Standard accounts)
- Custom subscriptions with custom phases/cycles (no-interest, no-credit-check payment plans for Maniac)
- Application fees for revenue model
- Webhooks received directly in Inngest

**Door Cover / Walk-up Payments**:

- Deferred for now (not in hot path)
- Will use same Crew scanning app
- May use Stripe card reader or NFC reader
- Quick ID check + payment on same device
- Our own point-of-sale (no external POS integrations currently)
- Cover = immediate-use ticket

### Financial Ledger: FormanceLedger

**Purpose**: Immutable, bi-temporal double-entry accounting ledger

**Deployment**: **Self-hosted sidecar (most likely)**

- **Why self-hosted**: Formance cloud pricing unknown (likely expensive), want co-location control
- **Location**: Ideally Vercel in same region (IAD1)
- **Fallback**: If not Vercel, then hosting in same region/data center as Vercel projects
- ⚠️ **Action needed**: Discovery and due diligence on deployment options

**Architecture**: Sidecar pattern with transactional guarantees via Effect-TS in Inngest

**Critical Rule**: All money-related operations must succeed in BOTH systems or fail completely

**Transactional Pattern** (NOT using database transactions):

```typescript
// Implemented in Effect-TS within Inngest step
// Simple retries first
// If DB fails → 5-alarm-fire notification (cannot complete purchase)
// If ledger fails → 5-alarm-fire notification (inconsistent financial state)
// Either failure → Bubble error to user, prevent purchase completion
```

**Why Effect-TS in Inngest** (not database transactions):

- Inngest steps provide durability and retry logic
- Effect-TS provides functional composition and error handling
- Database transactions would couple too tightly

**Failure Handling**:

- **Simple retries first**: Attempt automatic recovery
- **Database failure**: 5-alarm-fire notification (very bad - can't complete purchase)
- **Ledger failure**: 5-alarm-fire notification (inconsistent financial state)
- **Both failures**: Bubble error to user, prevent purchase completion
- **Possible future**: Queue ledger writes for later reconciliation (speculative)

**Operations that Trigger Ledger Entries**:

> "Any operation that involves money. If money moves, it's a ledger entry."

- Every Stripe charge
- Every refund (⚠️ **tracking method needs research**)
- Every payout
- Every application fee distribution
- Manual adjustments

**Account Structure**: One-to-one model of real world

> "Every actor in the system that either receives or sends money has an account in the ledger."

**Accounts include**:

- Every customer who purchases a ticket
- Every affiliate/growth partner
- Every venue/tenant owner
- Platform master account (DayOf)
- Stripe accounts (DayOf Stripe account, tenant Stripe accounts, Stripe fees account)
- Bank accounts (e.g., DayOf Mercury checking account)
- Any account that touches money

⚠️ **Action needed**: Create sample chart of accounts matching this structure. First step: Map all actors and all accounts that might exist.

**Example Ledger Transaction - Ticket Purchase**:

Customer purchases ticket via Stripe Connected Account (Standard, direct charge):

1. **Customer → Tenant Stripe Account**: Ticket price
2. **Tenant Stripe Account → Stripe Fees Account**: Stripe processing fee
3. **Tenant Stripe Account → DayOf Stripe Account**: Application fee

Later, when application fee moves to bank:

1. **DayOf Stripe Account → DayOf Mercury Checking**: Application fee payout

**Why This Matters**:

- One-to-one model of real world
- Can query any actor's balance at any point in time
- Can trace money flows backwards through transactions
- Audit trail for all money movements

**Reconciliation with Stripe**:

- **Investigating**: Formance Connect (recently renamed to Formance Payments)
  - Syncs with Stripe automatically
  - Unknown: Connected accounts support
- **Fallback**: Airbyte with 5-15 minute sync window
- **Frequency**: Fully automated
- ⚠️ **Action needed**: More due diligence required

**Formance Reconciliation Module**:

- Formance has a reconciliation module
- ⚠️ **Action needed**: Reach out to Formance to discuss pricing

**Refund Handling**:

- Refunds absorbed by venue (not DayOf)
- Application fee refund negotiated per-venue
- ⚠️ **Critical gap**: Need to research how FormanceLedger tracks refunds

**Capabilities** (from bi-temporal ledger):

- Double-entry accounting (credits/debits always balance)
- Immutable append-only log
- Bi-temporal (track both transaction time and effective time)
- Separate accounts for every actor
- Query current state OR historical state from any point in time
- Backdated and post-dated transactions
- Walk backwards through money flows

**Use Cases**:

- Real-time balance queries
- Payout calculations
- Reconciliation with Stripe
- Historical reporting ("what did balances look like 3 days ago?")
- Audit compliance
- Dispute resolution

**Status**: Not yet integrated; coming with payment processing (~2 weeks)

### Product Schema

**Timeline**: Going live within 1 week (currently commented out)

**Ticket Terminology**:

- **Ticket Type**: A product of type "ticket" (e.g., "VIP Pass")
- **Ticket Instance**: A singular issued ticket (⚠️ **Schema TBD** - Linear issue needed)

**Why Ticket Type = Product**:

> "I also don't believe that it makes sense to try and reinvent the entire e-commerce wheel by throwing out the standard order model where we have products, orders, product variants, and attributes. Every bit of tooling for selling online is set up for this, and everyone who's worked with e-commerce is familiar with these concepts. There's no reason to try and think that we can do better than literal decades of hard work and experience."

**Design Philosophy**:

- Avoid unnecessary abstraction layers
- Standard e-commerce model (like Shopify, WooCommerce)
- Don't reinvent decades of hard work and experience
- Every e-commerce tool is built for this model
- Example: You don't have separate "t-shirt object" linked to "product" - the product IS the t-shirt

**Ticket Instance Schema** (⚠️ **Not yet built**):

- **Timeline**: "It'll get done when it gets done" - needs Linear issue
- **Linking**: Every instance will reference the product/product variant it was created from
- **Critical concern**: Immutability/versioning of product variants
  - Need to snapshot product/product variant at time of order
  - Ticket instance must reference exact configuration at time of sale
  - Prevents drift when products change after sale
- **NanoID storage**: Will be clear in schema when finished
- ⚠️ **Action needed**: Design more elegant versioning solution than simple snapshots

**Other Product Types** (planned):

- Merchandise
- Food/beverage
- Parking passes
- Other ancillary products

**Current Schema Status**: Product and e-commerce schemas going live within 1 week (currently commented out in database)

### Payment Schema

**Components** (currently commented out, going live in 2 weeks):

- Payment collections
- Payment intents
- Refunds
- Invoices
- Subscriptions
- Payout tracking

**Payout Processing**:

- **Cadence**: Flexible - varies by venue, tenant, affiliate, growth partner
- Daily, weekly, bi-weekly, monthly - all possible
- Play by ear based on partner needs
- Different cadences for different partners

**Growth Partner Payouts**:

- Receive agreed percentage of DayOf's application fee
- Example: If DayOf gets $1 fee and growth partner has 5% share → $0.05
- Percentage varies by partner (could be 5%, 15%, 30%)
- Real-time-ish tracking (close enough for gamification)

### Webhooks

**Stripe Webhook Handling**:

- **Received directly in Inngest**
- Inngest automatically creates events from webhooks
- Rest of system picks up events from Inngest

**Webhook Signature Verification**:

- ⚠️ **Action needed**: Verify Inngest handles this (probably does)

**Subscribed Events**:

- ⚠️ **Action needed**: Create Linear issue to list all relevant Stripe webhooks and why we listen to them
- Will include: charges, payment intents, subscriptions, payouts, failures
- "Any and all of them that are relevant to us"

---

## Database Schema & Patterns

### Multi-Tenancy

**Implementation**: Tenant ID / Organization ID on every table

**Explicitly NOT using**: Row-Level Security (RLS)

> "Absolutely fucking no way in hell am I dealing with RLS right now"

**Critical Addition**:

- Tenant ID / Org ID everywhere
- ⚠️ **Action needed**: Workspace ID scoping - needs decision on tables vs rules engine

### Drizzle Migrations

**Strategy**:

- Managed with Drizzle Kit
- Automated in production
- **Must succeed in develop first**
- Currently only Jon can push to production

### Core Entity Relationships

**Events ↔ Ticket Types**: Not one-to-many! Decoupled!

**The DayOf Innovation**: Full decoupling with groups/segments

**Ticket Types**:

- Can be associated with individual events
- Can be associated with event groups/segments
- Groups can be manual or smart (filter-based)

**Ticket Instances**:

- One ticket instance → one ticket type (one-to-many from type to instance)
- Instances can belong to groups/segments
- Groups can be manual or smart

**Events**:

- Events can belong to groups/segments
- Groups can be manual or smart (attribute-based filters)

**Flexible Associations**:

- Ticket type groups ↔ Event groups
- Ticket type → Individual events
- Ticket type → Event groups
- Think: Customer.io cohorts, PostHog segments, MailChimp groups

**Nomenclature**:

- Probably "groups" vs "segments" (segments = martech term, might confuse)
- Smart groups = filter-defined, real-time updates
- Manual groups = explicitly specified members

**Users ↔ Organizations**: Many-to-many

**Organization Types**:

- Venue/tenant organizations
- Sponsor organizations
- Group trip organizations
- Users can belong to multiple types

**Additional Schema Details**: TBD in separate deep dive

---

## Observability & Monitoring

### Strategy: OpenTelemetry First + PostHog

**Primary Goal**: Centralize everything in PostHog if possible (reporting + monitoring simplified)

**Challenge**: PostHog does not have an OpenTelemetry collector

**Solution**: Run parallel systems and evaluate

### Architecture

**OpenTelemetry (OTEL) First**:

- All error reporting and logging goes through OTEL
- OpenTelemetry collector fans out to multiple backends
- Ensures vendor flexibility and future-proofing

**OTEL Collector**:

- Self-hosted (can't find simple managed option)
- Fan-out destinations: Axiom, Dash0, S3 forever log
- OTEL SDKs vary by app/framework
- Effect-TS has fantastic built-in OTEL support

**OTEL Backends**:

- **Running BOTH Axiom AND Dash0** (fully duplicated)
- Running in parallel to compare capabilities
- Will evaluate and potentially cut one later

**S3 Forever Log**:

- OTEL data fanned out to S3 bucket
- Indefinite retention
- Backup and long-term analysis

**PostHog**:

- Analytics and event tracking
- Currently deployed in Honoken only
- Will expand to Front Row and Backstage next
- Built into Inngest functions and events as we go
- No specific timeline for full rollout

**Parallel Running**:

- PostHog + OTEL backends run simultaneously
- Evaluate which provides better insights
- Decision point: Which system provides most value for cost/complexity?

### Current Status

**Deployed**:

- PostHog in Honoken (Apple PassKit service)
- OTEL setup in progress

**To Be Deployed**:

- OTEL collector setup (self-hosted)
- Axiom + Dash0 backends
- PostHog expansion to other apps (incremental)

### What Gets Tracked

**Application Monitoring** (via OTEL):

- Error tracking
- Performance monitoring
- Application logs

**Analytics** (via PostHog):

- User events and behavior
- Feature usage
- Conversion funnels
- Product analytics

**Data Warehouse**:

- PostHog → ClickHouse for event data
- Long-term analytics storage
- Custom queries and reports

### Avoiding Complexity

**Not Using** (if possible):

- Sentry (prefer OTEL + PostHog)
- Datadog (expensive, prefer alternatives)
- Multiple logging vendors

**Goal**: Simplify observability stack while maintaining comprehensive visibility

### Future Considerations

- Evaluate which system (PostHog vs OTEL backends) provides best value
- May consolidate into single system after evaluation period
- Balance cost, features, and developer experience

---

## Build Tools & Ecosystem

### Void Zero Ecosystem

**Embracing**: Vite, Rolldown, and the broader Void Zero direction

**Why**:

- Modern, fast build tools
- TypeScript-first
- Better than Webpack
- Industry momentum
- TanStack built on Vite (ecosystem alignment)

**Already Migrated**: Using Rolldown instead of older bundlers

---

## Deployment & Hosting

### Platform: Vercel

**Why Vercel (vs Cloudflare)**:

- Cold starts on Cloudflare "not so hot"
- Don't want to deal with V8 isolates restrictions
- Full Node.js support (Node 22)
- Fluid Compute enabled
- Advanced CPU performance tier (relatively inexpensive upgrade)
- Easy wins for serverless deployments

**Deployment Strategy**:

- Each app deploys to separate Vercel project
- Independent deployments prevent cascading failures
- Monorepo enables atomic commits across apps

**Node Version**: Node 22 (latest LTS)

**Deployment Pipeline**:

- Uncertain if GitHub Actions or Vercel built-in CI
- Currently mix of both
- May consolidate to Vercel built-in CI

**Preview Deployments**:

- Yes, per-PR preview deployments for all apps
- Preview domains: `app.preview.dayof.ai` pattern
- Examples: `backstage.preview.dayof.ai`, `events.preview.dayof.ai`
- Per-PR database branching with Neon

**Staging/Preview Strategy**:

- Separate preview for each app
- Neon database branching for staging

---

## Access Control System

### Physical Card System

**Card Encoding**:

- Only NanoID encoded on physical card
- ~5 characters, capital letters only
- No ambiguous characters (e.g., O vs 0, I vs l)
- Short NanoID possible because cards printed in advance
- Manual duplicate check before printing

**Card + Digital Linking Flow**:

1. Customer checks out → receives Apple Wallet Pass
2. Customer arrives to pick up physical card
3. Staff scans/looks up customer (Apple Pass or email/name)
4. Crew app prompts to scan physical card QR code
5. System links digital + physical in database

**Fallback Options**:

- Lose phone → use physical card
- Lose card → use Apple Pass
- Manual lookup by name + ID (not encouraged but possible)

### Manual Admit/Override

**Who Can Use**: ALL STAFF

> "We thought long and hard about this... at least by making it available and not punishing people for it (as long as it's not egregious), you at least have a chance to capture some of that data."

**Philosophy**:

- Can't prevent unauthorized entry anyway
- Staff will let people in regardless of system constraints
- Better to log it than have it happen off-system
- Front door staff will invalidate software if it gets in their way
- Must be easy to use and account for real-world situations

**Logging**:

- Logged like any other scan
- Metadata indicates manual override
- ⚠️ **Action needed**: Define exact metadata contract

### Apple Wallet Passes

**Library**: PassKit-generator (GitHub)

**Certificate Management**:

- Detailed in Honoken README
- ⚠️ **Action needed**: Reference Honoken README for certificate details

---

## Testing & Deployment

### Testing Framework

**Unit Tests**: Vitest

**E2E Testing**: Approach TBD ("cross that bridge when I get to it")

**Inngest Testing**:

- Inngest dev server setup (automated in Turborepo)
- Multi-step workflow testing approach TBD

### Deployment

**CI/CD**: Mix of GitHub Actions and Vercel built-in CI

- May consolidate to Vercel built-in

**Preview Deployments**: Yes, per-PR for all apps

**Database Strategy**: Neon branching for previews

**Production Access**: Currently only Jon can push to production

---

## Spring Break 2026 Readiness

### Expected Scale

**Card Holders**: ~60,000 (maximum)

**Venues**: 15-20

**Peak Load**: ~10,000 scans per hour across all venues

### Success Criteria

**MUST Work Perfectly**:

1. **Order Processing**:

   > "We cannot fail to process an order... Downtime is unacceptable, and mistakes in terms of what's sold are unacceptable."

   - No downtime for Front Row
   - No errors in what's sold
   - Customer must get receipt

2. **Scanning**:
   > "Scanning cannot fail. It basically grinds the entry to a venue to a halt."
   - Must work offline (primary safety)
   - Starlink at venues (secondary safety)
   - Double protection via "onion layers"

**Can Be Rough Edges**:

- Data collection issues
- Backend data handling
- Non-critical reporting
- ⚠️ **Action needed**: Create Linear issue for Spring Break 2025 rough edges list

### Contingency Strategy

**Layered Defense**:

1. Offline-first mobile app (primary)
2. Starlink at venues (backup)
3. Previous year: Only one Starlink issue

**Historical Note**: Spring Break 2025 used Next.js web app with Starlinks - worked surprisingly well

---

## Current Stack Summary

| Layer                  | Technology                                                              | Why                                            |
| ---------------------- | ----------------------------------------------------------------------- | ---------------------------------------------- |
| **Language**           | TypeScript                                                              | Single language everywhere                     |
| **Monorepo**           | Turborepo                                                               | Code sharing, atomic commits                   |
| **Database**           | Neon Postgres 17                                                        | Serverless, region matching                    |
| **ORM**                | Drizzle (v2 beta)                                                       | Lightweight, type-safe, performant             |
| **Frontend Framework** | TanStack Start v1                                                       | Modern, flexible rendering, server functions   |
| **API Pattern**        | Server Functions                                                        | Simple, focused on features not infrastructure |
| **State/Data**         | TanStack DB                                                             | Unified data access, no prop drilling          |
| **Data Backing**       | Query Collections (Front Row) PowerSync Collections (Backstage, Mobile) | SSR caching vs offline-first                   |
| **Forms**              | TanStack Form                                                           | Ecosystem consistency                          |
| **Tables**             | TanStack Table                                                          | Frontend table/grid components                 |
| **UI**                 | shadcn/ui + re-ui                                                       | Modern components, vendor pattern              |
| **Mobile**             | React Native + Expo                                                     | Code sharing, iOS only                         |
| **Mobile Sync**        | PowerSync (Managed)                                                     | Offline-first, queued writes                   |
| **Mobile Styling**     | Native Wind                                                             | Tailwind for React Native                      |
| **Rules Engine**       | Effect TypeScript                                                       | Server + device parity                         |
| **Auth**               | BetterAuth + Hono                                                       | Data ownership, cost control                   |
| **Orchestration**      | Inngest                                                                 | Event-driven workflows, durability             |
| **Events App**         | Hono                                                                    | Centralized Inngest endpoint                   |
| **PassKit**            | Honoken (Hono + PassKit-generator)                                      | Apple Wallet pass management                   |
| **Payments**           | Stripe Standard Connected                                               | Direct charges + app fees                      |
| **Accounting**         | FormanceLedger                                                          | Double-entry, bi-temporal, sidecar             |
| **Hosting**            | Vercel                                                                  | Serverless, Node 22, fluid compute             |
| **Build**              | Vite + Rolldown                                                         | Void Zero ecosystem                            |
| **Observability**      | PostHog + OTEL                                                          | Analytics + monitoring (parallel)              |
| **OTEL Backends**      | Axiom AND Dash0                                                         | Running both, will evaluate                    |
| **OTEL Storage**       | S3 Forever Log                                                          | Indefinite retention                           |
| **Data Warehouse**     | ClickHouse (via PostHog)                                                | Event storage, custom queries                  |
| **Testing**            | Vitest                                                                  | Unit testing                                   |
| **API Testing**        | Posting.sh                                                              | Version-controlled API testing                 |

---

## Action Items & Open Questions

### 🚨 Critical Action Items

1. **FormanceLedger refund handling** - Research how to track refunds in ledger
2. **Ticket Instance schema** - Create Linear issue with timeline
3. **Product/variant versioning** - Design more elegant immutability solution
4. **Workspace ID scoping** - Decide: tables or rules engine?
5. **Chart of accounts** - Map all actors and accounts for FormanceLedger
6. **Stripe webhook verification** - Confirm Inngest handles signature verification
7. **List Stripe webhooks** - Document all relevant webhooks + rationale

### ⚠️ Medium Priority

1. **Manual override metadata** - Define exact contract/structure
2. **Spring Break 2025 rough edges** - Create comprehensive issues list
3. **BetterAuth context** - Research server function context passing
4. **Honoken README** - Reference for certificate management details
5. **PowerSync sync scoping** - Linear issue for granular filter strategy
6. **eventcatalog.dev** - Evaluate for EDA mapping
7. **Testing approach** - Multi-step Inngest workflow testing
8. **E2E testing** - Define strategy

### 📋 Research & Discovery

1. **FormanceLedger deployment** - Due diligence on hosting options
2. **Formance Payments** - Investigate Stripe sync for connected accounts
3. **Formance reconciliation pricing** - Reach out to Formance
4. **OTEL collector hosting** - Find/implement self-hosted solution

---

## Future Considerations & Alternatives

### Database: PlanetScale (Possible Switch)

**Current**: Neon Postgres 17  
**Potential**: PlanetScale

**Consideration**:

- PlanetScale has strong MySQL scaling
- **Blocker**: Region mismatch
  - PlanetScale US East 1 = North Virginia
  - Vercel accessible US East ≠ North Virginia
  - Neon can match Vercel IAD1 region
- **Decision**: Staying with Neon unless compelling reason to switch

### Mobile Sync: PowerSync Status

**Decision Made**: PowerSync is the confirmed choice (Managed)

**Why PowerSync Won**:

- Most mature option for offline-first in React Native/Expo
- Well-documented React Native support
- Proven in production
- Queued writes with automatic sync

**Custom TanStack DB Adapter**:

- May write custom adapter to integrate PowerSync with TanStack DB
- Maintains unified data access layer across web and mobile
- Engineering effort acceptable for consistency benefits

### Auth Proxying Optimization

**Current**: Proxying auth requests through apps to `auth.dayof.ai`

**Future**: Use domain/subdomain architecture more efficiently

- All apps on `dayof.ai` or `*.dayof.ai`
- Can leverage domain-level auth without proxy
- Reduces latency and complexity

**Blocker**: Need to assess implementation effort vs current working solution

### Payment Processing Beyond Stripe

**Current**: Stripe exclusively (deeply integrated)

**Why Staying with Stripe**:

- Connected Accounts ecosystem (critical for payouts)
- Custom subscriptions for payment plans
- Application fees for revenue model
- Well-understood, battle-tested

**Future Considerations**:

- **Hyperswitch**: Multi-processor routing (not urgent)
- **Formance Payments**: Pairs with FormanceLedger for payouts
  - Recently rebranded (Formance Connect?)
  - Could simplify payout flows
- **Not Urgent**: Current Stripe integration meets all needs

**Decision**: Revisit only if specific client needs arise or Stripe becomes limiting

---

## Backstory & Context

### Why Not Next.js

**Rejected**: Not explicitly stated, but clear from context

**Inferred Reasons**:

- Prop drilling hell with 15 nested components
- Zero composability in typical Next.js patterns
- Function chaining complexity
- TanStack Start offers more flexibility

### Why Not Event Sourcing

**Considered**: For financial accuracy and audit trails

**Rejected**: Too complex, "infects entire system"

**Solution**: FormanceLedger provides event sourcing benefits without the infection

- Bi-temporal ledger captures state changes
- Immutable append-only log
- Can query historical state
- Doesn't require entire application to adopt event sourcing pattern

### Why Not Clerk or WorkOS

**Cost Scaling Issue**:

- Per-organization pricing becomes expensive
- SSO/enterprise features drive costs up fast
- Could hit $100k/year with moderate conference client adoption

**Solution**: BetterAuth

- Own the code and data
- No per-organization costs
- Can spin up organizations freely (group trips feature)
- Better privacy control

### Previous Maniac MVP Tech

**Scanning**: Next.js web app (not native mobile)

**Result**: "Worked surprisingly well"

- No installation required
- Just login and scan
- Simple deployment

**Why Changing**:

- Want offline-first capability
- Better performance for high-volume scanning
- Native features (camera, storage)
- Professional polish

### Drizzle Relations v1 → v2 Migration

**Pain Point**: Had to rewrite all queries when v2 came out

**Learning**: Jumped to v2 alpha/beta to avoid another rewrite

- Accept bleeding-edge risk
- v2 should be stable by production
- Significant performance gains worth the risk
- Avoid tech debt of staying on v1

### The Anti-Pattern: Function Chaining

**What to Avoid**:

```typescript
// checkout.ts
export async function checkout(data) {
  await validatePayment(data);
  await createOrder(data);
  await sendEmail(data);
  await updateInventory(data);
  await notifyWebhook(data);
  // ... 3000 lines of nested if-else
}
```

**Problem**:

- Tight coupling
- Hard to modify one step without breaking others
- Difficult to test
- No visibility into failures
- Can't retry individual steps

**Solution: Event-Driven via Inngest**:

```typescript
// checkout.ts
emit("checkout.completed", data);

// Inngest orchestrates:
// - checkout.completed → validate payment
// - payment.validated → create order
// - order.created → send email (parallel)
// - order.created → update inventory (parallel)
// - order.created → notify webhook (parallel)
```

**Benefits**:

- Loose coupling
- Easy to modify individual steps
- Retry logic per-step
- Clear observability
- Parallel execution where possible

---

## Operational Philosophy

### Pragmatic Realism

**Front Door Reality**:

> "Front door staff will completely invalidate your software the second it gets in their fucking way or it becomes annoying or they don't like it for some reason."

**Data Storage**:

> "This isn't 1992 anymore, and this isn't a Nokia."

**Product Modeling**:

> "I also don't believe that it makes sense to try and reinvent the entire e-commerce wheel."

### Critical Guarantees

**Order Processing**:

- Zero downtime acceptable
- Zero mistakes in sales acceptable
- Customer must get receipt

**Scanning**:

- Must work offline (primary)
- Starlink backup (secondary)
- Cannot grind entry to halt

### Flexibility Over Perfection

**Payout Cadence**: "Play by ear"

**Timeline**: "It'll get done when it gets done"

**Deployment**: "Cross that bridge when I get to it"

**Testing**: Will figure out approach as needed

### Simplicity Principles

- Keep it simple with server functions (not REST/GraphQL/tRPC)
- Avoid premature optimization
- Focus on hot path to selling tickets
- Don't over-engineer initially

---

_Last updated: Based on Jon's answers to 48 core questions_
_Timeline: Product schema live in 1 week, Payments + FormanceLedger live in 2 weeks_
