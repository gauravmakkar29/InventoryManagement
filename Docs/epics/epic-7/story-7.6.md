# Story 7.6: Analytics Data Export

**Epic:** Epic 7 — Analytics & Reporting
**Persona:** Raj (Operations Manager)
**Priority:** Medium
**Story Points:** 2

## User Story

As an Operations Manager, I want to export audit log data from the Analytics page as a CSV file, so that I can include the data in client reports and presentations.

## Acceptance Criteria

- [x] AC1: When I view the audit log table, I see an "Export" dropdown button with CSV and JSON options
- [x] AC2: When I click "Export as CSV", a CSV file downloads containing filtered audit log entries
- [x] AC3: When the CSV downloads, the filename follows the pattern `audit-log-{timeRange}-{date}.csv`
- [x] AC4: CSV has proper column headers: Timestamp, User, Action, Entity, Details
- [x] AC5: When there are no audit entries to export, the Export button is disabled with tooltip "No data to export"
- [x] AC6: When the export completes, a success toast notification appears

## UI Behavior

- Export button uses a download icon (Lucide Download) with "Export CSV" label
- Button is styled as a secondary/outline button, not primary
- CSV generation happens client-side (no server round-trip for export)
- During generation of large datasets, button shows a brief loading spinner

## Out of Scope

- JSON export format (CSV only for this story)
- Exporting chart images or chart data
- Scheduled or automated report generation
- Email delivery of exports

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for implementation details.

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
