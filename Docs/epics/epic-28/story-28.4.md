# Story 28.4: Conditional Approval with SLA Tracking

**Epic:** Epic 28 — Enterprise Compliance Workflow Patterns
**Phase:** PHASE 2: EXCEPTION MANAGEMENT
**Persona:** Approval Reviewer (reference persona) / Template Consumer (audience)
**Priority:** P1
**Story Points:** 5
**Status:** New

## User Story

As an approval reviewer, I want to attach time-bound conditions to a conditional approval — each with a reason, a due date, and automated alerts as the deadline approaches or is missed — so that a "conditional approval" cannot quietly become a permanent deferral and the security-exception lifecycle is transparent to auditors.

## Preconditions

- Story 28.3 shipped — approval state machine supports `conditionally-approved` state
- Story 28.2 shipped — checklist `waived-conditional` slot state exists
- Story 22.3 shipped or compatible — global notification/toast pipeline is available

## Context / Business Rules

- **An approval in `conditionally-approved` state carries 1..N `SlaCondition` records.** Each condition: `id`, `description`, `dueAt`, `status` (`pending` | `satisfied` | `breached`).
- **Condition sources:**
  - Automatically created for each `waived-conditional` slot at the moment of conditional approval — one condition per waived slot, copying its `reason` and `dueAt`
  - Optionally, reviewers can attach ad-hoc conditions at conditional-approval time (e.g., "resubmit scan within 30 days")
- **Satisfaction:** a condition moves to `satisfied` when the related waived-conditional slot transitions to `present` (evidence attached) OR when the reviewer explicitly marks the condition satisfied with `markConditionSatisfied(conditionId, reason, actor)`.
- **Breach:** any `pending` condition whose `dueAt < now` is `breached`. Breach computation runs on:
  1. `useSlaWatch()` in-app interval (60s, visibility-aware backoff per Story 22.8)
  2. Adapter-level query (server side) whenever a subject is read
- **Alerts** fire at three milestones per condition: `T-7d` (warn), `T-1d` (urgent), `T+0` (breached). Each alert is emitted once; duplicate suppression uses `{conditionId, milestone}` as the key.
- **Breach audit:** on transition to `breached`, an AUDIT# record is written immediately with `conditionId`, `subjectId`, `dueAt`, `observedAt`.
- **Transition to `approved`:** requires ALL conditions to be `satisfied`. Enforced by Story 28.3 `decide` adapter.
- **Domain-free.** `SlaCondition` has no firmware/device references. `description` is opaque caller-supplied text.

## Acceptance Criteria

- [ ] AC1: `SlaCondition` type is defined in `src/lib/compliance/approval/sla-tracker.ts` with fields: `id`, `subjectId`, `description`, `dueAt`, `status`, `createdBy`, `createdAt`, `satisfiedAt?`, `satisfiedBy?`.
- [ ] AC2: `evaluateSlaStatus(condition, now): SlaCondition["status"]` is a pure function computing `pending` / `satisfied` / `breached` given current time.
- [ ] AC3: `computeAlertMilestones(condition, now): AlertMilestone[]` returns which milestones (`T-7d`, `T-1d`, `T+0`) are active and not yet emitted. Pure function.
- [ ] AC4: On conditional-approval decision (Story 28.3), `IApprovalEngine.decide(...)` auto-creates one `SlaCondition` per `waived-conditional` slot plus any reviewer-supplied ad-hoc conditions.
- [ ] AC5: `markConditionSatisfied(conditionId, reason, actor)` on the approval engine adapter moves the condition to `satisfied`; throws `ApprovalTransitionError` if condition already `breached` and story policy requires explicit re-approval (configurable — see AC6).
- [ ] AC6: Engine config `allowSatisfyAfterBreach` (default `true`) governs whether a breached condition can still be marked satisfied; when `false`, requires a rejection + resubmission cycle.
- [ ] AC7: Attaching evidence to a slot that has a linked `SlaCondition` auto-calls `markConditionSatisfied` — the checklist flow closes the loop without reviewer re-intervention.
- [ ] AC8: `useSlaWatch()` hook runs a 60-second interval (visibility-aware backoff), refetches conditions for subjects the user has open, emits alerts via the notification system (Story 22.3), and suppresses duplicates by `{conditionId, milestone}`.
- [ ] AC9: `<SlaCountdown condition={...}>` component renders a pill with time-remaining: `> 7d` (gray), `≤ 7d` (amber), `≤ 24h` (red), `breached` (red-solid with warning icon). Text updates once per minute.
- [ ] AC10: `<ConditionsPanel subjectId={...}>` component lists all conditions with description, due date, countdown pill, and (for reviewers) a Mark Satisfied button + an Unsatisfy action for undoing mistaken marks. Mark Satisfied opens a dialog requiring a reason (10-500 chars).
- [ ] AC11: Breach transitions write an AUDIT# record synchronously at the moment breach is detected (by either the interval hook or an adapter read); duplicate breach-audit records are prevented by adapter-level idempotency.
- [ ] AC12: `<ApprovalGateBadge>` (from Story 28.3) is extended: for `conditionally-approved` subjects, badge shows a secondary indicator — "1 breach" / "3 pending" / "2 satisfied" — to surface condition health at a glance.
- [ ] AC13: Reference wiring: firmware review page shows `<ConditionsPanel>` beneath the approval panel for `conditionally-approved` firmware versions; extends Story 28.3 wiring.
- [ ] AC14: Unit tests ≥ 85% across `sla-tracker.ts`; 100% branch coverage on `evaluateSlaStatus` and `computeAlertMilestones`.
- [ ] AC15: Time-mocked tests cover: `T-8d` (no alert), `T-7d boundary`, `T-2d` (warn already emitted), `T-1d` (urgent), `T+0` (breach + audit), `T+1d` (already breached — no duplicate audit).

