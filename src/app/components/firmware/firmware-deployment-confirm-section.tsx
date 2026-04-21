/**
 * <FirmwareDeploymentConfirmSection /> — Epic 28 reference wiring for the
 * two-phase action confirmation primitive.
 *
 * Pattern:
 *   initiate()   — button click creates an ActionInitiation record
 *   complete()   — dialog submit runs the firmware-deployment validator
 *                  and transitions the record to "confirmed"
 *   abandon()    — explicit abandon action with reason
 *
 * All flow state lives in the engine (shared via `<FirmwareComplianceProvider>`),
 * so the section surfaces "initiated" vs "confirmed" vs "abandoned" from
 * the engine's records without holding its own state.
 */

import { useCallback, useEffect, useState } from "react";

import { ConfirmationDialog } from "@/app/components/compliance/confirmation-dialog";
import {
  FIRMWARE_DEPLOYMENT_KIND,
  type FirmwareDeploymentProof,
} from "@/lib/firmware/firmware-deployment-validator";
import type { ActionInitiation } from "@/lib/compliance/confirmation";
import { useFirmwareConfirmationEngine } from "./firmware-compliance-provider";

export interface FirmwareDeploymentConfirmSectionProps {
  readonly firmwareVersionId: string;
  readonly actor: { readonly userId: string; readonly displayName: string };
}

export function FirmwareDeploymentConfirmSection({
  firmwareVersionId,
  actor,
}: FirmwareDeploymentConfirmSectionProps) {
  const engine = useFirmwareConfirmationEngine();

  const [initiation, setInitiation] = useState<ActionInitiation | null>(null);
  const [allByFirmware, setAllByFirmware] = useState<readonly ActionInitiation[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const records = await engine.loadByKind(FIRMWARE_DEPLOYMENT_KIND, {});
    const forThisFirmware = records.filter(
      (r) => (r.payload as { firmwareVersionId?: string }).firmwareVersionId === firmwareVersionId,
    );
    setAllByFirmware(forThisFirmware);
  }, [engine, firmwareVersionId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onInitiate = async () => {
    setError(null);
    try {
      const created = await engine.initiate<{ readonly firmwareVersionId: string }>(
        FIRMWARE_DEPLOYMENT_KIND,
        { firmwareVersionId },
        actor,
      );
      setInitiation(created);
      setDialogOpen(true);
      await refresh();
    } catch (e) {
      setError((e as Error).message ?? "Failed to initiate deployment record");
    }
  };

  const onAbandon = async (id: string) => {
    const reason = prompt("Why are you abandoning this deployment?");
    if (!reason) return;
    if (reason.length < 10 || reason.length > 500) {
      setError("Abandon reason must be 10-500 characters.");
      return;
    }
    try {
      await engine.abandon(id, reason, actor);
      await refresh();
    } catch (e) {
      setError((e as Error).message ?? "Failed to abandon");
    }
  };

  const onConfirm = async (proof: FirmwareDeploymentProof) => {
    if (!initiation) return;
    try {
      await engine.complete(initiation.id, proof, actor);
      setDialogOpen(false);
      setInitiation(null);
      await refresh();
    } catch (e) {
      setError((e as Error).message ?? "Confirmation failed");
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground">Deployment confirmation</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Close the chain of custody: record when + where the firmware was installed with photo
            evidence. Initiate → complete-with-proof (NIST AU-2/3).
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onInitiate()}
          className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary/90"
        >
          Record deployment
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-[12px] text-red-800"
        >
          {error}
        </p>
      )}

      {allByFirmware.length > 0 && (
        <ul className="mt-3 space-y-2">
          {allByFirmware.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-[12px]"
            >
              <div>
                <span className="font-medium text-foreground">{r.id}</span>
                <span
                  className={
                    r.state === "confirmed"
                      ? "ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-800"
                      : r.state === "abandoned"
                        ? "ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                        : "ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-900"
                  }
                >
                  {r.state}
                </span>
                <span className="ml-2 text-muted-foreground">
                  {new Date(r.initiatedAt).toLocaleString()}
                </span>
              </div>
              {r.state === "initiated" && (
                <button
                  type="button"
                  onClick={() => void onAbandon(r.id)}
                  className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
                >
                  Abandon
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {dialogOpen && initiation && (
        <ConfirmationDialog<FirmwareDeploymentProof>
          initiation={initiation}
          validator={
            engine.validators.get<FirmwareDeploymentProof>(FIRMWARE_DEPLOYMENT_KIND) ??
            (() => ({ ok: false, messages: ["validator not registered"] }))
          }
          initialProof={{
            note: "",
            photoEvidenceIds: [],
            confirmedAt: new Date().toISOString(),
          }}
          onConfirm={onConfirm}
          onClose={() => {
            setDialogOpen(false);
            setInitiation(null);
          }}
          title="Confirm firmware deployment"
          renderFields={({ proof, setProof }) => (
            <>
              <div>
                <label
                  htmlFor="fw-deploy-note"
                  className="mb-1 block text-[12px] font-medium text-foreground"
                >
                  Installation notes
                </label>
                <textarea
                  id="fw-deploy-note"
                  value={proof.note}
                  onChange={(e) => setProof({ ...proof, note: e.target.value })}
                  rows={3}
                  placeholder="Where, when, and how the firmware was installed."
                  className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-[12px] outline-none focus:border-primary"
                />
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {proof.note.length}/2000 characters (min 10)
                </p>
              </div>
              <div>
                <label
                  htmlFor="fw-deploy-photos"
                  className="mb-1 block text-[12px] font-medium text-foreground"
                >
                  Photo evidence references (one per line)
                </label>
                <textarea
                  id="fw-deploy-photos"
                  value={proof.photoEvidenceIds.join("\n")}
                  onChange={(e) =>
                    setProof({
                      ...proof,
                      photoEvidenceIds: e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  rows={2}
                  placeholder="ev-install-photo-1&#10;ev-install-photo-2"
                  className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-[12px] outline-none focus:border-primary"
                />
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Attach at least one photo evidence id
                </p>
              </div>
            </>
          )}
        />
      )}
    </div>
  );
}
