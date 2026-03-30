# Story 8.5: Audit Log CSV Export

**Epic:** Epic 8 — Audit Trail
**Persona:** Sarah (Platform Admin)
**Priority:** Medium
**Story Points:** 2

## User Story

As a Platform Admin, I want to export the current audit log view as a CSV file, so that I can provide audit evidence to compliance auditors and attach it to regulatory documentation.

## Acceptance Criteria

- [x] AC1: When I view the Audit Log tab on the Deployment page, I see an "Export CSV" button
- [x] AC2: When I click "Export CSV", a CSV file downloads containing all audit entries matching the current filters (date range and user filter)
- [x] AC3: When the CSV is opened, it contains headers: User, Action, ResourceType, ResourceId, Timestamp, IPAddress, Status
- [x] AC4: When the filename is generated, it follows the pattern `audit-log-{startDate}-to-{endDate}.csv`
- [x] AC5: When there are no audit entries matching the current filters, the Export CSV button is disabled
- [x] AC6: When the export completes, a toast notification confirms "Audit log exported successfully"

## UI Behavior

- Export button positioned to the right of the filter controls, above the table
- Button shows a download icon with "Export CSV" text
- Button is a secondary/outline style, not primary
- Export includes all pages of data (not just the currently visible page)
- Generation is client-side; no additional API call needed if all data is already loaded

## Out of Scope

- JSON export format
- PDF export with formatted layout
- Scheduled automatic exports
- Emailing the export to auditors

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for CSV export format and report-generator.ts usage.

## Definition of Done

- [x] Code reviewed and approved
- [x] Unit tests passing (>=85% coverage on new code)
- [x] E2E tests passing
- [x] Compliance check green
