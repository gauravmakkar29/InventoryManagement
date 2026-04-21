/**
 * Inverse dependency query — version-first "blast radius" lookup
 * (Story 28.7). Given `(resourceId, version)`, return all consumers
 * currently bound to that version with their scope, state, and metadata.
 *
 * Generic `Consumer<TMeta>` — the primitive knows nothing about devices,
 * tenants, or services. Callers parameterize with their own metadata shape.
 *
 * NIST controls: AU-12 (information-flow monitoring via query audit logs),
 * AC-3 (read gated by canPerformAction), SI-10 (filter parameters
 * validated at adapter boundary).
 */

import type { ComplianceActor } from "../types";

export interface Consumer<TMeta = unknown> {
  readonly consumerId: string;
  readonly consumerType: string;
  readonly resourceId: string;
  readonly version: string;
  readonly scope: readonly string[];
  readonly state: string;
  readonly meta: TMeta;
  readonly updatedAt: string;
}

export interface BindingUpsertInput<TMeta = unknown> {
  readonly consumerId: string;
  readonly consumerType: string;
  readonly resourceId: string;
  readonly version: string;
  readonly scope: readonly string[];
  readonly state: string;
  readonly meta: TMeta;
  readonly actor: ComplianceActor;
}

export interface ListConsumersOptions {
  readonly scope?: readonly string[];
  readonly state?: readonly string[];
  readonly cursor?: string;
  readonly limit?: number;
}

export interface ListConsumersResult<TMeta = unknown> {
  readonly items: readonly Consumer<TMeta>[];
  readonly nextCursor: string | null;
}

export interface VersionInUse {
  readonly version: string;
  readonly consumerCount: number;
}

export interface IDependencyGraph {
  listConsumers<TMeta>(
    resourceId: string,
    version: string,
    options: ListConsumersOptions,
    actor: ComplianceActor,
  ): Promise<ListConsumersResult<TMeta>>;
  listVersionsInUse(
    resourceId: string,
    options: ListConsumersOptions,
    actor: ComplianceActor,
  ): Promise<readonly VersionInUse[]>;
  upsertBinding<TMeta>(input: BindingUpsertInput<TMeta>): Promise<Consumer<TMeta>>;
  removeBinding(consumerId: string, resourceId: string, actor: ComplianceActor): Promise<void>;
}
