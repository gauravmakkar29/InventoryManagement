# Story 3.6: Device Status Update

**Epic:** Epic 3 — Inventory & Device Management
**Persona:** Sarah (Platform Admin)
**Priority:** Medium
**Story Points:** 3

## User Story
As a platform admin, I want to change a device's status (Online, Offline, Maintenance), so that the inventory reflects the current operational state of each device.

## Acceptance Criteria
- [ ] AC1: When I am an Admin or Manager viewing the hardware inventory table, each row has a status dropdown or action menu allowing me to change the device status
- [ ] AC2: When I change a device status from "Online" to "Maintenance", the table immediately reflects the new status with the updated badge color
- [ ] AC3: When the status update succeeds, I see a toast notification "Device [name] status updated to [new status]"
- [ ] AC4: When the status update API call fails, the device reverts to its previous status and I see an error toast "Failed to update status. Please try again."
- [ ] AC5: When I am a Technician, Viewer, or CustomerAdmin, the status change action is not available
- [ ] AC6: The status change is recorded in the audit log automatically (via DynamoDB Streams)

## UI Behavior
- Status change uses a dropdown select or a small action menu in the table row
- Optimistic UI update: status changes immediately in the table, rolls back on failure
- Status badge colors update instantly: green (Online), gray (Offline), amber (Maintenance)
- The Geo Location map also reflects status changes when switching to that tab

## Out of Scope
- Bulk status changes for multiple devices
- Automated status detection (heartbeat/ping)
- Status change reason or notes field

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for `updateEntityStatus` mutation, GSI1SK recomputation, and optimistic update pattern.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
