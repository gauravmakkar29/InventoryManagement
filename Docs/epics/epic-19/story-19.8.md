# Story 19.8: Per-Category Artifact Requirement Matrix

**Epic:** Epic 19 — Enterprise Template / Reusable Patterns
**Phase:** PHASE 1: Foundational Workflows
**Persona:** Administrator (configures the matrix) · Approver / Reviewer (consume its output on entity pages)
**Priority:** P1
**Story Points:** 5
**Status:** New
**GitHub Issue:** (to be assigned on creation)
**Target URL:** `/admin/artifact-requirements` (admin configuration surface)

## User Story

As an **Administrator**, I want to configure **which artifacts are mandatory vs optional per entity category**, so that the platform can enforce "you can't approve this without these documents" without each requirement being hard-coded in product code.

## Preconditions

- An "artifact" concept exists — each entity slot accepts an uploaded document or reference (PDF, checklist completion, external URL, etc.).
- Stories 19.1 (approval-first) and 19.3 (waiver) are assumed to exist; this story feeds both.

## Context / Business Rules

- **Configuration, not code.** Requirements are data. An Admin edits them in the UI; they take effect at read time without a deploy.
- **Matrix shape.** Rows = artifact slots (`slotKey`, `displayName`). Columns = entity categories (a product-configured taxonomy). Each cell = `mandatory | optional | not applicable`.
- **Change history.** Every edit to the matrix is versioned and audit-logged — at any past point in time the matrix as-it-then-stood is queryable.
- **Effective-at timestamps.** Matrix changes have an effective-from date. The matrix at time T for a newly-created entity is the one effective at T. Existing entities retain the matrix version that was effective when they were created, unless an Admin explicitly "re-seeds" them.
- **Soft-delete rather than hard-delete.** Removing an artifact slot marks it deprecated; existing entities with that slot retain it read-only.
- **Validation.** Cannot mark a slot `mandatory` for a category without providing a human-readable description of what satisfies it (to avoid unprovable requirements).
- **Export / import.** The matrix is exportable as JSON and importable for cross-env parity.

## Acceptance Criteria

- [ ] AC1: `/admin/artifact-requirements` renders a table with rows = artifact slots, columns = entity categories, and cells = a small 3-option selector (`mandatory` / `optional` / `n/a`).
- [ ] AC2: Adding a new artifact slot prompts for `slotKey`, `displayName`, `description` (required), and an icon choice; persists a new row.
- [ ] AC3: Editing a cell shows an effective-date picker (default = now); saving writes a new `MatrixVersion` snapshot and the cell change record.
- [ ] AC4: A "History" tab on the admin page lists prior `MatrixVersion` snapshots with actor, change summary, and effective-from; admins can view any prior matrix.
- [ ] AC5: An entity's required-artifacts list, at any point in time, reflects the matrix version effective at the entity's creation time (or the most recent re-seed if one occurred).
- [ ] AC6: Existing entities exposing a deprecated slot display it with a "(deprecated slot)" label; the slot is read-only but not removed.
- [ ] AC7: Marking a slot `mandatory` without a description is blocked at form level with an inline validation error.
- [ ] AC8: Export emits a JSON document of the current matrix version + all historical versions; import validates the schema and either applies as a new version or rejects with a diff view.
- [ ] AC9: Admins can explicitly "re-seed" a set of entities (via filter) to adopt the newest matrix version; re-seed is audited and reversible to the prior snapshot.
- [ ] AC10: The matrix is consumed by the entity pages via a single hook: `useRequiredArtifacts(entityType, entityId)` — returns the effective matrix version's applicable artifact slots with `mandatory / optional` flags.
- [ ] AC11: Unit tests cover matrix-version selection, cell edits with effective dates, re-seed operation, deprecation behaviour, and import/export round-trip with ≥ 85% coverage.

## UI Behavior

- Matrix table uses sticky row + column headers; horizontal scroll on narrow screens.
- Cell selector is a compact segmented control with colour-coded states.
- Effective-date picker defaults to "immediately"; admins can choose "effective from future date" to schedule changes.
- History tab renders a timeline of snapshots; clicking one opens a read-only copy of the matrix as-at-that-snapshot.
- Import / Export are in a top-right menu.
- Re-seed uses a confirmation dialog with a preview of affected entities and counts.
- Accessibility: table headers labelled; segmented control is keyboard-navigable.

## Out of Scope

- Per-tenant overrides of the matrix — tenants inherit the product-level matrix.
- Conditional requirements ("artifact X is mandatory only if category is Y AND flag Z") — second-order; deferred.
- Automatic artifact validation beyond presence (e.g., PDF must pass a schema check) — separate story.
- Multiple simultaneous active matrix versions for A/B tests — out of scope.

## Tech Spec Reference

See `Docs/epics/epic-19/tech-spec.md` for: the `ArtifactSlot`, `MatrixVersion`, and `MatrixCell` data models, the `useRequiredArtifacts` hook signature, and the re-seed algorithm.

## Dev Checklist (NOT for QA)

1. Add `ArtifactSlot`, `MatrixVersion`, `MatrixCell` entities + `SlotRequirement` enum (mandatory / optional / not_applicable).
2. Add provider methods: `listArtifactSlots`, `listMatrixVersions`, `createMatrixVersion`, `upsertMatrixCell`, `reseedEntitiesToCurrentMatrix`.
3. Build `useRequiredArtifacts(entityType, entityId)` with an internal resolver that finds the matrix version effective at the entity's creation (or last re-seed).
4. Build the admin UI: table, history tab, import/export menu, re-seed dialog.
5. Integrate with Story 19.1's Approval-section gating (mandatory-without-upload blocks Approve) and Story 19.3 (waiver available on mandatory slots).
6. Audit every write.
7. JSON schema for import; include migrations story in tech spec for future matrix-shape evolution.

## AutoGent Test Prompts

1. **AC1-AC3 — Edit a cell.** "Open `/admin/artifact-requirements`. Change cell (slot=`SecurityReport`, category=`HighRisk`) from Optional to Mandatory, effective immediately. Save. Verify success toast and a new `MatrixVersion` snapshot in History tab."
2. **AC5 — Entity honours effective matrix.** "Create two entities: one before the above change, one after. Open each. Verify the older entity still lists `SecurityReport` as optional; the newer entity lists it as mandatory."
3. **AC7 — Mandatory-without-description blocked.** "Add a new slot without a description; attempt to mark it mandatory in any category. Verify inline validation blocks save."
4. **AC8 — Import round-trip.** "Export the matrix. Clear the matrix in a staging tenant. Import the exported JSON. Verify the matrix and all historical versions are restored identically."
5. **AC9 — Re-seed.** "Select 10 older entities. Re-seed to the current matrix. Verify their required-artifacts list reflects the new matrix. Roll back the re-seed. Verify they revert."
6. **AC6 — Deprecated slot.** "Remove a slot from the matrix (soft-delete). Open an older entity that had that slot. Verify the slot is still listed but marked '(deprecated slot)' and is read-only."

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (≥ 85% coverage)
- [ ] E2E test for edit-cell → entity-reflects-change path
- [ ] Storybook stories for the admin table in all states + re-seed confirmation dialog
- [ ] WCAG 2.1 AA — table keyboard-navigable, segmented control accessible
- [ ] Import schema validator documented
- [ ] Re-seed reversibility verified by integration test
- [ ] TypeScript strict — no `any`
