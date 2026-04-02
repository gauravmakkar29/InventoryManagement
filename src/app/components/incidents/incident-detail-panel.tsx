/**
 * IMS Gen 2 — Epic 14: Incident Detail Panel (Story 14.1 AC3, 14.2, 14.3, 14.5)
 */
import { useState } from "react";
import { Lock, Unlock, BookOpen, X } from "lucide-react";
import { cn } from "../../../lib/utils";
import { formatDateTime, formatRelativeTime } from "../../../lib/utils";
import type { Incident, IncidentStatus, AffectedDevice } from "../../../lib/incident-types";
import { STATUS_COLORS, VALID_TRANSITIONS } from "../../../lib/incident-types";
import { MOCK_TOPOLOGY, MOCK_LATERAL_MOVEMENT } from "../../../lib/incident-mock-data";
import { SeverityBadge, StatusBadge, CategoryBadge } from "./incident-badges";
import { IncidentTimeline } from "./incident-timeline";
import { PlaybookExecutor } from "./playbook-executor";
import { NetworkTopologyGraph, LateralMovementPanel } from "./network-topology-graph";

export function IncidentDetailPanel({
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
    <div className="fixed inset-y-0 right-0 z-30 flex w-full max-w-2xl flex-col border-l border-border bg-card shadow-xl">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-mono text-muted-foreground">{incident.id}</span>
              <SeverityBadge severity={incident.severity} />
              <StatusBadge status={incident.status} />
            </div>
            <h2 className="mt-1.5 text-[16px] font-semibold text-foreground truncate">
              {incident.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted cursor-pointer"
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
                className="rounded-lg border border-border px-3 py-1.5 text-[14px] font-medium text-foreground/80 hover:bg-muted cursor-pointer"
              >
                Change Status
              </button>
              {showStatusMenu && (
                <div className="absolute left-0 top-full z-10 mt-1 w-48 rounded-lg border border-border bg-card py-1 shadow-lg">
                  {validNext.map((s) => (
                    <button
                      key={s}
                      className="flex w-full items-center gap-2 px-3 py-2 text-[14px] text-foreground/80 hover:bg-muted cursor-pointer"
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
                      className="w-full rounded border border-border px-2 py-1 text-[13px] focus:outline-none focus:border-accent-text"
                    />
                  </div>
                </div>
              )}
            </div>
            <span className="text-[13px] text-muted-foreground">
              Assigned to {incident.assignedToName}
            </span>
          </div>
        )}
      </div>

      {/* Section tabs */}
      <div className="flex shrink-0 border-b border-border px-6">
        {(["details", "devices", "topology", "playbook", "timeline"] as const).map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={cn(
              "px-3 py-2.5 text-[14px] font-medium border-b-2 cursor-pointer capitalize",
              activeSection === section
                ? "border-accent-text text-accent-text"
                : "border-transparent text-muted-foreground hover:text-foreground/80",
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
              <h4 className="text-[14px] font-semibold text-muted-foreground uppercase mb-1">
                Description
              </h4>
              <p className="text-[14px] text-foreground/80 leading-relaxed">
                {incident.description}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-[13px] font-semibold text-muted-foreground">Category</p>
                <div className="mt-1">
                  <CategoryBadge category={incident.category} />
                </div>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-[13px] font-semibold text-muted-foreground">Affected Devices</p>
                <p className="mt-1 text-[16px] font-bold text-foreground">
                  {incident.affectedDeviceCount}
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-[13px] font-semibold text-muted-foreground">Reported By</p>
                <p className="mt-1 text-[14px] font-medium text-foreground">
                  {incident.reportedByName}
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-[13px] font-semibold text-muted-foreground">Created</p>
                <p className="mt-1 text-[14px] font-medium text-foreground">
                  {formatDateTime(incident.createdAt)}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSection === "devices" && (
          <div className="space-y-2">
            {incident.affectedDevices.map((device) => (
              <div key={device.id} className="rounded-lg border border-border p-3">
                {device.status === "Isolated" && (
                  <div className="mb-2 flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-1.5">
                    <Lock className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-[13px] font-semibold text-red-700">ISOLATED</span>
                    {device.isolatedAt && (
                      <span className="text-[12px] text-red-500">
                        &middot; {formatRelativeTime(device.isolatedAt)}
                      </span>
                    )}
                    {device.isolationPolicy && (
                      <span className="text-[12px] text-red-500">
                        &middot; {device.isolationPolicy}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-medium text-foreground">{device.name}</p>
                    <p className="text-[13px] text-muted-foreground">
                      {device.location} &middot; {device.firmwareVersion} &middot; Risk:{" "}
                      {device.riskScore}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {device.status !== "Isolated" ? (
                      <button
                        onClick={() => onIsolate(device)}
                        className="rounded-lg bg-red-50 px-3 py-1.5 text-[13px] font-medium text-red-700 hover:bg-red-100 cursor-pointer"
                      >
                        <Lock className="mr-1 inline h-3 w-3" /> Isolate
                      </button>
                    ) : (
                      <button
                        onClick={() => onRelease(device)}
                        className="rounded-lg bg-emerald-50 px-3 py-1.5 text-[13px] font-medium text-emerald-700 hover:bg-emerald-100 cursor-pointer"
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
                <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-[15px] font-medium text-foreground/80">No playbook attached</p>
                <p className="text-[14px] text-muted-foreground mt-1">
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
