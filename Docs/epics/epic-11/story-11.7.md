# Story 11.7: Firmware Card Grid with Filters

**Epic:** Epic 11 — Aegis Phase 1 (Firmware Security)
**Persona:** Raj (Operations Manager)
**Priority:** Medium
**Story Points:** 3

## User Story
As an Operations Manager, I want to browse firmware packages in a card grid with status and model filters, so that I can quickly find firmware that needs my attention for testing or review.

## Acceptance Criteria
- [ ] AC1: When I navigate to the Deployment page Firmware tab, I see firmware displayed as cards in a responsive grid layout
- [ ] AC2: When the page loads, each firmware card shows: name, version, device model, approval stage indicator, status badge, file size, and release date
- [ ] AC3: When I select a status filter (Active, Deprecated, Pending), only firmware with that status is displayed
- [ ] AC4: When I select a device model filter, only firmware for that model is displayed
- [ ] AC5: When I combine status and model filters, both filters apply simultaneously
- [ ] AC6: When no firmware matches the active filters, a message reads "No firmware found matching the selected filters"
- [ ] AC7: When I click the "Deprecate" button on an Active firmware card, its status changes to "Deprecated"

## UI Behavior
- Firmware cards are displayed in a 2-3 column responsive grid (1 column on mobile)
- Each card is compact with clear information hierarchy: name/version at top, stage indicator in middle, metadata at bottom
- Status badge: Active = green, Deprecated = gray, Pending = amber
- Filter controls are positioned above the card grid (dropdowns or pill buttons)
- "Deprecate" button is a destructive-styled secondary button (red outline)
- Deprecate action shows a confirmation dialog before proceeding
- Cards use subtle hover effect (slight shadow increase)

## Out of Scope
- Firmware upload (covered in Story 11.1)
- Stage transitions (covered in Story 11.2)
- Firmware deletion
- List/table view alternative to grid view

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for FirmwareCardGrid component hierarchy and listFirmware query.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
