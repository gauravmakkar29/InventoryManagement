// =============================================================================
// LifecycleFilters — Story 27.1 (#417) Phase 2 + Story 27.2 (#418)
//
// Date-range preset selector + category multi-select for the device lifecycle
// timeline. Pure presentation: state is lifted to the parent <LifecycleTab>.
//
// Story 27.2 additions:
//   - `permittedCategories` — categories the current role may enable. Any
//     category NOT in the set renders disabled with a tooltip.
//   - `onResetToDefault` — optional; renders a "Reset to default" link-style
//     button next to the filter chips.
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
  /**
   * Story 27.2 (#418) — categories the current role may enable. Categories
   * NOT in the set render disabled with a tooltip. Defaults to every
   * category when omitted so callers that don't need RBAC keep working.
   */
  permittedCategories?: ReadonlySet<DeviceLifecycleCategory>;
  /** Story 27.2 (#418) — optional Reset button; hidden when not provided. */
  onResetToDefault?: () => void;
}

export function LifecycleFilters({
  timeRange,
  onTimeRangeChange,
  selectedCategories,
  onCategoryToggle,
  permittedCategories,
  onResetToDefault,
}: LifecycleFiltersProps) {
  const isPermitted = (category: DeviceLifecycleCategory) =>
    !permittedCategories || permittedCategories.has(category);

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
          const permitted = isPermitted(category);
          return (
            <label
              key={category}
              title={permitted ? undefined : "Not available for your role"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[13px] font-medium transition-colors select-none",
                permitted
                  ? active
                    ? "cursor-pointer border-accent bg-accent-bg text-accent-text"
                    : "cursor-pointer border-border bg-card text-muted-foreground hover:bg-muted"
                  : "cursor-not-allowed border-border bg-muted/50 text-muted-foreground/60",
              )}
            >
              <input
                type="checkbox"
                checked={permitted && active}
                onChange={() => permitted && onCategoryToggle(category)}
                disabled={!permitted}
                aria-disabled={!permitted || undefined}
                className="sr-only"
                aria-label={`Toggle ${category} events`}
              />
              {category}
            </label>
          );
        })}
      </fieldset>

      {onResetToDefault && (
        <button
          type="button"
          onClick={onResetToDefault}
          className="text-[12px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Reset to default
        </button>
      )}
    </div>
  );
}
