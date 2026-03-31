import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Server,
  Cpu,
  ShieldCheck,
  HeartPulse,
  AlertTriangle,
  Wrench,
  TrendingUp,
  TrendingDown,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "../../lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type TimeRange = "7d" | "30d" | "90d" | "ytd" | "custom";

interface KpiCard {
  label: string;
  value: string;
  icon: typeof Server;
  iconBg: string;
  iconColor: string;
  trend: string;
  trendUp: boolean;
  trendLabel: string;
}

interface RingSegment {
  label: string;
  value: number;
  color: string;
}

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: "Created" | "Modified" | "Deleted";
  entity: string;
  details: string;
}

interface MonthlyDeployment {
  month: string;
  count: number;
}

interface VulnSeverity {
  severity: string;
  count: number;
  color: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------
const TIME_RANGE_OPTIONS: { label: string; value: TimeRange }[] = [
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last 90 Days", value: "90d" },
  { label: "Year to Date", value: "ytd" },
  { label: "Custom", value: "custom" },
];

const KPI_DATA: KpiCard[] = [
  {
    label: "Total Devices",
    value: "2,847",
    icon: Server,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    trend: "+12%",
    trendUp: true,
    trendLabel: "vs last period",
  },
  {
    label: "Active Deployments",
    value: "18",
    icon: Cpu,
    iconBg: "bg-orange-50",
    iconColor: "text-[#FF7900]",
    trend: "+3",
    trendUp: true,
    trendLabel: "this period",
  },
  {
    label: "Compliance Score",
    value: "96.4%",
    icon: ShieldCheck,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    trend: "+1.2%",
    trendUp: true,
    trendLabel: "vs last period",
  },
  {
    label: "Open Vulnerabilities",
    value: "23",
    icon: AlertTriangle,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    trend: "-5",
    trendUp: false,
    trendLabel: "vs last period",
  },
  {
    label: "Service Orders (MTD)",
    value: "142",
    icon: Wrench,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    trend: "+8%",
    trendUp: true,
    trendLabel: "vs last month",
  },
  {
    label: "Avg Device Health",
    value: "94.2%",
    icon: HeartPulse,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    trend: "+0.8%",
    trendUp: true,
    trendLabel: "vs last period",
  },
];

const DEVICE_STATUS_SEGMENTS: RingSegment[] = [
  { label: "Online", value: 1973, color: "#10b981" },
  { label: "Offline", value: 412, color: "#ef4444" },
  { label: "Maintenance", value: 287, color: "#f59e0b" },
  { label: "Decommissioned", value: 175, color: "#6b7280" },
];

const COMPLIANCE_SEGMENTS: RingSegment[] = [
  { label: "Approved", value: 2104, color: "#10b981" },
  { label: "Pending", value: 389, color: "#f59e0b" },
  { label: "Non-Compliant", value: 218, color: "#ef4444" },
  { label: "Deprecated", value: 136, color: "#6b7280" },
];

const MONTHLY_DEPLOYMENTS: MonthlyDeployment[] = [
  { month: "Oct", count: 24 },
  { month: "Nov", count: 31 },
  { month: "Dec", count: 18 },
  { month: "Jan", count: 42 },
  { month: "Feb", count: 35 },
  { month: "Mar", count: 28 },
];

const VULN_SEVERITY: VulnSeverity[] = [
  { severity: "Critical", count: 3, color: "#ef4444" },
  { severity: "High", count: 8, color: "#f97316" },
  { severity: "Medium", count: 15, color: "#f59e0b" },
  { severity: "Low", count: 22, color: "#10b981" },
  { severity: "Info", count: 47, color: "#6b7280" },
];

const AUDIT_LOG_DATA: AuditEntry[] = [
  {
    id: "AUD-001",
    timestamp: "2026-03-29T14:32:00Z",
    user: "j.chen@hlm.com",
    action: "Created",
    entity: "Firmware v3.2.1",
    details: "Uploaded new firmware package for SG-INV cluster",
  },
  {
    id: "AUD-002",
    timestamp: "2026-03-29T11:15:00Z",
    user: "a.patel@hlm.com",
    action: "Modified",
    entity: "Deployment D-1842",
    details: "Approved firmware v4.0.0 for production rollout",
  },
  {
    id: "AUD-003",
    timestamp: "2026-03-28T16:48:00Z",
    user: "system",
    action: "Modified",
    entity: "Device SN-7821",
    details: "Deployment completed: firmware v3.1.0 applied",
  },
  {
    id: "AUD-004",
    timestamp: "2026-03-28T09:20:00Z",
    user: "j.chen@hlm.com",
    action: "Created",
    entity: "Firmware v4.1.0-rc1",
    details: "Submitted release candidate for testing",
  },
  {
    id: "AUD-005",
    timestamp: "2026-03-27T15:00:00Z",
    user: "system",
    action: "Modified",
    entity: "Vulnerability CVE-2026-1234",
    details: "Vulnerability scan completed on 1,247 devices",
  },
  {
    id: "AUD-006",
    timestamp: "2026-03-27T10:30:00Z",
    user: "m.rodriguez@hlm.com",
    action: "Created",
    entity: "Service Order SO-1043",
    details: "Created maintenance order for Denver DC",
  },
  {
    id: "AUD-007",
    timestamp: "2026-03-26T14:45:00Z",
    user: "s.kumar@hlm.com",
    action: "Modified",
    entity: "Compliance NIST-800-53",
    details: "Updated compliance status for Q1 audit",
  },
  {
    id: "AUD-008",
    timestamp: "2026-03-26T08:10:00Z",
    user: "a.patel@hlm.com",
    action: "Deleted",
    entity: "Firmware v2.9.0",
    details: "Deprecated firmware removed from active registry",
  },
  {
    id: "AUD-009",
    timestamp: "2026-03-25T17:22:00Z",
    user: "j.chen@hlm.com",
    action: "Created",
    entity: "Device SN-9102",
    details: "Registered new inverter at Shanghai HQ",
  },
  {
    id: "AUD-010",
    timestamp: "2026-03-25T13:05:00Z",
    user: "system",
    action: "Modified",
    entity: "Deployment D-1840",
    details: "Rollback triggered for firmware v3.0.2 on 42 devices",
  },
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
        stroke="#f1f3f5"
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
        className="fill-gray-900 text-[22px] font-bold"
      >
        {total.toLocaleString()}
      </text>
      <text
        x={size / 2}
        y={size / 2 + 14}
        textAnchor="middle"
        className="fill-gray-400 text-[11px]"
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
              stroke="#e5e7eb"
              strokeWidth={1}
              strokeDasharray={pct === 0 ? "0" : "4 4"}
            />
            <text
              x={chartWidth + 18}
              y={y + 4}
              textAnchor="end"
              className="fill-gray-400 text-[9px]"
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
              className="fill-gray-600 text-[10px] font-semibold"
            >
              {d.count}
            </text>
            <text
              x={x + barWidth / 2}
              y={height - 6}
              textAnchor="middle"
              className="fill-gray-500 text-[10px]"
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
            <text x={0} y={y + barHeight / 2 + 4} className="fill-gray-600 text-[11px] font-medium">
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
              className="fill-gray-700 text-[11px] font-bold"
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
// Export Helpers
// ---------------------------------------------------------------------------
function generateCSV(entries: AuditEntry[], timeRange: TimeRange): void {
  const headers = ["Timestamp", "User", "Action", "Entity", "Details"];
  const rows = entries.map((e) => [
    new Date(e.timestamp).toLocaleString("en-US"),
    e.user,
    e.action,
    e.entity,
    `"${e.details.replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];
  link.href = url;
  link.download = `audit-log-${timeRange}-${dateStr}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  toast.success("Audit log exported successfully");
}

function generateJSON(entries: AuditEntry[], kpis: KpiCard[], timeRange: TimeRange): void {
  const payload = {
    exportDate: new Date().toISOString(),
    timeRange,
    kpis: kpis.map((k) => ({ label: k.label, value: k.value, trend: k.trend })),
    auditLog: entries.map((e) => ({
      timestamp: e.timestamp,
      user: e.user,
      action: e.action,
      entity: e.entity,
      details: e.details,
    })),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];
  link.href = url;
  link.download = `analytics-export-${timeRange}-${dateStr}.json`;
  link.click();
  URL.revokeObjectURL(url);
  toast.success("Analytics data exported successfully");
}

// ---------------------------------------------------------------------------
// Action Badge Colors
// ---------------------------------------------------------------------------
function actionBadgeClass(action: AuditEntry["action"]): string {
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
  const [range, setRange] = useState<TimeRange>("30d");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [exportOpen, setExportOpen] = useState(false);
  const pageSize = 6;

  // Filtered audit log
  const filteredAuditLogs = useMemo(() => {
    if (!searchQuery.trim()) return AUDIT_LOG_DATA;
    const q = searchQuery.toLowerCase();
    return AUDIT_LOG_DATA.filter(
      (entry) =>
        entry.user.toLowerCase().includes(q) ||
        entry.action.toLowerCase().includes(q) ||
        entry.entity.toLowerCase().includes(q) ||
        entry.details.toLowerCase().includes(q) ||
        new Date(entry.timestamp).toLocaleString("en-US").toLowerCase().includes(q),
    );
  }, [searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAuditLogs.length / pageSize));
  const paginatedLogs = filteredAuditLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const rangeLabel = TIME_RANGE_OPTIONS.find((o) => o.value === range)?.label ?? range;

  return (
    <div className="space-y-6">
      {/* ================================================================ */}
      {/* Header + Time Range Filter (Story 7.2) */}
      {/* ================================================================ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-gray-900">Analytics</h1>
          <p className="mt-0.5 text-[13px] text-gray-500">
            Platform health and operational insights — {rangeLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
            {TIME_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setRange(opt.value);
                  setCurrentPage(1);
                }}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[12px] font-medium cursor-pointer",
                  range === opt.value
                    ? "bg-[#FF7900] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
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
                  <p className="text-[12px] text-gray-500 truncate">{kpi.label}</p>
                  <p className="text-[22px] font-bold leading-tight text-gray-900 tabular-nums">
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
                    "text-[11px] font-medium",
                    kpi.trendUp ? "text-emerald-600" : "text-red-600",
                  )}
                >
                  {kpi.trend}
                </span>
                <span className="text-[10px] text-gray-500">{kpi.trendLabel}</span>
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
            <h3 className="text-[14px] font-semibold text-gray-900">Device Status Distribution</h3>
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
                        <span className="text-[13px] font-medium text-gray-700">{seg.label}</span>
                        <span className="text-[13px] font-bold tabular-nums text-gray-900">
                          {seg.value.toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: seg.color,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-500 w-10 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Compliance Status */}
        <div className="card-elevated">
          <div className="px-5 py-4">
            <h3 className="text-[14px] font-semibold text-gray-900">Compliance Status</h3>
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
                        <span className="text-[13px] font-medium text-gray-700">{seg.label}</span>
                        <span className="text-[13px] font-bold tabular-nums text-gray-900">
                          {seg.value.toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: seg.color,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-500 w-10 text-right">{pct}%</span>
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
            <h3 className="text-[14px] font-semibold text-gray-900">Deployment Trend</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Monthly deployments (last 6 months)</p>
          </div>
          <div className="px-5 pb-5">
            <BarChart data={MONTHLY_DEPLOYMENTS} height={200} />
          </div>
        </div>

        {/* Vulnerability Breakdown — Horizontal Bar Chart */}
        <div className="card-elevated">
          <div className="px-5 py-4">
            <h3 className="text-[14px] font-semibold text-gray-900">Vulnerability Breakdown</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Open vulnerabilities by severity</p>
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
            <h3 className="text-[14px] font-semibold text-gray-900">Audit Log</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">System activity — {rangeLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search Filter */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search audit log..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 w-56 rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-[12px] text-gray-700 placeholder-gray-400 focus:border-[#FF7900] focus:outline-none focus:ring-1 focus:ring-[#FF7900]"
              />
            </div>

            {/* Export Dropdown (Story 7.6) */}
            <div className="relative">
              <button
                onClick={() => setExportOpen(!exportOpen)}
                disabled={filteredAuditLogs.length === 0}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-[12px] font-medium text-gray-600 cursor-pointer",
                  "hover:bg-gray-50 hover:text-gray-700",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
                title={filteredAuditLogs.length === 0 ? "No data to export" : "Export data"}
              >
                <Download className="h-3.5 w-3.5" />
                Export
                <ChevronDown className="h-3 w-3" />
              </button>
              {exportOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    <button
                      onClick={() => {
                        generateCSV(filteredAuditLogs, range);
                        setExportOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5 text-gray-500" />
                      Export as CSV
                    </button>
                    <button
                      onClick={() => {
                        generateJSON(filteredAuditLogs, KPI_DATA, range);
                        setExportOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5 text-gray-500" />
                      Export as JSON
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <caption className="sr-only">Audit log entries</caption>
            <thead>
              <tr className="border-b-2 border-gray-200 bg-[#f1f3f5]">
                <th
                  scope="col"
                  className="px-5 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600"
                >
                  Timestamp
                </th>
                <th
                  scope="col"
                  className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600"
                >
                  User
                </th>
                <th
                  scope="col"
                  className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600"
                >
                  Action
                </th>
                <th
                  scope="col"
                  className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600"
                >
                  Entity
                </th>
                <th
                  scope="col"
                  className="px-5 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600"
                >
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[13px] text-gray-500">
                    No audit entries found
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((entry, i) => (
                  <tr key={entry.id} className={cn("h-[44px]", i % 2 === 1 && "bg-gray-50/50")}>
                    <td className="px-5 text-[12px] font-mono text-gray-500 whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </td>
                    <td className="px-3 text-[12px] text-gray-600">{entry.user}</td>
                    <td className="px-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                          actionBadgeClass(entry.action),
                        )}
                      >
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-3 text-[12px] font-medium text-gray-700">{entry.entity}</td>
                    <td className="px-5 text-[12px] text-gray-500 max-w-[300px] truncate">
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
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
            <p className="text-[12px] text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1}
              {"-"}
              {Math.min(currentPage * pageSize, filteredAuditLogs.length)} of{" "}
              {filteredAuditLogs.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={cn(
                    "flex h-7 min-w-7 items-center justify-center rounded-md px-2 text-[11px] font-medium cursor-pointer",
                    currentPage === i + 1
                      ? "bg-[#FF7900] text-white"
                      : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
                  )}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
