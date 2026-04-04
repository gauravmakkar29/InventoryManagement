import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Color mappings — single source of truth for badge colors
// ---------------------------------------------------------------------------

/** Severity levels (vulnerability, incident, alert) */
const SEVERITY_STYLES: Record<string, string> = {
  Critical: "bg-red-100 text-red-700 border-red-200",
  High: "bg-orange-100 text-orange-700 border-orange-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Low: "bg-blue-100 text-blue-700 border-blue-200",
  Info: "bg-slate-100 text-slate-600 border-slate-200",
};

/** Status values (device, service order, firmware, incident) */
const STATUS_STYLES: Record<string, string> = {
  Online: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Offline: "bg-red-50 text-red-700 border-red-200",
  Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Inactive: "bg-muted text-muted-foreground border-border",
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  Deprecated: "bg-muted text-muted-foreground border-border",
  Scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  "In Progress": "bg-amber-100 text-amber-700 border-amber-200",
  Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Cancelled: "bg-muted text-muted-foreground border-border",
  Open: "bg-red-50 text-red-700 border-red-200",
  Investigating: "bg-orange-50 text-orange-700 border-orange-200",
  Contained: "bg-amber-50 text-amber-700 border-amber-200",
  Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Closed: "bg-muted text-muted-foreground border-border",
  Consumed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Expired: "bg-muted text-muted-foreground border-border",
  Revoked: "bg-red-50 text-red-700 border-red-200",
};

/** Category values (incident, compliance, device type) */
const CATEGORY_STYLES: Record<string, string> = {
  Security: "bg-red-50 text-red-600",
  Hardware: "bg-blue-50 text-blue-600",
  Network: "bg-purple-50 text-purple-600",
  Firmware: "bg-orange-50 text-orange-600",
  Environmental: "bg-green-50 text-green-600",
  Software: "bg-indigo-50 text-indigo-600",
  Compliance: "bg-cyan-50 text-cyan-600",
};

/** Action values (audit log) */
const ACTION_STYLES: Record<string, string> = {
  CREATE: "bg-emerald-50 text-emerald-700",
  UPDATE: "bg-blue-50 text-blue-700",
  DELETE: "bg-red-50 text-red-700",
  APPROVE: "bg-emerald-50 text-emerald-700",
  REJECT: "bg-red-50 text-red-700",
  LOGIN: "bg-indigo-50 text-indigo-700",
  LOGOUT: "bg-muted text-muted-foreground",
};

const FALLBACK_STYLE = "bg-muted text-muted-foreground border-border";

type BadgeVariant = "severity" | "status" | "category" | "action";

const VARIANT_MAP: Record<BadgeVariant, Record<string, string>> = {
  severity: SEVERITY_STYLES,
  status: STATUS_STYLES,
  category: CATEGORY_STYLES,
  action: ACTION_STYLES,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface StatusBadgeProps {
  variant: BadgeVariant;
  value: string;
  /** Show a colored dot indicator before the label */
  dot?: boolean;
  className?: string;
}

/**
 * Shared status badge — consistent badge rendering across the entire application.
 * Standardizes: px-2 py-0.5, text-[12px] font-medium, rounded-full.
 *
 * @see Story 23.5 (#303) — consolidates 8+ badge implementations
 */
export function StatusBadge({ variant, value, dot = false, className }: StatusBadgeProps) {
  const styles = VARIANT_MAP[variant];
  const colorClass = styles[value] ?? FALLBACK_STYLE;
  const hasBorder = colorClass.includes("border-");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium",
        hasBorder && "border",
        colorClass,
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            colorClass.includes("text-red") && "bg-red-500",
            colorClass.includes("text-orange") && "bg-orange-500",
            colorClass.includes("text-amber") && "bg-amber-500",
            colorClass.includes("text-emerald") && "bg-emerald-500",
            colorClass.includes("text-green") && "bg-green-500",
            colorClass.includes("text-blue") && "bg-blue-500",
            colorClass.includes("text-purple") && "bg-purple-500",
            colorClass.includes("text-indigo") && "bg-indigo-500",
            colorClass.includes("text-cyan") && "bg-cyan-500",
            colorClass.includes("text-slate") && "bg-slate-400",
            colorClass.includes("text-muted") && "bg-muted-foreground",
          )}
        />
      )}
      {value}
    </span>
  );
}
