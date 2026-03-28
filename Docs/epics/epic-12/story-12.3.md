# Story 12.3: CVE Matching and Vulnerability Dashboard

**Epic:** Epic 12 — SBOM & Supply Chain Security
**Persona:** Lisa (Compliance Auditor)
**Priority:** High
**Story Points:** 5

## User Story
As a Compliance Auditor, I want SBOM components automatically matched against known CVE databases with results displayed in a vulnerability dashboard, so that I can assess the security risk of each firmware version's software dependencies.

## Acceptance Criteria
- [ ] AC1: When an SBOM is processed, its components are automatically matched against known CVEs (seed database for POC)
- [ ] AC2: When I view the "CVE Dashboard" tab, I see summary cards showing counts by severity: Critical, High, Medium, Low
- [ ] AC3: When the CVE table loads, it shows columns: CVE ID, Severity, CVSS Score, Affected Component + Version, Fixed Version, and Remediation Status
- [ ] AC4: When I filter by severity using filter pills, only CVEs of that severity level are shown
- [ ] AC5: When I filter by remediation status, only CVEs with that status are shown (Open, In Progress, Mitigated, Resolved)
- [ ] AC6: When a component version matches a known CVE, the vulnerability is linked to both the component and the SBOM
- [ ] AC7: When no CVEs are found for any components, the dashboard shows "No known vulnerabilities detected" with a green check indicator

## UI Behavior
- Summary cards at the top: four cards for Critical (red), High (orange), Medium (amber), Low (green) with counts
- CVE table below the summary cards, sortable by severity (Critical first by default) and CVSS score
- CVE ID column links externally to NVD (https://nvd.nist.gov/vuln/detail/{cveId}) in a new tab
- Severity badges are color-coded consistently across the application
- CVSS Score displayed as a number with one decimal (e.g., 9.8)
- Fixed Version column shows the recommended upgrade version, or "No fix available" if none exists
- Table is paginated (25 per page)

## Out of Scope
- Real-time CVE database updates (seed data only in POC)
- Auto-remediation suggestions
- Integration with NVD or OSV.dev APIs
- CVE notifications (notifications are a separate concern)

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for CVE matching strategy and ComponentVulnerability entity.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
