/**
 * IMS Gen 2 — Epic 14: Playbook Executor (Story 14.5 AC3-AC6)
 */
import { CheckCircle2, Zap } from "lucide-react";
import { cn } from "../../../lib/utils";
import { formatRelativeTime } from "../../../lib/utils";
import type { Incident } from "../../../lib/incident-types";

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
        <h4 className="text-[13px] font-semibold text-gray-900">
          Playbook: {progress.playbookName}
        </h4>
        {pct === 100 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            <CheckCircle2 className="h-3 w-3" /> Complete
          </span>
        )}
      </div>
      {/* Progress bar */}
      <div>
        <div className="mb-1 flex items-center justify-between text-[11px] text-gray-500">
          <span>
            {progress.completedSteps} of {progress.totalSteps} steps complete
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-[#FF7900] transition-all duration-300"
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
              step.isCompleted ? "border-emerald-200 bg-emerald-50/50" : "border-gray-200",
            )}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {step.isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <button
                    onClick={() => onStepComplete(step.stepNumber)}
                    className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-300 hover:border-[#FF7900] cursor-pointer"
                    title="Mark as complete"
                  >
                    <span className="sr-only">Complete step {step.stepNumber}</span>
                  </button>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-500">#{step.stepNumber}</span>
                  <p
                    className={cn(
                      "text-[13px] font-medium",
                      step.isCompleted ? "text-gray-500 line-through" : "text-gray-900",
                    )}
                  >
                    {step.title}
                  </p>
                  {step.actionType === "automated" && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600">
                      <Zap className="h-2.5 w-2.5" /> AUTO
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[12px] text-gray-500">{step.description}</p>
                {step.isCompleted && step.completedByName && (
                  <p className="mt-1 text-[11px] text-gray-500">
                    Completed by {step.completedByName} &middot;{" "}
                    {step.completedAt ? formatRelativeTime(step.completedAt) : ""}
                  </p>
                )}
              </div>
              {!step.isCompleted && step.actionType === "automated" && (
                <button
                  onClick={() => onStepComplete(step.stepNumber)}
                  className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-blue-700 cursor-pointer"
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
