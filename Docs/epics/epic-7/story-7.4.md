# Story 7.4: Deployment Trend & Vulnerability Charts

**Epic:** Epic 7 — Analytics & Reporting
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 3

## User Story
As an Operations Manager, I want to see a weekly deployment trend chart and a vulnerability severity bar chart, so that I can track deployment velocity and understand the current vulnerability landscape for client presentations.

## Acceptance Criteria
- [ ] AC1: When I view the Analytics page, I see a "Weekly Deployment Trend" line or bar chart showing firmware deployments grouped by week
- [ ] AC2: When I view the Analytics page, I see a "Top Vulnerabilities" bar chart showing vulnerability counts by severity (Critical, High, Medium, Low)
- [ ] AC3: When I change the time range filter, the deployment trend chart updates to show only data within the selected period
- [ ] AC4: When I hover over a data point on the trend chart, a tooltip shows the week label and deployment count
- [ ] AC5: When I hover over a bar in the vulnerability chart, a tooltip shows the severity level and count
- [ ] AC6: When there are no firmware records in the time range, the deployment trend chart shows a "No deployment data" message

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
