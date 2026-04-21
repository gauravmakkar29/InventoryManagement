/** Barrel for the two-phase confirmation primitive (Story 28.6). */

export type {
  ActionInitiation,
  ConfirmationState,
  ProofValidator,
  ValidationResult,
  ValidatorRegistry,
} from "./confirmation-primitive";
export { createValidatorRegistry } from "./confirmation-primitive";
export type { IConfirmationEngine } from "./confirmation-engine.interface";
export { createMockConfirmationEngine } from "./mock-confirmation-engine";
export type { MockConfirmationEngineOptions } from "./mock-confirmation-engine";
export {
  ActionConfirmationMismatchError,
  ActionInitiationNotFoundError,
  InvalidConfirmationTransitionError,
  SelfConfirmationError,
  UnknownValidatorError,
} from "./confirmation-errors";