## UI Behavior

- Countdown pill updates once per minute — not per second (battery + accessibility)
- Countdown uses relative format: "6d 4h", "23h", "12m", "overdue 2d"
- Mark Satisfied action is a destructive-looking confirmation: "Mark condition as satisfied? This action is audit-logged."
- Alerts appear as system notifications (top-right toast) with severity color matching the milestone
- Breach alerts persist in the notification tray until acknowledged
- A condition linked to a checklist slot shows "Linked to [slot label]" — clicking navigates to the slot in the checklist panel
- `<ConditionsPanel>` empty state: "No conditions attached" (for `approved` subjects that never had conditions)

## Out of Scope

- External escalation (PagerDuty, Slack, email) — in-app notifications only; external hooks are an integration contract
- Bulk-satisfy across subjects
- Condition priority / weighting
- Grace-period extension UI (renegotiating a due date) — if a date must change, reject + new conditional approval is the flow
- Dashboard of all conditions across all subjects — deferred to a future analytics story

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) §"State Machine (Story 28.3)", §"SLA Tracker (Story 28.4)", §"Generic Types → Stories 28.3 + 28.4".

## Rulebook Compliance

- **`security-nist-rulebook.md`** — AC-3 (mark satisfied gated), AU-2/3 (every state change + breach audited), SI-10 (reason + due-date range validated, max 365d in future)
- **`architecture-rulebook.md`** — pure evaluators separated from I/O; adapter handles persistence + idempotency
- **`api-data-layer-rulebook.md`** — visibility-aware backoff (Story 22.8 pattern), stable query keys
- **`performance-rulebook.md`** — 60-second interval with backoff; countdown re-render once per minute; no unnecessary re-renders of unrelated subjects
- **`code-quality-rulebook.md`** — 100% branch coverage on pure evaluators, ≥ 85% elsewhere

## Dev Checklist (NOT for QA)

1. Add `SlaCondition` type + `evaluateSlaStatus` + `computeAlertMilestones` as pure functions in `sla-tracker.ts`
2. Time-mocked tests for status + milestone computation
3. Extend `IApprovalEngine` adapters with `createCondition`, `markConditionSatisfied`, breach-idempotency handling
4. Integrate auto-creation of conditions on conditional-approval decision (edit Story 28.3 engine impl)
5. Integrate auto-satisfy on checklist `attachSlot` when linked condition exists (edit Story 28.2 engine impl)
6. Implement `useSlaWatch` with 60s interval + visibility backoff + duplicate suppression
7. Build `<SlaCountdown>` + `<ConditionsPanel>` + extend `<ApprovalGateBadge>` with secondary indicator
8. Storybook stories for countdown pill at all four severity levels + conditions panel
9. Reference wiring on firmware review page behind `FEATURE_COMPLIANCE_LIB`
10. Breach-audit idempotency test — simulating double-fire

## AutoGent Test Prompts

1. **AC2-AC3 — Evaluators:** "Create a condition with `dueAt = now + 6 days`. Call `evaluateSlaStatus` — verify `pending`. Call `computeAlertMilestones` — verify `['T-7d']`. Advance clock by 5.5 days; verify `['T-1d']`."
2. **AC4 — Auto-create:** "Checklist has 2 waived-conditional slots. Reviewer marks subject conditionally-approved. Verify 2 `SlaCondition` records exist with matching descriptions and due dates."
3. **AC7 — Auto-satisfy:** "A condition is linked to slot 'sbom'. Requester uploads evidence to 'sbom'. Verify condition status becomes `satisfied` without reviewer action."
4. **AC9 — Countdown colors:** "Render `<SlaCountdown>` with dueAt = +10d. Verify gray. With +3d — amber. With +12h — red. With -1d — red-solid with warning."
5. **AC11 — Breach audit:** "Set dueAt to -1d. Read subject. Verify a single breach AUDIT# record exists. Read subject again. Verify no duplicate."
6. **AC12 — Badge indicator:** "Subject with 3 pending, 1 breach. Render `<ApprovalGateBadge>`. Verify secondary indicator shows 'breach: 1'."

## Definition of Done

- [ ] Code reviewed + approved
- [ ] Unit tests ≥ 85% overall, 100% on pure evaluators
- [ ] Time-mocked tests cover all four milestones + breach idempotency
- [ ] Storybook stories for countdown + panel + extended badge
- [ ] Reference firmware flow shows conditions panel behind flag
- [ ] Visibility-aware backoff verified (hook pauses when tab is hidden)
- [ ] TypeScript strict, no `any`
- [ ] NIST audit integration test — breach + mark-satisfied both logged
- [ ] Performance: < 1% CPU usage with 50 open subjects (measured locally)
