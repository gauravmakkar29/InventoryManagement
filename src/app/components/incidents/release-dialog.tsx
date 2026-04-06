/**
 * IMS Gen 2 — Epic 14: Release Device Dialog (Story 14.2 AC6)
 */
import { useState } from "react";
import { Unlock, X } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { AffectedDevice } from "@/lib/incident-types";

// ---------------------------------------------------------------------------
// Release Device Dialog (Story 14.2 AC6)
// ---------------------------------------------------------------------------
export function ReleaseDialog({
  device,
  open,
  onClose,
  onConfirm,
}: {
  device: AffectedDevice | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (deviceId: string, reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  if (!open || !device) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-[16px] font-semibold text-foreground">Release Device</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-[14px] font-medium text-foreground">{device.name}</p>
            <p className="text-[14px] text-muted-foreground">
              Currently isolated since{" "}
              {device.isolatedAt ? formatDateTime(device.isolatedAt) : "N/A"}
            </p>
          </div>
          <div>
            <label
              htmlFor="incident-release-reason"
              className="mb-1 block text-[14px] font-semibold text-foreground/80"
            >
              Reason for Release
            </label>
            <textarea
              id="incident-release-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Provide a reason for releasing this device from isolation..."
              className="w-full rounded-lg border border-border px-3 py-2 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-accent-text focus:ring-1 focus:ring-ring focus:outline-none resize-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-[14px] font-medium text-foreground/80 hover:bg-muted cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm(device.id, reason);
              setReason("");
            }}
            disabled={!reason.trim()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-[14px] font-medium text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <Unlock className="mr-1.5 inline h-3.5 w-3.5" />
            Release Device
          </button>
        </div>
      </div>
    </div>
  );
}
