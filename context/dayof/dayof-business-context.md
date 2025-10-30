# DayOf Business Context Document

## Executive Summary

**DayOf** (dayof.ai) is an event management and ticketing SaaS platform born from solving real operational problems at Maniac, a spring break party card business. DayOf decouples tickets from events, enabling complex multi-day, multi-venue, time-based access control scenarios that traditional platforms like Eventbrite and Ticketmaster cannot handle.

## Business Entities

### DayOf (dayof.ai)

- **Type**: Event management and ticketing SaaS platform
- **Market Position**: Selective partner model, not competing to be "the next Ticketmaster"
- **Target**: ~10 non-internal clients initially, ~100 events/year each
- **Growth Strategy**: Word-of-mouth + growth partner referral program
- **Competitive Advantages**:
  - Built by operators with deep industry experience (20-30+ years)
  - Lower fees and transparent pricing
  - Unique architectural capabilities (decoupled tickets/events)
  - Growth partner revenue sharing model

### Maniac (maniacvipcard.com)

- **Type**: Spring break party card business
- **Season**: Mid-February to mid-April
- **Locations**:
  - Fort Lauderdale, FL (largest territory)
  - South Padre Island, TX
  - Panama City Beach, FL
- **Products**: Maniac Card, Maniac VIP Card, Maniac Black Card ($50-$250)
- **Model**: Multi-venue access passes with time-based, tier-based, and location-based permissions

### Leadership

- **Jon Page (Jonathan Page)**: Co-founder, 20+ years industry experience
- **Chris Pitts**: Co-founder, 30+ years industry experience

## Revenue Model

**Primary**: Application fee taken from all Stripe transactions

- Not limited to ticket sales
- Includes door cover, merchandise, and all revenue flowing through the platform
- Small percentage of every transaction
- Flexible pricing based on client needs and complexity

**Growth Partner Program**:

- Revenue share with key decision-makers (GMs, IT managers)
- Example: If DayOf takes 3% fee, growth partner might receive 5-30% of that 3% (varies by partner)
- Provides stickiness and lowers adoption friction
- More effective than large fee discounts
- Example: Rather than discount $150k/year, give GM $20k/year referral fee

**Strategic Note**: Self-funded through Maniac operations - no investor pressure, DayOf covers its own costs and is net positive.

## Core Problem Being Solved

Traditional ticketing platforms (Eventbrite, Ticketmaster, Ticket Tailor) **cannot handle**:

- Multi-day access control
- Multi-venue coordination
- Time-based permissions (e.g., "free entry before 10pm")
- Tier-based access (different card levels = different privileges)
- Location-based rules
- Real-time availability (cards sold at 9:30pm work instantly)
- Re-entry rules and session management

**Historical Cost**: Hundreds of thousands/year in ticketing fees with inadequate functionality

**Data Gap**: No visibility into who attends what, when, or how marketing performs in-market

## Technical Architecture

### Core Innovation: Decoupled Tickets & Events

Unlike every other platform, DayOf treats **tickets as tokens** separate from events:

- Tickets can exist independent of events
- Tickets can be associated with one event, multiple events, or event groups
- Events can be added/removed from ticket access dynamically
- Enables flexible authorization and access control

**Grouping/Segmentation System**:

- Both ticket instances AND ticket types can belong to groups/segments
- Events can belong to groups/segments
- Groups can be manually defined or smart (filter-based, like Customer.io cohorts)
- Ticket type groups can associate with event groups
- Flexible, composable system for festival passes, series tickets, etc.

### Technical Stack Overview

**Core Principles**:

