# Story 19.11: CRUD Foundations for Nested Tenancy

**Epic:** Epic 19 — Enterprise Template / Reusable Patterns
**Phase:** PHASE 1: Foundational Workflows
**Persona:** Administrator (manages the hierarchy) · Tenant Admin (manages their own scope)
**Priority:** P0
**Story Points:** 8
**Status:** New
**GitHub Issue:** (to be assigned on creation)
**Target URL:** `/tenants` (top-level tenants) · `/tenants/{tenantId}` · `/tenants/{tenantId}/sub-tenants/{subTenantId}` · `/tenants/{tenantId}/sub-tenants/{subTenantId}/{scoped-entity}`

## User Story

As an **Administrator**, I want standard CRUD and navigation for a **Tenant → Sub-Tenant → Scoped Entity** hierarchy — plus enforced data isolation at every level — so that every multi-tenant product built on this template inherits consistent tenancy semantics instead of reinventing them.

## Preconditions

- Template RBAC is in place.
- An audit sink exists.
- The product using this template has identified two explicit layers of tenancy (e.g., _Customer → Site_, _Org → Workspace_, _Company → Department_).

## Context / Business Rules

- **Three levels.** Tenant (root), Sub-Tenant (nested), Scoped Entity (anything owned by a sub-tenant or tenant). The template provides generic CRUD for all three; products skin them with their domain names.
- **Isolation is enforced at every query.** Every read filters by the caller's accessible tenants / sub-tenants. Cross-tenant reads require a cross-tenant privilege and are audited.
- **Soft-delete by default.** Archive rather than hard-delete. Archived tenants / sub-tenants are hidden from default list views but retrievable by admins; hard-delete is a separate, audit-heavy operation.
- **Cascading archive.** Archiving a tenant archives its sub-tenants and makes their scoped entities read-only. Restoring reverses the cascade.
- **Transfer of ownership.** A sub-tenant can be moved from one tenant to another under strict conditions (same tenancy class, no scoped-entity conflicts); transfer is audited and reversible within a window.
- **Unique within parent.** Sub-tenant slug is unique within its parent tenant; scoped-entity id is unique within its sub-tenant.
- **Permissions shape.** A Tenant Admin role is scoped to a single tenant; they manage their own sub-tenants and scoped entities. A platform Administrator can manage all tenants.
- **Search.** Full-text search across tenants + sub-tenants is available to platform admins only; tenant admins see only their own scope.

## Acceptance Criteria

- [ ] AC1: `/tenants` renders a list of tenants (paginated, searchable) with a **Create tenant** action for Administrators.
- [ ] AC2: Creating a tenant requires: `displayName`, `slug` (unique, URL-safe), and optional metadata; persist writes + audit events.
- [ ] AC3: `/tenants/{tenantId}` shows the tenant detail page with tabs: Overview, Sub-Tenants, Members, Settings, Audit.
- [ ] AC4: Sub-Tenants tab renders the same CRUD shape: list, create, detail (`/tenants/{tenantId}/sub-tenants/{subTenantId}`), archive, hard-delete (admin-only).
- [ ] AC5: Scoped entities (a generic slot — the product maps it to its domain) have CRUD under `/tenants/{tenantId}/sub-tenants/{subTenantId}/{scoped-entity}` with the same list / detail / archive pattern.
- [ ] AC6: Every read query (tenant, sub-tenant, scoped entity) automatically filters by the caller's accessible scope; attempts to read outside scope return 404, not 403 (no tenancy enumeration via error codes).
- [ ] AC7: Archiving a tenant cascades to its sub-tenants; scoped entities beneath become read-only until restored.
- [ ] AC8: Restoring an archived tenant reverses the cascade; metadata preserved intact.
- [ ] AC9: Transfer a sub-tenant to a different tenant: validation prevents slug conflicts, transfer is audited with both old and new parent ids, reversible within `transfer_reversal_window_hours` (default 48).
- [ ] AC10: Search: as a Tenant Admin, searching returns only own scope. As a platform Administrator, searching returns all scopes. Audit logs record cross-tenant reads.
- [ ] AC11: Every create / update / archive / restore / delete / transfer emits an audit event carrying actor, target, old/new values, and reason (when provided).
- [ ] AC12: The template exports reusable `<TenantList />`, `<TenantDetail />`, `<SubTenantList />`, `<ScopedEntityList />` components; products skin them with domain labels via props, no forking.
- [ ] AC13: Unit tests cover: isolation at every query, cascade on archive, restore, transfer validation, slug uniqueness, and the scope-aware search with ≥ 85% coverage.
- [ ] AC14: Integration test confirms cross-tenant read attempt returns 404 and triggers an audit event marked `cross-tenant-blocked`.

