/**
 * IMS Gen 2 — Epic 14: Dialog components for incidents
 * CreateIncidentDialog, IsolationDialog, ReleaseDialog
 */
import { useState, useCallback } from "react";
import { AlertTriangle, Search, Lock, Unlock, X } from "lucide-react";
import { cn } from "../../../lib/utils";
import { formatDateTime } from "../../../lib/utils";
import type {
  Incident,
  IncidentSeverity,
  IncidentCategory,
  AffectedDevice,
  IsolationPolicy,
} from "../../../lib/incident-types";

// ---------------------------------------------------------------------------
// Create Incident Dialog (Story 14.1 AC1-AC2)
// ---------------------------------------------------------------------------
export function CreateIncidentDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (incident: Incident) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("Medium");
  const [category, setCategory] = useState<IncidentCategory>("Security");
  const [deviceSearch, setDeviceSearch] = useState("");

  const handleSubmit = useCallback(() => {
    const newIncident: Incident = {
      id: `INC-${String(Date.now()).slice(-3)}`,
      title,
      description,
      severity,
      status: "Open",
      category,
      affectedDevices: [],
      affectedDeviceCount: 0,
      originDeviceId: "",
      assignedTo: "",
      assignedToName: "Unassigned",
      reportedBy: "USR-001",
      reportedByName: "Sarah Chen",
      timelineEvents: [
        {
          timestamp: new Date().toISOString(),
          action: "created",
          performedBy: "USR-001",
          performedByName: "Sarah Chen",
          note: "Incident created",
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onCreate(newIncident);
    setTitle("");
    setDescription("");
    setSeverity("Medium");
    setCategory("Security");
    onClose();
  }, [title, description, severity, category, onClose, onCreate]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-[16px] font-semibold text-gray-900">Create Incident</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-gray-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief incident description..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-gray-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Detailed description of the incident..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] focus:outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-gray-700">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-[13px] text-gray-900 focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] focus:outline-none"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-gray-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-[13px] text-gray-900 focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] focus:outline-none"
              >
                <option value="Security">Security</option>
                <option value="Hardware">Hardware</option>
                <option value="Network">Network</option>
                <option value="Firmware">Firmware</option>
                <option value="Environmental">Environmental</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-gray-700">
              Affected Devices
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={deviceSearch}
                onChange={(e) => setDeviceSearch(e.target.value)}
                placeholder="Search devices to add..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] focus:outline-none"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="rounded-lg bg-[#FF7900] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#e66d00] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Create Incident
          </button>
        </div>
      </div>
    </div>
  );
}

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
        className="w-full max-w-md rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-t-xl bg-amber-50 border-b border-amber-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-gray-900">Isolate Device</h3>
              <p className="text-[12px] text-gray-600">
                This action will restrict device operations
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-[13px] font-medium text-gray-900">{device.name}</p>
            <p className="text-[12px] text-gray-500">
              {device.location} &middot; {device.firmwareVersion}
            </p>
          </div>
          <div>
            <label className="mb-2 block text-[12px] font-semibold text-gray-700">
              Isolation Policy
            </label>
            <div className="space-y-2">
              {policies.map((p) => (
                <label
                  key={p.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3",
                    policy === p.value
                      ? "border-[#FF7900] bg-orange-50"
                      : "border-gray-200 hover:bg-gray-50",
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
                    <p className="text-[13px] font-medium text-gray-900">{p.label}</p>
                    <p className="text-[11px] text-gray-500">{p.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(device.id, policy)}
            className="rounded-lg bg-red-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-red-700 cursor-pointer"
          >
            <Lock className="mr-1.5 inline h-3.5 w-3.5" />
            Confirm Isolation
          </button>
        </div>
      </div>
    </div>
  );
}

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
        className="w-full max-w-md rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-[16px] font-semibold text-gray-900">Release Device</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-[13px] font-medium text-gray-900">{device.name}</p>
            <p className="text-[12px] text-gray-500">
              Currently isolated since{" "}
              {device.isolatedAt ? formatDateTime(device.isolatedAt) : "N/A"}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-gray-700">
              Reason for Release
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Provide a reason for releasing this device from isolation..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] focus:outline-none resize-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm(device.id, reason);
              setReason("");
            }}
            disabled={!reason.trim()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Unlock className="mr-1.5 inline h-3.5 w-3.5" />
            Release Device
          </button>
        </div>
      </div>
    </div>
  );
}
