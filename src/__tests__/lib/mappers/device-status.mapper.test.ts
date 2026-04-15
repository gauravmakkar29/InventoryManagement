import { describe, it, expect } from "vitest";
import {
  computeAvailability,
  deriveStatusTransitions,
  detectFlapping,
  formatDuration,
} from "@/lib/mappers/device-status.mapper";
import type { CDCEvent } from "@/lib/providers/cdc-provider.types";

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function statusChange(
  overrides: Partial<CDCEvent> & {
    id: string;
    timestamp: string;
    from: string;
    to: string;
  },
): CDCEvent {
  return {
    id: overrides.id,
    entityType: "device",
    entityId: "dev-001",
    action: "update",
    oldValue: { status: overrides.from },
    newValue: { status: overrides.to },
    changedBy: overrides.changedBy ?? "user-1",
    timestamp: overrides.timestamp,
  };
}

const DEVICE_CREATED_AT = "2026-01-01T00:00:00.000Z";

// ---------------------------------------------------------------------------
// deriveStatusTransitions
// ---------------------------------------------------------------------------

describe("deriveStatusTransitions", () => {
  it("returns a single open-ended interval when no status changes exist", () => {
    const transitions = deriveStatusTransitions({
      events: [],
      deviceCreatedAt: DEVICE_CREATED_AT,
      currentStatus: "online",
      nowIso: "2026-01-02T00:00:00.000Z",
    });
    expect(transitions).toHaveLength(1);
    expect(transitions[0]).toMatchObject({
      status: "online",
      startAt: DEVICE_CREATED_AT,
      endAt: null,
      actor: "unknown",
      source: "unknown",
    });
    // 24h
    expect(transitions[0]?.durationMs).toBe(24 * 60 * 60 * 1000);
  });

  it("builds a multi-transition chain ending in an open interval", () => {
    const transitions = deriveStatusTransitions({
      events: [
        statusChange({
          id: "e1",
          timestamp: "2026-01-01T10:00:00.000Z",
          from: "online",
          to: "offline",
          changedBy: "system",
        }),
        statusChange({
          id: "e2",
          timestamp: "2026-01-01T12:00:00.000Z",
          from: "offline",
          to: "online",
          changedBy: "user-a",
        }),
      ],
      deviceCreatedAt: DEVICE_CREATED_AT,
      currentStatus: "online",
      nowIso: "2026-01-01T13:00:00.000Z",
    });

    expect(transitions).toHaveLength(3);

    // Seed interval: creation -> first change (online, 10h)
    expect(transitions[0]?.status).toBe("online");
    expect(transitions[0]?.startAt).toBe(DEVICE_CREATED_AT);
    expect(transitions[0]?.endAt).toBe("2026-01-01T10:00:00.000Z");

    // Middle: offline for 2 hours
    expect(transitions[1]?.status).toBe("offline");
    expect(transitions[1]?.durationMs).toBe(2 * 60 * 60 * 1000);
    expect(transitions[1]?.source).toBe("system");

    // Open interval: online again for 1h
    expect(transitions[2]?.status).toBe("online");
    expect(transitions[2]?.endAt).toBeNull();
    expect(transitions[2]?.durationMs).toBe(60 * 60 * 1000);
    expect(transitions[2]?.source).toBe("user");
  });

  it("filters out non-status-field CDC events defensively", () => {
    const transitions = deriveStatusTransitions({
      events: [
        {
          id: "other-field",
          entityType: "device",
          entityId: "dev-001",
          action: "update",
          oldValue: { customerId: "cust-A" },
          newValue: { customerId: "cust-B" },
          changedBy: "user-a",
          timestamp: "2026-01-01T09:00:00.000Z",
        },
      ],
      deviceCreatedAt: DEVICE_CREATED_AT,
      currentStatus: "online",
      nowIso: "2026-01-02T00:00:00.000Z",
    });
    // No status changes → single seed interval only
    expect(transitions).toHaveLength(1);
  });

  it("skips no-op status events (same old and new value)", () => {
    const transitions = deriveStatusTransitions({
      events: [
        statusChange({
          id: "noop",
          timestamp: "2026-01-01T06:00:00.000Z",
          from: "online",
          to: "online",
        }),
      ],
      deviceCreatedAt: DEVICE_CREATED_AT,
      currentStatus: "online",
      nowIso: "2026-01-02T00:00:00.000Z",
    });
    expect(transitions).toHaveLength(1);
  });

  it("classifies source from the changedBy actor", () => {
    const transitions = deriveStatusTransitions({
      events: [
        statusChange({
          id: "e1",
          timestamp: "2026-01-01T10:00:00.000Z",
          from: "online",
          to: "maintenance",
          changedBy: "device",
        }),
      ],
      deviceCreatedAt: DEVICE_CREATED_AT,
      currentStatus: "maintenance",
    });
    expect(transitions[1]?.source).toBe("device");
  });
});

// ---------------------------------------------------------------------------
// computeAvailability
// ---------------------------------------------------------------------------

