import { describe, it, expect, vi, afterEach } from "vitest";
import { formatDate, formatDateTime, formatRelativeTime } from "../../lib/utils";

// =============================================================================
// formatDate
// =============================================================================

describe("formatDate", () => {
  it("formats a Date object", () => {
    const result = formatDate(new Date("2026-03-28T00:00:00Z"));
    expect(result).toContain("Mar");
    expect(result).toContain("28");
    expect(result).toContain("2026");
  });

  it("formats a date string", () => {
    const result = formatDate("2026-01-15T12:00:00Z");
    expect(result).toContain("Jan");
    expect(result).toContain("15");
    expect(result).toContain("2026");
  });

  it("handles ISO date strings", () => {
    const result = formatDate("2025-12-25T00:00:00.000Z");
    expect(result).toContain("Dec");
    expect(result).toContain("25");
    expect(result).toContain("2025");
  });
});

// =============================================================================
// formatDateTime
// =============================================================================

describe("formatDateTime", () => {
  it("includes date and time components", () => {
    const result = formatDateTime("2026-03-28T14:30:00Z");
    expect(result).toContain("Mar");
    expect(result).toContain("28");
    expect(result).toContain("2026");
    // Should contain a time component (hour/minute with AM/PM)
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it("formats Date objects", () => {
    const date = new Date("2026-06-15T09:00:00Z");
    const result = formatDateTime(date);
    expect(result).toContain("Jun");
    expect(result).toContain("15");
    expect(result).toContain("2026");
  });
});

// =============================================================================
// formatRelativeTime
// =============================================================================

describe("formatRelativeTime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'now' or 'seconds ago' for very recent dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-02T12:00:05Z"));
    const result = formatRelativeTime("2026-04-02T12:00:00Z");
    // Intl.RelativeTimeFormat returns something like "5 seconds ago"
    expect(result).toMatch(/second/i);
  });

  it("returns minutes ago for recent dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-02T12:10:00Z"));
    const result = formatRelativeTime("2026-04-02T12:00:00Z");
    expect(result).toMatch(/10 minutes ago/i);
  });

  it("returns hours ago for same-day dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-02T15:00:00Z"));
    const result = formatRelativeTime("2026-04-02T12:00:00Z");
    expect(result).toMatch(/3 hours ago/i);
  });

  it("returns days ago for older dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-05T12:00:00Z"));
    const result = formatRelativeTime("2026-04-02T12:00:00Z");
    expect(result).toMatch(/3 days ago/i);
  });

  it("handles Date objects", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-02T12:30:00Z"));
    const result = formatRelativeTime(new Date("2026-04-02T12:00:00Z"));
    expect(result).toMatch(/30 minutes ago/i);
  });
});
