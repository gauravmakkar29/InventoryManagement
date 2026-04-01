import { describe, it, expect } from "vitest";
import {
  escapeHtml,
  stripHtml,
  sanitizeText,
  sanitizeObject,
  sanitizeUrlParam,
  isSafeUrl,
  containsPotentialSecret,
  buildCspString,
} from "../../lib/security";

describe("Security Utilities", () => {
  describe("escapeHtml", () => {
    it("escapes HTML entities", () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        "&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;",
      );
    });

    it("escapes ampersands", () => {
      expect(escapeHtml("a & b")).toBe("a &amp; b");
    });

    it("returns plain text unchanged", () => {
      expect(escapeHtml("Hello World")).toBe("Hello World");
    });
  });

  describe("stripHtml", () => {
    it("removes HTML tags", () => {
      expect(stripHtml("<b>bold</b> and <i>italic</i>")).toBe("bold and italic");
    });

    it("removes script tags", () => {
      expect(stripHtml('<script>alert("xss")</script>safe')).toBe('alert("xss")safe');
    });
  });

  describe("sanitizeText", () => {
    it("strips HTML and trims", () => {
      expect(sanitizeText("  <b>hello</b>  ")).toBe("hello");
    });
  });

  describe("sanitizeObject", () => {
    it("sanitizes nested string values", () => {
      const input = {
        name: "<script>x</script>Device",
        nested: { desc: "<b>Bold</b>" },
        items: ["<i>item1</i>", "item2"],
        count: 42,
      };
      const result = sanitizeObject(input);
      expect(result.name).toBe("xDevice");
      expect((result.nested as { desc: string }).desc).toBe("Bold");
      expect(result.items).toEqual(["item1", "item2"]);
      expect(result.count).toBe(42);
    });

    it("handles null and undefined", () => {
      expect(sanitizeObject(null)).toBeNull();
      expect(sanitizeObject(undefined)).toBeUndefined();
    });
  });

  describe("sanitizeUrlParam", () => {
    it("strips unsafe characters", () => {
      expect(sanitizeUrlParam("admin'; DROP TABLE--")).toBe("adminDROPTABLE--");
    });

    it("allows safe characters", () => {
      expect(sanitizeUrlParam("device-001_v2.0")).toBe("device-001_v2.0");
    });
  });

  describe("isSafeUrl", () => {
    it("allows https URLs", () => {
      expect(isSafeUrl("https://example.com")).toBe(true);
    });

    it("allows http URLs", () => {
      expect(isSafeUrl("http://localhost:5173")).toBe(true);
    });

    it("rejects javascript: URLs", () => {
      expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    });

    it("rejects data: URLs", () => {
      expect(isSafeUrl("data:text/html,<h1>XSS</h1>")).toBe(false);
    });

    it("handles relative URLs", () => {
      expect(isSafeUrl("/api/devices")).toBe(true);
    });
  });

  describe("containsPotentialSecret", () => {
    it("detects API key patterns", () => {
      expect(containsPotentialSecret('api_key = "sk_live_abc12345678"')).toBe(true);
    });

    it("detects AWS access keys", () => {
      expect(containsPotentialSecret("AKIAIOSFODNN7EXAMPLE")).toBe(true);
    });

    it("detects GitHub tokens", () => {
      expect(containsPotentialSecret("ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij")).toBe(true);
    });

    it("does not flag normal code", () => {
      expect(containsPotentialSecret('const name = "hello";')).toBe(false);
    });
  });

  describe("buildCspString", () => {
    it("builds a valid CSP string", () => {
      const csp = buildCspString();
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("object-src 'none'");
    });

    it("allows overrides", () => {
      const csp = buildCspString({ "script-src": "'self' 'nonce-abc'" });
      expect(csp).toContain("script-src 'self' 'nonce-abc'");
    });
  });
});
