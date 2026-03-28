# Story 3.1: Hardware Inventory Table with Search and Filters

**Epic:** Epic 3 — Inventory & Device Management
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 8

## User Story
As an operations manager, I want to view, search, and filter the hardware inventory in a data table, so that I can quickly find devices that need attention.

## Acceptance Criteria
- [ ] AC1: When I navigate to `/inventory`, I see a "Hardware Inventory" tab (selected by default) with a data table listing all devices
- [ ] AC2: The table displays columns: Device Name, Serial Number, Model, Status, Location, Health Score
- [ ] AC3: When I type in the search bar above the table, the list filters in real time by device name or serial number
- [ ] AC4: When I select "Offline" from the status filter dropdown, only devices with status "Offline" are shown
- [ ] AC5: When I select a location from the location filter dropdown, only devices at that location are shown
- [ ] AC6: When I apply multiple filters simultaneously (e.g., Status=Online + Location=Sydney), results match all selected criteria
- [ ] AC7: When no devices match the active filters, I see "No devices found" with a suggestion to adjust filters
- [ ] AC8: When I click a sortable column header (Device Name, Serial Number, Status, Location, Health Score), the table sorts by that column; clicking again reverses the sort order

## UI Behavior
- Search bar and filter dropdowns appear above the table in a single toolbar row
- Status column displays colored badges: green for Online, gray for Offline, amber for Maintenance
- Health Score displays as a number with a small color indicator matching the health range
- Table rows have subtle hover highlighting
- Filters show a "Clear all" link when any filter is active

## Out of Scope
- Inline editing of device fields
- Device detail modal or page
- Creating new devices (covered in Story 3.3)
- Full-text fuzzy search (requires OpenSearch, separate epic)

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for table columns, filter configuration, and GSI query patterns.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
