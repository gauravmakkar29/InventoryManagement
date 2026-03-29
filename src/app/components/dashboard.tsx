import {
  Monitor,
  Rocket,
  ShieldCheck,
  Activity,
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
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../lib/use-auth";
import { useDashboardData } from "../../lib/use-dashboard-data";
import type { FetchState } from "../../lib/use-dashboard-data";

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
function DonutChart({
  value,
  size = 140,
  strokeWidth = 10,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#FF7900"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Segmented Bar — fleet status
// ---------------------------------------------------------------------------
function SegmentedBar({
  segments,
}: {
  segments: { label: string; value: number; color: string; pct: number }[];
}) {
  return (
    <div className="space-y-2">
      {/* Percentage labels above */}
      <div className="flex">
        {segments.map((seg, i) => (
          <div
            key={i}
            className="text-center text-[11px] font-medium text-gray-500"
            style={{ width: `${seg.pct}%` }}
          >
            {seg.pct}%
          </div>
        ))}
      </div>
      {/* Bar */}
      <div className="flex h-2.5 overflow-hidden rounded-full bg-gray-100">
        {segments.map((seg, i) => (
          <div
            key={i}
            style={{
              width: `${seg.pct}%`,
              backgroundColor: seg.color,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton KPI Card
// ---------------------------------------------------------------------------
function KpiSkeleton() {
  return (
    <div className="card-elevated p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="h-10 w-10 rounded-xl bg-gray-100" />
      </div>
      <div className="mt-4">
        <div className="h-8 w-24 rounded-md bg-gray-100" />
        <div className="mt-2 h-4 w-20 rounded-md bg-gray-100" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-4 w-10 rounded-md bg-gray-100" />
        <div className="h-3 w-16 rounded-md bg-gray-100" />
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
      <RefreshCw className="h-8 w-8 text-gray-300 mb-3" />
      <p className="text-[14px] font-medium text-gray-700">{message}</p>
      <button
        onClick={onRetry}
        className="mt-3 rounded-lg bg-[#FF7900] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#e66d00] cursor-pointer"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
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
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {METRIC_CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="card-elevated p-5">
            <div className="flex items-start justify-between">
              <div
                className={cn("flex h-10 w-10 items-center justify-center rounded-xl", card.iconBg)}
              >
                <Icon className={cn("h-5 w-5", card.iconColor)} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-[30px] font-bold leading-none text-gray-900 tabular-nums">
                {card.value}
              </p>
              <p className="mt-1.5 text-[13px] text-gray-500">{card.label}</p>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Sparkline data={card.spark} color={card.sparkColor} />
              <div className="flex items-center gap-1">
                {card.trendUp ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-emerald-500" />
                )}
                <span className="text-[11px] font-medium text-emerald-600">{card.trend}</span>
                <span className="text-[11px] text-gray-400">{card.trendLabel}</span>
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
    icon: Monitor,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    sparkColor: "#3b82f6",
  },
  {
    label: "Active Deployments",
    value: "18",
    trend: "+3",
    trendUp: true,
    trendLabel: "this week",
    spark: [8, 12, 10, 14, 15, 16, 18],
    icon: Rocket,
    iconBg: "bg-orange-50",
    iconColor: "text-[#FF7900]",
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
    iconColor: "text-amber-500",
    sparkColor: "#f59e0b",
  },
  {
    label: "Fleet Health",
    value: "94.2%",
    trend: "+0.8%",
    trendUp: true,
    trendLabel: "vs last month",
    spark: [91.2, 92.0, 92.8, 93.1, 93.5, 93.9, 94.2],
    icon: Activity,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
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
    moduleBg: "bg-orange-50 text-[#FF7900]",
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
    iconColor: "text-[#FF7900]",
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
    iconBg: "bg-gray-100",
    iconColor: "text-gray-500",
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
          <p className="text-[13px] font-medium text-amber-700">
            You are offline. Some data may be stale.
          </p>
        </div>
      )}

      {/* ================================================================ */}
      {/* Row 1: Welcome + Date/Refresh */}
      {/* ================================================================ */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[20px] font-medium text-gray-900">
            {greeting}, {displayName}
          </h2>
          <p className="mt-0.5 text-[13px] text-gray-500">
            Here&apos;s your fleet overview for today
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-gray-400">{dateStr}</span>
          {dashData?.lastUpdated && (
            <span className="text-[11px] text-gray-300">
              Updated {dashData.lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={dashState === "loading"}
            className={cn(
              "flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500",
              "hover:bg-gray-50 hover:text-gray-700",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7900]",
              "disabled:cursor-not-allowed disabled:opacity-50",
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
          <h3 className="text-[14px] font-semibold text-gray-900 mb-3">System Status</h3>
          <div className="grid grid-cols-2 gap-3">
            {SYSTEM_SERVICES.map((svc) => (
              <div
                key={svc.name}
                className="flex items-center gap-2.5 rounded-lg bg-gray-50 px-3 py-2.5"
                title={`Last checked: ${svc.lastChecked}`}
              >
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    svc.status === "healthy" ? "bg-emerald-500" : "bg-red-500",
                  )}
                />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-gray-700">{svc.name}</p>
                  <p className="text-[11px] text-gray-400">{svc.lastChecked}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card-elevated px-5 py-4">
          <h3 className="text-[14px] font-semibold text-gray-900 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <a
                  key={action.label}
                  href={action.path}
                  className="relative flex flex-col items-center gap-1.5 rounded-lg px-2 py-3 text-center hover:bg-gray-50"
                >
                  <Icon className="h-5 w-5 text-gray-400" />
                  <span className="text-[12px] text-gray-600">{action.label}</span>
                  {action.badge > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
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
            <h3 className="text-[16px] font-semibold text-gray-900">Fleet Status</h3>
            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[12px] font-medium text-[#FF7900]">
              1,247 devices
            </span>
          </div>

          <div className="px-5 pb-5 space-y-5">
            {/* Segmented bar */}
            <SegmentedBar segments={FLEET_SEGMENTS} />

            {/* Stat boxes */}
            <div className="grid grid-cols-3 gap-3">
              {FLEET_SEGMENTS.map((seg) => (
                <div key={seg.label} className="rounded-lg bg-gray-50 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="text-[12px] text-gray-500">{seg.label}</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-[18px] font-semibold text-gray-900 tabular-nums">
                      {seg.value}
                    </span>
                    <span className="text-[11px] text-gray-400">{seg.pct}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Top Regions */}
            <div>
              <p className="mb-3 text-[13px] font-semibold text-gray-900">Top Regions</p>
              <div className="space-y-2.5">
                {TOP_REGIONS.map((region) => (
                  <div key={region.name} className="flex items-center gap-3">
                    <span className="w-[110px] truncate text-[13px] text-gray-600">
                      {region.name}
                    </span>
                    <div className="flex-1">
                      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${region.pct}%`,
                            backgroundColor: "#10b981",
                          }}
                        />
                      </div>
                    </div>
                    <span className="w-[40px] text-right text-[12px] font-mono tabular-nums text-gray-500">
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
            <h3 className="text-[16px] font-semibold text-gray-900">Health Score</h3>
          </div>

          <div className="flex flex-col items-center px-5 pb-5">
            {/* Donut */}
            <div className="relative">
              <DonutChart value={94.2} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[24px] font-bold tabular-nums text-gray-900">94.2%</span>
              </div>
            </div>
            <p className="mt-3 text-[13px] text-gray-500">Overall Fleet Health</p>

            {/* Mini stats 2x2 grid */}
            <div className="mt-5 grid w-full grid-cols-2 gap-3">
              {HEALTH_MINI_STATS.map((stat) => (
                <div key={stat.label} className="rounded-lg bg-gray-50 px-3 py-2.5 text-center">
                  <p className="text-[15px] font-semibold text-gray-900 tabular-nums">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-400">{stat.label}</p>
                </div>
              ))}
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
            <h3 className="text-[16px] font-semibold text-gray-900">Recent Activity</h3>
            <button className="flex items-center gap-1 text-[13px] font-medium text-[#FF7900] hover:underline cursor-pointer">
              View all activity <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-gray-100">
                  <th className="px-5 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400" />
                  <th className="px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                    Description
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                    Module
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                    User
                  </th>
                  <th className="px-5 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-gray-400">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {RECENT_ACTIVITY.map((row, i) => (
                  <tr key={i} className={cn("h-[44px]", i % 2 === 1 && "bg-gray-50/50")}>
                    <td className="px-5">
                      <span
                        className="block h-2 w-2 rounded-full"
                        style={{ backgroundColor: row.dot }}
                      />
                    </td>
                    <td className="px-3 text-[13px] text-gray-700">{row.description}</td>
                    <td className="px-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                          row.moduleBg,
                        )}
                      >
                        {row.module}
                      </span>
                    </td>
                    <td className="px-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[9px] font-semibold text-gray-600">
                          {row.user}
                        </span>
                        <span className="text-[12px] text-gray-500">{row.userName}</span>
                      </div>
                    </td>
                    <td className="px-5 text-right text-[12px] text-gray-400">{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Requires Attention — 2 cols */}
        <div className="col-span-2 card-elevated">
          <div className="flex items-center justify-between px-5 py-4">
            <h3 className="text-[16px] font-semibold text-gray-900">Requires Attention</h3>
          </div>

          <div className="px-3 pb-3 space-y-1">
            {ATTENTION_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 hover:bg-gray-50"
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
                    <p className="text-[14px] font-medium text-gray-900">{item.title}</p>
                    <p className="text-[12px] text-gray-400 truncate">{item.subtitle}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-100 px-5 py-3">
            <button className="flex items-center gap-1 text-[13px] font-medium text-[#FF7900] hover:underline cursor-pointer">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
