# Story 4.2: Upload Firmware Package

**Epic:** Epic 4 — Deployment & Firmware Lifecycle
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 5

## User Story

As a platform admin, I want to upload new firmware packages with metadata, so that they enter the approval pipeline and are available for deployment to devices.

## Acceptance Criteria

- [x] AC1: When I am an Admin or Manager, I see an "Upload Firmware" button above the firmware card grid
- [x] AC2: When I click "Upload Firmware", a modal opens with a form containing: Name, Version, Target Device Model (dropdown), and File upload input
- [x] AC3: When I select a firmware file and submit the form, the file is uploaded to S3 and a firmware record is created with `approvalStage: "Uploaded"` and `uploadedBy` set to my user ID
- [ ] AC4: When the upload is in progress, I see a progress indicator in the modal and the submit button is disabled
- [x] AC5: When the upload completes successfully, the modal closes, a success toast appears ("Firmware [name] v[version] uploaded"), and the new firmware card appears in the grid
- [ ] AC6: When the upload fails, I see an error toast "Failed to upload firmware. Please try again." and the modal stays open for retry
- [x] AC7: When I am a Technician, Viewer, or CustomerAdmin, the "Upload Firmware" button is not visible

## UI Behavior

- Modal uses the Dialog component with react-hook-form validation
- File input accepts firmware binary files (configurable allowed extensions)
- Version field validates format (e.g., semver-like pattern)
- Device Model dropdown is populated from existing device models in the system
- Upload progress shown as a progress bar within the modal
- Cancel button aborts the upload and closes the modal

## Out of Scope

- Drag-and-drop file upload
- Checksum verification in the UI (computed server-side)
- Bulk firmware upload
- S3 Object Lock configuration (handled by infrastructure)

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for `createFirmware` mutation, S3 pre-signed URL upload flow, and WORM storage configuration.

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
- [x] Implementation complete (UploadFirmwareModal with validation, RBAC gating, model multi-select, file placeholder)
