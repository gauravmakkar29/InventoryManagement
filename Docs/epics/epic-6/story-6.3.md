# Story 6.3: Submit Compliance Item for Review

**Epic:** Epic 6 — Compliance & Vulnerability Tracking
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 5

## User Story
As an operations manager, I want to submit new compliance items for review, so that newly certified firmware-device combinations are tracked and can be approved by an admin.

## Acceptance Criteria
- [ ] AC1: When I am an Admin or Manager, I see a "Submit for Review" button on the Compliance page
- [ ] AC2: When I click "Submit for Review", a modal opens with a form containing: Firmware Version (dropdown), Device Model (dropdown), and Certification(s) (multi-select or text input)
- [ ] AC3: The Firmware Version dropdown is populated from existing firmware packages in the system
- [ ] AC4: The Device Model dropdown is populated from existing device models
- [ ] AC5: When I submit the form with all required fields, a compliance item is created with status "Pending" and appears in the Pending tab
- [ ] AC6: When required fields are missing, inline validation errors appear and submission is blocked
- [ ] AC7: When the submission succeeds, the modal closes and a success toast appears ("Compliance item submitted for review")
- [ ] AC8: When I am a Viewer or Technician, the "Submit for Review" button is not visible

## UI Behavior
- Modal uses Dialog component with react-hook-form validation
- All fields are required and marked with red asterisk
- Certification field allows entering standard certification names (e.g., IEC 62109, UL 1741, IEEE 1547)
- On successful submission, the Pending tab count increments
- Cancel button closes modal without saving

## Out of Scope
- Uploading certification documents or evidence
- Editing existing compliance items
- Bulk submission of multiple items

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for `createCompliance` mutation and form field mappings.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
