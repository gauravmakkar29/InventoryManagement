import { describe, it, expect } from "vitest";
import {
  getPrimaryRole,
  canAccessPage,
  canPerformAction,
  shouldFilterByCustomer,
  getPermissions,
  type Role,
  type Action,
} from "@/lib/rbac";

// =============================================================================
// getPrimaryRole
// =============================================================================

describe("getPrimaryRole", () => {
  it("returns Admin when Admin is in groups", () => {
    expect(getPrimaryRole(["Admin"])).toBe("Admin");
  });

  it("returns Manager when Manager is in groups", () => {
    expect(getPrimaryRole(["Manager"])).toBe("Manager");
  });

  it("returns Technician when Technician is in groups", () => {
    expect(getPrimaryRole(["Technician"])).toBe("Technician");
  });

  it("returns CustomerAdmin when CustomerAdmin is in groups", () => {
    expect(getPrimaryRole(["CustomerAdmin"])).toBe("CustomerAdmin");
  });

  it("returns Viewer when Viewer is in groups", () => {
    expect(getPrimaryRole(["Viewer"])).toBe("Viewer");
  });

  it("returns highest-priority role when multiple groups are present", () => {
    expect(getPrimaryRole(["Viewer", "Admin", "Manager"])).toBe("Admin");
    expect(getPrimaryRole(["Viewer", "Manager"])).toBe("Manager");
    expect(getPrimaryRole(["CustomerAdmin", "Technician"])).toBe("Technician");
  });

  it("defaults to Viewer when no recognized groups", () => {
    expect(getPrimaryRole([])).toBe("Viewer");
    expect(getPrimaryRole(["UnknownRole"])).toBe("Viewer");
  });
});

// =============================================================================
// canAccessPage — full page matrix
// =============================================================================

describe("canAccessPage", () => {
  const ALL_PAGES = [
    "dashboard",
    "inventory",
    "deployment",
    "compliance",
    "sbom",
    "account-service",
    "analytics",
    "telemetry",
    "incidents",
    "digital-twin",
    "executive-summary",
    "user-management",
  ];

  describe("Admin", () => {
    it("can access all pages", () => {
      for (const page of ALL_PAGES) {
        expect(canAccessPage("Admin", page)).toBe(true);
      }
    });
  });

  describe("Manager", () => {
    it("can access all pages except user-management", () => {
      const managerPages = ALL_PAGES.filter((p) => p !== "user-management");
      for (const page of managerPages) {
        expect(canAccessPage("Manager", page)).toBe(true);
      }
      expect(canAccessPage("Manager", "user-management")).toBe(false);
    });
  });

  describe("Technician", () => {
    it("can access dashboard, inventory, and account-service only", () => {
      expect(canAccessPage("Technician", "dashboard")).toBe(true);
      expect(canAccessPage("Technician", "inventory")).toBe(true);
      expect(canAccessPage("Technician", "account-service")).toBe(true);
      expect(canAccessPage("Technician", "deployment")).toBe(false);
      expect(canAccessPage("Technician", "compliance")).toBe(false);
      expect(canAccessPage("Technician", "analytics")).toBe(false);
    });
  });

  describe("Viewer", () => {
    it("can access read-only pages but not user-management or executive-summary", () => {
      expect(canAccessPage("Viewer", "dashboard")).toBe(true);
      expect(canAccessPage("Viewer", "inventory")).toBe(true);
      expect(canAccessPage("Viewer", "deployment")).toBe(true);
      expect(canAccessPage("Viewer", "user-management")).toBe(false);
      expect(canAccessPage("Viewer", "executive-summary")).toBe(false);
    });
  });

  describe("CustomerAdmin", () => {
    it("can access dashboard, inventory, and account-service only", () => {
      expect(canAccessPage("CustomerAdmin", "dashboard")).toBe(true);
      expect(canAccessPage("CustomerAdmin", "inventory")).toBe(true);
      expect(canAccessPage("CustomerAdmin", "account-service")).toBe(true);
      expect(canAccessPage("CustomerAdmin", "deployment")).toBe(false);
      expect(canAccessPage("CustomerAdmin", "analytics")).toBe(false);
    });
  });

  it("returns false for a non-existent page", () => {
    expect(canAccessPage("Admin", "non-existent-page")).toBe(false);
  });
});

// =============================================================================
// canPerformAction — action permission matrix
// =============================================================================

describe("canPerformAction", () => {
  const ALL_ACTIONS: Action[] = ["create", "edit", "delete", "approve"];

  it("Admin can perform all actions", () => {
    for (const action of ALL_ACTIONS) {
      expect(canPerformAction("Admin", action)).toBe(true);
    }
  });

  it("Manager can create, edit, approve but not delete", () => {
    expect(canPerformAction("Manager", "create")).toBe(true);
    expect(canPerformAction("Manager", "edit")).toBe(true);
    expect(canPerformAction("Manager", "approve")).toBe(true);
    expect(canPerformAction("Manager", "delete")).toBe(false);
  });

  it("Technician can create and edit but not delete or approve", () => {
    expect(canPerformAction("Technician", "create")).toBe(true);
    expect(canPerformAction("Technician", "edit")).toBe(true);
    expect(canPerformAction("Technician", "delete")).toBe(false);
    expect(canPerformAction("Technician", "approve")).toBe(false);
  });

  it("Viewer cannot perform any actions", () => {
    for (const action of ALL_ACTIONS) {
      expect(canPerformAction("Viewer", action)).toBe(false);
    }
  });

  it("CustomerAdmin can create and edit but not delete or approve", () => {
    expect(canPerformAction("CustomerAdmin", "create")).toBe(true);
    expect(canPerformAction("CustomerAdmin", "edit")).toBe(true);
    expect(canPerformAction("CustomerAdmin", "delete")).toBe(false);
    expect(canPerformAction("CustomerAdmin", "approve")).toBe(false);
  });
});

// =============================================================================
// shouldFilterByCustomer
// =============================================================================

describe("shouldFilterByCustomer", () => {
  it("returns true only for CustomerAdmin", () => {
    const roles: Role[] = ["Admin", "Manager", "Technician", "Viewer", "CustomerAdmin"];
    for (const role of roles) {
      if (role === "CustomerAdmin") {
        expect(shouldFilterByCustomer(role)).toBe(true);
      } else {
        expect(shouldFilterByCustomer(role)).toBe(false);
      }
    }
  });
});

// =============================================================================
// getPermissions
// =============================================================================

describe("getPermissions", () => {
  it("returns complete permission object for each role", () => {
    const roles: Role[] = ["Admin", "Manager", "Technician", "Viewer", "CustomerAdmin"];
    for (const role of roles) {
      const perms = getPermissions(role);
      expect(perms).toHaveProperty("pages");
      expect(perms).toHaveProperty("actions");
      expect(perms).toHaveProperty("filterByCustomer");
      expect(Array.isArray(perms.pages)).toBe(true);
      expect(Array.isArray(perms.actions)).toBe(true);
      expect(typeof perms.filterByCustomer).toBe("boolean");
    }
  });

  it("Admin permissions include user-management page", () => {
    const perms = getPermissions("Admin");
    expect(perms.pages).toContain("user-management");
  });

  it("Admin permissions include delete action", () => {
    const perms = getPermissions("Admin");
    expect(perms.actions).toContain("delete");
  });
});
