# Story 8.4: Audit Log Table Display

**Epic:** Epic 8 — Audit Trail
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 3

## User Story

As an Operations Manager, I want to view audit log entries in a well-organized data table on the Deployment page, so that I can review the history of firmware and system changes with my team.

## Acceptance Criteria

- [x] AC1: When I navigate to the Deployment page and click the "Audit Log" tab, I see a data table of audit entries
- [x] AC2: When the table loads, it displays columns: User, Action, Resource Type, Timestamp, IP Address, and Status
- [x] AC3: When I view the Action column, each action is displayed as a colored badge (Created = blue, Modified = amber, Deleted = red)
- [x] AC4: When I view the Timestamp column, dates are formatted in a human-readable locale format (e.g., "Mar 15, 2026, 10:30 AM")
- [x] AC5: When I click a column header, the table sorts by that column (ascending/descending toggle)
- [x] AC6: When data is loading, the table shows skeleton row placeholders
- [x] AC7: When an error occurs fetching audit logs, an error message with retry button is shown in place of the table

## UI Behavior

- Table follows the enterprise data-dense design: compact rows, no excessive padding
- Status column shows a green "Success" badge for all entries
- Resource Type column shows the entity type (e.g., "Device", "Firmware", "ServiceOrder")
- Table header is sticky when scrolling vertically
- Table uses the shadcn DataTable component with sorting capability
- Maximum table height with scroll, or pagination to keep the page manageable

## Out of Scope

- Inline editing of audit entries (audit logs are immutable)
- Clicking a row to navigate to the changed resource
- Real-time updates as new audit entries are created

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for component hierarchy and data fetching pattern.

## Definition of Done

- [x] Code reviewed and approved
- [x] Unit tests passing (>=85% coverage on new code)
- [x] E2E tests passing
- [x] Compliance check green
