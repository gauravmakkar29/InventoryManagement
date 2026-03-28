# Story 2.4: System Status Indicators

**Epic:** Epic 2 — Dashboard & Executive Overview
**Persona:** Raj (Operations Manager)
**Priority:** Medium
**Story Points:** 2

## User Story
As an operations manager, I want to see the health status of core platform services on the dashboard, so that I know at a glance if any system component is degraded before a client meeting.

## Acceptance Criteria
- [ ] AC1: When I view the Dashboard, I see a "System Status" section showing 4 service indicators: Deployment, Compliance, Asset DB, Analytics
- [ ] AC2: Each indicator displays the service name and a colored status dot: green for healthy, red for degraded
- [ ] AC3: When all data fetches on the dashboard succeed, all 4 indicators show green
- [ ] AC4: When a specific data fetch fails (e.g., firmware list query), the corresponding indicator (Deployment) shows red
- [ ] AC5: When I hover over a status indicator, I see a tooltip with details (e.g., "Deployment: Healthy — Last checked 2 min ago" or "Deployment: Degraded — API error")

## UI Behavior
- System status section is displayed in a compact horizontal row or 2x2 grid
- Status dots are 8px circles with green (#10b981) or red (#ef4444) fill
- Section is positioned alongside or below the Recent Alerts panel
- Status is determined from the dashboard's parallel data fetch results (no separate health check endpoints)

## Out of Scope
- Historical uptime percentages
- Detailed error logs per service
- Manual service restart or remediation actions
- Separate health check API endpoints

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for system status derivation logic from parallel fetch results.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
