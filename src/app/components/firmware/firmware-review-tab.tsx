/**
 * <FirmwareReviewTab /> — reference wiring for Epic 28 approval + SLA
 * primitives on the firmware review flow (behind `VITE_FEATURE_COMPLIANCE_LIB`).
 *
 * Composition:
 * - `<ApprovalGateBadge>` — current approval state pill
 * - `<ApprovalDecisionPanel>` — reviewer actions (Approve / Conditional /
 *   Reject); buttons enabled only when the current checklist completeness
 *   + approval state permit the transition
 * - `<ConditionsPanel>` — SLA condition tracker, shown when the approval
 *   is conditionally-approved
 *
 * Checklist completeness comes from the sibling Artifacts tab (shared
 * `<FirmwareComplianceProvider>`). No IMS/firmware types leak into
 * `src/lib/compliance/**`; the library stays domain-free.
 */

import { useEffect } from "react";

import { ApprovalDecisionPanel } from "@/app/components/compliance/approval-decision-panel";
import { ApprovalGateBadge } from "@/app/components/compliance/approval-gate-badge";
import { ConditionsPanel } from "@/app/components/compliance/conditions-panel";
import { useApproval, useApprovalEngine } from "@/lib/compliance/approval";
import { useChecklist } from "@/lib/compliance/checklist";
import type { Completeness } from "@/lib/compliance/checklist";
import { useAuth } from "@/lib/use-auth";
import { canPerformAction, getPrimaryRole } from "@/lib/rbac";
import { FIRMWARE_INTAKE_SCHEMA_ID } from "@/lib/firmware/firmware-artifact-schema";

export interface FirmwareReviewTabProps {
  readonly firmwareVersionId: string;
}

export function FirmwareReviewTab({ firmwareVersionId }: FirmwareReviewTabProps) {
  const { user } = useAuth();
  const role = getPrimaryRole(user?.groups ?? []);
  const actor = {
    userId: user?.id ?? "anonymous",
    displayName: user?.name ?? user?.email ?? "Anonymous",
  };
  const canDecide = canPerformAction(role, "approval:decide");

  const { completeness } = useChecklist(FIRMWARE_INTAKE_SCHEMA_ID, firmwareVersionId);
  const { approval, create, decide } = useApproval(firmwareVersionId);
  const { engine } = useApprovalEngine();

  // First-time viewers see a pending approval auto-created so the decision
  // panel has something to bind to. This mirrors how a real app would create
  // the approval record at submission time; the check is idempotent at the
  // engine level so repeated renders are safe.
  useEffect(() => {
    if (approval === null) {
      void create();
    }
  }, [approval, create]);

  const effectiveCompleteness: Completeness = completeness ?? {
    kind: "incomplete",
    missing: [],
  };

  const onDecide = async (input: {
    readonly nextState: Exclude<NonNullable<typeof approval>["state"], "pending">;
    readonly reason?: string;
  }) => {
    await decide({
      nextState: input.nextState,
      reason: input.reason,
      completeness: effectiveCompleteness,
    });
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground">
            Review — Firmware {firmwareVersionId}
          </h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Checklist: <CompletenessInline completeness={effectiveCompleteness} />
          </p>
        </div>
        <ApprovalGateBadge approval={approval} />
      </header>

      <ApprovalDecisionPanel
        approval={approval}
        completeness={effectiveCompleteness}
        canDecide={canDecide}
        onDecide={onDecide}
      />

      {approval?.state === "conditionally-approved" && (
        <ConditionsPanel approval={approval} engine={engine} actor={actor} canSatisfy={canDecide} />
      )}
    </div>
  );
}

function CompletenessInline({ completeness }: { readonly completeness: Completeness }) {
  switch (completeness.kind) {
    case "complete":
      return <span className="text-emerald-700">complete</span>;
    case "conditionally-complete":
      return (
        <span className="text-amber-700">
          conditional ({completeness.pendingWaivers.length} waivers pending)
        </span>
      );
    case "incomplete":
      return (
        <span className="text-red-700">
          incomplete ({completeness.missing.length} slots missing)
        </span>
      );
  }
}
