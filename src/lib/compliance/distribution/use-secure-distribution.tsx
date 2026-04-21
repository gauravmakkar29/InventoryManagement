/**
 * React hooks + provider for the secure-distribution primitive (Story 28.5).
 */

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ComplianceActor } from "../types";
import type {
  ISecureDistribution,
  RedeemContext,
  SecureLinkRequest,
} from "./secure-distribution.interface";

interface DistributionCtxValue {
  readonly driver: ISecureDistribution;
  readonly actor: ComplianceActor;
  readonly lastStepUpMfaAt?: string;
}

const DistributionContext = createContext<DistributionCtxValue | null>(null);

export interface SecureDistributionProviderProps {
  readonly driver: ISecureDistribution;
  readonly actor: ComplianceActor;
  readonly lastStepUpMfaAt?: string;
  readonly children: ReactNode;
}

export function SecureDistributionProvider({
  driver,
  actor,
  lastStepUpMfaAt,
  children,
}: SecureDistributionProviderProps) {
  const value = useMemo(
    () => ({ driver, actor, lastStepUpMfaAt }),
    [driver, actor, lastStepUpMfaAt],
  );
  return <DistributionContext.Provider value={value}>{children}</DistributionContext.Provider>;
}

function useCtx(): DistributionCtxValue {
  const ctx = useContext(DistributionContext);
  if (!ctx) throw new Error("useSecureDistribution requires <SecureDistributionProvider>.");
  return ctx;
}

export function useSecureDistribution() {
  const { driver, actor, lastStepUpMfaAt } = useCtx();
  const qc = useQueryClient();

  const listQ = useQuery({
    queryKey: ["compliance", "distribution", "mine", actor.userId],
    queryFn: () => driver.listMyActive(actor.userId),
  });

  const mintM = useMutation({
    mutationFn: (req: SecureLinkRequest) => driver.mintLink(req, actor),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["compliance", "distribution", "mine", actor.userId] }),
  });

  const redeemM = useMutation({
    mutationFn: async (token: string) => {
      const context: RedeemContext = { actor, lastStepUpMfaAt };
      return driver.redeem(token, context);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["compliance", "distribution", "mine", actor.userId] }),
  });

  return {
    mintLink: (req: SecureLinkRequest) => mintM.mutateAsync(req),
    redeem: (token: string) => redeemM.mutateAsync(token),
    myActive: listQ.data ?? [],
    isListLoading: listQ.isLoading,
    isMinting: mintM.isPending,
    isRedeeming: redeemM.isPending,
    mintError: mintM.error as Error | null,
    redeemError: redeemM.error as Error | null,
  };
}
