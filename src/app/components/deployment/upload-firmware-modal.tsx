import { useState, useCallback, useRef } from "react";
import { Upload, X, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";
import type { UploadModalProps } from "./deployment-types";
import { AVAILABLE_MODELS } from "./deployment-constants";
import { computeSHA256 } from "./deployment-utils";

// =============================================================================
// Upload Modal — Stories 11.1 (Checksum + File Upload)
// =============================================================================

export function UploadFirmwareModal({ open, onClose, onSubmit }: UploadModalProps) {
  const [version, setVersion] = useState("");
  const [name, setName] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [releaseNotes, setReleaseNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [checksum, setChecksum] = useState<string>("");
  const [computing, setComputing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setSelectedFile(file);
    setComputing(true);
    setChecksum("");
    try {
      const hash = await computeSHA256(file);
      setChecksum(hash);
    } catch {
      toast.error("Failed to compute file checksum");
    } finally {
      setComputing(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleSubmit = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!version.trim()) newErrors.version = "Version is required";
    if (!name.trim()) newErrors.name = "Name is required";
    if (!selectedFile) newErrors.file = "Firmware file is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 20;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);

      const fileSize = selectedFile
        ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
        : "0 MB";

      onSubmit({
        version: version.trim(),
        name: name.trim(),
        models,
        releaseNotes: releaseNotes.trim(),
        fileSize,
        checksum,
      });

      // Reset form
      setVersion("");
      setName("");
      setModels([]);
      setReleaseNotes("");
      setSelectedFile(null);
      setChecksum("");
      setErrors({});
      setUploading(false);
      setUploadProgress(0);
    }, 1200);
  }, [version, name, selectedFile, models, releaseNotes, checksum, onSubmit]);

  const toggleModel = (model: string) => {
    setModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model],
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-sm border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Upload Firmware</h2>
          <button
            onClick={onClose}
            className="rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Version */}
          <div>
            <label
              htmlFor="fw-version"
              className="mb-1 block text-[13px] font-medium text-muted-foreground"
            >
              Version <span className="text-red-500">*</span>
            </label>
            <input
              id="fw-version"
              type="text"
              value={version}
              onChange={(e) => {
                setVersion(e.target.value);
                setErrors((prev) => ({ ...prev, version: undefined as unknown as string }));
              }}
              placeholder="e.g. v4.3.0"
              className={cn(
                "w-full rounded-sm border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring",
                errors.version ? "border-red-500" : "border-border",
              )}
            />
            {errors.version && (
              <p className="mt-0.5 text-[12px] text-red-500" role="alert">
                {errors.version}
              </p>
            )}
          </div>

          {/* Name */}
          <div>
            <label
              htmlFor="fw-name"
              className="mb-1 block text-[13px] font-medium text-muted-foreground"
            >
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="fw-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((prev) => ({ ...prev, name: undefined as unknown as string }));
              }}
              placeholder="e.g. Security Patch Bundle"
              className={cn(
                "w-full rounded-sm border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring",
                errors.name ? "border-red-500" : "border-border",
              )}
            />
            {errors.name && (
              <p className="mt-0.5 text-[12px] text-red-500" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          {/* Device Model */}
          <div>
            <label
              id="fw-models-label"
              className="mb-1 block text-[13px] font-medium text-muted-foreground"
            >
              Compatible Models
            </label>
            <div role="group" aria-labelledby="fw-models-label" className="flex flex-wrap gap-1.5">
              {AVAILABLE_MODELS.map((model) => (
                <button
                  key={model}
                  type="button"
                  onClick={() => toggleModel(model)}
                  className={cn(
                    "rounded-sm border px-2 py-1 text-[12px] font-medium transition-colors duration-150",
                    models.includes(model)
                      ? "border-accent-text bg-accent/10 text-accent-text"
                      : "border-border bg-background text-muted-foreground hover:border-foreground/30",
                  )}
                >
                  {model}
                </button>
              ))}
            </div>
          </div>

          {/* Release Notes */}
          <div>
            <label
              htmlFor="fw-release-notes"
              className="mb-1 block text-[13px] font-medium text-muted-foreground"
            >
              Release Notes
            </label>
            <textarea
              id="fw-release-notes"
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              rows={2}
              placeholder="Describe the changes in this firmware version..."
              className="w-full rounded-sm border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* File Upload — Story 11.1 AC1/AC2 */}
          <div>
            <label
              id="fw-file-label"
              className="mb-1 block text-[13px] font-medium text-muted-foreground"
            >
              Firmware File <span className="text-red-500">*</span>
            </label>
            <div
              role="button"
              aria-labelledby="fw-file-label"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  (e.currentTarget as HTMLElement).click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-sm border border-dashed px-3 py-3 cursor-pointer transition-colors duration-150",
                isDragging
                  ? "border-accent-text bg-accent/5"
                  : errors.file
                    ? "border-red-400 bg-red-50/30"
                    : "border-border bg-muted/30 hover:border-accent-text/50",
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileInput}
                accept=".bin,.fw,.img,.hex,.zip"
              />
              {selectedFile ? (
                <div className="flex items-center gap-2 text-[13px]">
                  <Package className="h-4 w-4 text-accent-text" />
                  <span className="font-medium text-foreground">{selectedFile.name}</span>
                  <span className="text-muted-foreground">
                    ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[13px] text-muted-foreground">
                    Drag & drop or click to select (.bin, .fw, .img)
                  </span>
                </div>
              )}
            </div>
            {errors.file && (
              <p className="mt-0.5 text-[12px] text-red-500" role="alert">
                {errors.file}
              </p>
            )}
          </div>

          {/* Checksum Display — Story 11.1 AC2 */}
          {(computing || checksum) && (
            <div>
              <label
                htmlFor="fw-checksum"
                className="mb-1 block text-[13px] font-medium text-muted-foreground"
              >
                SHA-256 Checksum
              </label>
              {computing ? (
                <div className="flex items-center gap-2 rounded-sm border border-border bg-muted/50 px-2.5 py-1.5">
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  <span className="text-[12px] text-muted-foreground">Computing checksum...</span>
                </div>
              ) : (
                <input
                  id="fw-checksum"
                  type="text"
                  readOnly
                  value={checksum}
                  className="w-full rounded-sm border border-border bg-muted/30 px-2.5 py-1.5 font-mono text-[12px] text-foreground"
                />
              )}
            </div>
          )}

          {/* Upload Progress — Story 11.1 */}
          {uploading && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] text-muted-foreground">Uploading...</span>
                <span className="text-[12px] font-medium text-foreground">{uploadProgress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={uploading}
            className="rounded-sm border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="flex items-center gap-1.5 rounded-sm bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
