# Story 18.6: Geospatial Queries for Map Features

**Epic:** Epic 18 — OpenSearch & Global Search
**Persona:** Raj (Operations Manager)
**Priority:** Medium
**Story Points:** 5

## User Story

As an Operations Manager, I want the Geo Location map to use OpenSearch geospatial queries for loading devices within the visible map area, so that the map performs well with large device fleets and only fetches devices that are currently visible in the viewport.

## Acceptance Criteria

- [x] AC1: When I view the Geo Location tab on the Inventory page, the map loads devices using a `geo_bounding_box` query that only fetches devices within the current map viewport
- [x] AC2: When I pan or zoom the map, a new query fetches devices for the updated viewport within 500ms (debounced to avoid excessive queries during rapid panning)
- [x] AC3: When I search for devices near a specific point (e.g., by clicking a location on the map), a `geo_distance` query returns all devices within a configurable radius (default 50km)
- [x] AC4: When the map shows more than 100 devices in the viewport, the devices are clustered into groups with a count badge to maintain readability and performance
- [x] AC5: When I click a cluster, the map zooms in to show the individual devices within that cluster
- [x] AC6: When I apply a status filter (e.g., "Offline only") on the map, the geo query includes the status filter and only matching devices are shown
- [x] AC7: When OpenSearch geo queries are unavailable, the map falls back to loading all devices from DynamoDB and rendering them client-side (with a performance warning for large datasets)

## UI Behavior

- Map behavior and appearance remain consistent with the existing Geo Location tab design
- Cluster markers are circular badges with a number indicating the device count, colored by the worst status in the cluster (red if any offline, amber if any maintenance, green if all online)
- Pan/zoom debounce: 300ms after last interaction before firing a new query
- Loading state: map markers fade out briefly during query execution, then fade back in with new results
- Viewport query includes a small buffer (10% beyond visible edges) to pre-load devices just outside the view

## Out of Scope

- Heatmap overlay using geo queries (Epic 13)
- Geofencing and alerts
- Real-time device location tracking

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for geo query types, `geo_bounding_box` and `geo_distance` DSL examples, and `geoLocation` field mapping.

## Definition of Done

- [x] Code reviewed and approved
- [x] Unit tests passing (>=85% coverage on new code)
- [x] E2E tests passing
- [x] Compliance check green
