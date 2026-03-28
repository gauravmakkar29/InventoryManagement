# Story 3.2: Device Table Pagination and CSV Export

**Epic:** Epic 3 — Inventory & Device Management
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 3

## User Story
As an operations manager, I want paginated device results and the ability to export to CSV, so that I can work efficiently with large inventories and share data with stakeholders.

## Acceptance Criteria
- [ ] AC1: When the device list contains more than 6 items, the table shows only 6 rows per page with pagination controls below
- [ ] AC2: The pagination area displays "Showing 1-6 of 43" (or appropriate range and total)
- [ ] AC3: When I click "Next", the next 6 devices load; when I click "Previous", the prior 6 devices load
- [ ] AC4: When I am on the first page, the "Previous" button is disabled; when on the last page, "Next" is disabled
- [ ] AC5: When I click the "Export CSV" button, a CSV file downloads containing all devices matching the current filters (not just the current page)
- [ ] AC6: The CSV file includes headers matching the table columns: Device Name, Serial Number, Model, Status, Location, Health Score
- [ ] AC7: When no devices match the current filters, the "Export CSV" button is disabled

## UI Behavior
- Pagination controls are centered below the table
- Export CSV button is in the toolbar row alongside search/filters (right-aligned)
- CSV filename includes the current date (e.g., `devices-2026-03-28.csv`)
- A brief toast confirms "CSV exported successfully" on download

## Out of Scope
- Server-side pagination with cursor tokens (client-side pagination for POC)
- Export to PDF or Excel formats
- Scheduled/automated exports

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for pagination configuration (6 items/page), CSV export via `report-generator.ts`, and `nextToken` pattern for future server-side pagination.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
