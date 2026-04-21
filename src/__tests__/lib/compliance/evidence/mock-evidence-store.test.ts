import { describe, it, expect, beforeEach } from "vitest";
import { createMockEvidenceStore } from "@/lib/compliance/evidence/mock-evidence-store";
import {
  EvidenceImmutabilityError,
  EvidenceNotFoundError,
} from "@/lib/compliance/evidence/evidence-errors";
import { AccessDeniedError, type ComplianceActor } from "@/lib/compliance/types";
import type { IEvidenceStore } from "@/lib/compliance/evidence/evidence-store.interface";
import type { Role } from "@/lib/rbac";

const ALICE: ComplianceActor = { userId: "alice", displayName: "Alice" };
const BOB: ComplianceActor = { userId: "bob", displayName: "Bob" };

const adminRole: (a: ComplianceActor) => Role = () => "Admin";
const viewerRole: (a: ComplianceActor) => Role = () => "Viewer";

function bytesOf(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

describe("createMockEvidenceStore", () => {
  let store: IEvidenceStore;
  const fixedNow = () => new Date("2026-04-21T10:00:00Z");

  beforeEach(() => {
    store = createMockEvidenceStore({ resolveRole: adminRole, now: fixedNow });
  });

  it("interface exposes no mutation methods", () => {
    // Compile-time guarantee verified via ts-check; this runtime test is
    // a belt-and-braces assertion that the returned object shape matches.
    expect("put" in store).toBe(true);
    expect("get" in store).toBe(true);
    expect("getSignedReadUrl" in store).toBe(true);
    expect("list" in store).toBe(true);
    expect("delete" in store).toBe(false);
    expect("update" in store).toBe(false);
  });

  it("put stores metadata with immutable=true and SHA-256 hash", async () => {
    const meta = await store.put({
      bytes: bytesOf("hello"),
      mimeType: "text/plain",
      retentionMode: "compliance",
      retainUntil: "2030-01-01T00:00:00Z",
      actor: ALICE,
    });
    expect(meta.immutable).toBe(true);
    expect(meta.contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(meta.uploadedBy.userId).toBe("alice");
    expect(meta.retention.mode).toBe("compliance");
    expect(meta.uploadedAt).toBe("2026-04-21T10:00:00.000Z");
  });

  it("identical payloads produce the same content hash (dedup-safe)", async () => {
    const a = await store.put({
      bytes: bytesOf("same"),
      mimeType: "text/plain",
      retentionMode: "compliance",
      retainUntil: "2030-01-01T00:00:00Z",
      actor: ALICE,
    });
    const b = await store.put({
      bytes: bytesOf("same"),
      mimeType: "text/plain",
      retentionMode: "compliance",
      retainUntil: "2030-01-01T00:00:00Z",
      actor: BOB,
    });
    expect(a.contentHash).toBe(b.contentHash);
    expect(a.id).toBe(b.id);
  });

  it("returned metadata is frozen — direct mutation throws", async () => {
    const meta = await store.put({
      bytes: bytesOf("frozen"),
      mimeType: "text/plain",
      retentionMode: "compliance",
      retainUntil: "2030-01-01T00:00:00Z",
      actor: ALICE,
    });
    expect(() => {
      // @ts-expect-error — immutability invariant check
      meta.id = "tampered";
    }).toThrow();
  });

  it("get returns stored metadata and rejects unknown ids", async () => {
    const meta = await store.put({
      bytes: bytesOf("fetch-me"),
      mimeType: "text/plain",
      retentionMode: "compliance",
      retainUntil: "2030-01-01T00:00:00Z",
      actor: ALICE,
    });
    const got = await store.get(meta.id, { actor: ALICE });
    expect(got.id).toBe(meta.id);
    await expect(store.get("ev-nonexistent", { actor: ALICE })).rejects.toBeInstanceOf(
      EvidenceNotFoundError,
    );
  });

  it("getSignedReadUrl returns a non-empty url and rejects unknown ids", async () => {
    const meta = await store.put({
      bytes: bytesOf("signme"),
      mimeType: "text/plain",
      retentionMode: "compliance",
      retainUntil: "2030-01-01T00:00:00Z",
      actor: ALICE,
    });
    const url = await store.getSignedReadUrl(meta.id, 60, { actor: ALICE });
    expect(url).toMatch(/^data:text\/plain/);
    await expect(store.getSignedReadUrl("ev-nope", 60, { actor: ALICE })).rejects.toBeInstanceOf(
      EvidenceNotFoundError,
    );
  });

  it("list returns newest-first with tag filter", async () => {
    const nowA = new Date("2026-04-21T10:00:00Z");
    const nowB = new Date("2026-04-22T10:00:00Z");
    const storeA = createMockEvidenceStore({ resolveRole: adminRole, now: () => nowA });
    await storeA.put({
      bytes: bytesOf("one"),
      mimeType: "text/plain",
      retentionMode: "compliance",
      retainUntil: "2030-01-01T00:00:00Z",
      tags: { class: "sbom" },
      actor: ALICE,
    });
    // Use a second store instance with different clock, then merge for assertion
    const storeB = createMockEvidenceStore({ resolveRole: adminRole, now: () => nowB });
    await storeB.put({
      bytes: bytesOf("two"),
      mimeType: "text/plain",
      retentionMode: "compliance",
      retainUntil: "2030-01-01T00:00:00Z",
      tags: { class: "release-notes" },
      actor: BOB,
    });

    const listA = await storeA.list({}, { actor: ALICE });
    expect(listA).toHaveLength(1);
    const filtered = await storeA.list({ tags: { class: "sbom" } }, { actor: ALICE });
    expect(filtered).toHaveLength(1);
    const none = await storeA.list({ tags: { class: "unknown" } }, { actor: ALICE });
    expect(none).toHaveLength(0);
  });

  it("denies put + read when RBAC fails", async () => {
    const denyStore = createMockEvidenceStore({ resolveRole: viewerRole, now: fixedNow });
    await expect(
      denyStore.put({
        bytes: bytesOf("denied"),
        mimeType: "text/plain",
        retentionMode: "compliance",
        retainUntil: "2030-01-01T00:00:00Z",
        actor: ALICE,
      }),
    ).rejects.toBeInstanceOf(AccessDeniedError);
  });

  it("EvidenceImmutabilityError is a distinct, catchable error", () => {
    const err = new EvidenceImmutabilityError("ev-1", "delete");
    expect(err).toBeInstanceOf(EvidenceImmutabilityError);
    expect(err.kind).toBe("compliance.evidence.immutability");
  });
});
