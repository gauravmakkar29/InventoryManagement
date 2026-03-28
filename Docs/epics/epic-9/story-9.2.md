# Story 9.2: Device Markers on Map

**Epic:** Epic 9 — Geo-Location Formalization
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 3

## User Story
As an Operations Manager, I want to see device markers on the world map positioned at each device's geographic coordinates, so that I can see where our devices are physically deployed.

## Acceptance Criteria
- [ ] AC1: When the Geo Location map loads, each device with valid coordinates is represented by a colored circle marker on the map
- [ ] AC2: When a device has lat/lng values in its record, the marker is placed at those exact coordinates
- [ ] AC3: When a device does not have lat/lng values but has a location name (e.g., "Sydney"), the marker is placed using a fallback coordinate lookup
- [ ] AC4: When a device has neither coordinates nor a recognized location name, it is not displayed on the map
- [ ] AC5: When I view the map, markers are color-coded by device status: green for Online, red for Offline, amber for Maintenance
- [ ] AC6: When the map shows devices, a badge below the map reads "Showing X of Y devices" (X = mapped devices, Y = total devices)

## UI Behavior
- Markers are small circles (approximately 5px radius) with a white border for contrast
- Markers are clickable (pointer cursor on hover)
- When multiple devices are at the same location, markers may overlap (clustering is out of scope)
- Marker colors: Online = #10b981 (green), Offline = #ef4444 (red), Maintenance = #f59e0b (amber)
- Devices without mappable coordinates are counted in the badge but not shown on the map

## Out of Scope
- Marker clustering for overlapping devices
- Animated marker placement
- Dragging markers to reposition devices
- Clicking a marker to open device details (covered in Story 9.4)

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for coordinate resolution strategy and marker implementation.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
