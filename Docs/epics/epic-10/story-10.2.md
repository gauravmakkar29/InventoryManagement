# Story 10.2: GeoJSON Device Markers with Clustering

**Epic:** Epic 10 — Amazon Location Service
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 5

## User Story
As an Operations Manager, I want device markers displayed as a GeoJSON layer on the interactive map with automatic clustering at low zoom levels, so that the map remains readable and performant even with thousands of devices.

## Acceptance Criteria
- [ ] AC1: When the map loads, all devices with valid coordinates appear as markers on the map
- [ ] AC2: When markers are close together at the current zoom level, they automatically cluster into a single circle showing the count of grouped devices
- [ ] AC3: When I zoom in on a cluster, it breaks apart into individual markers or smaller clusters
- [ ] AC4: When I click a cluster marker, the map zooms in to expand that cluster
- [ ] AC5: When I view individual markers, they are color-coded by device status (green = Online, red = Offline, amber = Maintenance)
- [ ] AC6: When I click an individual device marker, a popup appears showing device name, status, health score, firmware version, and location
- [ ] AC7: When I close the popup by clicking elsewhere, it dismisses cleanly
- [ ] AC8: When the status filter pills (from Epic 9) are used, the GeoJSON layer updates to show only matching devices

## UI Behavior
- Cluster markers show the device count as a number inside the circle
- Cluster circle size scales with the number of devices it represents
- Cluster color can be a neutral blue or mix of status colors
- Individual markers are small circles (8px radius) with status color fill and white border
- Popup is a MapLibre GL JS native popup positioned at the marker coordinates
- Popup content matches the tooltip design from Epic 9 (device name, status badge, health score, firmware version, location)

## Out of Scope
- Navigating to device detail from the popup
- Editing device data from the popup
- Real-time marker position updates (device tracking is Story 10.5)

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for GeoJSON layer configuration and supercluster integration.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
