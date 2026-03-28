# Story 9.3: Status Filter Pills

**Epic:** Epic 9 — Geo-Location Formalization
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 2

## User Story
As a Platform Admin, I want to filter device markers on the map by their status using pill buttons, so that I can quickly isolate and focus on offline or maintenance devices.

## Acceptance Criteria
- [ ] AC1: When I view the Geo Location tab, I see filter pill buttons above the map: "All", "Online", "Offline", "Maintenance"
- [ ] AC2: When the page loads, the "All" pill is selected by default and all devices are shown on the map
- [ ] AC3: When I click "Online", only devices with status "Online" appear as markers on the map
- [ ] AC4: When I click "Offline", only offline device markers are shown
- [ ] AC5: When I click "Maintenance", only maintenance device markers are shown
- [ ] AC6: When I click a filter that matches no devices, the map shows no markers and a message appears: "No devices match the selected filter"
- [ ] AC7: When I switch filters, the device count badge updates to reflect the filtered count

## UI Behavior
- Pills are horizontal buttons in a row, styled as segmented toggles
- Selected pill has a filled background with contrasting text
- Unselected pills have an outline/ghost style
- Each pill shows the status label; optionally, a count in parentheses (e.g., "Online (23)")
- Color accents on pills: Online pill uses green accent, Offline uses red, Maintenance uses amber, All uses neutral
- Only one pill can be selected at a time

## Out of Scope
- Multi-select filtering (e.g., Online AND Maintenance together)
- Filtering by location, model, or customer
- Persisting the selected filter across tab switches

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for state management and filtering logic.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
