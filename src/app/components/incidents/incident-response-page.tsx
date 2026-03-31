/**
 * IMS Gen 2 — Epic 14: Incident Response & Quarantine Management
 * Main page component implementing Stories 14.1–14.6
 */
import { useState, useCallback, useMemo } from "react";
import {
  AlertTriangle,
  Plus,
  Search,
  ChevronRight,
  Shield,
  Lock,
  Unlock,
  MapPin,
  BookOpen,
  BarChart3,
  X,
  Clock,
  User,
  CheckCircle2,
  Circle,
  ArrowRight,
  Zap,
  Network,
  ShieldAlert,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { formatDateTime, formatRelativeTime } from "../../../lib/utils";
import type {
  Incident,
  IncidentSeverity,
  IncidentStatus,
  IncidentCategory,
  AffectedDevice,
  QuarantineZone,
  Playbook,
  IsolationPolicy,
  LateralMovementDevice,
  IncidentMetrics,
} from "../../../lib/incident-types";
import { SEVERITY_COLORS, STATUS_COLORS, VALID_TRANSITIONS } from "../../../lib/incident-types";
import {
  MOCK_INCIDENTS,
  MOCK_QUARANTINE_ZONES,
  MOCK_PLAYBOOKS,
  MOCK_TOPOLOGY,
  MOCK_LATERAL_MOVEMENT,
  MOCK_INCIDENT_METRICS,
} from "../../../lib/incident-mock-data";

// ---------------------------------------------------------------------------
// Tab Navigation
// ---------------------------------------------------------------------------
type TabId = "incidents" | "isolated" | "quarantine" | "playbooks" | "dashboard";

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "incidents", label: "Incidents", icon: AlertTriangle },
  { id: "isolated", label: "Isolated Devices", icon: Lock },
  { id: "quarantine", label: "Quarantine Zones", icon: MapPin },
  { id: "playbooks", label: "Playbooks", icon: BookOpen },
  { id: "dashboard", label: "Metrics", icon: BarChart3 },
];

// ---------------------------------------------------------------------------
// Severity Badge
// ---------------------------------------------------------------------------
function SeverityBadge({ severity }: { severity: IncidentSeverity }) {
  const styles: Record<IncidentSeverity, string> = {
    Critical: "bg-red-100 text-red-700 border-red-200",
    High: "bg-orange-100 text-orange-700 border-orange-200",
    Medium: "bg-amber-100 text-amber-700 border-amber-200",
    Low: "bg-blue-100 text-blue-700 border-blue-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        styles[severity],
      )}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: SEVERITY_COLORS[severity] }}
      />
      {severity}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: IncidentStatus }) {
  const styles: Record<IncidentStatus, string> = {
    Open: "bg-red-50 text-red-700 border-red-200",
    Investigating: "bg-orange-50 text-orange-700 border-orange-200",
    Contained: "bg-amber-50 text-amber-700 border-amber-200",
    Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Closed: "bg-gray-50 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        styles[status],
      )}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: STATUS_COLORS[status] }}
      />
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Category Badge
// ---------------------------------------------------------------------------
function CategoryBadge({ category }: { category: IncidentCategory }) {
  const styles: Record<IncidentCategory, string> = {
    Security: "bg-red-50 text-red-600",
    Hardware: "bg-blue-50 text-blue-600",
    Network: "bg-purple-50 text-purple-600",
    Firmware: "bg-orange-50 text-orange-600",
    Environmental: "bg-green-50 text-green-600",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
        styles[category],
      )}
    >
      {category}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Create Incident Dialog (Story 14.1 AC1-AC2)
