# Epic 16: Dual-Theme UI, Connectivity & KPI — Technical Specification

**Epic:** Epic 16 — Dual-Theme UI, Connectivity & KPI
**Brief Reference:** Section 10.6 (Theming), Section 10.7 (Enterprise UI/UX), Section 12 (Planned)
**Status:** Awaiting Approval
**Dependencies:** Epic 15 (Digital Twin — health data for KPIs), Epic 18 (OpenSearch — server-side aggregations)

---

## 1. Overview

This epic delivers the enterprise-grade user experience: a polished dual-theme (light/dark) system, real-time connectivity monitoring for all platform services, comprehensive KPI dashboards with server-side aggregations, an executive summary page for client-facing presentations, and full adherence to the enterprise UX design principles from Section 10.7.

---

## 2. Theme System

### 2.1 Theme Architecture

```typescript
// Theme provider using next-themes pattern
interface ThemeConfig {
  provider: "next-themes";
  attribute: "class";                  // Tailwind dark mode via class
  defaultTheme: "system";             // Respects OS preference
  storageKey: "ims-theme";            // localStorage key
  themes: ["light", "dark"];
}
```

### 2.2 Color Tokens (CSS Custom Properties)

All colors are defined as CSS custom properties in `globals.css`, referenced via Tailwind's `hsl()` pattern.

#### Light Theme

```css
:root {
  --background: 220 14% 98%;          /* #f8f9fb */
  --foreground: 222 47% 11%;          /* #0f172a (deep navy) */
  --card: 0 0% 100%;                  /* #ffffff */
  --card-foreground: 222 47% 11%;
  --primary: 222 47% 11%;             /* #0f172a */
  --primary-foreground: 210 40% 98%;
  --accent: 217 91% 60%;              /* #2563eb (blue) */
  --accent-foreground: 0 0% 100%;
  --muted: 220 14% 96%;
  --muted-foreground: 215 16% 47%;
  --border: 220 13% 91%;
  --ring: 217 91% 60%;
  --destructive: 0 84% 60%;           /* #ef4444 */
  --success: 160 84% 39%;             /* #10b981 */
  --warning: 38 92% 50%;              /* #f59e0b */
}
```

#### Dark Theme

```css
.dark {
  --background: 222 47% 11%;          /* #0f172a */
  --foreground: 210 40% 96%;          /* #f1f5f9 */
  --card: 217 33% 17%;                /* #1e293b */
  --card-foreground: 210 40% 96%;
  --primary: 210 40% 96%;
  --primary-foreground: 222 47% 11%;
  --accent: 217 91% 60%;              /* #2563eb — same in both themes */
  --accent-foreground: 0 0% 100%;
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;
  --border: 217 33% 22%;
  --ring: 217 91% 60%;
  --destructive: 0 63% 31%;
  --success: 160 84% 30%;
  --warning: 38 92% 40%;
}
```

### 2.3 Status Colors (Consistent across themes)

| Status | Light Mode | Dark Mode |
|--------|-----------|-----------|
| Success/Online | `#10b981` | `#10b981` (same) |
| Warning/Maintenance | `#f59e0b` | `#f59e0b` (same) |
| Danger/Offline/Critical | `#ef4444` | `#ef4444` (same) |
| Info | `#2563eb` | `#60a5fa` (lighter for dark bg) |
| Neutral | `#64748b` | `#94a3b8` (lighter for dark bg) |

### 2.4 Theme Toggle Component

```typescript
// ThemeToggle.tsx — placed in header (48px fixed header)
// Sun icon for light mode, Moon icon for dark mode
// Smooth 150ms transition on toggle
// Keyboard accessible: Enter/Space to toggle
// ARIA: role="switch", aria-checked, aria-label="Toggle theme"
```

---

## 3. Connectivity Monitoring

### 3.1 Service Health Model

```typescript
interface ServiceHealth {
  service: "AppSync" | "DynamoDB" | "Cognito" | "OpenSearch" | "S3" | "CloudFront";
  status: "Healthy" | "Degraded" | "Down";
  latencyMs: number;                   // last measured response time
  lastChecked: AWSDateTime;
  errorRate: number;                   // percentage in last 5 min
  details: string;                     // human-readable status message
}
```

### 3.2 Health Check Strategy

