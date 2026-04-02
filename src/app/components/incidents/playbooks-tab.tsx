/**
 * IMS Gen 2 — Epic 14: Playbooks Tab (Story 14.5 AC1-AC2, AC7-AC8)
 */
import { useState, useMemo } from "react";
import { Plus, Clock, User, CheckCircle2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IncidentCategory, Playbook } from "@/lib/incident-types";
import { SeverityBadge, CategoryBadge } from "./incident-badges";

export function PlaybooksTab({ playbooks }: { playbooks: Playbook[] }) {
  const [categoryFilter, setCategoryFilter] = useState<IncidentCategory | "All">("All");

  const filtered = useMemo(() => {
    if (categoryFilter === "All") return playbooks;
    return playbooks.filter((p) => p.category === categoryFilter);
  }, [playbooks, categoryFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as IncidentCategory | "All")}
          className="rounded-lg border border-border px-3 py-2 text-[14px] text-foreground/80 focus:outline-none focus:border-accent-text"
        >
          <option value="All">All Categories</option>
          <option value="Security">Security</option>
          <option value="Hardware">Hardware</option>
          <option value="Network">Network</option>
          <option value="Firmware">Firmware</option>
          <option value="Environmental">Environmental</option>
        </select>
        <button className="ml-auto rounded-lg bg-accent px-4 py-2 text-[14px] font-medium text-white hover:bg-accent-hover cursor-pointer">
          <Plus className="mr-1.5 inline h-3.5 w-3.5" /> Create Playbook
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((pb) => (
          <div key={pb.id} className="card-elevated p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <CategoryBadge category={pb.category} />
                <SeverityBadge severity={pb.severity} />
              </div>
              <span
                className={cn(
                  "inline-flex rounded-full px-2 py-0.5 text-[12px] font-semibold",
                  pb.status === "Active"
                    ? "bg-emerald-50 text-emerald-700"
                    : pb.status === "Draft"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {pb.status}
              </span>
            </div>
            <h4 className="text-[15px] font-semibold text-foreground">{pb.name}</h4>
            <p className="mt-1 text-[14px] text-muted-foreground line-clamp-2">{pb.description}</p>
            <div className="mt-3 flex items-center gap-4 text-[13px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> {pb.stepCount} steps
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> ~{pb.estimatedDurationMinutes} min
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> {pb.createdByName}
              </span>
            </div>
            <div className="mt-3 border-t border-border/60 pt-3">
              <h5 className="text-[13px] font-semibold text-muted-foreground uppercase mb-2">
                Steps Preview
              </h5>
              <div className="space-y-1">
                {pb.steps.slice(0, 3).map((step) => (
                  <div
                    key={step.stepNumber}
                    className="flex items-center gap-2 text-[14px] text-muted-foreground"
                  >
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[12px] font-bold text-muted-foreground">
                      {step.stepNumber}
                    </span>
                    <span className="truncate">{step.title}</span>
                    {step.actionType === "automated" && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-blue-50 px-1 py-0.5 text-[11px] font-semibold text-blue-600">
                        <Zap className="h-2 w-2" /> AUTO
                      </span>
                    )}
                  </div>
                ))}
                {pb.steps.length > 3 && (
                  <p className="text-[13px] text-muted-foreground pl-6">
                    +{pb.steps.length - 3} more steps
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
