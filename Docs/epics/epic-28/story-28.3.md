# Story 28.3: Gated Approval State Machine

**Epic:** Epic 28 — Enterprise Compliance Workflow Patterns
**Phase:** PHASE 1: FOUNDATION
**Persona:** Approval Reviewer (reference persona) / Template Consumer (audience)
**Priority:** P0
**Story Points:** 8
**Status:** New

## User Story

As an approval reviewer, I want a standardized four-state approval workflow — pending, approved, conditionally-approved, rejected — that enforces separation of duties, requires reasons for rejection and conditional approval, and writes a tamper-evident audit trail for every state transition, so that approval outcomes are consistent, defensible, and auditor-ready across every workflow in the platform.

## Preconditions

- Story 28.1 shipped — evidence store available
- Story 28.2 shipped — checklist completeness function drives conditional approval eligibility
- RBAC: `canPerform("approval.decide", resource)`, `canPerform("approval.submit", resource)` defined in `src/lib/rbac.ts`
- AC-5 (separation of duties) enforced — reviewer and requester must not be the same principal

## Context / Business Rules

- **Four states:** `pending` (initial and post-resubmit), `approved`, `conditionally-approved`, `rejected`.
- **State transitions:**
  - `pending → approved` — requires checklist `complete`
  - `pending → conditionally-approved` — requires checklist `conditionally-complete` (at least one waived-conditional)
  - `pending → rejected` — requires a `reason` (10-500 chars)
  - `conditionally-approved → approved` — requires all SLA conditions `satisfied` (delivered in Story 28.4)
  - `conditionally-approved → rejected` — requires `reason`
  - `rejected → pending` — on resubmission by requester (evidence changes detected via checklist state)
- **Invalid transitions throw `ApprovalTransitionError`** — never silently absorbed. The transition table is the single source of truth (`approvalTransitionTable` in `approval-state-machine.ts`).
- **Separation of duties (AC-5):** a principal who submitted the subject cannot approve, conditionally-approve, or reject it. `SelfApprovalError` is thrown. SoD check is enforced at the adapter, not the UI.
- **Reasons are mandatory** for `rejected` and `conditionally-approved` transitions — never blank, never auto-generated.
- **Audit everywhere:** every transition writes an AUDIT# record (AU-2/AU-3) with `subjectId`, `priorState`, `newState`, `actorId`, `reason`, `timestamp`, `checklistCompleteness` (snapshot at decision time).
- **Engine is adapter-pluggable.** `IApprovalEngine` interface abstracts persistence; state machine logic is pure.
- **Domain-free.** `Approval<TSubjectId>` has no firmware/device/ims references. `subjectId` is an opaque string chosen by the caller.

## Acceptance Criteria

- [ ] AC1: `ApprovalState` type, `Approval<TSubjectId>`, and `approvalTransitionTable` are defined in `src/lib/compliance/approval/approval-state-machine.ts`. State machine is a pure module with no I/O.
- [ ] AC2: `transition(current, nextState, context): Approval` is a pure function that validates the transition against `approvalTransitionTable`, checks reason presence + length for `rejected` and `conditionally-approved`, and returns the updated approval object.
- [ ] AC3: `transition` throws `ApprovalTransitionError` for any (current → next) not in the table; error message names the invalid pair.
- [ ] AC4: `IApprovalEngine` interface is defined with: `create(subjectId, submittedBy)`, `loadBySubject(subjectId)`, `decide(id, nextState, reviewer, reason?, conditions?)`, `listPending(filter)`.
- [ ] AC5: `createMockApprovalEngine()` and `createDynamoDbApprovalEngine(config)` factories both exist and pass parity tests.
- [ ] AC6: Adapter `decide` method enforces SoD — throws `SelfApprovalError` when `reviewer.userId === approval.submittedBy`; SoD denial writes an AU-2 denial record.
- [ ] AC7: Adapter `decide` method throws `ChecklistIncompleteError` when `nextState === "approved"` but checklist evaluates to `incomplete`; throws same when `nextState === "conditionally-approved"` but no conditional waivers exist.
- [ ] AC8: `useApproval(subjectId)` hook returns `{ approval, decide, resubmit }` — uses TanStack Query `useQuery` for read, `useMutation` for write with optimistic state update and rollback on error.
- [ ] AC9: `<ApprovalGateBadge approval={...}>` component renders a state pill: `pending` (gray clock), `approved` (green check), `conditionally-approved` (amber warning), `rejected` (red block). Hover shows reviewer + decidedAt + reason snippet.
- [ ] AC10: `<ApprovalDecisionPanel subjectId={...}>` component renders (when viewer has `canPerform("approval.decide")`): current state, checklist summary, three action buttons (Approve, Conditional Approve, Reject), reason textarea. Buttons are enabled only for valid transitions per `approvalTransitionTable` and checklist state.
- [ ] AC11: Approve button is disabled + tooltip "Checklist incomplete" when checklist not `complete`. Conditional Approve is disabled + tooltip "No conditional waivers" when no waived-conditional slots exist.
- [ ] AC12: Reject confirmation modal requires reason (10-500 chars) before submit.
- [ ] AC13: Every successful transition writes an AUDIT# record with the schema specified in §Business Rules.
- [ ] AC14: Reference wiring: firmware review page uses `<ApprovalGateBadge>` + `<ApprovalDecisionPanel>` with `subjectId = firmwareVersionId`; legacy approval UI gated behind `FEATURE_COMPLIANCE_LIB=off`.
- [ ] AC15: Exhaustive state machine test: every cell in `approvalTransitionTable` — allowed and rejected — has a test. Unit tests ≥ 85% overall; 100% branch coverage on `transition()`.
- [ ] AC16: ESLint + TypeScript checks enforce: no domain imports in `src/lib/compliance/approval/`, no usage of `any`.

