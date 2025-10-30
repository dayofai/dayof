# DayOf Tech Stack - Action Items & Linear Issues

**Generated from**: Jon's answers to 48 core questions  
**Date**: Based on comprehensive tech stack Q&A  
**Purpose**: Track all follow-up actions, research needs, and open questions

---

## 🚨 CRITICAL - Immediate Action Required

### 1. FormanceLedger Refund Handling

**Status**: ❌ **BLOCKER**  
**Context**: Need to understand how FormanceLedger tracks refunds  
**Jon's Quote**: "Honestly, I don't know off the top of my head. This is something that we need to look into."  
**Timeline**: Before FormanceLedger integration (2 weeks)  
**Action**: Research FormanceLedger refund tracking patterns and implement

**Questions to Answer**:

- How does FormanceLedger represent refunds in double-entry ledger?
- Does refund reverse original transaction or create new offsetting entries?
- How to handle partial refunds?
- How to track who absorbs refund fees (venue vs platform)?

---

### 2. Ticket Instance Schema

**Status**: ❌ **NOT STARTED**  
**Context**: Ticket Type = Product (live in 1 week), but Ticket Instance schema undefined  
**Jon's Quote**: "Not sure. Don't have a specific timeline. It'll get done when it gets done."  
**Timeline**: TBD  
**Action**: Create Linear issue to define Ticket Instance schema

**Critical Concerns**:

- How instances link back to product/product variant
- Where NanoID is stored (on instance)
- **IMMUTABILITY/VERSIONING** - snapshot product at time of sale
- Prevent drift when products change after sale
- More elegant solution than simple snapshots

**Schema Requirements**:

- Reference to product/product variant (at time of sale)
- NanoID (unique ticket identifier)
- Snapshot of product configuration at purchase time
- Creation timestamp
- Customer/purchaser reference
- Status (active, used, refunded, etc.)
- Scan history

---

### 3. Product/Variant Immutability & Versioning

**Status**: ❌ **ARCHITECTURE DECISION NEEDED**  
**Context**: Must preserve exact product state at time of sale  
**Jon's Quote**: "Fundamentally though, we need to dig a little bit further into this and arrive at a slightly more elegant solution."  
**Timeline**: Before Ticket Instance schema (blocking)  
**Action**: Design versioning strategy for products/variants

**Current Plan** (needs improvement):

- Take complete snapshot of product/product variant at time of order
- Store snapshot so ticket instance can reference exact configuration

**Better Solutions to Explore**:

- Product version numbers with historical versions table
- Immutable product variant records (never update, create new version)
- Event sourcing for product changes (rejected for app, but maybe for products?)
- Copy-on-write strategy
- Time-travel queries on product history

**Requirements**:

- Ticket instance must always reference exact product as sold
- Cannot have "drift" if product is edited after sale
- Need to support refunds referencing original product state
- Must be queryable: "What did this product look like when sold?"

---

### 4. Workspace ID Scoping

**Status**: ⚠️ **DECISION REQUIRED**  
**Context**: Multi-tenancy needs both Tenant/Org ID AND Workspace ID  
**Jon's Quote**: "Please make a note about the workspace ID. I think that one's important. Either that needs to be handled by the rules engine or it needs to be on the tables."  
**Timeline**: Before schema finalization (1 week)  
**Action**: Decide scoping strategy

**Options**:

1. **Workspace ID on tables** (like Tenant/Org ID)

   - Pros: Database-level isolation, simple queries
   - Cons: More columns, migration complexity

2. **Workspace ID in rules engine** (Effect-TS)

   - Pros: Flexible, doesn't clutter schema
   - Cons: Must ensure consistent enforcement

3. **Hybrid**: Critical tables get Workspace ID, others use rules engine

**Questions**:

- What is a Workspace? (vs Organization vs Tenant)
- Which tables need Workspace ID?
- How does Workspace relate to user roles?
- Do workspaces nest or relate hierarchically?

**Recommendation Needed**: Jon to decide which approach

---

### 5. FormanceLedger Chart of Accounts

