import { useState, useMemo, useCallback } from "react";
import { Upload, X, Check, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SBOMFormat } from "./sbom-types";
import { MOCK_FIRMWARE } from "./sbom-constants";

// =============================================================================
// Sub-component: Upload SBOM Modal
// =============================================================================

export function UploadSBOMModal({
  open,
  onClose,
  onUpload,
}: {
  open: boolean;
  onClose: () => void;
  onUpload: (firmwareId: string, format: SBOMFormat, fileName: string) => void;
}) {
  const [selectedFirmware, setSelectedFirmware] = useState("");
  const [format, setFormat] = useState<SBOMFormat>("CycloneDX");
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [firmwareSearch, setFirmwareSearch] = useState("");

  const filteredFirmware = useMemo(() => {
    if (!firmwareSearch) return MOCK_FIRMWARE;
    const q = firmwareSearch.toLowerCase();
    return MOCK_FIRMWARE.filter(
      (fw) => fw.name.toLowerCase().includes(q) || fw.version.toLowerCase().includes(q),
    );
  }, [firmwareSearch]);

  const handleSubmit = useCallback(() => {
    if (!selectedFirmware || !fileName) return;
    onUpload(selectedFirmware, format, fileName);
    setSelectedFirmware("");
    setFormat("CycloneDX");
    setFileName(null);
    setFirmwareSearch("");
    onClose();
  }, [selectedFirmware, format, fileName, onUpload, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg card-elevated p-0 mx-4">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">Upload SBOM</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-muted-foreground cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* Firmware selector */}
          <div>
            <label
              htmlFor="sbom-firmware-search"
              className="mb-1.5 block text-[14px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Firmware
            </label>
            <input
              id="sbom-firmware-search"
              type="text"
              placeholder="Search firmware..."
              aria-label="Search firmware"
              value={firmwareSearch}
              onChange={(e) => setFirmwareSearch(e.target.value)}
              className="mb-2 w-full rounded-lg border border-border bg-card px-3 py-2 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-accent-text focus:ring-1 focus:ring-ring outline-none"
            />
            <div className="max-h-[120px] overflow-y-auto rounded-lg border border-border">
              {filteredFirmware.map((fw) => (
                <button
                  key={fw.id}
                  onClick={() => setSelectedFirmware(fw.id)}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-left text-[14px] cursor-pointer",
                    selectedFirmware === fw.id
                      ? "bg-orange-50 text-accent-text font-medium"
                      : "text-foreground/80 hover:bg-muted",
                  )}
                >
                  <span>
                    {fw.name} v{fw.version}
                  </span>
                  {selectedFirmware === fw.id && <Check className="h-4 w-4" />}
                </button>
              ))}
              {filteredFirmware.length === 0 && (
                <div className="px-3 py-4 text-center text-[14px] text-muted-foreground">
                  No firmware found
                </div>
              )}
            </div>
          </div>

          {/* Format selector */}
          <div>
            <label
              id="sbom-format-label"
              className="mb-1.5 block text-[14px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Format
            </label>
            <div role="group" aria-labelledby="sbom-format-label" className="flex gap-3">
              {(["CycloneDX", "SPDX"] as SBOMFormat[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-[14px] font-medium cursor-pointer",
                    format === f
                      ? "border-accent-text bg-orange-50 text-accent-text"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  <div
                    className={cn(
                      "h-3.5 w-3.5 rounded-full border-2",
                      format === f ? "border-accent-text bg-accent" : "border-border",
                    )}
                  >
                    {format === f && (
                      <div className="h-full w-full rounded-full border-2 border-white" />
                    )}
                  </div>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* File upload zone */}
          <div>
            <label
              id="sbom-file-label"
              className="mb-1.5 block text-[14px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              SBOM File (.json)
            </label>
            <div
              role="button"
              aria-labelledby="sbom-file-label"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  (e.currentTarget as HTMLElement).click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file && file.name.endsWith(".json")) {
                  setFileName(file.name);
                }
              }}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 cursor-pointer",
                dragOver
                  ? "border-accent-text bg-orange-50"
                  : fileName
                    ? "border-green-300 bg-green-50"
                    : "border-border hover:border-border",
              )}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".json";
                input.onchange = () => {
                  const file = input.files?.[0];
                  if (file) setFileName(file.name);
                };
                input.click();
              }}
            >
              {fileName ? (
                <>
                  <FileText className="mb-2 h-8 w-8 text-green-500" />
                  <span className="text-[14px] font-medium text-green-700">{fileName}</span>
                  <span className="mt-1 text-[13px] text-muted-foreground">
                    Click to change file
                  </span>
                </>
              ) : (
                <>
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <span className="text-[14px] text-muted-foreground">
                    Drop JSON file here or click to browse
                  </span>
                  <span className="mt-1 text-[13px] text-muted-foreground">
                    Supports CycloneDX and SPDX JSON formats
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-[14px] font-medium text-muted-foreground hover:bg-muted cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFirmware || !fileName}
            className={cn(
              "rounded-lg px-4 py-2 text-[14px] font-medium text-white cursor-pointer",
              selectedFirmware && fileName
                ? "bg-accent hover:bg-[#e66e00]"
                : "bg-muted cursor-not-allowed",
            )}
          >
            Upload SBOM
          </button>
        </div>
      </div>
    </div>
  );
}
