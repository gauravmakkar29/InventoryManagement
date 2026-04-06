import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Incident, IncidentStatus, IsolationPolicy } from "../incident-types";
import { MOCK_INCIDENTS, MOCK_QUARANTINE_ZONES, MOCK_PLAYBOOKS } from "../incident-mock-data";
import { queryKeys } from "../query-keys";
import { mockQueryFn } from "./use-mock-query";

export function useIncidentManagement() {
  const queryClient = useQueryClient();

  const {
    data: incidents = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.incidents.list(),
    queryFn: mockQueryFn(MOCK_INCIDENTS),
    initialData: MOCK_INCIDENTS,
  });

  const { data: quarantineZones = [] } = useQuery({
    queryKey: [...queryKeys.incidents.all, "quarantineZones"] as const,
    queryFn: mockQueryFn(MOCK_QUARANTINE_ZONES),
    initialData: MOCK_QUARANTINE_ZONES,
  });

  const { data: playbooks = [] } = useQuery({
    queryKey: [...queryKeys.incidents.all, "playbooks"] as const,
    queryFn: mockQueryFn(MOCK_PLAYBOOKS),
    initialData: MOCK_PLAYBOOKS,
  });

  const incidentQueryKey = queryKeys.incidents.list();

  const isolatedCount = useMemo(() => {
    let count = 0;
    incidents.forEach((inc) => {
      inc.affectedDevices.forEach((dev) => {
        if (dev.status === "Isolated") count++;
      });
    });
    return count;
  }, [incidents]);

  const handleCreateIncident = useCallback(
    (newIncident: Incident) => {
      try {
        queryClient.setQueryData<Incident[]>(incidentQueryKey, (old) => [
          newIncident,
          ...(old ?? []),
        ]);
        toast.success(`Incident ${newIncident.id} created`);
      } catch (err) {
        toast.error(
          `Failed to create incident: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      }
    },
    [queryClient, incidentQueryKey],
  );

  const handleStatusChange = useCallback(
    (incidentId: string, newStatus: IncidentStatus, note: string) => {
      try {
        queryClient.setQueryData<Incident[]>(incidentQueryKey, (old) =>
          (old ?? []).map((inc) => {
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
        toast.success(`Incident status updated to ${newStatus}`);
      } catch (err) {
        toast.error(
          `Failed to update incident status: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      }
    },
    [queryClient, incidentQueryKey],
  );

  const handleIsolateConfirm = useCallback(
    (deviceId: string, policy: IsolationPolicy) => {
      try {
        queryClient.setQueryData<Incident[]>(incidentQueryKey, (old) =>
          (old ?? []).map((inc) => ({
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
        toast.success("Device isolated successfully");
      } catch (err) {
        toast.error(
          `Failed to isolate device: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      }
    },
    [queryClient, incidentQueryKey],
  );

  const handleReleaseConfirm = useCallback(
    (deviceId: string, _reason: string) => {
      try {
        queryClient.setQueryData<Incident[]>(incidentQueryKey, (old) =>
          (old ?? []).map((inc) => ({
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
        toast.success("Device released from isolation");
      } catch (err) {
        toast.error(
          `Failed to release device: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      }
    },
    [queryClient, incidentQueryKey],
  );

  const handleStepComplete = useCallback(
    (incidentId: string, stepNumber: number) => {
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

      queryClient.setQueryData<Incident[]>(incidentQueryKey, (old) =>
        (old ?? []).map((inc) =>
          inc.id === incidentId
            ? { ...inc, playbookProgress: updateProgress(inc.playbookProgress) }
            : inc,
        ),
      );
    },
    [queryClient, incidentQueryKey],
  );

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
    isLoading,
    error,
  };
}
