# Story 2.3: Recent Alerts Panel

**Epic:** Epic 2 — Dashboard & Executive Overview
**Persona:** Sarah (Platform Admin)
**Priority:** Medium
**Story Points:** 3

## User Story
As a platform admin, I want to see recent audit log entries on the dashboard, so that I can quickly spot unusual activity without navigating to a separate audit page.

## Acceptance Criteria
- [ ] AC1: When I view the Dashboard, I see a "Recent Alerts" panel showing audit log entries from the last 24 hours
- [ ] AC2: Each alert entry displays: user name, action performed (Created/Modified/Deleted), resource type, and relative timestamp (e.g., "2 hours ago")
- [ ] AC3: When I click an alert entry, I am navigated to the source entity's detail page (e.g., clicking a firmware modification alert navigates to the Deployment page)
- [ ] AC4: When there are no audit entries in the last 24 hours, the panel shows "No recent activity"
- [ ] AC5: The panel shows a maximum of 10 entries, with a "View All" link that navigates to the full Audit Log tab on the Deployment page
- [ ] AC6: When the audit log query fails, the panel shows "Unable to load alerts" with a retry button

## UI Behavior
- Panel is positioned below the Quick Actions section
- Entries are displayed as a compact list with subtle dividers between items
- Each entry has an action icon (green for Created, amber for Modified, red for Deleted)
- Relative timestamps update on page load only (not live-updating)
- "View All" link at the bottom of the panel

## Out of Scope
- Real-time streaming of new audit entries
- Filtering alerts by type or severity within the dashboard panel
- Alert dismissal / acknowledgment

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for `listAuditLogs` query usage and audit log entity structure.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
