# Story 3.5: Geo Location Map Tab

**Epic:** Epic 3 — Inventory & Device Management
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 8

## User Story
As an operations manager, I want to see my device fleet on an interactive world map, so that I can understand the geographic distribution of assets and identify location-specific issues.

## Acceptance Criteria
- [ ] AC1: When I click the "Geo Location" tab on the Inventory page, I see an interactive world map with device markers plotted at their lat/lng coordinates
- [ ] AC2: Each marker is color-coded by device status: green for Online, gray for Offline, amber for Maintenance
- [ ] AC3: When I click or hover over a device marker, a tooltip appears showing: device name, status badge, health score, firmware version, and location name
- [ ] AC4: When I click a status filter pill above the map (All / Online / Offline / Maintenance), only devices with that status are shown on the map
- [ ] AC5: When a device has no lat/lng coordinates, it is excluded from the map (no broken markers)
- [ ] AC6: When the map fails to load (library error), I see a fallback message "Unable to load map. Try refreshing the page." with a list table of devices below

## UI Behavior
- Map uses the full width of the content area with a fixed height (e.g., 500px)
- Status filter pills are displayed as a segmented control above the map
- Active filter pill is highlighted with the accent color
- Map renders using react-simple-maps with a world topology
- Tooltips dismiss when clicking elsewhere or hovering away
- Map is zoomable and pannable

## Out of Scope
- Real-time device location updates
- Geofencing or radius-based search
- Marker clustering for dense regions
- Clicking a marker to navigate to a device detail page

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for GeoLocationMap component, marker tooltip specification, and `location-coords.ts` fallback.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
