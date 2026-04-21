/**
 * In-memory mock `IApprovalEngine` (Story 28.3).
 *
 * Enforces:
 * - RBAC via canPerformAction (NIST AC-3)
 * - Separation of duties — reviewer.userId !== submittedBy.userId (NIST AC-5)
 * - Checklist gating — "approved" requires complete; "conditionally-approved"
 *   requires at least one conditional waiver
 *
 * Every transition and every denial writes an AUDIT# record (NIST AU-2/AU-3).
 */

import { AccessDeniedError, type ComplianceActor } from "../types";
import { canPerformAction, type Role } from "../../rbac";
import { logAudit } from "../../audit/log-audit";
import {
  ApprovalTransitionError,
  newPendingApproval,
  transition,
  type Approval,
} from "./approval-state-machine";
import type { IApprovalEngine } from "./approval-engine.interface";
import {
  ApprovalNotFoundError,
  ChecklistIncompleteForApprovalError,
  NoConditionalWaiverError,
  SelfApprovalError,
} from "./approval-errors";

export interface MockApprovalEngineOptions {
  readonly resolveRole?: (actor: ComplianceActor) => Role;
  readonly now?: () => Date;
}

export function createMockApprovalEngine(options: MockApprovalEngineOptions = {}): IApprovalEngine {
  const byId = new Map<string, Approval>();
  const bySubject = new Map<string, string>();
  const resolveRole = options.resolveRole ?? (() => "Admin" as Role);
  const now = options.now ?? (() => new Date());

  function authorize(
    actor: ComplianceActor,
    action: "approval:submit" | "approval:decide",
    subjectId: string,
  ): void {
    const role = resolveRole(actor);
    if (!canPerformAction(role, action)) {
      logAudit({
        action: `compliance.${action}`,
        resourceType: "Approval",
        resourceId: subjectId,
        actor,
        outcome: "denied",
        reason: `role ${role} lacks ${action}`,
      });
      throw new AccessDeniedError(action, actor.userId);
    }
  }

  function mintId(): string {
    return `appr-${Math.random().toString(36).slice(2, 11)}`;
  }

  return {
    async create(subjectId, submittedBy): Promise<Approval> {
      authorize(submittedBy, "approval:submit", subjectId);
      const existingId = bySubject.get(subjectId);
      if (existingId) {
        const existing = byId.get(existingId);
        if (existing) return existing;
      }
      const appr = newPendingApproval({
        id: mintId(),
        subjectId,
        submittedBy,
        at: now().toISOString(),
      });
      byId.set(appr.id, appr);
      bySubject.set(subjectId, appr.id);
      logAudit({
        action: "compliance.approval.create",
        resourceType: "Approval",
        resourceId: appr.id,
        actor: submittedBy,
        outcome: "success",
        context: { subjectId, state: "pending" },
      });
      return appr;
    },

    async loadBySubject(subjectId) {
      const id = bySubject.get(subjectId);
      if (!id) return null;
      return byId.get(id) ?? null;
    },

    async decide(id, input, ctx): Promise<Approval> {
      authorize(input.reviewer, "approval:decide", id);
      const current = byId.get(id);
      if (!current) throw new ApprovalNotFoundError(id);

      if (current.submittedBy.userId === input.reviewer.userId) {
        logAudit({
          action: "compliance.approval.decide",
          resourceType: "Approval",
          resourceId: id,
          actor: input.reviewer,
          outcome: "denied",
          reason: "AC-5: reviewer equals submitter",
        });
        throw new SelfApprovalError(input.reviewer.userId);
      }

      if (input.nextState === "approved" && ctx.completeness.kind === "incomplete") {
        logAudit({
          action: "compliance.approval.decide",
          resourceType: "Approval",
          resourceId: id,
          actor: input.reviewer,
          outcome: "denied",
          reason: "checklist incomplete",
        });
        throw new ChecklistIncompleteForApprovalError(current.subjectId);
      }
      if (
        input.nextState === "conditionally-approved" &&
        ctx.completeness.kind !== "conditionally-complete"
      ) {
        logAudit({
          action: "compliance.approval.decide",
          resourceType: "Approval",
          resourceId: id,
          actor: input.reviewer,
          outcome: "denied",
          reason: "no conditional waivers",
        });
        throw new NoConditionalWaiverError(current.subjectId);
      }

      let updated: Approval;
      try {
        updated = transition(current, input.nextState, {
          actor: input.reviewer,
          at: now().toISOString(),
          reason: input.reason,
          conditions: input.conditions,
        });
      } catch (e) {
        if (e instanceof ApprovalTransitionError) {
          logAudit({
            action: "compliance.approval.decide",
            resourceType: "Approval",
            resourceId: id,
            actor: input.reviewer,
            outcome: "denied",
            reason: `invalid transition ${e.from} → ${e.to}`,
          });
        }
        throw e;
      }

      byId.set(id, updated);
      logAudit({
        action: "compliance.approval.decide",
        resourceType: "Approval",
        resourceId: id,
        actor: input.reviewer,
        outcome: "success",
        context: {
          subjectId: current.subjectId,
          priorState: current.state,
          nextState: updated.state,
          checklistCompleteness: ctx.completeness.kind,
        },
        reason: input.reason,
      });

      return updated;
    },

    async resubmit(id, resubmittedBy): Promise<Approval> {
      authorize(resubmittedBy, "approval:submit", id);
      const current = byId.get(id);
      if (!current) throw new ApprovalNotFoundError(id);
      const updated = transition(current, "pending", {
        actor: resubmittedBy,
        at: now().toISOString(),
      });
      byId.set(id, updated);
      logAudit({
        action: "compliance.approval.resubmit",
        resourceType: "Approval",
        resourceId: id,
        actor: resubmittedBy,
        outcome: "success",
        context: { subjectId: current.subjectId },
      });
      return updated;
    },

    async listPending({ limit }): Promise<readonly Approval[]> {
      const all = [...byId.values()].filter((a) => a.state === "pending");
      all.sort((a, b) => (a.history[0]?.at ?? "").localeCompare(b.history[0]?.at ?? ""));
      return limit ? all.slice(0, limit) : all;
    },
  };
}
