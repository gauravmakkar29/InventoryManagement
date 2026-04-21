/** Barrel for the approval primitive (Story 28.3). */

export type {
  Approval,
  ApprovalState,
  SlaCondition,
  TransitionInput,
} from "./approval-state-machine";
export {
  ApprovalReasonError,
  ApprovalTransitionError,
  approvalTransitionTable,
  isTransitionAllowed,
  newPendingApproval,
  transition,
} from "./approval-state-machine";
export type { DecideInput, IApprovalEngine } from "./approval-engine.interface";
export { createMockApprovalEngine } from "./mock-approval-engine";
export type { MockApprovalEngineOptions } from "./mock-approval-engine";
export {
  ApprovalNotFoundError,
  ChecklistIncompleteForApprovalError,
  NoConditionalWaiverError,
  SelfApprovalError,
} from "./approval-errors";
export { ApprovalProvider, useApproval } from "./use-approval";
export type { ApprovalProviderProps, UseApprovalResult } from "./use-approval";
