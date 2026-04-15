// =============================================================================
// LifecycleFilters — Story 27.1 (#417) Phase 2
//
// Date-range preset selector + category multi-select for the device lifecycle
// timeline. Pure presentation: state is lifted to the parent <LifecycleTab>.
// =============================================================================

import { cn } from "@/lib/utils";
import type { DeviceLifecycleCategory } from "@/lib/types";
import type { LifecycleTimeRangePreset } from "@/lib/hooks/use-device-lifecycle";

// ---------------------------------------------------------------------------
// Category metadata — kept in sync with the color palette in VersionTimeline
// ---------------------------------------------------------------------------

export const LIFECYCLE_CATEGORIES: readonly DeviceLifecycleCategory[] = [
  "Firmware",
  "Service",
  "Ownership",
  "Status",
  "Audit",
] as const;

const TIME_RANGE_OPTIONS: readonly { value: LifecycleTimeRangePreset; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "180d", label: "Last 180 days" },
  { value: "all", label: "All time" },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface LifecycleFiltersProps {
  timeRange: LifecycleTimeRangePreset;
  onTimeRangeChange: (value: LifecycleTimeRangePreset) => void;
  selectedCategories: ReadonlySet<DeviceLifecycleCategory>;
  onCategoryToggle: (category: DeviceLifecycleCategory) => void;
}

export function LifecycleFilters({
  timeRange,
  onTimeRangeChange,
  selectedCategories,
  onCategoryToggle,
}: LifecycleFiltersProps) {
  return (
    <div
      role="toolbar"
      aria-label="Lifecycle filters"
      className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card px-4 py-3"
    >
      {/* Date range */}
      <div className="flex items-center gap-2">
        <label
          htmlFor="lifecycle-time-range"
          className="text-[13px] font-medium text-muted-foreground"
        >
          Range
        </label>
        <select
          id="lifecycle-time-range"
          value={timeRange}
          onChange={(e) => onTimeRangeChange(e.target.value as LifecycleTimeRangePreset)}
          className="h-8 rounded-md border border-border bg-card px-2 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 cursor-pointer"
        >
          {TIME_RANGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Category multi-select */}
      <fieldset className="flex flex-wrap items-center gap-2">
        <legend className="sr-only">Category filters</legend>
        <span aria-hidden="true" className="text-[13px] font-medium text-muted-foreground">
          Categories
        </span>
        {LIFECYCLE_CATEGORIES.map((category) => {
          const active = selectedCategories.has(category);
          return (
            <label
              key={category}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[13px] font-medium transition-colors cursor-pointer select-none",
                active
                  ? "border-accent bg-accent-bg text-accent-text"
                  : "border-border bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              <input
                type="checkbox"
                checked={active}
                onChange={() => onCategoryToggle(category)}
                className="sr-only"
                aria-label={`Toggle ${category} events`}
              />
              {category}
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}
