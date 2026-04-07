import { describe, it, expect } from "vitest";
import {
  MOCK_FIRMWARE_VERSIONS,
  ALL_FIRMWARE_VERSIONS,
} from "@/lib/mock-data/firmware-version-data";
import {
  MOCK_CUSTOMERS,
  MOCK_SITES,
  MOCK_SITE_DEPLOYMENTS,
} from "@/lib/mock-data/customer-site-data";
import { EVENT_COLOR_MAP } from "@/lib/types/firmware-version";
import { FirmwareLifecycleState } from "@/lib/types";

// =============================================================================
// Firmware Version Mock Data
// =============================================================================

describe("firmware version mock data", () => {
  it("has 3 firmware families", () => {
    expect(Object.keys(MOCK_FIRMWARE_VERSIONS)).toHaveLength(3);
  });

  it("each family has 2+ versions (AC3)", () => {
    for (const [familyId, versions] of Object.entries(MOCK_FIRMWARE_VERSIONS)) {
      expect(versions.length, `${familyId} should have ≥2 versions`).toBeGreaterThanOrEqual(2);
    }
  });

  it("each version has required fields", () => {
    for (const version of ALL_FIRMWARE_VERSIONS) {
      expect(version.id).toBeTruthy();
      expect(version.familyId).toBeTruthy();
      expect(version.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(version.uploadedBy).toContain("@");
      expect(version.uploadedAt).toBeTruthy();
      expect(Object.values(FirmwareLifecycleState)).toContain(version.lifecycleState);
    }
  });

  it("each version has 2+ events showing lifecycle", () => {
    for (const version of ALL_FIRMWARE_VERSIONS) {
      expect(
        version.events.length,
        `${version.id} (v${version.version}) should have ≥2 events`,
      ).toBeGreaterThanOrEqual(2);
    }
  });

  it("events have chronological timestamps", () => {
    for (const version of ALL_FIRMWARE_VERSIONS) {
      for (let i = 1; i < version.events.length; i++) {
        const prev = new Date(version.events[i - 1]!.timestamp).getTime();
        const curr = new Date(version.events[i]!.timestamp).getTime();
        expect(
          curr,
          `${version.id} event ${i} should be after event ${i - 1}`,
        ).toBeGreaterThanOrEqual(prev);
      }
    }
  });

  it("includes rejected → resubmitted lifecycle path", () => {
    const fam1Versions = MOCK_FIRMWARE_VERSIONS["fam-1"]!;
    const rejected = fam1Versions.find((v) => v.events.some((e) => e.type === "REJECTED"));
    expect(rejected).toBeDefined();
  });

  it("includes recalled version", () => {
    const recalled = ALL_FIRMWARE_VERSIONS.find(
      (v) => v.lifecycleState === FirmwareLifecycleState.Recalled,
    );
    expect(recalled).toBeDefined();
  });

  it("flat array contains all versions", () => {
    const totalFromMap = Object.values(MOCK_FIRMWARE_VERSIONS).reduce(
      (sum, arr) => sum + arr.length,
      0,
    );
    expect(ALL_FIRMWARE_VERSIONS).toHaveLength(totalFromMap);
  });
});

// =============================================================================
// EVENT_COLOR_MAP
// =============================================================================

describe("EVENT_COLOR_MAP", () => {
  const allEventTypes = [
    "UPLOADED",
    "SUBMITTED_FOR_REVIEW",
    "APPROVED",
    "REJECTED",
    "DEPLOYED",
    "RECALLED",
    "DEPRECATED",
    "NOTE",
  ] as const;

  it("covers all event types", () => {
    for (const type of allEventTypes) {
      expect(EVENT_COLOR_MAP[type]).toBeDefined();
    }
  });

  it("maps approved/deployed to green", () => {
    expect(EVENT_COLOR_MAP.APPROVED).toBe("green");
    expect(EVENT_COLOR_MAP.DEPLOYED).toBe("green");
  });

  it("maps rejected/recalled to red", () => {
    expect(EVENT_COLOR_MAP.REJECTED).toBe("red");
    expect(EVENT_COLOR_MAP.RECALLED).toBe("red");
  });

  it("maps uploaded/submitted to blue", () => {
    expect(EVENT_COLOR_MAP.UPLOADED).toBe("blue");
    expect(EVENT_COLOR_MAP.SUBMITTED_FOR_REVIEW).toBe("blue");
  });
});

// =============================================================================
// Customer & Site Mock Data
// =============================================================================

describe("customer & site mock data", () => {
  it("has 5 customers (AC4)", () => {
    expect(MOCK_CUSTOMERS).toHaveLength(5);
  });

  it("customers have required fields", () => {
    for (const customer of MOCK_CUSTOMERS) {
      expect(customer.id).toBeTruthy();
      expect(customer.name).toBeTruthy();
      expect(customer.code).toBeTruthy();
      expect(customer.contactEmail).toContain("@");
      expect(customer.complianceScore).toBeGreaterThanOrEqual(0);
      expect(customer.complianceScore).toBeLessThanOrEqual(100);
    }
  });

  it("has 10 sites across customers", () => {
    expect(MOCK_SITES).toHaveLength(10);
  });

  it("each customer has at least 2 sites (AC4)", () => {
    for (const customer of MOCK_CUSTOMERS) {
      const sites = MOCK_SITES.filter((s) => s.customerId === customer.id);
      expect(sites.length, `${customer.name} should have ≥2 sites`).toBeGreaterThanOrEqual(2);
    }
  });

  it("site deployment records reference valid site IDs", () => {
    const siteIds = new Set(MOCK_SITES.map((s) => s.id));
    for (const dep of MOCK_SITE_DEPLOYMENTS) {
      expect(siteIds.has(dep.siteId), `${dep.id} references unknown site ${dep.siteId}`).toBe(true);
    }
  });

  it("site deployment records reference valid firmware version IDs", () => {
    const fwVersionIds = new Set(ALL_FIRMWARE_VERSIONS.map((v) => v.id));
    for (const dep of MOCK_SITE_DEPLOYMENTS) {
      expect(
        fwVersionIds.has(dep.firmwareVersionId),
        `${dep.id} references unknown firmware version ${dep.firmwareVersionId}`,
      ).toBe(true);
    }
  });

  it("has 13 deployment records", () => {
    expect(MOCK_SITE_DEPLOYMENTS.length).toBeGreaterThanOrEqual(10);
  });
});
