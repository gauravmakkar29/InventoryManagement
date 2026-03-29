# Story 2.2: Quick Actions and Badge Counts

**Epic:** Epic 2 — Dashboard & Executive Overview
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 3
**Status:** In Review (PR pending)
**Branch:** `feature/IMS-41-system-status-indicators`
**GitHub Issue:** #34

## User Story

As an operations manager, I want quick action links with badge counts on the dashboard, so that I can jump to pending tasks without navigating through menus.

## Acceptance Criteria

- [x] AC1: 6 quick action tiles: Register Device, New Deployment, Pending Reviews, Service Orders, View Reports, Manage Users
- [x] AC2: Red badge with pending count (>0) on tiles with pending items
- [x] AC3: Tiles link to corresponding pages
- [x] AC4: 3-column grid within card

## Implementation Notes

- Static mock badge counts
- Red pill badge positioned absolute top-right of tile
- Icons from lucide-react matching each action

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
