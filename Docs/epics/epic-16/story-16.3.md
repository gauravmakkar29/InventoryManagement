# Story 16.3: KPI Dashboard with Server-Side Aggregations

**Epic:** Epic 16 — Dual-Theme UI, Connectivity & KPI
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 8

## User Story
As an Operations Manager, I want the dashboard KPIs and analytics charts to be powered by server-side aggregations instead of client-side computation, so that the dashboard loads faster, handles large datasets efficiently, and shows accurate real-time numbers.

## Acceptance Criteria
- [ ] AC1: When I open the Dashboard, 4 KPI cards load within 2 seconds showing: Total Devices, Active Deployments, Pending Approvals, and Fleet Health Score — all computed server-side
- [ ] AC2: When I view each KPI card, it shows the current value, a trend indicator (up/down/stable arrow with percentage change vs. previous period), and is color-coded by status
- [ ] AC3: When I click a KPI card, I am navigated to the relevant page (e.g., clicking "Total Devices" goes to /inventory, clicking "Pending Approvals" goes to /deployment)
- [ ] AC4: When I open the Analytics page, pie charts (device status distribution, compliance status distribution) and bar/line charts (deployment trend, vulnerability severity) are all rendered from server-side aggregation data
- [ ] AC5: When I change the time range selector (7d / 30d / 90d), all analytics charts update to reflect the selected period
- [ ] AC6: When I click the "Refresh" button on the dashboard, all KPI values and charts reload with fresh server-side data
- [ ] AC7: When the Quick Actions section loads, each action link shows an accurate badge count (e.g., "Pending Approvals: 3", "Open Incidents: 2") sourced from server-side counts

## UI Behavior
- KPI cards are compact (max 160px wide, 80px tall), arranged in a single horizontal row that wraps on small screens
- Trend indicator: green up arrow for positive change, red down arrow for negative, gray dash for no change
- Analytics charts use Recharts components: PieChart, BarChart, LineChart, AreaChart
- Time range selector is a segmented control (pill buttons: 7d | 30d | 90d)
- Loading state: KPI cards show skeleton shimmer, charts show skeleton placeholder rectangles
- Error state: individual cards/charts show "Unable to load" with retry link (other cards remain functional)
- All charts respect the active theme (light/dark) for axis colors, grid lines, and tooltips

## Out of Scope
- Custom KPI definitions (users cannot add/remove KPI cards)
- Real-time streaming updates (refreshes on load and manual refresh)
- Drill-down from chart segments to filtered data views

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for KPI data sources, aggregation query mapping, and dashboard layout specification.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
