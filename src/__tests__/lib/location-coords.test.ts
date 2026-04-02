import { describe, it, expect } from "vitest";
import {
  getCityCoordinates,
  getAllCities,
  resolveDeviceCoordinates,
} from "../../lib/location-coords";

// =============================================================================
// getCityCoordinates
// =============================================================================

describe("getCityCoordinates", () => {
  it("returns coordinates for known cities", () => {
    const denver = getCityCoordinates("Denver, CO");
    expect(denver).toBeDefined();
    expect(denver!.lat).toBeCloseTo(39.7392, 2);
    expect(denver!.lng).toBeCloseTo(-104.9903, 2);
  });

  it("is case-insensitive", () => {
    expect(getCityCoordinates("DENVER")).toBeDefined();
    expect(getCityCoordinates("denver")).toBeDefined();
    expect(getCityCoordinates("Denver")).toBeDefined();
  });

  it("trims whitespace", () => {
    expect(getCityCoordinates("  denver  ")).toBeDefined();
  });

  it("returns undefined for unknown cities", () => {
    expect(getCityCoordinates("Unknown City")).toBeUndefined();
  });

  it("supports international cities", () => {
    const tokyo = getCityCoordinates("tokyo");
    expect(tokyo).toBeDefined();
    expect(tokyo!.lat).toBeCloseTo(35.6762, 2);

    const london = getCityCoordinates("london");
    expect(london).toBeDefined();
    expect(london!.lat).toBeCloseTo(51.5074, 2);

    const sydney = getCityCoordinates("sydney");
    expect(sydney).toBeDefined();
    expect(sydney!.lat).toBeCloseTo(-33.8688, 2);
  });
});

// =============================================================================
// getAllCities
// =============================================================================

describe("getAllCities", () => {
  it("returns an array of city coordinates", () => {
    const cities = getAllCities();
    expect(Array.isArray(cities)).toBe(true);
    expect(cities.length).toBeGreaterThan(0);
  });

  it("each city has lat, lng, and label", () => {
    const cities = getAllCities();
    for (const city of cities) {
      expect(typeof city.lat).toBe("number");
      expect(typeof city.lng).toBe("number");
      expect(typeof city.label).toBe("string");
    }
  });
});

// =============================================================================
// resolveDeviceCoordinates
// =============================================================================

describe("resolveDeviceCoordinates", () => {
  it("uses explicit lat/lng when provided", () => {
    const result = resolveDeviceCoordinates({ lat: 40.0, lng: -105.0 });
    expect(result).toEqual({ lat: 40.0, lng: -105.0 });
  });

  it("ignores (0, 0) coordinates and falls back to location lookup", () => {
    const result = resolveDeviceCoordinates({ lat: 0, lng: 0, location: "Denver" });
    expect(result).toBeDefined();
    expect(result!.lat).toBeCloseTo(39.7392, 2);
  });

  it("falls back to location name when no lat/lng", () => {
    const result = resolveDeviceCoordinates({ location: "Houston, TX" });
    expect(result).toBeDefined();
    expect(result!.lat).toBeCloseTo(29.7604, 2);
  });

  it("returns null when neither coordinates nor known location", () => {
    const result = resolveDeviceCoordinates({ location: "Unknown Place" });
    expect(result).toBeNull();
  });

  it("returns null for empty device", () => {
    const result = resolveDeviceCoordinates({});
    expect(result).toBeNull();
  });

  it("prefers explicit coordinates over location name", () => {
    const result = resolveDeviceCoordinates({ lat: 50.0, lng: -100.0, location: "Denver" });
    expect(result).toEqual({ lat: 50.0, lng: -100.0 });
  });
});
