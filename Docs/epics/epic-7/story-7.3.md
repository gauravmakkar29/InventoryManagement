# Story 7.3: Device & Compliance Status Pie Charts

**Epic:** Epic 7 — Analytics & Reporting
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 3

## User Story
As a Platform Admin, I want to see pie charts showing device status distribution and compliance status breakdown, so that I can quickly identify the proportion of online/offline devices and compliance health at a glance.

## Acceptance Criteria
- [ ] AC1: When I view the Analytics page, I see a "Device Status Distribution" pie chart showing segments for Online, Offline, and Maintenance
- [ ] AC2: When I view the Analytics page, I see a "Compliance Status" pie chart showing segments for Approved, Pending, and Deprecated
- [ ] AC3: When I hover over a pie segment, a tooltip shows the status name, count, and percentage
- [ ] AC4: When all devices have the same status, the pie chart shows a single full circle with that status color
- [ ] AC5: When there are no devices, the chart area shows an empty state message: "No device data available"
- [ ] AC6: When data is loading, the chart area displays a skeleton placeholder

## UI Behavior
- Two pie charts displayed side-by-side in a 2-column grid (stacked on mobile)
- Device Status colors: Online = green (#10b981), Offline = red (#ef4444), Maintenance = amber (#f59e0b)
- Compliance Status colors: Approved = green, Pending = amber, Deprecated = red
- Charts include a legend below or beside showing status name + count
- Charts are rendered using Recharts PieChart component
- Smooth 200ms transition animation when data updates

## Out of Scope
- Drill-down on click (clicking a pie segment does not navigate anywhere)
- Time range affecting pie charts (they always show current state)
- Donut chart variant

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for implementation details.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
