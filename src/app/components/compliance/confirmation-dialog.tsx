/**
 * <ConfirmationDialog /> — proof-capture form for a pending action
 * initiation (Story 28.6 AC10).
 *
 * Caller supplies:
 * - `initiation` — the pending record
 * - `validator` — pure function that returns ValidationResult on proof
 * - `onConfirm(proof)` — called with a validated proof object
 * - `renderFields(state, setState)` — caller-driven form body (keeps the
 *   compliance library UI-agnostic about proof shape)
 */

import { useState } from "react";
import { DialogBase } from "@/components/dialog-base";
import type { ActionInitiation, ProofValidator } from "@/lib/compliance/confirmation";

export interface ConfirmationDialogProps<TProof> {
  readonly initiation: ActionInitiation;
  readonly validator: ProofValidator<TProof>;
  readonly initialProof: TProof;
  readonly onConfirm: (proof: TProof) => Promise<void>;
  readonly onClose: () => void;
  readonly renderFields: (args: {
    readonly proof: TProof;
    readonly setProof: (next: TProof) => void;
  }) => React.ReactNode;
  readonly title?: string;
}

export function ConfirmationDialog<TProof>({
  initiation,
  validator,
  initialProof,
  onConfirm,
  onClose,
  renderFields,
  title,
}: ConfirmationDialogProps<TProof>) {
  const [proof, setProof] = useState<TProof>(initialProof);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validation = validator(proof);

  const submit = async () => {
    if (!validation.ok || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(proof);
    } catch (e) {
      setError((e as Error).message ?? "Confirmation failed");
      setSubmitting(false);
    }
  };

  return (
    <DialogBase
      title={title ?? `Confirm ${initiation.kind}`}
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
            disabled={!validation.ok || submitting}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? "Confirming…" : "Confirm"}
          </button>
        </>
      }
    >
      <div className="space-y-3 text-[13px]">
        <p className="text-[12px] text-muted-foreground">
          Initiated by {initiation.initiatedBy.displayName} ·{" "}
          {new Date(initiation.initiatedAt).toLocaleString()}
        </p>
        {renderFields({ proof, setProof })}
        {!validation.ok && validation.messages.length > 0 && (
          <ul className="rounded-md border border-amber-200 bg-amber-50 p-2 text-[12px] text-amber-900">
            {validation.messages.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
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
