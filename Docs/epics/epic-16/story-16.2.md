# Story 16.2: Connectivity Monitoring & Service Health

**Epic:** Epic 16 — Dual-Theme UI, Connectivity & KPI
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 5

## User Story
As a Platform Admin, I want to see the real-time health status of all platform services (AppSync, DynamoDB, Cognito, OpenSearch) in the dashboard, so that I can immediately identify service degradations and take action before they impact users.

## Acceptance Criteria
- [ ] AC1: When all platform services are healthy, the System Status section on the dashboard shows a green "All Systems Operational" indicator
- [ ] AC2: When any service is degraded or down, a compact status bar appears below the header across all pages showing which service is affected and its current latency
- [ ] AC3: When I click on the System Status section, it expands to show each service individually with: name, status badge (Healthy/Degraded/Down), latency in milliseconds, and last checked timestamp
- [ ] AC4: When OpenSearch is down, the platform displays "Search temporarily unavailable" in the global search bar and falls back to DynamoDB queries for data retrieval
- [ ] AC5: When the user's network connection is lost, a persistent banner appears at the top of the page: "You are offline. Some features may be unavailable."
- [ ] AC6: When a previously degraded service recovers, the status bar updates within 60 seconds and briefly shows a green "Service Recovered" notification
- [ ] AC7: When I view the service health as a non-Admin user, I see a simplified status (operational/issues) without technical details like latency

## UI Behavior
- System Status section on dashboard shows service cards in a 2-column grid, each card 120px wide with: icon, service name, status dot (green/amber/red), latency
- Status bar (when degraded) is 32px tall, amber background, positioned fixed below the 48px header
- Offline banner is a red bar at the very top of the viewport (above header), not dismissible while offline
- Service health checks run in the background — no user action required
- Status transitions animate smoothly (color dot fades between states)

## Out of Scope
- Historical service health charts (uptime over time)
- Custom health check endpoints
- Email/SMS alerts for service health (handled by CloudWatch/SNS in Epic 17)

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for ServiceHealth model, health check strategy, and `useConnectivityMonitor` hook.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
