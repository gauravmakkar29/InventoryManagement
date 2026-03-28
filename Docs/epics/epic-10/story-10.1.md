# Story 10.1: MapLibre GL JS Interactive Map

**Epic:** Epic 10 — Amazon Location Service
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 5

## User Story
As an Operations Manager, I want the Geo Location map replaced with a high-performance interactive map powered by Amazon Location Service and MapLibre GL JS, so that I get smooth zooming, panning, and vector tile rendering that scales to thousands of devices.

## Acceptance Criteria
- [ ] AC1: When I navigate to the Geo Location tab on the Inventory page, I see a MapLibre GL JS map rendered with Amazon Location Service vector tiles
- [ ] AC2: When the map loads, it displays a styled base map with country boundaries, city labels, and terrain
- [ ] AC3: When I scroll to zoom or pinch-zoom on mobile, the map zooms smoothly with WebGL rendering
- [ ] AC4: When I click and drag, the map pans smoothly to different regions
- [ ] AC5: When the map loads, it automatically fits to show all device markers in the viewport
- [ ] AC6: When the map fails to authenticate with Amazon Location Service, a fallback message appears with a device list table
- [ ] AC7: When I view the map on mobile, touch gestures (pinch zoom, two-finger pan) work correctly

## UI Behavior
- Map replaces the previous react-simple-maps SVG map entirely
- Map includes navigation controls (zoom +/-, compass) in the top-right corner
- Map includes a scale bar in the bottom-left corner
- Map takes the full width of the content area and approximately 500px height on desktop
- Map background and style adapt to light/dark mode
- Initial center is set to show all known device locations with appropriate zoom level

## Out of Scope
- Device markers and clustering (covered in Story 10.2)
- Places API search (covered in Story 10.3)
- Geofencing (covered in Story 10.4)
- Device tracking trails (covered in Story 10.5)

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for MapLibre initialization, Amazon Location Service configuration, and Cognito credential signing.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
