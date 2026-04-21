/**
 * <FirmwareComplianceProvider /> — reference-implementation wrapper that
 * wires the Epic 28 compliance primitives (evidence, checklist, approval)
 * into the firmware flow with shared state across tabs.
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

import { useMemo } from "react";
import type { ReactNode } from "react";

import { firmwareIntakeChecklistSchema } from "@/lib/firmware/firmware-artifact-schema";
import { ApprovalProvider, createMockApprovalEngine } from "@/lib/compliance/approval";
import { ChecklistProvider, createMockChecklistStore } from "@/lib/compliance/checklist";
import { EvidenceStoreProvider, createMockEvidenceStore } from "@/lib/compliance/evidence";
import type { ComplianceActor } from "@/lib/compliance/types";
import type { Role } from "@/lib/rbac";

export interface FirmwareComplianceProviderProps {
  readonly actor: ComplianceActor;
  readonly role: Role;
  readonly children: ReactNode;
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
    };
  }, [role]);

  return (
    <EvidenceStoreProvider store={stores.evidenceStore} actor={actor}>
      <ChecklistProvider store={stores.checklistStore} actor={actor}>
        <ApprovalProvider engine={stores.approvalEngine} actor={actor}>
          {children}
        </ApprovalProvider>
      </ChecklistProvider>
    </EvidenceStoreProvider>
  );
}
