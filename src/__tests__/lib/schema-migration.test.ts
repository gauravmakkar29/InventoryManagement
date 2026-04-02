/**
 * Unit tests for src/lib/schema-migration.ts
 *
 * Tests lazy migration, version compatibility, up/down migrations,
 * batch migration, and edge cases.
 *
 * @see Story #233 — Data schema versioning
 */

import { describe, it, expect } from "vitest";
import {
  migrateItem,
  migrateItems,
  needsMigration,
  getSchemaVersion,
  CURRENT_SCHEMA_VERSION,
} from "@/lib/schema-migration";

// =============================================================================
// Test Data
// =============================================================================

const DEVICE_V0: Record<string, unknown> = {
  id: "dev-001",
  name: "Inverter Alpha",
  serialNumber: "SN-12345",
  model: "SG-3000",
  manufacturer: "Sungrow",
  status: "online",
  firmwareVersion: "1.2.3",
  location: "Site A",
};

const DEVICE_V1: Record<string, unknown> = {
  ...DEVICE_V0,
  _schemaVersion: 1,
};

const FIRMWARE_V0: Record<string, unknown> = {
  id: "fw-001",
  version: "2.0.0",
  name: "Core Firmware",
  status: "approved",
};

// =============================================================================
// CURRENT_SCHEMA_VERSION
// =============================================================================

describe("CURRENT_SCHEMA_VERSION", () => {
  it("should be a positive integer", () => {
    expect(CURRENT_SCHEMA_VERSION).toBeGreaterThan(0);
    expect(Number.isInteger(CURRENT_SCHEMA_VERSION)).toBe(true);
  });

  it("should be 1 for the initial migration set", () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(1);
  });
});

// =============================================================================
// getSchemaVersion
// =============================================================================

describe("getSchemaVersion", () => {
  it("should return 0 for items without _schemaVersion", () => {
    expect(getSchemaVersion(DEVICE_V0)).toBe(0);
  });

  it("should return the schema version for versioned items", () => {
    expect(getSchemaVersion(DEVICE_V1)).toBe(1);
  });

  it("should return 0 for items with non-numeric _schemaVersion", () => {
    expect(getSchemaVersion({ id: "x", _schemaVersion: "one" })).toBe(0);
  });

  it("should return 0 for empty objects", () => {
    expect(getSchemaVersion({})).toBe(0);
  });
});

// =============================================================================
// needsMigration
// =============================================================================

describe("needsMigration", () => {
  it("should return true for items without _schemaVersion", () => {
    expect(needsMigration(DEVICE_V0)).toBe(true);
  });

  it("should return false for items at current version", () => {
    expect(needsMigration(DEVICE_V1)).toBe(false);
  });

  it("should return true for items at a lower version", () => {
    expect(needsMigration({ ...DEVICE_V0, _schemaVersion: 0 })).toBe(true);
  });

  it("should accept a custom target version", () => {
    expect(needsMigration(DEVICE_V1, 2)).toBe(true);
    expect(needsMigration(DEVICE_V1, 1)).toBe(false);
  });
});

// =============================================================================
// migrateItem — Forward Migration (up)
// =============================================================================

describe("migrateItem — forward migration", () => {
  it("should add _schemaVersion to v0 items", () => {
    const result = migrateItem(DEVICE_V0);
    expect(result["_schemaVersion"]).toBe(CURRENT_SCHEMA_VERSION);
  });

  it("should preserve all existing fields", () => {
    const result = migrateItem(DEVICE_V0);
    expect(result["id"]).toBe("dev-001");
    expect(result["name"]).toBe("Inverter Alpha");
    expect(result["serialNumber"]).toBe("SN-12345");
    expect(result["model"]).toBe("SG-3000");
    expect(result["manufacturer"]).toBe("Sungrow");
    expect(result["status"]).toBe("online");
  });

  it("should be idempotent — already-migrated items are unchanged", () => {
    const result = migrateItem(DEVICE_V1);
    expect(result).toEqual(DEVICE_V1);
  });

  it("should not mutate the original item", () => {
    const original = { ...DEVICE_V0 };
    migrateItem(original);
    expect(original["_schemaVersion"]).toBeUndefined();
  });

  it("should work with firmware items", () => {
    const result = migrateItem(FIRMWARE_V0);
    expect(result["_schemaVersion"]).toBe(CURRENT_SCHEMA_VERSION);
    expect(result["id"]).toBe("fw-001");
    expect(result["version"]).toBe("2.0.0");
  });

  it("should work with empty objects", () => {
    const item: Record<string, unknown> = {};
    const result = migrateItem(item);
    expect(result["_schemaVersion"]).toBe(CURRENT_SCHEMA_VERSION);
  });

  it("should migrate from version 0 (implicit) to version 1", () => {
    const item: Record<string, unknown> = { id: "test", data: "value" };
    const result = migrateItem(item, 1);
    expect(result["_schemaVersion"]).toBe(1);
    expect(result["id"]).toBe("test");
    expect(result["data"]).toBe("value");
  });
});

