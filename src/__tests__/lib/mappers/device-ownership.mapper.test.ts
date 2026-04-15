import { describe, it, expect } from "vitest";
import {
  deriveOwnershipChainFromAuditLog,
  formatDurationDays,
} from "@/lib/mappers/device-ownership.mapper";
import type { CDCEvent } from "@/lib/providers/cdc-provider.types";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const DEVICE_CREATED_AT = "2024-01-01T00:00:00.000Z";
const NOW = "2026-04-01T00:00:00.000Z";

function customerChange(params: {
  id: string;
  timestamp: string;
  from: string;
  to: string;
  changedBy?: string;
  fromSite?: string;
  toSite?: string;
  transferReason?: string;
}): CDCEvent {
  return {
    id: params.id,
    entityType: "device",
    entityId: "dev-001",
    action: "update",
    oldValue: {
      customerId: params.from,
      ...(params.fromSite ? { siteId: params.fromSite } : {}),
    },
    newValue: {
      customerId: params.to,
      ...(params.toSite ? { siteId: params.toSite } : {}),
    },
    changedBy: params.changedBy ?? "user-1",
    timestamp: params.timestamp,
    // Non-standard but tolerated — transferReason rides in metadata
    ...(params.transferReason
      ? ({ metadata: { transferReason: params.transferReason } } as Partial<CDCEvent>)
      : {}),
  } as CDCEvent;
}

const CUSTOMER_LOOKUP: Record<string, string> = {
  "cust-A": "Shanghai Power Systems",
  "cust-B": "Sydney Solar Farms",
  "cust-C": "Brisbane Energy Grid",
};

function lookup(id: string): string | undefined {
  return CUSTOMER_LOOKUP[id];
}

// ---------------------------------------------------------------------------
// deriveOwnershipChainFromAuditLog
// ---------------------------------------------------------------------------

