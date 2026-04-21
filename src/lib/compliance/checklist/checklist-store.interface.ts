/**
 * Checklist store interface — adapter-pluggable persistence for schemas and
 * states. Story 28.2 AC4. Every write method is RBAC-gated server-side and
 * writes an AUDIT# record with the prior/new state.
 */

import type { ComplianceActor } from "../types";
import type { ChecklistSchema, ChecklistState, SlotState } from "./checklist-schema";

export interface IChecklistStore {
  loadSchema(schemaId: string): Promise<ChecklistSchema>;
  loadState(schemaId: string, subjectId: string): Promise<ChecklistState>;
  attachSlot(
    schemaId: string,
    subjectId: string,
    slotKey: string,
    evidenceId: string,
    actor: ComplianceActor,
  ): Promise<SlotState>;
  waivePermanent(
    schemaId: string,
    subjectId: string,
    slotKey: string,
    reason: string,
    actor: ComplianceActor,
  ): Promise<SlotState>;
  waiveConditional(
    schemaId: string,
    subjectId: string,
    slotKey: string,
    reason: string,
    dueAt: string,
    actor: ComplianceActor,
  ): Promise<SlotState>;
  unwaive(
    schemaId: string,
    subjectId: string,
    slotKey: string,
    actor: ComplianceActor,
  ): Promise<SlotState>;
  /**
   * Register a schema — schemas are code-defined (no dynamic editor) so
   * this is usually called once at app boot.
   */
  registerSchema(schema: ChecklistSchema): void;
}
