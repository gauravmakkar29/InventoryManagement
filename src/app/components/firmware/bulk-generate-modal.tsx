/**
 * Bulk Generate Download Links Modal — Story 26.7 (#360)
 *
 * Allows admins/managers to generate multiple one-time download links
 * for selected technicians in a single operation.
 *
 * NIST controls:
 * - AC-3/AC-6 — RBAC enforced at caller (DownloadLinksTab)
 * - AC-5     — Separation of duties: generator !== recipients
 * - SI-10    — Validates firmware and technician selections
 * - AU-12    — Bulk token creation logged (mock)
 */

import { useState, useMemo } from "react";
import { Link2, Copy, Check, Users, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/use-auth";
import { DialogBase } from "@/components/dialog-base";

// ---------------------------------------------------------------------------
// Mock data — same source as generate-download-link-modal
// ---------------------------------------------------------------------------

interface TechnicianOption {
  id: string;
  email: string;
  name: string;
}

interface FirmwareOption {
  id: string;
  name: string;
  version: string;
}

const MOCK_TECHNICIANS: TechnicianOption[] = [
  { id: "u-tech-01", email: "tech.jones@example.com", name: "Alex Jones" },
  { id: "u-tech-02", email: "tech.garcia@example.com", name: "Maria Garcia" },
  { id: "u-tech-03", email: "tech.lee@example.com", name: "David Lee" },
];

const MOCK_FIRMWARE: FirmwareOption[] = [
  { id: "fw-001", name: "INV-3200 Controller", version: "v4.1.0" },
  { id: "fw-002", name: "INV-3100 Gateway", version: "v3.8.2" },
  { id: "fw-003", name: "SG-RT600 Router Module", version: "v2.0.1" },
];

const EXPIRATION_OPTIONS = [
  { label: "1 hour", value: 1 },
  { label: "4 hours", value: 4 },
  { label: "24 hours", value: 24 },
  { label: "72 hours", value: 72 },
  { label: "7 days", value: 168 },
] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GeneratedLink {
  technicianName: string;
  technicianEmail: string;
  url: string;
}

interface BulkGenerateModalProps {
  open: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BulkGenerateModal({ open, onClose }: BulkGenerateModalProps) {
  const { user } = useAuth();

  // Form state
  const [selectedFirmwareId, setSelectedFirmwareId] = useState("");
  const [selectedTechIds, setSelectedTechIds] = useState<Set<string>>(new Set());
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [isGenerating, setIsGenerating] = useState(false);

  // Results state
  const [generatedLinks, setGeneratedLinks] = useState<GeneratedLink[]>([]);
  const [allCopied, setAllCopied] = useState(false);

  // AC-5: Filter out current user from technician list (separation of duties)
  const availableTechnicians = useMemo(() => {
    if (!user) return MOCK_TECHNICIANS;
    return MOCK_TECHNICIANS.filter((t) => t.id !== user.id);
  }, [user]);

  // Validation
  const selfSelected = useMemo(() => {
    if (!user) return false;
    return selectedTechIds.has(user.id);
  }, [user, selectedTechIds]);

  const canGenerate =
    selectedFirmwareId !== "" && selectedTechIds.size > 0 && !selfSelected && !isGenerating;

  // Toggle technician selection
  const toggleTechnician = (techId: string) => {
    setSelectedTechIds((prev) => {
      const next = new Set(prev);
      if (next.has(techId)) {
        next.delete(techId);
      } else {
        next.add(techId);
      }
      return next;
    });
  };

  // Select/deselect all
  const toggleAll = () => {
    if (selectedTechIds.size === availableTechnicians.length) {
      setSelectedTechIds(new Set());
    } else {
      setSelectedTechIds(new Set(availableTechnicians.map((t) => t.id)));
    }
  };

  // Generate links
  const handleGenerate = async () => {
    if (!canGenerate) return;

    setIsGenerating(true);

    // Simulate API latency
    await new Promise((resolve) => setTimeout(resolve, 600));

    const links: GeneratedLink[] = [];
    for (const techId of selectedTechIds) {
      const tech = MOCK_TECHNICIANS.find((t) => t.id === techId);
      if (tech) {
        const guid = crypto.randomUUID();
        links.push({
          technicianName: tech.name,
          technicianEmail: tech.email,
          url: `https://app.example.com/download/${guid}`,
        });
      }
    }

    setGeneratedLinks(links);
    setIsGenerating(false);

    const fw = MOCK_FIRMWARE.find((f) => f.id === selectedFirmwareId);
    toast.success(
      `Generated ${links.length} download link${links.length !== 1 ? "s" : ""} for ${fw?.name ?? "firmware"}`,
    );

    // AU-12: In production this would batch-log to audit trail
  };

  // Copy all URLs
  const handleCopyAll = async () => {
    const urls = generatedLinks.map((l) => `${l.technicianEmail}: ${l.url}`).join("\n");
    try {
      await navigator.clipboard.writeText(urls);
      setAllCopied(true);
      toast.success(`${generatedLinks.length} links copied to clipboard`);
      setTimeout(() => setAllCopied(false), 2000);
    } catch {
      toast.error("Failed to copy -- please copy manually");
    }
  };

  // Reset and close
  const handleClose = () => {
    setSelectedFirmwareId("");
    setSelectedTechIds(new Set());
    setExpiresInHours(24);
    setGeneratedLinks([]);
    setAllCopied(false);
    setIsGenerating(false);
    onClose();
  };

  const hasResults = generatedLinks.length > 0;

  return (
    <DialogBase
      title="Bulk Generate Download Links"
      open={open}
      onClose={handleClose}
      size="xl"
      footer={
        !hasResults ? (
          <>
            <button
              onClick={handleClose}
              className="rounded border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground/80 hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={cn(
                "flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-semibold text-white transition-colors cursor-pointer",
                canGenerate
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-muted-foreground/40 cursor-not-allowed",
              )}
            >
              <Link2 className="h-3.5 w-3.5" />
              {isGenerating
                ? "Generating..."
                : `Generate ${selectedTechIds.size} Link${selectedTechIds.size !== 1 ? "s" : ""}`}
            </button>
          </>
        ) : (
          <button
            onClick={handleClose}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Done
          </button>
        )
      }
    >
      {!hasResults ? (
        <div className="space-y-4">
          {/* Firmware picker */}
          <div>
            <label
              htmlFor="bulk-firmware"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Firmware
            </label>
            <select
              id="bulk-firmware"
              value={selectedFirmwareId}
              onChange={(e) => setSelectedFirmwareId(e.target.value)}
              className={cn(
                "w-full rounded border bg-card px-3 py-2 text-sm text-foreground",
                !selectedFirmwareId ? "border-border" : "border-border",
              )}
            >
              <option value="">Select firmware...</option>
              {MOCK_FIRMWARE.map((fw) => (
                <option key={fw.id} value={fw.id}>
                  {fw.name} -- {fw.version}
                </option>
              ))}
            </select>
          </div>

          {/* Technician multi-select */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-foreground">Technicians</label>
              <button
                onClick={toggleAll}
                className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                {selectedTechIds.size === availableTechnicians.length
                  ? "Deselect all"
                  : "Select all"}
              </button>
            </div>
            <div className="rounded border border-border bg-card divide-y divide-border">
              {availableTechnicians.map((tech) => (
                <label
                  key={tech.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTechIds.has(tech.id)}
                    onChange={() => toggleTechnician(tech.id)}
                    className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{tech.name}</span>
                    <span className="text-xs text-muted-foreground">{tech.email}</span>
                  </div>
                </label>
              ))}
            </div>
            {selfSelected && (
              <p className="mt-1 flex items-center gap-1 text-xs text-amber-500">
                <AlertTriangle className="h-3 w-3" />
                AC-5: You cannot generate a link for yourself (separation of duties)
              </p>
            )}
            {availableTechnicians.length === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                No technicians available (separation of duties filter applied).
              </p>
            )}
          </div>

          {/* Expiration picker */}
          <div>
            <label
              htmlFor="bulk-expiration"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Link Expiration
            </label>
            <select
              id="bulk-expiration"
              value={String(expiresInHours)}
              onChange={(e) => setExpiresInHours(Number(e.target.value))}
              className="w-full rounded border border-border bg-card px-3 py-2 text-sm text-foreground"
            >
              {EXPIRATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        /* Results display */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {generatedLinks.length} link{generatedLinks.length !== 1 ? "s" : ""} generated
              successfully.
            </p>
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors cursor-pointer"
            >
              {allCopied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied All
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy All
                </>
              )}
            </button>
          </div>

          <div className="rounded border border-border bg-card divide-y divide-border max-h-60 overflow-y-auto">
            {generatedLinks.map((link) => (
              <div key={link.url} className="px-3 py-2 space-y-0.5">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{link.technicianName}</span>
                  <span className="text-xs text-muted-foreground">{link.technicianEmail}</span>
                </div>
                <code className="block truncate text-xs text-muted-foreground">{link.url}</code>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Links will expire according to the selected duration. Each link is single-use.
          </p>
        </div>
      )}
    </DialogBase>
  );
}
