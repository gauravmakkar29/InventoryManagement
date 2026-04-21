/**
 * Shared Storybook harness for compliance components.
 *
 * Sets up a per-story QueryClient and the full set of mock compliance
 * adapters + providers so individual stories can render any primitive
 * without bespoke wiring. Story authors pass `seed` callbacks to populate
 * the in-memory stores before rendering.
 *
 * This file is scoped to Storybook; the production app wires its own
 * provider tree via `EvidenceStoreProvider` / `ChecklistProvider` /
 * `ApprovalProvider` / `SecureDistributionProvider` etc.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  ChecklistProvider,
  createMockChecklistStore,
  type ChecklistSchema,
  type IChecklistStore,
} from "@/lib/compliance/checklist";
import {
  createMockEvidenceStore,
  EvidenceStoreProvider,
  type IEvidenceStore,
} from "@/lib/compliance/evidence";
import {
  ApprovalProvider,
  createMockApprovalEngine,
  type IApprovalEngine,
} from "@/lib/compliance/approval";
import {
  createMockSecureDistribution,
  SecureDistributionProvider,
  type ISecureDistribution,
} from "@/lib/compliance/distribution";
import {
  createMockConfirmationEngine,
  type IConfirmationEngine,
} from "@/lib/compliance/confirmation";
import { createMockDependencyGraph, type IDependencyGraph } from "@/lib/compliance/impact";
import type { ComplianceActor } from "@/lib/compliance/types";
import type { Role } from "@/lib/rbac";

export interface ComplianceHarnessStores {
  readonly evidenceStore: IEvidenceStore;
  readonly checklistStore: IChecklistStore;
  readonly approvalEngine: IApprovalEngine;
  readonly distribution: ISecureDistribution;
  readonly confirmationEngine: IConfirmationEngine;
  readonly dependencyGraph: IDependencyGraph;
}

export interface ComplianceHarnessProps {
  readonly actor?: ComplianceActor;
  readonly role?: Role;
  readonly schemas?: readonly ChecklistSchema[];
  readonly now?: () => Date;
  readonly seed?: (stores: ComplianceHarnessStores) => Promise<void> | void;
  readonly children: (stores: ComplianceHarnessStores) => ReactNode;
}

const DEFAULT_ACTOR: ComplianceActor = { userId: "demo-user", displayName: "Demo User" };

export function ComplianceHarness({
  actor = DEFAULT_ACTOR,
  role = "Admin",
  schemas,
  now,
  seed,
  children,
}: ComplianceHarnessProps) {
  const [qc] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }));

  const stores = useMemo<ComplianceHarnessStores>(() => {
    const resolveRole = () => role;
    return {
      evidenceStore: createMockEvidenceStore({ resolveRole, now }),
      checklistStore: createMockChecklistStore({
        resolveRole,
        now,
        seedSchemas: schemas,
      }),
      approvalEngine: createMockApprovalEngine({ resolveRole, now }),
      distribution: createMockSecureDistribution({ resolveRole, now }),
      confirmationEngine: createMockConfirmationEngine({ resolveRole, now }),
      dependencyGraph: createMockDependencyGraph({ resolveRole, now }),
    };
  }, [role, now, schemas]);

  const [ready, setReady] = useState(() => (seed ? false : true));

  useEffect(() => {
    if (!seed) return;
    let cancelled = false;
    void Promise.resolve(seed(stores)).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [seed, stores]);

  return (
    <QueryClientProvider client={qc}>
      <EvidenceStoreProvider store={stores.evidenceStore} actor={actor}>
        <ChecklistProvider store={stores.checklistStore} actor={actor}>
          <ApprovalProvider engine={stores.approvalEngine} actor={actor}>
            <SecureDistributionProvider driver={stores.distribution} actor={actor}>
              <div className="p-4 max-w-3xl">
                {ready ? children(stores) : <p className="text-xs">Seeding demo data…</p>}
              </div>
            </SecureDistributionProvider>
          </ApprovalProvider>
        </ChecklistProvider>
      </EvidenceStoreProvider>
    </QueryClientProvider>
  );
}

export const DEMO_ACTOR = DEFAULT_ACTOR;
export const OTHER_ACTOR: ComplianceActor = { userId: "bob", displayName: "Bob Reviewer" };
