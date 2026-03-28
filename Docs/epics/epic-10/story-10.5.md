# Story 10.5: Device Position Tracking Trail

**Epic:** Epic 10 — Amazon Location Service
**Persona:** Raj (Operations Manager)
**Priority:** Medium
**Story Points:** 5

## User Story
As an Operations Manager, I want to select a device and see its position history as a trail on the map, so that I can understand device movement patterns and verify that mobile equipment is being used at the correct locations.

## Acceptance Criteria
- [ ] AC1: When I click a device marker and then click "Show Trail" in the device popup, a line trail appears on the map showing the device's historical positions
- [ ] AC2: When the trail is displayed, each historical position is shown as a small dot connected by a line in chronological order
- [ ] AC3: When I hover over a trail point, a tooltip shows the timestamp of that position reading
- [ ] AC4: When a device has no position history, clicking "Show Trail" shows a message "No position history available for this device"
- [ ] AC5: When a trail is active, a "Hide Trail" button appears to dismiss the trail visualization
- [ ] AC6: When I select a different device while a trail is visible, the previous trail is cleared and replaced with the new device's trail

## UI Behavior
- Trail line is rendered as a dashed or solid line in a distinct color (e.g., blue #2563eb)
- Historical position dots are small (4px radius) along the trail
- The most recent position is the device's current marker (larger, status-colored)
- The oldest position is shown as a faded dot
- Trail renders within the date range of available tracking data (last 30 days default)
- "Show Trail" button appears as a small link/button inside the device popup

## Out of Scope
- Real-time live tracking (position updates streaming in)
- Date range selector for trail history
- Speed or velocity calculations between positions
- Exporting trail data

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for Amazon Location Tracker API (GetDevicePositionHistory).

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
