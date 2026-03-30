# Story 3.2: Device Table Pagination and CSV Export

**Epic:** Epic 3 — Inventory & Device Management
**Priority:** High
**Story Points:** 3
**Status:** In Review (PR pending)
**Branch:** `feature/IMS-59-pagination-csv-export`
**GitHub Issue:** #59

## Acceptance Criteria

- [x] AC1: Pagination: 6 items per page with page number buttons
- [x] AC2: "Showing X–Y of Z" pagination info
- [x] AC3: Previous/Next buttons with disabled states at boundaries
- [x] AC4: CSV export of ALL filtered results (not just current page)
- [x] AC5: CSV includes all table columns
- [x] AC6: Export button disabled when no data
- [x] AC7: Toast confirmation on download

## Implementation Notes

- PAGE_SIZE=6, active page orange, inactive gray
- CSV generated client-side via Blob + download link
- Export button with Download icon in filter bar

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
