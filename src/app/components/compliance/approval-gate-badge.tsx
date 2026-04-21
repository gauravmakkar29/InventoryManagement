/**
 * <ApprovalGateBadge /> — compact state pill for an approval (Story 28.3 AC9).
 */

import { AlertTriangle, Ban, CheckCircle2, Clock } from "lucide-react";
import type { ReactNode } from "react";
import type { Approval, ApprovalState } from "@/lib/compliance/approval";
import { cn } from "@/lib/utils";

export interface ApprovalGateBadgeProps {
  readonly approval: Approval | null | undefined;
  readonly className?: string;
}

export function ApprovalGateBadge({ approval, className }: ApprovalGateBadgeProps) {
  const state: ApprovalState = approval?.state ?? "pending";
  const variant = VARIANTS[state];
  const tooltip = approval
    ? [
        `State: ${state}`,
        approval.reviewer ? `Reviewer: ${approval.reviewer.displayName}` : null,
        approval.decidedAt ? `Decided: ${new Date(approval.decidedAt).toLocaleString()}` : null,
        approval.reason ? `Reason: ${approval.reason}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    : `State: ${state}`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        variant.className,
        className,
      )}
      title={tooltip}
    >
      {variant.icon}
      {variant.label}
    </span>
  );
}

const VARIANTS: Record<
  ApprovalState,
  { readonly label: string; readonly icon: ReactNode; readonly className: string }
> = {
  pending: {
    label: "Pending",
    icon: <Clock className="h-3 w-3" aria-hidden="true" />,
    className: "border-muted-foreground/30 bg-muted text-muted-foreground",
  },
  approved: {
    label: "Approved",
    icon: <CheckCircle2 className="h-3 w-3" aria-hidden="true" />,
    className: "border-emerald-300 bg-emerald-50 text-emerald-800",
  },
  "conditionally-approved": {
    label: "Conditional",
    icon: <AlertTriangle className="h-3 w-3" aria-hidden="true" />,
    className: "border-amber-300 bg-amber-50 text-amber-900",
  },
  rejected: {
    label: "Rejected",
    icon: <Ban className="h-3 w-3" aria-hidden="true" />,
    className: "border-red-300 bg-red-50 text-red-800",
  },
};
