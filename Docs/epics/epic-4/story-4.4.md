# Story 4.4: Audit Log Tab with Search and Export

**Epic:** Epic 4 — Deployment & Firmware Lifecycle
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 5

## User Story
As a platform admin, I want to view and search a 30-day audit trail of all system changes, so that I can investigate incidents and demonstrate compliance to auditors.

## Acceptance Criteria
- [ ] AC1: When I click the "Audit Log" tab on the Deployment page, I see a table of audit log entries sorted by most recent first
- [ ] AC2: The table displays columns: User, Action (Created/Modified/Deleted), Resource Type + ID, Timestamp, IP Address, Status
- [ ] AC3: When I type in the search filter, the table filters entries by user name, action, or resource type
- [ ] AC4: The default date range shows the last 30 days; I can change the range using a date range picker
- [ ] AC5: When I click "Export CSV", a CSV file downloads with all audit entries matching the current filters
- [ ] AC6: When I am a Technician, Viewer, or CustomerAdmin, the Audit Log tab is not visible (Admin and Manager only)
- [ ] AC7: Audit entries are paginated; I can navigate through pages for large result sets
- [ ] AC8: When no entries match the filter criteria, I see "No audit entries found for the selected period"

## UI Behavior
- Date range picker is positioned in the toolbar above the table
- Search input is to the left of the date range picker
- Export CSV button is right-aligned in the toolbar
- Timestamp column shows formatted date/time in the user's locale
- Action column uses colored badges: green (Created), amber (Modified), red (Deleted)
- Table supports column sorting by clicking headers

## Out of Scope
- Audit log detail view (clicking an entry)
- Filtering by specific resource type via dropdown
- Real-time streaming of new audit entries
- Audit log deletion or modification (immutable by design)

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for AuditLog entity model, `listAuditLogs` query via GSI2, and audit log generation via Lambda.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
