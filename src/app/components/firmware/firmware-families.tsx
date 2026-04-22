/**
 * Firmware Families — Story 26.1 (#354)
 *
 * Groups firmware versions under product lines for organized distribution.
 * RBAC: Admin/Manager can create/edit families; Viewer/Technician read-only.
 */

import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router";
import { Package, Plus, ChevronRight, Layers, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/use-auth";
import { getPrimaryRole, canPerformAction } from "@/lib/rbac";
import { EmptyState } from "@/components/empty-state";
import { DialogBase } from "@/components/dialog-base";
import { FirmwareStateBadge } from "./firmware-lifecycle";
import type { FirmwareFamily, Firmware, FirmwareLifecycleState } from "@/lib/types";

// ---------------------------------------------------------------------------
// Mock data (replaced by API in production)
// ---------------------------------------------------------------------------

const MOCK_FAMILIES: FirmwareFamily[] = [
  {
    id: "fam-1",
    name: "SG-3600 Inverter Series",
    description: "Firmware for SG-3600 residential string inverters",
    targetModels: ["SG-3600", "SG-3600-S"],
    createdBy: "admin@company.com",
    createdAt: "2026-01-15T10:00:00Z",
    versionCount: 4,
    latestVersion: "4.2.0",
    latestActiveVersion: "4.1.2",
  },
  {
    id: "fam-2",
    name: "SG-5000 Commercial",
    description: "Firmware for SG-5000 commercial inverter line",
    targetModels: ["SG-5000", "SG-5000D"],
    createdBy: "admin@company.com",
    createdAt: "2026-02-01T08:30:00Z",
    versionCount: 2,
    latestVersion: "3.0.1",
    latestActiveVersion: "3.0.0",
  },
  {
    id: "fam-3",
    name: "BESS Controller",
    description: "Battery energy storage system controller firmware",
    targetModels: ["SBR-096", "SBR-128", "SBR-256"],
    createdBy: "admin@company.com",
    createdAt: "2026-03-10T14:00:00Z",
    versionCount: 0,
  },
];

const MOCK_FIRMWARE_BY_FAMILY: Record<
  string,
  Array<Firmware & { lifecycleState: FirmwareLifecycleState }>
> = {
  "fam-1": [
    {
      id: "fw-101",
      version: "4.2.0",
      name: "SG-3600 v4.2.0",
      status: "uploaded" as Firmware["status"],
      approvalStage: "uploaded" as Firmware["approvalStage"],
      releaseNotes: "Security patches",
      fileSize: 15_200_000,
      checksum: "sha256:abc123",
      uploadedBy: "engineer@company.com",
      uploadedAt: "2026-03-28T10:00:00Z",
      compatibleModels: ["SG-3600"],
      targetDeviceCount: 0,
      deployedDeviceCount: 0,
      familyId: "fam-1",
      lifecycleState: "SCREENING" as FirmwareLifecycleState,
    },
    {
      id: "fw-100",
      version: "4.1.2",
      name: "SG-3600 v4.1.2",
      status: "approved" as Firmware["status"],
      approvalStage: "approved" as Firmware["approvalStage"],
      releaseNotes: "Grid stability improvements",
      fileSize: 14_800_000,
      checksum: "sha256:def456",
      uploadedBy: "engineer@company.com",
      uploadedAt: "2026-03-01T09:00:00Z",
      approvedBy: "admin@company.com",
      approvedAt: "2026-03-05T16:00:00Z",
      compatibleModels: ["SG-3600"],
      targetDeviceCount: 1200,
      deployedDeviceCount: 890,
      familyId: "fam-1",
      lifecycleState: "ACTIVE" as FirmwareLifecycleState,
    },
  ],
  "fam-2": [
    {
      id: "fw-200",
      version: "3.0.1",
      name: "SG-5000 v3.0.1",
      status: "testing" as Firmware["status"],
      approvalStage: "testing" as Firmware["approvalStage"],
      releaseNotes: "MPPT optimization",
      fileSize: 22_400_000,
      checksum: "sha256:ghi789",
      uploadedBy: "engineer@company.com",
      uploadedAt: "2026-03-20T11:00:00Z",
      compatibleModels: ["SG-5000"],
      targetDeviceCount: 0,
      deployedDeviceCount: 0,
      familyId: "fam-2",
      lifecycleState: "STAGED" as FirmwareLifecycleState,
    },
  ],
};

const AVAILABLE_MODELS = [
  "SG-3600",
  "SG-3600-S",
  "SG-5000",
  "SG-5000D",
  "SG-8000",
  "SG-10000",
  "SBR-096",
  "SBR-128",
  "SBR-256",
];

// ---------------------------------------------------------------------------
// Family list
// ---------------------------------------------------------------------------

export function FirmwareFamiliesTab() {
  const { groups } = useAuth();
  const role = getPrimaryRole(groups);
  const canCreate = canPerformAction(role, "create");

  const [families] = useState(MOCK_FAMILIES);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-foreground">Firmware Families</h3>
          <p className="text-[14px] text-muted-foreground">{families.length} product lines</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[14px] font-medium text-white hover:bg-accent-hover cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Family
          </button>
        )}
      </div>

      {/* Family cards */}
      {families.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No firmware families"
          description="Create a firmware family to organize versions by product line."
          action={
            canCreate
              ? { label: "Create Family", onClick: () => setShowCreateModal(true) }
              : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {families.map((family) => (
            <FirmwareFamilyCard
              key={family.id}
              family={family}
              expanded={expandedId === family.id}
              onToggle={() => toggleExpand(family.id)}
              firmware={MOCK_FIRMWARE_BY_FAMILY[family.id] ?? []}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <CreateFirmwareFamilyModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(data) => {
            toast.success(`Family "${data.name}" created`);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Family card (expandable)
// ---------------------------------------------------------------------------

function FirmwareFamilyCard({
  family,
  expanded,
  onToggle,
  firmware,
}: {
  family: FirmwareFamily;
  expanded: boolean;
  onToggle: () => void;
  firmware: Array<Firmware & { lifecycleState: FirmwareLifecycleState }>;
}) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Summary row */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <ChevronRight
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-150 shrink-0",
            expanded && "rotate-90",
          )}
        />
        <Package className="h-5 w-5 text-accent-text shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-foreground truncate">{family.name}</p>
          <p className="text-[13px] text-muted-foreground truncate">{family.description}</p>
        </div>
        <div className="flex items-center gap-4 shrink-0 text-[13px] text-muted-foreground">
          <span>{family.versionCount} versions</span>
          <span className="font-mono">{family.targetModels.join(", ")}</span>
          {family.latestActiveVersion && (
            <span className="rounded bg-success-bg px-2 py-0.5 text-[12px] font-medium text-success-text">
              v{family.latestActiveVersion}
            </span>
          )}
        </div>
      </button>

      {/* Expanded: version list */}
      {expanded && (
        <div className="border-t border-border bg-muted/20 px-4 py-3">
          {firmware.length === 0 ? (
            <p className="py-4 text-center text-[14px] text-muted-foreground">
              No firmware versions yet. Upload the first version to get started.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Versions (newest first)
              </p>
              {firmware.map((fw) => (
                <div
                  key={fw.id}
                  className="flex items-center justify-between rounded border border-border/60 bg-card px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] font-mono font-medium text-foreground">
                      v{fw.version}
                    </span>
                    <FirmwareStateBadge state={fw.lifecycleState} />
                  </div>
                  <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
                    <span>{(fw.fileSize / 1_000_000).toFixed(1)} MB</span>
                    <span>{new Date(fw.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 flex justify-end border-t border-border/60 pt-3">
            <Link
              to={`/deployment/firmware/${family.id}`}
              className="inline-flex items-center gap-1 text-[13px] font-medium text-accent-text hover:underline"
              aria-label={`View full version history and compliance artifacts for ${family.name}`}
            >
              View version history & compliance
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create family modal
// ---------------------------------------------------------------------------

function CreateFirmwareFamilyModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: { name: string; description: string; targetModels: string[] }) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  const toggleModel = useCallback((model: string) => {
    setSelectedModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model],
    );
  }, []);

  const isValid = useMemo(
    () => name.trim().length > 0 && selectedModels.length > 0,
    [name, selectedModels],
  );

  const handleSubmit = () => {
    if (!isValid) {
      toast.error("Name and at least one target model are required");
      return;
    }
    onCreate({ name: name.trim(), description: description.trim(), targetModels: selectedModels });
  };

  return (
    <DialogBase
      title="Create Firmware Family"
      open={true}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-[14px] font-medium text-muted-foreground hover:bg-muted cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={cn(
              "rounded-lg px-4 py-1.5 text-[14px] font-medium text-white cursor-pointer",
              isValid ? "bg-accent hover:bg-accent-hover" : "bg-muted cursor-not-allowed",
            )}
          >
            Create Family
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label
            htmlFor="family-name"
            className="block text-[13px] font-semibold text-foreground mb-1"
          >
            Family Name <span className="text-danger-text">*</span>
          </label>
          <input
            id="family-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., SG-3600 Inverter Series"
            maxLength={100}
            className="w-full rounded border border-border bg-card px-2.5 py-1.5 text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="family-desc"
            className="block text-[13px] font-semibold text-foreground mb-1"
          >
            Description
          </label>
          <textarea
            id="family-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this firmware family..."
            maxLength={500}
            rows={2}
            className="w-full rounded border border-border bg-card px-2.5 py-1.5 text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
          />
        </div>

        {/* Target models */}
        <div>
          <p className="text-[13px] font-semibold text-foreground mb-2">
            Target Device Models <span className="text-danger-text">*</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_MODELS.map((model) => {
              const selected = selectedModels.includes(model);
              return (
                <button
                  key={model}
                  onClick={() => toggleModel(model)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-[13px] font-medium transition-colors cursor-pointer",
                    selected
                      ? "border-accent bg-accent/10 text-accent-text"
                      : "border-border text-muted-foreground hover:border-accent/50 hover:text-foreground",
                  )}
                >
                  {model}
                </button>
              );
            })}
          </div>
          {selectedModels.length === 0 && (
            <p className="mt-1 text-[13px] text-danger-text">Select at least one model</p>
          )}
        </div>
      </div>
    </DialogBase>
  );
}
