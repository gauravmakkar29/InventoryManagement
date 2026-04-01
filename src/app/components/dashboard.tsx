import {
  Server,
  Cpu,
  ShieldCheck,
  HeartPulse,
  RefreshCw,
  ArrowRight,
  ChevronRight,
  Shield,
  WifiOff,
  FileWarning,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ClipboardList,
  Users,
  Rocket,
  Monitor,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../lib/use-auth";
import { useDashboardData } from "../../lib/use-dashboard-data";
import type { FetchState } from "../../lib/use-dashboard-data";
import { PipelineStatusCard } from "./search/pipeline-status-card";

// ---------------------------------------------------------------------------
// Sparkline — micro inline chart
// ---------------------------------------------------------------------------
function Sparkline({ data, color = "#10b981" }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 40;
  const h = 16;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");

  return (
    <svg width={w} height={h} className="overflow-visible shrink-0">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Donut Chart — SVG ring
// ---------------------------------------------------------------------------
function GaugeChart({ value, size = 160 }: { value: number; size?: number }) {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  // Semi-circle: half circumference
  const halfCircumference = Math.PI * radius;
  const offset = halfCircumference - (value / 100) * halfCircumference;
  const color = value >= 90 ? "#10b981" : value >= 70 ? "#f59e0b" : "#ef4444";

  return (
    <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
      <defs>
        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="40%" stopColor="#f59e0b" />
          <stop offset="70%" stopColor="#FF7900" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      {/* Background arc */}
      <path
        d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Value arc with gradient */}
      <path
        d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
        fill="none"
        stroke="url(#gaugeGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={halfCircumference}
        strokeDashoffset={offset}
      />
      {/* Needle dot */}
      {(() => {
        const angle = Math.PI - (value / 100) * Math.PI;
        const cx = size / 2 + radius * Math.cos(angle);
        const cy = size / 2 - radius * Math.sin(angle);
        return <circle cx={cx} cy={cy} r={6} fill={color} stroke="white" strokeWidth={2} />;
      })()}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Fleet Donut — ring chart with gap segments
// ---------------------------------------------------------------------------
function FleetDonut({
  segments,
  size = 140,
}: {
  segments: { label: string; value: number; color: string; pct: number }[];
  size?: number;
}) {
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = 4; // gap in degrees between segments
  const totalGap = gap * segments.length;
  const availableDeg = 360 - totalGap;

  let cumulativeAngle = -90; // start from top

  return (
    <svg width={size} height={size}>
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
        const segDeg = (seg.pct / 100) * availableDeg;
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
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Skeleton KPI Card
// ---------------------------------------------------------------------------
function KpiSkeleton() {
  return (
    <div className="card-elevated p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="h-10 w-10 rounded-xl bg-muted" />
      </div>
      <div className="mt-4">
        <div className="h-8 w-24 rounded-md bg-muted" />
        <div className="mt-2 h-4 w-20 rounded-md bg-muted" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-4 w-10 rounded-md bg-muted" />
        <div className="h-3 w-16 rounded-md bg-muted" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section Error State
// ---------------------------------------------------------------------------
function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="card-elevated flex flex-col items-center justify-center py-12 px-5">
      <RefreshCw className="h-8 w-8 text-muted-foreground mb-3" />
      <p className="text-[15px] font-medium text-foreground/80">{message}</p>
      <button
        onClick={onRetry}
        className="mt-3 rounded-lg bg-accent px-4 py-2 text-[14px] font-medium text-white hover:bg-accent-hover cursor-pointer"
      >
        Retry
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI Section — handles loading / error / success states
// ---------------------------------------------------------------------------
function KpiSection({ state, onRetry }: { state: FetchState; onRetry: () => void }) {
  if (state === "loading") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5" aria-busy="true">
        <span className="sr-only" aria-live="polite">
          Loading dashboard metrics...
        </span>
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (state === "error") {
    return <SectionError message="Failed to load dashboard metrics" onRetry={onRetry} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {METRIC_CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="card-elevated px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  card.iconBg,
                )}
              >
                <Icon className={cn("h-[18px] w-[18px]", card.iconColor)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] text-muted-foreground truncate">{card.label}</p>
                <p className="text-[22px] font-bold leading-snug text-foreground tabular-nums">
                  {card.value}
                </p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-2 pl-12">
              <Sparkline data={card.spark} color={card.sparkColor} />
              <div className="flex items-center gap-1">
                {card.trendUp ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span
                  className={cn(
                    "text-[13px] font-medium",
                    card.trendUp ? "text-emerald-600" : "text-red-600",
                  )}
                >
                  {card.trend}
                </span>
                <span className="text-[12px] text-muted-foreground">{card.trendLabel}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const METRIC_CARDS = [
  {
    label: "Total Devices",
    value: "1,247",
    trend: "+12%",
    trendUp: true,
    trendLabel: "vs last week",
    spark: [820, 870, 910, 980, 1050, 1180, 1247],
    icon: Server,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    sparkColor: "#3b82f6",
  },
  {
    label: "Active Deployments",
    value: "18",
    trend: "+3",
    trendUp: true,
    trendLabel: "this week",
    spark: [8, 12, 10, 14, 15, 16, 18],
    icon: Cpu,
    iconBg: "bg-orange-50",
    iconColor: "text-accent-text",
    sparkColor: "#FF7900",
  },
  {
    label: "Pending Approvals",
    value: "7",
    trend: "-2",
    trendUp: false,
    trendLabel: "vs yesterday",
    spark: [12, 11, 9, 10, 8, 9, 7],
    icon: ShieldCheck,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    sparkColor: "#f59e0b",
  },
  {
    label: "Fleet Health",
    value: "94.2%",
    trend: "+0.8%",
    trendUp: true,
    trendLabel: "vs last month",
    spark: [91.2, 92.0, 92.8, 93.1, 93.5, 93.9, 94.2],
    icon: HeartPulse,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    sparkColor: "#10b981",
  },
];

const FLEET_SEGMENTS = [
  { label: "Online", value: 973, color: "#10b981", pct: 78 },
  { label: "Offline", value: 150, color: "#ef4444", pct: 12 },
  { label: "Maintenance", value: 124, color: "#f59e0b", pct: 10 },
];

const TOP_REGIONS = [
  { name: "Shanghai HQ", count: 342, pct: 74 },
  { name: "Denver DC", count: 218, pct: 47 },
  { name: "Munich Office", count: 196, pct: 42 },
  { name: "Singapore Lab", count: 167, pct: 36 },
  { name: "Sao Paulo Site", count: 124, pct: 27 },
];

const HEALTH_MINI_STATS = [
  { label: "Uptime", value: "99.9%" },
  { label: "Avg Response", value: "23ms" },
  { label: "Critical Alerts", value: "2" },
  { label: "Firmware Current", value: "89%" },
];

const RECENT_ACTIVITY = [
  {
    dot: "#10b981",
    description: "Device SN-7821 registered to Shanghai HQ",
    module: "Inventory",
    moduleBg: "bg-blue-50 text-blue-700",
    user: "JM",
    userName: "J. Martinez",
    time: "2m ago",
  },
  {
    dot: "#10b981",
    description: "Firmware v4.1.2 deployed to SG-INV cluster",
    module: "Deployment",
    moduleBg: "bg-orange-50 text-accent-text",
    user: "AC",
    userName: "A. Chen",
    time: "15m ago",
  },
  {
    dot: "#f59e0b",
    description: "NIST 800-53 compliance review initiated",
    module: "Compliance",
    moduleBg: "bg-emerald-50 text-emerald-700",
    user: "SK",
    userName: "S. Kumar",
    time: "38m ago",
  },
  {
    dot: "#10b981",
    description: "Service order SO-2847 created for Denver DC",
    module: "Service",
    moduleBg: "bg-purple-50 text-purple-700",
    user: "MJ",
    userName: "M. Johnson",
    time: "1h ago",
  },
  {
    dot: "#ef4444",
    description: "CVE-2026-1234 alert acknowledged and assigned",
    module: "Security",
    moduleBg: "bg-red-50 text-red-700",
    user: "RD",
    userName: "R. Davis",
    time: "2h ago",
  },
];

const SYSTEM_SERVICES = [
  { name: "Deployment Pipeline", status: "healthy" as const, lastChecked: "2m ago" },
  { name: "Compliance Engine", status: "healthy" as const, lastChecked: "5m ago" },
  { name: "Asset Database", status: "healthy" as const, lastChecked: "1m ago" },
  { name: "Analytics Service", status: "degraded" as const, lastChecked: "8m ago" },
];

const QUICK_ACTIONS = [
  { label: "Register Device", path: "/inventory", badge: 0, icon: Monitor },
  { label: "New Deployment", path: "/deployment", badge: 3, icon: Rocket },
  { label: "Pending Reviews", path: "/compliance", badge: 5, icon: ShieldCheck },
  { label: "Service Orders", path: "/account-service", badge: 2, icon: ClipboardList },
  { label: "View Reports", path: "/analytics", badge: 0, icon: BarChart3 },
  { label: "Manage Users", path: "/user-management", badge: 1, icon: Users },
];

const ATTENTION_ITEMS = [
  {
    icon: Rocket,
    iconBg: "bg-orange-50",
    iconColor: "text-accent-text",
    title: "3 firmware approvals",
    subtitle: "v4.2.0, v4.1.3-hotfix, v3.9.8-patch",
  },
  {
    icon: Shield,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    title: "Critical CVE detected",
    subtitle: "CVE-2026-1234 affects 42 devices",
  },
  {
    icon: WifiOff,
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
    title: "2 offline devices",
    subtitle: "Denver DC — SN-4892, SN-4901",
  },
  {
    icon: FileWarning,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    title: "Compliance review due",
    subtitle: "IEC 62443 cert expires in 7 days",
  },
];

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export function Dashboard() {
  const { user, email } = useAuth();
  const { data: dashData, state: dashState, refresh } = useDashboardData();
  const displayName = user?.name ?? email?.split("@")[0] ?? "User";

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Offline Banner */}
      {!navigator.onLine && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <WifiOff className="h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-[14px] font-medium text-amber-700">
            You are offline. Some data may be stale.
          </p>
        </div>
      )}

      {/* ================================================================ */}
      {/* Row 1: Welcome + Date/Refresh */}
      {/* ================================================================ */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[20px] font-medium text-foreground">
            {greeting}, {displayName}
          </h2>
          <p className="mt-0.5 text-[14px] text-muted-foreground">
            Here&apos;s your fleet overview for today
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[14px] text-muted-foreground">{dateStr}</span>
          {dashData?.lastUpdated && (
            <span className="text-[13px] text-muted-foreground">
              Updated {dashData.lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={dashState === "loading"}
            className={cn(
              "flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-muted-foreground",
              "hover:bg-muted/50 hover:text-foreground/80",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-60",
              dashState === "loading" && "animate-spin",
            )}
            aria-label="Refresh dashboard"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* Row 2: 4 Metric Cards — with skeleton / error / data states */}
      {/* ================================================================ */}
      <KpiSection state={dashState} onRetry={refresh} />

      {/* ================================================================ */}
      {/* Row 2b: System Status Indicators + Quick Actions */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* System Status */}
        <div className="card-elevated px-5 py-4">
          <h3 className="text-[15px] font-semibold text-foreground mb-3">System Status</h3>
          <div className="grid grid-cols-2 gap-3">
            {SYSTEM_SERVICES.map((svc) => (
              <div
                key={svc.name}
                className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5"
                title={`Last checked: ${svc.lastChecked}`}
              >
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    svc.status === "healthy" ? "bg-emerald-500" : "bg-red-500",
                  )}
                />
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-foreground/80">{svc.name}</p>
                  <p className="text-[13px] text-muted-foreground">{svc.lastChecked}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Story 18.1 — OSIS Pipeline Health */}
          <div className="mt-3">
            <PipelineStatusCard />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card-elevated px-5 py-4">
          <h3 className="text-[15px] font-semibold text-foreground mb-3">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <a
                  key={action.label}
                  href={action.path}
                  className="relative flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-3 py-3.5 text-center shadow-sm hover:border-accent-text/30 hover:shadow-md transition-all"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50">
                    <Icon className="h-[18px] w-[18px] text-muted-foreground" />
                  </div>
                  <span className="text-[14px] font-medium text-foreground/80">{action.label}</span>
                  {action.badge > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[12px] font-bold text-white shadow-sm">
                      {action.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* Row 3: Fleet Status (60%) + Health Score (40%) */}
      {/* ================================================================ */}
      <div className="grid grid-cols-5 gap-5">
        {/* Fleet Status — 3 cols */}
        <div className="col-span-3 card-elevated">
          <div className="flex items-center justify-between px-5 py-4">
            <h3 className="text-[16px] font-semibold text-foreground">Fleet Status</h3>
            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[14px] font-medium text-accent-text">
              1,247 devices
            </span>
          </div>

          <div className="px-5 pb-5 space-y-5">
            {/* Donut chart + legend side by side */}
            <div className="flex items-center gap-6">
              {/* Donut */}
              <div className="relative shrink-0">
                <FleetDonut segments={FLEET_SEGMENTS} size={140} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[22px] font-bold tabular-nums text-foreground">1,247</span>
                  <span className="text-[12px] text-muted-foreground">Total</span>
                </div>
              </div>
              {/* Legend + values */}
              <div className="flex-1 space-y-3">
                {FLEET_SEGMENTS.map((seg) => (
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
                        <span className="text-[15px] font-bold tabular-nums text-foreground">
                          {seg.value.toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Regions */}
            <div>
              <p className="mb-3 text-[14px] font-semibold text-foreground">Device Distribution</p>
              <div className="space-y-2.5">
                {TOP_REGIONS.map((region, i) => (
                  <div key={region.name} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded text-[12px] font-bold text-muted-foreground bg-muted">
                      {i + 1}
                    </span>
                    <span className="w-[100px] truncate text-[14px] font-medium text-foreground/80">
                      {region.name}
                    </span>
                    <div className="flex-1">
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${region.pct}%`,
                            background: `linear-gradient(90deg, #FF7900, #f59e0b)`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="w-[40px] text-right text-[14px] font-bold tabular-nums text-foreground/80">
                      {region.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Health Score — 2 cols */}
        <div className="col-span-2 card-elevated">
          <div className="flex items-center justify-between px-5 py-4">
            <h3 className="text-[16px] font-semibold text-foreground">Health Score</h3>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[13px] font-semibold text-emerald-700">
              Healthy
            </span>
          </div>

          <div className="flex flex-col items-center px-5 pb-5">
            {/* Gauge */}
            <div className="relative mb-3">
              <GaugeChart value={94.2} />
              <div className="absolute inset-x-0 bottom-2 flex flex-col items-center">
                <span className="text-[28px] font-bold tabular-nums text-foreground">94.2%</span>
                <span className="text-[13px] text-muted-foreground">Overall Fleet Health</span>
              </div>
            </div>

            {/* Health tiers breakdown */}
            <div className="w-full space-y-2 mb-4">
              {[
                { label: "Excellent (90-100%)", count: 892, pct: 72, color: "#10b981" },
                { label: "Good (70-89%)", count: 205, pct: 16, color: "#f59e0b" },
                { label: "Fair (50-69%)", count: 108, pct: 9, color: "#FF7900" },
                { label: "Critical (<50%)", count: 42, pct: 3, color: "#ef4444" },
              ].map((tier) => (
                <div key={tier.label} className="flex items-center gap-2.5">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: tier.color }}
                  />
                  <span className="flex-1 text-[14px] text-muted-foreground">{tier.label}</span>
                  <span className="text-[14px] font-bold tabular-nums text-foreground">
                    {tier.count}
                  </span>
                </div>
              ))}
            </div>

            {/* Mini stats 2x2 grid */}
            <div className="grid w-full grid-cols-2 gap-2.5">
              {HEALTH_MINI_STATS.map((stat) => {
                const isAlert = stat.label === "Critical Alerts" && parseInt(stat.value) > 0;
                return (
                  <div
                    key={stat.label}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-center",
                      isAlert ? "border-red-200 bg-red-50" : "border-border/50 bg-muted/50",
                    )}
                  >
                    <p
                      className={cn(
                        "text-[16px] font-bold tabular-nums",
                        isAlert ? "text-red-600" : "text-foreground",
                      )}
                    >
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-[12px] font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* Row 4: Recent Activity (60%) + Requires Attention (40%) */}
      {/* ================================================================ */}
      <div className="grid grid-cols-5 gap-5">
        {/* Recent Activity — 3 cols */}
        <div className="col-span-3 card-elevated">
          <div className="flex items-center justify-between px-5 py-4">
            <h3 className="text-[16px] font-semibold text-foreground">Recent Activity</h3>
            <button className="flex items-center gap-1 text-[14px] font-medium text-accent-text hover:underline cursor-pointer">
              View all activity <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <caption className="sr-only">Recent activity log</caption>
              <thead>
                <tr className="border-b-2 border-border bg-muted">
                  <th
                    scope="col"
                    className="px-5 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
                  />
                  <th
                    scope="col"
                    className="px-3 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Description
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Module
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    User
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-2.5 text-right text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {RECENT_ACTIVITY.map((row, i) => (
                  <tr key={i} className={cn("h-[44px]", i % 2 === 1 && "bg-muted/50/50")}>
                    <td className="px-5">
                      <span
                        className="block h-2 w-2 rounded-full"
                        style={{ backgroundColor: row.dot }}
                      />
                    </td>
                    <td className="px-3 text-[14px] text-foreground/80">{row.description}</td>
                    <td className="px-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[12px] font-medium",
                          row.moduleBg,
                        )}
                      >
                        {row.module}
                      </span>
                    </td>
                    <td className="px-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[12px] font-semibold text-muted-foreground">
                          {row.user}
                        </span>
                        <span className="text-[14px] text-muted-foreground">{row.userName}</span>
                      </div>
                    </td>
                    <td className="px-5 text-right text-[14px] text-muted-foreground">
                      {row.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Requires Attention — 2 cols */}
        <div className="col-span-2 card-elevated">
          <div className="flex items-center justify-between px-5 py-4">
            <h3 className="text-[16px] font-semibold text-foreground">Requires Attention</h3>
          </div>

          <div className="px-3 pb-3 space-y-1">
            {ATTENTION_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted/50"
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      item.iconBg,
                    )}
                  >
                    <Icon className={cn("h-[18px] w-[18px]", item.iconColor)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium text-foreground">{item.title}</p>
                    <p className="text-[14px] text-muted-foreground truncate">{item.subtitle}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              );
            })}
          </div>

          <div className="border-t border-border/50 px-5 py-3">
            <button className="flex items-center gap-1 text-[14px] font-medium text-accent-text hover:underline cursor-pointer">
              View all <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
