/**
 * <FirmwareComplianceProvider /> — reference-implementation wrapper that
 * wires the Epic 28 compliance primitives (evidence, checklist, approval,
 * secure distribution) into the firmware flow with shared state across
 * tabs.
 *
 * Lifting the stores here (instead of per-tab) lets the Artifacts tab's
 * checklist completeness drive the Review tab's approval-decision logic
 * without duplicate state. When the codebase eventually replaces the mock
 * adapters with real AWS SDK-backed drivers, this is the single file that
 * needs to swap out.
 *
 * Gated by `VITE_FEATURE_COMPLIANCE_LIB` at the consumer side; this
 * component itself is unconditional and can be rendered anywhere.
 */

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";

import { firmwareIntakeChecklistSchema } from "@/lib/firmware/firmware-artifact-schema";
import {
  FIRMWARE_DEPLOYMENT_KIND,
  firmwareDeploymentValidator,
} from "@/lib/firmware/firmware-deployment-validator";
import { ApprovalProvider, createMockApprovalEngine } from "@/lib/compliance/approval";
import { ChecklistProvider, createMockChecklistStore } from "@/lib/compliance/checklist";
import {
  createMockConfirmationEngine,
  type IConfirmationEngine,
} from "@/lib/compliance/confirmation";
import {
  SecureDistributionProvider,
  createMockSecureDistribution,
  type ISecureDistribution,
} from "@/lib/compliance/distribution";
import { EvidenceStoreProvider, createMockEvidenceStore } from "@/lib/compliance/evidence";
import type { ComplianceActor } from "@/lib/compliance/types";
import type { Role } from "@/lib/rbac";

export interface FirmwareComplianceProviderProps {
  readonly actor: ComplianceActor;
  readonly role: Role;
  readonly children: ReactNode;
}

interface FirmwareComplianceCtx {
  readonly distribution: ISecureDistribution;
  readonly confirmation: IConfirmationEngine;
}

const FirmwareComplianceContext = createContext<FirmwareComplianceCtx | null>(null);

function useComplianceCtx(): FirmwareComplianceCtx {
  const ctx = useContext(FirmwareComplianceContext);
  if (!ctx) {
    throw new Error(
      "Firmware compliance hooks require <FirmwareComplianceProvider> higher in the tree.",
    );
  }
  return ctx;
}

/**
 * Access the mock secure-distribution driver used inside the firmware
 * compliance scope. Exposed so reference components (e.g., `<SecureDownloadButton>`
 * placements) can pass the concrete driver without re-instantiating a new
 * mock that would have its own disconnected jti / consumed-token state.
 */
export function useFirmwareDistributionDriver(): ISecureDistribution {
  return useComplianceCtx().distribution;
}

/**
 * Access the mock two-phase confirmation engine used inside the firmware
 * compliance scope. The firmware deployment validator is pre-registered
 * under kind `"firmware-deployment"` at provider construction time.
 */
export function useFirmwareConfirmationEngine(): IConfirmationEngine {
  return useComplianceCtx().confirmation;
}

export function FirmwareComplianceProvider({
  actor,
  role,
  children,
}: FirmwareComplianceProviderProps) {
  const stores = useMemo(() => {
    const resolveRole = () => role;
    const confirmation = createMockConfirmationEngine({ resolveRole });
    // Register the domain-specific validator once per provider instance.
    // The compliance library stays generic; the validator lives here.
    confirmation.validators.register(FIRMWARE_DEPLOYMENT_KIND, firmwareDeploymentValidator);
    return {
      evidenceStore: createMockEvidenceStore({ resolveRole }),
      checklistStore: createMockChecklistStore({
        resolveRole,
        seedSchemas: [firmwareIntakeChecklistSchema],
      }),
      approvalEngine: createMockApprovalEngine({ resolveRole }),
      distribution: createMockSecureDistribution({ resolveRole }),
      confirmation,
    };
  }, [role]);

  const ctxValue = useMemo<FirmwareComplianceCtx>(
    () => ({
      distribution: stores.distribution,
      confirmation: stores.confirmation,
    }),
    [stores.distribution, stores.confirmation],
  );

  return (
    <EvidenceStoreProvider store={stores.evidenceStore} actor={actor}>
      <ChecklistProvider store={stores.checklistStore} actor={actor}>
        <ApprovalProvider engine={stores.approvalEngine} actor={actor}>
          <SecureDistributionProvider driver={stores.distribution} actor={actor}>
            <FirmwareComplianceContext.Provider value={ctxValue}>
              {children}
            </FirmwareComplianceContext.Provider>
          </SecureDistributionProvider>
        </ApprovalProvider>
      </ChecklistProvider>
    </EvidenceStoreProvider>
  );
}