**Status**: ❌ **NOT STARTED**  
**Context**: Need to map all actors and accounts before ledger integration  
**Jon's Quote**: "We probably need to create a sample chart of accounts... first step: Map all actors and all accounts that might exist."  
**Timeline**: Before FormanceLedger integration (2 weeks)  
**Action**: Create comprehensive chart of accounts

**Known Accounts**:

**Customers**:

- Individual customer accounts (one per purchaser)

**Venues/Tenants**:

- Venue Stripe accounts (one per venue)

**Platform**:

- DayOf Stripe account (receives application fees)
- DayOf Mercury checking account (bank account)

**Stripe**:

- Stripe fees catchall account (processing fees)

**Affiliates/Growth Partners**:

- Individual affiliate accounts (commission tracking)
- Individual growth partner accounts (revenue share)

**Other Possible Accounts**:

- Refunds/adjustments accounts?
- Disputed transaction holding accounts?
- Tax withholding accounts?
- Escrow accounts?

**Deliverable**: Spreadsheet or document listing:

- All account types
- Account naming conventions
- Account relationships
- Sample transactions between accounts
- Account balances and what they represent

---

### 6. Stripe Webhook Signature Verification

**Status**: ⚠️ **VERIFY**  
**Context**: Webhooks received directly in Inngest - need to confirm security  
**Jon's Quote**: "Good point. Make a note. Probably need to look into it. Pretty sure it's handled by Inngest, though."  
**Timeline**: Before payment processing goes live (2 weeks)  
**Action**: Verify Inngest handles Stripe signature verification

**Questions**:

- Does Inngest automatically verify Stripe webhook signatures?
- If not, where do we add verification logic?
- How do we configure Stripe webhook secret in Inngest?
- What happens if signature verification fails?

**Test Plan**:

1. Send test webhook from Stripe to Inngest endpoint
2. Verify signature checking is working
3. Test failure case (invalid signature)
4. Document configuration steps

---

### 7. List All Relevant Stripe Webhooks

**Status**: ❌ **NOT DOCUMENTED**  
**Context**: Need comprehensive list of webhooks and why we listen to them  
**Jon's Quote**: "Any and all of them that are relevant to us... Make a note or Linear issue to list all relevant Stripe webhooks and why we listen to them."  
**Timeline**: Before payment processing goes live (2 weeks)  
**Action**: Create Linear issue + document webhook strategy

**Known Categories**:

- Charges (succeeded, failed, refunded)
- Payment intents (succeeded, failed)
- Subscriptions (created, updated, deleted, payment succeeded/failed)
- Payouts (paid, failed)
- Connected accounts (account.updated)
- Disputes (created, updated, closed)

**Deliverable**: Document for each webhook:

- Event name
- Why we listen to it
- What Inngest function handles it
- What database records are updated
- What ledger entries are created
- Any subsequent events emitted

---

## ⚠️ HIGH PRIORITY - Near Term

### 8. Manual Override Metadata Contract

**Status**: ❌ **NOT DEFINED**  
**Context**: Manual admit/override available to all staff, needs proper logging  
**Jon's Quote**: "I don't have an exact contract for this, but it's probably something I should make."  
**Timeline**: Before Crew app scanning implementation  
**Action**: Define exact metadata structure for manual overrides

**Required Fields**:

- Override timestamp
- Staff user who performed override
- Reason (optional text field)
- Original rule validation result (what would have happened)
- Ticket/attendee affected
- Event/venue context
- Device ID

**Use Cases**:

- Audit trail for manual admits
- Analytics on override frequency
- Staff training (which rules get overridden most)
- Abuse detection (excessive overrides by single staff member)

---

### 9. Spring Break 2025 Rough Edges - Comprehensive List

**Status**: ❌ **NOT DOCUMENTED**  
**Context**: Learn from 2025 to improve 2026  
**Jon's Quote**: "Please make a note about revisiting rough edges. We should probably make a linear issue."  
**Timeline**: Before Spring Break 2026 (mid-February)  
**Action**: Create Linear issue + document all 2025 problems and solutions

**Categories to Document**:

