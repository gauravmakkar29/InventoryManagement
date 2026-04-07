/**
 * IMS Gen 2 — Epic 14: Create Incident Dialog (Story 14.1 AC1-AC2)
 */
import { useState, useCallback } from "react";
import { Search, X } from "lucide-react";
import type { Incident, IncidentSeverity, IncidentCategory } from "@/lib/incident-types";

// ---------------------------------------------------------------------------
// Create Incident Dialog (Story 14.1 AC1-AC2)
// ---------------------------------------------------------------------------

interface CreateIncidentDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (incident: Incident) => void;
}

export function CreateIncidentDialog({ open, onClose, onCreate }: CreateIncidentDialogProps) {
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
        className="w-full max-w-lg rounded-xl bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-[16px] font-semibold text-foreground">Create Incident</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-muted-foreground cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div>
            <label
              htmlFor="incident-title"
              className="mb-1 block text-[14px] font-semibold text-foreground/80"
            >
              Title
            </label>
            <input
              id="incident-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief incident description..."
              className="w-full rounded-lg border border-border px-3 py-2 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-accent-text focus:ring-1 focus:ring-ring focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="incident-description"
              className="mb-1 block text-[14px] font-semibold text-foreground/80"
            >
              Description
            </label>
            <textarea
              id="incident-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Detailed description of the incident..."
              className="w-full rounded-lg border border-border px-3 py-2 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-accent-text focus:ring-1 focus:ring-ring focus:outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="incident-severity"
                className="mb-1 block text-[14px] font-semibold text-foreground/80"
              >
                Severity
              </label>
              <select
                id="incident-severity"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] text-foreground focus:border-accent-text focus:ring-1 focus:ring-ring focus:outline-none"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="incident-category"
                className="mb-1 block text-[14px] font-semibold text-foreground/80"
              >
                Category
              </label>
              <select
                id="incident-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                className="w-full rounded-lg border border-border px-3 py-2 text-[14px] text-foreground focus:border-accent-text focus:ring-1 focus:ring-ring focus:outline-none"
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
            <label
              htmlFor="incident-device-search"
              className="mb-1 block text-[14px] font-semibold text-foreground/80"
            >
              Affected Devices
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                id="incident-device-search"
                type="text"
                value={deviceSearch}
                onChange={(e) => setDeviceSearch(e.target.value)}
                placeholder="Search devices to add..."
                aria-label="Search devices to add"
                className="w-full rounded-lg border border-border py-2 pl-9 pr-3 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-accent-text focus:ring-1 focus:ring-ring focus:outline-none"
              />
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
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-[14px] font-medium text-white hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            Create Incident
          </button>
        </div>
      </div>
    </div>
  );
}
