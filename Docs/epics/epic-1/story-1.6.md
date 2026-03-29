# Story 1.6: Protected Route Layout and Navigation Shell

**Epic:** Epic 1 — Authentication & User Management
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 5
**Status:** In Progress (PR #107)
**Branch:** `feature/IMS-25-protected-layout-shell`
**GitHub Issue:** #25

## User Story

As an authenticated user, I want a consistent navigation shell with a collapsible sidebar, header, and breadcrumbs, so that I can efficiently navigate the platform and always know where I am.

## Acceptance Criteria

- [x] AC1: When I log in successfully, I see a layout with a sidebar on the left, a fixed header at the top, and the page content area on the right
- [x] AC2: Sidebar opens/closes via hamburger toggle; slide-out panel with smooth animation
- [ ] AC3: When I hover over a sidebar icon in collapsed mode, I see a tooltip with the page name
- [x] AC4: Header shows route-derived page title with breadcrumb context
- [ ] AC5: When I click my avatar in the header, a dropdown appears with my name, email, role badge, theme toggle, and "Sign Out" option
- [x] AC6: When I resize the browser to mobile width (<768px), the sidebar converts to a hamburger menu overlay; clicking outside closes it
- [ ] AC7: When I collapse or expand the sidebar, my preference is remembered on next visit (persisted in localStorage)

## UI Behavior

- Sidebar contains navigation links: Dashboard, Inventory, Deployment, Compliance, Account/Service, Analytics
- Active page is highlighted with accent color in sidebar
- Header is fixed at 48px height with: logo (left), global search placeholder (center), notification bell, user avatar, and theme toggle (right)
- Sidebar collapse state persists across page reloads via localStorage
- Smooth 200ms transition on sidebar expand/collapse
- All navigation links use client-side routing (no full page reloads)

## Out of Scope

- Global search functionality (covered in a separate epic)
- Notification bell functionality (covered in Epic 2)
- Theme toggle implementation (light/dark)

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for ProtectedLayout component, navigation architecture, and design principles from Section 10.7.

## Implementation Notes

- Sidebar is a slide-out panel (not collapsible inline) with backdrop overlay
- Header: 56px height with hamburger toggle, route title, search placeholder, notification bell, user avatar
- Sign-in: dark full-page with centered 400px white card
- Skeleton loading state during auth check
- Nav groups: Main (Dashboard, Inventory) and Operations (Deployment, Compliance, Service Orders, Analytics)
- Active nav item: orange left indicator bar + orange text on orange-50 bg

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
