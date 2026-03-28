# Story 5.1: Kanban Board with Drag-and-Drop Status Transitions

**Epic:** Epic 5 — Account & Service Orders
**Persona:** Mike (Field Technician)
**Priority:** High
**Story Points:** 8

## User Story
As a field technician, I want to see my service orders on a Kanban board and drag them between columns to update their status, so that I can manage my workload visually and keep the team informed of progress.

## Acceptance Criteria
- [ ] AC1: When I navigate to `/account-service`, I see a Kanban board with 3 columns: "Scheduled", "In Progress", and "Completed"
- [ ] AC2: Each column displays service order cards showing: title, technician name, scheduled date, priority badge (color-coded), and service type tag
- [ ] AC3: When I drag a card from "Scheduled" to "In Progress", the card moves immediately and the order status is updated in the system
- [ ] AC4: When I drag a card from "In Progress" to "Completed", the card moves to the Completed column and a notification is sent to the assigning manager
- [ ] AC5: When the status update API fails after a drag, the card snaps back to its original column and I see an error toast "Failed to update order status"
- [ ] AC6: When a column has no orders, it shows "No orders in this stage" as a placeholder
- [ ] AC7: As a Technician, I only see my own assigned orders on the board; as an Admin or Manager, I see all orders
- [ ] AC8: Priority badges use: red for High, amber for Medium, green for Low

## UI Behavior
- Cards have a subtle shadow lift effect when picked up for dragging
- Drop zones highlight when a card is dragged over them
- Cards cannot be dragged backward (e.g., Completed back to In Progress) -- optional based on business rules
- Board columns take equal width across the content area
- Cards within each column are sorted by scheduled date (soonest first)

## Out of Scope
- Creating new service orders (covered in Story 5.3)
- Calendar view (covered in Story 5.2)
- Editing order details inline
- Custom Kanban column configuration

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for react-dnd configuration, `updateEntityStatus` mutation, and optimistic update pattern.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
