# Story 2.6: Dashboard Data Refresh and Loading States

**Epic:** Epic 2 — Dashboard & Executive Overview
**Persona:** Raj (Operations Manager)
**Priority:** Medium
**Story Points:** 3

## User Story
As an operations manager, I want to manually refresh dashboard data and see clear loading indicators, so that I know the data is current before presenting to clients.

## Acceptance Criteria
- [ ] AC1: When the Dashboard page loads, all sections (KPIs, quick actions, alerts, system status) fetch data in parallel and display skeleton loaders while loading
- [ ] AC2: When I click the "Refresh" button in the top-right corner of the dashboard, all data is re-fetched and loading skeletons appear during the fetch
- [ ] AC3: When any individual data fetch fails, only the affected section shows an error state; other sections display their data normally
- [ ] AC4: When a section is in error state, it shows "Unable to load [section name]" with a "Retry" button that re-fetches only that section
- [ ] AC5: When all fetches complete, the "Last updated" timestamp below the Refresh button shows the current time (e.g., "Last updated: 2:34 PM")
- [ ] AC6: When the network is offline, a banner appears at the top of the page: "You are offline. Some features may be unavailable."

## UI Behavior
- Skeleton loaders match the shape and size of the actual content (cards, list items)
- Refresh button shows a spinning icon while data is being fetched
- Error states use a muted card with an exclamation icon and retry button
- Offline banner is persistent and dismisses automatically when connectivity is restored
- All transitions are smooth (150-200ms, no abrupt content jumps)

## Out of Scope
- Auto-refresh on a timer
- Stale-while-revalidate caching
- Partial data display while some sections are still loading

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for parallel fetch pattern, error handling strategy, and graceful degradation rules.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
