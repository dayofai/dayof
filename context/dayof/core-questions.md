# DayOf Tech Stack - Core Questions (ANSWERED)

**Goal**: Answer these in a few hours to clarify critical architectural decisions and near-term implementation details.

**Total**: 48 questions organized by immediate priority  
**Status**: ✅ **ALL ANSWERED** by Jon

---

## 🔴 CRITICAL - Going Live Within 2 Weeks

### Payment Processing (Live in 2 weeks)

#### 1. ✅ Stripe Connect Account architecture?

- **Answer**: Standard Connected Accounts for all current accounts (Maniac, Student Escape)
- **Future**: New venues likely have or will create Standard accounts; Custom possible later
- **Onboarding**: Not fully defined; white-glove assistance initially; will evolve
- **Decision**: Standard accounts with direct charges + application fees

#### 2. ✅ Payment flow for ticket purchase?

- **Answer**: Direct charges (Standard connected accounts)
- **Flow**: Customer → Direct Charge → Venue Stripe Account (Stripe takes fee, DayOf gets app fee)
- **Money movement**: Single transaction
- **Application fees**: Specified in charge, Stripe pays DayOf automatically

#### 3. ✅ Refund handling?

- **Answer**: Venue absorbs refunds (not DayOf)
- **App fee refund**: Negotiated per-venue
- ⚠️ **Action needed**: Research how FormanceLedger tracks refunds

#### 4. ✅ Product schema structure? (Live within 1 week)

- **Answer**: Ticket Type = Product of type "ticket" ✅
- **Philosophy**: Don't reinvent e-commerce wheel; standard product model
- **Ticket Instance**: Schema TBD, needs Linear issue
- ⚠️ **Action needed**: Define Ticket Instance schema + versioning strategy

#### 5. ⚠️ Door cover (walk-up payments)?

- **Answer**: DEFERRED (not in hot path for tickets)
- **Future**: Same Crew app, possible Stripe card reader/NFC
- **Our own POS**: No external integrations currently

### FormanceLedger Integration (Live in ~2 weeks)

#### 6. ✅ FormanceLedger deployment?

- **Answer**: Self-hosted sidecar (most likely)
- **Location**: Ideally Vercel IAD1 region (same as apps)
- **Rationale**: Unknown Formance cloud pricing, want co-location control
- ⚠️ **Action needed**: Due diligence on deployment options

#### 7. ✅ Transactional pattern implementation?

- **Answer**: Effect-TS in Inngest steps (NOT database transactions)
- **Failure handling**: Simple retries → 5-alarm-fire notification → bubble error to user
- **Both must succeed**: DB + Ledger operations atomic via Effect-TS orchestration

#### 8. ✅ Which operations trigger ledger entries?

- **Answer**: "Any operation that involves money. If money moves, it's a ledger entry."
- **Includes**: Every Stripe charge, refund, payout, application fee, manual adjustment

#### 9. ✅ Ledger account structure?

- **Answer**: "Every actor that either receives or sends money has an account"
- **Accounts**: Every customer, affiliate, venue owner, growth partner, platform, Stripe fees
- **Model**: One-to-one with real world
- ⚠️ **Action needed**: Create chart of accounts mapping all actors

#### 10. ⚠️ Example ledger transaction for ticket purchase?

- **Answer**: SKIPPED for now
- **Basic flow described**: Customer → Tenant Stripe → (fees) → DayOf app fee → Bank
- ⚠️ **Action needed**: Detailed example with debit/credit entries

#### 11. ✅ Reconciliation process?

- **Answer**: Fully automated
- **Investigating**: Formance Payments (formerly Formance Connect) - unknown if supports connected accounts
- **Fallback**: Airbyte with 5-15 minute sync window
- ⚠️ **Action needed**: More due diligence; reach out to Formance re: reconciliation module pricing

---

## 🟠 HIGH PRIORITY - Core Architecture

### Inngest & Event-Driven Architecture

#### 12. ✅ Events app architecture?

- **Answer**: Simple Hono server exposing Inngest handler
- **No other functionality** currently

#### 13. ✅ Event emission pattern from apps?

- **Answer**: Server functions emit to Inngest client
- **Pattern**: Standard `inngest.send('event.name', data)`
- **Considering**: eventcatalog.dev for EDA mapping

