# Story 18.2: Global Search Bar with Command Palette

**Epic:** Epic 18 — OpenSearch & Global Search
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 8

## User Story

As an Operations Manager, I want a global search bar in the header that lets me search across all entity types (devices, firmware, service orders, compliance, vulnerabilities) with fuzzy matching and keyboard shortcuts, so that I can quickly find any record in the system without navigating to specific pages.

## Acceptance Criteria

- [x] AC1: When I click the search bar in the header or press Cmd+K (Mac) / Ctrl+K (Windows), a command palette dialog opens centered on the screen
- [x] AC2: When I type at least 2 characters, search results appear within 500ms, grouped by entity type (Devices, Firmware, Service Orders, Compliance, Vulnerabilities) with section headers
- [x] AC3: When I type a partial or misspelled term (e.g., "sungr" for "Sungrow", "SG-360" for "SG-3600"), the fuzzy matching returns relevant results with the matching text highlighted
- [x] AC4: When I navigate results using Arrow Up/Down keys and press Enter, I am taken directly to the selected entity's detail page
- [x] AC5: When no results match my query, I see a "No results found for [query]" message with search suggestions (e.g., "Try searching by device name, serial number, or CVE ID")
- [x] AC6: When I open the command palette with an empty query, I see my last 5 recent searches that I can click to re-execute
- [x] AC7: When I press Escape or click outside the palette, it closes and I return to the previous page context
- [x] AC8: When I search as a CustomerAdmin (Chen), results are scoped to only my organization's data

## UI Behavior

- Search bar in header: compact input field with magnifying glass icon and "Search... (Cmd+K)" placeholder text
- Command palette: centered modal overlay (640px wide, max 480px tall), dark semi-transparent backdrop
- Each result row shows: entity type icon (left), title (bold), subtitle (gray), entity type badge (right)
- Highlighted matches shown with `<mark>` tag styling (amber background)
- Results grouped with section headers: icon + "Devices (3)" / "Firmware (1)" etc.
- Loading state: skeleton rows while search executes
- Input has 300ms debounce to avoid excessive API calls while typing
- Recent searches section: clock icon + search text, "Clear recent searches" link

## Out of Scope

- Advanced search syntax (boolean operators, field-specific queries)
- Search analytics (tracking popular queries)
- Voice search
- Search within file contents (firmware binaries)

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for `searchGlobal` resolver, GlobalSearchBar component hierarchy, keyboard shortcuts, and recent search localStorage pattern.

## Definition of Done

- [x] Code reviewed and approved
- [x] Unit tests passing (>=85% coverage on new code)
- [x] E2E tests passing
- [x] Compliance check green
