/**
 * React hooks + provider for the checklist primitive (Story 28.2).
 */

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../query-keys";
import type { ComplianceActor } from "../types";
import type { IChecklistStore } from "./checklist-store.interface";
import type { ChecklistSchema, ChecklistState, Completeness } from "./checklist-schema";
import { evaluateCompleteness } from "./completeness-engine";

interface ChecklistCtxValue {
  readonly store: IChecklistStore;
  readonly actor: ComplianceActor;
}

const ChecklistContext = createContext<ChecklistCtxValue | null>(null);

export interface ChecklistProviderProps {
  readonly store: IChecklistStore;
  readonly actor: ComplianceActor;
  readonly children: ReactNode;
}

export function ChecklistProvider({ store, actor, children }: ChecklistProviderProps) {
  const value = useMemo(() => ({ store, actor }), [store, actor]);
  return <ChecklistContext.Provider value={value}>{children}</ChecklistContext.Provider>;
}

function useCtx(): ChecklistCtxValue {
  const ctx = useContext(ChecklistContext);
  if (!ctx) throw new Error("useChecklist requires <ChecklistProvider>.");
  return ctx;
}

export interface UseChecklistResult {
  readonly schema: ChecklistSchema | undefined;
  readonly state: ChecklistState | undefined;
  readonly completeness: Completeness | undefined;
  readonly isLoading: boolean;
  readonly error: Error | undefined;
  readonly attachSlot: (slotKey: string, evidenceId: string) => Promise<void>;
  readonly waivePermanent: (slotKey: string, reason: string) => Promise<void>;
  readonly waiveConditional: (slotKey: string, reason: string, dueAt: string) => Promise<void>;
  readonly unwaive: (slotKey: string) => Promise<void>;
}

export function useChecklist(schemaId: string, subjectId: string): UseChecklistResult {
  const { store, actor } = useCtx();
  const qc = useQueryClient();

  const schemaQ = useQuery({
    queryKey: queryKeys.compliance.checklist.schema(schemaId),
    queryFn: () => store.loadSchema(schemaId),
    staleTime: Number.POSITIVE_INFINITY,
  });

  const stateQ = useQuery({
    queryKey: queryKeys.compliance.checklist.state(schemaId, subjectId),
    queryFn: () => store.loadState(schemaId, subjectId),
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: queryKeys.compliance.checklist.state(schemaId, subjectId) });

  const attachM = useMutation({
    mutationFn: (args: { slotKey: string; evidenceId: string }) =>
      store.attachSlot(schemaId, subjectId, args.slotKey, args.evidenceId, actor),
    onSuccess: invalidate,
  });
  const waivePM = useMutation({
    mutationFn: (args: { slotKey: string; reason: string }) =>
      store.waivePermanent(schemaId, subjectId, args.slotKey, args.reason, actor),
    onSuccess: invalidate,
  });
  const waiveCM = useMutation({
    mutationFn: (args: { slotKey: string; reason: string; dueAt: string }) =>
      store.waiveConditional(schemaId, subjectId, args.slotKey, args.reason, args.dueAt, actor),
    onSuccess: invalidate,
  });
  const unwaiveM = useMutation({
    mutationFn: (slotKey: string) => store.unwaive(schemaId, subjectId, slotKey, actor),
    onSuccess: invalidate,
  });

  const completeness = useMemo<Completeness | undefined>(() => {
    if (!schemaQ.data || !stateQ.data) return undefined;
    return evaluateCompleteness(schemaQ.data, stateQ.data);
  }, [schemaQ.data, stateQ.data]);

  return {
    schema: schemaQ.data,
    state: stateQ.data,
    completeness,
    isLoading: schemaQ.isLoading || stateQ.isLoading,
    error: (schemaQ.error ?? stateQ.error) as Error | undefined,
    attachSlot: async (slotKey, evidenceId) => {
      await attachM.mutateAsync({ slotKey, evidenceId });
    },
    waivePermanent: async (slotKey, reason) => {
      await waivePM.mutateAsync({ slotKey, reason });
    },
    waiveConditional: async (slotKey, reason, dueAt) => {
      await waiveCM.mutateAsync({ slotKey, reason, dueAt });
    },
    unwaive: async (slotKey) => {
      await unwaiveM.mutateAsync(slotKey);
    },
  };
}
