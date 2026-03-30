# Story 4.5: Firmware Status Management (Deprecate/Activate)

**Epic:** Epic 4 — Deployment & Firmware Lifecycle
**Persona:** Sarah (Platform Admin)
**Priority:** Medium
**Story Points:** 3

## User Story

As a platform admin, I want to deprecate or reactivate firmware packages, so that outdated versions are clearly marked and no longer available for deployment.

## Acceptance Criteria

- [x] AC1: When a firmware package is "Active" or "Pending", I see a "Deprecate" button on its card (Admin and Manager only)
- [x] AC2: When I click "Deprecate" and confirm, the firmware status changes to "Deprecated" and the card visual treatment changes to muted/strikethrough
- [x] AC3: When a firmware package is "Deprecated", I see an "Activate" button to restore it (Admin only)
- [x] AC4: When I click "Activate" and confirm, the firmware status changes back to "Active"
- [x] AC5: When the status change succeeds, a toast notification confirms the action (e.g., "Firmware v3.2.1 deprecated")
- [ ] AC6: When the status change fails, the card reverts to its previous state and an error toast appears

## UI Behavior

- Deprecate button uses a warning/amber color scheme
- Activate button uses a standard primary color
- Both actions require confirmation dialogs before executing
- Deprecated firmware cards appear visually distinct (reduced opacity, muted colors, strikethrough on version text)
- Status transitions are reflected immediately (optimistic UI)

## Out of Scope

- Deleting firmware packages (records are retained for audit)
- Archiving firmware to Glacier (handled by S3 lifecycle policy automatically)
- Bulk deprecation of multiple firmware packages

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for `updateEntityStatus` mutation and GSI1SK recomputation on status change.

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
- [x] Implementation complete (deprecate/activate with confirmation, muted/strikethrough styling, RBAC gating, optimistic update)
