// =============================================================================
// Device Status Mapper — Story 27.5 (#421)
//
// Pure helpers for deriving status-transition intervals from CDC events,
// computing availability %, and detecting flapping. No external data access
// — callers pass the events in.
// =============================================================================

import type { CDCEvent } from "../providers/cdc-provider.types";
import type { DeviceStatusTransition } from "../types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DEFAULT_FLAPPING_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
export const DEFAULT_FLAPPING_THRESHOLD = 5;

// ---------------------------------------------------------------------------
// Derivation
// ---------------------------------------------------------------------------

interface DeriveInput {
  /** CDC events scoped to the device; may contain non-status changes — filtered internally. */
  events: readonly CDCEvent[];
  /** ISO-8601 timestamp of device creation — used as the start of the first interval. */
  deviceCreatedAt: string;
  /** The device's current (most recent) status — caps the final open-ended interval. */
  currentStatus: string;
  /** Optional reference time for the "now" endpoint of the open interval (for deterministic tests). */
  nowIso?: string;
}

function classifySource(event: CDCEvent): DeviceStatusTransition["source"] {
  const actor = event.changedBy?.toLowerCase?.() ?? "";
  if (!actor) return "unknown";
  if (actor === "system") return "system";
  if (actor === "device") return "device";
  return "user";
}

function extractStatus(value: Record<string, unknown> | null): string | undefined {
  if (!value) return undefined;
  const v = value.status;
  return typeof v === "string" ? v : undefined;
}

/**
 * Derive half-open status intervals from the CDC event stream.
 *
 * - Events are filtered to those that actually change the `status` field
 * - Events are sorted ascending by timestamp
 * - A synthetic initial interval is seeded from `deviceCreatedAt` using the
 *   first change's `oldValue.status` (falling back to `currentStatus` when
 *   the stream is empty)
 * - The final interval is open-ended (`endAt === null`) and anchored to the
 *   device's `currentStatus`
 */
export function deriveStatusTransitions(input: DeriveInput): DeviceStatusTransition[] {
  const { events, deviceCreatedAt, currentStatus, nowIso } = input;
  const nowMs = nowIso ? Date.parse(nowIso) : Date.now();

  const statusChanges = events
    .filter((e) => {
      const before = extractStatus(e.oldValue as Record<string, unknown> | null);
      const after = extractStatus(e.newValue as Record<string, unknown> | null);
      return after !== undefined && before !== after;
    })
    .slice()
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));

  // No status changes captured → single open-ended interval
  if (statusChanges.length === 0) {
    return [
      {
        status: currentStatus,
        startAt: deviceCreatedAt,
        endAt: null,
        durationMs: Math.max(0, nowMs - Date.parse(deviceCreatedAt)),
        actor: "unknown",
        source: "unknown",
      },
    ];
  }

  const transitions: DeviceStatusTransition[] = [];
  const first = statusChanges[0]!;
  const initialStatus = extractStatus(first.oldValue as Record<string, unknown> | null);

  // Seed: creation → first change
  transitions.push({
    status: initialStatus ?? currentStatus,
    startAt: deviceCreatedAt,
    endAt: first.timestamp,
    durationMs: Date.parse(first.timestamp) - Date.parse(deviceCreatedAt),
    actor: "unknown",
    source: "unknown",
  });

  // Body: each change closes the previous record and opens a new one
  for (let i = 0; i < statusChanges.length; i++) {
    const event = statusChanges[i]!;
    const next = statusChanges[i + 1];
    const status = extractStatus(event.newValue as Record<string, unknown> | null)!;
    const endAt = next?.timestamp ?? null;
    const startMs = Date.parse(event.timestamp);
    const endMs = endAt ? Date.parse(endAt) : nowMs;

    transitions.push({
      status,
      startAt: event.timestamp,
      endAt,
      durationMs: Math.max(0, endMs - startMs),
      actor: event.changedBy || "unknown",
      source: classifySource(event),
    });
  }

  return transitions;
}

// ---------------------------------------------------------------------------
// Availability %
// ---------------------------------------------------------------------------

export interface AvailabilityWindow {
  start: string;
  end: string;
}

/**
 * Returns the percentage of time (0-100) the device was in the "online"
 * status within the given window. Handles transitions that partially
 * overlap the window by clipping their start/end to window bounds.
 *
 * Returns 0 for non-positive or zero-length windows.
 */
export function computeAvailability(
  transitions: readonly DeviceStatusTransition[],
  window: AvailabilityWindow,
  nowIso?: string,
): number {
  const startMs = Date.parse(window.start);
  const endMs = Date.parse(window.end);
  const totalMs = endMs - startMs;
  if (totalMs <= 0) return 0;
  const nowMs = nowIso ? Date.parse(nowIso) : Date.now();

  let onlineMs = 0;
  for (const t of transitions) {
    if (t.status !== "online") continue;
    const tStart = Date.parse(t.startAt);
    const tEnd = t.endAt ? Date.parse(t.endAt) : nowMs;
    const clippedStart = Math.max(tStart, startMs);
    const clippedEnd = Math.min(tEnd, endMs);
    if (clippedEnd > clippedStart) {
      onlineMs += clippedEnd - clippedStart;
    }
  }

  return (onlineMs / totalMs) * 100;
}

// ---------------------------------------------------------------------------
// Flapping detection
// ---------------------------------------------------------------------------

export interface FlappingResult {
  count: number;
  isFlapping: boolean;
}

/**
 * Counts status transitions that started within the last `windowMs` and
 * flags as flapping if the count exceeds `threshold`. Uses `nowIso` when
 * provided for deterministic testing.
 */
export function detectFlapping(
  transitions: readonly DeviceStatusTransition[],
  windowMs: number = DEFAULT_FLAPPING_WINDOW_MS,
  threshold: number = DEFAULT_FLAPPING_THRESHOLD,
  nowIso?: string,
): FlappingResult {
  const nowMs = nowIso ? Date.parse(nowIso) : Date.now();
  const cutoffMs = nowMs - windowMs;
  // The first "seed" transition (representing state from device creation) is
  // NOT a real change — skip it by requiring source !== "unknown" OR a
  // non-zero actor. Seed entries are marked actor="unknown" + source="unknown".
  let count = 0;
  for (const t of transitions) {
    if (t.source === "unknown" && t.actor === "unknown") continue;
    if (Date.parse(t.startAt) >= cutoffMs) count += 1;
  }
  return { count, isFlapping: count > threshold };
}

// ---------------------------------------------------------------------------
// Duration formatter
// ---------------------------------------------------------------------------

/**
 * Formats a duration (in milliseconds) into a compact human-readable string.
 * Examples:
 *   formatDuration(0)                    // "0s"
 *   formatDuration(45_000)               // "45s"
 *   formatDuration(3_725_000)            // "1h 2m"
 *   formatDuration(90_000_000)           // "1d 1h"
 *   formatDuration(367_000_000)          // "4d 5h"
 */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  if (ms < 1000) return "0s";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remHours = hours - days * 24;
    return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
  }
  if (hours > 0) {
    const remMinutes = minutes - hours * 60;
    return remMinutes > 0 ? `${hours}h ${remMinutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    const remSeconds = seconds - minutes * 60;
    return remSeconds > 0 ? `${minutes}m ${remSeconds}s` : `${minutes}m`;
  }
  return `${seconds}s`;
}