- Technical issues (system failures, bugs)
- Operational issues (staff confusion, workflow problems)
- Edge cases (scenarios not handled)
- Performance problems (slow scans, sync delays)
- User experience issues (confusing UI, missing features)
- Communication gaps (staff, attendees, venues)

**For Each Issue**:

- What happened
- When it happened (time, location, context)
- How it was solved in the moment
- Root cause analysis
- What should be built to prevent/improve
- Priority level

---

### 10. BetterAuth + Server Functions Integration

**Status**: ⚠️ **RESEARCH NEEDED**  
**Context**: How does BetterAuth context pass to TanStack Start server functions?  
**Jon's Quote**: "Not sure, not sure where we would need this. Should probably look into it more."  
**Timeline**: As needed when implementing authenticated server functions  
**Action**: Research and document integration pattern

**Questions**:

- How does BetterAuth session/user info reach server functions?
- Is it automatic via TanStack Start?
- Do we need middleware or wrappers?
- How do we protect server functions with auth checks?
- Example code pattern?

---

### 11. Honoken README - Certificate Management Reference

**Status**: ⚠️ **DOCUMENT EXISTS, NEEDS REFERENCE**  
**Context**: Apple PassKit certificate details are in Honoken README  
**Jon's Quote**: "This is all broken down in the HonoKin README."  
**Timeline**: As needed for onboarding or troubleshooting  
**Action**: Reference or extract key certificate management details

**Topics to Extract**:

- Apple Developer account setup
- Certificate generation process
- Certificate renewal process
- Certificate storage/security
- Signing certificate vs pass type ID
- Testing certificates vs production

---

### 12. PowerSync Sync Scoping Strategy

**Status**: ⚠️ **NEEDS REFINEMENT**  
**Context**: Currently scoping by Org ID, but may need more granular filters  
**Jon's Quote**: "Probably worth making a linear issue or note about."  
**Timeline**: As Crew app matures  
**Action**: Create Linear issue for sync scoping investigation

**Current Approach**:

- Scope by Organization ID
- Pull everything for org initially (simplest)

**Future Refinements**:

- Scope by event (scanner only sees assigned event)
- Scope by date range (only current/upcoming events)
- Scope by role (different data for different staff)
- Optimize for initial sync size vs ongoing updates

**PowerSync Features to Investigate**:

- Sync rules documentation
- Parameter-based filtering
- Dynamic sync parameter updates
- Collection buckets

---

### 13. eventcatalog.dev Evaluation

**Status**: 📋 **UNDER CONSIDERATION**  
**Context**: Tool for mapping event-driven architecture  
**Jon's Quote**: "We are seriously considering using eventcatalog.dev as a way to map out our EDA."  
**Timeline**: As event taxonomy grows  
**Action**: Evaluate eventcatalog.dev for DayOf's needs

**Evaluation Criteria**:

- Ease of defining events
- Visualization capabilities
- Integration with TypeScript code
- Versioning support
- Team collaboration features
- Documentation generation
- Cost (if any)

**Alternative Tools**:

- AsyncAPI
- Mermaid diagrams in docs
- Custom visualization tool
- Inngest's built-in event tracking

---

## 📋 MEDIUM PRIORITY - Research & Discovery

### 14. FormanceLedger Deployment - Due Diligence

**Status**: ⚠️ **RESEARCH NEEDED**  
**Context**: Need to determine best deployment strategy  
**Jon's Quote**: "We do need to do a little bit more discovery and due diligence about the deployment of Formance Ledger and where we can host it."  
**Timeline**: Before FormanceLedger integration (2 weeks)  
**Action**: Research and document deployment options

**Options to Investigate**:

1. **Vercel (Preferred)**

   - Can we run FormanceLedger on Vercel?
   - Docker support?
   - Same IAD1 region as apps?
   - Cost implications?

2. **Fly.io**

   - Good for sidecar services
   - Region matching with Vercel
   - Cost vs Vercel

3. **Railway**

   - Simple deployment
   - Region options
   - Cost

4. **Self-managed VPS**

   - AWS EC2 in same region
   - Digital Ocean
   - More control, more management

5. **Formance Cloud**
   - Unknown pricing
   - Less control
   - Managed solution

**Decision Criteria**:

