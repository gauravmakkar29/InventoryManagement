import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  escapeCsvField,
  sanitizeFilename,
  generateCsvContent,
  generateJsonContent,
  resolveAccessor,
  triggerDownload,
} from "@/lib/use-export";
import type { ExportColumn } from "@/lib/use-export";

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

interface TestRow {
  id: number;
  name: string;
  status: string;
  score: number;
}

const COLUMNS: ExportColumn<TestRow>[] = [
  { header: "ID", accessor: "id" },
  { header: "Name", accessor: "name" },
  { header: "Status", accessor: "status" },
  { header: "Score", accessor: (r) => String(r.score) },
];

const SAMPLE_DATA: TestRow[] = [
  { id: 1, name: "Alpha", status: "Online", score: 95 },
  { id: 2, name: "Beta", status: "Offline", score: 42 },
  { id: 3, name: "Gamma", status: "Maintenance", score: 78 },
];

// ---------------------------------------------------------------------------
// escapeCsvField
// ---------------------------------------------------------------------------

describe("escapeCsvField()", () => {
  it("returns plain value when no special characters", () => {
    expect(escapeCsvField("hello")).toBe("hello");
  });

  it("wraps in double quotes when value contains a comma", () => {
    expect(escapeCsvField("a,b")).toBe('"a,b"');
  });

  it("escapes double quotes by doubling them", () => {
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
  });

  it("wraps in double quotes when value contains a newline", () => {
    expect(escapeCsvField("line1\nline2")).toBe('"line1\nline2"');
  });

  it("wraps in double quotes when value contains a carriage return", () => {
    expect(escapeCsvField("line1\rline2")).toBe('"line1\rline2"');
  });

  it("handles combination of comma and quotes", () => {
    expect(escapeCsvField('"yes",no')).toBe('"""yes"",no"');
  });

  it("returns empty string unchanged", () => {
    expect(escapeCsvField("")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// sanitizeFilename
// ---------------------------------------------------------------------------

describe("sanitizeFilename()", () => {
  it("passes through clean filenames unchanged", () => {
    expect(sanitizeFilename("my-report")).toBe("my-report");
  });

  it("replaces unsafe characters with underscores", () => {
    expect(sanitizeFilename("file<name>:test")).toBe("file_name_test");
  });

  it("collapses consecutive underscores", () => {
    expect(sanitizeFilename("a***b")).toBe("a_b");
  });

  it("trims leading and trailing underscores", () => {
    expect(sanitizeFilename("?hello?")).toBe("hello");
  });

  it("truncates to 200 characters", () => {
    const longName = "a".repeat(250);
    expect(sanitizeFilename(longName).length).toBeLessThanOrEqual(200);
  });

  it("replaces null bytes and control characters", () => {
    expect(sanitizeFilename("file\x00name\x1f")).toBe("file_name");
  });
});

// ---------------------------------------------------------------------------
// resolveAccessor
// ---------------------------------------------------------------------------

describe("resolveAccessor()", () => {
  const row: TestRow = { id: 1, name: "Test", status: "Online", score: 99 };

  it("resolves a string key accessor", () => {
    expect(resolveAccessor(row, "name")).toBe("Test");
  });

  it("resolves a function accessor", () => {
    const fn = (r: TestRow) => String(r.score * 2);
    expect(resolveAccessor(row, fn)).toBe("198");
  });

  it("returns empty string for null/undefined values", () => {
    const partial = { id: 1, name: null, status: "ok", score: 0 } as unknown as TestRow;
    expect(resolveAccessor(partial, "name")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// generateCsvContent
// ---------------------------------------------------------------------------

describe("generateCsvContent()", () => {
  it("generates CSV with headers and rows", async () => {
    const csv = await generateCsvContent(SAMPLE_DATA, COLUMNS);
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe("ID,Name,Status,Score");
    expect(lines[1]).toBe("1,Alpha,Online,95");
    expect(lines[2]).toBe("2,Beta,Offline,42");
    expect(lines[3]).toBe("3,Gamma,Maintenance,78");
  });

  it("returns header-only for empty data", async () => {
    const csv = await generateCsvContent([], COLUMNS);
    expect(csv.trim()).toBe("ID,Name,Status,Score");
  });

  it("properly escapes special characters in data", async () => {
    const data: TestRow[] = [{ id: 1, name: 'O"Brien, Jr.', status: "line\ntwo", score: 50 }];
    const csv = await generateCsvContent(data, COLUMNS);
    expect(csv).toContain('"O""Brien, Jr."');
    expect(csv).toContain('"line\ntwo"');
  });

  it("handles large datasets without error", async () => {
    const largeData: TestRow[] = Array.from({ length: 1500 }, (_, i) => ({
      id: i,
      name: `Device-${i}`,
      status: "Online",
      score: Math.floor(Math.random() * 100),
    }));
    const csv = await generateCsvContent(largeData, COLUMNS);
    const lines = csv.trim().split("\n");
    // 1 header + 1500 data rows
    expect(lines.length).toBe(1501);
  });
});

// ---------------------------------------------------------------------------
// generateJsonContent
// ---------------------------------------------------------------------------

describe("generateJsonContent()", () => {
  it("generates pretty-printed JSON array", () => {
    const json = generateJsonContent(SAMPLE_DATA, COLUMNS);
    const parsed = JSON.parse(json) as Record<string, string>[];
    expect(parsed).toHaveLength(3);
    expect(parsed[0]).toEqual({
      ID: "1",
      Name: "Alpha",
      Status: "Online",
      Score: "95",
    });
  });

  it("returns empty array for empty data", () => {
    const json = generateJsonContent([], COLUMNS);
    expect(JSON.parse(json)).toEqual([]);
  });

  it("uses column headers as keys, not raw field names", () => {
    const json = generateJsonContent(SAMPLE_DATA.slice(0, 1), COLUMNS);
    const parsed = JSON.parse(json) as Record<string, string>[];
    expect(Object.keys(parsed[0] ?? {})).toEqual(["ID", "Name", "Status", "Score"]);
  });
});

// ---------------------------------------------------------------------------
// triggerDownload
// ---------------------------------------------------------------------------

describe("triggerDownload()", () => {
  let clickSpy: ReturnType<typeof vi.fn>;
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;

  beforeEach(() => {
    clickSpy = vi.fn();
    vi.spyOn(document, "createElement").mockReturnValue({
      href: "",
      download: "",
      click: clickSpy,
      style: {},
    } as unknown as HTMLAnchorElement);

    // jsdom does not provide URL.createObjectURL; define stubs directly
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn().mockReturnValue("blob:test");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });

  it("creates a blob and triggers a click", () => {
    triggerDownload("csv,data", "test.csv", "text/csv");
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
  });

  it("sets the download filename correctly", () => {
    const mockLink = {
      href: "",
      download: "",
      click: vi.fn(),
      style: {},
    } as unknown as HTMLAnchorElement;
    vi.spyOn(document, "createElement").mockReturnValue(mockLink);

    triggerDownload("data", "report.json", "application/json");
    expect(mockLink.download).toBe("report.json");
  });
});