## UI Behavior

- Approval badge: 22px pill, icon + label, consistent across list views and detail pages
- Decision panel: sticky footer on the review page when state is `pending` or `conditionally-approved` for eligible reviewers
- Button layout: Approve (primary green) · Conditional Approve (amber) · Reject (destructive outline)
- Reason textarea: 10-500 chars, character counter, placeholder varies per action ("Why are you rejecting?" / "Why conditional?")
- Reject is double-confirmed via `<ConfirmDialog>` — irreversible transitions deserve a second confirm
- Optimistic updates: badge updates immediately; rolls back on adapter error with a toast
- Loading state: spinner in button; buttons disabled during mutation
- Unauthorized user: decision panel is not rendered; badge still visible

## Out of Scope

- Multi-step / multi-reviewer approval chains (single reviewer for this story)
- Delegated approval / proxy reviewers
- SLA deadline tracking on conditional approvals — delivered in Story 28.4
- Auto-approval by policy engine (rule-based) — deferred
- Revocation of an approved approval — out of scope (rejection after approval requires a new subject version, not a state walk-back)

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) §"State Machine (Story 28.3)", §"Generic Types → Stories 28.3 + 28.4".

## Rulebook Compliance

- **`security-nist-rulebook.md`** — AC-3 (decide gated), AC-5 (SoD enforced at adapter), AU-2/3 (every transition + denial audited), SI-10 (reason length + state names validated)
- **`architecture-rulebook.md`** — pure state machine module, engine adapter pattern, UI imports only hooks
- **`api-data-layer-rulebook.md`** — optimistic mutation with rollback, stable cache key, typed errors
- **`code-quality-rulebook.md`** — no `any`, 100% branch coverage on `transition()`, ≥ 85% elsewhere

## Dev Checklist (NOT for QA)

1. Create `approval-state-machine.ts` with type + table + `transition()` pure function
2. Write exhaustive unit tests for every cell in the transition table (allowed + rejected)
3. Define `IApprovalEngine` interface
4. Implement `createMockApprovalEngine()` — in-memory Map with SoD and checklist checks
5. Implement `createDynamoDbApprovalEngine()` reference adapter
6. Enforce SoD check in `decide` — throws `SelfApprovalError`, writes AU-2 denial
7. Integrate with Story 28.2 checklist to validate completeness at decide time
8. Build `useApproval` hook with optimistic updates + rollback
9. Build `<ApprovalGateBadge>` + `<ApprovalDecisionPanel>` + Storybook stories
10. Reference wiring: firmware review page behind `FEATURE_COMPLIANCE_LIB`
11. Add ESLint no-restricted-imports rule for `src/lib/compliance/approval/`
12. Adapter parity test harness

## AutoGent Test Prompts

1. **AC2-AC3 — Transitions:** "Call `transition(pending, approved, { checklist: { kind: 'complete' } })`. Verify success. Call `transition(approved, pending, ...)`. Verify `ApprovalTransitionError` with message identifying the invalid pair."
2. **AC6 — SoD:** "Alice submits. Alice attempts to approve. Verify `SelfApprovalError`. Verify AU-2 denial record exists."
3. **AC7 — Checklist gate:** "With checklist `incomplete`, attempt `decide(id, 'approved', reviewer)`. Verify `ChecklistIncompleteError`."
4. **AC9-AC10 — Panel:** "As reviewer, open a pending subject with complete checklist. Verify Approve button enabled, Conditional disabled (no conditional waivers), Reject enabled. Click Approve. Verify state pill updates to approved."
5. **AC12 — Reject reason:** "Click Reject. Leave reason blank. Click submit. Verify validation error. Fill 15-char reason. Submit. Verify state becomes rejected; reason is recorded."
6. **AC13 — Audit:** "After a pending→approved transition, verify AUDIT# record has priorState=pending, newState=approved, actor, timestamp, checklistCompleteness='complete'."

## Definition of Done

- [ ] Code reviewed + approved
- [ ] Unit tests ≥ 85% overall, 100% branch coverage on `transition()`
- [ ] All 16 transition-table cells have passing tests (allowed + rejected)
- [ ] Adapter parity tests green
- [ ] Storybook stories: pending, approved, conditionally-approved, rejected badges; decision panel with all button states
- [ ] Decision panel keyboard-navigable, reason textarea announced
- [ ] Reference firmware flow migrated behind flag
- [ ] NIST audit integration test green (decision + SoD denial both logged)
- [ ] TypeScript strict, no `any`
- [ ] ESLint no-restricted-imports rule in place
