# Story 9.4: Device Marker Tooltip

**Epic:** Epic 9 — Geo-Location Formalization
**Persona:** Raj (Operations Manager)
**Priority:** Medium
**Story Points:** 3

## User Story
As an Operations Manager, I want to click a device marker on the map and see a tooltip with device details, so that I can quickly check a device's status, health score, and firmware version without leaving the map view.

## Acceptance Criteria
- [ ] AC1: When I click a device marker on the map, a tooltip or popover appears near the marker
- [ ] AC2: When the tooltip opens, it displays: Device Name, Status (as a colored badge), Health Score (as a number or bar), Firmware Version, and Location
- [ ] AC3: When I click a different marker, the previous tooltip closes and a new one opens for the clicked device
- [ ] AC4: When I click anywhere else on the map (not on a marker), the open tooltip closes
- [ ] AC5: When I click the same marker again, the tooltip toggles closed
- [ ] AC6: When the tooltip is displayed, it does not overflow beyond the map container boundaries

## UI Behavior
- Tooltip is a small card (approximately 200px wide) with a subtle shadow and border
- Device name is displayed as a bold header
- Status is shown as a colored badge (same colors as markers)
- Health score is displayed as a number with a percentage sign (e.g., "94.2%")
- Firmware version is shown in monospace font
- Location is shown as the human-readable location string
- Tooltip appears with a subtle fade-in animation (150ms)
- Tooltip position adjusts to avoid overflowing the map edges (smart positioning)

## Out of Scope
- Navigating to the device detail page from the tooltip
- Editing device information from the tooltip
- Showing device history or trend data in the tooltip

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for tooltip implementation using Radix Popover.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
