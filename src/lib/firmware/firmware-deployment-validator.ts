/**
 * Firmware deployment proof validator (Story 28.6 reference wiring).
 *
 * Domain-specific validator that plugs into the generic
 * `IConfirmationEngine.validators` registry under the
 * `"firmware-deployment"` kind. Keeps all firmware schema knowledge
 * OUTSIDE the compliance library so the library itself stays generic.
 */

import type { ProofValidator } from "@/lib/compliance/confirmation";

export const FIRMWARE_DEPLOYMENT_KIND = "firmware-deployment" as const;

export interface FirmwareDeploymentProof {
  readonly note: string;
  readonly photoEvidenceIds: readonly string[];
  readonly confirmedAt: string;
}

const NOTE_MIN = 10;
const NOTE_MAX = 2000;
const MAX_CONFIRM_AGE_DAYS = 30;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Validates a firmware deployment proof payload. Pure function — safe to
 * call every render.
 */
export const firmwareDeploymentValidator: ProofValidator<FirmwareDeploymentProof> = (proof) => {
  const messages: string[] = [];

  if (proof.note.length < NOTE_MIN || proof.note.length > NOTE_MAX) {
    messages.push(`Note must be ${NOTE_MIN}-${NOTE_MAX} characters.`);
  }
  if (proof.photoEvidenceIds.length < 1) {
    messages.push("At least one photo evidence reference is required.");
  }
  const ts = Date.parse(proof.confirmedAt);
  if (Number.isNaN(ts)) {
    messages.push("Confirmation timestamp must be a valid ISO-8601 date.");
  } else {
    const ageMs = Date.now() - ts;
    if (ageMs < 0) {
      messages.push("Confirmation timestamp cannot be in the future.");
    } else if (ageMs > MAX_CONFIRM_AGE_DAYS * MS_PER_DAY) {
      messages.push(`Confirmation timestamp must be within the last ${MAX_CONFIRM_AGE_DAYS} days.`);
    }
  }

  return { ok: messages.length === 0, messages };
};
