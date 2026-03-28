# Story 15.3: Firmware Upgrade Simulation

**Epic:** Epic 15 — Digital Twin
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 8

## User Story
As a Platform Admin, I want to simulate a firmware upgrade on a device's digital twin before deploying it, so that I can preview the impact on health score, identify new vulnerabilities, and assess rollback risk without affecting the real device.

## Acceptance Criteria
- [ ] AC1: When I open a device's Digital Twin tab, I see a "Simulate Upgrade" button in the actions area
- [ ] AC2: When I click "Simulate Upgrade", a dialog opens showing the current firmware version and a dropdown to select the target firmware version (filtered to compatible models)
- [ ] AC3: When I run the simulation, a results panel displays: compatibility status (Compatible / Incompatible / Compatible with Warnings), predicted health score change (e.g., "+12 points"), estimated downtime, and rollback risk (Low/Medium/High)
- [ ] AC4: When the simulation shows warnings, each warning is listed with a description (e.g., "Config key network.dns.primary deprecated in target version")
- [ ] AC5: When the simulation identifies vulnerability changes, I see two lists: "Vulnerabilities Resolved" (CVEs fixed by upgrade) and "Vulnerabilities Introduced" (new CVEs in target firmware), each with severity badges
- [ ] AC6: When I click "Save Simulation", the result is persisted and appears in the simulation history list accessible from the twin detail view
- [ ] AC7: When the target firmware is incompatible (model mismatch), the simulation immediately returns an "Incompatible" status without running the full analysis, with a clear explanation

## UI Behavior
- Simulation dialog is a modal (640px wide) with: current firmware card (left) and target firmware selector (right)
- Results panel replaces the dialog content after simulation completes (back button to re-run)
- Health score change displayed as a large delta number with arrow: green up arrow for improvement, red down arrow for degradation
- Vulnerability lists use expandable rows: click CVE ID to see details (affected component, severity, remediation status)
- Compatibility status badge: green (Compatible), amber (Warnings), red (Incompatible)
- Simulation history shown as a table with columns: Date, Target FW, Compatibility, Health Delta, actions

## Out of Scope
- Batch simulation across multiple devices
- Auto-recommending the best firmware version
- Actually deploying firmware from the simulation view

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for FirmwareSimulationResult entity, simulation engine Lambda, and `simulateFirmwareUpgrade` query.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
