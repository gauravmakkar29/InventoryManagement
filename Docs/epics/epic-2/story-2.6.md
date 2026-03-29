# Story 2.6: Dashboard Data Refresh and Loading States

**Epic:** Epic 2 — Dashboard & Executive Overview
**Persona:** Raj (Operations Manager)
**Priority:** Medium
**Story Points:** 3
**Status:** In Review (PR pending)
**Branch:** `feature/IMS-38-recent-alerts-and-refresh`
**GitHub Issue:** #48

## Acceptance Criteria

- [x] AC1: All dashboard sections show skeleton loaders during data fetch
- [x] AC2: Manual Refresh button re-fetches all data with spinning animation
- [x] AC3: Error state with retry button when data fetch fails
- [x] AC4: "Last updated" timestamp shown in header
- [x] AC5: Offline banner when network unavailable

## Implementation Notes

- useDashboardData hook provides loading/success/error states
- KpiSkeleton + SectionError components for loading/error UI
- Refresh button spins while loading (animate-spin class)
- navigator.onLine check for offline banner with WifiOff icon
- Includes all previous Epic 1+2 changes as base

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
