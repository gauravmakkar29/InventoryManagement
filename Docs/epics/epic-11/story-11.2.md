# Story 11.2: Multi-Stage Approval Workflow

**Epic:** Epic 11 — Aegis Phase 1 (Firmware Security)
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 5

## User Story
As a Platform Admin, I want to advance firmware through a multi-stage approval workflow (Uploaded -> Testing -> Approved), so that every firmware version is formally tested and approved before deployment, meeting NIST AC-5 separation of duties requirements.

## Acceptance Criteria
- [ ] AC1: When I view a firmware card with approvalStage "Uploaded", I see an "Advance to Testing" button
- [ ] AC2: When I click "Advance to Testing" and I am not the user who uploaded the firmware, the firmware stage changes to "Testing" and my identity is recorded as "testedBy"
- [ ] AC3: When I try to advance to Testing and I am the uploader, the action is rejected with an error message: "Separation of Duties: The uploader cannot advance to Testing"
- [ ] AC4: When I view a firmware card with approvalStage "Testing", I see an "Approve" button
- [ ] AC5: When I click "Approve" and I am not the user who advanced it to Testing, the firmware stage changes to "Approved" and my identity is recorded as "approvedBy"
- [ ] AC6: When I try to approve and I am the tester, the action is rejected with an error message: "Separation of Duties: The tester cannot approve"
- [ ] AC7: When a stage transition succeeds, a success toast appears and the firmware card updates immediately

## UI Behavior
- Firmware cards display the current approval stage prominently
- Action buttons are only visible when the logged-in user is eligible for the next stage transition
- If the user is the uploader, the "Advance to Testing" button is either hidden or disabled with a tooltip explaining the SoD rule
- If the user is the tester, the "Approve" button is hidden or disabled with a SoD explanation
- Confirmation dialog appears before each stage transition: "Are you sure you want to advance [firmware name] to [stage]?"
- After transition, the ApprovalStageIndicator updates to reflect the new stage

## Out of Scope
- Reverting a stage (e.g., moving from Testing back to Uploaded)
- Rejecting firmware (only forward progression in this story)
- Bulk approval of multiple firmware items
- Notification to other users when a stage is advanced (covered in Story 11.6)

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for SoD enforcement logic in advanceFirmwareStage resolver.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
