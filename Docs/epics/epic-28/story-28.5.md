# Story 28.5: Scoped One-Time Secure Distribution

**Epic:** Epic 28 — Enterprise Compliance Workflow Patterns
**Phase:** PHASE 2: DELIVERY
**Persona:** Distribution Recipient (reference persona: Service Technician) / Template Consumer (audience)
**Priority:** P1
**Story Points:** 5
**Status:** New

## User Story

As a recipient of a regulated digital asset, I want to receive a scoped, one-time-use, MFA-gated download link that expires after a short window and after first use, and is tied to my identity — so that sensitive content is not leaked through stale URLs, bookmarks, or shared links, and every delivery is individually audited.

## Preconditions

- Story 28.1 shipped — evidence store exists with `getSignedReadUrl`
- Step-up MFA primitive available via auth adapter (Story 19.5 / 19.6 provide the session primitives this story builds on)
- Global notification pipeline (Story 22.3) available
- `canPerform("distribution.request", resource)` and `canPerform("distribution.approve", resource)` defined in RBAC

## Context / Business Rules

- **Each link is bound to a specific recipient** (`recipientUserId`) — tokens verify the redeeming session matches the recipient.
- **Each link is single-use.** Redemption atomically marks the link consumed; second redemption returns `SecureLinkConsumedError`.
- **Each link has a short expiry** (default 15 minutes; adapter config). Expired redemption returns `SecureLinkExpiredError`.
- **Step-up MFA is required** for redemption when `requireStepUpMfa === true` — the user is prompted for fresh MFA even if their session is already authenticated. Last-step-up timestamp is enforced at ≤ 5 minutes for redemption.
- **Link minting is an authorized action.** Callers must pass RBAC `distribution.approve` (ownership approves the distribution) AND have the recipient's `distribution.request` on the resource.
- **Minting and redemption both audit.** Minting writes `action: "distribution.minted"`; redemption writes `action: "distribution.redeemed"`; failed redemptions write denial records with the failure kind.
- **Tokens opaque and signed.** Adapters generate tokens that encode `{evidenceId, recipientUserId, expiresAt, jti}`; server validates signature + jti uniqueness in a consumed-jti store (DynamoDB TTL-backed).
- **Domain-free.** `SecureLinkRequest` references `evidenceId`, not firmware versions or device serials.

## Acceptance Criteria

- [ ] AC1: `ISecureDistribution` interface is defined with: `mintLink(request)`, `redeem(token, session)`, `listMyActive(userId)`. Redeem returns a short-lived (< 60s) signed storage URL for the underlying evidence.
- [ ] AC2: `SecureLinkRequest`, `SecureLink`, `SecureLinkRedemption` types defined in `src/lib/compliance/distribution/secure-distribution.interface.ts`.
- [ ] AC3: `createMockSecureDistribution()` + `createS3SignedUrlDistribution(config)` factories both exist and pass parity tests.
- [ ] AC4: `mintLink` enforces RBAC: caller has `distribution.approve` AND recipient has `distribution.request` on the evidence's owning resource. Failures throw `AccessDeniedError` + write audit denial.
- [ ] AC5: `redeem` enforces: token signature valid, `expiresAt > now`, `jti` not already consumed, session's `userId === recipientUserId`, step-up MFA freshness ≤ 5 minutes when required. Each failure throws a typed error (`SecureLinkExpiredError`, `SecureLinkConsumedError`, `MfaStepUpRequiredError`, `TokenMismatchError`) and writes audit denial.
- [ ] AC6: Successful `redeem` atomically writes `jti` to the consumed-jti store before returning the short-lived storage URL — race-safe against concurrent redemption attempts.
- [ ] AC7: Adapter config exposes: `defaultExpiryMs` (default 900_000 = 15 min), `maxExpiryMs` (default 86_400_000 = 24h), `mfaFreshnessMs` (default 300_000 = 5 min), `storageUrlTtlMs` (default 30_000 = 30s).
- [ ] AC8: `useSecureDistribution()` hook returns `{ mintLink, redeem, listMyActive }`; uses TanStack Query `useMutation` for mint/redeem and `useQuery` for the active-list.
- [ ] AC9: `<SecureDownloadButton evidenceId requireStepUpMfa>` component — visible to users with `distribution.request`; clicking requests a fresh link via `mintLink` (if not already minted for this user+evidence), prompts for MFA step-up if needed, redeems the link, and triggers the browser download. All within a single click flow.
- [ ] AC10: `<DistributionHistoryPanel subjectId>` component — lists past distribution events (mint + redeem + denials) with recipient, actor, timestamp, outcome. Available to reviewers.
- [ ] AC11: Every mint, every redemption (success + denial) writes an AUDIT# record with the full event context (tokenJti, evidenceId, actor, recipient, outcome, timestamp).
- [ ] AC12: Reference wiring: firmware download flow for service technicians is refactored to use `<SecureDownloadButton>` + `useSecureDistribution`; legacy download path gated behind `FEATURE_COMPLIANCE_LIB=off`.
- [ ] AC13: Adapter parity tests cover: successful mint → redeem round-trip, double-redeem rejection, expired redemption, wrong-user redemption, MFA-required without step-up, race condition (two concurrent redemptions — only one succeeds).
- [ ] AC14: Unit tests ≥ 85% coverage with error paths exercised.