// =============================================================================
// migrateItem — Downgrade Migration (down)
// =============================================================================

describe("migrateItem — downgrade migration", () => {
  it("should remove _schemaVersion when downgrading to v0", () => {
    const result = migrateItem(DEVICE_V1, 0);
    expect(result["_schemaVersion"]).toBe(0);
    // The down function removes _schemaVersion, then we set it to targetVersion (0)
    expect(result["id"]).toBe("dev-001");
  });

  it("should preserve all other fields when downgrading", () => {
    const result = migrateItem(DEVICE_V1, 0);
    expect(result["name"]).toBe("Inverter Alpha");
    expect(result["serialNumber"]).toBe("SN-12345");
  });

  it("should not mutate the original item when downgrading", () => {
    const original = { ...DEVICE_V1 };
    migrateItem(original, 0);
    expect(original["_schemaVersion"]).toBe(1);
  });
});

// =============================================================================
// migrateItem — No-op cases
// =============================================================================

describe("migrateItem — no-op cases", () => {
  it("should return the same item when already at target version", () => {
    const result = migrateItem(DEVICE_V1, 1);
    expect(result).toEqual(DEVICE_V1);
  });

  it("should return the same reference when no migration needed", () => {
    const result = migrateItem(DEVICE_V1, 1);
    // Same reference since currentVersion === targetVersion
    expect(result).toBe(DEVICE_V1);
  });
});

// =============================================================================
// migrateItems — Batch migration
// =============================================================================

describe("migrateItems", () => {
  it("should migrate an array of items", () => {
    const items = [{ ...DEVICE_V0 }, { ...FIRMWARE_V0 }];
    const results = migrateItems(items);
    expect(results).toHaveLength(2);
    expect(results[0]!["_schemaVersion"]).toBe(CURRENT_SCHEMA_VERSION);
    expect(results[1]!["_schemaVersion"]).toBe(CURRENT_SCHEMA_VERSION);
  });

  it("should handle mixed-version items", () => {
    const items = [{ ...DEVICE_V0 }, { ...DEVICE_V1 }];
    const results = migrateItems(items);
    expect(results[0]!["_schemaVersion"]).toBe(CURRENT_SCHEMA_VERSION);
    expect(results[1]!["_schemaVersion"]).toBe(CURRENT_SCHEMA_VERSION);
  });

  it("should handle an empty array", () => {
    const results = migrateItems([]);
    expect(results).toEqual([]);
  });

  it("should not mutate the original array", () => {
    const items = [{ ...DEVICE_V0 }];
    migrateItems(items);
    expect(items[0]!["_schemaVersion"]).toBeUndefined();
  });

  it("should accept a custom target version", () => {
    const items = [{ ...DEVICE_V0 }];
    const results = migrateItems(items, 1);
    expect(results[0]!["_schemaVersion"]).toBe(1);
  });
});

// =============================================================================
// Type Safety
// =============================================================================

describe("type safety", () => {
  it("should preserve the generic type through migration", () => {
    const device: Record<string, unknown> = { id: "d1", name: "Test" };
    const result = migrateItem(device);
    expect(result["id"]).toBe("d1");
    expect(result["name"]).toBe("Test");
    expect(result["_schemaVersion"]).toBe(CURRENT_SCHEMA_VERSION);
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe("edge cases", () => {
  it("should handle items with extra unknown fields", () => {
    const item: Record<string, unknown> = {
      id: "x",
      _unknownField: true,
      _anotherField: [1, 2, 3],
    };
    const result = migrateItem(item);
    expect(result["_unknownField"]).toBe(true);
    expect(result["_anotherField"]).toEqual([1, 2, 3]);
    expect(result["_schemaVersion"]).toBe(CURRENT_SCHEMA_VERSION);
  });

  it("should handle items with null values", () => {
    const item: Record<string, unknown> = { id: "x", nullField: null };
    const result = migrateItem(item);
    expect(result["nullField"]).toBeNull();
    expect(result["_schemaVersion"]).toBe(CURRENT_SCHEMA_VERSION);
  });

  it("should handle items with nested objects", () => {
    const item: Record<string, unknown> = {
      id: "x",
      metadata: { key: "value", nested: { deep: true } },
    };
    const result = migrateItem(item);
    expect(result["metadata"]).toEqual({ key: "value", nested: { deep: true } });
    expect(result["_schemaVersion"]).toBe(CURRENT_SCHEMA_VERSION);
  });
});
