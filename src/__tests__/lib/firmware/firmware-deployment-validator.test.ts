import { describe, expect, it } from "vitest";
import {
  FIRMWARE_DEPLOYMENT_KIND,
  firmwareDeploymentValidator,
  type FirmwareDeploymentProof,
} from "@/lib/firmware/firmware-deployment-validator";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function mkProof(overrides: Partial<FirmwareDeploymentProof> = {}): FirmwareDeploymentProof {
  return {
    note: "Installed cleanly on-site, no issues observed during smoke test.",
    photoEvidenceIds: ["ev-photo-1"],
    confirmedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("firmwareDeploymentValidator", () => {
  it("kind constant is stable", () => {
    expect(FIRMWARE_DEPLOYMENT_KIND).toBe("firmware-deployment");
  });

  it("accepts a valid proof", () => {
    expect(firmwareDeploymentValidator(mkProof())).toEqual({ ok: true, messages: [] });
  });

  it("rejects short note", () => {
    const r = firmwareDeploymentValidator(mkProof({ note: "short" }));
    expect(r.ok).toBe(false);
    expect(r.messages.some((m) => m.includes("Note must be"))).toBe(true);
  });

  it("rejects empty photo evidence list", () => {
    const r = firmwareDeploymentValidator(mkProof({ photoEvidenceIds: [] }));
    expect(r.ok).toBe(false);
    expect(r.messages.some((m) => m.includes("photo"))).toBe(true);
  });

  it("rejects invalid timestamp", () => {
    const r = firmwareDeploymentValidator(mkProof({ confirmedAt: "not-a-date" }));
    expect(r.ok).toBe(false);
    expect(r.messages.some((m) => m.includes("valid ISO-8601"))).toBe(true);
  });

  it("rejects future timestamp", () => {
    const future = new Date(Date.now() + 2 * MS_PER_DAY).toISOString();
    const r = firmwareDeploymentValidator(mkProof({ confirmedAt: future }));
    expect(r.ok).toBe(false);
    expect(r.messages.some((m) => m.includes("cannot be in the future"))).toBe(true);
  });

  it("rejects timestamp older than 30 days", () => {
    const old = new Date(Date.now() - 31 * MS_PER_DAY).toISOString();
    const r = firmwareDeploymentValidator(mkProof({ confirmedAt: old }));
    expect(r.ok).toBe(false);
    expect(r.messages.some((m) => m.includes("last 30 days"))).toBe(true);
  });

  it("aggregates multiple validation errors", () => {
    const r = firmwareDeploymentValidator(
      mkProof({ note: "", photoEvidenceIds: [], confirmedAt: "bad" }),
    );
    expect(r.ok).toBe(false);
    expect(r.messages.length).toBeGreaterThanOrEqual(3);
  });
});
