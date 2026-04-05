import { describe, it, expect } from "vitest";
import { filterByViewport } from "../../app/components/geo-location/geo-location-types";
import { DeviceStatus } from "../../lib/types";

function makeDevice(id: string, lat: number, lng: number) {
  return {
    id,
    name: `Device ${id}`,
    serial: `SN-${id}`,
    model: "INV-3200",
    status: DeviceStatus.Online,
    location: "Test",
    health: 95,
    firmware: "v3.2.1",
    lastSeen: "2024-01-01",
    resolvedLat: lat,
    resolvedLng: lng,
  };
}

describe("filterByViewport", () => {
  const devices = [
    makeDevice("1", 40.71, -74.01), // New York
    makeDevice("2", 51.51, -0.13), // London
    makeDevice("3", -33.87, 151.21), // Sydney
    makeDevice("4", 35.68, 139.65), // Tokyo
    makeDevice("5", 48.86, 2.35), // Paris
  ];

  it("returns all devices at zoom 1 (world view)", () => {
    const result = filterByViewport(devices, [0, 20], 1);
    expect(result.length).toBe(5);
  });

  it("filters to European devices when centered on Europe at high zoom", () => {
    // Center on London at zoom 4 — should see London and Paris, not NYC/Sydney/Tokyo
    const result = filterByViewport(devices, [0, 51], 4);
    const ids = result.map((d) => d.id);
    expect(ids).toContain("2"); // London
    expect(ids).toContain("5"); // Paris
    expect(ids).not.toContain("3"); // Sydney
    expect(ids).not.toContain("4"); // Tokyo
  });

  it("filters to NYC area when centered on it at high zoom", () => {
    const result = filterByViewport(devices, [-74, 41], 6);
    const ids = result.map((d) => d.id);
    expect(ids).toContain("1"); // New York
    expect(ids).not.toContain("2"); // London
    expect(ids).not.toContain("3"); // Sydney
  });

  it("returns empty array when no devices in viewport", () => {
    // Center on middle of Pacific Ocean
    const result = filterByViewport(devices, [-160, 0], 8);
    expect(result.length).toBe(0);
  });

  it("respects buffer factor", () => {
    // With large buffer, more devices should be included
    const narrow = filterByViewport(devices, [0, 51], 4, 0);
    const wide = filterByViewport(devices, [0, 51], 4, 0.5);
    expect(wide.length).toBeGreaterThanOrEqual(narrow.length);
  });

  it("handles empty device array", () => {
    const result = filterByViewport([], [0, 0], 1);
    expect(result).toEqual([]);
  });
});
