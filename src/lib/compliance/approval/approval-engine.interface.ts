/**
 * Approval engine interface — adapter-pluggable persistence (Story 28.3 AC4).
 */

import type { ComplianceActor } from "../types";
import type { Approval, ApprovalState, SlaCondition } from "./approval-state-machine";
import type { Completeness } from "../checklist";

export interface DecideInput {
  readonly nextState: Exclude<ApprovalState, "pending">;
  readonly reviewer: ComplianceActor;
  readonly reason?: string;
  readonly conditions?: readonly SlaCondition[];
}

export interface IApprovalEngine {
  create(subjectId: string, submittedBy: ComplianceActor): Promise<Approval>;
  loadBySubject(subjectId: string): Promise<Approval | null>;
  decide(
    id: string,
    input: DecideInput,
    context: { readonly completeness: Completeness },
  ): Promise<Approval>;
  resubmit(id: string, resubmittedBy: ComplianceActor): Promise<Approval>;
  listPending(filter: { readonly limit?: number }): Promise<readonly Approval[]>;
  /**
   * Story 28.4 — SLA tracking.
   * Mark a conditional-approval condition as satisfied. Requires
   * `canPerformAction(role, "approval:decide")`. Writes an AUDIT# record.
   */
  markConditionSatisfied(
    approvalId: string,
    conditionId: string,
    reason: string,
    actor: ComplianceActor,
  ): Promise<Approval>;
  /**
   * Re-evaluate condition states against the current clock, write audit
   * records for any pending→breached transitions (idempotent — a breached
   * condition is audited exactly once, subsequent reads are no-ops), and
   * return the refreshed Approval.
   */
  refreshSlaStatus(approvalId: string): Promise<Approval>;
}
