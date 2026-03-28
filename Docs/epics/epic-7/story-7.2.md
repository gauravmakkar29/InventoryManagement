# Story 7.2: Time Range Filter

**Epic:** Epic 7 — Analytics & Reporting
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 2

## User Story
As an Operations Manager, I want to filter analytics data by time range (7 days, 30 days, or 90 days), so that I can analyze trends across different periods for client reporting.

## Acceptance Criteria
- [ ] AC1: When I view the Analytics page, I see a segmented control with three options: 7d, 30d, and 90d
- [ ] AC2: When the page first loads, the 30d option is selected by default
- [ ] AC3: When I click a different time range option, all charts and the audit log table refresh to show data for the selected period
- [ ] AC4: When I switch time ranges, a loading indicator appears on charts while data refreshes
- [ ] AC5: When I select 7d, only data from the last 7 days is displayed in charts and the audit log

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
