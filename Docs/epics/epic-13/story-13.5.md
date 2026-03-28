# Story 13.5: Risk Simulation Tool

**Epic:** Epic 13 — Environmental Heatmaps & Blast Radius
**Persona:** Raj (Operations Manager)
**Priority:** Medium
**Story Points:** 5

## User Story
As an Operations Manager, I want to run what-if failure simulations by selecting a device and failure type, so that I can model the potential impact of device failures and prepare contingency plans before incidents occur.

## Acceptance Criteria
- [ ] AC1: When I click "Run Simulation" from the blast radius side panel, a simulation dialog opens with parameter inputs
- [ ] AC2: When I configure a simulation (select failure type: Power Loss / Network Failure / Overheating / Firmware Crash, set radius, and set severity), I can click "Simulate" to run the scenario
- [ ] AC3: When the simulation completes, the results panel displays: number of affected devices, estimated cascade risk, projected downtime per device, and an overall impact rating
- [ ] AC4: When I view simulation results, affected devices are listed with their individual estimated impact (downtime minutes, risk score change)
- [ ] AC5: When I click "Save Simulation", the result is persisted and appears in the simulation history table
- [ ] AC6: When I navigate to the simulation history view, I see a table of past simulations with columns: date, origin device, failure type, affected count, risk level, and a "View" action to re-display the results on the map

## UI Behavior
- Simulation dialog is a modal (560px wide) with a form: device selector (pre-filled if launched from blast radius), failure type dropdown, radius input, severity slider
- Results panel replaces the blast radius side panel content with simulation-specific data
- Impact rating displayed as a large badge: Critical (red), High (orange), Medium (amber), Low (green)
- Simulation history is accessible via a "History" tab in the blast radius / simulation panel
- History table supports sorting by date and filtering by risk level
- A "Compare" checkbox lets the user select two simulations and view them side-by-side on the map (two overlapping circles in different colors)

## Out of Scope
- Automated scheduled simulations (cron-based)
- Simulation based on real-time telemetry triggers
- PDF export of simulation reports

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for `runBlastRadiusSimulation` mutation and BlastRadiusResult entity.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
