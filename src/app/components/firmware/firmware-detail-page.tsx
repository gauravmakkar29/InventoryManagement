// =============================================================================
// FirmwareDetailPage — Story #388
// /deployment/firmware/:firmwareId — version history + point-in-time timeline
// =============================================================================

import { useState, useMemo } from "react";
import { useParams, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronDown,
  Package,
  FileCheck,
  Hash,
  HardDrive,
  Calendar,
  User,
  ShieldCheck,
  FileText,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApiProvider } from "@/lib/providers/registry";
import { useAuth } from "@/lib/use-auth";
import { getPrimaryRole, canPerformAction } from "@/lib/rbac";
import { queryKeys } from "@/lib/query-keys";
import { FirmwareStateBadge } from "./firmware-lifecycle";
import { VersionTimeline, type TimelineEvent } from "../shared/version-timeline";
import { FirmwareDeployedSitesTab } from "./firmware-deployed-sites-tab";
import { FirmwareActiveLinksTab } from "./firmware-active-links-tab";
import { GenerateDownloadLinkModal } from "./generate-download-link-modal";
import { EVENT_COLOR_MAP } from "@/lib/types/firmware-version";
import type { FirmwareVersion } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DetailTab = "details" | "deployed-sites" | "active-links";

const TABS: { id: DetailTab; label: string }[] = [
  { id: "details", label: "Version Details" },
  { id: "deployed-sites", label: "Deployed Sites" },
  { id: "active-links", label: "Active Links" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function mapVersionEvents(version: FirmwareVersion): TimelineEvent[] {
  return version.events.map((evt) => ({
    id: evt.id,
    type: evt.type,
    label: evt.type.replace(/_/g, " "),
    actor: evt.actor,
    timestamp: evt.timestamp,
    description: evt.description,
    color: EVENT_COLOR_MAP[evt.type],
    metadata: evt.metadata,
  }));
}

// ---------------------------------------------------------------------------
// Compliance status badge
// ---------------------------------------------------------------------------

const COMPLIANCE_STYLES: Record<string, string> = {
  compliant: "bg-success-bg text-success-text",
  "non-compliant": "bg-danger-bg text-danger-text",
  pending: "bg-warning-bg text-warning-text",
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-muted" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Version dropdown
// ---------------------------------------------------------------------------

function VersionDropdown({
  versions,
  selectedId,
  onSelect,
}: {
  versions: FirmwareVersion[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="relative">
      <label htmlFor="version-select" className="sr-only">
        Select firmware version
      </label>
      <select
        id="version-select"
        value={selectedId}
        onChange={(e) => onSelect(e.target.value)}
        className={cn(
          "appearance-none rounded-lg border border-border bg-background px-3 py-2 pr-8",
          "text-[14px] font-medium text-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring",
        )}
      >
        {versions.map((v) => (
          <option key={v.id} value={v.id}>
            v{v.version} — {v.lifecycleState}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Version snapshot panel
// ---------------------------------------------------------------------------

function VersionSnapshot({ version }: { version: FirmwareVersion }) {
  return (
    <div className="space-y-4">
      {/* Lifecycle + Compliance */}
      <div className="flex flex-wrap items-center gap-3">
        <FirmwareStateBadge state={version.lifecycleState} />
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold",
            COMPLIANCE_STYLES[version.complianceStatus],
          )}
        >
          <ShieldCheck className="h-3 w-3" aria-hidden="true" />
          {version.complianceStatus}
        </span>
      </div>

      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetadataItem icon={Package} label="Version" value={`v${version.version}`} />
        <MetadataItem icon={HardDrive} label="File Size" value={formatBytes(version.fileSize)} />
        <MetadataItem icon={Hash} label="Checksum" value={version.checksum.slice(0, 20) + "..."} />
        <MetadataItem icon={Calendar} label="Uploaded" value={formatDate(version.uploadedAt)} />
        <MetadataItem icon={User} label="Uploaded By" value={version.uploadedBy} />
        <MetadataItem
          icon={FileCheck}
          label="Deployed Sites"
          value={String(version.deployedSiteCount)}
        />
      </div>

      {/* Compatible models */}
      <div>
        <p className="mb-1.5 text-[12px] font-medium text-muted-foreground">Compatible Models</p>
        <div className="flex flex-wrap gap-1.5">
          {version.compatibleModels.map((model) => (
            <span
              key={model}
              className="rounded border border-border bg-muted/50 px-2 py-0.5 text-[12px] text-foreground"
            >
              {model}
            </span>
          ))}
        </div>
      </div>

      {/* SBOM/HBOM links */}
      {(version.sbomId || version.hbomId) && (
        <div>
          <p className="mb-1.5 text-[12px] font-medium text-muted-foreground">Bill of Materials</p>
          <div className="flex gap-2">
            {version.sbomId && (
              <span className="inline-flex items-center gap-1 rounded border border-border bg-muted/50 px-2 py-0.5 text-[12px] text-foreground">
                <FileText className="h-3 w-3" aria-hidden="true" />
                SBOM: {version.sbomId}
              </span>
            )}
            {version.hbomId && (
              <span className="inline-flex items-center gap-1 rounded border border-border bg-muted/50 px-2 py-0.5 text-[12px] text-foreground">
                <FileText className="h-3 w-3" aria-hidden="true" />
                HBOM: {version.hbomId}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Release notes */}
      <div>
        <p className="mb-1 text-[12px] font-medium text-muted-foreground">Release Notes</p>
        <p className="text-[14px] text-foreground">{version.releaseNotes}</p>
      </div>
    </div>
  );
}

function MetadataItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="truncate text-[13px] font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export function FirmwareDetailPage() {
  const { firmwareId } = useParams<{ firmwareId: string }>();
  const api = useApiProvider();
  const { user } = useAuth();
  const role = getPrimaryRole(user?.groups ?? []);
  const canGenerate = canPerformAction(role, "create"); // AC-3: Admin/Manager only
  const [activeTab, setActiveTab] = useState<DetailTab>("details");
  const [generateModalOpen, setGenerateModalOpen] = useState(false);

  // Fetch versions for this family
  const { data: versionsResponse, isLoading } = useQuery({
    queryKey: queryKeys.firmwareFamilies.versions(firmwareId ?? ""),
    queryFn: () => api.listFirmwareVersions(firmwareId ?? ""),
    enabled: !!firmwareId,
  });

  const versions = useMemo(() => {
    const items = versionsResponse?.items ?? [];
    // Sort by version descending (latest first)
    return [...items].sort((a, b) =>
      b.version.localeCompare(a.version, undefined, { numeric: true }),
    );
  }, [versionsResponse]);

  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const selectedVersion = useMemo(() => {
    if (!versions.length) return null;
    const id = selectedVersionId || versions[0]?.id;
    return versions.find((v) => v.id === id) ?? versions[0];
  }, [versions, selectedVersionId]);

  const timelineEvents = useMemo(
    () => (selectedVersion ? mapVersionEvents(selectedVersion) : []),
    [selectedVersion],
  );

  if (!firmwareId) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No firmware family specified.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link + header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/deployment"
            className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Deployment
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-[20px] font-semibold text-foreground">Firmware Version History</h1>
        </div>

        <div className="flex items-center gap-3">
          {versions.length > 0 && selectedVersion && (
            <VersionDropdown
              versions={versions}
              selectedId={selectedVersion.id}
              onSelect={setSelectedVersionId}
            />
          )}

          {/* AC-3: Generate Download Link — Admin/Manager only (#391) */}
          {canGenerate && selectedVersion && (
            <button
              type="button"
              onClick={() => setGenerateModalOpen(true)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2",
                "text-[14px] font-medium text-primary-foreground",
                "hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring",
              )}
            >
              <Link2 className="h-4 w-4" />
              Generate Link
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && <DetailSkeleton />}

      {/* Empty state */}
      {!isLoading && versions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-[14px] font-medium text-foreground">No versions found</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            This firmware family has no version records yet.
          </p>
        </div>
      )}

      {/* Content area */}
      {!isLoading && selectedVersion && (
        <>
          {/* Tab bar */}
          <div className="flex gap-1 border-b border-border" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2 text-[14px] font-medium transition-colors",
                  activeTab === tab.id
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "details" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Left: Version snapshot */}
              <div className="card-elevated rounded-xl p-5">
                <h2 className="mb-4 text-[16px] font-semibold text-foreground">
                  v{selectedVersion.version}
                </h2>
                <VersionSnapshot version={selectedVersion} />
              </div>

              {/* Right: Timeline */}
              <div className="card-elevated rounded-xl p-5">
                <h2 className="mb-4 text-[16px] font-semibold text-foreground">
                  Lifecycle Timeline
                </h2>
                <VersionTimeline events={timelineEvents} />
              </div>
            </div>
          )}

          {activeTab === "deployed-sites" && (
            <FirmwareDeployedSitesTab firmwareVersionId={selectedVersion.id} />
          )}

          {activeTab === "active-links" && (
            <FirmwareActiveLinksTab
              firmwareId={firmwareId ?? ""}
              onGenerateClick={() => setGenerateModalOpen(true)}
              canGenerate={canGenerate}
            />
          )}
        </>
      )}

      {/* Generate Download Link Modal (#391 AC2/AC3) */}
      <GenerateDownloadLinkModal
        open={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        firmwareId={selectedVersion?.id}
      />
    </div>
  );
}
