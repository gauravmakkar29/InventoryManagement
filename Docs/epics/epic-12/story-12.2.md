# Story 12.2: Component Explorer

**Epic:** Epic 12 — SBOM & Supply Chain Security
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 5

## User Story
As a Platform Admin, I want to browse all software components extracted from uploaded SBOMs in a searchable table, so that I can understand what third-party libraries and frameworks are included in our firmware and identify components that need attention.

## Acceptance Criteria
- [ ] AC1: When I click the "Component Explorer" tab, I see a table of all software components across all uploaded SBOMs
- [ ] AC2: When the table loads, it displays columns: Component Name, Version, License, Supplier, Vulnerabilities (count), and Scope
- [ ] AC3: When I type a component name in the search bar above the table, the table filters to show only matching components
- [ ] AC4: When I click on a component row, an expanded detail panel shows: Package URL (purl), license compliance status, and a list of known vulnerabilities for that component
- [ ] AC5: When I filter by license using the license filter pills (All, Apache-2.0, MIT, GPL, Unknown), the table shows only components with that license
- [ ] AC6: When a component has a non-compliant license (e.g., GPL), its license badge is displayed in red
- [ ] AC7: When there are more than 25 components, the table is paginated

## UI Behavior
- Component table follows the enterprise data-dense table style
- Search bar with search icon above the table, filters on keystroke (debounced 300ms)
- License column shows the SPDX license identifier as a colored badge (green = approved, red = restricted, gray = unknown)
- Vulnerabilities column shows a count badge colored by highest severity (red if any critical, orange if high, etc.)
- Expanded detail panel slides down below the row (accordion style) or opens as a side panel
- Scope column shows "required" or "optional" as a muted text label
- Supplier column shows the organization name

## Out of Scope
- Editing component data
- Comparing components across different SBOM versions
- Dependency graph visualization
- Updating component versions

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for SBOMComponent entity and listSBOMComponents query.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
