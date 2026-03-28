# Story 2.2: Quick Actions and Badge Counts

**Epic:** Epic 2 — Dashboard & Executive Overview
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 3

## User Story
As an operations manager, I want quick action links on the dashboard with pending item counts, so that I can jump directly to areas that need my attention.

## Acceptance Criteria
- [ ] AC1: When I view the Dashboard, I see 6 quick action links displayed below the KPI cards
- [ ] AC2: Each quick action shows a label, an icon, and a badge count of pending items for that module
- [ ] AC3: The "Pending Approvals" quick action shows a count badge (e.g., "3") reflecting firmware items awaiting approval
- [ ] AC4: When I click a quick action link, I am navigated to the corresponding page (e.g., clicking "Manage Deployments" goes to `/deployment`)
- [ ] AC5: When a module has zero pending items, the badge shows "0" in a neutral color (not hidden)
- [ ] AC6: When badge count data is loading, badges show a small spinner placeholder

## UI Behavior
- Quick actions are displayed in a 3x2 or 6-column grid (responsive)
- Each action is a card-like link with subtle hover state (background color change, 150ms transition)
- Badge counts use colored pills: red for items needing attention (>0), gray for zero
- Links include: View Inventory, Manage Deployments, Pending Approvals, Service Orders, Compliance Status, View Analytics

## Out of Scope
- Customizable quick actions (user cannot reorder or hide actions)
- Quick actions based on user role filtering (all 6 shown to all roles; page-level RBAC handles access)

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for quick action configuration and data derivation from parallel queries.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
