# Story 18.3: Advanced Device Search with Filters

**Epic:** Epic 18 — OpenSearch & Global Search
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 5

## User Story

As an Operations Manager, I want to perform advanced searches on the device inventory with combined text and filter criteria (status, location, model, health score range), so that I can find specific subsets of devices faster than scrolling through paginated tables.

## Acceptance Criteria

- [x] AC1: When I navigate to the Inventory page and type in the search bar, the device table results are powered by OpenSearch full-text search instead of client-side filtering
- [x] AC2: When I type a partial device name, serial number, or location, results appear with fuzzy matching (e.g., "sydny" matches "Sydney")
- [x] AC3: When I apply a status filter (Online/Offline/Maintenance) alongside a text query, results are filtered by both criteria
- [x] AC4: When I apply a location filter and a model filter together, only devices matching both filters appear
- [x] AC5: When I filter by health score range (e.g., 0-50), only devices with health scores within the range are displayed
- [x] AC6: When I clear all filters and search text, the full device list is restored (via standard DynamoDB query)
- [x] AC7: When OpenSearch is unavailable, the search automatically falls back to DynamoDB GSI queries with an informational message: "Full-text search temporarily unavailable. Using basic search."

## UI Behavior

- Search bar on the Inventory page uses the same input field as before, but now powered by OpenSearch
- Filter dropdowns (Status, Location, Model) appear as pills above the table, same position as existing filters
- Health score range filter uses a dual-handle slider (min/max) with numeric inputs
- Active filters show as removable chips: "Status: Online" [x], "Location: Sydney" [x]
- Results update as filters change (no separate "Apply" button needed)
- When falling back to DynamoDB, the search bar placeholder changes to "Basic search..." and fuzzy matching is disabled

## Out of Scope

- Saved search presets (save a filter combination for later)
- Search export (use existing CSV export on the filtered results)
- Column-level search (search within a specific table column)

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for `searchDevices` resolver, DeviceSearchFilters interface, and graceful degradation strategy.

## Definition of Done

- [x] Code reviewed and approved
- [x] Unit tests passing (>=85% coverage on new code)
- [x] E2E tests passing
- [x] Compliance check green
