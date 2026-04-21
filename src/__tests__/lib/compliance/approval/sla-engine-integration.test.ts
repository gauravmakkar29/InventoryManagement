import { describe, expect, it } from "vitest";
import { createMockApprovalEngine } from "@/lib/compliance/approval/mock-approval-engine";
import type { Role } from "@/lib/rbac";

const ALICE = { userId: "alice", displayName: "Alice" };
const BOB = { userId: "bob", displayName: "Bob" };

const conditionallyComplete = {
  kind: "conditionally-complete",
  pendingWaivers: ["fat"],
} as const;
const complete = { kind: "complete" } as const;

describe("mock approval engine — SLA integration (Story 28.4)", () => {
  it("markConditionSatisfied moves a pending condition to satisfied", async () => {
    const engine = createMockApprovalEngine({ resolveRole: () => "Admin" as Role });
    const appr = await engine.create("subj-1", ALICE);
    const decided = await engine.decide(
      appr.id,
      {
        nextState: "conditionally-approved",
        reviewer: BOB,
        reason: "Needs follow-up remediation this sprint.",
        conditions: [
          {
            id: "c-1",
            description: "attach fat report",
            dueAt: "2099-01-01T00:00:00Z",
            status: "pending",
          },
        ],
      },
      { completeness: conditionallyComplete },
    );
    expect(decided.conditions[0]?.status).toBe("pending");

    const updated = await engine.markConditionSatisfied(
      decided.id,
      "c-1",
      "Remediation report attached this morning.",
      BOB,
    );
    expect(updated.conditions[0]?.status).toBe("satisfied");
  });

  it("transition conditionally-approved → approved succeeds after all satisfied", async () => {
    const engine = createMockApprovalEngine({ resolveRole: () => "Admin" as Role });
    const appr = await engine.create("subj-x", ALICE);
    await engine.decide(
      appr.id,
      {
        nextState: "conditionally-approved",
        reviewer: BOB,
        reason: "Conditional pending remediation.",
        conditions: [
          {
            id: "c-1",
            description: "attach fat",
            dueAt: "2099-01-01T00:00:00Z",
            status: "pending",
          },
        ],
      },
      { completeness: conditionallyComplete },
    );
    await engine.markConditionSatisfied(appr.id, "c-1", "Evidence attached.", BOB);
    const approved = await engine.decide(
      appr.id,
      { nextState: "approved", reviewer: BOB },
      { completeness: complete },
    );
    expect(approved.state).toBe("approved");
  });

  it("refreshSlaStatus flips pending condition to breached when dueAt < now", async () => {
    let clock = new Date("2026-04-21T10:00:00Z");
    const engine = createMockApprovalEngine({
      resolveRole: () => "Admin" as Role,
      now: () => clock,
    });
    const appr = await engine.create("subj-b", ALICE);
    await engine.decide(
      appr.id,
      {
        nextState: "conditionally-approved",
        reviewer: BOB,
        reason: "Conditional with near-term SLA.",
        conditions: [
          {
            id: "c-b",
            description: "upload scan",
            dueAt: "2026-04-22T10:00:00Z",
            status: "pending",
          },
        ],
      },
      { completeness: conditionallyComplete },
    );

    clock = new Date("2026-04-23T10:00:00Z");
    const refreshed = await engine.refreshSlaStatus(appr.id);
    expect(refreshed.conditions[0]?.status).toBe("breached");

    // Idempotent — calling again returns the same object without a
    // duplicate breach audit (validated indirectly by no-change path).
    const again = await engine.refreshSlaStatus(appr.id);
    expect(again.conditions[0]?.status).toBe("breached");
  });
});
