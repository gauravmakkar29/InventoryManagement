# Story 15.5: Digital Twin Dashboard Integration

**Epic:** Epic 15 — Digital Twin
**Persona:** Raj (Operations Manager)
**Priority:** Medium
**Story Points:** 3

## User Story
As an Operations Manager, I want to see fleet-wide digital twin health metrics on the main dashboard and analytics page, so that I can monitor overall fleet health at a glance and track improvement trends over time.

## Acceptance Criteria
- [ ] AC1: When I open the Dashboard, the existing "Health Score" KPI card now pulls its value from the fleet-wide average digital twin health score (replacing the previous static or telemetry-only calculation)
- [ ] AC2: When I view the Analytics page, a "Fleet Health Distribution" chart shows a histogram of device health scores grouped by bucket (Critical: 0-40, Warning: 41-70, Healthy: 71-100)
- [ ] AC3: When I view the Analytics page, a "Health Factor Analysis" chart shows the average score for each of the 6 health factors across the entire fleet as a radar/spider chart
- [ ] AC4: When I click on a health bucket in the distribution chart, I am navigated to the Digital Twin dashboard filtered to that bucket
- [ ] AC5: When I select a time range on the Analytics page (7d/30d/90d), the fleet health trend line updates to show the average health score over that period

## UI Behavior
- Health Score KPI card on dashboard retains its existing compact design but now shows a "Twin" badge to indicate the data source
- Fleet Health Distribution uses a Recharts BarChart with 3 bars (Critical=red, Warning=amber, Healthy=green), device counts on Y-axis
- Health Factor Analysis uses a Recharts RadarChart with 6 axes labeled by factor name
- Fleet health trend uses a Recharts AreaChart with the same gradient fill as the individual device trend
- Charts are responsive and stack vertically on mobile viewports

## Out of Scope
- Per-customer fleet health breakdown
- Health score predictions/forecasting
- Exporting fleet health reports

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for DigitalTwin entity and health score aggregation via OpenSearch.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
