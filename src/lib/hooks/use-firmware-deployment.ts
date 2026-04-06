import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  FirmwareEntry,
  FirmwareStage,
  FirmwareStatus,
  AuditAction,
} from "../types/deployment";
import { INITIAL_FIRMWARE } from "../types/deployment-constants";
import { queryKeys } from "../query-keys";
import { mockQueryFn } from "./use-mock-query";

/** Pending confirmation state exposed for ConfirmDialog rendering (Story 21.2) */
export interface FirmwareConfirmation {
  id: string;
  title: string;
  message: string;
  variant: "danger" | "warning" | "primary";
  confirmLabel: string;
}

const firmwareQueryKey = queryKeys.firmware.list();

export function useFirmwareDeployment(
  currentUser: string,
  addAuditEntry: (action: AuditAction, resourceType: string, resourceId: string) => void,
) {
  const queryClient = useQueryClient();

  const {
    data: firmware = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: firmwareQueryKey,
    queryFn: mockQueryFn(INITIAL_FIRMWARE),
    initialData: INITIAL_FIRMWARE,
  });

  const [fwStatusFilter, setFwStatusFilter] = useState<FirmwareStatus | "All">("All");
  const [fwModelFilter, setFwModelFilter] = useState<string>("All");

  // Story 21.2: Replace window.confirm with async confirmation pattern
  const [pendingConfirmation, setPendingConfirmation] = useState<FirmwareConfirmation | null>(null);
  const pendingActionRef = { current: null as (() => void) | null };

  const filteredFirmware = useMemo(() => {
    let items = firmware;
    if (fwStatusFilter !== "All") {
      items = items.filter((fw) => fw.status === fwStatusFilter);
    }
    if (fwModelFilter !== "All") {
      items = items.filter((fw) => fw.models.includes(fwModelFilter));
    }
    return items;
  }, [firmware, fwStatusFilter, fwModelFilter]);

  const handleUpload = useCallback(
    (
      data: {
        version: string;
        name: string;
        models: string[];
        releaseNotes: string;
        fileSize: string;
        checksum: string;
      },
      onComplete?: () => void,
    ) => {
      try {
        const newEntry: FirmwareEntry = {
          id: `fw-${Date.now()}`,
          version: data.version,
          name: data.name,
          stage: "Uploaded",
          status: "Pending",
          uploadedBy: currentUser,
          uploadedDate: new Date().toISOString(),
          testedBy: null,
          testedDate: null,
          approvedBy: null,
          approvedDate: null,
          date: new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          devices: 0,
          models: data.models.length > 0 ? data.models : ["INV-3200"],
          releaseNotes: data.releaseNotes,
          fileSize: data.fileSize,
          checksum: data.checksum,
        };
        queryClient.setQueryData<FirmwareEntry[]>(firmwareQueryKey, (old) => [
          newEntry,
          ...(old ?? []),
        ]);
        addAuditEntry("Created", "Firmware", `FW#${newEntry.id}`);
        toast.success(`Firmware ${data.version} uploaded successfully`);
        onComplete?.();
      } catch (err) {
        toast.error(
          `Firmware upload failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      }
    },
    [currentUser, addAuditEntry, queryClient],
  );

  const advanceStage = useCallback(
    (id: string) => {
      const fw = firmware.find((f) => f.id === id);
      if (!fw) return;

      if (fw.stage === "Uploaded") {
        if (fw.uploadedBy === currentUser) {
          toast.error("Separation of Duties: The uploader cannot advance to Testing");
          return;
        }
        // Story 21.2: Async confirmation via ConfirmDialog
        setPendingConfirmation({
          id,
          title: "Advance to Testing",
          message: `Are you sure you want to advance ${fw.version} to Testing?`,
          variant: "primary",
          confirmLabel: "Advance",
        });
        pendingActionRef.current = () => {
          queryClient.setQueryData<FirmwareEntry[]>(firmwareQueryKey, (old) =>
            (old ?? []).map((f) =>
              f.id === id
                ? {
                    ...f,
                    stage: "Testing" as FirmwareStage,
                    testedBy: currentUser,
                    testedDate: new Date().toISOString(),
                  }
                : f,
            ),
          );
          addAuditEntry("Modified", "Firmware", `FW#${fw.id}`);
          toast.success(`${fw.version} advanced to Testing`);
        };
      } else if (fw.stage === "Testing") {
        if (fw.testedBy === currentUser) {
          toast.error("Separation of Duties: The tester cannot approve");
          return;
        }
        setPendingConfirmation({
          id,
          title: "Approve Firmware",
          message: `Are you sure you want to advance ${fw.version} to Approved?`,
          variant: "primary",
          confirmLabel: "Approve",
        });
        pendingActionRef.current = () => {
          queryClient.setQueryData<FirmwareEntry[]>(firmwareQueryKey, (old) =>
            (old ?? []).map((f) =>
              f.id === id
                ? {
                    ...f,
                    stage: "Approved" as FirmwareStage,
                    status: "Active" as FirmwareStatus,
                    approvedBy: currentUser,
                    approvedDate: new Date().toISOString(),
                  }
                : f,
            ),
          );
          addAuditEntry("Modified", "Firmware", `FW#${fw.id}`);
          toast.success(`${fw.version} approved`);
        };
      }
    },
    [firmware, currentUser, addAuditEntry, queryClient],
  );

  const deprecateFirmware = useCallback(
    (id: string) => {
      const fw = firmware.find((f) => f.id === id);
      if (!fw) return;
      setPendingConfirmation({
        id,
        title: "Deprecate Firmware",
        message: `Deprecate firmware ${fw.version}? This will remove it from active deployment.`,
        variant: "danger",
        confirmLabel: "Deprecate",
      });
      pendingActionRef.current = () => {
        try {
          queryClient.setQueryData<FirmwareEntry[]>(firmwareQueryKey, (old) =>
            (old ?? []).map((f) =>
              f.id === id
                ? {
                    ...f,
                    stage: "Deprecated" as FirmwareStage,
                    status: "Deprecated" as FirmwareStatus,
                    devices: 0,
                  }
                : f,
            ),
          );
          addAuditEntry("Modified", "Firmware", `FW#${fw.id}`);
          toast.success(`${fw.version} deprecated`);
        } catch (err) {
          toast.error(
            `Failed to deprecate firmware: ${err instanceof Error ? err.message : "Unknown error"}`,
          );
        }
      };
    },
    [firmware, addAuditEntry, queryClient],
  );

  const activateFirmware = useCallback(
    (id: string) => {
      const fw = firmware.find((f) => f.id === id);
      if (!fw) return;
      setPendingConfirmation({
        id,
        title: "Reactivate Firmware",
        message: `Reactivate firmware ${fw.version}? It will return to Uploaded stage.`,
        variant: "warning",
        confirmLabel: "Reactivate",
      });
      pendingActionRef.current = () => {
        try {
          queryClient.setQueryData<FirmwareEntry[]>(firmwareQueryKey, (old) =>
            (old ?? []).map((f) =>
              f.id === id
                ? { ...f, stage: "Uploaded" as FirmwareStage, status: "Pending" as FirmwareStatus }
                : f,
            ),
          );
          addAuditEntry("Modified", "Firmware", `FW#${fw.id}`);
          toast.success(`${fw.version} reactivated`);
        } catch (err) {
          toast.error(
            `Failed to reactivate firmware: ${err instanceof Error ? err.message : "Unknown error"}`,
          );
        }
      };
    },
    [firmware, addAuditEntry, queryClient],
  );

  const confirmAction = useCallback(() => {
    pendingActionRef.current?.();
    pendingActionRef.current = null;
    setPendingConfirmation(null);
  }, []);

  const cancelAction = useCallback(() => {
    pendingActionRef.current = null;
    setPendingConfirmation(null);
  }, []);

  return {
    firmware,
    filteredFirmware,
    fwStatusFilter,
    setFwStatusFilter,
    fwModelFilter,
    setFwModelFilter,
    handleUpload,
    advanceStage,
    deprecateFirmware,
    activateFirmware,
    // Story 21.2: Async confirmation support
    pendingConfirmation,
    confirmAction,
    cancelAction,
    isLoading,
    error,
  };
}
