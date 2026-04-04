/**
 * Download Audit History Panel — Story 26.6 (#359)
 *
 * Shows audit trail of all download attempts (success + failure) for a firmware.
 * Supports filtering by result type. NIST AU-6 (Audit Review).
 */

import { useState, useMemo } from "react";
import { CheckCircle, XCircle, Shield, Clock, AlertTriangle, Download, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import type { DownloadAuditEntry, DownloadAttemptResult } from "@/lib/types";

// ---------------------------------------------------------------------------
// Result display config
// ---------------------------------------------------------------------------

interface ResultConfig {
  label: string;
  icon: typeof CheckCircle;
  color: string;
  bgColor: string;
}

const RESULT_CONFIG: Record<DownloadAttemptResult, ResultConfig> = {
  SUCCESS: {
    label: "Downloaded",
    icon: CheckCircle,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  TOKEN_NOT_FOUND: {
    label: "Invalid Token",
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  TOKEN_EXPIRED: { label: "Expired", icon: Clock, color: "text-gray-500", bgColor: "bg-gray-50" },
  TOKEN_CONSUMED: {
    label: "Already Used",
    icon: XCircle,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  USER_MISMATCH: { label: "Wrong User", icon: Shield, color: "text-red-600", bgColor: "bg-red-50" },
  FIRMWARE_RECALLED: {
    label: "Recalled",
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  MFA_MISSING: {
    label: "MFA Required",
    icon: Shield,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  RATE_LIMITED: {
    label: "Rate Limited",
    icon: AlertTriangle,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
};

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_AUDIT_ENTRIES: DownloadAuditEntry[] = [
  {
    id: "da-1",
    tokenId: "dt-001",
    tokenGuid: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    firmwareId: "fw-001",
    firmwareName: "INV-3200 Controller",
    firmwareVersion: "v4.1.0",
    userId: "u-tech-01",
    userEmail: "tech.jones@example.com",
    clientIp: "203.0.113.42",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    timestamp: "2026-04-04T10:15:00Z",
    result: "SUCCESS",
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  },
  {
    id: "da-2",
    tokenId: "dt-001",
    tokenGuid: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    firmwareId: "fw-001",
    firmwareName: "INV-3200 Controller",
    firmwareVersion: "v4.1.0",
    userId: "u-tech-02",
    userEmail: "tech.garcia@example.com",
    clientIp: "198.51.100.15",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X)",
    timestamp: "2026-04-04T10:20:00Z",
    result: "USER_MISMATCH",
    reason: "Token issued to tech.jones@example.com, attempted by tech.garcia@example.com",
  },
  {
    id: "da-3",
    tokenId: "dt-003",
    tokenGuid: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    firmwareId: "fw-001",
    firmwareName: "INV-3200 Controller",
    firmwareVersion: "v4.1.0",
    userId: "u-tech-03",
    userEmail: "tech.lee@example.com",
    clientIp: "192.0.2.80",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS)",
    timestamp: "2026-04-04T09:00:00Z",
    result: "TOKEN_EXPIRED",
    reason: "Token expired at 2026-04-01T13:00:00Z",
  },
  {
    id: "da-4",
    tokenId: "dt-002",
    tokenGuid: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    firmwareId: "fw-002",
    firmwareName: "INV-3100 Gateway",
    firmwareVersion: "v3.8.2",
    userId: "u-tech-02",
    userEmail: "tech.garcia@example.com",
    clientIp: "203.0.113.42",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    timestamp: "2026-04-03T11:23:00Z",
    result: "SUCCESS",
    sha256: "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a",
  },
  {
    id: "da-5",
    tokenId: "dt-005",
    tokenGuid: "e5f6a7b8-c9d0-1234-efab-567890123456",
    firmwareId: "fw-003",
    firmwareName: "SG-RT600 Router Module",
    firmwareVersion: "v2.0.1",
    userId: "u-tech-01",
    userEmail: "tech.jones@example.com",
    clientIp: "198.51.100.22",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    timestamp: "2026-04-03T08:45:00Z",
    result: "MFA_MISSING",
    reason: "User has not enabled multi-factor authentication",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface DownloadHistoryPanelProps {
  firmwareId?: string;
  className?: string;
}

export function DownloadHistoryPanel({ firmwareId, className }: DownloadHistoryPanelProps) {
  const [resultFilter, setResultFilter] = useState<DownloadAttemptResult | "ALL">("ALL");

  const entries = useMemo(() => {
    let filtered = MOCK_AUDIT_ENTRIES;
    if (firmwareId) {
      filtered = filtered.filter((e) => e.firmwareId === firmwareId);
    }
    if (resultFilter !== "ALL") {
      filtered = filtered.filter((e) => e.result === resultFilter);
    }
    return filtered.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [firmwareId, resultFilter]);

  const resultOptions: Array<DownloadAttemptResult | "ALL"> = [
    "ALL",
    "SUCCESS",
    "USER_MISMATCH",
    "TOKEN_EXPIRED",
    "TOKEN_CONSUMED",
    "FIRMWARE_RECALLED",
    "MFA_MISSING",
    "RATE_LIMITED",
    "TOKEN_NOT_FOUND",
  ];

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header + filter */}
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-foreground">Download Audit Log</h3>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value as DownloadAttemptResult | "ALL")}
            className="rounded border border-border bg-card px-2 py-1 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
            aria-label="Filter by result"
          >
            {resultOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "ALL" ? "All Results" : RESULT_CONFIG[opt].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Entries */}
      {entries.length === 0 ? (
        <EmptyState
          icon={Download}
          title="No download attempts"
          description="Download audit entries will appear here when technicians use download links."
        />
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const config = RESULT_CONFIG[entry.result];
            const Icon = config.icon;
            const isSuccess = entry.result === "SUCCESS";

            return (
              <div
                key={entry.id}
                className={cn(
                  "rounded-lg border px-4 py-3",
                  isSuccess ? "border-emerald-200 bg-emerald-50/30" : "border-border bg-card",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        config.bgColor,
                      )}
                    >
                      <Icon className={cn("h-4 w-4", config.color)} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[13px] font-semibold", config.color)}>
                          {config.label}
                        </span>
                        <span className="text-[13px] text-muted-foreground">
                          {entry.firmwareName} {entry.firmwareVersion}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[13px] text-muted-foreground">
                        {entry.userEmail} from {entry.clientIp}
                      </p>
                      {entry.reason && (
                        <p className="mt-0.5 text-[12px] text-muted-foreground/80 italic">
                          {entry.reason}
                        </p>
                      )}
                      {entry.sha256 && (
                        <p className="mt-1 text-[11px] font-mono text-muted-foreground/70 truncate max-w-md">
                          SHA-256: {entry.sha256}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-[12px] text-muted-foreground whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
