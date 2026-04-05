/**
 * IMS Gen 2 — useDialogManager (Story 21.5)
 *
 * Centralizes modal/dialog state for page components.
 * Guarantees only one dialog is open at a time — prevents z-index
 * conflicts, focus trap collisions, and overlapping modals.
 */

import { useState, useCallback } from "react";

export interface DialogState<T extends string = string> {
  type: T | "closed";
  context?: Record<string, unknown>;
}

export interface DialogManager<T extends string = string> {
  /** Current dialog state */
  dialog: DialogState<T>;
  /** Whether any dialog is open */
  isOpen: boolean;
  /** Whether a specific dialog is open */
  isDialogOpen: (type: T) => boolean;
  /** Open a dialog (closes any currently open dialog) */
  open: (type: T, context?: Record<string, unknown>) => void;
  /** Close the current dialog */
  close: () => void;
  /** Get context value for current dialog */
  getContext: <V = unknown>(key: string) => V | undefined;
}

export function useDialogManager<T extends string = string>(): DialogManager<T> {
  const [dialog, setDialog] = useState<DialogState<T>>({ type: "closed" });

  const open = useCallback((type: T, context?: Record<string, unknown>) => {
    setDialog({ type, context });
  }, []);

  const close = useCallback(() => {
    setDialog({ type: "closed" });
  }, []);

  const isOpen = dialog.type !== "closed";

  const isDialogOpen = useCallback((type: T) => dialog.type === type, [dialog.type]);

  const getContext = useCallback(
    <V = unknown>(key: string): V | undefined => {
      return dialog.context?.[key] as V | undefined;
    },
    [dialog.context],
  );

  return { dialog, isOpen, isDialogOpen, open, close, getContext };
}