#### 14. ✅ First events to be defined?

- **Answer**: Stripe-related, purchases, PassKit events
- **Priority**: Whatever is in hot path to selling tickets
- **Taxonomy**: Not yet defined in-repo; hundreds expected over time

#### 15. ✅ Event naming convention?

- **Answer**: Follow Inngest idioms
- **Likely format**: domain.action (e.g., `ticket.purchased`)

#### 16. ✅ Inngest function organization?

- **Answer**: Probably organized by DDD domains (not current app structure)
- **Not flat structure** (will have hierarchy as complexity grows)

#### 17. ⚠️ Testing Inngest functions locally?

- **Answer**: Inngest dev server will be set up (automated in Turborepo)
- **Multi-step workflow testing**: Approach TBD

### Authentication & API

#### 18. ⚠️ API authentication flow?

- **Answer**: Not sure - assumed TanStack Start handles this
- **Jon's understanding**: Wasn't aware manual auth needed for server functions
- ⚠️ **Action needed**: Research BetterAuth + server functions integration

#### 19. ✅ Session security?

- **Answer**: Standard/default (whatever is typical)
- **Session expiration**: TBD (probably standard duration)
- **Concurrent sessions**: TBD (probably standard limits)

#### 20. ⚠️ BetterAuth + server functions integration?

- **Answer**: Not sure where this would be needed
- ⚠️ **Action needed**: Look into this more, worth noting

---

## 🟡 IMPORTANT - Spring Break 2026 Critical Path

### Mobile App (Crew)

#### 21. ✅ PowerSync server setup?

- **Answer**: Managed PowerSync (unless costs balloon)
- **Rationale**: Only ~100 devices for first Spring Break; not worried about cost initially
- **Connection**: Same Neon database as everything else

#### 22. ✅ PowerSync sync rules?

- **Answer**: Initially scoped by Organization ID
- **Future**: May implement more granular filters (PowerSync supports this)
- ⚠️ **Action needed**: Linear issue for sync scoping strategy

#### 23. ✅ Offline data storage size?

- **Answer**: NOT A CONCERN - "This isn't 1992 anymore, and this isn't a Nokia"
- **Scale**: Even pulling 30 events for org is minimal data on modern iPhone
- **Philosophy**: Storage optimization deprioritized vs security/tenant isolation

#### 24. ✅ Effect-TS rules engine implementation?

- **Answer**: Rules persisted to database (must sync via PowerSync to devices)
- **DSL exists** but details deferred (separate deep dive)
- **Note**: "Rules engine is its own island"

#### 25. ⚠️ Rules engine testing?

- **Answer**: Rules in DB, same engine code runs server + device = guaranteed parity
- **Testing**: Probably property-based testing
- ⚠️ **Action needed**: Define testing approach

#### 26. ⚠️ Rule examples?

- **Answer**: SKIPPED - deferred to rules engine deep dive

#### 27. ✅ Scanning validation flow?

- **Answer**: PowerSync is local-first; always query synced data
- **Always immediate response** (offline or online, same behavior)
- **No ledger update** on scan (not a financial transaction)

#### 28. ✅ Real-time ticket purchase → scanner sync?

- **Answer**: Tickets created in DB → PowerSync watches → syncs in 1-2 seconds
- **Mechanism**: PowerSync handles push notification (specific method TBD)

### Access Control System

#### 29. ✅ Apple Wallet pass generation?

- **Answer**: Using PassKit-generator (GitHub library)
- **Certificate management**: Detailed in Honoken README
- ⚠️ **Action needed**: Reference Honoken README for certificate details

#### 30. ✅ Physical card linking?

- **Answer**: Only NanoID encoded on card (~5 chars, capitals, no ambiguous chars)
- **Linking flow**: Scan Apple Pass → prompt to scan physical card QR → link in DB
- **Strategy**: Cards printed in advance; manual duplicate check before printing

#### 31. ✅ Manual admit/override?

- **Answer**: Available to ALL STAFF (pragmatic reality)
- **Philosophy**: Better to log it than have it happen off-system
- **Quote**: "Front door staff will completely invalidate your software if it gets in their way"
- **Logging**: Marked with metadata indicating manual override
- ⚠️ **Action needed**: Define exact metadata contract

