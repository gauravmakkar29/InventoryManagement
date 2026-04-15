// =============================================================================
// LifecycleTab — Story 27.1 (#417) Phase 2 + Story 27.2 (#418) + Story 27.5 (#421)
//
// Composes the existing VersionTimeline primitive with the
// `useDeviceLifecycle` aggregation hook. Filters (date range + categories)
// are client-side; only the time-range re-fetches.
//
// Story 27.2 adds persona-aware defaults:
//   - Initial category selection comes from the current role's default
//     lifecycle categories (see src/lib/rbac-lifecycle.ts).
//   - Non-permitted categories are rendered disabled with a tooltip.
//   - Selection is persisted to localStorage per {role, deviceId} so
//     returning users see their last view.
//   - A "Reset to default" button restores the role default and clears
//     the localStorage entry.
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useAuth } from "@/lib/use-auth";
import { getPrimaryRole, type Role } from "@/lib/rbac";
import {
  getDefaultLifecycleCategories,
  getPermittedLifecycleCategories,
  lifecycleFilterStorageKey,
} from "@/lib/rbac-lifecycle";
import { LifecycleFilters } from "./lifecycle-filters";
import { DeviceStatusSummary } from "./device-status-summary";

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
// localStorage helpers for persona filter persistence (Story 27.2)
// ---------------------------------------------------------------------------

function readPersistedCategories(
  storageKey: string,
  permitted: ReadonlySet<DeviceLifecycleCategory>,
): DeviceLifecycleCategory[] | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const filtered = parsed.filter(
      (v): v is DeviceLifecycleCategory =>
        typeof v === "string" && permitted.has(v as DeviceLifecycleCategory),
    );
    return filtered;
  } catch {
    return null;
  }
}

function writePersistedCategories(
  storageKey: string,
  categories: ReadonlySet<DeviceLifecycleCategory>,
): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify([...categories]));
  } catch {
    // Quota / private-mode — silently ignore; UX still works in-memory.
  }
}

function clearPersistedCategories(storageKey: string): void {
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Main tab content
// ---------------------------------------------------------------------------

export interface LifecycleTabProps {
  deviceId: string;
  /** Story 27.5 (#421) — required for the Status Summary panel. */
  currentStatus: string;
  /**
   * Story 27.5 (#421) — device creation time anchors the first status
   * interval. Optional — falls back to 180 days ago when the device model
   * doesn't carry a timestamp (MockDevice currently does not).
   */
  deviceCreatedAt?: string;
}

const DEFAULT_DEVICE_CREATED_FALLBACK_DAYS = 180;

export function LifecycleTab({ deviceId, currentStatus, deviceCreatedAt }: LifecycleTabProps) {
  const effectiveCreatedAt = useMemo(
    () =>
      deviceCreatedAt ??
      new Date(
        Date.now() - DEFAULT_DEVICE_CREATED_FALLBACK_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString(),
    [deviceCreatedAt],
  );

  // Story 27.2: resolve current user's role + persona defaults
  const { groups } = useAuth();
  const role: Role = useMemo(() => getPrimaryRole(groups), [groups]);
  const permittedCategories = useMemo(
    () => new Set<DeviceLifecycleCategory>(getPermittedLifecycleCategories(role)),
    [role],
  );
  const storageKey = useMemo(() => lifecycleFilterStorageKey(role, deviceId), [role, deviceId]);

  const [timeRange, setTimeRange] = useState<LifecycleTimeRangePreset>("30d");

  // Initialize selection from localStorage if present, otherwise from the
  // persona default. Persisted values are filtered to the currently
  // permitted set — a role change or a policy tightening won't re-enable
  // a category the user is no longer allowed to see.
  const [selectedCategories, setSelectedCategories] = useState<Set<DeviceLifecycleCategory>>(() => {
    const persisted = readPersistedCategories(storageKey, permittedCategories);
    if (persisted !== null) return new Set(persisted);
    return new Set(getDefaultLifecycleCategories(role));
  });

  // Persist selection when it changes (debounced by React's batch update
  // semantics; a rapid burst of toggles still only triggers a few writes).
  useEffect(() => {
    writePersistedCategories(storageKey, selectedCategories);
  }, [storageKey, selectedCategories]);

  const { events, isLoading, unavailableSources } = useDeviceLifecycle(deviceId, { timeRange });

  // Client-side category filter over the already-fetched events.
  // We also gate on permittedCategories so a stale selection can never
  // surface an event the role isn't allowed to see.
  const visibleEvents = useMemo(
    () =>
      events.filter(
        (e) => permittedCategories.has(e.category) && selectedCategories.has(e.category),
      ),
    [events, selectedCategories, permittedCategories],
  );

  const timelineEvents = useMemo(() => visibleEvents.map(mapToTimelineEvent), [visibleEvents]);

  const handleCategoryToggle = useCallback(
    (category: DeviceLifecycleCategory) => {
      if (!permittedCategories.has(category)) return; // defensive
      setSelectedCategories((prev) => {
        const next = new Set(prev);
        if (next.has(category)) next.delete(category);
        else next.add(category);
        return next;
      });
    },
    [permittedCategories],
  );

  const handleResetToDefault = useCallback(() => {
    setSelectedCategories(new Set(getDefaultLifecycleCategories(role)));
    clearPersistedCategories(storageKey);
  }, [role, storageKey]);

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
      <DeviceStatusSummary
        deviceId={deviceId}
        currentStatus={currentStatus}
        deviceCreatedAt={effectiveCreatedAt}
        lifecycleEvents={events}
        timeRange={timeRange}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <LifecycleFilters
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          selectedCategories={selectedCategories}
          onCategoryToggle={handleCategoryToggle}
          permittedCategories={permittedCategories}
          onResetToDefault={handleResetToDefault}
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