| Service | Check Method | Interval | Healthy Threshold |
|---------|-------------|----------|-------------------|
| AppSync | Lightweight query (getDevice with known ID) | 30s | < 500ms response, no errors |
| DynamoDB | Implicit via AppSync query success | 30s | AppSync query succeeds |
| Cognito | Token refresh success | 60s | Token refresh completes |
| OpenSearch | searchGlobal("_healthcheck", limit=1) | 60s | < 1000ms response |
| S3 | HEAD request to known object | 120s | 200 response |
| CloudFront | Current page load success | Passive | Page resources load |

### 3.3 Frontend Implementation

```typescript
// useConnectivityMonitor.ts — custom hook
interface ConnectivityState {
  services: ServiceHealth[];
  overallStatus: "AllHealthy" | "SomeDegraded" | "CriticalDown";
  isOnline: boolean;                   // navigator.onLine
  lastCheckedAt: Date;
}

// Runs health checks on intervals
// Updates context consumed by ConnectivityStatusBar and header indicator
// Falls back gracefully: if OpenSearch is down, shows "Search Unavailable" but platform remains functional
```

---

## 4. KPI Dashboards

### 4.1 KPI Data Sources

All KPI data is sourced from OpenSearch server-side aggregations (via `getAggregations` query from Epic 18) rather than client-side computation.

| KPI | Aggregation Query | Metric Name |
|-----|------------------|-------------|
| Total Devices | `getAggregations("deviceCount")` | `deviceCount` |
| Devices by Status | `getAggregations("devicesByStatus")` | `devicesByStatus` |
| Active Deployments | `getAggregations("activeDeployments")` | `activeDeployments` |
| Pending Approvals | `getAggregations("pendingApprovals")` | `pendingApprovals` |
| Fleet Health Score | `getAggregations("avgHealthScore")` | `avgHealthScore` |
| Compliance by Status | `getAggregations("complianceByStatus")` | `complianceByStatus` |
| Deployment Trend | `getAggregations("deploymentTrend", timeRange)` | `deploymentTrend` |
| Top Vulnerabilities | `getAggregations("topVulnerabilities")` | `topVulnerabilities` |
| Incident Metrics | `getAggregations("incidentMetrics")` | `incidentMetrics` |
| Health Score Distribution | `getAggregations("healthScoreDistribution")` | `healthScoreDistribution` |

### 4.2 Dashboard Layout Specification

```
┌────────────────────────────────────────────────────────────┐
│  KPI Cards (4 compact cards in a row)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ 1,247    │ │ 8        │ │ 3        │ │ 94.2     │      │
│  │ Devices  │ │ Deploy.  │ │ Pending  │ │ Health   │      │
│  │ ↑ 2.3%   │ │ ↓ 1      │ │ → same   │ │ ↑ 1.4   │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
├────────────────────────────────────────────────────────────┤
│  Quick Actions (6 links with badge counts)                  │
│  [Pending Approvals 3] [Open Incidents 2] [Offline 5]      │
│  [Service Orders 12]   [Config Drift 8]   [Critical CVE 1] │
├─────────────────────────┬──────────────────────────────────┤
│  Recent Alerts           │  System Status                   │
│  Last 24hr audit events │  Connectivity: All Healthy ✅     │
│  - FW v3.2 approved     │  ┌─────────────┬───────────┐    │
│  - Device SG-042 offline│  │ AppSync     │ ✅ 45ms   │    │
│  - CVE-2026-1234 found  │  │ DynamoDB    │ ✅ 12ms   │    │
│                          │  │ Cognito     │ ✅ 89ms   │    │
│                          │  │ OpenSearch  │ ✅ 156ms  │    │
│                          │  └─────────────┴───────────┘    │
└─────────────────────────┴──────────────────────────────────┘
```

---

## 5. Executive Summary Page

A dedicated page (`/executive-summary`) designed for projection in client meetings.

### 5.1 Layout

