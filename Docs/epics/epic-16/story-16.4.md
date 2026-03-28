# Story 16.4: Executive Summary Page

**Epic:** Epic 16 — Dual-Theme UI, Connectivity & KPI
**Persona:** Raj (Operations Manager)
**Priority:** Medium
**Story Points:** 5

## User Story
As an Operations Manager preparing for a client meeting, I want a clean, presentation-ready executive summary page showing fleet health, compliance status, and deployment activity, so that I can project it in meetings or export it as a snapshot for stakeholders.

## Acceptance Criteria
- [ ] AC1: When I navigate to /executive-summary, I see a full-page presentation layout with: Fleet Overview KPIs, Device Status distribution chart, Health Trend chart, Compliance Summary, and Deployment Activity chart
- [ ] AC2: When I select a time range (7d / 30d / 90d / Custom), all charts and KPIs on the page update to reflect the selected period
- [ ] AC3: When I click "Export", the entire page is captured as a PNG image and downloaded to my device
- [ ] AC4: When I click "Print", a print-friendly CSS layout is applied (no sidebar, no header, white background) and the browser print dialog opens
- [ ] AC5: When I view the executive summary, the page auto-refreshes data every 60 seconds without requiring manual intervention
- [ ] AC6: When the page loads, all 4 sections render within 3 seconds with server-side aggregation data
- [ ] AC7: When a Manager or Admin user accesses the page, they see full data; when a CustomerAdmin accesses it, they only see data scoped to their own organization

## UI Behavior
- Page uses a clean, minimal layout with no sidebar (full-width content area)
- Header shows: company logo, "Executive Summary" title, date, and Export/Print buttons
- Fleet Overview: 4 large KPI cards in a row (Total Devices, Health Score, Uptime %, Open Incidents)
- Device Status: Recharts PieChart (Online/Offline/Maintenance) with legend
- Health Trend: Recharts AreaChart with 30-day default view, gradient fill
- Compliance Summary: Recharts BarChart (Approved/Pending/Deprecated counts)
- Deployment Activity: Recharts BarChart showing weekly deployment counts
- All text uses Inter font, large readable sizes for projection (KPI values: 36px, labels: 14px)
- No interactive elements beyond time range selector and export/print buttons

## Out of Scope
- PDF export (PNG + print covers the need)
- Custom branding per customer (logo, colors)
- Scheduled email delivery of executive summary
- Editable summary sections (fixed layout)

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for executive summary layout specification and aggregation data sources.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
