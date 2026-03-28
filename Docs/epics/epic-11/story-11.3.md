# Story 11.3: Approval Stage Indicator

**Epic:** Epic 11 — Aegis Phase 1 (Firmware Security)
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 3

## User Story
As an Operations Manager, I want to see a visual indicator on each firmware card showing its current position in the approval pipeline, so that I can quickly identify which firmware needs attention and where it is in the process.

## Acceptance Criteria
- [ ] AC1: When I view a firmware card, I see a three-stage progress indicator showing: Uploaded, Testing, and Approved
- [ ] AC2: When a firmware is in the "Uploaded" stage, only the first stage circle is filled (green), and the remaining stages are gray outlines
- [ ] AC3: When a firmware is in the "Testing" stage, the first two stage circles are filled and connected by a green line, with the third stage gray
- [ ] AC4: When a firmware is "Approved", all three stages are filled green and connected by green lines
- [ ] AC5: When I hover over a completed stage, a tooltip shows who performed that action and when (e.g., "Uploaded by Sarah Chen on Mar 10, 2026")
- [ ] AC6: When the current (active) stage is displayed, it has a subtle pulse or highlight animation to draw attention

## UI Behavior
- Three circles connected by horizontal lines, displayed horizontally on the firmware card
- Each circle has a label below it: "Uploaded", "Testing", "Approved"
- Completed stages: green filled circle with a checkmark icon
- Current stage: blue filled circle with a subtle pulse animation
- Future stages: gray outline circle (empty)
- Connector lines: green between completed stages, gray for future connections
- Tooltips on completed stages show: performed by (user name) + date
- Component is compact enough to fit within a firmware card without dominating the layout

## Out of Scope
- Additional stages beyond the three defined (Uploaded/Testing/Approved)
- Clickable stages that trigger transitions (buttons are separate from the indicator)
- Rejected or failed state visualization

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for ApprovalStageIndicator component specification.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