- TypeScript everywhere (single language across entire stack)
- Turborepo monorepo (if it can't be version controlled, we try not to use it)
- Single Neon Postgres database
- Event-driven architecture (built for AI integration)

**Monorepo Apps** (7 total):

1. **Auth**: BetterAuth service (Hono) at `auth.dayof.ai`
2. **Honoken**: Apple PassKit service (Hono, PassKit-generator) at `honoken.dayof.ai`
3. **Front Row**: Customer-facing e-commerce (TanStack Start, SSR) at `dayof.ai`
4. **Backstage**: Admin dashboard (TanStack Start, SPA) at `backstage.dayof.ai`
5. **Crew**: Staff scanning app (React Native/Expo, iOS only) - rename pending
6. **Events**: Inngest endpoint (Hono) at `events.dayof.ai`
7. **Handbook**: Internal docs (likely to be removed)

**Shared Packages**:

- `database`: Drizzle schemas, migrations, DB client
- `inngest`: Inngest functions and orchestration
- `cli-utils`: Command-line utilities
- `posting`: API testing (posting.sh)

**Primary Technologies**:

- **Database**: Neon Postgres 17, Drizzle ORM (v2 beta)
- **API Pattern**: TanStack Start server functions (not REST/GraphQL/tRPC)
- **State & Data**: TanStack DB, TanStack Query, TanStack Table
- **Mobile**: React Native with Expo (iOS only, iPhone 12 Pro+)
- **Mobile Sync**: PowerSync (offline-first, managed deployment)
- **Auth**: BetterAuth (self-hosted, unified multi-tenant model)
- **Orchestration**: Inngest (event-driven workflows, durable execution)
- **Rules Engine**: Effect TypeScript (runs server + device, persisted to DB)
- **Payments**: Stripe (Standard Connected Accounts, direct charges + app fees)
- **Accounting**: FormanceLedger (double-entry, bi-temporal, self-hosted sidecar)
- **Hosting**: Vercel (fluid compute, Node 22)
- **Observability**: PostHog + OpenTelemetry (Axiom AND Dash0, both running, plus S3 forever log)

**Key Architectural Decisions** (Confirmed):

- Separate deployments per app (revenue isolation, independent scaling)
- Unified portal (one login for all user roles)
- Offline-first mobile with Effect-TS rules engine (rules in DB, synced via PowerSync)
- Vendor folder pattern for UI components (shadcn/ui, re-ui)
- Transactional financial operations: Effect-TS in Inngest steps (NOT DB transactions)
- Multi-tenancy: Tenant/Org ID on tables, NO Row-Level Security (RLS)
- OTEL-first logging and error reporting (fan-out to multiple backends)
- Stripe webhooks received directly in Inngest

**Timeline Notes** (As of answers provided):

- Product/e-commerce schema: Live within 1 week
- Payment processing: Live within 2 weeks
- FormanceLedger integration: ~2 weeks (with payments)

**Spring Break 2026 Scale**:

- 60,000 card holders (maximum expected)
- 15-20 venues
- ~10,000 scans per hour (peak across all venues)

**Success Criteria**:

- **MUST work**: Order processing (no downtime, no mistakes) + Scanning (cannot fail)
- **Strategy**: Double protection via offline-first mobile + Starlink at venues

> **Detailed Tech Stack**: See [DayOf Tech Stack Documentation](./dayof-tech-stack-UPDATED.md) for comprehensive technical details, rationale, and future considerations.

### Event-Driven Architecture

- Built for AI from the ground up (not bolted on)
- Event streams enable agents to understand state changes over time
- Orchestrated via Inngest (centralized endpoint at `events.dayof.ai`)
- Enables complex financial transactions with transactional guarantees across systems
- Event taxonomy: Hundreds of events expected over time
- Considering eventcatalog.dev for EDA mapping

### Financial Architecture: FormanceLedger

**Why**: Avoid deriving financial state from database records or event sourcing (too complex, infects entire system)

**Deployment**: Self-hosted sidecar (ideally Vercel IAD1 region, co-located with apps)

**Transactional Pattern**: Effect-TS in Inngest steps

- DB operation + Ledger operation must BOTH succeed or BOTH fail
- Simple retries first
- If either fails → 5-alarm-fire notification + bubble error to user
- NOT using database transactions (too tight coupling)

**Capabilities**:

- Double-entry accounting ledger
- Immutable and bi-temporal
- Separate accounts for every actor touching money (one-to-one model of real world)
- Query current state OR historical state from any point in time
- Backdated and post-dated transactions
- Walk backwards through money flows to understand who got what, when, why, and how
- Transactional updates with Stripe (sidecar pattern)

**Account Structure**:

- Every customer, affiliate, venue owner, growth partner has account
- Platform accounts (DayOf Stripe, DayOf Mercury checking)
- Stripe accounts (tenant Stripe accounts, Stripe fees catchall)
- Any account that touches money

**Operations Triggering Entries**:

> "Any operation that involves money. If money moves, it's a ledger entry."

- Every Stripe charge, refund, payout, application fee
- Manual adjustments

**Reconciliation**:

- Investigating Formance Payments (formerly Formance Connect) for Stripe sync
- Fallback: Airbyte with 5-15 minute sync window
- Fully automated
- Need to discuss Formance reconciliation module pricing

**Result**: Financial accuracy, analytics, and reporting otherwise requiring years of custom development

### Grouping/Segmentation System

Smart and manual groups for:

- Events
- Tickets (instances)
- Ticket types
- Attendees/Purchasers
- Growth partners/Affiliates

Dynamic associations enable festival-style ticketing, series passes, and flexible event scheduling.

Think: Customer.io cohorts, PostHog segments, MailChimp groups applied to events and tickets.

## Access Control System

Complex, real-time, multi-factor validation system:

**Digital Layer**:

- Apple Wallet passes issued at checkout (unique NanoID)
- Physical cards (~5 char NanoID, capitals only, no ambiguous chars, printed in advance)
- Cards linked when customer picks up physical card (scan Apple Pass → scan QR on card)
- Bidirectional fallback: lose phone → use card; lose card → use phone
- Manual lookup by name + ID (not encouraged but possible)

**Validation Factors**:

- Time of day (e.g., "free before 10pm")
- Day of week
- Week of season (e.g., Week 3 of March)
- Location/venue
- Ticket tier (Card vs VIP vs Black)
- Schedule (different venues open different nights)
- Re-entry rules (varies by event/tier)
- Session limits
- Real-time purchase integration (instant availability)

**Edge Cases**:

- **Manual override**: Available to ALL STAFF (pragmatic reality)
  > "Front door staff will completely invalidate your software the second it gets in their fucking way"
- Logged with metadata indicating manual override
- Works for both scheduled events and dynamic door cover
- Must function during network issues (hence offline-first mobile architecture)

**Technical Requirements**:

- Real-time synchronization (purchases → instant door access via PowerSync)
- Offline-first mobile scanning
- High-volume concurrent access (hundreds of people in line)
- Low-light camera performance (nightclub/venue conditions)
- Effect-TS rules engine runs identically server + device

## Four Pillars of DayOf

### 1. Events & Ticketing

- Decoupled ticket/event architecture
- Complex access control scenarios
- Multi-venue, multi-day support
- Real-time synchronization (PowerSync: 1-2 second sync)
- Smart and manual grouping/segmentation
- Flexible associations

### 2. Growth Partners & Affiliates

- First-class citizen treatment
- Built-in promoter and affiliate management
- Revenue sharing directly in platform (5-30% of application fee)
- Word-of-mouth is primary growth channel
- Enables unique go-to-market strategy
- Real-time-ish commission tracking (gamified)

### 3. Financial Operations

- FormanceLedger for accounting
- Transparent money flows
- Historical financial state queries
- Analytics and reporting capabilities
- Stripe application fees as revenue source
- Flexible payout management (varies by partner)

### 4. AI Integration (Future)

- **Not shallow**: No generic "generate event copy" features
- **Vertically defensible data collection**
- Hardware integration: cameras, sensors, POS systems
- World modeling of venue dynamics
- Timeline: Incremental as fast as possible; hardware deep dive April 2026+

## AI Vision: Venue Intelligence

**Philosophy**: Collect data other platforms cannot collect - build insurmountable competitive advantage

**Hardware Integration** (Post Spring Break 2026):

- Cameras and sensors in venues
- POS system data
- Context-aware, on-the-ground data collection

**Data Collection Goals** (All anonymized, privacy-first):

_Venue Dynamics_:

- Song/music performance (what songs make people dance)
- Crowd density and flow patterns through space
- Movement patterns (how people navigate large venues)
- Timing patterns (busy/slow periods by hour/day/season)
- Dance floor utilization patterns

_Demographics & Sociology_:

- Fashion and style trends by region
- What crowds are wearing
- Age distribution and group composition
- How long groups stay clustered together
- When groups break apart to socialize

_Social Dynamics_:

- Who talks to whom (anonymized, not identified)
- Gender interaction patterns
- How alcohol consumption affects social behavior
- Group dynamics throughout the night
- Time from arrival to cross-gender socialization

_Consumer Behavior_:

- What people drink, when, and why
- Spending patterns throughout the night
- Sponsor interaction effectiveness
- How demographics respond to different sponsors/brands

**Business Value**:

- New revenue stream beyond ticketing
- Sponsor enablement: unprecedented demographic insights
- Venue optimization: data-driven operations
- Marketing effectiveness measurement
- "World model" of nightclub/concert dynamics

**Strategic Advantage**:

- Not about software-level data collection (that's commodity)
- On-the-ground, context-aware data is defensible
- Early data collection creates insurmountable moat
- Privacy-first approach differentiates from surveillance capitalism

## Development Philosophy

- **Greenfield advantage**: Bleeding-edge tech stack, no legacy constraints
- **Build for AI, don't bolt it on**: Event-driven architecture enables agent integration
- **Scalable where easy**: Pragmatic, not over-engineered
- **Event sourcing rejected**: Too complex, infects entire system
- **Privacy-first**: Core value, not afterthought
- **Monorepo**: Code sharing, unified deployment, single source of truth
- **TypeScript everywhere**: Type safety across entire stack
- **Incremental feature exposure**: Learn what external clients need before building everything
- **Pragmatic realism**: Account for real-world operational constraints
- **Simplicity first**: Server functions over REST/GraphQL, avoid premature abstraction

## Current Development Status

### Phase 1: Complete

- MVP ran internally for 2 years (originally planned for 1)
- Maniac operations validated core concepts
- Learned lessons about complexity, scale, and real-world use

### Phase 2: Current (Active Development)

- Full rebuild from scratch
- Modern tech stack (TanStack, React Native, BetterAuth, etc.)
- Focus: Core functionality for 90% of events (not just Maniac edge cases)
- Prioritizing customer service tools over complex builder interfaces
- Builder UI for Maniac's complex scenarios: later/incremental
- **Timeline**: Product schema (1 week), Payments + FormanceLedger (2 weeks)

### Phase 3: Spring Break 2026

- Maniac test run with new platform
- Real-world validation under high load
- Mid-February to mid-April 2026
- **Scale**: 60k card holders, 15-20 venues, ~10k scans/hour peak
- **Success criteria**: Order processing + scanning MUST work perfectly

### Phase 4: External Partners

- Open to external clients (post-Spring Break 2026)
- Pipeline ready: "More clients ready to switch than we know what to do with"
- Not concerned with building sales pipeline right now

## Target Markets

**Phase 1 (Current)**:

- Nightclubs (medium to large, successful)
- Concert venues (legitimate, established)
- Music festivals

**Phase 2 (Future)**:

- General festivals (resemble Maniac model: Oktoberfests, etc.)
- Conferences (multi-day, multi-session similarities)
- Theaters (requires market research)

**Client Profile**:

- Established venues with consistent track records
- Decision makers who value operator experience
- Organizations willing to participate in growth partner program
- NOT chasing "everyone" - selective quality over quantity

## Go-to-Market Strategy

**Not Pain Point Based**: The space is well-saturated, problems are "solved well enough"

**Actual Friction**:

- People who experience pain (staff, door personnel) don't make buying decisions
- People who make decisions (GMs, owners) don't experience the pain
- Hard to demonstrate significant value for switching costs

**Growth Partner Program** (Primary GTM):

1. Identify decision maker (GM, IT manager, operations)
2. Offer revenue share on fees (e.g., 5-30% of DayOf's 3% fee - varies by partner)
3. Creates long-term stickiness (paid while employed at venue)
4. Lower friction than discounting or pain-point selling
5. Economics: Better to pay GM $20k/year than discount $150k/year

**Word of Mouth** (Secondary):

- Industry is tight-knit
- Same people work multiple venues, wear multiple hats
- Operator credibility (Jon + Chris's experience) matters
- Product quality creates organic referrals

**Not Pursuing**:

- Large marketing campaigns
- Aggressive sales pipeline building
- Competing on price alone
- Enterprise sales processes (initially)

**Capital Strategy**:

- Contrast with Tixr: They front $250k to venues, lock 3-year contracts, make $500k back
- DayOf: Can't compete on upfront capital, competes on ongoing revenue share
- Self-funded via Maniac - no investor pressure for premature scaling

## Integration Strategy

**Current**: Stripe only (deeply integrated - Standard Connected Accounts)

**Future** (Depends on early clients):

- POS systems: Regional/localized adoption patterns
  - Example: Restaurant groups in same city often use same POS
  - Must be reactive to client needs, not prescriptive
- Migration tools from competitors (Eventbrite, Ticketmaster, etc.)
- Other venue management tools (as needed)

**Philosophy**:

- Integrations easier than ever (thanks AI!)
- Let early client needs drive priorities
- Don't over-build before knowing what's needed

## Feature Roadmap & Priorities

**[TO BE COMPLETED]**

Deferred to separate discussion - too extensive and nuanced for quick bullets.

Key considerations to cover:

- Must-haves vs nice-to-haves
- Launch feature set
- Incremental exposure strategy
- Customer service tools priority
- Complex builder interface timeline

---

## Critical Action Items (From Tech Stack Answers)

### 🚨 Immediate Priority

1. **FormanceLedger refund handling** - Research how to track refunds in ledger
2. **Ticket Instance schema** - Create Linear issue with timeline
3. **Product/variant versioning** - Design more elegant immutability solution
4. **Workspace ID scoping** - Critical decision: tables or rules engine?
5. **Chart of accounts** - Map all actors and accounts for FormanceLedger
6. **Stripe webhook verification** - Confirm Inngest handles signature verification
7. **List Stripe webhooks** - Document all relevant webhooks + rationale

### ⚠️ Medium Priority

1. **Manual override metadata** - Define exact contract/structure
2. **Spring Break 2025 rough edges** - Create comprehensive issues list for 2026
3. **BetterAuth context** - Research server function context passing
4. **Honoken README** - Reference for certificate management details
5. **PowerSync sync scoping** - Linear issue for granular filter strategy
6. **eventcatalog.dev** - Evaluate for EDA mapping

### 📋 Research & Discovery

1. **FormanceLedger deployment** - Due diligence on hosting options
2. **Formance Payments** - Investigate Stripe sync for connected accounts
3. **Formance reconciliation pricing** - Reach out to Formance
4. **OTEL collector hosting** - Find/implement self-hosted solution

---

## Operational Philosophy & Lessons

### Pragmatic Realism

**Front Door Reality**:

> "Front door staff will completely invalidate your software the second it gets in their fucking way or it becomes annoying or they don't like it for some reason."

**Data Storage**:

> "This isn't 1992 anymore, and this isn't a Nokia."

**Product Modeling**:

> "I also don't believe that it makes sense to try and reinvent the entire e-commerce wheel."

### Critical Guarantees

**Order Processing**:

> "We cannot fail to process an order... Downtime is unacceptable, and mistakes in terms of what's sold are unacceptable."

- Zero downtime acceptable for Front Row
- Zero mistakes in sales acceptable
- Customer must get receipt

**Scanning**:

> "Scanning cannot fail. It basically grinds the entry to a venue to a halt."

- Must work offline (primary protection)
- Starlink at venues (secondary protection)
- Double "onion layers" strategy

### Flexibility Over Perfection

**Payout Cadence**: "Play by ear" - varies by partner

**Timeline**: "It'll get done when it gets done"

**Deployment**: "Cross that bridge when I get to it"

**Testing**: Will figure out approach as needed

### Simplicity Principles

- Keep it simple with server functions (not REST/GraphQL/tRPC)
- Avoid premature optimization
- Focus on hot path to selling tickets
- Don't over-engineer initially
- Better to log manual overrides than prevent them

---

_Last updated: Based on Jon's comprehensive answers to 48 core questions_
_Next updates: Product schema (1 week), Payments + FormanceLedger (2 weeks)_
