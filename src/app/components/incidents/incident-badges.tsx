/**
 * IMS Gen 2 — Epic 14: Badge components for incidents
 */
import { cn } from "../../../lib/utils";
import type {
  IncidentSeverity,
  IncidentStatus,
  IncidentCategory,
} from "../../../lib/incident-types";
import { SEVERITY_COLORS, STATUS_COLORS } from "../../../lib/incident-types";

// ---------------------------------------------------------------------------
// Severity Badge
// ---------------------------------------------------------------------------
export function SeverityBadge({ severity }: { severity: IncidentSeverity }) {
  const styles: Record<IncidentSeverity, string> = {
    Critical: "bg-red-100 text-red-700 border-red-200",
    High: "bg-orange-100 text-orange-700 border-orange-200",
    Medium: "bg-amber-100 text-amber-700 border-amber-200",
    Low: "bg-blue-100 text-blue-700 border-blue-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[13px] font-semibold",
        styles[severity],
      )}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: SEVERITY_COLORS[severity] }}
      />
      {severity}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------
export function StatusBadge({ status }: { status: IncidentStatus }) {
  const styles: Record<IncidentStatus, string> = {
    Open: "bg-red-50 text-red-700 border-red-200",
    Investigating: "bg-orange-50 text-orange-700 border-orange-200",
    Contained: "bg-amber-50 text-amber-700 border-amber-200",
    Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Closed: "bg-gray-50 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[13px] font-semibold",
        styles[status],
      )}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: STATUS_COLORS[status] }}
      />
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Category Badge
// ---------------------------------------------------------------------------
export function CategoryBadge({ category }: { category: IncidentCategory }) {
  const styles: Record<IncidentCategory, string> = {
    Security: "bg-red-50 text-red-600",
    Hardware: "bg-blue-50 text-blue-600",
    Network: "bg-purple-50 text-purple-600",
    Firmware: "bg-orange-50 text-orange-600",
    Environmental: "bg-green-50 text-green-600",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[12px] font-medium",
        styles[category],
      )}
    >
      {category}
    </span>
  );
}
