import { useState } from "react";
import { cn } from "../../lib/utils";

type TimeRange = "7d" | "30d" | "90d";

const KPI_DATA = [
  { label: "Total Devices", value: "2,847" },
  { label: "Online", value: "2,691", accent: true },
  { label: "Active Deployments", value: "18" },
  { label: "Pending Approvals", value: "7" },
  { label: "Health Score", value: "94.2%" },
];

const PLACEHOLDER_AUDIT = [
  { time: "Mar 28, 14:32", user: "j.chen@hlm.com", action: "Uploaded firmware v3.2.1" },
  { time: "Mar 27, 09:15", user: "a.patel@hlm.com", action: "Approved firmware v4.0.0" },
  { time: "Mar 26, 16:48", user: "system", action: "Deployment completed: 1,842 devices" },
  { time: "Mar 25, 11:20", user: "j.chen@hlm.com", action: "Submitted v4.1.0-rc1 for testing" },
  { time: "Mar 24, 08:00", user: "system", action: "Vulnerability scan completed" },
  { time: "Mar 23, 15:30", user: "m.rodriguez@hlm.com", action: "Created service order SO-1043" },
];

function ChartPlaceholder({ title, type }: { title: string; type: "pie" | "line" | "bar" }) {
  return (
    <div className="flex flex-col rounded-sm border border-border bg-card p-3">
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="mt-2 flex flex-1 items-center justify-center">
        <div className="text-center text-[10px] text-muted-foreground">
          <p className="capitalize">{type} chart</p>
          <p className="mt-0.5">Powered by Recharts</p>
        </div>
      </div>
    </div>
  );
}

export function Analytics() {
  const [range, setRange] = useState<TimeRange>("30d");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-bold text-foreground">Analytics</h1>
        <div className="flex rounded-sm border border-border">
          {(["7d", "30d", "90d"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "px-2.5 py-1 text-[10px] font-medium",
                range === r
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-5 gap-2">
        {KPI_DATA.map((kpi) => (
          <div key={kpi.label} className="rounded-sm border border-border bg-card p-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {kpi.label}
            </p>
            <p
              className={cn(
                "mt-1 text-xl font-bold tabular-nums",
                kpi.accent ? "text-accent" : "text-foreground"
              )}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="min-h-[180px]">
          <ChartPlaceholder title="Device Status Distribution" type="pie" />
        </div>
        <div className="min-h-[180px]">
          <ChartPlaceholder title="Firmware Version Distribution" type="pie" />
        </div>
        <div className="min-h-[180px]">
          <ChartPlaceholder title="Device Health Trend" type="line" />
        </div>
        <div className="min-h-[180px]">
          <ChartPlaceholder title="Deployments by Region" type="bar" />
        </div>
      </div>

      {/* Audit log */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Recent Audit Activity
        </h2>
        <div className="overflow-auto rounded-sm border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Time</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">User</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {PLACEHOLDER_AUDIT.map((log, i) => (
                <tr
                  key={i}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-3 py-2 font-mono text-muted-foreground whitespace-nowrap">
                    {log.time}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{log.user}</td>
                  <td className="px-3 py-2 text-foreground">{log.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
