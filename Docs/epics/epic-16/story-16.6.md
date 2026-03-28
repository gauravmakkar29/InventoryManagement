# Story 16.6: Accessibility & WCAG 2.1 AA Compliance

**Epic:** Epic 16 — Dual-Theme UI, Connectivity & KPI
**Persona:** Lisa (Compliance Auditor)
**Priority:** Medium
**Story Points:** 5

## User Story
As a Compliance Auditor who relies on assistive technology, I want the platform to meet WCAG 2.1 Level AA accessibility standards, so that I can navigate, read, and interact with all compliance data using a screen reader and keyboard alone.

## Acceptance Criteria
- [ ] AC1: When I navigate the platform using only the keyboard (Tab, Shift+Tab, Enter, Escape, Arrow keys), I can reach and activate every interactive element including: sidebar links, table rows, form inputs, buttons, modals, and dropdowns
- [ ] AC2: When I focus on any interactive element, a visible focus ring (2px solid accent color) appears that meets the 3:1 contrast requirement against adjacent colors in both light and dark themes
- [ ] AC3: When I use a screen reader, all KPI cards announce their value, label, and trend (e.g., "1,247 Total Devices, up 2.3 percent")
- [ ] AC4: When I view a chart (pie, bar, line), an accessible data table alternative is available via a "View as table" link below the chart
- [ ] AC5: When the connectivity status changes (service goes down or recovers), a screen reader announces the change via an ARIA live region without requiring page refresh
- [ ] AC6: When I have "Reduce Motion" enabled in my OS settings, all CSS transitions and animations are disabled or replaced with instant state changes
- [ ] AC7: When I zoom the browser to 200%, the layout remains usable with no horizontal scroll on the main content area and no overlapping text
- [ ] AC8: When I use the color theme, all text meets 4.5:1 contrast ratio against its background in both light and dark modes

## UI Behavior
- Focus ring style: 2px solid with `var(--ring)` color, 2px offset, visible in both themes
- Skip-to-content link appears on first Tab press, hidden visually until focused
- All form inputs have associated `<label>` elements (not placeholder-only labels)
- Modal dialogs trap focus (Tab cycles within modal, Escape closes)
- Data tables use proper `<th scope="col">` headers and `aria-sort` on sortable columns
- Chart alternatives render as a simple `<table>` with the same data
- Pagination announces current state: "Page 2 of 7, showing items 7 through 12"

## Out of Scope
- WCAG AAA compliance (only AA required)
- Screen reader testing on all combinations (test on NVDA + Chrome, VoiceOver + Safari)
- Automated accessibility CI testing (manual audit for this story)

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for accessibility requirements table and WCAG implementation details.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
