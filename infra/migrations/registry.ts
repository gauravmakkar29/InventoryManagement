/**
 * IMS Gen 2 — Schema Migration Registry
 *
 * Central registry of all DynamoDB schema migrations. Each migration defines
 * an `up` transform (apply) and `down` transform (rollback) that operate on
 * a single DynamoDB item.
 *
 * Migrations MUST be registered in ascending version order. The runner and
 * lazy-migration layer both reference this registry.
 *
 * @see Story #233 — Data schema versioning
 */

// =============================================================================
// Types
// =============================================================================

export interface Migration {
  /** Target schema version after this migration is applied */
  version: number;
  /** Short identifier (kebab-case, e.g., "add-schema-version") */
  name: string;
  /** Human-readable description of what this migration does */
  description: string;
  /** Transform an item from version N-1 to version N */
  up: (item: Record<string, unknown>) => Record<string, unknown>;
  /** Transform an item from version N back to version N-1 */
  down: (item: Record<string, unknown>) => Record<string, unknown>;
}

// =============================================================================
// Migration Registry
// =============================================================================

import { migration001 } from "./001-add-schema-version";

/**
 * Ordered list of all migrations. MUST be sorted by `version` ascending.
 * New migrations are appended here as they are created.
 */
export const MIGRATIONS: readonly Migration[] = [migration001];

/**
 * The current/latest schema version — always the version of the last migration.
 */
export const CURRENT_SCHEMA_VERSION: number =
  MIGRATIONS.length > 0 ? MIGRATIONS[MIGRATIONS.length - 1]!.version : 0;

// =============================================================================
// Lookup Helpers
// =============================================================================

/**
 * Return all migrations needed to go from `fromVersion` to `toVersion`.
 * Returns an empty array if no migrations are needed.
 */
export function getMigrationsInRange(
  fromVersion: number,
  toVersion: number,
): readonly Migration[] {
  if (fromVersion >= toVersion) return [];
  return MIGRATIONS.filter((m) => m.version > fromVersion && m.version <= toVersion);
}

/**
 * Return all migrations needed to rollback from `fromVersion` to `toVersion`.
 * Returns migrations in reverse order (newest first).
 */
export function getRollbackMigrations(
  fromVersion: number,
  toVersion: number,
): readonly Migration[] {
  if (fromVersion <= toVersion) return [];
  return [...MIGRATIONS]
    .filter((m) => m.version <= fromVersion && m.version > toVersion)
    .reverse();
}
