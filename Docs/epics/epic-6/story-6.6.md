# Story 6.6: Regulatory Readiness Report Generation

**Epic:** Epic 6 — Compliance & Vulnerability Tracking
**Persona:** Lisa (Compliance Auditor)
**Priority:** High
**Story Points:** 5

## User Story

As a compliance auditor, I want to generate and download a regulatory readiness report in CSV or JSON format, so that I can provide compliance evidence to external auditors and regulatory bodies.

## Acceptance Criteria

- [x] AC1: When I view the Compliance page, I see a "Generate Regulatory Report" button
- [x] AC2: When I click the button, a dialog opens with a format selector: CSV or JSON
- [x] AC3: When I select CSV and click "Download", a CSV file is generated containing all compliance items matching the current filters, with associated vulnerability data
- [x] AC4: When I select JSON and click "Download", a structured JSON file is generated with compliance items containing nested vulnerability arrays
- [x] AC5: The report includes: compliance item details (firmware version, device model, certification, status), vulnerability details (CVE ID, severity, affected component, remediation status), and a generation timestamp
- [x] AC6: When the report generates successfully, a toast confirms "Report downloaded" and the dialog closes
- [x] AC7: When there are no compliance items matching current filters, the dialog shows "No data available for report generation" and the download button is disabled
- [x] AC8: The report is generated client-side (no server round-trip required)

## UI Behavior

- Dialog uses the Dialog component with radio buttons for format selection
- CSV is selected by default
- Download button triggers browser file download
- Report filenames include date: `regulatory-report-2026-03-28.csv` or `.json`
- Dialog has a preview count: "This report will include X compliance items and Y vulnerabilities"
- Cancel button closes the dialog without generating

## Out of Scope

- PDF report generation
- Scheduled/automated report delivery
- Report templates or customization
- Report history or saved reports

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for `report-generator.ts` utilities (`generateCSV`, `generateJSON`, `generateRegulatoryReport`), and report contents specification.

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
