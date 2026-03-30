# Story 14.6: Incident Dashboard & Metrics

**Epic:** Epic 14 — Incident Isolation & Lateral Movement
**Persona:** Raj (Operations Manager)
**Priority:** Low
**Story Points:** 3

## User Story

As an Operations Manager, I want to see incident metrics and summary statistics on the main dashboard, so that I have immediate awareness of active incidents, mean time to resolution, and current quarantine status without navigating to the full incidents page.

## Acceptance Criteria

- [x] AC1: When I open the Dashboard, I see an "Incidents" summary section showing: Open Incidents count, Devices Currently Isolated count, Active Quarantine Zones count
- [x] AC2: When there are Critical severity open incidents, the incidents count displays with a red pulsing indicator to draw attention
- [ ] AC3: When I click the "Open Incidents" count, I am navigated to the Incidents page filtered to Open status
- [x] AC4: When I view the Analytics page, a new "Incident Metrics" section shows: Mean Time to Contain (MTTC), Mean Time to Resolve (MTTR), and incidents by severity pie chart for the selected time range
- [x] AC5: When there are no open incidents, the dashboard section shows a green "All Clear" status indicator

## UI Behavior

- Incident summary section follows the existing dashboard card pattern (compact KPI cards)
- Critical incident indicator uses a subtle pulse animation (not distracting, 3-second cycle)
- Analytics incident metrics section appears as a new row of charts below existing analytics content
- MTTC and MTTR displayed as large numbers with trend arrows (improving/declining)
- Pie chart uses severity colors: Critical=red, High=orange, Medium=amber, Low=blue

## Out of Scope

- Incident trend line chart (over weeks/months)
- SLA tracking for incident response times
- Incident report export (PDF/CSV)

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for Incident entity and aggregation queries.

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
