/**
 * Migration 001 — Add _schemaVersion field
 *
 * Adds `_schemaVersion: 1` to all DynamoDB items that do not yet have a
 * schema version. This is the bootstrap migration that establishes the
 * versioning convention.
 *
 * Up:   { id, name, ... } → { id, name, ..., _schemaVersion: 1 }
 * Down: { id, name, ..., _schemaVersion: 1 } → { id, name, ... }
 *
 * @see Story #233 — Data schema versioning
 */

import type { Migration } from "./registry";

export const migration001: Migration = {
  version: 1,
  name: "add-schema-version",
  description: "Add _schemaVersion field to all items (bootstrap migration)",

  up(item: Record<string, unknown>): Record<string, unknown> {
    // Idempotent: if already at version 1+, leave as-is
    if (typeof item["_schemaVersion"] === "number" && item["_schemaVersion"] >= 1) {
      return item;
    }
    return { ...item, _schemaVersion: 1 };
  },

  down(item: Record<string, unknown>): Record<string, unknown> {
    const { _schemaVersion: _, ...rest } = item;
    return rest;
  },
};
