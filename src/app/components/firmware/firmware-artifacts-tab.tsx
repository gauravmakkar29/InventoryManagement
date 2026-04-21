/**
 * <FirmwareArtifactsTab /> — reference wiring of the Epic 28 compliance
 * library against the real firmware flow (behind `VITE_FEATURE_COMPLIANCE_LIB`).
 *
 * Renders the generic `<ChecklistPanel>` against the firmware-specific
 * `firmwareIntakeChecklistSchema`. On "Attach" the tab opens a file
 * picker, uploads the file to the immutable evidence store, then calls
 * the checklist engine's `attachSlot` to mark the slot present.
 *
 * All state lives inside the tab via per-mount mock stores for the
 * reference implementation — in production, the app would lift the
 * providers higher and wire them to the real S3 / DynamoDB adapters.
 */

import { useMemo, useRef, useState } from "react";

import { ChecklistPanel } from "@/app/components/compliance/checklist-panel";
import { useAuth } from "@/lib/use-auth";
import { ChecklistProvider, createMockChecklistStore } from "@/lib/compliance/checklist";
import { EvidenceStoreProvider, createMockEvidenceStore } from "@/lib/compliance/evidence";
import { useChecklist } from "@/lib/compliance/checklist";
import { useUploadEvidence } from "@/lib/compliance/evidence";
import type { ComplianceActor } from "@/lib/compliance/types";
import { canPerformAction, getPrimaryRole, type Role } from "@/lib/rbac";
import {
  FIRMWARE_INTAKE_SCHEMA_ID,
  firmwareIntakeChecklistSchema,
  type FirmwareArtifactSlotKey,
} from "@/lib/firmware/firmware-artifact-schema";

export interface FirmwareArtifactsTabProps {
  readonly firmwareVersionId: string;
}

export function FirmwareArtifactsTab({ firmwareVersionId }: FirmwareArtifactsTabProps) {
  const { user } = useAuth();

  const actor: ComplianceActor = useMemo(
    () => ({
      userId: user?.id ?? "anonymous",
      displayName: user?.name ?? user?.email ?? "Anonymous",
    }),
    [user],
  );

  const role: Role = useMemo(() => getPrimaryRole(user?.groups ?? []), [user]);
  const canAttach =
    canPerformAction(role, "checklist:attach") && canPerformAction(role, "evidence:put");
  const canWaive = canPerformAction(role, "checklist:waive");

  // Per-mount stores — reference wiring only. Real app would lift these
  // into a higher-level provider against production adapters.
  const stores = useMemo(() => {
    const resolveRole = () => role;
    return {
      evidenceStore: createMockEvidenceStore({ resolveRole }),
      checklistStore: createMockChecklistStore({
        resolveRole,
        seedSchemas: [firmwareIntakeChecklistSchema],
      }),
    };
  }, [role]);

  return (
    <EvidenceStoreProvider store={stores.evidenceStore} actor={actor}>
      <ChecklistProvider store={stores.checklistStore} actor={actor}>
        <ArtifactsTabBody
          firmwareVersionId={firmwareVersionId}
          canAttach={canAttach}
          canWaive={canWaive}
        />
      </ChecklistProvider>
    </EvidenceStoreProvider>
  );
}

interface BodyProps {
  readonly firmwareVersionId: string;
  readonly canAttach: boolean;
  readonly canWaive: boolean;
}

function ArtifactsTabBody({ firmwareVersionId, canAttach, canWaive }: BodyProps) {
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
    // Reset the input value so picking the same file twice still fires change
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
