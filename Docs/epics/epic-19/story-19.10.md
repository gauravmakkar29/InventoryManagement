# Story 19.10: Bulk Decision via Manifest

**Epic:** Epic 19 — Enterprise Template / Reusable Patterns
**Phase:** PHASE 1: Foundational Workflows
**Persona:** Approver · Operator (manages consignments / batches of items that require the same decision)
**Priority:** P1
**Story Points:** 8
**Status:** New
**GitHub Issue:** (to be assigned on creation)
**Target URL:** `/{entity-type}/{entity-id}` (Approval section supports manifest-grouped views) and a dedicated `/manifests/{manifestId}` surface.

## User Story

As an **Approver**, I want to apply a **single decision (approve / reject / waive)** across a **named manifest** — a batch of items grouped together for the purpose of a shared decision — so that I don't have to make the same decision thousands of times when a real-world shipment or batch arrives.

## Preconditions

- Story 19.1 (Approval-first entity view) has shipped.
- The product introduces a first-class `Manifest` concept: a named grouping of items, created at the moment a batch arrives (shipment, release, ingest, import, etc.).
- The manifest is linked to an entity (the thing being approved) and carries a list of item IDs.

## Context / Business Rules

- **Manifest is authoritative.** The list of items in the manifest is the unit of the decision. New items added to the entity after the manifest is created are **not** automatically included in the bulk decision — they need their own membership.
- **One write for many effects.** The Approver's action writes the decision against the manifest (and the linked entity as the subject of the decision). Items are resolved from the manifest at query time; no per-item writes.
- **Exceptions are first-class.** The Approver can mark specific items inside the manifest as _excluded_ from the bulk decision; those items retain their prior state and require their own later handling.
- **Preview before commit.** The Approver sees a preview panel: counts by state, items excluded, items that will change, and whether any prerequisite (review gate / artifact / waiver) is blocking.
- **Partial-apply on prerequisites.** If a prerequisite is only satisfied for some items in the manifest, the Approver sees exactly which items will change and which will be skipped; the decision commits only for eligible items.
- **Idempotent.** Re-submitting the same decision against the same manifest has no effect beyond logging a retry.
- **Rollback window.** For `N` minutes (default 10) after commit, the Approver can roll back the bulk decision; audit records the rollback.
- **Manifests are immutable on commit.** After the bulk decision commits, the item list in the manifest is frozen; new items go into a separate manifest.

## Acceptance Criteria

- [ ] AC1: A `Manifest` entity exists with: `id`, `name`, `linkedEntityId`, `createdBy`, `createdAt`, `itemIds[]`, `state` (draft / committed / rolled-back), `exclusions[]`.
- [ ] AC2: The linked entity page's Approval section exposes a **Bulk decision by manifest** panel listing every attached manifest with counts.
- [ ] AC3: Selecting a manifest opens a preview panel showing: item counts by current state, exclusions toggle per item (or bulk select), prerequisite readiness (review gates, artifacts, waivers), and the estimated effect of the decision.
- [ ] AC4: An **Exclude** action on any manifest row marks the item excluded for this decision; excluded items are shown but will not transition.
- [ ] AC5: Clicking **Commit bulk decision** opens a confirmation dialog summarizing: manifest name, decision (approve / reject / waive), items affected, items excluded, items skipped due to prerequisites.
- [ ] AC6: Confirming writes a single `BulkDecision` record linked to manifest + entity + approver; no per-item writes emitted.
- [ ] AC7: Items inside the manifest resolve to the new state at next read, subject to exclusions and prerequisite filters.
- [ ] AC8: Within `rollback_window_minutes` (default 10) a **Rollback** button is visible in the Approval section; clicking it reverses the decision, and the audit log records the rollback with actor and reason.
- [ ] AC9: After the rollback window closes or after the rollback is taken, the manifest is read-only; further decisions require a new manifest.
- [ ] AC10: Idempotency: re-submitting the same bulk decision against a `committed` manifest is a no-op and returns a friendly "already committed" response; audit records the retry.
- [ ] AC11: Unit tests cover manifest membership resolution, exclusions, prerequisite filtering, commit, rollback window, idempotency, and freeze-on-commit with ≥ 85% coverage.

