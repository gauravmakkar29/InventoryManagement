# Story 14.4: Quarantine Zone Management

**Epic:** Epic 14 — Incident Isolation & Lateral Movement
**Persona:** Sarah (Platform Admin)
**Priority:** Medium
**Story Points:** 5

## User Story

As a Platform Admin, I want to define geographic quarantine zones that automatically isolate all devices within a boundary, so that I can contain threats affecting a physical area without isolating devices one by one.

## Acceptance Criteria

- [ ] AC1: When I click "Create Quarantine Zone" from an incident's action menu, a dialog opens with a map where I can click to place a center point and drag to set a radius
- [ ] AC2: When I define the zone boundary, the dialog shows a preview count of how many devices fall within the zone
- [ ] AC3: When I confirm the quarantine zone with a name, description, and isolation policy, all devices within the boundary are automatically set to "Isolated" status
- [x] AC4: When I view the Geo Location map, active quarantine zones appear as shaded circular overlays with a dashed red border and a label showing the zone name
- [x] AC5: When I navigate to the Quarantine Zones list (from the Incidents page), I see all zones with: name, status (Active/Lifted), device count, incident link, created date, and actions
- [x] AC6: When I click "Lift Quarantine" on an active zone, a confirmation dialog requires a reason note, and upon confirmation all devices in the zone are released back to their previous status
- [x] AC7: When a new device is added to the system with coordinates inside an active quarantine zone, it is NOT automatically quarantined (only devices present at zone creation are affected)

## UI Behavior

- Zone creation dialog includes an interactive map for boundary selection (click + drag circle)
- Radius input also available as a numeric field (in km) for precise control
- Map overlay for active zones uses red dashed border with semi-transparent red fill (0.1 opacity)
- Zone label appears at the center of the circle on the map
- Quarantine zones list is a tab within the Incidents page navigation
- Lifted zones appear grayed out in the list with a "Lifted" badge

## Out of Scope

- Non-circular quarantine boundaries (polygons, custom shapes)
- Automatic quarantine triggered by risk thresholds
- Quarantine zones based on non-geographic criteria (e.g., firmware version)

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for QuarantineZone entity, `createQuarantineZone` and `liftQuarantineZone` mutations.

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
