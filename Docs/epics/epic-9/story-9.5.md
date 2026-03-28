# Story 9.5: Coordinate Resolution Fallback

**Epic:** Epic 9 — Geo-Location Formalization
**Persona:** Mike (Field Technician)
**Priority:** Medium
**Story Points:** 2

## User Story
As a Field Technician viewing the device map, I want devices without explicit GPS coordinates to still appear on the map at their named location, so that the map provides a complete picture of device distribution even when precise coordinates are not available.

## Acceptance Criteria
- [ ] AC1: When a device has a `location` field value of "Sydney" but no lat/lng, the marker appears at Sydney's known coordinates (-33.87, 151.21)
- [ ] AC2: When a device has both lat/lng values and a location name, the lat/lng values take priority over the location lookup
- [ ] AC3: When a device has a location name that is not in the known lookup table, the device is excluded from the map (no marker shown)
- [ ] AC4: When a device has lat=0 and lng=0, the system treats those as missing coordinates and falls back to the location name lookup
- [ ] AC5: When the fallback lookup is used, the marker appears at the same position as any other device at that named location
- [ ] AC6: When the coordinate resolution is complete, the device count badge accurately reflects the total number of devices shown on the map

## UI Behavior
- The user does not see any difference between devices placed by lat/lng and devices placed by fallback lookup
- There is no visual indicator distinguishing "exact" vs "approximate" positions
- The fallback coordinate table supports at least the following locations: Sydney, Melbourne, Singapore, Tokyo, London, New York (extensible)

## Out of Scope
- Geocoding via an external API (covered in Epic 10 — Amazon Location Service)
- Allowing users to manually set device coordinates from the map
- Showing accuracy radius for approximate coordinates

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for the location-coords.ts lookup table and resolution strategy.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
