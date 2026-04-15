import { describe, it, expect } from "vitest";
import { isRollback, parseVersion } from "@/lib/firmware/firmware-version-utils";

describe("parseVersion", () => {
  it("parses plain semver", () => {
    expect(parseVersion("1.2.3")).toEqual([1, 2, 3]);
  });

  it("strips a leading v", () => {
    expect(parseVersion("v4.1.0")).toEqual([4, 1, 0]);
    expect(parseVersion("V4.1.0")).toEqual([4, 1, 0]);
  });

  it("ignores prerelease and build metadata", () => {
    expect(parseVersion("1.2.0-beta.1")).toEqual([1, 2, 0]);
    expect(parseVersion("1.2.0+meta")).toEqual([1, 2, 0]);
    expect(parseVersion("v1.2.0-rc.1+sha123")).toEqual([1, 2, 0]);
  });

  it("returns null for malformed strings", () => {
    expect(parseVersion("unknown")).toBeNull();
    expect(parseVersion("")).toBeNull();
    expect(parseVersion("1.2")).toBeNull();
    expect(parseVersion("v1")).toBeNull();
    expect(parseVersion("abc.def.ghi")).toBeNull();
  });
});

describe("isRollback", () => {
  describe("returns false when rollback is not possible", () => {
    it("no previous version (first assignment)", () => {
      expect(isRollback("v1.0.0", null)).toBe(false);
      expect(isRollback("v1.0.0", undefined)).toBe(false);
      expect(isRollback("v1.0.0", "")).toBe(false);
    });

    it("equal versions (re-assignment, not rollback)", () => {
      expect(isRollback("v1.2.3", "v1.2.3")).toBe(false);
      expect(isRollback("1.2.3", "v1.2.3")).toBe(false);
      expect(isRollback("v1.2.0-beta.1", "v1.2.0")).toBe(false);
    });

    it("forward upgrade (patch, minor, major)", () => {
      expect(isRollback("v1.0.1", "v1.0.0")).toBe(false);
      expect(isRollback("v1.1.0", "v1.0.5")).toBe(false);
      expect(isRollback("v2.0.0", "v1.9.9")).toBe(false);
    });

    it("unparseable new version (defensive)", () => {
      expect(isRollback("unknown", "v1.0.0")).toBe(false);
      expect(isRollback("", "v1.0.0")).toBe(false);
    });

    it("unparseable previous version (defensive)", () => {
      expect(isRollback("v1.0.0", "unknown")).toBe(false);
    });
  });

  describe("returns true for genuine rollbacks", () => {
    it("patch downgrade", () => {
      expect(isRollback("v1.0.0", "v1.0.1")).toBe(true);
      expect(isRollback("v4.0.2", "v4.1.0")).toBe(true);
    });

    it("minor downgrade", () => {
      expect(isRollback("v1.0.5", "v1.1.0")).toBe(true);
      expect(isRollback("v3.9.0", "v4.0.2")).toBe(true);
    });

    it("major downgrade", () => {
      expect(isRollback("v1.9.9", "v2.0.0")).toBe(true);
    });

    it("prerelease new version to stable prior", () => {
      // "1.2.0-beta.1" coerces to [1,2,0]; previous "1.3.0" → rollback.
      expect(isRollback("1.2.0-beta.1", "1.3.0")).toBe(true);
    });

    it("handles mixed v-prefix on either side", () => {
      expect(isRollback("1.0.0", "v2.0.0")).toBe(true);
      expect(isRollback("v1.0.0", "2.0.0")).toBe(true);
    });
  });
});
