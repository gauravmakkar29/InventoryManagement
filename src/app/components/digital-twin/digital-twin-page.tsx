import { useState } from "react";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { DigitalTwin, HealthBucket, SortField } from "./digital-twin-types";
import { getHealthBucket } from "./digital-twin-health-utils";
import { MOCK_TWINS } from "./digital-twin-mock-data";
import { FleetHealthSummary } from "./fleet-health-summary";
import { TwinDetailView } from "./twin-detail-view";
import { TwinCard } from "./twin-card";

// ---------------------------------------------------------------------------
// Main Page (Story 15.1 + 15.5)
// ---------------------------------------------------------------------------
export function DigitalTwinPage() {
  const [twins] = useState<DigitalTwin[]>(MOCK_TWINS);
  const [selectedTwin, setSelectedTwin] = useState<DigitalTwin | null>(null);
  const [healthFilter, setHealthFilter] = useState<HealthBucket>("all");
  const [driftFilter, setDriftFilter] = useState<"all" | "InSync" | "Drifted" | "Unknown">("all");
  const [sortField, setSortField] = useState<SortField>("healthScore");
  const [sortAsc, setSortAsc] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTwins = twins
    .filter((t) => {
      if (healthFilter !== "all" && getHealthBucket(t.healthScore) !== healthFilter) return false;
      if (driftFilter !== "all" && t.configDriftStatus !== driftFilter) return false;
      if (searchQuery && !t.deviceName.toLowerCase().includes(searchQuery.toLowerCase()))
        return false;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === "healthScore") cmp = a.healthScore - b.healthScore;
      else if (sortField === "deviceName") cmp = a.deviceName.localeCompare(b.deviceName);
      else cmp = new Date(a.lastSyncedAt).getTime() - new Date(b.lastSyncedAt).getTime();
      return sortAsc ? cmp : -cmp;
    });

  if (selectedTwin) {
    return <TwinDetailView twin={selectedTwin} onBack={() => setSelectedTwin(null)} />;
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[20px] font-semibold text-foreground">Digital Twin</h2>
          <p className="mt-0.5 text-[14px] text-muted-foreground">
            Fleet-wide device health monitoring, simulation, and configuration analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[14px] font-medium text-accent-text">
            {twins.length} twins
          </span>
        </div>
      </div>

      {/* Story 15.5 — Fleet Summary */}
      <FleetHealthSummary twins={twins} />

      {/* Filters & Sort */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search devices..."
            aria-label="Search devices"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-[14px] text-foreground/80 placeholder:text-muted-foreground focus:border-accent-text focus:ring-1 focus:ring-ring focus:outline-none w-[220px]"
          />
        </div>

        {/* Health filter */}
        <div className="flex gap-1">
          {(
            [
              { key: "all", label: "All" },
              { key: "critical", label: "Critical" },
              { key: "warning", label: "Warning" },
              { key: "healthy", label: "Healthy" },
            ] as { key: HealthBucket; label: string }[]
          ).map((bucket) => (
            <button
              key={bucket.key}
              onClick={() => setHealthFilter(bucket.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[14px] font-medium cursor-pointer",
                healthFilter === bucket.key
                  ? bucket.key === "critical"
                    ? "bg-red-50 text-red-700"
                    : bucket.key === "warning"
                      ? "bg-amber-50 text-amber-700"
                      : bucket.key === "healthy"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-accent text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/70",
              )}
            >
              {bucket.label}
            </button>
          ))}
        </div>

        {/* Drift filter (Story 15.4 AC6) */}
        <select
          value={driftFilter}
          onChange={(e) => setDriftFilter(e.target.value as typeof driftFilter)}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-[14px] text-muted-foreground focus:border-accent-text focus:outline-none"
        >
          <option value="all">All Drift Status</option>
          <option value="InSync">In Sync</option>
          <option value="Drifted">Drifted</option>
          <option value="Unknown">Unknown</option>
        </select>

        {/* Sort */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[13px] text-muted-foreground">Sort by:</span>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-[14px] text-muted-foreground focus:border-accent-text focus:outline-none"
          >
            <option value="healthScore">Health Score</option>
            <option value="deviceName">Device Name</option>
            <option value="lastSyncedAt">Last Synced</option>
          </select>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted cursor-pointer"
            title={sortAsc ? "Ascending" : "Descending"}
          >
            {sortAsc ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Twin Grid (Story 15.1 AC4) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredTwins.map((twin) => (
          <TwinCard key={twin.deviceId} twin={twin} onClick={() => setSelectedTwin(twin)} />
        ))}
      </div>

      {filteredTwins.length === 0 && (
        <div className="card-elevated flex flex-col items-center justify-center py-12 px-5">
          <Search className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-[15px] font-medium text-foreground/80">
            No devices match your filters
          </p>
          <p className="text-[14px] text-muted-foreground mt-1">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
}
