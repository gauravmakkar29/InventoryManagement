# Story 7.5: Audit Log Table on Analytics Page

**Epic:** Epic 7 — Analytics & Reporting
**Persona:** Sarah (Platform Admin)
**Priority:** Medium
**Story Points:** 3

## User Story
As a Platform Admin, I want to view recent audit log entries in a table on the Analytics page, so that I can review system activity and changes without navigating to the Deployment page.

## Acceptance Criteria
- [ ] AC1: When I view the Analytics page, I see an "Audit Log" section below the charts with a data table
- [ ] AC2: When the table loads, it shows audit log entries for the selected time range with columns: User, Action, Resource Type, Timestamp, IP Address, and Status
- [ ] AC3: When I type in the search filter above the table, the visible rows filter to match the search text across all columns
- [ ] AC4: When there are more than 25 entries, the table shows pagination controls (previous/next) with a count label like "Showing 1-25 of 142"
- [ ] AC5: When I am a Technician or Viewer, the audit log section is not visible to me
- [ ] AC6: When there are no audit logs in the selected time range, the table shows "No audit entries found for this period"

## UI Behavior
- Audit log section has a header "Audit Log" with an optional subtitle showing the date range
- Table columns are sortable by clicking column headers (at minimum, Timestamp sortable)
- Action column shows colored badges: Created = blue, Modified = amber, Deleted = red
- Status column shows a green "Success" badge
- Timestamps formatted in the user's locale (e.g., "Mar 15, 2026, 10:30 AM")
- Table rows are compact (enterprise data density)

## Out of Scope
- Filtering by specific user (covered in Epic 8 audit trail stories)
- Editing or deleting audit log entries (audit logs are immutable)
- Real-time streaming of new audit entries

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for implementation details.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
