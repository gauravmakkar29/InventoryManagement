# Story 15.2: Health Score Trend & State Replay

**Epic:** Epic 15 — Digital Twin
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 8

## User Story
As an Operations Manager, I want to view a device's health score history over time and replay its past states, so that I can investigate when and why a device's health degraded and perform root cause analysis.

## Acceptance Criteria
- [ ] AC1: When I view a device's Digital Twin tab, I see a health score trend line chart showing the score over time for the selected range (7d / 30d / 90d / 180d)
- [ ] AC2: When I hover over a point on the trend chart, a tooltip shows the exact health score, timestamp, and any significant event that occurred (e.g., "Firmware updated", "Incident created")
- [ ] AC3: When I click "State Replay" below the trend chart, a horizontal timeline appears with markers at each state snapshot point
- [ ] AC4: When I click a snapshot marker on the timeline, a state card appears showing the device's full state at that point in time: firmware version, config hash, health score, health factors, status, and telemetry summary
- [ ] AC5: When I select two snapshot markers, a "Compare" button becomes enabled; clicking it opens a side-by-side comparison view highlighting all differences between the two states
- [ ] AC6: When I use the playback controls (play/pause/step forward/step back), the state card updates to show each snapshot in chronological order with a 2-second interval between steps
- [ ] AC7: When a device has fewer than 2 snapshots, the "Compare" button is disabled with a tooltip explaining "Need at least 2 snapshots to compare"

## UI Behavior
- Trend chart uses Recharts AreaChart with gradient fill (green to red based on score zones)
- Timeline is a horizontal bar at the bottom of the trend chart with circular markers
- State card is a structured panel showing: key-value pairs grouped by category (Device, Firmware, Health, Telemetry)
- Comparison view uses a two-column layout with red/green highlighting for changed values (red = degraded, green = improved)
- Playback controls: play/pause button, step forward/back arrows, speed selector (1x/2x/4x)
- Active snapshot marker is highlighted with a larger circle and connected to the state card by a vertical dashed line

## Out of Scope
- Automated root cause analysis (suggesting why health declined)
- Exporting state replay as a video or report
- Real-time state streaming

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for TwinStateSnapshot entity, state replay mechanism, and `getTwinStateHistory` query.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
