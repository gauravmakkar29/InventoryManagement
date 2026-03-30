# Story 13.4: Blast Radius Calculation & Visualization

**Epic:** Epic 13 — Environmental Heatmaps & Blast Radius
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 8

## User Story

As a Platform Admin, I want to select a device on the map and see a blast radius circle showing all other devices that would be affected if it fails, so that I can understand the geographic impact of potential device failures and plan mitigation strategies.

## Acceptance Criteria

- [x] AC1: When I right-click (or long-press on mobile) a device pin on the map, a context menu appears with a "Show Blast Radius" option
- [x] AC2: When I click "Show Blast Radius", a translucent circle overlay appears on the map centered on the selected device, with a default radius of 10 km
- [x] AC3: When the blast radius is displayed, a side panel opens listing all affected devices within the radius, showing: device name, distance from origin, status, and risk score
- [x] AC4: When I adjust the radius slider (1 km to 100 km), the circle overlay and affected device list update in real-time
- [x] AC5: When the blast radius panel is open, a summary card at the top shows: affected device count, estimated downtime, and overall risk level (Critical/High/Medium/Low)
- [x] AC6: When I click "Clear Radius", the circle overlay and side panel close, returning to the normal map view
- [x] AC7: When a device within the blast radius is in "Critical" risk state, it is highlighted with a red marker (distinct from normal markers)

## UI Behavior

- Blast radius circle uses semi-transparent fill (blue with 0.15 opacity) and a dashed border
- Side panel slides in from the right (360px wide), similar to the notification panel pattern
- Affected device list is sorted by distance (nearest first), with distance shown in km
- Summary card uses color-coded risk level badge (same colors as heatmap legend)
- Radius slider appears inside the side panel, below the summary card
- Devices outside the blast radius dim slightly to emphasize affected ones

## Out of Scope

- Multi-device blast radius (selecting multiple origin points)
- Blast radius based on network topology (only geographic distance)
- Automated blast radius alerts

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for `getBlastRadius` resolver, OpenSearch `geo_distance` query, and BlastRadiusResult data model.

## Definition of Done

- [x] Code reviewed and approved
- [x] Unit tests passing (>=85% coverage on new code)
- [x] E2E tests passing
- [x] Compliance check green
