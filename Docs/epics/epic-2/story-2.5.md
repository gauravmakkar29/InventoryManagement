# Story 2.5: Notification Bell and Slide-Out Panel

**Epic:** Epic 2 — Dashboard & Executive Overview
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 8

## User Story
As a platform admin, I want a notification bell in the header that shows unread alerts with a slide-out panel, so that I am immediately aware of critical events like firmware approvals and device outages without having to check each page.

## Acceptance Criteria
- [ ] AC1: When I am on any page, I see a bell icon in the header with a red badge showing my unread notification count (e.g., "3")
- [ ] AC2: When I have no unread notifications, the badge is hidden and the bell icon appears in its default state
- [ ] AC3: When I click the bell icon, a slide-out panel (360px wide) opens from the right showing my recent notifications
- [ ] AC4: Each notification displays: severity icon (red=critical, amber=warning, blue=info), title, message, and relative timestamp
- [ ] AC5: When I click a notification item, I am navigated to the source entity (e.g., clicking "FW v3.2.1 approved" navigates to the Deployment page) and the notification is marked as read
- [ ] AC6: When I click "Mark all as read", all unread notifications are marked as read and the badge count resets to zero
- [ ] AC7: When a new notification arrives while I am using the app, the badge count increments in real time without a page refresh
- [ ] AC8: When the unread count exceeds 99, the badge shows "99+"

## UI Behavior
- Bell icon is positioned in the fixed header, to the left of the user avatar
- Panel uses the Sheet component (shadcn/ui), slides from right with overlay
- Notifications are sorted by most recent first
- Critical notifications have a red left-border accent
- Panel header shows "Notifications" title and "Mark all as read" button
- Empty state: "No notifications" with a muted icon
- Panel footer: "View All" link (future: dedicated notifications page)

## Out of Scope
- Notification preferences/settings (choosing which notification types to receive)
- Email or SMS notifications
- Notification grouping/batching
- Dedicated full-page notifications view

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for Notification entity model, API operations, WebSocket subscription, and panel UI specification.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
