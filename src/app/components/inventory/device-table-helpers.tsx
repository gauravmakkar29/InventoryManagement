import { ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { DeviceStatus } from "@/lib/types";
import type { SortField, SortDir } from "@/lib/hooks/use-device-inventory";

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { dot: string; text: string; bg: string }> = {
    [DeviceStatus.Online]: { dot: "bg-success", text: "text-success-text", bg: "bg-success-bg" },
    [DeviceStatus.Offline]: { dot: "bg-danger", text: "text-danger-text", bg: "bg-danger-bg" },
    [DeviceStatus.Maintenance]: {
      dot: "bg-warning",
      text: "text-warning-text",
      bg: "bg-warning-bg",
    },
    [DeviceStatus.Decommissioned]: {
      dot: "bg-gray-400",
      text: "text-muted-foreground",
      bg: "bg-muted",
    },
  };
  const c = config[status] ?? { dot: "bg-gray-400", text: "text-muted-foreground", bg: "bg-muted" };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[13px] font-medium",
        c.bg,
        c.text,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// HealthBar
// ---------------------------------------------------------------------------

export function HealthBar({ value }: { value: number }) {
  const color =
    value >= 90 ? "bg-success" : value >= 70 ? "bg-warning" : value >= 50 ? "bg-high" : "bg-danger";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[14px] font-mono tabular-nums text-muted-foreground">{value}%</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SortHeader
// ---------------------------------------------------------------------------

export function SortHeader({
  label,
  field,
  sortField,
  sortDir,
  onSort,
}: {
  label: string;
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
}) {
  const active = sortField === field;
  return (
    <th
      scope="col"
      className="px-4 py-3 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground bg-table-header"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {active ? (
          sortDir === "asc" ? (
            <ChevronUp className="h-3 w-3 text-accent-text" />
          ) : (
            <ChevronDown className="h-3 w-3 text-accent-text" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
        )}
      </div>
    </th>
  );
}
