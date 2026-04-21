/**
 * <ConditionsPanel /> — lists SLA conditions attached to a conditional-
 * approval subject with mark-satisfied action for reviewers (Story 28.4 AC10).
 */

import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import type { Approval, IApprovalEngine } from "@/lib/compliance/approval";
import { cn } from "@/lib/utils";

import { SlaCountdown } from "./sla-countdown";

export interface ConditionsPanelProps {
  readonly approval: Approval;
  readonly engine: IApprovalEngine;
  readonly actor: { readonly userId: string; readonly displayName: string };
  readonly canSatisfy: boolean;
  readonly onSatisfied?: (approvalId: string, conditionId: string) => void;
  readonly className?: string;
}

export function ConditionsPanel({
  approval,
  engine,
  actor,
  canSatisfy,
  onSatisfied,
  className,
}: ConditionsPanelProps) {
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingReason, setPendingReason] = useState<Record<string, string>>({});

  if (approval.conditions.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-card px-4 py-6 text-center text-[12px] text-muted-foreground",
          className,
        )}
      >
        No conditions attached.
      </div>
    );
  }

  const markSatisfied = async (conditionId: string) => {
    const reason = (pendingReason[conditionId] ?? "").trim();
    if (reason.length < 10 || reason.length > 500) {
      setError("A 10-500 character reason is required to mark a condition satisfied.");
      return;
    }
    setWorking(conditionId);
    setError(null);
    try {
      await engine.markConditionSatisfied(approval.id, conditionId, reason, actor);
      onSatisfied?.(approval.id, conditionId);
    } catch (e) {
      setError((e as Error).message ?? "Failed to mark satisfied");
    } finally {
      setWorking(null);
    }
  };

  return (
    <div className={cn("rounded-lg border border-border bg-card", className)}>
      <header className="border-b border-border px-4 py-3">
        <h3 className="text-[14px] font-semibold text-foreground">SLA conditions</h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {approval.conditions.length} attached ·{" "}
          {approval.conditions.filter((c) => c.status === "satisfied").length} satisfied
        </p>
      </header>
      <ul className="divide-y divide-border">
        {approval.conditions.map((c) => (
          <li key={c.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
                  {c.status === "satisfied" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-600" aria-hidden="true" />
                  )}
                  <span className="truncate">{c.description}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Condition {c.id} · due {new Date(c.dueAt).toLocaleDateString()}
                </p>
              </div>
              <SlaCountdown condition={c} />
            </div>

            {canSatisfy && c.status !== "satisfied" && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={pendingReason[c.id] ?? ""}
                  onChange={(e) =>
                    setPendingReason((prev) => ({ ...prev, [c.id]: e.target.value }))
                  }
                  placeholder="Reason (10-500 chars)"
                  className="flex-1 rounded-md border border-border bg-card px-2 py-1 text-[12px] text-foreground outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => void markSatisfied(c.id)}
                  disabled={working === c.id}
                  className="rounded-md bg-emerald-600 px-3 py-1 text-[12px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {working === c.id ? "Saving…" : "Mark satisfied"}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {error && (
        <p
          role="alert"
          className="border-t border-border bg-red-50 px-4 py-2 text-[12px] text-red-800"
        >
          {error}
        </p>
      )}
    </div>
  );
}
