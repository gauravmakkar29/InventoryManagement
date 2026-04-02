import { useState } from "react";
import { X, Download } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";
import type { ComplianceItem } from "../../../lib/mock-data/compliance-data";
import {
  CERT_TYPES,
  downloadFile,
  generateCSV,
  generateJSON,
} from "../../../lib/mock-data/compliance-data";

// =============================================================================
// Modal Overlay
// =============================================================================

export function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 mx-4">{children}</div>
    </div>
  );
}

// =============================================================================
// Confirm Dialog
// =============================================================================

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmClass,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ModalOverlay onClose={onCancel}>
      <div className="w-full max-w-sm rounded-lg bg-card shadow-xl border border-border">
        <div className="p-5 space-y-3">
          <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button
            onClick={onCancel}
            className="rounded border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground/80 hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "rounded px-3 py-1.5 text-sm font-semibold text-white transition-colors",
              confirmClass,
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// =============================================================================
// Submit for Review Modal
// =============================================================================

export interface SubmitFormData {
  firmwareVersion: string;
  deviceModel: string;
  certification: string;
}

export function SubmitForReviewModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: SubmitFormData) => void;
}) {
  const [firmware, setFirmware] = useState("");
  const [model, setModel] = useState("");
  const [cert, setCert] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    if (!firmware.trim()) newErrors.firmware = "Firmware version is required";
    if (!model.trim()) newErrors.model = "Device model is required";
    if (!cert.trim()) newErrors.certification = "Certification is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({ firmwareVersion: firmware, deviceModel: model, certification: cert });
  };

  const inputClass =
    "w-full rounded border border-border bg-card px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-accent-text";

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-md rounded-lg bg-card shadow-xl border border-border">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-[15px] font-semibold text-foreground">
            Submit Compliance Item for Review
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label
              htmlFor="comp-firmware"
              className="mb-1 block text-[13px] font-semibold text-foreground/80"
            >
              Firmware Version <span className="text-red-500">*</span>
            </label>
            <select
              id="comp-firmware"
              value={firmware}
              onChange={(e) => {
                setFirmware(e.target.value);
                setErrors((prev) => ({ ...prev, firmware: "" }));
              }}
              className={inputClass}
            >
              <option value="">Select firmware version</option>
              <option value="v4.0.0">v4.0.0</option>
              <option value="v3.2.1">v3.2.1</option>
              <option value="v3.1.0">v3.1.0</option>
              <option value="v2.8.5">v2.8.5</option>
            </select>
            {errors.firmware && (
              <p className="mt-0.5 text-[12px] text-red-600" role="alert">
                {errors.firmware}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="comp-device-model"
              className="mb-1 block text-[13px] font-semibold text-foreground/80"
            >
              Device Model <span className="text-red-500">*</span>
            </label>
            <select
              id="comp-device-model"
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                setErrors((prev) => ({ ...prev, model: "" }));
              }}
              className={inputClass}
            >
              <option value="">Select device model</option>
              <option value="INV-3200">INV-3200</option>
              <option value="INV-3100">INV-3100</option>
              <option value="INV-5000">INV-5000</option>
              <option value="STR-2500">STR-2500</option>
            </select>
            {errors.model && (
              <p className="mt-0.5 text-[12px] text-red-600" role="alert">
                {errors.model}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="comp-certification"
              className="mb-1 block text-[13px] font-semibold text-foreground/80"
            >
              Certification <span className="text-red-500">*</span>
            </label>
            <select
              id="comp-certification"
              value={cert}
              onChange={(e) => {
                setCert(e.target.value);
                setErrors((prev) => ({ ...prev, certification: "" }));
              }}
              className={inputClass}
            >
              <option value="">Select certification</option>
              {CERT_TYPES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.certification && (
              <p className="mt-0.5 text-[12px] text-red-600" role="alert">
                {errors.certification}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button
            onClick={onClose}
            className="rounded border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground/80 hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-hover transition-colors"
          >
            Submit for Review
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// =============================================================================
// Report Generation Modal
// =============================================================================

export function ReportModal({ items, onClose }: { items: ComplianceItem[]; onClose: () => void }) {
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const totalVulns = items.reduce((acc, i) => acc + i.vulnerabilities.length, 0);

  const handleDownload = () => {
    if (items.length === 0) return;

    const date = new Date().toISOString().split("T")[0];
    if (format === "csv") {
      const csv = generateCSV(items);
      downloadFile(csv, `regulatory-report-${date}.csv`, "text/csv");
    } else {
      const json = generateJSON(items);
      downloadFile(json, `regulatory-report-${date}.json`, "application/json");
    }
    toast.success("Report downloaded");
    onClose();
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-sm rounded-lg bg-card shadow-xl border border-border">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-[15px] font-semibold text-foreground">Generate Regulatory Report</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data available for report generation</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                This report will include <span className="font-semibold">{items.length}</span>{" "}
                compliance items and <span className="font-semibold">{totalVulns}</span>{" "}
                vulnerabilities.
              </p>

              <div className="space-y-2">
                <label
                  id="comp-export-format-label"
                  className="block text-[13px] font-semibold text-foreground/80"
                >
                  Export Format
                </label>
                <div
                  role="radiogroup"
                  aria-labelledby="comp-export-format-label"
                  className="flex gap-3"
                >
                  {(["csv", "json"] as const).map((f) => (
                    <label key={f} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="format"
                        value={f}
                        checked={format === f}
                        onChange={() => setFormat(f)}
                        className="accent-[#FF7900]"
                      />
                      <span className="text-sm font-medium text-foreground/80 uppercase">{f}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button
            onClick={onClose}
            className="rounded border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground/80 hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={items.length === 0}
            className={cn(
              "flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-semibold text-white transition-colors",
              items.length === 0
                ? "bg-muted cursor-not-allowed"
                : "bg-accent hover:bg-accent-hover",
            )}
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
