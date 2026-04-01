import { useState, useCallback, useMemo } from "react";
import type {
  Incident,
  IncidentStatus,
  IsolationPolicy,
  QuarantineZone,
  Playbook,
} from "../incident-types";
import { MOCK_INCIDENTS, MOCK_QUARANTINE_ZONES, MOCK_PLAYBOOKS } from "../incident-mock-data";

export function useIncidentManagement() {
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [quarantineZones] = useState<QuarantineZone[]>(MOCK_QUARANTINE_ZONES);
  const [playbooks] = useState<Playbook[]>(MOCK_PLAYBOOKS);

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
  }, []);

  const handleReleaseConfirm = useCallback((deviceId: string, _reason: string) => {
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
  }, []);

  return {
    incidents,
    quarantineZones,
    playbooks,
    isolatedCount,
    handleCreateIncident,
    handleStatusChange,
    handleIsolateConfirm,
    handleReleaseConfirm,
    handleStepComplete,
  };
}
