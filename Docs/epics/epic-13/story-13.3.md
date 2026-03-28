# Story 13.3: Heatmap Visualization on Geo Map

**Epic:** Epic 13 — Environmental Heatmaps & Blast Radius
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 8

## User Story
As an Operations Manager, I want to see a color-coded heatmap overlay on the device map showing risk levels by geographic region, so that I can quickly identify areas with clusters of unhealthy devices and prioritize field team dispatches.

## Acceptance Criteria
- [ ] AC1: When I navigate to the Inventory page and select the "Geo Location" tab, I see a "Heatmap" toggle button alongside the existing map view
- [ ] AC2: When I enable the heatmap toggle, the map displays color-coded regions (green/amber/red) based on aggregated device risk scores in each geographic cell
- [ ] AC3: When I hover over a heatmap cell, a tooltip shows: device count, average risk score, number of critical devices, and region name
- [ ] AC4: When I zoom in on the map, the heatmap granularity increases (smaller cells, more detail); when I zoom out, cells merge into larger regions
- [ ] AC5: When I adjust the "Risk Threshold" slider (0-100), only regions with average risk at or below the threshold are highlighted
- [ ] AC6: When a region has zero devices, it does not display any heatmap coloring
- [ ] AC7: When I disable the heatmap toggle, the map returns to the standard device pin view

## UI Behavior
- Heatmap toggle appears as a segmented control: "Pins" | "Heatmap" in the top-right of the map container
- Color scale legend displayed at bottom-left of map: gradient bar from green (healthy) to red (critical) with numeric labels
- Risk threshold slider appears in a collapsible controls panel above the legend
- Heatmap cells use semi-transparent fills (opacity varies by device density: more devices = more opaque)
- Smooth transitions when toggling between pin view and heatmap view (200ms fade)
- Loading state: map dims slightly with a spinner while heatmap aggregation loads

## Out of Scope
- Historical heatmap playback (time slider)
- Heatmap for specific metric only (e.g., temperature-only heatmap)
- Printing/exporting heatmap as image

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for `getHeatmapAggregation` resolver, OpenSearch `geohash_grid` query, and color scale definitions.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
