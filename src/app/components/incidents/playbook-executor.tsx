/**
 * IMS Gen 2 — Epic 14: Playbook Executor (Story 14.5 AC3-AC6)
 */
import { CheckCircle2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import type { Incident } from "@/lib/incident-types";

export function PlaybookExecutor({
  progress,
  onStepComplete,
}: {
  progress: Incident["playbookProgress"];
  onStepComplete: (stepNumber: number) => void;
}) {
  if (!progress) return null;

  const pct =
    progress.totalSteps > 0 ? Math.round((progress.completedSteps / progress.totalSteps) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[14px] font-semibold text-foreground">
          Playbook: {progress.playbookName}
        </h4>
        {pct === 100 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-[12px] font-semibold text-success-text">
            <CheckCircle2 className="h-3 w-3" /> Complete
          </span>
        )}
      </div>
      {/* Progress bar */}
      <div>
        <div className="mb-1 flex items-center justify-between text-[13px] text-muted-foreground">
          <span>
            {progress.completedSteps} of {progress.totalSteps} steps complete
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {/* Steps */}
      <div className="space-y-2">
        {progress.steps.map((step) => (
          <div
            key={step.stepNumber}
            className={cn(
              "rounded-lg border p-3",
              step.isCompleted ? "border-success-bg bg-success-bg/50" : "border-border",
            )}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {step.isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <button
                    onClick={() => onStepComplete(step.stepNumber)}
                    className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-border hover:border-accent-text cursor-pointer"
                    title="Mark as complete"
                  >
                    <span className="sr-only">Complete step {step.stepNumber}</span>
                  </button>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-muted-foreground">
                    #{step.stepNumber}
                  </span>
                  <p
                    className={cn(
                      "text-[14px] font-medium",
                      step.isCompleted ? "text-muted-foreground line-through" : "text-foreground",
                    )}
                  >
                    {step.title}
                  </p>
                  {step.actionType === "automated" && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-info-bg px-1.5 py-0.5 text-[12px] font-semibold text-info-text">
                      <Zap className="h-2.5 w-2.5" /> AUTO
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[14px] text-muted-foreground">{step.description}</p>
                {step.isCompleted && step.completedByName && (
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    Completed by {step.completedByName} &middot;{" "}
                    {step.completedAt ? formatRelativeTime(step.completedAt) : ""}
                  </p>
                )}
              </div>
              {!step.isCompleted && step.actionType === "automated" && (
                <button
                  onClick={() => onStepComplete(step.stepNumber)}
                  className="shrink-0 rounded-lg bg-info px-3 py-1.5 text-[13px] font-medium text-white hover:bg-info-text cursor-pointer"
                >
                  Execute
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
