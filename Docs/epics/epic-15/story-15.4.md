# Story 15.4: Configuration Drift Analysis

**Epic:** Epic 15 — Digital Twin
**Persona:** Sarah (Platform Admin)
**Priority:** Medium
**Story Points:** 5

## User Story
As a Platform Admin, I want to compare a device's current configuration against a golden baseline and see exactly which settings have drifted, so that I can identify misconfigurations that may be causing operational issues or security vulnerabilities.

## Acceptance Criteria
- [ ] AC1: When I view a device's Digital Twin tab, I see a "Config Drift" section showing the drift status: "In Sync" (green badge), "Drifted" (amber badge with count of drifted items), or "Unknown" (gray badge)
- [ ] AC2: When the drift status is "Drifted", I can expand the section to see a table of drifted config items with columns: Config Key, Expected Value, Actual Value, Severity (Critical/Warning/Info), and Detected Date
- [ ] AC3: When I click a drifted config item, a side-by-side diff viewer opens showing the expected value (left, green background) and actual value (right, red background) for that key
- [ ] AC4: When I navigate to the "Golden Config" management page (Admin only), I see a list of baseline configuration templates organized by device model
- [ ] AC5: When I edit a golden config template, changes are saved and a re-evaluation of all devices using that model's template is triggered within 15 minutes
- [ ] AC6: When I filter the Digital Twin dashboard by drift status, only devices matching the selected status (In Sync / Drifted / Unknown) are displayed

## UI Behavior
- Drift status badge appears prominently next to the health score gauge on the twin view
- Drifted items table uses severity color coding: Critical rows have a red left border, Warning have amber, Info have blue
- Diff viewer uses a two-pane layout with monospace font, differences highlighted with background color
- Golden Config editor is a structured form (not raw text) with key-value pairs grouped by category (Network, Security, Performance, General)
- Admin-only golden config page is accessible from the Digital Twin dashboard navigation

## Out of Scope
- Auto-remediation of drifted configs (pushing correct config to device)
- Config drift alerting/notifications
- Config drift history (showing when drift was first detected)

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for ConfigDriftItem structure, DigitalTwin entity, and `updateGoldenConfig` mutation.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