describe("computeAvailability", () => {
  it("returns 100 when online for the entire window", () => {
    const pct = computeAvailability(
      [
        {
          status: "online",
          startAt: "2026-01-01T00:00:00.000Z",
          endAt: null,
          durationMs: 0,
          actor: "u",
          source: "user",
        },
      ],
      { start: "2026-01-05T00:00:00.000Z", end: "2026-01-10T00:00:00.000Z" },
      "2026-01-20T00:00:00.000Z",
    );
    expect(pct).toBe(100);
  });

  it("returns 0 when never online in the window", () => {
    const pct = computeAvailability(
      [
        {
          status: "offline",
          startAt: "2026-01-01T00:00:00.000Z",
          endAt: null,
          durationMs: 0,
          actor: "sys",
          source: "system",
        },
      ],
      { start: "2026-01-05T00:00:00.000Z", end: "2026-01-10T00:00:00.000Z" },
      "2026-01-20T00:00:00.000Z",
    );
    expect(pct).toBe(0);
  });

  it("clips transitions at window boundaries", () => {
    // 10-day window. Online 5 days in the middle → 50%.
    const pct = computeAvailability(
      [
        {
          status: "online",
          startAt: "2026-01-03T00:00:00.000Z",
          endAt: "2026-01-08T00:00:00.000Z",
          durationMs: 5 * 24 * 60 * 60 * 1000,
          actor: "u",
          source: "user",
        },
      ],
      { start: "2026-01-01T00:00:00.000Z", end: "2026-01-11T00:00:00.000Z" },
    );
    expect(pct).toBeCloseTo(50, 5);
  });

  it("handles the 85% scenario from the tech-spec doc", () => {
    // Online Jan 1-10 (9d), offline Jan 10-12 (2d), online Jan 12-20 (8d) over 20d window → 17/20 = 85%
    const pct = computeAvailability(
      [
        {
          status: "online",
          startAt: "2026-01-01T00:00:00.000Z",
          endAt: "2026-01-10T00:00:00.000Z",
          durationMs: 0,
          actor: "u",
          source: "user",
        },
        {
          status: "offline",
          startAt: "2026-01-10T00:00:00.000Z",
          endAt: "2026-01-12T00:00:00.000Z",
          durationMs: 0,
          actor: "u",
          source: "user",
        },
        {
          status: "online",
          startAt: "2026-01-12T00:00:00.000Z",
          endAt: "2026-01-20T00:00:00.000Z",
          durationMs: 0,
          actor: "u",
          source: "user",
        },
      ],
      { start: "2026-01-01T00:00:00.000Z", end: "2026-01-21T00:00:00.000Z" },
    );
    expect(pct).toBeCloseTo(85, 1);
  });

  it("returns 0 for an empty or inverted window", () => {
    expect(
      computeAvailability([], {
        start: "2026-01-10T00:00:00.000Z",
        end: "2026-01-01T00:00:00.000Z",
      }),
    ).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// detectFlapping
// ---------------------------------------------------------------------------

describe("detectFlapping", () => {
  const NOW = "2026-01-02T00:00:00.000Z";

  function change(
    hoursAgo: number,
    _id: string,
    actor = "user-1",
  ): import("@/lib/types").DeviceStatusTransition {
    const startMs = Date.parse(NOW) - hoursAgo * 60 * 60 * 1000;
    return {
      status: "online",
      startAt: new Date(startMs).toISOString(),
      endAt: null,
      durationMs: 0,
      actor,
      source: "user",
    };
  }

  it("flags flapping when count exceeds threshold", () => {
    const transitions = [1, 3, 5, 7, 9, 11].map((h, i) => change(h, `t${i}`));
    const result = detectFlapping(transitions, 24 * 60 * 60 * 1000, 5, NOW);
    expect(result.count).toBe(6);
    expect(result.isFlapping).toBe(true);
  });

  it("does NOT flag when count equals threshold (> is strict)", () => {
    const transitions = [1, 3, 5, 7, 9].map((h, i) => change(h, `t${i}`));
    const result = detectFlapping(transitions, 24 * 60 * 60 * 1000, 5, NOW);
    expect(result.count).toBe(5);
    expect(result.isFlapping).toBe(false);
  });

  it("ignores transitions outside the window", () => {
    const transitions = [change(1, "in"), change(30, "out-1"), change(50, "out-2")];
    const result = detectFlapping(transitions, 24 * 60 * 60 * 1000, 5, NOW);
    expect(result.count).toBe(1);
    expect(result.isFlapping).toBe(false);
  });

  it("ignores synthetic seed entries (actor='unknown', source='unknown')", () => {
    const transitions = [
      {
        status: "online",
        startAt: NOW,
        endAt: null,
        durationMs: 0,
        actor: "unknown",
        source: "unknown" as const,
      },
      change(1, "t1"),
    ];
    const result = detectFlapping(transitions, 24 * 60 * 60 * 1000, 5, NOW);
    expect(result.count).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// formatDuration
// ---------------------------------------------------------------------------

describe("formatDuration", () => {
  it("formats sub-minute, sub-hour, sub-day durations", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(45_000)).toBe("45s");
    expect(formatDuration(60_000)).toBe("1m");
    expect(formatDuration(90_000)).toBe("1m 30s");
    expect(formatDuration(3_600_000)).toBe("1h");
    expect(formatDuration(3_725_000)).toBe("1h 2m");
  });

  it("formats day-scale durations with hours remainder", () => {
    expect(formatDuration(24 * 60 * 60 * 1000)).toBe("1d");
    expect(formatDuration(24 * 60 * 60 * 1000 + 3600_000)).toBe("1d 1h");
    expect(formatDuration(4 * 24 * 60 * 60 * 1000 + 5 * 3600_000)).toBe("4d 5h");
  });

  it("returns em-dash for invalid inputs", () => {
    expect(formatDuration(NaN)).toBe("—");
    expect(formatDuration(-1)).toBe("—");
  });
});
