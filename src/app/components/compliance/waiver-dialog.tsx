/**
 * <WaiverDialog /> — reviewer-only UI for capturing a permanent or
 * conditional waiver reason (Story 28.2 AC9).
 *
 * Reason: 10-500 chars (SI-10). Due date for conditional: today..+365d.
 * Server-side validation in the adapter is the ground truth; this form
 * provides ergonomic feedback.
 */

import { useState } from "react";
import { DialogBase } from "@/components/dialog-base";

export interface WaiverDialogProps {
  readonly slotKey: string;
  readonly onPermanent: (reason: string) => void | Promise<void>;
  readonly onConditional: (reason: string, dueAt: string) => void | Promise<void>;
  readonly onClose: () => void;
}

type Mode = "permanent" | "conditional";

export function WaiverDialog({ slotKey, onPermanent, onConditional, onClose }: WaiverDialogProps) {
  const [mode, setMode] = useState<Mode>("conditional");
  const [reason, setReason] = useState("");
  const [dueAt, setDueAt] = useState(defaultDueDate());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reasonValid = reason.length >= 10 && reason.length <= 500;
  const dueValid = mode === "permanent" || Boolean(dueAt);

  const submit = async () => {
    if (!reasonValid || !dueValid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "permanent") {
        await onPermanent(reason);
      } else {
        await onConditional(reason, new Date(dueAt).toISOString());
      }
    } catch (e) {
      setError((e as Error).message ?? "Failed to record waiver");
      setSubmitting(false);
    }
  };

  return (
    <DialogBase
      title={`Waive "${slotKey}"`}
      open
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-3 py-1.5 text-[12px] text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!reasonValid || !dueValid || submitting}
            className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Record waiver"}
          </button>
        </>
      }
    >
      <div className="space-y-4 text-[13px]">
        <fieldset>
          <legend className="mb-2 text-[12px] font-medium text-foreground">Waiver type</legend>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-[12px]">
              <input
                type="radio"
                name="waiver-mode"
                value="conditional"
                checked={mode === "conditional"}
                onChange={() => setMode("conditional")}
              />
              Conditional (with SLA)
            </label>
            <label className="flex items-center gap-2 text-[12px]">
              <input
                type="radio"
                name="waiver-mode"
                value="permanent"
                checked={mode === "permanent"}
                onChange={() => setMode("permanent")}
              />
              Permanent
            </label>
          </div>
        </fieldset>

        <div>
          <label
            htmlFor="waiver-reason"
            className="mb-1 block text-[12px] font-medium text-foreground"
          >
            Reason
          </label>
          <textarea
            id="waiver-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder={
              mode === "permanent"
                ? "Why is this artifact formally not required?"
                : "Why conditional? State the remediation plan."
            }
            className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-[12px] text-foreground outline-none focus:border-primary"
          />
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {reason.length}/500 characters (min 10)
          </p>
        </div>

        {mode === "conditional" && (
          <div>
            <label
              htmlFor="waiver-due"
              className="mb-1 block text-[12px] font-medium text-foreground"
            >
              Due date
            </label>
            <input
              id="waiver-due"
              type="date"
              value={dueAt}
              min={todayISODate()}
              max={oneYearFromTodayISO()}
              onChange={(e) => setDueAt(e.target.value)}
              className="rounded-md border border-border bg-card px-2 py-1.5 text-[12px] text-foreground outline-none focus:border-primary"
            />
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-2 text-[12px] text-red-800"
          >
            {error}
          </p>
        )}
      </div>
    </DialogBase>
  );
}

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

function oneYearFromTodayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 365);
  return d.toISOString().slice(0, 10);
}

function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}
