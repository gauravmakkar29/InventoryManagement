/** Barrel for the checklist primitive (Story 28.2). */

export type {
  ChecklistSchema,
  ChecklistSlot,
  ChecklistState,
  Completeness,
  SlotState,
} from "./checklist-schema";
export { evaluateCompleteness } from "./completeness-engine";
export type { IChecklistStore } from "./checklist-store.interface";
export { createMockChecklistStore } from "./mock-checklist-store";
export type { MockChecklistStoreOptions } from "./mock-checklist-store";
export {
  ChecklistIncompleteError,
  ChecklistSchemaNotFoundError,
  ChecklistValidationError,
} from "./checklist-errors";
export { ChecklistProvider, useChecklist } from "./use-checklist";
export type { ChecklistProviderProps, UseChecklistResult } from "./use-checklist";
