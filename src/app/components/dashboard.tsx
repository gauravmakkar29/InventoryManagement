import { Link } from "react-router";
import {
  Package,
  Rocket,
  Shield,
  ClipboardList,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Activity,
} from "lucide-react";
import { cn } from "../../lib/utils";

// --- KPI Card ---
function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-sm border border-border bg-card p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold tabular-nums",
          accent ? "text-accent" : "text-foreground"
        )}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}

// --- Quick Action ---
function QuickAction({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:border-accent/50 hover:text-accent"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}

// --- Status Dot ---
function StatusDot({ label, status }: { label: string; status: "ok" | "warn" | "error" }) {
  const colors = {
    ok: "bg-success",
    warn: "bg-warning",
    error: "bg-danger",
  };
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className={cn("h-2 w-2 rounded-full", colors[status])} />
      {label}
    </div>
  );
}

export function Dashboard() {
  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Total Devices" value="2,847" sub="+12 this week" />
        <KpiCard label="Active Deployments" value="18" sub="3 pending approval" accent />
        <KpiCard label="Pending Approvals" value="7" sub="2 critical" />
        <KpiCard label="Health Score" value="94.2%" sub="Across all regions" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Quick Actions */}
        <div className="col-span-2 space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Quick Actions
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <QuickAction to="/inventory" icon={Package} label="View Inventory" />
            <QuickAction to="/deployment" icon={Rocket} label="Manage Deployments" />
            <QuickAction to="/compliance" icon={Shield} label="Compliance Review" />
            <QuickAction to="/account-service" icon={ClipboardList} label="Service Orders" />
            <QuickAction to="/analytics" icon={BarChart3} label="View Analytics" />
            <QuickAction to="/deployment" icon={Activity} label="Upload Firmware" />
          </div>

          {/* Recent Alerts */}
          <div className="mt-3 space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recent Alerts
            </h2>
            <div className="space-y-1">
              {[
                { text: "CVE-2026-1234: Critical vulnerability in firmware v3.2.1", level: "critical" as const },
                { text: "Device SN-4892 offline for >24h — Denver region", level: "warning" as const },
                { text: "Firmware v4.0.0 approved and ready for deployment", level: "info" as const },
              ].map((alert, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-sm border border-border bg-card px-3 py-2 text-xs"
                >
                  <AlertTriangle
                    className={cn(
                      "mt-0.5 h-3 w-3 shrink-0",
                      alert.level === "critical"
                        ? "text-danger"
                        : alert.level === "warning"
                          ? "text-warning"
                          : "text-muted-foreground"
                    )}
                  />
                  <span className="text-foreground">{alert.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            System Status
          </h2>
          <div className="rounded-sm border border-border bg-card p-3 space-y-2.5">
            <StatusDot label="API Gateway" status="ok" />
            <StatusDot label="Device Telemetry" status="ok" />
            <StatusDot label="Search Index" status="ok" />
            <StatusDot label="Notification Service" status="ok" />
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-success">
            <CheckCircle className="h-3 w-3" />
            All systems operational
          </div>
        </div>
      </div>
    </div>
  );
}
