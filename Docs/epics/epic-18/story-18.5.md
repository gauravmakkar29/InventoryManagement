# Story 18.5: Server-Side Aggregations for Analytics

**Epic:** Epic 18 — OpenSearch & Global Search
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 5

## User Story
As an Operations Manager, I want the analytics charts (device status distribution, compliance status, deployment trends, vulnerability severity breakdown) to be powered by OpenSearch server-side aggregations, so that charts load quickly even with large datasets and I see accurate real-time statistics.

## Acceptance Criteria
- [ ] AC1: When I open the Analytics page, the device status pie chart shows the count of devices by status (Online/Offline/Maintenance) computed server-side, not by counting client-side records
- [ ] AC2: When I open the Analytics page, the compliance status chart shows counts by status (Approved/Pending/Deprecated) from a server-side aggregation
- [ ] AC3: When I view the deployment trend chart, it shows a weekly bar chart of firmware releases using a `date_histogram` aggregation
- [ ] AC4: When I view the top vulnerabilities chart, it shows a breakdown by severity (Critical/High/Medium/Low) with accurate counts
- [ ] AC5: When I view the health score distribution chart, it shows a histogram of device health scores in buckets of 10 (0-10, 10-20, ... 90-100)
- [ ] AC6: When I change the time range selector (7d / 30d / 90d), all aggregation-based charts update to reflect the selected period
- [ ] AC7: When an aggregation query fails, the individual chart shows an error state with "Unable to load chart" and a retry button, while other charts remain functional

## UI Behavior
- Analytics page layout remains the same as current design — this story replaces the data source, not the UI
- Charts use Recharts components: PieChart for status distributions, BarChart for trends and histograms, AreaChart for health scores
- Each chart has a subtle loading spinner overlay while the aggregation query executes
- Time range selector is a shared control that applies to all charts on the page
- Error state per chart: gray background, centered error icon, "Unable to load" text, "Retry" link

## Out of Scope
- New chart types or visualizations (only replacing data source for existing charts)
- Custom aggregation queries (predefined set of metrics)
- Exporting aggregation data (use existing CSV export)

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for `getAggregations` resolver, all 9 supported metric names, and aggregation query definitions.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