---

## 🟢 MEDIUM PRIORITY - Near-Term Needs

### Database & Schema

#### 32. ✅ Core entity relationships?

- **Answer**: Events ↔ Ticket Types are DECOUPLED (DayOf's core innovation)
- **Ticket Types**: Can associate with events OR event groups (manual or smart/filtered)
- **Ticket Instances**: One-to-many from type to instance; instances can belong to groups
- **Events**: Can belong to groups/segments (manual or smart)
- **Think**: Customer.io cohorts, PostHog segments applied to events/tickets
- **Users ↔ Organizations**: Many-to-many

#### 33. ✅ Multi-tenancy implementation?

- **Answer**: Tenant ID / Org ID on tables
- **Explicitly NOT using**: Row-Level Security (RLS) - "Absolutely fucking no way in hell"
- ⚠️ **Action needed**: Workspace ID scoping - needs decision (tables or rules engine?)

#### 34. ✅ Drizzle migrations?

- **Answer**: Managed with Drizzle Kit
- **Strategy**: Automated in production (must succeed in develop first)
- **Access**: Currently only Jon can push to production

### Observability

#### 35. ⚠️ OpenTelemetry collector setup?

- **Answer**: Self-hosted (can't find simple managed option)
- **Location**: TBD ("I'll figure it out when I get there")
- ⚠️ **Action needed**: Find/implement self-hosted OTEL collector

#### 36. ✅ Axiom vs Dash0 decision?

- **Answer**: Running BOTH (fully duplicated)
- **Strategy**: Fan out from OTEL collector to both, evaluate, potentially cut one later
- **Also**: Fan out to S3 forever log

#### 37. ✅ PostHog deployment plan?

- **Answer**: Front Row and Backstage get PostHog next
- **Integration**: Built into Inngest functions and events as we go
- **No specific timeline** for full rollout

### Webhooks & Payouts

#### 38. ✅ Stripe webhook endpoint?

- **Answer**: Received directly in Inngest
- **Inngest creates events** from webhooks automatically
- ⚠️ **Action needed**: Verify Inngest handles webhook signature verification

#### 39. ⚠️ Which Stripe webhook events?

- **Answer**: "Any and all of them that are relevant to us"
- **Categories**: Charges, payment intents, subscriptions, payouts, failures
- ⚠️ **Action needed**: Create Linear issue to list all relevant webhooks + rationale

#### 40. ✅ Payout cadence?

- **Answer**: Flexible - varies by venue, tenant, affiliate, growth partner
- **Approach**: "Play by ear" based on partner needs
- **Options**: Daily, weekly, bi-weekly, monthly all possible

#### 41. ✅ Growth partner payout calculation?

- **Answer**: Percentage varies (5%, 15%, 30% - negotiated per partner)
- **Calculation**: DayOf gets application fee → growth partner gets % of that fee
- **Example**: $1 fee, 5% share → $0.05 to growth partner
- **Tracking**: Real-time-ish (close enough for gamification)

---

## 🔵 CONTEXT - Good to Know Now

### Customer Service Tools

#### 42. ✅ Ticket lookup tools?

- **Answer**: Yes - search by email, name, phone, ticket ID, and more
- ⚠️ **Deferred**: Priority view/workflow needs separate deep dive

#### 43. ✅ Manual ticket issuance?

- **Answer**: Yes - UI for support to create tickets
- **Approval workflow**: Probably not initially (role-based permission sufficient)
- **Philosophy**: Don't want approval workflow headache initially

### Testing & Deployment

#### 44. ✅ Testing framework?

- **Answer**: Vitest for unit tests
- **E2E testing**: Approach TBD ("cross that bridge when I get to it")

#### 45. ✅ Deployment pipeline?

- **Answer**: Mix of GitHub Actions and Vercel built-in CI (uncertain which currently)
- **Possibility**: Consolidate to Vercel built-in CI
- **Preview deployments**: Yes, per-PR for all apps

#### 46. ✅ Staging environments?

- **Answer**: Separate preview for each app
- **Domains**: `app.preview.dayof.ai` pattern (e.g., `backstage.preview.dayof.ai`)
- **Database**: Neon branching for staging/preview

### Spring Break 2026 Readiness

#### 47. ✅ Expected Spring Break 2026 scale?

- **Card holders**: ~60,000 (maximum)
- **Venues**: 15-20
- **Peak scans/hour**: ~10,000 across all venues (estimate, needs verification)

#### 48. ✅ Success metrics for Spring Break 2026?

- **MUST work perfectly**:
  1. **Order processing**: "Cannot fail to process an order. Downtime is unacceptable."
  2. **Scanning**: "Scanning cannot fail. It grinds entry to halt."
- **Strategy**: Double protection via offline-first + Starlink at venues
- **Can be rough edges**: Data collection, backend data handling, non-critical reporting
- ⚠️ **Action needed**: Create Linear issue for Spring Break 2025 rough edges list

---

## 📊 Answer Summary

**Total Questions**: 48  
**Fully Answered**: 37 (77%)  
**Partially Answered**: 8 (17%)  
**Deferred/Skipped**: 3 (6%)

### Status Breakdown

**✅ Fully Answered (37)**:

- Payment architecture (Stripe Standard Connected)
- FormanceLedger approach (self-hosted sidecar, Effect-TS transactions)
- Inngest setup (centralized Events app)
- Multi-tenancy (Tenant/Org ID on tables, NO RLS)
- Mobile (PowerSync managed, Effect-TS rules in DB)
- Observability (BOTH Axiom and Dash0, S3 forever log)
- Access control (manual override for all staff, NanoID on cards)
- Testing (Vitest)
- Deployment (preview per PR, Neon branching)
- Spring Break scale (60k card holders, 15-20 venues)

**⚠️ Partially Answered / Action Needed (8)**:

- FormanceLedger refund tracking (research needed)
- Ticket Instance schema (needs Linear issue)
- Product/variant versioning (needs more elegant solution)
- Workspace ID scoping (decision needed)
- Chart of accounts (needs to be created)
- Webhook signature verification (verify Inngest handles)
- List of Stripe webhooks (needs documentation)
- BetterAuth + server functions (research needed)

**🔒 Deferred to Separate Discussion (3)**:

- Door cover implementation
- Rules engine details
- Example ledger transactions

---

## 🎯 Critical Path Forward

**Week 1** (Product schema going live):

1. Finalize Workspace ID scoping decision
2. Complete product/variant versioning design
3. Create Ticket Instance schema Linear issue

**Week 2** (Payments + FormanceLedger going live): 4. Research FormanceLedger refund handling 5. Create chart of accounts 6. Verify Stripe webhook signature verification 7. Document all relevant Stripe webhooks 8. Complete FormanceLedger deployment due diligence

**Before Spring Break 2026**: 9. Create Spring Break 2025 rough edges list 10. Define manual override metadata contract 11. Test scanning at scale

---

## 📝 Key Decisions Confirmed

### Architecture

- ✅ TypeScript everywhere
- ✅ Turborepo monorepo
- ✅ TanStack Start server functions (not REST/GraphQL/tRPC)
- ✅ Event-driven via Inngest
- ✅ Multi-tenancy: Tenant/Org ID on tables, NO RLS

### Payments & Financial

- ✅ Stripe Standard Connected Accounts
- ✅ Direct charges + application fees
- ✅ FormanceLedger self-hosted sidecar
- ✅ Effect-TS transactional pattern in Inngest
- ✅ Venue absorbs refunds (app fee refund negotiated)

### Mobile & Scanning

- ✅ PowerSync managed deployment
- ✅ Effect-TS rules persisted to DB
- ✅ Manual override available to all staff
- ✅ NanoID-only encoding on physical cards

### Observability KD

- ✅ Running BOTH Axiom and Dash0 (evaluate later)
- ✅ S3 forever log
- ✅ PostHog in Honoken, expanding to other apps

### Operational

- ✅ Order processing MUST work (no downtime, no mistakes)
- ✅ Scanning MUST work (offline-first + Starlink backup)
- ✅ Flexible payout cadence (varies by partner)
- ✅ Pragmatic realism ("Front door staff will invalidate software if it gets in their way")

---

_All 48 questions answered by Jon_  
_Action items tracked in separate artifact_  
_Next: Execute on critical path timeline_
