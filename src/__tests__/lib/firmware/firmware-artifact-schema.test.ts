import { describe, expect, it } from "vitest";
import {
  FIRMWARE_INTAKE_SCHEMA_ID,
  firmwareIntakeChecklistSchema,
} from "@/lib/firmware/firmware-artifact-schema";
import { evaluateCompleteness } from "@/lib/compliance/checklist";
import type { ChecklistState, SlotState } from "@/lib/compliance/checklist";

const NOW = "2026-04-21T10:00:00Z";
const ACTOR = { userId: "alice", displayName: "Alice" };

function mkState(slots: Record<string, SlotState>): ChecklistState {
  return {
    schemaId: FIRMWARE_INTAKE_SCHEMA_ID,
    subjectId: "fw-v1",
    slots,
  };
}

function present(id = "ev-test"): SlotState {
  return { kind: "present", evidenceId: id, filledAt: NOW, filledBy: ACTOR };
}

describe("firmware artifact schema", () => {
  it("every required slot is captured and stable", () => {
    const required = firmwareIntakeChecklistSchema.slots
      .filter((s) => s.required)
      .map((s) => s.key)
      .sort();
    expect(required).toEqual([
      "architecture-diagram",
      "attestation",
      "fat-qa-results",
      "hbom",
      "release-notes",
      "sbom",
    ]);
  });

  it("patch-notes is optional (waiveable without blocking approval)", () => {
    const patchNotes = firmwareIntakeChecklistSchema.slots.find((s) => s.key === "patch-notes");
    expect(patchNotes?.required).toBe(false);
  });

  it("evaluateCompleteness returns complete when all required slots are present", () => {
    const state = mkState({
      sbom: present(),
      hbom: present(),
      "fat-qa-results": present(),
      "release-notes": present(),
      "architecture-diagram": present(),
      attestation: present(),
    });
    const c = evaluateCompleteness(firmwareIntakeChecklistSchema, state);
    expect(c.kind).toBe("complete");
  });

  it("missing SBOM makes checklist incomplete", () => {
    const state = mkState({
      sbom: { kind: "missing" },
      hbom: present(),
      "fat-qa-results": present(),
      "release-notes": present(),
      "architecture-diagram": present(),
      attestation: present(),
    });
    const c = evaluateCompleteness(firmwareIntakeChecklistSchema, state);
    expect(c.kind).toBe("incomplete");
    if (c.kind === "incomplete") expect(c.missing).toContain("sbom");
  });

  it("conditional HBOM waiver yields conditionally-complete", () => {
    const state = mkState({
      sbom: present(),
      hbom: {
        kind: "waived-conditional",
        reason: "H-BOM format change scheduled for next release — temporary waiver.",
        dueAt: "2030-01-01T00:00:00Z",
        waivedAt: NOW,
        waivedBy: ACTOR,
      },
      "fat-qa-results": present(),
      "release-notes": present(),
      "architecture-diagram": present(),
      attestation: present(),
    });
    const c = evaluateCompleteness(firmwareIntakeChecklistSchema, state);
    expect(c.kind).toBe("conditionally-complete");
    if (c.kind === "conditionally-complete") {
      expect(c.pendingWaivers).toContain("hbom");
    }
  });

  it("permanent HBOM waiver counts as complete (not conditional)", () => {
    const state = mkState({
      sbom: present(),
      hbom: {
        kind: "waived-permanent",
        reason: "Software-only product line — H-BOM does not apply.",
        waivedAt: NOW,
        waivedBy: ACTOR,
      },
      "fat-qa-results": present(),
      "release-notes": present(),
      "architecture-diagram": present(),
      attestation: present(),
    });
    const c = evaluateCompleteness(firmwareIntakeChecklistSchema, state);
    expect(c.kind).toBe("complete");
  });

  it("optional patch-notes missing does not affect completeness", () => {
    const state = mkState({
      sbom: present(),
      hbom: present(),
      "fat-qa-results": present(),
      "release-notes": present(),
      "architecture-diagram": present(),
      "patch-notes": { kind: "missing" },
      attestation: present(),
    });
    const c = evaluateCompleteness(firmwareIntakeChecklistSchema, state);
    expect(c.kind).toBe("complete");
  });
});
