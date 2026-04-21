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
import { ApprovalProvider, createMockApprovalEngine } from "@/lib/compliance/approval";
import { ChecklistProvider, createMockChecklistStore } from "@/lib/compliance/checklist";
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

interface DistributionDriverCtx {
  readonly driver: ISecureDistribution;
}

const DistributionDriverContext = createContext<DistributionDriverCtx | null>(null);

/**
 * Access the mock secure-distribution driver used inside the firmware
 * compliance scope. Exposed so reference components (e.g., `<SecureDownloadButton>`
 * placements) can pass the concrete driver without re-instantiating a new
 * mock that would have its own disconnected jti / consumed-token state.
 */
export function useFirmwareDistributionDriver(): ISecureDistribution {
  const ctx = useContext(DistributionDriverContext);
  if (!ctx) {
    throw new Error(
      "useFirmwareDistributionDriver requires <FirmwareComplianceProvider> higher in the tree.",
    );
  }
  return ctx.driver;
}

export function FirmwareComplianceProvider({
  actor,
  role,
  children,
}: FirmwareComplianceProviderProps) {
  const stores = useMemo(() => {
    const resolveRole = () => role;
    return {
      evidenceStore: createMockEvidenceStore({ resolveRole }),
      checklistStore: createMockChecklistStore({
        resolveRole,
        seedSchemas: [firmwareIntakeChecklistSchema],
      }),
      approvalEngine: createMockApprovalEngine({ resolveRole }),
      distribution: createMockSecureDistribution({ resolveRole }),
    };
  }, [role]);

  const distributionCtx = useMemo<DistributionDriverCtx>(
    () => ({ driver: stores.distribution }),
    [stores.distribution],
  );

  return (
    <EvidenceStoreProvider store={stores.evidenceStore} actor={actor}>
      <ChecklistProvider store={stores.checklistStore} actor={actor}>
        <ApprovalProvider engine={stores.approvalEngine} actor={actor}>
          <SecureDistributionProvider driver={stores.distribution} actor={actor}>
            <DistributionDriverContext.Provider value={distributionCtx}>
              {children}
            </DistributionDriverContext.Provider>
          </SecureDistributionProvider>
        </ApprovalProvider>
      </ChecklistProvider>
    </EvidenceStoreProvider>
  );
}
