# Story 5.5: View Toggle Between Kanban and Calendar

**Epic:** Epic 5 — Account & Service Orders
**Persona:** Mike (Field Technician)
**Priority:** Medium
**Story Points:** 2

## User Story
As a field technician, I want to switch between Kanban and Calendar views of my service orders, so that I can see my workload organized by status or by schedule depending on what I need.

## Acceptance Criteria
- [ ] AC1: When I view the Account/Service page, I see a segmented control toggle with two options: "Kanban" and "Calendar"
- [ ] AC2: When I click "Kanban", the Kanban board is displayed (default view)
- [ ] AC3: When I click "Calendar", the monthly calendar view is displayed
- [ ] AC4: When I switch views, any active filters are preserved and applied to the new view
- [ ] AC5: When I switch views, the transition is smooth with no full page reload
- [ ] AC6: The last selected view is remembered when I navigate away and return to the page (persisted in component state for the session)

## UI Behavior
- Segmented control is positioned at the top-right of the page, aligned with the filter bar
- Active view option is highlighted with accent color
- Switching views has a subtle fade transition (150ms)
- View toggle works on all screen sizes

## Out of Scope
- Additional view modes (list view, timeline view)
- User preference persistence across sessions (localStorage)
- Split view showing both Kanban and Calendar simultaneously

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for ViewToggle component and view state management.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
