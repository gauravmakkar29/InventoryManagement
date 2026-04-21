import { describe, expect, it } from "vitest";
import { createMockDependencyGraph } from "@/lib/compliance/impact/mock-dependency-graph";
import { listAllConsumers } from "@/lib/compliance/impact/use-inverse-dependency";
import { AccessDeniedError } from "@/lib/compliance/types";
import type { Role } from "@/lib/rbac";
import type { BindingUpsertInput } from "@/lib/compliance/impact";

const ADMIN = { userId: "admin", displayName: "Admin" };
const VIEWER = { userId: "viewer", displayName: "Viewer" };

function binding(
  consumerId: string,
  version: string,
  overrides: Partial<BindingUpsertInput<unknown>> = {},
): BindingUpsertInput<unknown> {
  return {
    consumerId,
    consumerType: "Device",
    resourceId: "fw-X",
    version,
    scope: ["site:abc"],
    state: "active",
    meta: {},
    actor: ADMIN,
    ...overrides,
  };
}

async function seed(n: number, driver: ReturnType<typeof createMockDependencyGraph>) {
  for (let i = 0; i < n; i++) {
    await driver.upsertBinding(
      binding(`d-${i.toString().padStart(4, "0")}`, i % 2 === 0 ? "1.0" : "1.1", {
        scope: i < 50 ? ["site:abc"] : ["site:def"],
        state: i % 3 === 0 ? "active" : "quarantined",
      }),
    );
  }
}

describe("createMockDependencyGraph — Story 28.7", () => {
  it("listConsumers returns empty when no bindings match", async () => {
    const g = createMockDependencyGraph({ resolveRole: () => "Admin" as Role });
    const r = await g.listConsumers("fw-X", "9.9", {}, ADMIN);
    expect(r.items).toEqual([]);
    expect(r.nextCursor).toBeNull();
  });

  it("upsertBinding is idempotent by (consumerId, resourceId) — version change reassigns", async () => {
    const g = createMockDependencyGraph({ resolveRole: () => "Admin" as Role });
    await g.upsertBinding(binding("d-1", "1.0"));
    await g.upsertBinding(binding("d-1", "1.0"));
    const r10 = await g.listConsumers("fw-X", "1.0", {}, ADMIN);
    expect(r10.items.length).toBe(1);

    await g.upsertBinding(binding("d-1", "1.1"));
    const r10after = await g.listConsumers("fw-X", "1.0", {}, ADMIN);
    const r11 = await g.listConsumers("fw-X", "1.1", {}, ADMIN);
    expect(r10after.items.length).toBe(0);
    expect(r11.items.length).toBe(1);
  });

  it("cursor pagination iterates all pages without duplicates", async () => {
    const g = createMockDependencyGraph({ resolveRole: () => "Admin" as Role });
    await seed(100, g);
    const all = await listAllConsumers(g, ADMIN, "fw-X", "1.0", { limit: 20 });
    const v10Count = 50; // 0..98 even → 50
    expect(all.length).toBe(v10Count);
    const uniq = new Set(all.map((c) => c.consumerId));
    expect(uniq.size).toBe(v10Count);
  });

  it("scope + state filters apply ANY-OF semantics", async () => {
    const g = createMockDependencyGraph({ resolveRole: () => "Admin" as Role });
    await seed(20, g);
    const siteAbc = await g.listConsumers("fw-X", "1.0", { scope: ["site:abc"] }, ADMIN);
    expect(siteAbc.items.every((c) => c.scope.includes("site:abc"))).toBe(true);
    const onlyActive = await g.listConsumers("fw-X", "1.0", { state: ["active"] }, ADMIN);
    expect(onlyActive.items.every((c) => c.state === "active")).toBe(true);
  });

  it("listVersionsInUse sorts by consumer count desc", async () => {
    const g = createMockDependencyGraph({ resolveRole: () => "Admin" as Role });
    for (let i = 0; i < 10; i++) await g.upsertBinding(binding(`a-${i}`, "1.0"));
    for (let i = 0; i < 3; i++) await g.upsertBinding(binding(`b-${i}`, "1.1"));
    for (let i = 0; i < 7; i++) await g.upsertBinding(binding(`c-${i}`, "1.2"));
    const versions = await g.listVersionsInUse("fw-X", {}, ADMIN);
    expect(versions.map((v) => v.version)).toEqual(["1.0", "1.2", "1.1"]);
    expect(versions.map((v) => v.consumerCount)).toEqual([10, 7, 3]);
  });

  it("removeBinding deletes the binding", async () => {
    const g = createMockDependencyGraph({ resolveRole: () => "Admin" as Role });
    await g.upsertBinding(binding("d-1", "1.0"));
    await g.removeBinding("d-1", "fw-X", ADMIN);
    const r = await g.listConsumers("fw-X", "1.0", {}, ADMIN);
    expect(r.items.length).toBe(0);
  });

  it("limit bounds rejected", async () => {
    const g = createMockDependencyGraph({ resolveRole: () => "Admin" as Role, maxLimit: 100 });
    await expect(g.listConsumers("fw-X", "1.0", { limit: 101 }, ADMIN)).rejects.toThrow();
    await expect(g.listConsumers("fw-X", "1.0", { limit: 0 }, ADMIN)).rejects.toThrow();
  });

  it("RBAC: Viewer allowed to query (read-only compliance)", async () => {
    const g = createMockDependencyGraph({ resolveRole: () => "Viewer" as Role });
    await g.upsertBinding(binding("d-1", "1.0")); // upsert is trusted-caller path, no auth
    const r = await g.listConsumers("fw-X", "1.0", {}, VIEWER);
    expect(r.items.length).toBe(1);
  });

  it("RBAC: role without impact:query denied", async () => {
    const g = createMockDependencyGraph({ resolveRole: () => "CustomerAdmin" as Role });
    await expect(g.listConsumers("fw-X", "1.0", {}, VIEWER)).rejects.toBeInstanceOf(
      AccessDeniedError,
    );
  });

  it("performance — 500-row query returns in bounded time", async () => {
    const g = createMockDependencyGraph({ resolveRole: () => "Admin" as Role, defaultLimit: 500 });
    for (let i = 0; i < 500; i++) await g.upsertBinding(binding(`p-${i}`, "1.0"));
    const start = performance.now();
    const r = await g.listConsumers("fw-X", "1.0", { limit: 500 }, ADMIN);
    const elapsedMs = performance.now() - start;
    expect(r.items.length).toBe(500);
    expect(elapsedMs).toBeLessThan(500);
  });
});
