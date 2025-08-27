
# Targeting (Frozen V1)

“Which rules are eligible for this question?”

## Scope model

- Each rule declares exactly one `targetScope`:
  - `UNIVERSAL`: applies to everything (rare; platform rules)
  - `DOMAIN`: applies to everything in the rule’s domain
  - `ENTITY_TYPE`: applies to all entities of one `targetEntityType` (e.g., all events)
  - `ENTITIES`: applies to specific entities listed in explicit junction tables

- Optional tags act as a runtime narrow filter (escape hatch). Tags can be matched in ANY or ALL mode based on domain function inputs.

## Columns (rules table)

- `domain` (enum) – hard partition by interpreter
- `targetScope` (enum('UNIVERSAL','DOMAIN','ENTITY_TYPE','ENTITIES')) not null default 'UNIVERSAL'
- `targetEntityType` (enum of known entity types) – required when `targetScope = 'ENTITY_TYPE'`, optional otherwise
- `effect` (enum('boolean','linked')) – discriminator for interpreter behavior
- Standard multi‑tenant scoping: `org_id` (nullable) and `actor_type`

## Junctions (explicit, per entity)

- Keep explicit, type‑safe junctions (no polymorphism):
  - `rule_target_events(rule_id, event_id)`
  - `rule_target_tickets(rule_id, ticket_id)`
  - `rule_target_products(rule_id, product_id)`
  - `rule_target_product_variants(rule_id, variant_id)`
  - `rule_target_tags(rule_id, tag)`

Notes:
- `ENTITIES` may include rows across multiple junctions if needed (escape hatch). Optionally enforce single‑family later via validation.
- `ENTITY_TYPE` targets exactly one `targetEntityType` and must not have entity‑level rows.

## Loader semantics

- Always filter by:
  - `domain = :domain`
  - tenant scope: `(org_id = :orgId OR actor_type = 'system')`
  - active window: `is_active = true AND deleted_at IS NULL` (and temporal windows if present)

- Targeting (no inference; use declared scope):
  - `UNIVERSAL` or `DOMAIN` → include directly
  - `ENTITY_TYPE` → `targetEntityType IN (:typesRequiredByQuestion)`
  - `ENTITIES` → EXISTS on the relevant junction(s) for question inputs

- Tags (optional runtime filter):
  - ANY: `EXISTS rule_target_tags WHERE tag IN (:tags)`
  - ALL: `COUNT(DISTINCT tag WHERE tag IN (:tags)) = :tags.length`

- Ordering when needed:
  - `CASE targetScope WHEN 'ENTITIES' THEN 3 WHEN 'ENTITY_TYPE' THEN 2 WHEN 'DOMAIN' THEN 1 ELSE 0 END DESC`
  - then `priority DESC`

## Examples

- `isTicketValidForEvent(ticketId, eventId, env)`
  - domain = 'access'
  - typesRequiredByQuestion = ['event','ticket']
  - include `UNIVERSAL`, `DOMAIN`
  - include `ENTITY_TYPE` for 'event' or 'ticket'
  - include `ENTITIES` where exists rows in `rule_target_events(eventId)` or `rule_target_tickets(ticketId)`
  - optional tags narrowing with ANY/ALL

## Indexing

- `rules(domain, org_id, targetScope, is_active)` btree
- junction PK/unique indexes (rule_id, <entity_id>) btree
- `rule_target_tags(rule_id, tag)` btree

## Write‑path validation (saveRule)

- `UNIVERSAL`/`DOMAIN`: reject entity rows
- `ENTITY_TYPE`: require `targetEntityType`; reject entity rows
- `ENTITIES`: require at least one entity row; optionally enforce single junction family
