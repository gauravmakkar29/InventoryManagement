# Story 8.2: Audit Log Date Range Query

**Epic:** Epic 8 — Audit Trail
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 3

## User Story
As a Platform Admin, I want to query audit logs by a specific date range, so that I can review all system changes that occurred during a particular period for compliance audits.

## Acceptance Criteria
- [ ] AC1: When I open the Audit Log tab on the Deployment page, I see date range picker controls (start date and end date)
- [ ] AC2: When I select a start date and end date, the audit log table refreshes to show only entries within that range
- [ ] AC3: When the date range returns more than 25 entries, the results are paginated with previous/next controls
- [ ] AC4: When I select a range with no audit entries, the table shows "No audit entries found for the selected date range"
- [ ] AC5: When the page first loads, the default date range is the last 30 days
- [ ] AC6: When I select an end date earlier than the start date, the search is not submitted and a validation message appears

## UI Behavior
- Two date picker inputs labeled "From" and "To" positioned above the audit log table
- Date pickers use the shadcn Calendar component within a Popover
- A "Search" or "Apply" button triggers the query (not auto-search on every date change)
- Results are sorted newest-first by default
- Pagination shows "Showing 1-25 of N" with previous/next buttons

## Out of Scope
- Filtering by user (covered in Story 8.3)
- Free-text search across audit log fields
- Exporting filtered results (covered in Story 8.5)

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for GSI2 query pattern and resolver logic.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
