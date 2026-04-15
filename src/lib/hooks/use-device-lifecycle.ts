// =============================================================================
// useDeviceLifecycle — Story 27.1 (#417)
//
// Aggregates per-device lifecycle events from existing systems of record and
// returns a merged, time-sorted view-model array. This hook introduces NO
// new database writes — it only projects existing data.
//
// Resilience: if any source fails, the hook still returns events from the
// successful sources and reports the failed source names via
// `unavailableSources` so the UI can show a warning banner without blanking
// the timeline.
// =============================================================================

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import type { CDCEvent } from "../providers/cdc-provider.types";
import type { DeviceLifecycleEvent, FirmwareAssignment } from "../types";
import { useCDCProvider } from "../providers/registry";
import { MOCK_FIRMWARE_ASSIGNMENTS } from "../mock-data/firmware-assignment-data";
import {
  mergeLifecycleEvents,
  projectCdcEventsToLifecycle,
  projectFirmwareAssignmentsToLifecycle,
} from "../mappers/device-lifecycle.mapper";

// ---------------------------------------------------------------------------
// Time-range helpers
// ---------------------------------------------------------------------------

export type LifecycleTimeRangePreset = "7d" | "30d" | "90d" | "180d" | "all";

export function resolveTimeRangeWindow(
  preset: LifecycleTimeRangePreset,
  now: Date = new Date(),
): { start: string; end: string } | undefined {
  if (preset === "all") return undefined;
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : preset === "90d" ? 90 : 180;
  const end = now.toISOString();
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  return { start, end };
}

// ---------------------------------------------------------------------------
// Source identifiers — named so the UI can render targeted warnings
// ---------------------------------------------------------------------------

export type LifecycleSource = "Audit" | "Firmware";
// Future sources (Phase 2): "Service" (requires deviceId-keyed ServiceOrder mock)

// ---------------------------------------------------------------------------
// Hook result
// ---------------------------------------------------------------------------

export interface DeviceLifecycleResult {
  events: DeviceLifecycleEvent[];
  isLoading: boolean;
  /** Source names whose query failed — the UI should surface a warning. */
  unavailableSources: LifecycleSource[];
}

// ---------------------------------------------------------------------------
// Internal source fetchers
// ---------------------------------------------------------------------------

async function fetchCdcHistory(
  deviceId: string,
  range: { start: string; end: string } | undefined,
  cdc: ReturnType<typeof useCDCProvider>,
): Promise<CDCEvent[]> {
  if (!cdc) return [];
  return cdc.getChangeHistory(deviceId, range);
}

async function fetchFirmwareAssignments(
  deviceId: string,
  range: { start: string; end: string } | undefined,
): Promise<FirmwareAssignment[]> {
  // The mock layer returns the full array synchronously; real adapters will
  // issue a DynamoDB query keyed by deviceId. We keep the fetcher async so
  // the substitution is seamless.
  const all = MOCK_FIRMWARE_ASSIGNMENTS.filter((a) => a.deviceId === deviceId);
  if (!range) return all;
  const startMs = Date.parse(range.start);
  const endMs = Date.parse(range.end);
  return all.filter((a) => {
    const t = Date.parse(a.assignedAt);
    return t >= startMs && t <= endMs;
  });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseDeviceLifecycleOptions {
  /** Optional window — defaults to "30d". */
  timeRange?: LifecycleTimeRangePreset;
  /** Escape hatch for tests to freeze "now" when resolving time ranges. */
  now?: Date;
}

/**
 * Aggregate lifecycle events for a single device.
 *
 * @param deviceId The device id. Hook is disabled if falsy.
 * @param options Optional time-range preset and injected `now` for tests.
 *
 * @example
 * ```tsx
 * const { events, isLoading, unavailableSources } = useDeviceLifecycle(deviceId, {
 *   timeRange: "30d",
 * });
 * ```
 */
export function useDeviceLifecycle(
  deviceId: string | undefined,
  options: UseDeviceLifecycleOptions = {},
): DeviceLifecycleResult {
  const { timeRange = "30d", now } = options;
  const cdc = useCDCProvider();
  const range = useMemo(() => resolveTimeRangeWindow(timeRange, now), [timeRange, now]);

  const results = useQueries({
    queries: [
      {
        queryKey: ["device-lifecycle", "audit", deviceId ?? "", timeRange] as const,
        queryFn: () => fetchCdcHistory(deviceId!, range, cdc),
        enabled: !!deviceId,
      },
      {
        queryKey: ["device-lifecycle", "firmware", deviceId ?? "", timeRange] as const,
        queryFn: () => fetchFirmwareAssignments(deviceId!, range),
        enabled: !!deviceId,
      },
    ],
  });

  const [cdcResult, firmwareResult] = results;

  return useMemo((): DeviceLifecycleResult => {
    if (!deviceId) {
      return { events: [], isLoading: false, unavailableSources: [] };
    }

    const isLoading = results.some((r) => r.isLoading);
    const unavailableSources: LifecycleSource[] = [];

    const cdcEvents =
      cdcResult && cdcResult.isError
        ? (unavailableSources.push("Audit"), [])
        : (cdcResult?.data ?? []);
    const firmwareAssignments =
      firmwareResult && firmwareResult.isError
        ? (unavailableSources.push("Firmware"), [])
        : (firmwareResult?.data ?? []);

    // Order matters for the merge's de-dup policy: pass richer sources first.
    const events = mergeLifecycleEvents([
      projectFirmwareAssignmentsToLifecycle(firmwareAssignments, deviceId),
      projectCdcEventsToLifecycle(cdcEvents, deviceId),
    ]);

    return { events, isLoading, unavailableSources };
  }, [deviceId, results, cdcResult, firmwareResult]);
}
