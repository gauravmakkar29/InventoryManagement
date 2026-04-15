// =============================================================================
// Device Lifecycle Mapper — Story 27.1 (#417)
//
// Pure projections from existing systems of record into the
// `DeviceLifecycleEvent` view-model. This file introduces NO new data — it
// only composes what other stories (Epic 8 audit, Story 20.8 CDC,
// Story 26.9 FirmwareAssignment) already capture.
// =============================================================================

import type { CDCEvent } from "../providers/cdc-provider.types";
import type { DeviceLifecycleCategory, DeviceLifecycleEvent, FirmwareAssignment } from "../types";
import { isRollback } from "../firmware/firmware-version-utils";

// ---------------------------------------------------------------------------
// CDC → Lifecycle
// ---------------------------------------------------------------------------

/**
 * Maps a CDC action ("create" | "update" | "delete") to the most meaningful
 * lifecycle category for a device entity. This is intentionally narrow —
 * firmware-assignment and service-order changes are projected from their
 * dedicated sources (richer metadata), not from generic CDC updates.
 */
function categoryForCdcEvent(event: CDCEvent): DeviceLifecycleCategory {
  const changedFields = inferChangedFields(event);
  if (changedFields.has("customerId") || changedFields.has("siteId")) return "Ownership";
  if (changedFields.has("status")) return "Status";
  return "Audit";
}

function inferChangedFields(event: CDCEvent): Set<string> {
  const fields = new Set<string>();
  if (event.newValue && typeof event.newValue === "object") {
    for (const key of Object.keys(event.newValue)) fields.add(key);
  }
  if (event.oldValue && typeof event.oldValue === "object") {
    for (const key of Object.keys(event.oldValue)) fields.add(key);
  }
  return fields;
}

function summaryForCdcEvent(event: CDCEvent, category: DeviceLifecycleCategory): string {
  switch (category) {
    case "Ownership":
      return "Device ownership or site assignment changed";
    case "Status": {
      const next =
        typeof event.newValue === "object" && event.newValue
          ? (event.newValue as Record<string, unknown>).status
          : undefined;
      return typeof next === "string" ? `Status changed to ${next}` : "Device status changed";
    }
    default:
      return `Device ${event.action}d`;
  }
}

function actionForCdcEvent(event: CDCEvent, category: DeviceLifecycleCategory): string {
  if (category === "Status") return "status.changed";
  if (category === "Ownership") return "ownership.changed";
  return `audit.${event.action}`;
}

/**
 * Projects raw CDC events into lifecycle events scoped to a single device.
 *
 * Only events whose `entityType === "device"` and `entityId === deviceId`
 * are retained. Callers can pre-filter upstream for efficiency, but this
 * function defensively re-filters so misuse cannot leak cross-device events.
 */
export function projectCdcEventsToLifecycle(
  events: CDCEvent[],
  deviceId: string,
): DeviceLifecycleEvent[] {
  return events
    .filter((e) => e.entityType === "device" && e.entityId === deviceId)
    .map((event) => {
      const category = categoryForCdcEvent(event);
      return {
        id: `AuditLog:${event.id}:${event.timestamp}`,
        deviceId,
        category,
        action: actionForCdcEvent(event, category),
        actor: { userId: event.changedBy, displayName: event.changedBy },
        timestamp: event.timestamp,
        summary: summaryForCdcEvent(event, category),
        sourceEntityType: "AuditLog" as const,
        sourceEntityId: event.id,
        metadata: {
          cdcAction: event.action,
          oldValue: event.oldValue ?? null,
          newValue: event.newValue ?? null,
        },
      };
    });
}

// ---------------------------------------------------------------------------
// FirmwareAssignment → Lifecycle
// ---------------------------------------------------------------------------

/**
 * Projects firmware assignments into Firmware-category lifecycle events.
 * Detects rollbacks via the shared `isRollback` semver helper (Story 27.4).
 */
export function projectFirmwareAssignmentsToLifecycle(
  assignments: FirmwareAssignment[],
  deviceId: string,
): DeviceLifecycleEvent[] {
  return assignments
    .filter((a) => a.deviceId === deviceId)
    .map((assignment) => {
      const rollback = isRollback(assignment.firmwareVersion, assignment.previousFirmwareVersion);
      const action = rollback ? "firmware.rolled_back" : "firmware.assigned";
      const summary = rollback
        ? `Firmware rolled back to ${assignment.firmwareVersion} (from ${assignment.previousFirmwareVersion ?? "unknown"})`
        : assignment.previousFirmwareVersion
          ? `Firmware updated to ${assignment.firmwareVersion} (from ${assignment.previousFirmwareVersion})`
          : `Firmware assigned: ${assignment.firmwareVersion}`;

      return {
        id: `FirmwareAssignment:${assignment.id}:${assignment.assignedAt}`,
        deviceId,
        category: "Firmware" as const,
        action,
        actor: {
          userId: assignment.assignedBy,
          displayName: assignment.assignedByEmail || assignment.assignedBy,
        },
        timestamp: assignment.assignedAt,
        summary,
        sourceEntityType: "FirmwareAssignment" as const,
        sourceEntityId: assignment.id,
        metadata: {
          assignmentMethod: assignment.assignmentMethod,
          firmwareVersion: assignment.firmwareVersion,
          previousFirmwareVersion: assignment.previousFirmwareVersion ?? null,
          rollbackReason: assignment.rollbackReason ?? null,
          isRollback: rollback,
        },
      };
    });
}

// ---------------------------------------------------------------------------
// Merge + sort
// ---------------------------------------------------------------------------

/** Category priority used to break ties when two events share a timestamp. */
const CATEGORY_PRIORITY: Record<DeviceLifecycleCategory, number> = {
  Firmware: 0,
  Service: 1,
  Ownership: 2,
  Status: 3,
  Audit: 4,
};

/**
 * Merges per-source event arrays and returns a single list sorted by
 * timestamp DESC (newest first). Ties broken by category priority
 * (Firmware > Service > Ownership > Status > Audit).
 *
 * Duplicates — identical `id` values, which can happen when a CDC event
 * projects the same underlying change already represented by a richer
 * FirmwareAssignment entry — are de-duplicated in favor of the first
 * occurrence (richer-source projections are passed to this function first).
 */
export function mergeLifecycleEvents(
  groups: readonly DeviceLifecycleEvent[][],
): DeviceLifecycleEvent[] {
  const seen = new Set<string>();
  const merged: DeviceLifecycleEvent[] = [];
  for (const group of groups) {
    for (const event of group) {
      if (seen.has(event.id)) continue;
      seen.add(event.id);
      merged.push(event);
    }
  }
  merged.sort((a, b) => {
    const tsDiff = Date.parse(b.timestamp) - Date.parse(a.timestamp);
    if (tsDiff !== 0) return tsDiff;
    return CATEGORY_PRIORITY[a.category] - CATEGORY_PRIORITY[b.category];
  });
  return merged;
}
