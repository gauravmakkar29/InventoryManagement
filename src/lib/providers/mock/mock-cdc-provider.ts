import type { ICDCProvider, CDCEvent, CDCChangeStats, CDCAction } from "../types";

// =============================================================================
// Internal helpers
// =============================================================================

/** Generate a UUID, falling back to a basic random ID when crypto is unavailable. */
function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

const ENTITY_TYPES = ["device", "firmware", "compliance", "deployment", "customer"] as const;

const MOCK_USERS = [
  "admin@ims.local",
  "firmware-mgr@ims.local",
  "compliance-officer@ims.local",
  "ops-lead@ims.local",
  "auditor@ims.local",
];

/** Weighted action distribution: updates are far more common than creates/deletes. */
function randomAction(): CDCAction {
  const roll = Math.random();
  if (roll < 0.2) return "create";
  if (roll < 0.9) return "update";
  return "delete";
}

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Build a single mock CDC event. */
function buildMockEvent(entityType: string, action?: CDCAction): CDCEvent {
  const chosenAction = action ?? randomAction();
  const entityId = `${entityType}-${generateId().slice(0, 8)}`;

  const oldValue =
    chosenAction === "create"
      ? null
      : { status: "active", version: randomInt(1, 10), name: `${entityType}-old` };

  const newValue =
    chosenAction === "delete"
      ? null
      : { status: "active", version: randomInt(1, 10), name: `${entityType}-new` };

  return {
    id: generateId(),
    entityType,
    entityId,
    action: chosenAction,
    oldValue,
    newValue,
    changedBy: randomItem(MOCK_USERS),
    timestamp: new Date().toISOString(),
  };
}

/** Build a historical event with a past timestamp. */
function buildHistoricalEvent(entityType: string, entityId: string, minutesAgo: number): CDCEvent {
  const event = buildMockEvent(entityType);
  const pastDate = new Date(Date.now() - minutesAgo * 60_000);
  return {
    ...event,
    entityId,
    timestamp: pastDate.toISOString(),
  };
}

// =============================================================================
// Subscription state (internal, per-provider instance)
// =============================================================================

interface ActiveSubscription {
  id: string;
  entityType: string;
  callback: (event: CDCEvent) => void;
  intervalId: ReturnType<typeof setInterval>;
  createdAt: string;
}

// =============================================================================
// Factory
// =============================================================================

/**
 * Create a mock CDC provider for local development.
 *
 * Simulates real-time CDC events via intervals and returns deterministic
 * historical data. All subscriptions are tracked internally; calling
 * `unsubscribe` clears the interval to prevent memory leaks.
 *
 * @example
 * ```ts
 * import { createMockCDCProvider } from "./mock-cdc-provider";
 * const cdc = createMockCDCProvider();
 * const sub = await cdc.subscribe("device", (evt) => console.log(evt));
 * await cdc.unsubscribe(sub.id);
 * ```
 */
export function createMockCDCProvider(): ICDCProvider {
  const subscriptions = new Map<string, ActiveSubscription>();

  return {
    async subscribe(entityType, callback) {
      const id = generateId();
      const createdAt = new Date().toISOString();

      // Fire mock events at random 3-5 second intervals
      const intervalId = setInterval(
        () => {
          const event = buildMockEvent(entityType);
          callback(event);
        },
        randomInt(3000, 5000),
      );

      const sub: ActiveSubscription = {
        id,
        entityType,
        callback,
        intervalId,
        createdAt,
      };
      subscriptions.set(id, sub);

      return { id, entityType, createdAt };
    },

    async unsubscribe(subscriptionId) {
      const sub = subscriptions.get(subscriptionId);
      if (sub) {
        clearInterval(sub.intervalId);
        subscriptions.delete(subscriptionId);
      }
    },

    async getChangeHistory(entityId, _timeRange) {
      // Generate 10-20 historical events spread over the past 48 hours
      const count = randomInt(10, 20);
      const events: CDCEvent[] = [];
      const entityType = entityId.split("-")[0] || "device";

      for (let i = 0; i < count; i++) {
        const minutesAgo = randomInt(5, 2880); // up to 48 hours
        events.push(buildHistoricalEvent(entityType, entityId, minutesAgo));
      }

      // Sort newest first
      return events.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
    },

    async listRecentChanges(entityType, limit) {
      const cap = limit ?? 20;
      const events: CDCEvent[] = [];

      for (let i = 0; i < cap; i++) {
        const minutesAgo = randomInt(1, 120); // last 2 hours
        const event = buildMockEvent(entityType);
        const pastDate = new Date(Date.now() - minutesAgo * 60_000);
        events.push({ ...event, timestamp: pastDate.toISOString() });
      }

      return events.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
    },

    async getChangeStats(_timeRange) {
      const creates = randomInt(20, 80);
      const updates = randomInt(150, 500);
      const deletes = randomInt(5, 30);

      return {
        totalChanges: creates + updates + deletes,
        creates,
        updates,
        deletes,
        topEntities: ENTITY_TYPES.map((et) => ({
          entityType: et,
          count: randomInt(10, 200),
        })).sort((a, b) => b.count - a.count),
      } satisfies CDCChangeStats;
    },
  };
}
