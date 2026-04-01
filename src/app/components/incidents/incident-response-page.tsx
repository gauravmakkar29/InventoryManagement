/**
 * IMS Gen 2 — Epic 14: Incident Response & Quarantine Management
 * Main page component implementing Stories 14.1–14.6
 */
import { useState, useCallback, useEffect } from "react";
import { cn } from "../../../lib/utils";
import type {
  Incident,
  IncidentStatus,
  AffectedDevice,
  IsolationPolicy,
} from "../../../lib/incident-types";
import { MOCK_INCIDENT_METRICS } from "../../../lib/incident-mock-data";
import { useIncidentManagement } from "../../../lib/hooks/use-incident-management";
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
  const {
    incidents,
    quarantineZones,
    playbooks,
    isolatedCount,
    handleCreateIncident,
    handleStatusChange: hookStatusChange,
    handleIsolateConfirm: hookIsolateConfirm,
    handleReleaseConfirm: hookReleaseConfirm,
    handleStepComplete: hookStepComplete,
  } = useIncidentManagement();

  const [activeTab, setActiveTab] = useState<TabId>("incidents");
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isolateDevice, setIsolateDevice] = useState<AffectedDevice | null>(null);
  const [releaseDevice, setReleaseDevice] = useState<AffectedDevice | null>(null);

  // Sync selectedIncident with incidents array after mutations
  useEffect(() => {
    if (selectedIncident) {
      const updated = incidents.find((inc) => inc.id === selectedIncident.id);
      if (updated && updated !== selectedIncident) {
        setSelectedIncident(updated);
      }
    }
  }, [incidents, selectedIncident]);

  const handleStatusChange = useCallback(
    (incidentId: string, newStatus: IncidentStatus, note: string) => {
      hookStatusChange(incidentId, newStatus, note);
    },
    [hookStatusChange],
  );

  const handleIsolateConfirm = useCallback(
    (deviceId: string, policy: IsolationPolicy) => {
      hookIsolateConfirm(deviceId, policy);
      setIsolateDevice(null);
    },
    [hookIsolateConfirm],
  );

  const handleReleaseConfirm = useCallback(
    (deviceId: string, reason: string) => {
      hookReleaseConfirm(deviceId, reason);
      setReleaseDevice(null);
    },
    [hookReleaseConfirm],
  );

  const handleStepComplete = useCallback(
    (incidentId: string, stepNumber: number) => {
      hookStepComplete(incidentId, stepNumber);
    },
    [hookStepComplete],
  );

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
