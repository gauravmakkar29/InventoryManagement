import { describe, it, expect } from "vitest";
import { generateCSV, generateJSON } from "../../lib/report-generator";

describe("generateCSV()", () => {
  it("returns empty string for empty data array", () => {
    expect(generateCSV([])).toBe("");
  });

  it("generates CSV with headers from first row keys when no columns specified", () => {
    const data = [
      { Name: "Alice", Age: 30 },
      { Name: "Bob", Age: 25 },
    ];
    const csv = generateCSV(data);
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe("Name,Age");
    expect(lines[1]).toBe("Alice,30");
    expect(lines[2]).toBe("Bob,25");
  });

  it("uses specified columns in order", () => {
    const data = [{ B: "b1", A: "a1", C: "c1" }];
    const csv = generateCSV(data, ["A", "C"]);
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe("A,C");
    expect(lines[1]).toBe("a1,c1");
  });

  it("uses custom headers when provided", () => {
    const data = [{ userId: "u1", action: "Created" }];
    const csv = generateCSV(data, ["userId", "action"], ["User", "Action"]);
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe("User,Action");
    expect(lines[1]).toBe("u1,Created");
  });

  it("escapes fields containing commas", () => {
    const data = [{ name: "Doe, John", age: 30 }];
    const csv = generateCSV(data);
    expect(csv).toContain('"Doe, John"');
  });

  it("escapes fields containing double quotes", () => {
    const data = [{ note: 'He said "hello"' }];
    const csv = generateCSV(data);
    expect(csv).toContain('"He said ""hello"""');
  });

  it("escapes fields containing newlines", () => {
    const data = [{ note: "line1\nline2" }];
    const csv = generateCSV(data);
    expect(csv).toContain('"line1\nline2"');
  });

  it("handles null and undefined values as empty strings", () => {
    const data = [{ a: null, b: undefined, c: "ok" }];
    const csv = generateCSV(data as Record<string, unknown>[]);
    const lines = csv.trim().split("\n");
    expect(lines[1]).toBe(",,ok");
  });

  it("generates audit log CSV matching Story 8.5 format", () => {
    const data = [
      {
        User: "sarah@example.com",
        Action: "Created",
        ResourceType: "Firmware",
        ResourceId: "FW#abc123",
        Timestamp: "2026-03-15T10:30:00Z",
        IPAddress: "203.0.113.42",
        Status: "Success",
      },
    ];
    const columns = [
      "User",
      "Action",
      "ResourceType",
      "ResourceId",
      "Timestamp",
      "IPAddress",
      "Status",
    ];
    const csv = generateCSV(data, columns, columns);
    const lines = csv.trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe("User,Action,ResourceType,ResourceId,Timestamp,IPAddress,Status");
    expect(lines[1]).toBe(
      "sarah@example.com,Created,Firmware,FW#abc123,2026-03-15T10:30:00Z,203.0.113.42,Success",
    );
  });
});

describe("generateJSON()", () => {
  it("generates pretty JSON by default", () => {
    const data = { key: "value" };
    expect(generateJSON(data)).toBe(JSON.stringify(data, null, 2));
  });

  it("generates compact JSON when pretty=false", () => {
    const data = { key: "value" };
    expect(generateJSON(data, false)).toBe('{"key":"value"}');
  });
});
