// =============================================================================
// LifecycleTab — Story 27.1 (#417) Phase 2
//
// Composes the existing VersionTimeline primitive with the
// `useDeviceLifecycle` aggregation hook. Filters (date range + categories)
// are client-side; only the time-range re-fetches.
// =============================================================================

import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, Download } from "lucide-react";
import { toast } from "sonner";
import { generateCSV } from "@/lib/report-generator";
import type { DeviceLifecycleCategory, DeviceLifecycleEvent } from "@/lib/types";
import {
  useDeviceLifecycle,
  type LifecycleTimeRangePreset,
} from "@/lib/hooks/use-device-lifecycle";
import {
  VersionTimeline,
  type TimelineEvent,
  type TimelineEventColor,
} from "@/app/components/shared/version-timeline";
import { LIFECYCLE_CATEGORIES, LifecycleFilters } from "./lifecycle-filters";

// ---------------------------------------------------------------------------
// Category → color mapping
// ---------------------------------------------------------------------------

const CATEGORY_COLOR: Record<DeviceLifecycleCategory, TimelineEventColor> = {
  Firmware: "blue",
  Service: "amber",
  Ownership: "purple",
  Status: "teal",
  Audit: "gray",
};

// ---------------------------------------------------------------------------
// Event mapping — DeviceLifecycleEvent → TimelineEvent
// ---------------------------------------------------------------------------

function mapToTimelineEvent(event: DeviceLifecycleEvent): TimelineEvent {
  const stringifiedMetadata: Record<string, string> = {};
  if (event.metadata) {
    for (const [key, value] of Object.entries(event.metadata)) {
      if (value === null || value === undefined) continue;
      stringifiedMetadata[key] = typeof value === "string" ? value : JSON.stringify(value);
    }
  }

  return {
    id: event.id,
    type: event.category,
    label: event.category,
    actor: event.actor.displayName,
    timestamp: event.timestamp,
    description: event.summary,
    color: CATEGORY_COLOR[event.category],
    metadata: Object.keys(stringifiedMetadata).length > 0 ? stringifiedMetadata : undefined,
  };
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------

function triggerCsvDownload(events: DeviceLifecycleEvent[], deviceId: string): void {
  if (events.length === 0) {
    toast.info("No events to export");
    return;
  }

  const rows = events.map((e) => ({
    timestamp: e.timestamp,
    category: e.category,
    action: e.action,
    actor: e.actor.displayName,
    summary: e.summary,
    sourceEntityType: e.sourceEntityType,
    sourceEntityId: e.sourceEntityId,
  }));
  const csv = generateCSV(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `device-${deviceId}-lifecycle-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  toast.success(`Exported ${events.length} lifecycle events`);
}

// ---------------------------------------------------------------------------
// Warning banner — rendered when any source fails
// ---------------------------------------------------------------------------

function PartialFailureBanner({ sources }: { sources: readonly string[] }) {
  if (sources.length === 0) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-warning-border bg-warning-bg px-3 py-2 text-[13px] text-warning-text"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        {sources.join(" and ")} history {sources.length === 1 ? "is" : "are"} currently unavailable
        — showing events from the remaining sources.
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main tab content
// ---------------------------------------------------------------------------

export interface LifecycleTabProps {
  deviceId: string;
}

export function LifecycleTab({ deviceId }: LifecycleTabProps) {
  const [timeRange, setTimeRange] = useState<LifecycleTimeRangePreset>("30d");
  const [selectedCategories, setSelectedCategories] = useState<Set<DeviceLifecycleCategory>>(
    () => new Set<DeviceLifecycleCategory>(LIFECYCLE_CATEGORIES),
  );

  const { events, isLoading, unavailableSources } = useDeviceLifecycle(deviceId, { timeRange });

  // Client-side category filter over the already-fetched events
  const visibleEvents = useMemo(
    () => events.filter((e) => selectedCategories.has(e.category)),
    [events, selectedCategories],
  );

  const timelineEvents = useMemo(() => visibleEvents.map(mapToTimelineEvent), [visibleEvents]);

  const handleCategoryToggle = useCallback((category: DeviceLifecycleCategory) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const handleExport = useCallback(() => {
    triggerCsvDownload(visibleEvents, deviceId);
  }, [visibleEvents, deviceId]);

  return (
    <section
      role="tabpanel"
      id="device-detail-panel-lifecycle"
      aria-labelledby="device-detail-tab-lifecycle"
      className="space-y-4 pt-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <LifecycleFilters
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          selectedCategories={selectedCategories}
          onCategoryToggle={handleCategoryToggle}
        />
        <button
          type="button"
          onClick={handleExport}
          disabled={visibleEvents.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[14px] font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export CSV
        </button>
      </div>

      <PartialFailureBanner sources={unavailableSources} />

      <VersionTimeline
        events={timelineEvents}
        loading={isLoading}
        emptyMessage="No lifecycle events in this window"
        emptyDescription="Try widening the date range or enabling more categories."
      />
    </section>
  );
}
