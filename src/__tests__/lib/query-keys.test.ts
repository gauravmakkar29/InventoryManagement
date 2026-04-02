import { describe, it, expect } from "vitest";
import { queryKeys } from "../../lib/query-keys";

describe("queryKeys", () => {
  describe("dashboard", () => {
    it("has all key", () => {
      expect(queryKeys.dashboard.all).toEqual(["dashboard"]);
    });

    it("metrics key includes dashboard prefix", () => {
      expect(queryKeys.dashboard.metrics()).toEqual(["dashboard", "metrics"]);
    });
  });

  describe("devices", () => {
    it("has all key", () => {
      expect(queryKeys.devices.all).toEqual(["devices"]);
    });

    it("list key includes filters", () => {
      const filters = { status: "Online" };
      expect(queryKeys.devices.list(filters)).toEqual(["devices", "list", filters]);
    });

    it("list key without filters", () => {
      expect(queryKeys.devices.list()).toEqual(["devices", "list", undefined]);
    });

    it("detail key includes id", () => {
      expect(queryKeys.devices.detail("d1")).toEqual(["devices", "detail", "d1"]);
    });
  });

  describe("firmware", () => {
    it("has all key", () => {
      expect(queryKeys.firmware.all).toEqual(["firmware"]);
    });

    it("detail key includes id", () => {
      expect(queryKeys.firmware.detail("fw-1")).toEqual(["firmware", "detail", "fw-1"]);
    });
  });

  describe("serviceOrders", () => {
    it("has all key", () => {
      expect(queryKeys.serviceOrders.all).toEqual(["serviceOrders"]);
    });

    it("list key includes filters", () => {
      expect(queryKeys.serviceOrders.list({ status: "Scheduled" })).toEqual([
        "serviceOrders",
        "list",
        { status: "Scheduled" },
      ]);
    });
  });

  describe("incidents", () => {
    it("has detail key", () => {
      expect(queryKeys.incidents.detail("inc-1")).toEqual(["incidents", "detail", "inc-1"]);
    });
  });

  describe("telemetry", () => {
    it("has device key with id and range", () => {
      const range = { start: "2026-01-01" };
      expect(queryKeys.telemetry.device("d1", range)).toEqual(["telemetry", "device", "d1", range]);
    });

    it("pipeline key", () => {
      expect(queryKeys.telemetry.pipeline()).toEqual(["telemetry", "pipeline"]);
    });
  });

  describe("hierarchical invalidation", () => {
    it("all keys start with domain prefix for hierarchical invalidation", () => {
      const domains = [
        queryKeys.dashboard.all,
        queryKeys.devices.all,
        queryKeys.firmware.all,
        queryKeys.vulnerabilities.all,
        queryKeys.compliance.all,
        queryKeys.serviceOrders.all,
        queryKeys.auditLogs.all,
        queryKeys.sbom.all,
        queryKeys.incidents.all,
        queryKeys.telemetry.all,
        queryKeys.notifications.all,
      ];

      for (const key of domains) {
        expect(key.length).toBe(1);
        expect(typeof key[0]).toBe("string");
      }
    });
  });
});
