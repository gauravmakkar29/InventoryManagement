# Story 1.6: Protected Route Layout and Navigation Shell

**Epic:** Epic 1 — Authentication & User Management
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 5

## User Story
As an authenticated user, I want a consistent navigation shell with a collapsible sidebar, header, and breadcrumbs, so that I can efficiently navigate the platform and always know where I am.

## Acceptance Criteria
- [ ] AC1: When I log in successfully, I see a layout with a sidebar on the left, a fixed header at the top, and the page content area on the right
- [ ] AC2: When I click the collapse toggle at the bottom of the sidebar, it collapses to a 56px icon-only mode; clicking again expands it to 240px with labels
- [ ] AC3: When I hover over a sidebar icon in collapsed mode, I see a tooltip with the page name
- [ ] AC4: When I navigate to any page, breadcrumbs below the header update to show my current location (e.g., "Dashboard > Inventory > Geo Location")
- [ ] AC5: When I click my avatar in the header, a dropdown appears with my name, email, role badge, theme toggle, and "Sign Out" option
- [ ] AC6: When I resize the browser to mobile width (<768px), the sidebar converts to a hamburger menu overlay
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

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