```
┌────────────────────────────────────────────────────────────┐
│  [Logo]  Executive Summary — March 2026    [Export] [Print] │
├────────────────────────────────────────────────────────────┤
│  Fleet Overview                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ 1,247    │ │ 94.2%    │ │ 99.7%    │ │ 3        │      │
│  │ Total    │ │ Health   │ │ Uptime   │ │ Open     │      │
│  │ Devices  │ │ Score    │ │ (30d)    │ │ Incidents│      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
├────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐  ┌──────────────────────────┐      │
│  │ Device Status Pie  │  │ Health Trend (30d line)  │      │
│  │ Online: 1,180      │  │ [chart]                  │      │
│  │ Offline: 42        │  │                          │      │
│  │ Maintenance: 25    │  │                          │      │
│  └────────────────────┘  └──────────────────────────┘      │
├────────────────────────────────────────────────────────────┤
│  Compliance Summary          │  Deployment Activity         │
│  Approved: 45                │  Weekly trend bar chart      │
│  Pending: 8                  │  [chart]                     │
│  Deprecated: 3               │                              │
└──────────────────────────────┴─────────────────────────────┘
```

### 5.2 Executive Summary Features

- Clean, presentation-ready layout with minimal chrome
- "Print" button generates a print-friendly CSS layout
- "Export" button downloads the summary as a PNG image (html2canvas)
- Auto-refreshes every 60 seconds
- Time range selector: Last 7 days / 30 days / 90 days / Custom
- Data sourced entirely from OpenSearch aggregations

---

## 6. Frontend Component Hierarchy

```
src/app/components/
  theme/
    ThemeProvider.tsx                   # next-themes provider wrapper
    ThemeToggle.tsx                     # Sun/Moon toggle in header
  connectivity/
    ConnectivityStatusBar.tsx           # Compact bar below header (shown when degraded/down)
    ServiceHealthPanel.tsx             # Expanded panel with all service statuses
    ServiceHealthCard.tsx              # Individual service status card
    useConnectivityMonitor.ts          # Custom hook for health checks
  kpi/
    KpiCard.tsx                        # Reusable KPI card with value, label, trend
    KpiCardGrid.tsx                    # Responsive grid of KPI cards
    QuickActionLink.tsx                # Badge-counted action link
    QuickActionsGrid.tsx               # Grid of quick action links
  dashboard/
    DashboardPage.tsx                  # Main dashboard (updated)
    RecentAlerts.tsx                   # Audit log panel (existing, enhanced)
    SystemStatusPanel.tsx              # Service connectivity + status indicators
  executive/
    ExecutiveSummaryPage.tsx           # /executive-summary route
    FleetOverviewSection.tsx           # Top KPI cards
    StatusDistributionChart.tsx        # Pie charts
    TrendChartSection.tsx              # Line/bar trend charts
    ComplianceSummarySection.tsx       # Compliance stats
    ExportControls.tsx                 # Print + PNG export buttons
  analytics/
    AnalyticsPage.tsx                  # Enhanced analytics (updated)
    ServerSideChart.tsx                # Chart wrapper using OpenSearch aggregations
    TimeRangeSelector.tsx              # Reusable time range picker
```

---

## 7. Enterprise UX Compliance Checklist

From Section 10.7 of the master brief:

| Principle | Implementation |
|-----------|---------------|
| Color restraint | Single accent (navy + blue), neutral backgrounds, NO gradients |
| Space-efficient layout | Compact cards, dense tables, 60-120px section spacing |
| Collapsible sidebar | 56px collapsed (icon-only), 240px expanded, persisted in localStorage |
| Notification panel | 360px slide-out from right, severity badges, deep links |
| Professional typography | Inter font, measured hierarchy, no playful fonts |
| Data-first design | Tables and badges primary, cards compact, no decorative elements |
| Subtle interactions | 150-200ms transitions, purposeful hover states, no bouncy animations |
| Authority signals | Device counts, NIST badges, approval indicators prominent |
| Enterprise navigation | Breadcrumbs, contextual tabs, Cmd+K command palette |
| Zero decoration | No illustrations, gradient blobs, or decorative SVGs |

---

## 8. Accessibility Requirements (WCAG 2.1 AA)

| Requirement | Implementation in this Epic |
|-------------|----------------------------|
| Color contrast | 4.5:1 minimum verified for both light and dark themes |
| Theme toggle | Keyboard accessible (Enter/Space), ARIA role="switch" |
| KPI cards | Screen reader announces value + label + trend |
| Charts | Alternative text description for each chart, data table fallback |
| Connectivity status | ARIA live region for status changes announced to screen readers |
| Focus indicators | 2px solid accent ring on all interactive elements in both themes |
| Reduced motion | `prefers-reduced-motion` disables all transitions |
