# Story 1.1: User Login with Email and Password

**Epic:** Epic 1 — Authentication & User Management
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 5
**Status:** In Review (PR pending)
**Branch:** `feature/IMS-2-user-login`
**GitHub Issue:** #2

## User Story

As a platform user, I want to log in with my email and password, so that I can securely access the HLM platform.

## Acceptance Criteria

- [x] AC1: When I navigate to the application, I am redirected to the `/login` page if not authenticated
- [x] AC2: When I enter a valid email and password and click "Sign In", I am authenticated and redirected to the Dashboard (`/`)
- [x] AC3: When I enter an invalid email or password, I see an error message "Invalid email or password. Please try again." in a red banner above the form
- [x] AC4: When I enter a password that does not meet policy (12+ chars, upper, lower, number, symbol), the Sign In button remains disabled with inline validation hints showing check/x marks
- [x] AC5: When I am already authenticated and navigate to `/login`, I am redirected to the Dashboard
- [x] AC6: When the login API is unreachable, a toast notification "Unable to connect. Check your network and try again." is shown

## UI Behavior

- Login page displays split layout: branding left (desktop), form right
- Email field validates format on blur
- Password field has show/hide toggle
- Password policy hints appear on focus with real-time check/x indicators
- Loading spinner text ("Signing in...") on the Sign In button while authentication is in progress
- Auth error displayed in red banner with AlertCircle icon above form
- Demo credentials hint shown below the form card
- "Forgot password?" link below the form (navigates to Cognito-hosted recovery flow)

## Implementation Notes

- Mock credentials stored in auth-context: admin@company.com, manager@company.com, tech@company.com, viewer@company.com, customer@tenant.com
- Role derived from email prefix (admin → Admin, manager → Manager, etc.)
- signInError state added to AuthState for inline error display
- 600ms simulated network delay on sign-in
- Password policy: 12+ chars, uppercase, lowercase, digit, symbol

## Out of Scope

- MFA challenge (covered in Story 1.2)
- User registration / self-sign-up (admin-provisioned only)
- Social identity providers (Google, SAML)

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for Cognito configuration, AuthProvider context, and session management details.

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
