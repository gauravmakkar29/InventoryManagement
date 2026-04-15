# Story 27.4: Firmware Approval Comments & Rollback Reasons

**Epic:** Epic 27 — Device Lifecycle 360 & Cross-Domain Timeline
**Phase:** PHASE 2: FIELD ADDITIONS
**Persona:** Raj (Operations Manager) / Compliance Officer
**Priority:** P1
**Story Points:** 3
**Status:** New
**GitHub Issue:** #420
**Target URL:** `/deployment/firmware/:firmwareId` (existing firmware detail page) + firmware approval flow

## User Story

As an operations manager or compliance officer, I want every firmware approval, rejection, and rollback action to capture a written reason or comment, so that the audit trail shows not just who acted and when, but why — providing the context needed for SoD compliance (NIST AC-5) and post-incident forensics.

## Preconditions

- Firmware multi-stage approval is implemented (Epic 4 — Stories 4.1–4.5, `approvalStage` enum with Uploaded / Testing / Approved)
- `FirmwareAssignment` entity exists with `previousFirmwareVersion` field (Story 26.9)
- Audit trail infrastructure writes AUDIT# records for every firmware state change (Epic 8)

## Context / Business Rules

- **Three new optional string fields — nothing else:** This story is deliberately small. No new workflow, no new state machine, no new permissions. Just three text fields on existing flows.
- **Approval comment (optional):** When a user promotes a firmware through a stage (Uploaded → Testing → Approved), they MAY enter a free-text comment (max 1000 chars). Stored on the existing firmware version record as `approvalComment` (last write wins per stage — we keep the comment on the most recent approval action).
- **Rejection reason (required when rejecting):** When a user rejects a firmware at any stage, they MUST enter a rejection reason (free text, max 1000 chars, minimum 10 chars). Stored on the firmware version record as `rejectionReason`.
- **Rollback reason (required when rolling back):** When a `FirmwareAssignment` is created that moves a device BACK to a previous firmware version (rollback — detected by the new assignment's `version` being older than `previousFirmwareVersion`), the user MUST enter a rollback reason. Stored on `FirmwareAssignment.rollbackReason`.
- **Existing assignments without reasons:** For FirmwareAssignment records created before this story, the `rollbackReason` field is null and displays as "Reason not recorded (historical)" in UI. No backfill.
- **Comments are visible everywhere the action is:** Approval comments appear in the firmware version timeline (Story 20.6) and in the device lifecycle timeline (Story 27.1). Rollback reasons appear alongside the firmware event on the device lifecycle timeline.
- **NIST SoD (AC-5):** The person adding the comment MUST be the person executing the action. System-generated approvals (automated CI gates) enter their reasons programmatically with `system` as the actor.

## Acceptance Criteria

- [ ] AC1: `Firmware` / `FirmwareVersion` type in `src/lib/types.ts` is extended with optional `approvalComment?: string` and `rejectionReason?: string` fields (max 1000 chars each)
- [ ] AC2: `FirmwareAssignment` type is extended with optional `rollbackReason?: string` field
- [ ] AC3: The firmware approval action UI (existing promote-to-next-stage button) is extended with an optional comment textarea; submission includes `approvalComment` in the mutation
- [ ] AC4: The firmware rejection action UI is extended with a **required** rejection reason textarea (min 10 chars, max 1000); the submit button is disabled until reason is ≥ 10 chars
- [ ] AC5: The firmware rollback UI (when the user assigns an older version to a device) is extended with a **required** rollback reason textarea (min 10 chars, max 1000); submit disabled until valid
- [ ] AC6: A pure helper function `isRollback(newVersion: string, previousVersion: string | null): boolean` using semver comparison is added to `src/lib/firmware/firmware-version-utils.ts` and unit-tested for edge cases (null previous, equal versions, prerelease tags)
- [ ] AC7: Mock API provider is updated so that mock firmware and assignment records include realistic example reasons (at least 3 firmware versions with approval comments, 2 rejections, 1 rollback)
- [ ] AC8: The firmware version timeline (Story 20.6) renders approval comments and rejection reasons inline with their corresponding state-transition nodes
- [ ] AC9: The device lifecycle timeline (Story 27.1) renders rollback reasons inline on Firmware-category events where `rollbackReason` is present
- [ ] AC10: Unit tests cover: reason validation (min/max length), required-vs-optional distinction, rollback detection helper, historical records rendering (null reason) — with ≥ 85% coverage
- [ ] AC11: E2E test covers: approve with comment, reject with required reason, rollback with required reason, then verifies reasons surface in both firmware timeline (20.6) and device lifecycle timeline (27.1)

## UI Behavior

- Approval comment textarea: placeholder "Optional: note for the audit trail (e.g., 'tested against customer sandbox, all green')"
- Rejection reason textarea: placeholder "Required: why is this firmware rejected? (min 10 chars)"
- Rollback reason textarea: placeholder "Required: why rollback to this older version? (min 10 chars, e.g., 'v1.1 destabilized customer X's fleet')"
- Character counter (e.g., "42 / 1000") appears below each textarea and turns amber at > 900 chars
- Display of existing comments/reasons uses a subtle quote-block style with a speech-bubble icon
- Historical assignments without a rollback reason show muted text "Reason not recorded (historical)" — no alarming red/warning
- Any comment or reason longer than 120 chars truncates in the timeline node view with a "show more" expand

## Out of Scope

- Structured reason taxonomies (dropdown of "CVE fix", "performance regression", etc.) — free text only for this story
- Approval delegation trail (A approved via delegation from B) — future story
- Editing or deleting existing comments (all comments are immutable like the audit log)
- Backfilling historical assignment records with inferred rollback reasons
- Multi-language reason input (English only)

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for rollback detection semver rules and comment storage/retrieval strategy.

## Dev Checklist (NOT for QA)

1. Add `approvalComment` / `rejectionReason` fields to `Firmware` / `FirmwareVersion` type in `src/lib/types.ts`
2. Add `rollbackReason` field to `FirmwareAssignment` type
3. Extend mock API provider with realistic reason samples
4. Extend `IApiProvider` mutations (`approveFirmware`, `rejectFirmware`, `assignFirmware`) to accept optional / required reasons per story rules
5. Create `src/lib/firmware/firmware-version-utils.ts` with `isRollback()` pure helper
6. Update approval/reject modal UI in `src/app/components/firmware/firmware-approval-actions.tsx` (or equivalent existing component)
7. Update firmware assignment UI to detect rollback and require reason
8. Update the firmware version timeline renderer (Story 20.6) to display comments
9. Update the device lifecycle timeline renderer (Story 27.1) to display rollback reasons
10. Unit tests: `firmware-version-utils.test.ts`, mutation validation tests, component tests for textarea behavior
11. E2E test covering the full approve/reject/rollback + display flow

## AutoGent Test Prompts

1. **AC1-AC2 — Type additions:** "Import Firmware from types.ts. Verify it has optional properties approvalComment and rejectionReason, each typed as string | undefined. Import FirmwareAssignment. Verify it has optional property rollbackReason."

2. **AC3 — Approve with optional comment:** "Navigate to a firmware in Testing stage. Click 'Approve'. Verify a comment textarea is visible with 'Optional' placeholder. Submit WITHOUT entering text. Verify submission succeeds and firmware advances to Approved."

3. **AC4 — Reject requires reason:** "Navigate to a firmware in Testing. Click 'Reject'. Verify textarea is visible with 'Required' placeholder. Verify submit button is disabled. Enter 5 chars. Verify submit still disabled. Enter 15 chars. Verify submit enables. Submit. Verify rejection is recorded with the reason."

4. **AC5-AC6 — Rollback detection:** "Assign v1.2 to device-001. Then initiate another assignment of v1.0 (older). Verify rollback reason textarea appears and submit is gated on ≥ 10 chars. Submit with reason 'customer regression'. Verify FirmwareAssignment record includes rollbackReason = 'customer regression'."

5. **AC8 — Timeline display:** "On firmware detail page for a family with an approved version that has an approval comment, verify the comment is rendered inline in the timeline with the approval node."

6. **AC9 — Lifecycle timeline rollback display:** "On the device-001 Lifecycle tab, locate the rollback Firmware event. Verify the rollback reason text is visible (or expandable if > 120 chars)."

7. **AC11 — Full E2E:** "Execute approve → reject → assign rollback → display in both timelines flow, verifying all reasons surface correctly."

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (≥ 85% coverage on new code)
- [ ] E2E test covers approve/reject/rollback reason capture + display
- [ ] Mock data updated with realistic samples
- [ ] WCAG 2.1 AA — textareas have proper labels, character counters announced to screen readers
- [ ] No changes to existing firmware state machine
- [ ] TypeScript strict — no `any` types
- [ ] Compliance check green
