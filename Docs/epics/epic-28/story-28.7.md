# Story 28.7: Inverse Dependency Query — Version → Consumers

**Epic:** Epic 28 — Enterprise Compliance Workflow Patterns
**Phase:** PHASE 3: IMPACT ANALYSIS
**Persona:** Compliance Officer / Incident Responder (reference personas) / Template Consumer (audience)
**Priority:** P2
**Story Points:** 5
**Status:** New

## User Story

As an incident responder, I want to select any versioned resource and immediately see every consumer currently depending on a specific version — with their scope, state, and identifying metadata — so that when a vulnerability or defect is discovered in a version, I can scope the blast radius in seconds rather than minutes, without grepping logs or hand-joining tables.

## Preconditions

- Story 28.3 shipped — approval state is queryable per consumer
- Existing entity model has at least one versioned resource with 1-to-many consumers (firmware → devices in IMS; the primitive is domain-agnostic)
- DynamoDB secondary indexes or equivalent query primitive available in persistence layer

## Context / Business Rules

- **Query is version-first.** Given `(resourceId, version)`, return all `Consumer<TMeta>` records currently bound to that version.
- **Consumers carry scope.** `scope: string[]` lets callers tag consumers (e.g., `["tenant:xyz", "site:abc", "env:prod"]`). Queries support `scope` filters (all-of or any-of).
- **Consumers carry state.** A `consumerState` field (open taxonomy, caller-supplied) surfaces consumer health (e.g., `active`, `quarantined`, `decommissioned`). Queries support state filters.
- **Results are cursor-paginated.** Large result sets (10k+ consumers) use cursor-based pagination per the api-data-layer rulebook.
- **Secondary view: version inventory.** `listVersionsInUse(resourceId)` returns all versions in active use with consumer counts — the dual query direction.
- **Export supported.** Results export to CSV for offline analysis.
- **Domain-free.** `Consumer<TMeta>` parameterizes on caller-supplied metadata; the primitive doesn't know whether a consumer is a device, a tenant, or a service.

## Acceptance Criteria

- [ ] AC1: `IDependencyGraph` interface defined in `src/lib/compliance/impact/dependency-graph.interface.ts` with methods: `listConsumers<TMeta>(resourceId, version, options)`, `listVersionsInUse(resourceId, options)`, `upsertBinding(consumerId, resourceId, version, scope, state, meta)`, `removeBinding(consumerId, resourceId)`.
- [ ] AC2: `Consumer<TMeta>` and `BindingRecord` types defined with `readonly` properties and generic metadata parameter.
- [ ] AC3: `createMockDependencyGraph()` + `createDynamoDbDependencyGraph(config)` factories exist with parity tests.
- [ ] AC4: `listConsumers` supports options: `scope` (array, ANY_OF), `state` (array, ANY_OF), `cursor`, `limit` (1-500, default 50). Returns `{ items, nextCursor }`.
- [ ] AC5: `listVersionsInUse` returns `[{ version, consumerCount }]` sorted descending by `consumerCount`; filter options mirror `listConsumers`.
- [ ] AC6: Binding writes (`upsertBinding`) are idempotent keyed on `(consumerId, resourceId)`; transitioning a consumer from version A → B is a single upsert call, not a remove+add.
- [ ] AC7: Reference firmware wiring registers a binding when a deployment confirmation completes (Story 28.6); `consumerId = deviceId`, `resourceId = firmwareFamilyId`, `version = firmwareVersion`, `scope = ["site:$siteId", "customer:$customerId"]`, `state = "active"`.
- [ ] AC8: `useInverseDependency(resourceId, version, options)` hook returns paginated consumers with stable cache keys and visibility-aware polling disabled (on-demand reads only).
- [ ] AC9: `useVersionsInUse(resourceId, options)` hook returns versions in use.
- [ ] AC10: `<ImpactQueryTable resourceId version>` component renders a paginated table: columns = `consumerId`, `scope` (tag chips), `consumerState` (badge), `meta` (custom renderer), `lastUpdated`. Filters for scope + state above the table.
- [ ] AC11: `<ImpactQueryTable>` supports CSV export of all matching records (not just current page) via a background fetch that iterates cursors.
- [ ] AC12: `<VersionsInUseBadge resourceId>` — compact inline badge showing "3 versions in use" with a click-through to a version list.
- [ ] AC13: Audit: every query execution writes an audit record with actor + filter params + result count (AU-12 for information flow monitoring).
- [ ] AC14: Reference firmware wiring: firmware version detail page gains an **"Impact"** tab using `<ImpactQueryTable firmwareFamilyId firmwareVersion>`.
- [ ] AC15: Unit tests ≥ 85% coverage. Adapter parity tests include large-result pagination (1000+ synthetic consumers).
- [ ] AC16: Performance: 500-row query returns < 500ms on localhost against the DynamoDB adapter (localstack).

