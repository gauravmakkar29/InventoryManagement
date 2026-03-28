# Story 13.1: Telemetry Data Ingestion & Display

**Epic:** Epic 13 — Environmental Heatmaps & Blast Radius
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 8

## User Story
As a Platform Admin, I want to see real-time telemetry data (temperature, CPU load, error rate) for each device, so that I can monitor device health proactively and identify failing equipment before it impacts operations.

## Acceptance Criteria
- [ ] AC1: When I navigate to a device detail view, I see a "Telemetry" section showing the latest readings (temperature, CPU load, memory usage, error rate, power output)
- [ ] AC2: When telemetry data is available, each metric displays with a color-coded indicator (green/amber/red based on threshold)
- [ ] AC3: When I select a time range (1h, 6h, 24h, 7d), a time-series chart updates to show historical telemetry for that device
- [ ] AC4: When a device has no telemetry data, I see a "No telemetry data available" empty state message
- [ ] AC5: When telemetry values exceed critical thresholds (e.g., temperature > 85C, CPU > 95%), the metric card displays a red warning badge
- [ ] AC6: When I click "Refresh", the telemetry data reloads with the latest readings

## UI Behavior
- Telemetry section appears below existing device info on the device detail view
- Metrics displayed as compact cards in a horizontal row: Temperature | CPU | Memory | Errors | Power
- Each card shows: current value, unit, trend arrow (up/down/stable vs. last reading), threshold indicator
- Time-series chart uses Recharts line chart with metric selector (toggle which metrics to display)
- Chart supports zoom via brush component for time range selection
- Loading state: skeleton placeholders for metric cards and chart area

## Out of Scope
- Telemetry ingestion API endpoint (covered in Story 13.2)
- Heatmap visualization (Story 13.3)
- Alerting on telemetry thresholds (future epic)

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for Telemetry entity data model and risk score computation.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
