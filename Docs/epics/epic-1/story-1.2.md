# Story 1.2: Multi-Factor Authentication (TOTP)

**Epic:** Epic 1 — Authentication & User Management
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 5
**Status:** In Review (PR pending)
**Branch:** `feature/IMS-9-mfa-totp`
**GitHub Issue:** #9

## User Story

As a platform user, I want to set up and use TOTP-based multi-factor authentication, so that my account is protected even if my password is compromised.

## Acceptance Criteria

- [x] AC1: "Enable MFA" available via MfaSetup modal component
- [x] AC2: QR code placeholder + manual secret key displayed for authenticator app setup
- [x] AC3: Valid 6-digit TOTP code enables MFA with success toast
- [x] AC4: On next login with MFA enabled, 6-digit challenge screen appears after password
- [x] AC5: Incorrect TOTP shows "Invalid verification code. Please try again." error
- [x] AC6: Correct TOTP code completes sign-in and redirects to Dashboard

## Implementation Notes

- MFA state stored in localStorage (ims-mfa-enabled) as array of enabled emails
- Auth context extended with: mfaRequired, mfaEnabled, verifyMfa, setupMfa, confirmMfaSetup
- MfaChallenge: 6-digit input with auto-focus, auto-advance, paste support, auto-submit
- MfaSetup: Modal with QR placeholder, manual key with copy button, verification input
- Sign-in flow: password → (if MFA enabled) → MFA challenge → Dashboard
- Mock: accepts any 6-digit code for verification
- Includes Stories 1.1 + 1.3 + 1.4 changes as base

## Out of Scope

- SMS-based MFA (TOTP only per spec)
- MFA recovery codes / backup methods
- Mandatory MFA enforcement

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for Cognito MFA configuration and NIST IA-2 compliance details.

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
