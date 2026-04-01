import { createContext, useContext, type ReactNode, type ComponentType } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "../query-client";
import type { IApiProvider, IStorageProvider } from "./types";

// =============================================================================
// Context
// =============================================================================

interface ProviderRegistryValue {
  api: IApiProvider;
  storage: IStorageProvider;
}

const ProviderRegistryContext = createContext<ProviderRegistryValue | null>(null);

// =============================================================================
// Provider Component
// =============================================================================

interface ProviderRegistryProps {
  api: IApiProvider;
  storage: IStorageProvider;
  AuthProvider: ComponentType<{ children: ReactNode }>;
  children: ReactNode;
}

/**
 * ProviderRegistry — wraps the app with all platform providers.
 * AuthProvider is rendered as a component (it manages React state internally).
 * API and Storage are plain object instances provided via context.
 */
export function ProviderRegistry({ api, storage, AuthProvider, children }: ProviderRegistryProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ProviderRegistryContext.Provider value={{ api, storage }}>
        <AuthProvider>{children}</AuthProvider>
      </ProviderRegistryContext.Provider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

// =============================================================================
// Consumer Hooks
// =============================================================================

function useProviders(): ProviderRegistryValue {
  const ctx = useContext(ProviderRegistryContext);
  if (!ctx) {
    throw new Error("useProviders must be used within a <ProviderRegistry>");
  }
  return ctx;
}

/** Access the API provider for data operations */
export function useApiProvider(): IApiProvider {
  return useProviders().api;
}

/** Access the storage provider for key-value persistence */
export function useStorageProvider(): IStorageProvider {
  return useProviders().storage;
}
