# Story 3.4: Firmware Status Tab

**Epic:** Epic 3 — Inventory & Device Management
**Persona:** Raj (Operations Manager)
**Priority:** Medium
**Story Points:** 3
**Status:** Done

## User Story

As an operations manager, I want to see all devices with their firmware versions and health scores in a visual grid, so that I can quickly identify devices running outdated or unhealthy firmware.

## Acceptance Criteria

- [x] AC1: When I click the "Firmware Status" tab on the Inventory page, I see a grid of device cards
- [x] AC2: Each card shows the device name, current firmware version, and a color-coded health score bar
- [x] AC3: Health score bars are colored: green (90-100), amber (70-89), orange (50-69), red (0-49)
- [x] AC4: When I hover over a health score bar, I see the exact numeric score (e.g., "Health: 87/100")
- [x] AC5: Cards are sorted by health score ascending (unhealthiest devices first) so problems are visible at the top
- [ ] AC6: When data is loading, skeleton card placeholders are shown

## UI Behavior

- Cards are displayed in a responsive grid (4 columns on desktop, 2 on tablet, 1 on mobile)
- Each card is compact per enterprise design principles
- Firmware version text uses monospace font for readability
- Cards with health score below 50 have a subtle red border to draw attention
- No pagination for this tab (all devices shown; scrollable)

## Out of Scope

- Triggering firmware updates from this view
- Firmware version comparison or "update available" indicators
- Filtering by firmware version or health range

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for health score color mapping and DeviceFirmwareCard component.

## Definition of Done

- [x] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
