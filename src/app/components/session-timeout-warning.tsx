import { useAuth } from "@/lib/use-auth";
import { AlertTriangle } from "lucide-react";

/**
 * Modal shown when the session is about to expire.
 * Allows the user to extend their session or sign out.
 */
export function SessionTimeoutWarning() {
  const { sessionExpiring, extendSession, signOut } = useAuth();

  if (!sessionExpiring) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-warning-title"
      aria-describedby="session-warning-desc"
    >
      <div className="card-elevated mx-4 w-full max-w-md p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h2 id="session-warning-title" className="text-base font-semibold text-foreground">
              Session Expiring Soon
            </h2>
            <p id="session-warning-desc" className="mt-1 text-sm text-muted-foreground">
              Your session will expire shortly. Would you like to stay signed in?
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => signOut()}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            Sign Out
          </button>
          <button
            onClick={() => extendSession()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            autoFocus
          >
            Keep Me Signed In
          </button>
        </div>
      </div>
    </div>
  );
}
