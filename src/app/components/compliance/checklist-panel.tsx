/**
 * <ChecklistPanel /> — renders the slot-by-slot state with attach / waive
 * actions (Story 28.2 AC7-AC10). Domain-agnostic: driven by the schema
 * passed in; the primitive has no IMS knowledge.
 *
 * Waive actions (`<WaiverDialog>`) are rendered only for principals with
 * `canPerformAction(role, "checklist:waive")`; the server re-validates
 * so hiding in the UI is an ergonomic layer, not the security boundary.
 */

import { useState } from "react";
import { AlertCircle, CheckCircle2, Clock, Paperclip, ShieldCheck, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useChecklist, type ChecklistSchema, type SlotState } from "@/lib/compliance/checklist";
import { WaiverDialog } from "./waiver-dialog";

export interface ChecklistPanelProps {
  readonly schemaId: string;
  readonly subjectId: string;
  readonly canAttach: boolean;
  readonly canWaive: boolean;
  readonly onAttach?: (slotKey: string) => void;
  readonly className?: string;
}

export function ChecklistPanel({
  schemaId,
  subjectId,
  canAttach,
  canWaive,
  onAttach,
  className,
}: ChecklistPanelProps) {
  const {
    schema,
    state,
    completeness,
    isLoading,
    error,
    waivePermanent,
    waiveConditional,
    unwaive,
  } = useChecklist(schemaId, subjectId);
  const [waiverSlot, setWaiverSlot] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-3 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !schema || !state) {
    return (
      <div role="alert" className={cn("rounded-lg border border-red-200 bg-red-50 p-4", className)}>
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm">Unable to load checklist.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-border bg-card", className)}>
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground">{schema.label}</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            <ChecklistSummaryText schema={schema} state={state} completeness={completeness} />
          </p>
        </div>
        <CompletenessPill completeness={completeness} />
      </header>

      <ul className="divide-y divide-border">
        {schema.slots.map((slot) => {
          const slotState: SlotState = state.slots[slot.key] ?? { kind: "missing" };
          return (
            <li key={slot.key} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <SlotIcon kind={slotState.kind} />
                  <span className="text-[13px] font-medium text-foreground">{slot.label}</span>
                  {slot.required && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                      required
                    </span>
                  )}
                </div>
                <SlotStateLine state={slotState} />
              </div>
              <div className="flex items-center gap-2">
                {slotState.kind !== "present" && canAttach && (
                  <button
                    type="button"
                    onClick={() => onAttach?.(slot.key)}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-foreground hover:bg-muted"
                  >
                    <Paperclip className="h-3 w-3" aria-hidden="true" /> Attach
                  </button>
                )}
                {canWaive && slotState.kind === "missing" && (
                  <button
                    type="button"
                    onClick={() => setWaiverSlot(slot.key)}
                    className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] text-amber-900 hover:bg-amber-100"
                  >
                    <ShieldCheck className="h-3 w-3" aria-hidden="true" /> Waive
                  </button>
                )}
                {canWaive &&
                  (slotState.kind === "waived-permanent" ||
                    slotState.kind === "waived-conditional") && (
                    <button
                      type="button"
                      onClick={() => void unwaive(slot.key)}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
                    >
                      <X className="h-3 w-3" aria-hidden="true" /> Unwaive
                    </button>
                  )}
              </div>
            </li>
          );
        })}
      </ul>

      {waiverSlot && (
        <WaiverDialog
          slotKey={waiverSlot}
          onClose={() => setWaiverSlot(null)}
          onPermanent={async (reason) => {
            await waivePermanent(waiverSlot, reason);
            setWaiverSlot(null);
          }}
          onConditional={async (reason, dueAt) => {
            await waiveConditional(waiverSlot, reason, dueAt);
            setWaiverSlot(null);
          }}
        />
      )}
    </div>
  );
}

function SlotIcon({ kind }: { readonly kind: SlotState["kind"] }) {
  switch (kind) {
    case "present":
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />;
    case "missing":
      return <AlertCircle className="h-4 w-4 text-red-600" aria-hidden="true" />;
    case "waived-permanent":
      return <ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />;
    case "waived-conditional":
      return <Clock className="h-4 w-4 text-amber-600" aria-hidden="true" />;
  }
}

function SlotStateLine({ state }: { readonly state: SlotState }) {
  switch (state.kind) {
    case "present":
      return (
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Filled by {state.filledBy.displayName} · {short(state.filledAt)}
        </p>
      );
    case "missing":
      return <p className="mt-0.5 text-[11px] text-muted-foreground">No evidence attached</p>;
    case "waived-permanent":
      return (
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Waived permanently by {state.waivedBy.displayName} · {state.reason}
        </p>
      );
    case "waived-conditional":
      return (
        <p className="mt-0.5 text-[11px] text-amber-800">
          Conditional waiver — due {short(state.dueAt)} · {state.reason}
        </p>
      );
  }
}

function CompletenessPill({
  completeness,
}: {
  readonly completeness: { kind: string } | undefined;
}) {
  if (!completeness) return null;
  const map: Record<string, { label: string; className: string }> = {
    complete: { label: "Complete", className: "border-emerald-300 bg-emerald-50 text-emerald-800" },
    "conditionally-complete": {
      label: "Conditional",
      className: "border-amber-300 bg-amber-50 text-amber-900",
    },
    incomplete: { label: "Incomplete", className: "border-red-300 bg-red-50 text-red-800" },
  };
  const v = map[completeness.kind];
  if (!v) return null;
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", v.className)}>
      {v.label}
    </span>
  );
}

function ChecklistSummaryText({
  schema,
  state,
  completeness,
}: {
  readonly schema: ChecklistSchema;
  readonly state: { readonly slots: Readonly<Record<string, SlotState>> };
  readonly completeness: { kind: string } | undefined;
}) {
  const required = schema.slots.filter((s) => s.required);
  const present = required.filter((s) => state.slots[s.key]?.kind === "present").length;
  const conditional = required.filter(
    (s) => state.slots[s.key]?.kind === "waived-conditional",
  ).length;
  const missing = required.filter(
    (s) => (state.slots[s.key]?.kind ?? "missing") === "missing",
  ).length;
  void completeness;
  return (
    <>
      {present}/{required.length} complete
      {conditional > 0 && ` · ${conditional} conditional`}
      {missing > 0 && ` · ${missing} missing`}
    </>
  );
}

function short(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}
