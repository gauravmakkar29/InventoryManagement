/**
 * In-memory mock `IDependencyGraph` (Story 28.7).
 *
 * Idempotent upsert keyed on (consumerId, resourceId). Cursor pagination
 * via a deterministic ordinal. Every query writes an AUDIT# record
 * (NIST AU-12 — information-flow monitoring).
 */

import { AccessDeniedError, type ComplianceActor } from "../types";
import { canPerformAction, type Role } from "../../rbac";
import { logAudit } from "../../audit/log-audit";
import type {
  BindingUpsertInput,
  Consumer,
  IDependencyGraph,
  ListConsumersOptions,
  ListConsumersResult,
  VersionInUse,
} from "./dependency-graph.interface";

export interface MockDependencyGraphOptions {
  readonly resolveRole?: (actor: ComplianceActor) => Role;
  readonly now?: () => Date;
  readonly defaultLimit?: number;
  readonly maxLimit?: number;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

function keyFor(consumerId: string, resourceId: string): string {
  return `${consumerId}|${resourceId}`;
}

function matchesScope(consumer: Consumer, scope?: readonly string[]): boolean {
  if (!scope || scope.length === 0) return true;
  return scope.some((s) => consumer.scope.includes(s));
}

function matchesState(consumer: Consumer, state?: readonly string[]): boolean {
  if (!state || state.length === 0) return true;
  return state.includes(consumer.state);
}

export function createMockDependencyGraph(
  options: MockDependencyGraphOptions = {},
): IDependencyGraph {
  const resolveRole = options.resolveRole ?? (() => "Admin" as Role);
  const now = options.now ?? (() => new Date());
  const defaultLimit = options.defaultLimit ?? DEFAULT_LIMIT;
  const maxLimit = options.maxLimit ?? MAX_LIMIT;

  const bindings = new Map<string, Consumer>();

  function authorize(actor: ComplianceActor, action: "impact:query"): void {
    const role = resolveRole(actor);
    if (!canPerformAction(role, action)) {
      logAudit({
        action: `compliance.${action}`,
        resourceType: "DependencyGraph",
        resourceId: "-",
        actor,
        outcome: "denied",
        reason: `role ${role} lacks ${action}`,
      });
      throw new AccessDeniedError(action, actor.userId);
    }
  }

  function validateLimit(limit: number | undefined): number {
    const v = limit ?? defaultLimit;
    if (v < 1 || v > maxLimit) {
      throw new Error(`limit must be 1-${maxLimit} (got ${v})`);
    }
    return v;
  }

  return {
    async upsertBinding<TMeta>(input: BindingUpsertInput<TMeta>): Promise<Consumer<TMeta>> {
      // NOTE: upsert is performed by a trusted caller (e.g., the
      // confirmation engine's `complete` handler). The gate is on the
      // call site, not here, so downstream wiring remains flexible.
      const next: Consumer<TMeta> = {
        consumerId: input.consumerId,
        consumerType: input.consumerType,
        resourceId: input.resourceId,
        version: input.version,
        scope: [...input.scope],
        state: input.state,
        meta: input.meta,
        updatedAt: now().toISOString(),
      };
      bindings.set(keyFor(input.consumerId, input.resourceId), next as unknown as Consumer);
      return next;
    },

    async removeBinding(consumerId, resourceId, actor) {
      authorize(actor, "impact:query");
      bindings.delete(keyFor(consumerId, resourceId));
      logAudit({
        action: "compliance.impact.unbind",
        resourceType: "DependencyGraph",
        resourceId: keyFor(consumerId, resourceId),
        actor,
        outcome: "success",
      });
    },

    async listConsumers<TMeta>(
      resourceId: string,
      version: string,
      options: ListConsumersOptions,
      actor: ComplianceActor,
    ): Promise<ListConsumersResult<TMeta>> {
      authorize(actor, "impact:query");
      const limit = validateLimit(options.limit);

      const matching = [...bindings.values()]
        .filter((c) => c.resourceId === resourceId && c.version === version)
        .filter((c) => matchesScope(c, options.scope))
        .filter((c) => matchesState(c, options.state))
        .sort((a, b) => a.consumerId.localeCompare(b.consumerId));

      const offset = options.cursor ? parseInt(options.cursor, 10) : 0;
      const page = matching.slice(offset, offset + limit);
      const nextOffset = offset + limit;
      const nextCursor = nextOffset < matching.length ? String(nextOffset) : null;

      logAudit({
        action: "compliance.impact.query",
        resourceType: "DependencyGraph",
        resourceId: `${resourceId}:${version}`,
        actor,
        outcome: "success",
        context: {
          resultCount: page.length,
          totalCount: matching.length,
          scope: options.scope,
          state: options.state,
        },
      });

      return {
        items: page as readonly Consumer<TMeta>[],
        nextCursor,
      };
    },

    async listVersionsInUse(resourceId, options, actor): Promise<readonly VersionInUse[]> {
      authorize(actor, "impact:query");
      const counts = new Map<string, number>();
      for (const c of bindings.values()) {
        if (c.resourceId !== resourceId) continue;
        if (!matchesScope(c, options.scope)) continue;
        if (!matchesState(c, options.state)) continue;
        counts.set(c.version, (counts.get(c.version) ?? 0) + 1);
      }
      const items: VersionInUse[] = [...counts.entries()]
        .map(([version, consumerCount]) => ({ version, consumerCount }))
        .sort((a, b) => b.consumerCount - a.consumerCount);

      logAudit({
        action: "compliance.impact.versionsInUse",
        resourceType: "DependencyGraph",
        resourceId,
        actor,
        outcome: "success",
        context: { count: items.length },
      });

      return items;
    },
  };
}
