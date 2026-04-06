import { useState, useCallback } from "react";
import { usePolling } from "@/lib/hooks/use-polling";
import { Server, HeartPulse, Clock, AlertTriangle, Download, Printer } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Story 16.4: Executive Summary Page
 *
 * Presentation-ready page for client meetings.
 * Shows fleet KPIs, device status distribution, health trend,
 * compliance summary, and deployment activity.
 * Auto-refreshes every 60 seconds.
 */

type TimeRange = "7d" | "30d" | "90d";

// Mock data — in production sourced from OpenSearch aggregations
const FLEET_KPIS = [
  {
    label: "Total Devices",
    value: "1,247",
    icon: Server,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    label: "Health Score",
    value: "94.2%",
    icon: HeartPulse,
    color: "text-success",
    bg: "bg-emerald-50",
  },
  {
    label: "Uptime (30d)",
    value: "99.7%",
    icon: Clock,
    color: "text-accent-text",
    bg: "bg-orange-50",
  },
  {
    label: "Open Incidents",
    value: "3",
    icon: AlertTriangle,
    color: "text-warning",
    bg: "bg-amber-50",
  },
];

const DEVICE_STATUS = [
  { label: "Online", value: 1180, color: "#10b981", pct: 94.6 },
  { label: "Offline", value: 42, color: "#ef4444", pct: 3.4 },
  { label: "Maintenance", value: 25, color: "#f59e0b", pct: 2.0 },
];

const COMPLIANCE_DATA = [
  { label: "Approved", value: 45, color: "#10b981" },
  { label: "Pending", value: 8, color: "#f59e0b" },
  { label: "Deprecated", value: 3, color: "#ef4444" },
];

const DEPLOYMENT_WEEKLY = [
  { week: "W1", count: 12 },
  { week: "W2", count: 18 },
  { week: "W3", count: 8 },
  { week: "W4", count: 22 },
];

const HEALTH_TREND = [92.1, 93.0, 93.4, 92.8, 93.5, 94.0, 94.2, 93.8, 94.1, 94.2];

