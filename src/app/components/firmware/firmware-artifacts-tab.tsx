/**
 * <FirmwareArtifactsTab /> — reference wiring of the Epic 28 compliance
 * library against the real firmware flow (behind `VITE_FEATURE_COMPLIANCE_LIB`).
 *
 * Renders the generic `<ChecklistPanel>` against the firmware-specific
 * `firmwareIntakeChecklistSchema`. On "Attach" the tab opens a file
 * picker, uploads the file to the immutable evidence store, then calls
 * the checklist engine's `attachSlot` to mark the slot present.
 *
 * Stores are provided externally via `<FirmwareComplianceProvider>` so
 * the checklist completeness can also drive the sibling Review tab's
 * approval state.
 */

import { useRef, useState } from "react";

import { ChecklistPanel } from "@/app/components/compliance/checklist-panel";
import { useChecklist } from "@/lib/compliance/checklist";
import { useUploadEvidence } from "@/lib/compliance/evidence";
import { useAuth } from "@/lib/use-auth";
import { canPerformAction, getPrimaryRole } from "@/lib/rbac";
import {
  FIRMWARE_INTAKE_SCHEMA_ID,
  type FirmwareArtifactSlotKey,
} from "@/lib/firmware/firmware-artifact-schema";

export interface FirmwareArtifactsTabProps {
  readonly firmwareVersionId: string;
}

export function FirmwareArtifactsTab({ firmwareVersionId }: FirmwareArtifactsTabProps) {
  const { user } = useAuth();
  const role = getPrimaryRole(user?.groups ?? []);
  const canAttach =
    canPerformAction(role, "checklist:attach") && canPerformAction(role, "evidence:put");
  const canWaive = canPerformAction(role, "checklist:waive");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingSlotRef = useRef<FirmwareArtifactSlotKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { attachSlot } = useChecklist(FIRMWARE_INTAKE_SCHEMA_ID, firmwareVersionId);
  const uploadEvidence = useUploadEvidence();

  const onAttachClick = (slotKey: string) => {
    setError(null);
    pendingSlotRef.current = slotKey as FirmwareArtifactSlotKey;
    fileInputRef.current?.click();
  };

  const onFileChosen = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const slot = pendingSlotRef.current;
    if (fileInputRef.current) fileInputRef.current.value = "";
    pendingSlotRef.current = null;
    if (!file || !slot) return;

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const meta = await uploadEvidence.mutateAsync({
        bytes,
        mimeType: file.type || "application/octet-stream",
        retentionMode: "compliance",
        retainUntil: tenYearsFromNowISO(),
        tags: {
          subject: firmwareVersionId,
          slot,
          filename: file.name,
        },
      });
      await attachSlot(slot, meta.id);
    } catch (e) {
      setError((e as Error).message ?? "Upload failed");
    }
  };

  return (
    <div className="space-y-3">
      <ChecklistPanel
        schemaId={FIRMWARE_INTAKE_SCHEMA_ID}
        subjectId={firmwareVersionId}
        canAttach={canAttach}
        canWaive={canWaive}
        onAttach={onAttachClick}
      />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={onFileChosen}
        aria-hidden="true"
      />
      {error && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-2 text-[12px] text-red-800"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function tenYearsFromNowISO(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 10);
  return d.toISOString();
}
