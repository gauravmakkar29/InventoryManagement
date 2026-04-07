import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApprovalStageIndicatorProps } from "./deployment-types";
import { APPROVAL_STAGES } from "./deployment-constants";
import { formatShortDate } from "./deployment-utils";

// =============================================================================
// Approval Stage Indicator — Story 11.3
// =============================================================================

export function ApprovalStageIndicator({
  currentStage,
  uploadedBy,
  uploadedDate,
  testedBy,
  testedDate,
  approvedBy,
  approvedDate,
}: ApprovalStageIndicatorProps) {
  const isDeprecated = currentStage === "Deprecated";
  const stageIdx = isDeprecated
    ? -1
    : APPROVAL_STAGES.indexOf(currentStage as "Uploaded" | "Testing" | "Approved");

  const stages = [
    { label: "Uploaded", by: uploadedBy, date: uploadedDate },
    { label: "Testing", by: testedBy, date: testedDate },
    { label: "Approved", by: approvedBy, date: approvedDate },
  ];

  return (
    <div className="flex items-center gap-0">
      {stages.map((stage, i) => {
        const isCompleted = !isDeprecated && i < stageIdx;
        const isCurrent = !isDeprecated && i === stageIdx;
        const isFuture = isDeprecated || i > stageIdx;

        const tooltipText =
          (isCompleted || isCurrent) && stage.by
            ? `${stage.label} by ${stage.by}${stage.date ? ` on ${formatShortDate(stage.date)}` : ""}`
            : undefined;

        return (
          <div key={stage.label} className="flex items-center">
            {/* Connector line before circle (skip for first) */}
            {i > 0 && (
              <div
                className={cn(
                  "h-0.5 w-4",
                  isCompleted || isCurrent ? "bg-success" : "bg-border/60",
                )}
              />
            )}
            {/* Stage circle */}
            <div className="relative group">
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-200",
                  isCompleted && "bg-success text-white",
                  isCurrent && "bg-info text-white animate-pulse",
                  isFuture && "border border-border bg-card text-muted-foreground",
                  isDeprecated && "border border-border bg-muted text-muted-foreground",
                )}
              >
                {isCompleted ? <Check className="h-2.5 w-2.5" /> : i + 1}
              </div>
              {/* Tooltip on completed/current stages */}
              {tooltipText && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-20">
                  <div className="whitespace-nowrap rounded bg-foreground px-2 py-1 text-[12px] text-background shadow-lg">
                    {tooltipText}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
      {/* Stage labels below */}
      <div className="ml-2 flex items-center gap-0.5">
        {stages.map((stage, i) => {
          const isCompleted = !isDeprecated && i < stageIdx;
          const isCurrent = !isDeprecated && i === stageIdx;
          return (
            <span
              key={stage.label}
              className={cn(
                "text-[12px] font-medium",
                i > 0 && "ml-1",
                isCompleted && "text-success-text",
                isCurrent && "text-info-text",
                !isCompleted && !isCurrent && "text-muted-foreground",
                isDeprecated && "text-muted-foreground line-through",
              )}
            >
              {i > 0 && <span className="text-muted-foreground mr-1">/</span>}
              {stage.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
