import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { server } from "../../mocks/server";

// Wire MSW lifecycle
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("MSW Handlers", () => {
  describe("GET /api/devices", () => {
    it("returns paginated devices", async () => {
      const response = await fetch("http://localhost/api/devices?page=1&pageSize=5");
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.items).toHaveLength(5);
      expect(data.total).toBe(25);
      expect(data.page).toBe(1);
      expect(data.pageSize).toBe(5);
      expect(data.hasMore).toBe(true);
    });

    it("returns last page correctly", async () => {
      const response = await fetch("http://localhost/api/devices?page=3&pageSize=10");
      const data = await response.json();

      expect(data.items).toHaveLength(5);
      expect(data.hasMore).toBe(false);
    });
  });

  describe("GET /api/devices/:id", () => {
    it("returns a device by ID", async () => {
      const listResponse = await fetch("http://localhost/api/devices?page=1&pageSize=1");
      const listData = await listResponse.json();
      const deviceId = listData.items[0].id;

      const response = await fetch(`http://localhost/api/devices/${deviceId}`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.id).toBe(deviceId);
    });

    it("returns 404 for unknown device", async () => {
      const response = await fetch("http://localhost/api/devices/nonexistent");
      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/dashboard/metrics", () => {
    it("returns dashboard metrics", async () => {
      const response = await fetch("http://localhost/api/dashboard/metrics");
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.totalDevices).toBe(25);
      expect(data.onlineDevices).toBeGreaterThan(0);
      expect(data.healthScore).toBeGreaterThan(0);
    });
  });

  describe("GET /api/firmware", () => {
    it("returns firmware list", async () => {
      const response = await fetch("http://localhost/api/firmware");
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.items.length).toBeGreaterThan(0);
    });
  });

  describe("GET /api/service-orders", () => {
    it("returns service orders", async () => {
      const response = await fetch("http://localhost/api/service-orders");
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.items.length).toBeGreaterThan(0);
    });

    it("filters by status", async () => {
      const response = await fetch("http://localhost/api/service-orders?status=open");
      const data = await response.json();

      expect(response.ok).toBe(true);
      for (const order of data.items) {
        expect(order.status).toBe("open");
      }
    });
  });
});
