/** Typed errors for the secure-distribution primitive (Story 28.5). */

import { ComplianceError } from "../types";

export class SecureLinkExpiredError extends ComplianceError {
  public readonly kind = "compliance.distribution.expired";
  public constructor(jti: string) {
    super(`Secure link ${jti} has expired.`);
  }
}

export class SecureLinkConsumedError extends ComplianceError {
  public readonly kind = "compliance.distribution.consumed";
  public constructor(jti: string) {
    super(`Secure link ${jti} has already been used and cannot be redeemed again.`);
  }
}

export class MfaStepUpRequiredError extends ComplianceError {
  public readonly kind = "compliance.distribution.mfa-required";
  public constructor() {
    super(
      "Additional verification required — step up multi-factor authentication before redeeming this link (NIST IA-2).",
    );
  }
}

export class TokenMismatchError extends ComplianceError {
  public readonly kind = "compliance.distribution.token-mismatch";
  public constructor(message = "Token does not match the expected recipient or signature.") {
    super(message);
  }
}

export class DistributionAdapterConfigError extends ComplianceError {
  public readonly kind = "compliance.distribution.adapter-config";
  public constructor(message: string) {
    super(`Secure distribution adapter misconfigured: ${message}`);
  }
}
