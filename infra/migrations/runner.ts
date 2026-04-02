/**
 * IMS Gen 2 — Schema Migration Runner (Lambda-Compatible)
 *
 * Reads items from DynamoDB tables, checks `_schemaVersion`, and applies
 * pending migrations in order. Designed as a Lambda handler but the core
 * logic is pure TypeScript for testability.
 *
 * Features:
 * - Idempotent execution (safe to re-run)
 * - Progress tracking via structured logging
 * - Error handling with per-item rollback
 * - Batch processing to stay within Lambda limits
 *
 * @see Story #233 — Data schema versioning
 */

import { CURRENT_SCHEMA_VERSION, getMigrationsInRange, getRollbackMigrations } from "./registry";
import type { Migration } from "./registry";

// =============================================================================
// Types
// =============================================================================

/** DynamoDB adapter interface — decouple from AWS SDK for testability */
export interface DynamoAdapter {
  /** Scan all items from a table (handles pagination internally) */
  scanAll(tableName: string): Promise<Record<string, unknown>[]>;
  /** Write a single item back to the table */
  putItem(tableName: string, item: Record<string, unknown>): Promise<void>;
}

export interface MigrationRunnerConfig {
  /** DynamoDB table names to migrate */
  tables: string[];
  /** Target schema version (defaults to CURRENT_SCHEMA_VERSION) */
  targetVersion?: number;
  /** Direction: "up" to migrate forward, "down" to rollback */
  direction?: "up" | "down";
  /** Batch size for concurrent writes (default: 25) */
  batchSize?: number;
  /** DynamoDB adapter */
  dynamoAdapter: DynamoAdapter;
  /** Logger (defaults to console-compatible structured logger) */
  logger?: MigrationLogger;
}

export interface MigrationLogger {
  info(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
}

export interface MigrationResult {
  success: boolean;
  tablesProcessed: number;
  itemsProcessed: number;
  itemsMigrated: number;
  itemsSkipped: number;
  itemsFailed: number;
  errors: MigrationError[];
  durationMs: number;
}

export interface MigrationError {
  table: string;
  itemId: string;
  fromVersion: number;
  toVersion: number;
  error: string;
}

// =============================================================================
// Default Logger
// =============================================================================

const defaultLogger: MigrationLogger = {
  info(message: string, context?: Record<string, unknown>): void {
    const entry = { level: "INFO", message, ...context, timestamp: new Date().toISOString() };
    process.stdout.write(JSON.stringify(entry) + "\n");
  },
  error(message: string, context?: Record<string, unknown>): void {
    const entry = { level: "ERROR", message, ...context, timestamp: new Date().toISOString() };
    process.stderr.write(JSON.stringify(entry) + "\n");
  },
  warn(message: string, context?: Record<string, unknown>): void {
    const entry = { level: "WARN", message, ...context, timestamp: new Date().toISOString() };
    process.stdout.write(JSON.stringify(entry) + "\n");
  },
};

// =============================================================================
// Core Runner
// =============================================================================

/**
 * Apply a migration chain to a single item, returning the migrated item.
 * Throws on failure so the caller can handle rollback.
 */
export function applyMigrations(
  item: Record<string, unknown>,
  migrations: readonly Migration[],
  direction: "up" | "down",
): Record<string, unknown> {
  let current = { ...item };
  for (const migration of migrations) {
    const transform = direction === "up" ? migration.up : migration.down;
    current = transform(current);
  }
  return current;
}

/**
 * Run schema migrations across the configured DynamoDB tables.
 */
export async function runMigrations(config: MigrationRunnerConfig): Promise<MigrationResult> {
  const startTime = Date.now();
  const targetVersion = config.targetVersion ?? CURRENT_SCHEMA_VERSION;
  const direction = config.direction ?? "up";
  const batchSize = config.batchSize ?? 25;
  const logger = config.logger ?? defaultLogger;

  const result: MigrationResult = {
    success: true,
    tablesProcessed: 0,
    itemsProcessed: 0,
    itemsMigrated: 0,
    itemsSkipped: 0,
    itemsFailed: 0,
    errors: [],
    durationMs: 0,
  };

  logger.info("Starting migration run", {
    tables: config.tables,
    targetVersion,
    direction,
    currentSchemaVersion: CURRENT_SCHEMA_VERSION,
  });

  for (const table of config.tables) {
    logger.info(`Processing table: ${table}`);
    result.tablesProcessed++;

    let items: Record<string, unknown>[];
    try {
      items = await config.dynamoAdapter.scanAll(table);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to scan table: ${table}`, { error: message });
      result.errors.push({
        table,
        itemId: "*",
        fromVersion: 0,
        toVersion: targetVersion,
        error: `Scan failed: ${message}`,
      });
      result.success = false;
      continue;
    }

    logger.info(`Found ${items.length} items in ${table}`);

    // Process items in batches
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const progress = Math.round(((i + batch.length) / items.length) * 100);
      logger.info(`Processing batch — ${progress}% complete`, { table, processed: i + batch.length, total: items.length });

      const writePromises = batch.map(async (item) => {
        result.itemsProcessed++;
        const itemId = typeof item["id"] === "string" ? item["id"] : "unknown";
        const currentVersion = typeof item["_schemaVersion"] === "number" ? item["_schemaVersion"] : 0;

        // Determine migrations needed
        const migrations =
          direction === "up"
            ? getMigrationsInRange(currentVersion, targetVersion)
            : getRollbackMigrations(currentVersion, targetVersion);

        if (migrations.length === 0) {
          result.itemsSkipped++;
          return;
        }

        try {
          const migrated = applyMigrations(item, migrations, direction);
          migrated["_schemaVersion"] = targetVersion;
          await config.dynamoAdapter.putItem(table, migrated);
          result.itemsMigrated++;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          logger.error(`Failed to migrate item ${itemId}`, {
            table,
            itemId,
            fromVersion: currentVersion,
            targetVersion,
            error: message,
          });
          result.itemsFailed++;
          result.success = false;
          result.errors.push({
            table,
            itemId,
            fromVersion: currentVersion,
            toVersion: targetVersion,
            error: message,
          });
        }
      });

      await Promise.all(writePromises);
    }
  }

  result.durationMs = Date.now() - startTime;
  logger.info("Migration run complete", {
    success: result.success,
    itemsMigrated: result.itemsMigrated,
    itemsSkipped: result.itemsSkipped,
    itemsFailed: result.itemsFailed,
    durationMs: result.durationMs,
  });

  return result;
}

// =============================================================================
// Lambda Handler
// =============================================================================

export interface MigrationEvent {
  tables: string[];
  targetVersion?: number;
  direction?: "up" | "down";
  batchSize?: number;
}

/**
 * Lambda entry point. The actual DynamoDB adapter must be injected at
 * deployment time — this module provides the logic, not the AWS SDK wiring.
 *
 * Example deployment:
 * ```ts
 * import { handler } from './runner';
 * import { createDynamoAdapter } from './dynamo-adapter'; // your impl
 * export const lambdaHandler = (event) => handler(event, createDynamoAdapter());
 * ```
 */
export async function handler(
  event: MigrationEvent,
  dynamoAdapter: DynamoAdapter,
): Promise<MigrationResult> {
  return runMigrations({
    tables: event.tables,
    targetVersion: event.targetVersion,
    direction: event.direction,
    batchSize: event.batchSize,
    dynamoAdapter,
  });
}
