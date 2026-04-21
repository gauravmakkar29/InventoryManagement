/**
 * Secure distribution primitive (Story 28.5).
 *
 * Mints single-use, MFA-gated, recipient-bound, short-lived download links
 * for immutable evidence records. Every mint + redemption + denial writes an
 * AUDIT# record (NIST AU-2/AU-3).
 */

import type { ComplianceActor } from "../types";

export interface SecureLinkRequest {
  readonly evidenceId: string;
  readonly recipientUserId: string;
  readonly expiresInSeconds: number;
  readonly requireStepUpMfa: boolean;
  /** Free-form audit context written with the mint record. */
  readonly purpose?: string;
}

export interface SecureLink {
  readonly token: string;
  readonly url: string;
  readonly expiresAt: string;
  readonly jti: string;
  /** Marker that proves at type level the link is single-use. */
  readonly singleUse: true;
}

export interface SecureLinkRedemption {
  readonly jti: string;
  readonly storageUrl: string;
  readonly redeemedAt: string;
  readonly recipientUserId: string;
  readonly evidenceId: string;
}

export interface RedeemContext {
  readonly actor: ComplianceActor;
  /**
   * Timestamp of the actor's most recent step-up MFA verification. The
   * adapter rejects redemption when step-up MFA is required and the
   * timestamp is too old or missing.
   */
  readonly lastStepUpMfaAt?: string;
}

export interface SecureLinkListItem {
  readonly jti: string;
  readonly evidenceId: string;
  readonly recipientUserId: string;
  readonly expiresAt: string;
  readonly consumed: boolean;
  readonly mintedAt: string;
}

export interface ISecureDistribution {
  /** Mint a new single-use link. Requires `distribution:approve`. */
  mintLink(request: SecureLinkRequest, minter: ComplianceActor): Promise<SecureLink>;
  /** Redeem a token. Returns a short-lived storage URL on success. */
  redeem(token: string, context: RedeemContext): Promise<SecureLinkRedemption>;
  /** List links visible to the given recipient that are still active. */
  listMyActive(userId: string): Promise<readonly SecureLinkListItem[]>;
  /** Get one link's state. */
  getByJti(jti: string): Promise<SecureLinkListItem | null>;
}
