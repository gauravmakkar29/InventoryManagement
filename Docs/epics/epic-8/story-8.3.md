# Story 8.3: Audit Log User Filter

**Epic:** Epic 8 — Audit Trail
**Persona:** Sarah (Platform Admin)
**Priority:** Medium
**Story Points:** 3

## User Story

As a Platform Admin, I want to filter audit logs by a specific user, so that I can investigate all actions performed by a particular team member during a security review.

## Acceptance Criteria

- [x] AC1: When I view the Audit Log tab, I see a "Filter by User" input field alongside the date range filters
- [x] AC2: When I enter a user ID or email in the user filter and apply, the table shows only audit entries for that user
- [x] AC3: When I clear the user filter, the table returns to showing all audit entries for the selected date range
- [x] AC4: When the filtered results return no entries, the table shows "No audit entries found for this user"
- [x] AC5: When I am logged in as a Manager, I can access and use the user filter
- [x] AC6: When I am logged in as a Technician or Viewer, the Audit Log tab is not visible to me

## UI Behavior

- User filter is a text input with a search icon, positioned next to the date range pickers
- Input accepts user ID or email; query is triggered on form submit (not on every keystroke)
- When a user filter is active, a "Clear filter" badge or button appears next to the input
- The table columns remain: User, Action, Resource Type, Timestamp, IP Address, Status
- User column displays the user ID (email if available from the audit record)

## Out of Scope

- Autocomplete suggestions for user names/emails
- Filtering by action type (Created/Modified/Deleted)
- Filtering by resource type
- Combining user filter with other advanced filters

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for GSI4 query pattern (getAuditLogsByUser).

## Definition of Done

- [x] Code reviewed and approved
- [x] Unit tests passing (>=85% coverage on new code)
- [x] E2E tests passing
- [x] Compliance check green
