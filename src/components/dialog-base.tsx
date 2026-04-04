import { useEffect, useRef, useCallback, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Size mapping
// ---------------------------------------------------------------------------

type DialogSize = "sm" | "md" | "lg" | "xl" | "2xl";

const SIZE_CLASSES: Record<DialogSize, string> = {
  sm: "max-w-sm", // 384px
  md: "max-w-md", // 448px
  lg: "max-w-lg", // 512px
  xl: "max-w-xl", // 576px
  "2xl": "max-w-2xl", // 672px
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DialogBaseProps {
  /** Dialog title — rendered in header and used for aria-labelledby */
  title: string;
  /** Control visibility */
  open: boolean;
  /** Called when user closes (Escape, backdrop click, X button) */
  onClose: () => void;
  /** Dialog width preset (default: "lg") */
  size?: DialogSize;
  /** Dialog body content */
  children: ReactNode;
  /** Optional footer content (action buttons) */
  footer?: ReactNode;
  /** Additional className on the dialog panel */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Shared dialog/modal base — consistent backdrop, focus trap, keyboard handling,
 * and WCAG 2.4.3 compliance across all 10+ modals in the application.
 *
 * Features:
 * - Focus trap (Tab/Shift+Tab cycles within dialog)
 * - Focus returns to trigger element on close
 * - Escape key closes
 * - Backdrop click closes
 * - aria-modal, role="dialog", aria-labelledby
 * - Mount/unmount animation (150ms)
 *
 * @see Story 23.2 (#300) — consolidates 10 modal implementations
 */
export function DialogBase({
  title,
  open,
  onClose,
  size = "lg",
  children,
  footer,
  className,
}: DialogBaseProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Capture the element that had focus before the dialog opened
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
    }
  }, [open]);

  // Focus the dialog when it opens, restore focus when it closes
  useEffect(() => {
    if (open) {
      // Small delay to ensure the dialog is in the DOM
      const timer = setTimeout(() => {
        dialogRef.current?.focus();
      }, 10);
      return () => clearTimeout(timer);
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [open]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Focus trap — cycle Tab within the dialog
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !dialogRef.current) return;

    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;

    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative z-10 w-full rounded-2xl border border-border bg-card shadow-xl",
          "animate-in fade-in slide-in-from-bottom-2 duration-150",
          "focus:outline-none",
          SIZE_CLASSES[size],
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 id="dialog-title" className="text-[15px] font-semibold text-foreground">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">{children}</div>

        {/* Footer (optional) */}
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
