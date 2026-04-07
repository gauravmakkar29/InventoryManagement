/**
 * IMS Gen 2 — Epic 14: Device Isolation Dialog (Story 14.2 AC1-AC3)
 */
import { useState } from "react";
import { AlertTriangle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AffectedDevice, IsolationPolicy } from "@/lib/incident-types";

// ---------------------------------------------------------------------------
// Device Isolation Dialog (Story 14.2 AC1-AC3)
// ---------------------------------------------------------------------------
export function IsolationDialog({
  device,
  open,
  onClose,
  onConfirm,
}: {
  device: AffectedDevice | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (deviceId: string, policy: IsolationPolicy) => void;
}) {
  const [policy, setPolicy] = useState<IsolationPolicy>("NetworkBlock");

  if (!open || !device) return null;

  const policies: { value: IsolationPolicy; label: string; description: string }[] = [
    {
      value: "NetworkBlock",
      label: "Network Block",
      description: "Block all network communication to and from the device",
    },
    {
      value: "ReadOnly",
      label: "Read Only",
      description: "Allow monitoring but prevent any write operations",
    },
    {
      value: "FirmwareLock",
      label: "Firmware Lock",
      description: "Lock firmware to prevent any updates or modifications",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-t-xl bg-warning-bg border-b border-warning-bg px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-bg">
              <AlertTriangle className="h-5 w-5 text-warning-text" />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-foreground">Isolate Device</h3>
              <p className="text-[14px] text-muted-foreground">
                This action will restrict device operations
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-[14px] font-medium text-foreground">{device.name}</p>
            <p className="text-[14px] text-muted-foreground">
              {device.location} &middot; {device.firmwareVersion}
            </p>
          </div>
          <div>
            <label
              id="incident-isolation-policy-label"
              className="mb-2 block text-[14px] font-semibold text-foreground/80"
            >
              Isolation Policy
            </label>
            <div
              role="radiogroup"
              aria-labelledby="incident-isolation-policy-label"
              className="space-y-2"
            >
              {policies.map((p) => (
                <label
                  key={p.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3",
                    policy === p.value
                      ? "border-accent-text bg-high-bg"
                      : "border-border hover:bg-muted",
                  )}
                >
                  <input
                    type="radio"
                    name="policy"
                    checked={policy === p.value}
                    onChange={() => setPolicy(p.value)}
                    className="mt-0.5 accent-[#FF7900]"
                  />
                  <div>
                    <p className="text-[14px] font-medium text-foreground">{p.label}</p>
                    <p className="text-[13px] text-muted-foreground">{p.description}</p>
                  </div>
                </label>
              ))}
            </div>
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
            onClick={() => onConfirm(device.id, policy)}
            className="rounded-lg bg-danger px-4 py-2 text-[14px] font-medium text-white hover:bg-danger cursor-pointer"
          >
            <Lock className="mr-1.5 inline h-3.5 w-3.5" />
            Confirm Isolation
          </button>
        </div>
      </div>
    </div>
  );
}