// ---------------------------------------------------------------------------
function CreateIncidentDialog({
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
function IsolationDialog({
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
function ReleaseDialog({
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

// ---------------------------------------------------------------------------
// Incident Timeline (Story 14.1 AC3-AC4)
// ---------------------------------------------------------------------------
function IncidentTimeline({ events }: { events: Incident["timelineEvents"] }) {
  const getEventIcon = (action: string) => {
    switch (action) {
      case "created":
        return <Plus className="h-3.5 w-3.5" />;
      case "status_changed":
        return <ArrowRight className="h-3.5 w-3.5" />;
      case "device_isolated":
        return <Lock className="h-3.5 w-3.5" />;
      case "device_released":
        return <Unlock className="h-3.5 w-3.5" />;
      case "quarantine_applied":
        return <Shield className="h-3.5 w-3.5" />;
      case "quarantine_lifted":
        return <Shield className="h-3.5 w-3.5" />;
      case "playbook_started":
        return <BookOpen className="h-3.5 w-3.5" />;
      case "playbook_completed":
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case "assigned":
        return <User className="h-3.5 w-3.5" />;
      case "note_added":
        return <Circle className="h-3.5 w-3.5" />;
      default:
        return <Circle className="h-3.5 w-3.5" />;
    }
  };

  const getEventColor = (action: string) => {
    switch (action) {
      case "device_isolated":
        return "bg-red-100 text-red-600";
      case "device_released":
        return "bg-emerald-100 text-emerald-600";
      case "quarantine_applied":
        return "bg-amber-100 text-amber-600";
      case "status_changed":
        return "bg-blue-100 text-blue-600";
      case "playbook_completed":
        return "bg-emerald-100 text-emerald-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getEventText = (event: Incident["timelineEvents"][0]) => {
    switch (event.action) {
      case "created":
        return "Incident created";
      case "status_changed":
        return `Status changed from ${event.fromStatus} to ${event.toStatus}`;
      case "device_isolated":
        return `Device ${event.deviceName ?? event.deviceId} isolated`;
      case "device_released":
        return `Device ${event.deviceName ?? event.deviceId} released`;
      case "quarantine_applied":
        return "Quarantine zone applied";
      case "quarantine_lifted":
        return "Quarantine zone lifted";
      case "playbook_started":
        return "Playbook execution started";
      case "playbook_completed":
        return "Playbook completed";
      case "assigned":
        return "Incident assigned";
      case "note_added":
        return "Note added";
      default:
        return event.action;
    }
  };

  const sorted = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <div className="space-y-0">
      {sorted.map((event, i) => (
        <div key={i} className="relative flex gap-3 pb-4">
          {i < sorted.length - 1 && (
            <div className="absolute left-[15px] top-8 h-[calc(100%-16px)] w-px bg-gray-200" />
          )}
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              getEventColor(event.action),
            )}
          >
            {getEventIcon(event.action)}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[13px] font-medium text-gray-900">{getEventText(event)}</p>
            {event.note && <p className="mt-0.5 text-[12px] text-gray-600">{event.note}</p>}
            <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
              <span>{event.performedByName}</span>
              <span>&middot;</span>
              <span>{formatRelativeTime(event.timestamp)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Playbook Executor (Story 14.5 AC3-AC6)
// ---------------------------------------------------------------------------
function PlaybookExecutor({
  progress,
  onStepComplete,
}: {
  progress: Incident["playbookProgress"];
  onStepComplete: (stepNumber: number) => void;
}) {
  if (!progress) return null;

  const pct =
    progress.totalSteps > 0 ? Math.round((progress.completedSteps / progress.totalSteps) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[13px] font-semibold text-gray-900">
          Playbook: {progress.playbookName}
        </h4>
        {pct === 100 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            <CheckCircle2 className="h-3 w-3" /> Complete
          </span>
        )}
      </div>
      {/* Progress bar */}
      <div>
        <div className="mb-1 flex items-center justify-between text-[11px] text-gray-500">
          <span>
            {progress.completedSteps} of {progress.totalSteps} steps complete
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-[#FF7900] transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {/* Steps */}
      <div className="space-y-2">
        {progress.steps.map((step) => (
          <div
            key={step.stepNumber}
            className={cn(
              "rounded-lg border p-3",
              step.isCompleted ? "border-emerald-200 bg-emerald-50/50" : "border-gray-200",
            )}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {step.isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <button
                    onClick={() => onStepComplete(step.stepNumber)}
                    className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-300 hover:border-[#FF7900] cursor-pointer"
                    title="Mark as complete"
                  >
                    <span className="sr-only">Complete step {step.stepNumber}</span>
                  </button>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-500">#{step.stepNumber}</span>
                  <p
                    className={cn(
                      "text-[13px] font-medium",
                      step.isCompleted ? "text-gray-500 line-through" : "text-gray-900",
                    )}
                  >
                    {step.title}
                  </p>
                  {step.actionType === "automated" && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600">
                      <Zap className="h-2.5 w-2.5" /> AUTO
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[12px] text-gray-500">{step.description}</p>
                {step.isCompleted && step.completedByName && (
                  <p className="mt-1 text-[11px] text-gray-500">
                    Completed by {step.completedByName} &middot;{" "}
                    {step.completedAt ? formatRelativeTime(step.completedAt) : ""}
                  </p>
                )}
              </div>
              {!step.isCompleted && step.actionType === "automated" && (
                <button
                  onClick={() => onStepComplete(step.stepNumber)}
                  className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-blue-700 cursor-pointer"
                >
                  Execute
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Network Topology Graph (Story 14.3) — SVG force-directed
// ---------------------------------------------------------------------------
function NetworkTopologyGraph({
  graph,
  onShowLateral,
}: {
  graph: typeof MOCK_TOPOLOGY;
  onShowLateral: (deviceId: string) => void;
}) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [lateralDeviceId, setLateralDeviceId] = useState<string | null>(null);

  // Simple force layout positions (pre-calculated for mock data)
  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const cx = 400;
    const cy = 250;
    const nodes = graph.nodes;
    nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
      const radius = node.isOrigin ? 0 : 120 + (node.riskScore > 60 ? 40 : 80);
      positions[node.id] = {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });
    return positions;
  }, [graph.nodes]);

  const statusColors: Record<string, string> = {
    Online: "#10b981",
    Offline: "#6b7280",
    Maintenance: "#f59e0b",
    Isolated: "#f97316",
  };

  const edgeTypeColors: Record<string, string> = {
    same_location: "#3b82f6",
    same_firmware: "#ef4444",
    same_customer: "#8b5cf6",
    geographic_proximity: "#6b7280",
  };

  const edgeTypeLabels: Record<string, string> = {
    same_location: "Same Location",
    same_firmware: "Same Firmware",
    same_customer: "Same Customer",
    geographic_proximity: "Geographic Proximity",
  };

  const handleShowLateral = useCallback(
    (deviceId: string) => {
      setLateralDeviceId(deviceId);
      onShowLateral(deviceId);
    },
    [onShowLateral],
  );

  return (
    <div className="relative">
      <svg
        viewBox="0 0 800 500"
        className="w-full rounded-lg border border-gray-200 bg-gray-50"
        style={{ minHeight: 400 }}
      >
        {/* Edges */}
        {graph.edges.map((edge, i) => {
          const s = nodePositions[edge.source];
          const t = nodePositions[edge.target];
          if (!s || !t) return null;
          const edgeKey = `${edge.source}-${edge.target}-${i}`;
          const isLateral =
            lateralDeviceId && (edge.source === lateralDeviceId || edge.target === lateralDeviceId);
          return (
            <g key={edgeKey}>
              <line
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke={
                  isLateral ? "#ef4444" : (edgeTypeColors[edge.relationshipType] ?? "#d1d5db")
                }
                strokeWidth={isLateral ? 3 : Math.max(1, edge.weight * 3)}
                strokeOpacity={lateralDeviceId && !isLateral ? 0.15 : 0.5}
                strokeDasharray={
                  edge.relationshipType === "geographic_proximity" ? "4 4" : undefined
                }
                onMouseEnter={() => setHoveredEdge(edgeKey)}
                onMouseLeave={() => setHoveredEdge(null)}
                className="cursor-pointer"
              />
              {isLateral && (
                <line
                  x1={s.x}
                  y1={s.y}
                  x2={t.x}
                  y2={t.y}
                  stroke="#ef4444"
                  strokeWidth={6}
                  strokeOpacity={0.15}
                  className="animate-pulse"
                />
              )}
              {hoveredEdge === edgeKey && (
                <g>
                  <rect
                    x={(s.x + t.x) / 2 - 60}
                    y={(s.y + t.y) / 2 - 28}
                    width={120}
                    height={36}
                    rx={6}
                    fill="white"
                    stroke="#e5e7eb"
                    strokeWidth={1}
                  />
                  <text
                    x={(s.x + t.x) / 2}
                    y={(s.y + t.y) / 2 - 12}
                    textAnchor="middle"
                    className="text-[10px] fill-gray-700 font-medium"
                  >
                    {edgeTypeLabels[edge.relationshipType]}
                  </text>
                  <text
                    x={(s.x + t.x) / 2}
                    y={(s.y + t.y) / 2 + 2}
                    textAnchor="middle"
                    className="text-[9px] fill-gray-400"
                  >
                    Strength: {Math.round(edge.weight * 100)}%
                  </text>
                </g>
              )}
            </g>
          );
        })}
        {/* Nodes */}
        {graph.nodes.map((node) => {
          const pos = nodePositions[node.id];
          if (!pos) return null;
          const r = 12 + (node.riskScore / 100) * 12;
          const isHovered = hoveredNode === node.id;
          const isDimmed =
            lateralDeviceId &&
            lateralDeviceId !== node.id &&
            !graph.edges.some(
              (e) =>
                (e.source === lateralDeviceId && e.target === node.id) ||
                (e.target === lateralDeviceId && e.source === node.id),
            );
          return (
            <g
              key={node.id}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => handleShowLateral(node.id)}
              className="cursor-pointer"
              opacity={isDimmed ? 0.2 : 1}
            >
              {node.isOrigin && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={r + 6}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  className="animate-pulse"
                />
              )}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={r}
                fill={statusColors[node.status] ?? "#6b7280"}
                stroke="white"
                strokeWidth={2.5}
              />
              {node.isIsolated && (
                <g transform={`translate(${pos.x + r * 0.5}, ${pos.y - r * 0.5})`}>
                  <circle cx={0} cy={0} r={8} fill="#ef4444" stroke="white" strokeWidth={1.5} />
                  <text
                    x={0}
                    y={1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[7px] fill-white font-bold"
                  >
                    L
                  </text>
                </g>
              )}
              <text
                x={pos.x}
                y={pos.y + r + 14}
                textAnchor="middle"
                className="text-[10px] fill-gray-600 font-medium"
              >
                {node.deviceName}
              </text>
              {/* Tooltip */}
              {isHovered && (
                <g>
                  <rect
                    x={pos.x + r + 8}
                    y={pos.y - 44}
                    width={180}
                    height={80}
                    rx={8}
                    fill="white"
                    stroke="#e5e7eb"
                    strokeWidth={1}
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                  />
                  <text
                    x={pos.x + r + 18}
                    y={pos.y - 26}
                    className="text-[11px] fill-gray-900 font-semibold"
                  >
                    {node.deviceName}
                  </text>
                  <text x={pos.x + r + 18} y={pos.y - 12} className="text-[10px] fill-gray-500">
                    Status: {node.status}
                  </text>
                  <text x={pos.x + r + 18} y={pos.y + 2} className="text-[10px] fill-gray-500">
                    Risk: {node.riskScore}% | {node.firmwareVersion}
                  </text>
                  <text x={pos.x + r + 18} y={pos.y + 16} className="text-[10px] fill-gray-500">
                    Location: {node.location}
                  </text>
                  <text
                    x={pos.x + r + 18}
                    y={pos.y + 30}
                    className="text-[10px] fill-blue-500 font-medium"
                  >
                    Click to show lateral paths
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-gray-500">
        <span className="font-semibold text-gray-700">Legend:</span>
        {Object.entries(statusColors).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            {status}
          </span>
        ))}
        <span className="mx-1 text-gray-300">|</span>
        {Object.entries(edgeTypeLabels).map(([type, label]) => (
          <span key={type} className="flex items-center gap-1.5">
            <span className="h-0.5 w-4" style={{ backgroundColor: edgeTypeColors[type] }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lateral Movement Panel (Story 14.3 AC5-AC6)
// ---------------------------------------------------------------------------
function LateralMovementPanel({
  devices,
  open,
  onClose,
}: {
  devices: LateralMovementDevice[];
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed right-0 top-0 z-40 flex h-full w-[360px] flex-col border-l border-gray-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-red-500" />
          <h3 className="text-[15px] font-semibold text-gray-900">Lateral Movement Risk</h3>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <p className="mb-4 text-[12px] text-gray-500">
          Devices ranked by lateral movement probability from the selected origin device.
        </p>
        <div className="space-y-2">
          {devices.map((dev, i) => (
            <div key={dev.deviceId} className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-gray-500 bg-gray-100">
                    {i + 1}
                  </span>
                  <span className="text-[13px] font-medium text-gray-900">{dev.deviceName}</span>
                </div>
                <span
                  className={cn(
                    "text-[13px] font-bold tabular-nums",
                    dev.probability >= 70
                      ? "text-red-600"
                      : dev.probability >= 40
                        ? "text-amber-600"
                        : "text-gray-600",
                  )}
                >
                  {dev.probability}%
                </span>
              </div>
              <div className="mt-1.5">
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${dev.probability}%`,
                      backgroundColor:
                        dev.probability >= 70
                          ? "#ef4444"
                          : dev.probability >= 40
                            ? "#f59e0b"
                            : "#6b7280",
                    }}
                  />
                </div>
              </div>
              <p className="mt-1.5 text-[11px] text-gray-500">{dev.primaryRiskFactor}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Incident Detail Panel (Story 14.1 AC3, 14.2, 14.3, 14.5)
// ---------------------------------------------------------------------------
function IncidentDetailPanel({
  incident,
  onClose,
  onStatusChange,
  onIsolate,
  onRelease,
  onStepComplete,
}: {
  incident: Incident;
  onClose: () => void;
  onStatusChange: (incidentId: string, newStatus: IncidentStatus, note: string) => void;
  onIsolate: (device: AffectedDevice) => void;
  onRelease: (device: AffectedDevice) => void;
  onStepComplete: (incidentId: string, stepNumber: number) => void;
}) {
  const [activeSection, setActiveSection] = useState<
    "details" | "devices" | "topology" | "playbook" | "timeline"
  >("details");
  const [statusNote, setStatusNote] = useState("");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showLateral, setShowLateral] = useState(false);

  const validNext = VALID_TRANSITIONS[incident.status];

  return (
    <div className="fixed inset-y-0 right-0 z-30 flex w-full max-w-2xl flex-col border-l border-gray-200 bg-white shadow-xl">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-mono text-gray-500">{incident.id}</span>
              <SeverityBadge severity={incident.severity} />
              <StatusBadge status={incident.status} />
            </div>
            <h2 className="mt-1.5 text-[16px] font-semibold text-gray-900 truncate">
              {incident.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Status transition */}
        {validNext.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Change Status
              </button>
              {showStatusMenu && (
                <div className="absolute left-0 top-full z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  {validNext.map((s) => (
                    <button
                      key={s}
                      className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        if (s === "Resolved" && !statusNote.trim()) {
                          setShowStatusMenu(false);
                          return;
                        }
                        onStatusChange(incident.id, s, statusNote);
                        setShowStatusMenu(false);
                        setStatusNote("");
                      }}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[s] }}
                      />
                      {s}
                    </button>
                  ))}
                  <div className="px-3 py-2">
                    <input
                      type="text"
                      placeholder="Optional note..."
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      className="w-full rounded border border-gray-200 px-2 py-1 text-[11px] focus:outline-none focus:border-[#FF7900]"
                    />
                  </div>
                </div>
              )}
            </div>
            <span className="text-[11px] text-gray-500">Assigned to {incident.assignedToName}</span>
          </div>
        )}
      </div>

      {/* Section tabs */}
      <div className="flex shrink-0 border-b border-gray-200 px-6">
        {(["details", "devices", "topology", "playbook", "timeline"] as const).map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={cn(
              "px-3 py-2.5 text-[12px] font-medium border-b-2 cursor-pointer capitalize",
              activeSection === section
                ? "border-[#FF7900] text-[#FF7900]"
                : "border-transparent text-gray-500 hover:text-gray-700",
            )}
          >
            {section}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {activeSection === "details" && (
          <div className="space-y-4">
            <div>
              <h4 className="text-[12px] font-semibold text-gray-500 uppercase mb-1">
                Description
              </h4>
              <p className="text-[13px] text-gray-700 leading-relaxed">{incident.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-[11px] font-semibold text-gray-500">Category</p>
                <div className="mt-1">
                  <CategoryBadge category={incident.category} />
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-[11px] font-semibold text-gray-500">Affected Devices</p>
                <p className="mt-1 text-[16px] font-bold text-gray-900">
                  {incident.affectedDeviceCount}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-[11px] font-semibold text-gray-500">Reported By</p>
                <p className="mt-1 text-[13px] font-medium text-gray-900">
                  {incident.reportedByName}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-[11px] font-semibold text-gray-500">Created</p>
                <p className="mt-1 text-[13px] font-medium text-gray-900">
                  {formatDateTime(incident.createdAt)}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSection === "devices" && (
          <div className="space-y-2">
            {incident.affectedDevices.map((device) => (
              <div key={device.id} className="rounded-lg border border-gray-200 p-3">
                {device.status === "Isolated" && (
                  <div className="mb-2 flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-1.5">
                    <Lock className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-[11px] font-semibold text-red-700">ISOLATED</span>
                    {device.isolatedAt && (
                      <span className="text-[10px] text-red-500">
                        &middot; {formatRelativeTime(device.isolatedAt)}
                      </span>
                    )}
                    {device.isolationPolicy && (
                      <span className="text-[10px] text-red-500">
                        &middot; {device.isolationPolicy}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-gray-900">{device.name}</p>
                    <p className="text-[11px] text-gray-500">
                      {device.location} &middot; {device.firmwareVersion} &middot; Risk:{" "}
                      {device.riskScore}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {device.status !== "Isolated" ? (
                      <button
                        onClick={() => onIsolate(device)}
                        className="rounded-lg bg-red-50 px-3 py-1.5 text-[11px] font-medium text-red-700 hover:bg-red-100 cursor-pointer"
                      >
                        <Lock className="mr-1 inline h-3 w-3" /> Isolate
                      </button>
                    ) : (
                      <button
                        onClick={() => onRelease(device)}
                        className="rounded-lg bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                      >
                        <Unlock className="mr-1 inline h-3 w-3" /> Release
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === "topology" && (
          <div className="space-y-4">
            <NetworkTopologyGraph
              graph={MOCK_TOPOLOGY}
              onShowLateral={() => setShowLateral(true)}
            />
          </div>
        )}

        {activeSection === "playbook" && (
          <div>
            {incident.playbookProgress ? (
              <PlaybookExecutor
                progress={incident.playbookProgress}
                onStepComplete={(stepNumber) => onStepComplete(incident.id, stepNumber)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-[14px] font-medium text-gray-700">No playbook attached</p>
                <p className="text-[12px] text-gray-500 mt-1">
                  Attach a playbook to track response steps
                </p>
              </div>
            )}
          </div>
        )}

        {activeSection === "timeline" && <IncidentTimeline events={incident.timelineEvents} />}
      </div>

      {/* Lateral Movement Panel overlay */}
      <LateralMovementPanel
        devices={MOCK_LATERAL_MOVEMENT}
        open={showLateral}
        onClose={() => setShowLateral(false)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Incident List Tab (Story 14.1 AC1-AC7)
// ---------------------------------------------------------------------------
function IncidentListTab({
  incidents,
  onSelectIncident,
  onCreateIncident,
}: {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
  onCreateIncident: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "All">("All");
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState<IncidentCategory | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return incidents.filter((inc) => {
      if (statusFilter !== "All" && inc.status !== statusFilter) return false;
      if (severityFilter !== "All" && inc.severity !== severityFilter) return false;
      if (categoryFilter !== "All" && inc.category !== categoryFilter) return false;
      if (searchQuery && !inc.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [incidents, statusFilter, severityFilter, categoryFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search incidents..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as IncidentStatus | "All")}
          className="rounded-lg border border-gray-300 px-3 py-2 text-[12px] text-gray-700 focus:outline-none focus:border-[#FF7900]"
        >
          <option value="All">All Status</option>
          <option value="Open">Open</option>
          <option value="Investigating">Investigating</option>
          <option value="Contained">Contained</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as IncidentSeverity | "All")}
          className="rounded-lg border border-gray-300 px-3 py-2 text-[12px] text-gray-700 focus:outline-none focus:border-[#FF7900]"
        >
          <option value="All">All Severity</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as IncidentCategory | "All")}
          className="rounded-lg border border-gray-300 px-3 py-2 text-[12px] text-gray-700 focus:outline-none focus:border-[#FF7900]"
        >
          <option value="All">All Categories</option>
          <option value="Security">Security</option>
          <option value="Hardware">Hardware</option>
          <option value="Network">Network</option>
          <option value="Firmware">Firmware</option>
          <option value="Environmental">Environmental</option>
        </select>
        <button
          onClick={onCreateIncident}
          className="ml-auto rounded-lg bg-[#FF7900] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#e66d00] cursor-pointer"
        >
          <Plus className="mr-1.5 inline h-3.5 w-3.5" /> Create Incident
        </button>
      </div>

      {/* Incident Table */}
      <div className="card-elevated overflow-hidden">
        <table className="w-full">
          <caption className="sr-only">Security incidents</caption>
          <thead>
            <tr className="border-b-2 border-gray-200 bg-[#f1f3f5]">
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600"
              >
                Severity
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600"
              >
                Title
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600"
              >
                Category
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-gray-600"
              >
                Devices
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600"
              >
                Assigned To
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-gray-600"
              >
                Created
              </th>
              <th scope="col" className="w-8" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((inc, i) => (
              <tr
                key={inc.id}
                onClick={() => onSelectIncident(inc)}
                className={cn(
                  "h-[48px] cursor-pointer hover:bg-gray-50",
                  i % 2 === 1 && "bg-gray-50/50",
                )}
              >
                <td className="px-4">
                  <SeverityBadge severity={inc.severity} />
                </td>
                <td className="px-4">
                  <div>
                    <p className="text-[13px] font-medium text-gray-900 truncate max-w-[300px]">
                      {inc.title}
                    </p>
                    <p className="text-[11px] text-gray-500">{inc.id}</p>
                  </div>
                </td>
                <td className="px-4">
                  <StatusBadge status={inc.status} />
                </td>
                <td className="px-4">
                  <CategoryBadge category={inc.category} />
                </td>
                <td className="px-4 text-center text-[13px] font-medium text-gray-700">
                  {inc.affectedDeviceCount}
                </td>
                <td className="px-4 text-[13px] text-gray-600">{inc.assignedToName}</td>
                <td className="px-4 text-right text-[12px] text-gray-500">
                  {formatRelativeTime(inc.createdAt)}
                </td>
                <td className="px-2">
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <AlertTriangle className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-[14px] font-medium text-gray-600">No incidents found</p>
                  <p className="text-[12px] text-gray-500">
                    Adjust your filters or create a new incident
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Isolated Devices Tab (Story 14.2 AC7)
// ---------------------------------------------------------------------------
function IsolatedDevicesTab({
  incidents,
  onRelease,
}: {
  incidents: Incident[];
  onRelease: (device: AffectedDevice) => void;
}) {
  const isolatedDevices = useMemo(() => {
    const devices: (AffectedDevice & { incidentId: string; incidentTitle: string })[] = [];
    incidents.forEach((inc) => {
      inc.affectedDevices.forEach((dev) => {
        if (dev.status === "Isolated") {
          devices.push({ ...dev, incidentId: inc.id, incidentTitle: inc.title });
        }
      });
    });
    return devices;
  }, [incidents]);

  return (
    <div className="card-elevated overflow-hidden">
      <table className="w-full">
        <caption className="sr-only">Isolated devices</caption>
        <thead>
          <tr className="border-b-2 border-gray-200 bg-[#f1f3f5]">
            <th
              scope="col"
              className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600"
            >
              Device
            </th>
            <th
              scope="col"
              className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600"
            >
              Incident
            </th>
            <th
              scope="col"
              className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600"
            >
              Isolation Date
            </th>
            <th
              scope="col"
              className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600"
            >
              Policy
            </th>
            <th
              scope="col"
              className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600"
            >
              Location
            </th>
            <th
              scope="col"
              className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-gray-600"
            >
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {isolatedDevices.map((dev, i) => (
            <tr key={dev.id} className={cn("h-[48px]", i % 2 === 1 && "bg-gray-50/50")}>
              <td className="px-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-[13px] font-medium text-gray-900">{dev.name}</span>
                </div>
              </td>
              <td className="px-4">
                <span className="text-[12px] text-blue-600 font-medium">{dev.incidentId}</span>
                <p className="text-[11px] text-gray-500 truncate max-w-[200px]">
                  {dev.incidentTitle}
                </p>
              </td>
              <td className="px-4 text-[12px] text-gray-600">
                {dev.isolatedAt ? formatDateTime(dev.isolatedAt) : "N/A"}
              </td>
              <td className="px-4">
                <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                  {dev.isolationPolicy ?? "N/A"}
                </span>
              </td>
              <td className="px-4 text-[12px] text-gray-600">{dev.location}</td>
              <td className="px-4 text-right">
                <button
                  onClick={() => onRelease(dev)}
                  className="rounded-lg bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                >
                  <Unlock className="mr-1 inline h-3 w-3" /> Release
                </button>
              </td>
            </tr>
          ))}
          {isolatedDevices.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center">
                <Shield className="mx-auto h-8 w-8 text-emerald-300 mb-2" />
                <p className="text-[14px] font-medium text-emerald-700">No isolated devices</p>
                <p className="text-[12px] text-gray-500">All devices are operating normally</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quarantine Zones Tab (Story 14.4)
// ---------------------------------------------------------------------------
function QuarantineZonesTab({
  zones,
  onLift,
}: {
  zones: QuarantineZone[];
  onLift: (zoneId: string) => void;
}) {
  const [filterStatus, setFilterStatus] = useState<"All" | "Active" | "Lifted">("All");

  const filtered = useMemo(() => {
    if (filterStatus === "All") return zones;
    return zones.filter((z) => z.status === filterStatus);
  }, [zones, filterStatus]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as "All" | "Active" | "Lifted")}
          className="rounded-lg border border-gray-300 px-3 py-2 text-[12px] text-gray-700 focus:outline-none focus:border-[#FF7900]"
        >
          <option value="All">All Zones</option>
          <option value="Active">Active</option>
          <option value="Lifted">Lifted</option>
        </select>
      </div>

      <div className="card-elevated overflow-hidden">
        <table className="w-full">
          <caption className="sr-only">Containment zones</caption>
          <thead>
            <tr className="border-b-2 border-gray-200 bg-[#f1f3f5]">
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600"
              >
                Zone Name
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-gray-600"
              >
                Devices
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600"
              >
                Incident
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600"
              >
                Policy
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600"
              >
                Radius
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600"
              >
                Created
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-gray-600"
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((zone, i) => (
              <tr
                key={zone.id}
                className={cn(
                  "h-[48px]",
                  zone.status === "Lifted" && "opacity-60",
                  i % 2 === 1 && "bg-gray-50/50",
                )}
              >
                <td className="px-4">
                  <div>
                    <p className="text-[13px] font-medium text-gray-900">{zone.name}</p>
                    <p className="text-[11px] text-gray-500">{zone.id}</p>
                  </div>
                </td>
                <td className="px-4">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                      zone.status === "Active"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-gray-50 text-gray-500 border-gray-200",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        zone.status === "Active" ? "bg-red-500" : "bg-gray-400",
                      )}
                    />
                    {zone.status}
                  </span>
                </td>
                <td className="px-4 text-center text-[13px] font-medium text-gray-700">
                  {zone.isolatedDeviceCount}
                </td>
                <td className="px-4 text-[12px] text-blue-600 font-medium">{zone.incidentId}</td>
                <td className="px-4">
                  <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                    {zone.isolationPolicy}
                  </span>
                </td>
                <td className="px-4 text-[12px] text-gray-600">{zone.radiusKm} km</td>
                <td className="px-4 text-[12px] text-gray-500">
                  {formatRelativeTime(zone.createdAt)}
                </td>
                <td className="px-4 text-right">
                  {zone.status === "Active" ? (
                    <button
                      onClick={() => onLift(zone.id)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-[11px] font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      Lift Quarantine
                    </button>
                  ) : (
                    <span className="text-[11px] text-gray-500">
                      Lifted {zone.liftedAt ? formatRelativeTime(zone.liftedAt) : ""}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quarantine Map Preview */}
      <div className="card-elevated p-5">
        <h3 className="text-[14px] font-semibold text-gray-900 mb-3">Quarantine Zone Map</h3>
        <div className="relative h-[300px] rounded-lg bg-gray-100 border border-gray-200 overflow-hidden">
          <svg viewBox="0 0 800 300" className="w-full h-full">
            {/* World map simple backdrop */}
            <rect width="800" height="300" fill="#f1f3f5" />
            <text
              x="400"
              y="20"
              textAnchor="middle"
              className="text-[11px] fill-gray-400 font-medium"
            >
              Active Quarantine Zones
            </text>
            {/* Singapore zone */}
            <circle
              cx="620"
              cy="170"
              r="30"
              fill="rgba(239,68,68,0.1)"
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeDasharray="6 3"
            />
            <text
              x="620"
              y="170"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[9px] fill-red-600 font-semibold"
            >
              Singapore Lab
            </text>
            <circle cx="620" cy="170" r="3" fill="#ef4444" />
            {/* Shanghai zone */}
            <circle
              cx="580"
              cy="100"
              r="45"
              fill="rgba(239,68,68,0.1)"
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeDasharray="6 3"
            />
            <text
              x="580"
              y="100"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[9px] fill-red-600 font-semibold"
            >
              Shanghai West
            </text>
            <circle cx="580" cy="100" r="3" fill="#ef4444" />
            {/* Denver (lifted) */}
            <circle
              cx="180"
              cy="110"
              r="20"
              fill="rgba(156,163,175,0.1)"
              stroke="#9ca3af"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text
              x="180"
              y="110"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[8px] fill-gray-400"
            >
              Denver (Lifted)
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Playbooks Tab (Story 14.5 AC1-AC2, AC7-AC8)
// ---------------------------------------------------------------------------
function PlaybooksTab({ playbooks }: { playbooks: Playbook[] }) {
  const [categoryFilter, setCategoryFilter] = useState<IncidentCategory | "All">("All");

  const filtered = useMemo(() => {
    if (categoryFilter === "All") return playbooks;
    return playbooks.filter((p) => p.category === categoryFilter);
  }, [playbooks, categoryFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as IncidentCategory | "All")}
          className="rounded-lg border border-gray-300 px-3 py-2 text-[12px] text-gray-700 focus:outline-none focus:border-[#FF7900]"
        >
          <option value="All">All Categories</option>
          <option value="Security">Security</option>
          <option value="Hardware">Hardware</option>
          <option value="Network">Network</option>
          <option value="Firmware">Firmware</option>
          <option value="Environmental">Environmental</option>
        </select>
        <button className="ml-auto rounded-lg bg-[#FF7900] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#e66d00] cursor-pointer">
          <Plus className="mr-1.5 inline h-3.5 w-3.5" /> Create Playbook
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((pb) => (
          <div key={pb.id} className="card-elevated p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <CategoryBadge category={pb.category} />
                <SeverityBadge severity={pb.severity} />
              </div>
              <span
                className={cn(
                  "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  pb.status === "Active"
                    ? "bg-emerald-50 text-emerald-700"
                    : pb.status === "Draft"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-gray-50 text-gray-500",
                )}
              >
                {pb.status}
              </span>
            </div>
            <h4 className="text-[14px] font-semibold text-gray-900">{pb.name}</h4>
            <p className="mt-1 text-[12px] text-gray-500 line-clamp-2">{pb.description}</p>
            <div className="mt-3 flex items-center gap-4 text-[11px] text-gray-500">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> {pb.stepCount} steps
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> ~{pb.estimatedDurationMinutes} min
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> {pb.createdByName}
              </span>
            </div>
            <div className="mt-3 border-t border-gray-100 pt-3">
              <h5 className="text-[11px] font-semibold text-gray-500 uppercase mb-2">
                Steps Preview
              </h5>
              <div className="space-y-1">
                {pb.steps.slice(0, 3).map((step) => (
                  <div
                    key={step.stepNumber}
                    className="flex items-center gap-2 text-[12px] text-gray-600"
                  >
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-100 text-[9px] font-bold text-gray-500">
                      {step.stepNumber}
                    </span>
                    <span className="truncate">{step.title}</span>
                    {step.actionType === "automated" && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-blue-50 px-1 py-0.5 text-[8px] font-semibold text-blue-600">
                        <Zap className="h-2 w-2" /> AUTO
                      </span>
                    )}
                  </div>
                ))}
                {pb.steps.length > 3 && (
                  <p className="text-[11px] text-gray-500 pl-6">
                    +{pb.steps.length - 3} more steps
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metrics Dashboard Tab (Story 14.6)
// ---------------------------------------------------------------------------
function MetricsDashboardTab({ metrics }: { metrics: IncidentMetrics }) {
  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-elevated px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] text-gray-500">Open Incidents</p>
              <p className="text-[28px] font-bold text-gray-900 tabular-nums">
                {metrics.openIncidents}
              </p>
            </div>
            {metrics.hasCritical && (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                <ShieldAlert className="h-5 w-5 text-red-500 animate-pulse" />
              </div>
            )}
            {!metrics.hasCritical && metrics.openIncidents === 0 && (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
            )}
          </div>
          {metrics.openIncidents === 0 && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              <CheckCircle2 className="h-3 w-3" /> All Clear
            </span>
          )}
          {metrics.hasCritical && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
              Critical incident active
            </span>
          )}
        </div>

        <div className="card-elevated px-5 py-4">
          <p className="text-[12px] text-gray-500">Isolated Devices</p>
          <p className="text-[28px] font-bold text-gray-900 tabular-nums">
            {metrics.isolatedDevices}
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-gray-500">
            <Lock className="h-3 w-3" /> Currently under isolation
          </span>
        </div>

        <div className="card-elevated px-5 py-4">
          <p className="text-[12px] text-gray-500">Active Quarantine Zones</p>
          <p className="text-[28px] font-bold text-gray-900 tabular-nums">
            {metrics.activeQuarantineZones}
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-gray-500">
            <MapPin className="h-3 w-3" /> Geographic zones
          </span>
        </div>
      </div>

      {/* MTTC / MTTR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card-elevated px-5 py-4">
          <p className="text-[12px] text-gray-500">Mean Time to Contain (MTTC)</p>
          <div className="mt-2 flex items-baseline gap-3">
            <p className="text-[32px] font-bold text-gray-900 tabular-nums">
              {metrics.meanTimeToContainHours}
            </p>
            <span className="text-[14px] text-gray-500">hours</span>
          </div>
          <div className="mt-2 flex items-center gap-1">
            <span
              className={cn(
                "text-[12px] font-medium",
                metrics.mttcTrend < 0 ? "text-emerald-600" : "text-red-600",
              )}
            >
              {metrics.mttcTrend < 0 ? `${metrics.mttcTrend}%` : `+${metrics.mttcTrend}%`}
            </span>
            <span className="text-[11px] text-gray-500">vs last period</span>
            {metrics.mttcTrend < 0 && (
              <span className="text-[10px] text-emerald-500">(improving)</span>
            )}
          </div>
        </div>
        <div className="card-elevated px-5 py-4">
          <p className="text-[12px] text-gray-500">Mean Time to Resolve (MTTR)</p>
          <div className="mt-2 flex items-baseline gap-3">
            <p className="text-[32px] font-bold text-gray-900 tabular-nums">
              {metrics.meanTimeToResolveHours}
            </p>
            <span className="text-[14px] text-gray-500">hours</span>
          </div>
          <div className="mt-2 flex items-center gap-1">
            <span
              className={cn(
                "text-[12px] font-medium",
                metrics.mttrTrend < 0 ? "text-emerald-600" : "text-red-600",
              )}
            >
              {metrics.mttrTrend < 0 ? `${metrics.mttrTrend}%` : `+${metrics.mttrTrend}%`}
            </span>
            <span className="text-[11px] text-gray-500">vs last period</span>
            {metrics.mttrTrend < 0 && (
              <span className="text-[10px] text-emerald-500">(improving)</span>
            )}
          </div>
        </div>
      </div>

      {/* Severity Pie Chart */}
      <div className="card-elevated px-5 py-4">
        <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Incidents by Severity</h3>
        <div className="flex items-center gap-8">
          {/* SVG Pie Chart */}
          <div className="shrink-0">
            <svg width="160" height="160" viewBox="0 0 160 160">
              {(() => {
                const total = metrics.bySeverity.reduce((sum, s) => sum + s.count, 0);
                let cumAngle = -90;
                const slices = metrics.bySeverity.map((s) => {
                  const pct = total > 0 ? s.count / total : 0;
                  const angle = pct * 360;
                  const startAngle = cumAngle;
                  cumAngle += angle;
                  return { ...s, pct, startAngle, angle };
                });

                return slices.map((slice) => {
                  const startRad = (slice.startAngle * Math.PI) / 180;
                  const endRad = ((slice.startAngle + slice.angle) * Math.PI) / 180;
                  const x1 = 80 + 60 * Math.cos(startRad);
                  const y1 = 80 + 60 * Math.sin(startRad);
                  const x2 = 80 + 60 * Math.cos(endRad);
                  const y2 = 80 + 60 * Math.sin(endRad);
                  const largeArc = slice.angle > 180 ? 1 : 0;
                  const d = `M 80 80 L ${x1} ${y1} A 60 60 0 ${largeArc} 1 ${x2} ${y2} Z`;
                  return (
                    <path
                      key={slice.severity}
                      d={d}
                      fill={SEVERITY_COLORS[slice.severity]}
                      stroke="white"
                      strokeWidth={2}
                    />
                  );
                });
              })()}
              <circle cx="80" cy="80" r="30" fill="white" />
              <text
                x="80"
                y="76"
                textAnchor="middle"
                className="text-[16px] fill-gray-900 font-bold"
              >
                {metrics.bySeverity.reduce((sum, s) => sum + s.count, 0)}
              </text>
              <text x="80" y="92" textAnchor="middle" className="text-[10px] fill-gray-400">
                Total
              </text>
            </svg>
          </div>
          {/* Legend */}
          <div className="flex-1 space-y-3">
            {metrics.bySeverity.map((s) => (
              <div key={s.severity} className="flex items-center gap-3">
                <span
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: SEVERITY_COLORS[s.severity] }}
                />
                <span className="flex-1 text-[13px] font-medium text-gray-700">{s.severity}</span>
                <span className="text-[14px] font-bold tabular-nums text-gray-900">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------
export function IncidentResponsePage() {
  const [activeTab, setActiveTab] = useState<TabId>("incidents");
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [quarantineZones] = useState<QuarantineZone[]>(MOCK_QUARANTINE_ZONES);
  const [playbooks] = useState<Playbook[]>(MOCK_PLAYBOOKS);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isolateDevice, setIsolateDevice] = useState<AffectedDevice | null>(null);
  const [releaseDevice, setReleaseDevice] = useState<AffectedDevice | null>(null);

  const isolatedCount = useMemo(() => {
    let count = 0;
    incidents.forEach((inc) => {
      inc.affectedDevices.forEach((dev) => {
        if (dev.status === "Isolated") count++;
      });
    });
    return count;
  }, [incidents]);

  const handleCreateIncident = useCallback((newIncident: Incident) => {
    setIncidents((prev) => [newIncident, ...prev]);
  }, []);

  const handleStatusChange = useCallback(
    (incidentId: string, newStatus: IncidentStatus, note: string) => {
      setIncidents((prev) =>
        prev.map((inc) => {
          if (inc.id !== incidentId) return inc;
          const event = {
            timestamp: new Date().toISOString(),
            action: "status_changed" as const,
            performedBy: "USR-001",
            performedByName: "Sarah Chen",
            fromStatus: inc.status,
            toStatus: newStatus,
            note: note || undefined,
          };
          return {
            ...inc,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            containedAt: newStatus === "Contained" ? new Date().toISOString() : inc.containedAt,
            resolvedAt: newStatus === "Resolved" ? new Date().toISOString() : inc.resolvedAt,
            timelineEvents: [...inc.timelineEvents, event],
          };
        }),
      );
      setSelectedIncident((prev) => {
        if (!prev || prev.id !== incidentId) return prev;
        const event = {
          timestamp: new Date().toISOString(),
          action: "status_changed" as const,
          performedBy: "USR-001",
          performedByName: "Sarah Chen",
          fromStatus: prev.status,
          toStatus: newStatus,
          note: note || undefined,
        };
        return {
          ...prev,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          timelineEvents: [...prev.timelineEvents, event],
        };
      });
    },
    [],
  );

  const handleIsolateConfirm = useCallback((deviceId: string, policy: IsolationPolicy) => {
    setIncidents((prev) =>
      prev.map((inc) => ({
        ...inc,
        affectedDevices: inc.affectedDevices.map((dev) =>
          dev.id === deviceId
            ? {
                ...dev,
                status: "Isolated" as const,
                isolatedAt: new Date().toISOString(),
                isolationPolicy: policy,
              }
            : dev,
        ),
      })),
    );
    setSelectedIncident((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        affectedDevices: prev.affectedDevices.map((dev) =>
          dev.id === deviceId
            ? {
                ...dev,
                status: "Isolated" as const,
                isolatedAt: new Date().toISOString(),
                isolationPolicy: policy,
              }
            : dev,
        ),
        timelineEvents: [
          ...prev.timelineEvents,
          {
            timestamp: new Date().toISOString(),
            action: "device_isolated" as const,
            performedBy: "USR-001",
            performedByName: "Sarah Chen",
            deviceId,
            deviceName: prev.affectedDevices.find((d) => d.id === deviceId)?.name,
            note: `${policy} policy applied`,
          },
        ],
      };
    });
    setIsolateDevice(null);
  }, []);

  const handleReleaseConfirm = useCallback((deviceId: string, reason: string) => {
    setIncidents((prev) =>
      prev.map((inc) => ({
        ...inc,
        affectedDevices: inc.affectedDevices.map((dev) =>
          dev.id === deviceId
            ? {
                ...dev,
                status: "Online" as const,
                isolatedAt: undefined,
                isolationPolicy: undefined,
              }
            : dev,
        ),
      })),
    );
    setSelectedIncident((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        affectedDevices: prev.affectedDevices.map((dev) =>
          dev.id === deviceId
            ? {
                ...dev,
                status: "Online" as const,
                isolatedAt: undefined,
                isolationPolicy: undefined,
              }
            : dev,
        ),
        timelineEvents: [
          ...prev.timelineEvents,
          {
            timestamp: new Date().toISOString(),
            action: "device_released" as const,
            performedBy: "USR-001",
            performedByName: "Sarah Chen",
            deviceId,
            deviceName: prev.affectedDevices.find((d) => d.id === deviceId)?.name,
            note: reason,
          },
        ],
      };
    });
    setReleaseDevice(null);
  }, []);

  const handleStepComplete = useCallback((incidentId: string, stepNumber: number) => {
    const updateProgress = (progress: Incident["playbookProgress"]) => {
      if (!progress) return progress;
      const updatedSteps = progress.steps.map((s) =>
        s.stepNumber === stepNumber
          ? {
              ...s,
              isCompleted: true,
              completedBy: "USR-001",
              completedByName: "Sarah Chen",
              completedAt: new Date().toISOString(),
            }
          : s,
      );
      return {
        ...progress,
        completedSteps: updatedSteps.filter((s) => s.isCompleted).length,
        steps: updatedSteps,
      };
    };

    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === incidentId
          ? { ...inc, playbookProgress: updateProgress(inc.playbookProgress) }
          : inc,
      ),
    );
    setSelectedIncident((prev) => {
      if (!prev || prev.id !== incidentId) return prev;
      return { ...prev, playbookProgress: updateProgress(prev.playbookProgress) };
    });
  }, []);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-gray-900">Incident Response</h1>
          <p className="mt-0.5 text-[13px] text-gray-500">
            Manage security incidents, device isolation, quarantine zones, and response playbooks
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-md px-4 py-2 text-[13px] font-medium cursor-pointer",
                isActive
                  ? "bg-[#FF7900] text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.id === "isolated" && isolatedCount > 0 && (
                <span
                  className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                    isActive ? "bg-white/20 text-white" : "bg-red-500 text-white",
                  )}
                >
                  {isolatedCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "incidents" && (
        <IncidentListTab
          incidents={incidents}
          onSelectIncident={(inc) => setSelectedIncident(inc)}
          onCreateIncident={() => setShowCreateDialog(true)}
        />
      )}
      {activeTab === "isolated" && (
        <IsolatedDevicesTab incidents={incidents} onRelease={(dev) => setReleaseDevice(dev)} />
      )}
      {activeTab === "quarantine" && (
        <QuarantineZonesTab
          zones={quarantineZones}
          onLift={() => {
            /* mock */
          }}
        />
      )}
      {activeTab === "playbooks" && <PlaybooksTab playbooks={playbooks} />}
      {activeTab === "dashboard" && <MetricsDashboardTab metrics={MOCK_INCIDENT_METRICS} />}

      {/* Detail Panel */}
      {selectedIncident && (
        <IncidentDetailPanel
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onStatusChange={handleStatusChange}
          onIsolate={(dev) => setIsolateDevice(dev)}
          onRelease={(dev) => setReleaseDevice(dev)}
          onStepComplete={handleStepComplete}
        />
      )}

      {/* Dialogs */}
      <CreateIncidentDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreate={handleCreateIncident}
      />
      <IsolationDialog
        device={isolateDevice}
        open={!!isolateDevice}
        onClose={() => setIsolateDevice(null)}
        onConfirm={handleIsolateConfirm}
      />
      <ReleaseDialog
        device={releaseDevice}
        open={!!releaseDevice}
        onClose={() => setReleaseDevice(null)}
        onConfirm={handleReleaseConfirm}
      />
    </div>
  );
}
