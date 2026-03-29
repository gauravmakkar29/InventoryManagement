import { describe, it, expect } from "vitest";
import { cn } from "../../lib/utils";

describe("cn()", () => {
  it("merges simple class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    const isHidden = false;
    expect(cn("base", isHidden && "hidden", "visible")).toBe("base visible");
  });

  it("handles undefined and null values", () => {
    expect(cn("a", undefined, null, "b")).toBe("a b");
  });

  it("resolves Tailwind conflicts — last wins", () => {
    expect(cn("px-4", "px-2")).toBe("px-2");
  });

  it("resolves Tailwind color conflicts", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("preserves non-conflicting Tailwind classes", () => {
    expect(cn("px-4", "py-2", "mt-1")).toBe("px-4 py-2 mt-1");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });

  it("handles array input via clsx", () => {
    expect(cn(["a", "b"], "c")).toBe("a b c");
  });

  it("handles object input via clsx", () => {
    expect(cn({ hidden: true, visible: false })).toBe("hidden");
  });
});
