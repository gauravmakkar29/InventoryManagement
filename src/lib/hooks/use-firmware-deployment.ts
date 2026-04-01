import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import type {
  FirmwareEntry,
  FirmwareStage,
  FirmwareStatus,
  AuditAction,
} from "../../app/components/deployment/deployment-types";
import { INITIAL_FIRMWARE } from "../../app/components/deployment/deployment-constants";

export function useFirmwareDeployment(
  currentUser: string,
  addAuditEntry: (action: AuditAction, resourceType: string, resourceId: string) => void,
) {
  const [firmware, setFirmware] = useState<FirmwareEntry[]>(INITIAL_FIRMWARE);
  const [fwStatusFilter, setFwStatusFilter] = useState<FirmwareStatus | "All">("All");
  const [fwModelFilter, setFwModelFilter] = useState<string>("All");

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
      setFirmware((prev) => [newEntry, ...prev]);
      addAuditEntry("Created", "Firmware", `FW#${newEntry.id}`);
      toast.success(`Firmware ${data.version} uploaded successfully`);
      onComplete?.();
    },
    [currentUser, addAuditEntry],
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
        const confirmed = window.confirm(
          `Are you sure you want to advance ${fw.version} to Testing?`,
        );
        if (!confirmed) return;

        setFirmware((prev) =>
          prev.map((f) =>
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
      } else if (fw.stage === "Testing") {
        if (fw.testedBy === currentUser) {
          toast.error("Separation of Duties: The tester cannot approve");
          return;
        }
        const confirmed = window.confirm(
          `Are you sure you want to advance ${fw.version} to Approved?`,
        );
        if (!confirmed) return;

        setFirmware((prev) =>
          prev.map((f) =>
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
      }
    },
    [firmware, currentUser, addAuditEntry],
  );

  const deprecateFirmware = useCallback(
    (id: string) => {
      const fw = firmware.find((f) => f.id === id);
      if (!fw) return;
      const confirmed = window.confirm(`Deprecate firmware ${fw.version}?`);
      if (!confirmed) return;

      setFirmware((prev) =>
        prev.map((f) =>
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
    },
    [firmware, addAuditEntry],
  );

  const activateFirmware = useCallback(
    (id: string) => {
      const fw = firmware.find((f) => f.id === id);
      if (!fw) return;
      const confirmed = window.confirm(
        `Reactivate firmware ${fw.version}? It will return to Uploaded stage.`,
      );
      if (!confirmed) return;

      setFirmware((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, stage: "Uploaded" as FirmwareStage, status: "Pending" as FirmwareStatus }
            : f,
        ),
      );
      addAuditEntry("Modified", "Firmware", `FW#${fw.id}`);
      toast.success(`${fw.version} reactivated`);
    },
    [firmware, addAuditEntry],
  );

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
  };
}
