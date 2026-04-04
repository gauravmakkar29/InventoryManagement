import {
  ShieldCheck,
  Shield,
  WifiOff,
  FileWarning,
  ArrowRight,
  ChevronRight,
  BarChart3,
  ClipboardList,
  Users,
  Rocket,
  Monitor,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { PipelineStatusCard } from "../search/pipeline-status-card";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
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
// SystemStatusRow — System Status + Quick Actions cards
// ---------------------------------------------------------------------------
export function SystemStatusRow() {
  return (
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
                  <Icon className="h-[18px] w-[18px] text-muted-foreground" aria-hidden="true" />
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
  );
}

// ---------------------------------------------------------------------------
// RequiresAttention — attention items panel
// ---------------------------------------------------------------------------
export function RequiresAttention() {
  return (
    <div className="col-span-2 card-elevated">
      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="text-[16px] font-semibold text-foreground">Requires Attention</h3>
      </div>

      <div className="px-3 pb-3 space-y-1">
        {ATTENTION_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted/50"
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                  item.iconBg,
                )}
              >
                <Icon className={cn("h-[18px] w-[18px]", item.iconColor)} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-foreground">{item.title}</p>
                <p className="text-[14px] text-muted-foreground truncate">{item.subtitle}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
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
  );
}