## UI Behavior

- Each CRUD list uses the template's standard `<DataTable />` with column preferences, search, and sticky filters.
- Create / Edit flows use a dialog for small forms and a dedicated page for large ones; field validation is inline.
- Archive / restore actions are destructive-styled but reversible; confirmation dialogs summarise the cascade effect.
- Transfer action opens a two-step wizard (pick target tenant → confirm) with conflict preview.
- Breadcrumbs on every detail page reflect the hierarchy and are keyboard-navigable.
- Accessibility: all lists and dialogs meet the template's WCAG 2.1 AA bar.

## Out of Scope

- Three- or four-level hierarchies (Org → Division → Team → Member) — a future extension; the generic pattern supports two levels today.
- Billing / quotas attached to tenants — separate concern; out of scope here.
- Tenant-level branding (custom logo, theme) — extensible later.
- Self-serve tenant provisioning — admin-initiated only for now.

## Tech Spec Reference

See `Docs/epics/epic-19/tech-spec.md` for: the `Tenant`, `SubTenant`, and `ScopedEntity` base models, the isolation middleware, cascade / transfer algorithms, and the component contracts.

## Dev Checklist (NOT for QA)

1. Add `Tenant`, `SubTenant`, `ScopedEntity` base types + isolation metadata (owning tenant id chain on every row).
2. Add isolation middleware: every query filters by caller's scope; cross-tenant queries require an explicit privilege and emit an audit event.
3. Build the reusable CRUD components: `<TenantList />`, `<TenantDetail />`, `<SubTenantList />`, `<ScopedEntityList />` and their Dialog variants.
4. Build cascade-archive + restore logic; ensure idempotent and reversible.
5. Build the transfer wizard + reversal job.
6. Build scope-aware search hook.
7. Audit every write; include reason field where the action demands one.
8. Ensure 404 (not 403) for out-of-scope reads.
9. Publish Storybook stories for every list / detail / dialog state.

## AutoGent Test Prompts

1. **AC1-AC2 — Create and isolate.** "As an Administrator, create Tenant A and Tenant B. Create a Sub-Tenant inside A. Log in as a Tenant Admin scoped to B. Load `/tenants/A/sub-tenants/{id}`. Verify 404, not 403."
2. **AC6 + AC14 — Cross-tenant read audit.** "As a platform Administrator, read a Tenant B sub-tenant while logged in to a Tenant A session (simulate cross-tenant privilege). Verify read succeeds. Query the audit sink; verify an event `cross-tenant-read` exists with actor and target."
3. **AC7-AC8 — Cascade archive + restore.** "Archive Tenant A (which has 2 sub-tenants and 20 scoped entities). Verify all sub-tenants are archived and scoped entities are read-only. Restore Tenant A. Verify all descendants return to active state."
4. **AC9 — Transfer.** "Transfer a sub-tenant from Tenant A to Tenant B. Verify slug uniqueness is enforced (attempt transfer where slug conflicts; observe rejection with inline error). Successful transfer emits audit event with old and new parent ids."
5. **AC10 — Scope-aware search.** "As a Tenant Admin for A, search for a term that matches both Tenant A and Tenant B sub-tenants. Verify only A results are returned. As platform Administrator, same search returns both and produces an audit event for cross-tenant access."
6. **AC11 — Audit completeness.** "Perform: create, rename, archive, restore, transfer, hard-delete on fixture tenants. Query the audit sink; verify one event per action with correct actor and old/new values."

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (≥ 85% coverage)
- [ ] Integration test proves isolation — 100 cross-tenant probes all return 404 and emit audit
- [ ] E2E test for create → archive → restore → transfer → search
- [ ] Storybook stories published for every list, detail, dialog, wizard state
- [ ] WCAG 2.1 AA — every CRUD dialog accessible, breadcrumbs keyboard-navigable
- [ ] 404 policy enforced (no 403 for out-of-scope)
- [ ] Audit events on every write verified by integration test
- [ ] TypeScript strict — no `any`
- [ ] Template adoption docs updated with a worked example (Customer → Site → Device or similar)
