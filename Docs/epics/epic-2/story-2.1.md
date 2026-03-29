# Story 2.1: Dashboard KPI Cards

**Epic:** Epic 2 — Dashboard & Executive Overview
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 5
**Status:** In Review (PR pending)
**Branch:** `feature/IMS-31-dashboard-kpi-cards`
**GitHub Issue:** #31

## User Story

As an operations manager, I want to see key performance indicators on the dashboard, so that I can quickly assess the health and status of the device fleet.

## Acceptance Criteria

- [x] AC1: 4 KPI cards displayed (Total Devices, Active Deployments, Pending Approvals, Fleet Health) with locale-aware formatting
- [x] AC2: Skeleton loaders shown during data fetch (1.2s simulated delay)
- [x] AC3: Error state with retry button when data fetch fails
- [x] AC4: Responsive grid: 1 col mobile, 2 col tablet, 4 col desktop
- [x] AC5: Sparkline charts, trend arrows, and trend labels per card
- [x] AC6: Refresh button in header reloads all data with spinning animation

## Implementation Notes

- `useDashboardData` hook with FetchState (loading/success/error) pattern
- KpiSkeleton component with animate-pulse matching card layout
- SectionError component with retry callback
- 10% random failure rate for testing error states
- `lastUpdated` timestamp shown next to refresh button
- Includes all Epic 1 changes as base

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
