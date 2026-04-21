/**
 * React hooks + provider for the approval primitive (Story 28.3).
 */

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../query-keys";
import type { ComplianceActor } from "../types";
import type { IApprovalEngine } from "./approval-engine.interface";
import type { Approval, ApprovalState, SlaCondition } from "./approval-state-machine";
import type { Completeness } from "../checklist";

interface ApprovalCtxValue {
  readonly engine: IApprovalEngine;
  readonly actor: ComplianceActor;
}

const ApprovalContext = createContext<ApprovalCtxValue | null>(null);

export interface ApprovalProviderProps {
  readonly engine: IApprovalEngine;
  readonly actor: ComplianceActor;
  readonly children: ReactNode;
}

export function ApprovalProvider({ engine, actor, children }: ApprovalProviderProps) {
  const value = useMemo(() => ({ engine, actor }), [engine, actor]);
  return <ApprovalContext.Provider value={value}>{children}</ApprovalContext.Provider>;
}

function useCtx(): ApprovalCtxValue {
  const ctx = useContext(ApprovalContext);
  if (!ctx) throw new Error("useApproval requires <ApprovalProvider>.");
  return ctx;
}

/**
 * Access the underlying `IApprovalEngine` and current actor from the
 * surrounding `<ApprovalProvider>`.
 *
 * Use this only when you need to pass the engine into a component that
 * expects it as a prop (e.g., `<ConditionsPanel>`). Prefer `useApproval`
 * for the hook-based API.
 */
export function useApprovalEngine(): ApprovalCtxValue {
  return useCtx();
}

export interface UseApprovalResult {
  readonly approval: Approval | null | undefined;
  readonly isLoading: boolean;
  readonly error: Error | undefined;
  readonly create: () => Promise<Approval>;
  readonly decide: (input: {
    readonly nextState: Exclude<ApprovalState, "pending">;
    readonly reason?: string;
    readonly conditions?: readonly SlaCondition[];
    readonly completeness: Completeness;
  }) => Promise<Approval>;
  readonly resubmit: () => Promise<Approval>;
}

export function useApproval(subjectId: string): UseApprovalResult {
  const { engine, actor } = useCtx();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: queryKeys.compliance.approval.bySubject(subjectId),
    queryFn: () => engine.loadBySubject(subjectId),
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: queryKeys.compliance.approval.bySubject(subjectId) });

  const createM = useMutation({
    mutationFn: () => engine.create(subjectId, actor),
    onSuccess: invalidate,
  });

  const decideM = useMutation({
    mutationFn: async (input: {
      readonly nextState: Exclude<ApprovalState, "pending">;
      readonly reason?: string;
      readonly conditions?: readonly SlaCondition[];
      readonly completeness: Completeness;
    }) => {
      const appr = q.data;
      if (!appr) throw new Error("No approval loaded for subject");
      return engine.decide(
        appr.id,
        {
          nextState: input.nextState,
          reviewer: actor,
          reason: input.reason,
          conditions: input.conditions,
        },
        { completeness: input.completeness },
      );
    },
    onSuccess: invalidate,
  });

  const resubmitM = useMutation({
    mutationFn: async () => {
      const appr = q.data;
      if (!appr) throw new Error("No approval loaded for subject");
      return engine.resubmit(appr.id, actor);
    },
    onSuccess: invalidate,
  });

  return {
    approval: q.data ?? null,
    isLoading: q.isLoading,
    error: q.error as Error | undefined,
    create: () => createM.mutateAsync(),
    decide: (input) => decideM.mutateAsync(input),
    resubmit: () => resubmitM.mutateAsync(),
  };
}