- Co-location with Vercel IAD1
- Latency to database (Neon IAD1)
- Cost
- Operational overhead
- Reliability/uptime

---

### 15. Formance Payments - Connected Accounts Support

**Status**: ⚠️ **RESEARCH NEEDED**  
**Context**: Formance Payments (formerly Formance Connect) might simplify Stripe reconciliation  
**Jon's Quote**: "I'm not sure how that handles connected accounts yet."  
**Timeline**: As Stripe integration matures  
**Action**: Investigate Formance Payments for connected accounts

**Questions**:

- Does Formance Payments support Stripe Connected Accounts?
- Can it sync Standard connected account transactions?
- How does it handle application fees?
- Does it sync payouts?
- What's the sync latency?
- Cost/pricing?

**Fallback**: Airbyte with 5-15 minute sync window

---

### 16. Formance Reconciliation Module Pricing

**Status**: ⚠️ **REACH OUT TO FORMANCE**  
**Context**: Formance has reconciliation module that might be useful  
**Jon's Quote**: "We should probably reach out to Formance and discuss pricing."  
**Timeline**: Before making reconciliation architectural decisions  
**Action**: Contact Formance sales/support

**Questions for Formance**:

- Reconciliation module pricing (separate from ledger?)
- What does reconciliation module do?
- Integration with Stripe
- Automated reconciliation features
- Alerting on discrepancies
- Historical reconciliation

---

### 17. OpenTelemetry Collector - Self-Hosted Setup

**Status**: ⚠️ **IMPLEMENTATION NEEDED**  
**Context**: Can't find simple managed OTEL collector  
**Jon's Quote**: "For the life of me, I cannot find a simple managed hotel collector. So, gonna have to be self-hosted somewhere."  
**Timeline**: As observability becomes critical  
**Action**: Implement self-hosted OTEL collector

**Requirements**:

- Fan-out to: Axiom, Dash0, S3
- Handles OTEL from all apps
- Reliable, low-latency
- Simple deployment (Docker?)
- Monitoring for collector itself

**Hosting Options**:

- Vercel (if possible)
- Fly.io
- Railway
- Dedicated VPS

**Configuration**:

- OTEL collector config file
- Receivers for each app
- Exporters for each destination
- Batching and retry logic

---

## 🔵 LOWER PRIORITY - Future Considerations

### 18. Testing Strategy - Multi-Step Inngest Workflows

**Status**: 🤷 **TBD**  
**Context**: Need to test complex Inngest workflows  
**Jon's Quote**: "No clue. Haven't gotten this far yet. I imagine there's a way to do it."  
**Timeline**: As Inngest usage grows  
**Action**: Research Inngest testing best practices

---

### 19. E2E Testing Approach

**Status**: 🤷 **TBD**  
**Context**: Need end-to-end testing strategy  
**Jon's Quote**: "Not 100% sure on this yet. Cross that bridge when I get to it."  
**Timeline**: As app matures  
**Action**: Define E2E testing approach (Playwright? Cypress?)

---

### 20. Session Security Details

**Status**: 📋 **USE DEFAULTS FOR NOW**  
**Context**: Session expiration, concurrent limits  
**Jon's Quote**: "Not sure, chances are, whatever standard."  
**Timeline**: Review after initial launch  
**Action**: Document chosen defaults and rationale

---

### 21. API Authentication Flow Details

**Status**: 📋 **ASSUME TANSTACK START HANDLES**  
**Context**: How Front Row/Backstage authenticate server function calls  
**Jon's Quote**: "No clue... As far as I understand it, that's TanStack Start's domain."  
**Timeline**: Review as needed  
**Action**: Document actual behavior once implemented

---

### 22. Payout Automation Details

**Status**: 📋 **FLEXIBLE, VARIES BY PARTNER**  
**Context**: Payout cadence, calculation, approval  
**Jon's Quote**: "Will probably vary from venue-to-venue... play this one by ear."  
**Timeline**: As external clients onboard  
**Action**: Define per-partner payout configurations

---

## 📊 Documentation Needs

### 23. Rules Engine Deep Dive

