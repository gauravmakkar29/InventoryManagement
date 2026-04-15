import { describe, it, expect } from "vitest";
import {
  DEFAULT_LIFECYCLE_CATEGORIES_BY_ROLE,
  PERMITTED_LIFECYCLE_CATEGORIES_BY_ROLE,
  getDefaultLifecycleCategories,
  getPermittedLifecycleCategories,
  lifecycleFilterStorageKey,
} from "@/lib/rbac-lifecycle";
import type { Role } from "@/lib/rbac";

const ALL_ROLES: Role[] = ["Admin", "Manager", "Technician", "Viewer", "CustomerAdmin"];

describe("rbac-lifecycle — role → category mappings", () => {
  it("exposes a default set for every defined role", () => {
    for (const role of ALL_ROLES) {
      expect(DEFAULT_LIFECYCLE_CATEGORIES_BY_ROLE[role]).toBeDefined();
      expect(DEFAULT_LIFECYCLE_CATEGORIES_BY_ROLE[role].length).toBeGreaterThan(0);
    }
  });

  it("exposes a permitted set for every defined role", () => {
    for (const role of ALL_ROLES) {
      expect(PERMITTED_LIFECYCLE_CATEGORIES_BY_ROLE[role]).toBeDefined();
      expect(PERMITTED_LIFECYCLE_CATEGORIES_BY_ROLE[role].length).toBeGreaterThan(0);
    }
  });

  it("defaults are always a subset of the permitted set for the same role", () => {
    for (const role of ALL_ROLES) {
      const defaults = new Set(DEFAULT_LIFECYCLE_CATEGORIES_BY_ROLE[role]);
      const permitted = new Set(PERMITTED_LIFECYCLE_CATEGORIES_BY_ROLE[role]);
      for (const category of defaults) {
        expect(permitted.has(category)).toBe(true);
      }
    }
  });

  it("Admin sees and can enable every category", () => {
    expect(getDefaultLifecycleCategories("Admin")).toEqual([
      "Firmware",
      "Service",
      "Ownership",
      "Status",
      "Audit",
    ]);
    expect(getPermittedLifecycleCategories("Admin")).toEqual([
      "Firmware",
      "Service",
      "Ownership",
      "Status",
      "Audit",
    ]);
  });

  it("Manager defaults omit Audit but is permitted to opt in", () => {
    expect(getDefaultLifecycleCategories("Manager")).not.toContain("Audit");
    expect(getPermittedLifecycleCategories("Manager")).toContain("Audit");
  });

  it("Technician cannot see Ownership or Audit (both default AND permitted)", () => {
    expect(getDefaultLifecycleCategories("Technician")).not.toContain("Ownership");
    expect(getDefaultLifecycleCategories("Technician")).not.toContain("Audit");
    expect(getPermittedLifecycleCategories("Technician")).not.toContain("Ownership");
    expect(getPermittedLifecycleCategories("Technician")).not.toContain("Audit");
  });

  it("Viewer has the same gating as Technician", () => {
    expect(getPermittedLifecycleCategories("Viewer")).toEqual(
      getPermittedLifecycleCategories("Technician"),
    );
  });

  it("CustomerAdmin sees Ownership but NOT Status or Audit (tenant-scoped)", () => {
    expect(getPermittedLifecycleCategories("CustomerAdmin")).toContain("Ownership");
    expect(getPermittedLifecycleCategories("CustomerAdmin")).not.toContain("Status");
    expect(getPermittedLifecycleCategories("CustomerAdmin")).not.toContain("Audit");
  });

  it("returns a fresh copy so callers cannot mutate the canonical arrays", () => {
    const first = getDefaultLifecycleCategories("Admin");
    first.pop();
    const second = getDefaultLifecycleCategories("Admin");
    expect(second).toHaveLength(5);
  });

  it("builds a stable, role+device-scoped localStorage key", () => {
    expect(lifecycleFilterStorageKey("Admin", "d1")).toBe("lifecycle.filter.Admin.d1");
    expect(lifecycleFilterStorageKey("Technician", "dev-042")).toBe(
      "lifecycle.filter.Technician.dev-042",
    );
  });
});
