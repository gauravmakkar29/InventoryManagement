/** Barrel for the inverse-dependency / impact-query primitive (Story 28.7). */

export type {
  BindingUpsertInput,
  Consumer,
  IDependencyGraph,
  ListConsumersOptions,
  ListConsumersResult,
  VersionInUse,
} from "./dependency-graph.interface";
export { createMockDependencyGraph } from "./mock-dependency-graph";
export type { MockDependencyGraphOptions } from "./mock-dependency-graph";
export { listAllConsumers, useInverseDependency, useVersionsInUse } from "./use-inverse-dependency";
