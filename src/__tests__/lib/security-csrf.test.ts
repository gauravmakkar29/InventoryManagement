import { describe, it, expect, beforeEach } from "vitest";
import {
  getCsrfToken,
  createCsrfInterceptor,
  CSP_DIRECTIVES,
  RECOMMENDED_SECURITY_HEADERS,
} from "../../lib/security";

// =============================================================================
// CSRF Token Management
// =============================================================================

describe("getCsrfToken", () => {
  beforeEach(() => {
    // Clean up any existing meta tags
    document.querySelectorAll('meta[name="csrf-token"]').forEach((el) => el.remove());
    // Clear cookies
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "",
    });
  });

  it("reads token from meta tag", () => {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "csrf-token");
    meta.setAttribute("content", "abc123-csrf-token");
    document.head.appendChild(meta);

    expect(getCsrfToken()).toBe("abc123-csrf-token");

    document.head.removeChild(meta);
  });

  it("reads token from cookie when no meta tag", () => {
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "csrf-token=cookie-csrf-value; other-cookie=xyz",
    });

    expect(getCsrfToken()).toBe("cookie-csrf-value");
  });

  it("returns null when neither meta tag nor cookie exists", () => {
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "other-cookie=xyz",
    });

    expect(getCsrfToken()).toBeNull();
  });

  it("prefers meta tag over cookie", () => {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "csrf-token");
    meta.setAttribute("content", "meta-token");
    document.head.appendChild(meta);

    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "csrf-token=cookie-token",
    });

    expect(getCsrfToken()).toBe("meta-token");

    document.head.removeChild(meta);
  });
});

// =============================================================================
// CSRF Interceptor
// =============================================================================

describe("createCsrfInterceptor", () => {
  beforeEach(() => {
    document.querySelectorAll('meta[name="csrf-token"]').forEach((el) => el.remove());
    const meta = document.createElement("meta");
    meta.setAttribute("name", "csrf-token");
    meta.setAttribute("content", "test-csrf-token");
    document.head.appendChild(meta);
  });

  it("adds X-CSRF-Token header to POST requests", () => {
    const interceptor = createCsrfInterceptor();
    const result = interceptor({ url: "/api/devices", method: "POST" });
    expect(result.headers?.["X-CSRF-Token"]).toBe("test-csrf-token");
  });

  it("adds X-CSRF-Token header to PUT requests", () => {
    const interceptor = createCsrfInterceptor();
    const result = interceptor({ url: "/api/devices/1", method: "PUT" });
    expect(result.headers?.["X-CSRF-Token"]).toBe("test-csrf-token");
  });

  it("adds X-CSRF-Token header to PATCH requests", () => {
    const interceptor = createCsrfInterceptor();
    const result = interceptor({ url: "/api/devices/1", method: "PATCH" });
    expect(result.headers?.["X-CSRF-Token"]).toBe("test-csrf-token");
  });

  it("adds X-CSRF-Token header to DELETE requests", () => {
    const interceptor = createCsrfInterceptor();
    const result = interceptor({ url: "/api/devices/1", method: "DELETE" });
    expect(result.headers?.["X-CSRF-Token"]).toBe("test-csrf-token");
  });

  it("does not add header to GET requests", () => {
    const interceptor = createCsrfInterceptor();
    const result = interceptor({ url: "/api/devices", method: "GET" });
    expect(result.headers?.["X-CSRF-Token"]).toBeUndefined();
  });

  it("defaults method to GET when not specified", () => {
    const interceptor = createCsrfInterceptor();
    const result = interceptor({ url: "/api/devices" });
    expect(result.headers?.["X-CSRF-Token"]).toBeUndefined();
  });

  it("preserves existing headers", () => {
    const interceptor = createCsrfInterceptor();
    const result = interceptor({
      url: "/api/devices",
      method: "POST",
      headers: { Authorization: "Bearer token" },
    });
    expect(result.headers?.["Authorization"]).toBe("Bearer token");
    expect(result.headers?.["X-CSRF-Token"]).toBe("test-csrf-token");
  });
});

// =============================================================================
// CSP Directives & Security Headers
// =============================================================================

describe("CSP_DIRECTIVES", () => {
  it("has all required directives", () => {
    expect(CSP_DIRECTIVES["default-src"]).toBe("'self'");
    expect(CSP_DIRECTIVES["script-src"]).toBe("'self'");
    expect(CSP_DIRECTIVES["frame-ancestors"]).toBe("'none'");
    expect(CSP_DIRECTIVES["object-src"]).toBe("'none'");
    expect(CSP_DIRECTIVES["base-uri"]).toBe("'self'");
    expect(CSP_DIRECTIVES["form-action"]).toBe("'self'");
  });
});

describe("RECOMMENDED_SECURITY_HEADERS", () => {
  it("includes all critical security headers", () => {
    expect(RECOMMENDED_SECURITY_HEADERS["X-Frame-Options"]).toBe("DENY");
    expect(RECOMMENDED_SECURITY_HEADERS["X-Content-Type-Options"]).toBe("nosniff");
    expect(RECOMMENDED_SECURITY_HEADERS["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(RECOMMENDED_SECURITY_HEADERS["X-XSS-Protection"]).toBe("0");
    expect(RECOMMENDED_SECURITY_HEADERS["Strict-Transport-Security"]).toContain("max-age=");
  });

  it("disables camera, microphone, geolocation via Permissions-Policy", () => {
    expect(RECOMMENDED_SECURITY_HEADERS["Permissions-Policy"]).toContain("camera=()");
    expect(RECOMMENDED_SECURITY_HEADERS["Permissions-Policy"]).toContain("microphone=()");
    expect(RECOMMENDED_SECURITY_HEADERS["Permissions-Policy"]).toContain("geolocation=()");
  });
});
