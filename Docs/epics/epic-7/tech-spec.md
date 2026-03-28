# Epic 7: Analytics & Reporting — Technical Specification

**Epic:** Epic 7 — Analytics & Reporting
**Brief Reference:** FR-6, Section 10.2 Analytics
**Status:** POC — Fresh Build

---

## 1. Overview

The Analytics page provides executive-level visibility into platform health through 5 KPI cards, interactive charts (pie, line, bar), a time range filter, an embedded audit log table, and data export capabilities. This is the `/analytics` route.

---

## 2. Data Models

### 2.1 No New Entities

Analytics consumes existing entities: Device, Firmware, Compliance, Vulnerability, AuditLog. No new DynamoDB entity types are introduced.

### 2.2 Aggregation Queries Used

| KPI / Chart | Data Source | Query / Index |
|---|---|---|
| Total Devices (KPI) | Device | `listDevices` via GSI1 (GSI1PK="DEVICE"), count results |
| Online Devices (KPI) | Device | `listDevices(status="Online")` via GSI1, `begins_with(GSI1SK, "Online#")` |
| Active Deployments (KPI) | Firmware | `listFirmware(status="Active")` via GSI1, `begins_with(GSI1SK, "Active#")` |
| Pending Approvals (KPI) | Firmware | `listFirmware(status="Pending")` via GSI1, `begins_with(GSI1SK, "Pending#")` |
| Health Score (KPI) | Device | Client-side average of `healthScore` from all devices |
| Device Status Distribution (Pie) | Device | Count devices by `status` field (Online/Offline/Maintenance) |
| Compliance Status (Pie) | Compliance | Count compliance records by `status` (Approved/Pending/Deprecated) |
| Weekly Deployment Trend (Line/Bar) | Firmware | Group firmware by `releaseDate` into weekly buckets |
| Top Vulnerabilities (Bar) | Vulnerability | Group vulnerabilities by `vulnSeverity` (Critical/High/Medium/Low) |
| Audit Log Table | AuditLog | `listAuditLogs(startDate, endDate)` via GSI2 |

### 2.3 Future: OpenSearch Aggregations

When OpenSearch is available (Epic 18), the `getAggregations(metric, timeRange?)` query replaces client-side computation:

| Metric Key | OpenSearch Aggregation |
|---|---|
| `devicesByStatus` | `terms` on `status.keyword` filtered by `entityType: "Device"` |
| `complianceByStatus` | `terms` on `status.keyword` filtered by `entityType: "Compliance"` |
| `deploymentTrend` | `date_histogram` on `releaseDate` with `calendar_interval: "week"` |
| `topVulnerabilities` | `terms` on `vulnSeverity.keyword` filtered by `entityType: "Vulnerability"` |
| `healthScoreDistribution` | `histogram` on `healthScore` with `interval: 10` |

---

## 3. API Contracts

### 3.1 Queries Used

```graphql
# Existing queries — no new resolvers needed for POC
query listDevices($status: String, $limit: Int, $nextToken: String): DeviceConnection
query listFirmware($status: String, $limit: Int, $nextToken: String): FirmwareConnection
query listComplianceByStatus($status: String!): [Compliance]
query listAuditLogs($startDate: String!, $endDate: String!, $limit: Int, $nextToken: String): AuditLogConnection

# Future (Epic 18 — OpenSearch)
query getAggregations($metric: String!, $timeRange: TimeRangeInput): AggregationResult
```

### 3.2 TimeRange Filter Input

```typescript
interface TimeRangeInput {
  preset: "7d" | "30d" | "90d";
  // Resolves to:
  // startDate: ISO8601 (now - preset days)
  // endDate: ISO8601 (now)
}
```

### 3.3 Export API (Client-side)

Export is handled client-side using `report-generator.ts`:

```typescript
generateCSV(data: Record<string, unknown>[], filename: string): void
generateJSON(data: Record<string, unknown>[], filename: string): void
```

---

## 4. Component Hierarchy

