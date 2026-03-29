# Story 2.5: Notification Bell and Slide-Out Panel

**Epic:** Epic 2 — Dashboard & Executive Overview
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 8
**Status:** In Review (PR pending)
**Branch:** `feature/IMS-45-notification-bell`
**GitHub Issue:** #45

## User Story

As a platform user, I want a notification bell in the header with a slide-out panel, so that I can see important alerts without leaving my current page.

## Acceptance Criteria

- [x] AC1: Notification bell icon in header with red unread count badge (max "99+")
- [x] AC2: Click bell opens 360px slide-out panel from right
- [x] AC3: Notifications show severity icon (critical=red, warning=amber, info=blue, success=green), title, message (2-line clamp), timestamp
- [x] AC4: "Mark all as read" button clears all unread indicators
- [x] AC5: Unread notifications highlighted with orange-tinted background
- [x] AC6: Click notification navigates to source entity page and marks as read
- [x] AC7: Backdrop overlay closes panel on click outside

## Implementation Notes

- NotificationPanel component: 360px fixed slide-out with backdrop
- 7 mock notifications with varied severities
- useNotificationCount hook for header badge
- Severity config: icon, iconColor, bgColor per severity level
- Header updated with notification state and panel toggle
- Route meta extended with /user-management
- Includes all Epic 1 + Epic 2 stories as base

## Out of Scope

- Real-time WebSocket subscription for live updates
- Notification preferences / muting
- Notification grouping by category
- Push notifications (browser/mobile)

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