function PieChart({ segments }: { segments: typeof DEVICE_STATUS }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeAngle = -90;
  const gap = 3;
  const totalGap = gap * segments.length;
  const availableDeg = 360 - totalGap;

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {segments.map((seg) => {
          const pctOfTotal = seg.value / total;
          const segDeg = pctOfTotal * availableDeg;
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
              strokeLinecap="round"
              transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
            />
          );
        })}
        <text
          x={size / 2}
          y={size / 2 - 6}
          textAnchor="middle"
          className="fill-foreground text-[24px] font-bold"
        >
          {total.toLocaleString()}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 14}
          textAnchor="middle"
          className="fill-muted-foreground text-[13px]"
        >
          Total Devices
        </text>
      </svg>
      {/* Accessible table alternative */}
      <div className="space-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-sm shrink-0"
              style={{ backgroundColor: seg.color }}
              aria-hidden="true"
            />
            <span className="text-[14px] text-foreground font-medium w-24">{seg.label}</span>
            <span className="text-[15px] font-bold tabular-nums text-foreground">
              {seg.value.toLocaleString()}
            </span>
            <span className="text-[13px] text-muted-foreground">({seg.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({
  data,
  color,
  label,
}: {
  data: { label: string; value: number }[];
  color: string;
  label: string;
}) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div role="img" aria-label={label}>
      <div className="flex items-end gap-3 h-[120px]">
        {data.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[13px] font-bold tabular-nums text-foreground">{d.value}</span>
            <div
              className="w-full rounded-t-md"
              style={{
                height: `${(d.value / max) * 100}%`,
                backgroundColor: color,
                minHeight: "4px",
              }}
            />
            <span className="text-[12px] text-muted-foreground">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AreaTrend({ data, label }: { data: number[]; label: string }) {
  const w = 400;
  const h = 120;
  const min = Math.min(...data) - 1;
  const max = Math.max(...data) + 1;
  const range = max - min;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");
  const areaPoints = `0,${h} ${points} ${w},${h}`;

  return (
    <div role="img" aria-label={label}>
      <svg
        width="100%"
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="execTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon fill="url(#execTrendFill)" points={areaPoints} />
        <polyline
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    </div>
  );
}

export function ExecutiveSummaryPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const refresh = useCallback(() => {
    setLastRefresh(new Date());
  }, []);

  // Auto-refresh every 60 seconds with visibility-aware backoff (AC5)
  usePolling(refresh, 60_000);

  const handleExport = () => {
    // In production, use html2canvas to capture the page as PNG
    window.print();
  };

  const handlePrint = () => {
    window.print();
  };

  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-foreground">Executive Summary</h2>
          <p className="text-[14px] text-muted-foreground">
            {dateStr} | Last updated {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-3 print-hidden">
          {/* Time Range Selector (AC2) */}
          <div
            className="flex rounded-lg border border-border bg-muted/50 p-0.5"
            role="group"
            aria-label="Time range"
          >
            {(["7d", "30d", "90d"] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[14px] font-medium cursor-pointer",
                  timeRange === range
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={timeRange === range}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[14px] font-medium text-foreground hover:bg-muted cursor-pointer"
            aria-label="Export as image"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[14px] font-medium text-foreground hover:bg-muted cursor-pointer"
            aria-label="Print summary"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* Fleet Overview KPIs (AC1) */}
      <section aria-label="Fleet Overview">
        <h3 className="text-base font-semibold text-foreground mb-3">Fleet Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {FLEET_KPIS.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="card-elevated px-4 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      kpi.bg,
                    )}
                  >
                    <Icon className={cn("h-5 w-5", kpi.color)} />
                  </div>
                  <div>
                    <p className="text-[13px] text-muted-foreground">{kpi.label}</p>
                    <p className="text-[28px] font-bold leading-snug text-foreground tabular-nums print:text-[36px]">
                      {kpi.value}
                    </p>
                  </div>
                </div>
                {/* Screen reader friendly (Story 16.6 AC3) */}
                <span className="sr-only">
                  {kpi.label}: {kpi.value}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Charts Row 1: Device Status + Health Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="card-elevated px-5 py-4" aria-label="Device Status Distribution">
          <h3 className="text-base font-semibold text-foreground mb-4">Device Status</h3>
          <PieChart segments={DEVICE_STATUS} />
          {/* Accessible data table alternative (Story 16.6 AC4) */}
          <details className="mt-3 print-hidden">
            <summary className="text-[13px] text-muted-foreground cursor-pointer hover:text-foreground">
              View as table
            </summary>
            <table className="mt-2 w-full text-[14px]" role="table">
              <caption className="sr-only">Device fleet status breakdown</caption>
              <thead>
                <tr>
                  <th scope="col" className="text-left font-medium text-muted-foreground py-1">
                    Status
                  </th>
                  <th scope="col" className="text-right font-medium text-muted-foreground py-1">
                    Count
                  </th>
                  <th scope="col" className="text-right font-medium text-muted-foreground py-1">
                    %
                  </th>
                </tr>
              </thead>
              <tbody>
                {DEVICE_STATUS.map((s) => (
                  <tr key={s.label}>
                    <td className="py-1 text-foreground">{s.label}</td>
                    <td className="py-1 text-right tabular-nums text-foreground">
                      {s.value.toLocaleString()}
                    </td>
                    <td className="py-1 text-right tabular-nums text-muted-foreground">{s.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </section>

        <section className="card-elevated px-5 py-4" aria-label="Health Trend">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Health Trend ({timeRange})
          </h3>
          <AreaTrend data={HEALTH_TREND} label={`Fleet health score trend over ${timeRange}`} />
          <div className="mt-2 flex items-center justify-between text-[13px] text-muted-foreground">
            <span>Start</span>
            <span>Current: {HEALTH_TREND[HEALTH_TREND.length - 1]}%</span>
          </div>
        </section>
      </div>

      {/* Charts Row 2: Compliance + Deployment Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="card-elevated px-5 py-4" aria-label="Compliance Summary">
          <h3 className="text-base font-semibold text-foreground mb-4">Compliance Summary</h3>
          <BarChart
            data={COMPLIANCE_DATA.map((c) => ({ label: c.label, value: c.value }))}
            color="#2563eb"
            label="Compliance status: Approved, Pending, Deprecated counts"
          />
          {/* Accessible table */}
          <details className="mt-3 print-hidden">
            <summary className="text-[13px] text-muted-foreground cursor-pointer hover:text-foreground">
              View as table
            </summary>
            <table className="mt-2 w-full text-[14px]" role="table">
              <caption className="sr-only">Compliance status summary</caption>
              <thead>
                <tr>
                  <th scope="col" className="text-left font-medium text-muted-foreground py-1">
                    Status
                  </th>
                  <th scope="col" className="text-right font-medium text-muted-foreground py-1">
                    Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPLIANCE_DATA.map((c) => (
                  <tr key={c.label}>
                    <td className="py-1 text-foreground">{c.label}</td>
                    <td className="py-1 text-right tabular-nums text-foreground">{c.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </section>

        <section className="card-elevated px-5 py-4" aria-label="Deployment Activity">
          <h3 className="text-base font-semibold text-foreground mb-4">Deployment Activity</h3>
          <BarChart
            data={DEPLOYMENT_WEEKLY.map((d) => ({ label: d.week, value: d.count }))}
            color="#FF7900"
            label="Weekly deployment counts"
          />
          <details className="mt-3 print-hidden">
            <summary className="text-[13px] text-muted-foreground cursor-pointer hover:text-foreground">
              View as table
            </summary>
            <table className="mt-2 w-full text-[14px]" role="table">
              <caption className="sr-only">Weekly deployment activity</caption>
              <thead>
                <tr>
                  <th scope="col" className="text-left font-medium text-muted-foreground py-1">
                    Week
                  </th>
                  <th scope="col" className="text-right font-medium text-muted-foreground py-1">
                    Deployments
                  </th>
                </tr>
              </thead>
              <tbody>
                {DEPLOYMENT_WEEKLY.map((d) => (
                  <tr key={d.week}>
                    <td className="py-1 text-foreground">{d.week}</td>
                    <td className="py-1 text-right tabular-nums text-foreground">{d.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </section>
      </div>
    </div>
  );
}
