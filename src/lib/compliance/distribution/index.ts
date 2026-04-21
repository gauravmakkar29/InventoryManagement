/** Barrel for the secure-distribution primitive (Story 28.5). */

export type {
  ISecureDistribution,
  RedeemContext,
  SecureLink,
  SecureLinkListItem,
  SecureLinkRedemption,
  SecureLinkRequest,
} from "./secure-distribution.interface";
export { createMockSecureDistribution } from "./mock-secure-distribution";
export type { MockSecureDistributionOptions } from "./mock-secure-distribution";
export {
  DistributionAdapterConfigError,
  MfaStepUpRequiredError,
  SecureLinkConsumedError,
  SecureLinkExpiredError,
  TokenMismatchError,
} from "./distribution-errors";
export { SecureDistributionProvider, useSecureDistribution } from "./use-secure-distribution";
export type { SecureDistributionProviderProps } from "./use-secure-distribution";
