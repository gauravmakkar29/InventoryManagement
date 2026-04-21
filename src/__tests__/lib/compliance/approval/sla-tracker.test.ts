import { describe, expect, it } from "vitest";
import {
  computeAlertMilestones,
  evaluateSlaSeverity,
  evaluateSlaStatus,
  formatRemaining,
  summarizeConditions,
} from "@/lib/compliance/approval/sla-tracker";
import type { SlaCondition } from "@/lib/compliance/approval";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function cond(overrides: Partial<SlaCondition> = {}): SlaCondition {
  return {
    id: "c-1",
    description: "attach remediation",
    dueAt: new Date(Date.now() + 10 * MS_PER_DAY).toISOString(),
    status: "pending",
    ...overrides,
  };
}

describe("evaluateSlaStatus", () => {
  const now = new Date("2026-04-21T12:00:00Z");

  it("satisfied is sticky regardless of due date", () => {
    const past = cond({ dueAt: "2020-01-01T00:00:00Z", status: "satisfied" });
    expect(evaluateSlaStatus(past, now)).toBe("satisfied");
  });

  it("pending in the future stays pending", () => {
    const future = cond({ dueAt: "2099-01-01T00:00:00Z", status: "pending" });
    expect(evaluateSlaStatus(future, now)).toBe("pending");
  });

  it("pending past due flips to breached", () => {
    const past = cond({ dueAt: "2020-01-01T00:00:00Z", status: "pending" });
    expect(evaluateSlaStatus(past, now)).toBe("breached");
  });

  it("invalid dueAt preserves current status", () => {
    const bad = cond({ dueAt: "not-a-date", status: "pending" });
    expect(evaluateSlaStatus(bad, now)).toBe("pending");
  });
});

describe("computeAlertMilestones", () => {
  const now = new Date("2026-04-21T12:00:00Z");

  function dueIn(ms: number): SlaCondition {
    return cond({ dueAt: new Date(now.getTime() + ms).toISOString() });
  }

  it("T-8d → no milestone", () => {
    expect(computeAlertMilestones(dueIn(8 * MS_PER_DAY), now)).toEqual([]);
  });

  it("T-7d boundary → T-7d", () => {
    expect(computeAlertMilestones(dueIn(7 * MS_PER_DAY), now)).toEqual(["T-7d"]);
  });

  it("T-2d → T-7d", () => {
    expect(computeAlertMilestones(dueIn(2 * MS_PER_DAY), now)).toEqual(["T-7d"]);
  });

  it("T-1d boundary → T-1d", () => {
    expect(computeAlertMilestones(dueIn(MS_PER_DAY), now)).toEqual(["T-1d"]);
  });

  it("T-12h → T-1d", () => {
    expect(computeAlertMilestones(dueIn(12 * 60 * 60 * 1000), now)).toEqual(["T-1d"]);
  });

  it("T+0 (at due) → T+0 breach alert", () => {
    expect(computeAlertMilestones(dueIn(0), now)).toEqual(["T+0"]);
  });

  it("T+1d (overdue) → T+0 breach alert", () => {
    expect(computeAlertMilestones(dueIn(-MS_PER_DAY), now)).toEqual(["T+0"]);
  });

  it("satisfied → no milestones ever", () => {
    const c = cond({
      status: "satisfied",
      dueAt: new Date(now.getTime() - MS_PER_DAY).toISOString(),
    });
    expect(computeAlertMilestones(c, now)).toEqual([]);
  });
});

describe("evaluateSlaSeverity", () => {
  const now = new Date("2026-04-21T12:00:00Z");
  it("satisfied → safe", () => {
    expect(evaluateSlaSeverity(cond({ status: "satisfied" }), now)).toBe("safe");
  });
  it("≤ 24h → urgent", () => {
    const due = new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString();
    expect(evaluateSlaSeverity(cond({ dueAt: due }), now)).toBe("urgent");
  });
  it("≤ 7d → warn", () => {
    const due = new Date(now.getTime() + 3 * MS_PER_DAY).toISOString();
    expect(evaluateSlaSeverity(cond({ dueAt: due }), now)).toBe("warn");
  });
  it("> 7d → safe", () => {
    const due = new Date(now.getTime() + 10 * MS_PER_DAY).toISOString();
    expect(evaluateSlaSeverity(cond({ dueAt: due }), now)).toBe("safe");
  });
  it("past due → breached", () => {
    const due = new Date(now.getTime() - MS_PER_DAY).toISOString();
    expect(evaluateSlaSeverity(cond({ dueAt: due }), now)).toBe("breached");
  });
});

describe("formatRemaining", () => {
  const now = new Date("2026-04-21T12:00:00Z");
  it("formats days remaining", () => {
    const c = cond({
      dueAt: new Date(now.getTime() + 3 * MS_PER_DAY + 4 * 60 * 60 * 1000).toISOString(),
    });
    expect(formatRemaining(c, now)).toBe("3d 4h");
  });
  it("formats hours remaining", () => {
    const c = cond({ dueAt: new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString() });
    expect(formatRemaining(c, now)).toBe("5h");
  });
  it("formats overdue days", () => {
    const c = cond({ dueAt: new Date(now.getTime() - 2 * MS_PER_DAY).toISOString() });
    expect(formatRemaining(c, now)).toBe("overdue 2d");
  });
});

describe("summarizeConditions", () => {
  const now = new Date("2026-04-21T12:00:00Z");
  it("tallies satisfied / pending / breached", () => {
    const conditions = [
      cond({
        id: "a",
        status: "satisfied",
        dueAt: new Date(now.getTime() - MS_PER_DAY).toISOString(),
      }),
      cond({
        id: "b",
        status: "pending",
        dueAt: new Date(now.getTime() + 3 * MS_PER_DAY).toISOString(),
      }),
      cond({
        id: "c",
        status: "pending",
        dueAt: new Date(now.getTime() - MS_PER_DAY).toISOString(),
      }),
    ];
    expect(summarizeConditions(conditions, now)).toEqual({ pending: 1, breached: 1, satisfied: 1 });
  });
});
