/**
 * IMS Gen 2 — Shared Confirm Dialog (Story 21.2)
 *
 * Replaces window.confirm() with a styled, accessible dialog that
 * follows the enterprise design language and doesn't block the main thread.
 */

import { cn } from "../lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: "danger" | "warning" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_CLASSES: Record<string, string> = {
  danger: "bg-red-600 hover:bg-red-700",
  warning: "bg-amber-600 hover:bg-amber-700",
  primary: "bg-accent hover:bg-accent/90",
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  confirmVariant = "primary",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative z-10 mx-4 w-full max-w-sm rounded-lg bg-card shadow-xl border border-border">
        <div className="p-5 space-y-3">
          <h2 id="confirm-title" className="text-[15px] font-semibold text-foreground">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button
            onClick={onCancel}
            className="rounded border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground/80 hover:bg-muted transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "rounded px-3 py-1.5 text-sm font-semibold text-white transition-colors cursor-pointer",
              VARIANT_CLASSES[confirmVariant],
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
