import { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link2, Copy, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/use-auth";
import { DialogBase } from "@/components/dialog-base";
import { generateTokenSchema, type GenerateTokenInput } from "@/lib/schemas/download-token.schema";

// ---------------------------------------------------------------------------
// Mock data — technicians and firmware for picker dropdowns
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
// Props
// ---------------------------------------------------------------------------

interface GenerateDownloadLinkModalProps {
  open: boolean;
  onClose: () => void;
  /** Pre-selected firmware ID (optional, e.g. from firmware list context) */
  firmwareId?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Modal for generating a one-time download link for firmware distribution.
 *
 * NIST controls:
 * - AC-3  — Only Admin/Manager can generate tokens (RBAC enforced at caller)
 * - AC-5  — Separation of duties: generator !== recipient
 * - SI-10 — Zod schema validates all inputs
 * - AU-12 — Token creation logged (audit trail)
 *
 * @see Story 26.4 (#357)
 */
export function GenerateDownloadLinkModal({
  open,
  onClose,
  firmwareId: preselectedFirmwareId,
}: GenerateDownloadLinkModalProps) {
  const { user } = useAuth();
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GenerateTokenInput>({
    resolver: zodResolver(generateTokenSchema),
    defaultValues: {
      firmwareId: preselectedFirmwareId ?? "",
      userId: "",
      expiresInHours: 24,
    },
  });

  const selectedUserId = watch("userId");

  // AC-5: Separation of duties — generator cannot be the recipient
  const isSelfAssign = useMemo(() => {
    if (!user || !selectedUserId) return false;
    return user.id === selectedUserId;
  }, [user, selectedUserId]);

  const onSubmit = async (data: GenerateTokenInput) => {
    if (isSelfAssign) {
      toast.error("Separation of duties: you cannot generate a download link for yourself");
      return;
    }

    // Mock token generation — create UUID v4
    const guid = crypto.randomUUID();
    const url = `https://app.example.com/download/${guid}`;

    // Simulate API latency
    await new Promise((resolve) => setTimeout(resolve, 400));

    setGeneratedUrl(url);
    toast.success("Download link generated successfully");

    // AU-12: In production this would log to audit trail
    // auditLog.addEntry({ action: "Created", resourceType: "DownloadToken", ... })

    const selectedTech = MOCK_TECHNICIANS.find((t) => t.id === data.userId);
    const selectedFw = MOCK_FIRMWARE.find((f) => f.id === data.firmwareId);
    if (selectedTech && selectedFw) {
      toast.info(
        `Token for ${selectedTech.name} — ${selectedFw.name} ${selectedFw.version} — expires in ${data.expiresInHours}h`,
      );
    }
  };

  const handleCopy = async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy — please copy manually");
    }
  };

  const handleClose = () => {
    setGeneratedUrl(null);
    setCopied(false);
    reset();
    onClose();
  };

  return (
    <DialogBase
      title="Generate Secure Download Link"
      open={open}
      onClose={handleClose}
      size="lg"
      footer={
        !generatedUrl ? (
          <>
            <button
              onClick={handleClose}
              className="rounded border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground/80 hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting || isSelfAssign}
              className={cn(
                "flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-semibold text-white transition-colors",
                isSelfAssign
                  ? "bg-muted-foreground/40 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700",
              )}
            >
              <Link2 className="h-3.5 w-3.5" />
              {isSubmitting ? "Generating..." : "Generate Link"}
            </button>
          </>
        ) : (
          <button
            onClick={handleClose}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        )
      }
    >
      {!generatedUrl ? (
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {/* Firmware picker */}
          <div>
            <label htmlFor="firmwareId" className="block text-sm font-medium text-foreground mb-1">
              Firmware
            </label>
            <Controller
              name="firmwareId"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  id="firmwareId"
                  className={cn(
                    "w-full rounded border bg-card px-3 py-2 text-sm text-foreground",
                    errors.firmwareId ? "border-red-500" : "border-border",
                  )}
                >
                  <option value="">Select firmware...</option>
                  {MOCK_FIRMWARE.map((fw) => (
                    <option key={fw.id} value={fw.id}>
                      {fw.name} — {fw.version}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.firmwareId && (
              <p className="mt-1 text-xs text-red-500">{errors.firmwareId.message}</p>
            )}
          </div>

          {/* Technician picker */}
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-foreground mb-1">
              Recipient Technician
            </label>
            <Controller
              name="userId"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  id="userId"
                  className={cn(
                    "w-full rounded border bg-card px-3 py-2 text-sm text-foreground",
                    errors.userId ? "border-red-500" : "border-border",
                  )}
                >
                  <option value="">Select technician...</option>
                  {MOCK_TECHNICIANS.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name} ({tech.email})
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.userId && <p className="mt-1 text-xs text-red-500">{errors.userId.message}</p>}
            {isSelfAssign && (
              <p className="mt-1 flex items-center gap-1 text-xs text-amber-500">
                <AlertTriangle className="h-3 w-3" />
                AC-5: You cannot generate a link for yourself (separation of duties)
              </p>
            )}
          </div>

          {/* Expiration picker */}
          <div>
            <label
              htmlFor="expiresInHours"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Link Expiration
            </label>
            <Controller
              name="expiresInHours"
              control={control}
              render={({ field }) => (
                <select
                  id="expiresInHours"
                  value={String(field.value)}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="w-full rounded border border-border bg-card px-3 py-2 text-sm text-foreground"
                >
                  {EXPIRATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.expiresInHours && (
              <p className="mt-1 text-xs text-red-500">{errors.expiresInHours.message}</p>
            )}
          </div>
        </form>
      ) : (
        /* Generated URL display */
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Secure download link generated. Share this with the designated technician. The link is
            single-use and time-limited.
          </p>
          <div className="flex items-center gap-2 rounded border border-border bg-muted/50 px-3 py-2">
            <code className="flex-1 truncate text-xs text-foreground">{generatedUrl}</code>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
              aria-label="Copy download link"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            This link will expire according to the selected duration. Once used, it cannot be
            reused.
          </p>
        </div>
      )}
    </DialogBase>
  );
}
