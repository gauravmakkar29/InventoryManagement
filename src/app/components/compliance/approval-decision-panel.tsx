/**
 * <ApprovalDecisionPanel /> — reviewer UI for deciding an approval
 * (Story 28.3 AC10-AC12). Renders Approve / Conditional Approve / Reject
 * actions; buttons enabled only when the transition is legal given the
 * current approval state + checklist completeness.
 *
 * Server-side enforcement is the ground truth; client-side disabling is an
 * ergonomic layer (the adapter re-validates every decision).
 */

import { useState } from "react";

import { cn } from "@/lib/utils";
import { ApprovalGateBadge } from "./approval-gate-badge";
import { isTransitionAllowed, type Approval, type ApprovalState } from "@/lib/compliance/approval";
import type { Completeness } from "@/lib/compliance/checklist";

export interface ApprovalDecisionPanelProps {
  readonly approval: Approval | null | undefined;
  readonly completeness: Completeness | undefined;
  readonly canDecide: boolean;
  readonly onDecide: (input: {
    readonly nextState: Exclude<ApprovalState, "pending">;
    readonly reason?: string;
  }) => Promise<void>;
  readonly className?: string;
}

export function ApprovalDecisionPanel({
  approval,
  completeness,
  canDecide,
  onDecide,
  className,
}: ApprovalDecisionPanelProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const state: ApprovalState = approval?.state ?? "pending";
  const canApprove =
    isTransitionAllowed(state, "approved") &&
    (completeness?.kind === "complete" ||
      (state === "conditionally-approved" && completeness?.kind !== "incomplete"));
  const canConditional =
    isTransitionAllowed(state, "conditionally-approved") &&
    completeness?.kind === "conditionally-complete";
  const canReject = isTransitionAllowed(state, "rejected");

  const reasonValid = reason.length >= 10 && reason.length <= 500;

  const decide = async (next: Exclude<ApprovalState, "pending">) => {
    if (!canDecide || submitting) return;
    if ((next === "rejected" || next === "conditionally-approved") && !reasonValid) {
      setErr("A 10-500 character reason is required.");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      await onDecide({ nextState: next, reason: reason || undefined });
      setReason("");
    } catch (e) {
      setErr((e as Error).message ?? "Decision failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={cn("rounded-lg border border-border bg-card", className)}>
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-[14px] font-semibold text-foreground">Approval decision</h3>
        <ApprovalGateBadge approval={approval} />
      </header>

      {canDecide ? (
        <div className="space-y-3 px-4 py-3">
          <div>
            <label
              htmlFor="decision-reason"
              className="mb-1 block text-[12px] font-medium text-foreground"
            >
              Reason (required for reject / conditional)
            </label>
            <textarea
              id="decision-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Why?"
              className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-[12px] text-foreground outline-none focus:border-primary"
            />
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {reason.length}/500 characters
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ActionButton
              disabled={!canApprove || submitting}
              tooltip={canApprove ? undefined : tooltipFor("approve", state, completeness)}
              variant="primary"
              label="Approve"
              onClick={() => void decide("approved")}
            />
            <ActionButton
              disabled={!canConditional || submitting}
              tooltip={canConditional ? undefined : tooltipFor("conditional", state, completeness)}
              variant="amber"
              label="Conditional Approve"
              onClick={() => void decide("conditionally-approved")}
            />
            <ActionButton
              disabled={!canReject || submitting}
              tooltip={canReject ? undefined : tooltipFor("reject", state, completeness)}
              variant="danger"
              label="Reject"
              onClick={() => void decide("rejected")}
            />
          </div>

          {err && (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 p-2 text-[12px] text-red-800"
            >
              {err}
            </p>
          )}
        </div>
      ) : (
        <p className="px-4 py-3 text-[12px] text-muted-foreground">
          You do not have permission to decide this approval.
        </p>
      )}
    </div>
  );
}

type Variant = "primary" | "amber" | "danger";

function ActionButton({
  label,
  onClick,
  disabled,
  tooltip,
  variant,
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled: boolean;
  readonly tooltip: string | undefined;
  readonly variant: Variant;
}) {
  const cls: Record<Variant, string> = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700",
    amber: "bg-amber-600 text-white hover:bg-amber-700",
    danger: "border border-red-300 text-red-700 hover:bg-red-50",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={cn(
        "inline-flex items-center rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        cls[variant],
      )}
    >
      {label}
    </button>
  );
}

function tooltipFor(
  action: "approve" | "conditional" | "reject",
  state: ApprovalState,
  completeness: Completeness | undefined,
): string {
  if (action === "approve") {
    if (completeness?.kind === "incomplete") return "Checklist incomplete";
    if (!isTransitionAllowed(state, "approved")) return `Cannot approve from ${state}`;
  }
  if (action === "conditional") {
    if (completeness?.kind !== "conditionally-complete") return "No conditional waivers";
    if (!isTransitionAllowed(state, "conditionally-approved"))
      return `Cannot conditionally approve from ${state}`;
  }
  if (action === "reject") {
    if (!isTransitionAllowed(state, "rejected")) return `Cannot reject from ${state}`;
  }
  return "";
}
