/**
 * IMS Gen 2 — Lazy Schema Migration
 *
 * Provides on-read migration for DynamoDB items. When the API layer reads
 * an item, it calls `migrateItem()` to transparently upgrade items that
 * are at an older schema version. This enables zero-downtime migration:
 * items are upgraded lazily as they are accessed.
 *
 * The migration functions are defined inline here (mirroring the infra
 * migration registry) to avoid importing from `infra/` in the frontend
 * bundle. Keep these in sync with `infra/migrations/`.
 *
 * @see Story #233 — Data schema versioning
 */

// =============================================================================
// Types
// =============================================================================

/** A single lazy migration step */
export interface LazyMigration {
  /** Target schema version after this migration */
  version: number;
  /** Transform an item from version N-1 to version N */
  up: (item: Record<string, unknown>) => Record<string, unknown>;
  /** Transform an item from version N back to version N-1 */
  down: (item: Record<string, unknown>) => Record<string, unknown>;
}

// =============================================================================
// Lazy Migration Registry (mirrors infra/migrations/)
// =============================================================================

/**
 * All lazy migrations, in ascending version order.
 * MUST be kept in sync with `infra/migrations/registry.ts`.
 */
const LAZY_MIGRATIONS: readonly LazyMigration[] = [
  {
    version: 1,
    up(item: Record<string, unknown>): Record<string, unknown> {
      if (typeof item["_schemaVersion"] === "number" && item["_schemaVersion"] >= 1) {
        return item;
      }
      return { ...item, _schemaVersion: 1 };
    },
    down(item: Record<string, unknown>): Record<string, unknown> {
      const { _schemaVersion: _, ...rest } = item;
      return rest;
    },
  },
];

/** Current schema version the app expects */
export const CURRENT_SCHEMA_VERSION: number =
  LAZY_MIGRATIONS.length > 0 ? LAZY_MIGRATIONS[LAZY_MIGRATIONS.length - 1]!.version : 0;

// =============================================================================
// Core API
// =============================================================================

/**
 * Migrate a single item to the target schema version.
 *
 * @param item      The raw item from DynamoDB (or API response)
 * @param targetVersion  The desired schema version (defaults to CURRENT_SCHEMA_VERSION)
 * @returns         The item at the target schema version
 *
 * @example
 * ```ts
 * const device = migrateItem<Device>(rawDevice);
 * // device._schemaVersion === CURRENT_SCHEMA_VERSION
 * ```
 */
export function migrateItem<T extends Record<string, unknown>>(
  item: T,
  targetVersion: number = CURRENT_SCHEMA_VERSION,
): T {
  const currentVersion =
    typeof item["_schemaVersion"] === "number" ? item["_schemaVersion"] : 0;

  if (currentVersion === targetVersion) {
    return item;
  }

  let result: Record<string, unknown> = { ...item };

  if (currentVersion < targetVersion) {
    // Forward migration
    const pending = LAZY_MIGRATIONS.filter(
      (m) => m.version > currentVersion && m.version <= targetVersion,
    );
    for (const migration of pending) {
      result = migration.up(result);
    }
    result["_schemaVersion"] = targetVersion;
  } else {
    // Downgrade migration (rare, for rollback scenarios)
    const rollbacks = [...LAZY_MIGRATIONS]
      .filter((m) => m.version <= currentVersion && m.version > targetVersion)
      .reverse();
    for (const migration of rollbacks) {
      result = migration.down(result);
    }
    result["_schemaVersion"] = targetVersion;
  }

  return result as T;
}

/**
 * Migrate an array of items to the target schema version.
 *
 * @param items          Array of raw items
 * @param targetVersion  The desired schema version (defaults to CURRENT_SCHEMA_VERSION)
 * @returns              Array of items at the target schema version
 */
export function migrateItems<T extends Record<string, unknown>>(
  items: T[],
  targetVersion: number = CURRENT_SCHEMA_VERSION,
): T[] {
  return items.map((item) => migrateItem(item, targetVersion));
}

/**
 * Check whether an item needs migration.
 *
 * @param item           The item to check
 * @param targetVersion  The desired schema version (defaults to CURRENT_SCHEMA_VERSION)
 * @returns              True if the item's schema version does not match the target
 */
export function needsMigration(
  item: Record<string, unknown>,
  targetVersion: number = CURRENT_SCHEMA_VERSION,
): boolean {
  const currentVersion =
    typeof item["_schemaVersion"] === "number" ? item["_schemaVersion"] : 0;
  return currentVersion !== targetVersion;
}

/**
 * Get the schema version of an item.
 *
 * @param item  The item to inspect
 * @returns     The schema version (0 if not set)
 */
export function getSchemaVersion(item: Record<string, unknown>): number {
  return typeof item["_schemaVersion"] === "number" ? item["_schemaVersion"] : 0;
}
