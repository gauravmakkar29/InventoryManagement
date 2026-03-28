# Story 11.4: Vulnerability Tracking Panel

**Epic:** Epic 11 — Aegis Phase 1 (Firmware Security)
**Persona:** Lisa (Compliance Auditor)
**Priority:** High
**Story Points:** 5

## User Story
As a Compliance Auditor, I want to view and track known vulnerabilities associated with firmware versions, so that I can assess the security posture of deployed firmware and ensure critical vulnerabilities are being remediated.

## Acceptance Criteria
- [ ] AC1: When I navigate to the Deployment page and click the "Vulnerabilities" tab, I see a table of all known vulnerabilities
- [ ] AC2: When the table loads, it shows columns: CVE ID, Severity, Affected Component, Remediation Status, and Firmware Version
- [ ] AC3: When I click a severity filter pill (Critical, High, Medium, Low), the table filters to show only vulnerabilities of that severity
- [ ] AC4: When I view the Severity column, each severity level is displayed as a colored badge (Critical=red, High=orange, Medium=amber, Low=green)
- [ ] AC5: When I view the Remediation Status column, each status is displayed as a badge (Open=red, In Progress=amber, Resolved=green)
- [ ] AC6: When there are no vulnerabilities, the table shows "No vulnerabilities found"
- [ ] AC7: When I am a Viewer, I can see the vulnerability table but cannot change remediation statuses

## UI Behavior
- Vulnerability table is a data-dense table (compact rows, enterprise style)
- Severity filter pills are horizontal above the table (similar pattern to device status filters)
- CVE IDs are displayed in monospace font for readability
- Table supports sorting by severity (Critical first by default) and by remediation status
- Table is paginated (25 items per page)
- Affected Component shows the software component name and version (e.g., "OpenSSL 3.1.0")

## Out of Scope
- Creating new vulnerability records (covered in Story 11.5)
- Updating remediation status (covered in Story 11.5)
- CVE detail drill-down to external NVD page
- Vulnerability trend charts

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for Vulnerability entity and VulnerabilityPanel component hierarchy.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
