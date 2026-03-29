# Story 3.3: Create Device Form

**Epic:** Epic 3 — Inventory & Device Management
**Priority:** High
**Story Points:** 5
**Status:** In Review (PR pending)
**Branch:** `feature/IMS-67-create-device-form`
**GitHub Issue:** #67

## Acceptance Criteria

- [x] AC1: "Add Device" button visible to Admin/Manager only (RBAC via canPerformAction)
- [x] AC2: Modal form: Device Name, Serial Number, Model (dropdown), Firmware Version, Status (dropdown), Location, Latitude, Longitude
- [x] AC3: Inline validation errors for missing required fields
- [x] AC4: Optimistic update: new device prepended to table without page refresh
- [x] AC5: Success toast: "Device [name] created successfully"
- [x] AC6: Button hidden from Viewer role
- [x] AC7: Cancel closes modal without creating device

## Implementation Notes

- CreateDeviceModal at src/app/components/dialogs/create-device-modal.tsx
- Inventory state lifted from static MOCK_DEVICES to useState
- RBAC: canPerformAction(role, "create") check for Add Device button
- Lat/Lng optional, validated as numbers when provided
- Includes Story 3.1 changes as base

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
