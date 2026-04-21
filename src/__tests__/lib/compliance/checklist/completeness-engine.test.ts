import { describe, expect, it } from "vitest";
import { evaluateCompleteness } from "@/lib/compliance/checklist/completeness-engine";
import type {
  ChecklistSchema,
  ChecklistState,
  SlotState,
} from "@/lib/compliance/checklist/checklist-schema";

const ACTOR = { userId: "u", displayName: "u" };
const ISO = "2026-04-21T00:00:00Z";

type Key = "a" | "b" | "c" | "d";

const SCHEMA: ChecklistSchema<Key> = {
  schemaId: "demo",
  label: "Demo",
  slots: [
    { key: "a", label: "A", required: true },
    { key: "b", label: "B", required: true },
    { key: "c", label: "C", required: true },
    { key: "d", label: "D", required: false }, // optional
  ],
};

function state(overrides: Partial<Record<Key, SlotState>>): ChecklistState<Key> {
  return {
    schemaId: "demo",
    subjectId: "s1",
    slots: {
      a: overrides.a ?? { kind: "missing" },
      b: overrides.b ?? { kind: "missing" },
      c: overrides.c ?? { kind: "missing" },
      d: overrides.d ?? { kind: "missing" },
    },
  };
}

const present: SlotState = {
  kind: "present",
  evidenceId: "ev-1",
  filledAt: ISO,
  filledBy: ACTOR,
};
const waivedPerm: SlotState = {
  kind: "waived-permanent",
  reason: "not applicable to this product line",
  waivedAt: ISO,
  waivedBy: ACTOR,
};
const waivedCond: SlotState = {
  kind: "waived-conditional",
  reason: "remediation scheduled",
  dueAt: "2026-09-01T00:00:00Z",
  waivedAt: ISO,
  waivedBy: ACTOR,
};

describe("evaluateCompleteness", () => {
  it("all required present → complete", () => {
    const c = evaluateCompleteness(SCHEMA, state({ a: present, b: present, c: present }));
    expect(c.kind).toBe("complete");
  });

  it("all required waived-permanent → complete", () => {
    const c = evaluateCompleteness(SCHEMA, state({ a: waivedPerm, b: waivedPerm, c: waivedPerm }));
    expect(c.kind).toBe("complete");
  });

  it("one required waived-conditional → conditionally-complete", () => {
    const c = evaluateCompleteness(SCHEMA, state({ a: present, b: waivedCond, c: present }));
    expect(c.kind).toBe("conditionally-complete");
    if (c.kind === "conditionally-complete") {
      expect(c.pendingWaivers).toEqual(["b"]);
    }
  });

  it("any required missing → incomplete (missing takes priority over conditional)", () => {
    const c = evaluateCompleteness(SCHEMA, state({ a: present, b: waivedCond }));
    expect(c.kind).toBe("incomplete");
    if (c.kind === "incomplete") {
      expect(c.missing).toEqual(["c"]);
    }
  });

  it("optional slot missing does not affect completeness", () => {
    const c = evaluateCompleteness(
      SCHEMA,
      state({ a: present, b: present, c: present, d: { kind: "missing" } }),
    );
    expect(c.kind).toBe("complete");
  });

  it("schema/state mismatch → incomplete with all required keys", () => {
    const mismatch: ChecklistState<Key> = {
      ...state({ a: present, b: present, c: present }),
      schemaId: "other",
    };
    const c = evaluateCompleteness(SCHEMA, mismatch);
    expect(c.kind).toBe("incomplete");
    if (c.kind === "incomplete") {
      expect(c.missing).toEqual(["a", "b", "c"]);
    }
  });

  it("slots entry missing from state treated as missing", () => {
    const partial: ChecklistState<Key> = {
      schemaId: "demo",
      subjectId: "s1",
      // @ts-expect-error — partial state for defensive-branch test
      slots: { a: present },
    };
    const c = evaluateCompleteness(SCHEMA, partial);
    expect(c.kind).toBe("incomplete");
  });

  it("mixed permanent + conditional waivers → conditionally-complete", () => {
    const c = evaluateCompleteness(SCHEMA, state({ a: waivedPerm, b: waivedCond, c: present }));
    expect(c.kind).toBe("conditionally-complete");
    if (c.kind === "conditionally-complete") {
      expect(c.pendingWaivers).toEqual(["b"]);
    }
  });
});
