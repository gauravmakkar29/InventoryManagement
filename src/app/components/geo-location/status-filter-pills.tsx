import { cn } from "../../../lib/utils";
import type { GeoStatusFilter } from "./geo-location-types";
import { FILTER_OPTIONS } from "./geo-location-types";

// ---------------------------------------------------------------------------
// StatusFilterPills (Story 9.3)
// ---------------------------------------------------------------------------

export function StatusFilterPills({
  statusFilter,
  statusCounts,
  mappableCount,
  totalCount,
  clusterCount,
  onFilterChange,
}: {
  statusFilter: GeoStatusFilter;
  statusCounts: Record<string, number>;
  mappableCount: number;
  totalCount: number;
  clusterCount: number;
  onFilterChange: (filter: GeoStatusFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {FILTER_OPTIONS.map((opt) => {
        const isActive = statusFilter === opt.id;
        const count = statusCounts[opt.id] ?? 0;
        return (
          <button
            key={opt.id}
            onClick={() => onFilterChange(opt.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[14px] font-medium cursor-pointer transition-colors",
              isActive ? opt.activeColor : opt.color,
            )}
            aria-pressed={isActive}
          >
            {opt.dotColor && !isActive && (
              <span className={cn("h-2 w-2 rounded-full", opt.dotColor)} />
            )}
            {opt.label}
            <span className={cn("text-[13px]", isActive ? "opacity-80" : "text-muted-foreground")}>
              ({count})
            </span>
          </button>
        );
      })}
      {/* Device count badge */}
      <span className="ml-auto text-[14px] text-muted-foreground">
        Showing {mappableCount} of {totalCount} devices
        {clusterCount > 0 && (
          <>
            {" "}
            &middot; {clusterCount} cluster{clusterCount !== 1 ? "s" : ""}
          </>
        )}
      </span>
    </div>
  );
}
