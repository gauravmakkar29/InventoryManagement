# Story 3.6: Device Status Update

**Epic:** Epic 3 — Inventory & Device Management
**Priority:** Medium
**Story Points:** 3
**Status:** In Review (PR pending)
**Branch:** `feature/IMS-73-device-status-update`
**GitHub Issue:** #73

## Acceptance Criteria

- [x] AC1: Status dropdown in table rows for Admin/Manager (canEdit check)
- [x] AC2: Optimistic UI update: status changes immediately in table
- [x] AC3: Toast notification: "Device [name] status updated to [new status]"
- [x] AC4: Health auto-set to 0 when status changed to Offline
- [x] AC5: Actions column hidden from Viewer role
- [x] AC6: Status badge colors update instantly

## Implementation Notes

- Actions column with select dropdown per row, RBAC-gated
- handleStatusChange updates state optimistically
- colSpan adjusts dynamically based on canEdit
- Includes Stories 3.1 + 3.2 + 3.3 as base

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
