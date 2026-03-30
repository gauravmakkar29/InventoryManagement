# Story 4.3: Multi-Stage Firmware Approval with Separation of Duties

**Epic:** Epic 4 — Deployment & Firmware Lifecycle
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 8

## User Story

As a platform admin, I want to advance firmware through approval stages (Uploaded -> Testing -> Approved) with separation of duties enforcement, so that no single person can upload, test, and approve the same firmware package.

## Acceptance Criteria

- [x] AC1: When a firmware package is in "Uploaded" stage, I see an "Advance to Testing" button on its card (visible to Admin and Manager roles only)
- [x] AC2: When I click "Advance to Testing" and I am NOT the person who uploaded the firmware, the stage advances to "Testing" and the card updates to show my name and timestamp on the Testing step
- [x] AC3: When I click "Advance to Testing" and I AM the person who uploaded it, I see an error message "You cannot test firmware you uploaded (Separation of Duties)"
- [x] AC4: When a firmware is in "Testing" stage, I see an "Approve" button (visible to Admin role only)
- [x] AC5: When I click "Approve" and I am NOT the person who performed the Testing step, the stage advances to "Approved" with my name and timestamp recorded
- [x] AC6: When I click "Approve" and I AM the person who performed Testing, I see an error message "You cannot approve firmware you tested (Separation of Duties)"
- [x] AC7: When a firmware is already "Approved", no advancement buttons are shown; only a "Deprecate" action is available
- [x] AC8: The Approval Stage Indicator visually updates immediately (optimistic UI) and rolls back if the API rejects the action

## UI Behavior

- Action buttons appear at the bottom of each firmware card, contextual to the current stage
- SoD error messages appear as inline alerts on the card (not just toasts) so the reason is clearly visible
- Confirmation dialog before advancing: "Advance [name] v[version] to [stage]? This action is audited."
- Deprecate action has a separate confirmation: "Deprecate [name] v[version]? Deprecated firmware cannot be deployed."
- All stage transitions trigger notifications to relevant users (automatic via backend)

## Out of Scope

- Rolling back a stage (once advanced, cannot revert)
- Custom approval workflows with more than 3 stages
- Batch approval of multiple firmware packages

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for SoD enforcement rules, `advanceFirmwareStage` and `approveFirmware` mutations, and resolver conditional checks.

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
- [x] Implementation complete (advanceStage with SoD check, confirmation dialog, contextual buttons per stage, audit trail)
