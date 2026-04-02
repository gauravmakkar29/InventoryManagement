import { Search, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAnalyticsData } from "../../lib/hooks/use-analytics-data";
import type {
  RingSegment,
  MonthlyDeployment,
  VulnSeverity,
  AnalyticsAuditEntry,
} from "../../lib/mock-data/analytics-data";
import {
  TIME_RANGE_OPTIONS,
  KPI_DATA,
  DEVICE_STATUS_SEGMENTS,
  COMPLIANCE_SEGMENTS,
  MONTHLY_DEPLOYMENTS,
  VULN_SEVERITY,
} from "../../lib/mock-data/analytics-data";
import { ExportDropdown } from "./export-dropdown";
import type { ExportColumn } from "../../lib/use-export";

const AUDIT_EXPORT_COLUMNS: ExportColumn<AnalyticsAuditEntry>[] = [
  {
    header: "Timestamp",
    accessor: (e) => new Date(e.timestamp).toLocaleString("en-US"),
  },
  { header: "User", accessor: "user" },
  { header: "Action", accessor: "action" },
  { header: "Entity", accessor: "entity" },
  { header: "Details", accessor: "details" },
];

// ---------------------------------------------------------------------------
// Ring Chart Component (SVG donut)
// ---------------------------------------------------------------------------
function RingChart({
  segments,
  size = 160,
  strokeWidth = 20,
}: {
  segments: RingSegment[];
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);
  const gap = 3;
  const totalGapDeg = gap * segments.length;
  const availableDeg = 360 - totalGapDeg;

  let cumulativeAngle = -90;

  return (
    <svg width={size} height={size} role="img" aria-label="Ring chart">
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth={strokeWidth}
      />
      {/* Segments */}
      {segments.map((seg) => {
        const pct = total > 0 ? (seg.value / total) * 100 : 0;
        const segDeg = (pct / 100) * availableDeg;
        const segLength = (segDeg / 360) * circumference;
        const rotation = cumulativeAngle;
        cumulativeAngle += segDeg + gap;

        return (
          <circle
            key={seg.label}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${segLength} ${circumference - segLength}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
          />
        );
      })}
      {/* Center label */}
      <text
        x={size / 2}
        y={size / 2 - 6}
        textAnchor="middle"
        className="fill-foreground text-[22px] font-bold"
      >
        {total.toLocaleString()}
      </text>
      <text
        x={size / 2}
        y={size / 2 + 14}
        textAnchor="middle"
        className="fill-muted-foreground/70 text-[13px]"
      >
        Total
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Bar Chart — SVG vertical bars (Deployment Trend)
// ---------------------------------------------------------------------------
function BarChart({ data, height = 180 }: { data: MonthlyDeployment[]; height?: number }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const barWidth = 36;
  const gap = 16;
  const chartWidth = data.length * (barWidth + gap) - gap;
  const paddingTop = 20;
  const paddingBottom = 28;
  const barAreaHeight = height - paddingTop - paddingBottom;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${chartWidth + 20} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Monthly deployment bar chart"
    >
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
        const y = paddingTop + barAreaHeight * (1 - pct);
        return (
          <g key={pct}>
            <line
              x1={0}
              x2={chartWidth + 20}
              y1={y}
              y2={y}
              stroke="var(--color-border)"
              strokeWidth={1}
              strokeDasharray={pct === 0 ? "0" : "4 4"}
            />
            <text
              x={chartWidth + 18}
              y={y + 4}
              textAnchor="end"
              className="fill-muted-foreground/70 text-[12px]"
            >
              {Math.round(maxCount * pct)}
            </text>
          </g>
        );
      })}
      {/* Bars */}
      {data.map((d, i) => {
        const barHeight = (d.count / maxCount) * barAreaHeight;
        const x = i * (barWidth + gap) + 10;
        const y = paddingTop + barAreaHeight - barHeight;
        return (
          <g key={d.month}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={4}
              fill="#2563eb"
              opacity={0.85}
            />
            <text
              x={x + barWidth / 2}
              y={y - 6}
              textAnchor="middle"
              className="fill-muted-foreground text-[12px] font-semibold"
            >
              {d.count}
            </text>
            <text
              x={x + barWidth / 2}
              y={height - 6}
              textAnchor="middle"
              className="fill-muted-foreground text-[12px]"
            >
              {d.month}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Horizontal Bar Chart — SVG (Vulnerability Breakdown)
// ---------------------------------------------------------------------------
function HorizontalBarChart({ data }: { data: VulnSeverity[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const barHeight = 24;
  const gap = 12;
  const labelWidth = 70;
  const valueWidth = 40;
  const chartHeight = data.length * (barHeight + gap) - gap;

  return (
    <svg
      width="100%"
      height={chartHeight + 8}
      viewBox={`0 0 340 ${chartHeight + 8}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Vulnerability severity breakdown"
    >
      {data.map((d, i) => {
        const y = i * (barHeight + gap) + 4;
        const barMaxWidth = 340 - labelWidth - valueWidth - 16;
        const barW = (d.count / maxCount) * barMaxWidth;
        return (
          <g key={d.severity}>
            <text
              x={0}
              y={y + barHeight / 2 + 4}
              className="fill-muted-foreground text-[13px] font-medium"
            >
              {d.severity}
            </text>
            <rect
              x={labelWidth}
              y={y}
              width={barW}
              height={barHeight}
              rx={4}
              fill={d.color}
              opacity={0.85}
            />
            <text
              x={labelWidth + barW + 8}
              y={y + barHeight / 2 + 4}
              className="fill-foreground/80 text-[13px] font-bold"
            >
              {d.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Action Badge Colors
// ---------------------------------------------------------------------------
function actionBadgeClass(action: AnalyticsAuditEntry["action"]): string {
  switch (action) {
    case "Created":
      return "bg-blue-50 text-blue-700";
    case "Modified":
      return "bg-amber-50 text-amber-700";
    case "Deleted":
      return "bg-red-50 text-red-700";
  }
}

// ---------------------------------------------------------------------------
// Analytics Page
// ---------------------------------------------------------------------------
export function Analytics() {
  const {
    range,
    rangeLabel,
    searchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    filteredAuditLogs,
    paginatedLogs,
    pageSize,
    handleSearchChange,
    handleRangeChange,
    handleExportCSV,
    handleExportJSON,
  } = useAnalyticsData();

  // Legacy export handlers kept for backward compatibility; ExportDropdown
  // now provides the primary UI, but the hook handlers are still available.
  void handleExportCSV;
  void handleExportJSON;

  return (
    <div className="space-y-6">
      {/* ================================================================ */}
      {/* Header + Time Range Filter (Story 7.2) */}
      {/* ================================================================ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-foreground">Analytics</h1>
          <p className="mt-0.5 text-[14px] text-muted-foreground">
            Platform health and operational insights — {rangeLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border bg-card p-0.5">
            {TIME_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleRangeChange(opt.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[14px] font-medium cursor-pointer",
                  range === opt.value
                    ? "bg-accent text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground/80 hover:bg-muted",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* KPI Cards — 3x2 Grid (Story 7.1) */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {KPI_DATA.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="card-elevated px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    kpi.iconBg,
                  )}
                >
                  <Icon className={cn("h-[18px] w-[18px]", kpi.iconColor)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] text-muted-foreground truncate">{kpi.label}</p>
                  <p className="text-[22px] font-bold leading-snug text-foreground tabular-nums">
                    {kpi.value}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 pl-12">
                {kpi.trendUp ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span
                  className={cn(
                    "text-[13px] font-medium",
                    kpi.trendUp ? "text-emerald-600" : "text-red-600",
                  )}
                >
                  {kpi.trend}
                </span>
                <span className="text-[12px] text-muted-foreground">{kpi.trendLabel}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================================================================ */}
      {/* Pie Charts Row — Device & Compliance (Story 7.3) */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Device Status Distribution */}
        <div className="card-elevated">
          <div className="px-5 py-4">
            <h3 className="text-[15px] font-semibold text-foreground">
              Device Status Distribution
            </h3>
          </div>
          <div className="flex items-center gap-6 px-5 pb-5">
            <div className="shrink-0">
              <RingChart segments={DEVICE_STATUS_SEGMENTS} size={160} strokeWidth={20} />
            </div>
            <div className="flex-1 space-y-3">
              {DEVICE_STATUS_SEGMENTS.map((seg) => {
                const total = DEVICE_STATUS_SEGMENTS.reduce((s, x) => s + x.value, 0);
                const pct = total > 0 ? ((seg.value / total) * 100).toFixed(1) : "0";
                return (
                  <div key={seg.label} className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: seg.color }}
                    />
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[14px] font-medium text-foreground/80">
                          {seg.label}
                        </span>
                        <span className="text-[14px] font-bold tabular-nums text-foreground">
                          {seg.value.toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: seg.color,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-[13px] text-muted-foreground w-10 text-right">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Compliance Status */}
        <div className="card-elevated">
          <div className="px-5 py-4">
            <h3 className="text-[15px] font-semibold text-foreground">Compliance Status</h3>
          </div>
          <div className="flex items-center gap-6 px-5 pb-5">
            <div className="shrink-0">
              <RingChart segments={COMPLIANCE_SEGMENTS} size={160} strokeWidth={20} />
            </div>
            <div className="flex-1 space-y-3">
              {COMPLIANCE_SEGMENTS.map((seg) => {
                const total = COMPLIANCE_SEGMENTS.reduce((s, x) => s + x.value, 0);
                const pct = total > 0 ? ((seg.value / total) * 100).toFixed(1) : "0";
                return (
                  <div key={seg.label} className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: seg.color }}
                    />
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[14px] font-medium text-foreground/80">
                          {seg.label}
                        </span>
                        <span className="text-[14px] font-bold tabular-nums text-foreground">
                          {seg.value.toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: seg.color,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-[13px] text-muted-foreground w-10 text-right">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* Charts Row — Deployment Trend & Vulnerabilities (Story 7.4) */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Deployment Trend — Monthly Bar Chart */}
        <div className="card-elevated">
          <div className="px-5 py-4">
            <h3 className="text-[15px] font-semibold text-foreground">Deployment Trend</h3>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Monthly deployments (last 6 months)
            </p>
          </div>
          <div className="px-5 pb-5">
            <BarChart data={MONTHLY_DEPLOYMENTS} height={200} />
          </div>
        </div>

        {/* Vulnerability Breakdown — Horizontal Bar Chart */}
        <div className="card-elevated">
          <div className="px-5 py-4">
            <h3 className="text-[15px] font-semibold text-foreground">Vulnerability Breakdown</h3>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Open vulnerabilities by severity
            </p>
          </div>
          <div className="px-5 pb-5">
            <HorizontalBarChart data={VULN_SEVERITY} />
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* Audit Log Table (Story 7.5) + Export (Story 7.6) */}
      {/* ================================================================ */}
      <div className="card-elevated">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h3 className="text-[15px] font-semibold text-foreground">Audit Log</h3>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              System activity — {rangeLabel}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search Filter */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search audit log..."
                aria-label="Search audit log"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-8 w-56 rounded-lg border border-border bg-card pl-8 pr-3 text-[14px] text-foreground/80 placeholder-muted-foreground focus:border-accent-text focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* Export Dropdown (Story 7.6 → standardized via Story 19.20) */}
            <ExportDropdown
              data={filteredAuditLogs}
              columns={AUDIT_EXPORT_COLUMNS}
              filename="audit-log"
              title="Audit Log"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <caption className="sr-only">Audit log entries</caption>
            <thead>
              <tr className="border-b-2 border-border bg-table-header">
                <th
                  scope="col"
                  className="px-5 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Timestamp
                </th>
                <th
                  scope="col"
                  className="px-3 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  User
                </th>
                <th
                  scope="col"
                  className="px-3 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Action
                </th>
                <th
                  scope="col"
                  className="px-3 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Entity
                </th>
                <th
                  scope="col"
                  className="px-5 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-[14px] text-muted-foreground"
                  >
                    No audit entries found
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((entry, i) => (
                  <tr key={entry.id} className={cn("h-[44px]", i % 2 === 1 && "bg-muted/50")}>
                    <td className="px-5 text-[14px] font-mono text-muted-foreground whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </td>
                    <td className="px-3 text-[14px] text-muted-foreground">{entry.user}</td>
                    <td className="px-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[12px] font-medium",
                          actionBadgeClass(entry.action),
                        )}
                      >
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-3 text-[14px] font-medium text-foreground/80">
                      {entry.entity}
                    </td>
                    <td className="px-5 text-[14px] text-muted-foreground max-w-[300px] truncate">
                      {entry.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredAuditLogs.length > pageSize && (
          <div className="flex items-center justify-between border-t border-border/60 px-5 py-3">
            <p className="text-[14px] text-muted-foreground">
              Showing {(currentPage - 1) * pageSize + 1}
              {"-"}
              {Math.min(currentPage * pageSize, filteredAuditLogs.length)} of{" "}
              {filteredAuditLogs.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-muted disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={cn(
                    "flex h-7 min-w-9 items-center justify-center rounded-md px-2 text-[13px] font-medium cursor-pointer",
                    currentPage === i + 1
                      ? "bg-accent text-white"
                      : "border border-border bg-card text-muted-foreground hover:bg-muted",
                  )}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-muted disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
