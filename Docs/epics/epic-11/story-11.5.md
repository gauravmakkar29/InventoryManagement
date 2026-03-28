# Story 11.5: Vulnerability Remediation Management

**Epic:** Epic 11 — Aegis Phase 1 (Firmware Security)
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 3

## User Story
As a Platform Admin, I want to create vulnerability records and update their remediation status, so that my team can track the progress of fixing known security issues across our firmware.

## Acceptance Criteria
- [ ] AC1: When I click "Add Vulnerability" on the Vulnerabilities tab, a modal opens with fields: CVE ID, Severity, Affected Component, and linked Firmware
- [ ] AC2: When I fill in the form and submit, a new vulnerability record is created and appears in the table
- [ ] AC3: When I click the status dropdown on an existing vulnerability row, I can change the remediation status to "Open", "In Progress", or "Resolved"
- [ ] AC4: When I change a status to "Resolved", the resolved date is automatically set to the current timestamp
- [ ] AC5: When I try to submit a vulnerability without a CVE ID, a validation error appears
- [ ] AC6: When the status update succeeds, the badge color updates immediately and a success toast appears
- [ ] AC7: When I am a Manager, I can create vulnerabilities and update statuses
- [ ] AC8: When I am a Viewer, the "Add Vulnerability" button and status dropdowns are not visible

## UI Behavior
- "Add Vulnerability" button is positioned above the vulnerability table, visible to Admin and Manager only
- Create modal uses the shadcn Dialog with form fields
- Severity is a dropdown: Critical, High, Medium, Low
- Firmware is a dropdown populated from existing firmware records
- Status update is an inline dropdown (no modal needed) on each table row
- Status change triggers immediately on selection (optimistic update)

## Out of Scope
- Deleting vulnerability records
- Bulk status updates
- Linking vulnerabilities to compliance records
- Auto-scanning for new CVEs

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for createVulnerability and updateVulnerabilityStatus mutations.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
