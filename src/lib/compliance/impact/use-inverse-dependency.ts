/** Hooks for the inverse-dependency primitive (Story 28.7). */

import { useQuery } from "@tanstack/react-query";

import type { ComplianceActor } from "../types";
import type { IDependencyGraph, ListConsumersOptions } from "./dependency-graph.interface";

export function useInverseDependency(params: {
  readonly driver: IDependencyGraph;
  readonly actor: ComplianceActor;
  readonly resourceId: string;
  readonly version: string;
  readonly options: ListConsumersOptions;
  readonly enabled?: boolean;
}) {
  const { driver, actor, resourceId, version, options, enabled = true } = params;
  return useQuery({
    queryKey: [
      "compliance",
      "impact",
      "consumers",
      resourceId,
      version,
      options.scope,
      options.state,
      options.cursor,
      options.limit,
    ],
    queryFn: () => driver.listConsumers(resourceId, version, options, actor),
    enabled: enabled && Boolean(resourceId) && Boolean(version),
  });
}

export function useVersionsInUse(params: {
  readonly driver: IDependencyGraph;
  readonly actor: ComplianceActor;
  readonly resourceId: string;
  readonly options?: ListConsumersOptions;
  readonly enabled?: boolean;
}) {
  const { driver, actor, resourceId, options = {}, enabled = true } = params;
  return useQuery({
    queryKey: ["compliance", "impact", "versionsInUse", resourceId, options.scope, options.state],
    queryFn: () => driver.listVersionsInUse(resourceId, options, actor),
    enabled: enabled && Boolean(resourceId),
  });
}

/**
 * Iterate all pages of a listConsumers query — used by CSV export.
 * Returns every consumer matching the filter without a page ceiling.
 */
export async function listAllConsumers<TMeta>(
  driver: IDependencyGraph,
  actor: ComplianceActor,
  resourceId: string,
  version: string,
  options: ListConsumersOptions,
): Promise<
  ReadonlyArray<Awaited<ReturnType<typeof driver.listConsumers<TMeta>>>["items"][number]>
> {
  const out: Awaited<ReturnType<typeof driver.listConsumers<TMeta>>>["items"][number][] = [];
  let cursor: string | null = options.cursor ?? null;
  const limit = options.limit ?? 100;
  let safetyBudget = 1000;
  do {
    const page = await driver.listConsumers<TMeta>(
      resourceId,
      version,
      { ...options, cursor: cursor ?? undefined, limit },
      actor,
    );
    out.push(...page.items);
    cursor = page.nextCursor;
    safetyBudget -= 1;
    if (safetyBudget <= 0) {
      throw new Error("listAllConsumers: exceeded page-iteration safety budget");
    }
  } while (cursor);
  return out;
}
