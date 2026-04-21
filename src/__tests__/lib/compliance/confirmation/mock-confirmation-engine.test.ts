import { describe, expect, it } from "vitest";
import { createMockConfirmationEngine } from "@/lib/compliance/confirmation/mock-confirmation-engine";
import {
  ActionConfirmationMismatchError,
  ActionInitiationNotFoundError,
  InvalidConfirmationTransitionError,
  SelfConfirmationError,
  UnknownValidatorError,
} from "@/lib/compliance/confirmation/confirmation-errors";
import { AccessDeniedError } from "@/lib/compliance/types";
import type { Role } from "@/lib/rbac";

const ALICE = { userId: "alice", displayName: "Alice" };
const BOB = { userId: "bob", displayName: "Bob" };

function resolveAdmin() {
  return "Admin" as Role;
}

describe("createMockConfirmationEngine — Story 28.6", () => {
  it("initiate → complete round-trip with a validator", async () => {
    const engine = createMockConfirmationEngine({ resolveRole: resolveAdmin });
    engine.validators.register<{ note: string }>("deploy", (p) =>
      p.note.length >= 5 ? { ok: true, messages: [] } : { ok: false, messages: ["note too short"] },
    );

    const init = await engine.initiate("deploy", { siteId: "s-1" }, ALICE);
    expect(init.state).toBe("initiated");

    const done = await engine.complete(init.id, { note: "deployed cleanly" }, BOB);
    expect(done.state).toBe("confirmed");
    expect(done.confirmation?.confirmedBy.userId).toBe("bob");
  });

  it("complete throws ActionConfirmationMismatchError when validator fails", async () => {
    const engine = createMockConfirmationEngine({ resolveRole: resolveAdmin });
    engine.validators.register<{ note: string }>("deploy", (p) =>
      p.note.length >= 5 ? { ok: true, messages: [] } : { ok: false, messages: ["note too short"] },
    );
    const init = await engine.initiate("deploy", {}, ALICE);
    await expect(engine.complete(init.id, { note: "no" }, BOB)).rejects.toBeInstanceOf(
      ActionConfirmationMismatchError,
    );
  });

  it("complete throws UnknownValidatorError when no validator registered", async () => {
    const engine = createMockConfirmationEngine({ resolveRole: resolveAdmin });
    const init = await engine.initiate("unknown-kind", {}, ALICE);
    await expect(engine.complete(init.id, {}, BOB)).rejects.toBeInstanceOf(UnknownValidatorError);
  });

  it("complete on already-confirmed throws InvalidConfirmationTransitionError", async () => {
    const engine = createMockConfirmationEngine({ resolveRole: resolveAdmin });
    engine.validators.register("pass", () => ({ ok: true, messages: [] }));
    const init = await engine.initiate("pass", {}, ALICE);
    await engine.complete(init.id, {}, BOB);
    await expect(engine.complete(init.id, {}, BOB)).rejects.toBeInstanceOf(
      InvalidConfirmationTransitionError,
    );
  });

  it("complete on abandoned throws InvalidConfirmationTransitionError", async () => {
    const engine = createMockConfirmationEngine({ resolveRole: resolveAdmin });
    engine.validators.register("pass", () => ({ ok: true, messages: [] }));
    const init = await engine.initiate("pass", {}, ALICE);
    await engine.abandon(init.id, "Cannot complete due to hardware failure.", ALICE);
    await expect(engine.complete(init.id, {}, BOB)).rejects.toBeInstanceOf(
      InvalidConfirmationTransitionError,
    );
  });

  it("SoD enforced when requireDistinctConfirmer=true", async () => {
    const engine = createMockConfirmationEngine({
      resolveRole: resolveAdmin,
      requireDistinctConfirmer: true,
    });
    engine.validators.register("pass", () => ({ ok: true, messages: [] }));
    const init = await engine.initiate("pass", {}, ALICE);
    await expect(engine.complete(init.id, {}, ALICE)).rejects.toBeInstanceOf(SelfConfirmationError);
  });

  it("SoD off by default — same actor can initiate + complete", async () => {
    const engine = createMockConfirmationEngine({ resolveRole: resolveAdmin });
    engine.validators.register("pass", () => ({ ok: true, messages: [] }));
    const init = await engine.initiate("pass", {}, ALICE);
    const done = await engine.complete(init.id, {}, ALICE);
    expect(done.state).toBe("confirmed");
  });

  it("abandon moves initiated → abandoned with reason", async () => {
    const engine = createMockConfirmationEngine({ resolveRole: resolveAdmin });
    const init = await engine.initiate("pass", {}, ALICE);
    const done = await engine.abandon(init.id, "Site was not accessible this week.", ALICE);
    expect(done.state).toBe("abandoned");
    expect(done.abandonment?.reason).toContain("Site");
    expect(done.abandonment?.auto).toBe(false);
  });

  it("abandonStale flips old initiated records to abandoned(auto=true)", async () => {
    let clock = new Date("2026-04-21T10:00:00Z");
    const engine = createMockConfirmationEngine({
      resolveRole: resolveAdmin,
      now: () => clock,
      abandonAfterMs: 60 * 1000, // 1 minute for testing
    });
    const init = await engine.initiate("deliver", {}, ALICE);
    expect(init.state).toBe("initiated");

    clock = new Date("2026-04-21T10:02:00Z");
    const stale = await engine.abandonStale("deliver");
    expect(stale.length).toBe(1);
    expect(stale[0]?.state).toBe("abandoned");
    expect(stale[0]?.abandonment?.auto).toBe(true);
  });

  it("loadByKind filters by state + limit", async () => {
    const engine = createMockConfirmationEngine({ resolveRole: resolveAdmin });
    engine.validators.register("pass", () => ({ ok: true, messages: [] }));
    const a = await engine.initiate("pass", {}, ALICE);
    const b = await engine.initiate("pass", {}, ALICE);
    await engine.complete(a.id, {}, BOB);
    const initiated = await engine.loadByKind("pass", { state: "initiated" });
    expect(initiated.length).toBe(1);
    expect(initiated[0]?.id).toBe(b.id);
  });

  it("RBAC denial — Viewer cannot initiate", async () => {
    const engine = createMockConfirmationEngine({ resolveRole: () => "Viewer" as Role });
    await expect(engine.initiate("pass", {}, ALICE)).rejects.toBeInstanceOf(AccessDeniedError);
  });

  it("ActionInitiationNotFoundError on unknown id", async () => {
    const engine = createMockConfirmationEngine({ resolveRole: resolveAdmin });
    await expect(engine.complete("bogus", {}, ALICE)).rejects.toBeInstanceOf(
      ActionInitiationNotFoundError,
    );
  });
});
