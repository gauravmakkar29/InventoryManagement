import { ArrowRight } from "lucide-react";
import { cn } from "../../../lib/utils";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// RecentActivity — activity table
// ---------------------------------------------------------------------------
export function RecentActivity() {
  return (
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
                <td className="px-5 text-right text-[14px] text-muted-foreground">{row.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
