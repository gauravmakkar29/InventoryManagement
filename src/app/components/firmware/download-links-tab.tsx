/**
 * Admin Download Link Management Tab — Story 26.7 (#360)
 *
 * Dashboard for admins/managers to view, filter, copy, and revoke
 * firmware download tokens (one-time links for technicians).
 *
 * NIST controls:
 * - AC-3/AC-6 — RBAC: Admin and Manager only (canPerformAction check)
 * - AC-5     — Separation of duties enforced via GenerateDownloadLinkModal
 * - SI-10    — Search input sanitized, no raw query params
 * - AU-6     — Revocation logged to audit trail (mock)
 */

import { useState, useMemo, useCallback } from "react";
import { Link2, Copy, Check, Ban, LinkIcon, Users, Search, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatRelativeTime, formatDateTime } from "@/lib/utils";
import { DataTable } from "@/components/data-table";
import type { DataTableColumn } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/lib/use-auth";
import { getPrimaryRole, canPerformAction } from "@/lib/rbac";
import type { Role } from "@/lib/rbac";
import type { DownloadToken } from "@/lib/types";
import { MOCK_DOWNLOAD_TOKENS } from "@/lib/mock-data/download-token-data";
import { GenerateDownloadLinkModal } from "./generate-download-link-modal";
import { BulkGenerateModal } from "./bulk-generate-modal";

// ---------------------------------------------------------------------------
// Token status display configuration
// ---------------------------------------------------------------------------

type TokenStatus = DownloadToken["status"];

const TOKEN_STATUS_STYLES: Record<TokenStatus, { label: string; classes: string }> = {
  active: {
    label: "Active",
    classes: "bg-blue-100 text-blue-700 border border-blue-200",
  },
  consumed: {
    label: "Consumed",
    classes: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  },
  expired: {
    label: "Expired",
    classes: "bg-muted text-muted-foreground border border-border",
  },
  revoked: {
    label: "Revoked",
    classes: "bg-red-50 text-red-700 border border-red-200",
  },
};

const STATUS_FILTER_OPTIONS: { label: string; value: TokenStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Consumed", value: "consumed" },
  { label: "Expired", value: "expired" },
  { label: "Revoked", value: "revoked" },
];

// ---------------------------------------------------------------------------
// TokenStatusBadge (internal — token-specific colors per story spec)
// ---------------------------------------------------------------------------

function TokenStatusBadge({ status }: { status: TokenStatus }) {
  const config = TOKEN_STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium",
        config.classes,
      )}
    >
      {config.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// CopyButton (internal)
// ---------------------------------------------------------------------------

function CopyButton({ tokenGuid }: { tokenGuid: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `https://app.example.com/download/${tokenGuid}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Download link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy -- please copy manually");
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors cursor-pointer"
      aria-label="Copy download URL"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy URL
        </>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DownloadLinksTab() {
  const { user } = useAuth();
  const role: Role = getPrimaryRole(user?.groups ?? []);
  const canCreate = canPerformAction(role, "create");

  // State
  const [tokens, setTokens] = useState<DownloadToken[]>(MOCK_DOWNLOAD_TOKENS);
  const [statusFilter, setStatusFilter] = useState<TokenStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [revokeConfirmId, setRevokeConfirmId] = useState<string | null>(null);

  // Filtered data
  const filteredTokens = useMemo(() => {
    let result = tokens;

    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((t) => t.userEmail.toLowerCase().includes(q));
    }

    return result;
  }, [tokens, statusFilter, searchQuery]);

  // Revoke handler
  const handleRevoke = useCallback((tokenId: string) => {
    setTokens((prev) =>
      prev.map((t) => (t.id === tokenId ? { ...t, status: "revoked" as const } : t)),
    );
    setRevokeConfirmId(null);
    toast.success("Download link revoked successfully");

    // AU-6: In production this would log to audit trail
    // auditLog.addEntry({ action: "Revoked", resourceType: "DownloadToken", resourceId: tokenId, userId: user?.id })
  }, []);

  // Column definitions
  const columns: DataTableColumn<DownloadToken>[] = useMemo(
    () => [
      {
        key: "firmware",
        header: "Firmware",
        sortable: true,
        cell: (row) => (
          <div>
            <span className="text-sm font-medium text-foreground">{row.firmwareName}</span>
            <span className="ml-1.5 text-xs text-muted-foreground">{row.firmwareVersion}</span>
          </div>
        ),
      },
      {
        key: "technician",
        header: "Technician",
        sortable: true,
        cell: (row) => <span className="text-sm text-foreground">{row.userEmail}</span>,
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => <TokenStatusBadge status={row.status} />,
      },
      {
        key: "createdAt",
        header: "Created",
        sortable: true,
        cell: (row) => (
          <span className="text-sm text-muted-foreground">{formatRelativeTime(row.createdAt)}</span>
        ),
      },
      {
        key: "expiresAt",
        header: "Expires",
        sortable: true,
        cell: (row) => (
          <span className="text-sm text-muted-foreground">{formatDateTime(row.expiresAt)}</span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "right" as const,
        cell: (row) => (
          <div className="flex items-center justify-end gap-1">
            <CopyButton tokenGuid={row.tokenGuid} />
            {row.status === "active" && (
              <>
                {revokeConfirmId === row.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRevoke(row.id)}
                      className="rounded px-2 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setRevokeConfirmId(null)}
                      className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setRevokeConfirmId(row.id)}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors cursor-pointer"
                    aria-label={`Revoke download link for ${row.userEmail}`}
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Revoke
                  </button>
                )}
              </>
            )}
          </div>
        ),
      },
    ],
    [revokeConfirmId, handleRevoke],
  );

  // RBAC guard — only Admin/Manager
  if (!canCreate) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <EmptyState
          icon={Ban}
          title="Access Denied"
          description="You do not have permission to manage download links. Admin or Manager role required."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-blue-600" />
          <h2 className="text-[15px] font-semibold text-foreground">Download Links</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[12px] font-medium text-muted-foreground">
            {filteredTokens.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBulkModalOpen(true)}
            className="flex items-center gap-1.5 rounded border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground/80 hover:bg-muted transition-colors cursor-pointer"
          >
            <Users className="h-3.5 w-3.5" />
            Bulk Generate
          </button>
          <button
            onClick={() => setGenerateModalOpen(true)}
            className="flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Link2 className="h-3.5 w-3.5" />
            Generate Link
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TokenStatus | "all")}
          className="rounded border border-border bg-card px-3 py-1.5 text-sm text-foreground"
          aria-label="Filter by status"
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Search by email */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by email..."
            className="w-full rounded border border-border bg-card pl-8 pr-8 py-1.5 text-sm text-foreground placeholder:text-muted-foreground"
            aria-label="Search tokens by technician email"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card">
        <DataTable<DownloadToken>
          columns={columns}
          data={filteredTokens}
          keyExtractor={(row) => row.id}
          caption="Firmware download tokens"
          empty={{
            icon: LinkIcon,
            title: "No download links",
            description:
              statusFilter !== "all" || searchQuery
                ? "No tokens match the current filters."
                : "Generate a download link to share firmware with technicians.",
          }}
        />
      </div>

      {/* Generate single link modal */}
      <GenerateDownloadLinkModal
        open={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
      />

      {/* Bulk generate modal */}
      <BulkGenerateModal open={bulkModalOpen} onClose={() => setBulkModalOpen(false)} />
    </div>
  );
}
