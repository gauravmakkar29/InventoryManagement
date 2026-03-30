# Story 5.3: Create Service Order

**Epic:** Epic 5 — Account & Service Orders
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 5

## User Story

As an operations manager, I want to create new service orders and assign them to technicians, so that maintenance work is formally scheduled and tracked.

## Acceptance Criteria

- [x] AC1: When I am an Admin or Manager, I see a "Create Order" button above the Kanban/Calendar view (RBAC via getPrimaryRole + canPerformAction)
- [x] AC2: When I click "Create Order", a modal opens with a form containing: Title, Description, Technician (dropdown), Service Type (radio: Internal / 3rd Party), Location, Scheduled Date (date input), Priority (dropdown), and Customer
- [x] AC3: The Technician dropdown is populated with mock technician list
- [x] AC4: When I submit the form with all required fields filled, the service order is created with status "Scheduled" and appears on the Kanban board
- [x] AC5: When I submit with missing required fields, validation blocks submission with error toast
- [ ] AC6: When the scheduled date is in the past, a validation error shows "Scheduled date must be today or later" — deferred to form enhancement
- [x] AC7: When creation succeeds, the modal closes and a success toast appears
- [x] AC8: When I am a Technician or Viewer, the "Create Order" button is not visible

## UI Behavior

- Modal uses Dialog component with react-hook-form for validation
- Required fields marked with red asterisk
- Date picker prevents selection of past dates
- Service Type uses radio buttons (Internal / 3rd Party)
- Priority uses a dropdown with color-coded options
- Customer dropdown is searchable for large customer lists
- Cancel button closes modal without saving; no confirmation needed if form is empty

## Out of Scope

- Editing existing service orders
- Deleting service orders
- Recurring/templated orders
- Attaching files or notes to orders

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for `createServiceOrder` mutation, form field definitions, and validation rules.

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
