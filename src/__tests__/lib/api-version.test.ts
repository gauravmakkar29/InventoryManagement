import { describe, it, expect, vi } from "vitest";
import {
  createApiVersionManager,
  createVersionInterceptor,
  createVersionCheckInterceptor,
} from "../../lib/api-version";

describe("ApiVersionManager", () => {
  describe("header mode", () => {
    it("adds version header to requests", () => {
      const manager = createApiVersionManager({ version: "2", mode: "header" });
      const result = manager.applyVersion("/devices");

      expect(result.url).toBe("/devices");
      expect(result.headers["X-API-Version"]).toBe("2");
    });

    it("preserves existing headers", () => {
      const manager = createApiVersionManager({ version: "1", mode: "header" });
      const result = manager.applyVersion("/test", { Authorization: "Bearer x" });

      expect(result.headers["Authorization"]).toBe("Bearer x");
      expect(result.headers["X-API-Version"]).toBe("1");
    });
  });

  describe("path mode", () => {
    it("prefixes URL with version", () => {
      const manager = createApiVersionManager({ version: "2", mode: "path" });
      const result = manager.applyVersion("/devices");

      expect(result.url).toBe("/v2/devices");
      expect(result.headers["X-API-Version"]).toBeUndefined();
    });

    it("does not double-prefix", () => {
      const manager = createApiVersionManager({ version: "1", mode: "path" });
      const result = manager.applyVersion("/v1/devices");

      expect(result.url).toBe("/v1/devices");
    });
  });

  describe("version mismatch detection", () => {
    it("detects when server version differs", () => {
      const onMismatch = vi.fn();
      const manager = createApiVersionManager({
        version: "1",
        onVersionMismatch: onMismatch,
      });

      manager.checkResponseVersion({ "x-api-version": "2" });

      expect(onMismatch).toHaveBeenCalledWith("1", "2");
      expect(manager.isDeprecated()).toBe(true);
    });

    it("does not trigger when versions match", () => {
      const onMismatch = vi.fn();
      const manager = createApiVersionManager({
        version: "1",
        onVersionMismatch: onMismatch,
      });

      manager.checkResponseVersion({ "x-api-version": "1" });

      expect(onMismatch).not.toHaveBeenCalled();
      expect(manager.isDeprecated()).toBe(false);
    });

    it("does not trigger when no version header in response", () => {
      const onMismatch = vi.fn();
      const manager = createApiVersionManager({
        version: "1",
        onVersionMismatch: onMismatch,
      });

      manager.checkResponseVersion({ "content-type": "application/json" });

      expect(onMismatch).not.toHaveBeenCalled();
    });
  });

  describe("getVersion", () => {
    it("returns configured version", () => {
      const manager = createApiVersionManager({ version: "3" });
      expect(manager.getVersion()).toBe("3");
    });

    it("defaults to version 1", () => {
      const manager = createApiVersionManager();
      expect(manager.getVersion()).toBe("1");
    });
  });

  describe("interceptor factories", () => {
    it("createVersionInterceptor applies version to request", () => {
      const manager = createApiVersionManager({ version: "2", mode: "header" });
      const interceptor = createVersionInterceptor(manager);

      const request = interceptor({ url: "/test", headers: {} });
      expect(request.headers!["X-API-Version"]).toBe("2");
    });

    it("createVersionCheckInterceptor checks response version", () => {
      const onMismatch = vi.fn();
      const manager = createApiVersionManager({
        version: "1",
        onVersionMismatch: onMismatch,
      });
      const interceptor = createVersionCheckInterceptor(manager);

      interceptor({ headers: { "x-api-version": "3" } });
      expect(onMismatch).toHaveBeenCalledWith("1", "3");
    });
  });
});
