/**
 * Approval state machine (Story 28.3).
 *
 * Pure module — no I/O, no clock, no globals. The `transition()` function
 * validates every state change against `approvalTransitionTable` and throws
 * `ApprovalTransitionError` for anything not in the table.
 *
 * States:
 * - pending                 → initial and post-resubmit
 * - approved                → terminal (for this subject version)
 * - conditionally-approved  → transient: requires all SLA conditions satisfied
 * - rejected                → transient: caller resubmits → pending
 */

import { ComplianceError } from "../types";
import type { ComplianceActor } from "../types";

export type ApprovalState = "pending" | "approved" | "conditionally-approved" | "rejected";

export interface SlaCondition {
  readonly id: string;
  readonly description: string;
  readonly dueAt: string;
  readonly status: "pending" | "satisfied" | "breached";
}

export interface Approval<TSubjectId extends string = string> {
  readonly id: string;
  readonly subjectId: TSubjectId;
  readonly state: ApprovalState;
  readonly submittedBy: ComplianceActor;
  readonly reviewer: ComplianceActor | null;
  readonly reason: string | null;
  readonly decidedAt: string | null;
  readonly conditions: readonly SlaCondition[];
  readonly history: readonly {
    readonly at: string;
    readonly from: ApprovalState;
    readonly to: ApprovalState;
    readonly actor: ComplianceActor;
    readonly reason: string | null;
  }[];
}

/** Allowed transitions. Every pair in the table is exercised by unit tests. */
export const approvalTransitionTable: ReadonlyArray<{
  readonly from: ApprovalState;
  readonly to: ApprovalState;
}> = [
  { from: "pending", to: "approved" },
  { from: "pending", to: "conditionally-approved" },
  { from: "pending", to: "rejected" },
  { from: "conditionally-approved", to: "approved" },
  { from: "conditionally-approved", to: "rejected" },
  { from: "rejected", to: "pending" },
];

export class ApprovalTransitionError extends ComplianceError {
  public readonly kind = "compliance.approval.invalid-transition";

  public constructor(
    public readonly from: ApprovalState,
    public readonly to: ApprovalState,
  ) {
    super(`Invalid approval transition: ${from} → ${to}`);
  }
}

export class ApprovalReasonError extends ComplianceError {
  public readonly kind = "compliance.approval.reason-required";

  public constructor(message: string) {
    super(message);
  }
}

const MIN_REASON = 10;
const MAX_REASON = 500;

export function isTransitionAllowed(from: ApprovalState, to: ApprovalState): boolean {
  return approvalTransitionTable.some((t) => t.from === from && t.to === to);
}

export interface TransitionInput {
  readonly actor: ComplianceActor;
  readonly at: string;
  readonly reason?: string;
  readonly conditions?: readonly SlaCondition[];
}

export function transition<T extends string>(
  current: Approval<T>,
  next: ApprovalState,
  ctx: TransitionInput,
): Approval<T> {
  if (!isTransitionAllowed(current.state, next)) {
    throw new ApprovalTransitionError(current.state, next);
  }

  if (next === "rejected" || next === "conditionally-approved") {
    const r = ctx.reason ?? "";
    if (r.length < MIN_REASON || r.length > MAX_REASON) {
      throw new ApprovalReasonError(
        `A ${MIN_REASON}-${MAX_REASON} char reason is required for "${next}" (got ${r.length}).`,
      );
    }
  }

  // Transition from conditionally-approved → approved requires all conditions satisfied.
  if (current.state === "conditionally-approved" && next === "approved") {
    const unsatisfied = current.conditions.filter((c) => c.status !== "satisfied");
    if (unsatisfied.length > 0) {
      throw new ApprovalTransitionError(current.state, next);
    }
  }

  const reviewerOnDecide: ComplianceActor | null = next === "pending" ? null : ctx.actor;

  return {
    ...current,
    state: next,
    reviewer: reviewerOnDecide,
    reason: next === "pending" ? null : (ctx.reason ?? null),
    decidedAt: next === "pending" ? null : ctx.at,
    conditions: ctx.conditions ?? current.conditions,
    history: [
      ...current.history,
      {
        at: ctx.at,
        from: current.state,
        to: next,
        actor: ctx.actor,
        reason: ctx.reason ?? null,
      },
    ],
  };
}

export function newPendingApproval<T extends string>(input: {
  readonly id: string;
  readonly subjectId: T;
  readonly submittedBy: ComplianceActor;
  readonly at: string;
}): Approval<T> {
  return {
    id: input.id,
    subjectId: input.subjectId,
    state: "pending",
    submittedBy: input.submittedBy,
    reviewer: null,
    reason: null,
    decidedAt: null,
    conditions: [],
    history: [
      {
        at: input.at,
        from: "pending",
        to: "pending",
        actor: input.submittedBy,
        reason: null,
      },
    ],
  };
}
