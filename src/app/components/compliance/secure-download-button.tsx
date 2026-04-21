/**
 * <SecureDownloadButton /> — single-click UX that mints → (prompts MFA if
 * needed) → redeems → triggers the browser download (Story 28.5 AC9).
 *
 * The button does NOT implement the step-up MFA dialog itself — callers
 * wire the MFA flow through the auth provider (Story 19.6). This component
 * surfaces a `requireStepUpMfa` callback so the host can present its MFA UI
 * and resolve with the fresh MFA timestamp when the user succeeds.
 */

import { useState } from "react";
import { Download, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import { MfaStepUpRequiredError, type ISecureDistribution } from "@/lib/compliance/distribution";
import type { ComplianceActor } from "@/lib/compliance/types";

export interface SecureDownloadButtonProps {
  readonly driver: ISecureDistribution;
  readonly actor: ComplianceActor;
  readonly recipientUserId: string;
  readonly evidenceId: string;
  readonly purpose?: string;
  readonly requireStepUpMfa?: boolean;
  readonly expiresInSeconds?: number;
  /**
   * Called when MFA step-up is required. Must resolve with the fresh
   * last-step-up-MFA ISO timestamp (or reject to cancel).
   */
  readonly onStepUpMfa?: () => Promise<string>;
  readonly className?: string;
  readonly label?: string;
}

export function SecureDownloadButton({
  driver,
  actor,
  recipientUserId,
  evidenceId,
  purpose,
  requireStepUpMfa = false,
  expiresInSeconds = 900,
  onStepUpMfa,
  className,
  label = "Download",
}: SecureDownloadButtonProps) {
  const [working, setWorking] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const go = async () => {
    setWorking(true);
    setErr(null);
    try {
      const link = await driver.mintLink(
        {
          evidenceId,
          recipientUserId,
          expiresInSeconds,
          requireStepUpMfa,
          purpose,
        },
        actor,
      );

      let lastStepUpMfaAt: string | undefined;
      try {
        const redemption = await driver.redeem(link.token, { actor, lastStepUpMfaAt });
        window.open(redemption.storageUrl, "_blank", "noopener");
        return;
      } catch (e) {
        if (e instanceof MfaStepUpRequiredError && onStepUpMfa) {
          lastStepUpMfaAt = await onStepUpMfa();
          const redemption = await driver.redeem(link.token, {
            actor,
            lastStepUpMfaAt,
          });
          window.open(redemption.storageUrl, "_blank", "noopener");
          return;
        }
        throw e;
      }
    } catch (e) {
      setErr((e as Error).message ?? "Download failed");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => void go()}
        disabled={working}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground transition-colors",
          "hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
        {working ? "Preparing…" : label}
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <p className="mt-1 text-[10px] text-muted-foreground">
        One-time secure link · expires in {Math.floor(expiresInSeconds / 60)} min
      </p>
      {err && (
        <p role="alert" className="mt-1 text-[10px] text-red-700">
          {err}
        </p>
      )}
    </div>
  );
}
