/**
 * Tests for app-version.ts
 * @see Story #232 — Application versioning strategy
 */
import { describe, it, expect, vi } from "vitest";
import {
  APP_BUILD_INFO,
  getVersionDisplay,
  getVersionFull,
  parseSemver,
  isCompatible,
  isNewer,
  createStaleClientDetector,
  createAppVersionInterceptor,
} from "../../lib/app-version";

// =============================================================================
// Build Info
// =============================================================================

describe("APP_BUILD_INFO", () => {
  it("has version, sha, buildTime, and full fields", () => {
    expect(APP_BUILD_INFO).toHaveProperty("version");
    expect(APP_BUILD_INFO).toHaveProperty("sha");
    expect(APP_BUILD_INFO).toHaveProperty("buildTime");
    expect(APP_BUILD_INFO).toHaveProperty("full");
    expect(APP_BUILD_INFO.full).toBe(`${APP_BUILD_INFO.version}+${APP_BUILD_INFO.sha}`);
  });
});

// =============================================================================
// Display Helpers
// =============================================================================

describe("getVersionDisplay", () => {
  it("returns v{version} ({sha}) format", () => {
    const display = getVersionDisplay();
    expect(display).toMatch(/^v\d+\.\d+\.\d+ \(.+\)$/);
  });
});

describe("getVersionFull", () => {
  it("includes version, sha, and build date", () => {
    const full = getVersionFull();
    expect(full).toContain(`v${APP_BUILD_INFO.version}+${APP_BUILD_INFO.sha}`);
    expect(full).toContain("Built");
  });
});

// =============================================================================
// Semver Utilities
// =============================================================================

describe("parseSemver", () => {
  it("parses standard semver string", () => {
    expect(parseSemver("1.2.3")).toEqual({ major: 1, minor: 2, patch: 3 });
  });

  it("strips leading v", () => {
    expect(parseSemver("v2.0.1")).toEqual({ major: 2, minor: 0, patch: 1 });
  });

  it("strips build metadata after +", () => {
    expect(parseSemver("1.0.0+abc1234")).toEqual({ major: 1, minor: 0, patch: 0 });
  });

  it("returns null for invalid input", () => {
    expect(parseSemver("not-a-version")).toBeNull();
    expect(parseSemver("")).toBeNull();
  });
});

describe("isCompatible", () => {
  it("returns true for same major version", () => {
    expect(isCompatible("1.0.0", "1.5.0")).toBe(true);
    expect(isCompatible("2.1.0", "2.99.99")).toBe(true);
  });

  it("returns false for different major version", () => {
    expect(isCompatible("1.0.0", "2.0.0")).toBe(false);
    expect(isCompatible("3.0.0", "2.0.0")).toBe(false);
  });

  it("returns true for unparseable input", () => {
    expect(isCompatible("bad", "1.0.0")).toBe(true);
  });
});

describe("isNewer", () => {
  it("detects newer major", () => {
    expect(isNewer("1.0.0", "2.0.0")).toBe(true);
  });

  it("detects newer minor", () => {
    expect(isNewer("1.0.0", "1.1.0")).toBe(true);
  });

  it("detects newer patch", () => {
    expect(isNewer("1.0.0", "1.0.1")).toBe(true);
  });

  it("returns false for same version", () => {
    expect(isNewer("1.0.0", "1.0.0")).toBe(false);
  });

  it("returns false for older version", () => {
    expect(isNewer("2.0.0", "1.0.0")).toBe(false);
  });

  it("returns false for unparseable input", () => {
    expect(isNewer("bad", "1.0.0")).toBe(false);
  });
});

// =============================================================================
// Stale Client Detection
// =============================================================================

describe("createStaleClientDetector", () => {
  it("calls onStaleDetected when server reports a newer version", () => {
    const onStale = vi.fn();
    const detector = createStaleClientDetector({
      deployedVersionHeader: "x-deployed-version",
      onStaleDetected: onStale,
    });

    detector.checkResponse({ "x-deployed-version": "99.0.0" });
    expect(onStale).toHaveBeenCalledWith(APP_BUILD_INFO.version, "99.0.0");
  });

  it("does not call onStaleDetected for same or older version", () => {
    const onStale = vi.fn();
    const detector = createStaleClientDetector({
      deployedVersionHeader: "x-deployed-version",
      onStaleDetected: onStale,
    });

    detector.checkResponse({ "x-deployed-version": "0.0.1" });
    expect(onStale).not.toHaveBeenCalled();
  });

  it("only notifies once per session", () => {
    const onStale = vi.fn();
    const detector = createStaleClientDetector({
      deployedVersionHeader: "x-deployed-version",
      onStaleDetected: onStale,
    });

    detector.reset(); // Reset state from prior tests
    detector.checkResponse({ "x-deployed-version": "99.0.0" });
    detector.checkResponse({ "x-deployed-version": "99.1.0" });
    expect(onStale).toHaveBeenCalledTimes(1);
  });

  it("notifies again after reset", () => {
    const onStale = vi.fn();
    const detector = createStaleClientDetector({
      deployedVersionHeader: "x-deployed-version",
      onStaleDetected: onStale,
    });

    detector.reset();
    detector.checkResponse({ "x-deployed-version": "99.0.0" });
    detector.reset();
    detector.checkResponse({ "x-deployed-version": "99.0.0" });
    expect(onStale).toHaveBeenCalledTimes(2);
  });

  it("ignores responses without the version header", () => {
    const onStale = vi.fn();
    const detector = createStaleClientDetector({
      onStaleDetected: onStale,
    });

    detector.checkResponse({ "content-type": "application/json" });
    expect(onStale).not.toHaveBeenCalled();
  });
});

// =============================================================================
// API Client Interceptor
// =============================================================================

describe("createAppVersionInterceptor", () => {
  it("adds X-App-Version header to requests", () => {
    const interceptor = createAppVersionInterceptor();
    const result = interceptor({ url: "/api/devices", headers: { Authorization: "Bearer token" } });

    expect(result.headers?.["X-App-Version"]).toBe(APP_BUILD_INFO.full);
    expect(result.headers?.["Authorization"]).toBe("Bearer token");
    expect(result.url).toBe("/api/devices");
  });

  it("works with empty headers", () => {
    const interceptor = createAppVersionInterceptor();
    const result = interceptor({ url: "/api/devices" });

    expect(result.headers?.["X-App-Version"]).toBe(APP_BUILD_INFO.full);
  });
});
