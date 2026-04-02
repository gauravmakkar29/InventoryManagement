import { describe, it, expect } from "vitest";
import { createDeviceSchema } from "@/lib/schemas/device.schema";

describe("createDeviceSchema", () => {
  const validDevice = {
    name: "INV-3200A",
    serial: "SN-4821",
    model: "INV-3200",
    firmware: "v4.0.0",
    status: "Online" as const,
    location: "Denver, CO",
  };

  it("accepts valid device data", () => {
    const result = createDeviceSchema.safeParse(validDevice);
    expect(result.success).toBe(true);
  });

  it("accepts device with optional lat/lng", () => {
    const result = createDeviceSchema.safeParse({
      ...validDevice,
      lat: "39.74",
      lng: "-104.99",
    });
    expect(result.success).toBe(true);
  });

  // --- Name validation ---

  it("rejects empty name", () => {
    const result = createDeviceSchema.safeParse({ ...validDevice, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name over 100 characters", () => {
    const result = createDeviceSchema.safeParse({ ...validDevice, name: "A".repeat(101) });
    expect(result.success).toBe(false);
  });

  // --- Serial validation ---

  it("rejects empty serial", () => {
    const result = createDeviceSchema.safeParse({ ...validDevice, serial: "" });
    expect(result.success).toBe(false);
  });

  it("rejects serial with special characters", () => {
    const result = createDeviceSchema.safeParse({ ...validDevice, serial: "SN 4821!" });
    expect(result.success).toBe(false);
  });

  it("accepts serial with dashes", () => {
    const result = createDeviceSchema.safeParse({ ...validDevice, serial: "SN-4821-A" });
    expect(result.success).toBe(true);
  });

  // --- Model validation ---

  it("rejects empty model", () => {
    const result = createDeviceSchema.safeParse({ ...validDevice, model: "" });
    expect(result.success).toBe(false);
  });

  // --- Firmware validation ---

  it("rejects empty firmware", () => {
    const result = createDeviceSchema.safeParse({ ...validDevice, firmware: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid firmware format", () => {
    const result = createDeviceSchema.safeParse({ ...validDevice, firmware: "latest" });
    expect(result.success).toBe(false);
  });

  it("accepts firmware with v prefix", () => {
    const result = createDeviceSchema.safeParse({ ...validDevice, firmware: "v1.2.3" });
    expect(result.success).toBe(true);
  });

  it("accepts firmware without v prefix", () => {
    const result = createDeviceSchema.safeParse({ ...validDevice, firmware: "1.2.3" });
    expect(result.success).toBe(true);
  });

  // --- Status validation ---

  it("accepts all valid status values", () => {
    const statuses = ["Online", "Offline", "Maintenance", "Decommissioned"];
    for (const status of statuses) {
      const result = createDeviceSchema.safeParse({ ...validDevice, status });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    const result = createDeviceSchema.safeParse({ ...validDevice, status: "Broken" });
    expect(result.success).toBe(false);
  });

  // --- Location validation ---

  it("rejects empty location", () => {
    const result = createDeviceSchema.safeParse({ ...validDevice, location: "" });
    expect(result.success).toBe(false);
  });

  // --- Missing required fields ---

  it("rejects when required fields are missing", () => {
    const result = createDeviceSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
