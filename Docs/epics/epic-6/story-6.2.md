# Story 6.2: Vulnerability Panel

**Epic:** Epic 6 — Compliance & Vulnerability Tracking
**Persona:** Lisa (Compliance Auditor)
**Priority:** High
**Story Points:** 5

## User Story
As a compliance auditor, I want to view the vulnerabilities associated with a compliance item, so that I can assess the security risk and track remediation progress.

## Acceptance Criteria
- [ ] AC1: When I click on a compliance item or its "View Vulnerabilities" button, an expandable panel opens below the item showing its associated vulnerabilities
- [ ] AC2: Each vulnerability displays: CVE ID, severity badge (Critical/High/Medium/Low with color coding), affected component, and remediation status (Open/In Progress/Resolved)
- [ ] AC3: Vulnerabilities with severity "Critical" are displayed with a red background accent to draw immediate attention
- [ ] AC4: When a vulnerability has been resolved, the resolved date is shown
- [ ] AC5: When a compliance item has no vulnerabilities, the panel shows "No vulnerabilities recorded"
- [ ] AC6: When I am an Admin or Manager, I see a status dropdown on each vulnerability row to change its remediation status
- [ ] AC7: When I am a Viewer, I see the remediation status as read-only text (no dropdown)
- [ ] AC8: When I change a vulnerability status to "Resolved", the resolved date is automatically set to now

## UI Behavior
- Panel expands inline below the compliance item with a slide-down animation (200ms)
- Clicking the same item again collapses the panel
- Severity badges use: red (Critical), orange (High), amber (Medium), blue (Low)
- Remediation status dropdown updates are optimistic with rollback on failure
- A success toast confirms remediation status changes
- Panel is scrollable if there are many vulnerabilities

## Out of Scope
- Creating new vulnerabilities (covered in Story 6.5)
- Editing vulnerability details (CVE ID, severity, component)
- Cross-compliance vulnerability search (requires OpenSearch)

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for Vulnerability entity model, `listVulnerabilitiesByCompliance` query (GSI4), severity color mapping, and `updateVulnerabilityStatus` mutation.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
