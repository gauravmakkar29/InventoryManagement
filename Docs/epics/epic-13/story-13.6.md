# Story 13.6: Heatmap & Blast Radius Dashboard Integration

**Epic:** Epic 13 — Environmental Heatmaps & Blast Radius
**Persona:** Raj (Operations Manager)
**Priority:** Medium
**Story Points:** 3

## User Story

As an Operations Manager, I want to see a summary of environmental risk and recent blast radius results on the main dashboard, so that I have at-a-glance visibility into fleet health without navigating to the full heatmap page.

## Acceptance Criteria

- [x] AC1: When I open the Dashboard, I see a new "Environmental Risk" KPI card showing the fleet-wide average risk score with a trend indicator (improving/declining vs. last 24 hours)
- [x] AC2: When the average risk score is below 50, the KPI card border turns red; between 50-70, amber; above 70, green
- [x] AC3: When I click the "Environmental Risk" KPI card, I am navigated to the Inventory Geo Location tab with the heatmap enabled
- [x] AC4: When there are blast radius results from the last 24 hours, a "Recent Impact Analysis" section appears below the KPIs showing up to 3 recent results with: origin device, affected count, and risk level
- [x] AC5: When there are no recent blast radius results, the "Recent Impact Analysis" section shows "No recent impact analyses" with a link to "Run Simulation"

## UI Behavior

- Environmental Risk KPI card follows the existing dashboard KPI card pattern (compact, same height as other cards)
- Trend indicator is a small arrow icon (up = improving, down = declining) with percentage change
- Recent Impact Analysis section uses the same card layout as "Recent Alerts" on the dashboard
- Each blast radius result card shows a mini circular indicator (colored by risk level) alongside the text summary
- The section is collapsible to keep the dashboard compact

## Out of Scope

- Mini heatmap embedded in the dashboard
- Real-time updating of risk score (refreshes on page load or manual refresh)
- Environmental risk trend chart (line chart over time)

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for HeatmapSnapshot and BlastRadiusResult entities.

## Definition of Done

- [x] Code reviewed and approved
- [x] Unit tests passing (>=85% coverage on new code)
- [x] E2E tests passing
- [x] Compliance check green
