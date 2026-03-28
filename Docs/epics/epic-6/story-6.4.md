# Story 6.4: Approve and Deprecate Compliance Items

**Epic:** Epic 6 — Compliance & Vulnerability Tracking
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 3

## User Story
As a platform admin, I want to approve or deprecate compliance items, so that I can maintain an accurate compliance status across all firmware-device certifications.

## Acceptance Criteria
- [ ] AC1: When I am an Admin viewing a compliance item with status "Pending", I see an "Approve" button
- [ ] AC2: When I click "Approve" and confirm, the item status changes to "Approved" and moves to the Approved tab
- [ ] AC3: When I am an Admin viewing a compliance item with status "Approved" or "Pending", I see a "Deprecate" button
- [ ] AC4: When I click "Deprecate" and confirm, the item status changes to "Deprecated" and moves to the Deprecated tab
- [ ] AC5: When the status change succeeds, a toast notification confirms the action (e.g., "Compliance item approved")
- [ ] AC6: When the status change fails, the item reverts to its previous status and an error toast appears
- [ ] AC7: When I am a Manager, Viewer, or other role, the Approve and Deprecate buttons are not visible
- [ ] AC8: Tab counts update immediately after an approval or deprecation

## UI Behavior
- Approve button uses green color scheme; Deprecate button uses amber/warning color
- Both actions require a confirmation dialog: "Approve this compliance item?" / "Deprecate this compliance item? It will no longer be considered current."
- Status badge updates immediately (optimistic UI)
- Notification sent to Managers when a compliance status changes (automatic via backend)

## Out of Scope
- Restoring a deprecated item back to Approved
- Approval workflow with multiple reviewers
- Comments or notes on approval decisions

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for `updateEntityStatus` mutation and role-based action visibility.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
