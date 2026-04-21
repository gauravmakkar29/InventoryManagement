import { describe, expect, it } from "vitest";
import {
  approvalTransitionTable,
  isTransitionAllowed,
  newPendingApproval,
  transition,
  ApprovalTransitionError,
  ApprovalReasonError,
  type Approval,
  type ApprovalState,
  type SlaCondition,
} from "@/lib/compliance/approval/approval-state-machine";

const ALICE = { userId: "alice", displayName: "Alice" };
const BOB = { userId: "bob", displayName: "Bob" };
const NOW = "2026-04-21T12:00:00Z";

const REASON_OK = "Valid ten-char reason explaining the decision.";

function seed(state: ApprovalState, conditions: readonly SlaCondition[] = []): Approval {
  const base = newPendingApproval({
    id: "a-1",
    subjectId: "subj-1",
    submittedBy: ALICE,
    at: NOW,
  });
  return { ...base, state, conditions };
}

const ALL_STATES: ApprovalState[] = ["pending", "approved", "conditionally-approved", "rejected"];

describe("approval state machine — exhaustive transition table", () => {
  // Every pair (from → to) over all four states — allowed pairs in the
  // table must succeed; all other pairs must throw ApprovalTransitionError.
  for (const from of ALL_STATES) {
    for (const to of ALL_STATES) {
      const allowed = approvalTransitionTable.some((t) => t.from === from && t.to === to);
      const title = `${from} → ${to} ${allowed ? "allowed" : "rejected"}`;

      // Need to avoid special constraint: conditionally-approved → approved
      // only succeeds when ALL conditions are satisfied. Use a variant for
      // that pair.
      if (from === "conditionally-approved" && to === "approved") {
        it(`${title} (with satisfied conditions)`, () => {
          const satisfied: SlaCondition = {
            id: "c-1",
            description: "ok",
            dueAt: "2099-01-01T00:00:00Z",
            status: "satisfied",
          };
          const out = transition(seed(from, [satisfied]), to, {
            actor: BOB,
            at: NOW,
          });
          expect(out.state).toBe(to);
        });
        it(`${from} → approved BLOCKED when any condition unsatisfied`, () => {
          const pending: SlaCondition = {
            id: "c-1",
            description: "nope",
            dueAt: "2099-01-01T00:00:00Z",
            status: "pending",
          };
          expect(() => transition(seed(from, [pending]), to, { actor: BOB, at: NOW })).toThrow(
            ApprovalTransitionError,
          );
        });
        continue;
      }

      if (allowed) {
        it(`${title}`, () => {
          const ctx =
            to === "rejected" || to === "conditionally-approved"
              ? { actor: BOB, at: NOW, reason: REASON_OK }
              : { actor: BOB, at: NOW };
          const out = transition(seed(from), to, ctx);
          expect(out.state).toBe(to);
          expect(isTransitionAllowed(from, to)).toBe(true);
        });
      } else {
        it(`${title}`, () => {
          expect(() =>
            transition(seed(from), to, { actor: BOB, at: NOW, reason: REASON_OK }),
          ).toThrow(ApprovalTransitionError);
          expect(isTransitionAllowed(from, to)).toBe(false);
        });
      }
    }
  }
});

describe("approval state machine — reason validation", () => {
  it("rejected requires 10-500 char reason", () => {
    expect(() => transition(seed("pending"), "rejected", { actor: BOB, at: NOW })).toThrow(
      ApprovalReasonError,
    );
    expect(() =>
      transition(seed("pending"), "rejected", { actor: BOB, at: NOW, reason: "short" }),
    ).toThrow(ApprovalReasonError);
    expect(() =>
      transition(seed("pending"), "rejected", {
        actor: BOB,
        at: NOW,
        reason: "x".repeat(501),
      }),
    ).toThrow(ApprovalReasonError);
    const ok = transition(seed("pending"), "rejected", {
      actor: BOB,
      at: NOW,
      reason: REASON_OK,
    });
    expect(ok.state).toBe("rejected");
    expect(ok.reason).toBe(REASON_OK);
  });

  it("conditionally-approved requires reason", () => {
    expect(() =>
      transition(seed("pending"), "conditionally-approved", { actor: BOB, at: NOW }),
    ).toThrow(ApprovalReasonError);
    const ok = transition(seed("pending"), "conditionally-approved", {
      actor: BOB,
      at: NOW,
      reason: REASON_OK,
    });
    expect(ok.state).toBe("conditionally-approved");
  });

  it("approved does not require reason", () => {
    const ok = transition(seed("pending"), "approved", { actor: BOB, at: NOW });
    expect(ok.state).toBe("approved");
  });
});

describe("approval history", () => {
  it("appends history entry on every transition", () => {
    const p = seed("pending");
    const a = transition(p, "approved", { actor: BOB, at: NOW });
    expect(a.history.length).toBe(p.history.length + 1);
    const last = a.history[a.history.length - 1];
    if (!last) throw new Error("history empty");
    expect(last.from).toBe("pending");
    expect(last.to).toBe("approved");
    expect(last.actor.userId).toBe("bob");
  });

  it("resubmit clears reviewer + decidedAt", () => {
    const rejected: Approval = {
      ...seed("rejected"),
      reviewer: BOB,
      reason: REASON_OK,
      decidedAt: NOW,
    };
    const resubmitted = transition(rejected, "pending", { actor: ALICE, at: NOW });
    expect(resubmitted.state).toBe("pending");
    expect(resubmitted.reviewer).toBeNull();
    expect(resubmitted.decidedAt).toBeNull();
    expect(resubmitted.reason).toBeNull();
  });
});
