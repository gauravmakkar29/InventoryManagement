// =============================================================================
// DeviceStatusSummary — Story 27.5 (#421)
//
// Compact panel rendered at the top of the Lifecycle tab. Shows:
//   - current status badge
//   - time-in-current-status (relative)
//   - availability % over the currently-selected window
//   - flapping indicator (if >5 status changes in the last 24h)
// Decommissioned devices render a muted indicator; availability is N/A.
// =============================================================================

import { useMemo } from "react";
import { Activity, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CDCEvent } from "@/lib/providers/cdc-provider.types";
import { DeviceStatus, type DeviceLifecycleEvent } from "@/lib/types";
import type { LifecycleTimeRangePreset } from "@/lib/hooks/use-device-lifecycle";
import { resolveTimeRangeWindow } from "@/lib/hooks/use-device-lifecycle";
import {
  computeAvailability,
  deriveStatusTransitions,
  detectFlapping,
  formatDuration,
} from "@/lib/mappers/device-status.mapper";
import { StatusBadge } from "./device-table-helpers";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Rebuild lightweight CDCEvent-shaped records from lifecycle events of the
 * Status category. Only the fields needed by `deriveStatusTransitions` are
 * populated. This lets the summary reuse the Lifecycle tab's single fetch
 * without introducing a second query.
 */
function statusEventsFromLifecycle(
  events: readonly DeviceLifecycleEvent[],
  deviceId: string,
): CDCEvent[] {
  return events
    .filter((e) => e.category === "Status")
    .map((e) => {
      const meta = e.metadata ?? {};
      const oldValue = (meta.oldValue ?? null) as Record<string, unknown> | null;
      const newValue = (meta.newValue ?? null) as Record<string, unknown> | null;
      return {
        id: e.sourceEntityId,
        entityType: "device",
        entityId: deviceId,
        action: "update",
        oldValue,
        newValue,
        changedBy: e.actor.userId || e.actor.displayName || "unknown",
        timestamp: e.timestamp,
      };
    });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface DeviceStatusSummaryProps {
  deviceId: string;
  currentStatus: string;
  /** Device creation timestamp — anchors the first status interval. */
  deviceCreatedAt: string;
  /** Lifecycle events from useDeviceLifecycle — reused, not refetched. */
  lifecycleEvents: readonly DeviceLifecycleEvent[];
  /** Window preset currently selected by the user in the filters. */
  timeRange: LifecycleTimeRangePreset;
}

export function DeviceStatusSummary({
  deviceId,
  currentStatus,
  deviceCreatedAt,
  lifecycleEvents,
  timeRange,
}: DeviceStatusSummaryProps) {
  const isDecommissioned = currentStatus === DeviceStatus.Decommissioned;

  const transitions = useMemo(
    () =>
      deriveStatusTransitions({
        events: statusEventsFromLifecycle(lifecycleEvents, deviceId),
        deviceCreatedAt,
        currentStatus,
      }),
    [lifecycleEvents, deviceId, deviceCreatedAt, currentStatus],
  );

  const currentInterval = transitions.find((t) => t.endAt === null);
  const timeInState = currentInterval ? formatDuration(currentInterval.durationMs) : "—";

  const availability = useMemo(() => {
    if (isDecommissioned) return null;
    const window = resolveTimeRangeWindow(timeRange);
    if (!window) {
      // "all" — anchor to device creation
      const allWindow = { start: deviceCreatedAt, end: new Date().toISOString() };
      return computeAvailability(transitions, allWindow);
    }
    return computeAvailability(transitions, window);
  }, [isDecommissioned, transitions, timeRange, deviceCreatedAt]);

  const flapping = useMemo(() => detectFlapping(transitions), [transitions]);

  return (
    <section
      aria-label="Status summary"
      className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-border bg-card px-4 py-3"
    >
      {/* Current status + time-in-state */}
      <div className="flex items-center gap-2">
        <StatusBadge status={currentStatus} />
        <span className="text-[13px] text-muted-foreground">
          for <span className="font-medium text-foreground">{timeInState}</span>
        </span>
      </div>

      {/* Divider */}
      <div aria-hidden="true" className="h-5 w-px bg-border" />

      {/* Availability */}
      <div className="flex items-center gap-2" aria-label="Availability">
        <Activity className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-[13px] text-muted-foreground">Availability</span>
        <span
          className={cn(
            "text-[14px] font-mono font-medium tabular-nums",
            availability === null
              ? "text-muted-foreground"
              : availability >= 99
                ? "text-success-text"
                : availability >= 95
                  ? "text-foreground"
                  : "text-warning-text",
          )}
        >
          {availability === null ? "N/A" : `${availability.toFixed(1)}%`}
        </span>
      </div>

      {/* Flapping indicator (conditional) */}
      {flapping.isFlapping && (
        <>
          <div aria-hidden="true" className="h-5 w-px bg-border" />
          <span
            role="status"
            className="inline-flex items-center gap-1.5 rounded-full bg-warning-bg px-2.5 py-0.5 text-[13px] font-medium text-warning-text"
          >
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            Flapping ({flapping.count} changes in 24h)
          </span>
        </>
      )}

      {/* Decommissioned hint */}
      {isDecommissioned && (
        <span
          role="note"
          className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[13px] font-medium text-muted-foreground"
        >
          Device decommissioned — availability not tracked
        </span>
      )}
    </section>
  );
}
