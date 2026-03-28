# Story 11.6: Regulatory Compliance Reports

**Epic:** Epic 11 — Aegis Phase 1 (Firmware Security)
**Persona:** Lisa (Compliance Auditor)
**Priority:** Medium
**Story Points:** 3

## User Story
As a Compliance Auditor, I want to generate regulatory compliance reports that summarize firmware approval chains, vulnerability status, and compliance records, so that I can provide evidence for regulatory audits and certifications.

## Acceptance Criteria
- [ ] AC1: When I navigate to the "Regulatory Reports" tab on the Deployment page, I see report type options: Compliance Summary, Vulnerability Report, and Approval Chain Audit
- [ ] AC2: When I select "Compliance Summary" and click "Generate", a preview table shows all compliance records with their status, certification, and firmware version
- [ ] AC3: When I select "Vulnerability Report" and click "Generate", a preview table shows all vulnerabilities with CVE ID, severity, affected component, remediation status, and firmware
- [ ] AC4: When I select "Approval Chain Audit" and click "Generate", a preview table shows firmware records with who uploaded, tested, and approved each one, with timestamps
- [ ] AC5: When I click "Export CSV" on a generated report, a CSV file downloads with the report data
- [ ] AC6: When I click "Export JSON" on a generated report, a JSON file downloads with the report data
- [ ] AC7: When I am a Viewer, I can generate and export reports but cannot modify underlying data

## UI Behavior
- Report type selector is a set of radio buttons or a dropdown
- Optional filters are available: date range, device model, certification type
- "Generate" button triggers data assembly and preview rendering
- Preview is displayed as a read-only data table below the controls
- Export buttons (CSV and JSON) appear above the preview table after generation
- Export filenames follow the pattern: `{report-type}-report-{date}.{format}`
- Loading indicator appears during report generation

## Out of Scope
- PDF export with formatted layout
- Scheduled automatic report generation
- Emailing reports to stakeholders
- Custom report templates

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for report generation using report-generator.ts and RegulatoryReportDialog component.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
