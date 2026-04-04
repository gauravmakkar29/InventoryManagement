import {
  lazy,
  Suspense,
  createContext,
  useContext,
  useMemo,
  type ReactNode,
  type ComponentType,
} from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../query-client";

const ReactQueryDevtools = lazy(() =>
  import("@tanstack/react-query-devtools").then((m) => ({ default: m.ReactQueryDevtools })),
);
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
  const registryValue = useMemo(() => ({ api, storage }), [api, storage]);

  return (
    <QueryClientProvider client={queryClient}>
      <ProviderRegistryContext.Provider value={registryValue}>
        <AuthProvider>{children}</AuthProvider>
      </ProviderRegistryContext.Provider>
      {import.meta.env.VITE_SHOW_DEVTOOLS === "true" && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        </Suspense>
      )}
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

/**
 * Access the API provider for data operations.
 *
 * Use this hook in components that need direct access to the platform's
 * API adapter (e.g., for custom queries not covered by hlm-api.ts).
 *
 * @example
 * ```tsx
 * function DeviceDetail({ id }: { id: string }) {
 *   const api = useApiProvider();
 *   const { data } = useQuery({
 *     queryKey: ["device", id],
 *     queryFn: () => api.query("GetDevice", { id }),
 *   });
 *   return <div>{data?.name}</div>;
 * }
 * ```
 */
export function useApiProvider(): IApiProvider {
  return useProviders().api;
}

/**
 * Access the storage provider for key-value persistence.
 *
 * Use this hook in components that need to read/write user preferences,
 * cached state, or other key-value data through the platform storage layer.
 *
 * @example
 * ```tsx
 * function ThemeToggle() {
 *   const storage = useStorageProvider();
 *   const toggle = async () => {
 *     const current = await storage.getItem("theme");
 *     await storage.setItem("theme", current === "dark" ? "light" : "dark");
 *   };
 *   return <button onClick={toggle}>Toggle theme</button>;
 * }
 * ```
 */
export function useStorageProvider(): IStorageProvider {
  return useProviders().storage;
}
