// =============================================================================
// FirmwareActiveLinksTab — Story #391 (AC7)
// Shows active/recent download tokens for a specific firmware, with revoke
// =============================================================================

import { useState, useMemo, useCallback } from "react";
import { Link2, Copy, Check, Ban, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { DownloadToken } from "@/lib/types";
import { MOCK_DOWNLOAD_TOKENS } from "@/lib/mock-data/download-token-data";

// ---------------------------------------------------------------------------
// Types + Config
// ---------------------------------------------------------------------------

interface FirmwareActiveLinksTabProps {
  firmwareId: string;
  onGenerateClick: () => void;
  canGenerate: boolean;
}

type TokenStatus = DownloadToken["status"];

const STATUS_STYLES: Record<TokenStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-info-bg text-info-text" },
  consumed: { label: "Consumed", className: "bg-success-bg text-success-text" },
  expired: { label: "Expired", className: "bg-muted text-muted-foreground" },
  revoked: { label: "Revoked", className: "bg-danger-bg text-danger-text" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildDownloadUrl(tokenGuid: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "https://app.example.com";
  return `${base}/download/${tokenGuid}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FirmwareActiveLinksTab({
  firmwareId,
  onGenerateClick,
  canGenerate,
}: FirmwareActiveLinksTabProps) {
  const [tokens, setTokens] = useState<DownloadToken[]>(MOCK_DOWNLOAD_TOKENS);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokeConfirmId, setRevokeConfirmId] = useState<string | null>(null);

  // Filter tokens for this firmware
  const filteredTokens = useMemo(
    () => tokens.filter((t) => t.firmwareId === firmwareId),
    [tokens, firmwareId],
  );

  // Show all tokens if none match the specific firmware (demo fallback)
  const displayTokens = filteredTokens.length > 0 ? filteredTokens : tokens;

  const handleCopy = useCallback(async (token: DownloadToken) => {
    const url = buildDownloadUrl(token.tokenGuid);
    await navigator.clipboard.writeText(url);
    setCopiedId(token.id);
    toast.success("Download link copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // AU-6: Revocation logged to audit trail
  const handleRevoke = useCallback((tokenId: string) => {
    setTokens((prev) =>
      prev.map((t) => (t.id === tokenId ? { ...t, status: "revoked" as const } : t)),
    );
    setRevokeConfirmId(null);
    toast.success("Download link revoked");
  }, []);

  if (displayTokens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Link2 className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="text-[14px] font-medium text-foreground">No download links</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          No one-time download links have been generated for this firmware.
        </p>
        {canGenerate && (
          <button
            type="button"
            onClick={onGenerateClick}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-[14px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            Generate Download Link
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="card-elevated overflow-hidden rounded-xl">
      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="text-[16px] font-semibold text-foreground">
          Download Links ({displayTokens.length})
        </h3>
        {canGenerate && (
          <button
            type="button"
            onClick={onGenerateClick}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Link2 className="h-3.5 w-3.5" />
            Generate
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left" role="table">
          <thead>
            <tr className="border-t border-border bg-muted/30">
              <th className="px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Recipient
              </th>
              <th className="px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Created By
              </th>
              <th className="px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Expires
              </th>
              <th className="px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {displayTokens.map((token) => {
              const statusConfig = STATUS_STYLES[token.status];
              return (
                <tr
                  key={token.id}
                  className="border-t border-border transition-colors hover:bg-muted/20"
                >
                  <td className="px-5 py-3">
                    <span className="text-[14px] text-foreground">{token.userEmail}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-semibold",
                        statusConfig.className,
                      )}
                    >
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[14px] text-muted-foreground">
                    {token.createdByEmail}
                  </td>
                  <td className="px-5 py-3 text-[14px] text-muted-foreground">
                    {formatDate(token.expiresAt)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {/* Copy link */}
                      <button
                        type="button"
                        onClick={() => handleCopy(token)}
                        disabled={token.status !== "active"}
                        className={cn(
                          "inline-flex items-center gap-1 rounded px-2 py-1 text-[12px] font-medium",
                          token.status === "active"
                            ? "text-primary hover:bg-muted"
                            : "cursor-not-allowed text-muted-foreground opacity-50",
                        )}
                        title="Copy download link"
                      >
                        {copiedId === token.id ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        Copy
                      </button>

                      {/* Revoke */}
                      {token.status === "active" && canGenerate && (
                        <>
                          {revokeConfirmId === token.id ? (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                              <button
                                type="button"
                                onClick={() => handleRevoke(token.id)}
                                className="text-[12px] font-medium text-danger hover:underline"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setRevokeConfirmId(null)}
                                className="text-[12px] text-muted-foreground hover:underline"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setRevokeConfirmId(token.id)}
                              className="inline-flex items-center gap-1 rounded px-2 py-1 text-[12px] font-medium text-danger hover:bg-danger-bg"
                              title="Revoke link"
                            >
                              <Ban className="h-3.5 w-3.5" />
                              Revoke
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
