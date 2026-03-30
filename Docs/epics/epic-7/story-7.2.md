# Story 7.2: Time Range Filter

**Epic:** Epic 7 — Analytics & Reporting
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 2

## User Story

As an Operations Manager, I want to filter analytics data by time range (7 days, 30 days, or 90 days), so that I can analyze trends across different periods for client reporting.

## Acceptance Criteria

- [x] AC1: When I view the Analytics page, I see a segmented control with five options: Last 7 Days, Last 30 Days, Last 90 Days, Year to Date, and Custom
- [x] AC2: When the page first loads, the 30d option is selected by default
- [x] AC3: When I click a different time range option, the displayed label updates (mock — data refresh deferred to API integration)
- [ ] AC4: When I switch time ranges, a loading indicator appears on charts while data refreshes (deferred to API integration)
- [x] AC5: When I select 7d, the filter state updates and label reflects the selection

## UI Behavior

- Segmented control (three buttons in a pill group) positioned at the top of the analytics page, above the KPI cards
- Selected segment is visually highlighted (filled background, contrasting text)
- Unselected segments are muted (outline only)
- Switching is instant for the control UI; data loading shows spinners on affected sections

## Out of Scope

- Custom date range picker (only preset 7d/30d/90d)
- KPI card values changing with time range (KPIs always show current totals)
- Persisting selected time range across page navigations

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for implementation details.

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
