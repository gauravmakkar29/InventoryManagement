# Story 6.5: Create Vulnerability Record

**Epic:** Epic 6 — Compliance & Vulnerability Tracking
**Persona:** Sarah (Platform Admin)
**Priority:** Medium
**Story Points:** 3

## User Story
As a platform admin, I want to add vulnerability records linked to compliance items, so that known CVEs are formally tracked and remediation can be managed.

## Acceptance Criteria
- [ ] AC1: When I am an Admin or Manager viewing the vulnerability panel for a compliance item, I see an "Add Vulnerability" button
- [ ] AC2: When I click "Add Vulnerability", a modal opens with fields: CVE ID (text input), Severity (dropdown: Critical/High/Medium/Low), Affected Component (text input)
- [ ] AC3: When I submit the form with all fields filled, a vulnerability record is created linked to the current compliance item and appears in the vulnerability panel
- [ ] AC4: When the CVE ID field is empty or severity is not selected, inline validation prevents submission
- [ ] AC5: When creation succeeds, the vulnerability count on the parent compliance item increments
- [ ] AC6: When I am a Viewer, the "Add Vulnerability" button is not visible
- [ ] AC7: The new vulnerability defaults to remediation status "Open"

## UI Behavior
- Modal uses Dialog component with react-hook-form
- CVE ID field has a placeholder showing expected format (e.g., "CVE-2026-XXXX")
- Severity dropdown has color-coded options matching the severity color scheme
- Affected Component is a free-text field describing the vulnerable software component
- On success, modal closes and the vulnerability panel refreshes with the new entry

## Out of Scope
- Bulk CVE import
- Automatic CVE lookup or enrichment from external databases
- Editing vulnerability details after creation
- Deleting vulnerability records

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for Vulnerability entity model, `createVulnerability` mutation, and GSI4 linkage to compliance items.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
