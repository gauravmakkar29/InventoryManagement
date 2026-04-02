import { describe, it, expect } from "vitest";
import { createServiceOrderSchema } from "@/lib/schemas/service-order.schema";
import { inviteUserSchema, editUserSchema } from "@/lib/schemas/user.schema";

// =============================================================================
// Service Order Schema
// =============================================================================

describe("createServiceOrderSchema", () => {
  const validOrder = {
    title: "Quarterly inspection",
    description: "Routine check",
    technician: "J. Martinez",
    scheduledDate: "2026-04-10",
    priority: "High" as const,
    serviceType: "Internal" as const,
    location: "Denver",
    customer: "SolarEdge Corp",
  };

  it("accepts valid service order", () => {
    const result = createServiceOrderSchema.safeParse(validOrder);
    expect(result.success).toBe(true);
  });

  it("allows optional description", () => {
    const { description: _description, ...withoutDesc } = validOrder;
    const result = createServiceOrderSchema.safeParse(withoutDesc);
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = createServiceOrderSchema.safeParse({ ...validOrder, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects title over 200 characters", () => {
    const result = createServiceOrderSchema.safeParse({ ...validOrder, title: "A".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects empty technician", () => {
    const result = createServiceOrderSchema.safeParse({ ...validOrder, technician: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid priority", () => {
    const result = createServiceOrderSchema.safeParse({ ...validOrder, priority: "Urgent" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid priorities", () => {
    for (const p of ["High", "Medium", "Low"]) {
      const result = createServiceOrderSchema.safeParse({ ...validOrder, priority: p });
      expect(result.success).toBe(true);
    }
  });

  it("accepts valid service types", () => {
    for (const st of ["Internal", "3rd Party"]) {
      const result = createServiceOrderSchema.safeParse({ ...validOrder, serviceType: st });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid service type", () => {
    const result = createServiceOrderSchema.safeParse({ ...validOrder, serviceType: "External" });
    expect(result.success).toBe(false);
  });

  it("rejects empty location", () => {
    const result = createServiceOrderSchema.safeParse({ ...validOrder, location: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty customer", () => {
    const result = createServiceOrderSchema.safeParse({ ...validOrder, customer: "" });
    expect(result.success).toBe(false);
  });
});

// =============================================================================
// User Invite Schema
// =============================================================================

describe("inviteUserSchema", () => {
  const validUser = {
    email: "new.user@company.com",
    firstName: "John",
    lastName: "Doe",
    role: "Technician" as const,
    department: "Engineering",
  };

  it("accepts valid user invitation", () => {
    const result = inviteUserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it("accepts optional customer field", () => {
    const result = inviteUserSchema.safeParse({ ...validUser, customer: "Test Corp" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = inviteUserSchema.safeParse({ ...validUser, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = inviteUserSchema.safeParse({ ...validUser, email: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty first name", () => {
    const result = inviteUserSchema.safeParse({ ...validUser, firstName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects first name over 50 chars", () => {
    const result = inviteUserSchema.safeParse({ ...validUser, firstName: "A".repeat(51) });
    expect(result.success).toBe(false);
  });

  it("rejects empty last name", () => {
    const result = inviteUserSchema.safeParse({ ...validUser, lastName: "" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid roles", () => {
    for (const role of ["Admin", "Manager", "Technician", "Viewer", "CustomerAdmin"]) {
      const result = inviteUserSchema.safeParse({ ...validUser, role });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid role", () => {
    const result = inviteUserSchema.safeParse({ ...validUser, role: "SuperAdmin" });
    expect(result.success).toBe(false);
  });

  it("rejects empty department", () => {
    const result = inviteUserSchema.safeParse({ ...validUser, department: "" });
    expect(result.success).toBe(false);
  });
});

// =============================================================================
// User Edit Schema
// =============================================================================

describe("editUserSchema", () => {
  it("accepts valid edit input", () => {
    const result = editUserSchema.safeParse({ role: "Manager", department: "Engineering" });
    expect(result.success).toBe(true);
  });

  it("rejects empty department", () => {
    const result = editUserSchema.safeParse({ role: "Manager", department: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid role", () => {
    const result = editUserSchema.safeParse({ role: "Root", department: "Engineering" });
    expect(result.success).toBe(false);
  });
});
