# Story 7.1: Analytics KPI Cards

**Epic:** Epic 7 — Analytics & Reporting
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 3

## User Story

As an Operations Manager, I want to see five key performance indicator cards on the Analytics page, so that I can quickly assess the overall health of the device fleet and deployment pipeline.

## Acceptance Criteria

- [x] AC1: When I navigate to `/analytics`, I see 6 KPI cards displayed in a 3x2 grid: Total Devices, Active Deployments, Compliance Score, Open Vulnerabilities, Service Orders (MTD), and Avg Device Health
- [x] AC2: When the page loads, each KPI card shows a numeric value (mock data; will be backend-driven)
- [ ] AC3: When data is loading, each KPI card displays a skeleton loader placeholder (deferred to API integration)
- [ ] AC4: When an API error occurs, the KPI section shows an error message with a retry button (deferred to API integration)
- [x] AC5: When I view on a mobile screen, the KPI cards stack into a 2-column or single-column layout

## UI Behavior

- KPI cards are compact (not oversized hero cards) following the enterprise design direction
- Each card shows: icon (Lucide), label, and numeric value
- Total Devices: count of all devices
- Online Devices: count of devices with status "Online"
- Active Deployments: count of firmware with status "Active"
- Pending Approvals: count of firmware with status "Pending"
- Health Score: average health score across all devices (displayed as percentage with one decimal)
- Cards use subtle background, no gradients, professional typography

## Out of Scope

- Time range filtering of KPI values (covered in Story 7.2)
- OpenSearch aggregations (POC uses client-side computation)
- Click-through from KPI cards to detail views

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for implementation details.

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
