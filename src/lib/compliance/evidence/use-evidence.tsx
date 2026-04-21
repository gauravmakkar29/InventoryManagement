/**
 * React hooks for the evidence store primitive (Story 28.1).
 *
 * - `useEvidence(id)` — reads metadata. `staleTime: Infinity` because
 *   immutable records never become stale.
 * - `useEvidenceSignedUrl(id, expiresInSeconds)` — mints a short-lived
 *   signed read URL; refreshes before expiry with a 30-second safety margin.
 * - `useUploadEvidence()` — mutation for `put()` with TanStack Query.
 * - `EvidenceStoreProvider` — React context that supplies the active
 *   `IEvidenceStore` + current `ComplianceActor` to the hooks.
 */

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../query-keys";
import type { ComplianceActor } from "../types";
import type {
  EvidenceMetadata,
  EvidencePutInput,
  IEvidenceStore,
} from "./evidence-store.interface";

interface EvidenceContextValue {
  readonly store: IEvidenceStore;
  readonly actor: ComplianceActor;
}

const EvidenceContext = createContext<EvidenceContextValue | null>(null);

export interface EvidenceStoreProviderProps {
  readonly store: IEvidenceStore;
  readonly actor: ComplianceActor;
  readonly children: ReactNode;
}

export function EvidenceStoreProvider({
  store,
  actor,
  children,
}: EvidenceStoreProviderProps): JSX.Element {
  const value = useMemo<EvidenceContextValue>(() => ({ store, actor }), [store, actor]);
  return <EvidenceContext.Provider value={value}>{children}</EvidenceContext.Provider>;
}

function useEvidenceCtx(): EvidenceContextValue {
  const ctx = useContext(EvidenceContext);
  if (!ctx) {
    throw new Error("useEvidence* hooks require <EvidenceStoreProvider> higher in the tree.");
  }
  return ctx;
}

export function useEvidence(id: string | undefined) {
  const { store, actor } = useEvidenceCtx();
  return useQuery({
    queryKey: id
      ? queryKeys.compliance.evidence.detail(id)
      : ["compliance", "evidence", "detail", "?"],
    queryFn: () => store.get(id!, { actor }),
    enabled: Boolean(id),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
}

export interface UseEvidenceSignedUrlResult {
  readonly url: string | undefined;
  readonly expiresAt: Date | undefined;
  readonly isLoading: boolean;
  readonly error: Error | undefined;
  readonly refresh: () => void;
}

const SIGNED_URL_REFRESH_SAFETY_MS = 30_000;

export function useEvidenceSignedUrl(
  id: string | undefined,
  expiresInSeconds = 300,
): UseEvidenceSignedUrlResult {
  const { store, actor } = useEvidenceCtx();
  const [tick, setTick] = useState(0);

  const query = useQuery({
    queryKey: id
      ? [...queryKeys.compliance.evidence.signedUrl(id, expiresInSeconds), tick]
      : ["compliance", "evidence", "signedUrl", "?", 0],
    queryFn: async () => {
      const url = await store.getSignedReadUrl(id!, expiresInSeconds, { actor });
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
      return { url, expiresAt };
    },
    enabled: Boolean(id),
    staleTime: Math.max(0, expiresInSeconds * 1000 - SIGNED_URL_REFRESH_SAFETY_MS),
  });

  useEffect(() => {
    if (!query.data?.expiresAt) return;
    const delay = Math.max(
      1_000,
      query.data.expiresAt.getTime() - Date.now() - SIGNED_URL_REFRESH_SAFETY_MS,
    );
    const timer = setTimeout(() => setTick((n) => n + 1), delay);
    return () => clearTimeout(timer);
  }, [query.data?.expiresAt]);

  return {
    url: query.data?.url,
    expiresAt: query.data?.expiresAt,
    isLoading: query.isLoading,
    error: (query.error as Error | undefined) ?? undefined,
    refresh: () => setTick((n) => n + 1),
  };
}

export function useUploadEvidence() {
  const { store, actor } = useEvidenceCtx();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<EvidencePutInput, "actor">) =>
      store.put({ ...input, actor }) as Promise<EvidenceMetadata>,
    onSuccess: (meta) => {
      qc.setQueryData(queryKeys.compliance.evidence.detail(meta.id), meta);
      qc.invalidateQueries({ queryKey: queryKeys.compliance.evidence.all });
    },
  });
}
