/**
 * IMS Gen 2 — Epic 14: Incident Response & Quarantine Management
 * Main page component implementing Stories 14.1–14.6
 */
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/use-auth";
import { getPrimaryRole, canPerformAction } from "@/lib/rbac";
import { useDialogManager } from "@/lib/hooks/use-dialog-manager";
import type {
  Incident,
  IncidentStatus,
  AffectedDevice,
  IsolationPolicy,
} from "@/lib/incident-types";
import { MOCK_INCIDENT_METRICS } from "@/lib/incident-mock-data";
import { useIncidentManagement } from "@/lib/hooks/use-incident-management";
import type { TabId } from "./incident-types";
import { TABS } from "./incident-types";
import { CreateIncidentDialog } from "./create-incident-dialog";
import { IsolationDialog } from "./isolation-dialog";
import { ReleaseDialog } from "./release-dialog";
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
  const { groups } = useAuth();
  const role = getPrimaryRole(groups);

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

  // Story 21.5: Unified dialog manager — guarantees one dialog at a time
  type IncidentDialog = "create" | "isolate" | "release";
  const dialogs = useDialogManager<IncidentDialog>();

  // Sync selectedIncident with incidents array after mutations
  useEffect(() => {
    if (selectedIncident) {
      const updated = incidents.find((inc) => inc.id === selectedIncident.id);
      if (updated && updated !== selectedIncident) {
        setSelectedIncident(updated);
      }
    }
  }, [incidents, selectedIncident]);

  const handleCreateIncidentGuarded = useCallback(
    (newIncident: Incident) => {
      if (!canPerformAction(role, "create")) {
        toast.error("Access denied — insufficient permissions");
        return;
      }
      handleCreateIncident(newIncident);
    },
    [role, handleCreateIncident],
  );

  const handleStatusChange = useCallback(
    (incidentId: string, newStatus: IncidentStatus, note: string) => {
      if (!canPerformAction(role, "edit")) {
        toast.error("Access denied — insufficient permissions");
        return;
      }
      hookStatusChange(incidentId, newStatus, note);
    },
    [role, hookStatusChange],
  );

  const handleIsolateConfirm = useCallback(
    (deviceId: string, policy: IsolationPolicy) => {
      if (!canPerformAction(role, "edit")) {
        toast.error("Access denied — insufficient permissions");
        return;
      }
      hookIsolateConfirm(deviceId, policy);
      dialogs.close();
    },
    [role, hookIsolateConfirm],
  );

  const handleReleaseConfirm = useCallback(
    (deviceId: string, reason: string) => {
      if (!canPerformAction(role, "edit")) {
        toast.error("Access denied — insufficient permissions");
        return;
      }
      hookReleaseConfirm(deviceId, reason);
      dialogs.close();
    },
    [role, hookReleaseConfirm],
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
          <h1 className="text-[20px] font-semibold text-foreground">Incident Response</h1>
          <p className="mt-0.5 text-[14px] text-muted-foreground">
            Manage security incidents, device isolation, quarantine zones, and response playbooks
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-md px-4 py-2 text-[14px] font-medium cursor-pointer",
                isActive
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.id === "isolated" && isolatedCount > 0 && (
                <span
                  className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[12px] font-bold",
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
          onCreateIncident={() => dialogs.open("create")}
        />
      )}
      {activeTab === "isolated" && (
        <IsolatedDevicesTab
          incidents={incidents}
          onRelease={(dev) => dialogs.open("release", { device: dev })}
        />
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
          onIsolate={(dev) => dialogs.open("isolate", { device: dev })}
          onRelease={(dev) => dialogs.open("release", { device: dev })}
          onStepComplete={handleStepComplete}
        />
      )}

      {/* Dialogs */}
      <CreateIncidentDialog
        open={dialogs.isDialogOpen("create")}
        onClose={dialogs.close}
        onCreate={handleCreateIncidentGuarded}
      />
      <IsolationDialog
        device={dialogs.getContext<AffectedDevice>("device") ?? null}
        open={dialogs.isDialogOpen("isolate")}
        onClose={dialogs.close}
        onConfirm={handleIsolateConfirm}
      />
      <ReleaseDialog
        device={dialogs.getContext<AffectedDevice>("device") ?? null}
        open={dialogs.isDialogOpen("release")}
        onClose={dialogs.close}
        onConfirm={handleReleaseConfirm}
      />
    </div>
  );
}