## UI Behavior

- Button label: "Download" with a lock icon; subtitle: "One-time secure link · expires in 15 min"
- On click: brief spinner while link mints; MFA step-up modal if required; then browser download triggers automatically
- MFA step-up modal reuses existing auth primitives (Story 19.6); on success, download proceeds; on cancel, flow aborts with a toast
- If link already minted + unconsumed for this recipient + evidence, re-clicking uses the existing link (no duplicate mint)
- Failure states: specific toast per error — "Link expired — try again", "Link already used", "Additional verification required"
- Distribution history panel: table with outcome color — success (green), expired (amber), denied (red), in-flight (blue)

## Out of Scope

- QR-code / deep-link sharing UX (single-session in-browser only)
- Email-delivered links (adapter could support; not in this story's UI)
- Watermarking or DRM of downloaded content
- Per-download analytics dashboard (aggregate; future story)
- Revocation UI for unconsumed links (a separate story — admin revoke list)

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) §"File Layout → distribution/", §"Generic Types → Story 28.5", §"Error Taxonomy".

## Rulebook Compliance

- **`security-nist-rulebook.md`** — AC-3 (mint + redeem gated), AU-2/3 (success + denial audited with JTI), IA-2 (step-up MFA), SC-8 (TLS in transit for signed URLs), SC-12 (KMS-encrypted evidence bucket), SI-10 (token validation at every boundary)
- **`architecture-rulebook.md`** — adapter pattern, consumed-jti store as adapter concern
- **`api-data-layer-rulebook.md`** — typed errors, retry-safe mutations; no optimistic updates for redemption (must be server-authoritative)
- **`code-quality-rulebook.md`** — no `any`, ≥ 85% coverage, race-safe tests included

## Dev Checklist (NOT for QA)

1. Define interface + types + errors in `secure-distribution.interface.ts`
2. Implement `createMockSecureDistribution()` with in-memory jti store + Map + time-mocked expiry
3. Implement `createS3SignedUrlDistribution()` — token minter with signed JWT, DynamoDB consumed-jti store with TTL, calls `IEvidenceStore.getSignedReadUrl` on successful redeem
4. RBAC check in mint; full validation chain in redeem
5. Audit-log every branch (mint, redeem success, each denial kind)
6. Build `useSecureDistribution` hook + `<SecureDownloadButton>` + `<DistributionHistoryPanel>`
7. Storybook stories: idle, minting, MFA prompt, error toasts, history with mixed outcomes
8. Wire firmware download flow behind `FEATURE_COMPLIANCE_LIB`
9. Parity tests + race condition test (Promise.all of two redemptions; assert exactly one resolves)
10. ESLint no-restricted-imports rule

## AutoGent Test Prompts

1. **AC5 — Single use:** "Mint a link for user alice. Redeem as alice — verify success + download URL returned. Redeem the same token again — verify `SecureLinkConsumedError`."
2. **AC5 — Wrong user:** "Mint for alice. Attempt redeem as bob. Verify `TokenMismatchError` and denial audit record."
3. **AC5 — Expired:** "Mint with expiresInSeconds=1. Wait 2 seconds. Redeem. Verify `SecureLinkExpiredError`."
4. **AC5 — MFA required:** "Mint with requireStepUpMfa=true. Session's last step-up was 10 minutes ago. Redeem. Verify `MfaStepUpRequiredError`."
5. **AC6 — Race safety:** "Mint one link. `Promise.all` two simultaneous redeems. Verify exactly one resolves and one rejects with `SecureLinkConsumedError`."
6. **AC9 — Button flow:** "Click `<SecureDownloadButton>` in Storybook. Verify spinner appears, MFA modal shows (for step-up variant), then download triggers."
7. **AC11 — Audit:** "After mint + successful redeem + one expired attempt, verify 3 AUDIT# records exist: mint, redeemed, redeem-denied-expired."

## Definition of Done

- [ ] Code reviewed + approved
- [ ] Unit tests ≥ 85% coverage; race-condition test green
- [ ] Adapter parity tests green for mock + localstack
- [ ] Storybook stories published
- [ ] Reference firmware download migrated behind flag
- [ ] NIST audit integration test covers mint + redeem success + all denial kinds
- [ ] Step-up MFA flow tested end-to-end manually
- [ ] TypeScript strict, no `any`
- [ ] Security review: tokens are unguessable (≥ 128 bits entropy), signed, jti-tracked, expiring
- [ ] ESLint no-restricted-imports rule in place
