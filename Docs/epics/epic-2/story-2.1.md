# Story 2.1: Dashboard KPI Cards

**Epic:** Epic 2 — Dashboard & Executive Overview
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 5

## User Story
As an operations manager, I want to see four key performance indicators on the dashboard, so that I can immediately assess the overall health of the device fleet and deployment pipeline.

## Acceptance Criteria
- [ ] AC1: When I navigate to the Dashboard (`/`), I see 4 compact KPI cards displayed in a single row at the top of the page
- [ ] AC2: The "Total Devices" card shows the total count of all devices in the system
- [ ] AC3: The "Active Deployments" card shows the count of firmware packages with status "Pending"
- [ ] AC4: The "Pending Approvals" card shows the count of firmware packages in approval stages that have not yet reached "Approved"
- [ ] AC5: The "Health Score" card shows the average health score across all devices as a percentage (e.g., "94.2%")
- [ ] AC6: When data is loading, each card shows a skeleton placeholder animation
- [ ] AC7: When a data fetch fails, the affected card shows "—" with a retry icon

## UI Behavior
- Cards are arranged in a responsive 4-column grid (stacks to 2x2 on tablet, 1-column on mobile)
- Each card displays: icon (top-left), title (small text), value (large bold number), and optional trend indicator
- Cards use compact sizing per enterprise design principles (no oversized hero cards)
- Values use locale-aware number formatting (e.g., "1,247" not "1247")

## Out of Scope
- Trend calculations (up/down compared to previous period)
- Click-through from KPI cards to detail pages
- Real-time auto-refresh of KPI values

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for parallel data fetching pattern, KPICard component interface, and query mappings.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
