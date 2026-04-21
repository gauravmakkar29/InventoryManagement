# Story 28.2: Document Completeness Engine — Checklist Primitive

**Epic:** Epic 28 — Enterprise Compliance Workflow Patterns
**Phase:** PHASE 1: FOUNDATION
**Persona:** Approval Reviewer (reference persona) / Template Consumer (audience)
**Priority:** P0
**Story Points:** 5
**Status:** New

## User Story

As an approval reviewer, I want to see at a glance which required documents are present, missing, or waived for any submission under review, so that I can make an approval decision with full evidence of what is and is not accounted for — without having to audit N filesystems or tabs to figure out the state.

## Preconditions

- Story 28.1 shipped — evidence store interface is available (`IEvidenceStore`, `EvidenceMetadata`)
- RBAC `canPerform("checklist.waive", resource)` is defined in `src/lib/rbac.ts` (waivers are reviewer-only; see business rules)
- Story 28.4 (SLA tracker) design reviewed — this story introduces `waived-conditional` slot state that 28.4 then tracks deadlines for

## Context / Business Rules

- **Schema-driven.** A checklist is defined by a `ChecklistSchema<TKey>` — an array of `ChecklistSlot` entries with `key`, `label`, `required`, `description`. Consumers define their own schema; the primitive does not know what a "SBOM" or "FAT report" is.
- **Four slot states:** `present` (evidenceId populated), `missing`, `waived-permanent`, `waived-conditional` (requires reason + due date).
- **Waiver authority is reviewer-only.** The requester (submitter) can ATTACH evidence to slots but cannot WAIVE them. Waiving requires `canPerform("checklist.waive", subject)`. The primitive MUST enforce this server-side, not just in the UI.
- **Completeness is a pure function.** `evaluateCompleteness(schema, state): Completeness` has no side effects, no I/O, and is fully unit-testable. Callers treat it as a derived value.
- **Three completeness outcomes:**
  - `complete` — every required slot is `present` or `waived-permanent`
  - `conditionally-complete` — every required slot is `present`, `waived-permanent`, or `waived-conditional` AND at least one `waived-conditional` exists
  - `incomplete` — at least one required slot is `missing`
- **Domain-free.** `ChecklistSlot` takes a generic `TKey extends string` — consumers can constrain keys. No slot key is hardcoded in the primitive.
- **Immutable transitions.** Every state change writes an AUDIT# record with prior state + new state + actor + reason.

## Acceptance Criteria

- [ ] AC1: `ChecklistSchema<TKey>`, `ChecklistSlot<TKey>`, `SlotState`, `ChecklistState<TKey>`, and `Completeness` types are defined in `src/lib/compliance/checklist/checklist-schema.ts` with all properties `readonly`.
- [ ] AC2: `evaluateCompleteness<TKey>(schema, state): Completeness` is a pure function — no dependencies on I/O, clock, or globals.
- [ ] AC3: `useChecklist(schemaId, subjectId)` hook returns `{ schema, state, completeness, attachSlot, waivePermanent, waiveConditional, unwaive }` — reads and writes via adapter interface `IChecklistStore`.
- [ ] AC4: `IChecklistStore` interface is defined with: `loadSchema(schemaId)`, `loadState(schemaId, subjectId)`, `attachSlot(key, evidenceId, actor)`, `waivePermanent(key, reason, actor)`, `waiveConditional(key, reason, dueAt, actor)`, `unwaive(key, actor)`.
- [ ] AC5: `createMockChecklistStore()` and a reference persistence adapter (`createDynamoDbChecklistStore(config)`) both exist and pass adapter parity tests.
- [ ] AC6: `waivePermanent` and `waiveConditional` adapter calls verify `canPerform("checklist.waive", subject)` on the server path; unauthorized calls throw `AccessDeniedError` and write an AU-2 denial record.
- [ ] AC7: `<ChecklistPanel schemaId={...} subjectId={...}>` component renders slots in schema order with per-slot state badge: `present` (green check), `missing` (red alert), `waived-permanent` (gray banner), `waived-conditional` (amber banner with countdown to `dueAt`).
- [ ] AC8: For `missing` slots the viewer shows an **Attach Evidence** button (visible if `canPerform("checklist.attach", subject)`); clicking opens a file picker → uploads via `IEvidenceStore.put()` → calls `attachSlot(key, evidenceId)`.
- [ ] AC9: For `missing` or `waived-conditional` slots the viewer shows a **Waive** button (visible ONLY if `canPerform("checklist.waive", subject)`); clicking opens `<WaiverDialog>` with mode selector (Permanent / Conditional), reason textarea (required), and due-date picker (required for Conditional).
- [ ] AC10: For `waived-*` slots with waive authority, an **Unwaive** action is available and restores the slot to `missing`.
- [ ] AC11: A compact `<ChecklistSummary>` component renders a one-line state: "8/10 complete · 1 conditional · 1 missing" with a link to the full panel.
- [ ] AC12: `evaluateCompleteness` handles: all required present → `complete`; any required missing → `incomplete`; any conditional waiver on required slot → `conditionally-complete`; optional slots do not affect completeness.
- [ ] AC13: Audit logging: every `attachSlot`, `waivePermanent`, `waiveConditional`, `unwaive` writes an AUDIT# record with subjectId, slotKey, prior state, new state, actor, reason.
- [ ] AC14: Reference wiring: firmware intake form uses `<ChecklistPanel>` with a `firmwareIntakeChecklistSchema` defined in `src/lib/firmware/firmware-checklist-schema.ts` (the firmware-specific schema lives in the firmware feature folder; the primitive is firmware-agnostic).
- [ ] AC15: Unit tests cover `evaluateCompleteness` with exhaustive state matrix (all slot-state combinations × required/optional) at 100% branch coverage; ≥ 85% coverage across the rest of the primitive.

