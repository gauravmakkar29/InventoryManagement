# Story 14.2: Device Isolation & Release

**Epic:** Epic 14 — Incident Isolation & Lateral Movement
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 5

## User Story

As a Platform Admin, I want to isolate a compromised device during an incident to prevent further damage, and release it once the threat is contained, so that I can limit the impact of security events on the broader device fleet.

## Acceptance Criteria

- [x] AC1: When I view an incident's affected devices list, each device row has an "Isolate" button (only for non-isolated devices)
- [x] AC2: When I click "Isolate", a confirmation dialog appears showing the device name, current status, and isolation policy options (Network Block / Read Only / Firmware Lock)
- [x] AC3: When I confirm isolation, the device status changes to "Isolated" across the entire platform — on the inventory table, on the map, and in all search results
- [x] AC4: When a device is isolated, a prominent "ISOLATED" banner appears at the top of its detail view with the incident reference and isolation timestamp
- [x] AC5: When I view the incident timeline, the isolation event is recorded with: who isolated it, when, and which policy was applied
- [x] AC6: When I click "Release" on an isolated device, a confirmation dialog requires a reason note, and upon confirmation the device returns to its previous status
- [x] AC7: When I navigate to the "Isolated Devices" view (accessible from the Incidents page), I see a table of all currently isolated devices with: device name, incident link, isolation date, policy, and a "Release" action
- [ ] AC8: When a non-Admin user views an isolated device, the "Isolate" and "Release" buttons are not visible (Admin-only action)

## UI Behavior

- Isolation confirmation dialog is a modal with a warning icon and amber background header
- Isolation policy selector uses radio buttons with descriptions for each option
- "ISOLATED" banner on device detail uses a red background with lock icon and is always visible (not dismissible)
- Isolated devices on the map show a lock icon overlay on their marker
- The "Isolated Devices" table has a red dot indicator in the sidebar navigation when count > 0

## Out of Scope

- Automated isolation triggered by telemetry thresholds
- Isolation of device groups (bulk isolation)
- Network-level enforcement of isolation (this is a logical/UI-level status change)

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for device isolation mechanism, `isolateDevice` and `releaseDevice` mutations.

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