## UI Behavior

- Impact table: 5 columns; scope chips are compact 4-char-ish tags with tooltip full label; state badge uses the same design language as approval state pills (Story 28.3) for consistency
- Filters: multi-select dropdowns for scope and state; clear button; URL-persisted filter state (searchable/shareable)
- Empty states: "No consumers on this version" (with suggestion to check if version is stale), "No versions in use" (rare — for decommissioned resources)
- Export button: primary action; shows progress toast while iterating pages; delivers CSV via browser download
- Performance: table virtualizes rows beyond 100 (per performance rulebook); filter changes debounced 200ms

## Out of Scope

- Graph visualization (network diagram rendering) — tabular only in this story; deferred as a polish story
- Temporal queries ("who was on version X as of date Y") — this story returns _current_ state only
- Cross-resource dependency chains (X→Y→Z) — single-hop inverse only
- Write-through automation that pushes version updates to consumers — this is a read-query primitive only
- Alerting on blast-radius thresholds (e.g., "any version with > 1000 consumers") — deferred

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) §"File Layout → impact/", §"Generic Types → Story 28.7".

## Rulebook Compliance

- **`security-nist-rulebook.md`** — AU-12 (query audit), AC-3 (read gated by canPerform), SI-10 (filter validation)
- **`architecture-rulebook.md`** — dependency-graph interface pattern, domain-free types
- **`api-data-layer-rulebook.md`** — cursor pagination, stable cache keys, classified errors
- **`performance-rulebook.md`** — table virtualization at 100+ rows, debounced filters, bulk export via iterator not single fetch
- **`code-quality-rulebook.md`** — ≥ 85% coverage, no `any`, export generator tested at scale

## Dev Checklist (NOT for QA)

1. Define interface + types in `dependency-graph.interface.ts`
2. Implement `createMockDependencyGraph()` with in-memory indexed Map (keyed on resourceId+version and consumerId+resourceId)
3. Implement `createDynamoDbDependencyGraph()` with two GSIs: `(resourceId, version) → consumers`, `(resourceId) → versions`
4. Idempotent `upsertBinding` semantics — single-item PutItem
5. `listConsumers` + `listVersionsInUse` with scope/state filters and cursor pagination
6. Hooks: `useInverseDependency`, `useVersionsInUse`
7. `<ImpactQueryTable>` with virtualization + URL-persisted filter state + CSV export (iterator pattern)
8. `<VersionsInUseBadge>` compact display
9. Reference wiring: Story 28.6 deployment confirmation triggers `upsertBinding`; firmware version detail page gets Impact tab
10. Adapter parity tests incl. 1000-consumer pagination
11. Performance test: measure p95 query latency on 1000 + 10_000 consumer fixtures

## AutoGent Test Prompts

1. **AC4 — Pagination:** "Seed 500 synthetic consumers for `(fw-X, 1.2)`. Call `listConsumers('fw-X', '1.2', { limit: 50 })`. Verify 50 returned with `nextCursor`. Iterate using cursors — verify all 500 retrieved without duplicates."
2. **AC4 — Filters:** "With 500 consumers across 3 scopes and 2 states, query scope=['site:abc'] state=['active']. Verify result count matches fixture expectation."
3. **AC5 — Versions in use:** "Seed consumers across versions 1.0 (200), 1.1 (150), 1.2 (50). Call `listVersionsInUse('fw-X')`. Verify returned array: [{1.0, 200}, {1.1, 150}, {1.2, 50}]."
4. **AC6 — Idempotent upsert:** "Call `upsertBinding` twice with identical (consumerId, resourceId). Verify single record, latest version wins. Call again with different version. Verify the consumer moved (no duplicate binding)."
5. **AC10-AC11 — Table + export:** "Render `<ImpactQueryTable>` with 200 rows. Verify table virtualizes. Apply filter scope=['site:abc']. Verify only matching rows visible. Click Export CSV. Verify CSV contains all filtered rows across pages."
6. **AC13 — Query audit:** "Execute a query with filters. Verify an AUDIT# record exists with `action: 'impact.query'`, actor, filters, and `resultCount`."

## Definition of Done

- [ ] Code reviewed + approved
- [ ] Unit tests ≥ 85%; pagination at 1000+ consumers green
- [ ] Adapter parity tests green for mock + localstack
- [ ] Performance: p95 < 500ms on 500-row query; < 2s on 10k-row query (localstack)
- [ ] Storybook stories published
- [ ] Reference firmware Impact tab wired behind `FEATURE_COMPLIANCE_LIB`
- [ ] CSV export iterator handles 1000+ rows without memory spike (measured)
- [ ] Filter state URL-persisted and shareable
- [ ] TypeScript strict, no `any`
- [ ] NIST audit integration — each query writes AU-12 record
