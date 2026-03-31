/**
 * IMS Gen 2 — Epic 14: Incident Response & Quarantine Management
 * Main page component implementing Stories 14.1–14.6
 */
import { useState, useCallback, useMemo } from "react";
import { cn } from "../../../lib/utils";
import type {
  Incident,
  IncidentStatus,
  AffectedDevice,
  QuarantineZone,
  Playbook,
  IsolationPolicy,
} from "../../../lib/incident-types";
import {
  MOCK_INCIDENTS,
  MOCK_QUARANTINE_ZONES,
  MOCK_PLAYBOOKS,
  MOCK_INCIDENT_METRICS,
} from "../../../lib/incident-mock-data";
import type { TabId } from "./incident-types";
import { TABS } from "./incident-types";
import { CreateIncidentDialog, IsolationDialog, ReleaseDialog } from "./incident-dialogs";
import { IncidentDetailPanel } from "./incident-detail-panel";
import { IncidentListTab } from "./incident-list-tab";
import { IsolatedDevicesTab } from "./isolated-devices-tab";
import { QuarantineZonesTab } from "./quarantine-zones-tab";
import { PlaybooksTab } from "./playbooks-tab";
import { MetricsDashboardTab } from "./metrics-dashboard-tab";

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
