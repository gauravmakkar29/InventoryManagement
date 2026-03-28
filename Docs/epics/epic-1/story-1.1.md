# Story 1.1: User Login with Email and Password

**Epic:** Epic 1 — Authentication & User Management
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 5

## User Story
As a platform user, I want to log in with my email and password, so that I can securely access the HLM platform.

## Acceptance Criteria
- [ ] AC1: When I navigate to the application, I am redirected to the `/login` page if not authenticated
- [ ] AC2: When I enter a valid email and password and click "Sign In", I am authenticated and redirected to the Dashboard (`/`)
- [ ] AC3: When I enter an invalid email or password, I see an error message "Incorrect email or password" below the form
- [ ] AC4: When I enter a password that does not meet policy (12+ chars, upper, lower, number, symbol), the Sign In button remains disabled with inline validation hints
- [ ] AC5: When I am already authenticated and navigate to `/login`, I am redirected to the Dashboard
- [ ] AC6: When the login API is unreachable, I see a toast notification "Unable to connect. Check your network."

## UI Behavior
- Login page displays centered card with logo, email input, password input, and "Sign In" button
- Email field validates format on blur
- Password field has show/hide toggle
- Loading spinner on the Sign In button while authentication is in progress
- Error messages appear inline below the relevant input field
- "Forgot password?" link below the form (navigates to Cognito-hosted recovery flow)

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
