/**
 * Firmware intake artifact checklist (Epic 28 reference wiring).
 *
 * Domain-specific checklist schema for a firmware bundle submission.
 * This file lives in the firmware feature folder (NOT in
 * `src/lib/compliance/`) so the compliance library itself stays
 * domain-agnostic. The schema is consumed by `<FirmwareArtifactsTab>`
 * and fed to the generic `<ChecklistPanel>` compliance primitive.
 *
 * The slot taxonomy mirrors the real regulatory artifacts required by
 * SOC 2 / ISO 27001 for a firmware release:
 *
 * - sbom                 Software Bill of Materials (CycloneDX / SPDX)
 * - hbom                 Hardware Bill of Materials (per-unit; may be waived
 *                        permanent for purely software releases)
 * - fat-qa-results       Factory Acceptance Test / QA regression results
 * - release-notes        Customer-facing release notes
 * - architecture-diagram System / component diagram for the release
 * - patch-notes          Security patch notes (may be waived for features
 *                        with no security implications — permanent)
 * - attestation          Vendor attestation signed by Security Reviewer
 */

import type { ChecklistSchema } from "@/lib/compliance/checklist";

export type FirmwareArtifactSlotKey =
  | "sbom"
  | "hbom"
  | "fat-qa-results"
  | "release-notes"
  | "architecture-diagram"
  | "patch-notes"
  | "attestation";

export const FIRMWARE_INTAKE_SCHEMA_ID = "firmware-intake-v1" as const;

export const firmwareIntakeChecklistSchema: ChecklistSchema<FirmwareArtifactSlotKey> = {
  schemaId: FIRMWARE_INTAKE_SCHEMA_ID,
  label: "Firmware Intake Artifacts",
  slots: [
    {
      key: "sbom",
      label: "Software Bill of Materials",
      required: true,
      description: "CycloneDX or SPDX — lists every software component in the firmware image.",
    },
    {
      key: "hbom",
      label: "Hardware Bill of Materials",
      required: true,
      description:
        "Per-device component manifest. Waive permanently for software-only releases or product lines where H-BOM does not apply.",
    },
    {
      key: "fat-qa-results",
      label: "FAT / QA Test Results",
      required: true,
      description: "Factory Acceptance Test and regression results signed off by QA.",
    },
    {
      key: "release-notes",
      label: "Release Notes",
      required: true,
      description: "Customer-facing summary of changes shipped in this version.",
    },
    {
      key: "architecture-diagram",
      label: "Architecture / System Diagram",
      required: true,
      description: "System-level diagram showing component interactions for this release.",
    },
    {
      key: "patch-notes",
      label: "Security Patch Notes",
      required: false,
      description: "Only required when the release addresses a CVE or internal security finding.",
    },
    {
      key: "attestation",
      label: "Security Reviewer Attestation",
      required: true,
      description: "Signed attestation that the release has cleared security review.",
    },
  ],
};