## UI Behavior

- Checklist panel is a vertical list; each row is 56px tall; slot label on left, state badge + timestamp + actor on right, actions rightmost
- State badges: green (present), red (missing), gray (waived-permanent), amber-with-countdown (waived-conditional)
- Countdown format: "12d left" / "2d left" / "overdue 3d" — updates once per minute
- Waiver dialog uses the existing `<Dialog>` primitive; fields: mode toggle, reason (textarea, 10-500 chars), due date (Conditional only, date picker, min today, max today+365d)
- Unauthorized waive attempts in the UI: buttons are hidden (not disabled); server-side enforcement is the ground truth
- Summary badge updates optimistically on attach/waive; rollback on error with toast

## Out of Scope

- Dynamic schema editing UI — schemas are code-defined
- Per-slot validation rules (e.g., "only PDF mime types") — delegated to evidence adapter policies
- Schema versioning and migration — `schemaId` is opaque; revising a schema is handled at the consumer level
- Multi-actor sign-off per slot (only one attach/waive event per slot state) — a downstream extension
- SLA breach handling — delivered in Story 28.4

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) §"File Layout → checklist/", §"Generic Types → Story 28.2".

## Rulebook Compliance

- **`security-nist-rulebook.md`** — AC-3 (waive gated by `canPerform`), AC-5 (waiver author ≠ requester enforced), AU-2/3 (every transition audited), SI-10 (reason length, due-date range validated)
- **`architecture-rulebook.md`** — pure function for evaluator, UI composition via primitive components
- **`api-data-layer-rulebook.md`** — hook uses `useQuery`+`useMutation`; mutation uses optimistic update with rollback
- **`code-quality-rulebook.md`** — ≥ 85% coverage, 100% on evaluator, file-size limits enforced

## Dev Checklist (NOT for QA)

1. Add types in `checklist-schema.ts`
2. Implement `evaluateCompleteness` as a pure function in `completeness-engine.ts` with exhaustive tests
3. Define `IChecklistStore` interface
4. Implement `createMockChecklistStore()` and `createDynamoDbChecklistStore()` with parity tests
5. Server-side `canPerform("checklist.waive")` check in every waive adapter method
6. Implement `useChecklist` hook
7. Build `<ChecklistPanel>`, `<ChecklistSummary>`, `<WaiverDialog>` components
8. Storybook stories covering every slot state + waiver dialog flows
9. Reference wiring: define `firmwareIntakeChecklistSchema` and replace legacy checklist UI
10. ESLint check: `src/lib/compliance/checklist/**` imports nothing from `src/lib/firmware/**`
11. Audit-log integration test

## AutoGent Test Prompts

1. **AC2 — Pure evaluator:** "Given a schema with 3 required + 1 optional slot and a state where all required are present, verify `evaluateCompleteness` returns `complete`. Swap one required to `waived-conditional`; verify `conditionally-complete`. Swap one to `missing`; verify `incomplete`."
2. **AC6 — Waive authority:** "As user with only `checklist.attach` permission, attempt to call `waivePermanent()`. Verify `AccessDeniedError`. Verify audit log has a denial record."
3. **AC7-AC8 — Panel rendering:** "Render `<ChecklistPanel>` with a schema of 5 slots in mixed states. Verify 1 green, 1 red, 1 gray, 1 amber badge. Verify Attach button visible on missing. Verify Waive button visible only as reviewer."
4. **AC9 — Waiver dialog:** "As reviewer, click Waive on a missing slot. Verify dialog opens. Select Conditional. Verify due-date picker appears. Leave reason blank; click Submit. Verify validation error. Fill reason + due date; submit. Verify slot moves to waived-conditional."
5. **AC11 — Summary:** "With 8/10 present, 1 conditional, 1 missing, render `<ChecklistSummary>`. Verify text matches '8/10 complete · 1 conditional · 1 missing'."
6. **AC13 — Audit:** "After attach, waivePermanent, unwaive operations, verify 3 AUDIT# records exist with correct prior/new state fields."

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests ≥ 85% overall; 100% branch coverage on `evaluateCompleteness`
- [ ] Adapter parity tests green
- [ ] Storybook stories published for all three UI primitives
- [ ] Waiver dialog keyboard-navigable + announced by screen reader
- [ ] TypeScript strict, no `any`
- [ ] ESLint no-restricted-imports rule enforced
- [ ] NIST audit-log integration test green
- [ ] Reference firmware flow migrated behind `FEATURE_COMPLIANCE_LIB`
