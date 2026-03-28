# Story 9.1: World Map Rendering

**Epic:** Epic 9 — Geo-Location Formalization
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 5

## User Story
As an Operations Manager, I want to see an interactive world map on the Inventory page's Geo Location tab, so that I can visually understand the geographic distribution of our device fleet.

## Acceptance Criteria
- [ ] AC1: When I navigate to the Inventory page and click the "Geo Location" tab, I see an interactive world map
- [ ] AC2: When the map loads, it shows a Mercator projection of the world with visible country boundaries
- [ ] AC3: When I scroll or pinch on the map, I can zoom in and out smoothly
- [ ] AC4: When I click and drag on the map, I can pan to different regions
- [ ] AC5: When the map data fails to load, I see a fallback message: "Unable to load map. Showing device list instead." with a table of devices below
- [ ] AC6: When the map is loading, I see a skeleton placeholder with the correct dimensions

## UI Behavior
- Map takes the full width of the content area below the tab bar
- Map height is approximately 400-500px on desktop, responsive on mobile
- Land areas are rendered in a neutral color (light gray in light mode, dark slate in dark mode)
- Country borders are subtle thin lines
- Ocean/background matches the page background color
- Zoom controls (+ / -) are visible in a corner of the map
- Map is wrapped in an error boundary component

## Out of Scope
- Device markers on the map (covered in Story 9.2)
- Status filter pills (covered in Story 9.3)
- Device tooltips (covered in Story 9.4)
- Real-time device position updates

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for react-simple-maps configuration and dark mode support.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
