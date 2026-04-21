/** Engine interface for two-phase confirmation (Story 28.6). */

import type { ComplianceActor } from "../types";
import type { ActionInitiation, ValidatorRegistry } from "./confirmation-primitive";

export interface IConfirmationEngine {
  readonly validators: ValidatorRegistry;
  initiate<TPayload>(
    kind: string,
    payload: TPayload,
    actor: ComplianceActor,
  ): Promise<ActionInitiation<TPayload>>;
  complete<TProof>(
    initiationId: string,
    proof: TProof,
    actor: ComplianceActor,
  ): Promise<ActionInitiation>;
  abandon(initiationId: string, reason: string, actor: ComplianceActor): Promise<ActionInitiation>;
  loadById(initiationId: string): Promise<ActionInitiation | null>;
  loadByKind(
    kind: string,
    filter: {
      readonly state?: ActionInitiation["state"];
      readonly limit?: number;
    },
  ): Promise<readonly ActionInitiation[]>;
  /** Transition stale initiations to "abandoned" with reason auto=true. */
  abandonStale(kind: string): Promise<readonly ActionInitiation[]>;
}
