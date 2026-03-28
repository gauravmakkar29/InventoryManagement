# Story 15.1: Digital Twin Overview & Health Scoring

**Epic:** Epic 15 — Digital Twin
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 8

## User Story
As an Operations Manager, I want to see a digital twin view for each device showing a composite health score broken down by contributing factors, so that I can quickly assess which devices need attention and understand why their health is degraded.

## Acceptance Criteria
- [ ] AC1: When I navigate to a device's detail view, I see a "Digital Twin" tab alongside existing tabs
- [ ] AC2: When I open the Digital Twin tab, I see a circular health score gauge (0-100) color-coded: red (0-40), amber (41-70), green (71-100)
- [ ] AC3: When I view the health score breakdown, I see 6 contributing factors (Firmware Age, Vulnerability Exposure, Uptime, Telemetry Health, Compliance, Incident History) each displayed as a horizontal bar with an individual score
- [ ] AC4: When I view the Digital Twin dashboard page (/digital-twin), I see a grid of all device twin cards sortable by health score (ascending/descending)
- [ ] AC5: When I filter the twin dashboard by health bucket (Critical / Warning / Healthy), only matching devices are displayed
- [ ] AC6: When I click on a twin card, I am navigated to that device's Digital Twin tab
- [ ] AC7: When a device's health score changes by more than 10 points since the last sync, a "Health Change" badge appears on the twin card showing the delta

## UI Behavior
- Health score gauge is a circular donut chart (Recharts) with the score number in the center and the color fill representing the percentage
- Health factor bars are horizontal progress bars in a compact vertical list, each labeled with the factor name, score, and a small trend arrow
- Twin dashboard uses a responsive grid layout (3 columns on desktop, 2 on tablet, 1 on mobile)
- Each twin card shows: device name, model, health gauge (small), top risk factor, last synced timestamp
- Sorting controls appear above the grid as a dropdown: "Sort by: Health Score / Device Name / Last Synced"
- Loading state: skeleton cards while data loads

## Out of Scope
- Health score trend chart over time (Story 15.2)
- Firmware simulation (Story 15.3)
- Config drift analysis (Story 15.4)

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for DigitalTwin entity, HealthFactors breakdown, and health score computation formula.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
