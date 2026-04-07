import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Shield,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Lock,
  FileCheck,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/use-auth";
import { formatDateTime } from "@/lib/utils";
import { MOCK_DOWNLOAD_TOKENS, MOCK_FIRMWARE_METADATA } from "@/lib/mock-data/download-token-data";
import type { DownloadToken } from "@/lib/types";

// ---------------------------------------------------------------------------
// Token validation states
// ---------------------------------------------------------------------------

type TokenState =
  | { kind: "loading" }
  | { kind: "valid"; token: DownloadToken; fileSize: number; sha256: string }
  | { kind: "expired"; token: DownloadToken }
  | { kind: "consumed"; token: DownloadToken }
  | { kind: "wrong-user"; token: DownloadToken }
  | { kind: "recalled"; token: DownloadToken }
  | { kind: "invalid" }
  | { kind: "mfa-required"; token: DownloadToken };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Secure firmware download page — standalone route at /download/:tokenGuid.
 *
 * NIST controls:
 * - AC-3  — Only the designated user (token.userId) can download
 * - IA-2  — MFA required before download
 * - SI-7  — SHA-256 checksum displayed for integrity verification
 * - AU-12 — Download events logged to audit trail
 *
 * @see Story 26.5 (#358)
 */
export function SecureDownloadPage() {
  const { tokenGuid } = useParams<{ tokenGuid: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, mfaEnabled } = useAuth();

  const [tokenState, setTokenState] = useState<TokenState>({ kind: "loading" });
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadComplete, setDownloadComplete] = useState(false);

  // Redirect to login if not authenticated, preserving return URL
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(`/login?returnTo=/download/${tokenGuid}`, { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, tokenGuid]);

  // Validate token once auth is ready
  useEffect(() => {
    if (authLoading || !isAuthenticated || !user) return;

    const validate = () => {
      const token = MOCK_DOWNLOAD_TOKENS.find((t) => t.tokenGuid === tokenGuid);

      if (!token) {
        setTokenState({ kind: "invalid" });
        return;
      }

      // AC-3: Check if current user matches the designated recipient
      if (token.userId !== user.id) {
        setTokenState({ kind: "wrong-user", token });
        return;
      }

      // IA-2: MFA check
      if (!mfaEnabled) {
        setTokenState({ kind: "mfa-required", token });
        return;
      }

      // Check token status
      if (token.status === "revoked") {
        setTokenState({ kind: "recalled", token });
        return;
      }

      if (token.status === "consumed" || token.consumed) {
        setTokenState({ kind: "consumed", token });
        return;
      }

      if (token.status === "expired" || new Date(token.expiresAt) < new Date()) {
        setTokenState({ kind: "expired", token });
        return;
      }

      // Token is valid — get firmware metadata for SI-7 integrity display
      const meta = MOCK_FIRMWARE_METADATA[token.firmwareId];
      if (!meta) {
        setTokenState({ kind: "invalid" });
        return;
      }

      setTokenState({
        kind: "valid",
        token,
        fileSize: meta.fileSize,
        sha256: meta.sha256,
      });
    };

    // Simulate server-side validation latency
    const timer = setTimeout(validate, 600);
    return () => clearTimeout(timer);
  }, [authLoading, isAuthenticated, user, mfaEnabled, tokenGuid]);

  // Simulated download with progress
  const handleDownload = useCallback(() => {
    if (tokenState.kind !== "valid") return;

    setDownloadProgress(0);
    toast.info("Starting secure download...");

    // Simulate progressive download
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setDownloadProgress(100);
        setDownloadComplete(true);
        toast.success("Download complete — verify checksum below");
      } else {
        setDownloadProgress(Math.round(progress));
      }
    }, 200);
  }, [tokenState]);

  // Auth still loading
  if (authLoading) {
    return (
      <PageShell>
        <StatusCard icon={Loader2} iconClass="animate-spin text-info">
          <p className="text-sm text-muted-foreground">Verifying authentication...</p>
        </StatusCard>
      </PageShell>
    );
  }

  // Not authenticated (redirect effect will fire)
  if (!isAuthenticated) return null;

  return (
    <PageShell>
      {tokenState.kind === "loading" && (
        <StatusCard icon={Loader2} iconClass="animate-spin text-info">
          <h2 className="text-lg font-semibold text-foreground">Validating Token</h2>
          <p className="text-sm text-muted-foreground">Verifying download authorization...</p>
        </StatusCard>
      )}

      {tokenState.kind === "invalid" && (
        <StatusCard icon={XCircle} iconClass="text-danger-text">
          <h2 className="text-lg font-semibold text-foreground">Invalid Token</h2>
          <p className="text-sm text-muted-foreground">
            This download link is not valid. It may have been deleted or the URL is malformed.
          </p>
        </StatusCard>
      )}

      {tokenState.kind === "expired" && (
        <StatusCard icon={Clock} iconClass="text-warning">
          <h2 className="text-lg font-semibold text-foreground">Link Expired</h2>
          <p className="text-sm text-muted-foreground">
            This download link expired on{" "}
            <span className="font-medium text-foreground">
              {formatDateTime(tokenState.token.expiresAt)}
            </span>
            . Request a new link from your administrator.
          </p>
        </StatusCard>
      )}

      {tokenState.kind === "consumed" && (
        <StatusCard icon={CheckCircle2} iconClass="text-muted-foreground">
          <h2 className="text-lg font-semibold text-foreground">Already Downloaded</h2>
          <p className="text-sm text-muted-foreground">
            This firmware was downloaded on{" "}
            <span className="font-medium text-foreground">
              {tokenState.token.consumedAt
                ? formatDateTime(tokenState.token.consumedAt)
                : "a previous session"}
            </span>
            . Each link is single-use. Contact your administrator for a new link.
          </p>
        </StatusCard>
      )}

      {tokenState.kind === "wrong-user" && (
        <StatusCard icon={Lock} iconClass="text-danger-text">
          <h2 className="text-lg font-semibold text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground">
            This download link was issued to a different user. You are not authorized to access this
            firmware. (AC-3)
          </p>
        </StatusCard>
      )}

      {tokenState.kind === "recalled" && (
        <StatusCard icon={AlertTriangle} iconClass="text-danger-text">
          <h2 className="text-lg font-semibold text-foreground">Link Revoked</h2>
          <p className="text-sm text-muted-foreground">
            This download link has been revoked by an administrator. Contact your manager for
            assistance.
          </p>
        </StatusCard>
      )}

      {tokenState.kind === "mfa-required" && (
        <StatusCard icon={Shield} iconClass="text-warning">
          <h2 className="text-lg font-semibold text-foreground">
            Multi-Factor Authentication Required
          </h2>
          <p className="text-sm text-muted-foreground">
            Firmware downloads require MFA to be enabled on your account (IA-2). Please enable MFA
            in your account settings before accessing this download.
          </p>
          <button
            onClick={() => navigate("/account-service")}
            className="mt-3 rounded bg-info px-4 py-2 text-sm font-semibold text-white hover:bg-info-text transition-colors"
          >
            Go to Account Settings
          </button>
        </StatusCard>
      )}

      {tokenState.kind === "valid" && (
        <div className="w-full max-w-lg space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-info" />
            <h2 className="text-lg font-semibold text-foreground">Secure Firmware Download</h2>
          </div>

          {/* Firmware details card */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Firmware</span>
                <p className="font-medium text-foreground">{tokenState.token.firmwareName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Version</span>
                <p className="font-medium text-foreground">{tokenState.token.firmwareVersion}</p>
              </div>
              <div>
                <span className="text-muted-foreground">File Size</span>
                <p className="font-medium text-foreground">{formatBytes(tokenState.fileSize)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Expires</span>
                <p className="font-medium text-foreground">
                  {formatDateTime(tokenState.token.expiresAt)}
                </p>
              </div>
            </div>

            {/* SI-7: SHA-256 checksum */}
            <div className="border-t border-border pt-3">
              <div className="flex items-center gap-1.5 mb-1">
                <FileCheck className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  SHA-256 Checksum (SI-7)
                </span>
              </div>
              <code className="block break-all rounded bg-muted/50 px-2 py-1.5 text-xs text-foreground/80 font-mono">
                {tokenState.sha256}
              </code>
            </div>
          </div>

          {/* Download button / progress */}
          {!downloadComplete && downloadProgress === null && (
            <button
              onClick={handleDownload}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-info px-4 py-3 text-sm font-semibold text-white hover:bg-info-text transition-colors"
            >
              <Download className="h-4 w-4" />
              Download Firmware
            </button>
          )}

          {downloadProgress !== null && !downloadComplete && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Downloading...</span>
                <span className="font-medium text-foreground">{downloadProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-info transition-all duration-200"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          )}

          {downloadComplete && (
            <div className="rounded-lg border border-success-bg dark:border-success-bg bg-success-bg dark:bg-success-bg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success-text" />
                <h3 className="text-sm font-semibold text-success-text dark:text-success-text">
                  Download Complete
                </h3>
              </div>
              <p className="text-xs text-success-text dark:text-success-text">
                Verify the downloaded file integrity by comparing its SHA-256 checksum with the
                value shown above. Use{" "}
                <code className="rounded bg-success-bg dark:bg-success-bg px-1">sha256sum</code> or{" "}
                <code className="rounded bg-success-bg dark:bg-success-bg px-1">
                  certutil -hashfile
                </code>{" "}
                to compute the checksum of the downloaded file.
              </p>
              <div className="rounded bg-muted/60 p-2 font-mono text-xs text-foreground/80">
                <p className="text-muted-foreground mb-1"># Linux / macOS</p>
                <p>sha256sum firmware-{tokenState.token.firmwareVersion}.bin</p>
                <p className="text-muted-foreground mt-2 mb-1"># Windows</p>
                <p>certutil -hashfile firmware-{tokenState.token.firmwareVersion}.bin SHA256</p>
              </div>
            </div>
          )}

          {/* Security notice */}
          <p className="text-xs text-muted-foreground text-center">
            This download is logged for audit compliance (AU-12). Unauthorized distribution of
            firmware is prohibited.
          </p>
        </div>
      )}
    </PageShell>
  );
}

// ---------------------------------------------------------------------------
// Layout sub-components
// ---------------------------------------------------------------------------

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}

interface StatusCardProps {
  icon: React.ComponentType<{ className?: string }>;
  iconClass?: string;
  children: React.ReactNode;
}

function StatusCard({ icon: Icon, iconClass, children }: StatusCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 text-center space-y-3">
      <Icon className={cn("mx-auto h-10 w-10", iconClass)} />
      {children}
    </div>
  );
}