```
AnalyticsPage (src/app/components/analytics.tsx)
├── TimeRangeFilter
│   └── SegmentedControl: [7d] [30d] [90d]
├── KPICardGrid (5 cards in responsive row)
│   ├── KPICard — Total Devices (icon: Monitor)
│   ├── KPICard — Online Devices (icon: Wifi)
│   ├── KPICard — Active Deployments (icon: Rocket)
│   ├── KPICard — Pending Approvals (icon: Clock)
│   └── KPICard — Health Score (icon: Heart)
├── ChartsGrid (2x2 responsive grid)
│   ├── PieChart — Device Status Distribution (Recharts PieChart)
│   ├── PieChart — Compliance Status (Recharts PieChart)
│   ├── LineChart — Weekly Deployment Trend (Recharts LineChart or BarChart)
│   └── BarChart — Top Vulnerabilities by Severity (Recharts BarChart)
├── AuditLogSection
│   ├── AuditLogTable (DataTable with columns: User, Action, Resource, Timestamp, IP, Status)
│   ├── SearchFilter (text input for filtering rows)
│   └── ExportButton (CSV download)
└── LoadingState / ErrorState (skeleton loaders, error boundary fallback)
```

---

## 5. State Management

```typescript
// analytics.tsx local state
const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
const [devices, setDevices] = useState<Device[]>([]);
const [firmware, setFirmware] = useState<Firmware[]>([]);
const [compliance, setCompliance] = useState<Compliance[]>([]);
const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

// Derived (client-side computed)
const kpis = useMemo(() => computeKPIs(devices, firmware), [devices, firmware]);
const chartData = useMemo(() => computeCharts(devices, compliance, firmware, vulnerabilities), [/*...*/]);
```

---

## 6. Data Fetching Pattern

```typescript
useEffect(() => {
  const load = async () => {
    setLoading(true);
    const { startDate, endDate } = resolveTimeRange(timeRange);
    try {
      const [devs, fw, comp, vulns, logs] = await Promise.all([
        listDevices(),
        listFirmware(),
        listComplianceByStatus("Approved"),
        // Vulnerabilities fetched per compliance item or via search
        listAuditLogs(startDate, endDate),
      ]);
      setDevices(devs);
      setFirmware(fw);
      setCompliance(comp);
      setAuditLogs(logs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  load();
}, [timeRange]);
```

---

## 7. Chart Configuration (Recharts)

### 7.1 Device Status Pie Chart

```typescript
const deviceStatusData = [
  { name: "Online", value: onlineCount, fill: "#10b981" },
  { name: "Offline", value: offlineCount, fill: "#ef4444" },
  { name: "Maintenance", value: maintenanceCount, fill: "#f59e0b" },
];
// Recharts: <PieChart><Pie data={deviceStatusData} dataKey="value" /></PieChart>
```

### 7.2 Deployment Trend Line Chart

```typescript
// Group firmware by release week
const trendData = groupByWeek(firmware, "releaseDate");
// Output: [{ week: "2026-W12", count: 3 }, { week: "2026-W13", count: 5 }, ...]
// Recharts: <LineChart data={trendData}><Line dataKey="count" /></LineChart>
```

### 7.3 Vulnerability Bar Chart

```typescript
const vulnData = [
  { severity: "Critical", count: criticalCount, fill: "#ef4444" },
  { severity: "High", count: highCount, fill: "#f97316" },
  { severity: "Medium", count: mediumCount, fill: "#f59e0b" },
  { severity: "Low", count: lowCount, fill: "#10b981" },
];
// Recharts: <BarChart data={vulnData}><Bar dataKey="count" /></BarChart>
```

---

## 8. Export Implementation

### 8.1 Audit Log CSV Export

Uses `report-generator.ts` `generateCSV()`:

```typescript
const handleExport = () => {
  const rows = auditLogs.map(log => ({
    User: log.userId,
    Action: log.action,
    Resource: `${log.resourceType}/${log.resourceId}`,
    Timestamp: log.timestamp,
    IP: log.ipAddress,
    Status: log.status,
  }));
  generateCSV(rows, `audit-log-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`);
};
```

---

## 9. Access Control

| Role | KPI Cards | Charts | Audit Log Table | Export |
|---|---|---|---|---|
| Admin | Full | Full | Full | Yes |
| Manager | Full | Full | Full | Yes |
| Technician | No access to analytics page | — | — | — |
| Viewer | Full | Full | No audit logs | Read-only charts |
| CustomerAdmin | Own tenant data only | Own data | No | Own data export |

Analytics page route should check `groups` from `useAuth()` and redirect Technicians away.

---

## 10. Performance Considerations

- Skeleton loaders for each KPI card and chart during loading
- Charts render within error boundaries — fallback to data table if Recharts fails
- Audit log table paginated (default 25 rows per page)
- Time range change triggers full refetch (no caching in POC)
- Bundle: Recharts is tree-shakeable — import only PieChart, LineChart, BarChart, not the full library
