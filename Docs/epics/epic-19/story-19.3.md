# Story 19.3: Artifact Waiver — Permanent or Conditional

**Epic:** Epic 19 — Enterprise Template / Reusable Patterns
**Phase:** PHASE 1: Foundational Workflows
**Persona:** Approver (records the waiver) · Reviewer (clears artifact-related gates once the waiver is honoured)
**Priority:** P0
**Story Points:** 5
**Status:** New
**GitHub Issue:** (to be assigned on creation)
**Target URL:** `/{entity-type}/{entity-id}` (Waiver action is available per required artifact on the entity's page)

## User Story

As an **Approver**, I want to record a **waiver** against a required artifact that is temporarily missing — optionally with a commitment to supply it by a future date — so that the workflow can proceed without dropping the compliance expectation.

## Preconditions

- Story 19.1 ships (Approval-first entity view).
- The entity has a list of required artifacts (Story 19.8 — Per-category artifact requirement matrix — defines this). For this story, the required-artifacts list is assumed to exist.
- The Approver has permission to waive artifacts.

## Context / Business Rules

- **Two waiver types:**
  - **Permanent** — "this artifact is not applicable to this entity; never expected."
  - **Conditional** — "this artifact is temporarily waived but expected by `due_date`; the commitment must be honoured."
- **Conditional waivers carry a due date and an expected artifact description** — both are mandatory when recording the waiver.
- **A waiver has a reason.** Both permanent and conditional waivers require a free-text reason.
- **Conditional waiver auto-resolves on artifact upload.** When a matching artifact is subsequently uploaded against the waived slot, the waiver is marked `resolved` and the approver is notified.
- **A conditional waiver can expire.** If `due_date` passes and no artifact is uploaded, the waiver transitions to `overdue` and alerting (Story 19.4) takes over.
- **Waivers are audit-grade.** Every waiver and state change emits an audit event with waiver ID, actor, artifact slot, waiver type, due date, reason, and timestamp.
- **Waivers can be revoked.** Only by an Approver with elevated permission; revocation emits its own audit event.

## Acceptance Criteria

- [ ] AC1: The entity page's required-artifacts list exposes a **Waive** action next to each artifact slot that has no uploaded artifact.
- [ ] AC2: Clicking Waive opens a dialog with fields: **Waiver type** (Permanent / Conditional), **Reason** (free text, min 20 chars), and — when Conditional — **Due date** (future date, required) and **Expected artifact description** (free text, required).
- [ ] AC3: Submitting the dialog writes a `Waiver` record linked to the entity + artifact slot and emits an audit event.
- [ ] AC4: The artifact slot then displays a waiver pill — "Waived permanently" or "Waived until {due_date}" — with the reason available on hover.
- [ ] AC5: A waiver pill includes a **Revoke** action (admin permission required) that returns the slot to "missing" state and emits an audit event.
- [ ] AC6: When an artifact is uploaded to a conditionally-waived slot before `due_date`, the waiver transitions to `resolved`, the pill updates to "Artifact provided (was waived)", and the approver of the waiver is notified.
- [ ] AC7: When `due_date` passes with no artifact uploaded, the waiver transitions to `overdue` and the slot displays "Waiver overdue — artifact missing" with error styling.
- [ ] AC8: The Approval section (Story 19.1) treats a slot with a `resolved` or `active-conditional-not-past-due` or `permanent` waiver as _satisfied_ — the slot does not block Approve. An `overdue` waiver **does** block Approve until resolved or revoked.
- [ ] AC9: Waivers for an entity are listed on a dedicated **Waivers** subsection of the entity page, sortable by due date, filterable by status (active / resolved / overdue / revoked).
- [ ] AC10: Unit tests cover the waiver state machine (create → active → resolved | overdue | revoked) and the Approve-button gating with ≥ 85% coverage.

## UI Behavior

- Waive dialog uses the template's `<Dialog>` primitive; required-field validation is inline.
- Waiver type is a radio group (Permanent / Conditional); conditional fields appear only when Conditional is selected.
- Due-date field is a date picker; past dates are disabled.
- Waiver pill uses warn colour for active-conditional, success for resolved, error for overdue, neutral for permanent.
- Reason is truncated with an info popover on hover for long text.
- Mobile: dialog uses a full-screen sheet; date picker is native.
- Revoke action is a destructive-style button with a confirmation dialog.

## Out of Scope

- SLA **alerting** as the due date approaches — that's Story 19.4 (Deadline-watch alerting).
- Bulk-waiving across many entities at once — captured in Story 19.10 (Bulk decision via manifest).
- Product-specific artifact types (FAT reports, compliance certificates, etc.) — this story is artifact-type-agnostic.
- Waiver approval workflows (e.g., "a waiver itself needs two reviewers") — deferred; single-approver waivers are baseline.

## Tech Spec Reference

See `Docs/epics/epic-19/tech-spec.md` for: the `Waiver` data model, the state-machine, the `resolveOnArtifactUpload(artifactId)` hook integration, and the `<WaiveDialog />` and `<WaiverPill />` component contracts.

## Dev Checklist (NOT for QA)

1. Add `Waiver` entity + `WaiverType` + `WaiverStatus` enums to template types.
2. Add `createWaiver`, `revokeWaiver`, `listWaiversByEntity` to the provider interface.
3. Hook artifact-upload flow — on successful upload, if a conditional waiver exists for the slot, transition it to `resolved` and fire a notification event.
4. Scheduled job or read-time check flips active-conditional waivers to `overdue` when `due_date < now()`.
5. Extend Approval-section gating to include "overdue waivers block Approve".
6. Build `<WaiveDialog />`, `<WaiverPill />`, `<WaiversSubsection />` components under the template.
7. Audit every waiver write (create / revoke / resolve / overdue transition).

## AutoGent Test Prompts

1. **AC1-AC4 — Create a conditional waiver.** "On a fixture entity with a missing required artifact, click Waive. Fill: Conditional, due date 14 days from today, reason `Document pending HQ confirmation`, expected `SOC 2 Type II report`. Submit. Verify the artifact slot shows 'Waived until {date}'."
2. **AC6 — Waiver resolves on upload.** "Upload a matching artifact to the waived slot. Verify the waiver pill becomes 'Artifact provided (was waived)'. Verify an audit event was emitted with the transition."
3. **AC7 + AC8 — Overdue waiver blocks Approve.** "Create a conditional waiver with due date yesterday (simulated clock). Reload. Verify the slot shows 'Waiver overdue'. Verify Approve button is disabled with the expected tooltip."
4. **AC5 — Revoke.** "As an admin, click Revoke on an active waiver. Confirm. Verify the slot returns to 'missing' and an audit event is emitted."
5. **AC9 — Waivers subsection.** "Open Waivers subsection. Verify four rows visible (active, resolved, overdue, revoked). Sort by due date. Filter by status = overdue; verify only the overdue waiver remains."

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (≥ 85% coverage)
- [ ] E2E test for waive, auto-resolve-on-upload, overdue transition, revoke
- [ ] Storybook stories for WaiveDialog (create + edit states) and WaiverPill (all 4 states)
- [ ] WCAG 2.1 AA — date picker accessible, dialog traps focus, Revoke confirmation is keyboard-navigable
- [ ] TypeScript strict — no `any`
- [ ] Audit events emitted on every write (verified)