**Status**: 🔒 **DEFERRED TO SEPARATE DISCUSSION**  
**Context**: Effect-TS rules engine is complex, needs its own design doc  
**Jon's Quote**: "Let's skip this for now... the rules engine is its own island."  
**Timeline**: TBD  
**Action**: Schedule separate session for rules engine architecture

**Topics to Cover**:

- Rule definition DSL
- Rule persistence schema
- Rule evaluation flow
- Rule testing strategy
- Rule versioning
- Example rules (time, tier, re-entry, session)
- Server vs device execution
- Performance optimization

---

### 24. Customer Service Tools Deep Dive

**Status**: 🔒 **DEFERRED**  
**Context**: High priority feature but needs dedicated discussion  
**Timeline**: TBD  
**Action**: Schedule session for customer service tools design

**Topics to Cover**:

- Ticket lookup interface
- Manual ticket issuance
- Refund processing UI
- Attendee communication tools
- Venue staff tools
- Scanner troubleshooting
- Dispute resolution workflow

---

### 25. Door Cover Implementation

**Status**: 🔒 **DEFERRED, NOT IN HOT PATH**  
**Context**: Walk-up payments at door  
**Jon's Quote**: "For right now, let's table the door cover discussion."  
**Timeline**: After core ticketing is live  
**Action**: Design door cover flow

**Known Requirements**:

- Use same Crew scanning app
- Quick ID check + payment
- Possible Stripe card reader/NFC
- Cover = immediate-use ticket
- Our own POS (no external integrations)

---

## ✅ Resolved/Clarified (No Action Needed)

### Multi-Tenancy Strategy

**Decision**: Tenant/Org ID on tables, NO Row-Level Security (RLS)  
**Status**: ✅ **CLEAR**

### FormanceLedger Deployment Strategy

**Decision**: Self-hosted sidecar, ideally Vercel IAD1 region  
**Status**: ✅ **CLEAR** (implementation pending)

### Transactional Pattern

**Decision**: Effect-TS in Inngest steps, NOT database transactions  
**Status**: ✅ **CLEAR**

### PowerSync Deployment

**Decision**: Managed PowerSync (unless costs balloon)  
**Status**: ✅ **CLEAR**

### Stripe Integration

**Decision**: Standard Connected Accounts, direct charges + application fees  
**Status**: ✅ **CLEAR**

### Observability Strategy

**Decision**: Run BOTH Axiom AND Dash0, plus S3 forever log, evaluate later  
**Status**: ✅ **CLEAR**

### Manual Override Access

**Decision**: Available to ALL STAFF (pragmatic reality)  
**Status**: ✅ **CLEAR**

### Physical Card Encoding

**Decision**: NanoID only (~5 chars, capitals, no ambiguous chars)  
**Status**: ✅ **CLEAR**

### Events App

**Decision**: Simple Hono server exposing Inngest handler, no other functionality  
**Status**: ✅ **CLEAR**

### Event Naming Convention

**Decision**: Follow Inngest idioms (likely domain.action format)  
**Status**: ✅ **CLEAR**

### Drizzle Migrations

**Decision**: Managed with Drizzle Kit, automated in production  
**Status**: ✅ **CLEAR**

### Testing Framework

**Decision**: Vitest for unit tests  
**Status**: ✅ **CLEAR**

---

## 🎯 Summary Statistics

**Total Action Items**: 25  
**Critical (Immediate)**: 7  
**High Priority**: 6  
**Medium Priority (Research)**: 4  
**Lower Priority (Future)**: 5  
**Documentation Needs**: 3

**Blocking Timeline**:

- Product schema: 1 week
- Payment processing: 2 weeks
- FormanceLedger: 2 weeks

**Items Blocking Others**:

- Product/variant versioning (#3) blocks Ticket Instance schema (#2)
- Workspace ID scoping (#4) blocks schema finalization
- Chart of accounts (#5) blocks FormanceLedger integration
- Webhook verification (#6) blocks payment processing go-live
- Webhook list (#7) blocks payment processing go-live

---

_Generated from Jon's comprehensive answers to 48 core questions_  
_Priority rankings based on timeline and blocking dependencies_  
_Review and update as work progresses_
