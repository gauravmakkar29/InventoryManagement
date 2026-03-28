# Story 12.4: Vulnerability Remediation Tracking

**Epic:** Epic 12 — SBOM & Supply Chain Security
**Persona:** Sarah (Platform Admin)
**Priority:** Medium
**Story Points:** 3

## User Story
As a Platform Admin, I want to update the remediation status of component vulnerabilities and add remediation notes, so that my team can track progress on fixing supply chain security issues.

## Acceptance Criteria
- [ ] AC1: When I view a CVE row in the dashboard, I see a remediation status dropdown that I can change
- [ ] AC2: When I change the status from "Open" to "In Progress", the badge color updates immediately and a success toast appears
- [ ] AC3: When I change the status to "Mitigated", I am prompted to enter remediation notes explaining the mitigation
- [ ] AC4: When I change the status to "Resolved", the resolved date is automatically set to the current timestamp
- [ ] AC5: When I view a vulnerability's detail (expanded row), I see the remediation notes and resolved date if applicable
- [ ] AC6: When I am a Viewer, I can see remediation statuses but cannot change them
- [ ] AC7: When I am a Manager, I can update remediation statuses and add notes

## UI Behavior
- Remediation status is an inline dropdown on each CVE table row
- Status options: Open (red), In Progress (amber), Mitigated (blue), Resolved (green)
- When "Mitigated" is selected, a small text area appears for remediation notes
- Status change is submitted immediately (optimistic update)
- Remediation notes are displayed in the expanded row detail
- Resolved date is displayed as a formatted timestamp in the expanded detail

## Out of Scope
- Assigning remediation tasks to specific team members
- Remediation SLA tracking
- Automated remediation workflows
- Bulk status updates across multiple CVEs

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for updateComponentVulnStatus mutation.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