describe("deriveOwnershipChainFromAuditLog", () => {
  it("returns a single open record when no ownership events exist", () => {
    const chain = deriveOwnershipChainFromAuditLog({
      events: [],
      deviceCreatedAt: DEVICE_CREATED_AT,
      currentCustomerId: "cust-A",
      currentCustomerName: "Shanghai Power Systems",
      nowIso: NOW,
    });
    expect(chain).toHaveLength(1);
    expect(chain[0]).toMatchObject({
      customerId: "cust-A",
      customerName: "Shanghai Power Systems",
      endAt: null,
    });
    // ~27 months = ~820 days; allow slack
    expect(chain[0]?.durationDays).toBeGreaterThan(800);
  });

  it("builds a multi-transfer chain ending in an open record", () => {
    const chain = deriveOwnershipChainFromAuditLog({
      events: [
        customerChange({
          id: "e1",
          timestamp: "2024-06-15T00:00:00.000Z",
          from: "cust-A",
          to: "cust-B",
          changedBy: "admin@example.com",
        }),
        customerChange({
          id: "e2",
          timestamp: "2025-02-01T00:00:00.000Z",
          from: "cust-B",
          to: "cust-A",
          changedBy: "mgr@example.com",
          transferReason: "warranty replacement",
        }),
      ],
      deviceCreatedAt: DEVICE_CREATED_AT,
      currentCustomerId: "cust-A",
      currentCustomerName: "Shanghai Power Systems",
      lookupCustomerName: lookup,
      nowIso: NOW,
    });

    expect(chain).toHaveLength(3);

    // Seed: cust-A, 2024-01-01 → 2024-06-15 (~166 days)
    expect(chain[0]).toMatchObject({
      customerId: "cust-A",
      customerName: "Shanghai Power Systems",
      startAt: DEVICE_CREATED_AT,
      endAt: "2024-06-15T00:00:00.000Z",
    });
    expect(chain[0]?.durationDays).toBeGreaterThan(160);
    expect(chain[0]?.durationDays).toBeLessThan(170);

    // Middle: cust-B, 2024-06-15 → 2025-02-01 (~232 days)
    expect(chain[1]).toMatchObject({
      customerId: "cust-B",
      customerName: "Sydney Solar Farms",
    });
    expect(chain[1]?.transferredBy.displayName).toBe("admin@example.com");

    // Open record: cust-A again, from 2025-02-01 to NOW
    expect(chain[2]).toMatchObject({
      customerId: "cust-A",
      endAt: null,
      transferReason: "warranty replacement",
    });
    expect(chain[2]?.transferredBy.displayName).toBe("mgr@example.com");
  });

  it("falls back to the raw id when the customer lookup is missing", () => {
    const chain = deriveOwnershipChainFromAuditLog({
      events: [
        customerChange({
          id: "e1",
          timestamp: "2024-06-15T00:00:00.000Z",
          from: "cust-A",
          to: "cust-ghost",
        }),
      ],
      deviceCreatedAt: DEVICE_CREATED_AT,
      currentCustomerId: "cust-ghost",
      currentCustomerName: "cust-ghost",
      lookupCustomerName: lookup,
      nowIso: NOW,
    });
    expect(chain[1]?.customerName).toBe("cust-ghost");
  });

  it("includes site info when the event carries siteId", () => {
    const chain = deriveOwnershipChainFromAuditLog({
      events: [
        customerChange({
          id: "e1",
          timestamp: "2024-06-15T00:00:00.000Z",
          from: "cust-A",
          to: "cust-B",
          fromSite: "site-1",
          toSite: "site-2",
        }),
      ],
      deviceCreatedAt: DEVICE_CREATED_AT,
      currentCustomerId: "cust-B",
      currentCustomerName: "Sydney Solar Farms",
      lookupCustomerName: lookup,
      lookupSiteName: (id) => (id === "site-2" ? "Tokyo DC" : id),
      nowIso: NOW,
    });
    expect(chain[1]?.siteId).toBe("site-2");
    expect(chain[1]?.siteName).toBe("Tokyo DC");
  });

  it("filters out non-ownership events (e.g. status-only changes)", () => {
    const chain = deriveOwnershipChainFromAuditLog({
      events: [
        {
          id: "status-only",
          entityType: "device",
          entityId: "dev-001",
          action: "update",
          oldValue: { status: "online" },
          newValue: { status: "offline" },
          changedBy: "u",
          timestamp: "2024-06-15T00:00:00.000Z",
        },
      ],
      deviceCreatedAt: DEVICE_CREATED_AT,
      currentCustomerId: "cust-A",
      currentCustomerName: "Shanghai Power Systems",
      nowIso: NOW,
    });
    // Only the seed record — no ownership changes detected
    expect(chain).toHaveLength(1);
  });

  it("captures transferReason from event metadata when present", () => {
    const chain = deriveOwnershipChainFromAuditLog({
      events: [
        customerChange({
          id: "e1",
          timestamp: "2024-06-15T00:00:00.000Z",
          from: "cust-A",
          to: "cust-B",
          transferReason: "customer migration to new region",
        }),
      ],
      deviceCreatedAt: DEVICE_CREATED_AT,
      currentCustomerId: "cust-B",
      currentCustomerName: "Sydney Solar Farms",
      lookupCustomerName: lookup,
      nowIso: NOW,
    });
    expect(chain[1]?.transferReason).toBe("customer migration to new region");
  });

  it("sorts events ascending by timestamp before chaining", () => {
    const chain = deriveOwnershipChainFromAuditLog({
      events: [
        customerChange({
          id: "e2",
          timestamp: "2025-02-01T00:00:00.000Z",
          from: "cust-B",
          to: "cust-A",
        }),
        customerChange({
          id: "e1",
          timestamp: "2024-06-15T00:00:00.000Z",
          from: "cust-A",
          to: "cust-B",
        }),
      ],
      deviceCreatedAt: DEVICE_CREATED_AT,
      currentCustomerId: "cust-A",
      currentCustomerName: "Shanghai Power Systems",
      lookupCustomerName: lookup,
      nowIso: NOW,
    });
    expect(chain.map((r) => r.customerId)).toEqual(["cust-A", "cust-B", "cust-A"]);
  });
});

// ---------------------------------------------------------------------------
// formatDurationDays
// ---------------------------------------------------------------------------

describe("formatDurationDays", () => {
  it("formats sub-day durations as hours", () => {
    expect(formatDurationDays(0.04)).toBe("1 hour");
    expect(formatDurationDays(0.5)).toBe("12 hours");
  });

  it("formats day-scale durations", () => {
    expect(formatDurationDays(1)).toBe("1 day");
    expect(formatDurationDays(15)).toBe("15 days");
  });

  it("formats month-scale durations", () => {
    expect(formatDurationDays(45)).toBe("2 months"); // rounded
    expect(formatDurationDays(90)).toBe("3 months");
  });

  it("formats year-scale durations with month remainder", () => {
    expect(formatDurationDays(365)).toBe("1 year");
    expect(formatDurationDays(400)).toMatch(/^1 year, \d+ months?$/);
    expect(formatDurationDays(730)).toBe("2 years");
  });

  it("returns em-dash for invalid inputs", () => {
    expect(formatDurationDays(NaN)).toBe("—");
    expect(formatDurationDays(-5)).toBe("—");
  });
});
