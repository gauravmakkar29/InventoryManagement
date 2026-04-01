import { useState, useCallback, useEffect, useRef } from "react";
import { Search, X, SlidersHorizontal, AlertCircle } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { DeviceSearchFilters } from "../../../lib/opensearch-types";

// =============================================================================
// Story 18.3 — AdvancedDeviceSearch
// Enhanced search bar for the Inventory page with faceted filters:
// status, location, model, health score range.
// =============================================================================

interface ActiveFilter {
  key: string;
  label: string;
  value: string;
}

interface AdvancedDeviceSearchProps {
  query: string;
  onQueryChange: (q: string) => void;
  filters: DeviceSearchFilters;
  onFiltersChange: (filters: DeviceSearchFilters) => void;
  statusOptions: string[];
  locationOptions: string[];
  modelOptions: string[];
  totalResults: number;
  totalDevices: number;
  /** True when OpenSearch is unavailable and search falls back to DynamoDB */
  isUsingFallback?: boolean;
}

export function AdvancedDeviceSearch({
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  statusOptions,
  locationOptions,
  modelOptions,
  totalResults,
  totalDevices,
  isUsingFallback = false,
}: AdvancedDeviceSearchProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [healthMin, setHealthMin] = useState<string>(
    filters.healthScoreMin != null ? String(filters.healthScoreMin) : "",
  );
  const [healthMax, setHealthMax] = useState<string>(
    filters.healthScoreMax != null ? String(filters.healthScoreMax) : "",
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced query
  const handleQueryInput = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onQueryChange(value);
      }, 300);
    },
    [onQueryChange],
  );

  // Health score debounced update
  useEffect(() => {
    const timer = setTimeout(() => {
      const min = healthMin ? Number(healthMin) : undefined;
      const max = healthMax ? Number(healthMax) : undefined;
      if (min !== filters.healthScoreMin || max !== filters.healthScoreMax) {
        onFiltersChange({
          ...filters,
          healthScoreMin: min,
          healthScoreMax: max,
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [healthMin, healthMax]);

  // Collect active filter chips
  const activeFilters: ActiveFilter[] = [];
  if (filters.status) {
    activeFilters.push({ key: "status", label: "Status", value: filters.status });
  }
  if (filters.location) {
    activeFilters.push({ key: "location", label: "Location", value: filters.location });
  }
  if (filters.model) {
    activeFilters.push({ key: "model", label: "Model", value: filters.model });
  }
  if (filters.healthScoreMin != null || filters.healthScoreMax != null) {
    const min = filters.healthScoreMin ?? 0;
    const max = filters.healthScoreMax ?? 100;
    activeFilters.push({
      key: "health",
      label: "Health",
      value: `${min}–${max}`,
    });
  }

  const removeFilter = useCallback(
    (key: string) => {
      const updated = { ...filters };
      if (key === "status") updated.status = undefined;
      if (key === "location") updated.location = undefined;
      if (key === "model") updated.model = undefined;
      if (key === "health") {
        updated.healthScoreMin = undefined;
        updated.healthScoreMax = undefined;
        setHealthMin("");
        setHealthMax("");
      }
      onFiltersChange(updated);
    },
    [filters, onFiltersChange],
  );

  const clearAllFilters = useCallback(() => {
    onFiltersChange({});
    onQueryChange("");
    setHealthMin("");
    setHealthMax("");
  }, [onFiltersChange, onQueryChange]);

  return (
    <div className="space-y-3">
      {/* Fallback warning */}
      {isUsingFallback && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-[14px] text-amber-700 dark:text-amber-300">
            Full-text search temporarily unavailable. Using basic search.
          </span>
        </div>
      )}

      {/* Search bar + filter toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            defaultValue={query}
            onChange={(e) => handleQueryInput(e.target.value)}
            placeholder={
              isUsingFallback
                ? "Basic search..."
                : "Search by device name, serial, location (fuzzy)..."
            }
            className={cn(
              "h-10 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-[14px] text-foreground",
              "placeholder:text-muted-foreground",
              "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20",
            )}
          />
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-[14px] font-medium cursor-pointer",
            "hover:bg-muted transition-colors",
            showFilters && "bg-accent/10 border-accent text-accent-text",
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilters.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent text-[12px] font-bold text-white">
              {activeFilters.length}
            </span>
          )}
        </button>

        <span className="text-[14px] text-muted-foreground shrink-0">
          {totalResults} of {totalDevices} devices
        </span>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {activeFilters.map((f) => (
            <span
              key={f.key}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-[13px] font-medium text-foreground"
            >
              {f.label}: {f.value}
              <button
                type="button"
                onClick={() => removeFilter(f.key)}
                className="flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-foreground/10 cursor-pointer"
                aria-label={`Remove ${f.label} filter`}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-[13px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Expanded filter panel */}
      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-lg border border-border bg-card p-4">
          {/* Status filter */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium uppercase tracking-wider text-muted-foreground">
              Status
            </label>
            <select
              value={filters.status ?? ""}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  status: e.target.value || undefined,
                })
              }
              className="h-9 w-full rounded-md border border-border bg-card px-2 text-[14px] text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 cursor-pointer"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Location filter */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium uppercase tracking-wider text-muted-foreground">
              Location
            </label>
            <select
              value={filters.location ?? ""}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  location: e.target.value || undefined,
                })
              }
              className="h-9 w-full rounded-md border border-border bg-card px-2 text-[14px] text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 cursor-pointer"
            >
              <option value="">All Locations</option>
              {locationOptions.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Model filter */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium uppercase tracking-wider text-muted-foreground">
              Model
            </label>
            <select
              value={filters.model ?? ""}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  model: e.target.value || undefined,
                })
              }
              className="h-9 w-full rounded-md border border-border bg-card px-2 text-[14px] text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 cursor-pointer"
            >
              <option value="">All Models</option>
              {modelOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Health score range */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium uppercase tracking-wider text-muted-foreground">
              Health Score
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                max={100}
                value={healthMin}
                onChange={(e) => setHealthMin(e.target.value)}
                placeholder="0"
                className="h-9 w-full rounded-md border border-border bg-card px-2 text-[14px] text-foreground text-center focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
              />
              <span className="text-[13px] text-muted-foreground shrink-0">to</span>
              <input
                type="number"
                min={0}
                max={100}
                value={healthMax}
                onChange={(e) => setHealthMax(e.target.value)}
                placeholder="100"
                className="h-9 w-full rounded-md border border-border bg-card px-2 text-[14px] text-foreground text-center focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
