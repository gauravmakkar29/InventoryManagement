# Story 5.4: Service Order Filters and CSV Export

**Epic:** Epic 5 — Account & Service Orders
**Persona:** Raj (Operations Manager)
**Priority:** Medium
**Story Points:** 3

## User Story
As an operations manager, I want to filter service orders by status, priority, technician, and date range, and export the results to CSV, so that I can prepare reports for client meetings and track team performance.

## Acceptance Criteria
- [ ] AC1: When I view the Account/Service page, I see filter controls above the Kanban/Calendar view: Status, Priority, Technician, and Date Range
- [ ] AC2: When I select a priority filter (e.g., "High"), only high-priority orders are shown in both Kanban and Calendar views
- [ ] AC3: When I select a technician from the dropdown, only that technician's orders are shown
- [ ] AC4: When I set a date range, only orders within that range appear
- [ ] AC5: When I apply multiple filters, results match all selected criteria
- [ ] AC6: When I click "Export CSV", a CSV file downloads containing all orders matching the current filters with columns: Title, Technician, Service Type, Location, Scheduled Date, Priority, Status
- [ ] AC7: When no orders match the filters, the CSV export button is disabled
- [ ] AC8: When I click "Clear all" next to the filters, all filters are reset and the full order list is displayed

## UI Behavior
- Filters appear in a horizontal toolbar, responsive and wrappable on smaller screens
- Active filters show a visual indicator (filled dropdown, highlighted chip)
- "Clear all" link appears when any filter is active
- CSV filename includes date: `service-orders-2026-03-28.csv`
- Toast confirms "CSV exported successfully" on download
- Filters persist when switching between Kanban and Calendar views

## Out of Scope
- Saved filter presets
- Export to PDF or Excel
- Advanced search / full-text search on order titles

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for filter bar component hierarchy and CSV export via `report-generator.ts`.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