## UI Behavior

- Manifest panel is collapsible; default collapsed when there are no manifests.
- Manifest rows inside the preview use dense compact layout — each row shows item id, current state, "will change to" badge, exclusion toggle.
- The summary strip at the top of the preview shows counts by state transition.
- Confirmation dialog uses an explicit manifest-name input ("type `{manifest name}` to confirm") for decisions affecting more than `N` items (default 500).
- Rollback button is persistent on the Approval section until the window expires; a countdown is shown.
- Accessibility: preview rows are keyboard-navigable; exclusion toggle is a checkbox with clear label; confirmation dialog traps focus.

## Out of Scope

- Manifest authoring UI — manifests are created by ingest / import flows, not built by hand in the UI (add later).
- Cross-manifest bulk (apply one decision across multiple manifests at once) — deferred.
- Resuming a partially-committed decision (the commit is atomic per manifest) — deferred.
- Per-item approval history view — a separate audit query, not built into this story.

## Tech Spec Reference

See `Docs/epics/epic-19/tech-spec.md` for: `Manifest` + `BulkDecision` data models, the prerequisite-filter algorithm, the rollback implementation (counter-decision vs undo), and the `<BulkManifestPanel />` component contract.

## Dev Checklist (NOT for QA)

1. Add `Manifest`, `BulkDecision` entities + state enums.
2. Add provider methods: `listManifestsForEntity`, `previewBulkDecision`, `commitBulkDecision`, `rollbackBulkDecision`.
3. Resolve item states from `BulkDecision` records at read time (no per-item writes).
4. Build `<BulkManifestPanel />`, `<ManifestPreviewTable />`, `<BulkConfirmDialog />`, `<RollbackStrip />` components.
5. Wire prerequisite filtering by re-using the gate + artifact logic from Stories 19.1 / 19.2 / 19.3 / 19.8.
6. Schedule the "rollback window closed → freeze" transition.
7. Audit every commit, exclusion change, rollback, and retry.

## AutoGent Test Prompts

1. **AC2-AC5 — Preview + Commit.** "Open a fixture entity with a manifest of 100 items, all in `pending` state, all prerequisites met. Select the manifest. Verify preview shows 100 items, 0 exclusions, 0 skipped. Exclude 5 items. Commit as approve. Verify confirmation dialog summary matches (100 selected, 5 excluded, 95 to change)."
2. **AC6-AC7 — One write, many effects.** "After commit, intercept network writes. Verify exactly one `BulkDecision` write was made. Read 3 items inside the manifest (excluding the excluded set). Verify they resolve to approved."
3. **AC8-AC9 — Rollback inside window, frozen after.** "Within 5 minutes of commit, click Rollback. Verify affected items revert to their prior state and audit records the rollback. Advance clock beyond the rollback window. Verify the Rollback button is gone and the manifest is read-only."
4. **AC10 — Idempotency.** "Submit the same commit twice. Verify the second submission returns `already committed` with no additional `BulkDecision` record created."
5. **AC3 — Prerequisite partial apply.** "Seed manifest where 20 items have an unmet prerequisite. Preview. Verify those 20 show 'will be skipped'. Commit. Verify those 20 remain in prior state, other 80 transitioned."
6. **AC5 — Big-batch confirmation gate.** "On a manifest with >500 items, attempt Commit. Verify the confirmation dialog requires typing the manifest name to proceed."

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (≥ 85% coverage) including exclusions, partial-apply, rollback, idempotency
- [ ] E2E test for full preview → commit → rollback flow
- [ ] Storybook stories for BulkManifestPanel (empty, one manifest, many manifests) and ManifestPreviewTable
- [ ] WCAG 2.1 AA — preview table keyboard-navigable; confirmation dialog traps focus; countdown announces remaining time
- [ ] Atomicity verified (no partial commits leak on error)
- [ ] Audit on every write, exclusion change, rollback
- [ ] TypeScript strict — no `any`
