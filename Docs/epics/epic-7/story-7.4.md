# Story 7.4: Deployment Trend & Vulnerability Charts

**Epic:** Epic 7 — Analytics & Reporting
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 3

## User Story

As an Operations Manager, I want to see a weekly deployment trend chart and a vulnerability severity bar chart, so that I can track deployment velocity and understand the current vulnerability landscape for client presentations.

## Acceptance Criteria

- [x] AC1: When I view the Analytics page, I see a "Deployment Trend" SVG bar chart showing monthly deployments for 6 months
- [x] AC2: When I view the Analytics page, I see a "Vulnerability Breakdown" horizontal bar chart showing counts by severity (Critical, High, Medium, Low, Info)
- [x] AC3: Time range filter state is wired (data refresh deferred to API integration)
- [x] AC4: Each bar displays its count value inline
- [x] AC5: Severity bars are color-coded (Critical=red, High=orange, Medium=amber, Low=green, Info=gray)
- [ ] AC6: When there are no firmware records, the chart shows "No deployment data" message (deferred to API integration)

## UI Behavior

- Two charts displayed side-by-side below the pie charts in a 2-column grid (stacked on mobile)
- Deployment Trend: X-axis = weeks (e.g., "W12", "W13"), Y-axis = deployment count. Blue line/bars
- Vulnerability chart: Horizontal or vertical bars, color-coded by severity (Critical=red, High=orange, Medium=amber, Low=green)
- Charts rendered using Recharts LineChart/BarChart components
- Both charts have clear axis labels and grid lines

## Out of Scope

- Daily or monthly granularity options (only weekly in POC)
- Clicking a bar to filter to that severity level
- Vulnerability trend over time (this chart shows current snapshot only)

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for implementation details.

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
