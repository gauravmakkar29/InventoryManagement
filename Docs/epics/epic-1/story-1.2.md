# Story 1.2: Multi-Factor Authentication (TOTP)

**Epic:** Epic 1 — Authentication & User Management
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 5

## User Story
As a platform user, I want to set up and use TOTP-based multi-factor authentication, so that my account is protected even if my password is compromised.

## Acceptance Criteria
- [ ] AC1: When MFA is not yet configured for my account, I see an "Enable MFA" option on my profile/settings page
- [ ] AC2: When I click "Enable MFA", I see a QR code that I can scan with an authenticator app (Google Authenticator, Authy, etc.)
- [ ] AC3: When I enter a valid 6-digit TOTP code from my authenticator app and click "Verify", MFA is enabled for my account with a success confirmation
- [ ] AC4: When I log in with email/password and MFA is enabled, I am prompted for a 6-digit TOTP code before gaining access
- [ ] AC5: When I enter an incorrect TOTP code, I see "Invalid verification code. Please try again."
- [ ] AC6: When I enter the correct TOTP code, I am redirected to the Dashboard

## UI Behavior
- MFA setup shows a modal with QR code and a manual setup key (text) for users who cannot scan
- TOTP input is a 6-digit numeric field with auto-focus and auto-submit on 6th digit
- MFA challenge screen appears between password verification and dashboard access
- "Having trouble?" link with instructions for common authenticator apps
- MFA status badge (Enabled/Disabled) visible on user profile

## Out of Scope
- SMS-based MFA (TOTP only per spec)
- MFA recovery codes / backup methods
- Mandatory MFA enforcement (optional in dev/staging, enforced in prod via Terraform tfvars)

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for Cognito MFA configuration and NIST IA-2 compliance details.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
