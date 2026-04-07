import { RefreshCw, WifiOff } from "lucide-react";
import { cn } from "../../../lib/utils";
import { useAuth } from "../../../lib/use-auth";
import { useDashboardData } from "../../../lib/use-dashboard-data";
import { KpiCards } from "./kpi-cards";
import { DashboardCharts } from "./dashboard-charts";
import { RecentActivity } from "./recent-activity";
import { SystemStatusRow, RequiresAttention } from "./system-status";

// ---------------------------------------------------------------------------
// Dashboard — layout shell
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
        <div className="flex items-center gap-2 rounded-lg border border-warning-bg bg-warning-bg px-4 py-3">
          <WifiOff className="h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
          <p className="text-[14px] font-medium text-warning-text">
            You are offline. Some data may be stale.
          </p>
        </div>
      )}

      {/* Row 1: Welcome + Date/Refresh */}
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
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Row 2: KPI Metric Cards */}
      <KpiCards state={dashState} onRetry={refresh} />

      {/* Row 2b: System Status + Quick Actions */}
      <SystemStatusRow />

      {/* Row 3: Fleet Status + Health Score */}
      <DashboardCharts />

      {/* Row 4: Recent Activity + Requires Attention */}
      <div className="grid grid-cols-5 gap-5">
        <RecentActivity />
        <RequiresAttention />
      </div>
    </div>
  );
}
