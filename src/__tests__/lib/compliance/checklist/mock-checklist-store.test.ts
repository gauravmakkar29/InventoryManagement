import { describe, it, expect } from "vitest";
import { createMockChecklistStore } from "@/lib/compliance/checklist/mock-checklist-store";
import { ChecklistValidationError } from "@/lib/compliance/checklist/checklist-errors";
import { AccessDeniedError } from "@/lib/compliance/types";
import type { ChecklistSchema } from "@/lib/compliance/checklist/checklist-schema";
import type { Role } from "@/lib/rbac";

const ACTOR = { userId: "alice", displayName: "Alice" };
const SCHEMA: ChecklistSchema = {
  schemaId: "demo",
  label: "Demo",
  slots: [
    { key: "sbom", label: "SBOM", required: true },
    { key: "release-notes", label: "Release Notes", required: true },
  ],
};

function adminStore() {
  return createMockChecklistStore({
    resolveRole: () => "Admin" as Role,
    seedSchemas: [SCHEMA],
    now: () => new Date("2026-04-21T00:00:00Z"),
  });
}

describe("createMockChecklistStore", () => {
  it("loadState initializes missing slots from schema", async () => {
    const store = adminStore();
    const state = await store.loadState("demo", "fw-1");
    expect(state.slots["sbom"]?.kind).toBe("missing");
    expect(state.slots["release-notes"]?.kind).toBe("missing");
  });

  it("attachSlot moves slot to present with evidenceId", async () => {
    const store = adminStore();
    const next = await store.attachSlot("demo", "fw-1", "sbom", "ev-123", ACTOR);
    expect(next.kind).toBe("present");
    if (next.kind === "present") expect(next.evidenceId).toBe("ev-123");
  });

  it("waivePermanent records reason and actor", async () => {
    const store = adminStore();
    const next = await store.waivePermanent(
      "demo",
      "fw-1",
      "sbom",
      "Not required for this product line",
      ACTOR,
    );
    expect(next.kind).toBe("waived-permanent");
    if (next.kind === "waived-permanent") {
      expect(next.reason).toContain("Not required");
      expect(next.waivedBy.userId).toBe("alice");
    }
  });

  it("waiveConditional rejects due date in the past", async () => {
    const store = adminStore();
    await expect(
      store.waiveConditional(
        "demo",
        "fw-1",
        "sbom",
        "Scheduled remediation",
        "2020-01-01T00:00:00Z",
        ACTOR,
      ),
    ).rejects.toBeInstanceOf(ChecklistValidationError);
  });

  it("waiveConditional rejects due date > 365d in future", async () => {
    const store = adminStore();
    await expect(
      store.waiveConditional(
        "demo",
        "fw-1",
        "sbom",
        "Scheduled remediation",
        "2030-04-21T00:00:00Z",
        ACTOR,
      ),
    ).rejects.toBeInstanceOf(ChecklistValidationError);
  });

  it("waivePermanent rejects short reason", async () => {
    const store = adminStore();
    await expect(
      store.waivePermanent("demo", "fw-1", "sbom", "short", ACTOR),
    ).rejects.toBeInstanceOf(ChecklistValidationError);
  });

  it("unwaive restores slot to missing", async () => {
    const store = adminStore();
    await store.waivePermanent("demo", "fw-1", "sbom", "Not required for this product line", ACTOR);
    const next = await store.unwaive("demo", "fw-1", "sbom", ACTOR);
    expect(next.kind).toBe("missing");
  });

  it("attach/waive denied for role without permission", async () => {
    const denyStore = createMockChecklistStore({
      resolveRole: () => "Viewer" as Role,
      seedSchemas: [SCHEMA],
    });
    await expect(
      denyStore.attachSlot("demo", "fw-1", "sbom", "ev-1", ACTOR),
    ).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(
      denyStore.waivePermanent("demo", "fw-1", "sbom", "Not required for this product line", ACTOR),
    ).rejects.toBeInstanceOf(AccessDeniedError);
  });

  it("Technician can attach but not waive", async () => {
    const store = createMockChecklistStore({
      resolveRole: () => "Technician" as Role,
      seedSchemas: [SCHEMA],
    });
    const ok = await store.attachSlot("demo", "fw-1", "sbom", "ev-99", ACTOR);
    expect(ok.kind).toBe("present");
    await expect(
      store.waivePermanent("demo", "fw-1", "sbom", "tech shouldn't be able to waive", ACTOR),
    ).rejects.toBeInstanceOf(AccessDeniedError);
  });
});
