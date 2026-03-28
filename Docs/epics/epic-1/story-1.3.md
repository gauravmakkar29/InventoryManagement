# Story 1.3: Session Management and Token Refresh

**Epic:** Epic 1 — Authentication & User Management
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 3

## User Story
As an authenticated user, I want my session to be automatically maintained while I am active and to be safely terminated when tokens expire, so that I have a seamless experience without security gaps.

## Acceptance Criteria
- [ ] AC1: When my access token is about to expire (within 1 minute), the application silently refreshes it in the background without interrupting my workflow
- [ ] AC2: When the refresh token is still valid (within 7 days), I remain logged in across browser refreshes and tab closures
- [ ] AC3: When my refresh token has expired (after 7 days of inactivity), I am redirected to `/login` with a toast "Session expired. Please sign in again."
- [ ] AC4: When a token refresh fails due to a network error, I see a non-blocking warning "Unable to refresh session" and can continue using cached data
- [ ] AC5: When I click "Sign Out" in the user dropdown menu, I am immediately logged out, all tokens are cleared, and I am redirected to `/login`

## UI Behavior
- Token refresh happens invisibly in the background; no UI interruption
- Sign Out option is in the user avatar dropdown in the top-right header
- On session expiry, a toast notification appears before redirect
- Loading spinner shown during initial auth check on page load (before rendering protected content)

## Out of Scope
- Idle timeout countdown/warning modal
- "Remember me" checkbox
- Multi-device session management

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for token expiry settings (AC-11, AC-12) and session lifecycle details.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
