import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnalyticsData } from "@/lib/hooks/use-analytics-data";
import {
  TIME_RANGE_OPTIONS,
  KPI_DATA,
  DEVICE_STATUS_SEGMENTS,
  COMPLIANCE_SEGMENTS,
  MONTHLY_DEPLOYMENTS,
  VULN_SEVERITY,
} from "@/lib/mock-data/analytics-data";
import { RingChart } from "./analytics/ring-chart";
import { BarChart } from "./analytics/bar-chart";
import { HorizontalBarChart } from "./analytics/horizontal-bar-chart";
import { AuditLogTable } from "./analytics/audit-log-table";

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
      <AuditLogTable
        rangeLabel={rangeLabel}
        searchQuery={searchQuery}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        filteredAuditLogs={filteredAuditLogs}
        paginatedLogs={paginatedLogs}
        pageSize={pageSize}
        handleSearchChange={handleSearchChange}
      />
    </div>
  );
}
