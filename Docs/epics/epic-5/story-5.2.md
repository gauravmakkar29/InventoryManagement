# Story 5.2: Calendar View for Service Orders

**Epic:** Epic 5 — Account & Service Orders
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 5

## User Story
As an operations manager, I want to view service orders on a monthly calendar, so that I can see the scheduling distribution and plan technician workloads for the upcoming weeks.

## Acceptance Criteria
- [ ] AC1: When I click the "Calendar" toggle in the view switcher (Kanban / Calendar), I see a monthly calendar grid with day-of-week headers
- [ ] AC2: Days with scheduled service orders show colored dots or small blocks indicating the number and priority of orders (red=High, amber=Medium, green=Low)
- [ ] AC3: When I click on a day cell, a popover appears listing the service orders for that day with title, technician, and priority
- [ ] AC4: When I click the left arrow, the calendar navigates to the previous month; right arrow navigates to the next month
- [ ] AC5: When I click the "Today" button, the calendar returns to the current month with today's date highlighted
- [ ] AC6: When a month has no service orders, the calendar shows the grid with no dots and a subtle "No orders this month" message
- [ ] AC7: As a Technician, the calendar shows only my assigned orders

## UI Behavior
- Calendar grid fills the content area width with 7 equal-width columns (Mon-Sun)
- Today's date cell has an accent border/background highlight
- Days outside the current month are dimmed
- Popover shows a compact list of orders with clickable titles
- View toggle is a segmented control at the top of the page (Kanban | Calendar)
- Switching views preserves any active filters

## Out of Scope
- Week view or day view
- Drag-and-drop rescheduling on the calendar
- Recurring service orders
- Integration with external calendars (Google Calendar, Outlook)

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for `listServiceOrdersByDate` query (GSI2), calendar component hierarchy, and priority color coding.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
