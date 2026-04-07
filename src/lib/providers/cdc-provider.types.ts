// Platform Config
// =============================================================================

// =============================================================================
// CDC (Change Data Capture) Provider
// =============================================================================

/** Supported CDC mutation actions. */
export type CDCAction = "create" | "update" | "delete";

/** A single CDC event representing one data mutation. */
export interface CDCEvent {
  id: string;
  entityType: string;
  entityId: string;
  action: CDCAction;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  changedBy: string;
  timestamp: string;
}

/** Handle returned when subscribing to a CDC stream. */
export interface CDCSubscription {
  id: string;
  entityType: string;
  createdAt: string;
}

/** Aggregated change statistics over a time range. */
export interface CDCChangeStats {
  totalChanges: number;
  creates: number;
  updates: number;
  deletes: number;
  topEntities: Array<{ entityType: string; count: number }>;
}

/** Configuration for a CDC provider adapter. */
export interface CDCProviderConfig {
  readonly realtimeEndpoint?: string;
  readonly pollIntervalMs?: number;
  readonly timeout?: number;
}

/**
 * Change Data Capture provider interface — abstracts event streaming for audit.
 *
 * Adapters handle source-specific logic (DynamoDB Streams, Kinesis, EventBridge, Kafka).
 * The app consumes this interface for real-time updates and audit history.
 *
 * **NIST AU-2/AU-3:** Every data mutation must be captured as a CDC event.
 */
export interface ICDCProvider {
  /**
   * Subscribe to real-time change events for a given entity type.
   *
   * @param entityType - The entity type to watch (e.g. "device", "firmware").
   * @param callback - Invoked for each incoming CDC event.
   * @returns A subscription handle used to unsubscribe later.
   *
   * @example
   * ```ts
   * const sub = await cdcProvider.subscribe("device", (event) => {
   *   console.log(`Device ${event.entityId} was ${event.action}d`);
   * });
   * // Later: await cdcProvider.unsubscribe(sub.id);
   * ```
   */
  subscribe(entityType: string, callback: (event: CDCEvent) => void): Promise<CDCSubscription>;

  /**
   * Cancel an active subscription and release resources.
   *
   * @param subscriptionId - The ID from the CDCSubscription handle.
   *
   * @example
   * ```ts
   * await cdcProvider.unsubscribe(sub.id);
   * ```
   */
  unsubscribe(subscriptionId: string): Promise<void>;

  /**
   * Retrieve the change history for a specific entity.
   *
   * @param entityId - The entity whose history to fetch.
   * @param timeRange - Optional start/end ISO-8601 bounds.
   * @returns Ordered list of CDC events (newest first).
   *
   * @example
   * ```ts
   * const history = await cdcProvider.getChangeHistory("dev-001", {
   *   start: "2026-01-01T00:00:00Z",
   *   end: "2026-03-31T23:59:59Z",
   * });
   * ```
   */
  getChangeHistory(
    entityId: string,
    timeRange?: { start: string; end: string },
  ): Promise<CDCEvent[]>;

  /**
   * List the most recent changes for an entity type.
   *
   * @param entityType - Filter by entity type (e.g. "firmware").
   * @param limit - Maximum events to return (default: 20).
   * @returns Ordered list of CDC events (newest first).
   *
   * @example
   * ```ts
   * const recent = await cdcProvider.listRecentChanges("firmware", 10);
   * ```
   */
  listRecentChanges(entityType: string, limit?: number): Promise<CDCEvent[]>;

  /**
   * Get aggregated change statistics across all entity types.
   *
   * @param timeRange - Optional start/end ISO-8601 bounds.
   * @returns Aggregated counts by action and top entities.
   *
   * @example
   * ```ts
   * const stats = await cdcProvider.getChangeStats();
   * // stats.totalChanges, stats.topEntities
   * ```
   */
  getChangeStats(timeRange?: { start: string; end: string }): Promise<CDCChangeStats>;
}
