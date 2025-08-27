
# Domains

“What problem spaces do we solve?”

## Purpose

Domains are thin orchestration modules that expose domain functions (questions) like `canEnterEvent` or `calculatePrice`. Each domain function runs the same flow via the orchestrator — Scope → Evaluate → Interpret — and uses the shared FactService for all data fetching. Domains register their own facts and operators via Effect Layers, define typed results, and keep computations/arithmetic in code while decisions/parameters live in rules. Domains never touch the database directly.

### Responsibilities
- Define public domain functions (questions) with typed results.
- Scope rules using `domain`, actor scope, and targeting per `new/requirements/targeting.md` (UNIVERSAL/DOMAIN/ENTITY_TYPE/ENTITIES + tags ANY/ALL).
- Use the orchestrator (`executePolicy`) to load rules → extract fact requirements → gather facts → evaluate.
- Interpret matches with domain logic to produce the final answer.
- Provide domain facts/operators via Layers; compose at app startup.
- Never query the DB directly; all data flows through FactService.

> **Non‑goals:** UI layout, persistence, cross‑domain orchestration—all handled elsewhere.

## Questions → Domain Functions

In prose, we refer to business “questions” (e.g., “May actor X do Y?”). In code, these are implemented as domain functions—Effect programs that run the standard flow (scope → evaluate → interpret). Example mappings:
- “May actor X do Y?” → `canEnterEvent(params)` in Access
- “Should we show X to Y?” → `shouldShow(params)` in Visibility
- “Can Y buy X now?” → `canPurchase(params)` in Purchasability
- “What does X cost for Y?” → `calculatePrice(params)` in Pricing

---

- **Access**
  - **Representative Domain Function:** `canEnterEvent(params)`
  - **Outcome:** ALLOW / **DENY

- **Visibility**
  - **Representative Domain Function:** `shouldShow(params)`
  - **Outcome:** SHOW / HIDE

- **Purchasability**
  - **Representative Domain Function:** `canPurchase(params)`
  - **Outcome:** PURCHASABLE / BLOCKED

- **Pricing**
  - **Representative Domain Function:** `calculatePrice(params)`
  - **Outcome:** `Money` amount + breakdown (I think)

---

## Principles

- **Golden rule:** Domains translate, they don’t create. Keep decisions in rules; domains orchestrate and interpret.
- **Dependencies:** Declare via the Effect R channel; domains never fetch directly (FactService only).

## Mechanics: Scope → Evaluate → Interpret

- **Scope**
  - Domain filter: `domain = :domain`.
  - Actor scope: `(org_id = :orgId OR actor_type = 'system')`.
  - Targeting: honor `targetScope`, `targetEntityType`, ENTITIES junctions, and tags per `new/requirements/targeting.md` (UNIVERSAL/DOMAIN/ENTITY_TYPE/ENTITIES; tags ANY/ALL).
  - Entity associations: explicit junctions with EXISTS on relevant tables.
- **Evaluate**
  - Two‑Pass: extract fact requirements → gather facts → evaluate via engine.
- **Interpret**
  - Apply domain strategy to matched rules; keep compute/arithmetic in domain, decisions/parameters in rules.

## Domain extensibility (Effect Layers)

- Domains provide their facts and operators via Layers and are composed at app startup. See `new/requirements/evaluation-strategy.md` for the orchestrator shape.

---

## NOTES

**Keep a single `pricing` domain**

- We already model promotions, fees and taxes as *effect types* inside that domain.
- *Pros:* one FactService trip, one audit trail, simpler API (`calculatePrice(cartId)`).

**Composable domain functions**

- Provide small, focused questions that reuse the same rule loading and projection to return a single slice:
  - `listPromotions(ctx)` / `listFees(ctx)` / `listTaxes(ctx)` return only the requested slice without extra computation.
- Larger functions compose these primitives:
  - `calculatePrice(ctx)` composes `calculateFees(ctx)`, `calculateDiscounts(ctx)`, and `calculateTaxes(ctx)` (order defined in the pricing flow) to produce a full breakdown and total.
- This preserves a single source of truth while enabling downstream uses (receipts, analytics) to pull only what they need.
