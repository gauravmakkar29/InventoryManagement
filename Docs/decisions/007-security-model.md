# ADR-007: Frontend Security Model

**Status:** Accepted
**Date:** 2026-04-01

## Context

As an enterprise template, IMS Gen2 must ship with security best practices built in. Without a standard approach, each team adopting the template would need to implement their own XSS protection, CSRF handling, and CSP configuration.

## Decision

### 1. Input Sanitization at System Boundaries

All data crossing trust boundaries is sanitized:

- **API responses** — `sanitizeObject()` strips HTML from string values before state storage
- **URL parameters** — `sanitizeUrlParam()` allows only safe characters
- **User-generated content** — `escapeHtml()` for rendering, `stripHtml()` for plain text

React's JSX auto-escaping handles most XSS vectors. Sanitization is for edge cases: `dangerouslySetInnerHTML`, URL construction, and non-React rendering contexts.

### 2. Content Security Policy

CSP directives are defined in `src/lib/security.ts` and should be applied via:

- **Production:** HTTP response header (CloudFront, nginx, or CDN)
- **Development:** `<meta>` tag in `index.html`

Default policy: `default-src 'self'`, no inline scripts, no frames, images from HTTPS only.

### 3. CSRF Protection

Double-submit cookie pattern via `createCsrfInterceptor()` — adds `X-CSRF-Token` header to POST/PUT/PATCH/DELETE requests. Token is read from `<meta name="csrf-token">` tag or cookie.

### 4. Secrets Management

- All secrets in `.env.local` (gitignored)
- `.env.example` documents required variables without values
- `containsPotentialSecret()` utility for CI leak detection
- No secrets in localStorage — only session tokens with expiry

## Consequences

- **Positive:** Template ships secure by default. Adopters get CSP, CSRF, and sanitization out of the box.
- **Positive:** Interceptor-based — security plugs into the API client without touching business logic.
- **Negative:** `style-src 'unsafe-inline'` required for Tailwind runtime styles. Can be tightened with nonce-based CSP in SSR setups.
