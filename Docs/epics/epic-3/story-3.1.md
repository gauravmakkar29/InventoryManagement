# Story 3.1: Hardware Inventory Table with Search and Filters

**Epic:** Epic 3 — Inventory & Device Management
**Priority:** High
**Story Points:** 8
**Status:** In Review (PR pending)
**Branch:** `feature/IMS-55-inventory-table`
**GitHub Issue:** #55

## Acceptance Criteria

- [x] AC1: Data table with columns: Device Name, Serial Number, Model, Status, Location, Health Score
- [x] AC2: Real-time search by device name or serial number
- [x] AC3: Status filter dropdown (Online/Offline/Maintenance/Decommissioned)
- [x] AC4: Location filter dropdown (dynamically derived from data)
- [x] AC5: Multiple simultaneous filters (AND logic) with device count indicator
- [x] AC6: Sortable columns (click header to toggle asc/desc) with sort icons
- [x] AC7: Empty state: "No devices found" with suggestion to adjust filters
- [x] AC8: Status badges: green dot (Online), red (Offline), amber (Maintenance), gray (Decommissioned)

## Implementation Notes

- 12 mock devices with varied statuses, locations, health scores, and firmware versions
- SortHeader component with asc/desc/neutral icon states
- HealthBar with color thresholds: green (90+), amber (70-89), orange (50-69), red (<50)
- StatusBadge with colored dot + pill background
- Tabs preserved: Hardware Inventory, Firmware Status (placeholder), Geo Location (placeholder)
- Enterprise styling: card-elevated, alternating row shading, 52px row height

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
