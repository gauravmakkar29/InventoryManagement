# Story 10.4: Geofence Visualization

**Epic:** Epic 10 — Amazon Location Service
**Persona:** Sarah (Platform Admin)
**Priority:** Medium
**Story Points:** 5

## User Story
As a Platform Admin, I want to create and view geofence boundaries on the map that define our service zones and warehouse locations, so that I can monitor which devices are inside or outside designated areas.

## Acceptance Criteria
- [ ] AC1: When geofences have been created, I see semi-transparent polygon overlays on the map representing each geofence boundary
- [ ] AC2: When I hover over a geofence polygon, the boundary highlights and a tooltip shows the geofence name and the number of devices inside it
- [ ] AC3: When I click "Create Geofence" button, a modal opens where I can enter a geofence name and define coordinates (either manual entry or draw on map)
- [ ] AC4: When I save a new geofence, the polygon immediately appears on the map
- [ ] AC5: When I view the Geofence Panel (collapsible sidebar), I see a list of all geofences with their names and device counts
- [ ] AC6: When I click a geofence in the list, the map pans and zooms to show that geofence area

## UI Behavior
- Geofence polygons are rendered as semi-transparent fills (blue at 20% opacity) with a solid border
- A collapsible Geofence Panel on the side shows a list of all geofences
- Each geofence list item shows: name, device count, and a color indicator
- "Create Geofence" button is visible to Admin and Manager roles only
- Create modal includes: name input, coordinate entry (list of lat/lng pairs), and a "Draw on Map" option
- Draw-on-map allows clicking points on the map to define a polygon, with a "Complete" button to close the shape

## Out of Scope
- Geofence entry/exit alerts (EventBridge integration)
- Editing existing geofence boundaries
- Deleting geofences
- Complex geofence shapes (circles, multi-polygons)

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for Amazon Location Geofence Collection API and Terraform resources.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
