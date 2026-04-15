import { describe, it, expect } from "vitest";
import {
  mergeLifecycleEvents,
  projectCdcEventsToLifecycle,
  projectFirmwareAssignmentsToLifecycle,
} from "@/lib/mappers/device-lifecycle.mapper";
import type { CDCEvent } from "@/lib/providers/cdc-provider.types";
import type { DeviceLifecycleEvent, FirmwareAssignment } from "@/lib/types";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const DEVICE_ID = "dev-001";
const OTHER_DEVICE_ID = "dev-other";

function cdcEvent(overrides: Partial<CDCEvent> = {}): CDCEvent {
  return {
    id: "cdc-1",
    entityType: "device",
    entityId: DEVICE_ID,
    action: "update",
    oldValue: null,
    newValue: null,
    changedBy: "user-1",
    timestamp: "2026-03-15T10:00:00Z",
    ...overrides,
  };
}

function firmwareAssignment(overrides: Partial<FirmwareAssignment> = {}): FirmwareAssignment {
  return {
    id: "fa-test-1",
    deviceId: DEVICE_ID,
    deviceName: "Test Device",
    firmwareId: "fw-1",
    firmwareVersion: "v1.2.0",
    firmwareName: "Test Firmware",
    assignedBy: "u-mgr-01",
    assignedByEmail: "mgr@example.com",
    assignedAt: "2026-03-10T09:00:00Z",
    assignmentMethod: "MANUAL",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// projectCdcEventsToLifecycle
// ---------------------------------------------------------------------------

describe("projectCdcEventsToLifecycle", () => {
  it("filters out events for other devices and non-device entity types", () => {
    const events = [
      cdcEvent({ id: "keep-1" }),
      cdcEvent({ id: "drop-cross-device", entityId: OTHER_DEVICE_ID }),
      cdcEvent({ id: "drop-non-device", entityType: "firmware" }),
    ];
    const out = projectCdcEventsToLifecycle(events, DEVICE_ID);
    expect(out).toHaveLength(1);
    expect(out[0]?.sourceEntityId).toBe("keep-1");
  });

  it("classifies status changes as Status category with informative summary", () => {
    const event = cdcEvent({
      id: "status-1",
      newValue: { status: "offline" },
      oldValue: { status: "online" },
    });
    const [projected] = projectCdcEventsToLifecycle([event], DEVICE_ID);
    expect(projected?.category).toBe("Status");
    expect(projected?.action).toBe("status.changed");
    expect(projected?.summary).toBe("Status changed to offline");
  });

  it("classifies customerId changes as Ownership", () => {
    const event = cdcEvent({
      id: "ownership-1",
      newValue: { customerId: "cust-B" },
      oldValue: { customerId: "cust-A" },
    });
    const [projected] = projectCdcEventsToLifecycle([event], DEVICE_ID);
    expect(projected?.category).toBe("Ownership");
    expect(projected?.action).toBe("ownership.changed");
  });

  it("classifies siteId changes as Ownership", () => {
    const event = cdcEvent({ id: "site-1", newValue: { siteId: "site-B" } });
    const [projected] = projectCdcEventsToLifecycle([event], DEVICE_ID);
    expect(projected?.category).toBe("Ownership");
  });

  it("falls back to Audit category for generic updates", () => {
    const event = cdcEvent({ id: "generic-1", newValue: { notes: "updated notes" } });
    const [projected] = projectCdcEventsToLifecycle([event], DEVICE_ID);
    expect(projected?.category).toBe("Audit");
    expect(projected?.action).toBe("audit.update");
  });

  it("preserves the original cdc action in metadata", () => {
    const event = cdcEvent({ id: "delete-1", action: "delete" });
    const [projected] = projectCdcEventsToLifecycle([event], DEVICE_ID);
    expect(projected?.metadata?.cdcAction).toBe("delete");
  });
});

// ---------------------------------------------------------------------------
// projectFirmwareAssignmentsToLifecycle
// ---------------------------------------------------------------------------

describe("projectFirmwareAssignmentsToLifecycle", () => {
  it("scopes to the requested device", () => {
    const assignments = [
      firmwareAssignment({ id: "fa-1" }),
      firmwareAssignment({ id: "fa-2", deviceId: OTHER_DEVICE_ID }),
    ];
    const out = projectFirmwareAssignmentsToLifecycle(assignments, DEVICE_ID);
    expect(out).toHaveLength(1);
    expect(out[0]?.sourceEntityId).toBe("fa-1");
  });

  it("uses the assignedByEmail as displayName when present", () => {
    const out = projectFirmwareAssignmentsToLifecycle([firmwareAssignment()], DEVICE_ID);
    expect(out[0]?.actor.displayName).toBe("mgr@example.com");
  });

  it("summarizes forward upgrades with previous -> new version", () => {
    const out = projectFirmwareAssignmentsToLifecycle(
      [firmwareAssignment({ firmwareVersion: "v1.2.0", previousFirmwareVersion: "v1.1.0" })],
      DEVICE_ID,
    );
    expect(out[0]?.action).toBe("firmware.assigned");
    expect(out[0]?.summary).toContain("Firmware updated to v1.2.0");
    expect(out[0]?.metadata?.isRollback).toBe(false);
  });

  it("detects rollbacks and exposes the reason in metadata", () => {
    const out = projectFirmwareAssignmentsToLifecycle(
      [
        firmwareAssignment({
          firmwareVersion: "v4.0.2",
          previousFirmwareVersion: "v4.1.0",
          rollbackReason: "Regression in customer fleet",
        }),
      ],
      DEVICE_ID,
    );
    expect(out[0]?.action).toBe("firmware.rolled_back");
    expect(out[0]?.summary).toContain("Firmware rolled back to v4.0.2");
    expect(out[0]?.metadata?.isRollback).toBe(true);
    expect(out[0]?.metadata?.rollbackReason).toBe("Regression in customer fleet");
  });

  it("handles first-ever assignments (no previous version)", () => {
    const out = projectFirmwareAssignmentsToLifecycle(
      [firmwareAssignment({ firmwareVersion: "v1.0.0", previousFirmwareVersion: undefined })],
      DEVICE_ID,
    );
    expect(out[0]?.action).toBe("firmware.assigned");
    expect(out[0]?.summary).toBe("Firmware assigned: v1.0.0");
  });
});

// ---------------------------------------------------------------------------
// mergeLifecycleEvents
// ---------------------------------------------------------------------------

describe("mergeLifecycleEvents", () => {
  function event(
    overrides: Partial<DeviceLifecycleEvent> & Pick<DeviceLifecycleEvent, "id" | "timestamp">,
  ): DeviceLifecycleEvent {
    return {
      deviceId: DEVICE_ID,
      category: "Audit",
      action: "audit.update",
      actor: { userId: "u", displayName: "u" },
      summary: "sum",
      sourceEntityType: "AuditLog",
      sourceEntityId: overrides.id,
      ...overrides,
    };
  }

  it("sorts by timestamp descending (newest first)", () => {
    const merged = mergeLifecycleEvents([
      [event({ id: "older", timestamp: "2026-01-01T00:00:00Z" })],
      [event({ id: "newest", timestamp: "2026-03-01T00:00:00Z" })],
      [event({ id: "middle", timestamp: "2026-02-01T00:00:00Z" })],
    ]);
    expect(merged.map((e) => e.id)).toEqual(["newest", "middle", "older"]);
  });

  it("breaks timestamp ties by category priority (Firmware > Service > Ownership > Status > Audit)", () => {
    const ts = "2026-03-01T00:00:00Z";
    const merged = mergeLifecycleEvents([
      [
        event({ id: "audit", timestamp: ts, category: "Audit" }),
        event({ id: "firmware", timestamp: ts, category: "Firmware" }),
        event({ id: "status", timestamp: ts, category: "Status" }),
      ],
    ]);
    expect(merged.map((e) => e.category)).toEqual(["Firmware", "Status", "Audit"]);
  });

  it("de-duplicates identical ids (first occurrence wins)", () => {
    const ts = "2026-03-01T00:00:00Z";
    const merged = mergeLifecycleEvents([
      [event({ id: "dup", timestamp: ts, summary: "from richer source" })],
      [event({ id: "dup", timestamp: ts, summary: "from weaker source" })],
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.summary).toBe("from richer source");
  });

  it("handles an empty input", () => {
    expect(mergeLifecycleEvents([])).toEqual([]);
    expect(mergeLifecycleEvents([[], []])).toEqual([]);
  });
});
