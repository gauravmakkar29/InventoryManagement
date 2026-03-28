# Story 10.3: Location Search with Places API Geocoding

**Epic:** Epic 10 — Amazon Location Service
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 3

## User Story
As a Platform Admin, I want to search for a location by name on the map and have it pan to that area, so that I can quickly navigate to a specific city or site where our devices are deployed.

## Acceptance Criteria
- [ ] AC1: When I view the Geo Location tab, I see a search input above or overlaid on the map with a placeholder "Search location..."
- [ ] AC2: When I type a location name (e.g., "Sydney") and press Enter, the map pans and zooms to that location
- [ ] AC3: When I type at least 3 characters, autocomplete suggestions appear below the search input (powered by Amazon Location Places API)
- [ ] AC4: When I select an autocomplete suggestion, the map pans to that location immediately
- [ ] AC5: When the search returns no results, I see a message "Location not found" below the input
- [ ] AC6: When I clear the search input, the map returns to showing all devices in the default viewport

## UI Behavior
- Search input is positioned in the top-left area of the map container (overlaid on the map)
- Input has a search icon on the left and a clear (X) button when text is entered
- Autocomplete dropdown appears below the input showing up to 5 suggestions
- Each suggestion shows the place name and region/country
- Input has a 300ms debounce before making API calls
- Search input is styled to match the map aesthetic (semi-transparent background)

## Out of Scope
- Reverse geocoding (clicking the map to get a location name)
- Saving favorite locations
- Location-based device filtering (only visual pan/zoom)

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for Places API geocoding implementation (SearchPlaceIndexForText).

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
