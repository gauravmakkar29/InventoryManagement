/**
 * <EvidenceViewer /> — read-only display of an immutable evidence record
 * (Story 28.1 AC8). Renders metadata, an inline preview for common mime
 * types, a download button via signed URL, and an immutability badge.
 *
 * This component renders NO edit, delete, or replace affordances — the
 * underlying store does not support mutation, and the UI must not imply
 * otherwise (NIST MP-6).
 */

import { AlertTriangle, Download, FileText, Lock } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { useEvidence, useEvidenceSignedUrl } from "@/lib/compliance/evidence/use-evidence";

export interface EvidenceViewerProps {
  readonly evidenceId: string;
  readonly className?: string;
  /** Show inline preview for image/pdf/json/text mime types (default: true). */
  readonly preview?: boolean;
  /** Expiry for the signed download URL in seconds (default: 300 = 5 min). */
  readonly signedUrlExpirySeconds?: number;
}

export function EvidenceViewer({
  evidenceId,
  className,
  preview = true,
  signedUrlExpirySeconds = 300,
}: EvidenceViewerProps) {
  const evidence = useEvidence(evidenceId);
  const signed = useEvidenceSignedUrl(evidenceId, signedUrlExpirySeconds);
  const [downloadLocked, setDownloadLocked] = useState(false);

  if (evidence.isLoading) {
    return (
      <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-24 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (evidence.error) {
    const isDenied = (evidence.error as { kind?: string }).kind === "compliance.access-denied";
    return (
      <div role="alert" className={cn("rounded-lg border border-red-200 bg-red-50 p-4", className)}>
        <div className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm font-medium">
            {isDenied ? "You do not have access to this evidence" : "Evidence not found"}
          </span>
        </div>
      </div>
    );
  }

  const meta = evidence.data;
  if (!meta) return null;

  const onDownload = () => {
    if (!signed.url || downloadLocked) return;
    const a = document.createElement("a");
    a.href = signed.url;
    a.download = meta.id;
    a.rel = "noopener";
    a.click();
    setDownloadLocked(true);
    setTimeout(() => setDownloadLocked(false), 2_000);
  };

  return (
    <div className={cn("rounded-lg border border-border bg-card", className)}>
      <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
            <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="truncate">{meta.id}</span>
          </div>
          <dl className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <dt className="sr-only">Mime type</dt>
            <dd>{meta.mimeType}</dd>
            <dt className="sr-only">Size</dt>
            <dd>{formatBytes(meta.sizeBytes)}</dd>
            <dt className="sr-only">Uploaded by</dt>
            <dd className="col-span-2 truncate">
              uploaded by {meta.uploadedBy.displayName} · {formatDate(meta.uploadedAt)}
            </dd>
          </dl>
        </div>
        <ImmutabilityBadge retainUntil={meta.retention.retainUntil} />
      </header>

      {preview && <PreviewBlock url={signed.url} mime={meta.mimeType} />}

      <footer className="flex items-center justify-between border-t border-border px-4 py-3 text-[11px] text-muted-foreground">
        <span>SHA-256 {meta.contentHash.slice(0, 16)}…</span>
        <button
          type="button"
          onClick={onDownload}
          disabled={!signed.url || downloadLocked}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground transition-colors",
            "hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50",
          )}
          aria-label={`Download ${meta.id}`}
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          {signed.isLoading ? "Preparing…" : "Download"}
        </button>
      </footer>
    </div>
  );
}

function ImmutabilityBadge({ retainUntil }: { readonly retainUntil: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-900"
      title={`Stored under COMPLIANCE mode retention until ${formatDate(retainUntil)}. No user can modify or delete this record.`}
    >
      <Lock className="h-3 w-3" aria-hidden="true" />
      Immutable
    </span>
  );
}

function PreviewBlock({ url, mime }: { readonly url: string | undefined; readonly mime: string }) {
  if (!url) {
    return (
      <div className="border-b border-border bg-muted/30 px-4 py-6 text-center text-[12px] text-muted-foreground">
        Preparing preview…
      </div>
    );
  }
  if (mime.startsWith("image/")) {
    return (
      <div className="border-b border-border bg-muted/30 p-4">
        <img src={url} alt="Evidence preview" className="max-h-64 rounded border border-border" />
      </div>
    );
  }
  if (mime === "application/pdf") {
    return (
      <div className="border-b border-border bg-muted/30">
        <iframe
          title="Evidence PDF preview"
          src={url}
          className="h-64 w-full"
          sandbox="allow-same-origin"
        />
      </div>
    );
  }
  return (
    <div className="border-b border-border bg-muted/30 px-4 py-6 text-center text-[12px] text-muted-foreground">
      Preview unavailable for <code>{mime}</code> — use Download.
    </div>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
