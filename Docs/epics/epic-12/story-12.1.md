# Story 12.1: SBOM File Upload and Parsing

**Epic:** Epic 12 — SBOM & Supply Chain Security
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 8

## User Story
As a Platform Admin, I want to upload SBOM files (CycloneDX or SPDX format) linked to a firmware version and have them automatically parsed into individual components, so that I can inventory all third-party software included in our firmware.

## Acceptance Criteria
- [ ] AC1: When I click "Upload SBOM" on the SBOM Management tab, a modal opens with fields: Firmware (dropdown), Format (CycloneDX/SPDX), and a file upload area
- [ ] AC2: When I select a firmware version from the dropdown, only firmware that exists in the system is available for selection
- [ ] AC3: When I upload a valid CycloneDX JSON file and submit, the system creates an SBOM record with status "Processing"
- [ ] AC4: When I upload a valid SPDX JSON file and submit, the system creates an SBOM record with status "Processing"
- [ ] AC5: When parsing completes, the SBOM status changes to "Complete" and the component count is displayed on the SBOM card
- [ ] AC6: When parsing fails (invalid format, corrupt file), the SBOM status changes to "Error" and an error message describes the issue
- [ ] AC7: When the upload succeeds, a success toast appears and the SBOM list refreshes

## UI Behavior
- Upload modal uses shadcn Dialog with a form
- Firmware dropdown is searchable, showing firmware name + version
- Format selector is a radio group: CycloneDX / SPDX
- File upload area supports drag-and-drop for .json files
- After upload, the SBOM card shows a "Processing..." spinner until parsing completes
- When complete, the card shows: firmware name, format badge, component count, vulnerability count
- Error state shows red badge with error details on hover

## Out of Scope
- XML-format SBOM parsing (JSON only for POC)
- Editing an uploaded SBOM
- Deleting an SBOM
- Automatic SBOM generation from firmware binary analysis

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for CycloneDX/SPDX parsing logic and Lambda processor.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
