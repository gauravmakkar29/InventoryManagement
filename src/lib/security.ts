/**
 * IMS Gen 2 — Security Utilities
 *
 * System-boundary sanitization, CSRF token management, and XSS protection.
 * All user input and API responses should be sanitized before rendering.
 *
 * @see Story #189 — CSP headers, XSS protection, CSRF tokens
 * @see Story #190 — Input sanitization + secrets management
 * @see ADR-007 — Security model
 */

// =============================================================================
// Input Sanitization
// =============================================================================

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#96;",
};

const HTML_ESCAPE_REGEX = /[&<>"'/`]/g;

/** Escape HTML entities to prevent XSS in text content. */
export function escapeHtml(input: string): string {
  return input.replace(HTML_ESCAPE_REGEX, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

/**
 * Strip all HTML tags from a string.
 * Use when displaying user-generated content that must be plain text.
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/**
 * Sanitize a string for safe rendering.
 * Strips HTML tags and trims whitespace.
 */
export function sanitizeText(input: string): string {
  return stripHtml(input).trim();
}

/**
 * Sanitize an object's string values recursively.
 * Safe for API response data before storing in state.
 */
export function sanitizeObject<T>(obj: T): T {
  if (typeof obj === "string") return sanitizeText(obj) as T;
  if (Array.isArray(obj)) return obj.map(sanitizeObject) as T;
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = sanitizeObject(value);
    }
    return result as T;
  }
  return obj;
}

/**
 * Validate and sanitize a URL parameter.
 * Only allows alphanumeric, hyphens, underscores, and dots.
 */
export function sanitizeUrlParam(param: string): string {
  return param.replace(/[^a-zA-Z0-9\-_.]/g, "");
}

/**
 * Validate that a URL is safe (no javascript:, data:, etc.).
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    return ["http:", "https:", "mailto:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// =============================================================================
// CSRF Token Management
// =============================================================================

/** Read the CSRF token from a meta tag or cookie. */
export function getCsrfToken(): string | null {
  // Try meta tag first (set by server-rendered page)
  const meta = document.querySelector('meta[name="csrf-token"]');
  if (meta) return meta.getAttribute("content");

  // Try cookie (double-submit pattern)
  const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]*)/);
  return match ? decodeURIComponent(match[1] ?? "") : null;
}

/**
 * Request interceptor that adds CSRF token to mutation requests.
 * Plugs into createApiClient() interceptors.
 */
export function createCsrfInterceptor() {
  return (request: { url: string; method?: string; headers?: Record<string, string> }) => {
    const method = (request.method ?? "GET").toUpperCase();
    // Only add CSRF to state-changing methods
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      const token = getCsrfToken();
      if (token) {
        return {
          ...request,
          headers: { ...request.headers, "X-CSRF-Token": token },
        };
      }
    }
    return request;
  };
}

// =============================================================================
// Content Security Policy
// =============================================================================

/**
 * CSP directives for the IMS Gen2 application.
 * Applied via meta tag in index.html (for SPA) or HTTP header (for SSR).
 *
 * To use: add to index.html <head>:
 * <meta http-equiv="Content-Security-Policy" content="...">
 *
 * Or configure in your web server / CDN (preferred for production).
 */
export const CSP_DIRECTIVES = {
  "default-src": "'self'",
  "script-src": "'self'",
  "style-src": "'self' 'unsafe-inline'",
  "img-src": "'self' data: https:",
  "font-src": "'self'",
  "connect-src": "'self' https:",
  "frame-ancestors": "'none'",
  "base-uri": "'self'",
  "form-action": "'self'",
  "object-src": "'none'",
} as const;

/** Build CSP string from directives. */
export function buildCspString(overrides?: Partial<Record<string, string>>): string {
  const merged = { ...CSP_DIRECTIVES, ...overrides };
  return Object.entries(merged)
    .map(([key, value]) => `${key} ${value}`)
    .join("; ");
}

// =============================================================================
// Security Headers Checklist
// =============================================================================

/**
 * Recommended security headers for production deployment.
 * Configure these in your CDN/reverse proxy (CloudFront, nginx, etc.).
 *
 * These cannot be set from a SPA — they must be set by the server.
 */
export const RECOMMENDED_SECURITY_HEADERS = {
  "Content-Security-Policy": buildCspString(),
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-XSS-Protection": "0", // Disabled — CSP is the modern replacement
} as const;

// =============================================================================
// Secrets Management Validation
// =============================================================================

/** Patterns that might indicate leaked secrets in code. */
const SECRET_PATTERNS = [
  /(?:api[_-]?key|apikey)\s*[:=]\s*['"][^'"]{8,}/i,
  /(?:secret|password|token|credential)\s*[:=]\s*['"][^'"]{8,}/i,
  /AKIA[0-9A-Z]{16}/, // AWS Access Key
  /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}/, // GitHub token
];

/**
 * Check if a string contains potential secrets.
 * Use in CI/pre-commit hooks to prevent accidental leaks.
 */
export function containsPotentialSecret(input: string): boolean {
  return SECRET_PATTERNS.some((pattern) => pattern.test(input));
}
