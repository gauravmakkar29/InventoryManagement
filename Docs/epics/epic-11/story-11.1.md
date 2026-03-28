# Story 11.1: Firmware Upload with Checksum Verification

**Epic:** Epic 11 — Aegis Phase 1 (Firmware Security)
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 5

## User Story
As an Operations Manager, I want to upload firmware files with automatic SHA-256 checksum computation, so that the integrity of every firmware binary is verified and recorded from the moment of upload.

## Acceptance Criteria
- [ ] AC1: When I click "Upload Firmware" on the Deployment page, a modal opens with fields: Name, Version, Device Model, and a file upload area
- [ ] AC2: When I drag-and-drop or select a firmware file, the system computes a SHA-256 checksum of the file and displays it in the modal
- [ ] AC3: When I fill in all required fields and click "Upload", the firmware file is uploaded to S3 and a firmware record is created with approvalStage set to "Uploaded"
- [ ] AC4: When the upload completes, the firmware record shows my user identity as the "uploadedBy" field
- [ ] AC5: When I try to submit the form with missing required fields, validation errors appear on the empty fields
- [ ] AC6: When the upload fails (network error, S3 error), an error toast appears with a retry option
- [ ] AC7: When the upload succeeds, a success toast appears and the firmware list refreshes to show the new entry

## UI Behavior
- Modal uses the shadcn Dialog component with form fields
- File upload area supports drag-and-drop and click-to-browse
- Checksum is displayed in a monospace read-only field after file selection
- Upload progress is shown as a progress bar during file transfer
- Device Model is a dropdown populated from known device models
- Form validation is inline (red borders + error messages below fields)
- "Upload" button shows a spinner during submission

## Out of Scope
- Advancing the firmware through approval stages (covered in Story 11.2)
- Multiple file uploads in one session
- File type validation (any binary accepted for POC)
- Virus scanning of uploaded files

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for S3 upload flow, checksum computation, and createFirmware mutation.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
