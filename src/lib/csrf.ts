/**
 * IMS Gen 2 — CSRF Protection
 *
 * Provides a request interceptor that attaches X-CSRF-Token to mutating
 * requests (POST, PUT, PATCH, DELETE). GET/HEAD/OPTIONS are excluded per spec.
 *
 * The token source is configurable — defaults to reading a cookie or meta tag.
 * Missing tokens degrade gracefully (request proceeds without header).
 *
 * NIST SC-7: Boundary protection at the application layer.
 *
 * @see Story #340 — CSRF interceptor
 */

import type { RequestInterceptor } from "./api-client";

const CSRF_HEADER = "X-CSRF-Token";
const CSRF_META_NAME = "csrf-token";
const CSRF_COOKIE_NAME = "XSRF-TOKEN";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Read CSRF token from the first available source:
 * 1. <meta name="csrf-token" content="..."> (server-rendered pages)
 * 2. XSRF-TOKEN cookie (common in SPA + API setups)
 */
function readCsrfToken(): string | null {
  // Try meta tag first
  const meta = document.querySelector(`meta[name="${CSRF_META_NAME}"]`);
  if (meta) {
    const content = meta.getAttribute("content");
    if (content) return content;
  }

  // Try cookie
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CSRF_COOKIE_NAME}=([^;]+)`));
  if (match?.[1]) {
    return decodeURIComponent(match[1]);
  }

  return null;
}

/**
 * Creates a request interceptor that adds X-CSRF-Token to mutating requests.
 * Safe methods (GET, HEAD, OPTIONS) are not modified.
 * Missing token is non-blocking — the request proceeds without the header.
 */
export function createCsrfInterceptor(): RequestInterceptor {
  return (request) => {
    const method = (request.method ?? "GET").toUpperCase();

    if (!MUTATING_METHODS.has(method)) {
      return request;
    }

    const token = readCsrfToken();
    if (!token) {
      return request;
    }

    return {
      ...request,
      headers: {
        ...request.headers,
        [CSRF_HEADER]: token,
      },
    };
  };
}
