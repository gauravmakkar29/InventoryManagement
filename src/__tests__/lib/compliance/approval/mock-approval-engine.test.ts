import { describe, expect, it } from "vitest";
import { createMockApprovalEngine } from "@/lib/compliance/approval/mock-approval-engine";
import {
  ChecklistIncompleteForApprovalError,
  NoConditionalWaiverError,
  SelfApprovalError,
} from "@/lib/compliance/approval/approval-errors";
import { AccessDeniedError } from "@/lib/compliance/types";
import type { Role } from "@/lib/rbac";

const ALICE = { userId: "alice", displayName: "Alice" };
const BOB = { userId: "bob", displayName: "Bob" };

const complete = { kind: "complete" } as const;
const incomplete = { kind: "incomplete", missing: ["sbom"] } as const;
const conditional = {
  kind: "conditionally-complete",
  pendingWaivers: ["fat"],
} as const;

describe("createMockApprovalEngine — SoD + gating + audit behavior", () => {
  it("create returns pending and idempotently reuses by subject", async () => {
    const engine = createMockApprovalEngine({ resolveRole: () => "Admin" as Role });
    const a = await engine.create("subj-1", ALICE);
    expect(a.state).toBe("pending");
    const again = await engine.create("subj-1", ALICE);
    expect(again.id).toBe(a.id);
  });

  it("AC-5: reviewer cannot equal submitter", async () => {
    const engine = createMockApprovalEngine({ resolveRole: () => "Admin" as Role });
    const appr = await engine.create("subj-1", ALICE);
    await expect(
      engine.decide(
        appr.id,
        { nextState: "approved", reviewer: ALICE },
        { completeness: complete },
      ),
    ).rejects.toBeInstanceOf(SelfApprovalError);
  });

  it("approve blocked when checklist incomplete", async () => {
    const engine = createMockApprovalEngine({ resolveRole: () => "Admin" as Role });
    const appr = await engine.create("subj-1", ALICE);
    await expect(
      engine.decide(
        appr.id,
        { nextState: "approved", reviewer: BOB },
        { completeness: incomplete },
      ),
    ).rejects.toBeInstanceOf(ChecklistIncompleteForApprovalError);
  });

  it("conditionally-approved blocked when no conditional waivers exist", async () => {
    const engine = createMockApprovalEngine({ resolveRole: () => "Admin" as Role });
    const appr = await engine.create("subj-1", ALICE);
    await expect(
      engine.decide(
        appr.id,
        {
          nextState: "conditionally-approved",
          reviewer: BOB,
          reason: "Valid ten-char reason.",
        },
        { completeness: complete },
      ),
    ).rejects.toBeInstanceOf(NoConditionalWaiverError);
  });

  it("happy path: pending → conditionally-approved → approved when satisfied", async () => {
    const engine = createMockApprovalEngine({ resolveRole: () => "Admin" as Role });
    const appr = await engine.create("subj-1", ALICE);
    const ca = await engine.decide(
      appr.id,
      {
        nextState: "conditionally-approved",
        reviewer: BOB,
        reason: "Scheduled remediation by next sprint.",
        conditions: [
          {
            id: "c1",
            description: "attach fat",
            dueAt: "2099-01-01T00:00:00Z",
            status: "satisfied",
          },
        ],
      },
      { completeness: conditional },
    );
    expect(ca.state).toBe("conditionally-approved");
    const approved = await engine.decide(
      appr.id,
      { nextState: "approved", reviewer: BOB },
      { completeness: complete },
    );
    expect(approved.state).toBe("approved");
  });

  it("resubmit returns state to pending", async () => {
    const engine = createMockApprovalEngine({ resolveRole: () => "Admin" as Role });
    const appr = await engine.create("subj-1", ALICE);
    const rejected = await engine.decide(
      appr.id,
      {
        nextState: "rejected",
        reviewer: BOB,
        reason: "Needs further review, please retry.",
      },
      { completeness: complete },
    );
    expect(rejected.state).toBe("rejected");
    const resubmitted = await engine.resubmit(appr.id, ALICE);
    expect(resubmitted.state).toBe("pending");
  });

  it("RBAC: non-submit role cannot create", async () => {
    const engine = createMockApprovalEngine({ resolveRole: () => "Viewer" as Role });
    await expect(engine.create("subj-1", ALICE)).rejects.toBeInstanceOf(AccessDeniedError);
  });

  it("RBAC: Technician can submit but not decide", async () => {
    const engine = createMockApprovalEngine({ resolveRole: () => "Technician" as Role });
    const appr = await engine.create("subj-1", ALICE);
    expect(appr.state).toBe("pending");
    await expect(
      engine.decide(appr.id, { nextState: "approved", reviewer: BOB }, { completeness: complete }),
    ).rejects.toBeInstanceOf(AccessDeniedError);
  });

  it("listPending excludes decided approvals", async () => {
    const engine = createMockApprovalEngine({ resolveRole: () => "Admin" as Role });
    const a = await engine.create("subj-1", ALICE);
    await engine.create("subj-2", ALICE);
    await engine.decide(a.id, { nextState: "approved", reviewer: BOB }, { completeness: complete });
    const pending = await engine.listPending({});
    expect(pending.length).toBe(1);
    expect(pending[0]?.subjectId).toBe("subj-2");
  });
});
