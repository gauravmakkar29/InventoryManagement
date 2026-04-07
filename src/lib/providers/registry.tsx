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
import type {
  IApiProvider,
  IStorageProvider,
  IArtifactProvider,
  ICRMProvider,
  IComplianceScannerProvider,
  ICDCProvider,
  IDNSProvider,
} from "./types";

// =============================================================================
// Module-level singleton — non-React access to the API provider
// =============================================================================

let _apiProvider: IApiProvider | null = null;

/**
 * Set the active API provider instance. Called by ProviderRegistry during
 * render so the singleton is available before any queryFn fires.
 */
export function setApiProvider(provider: IApiProvider): void {
  _apiProvider = provider;
}

/**
 * Get the active API provider for non-hook contexts (e.g. hlm-api.ts facade).
 * Throws if called before ProviderRegistry has mounted.
 */
export function getApiProvider(): IApiProvider {
  if (!_apiProvider) {
    throw new Error(
      "API provider not initialized. Ensure ProviderRegistry has mounted before calling API functions.",
    );
  }
  return _apiProvider;
}

// =============================================================================
// Context
// =============================================================================

interface ProviderRegistryValue {
  api: IApiProvider;
  storage: IStorageProvider;
  artifact: IArtifactProvider | null;
  crm: ICRMProvider | null;
  complianceScanner: IComplianceScannerProvider | null;
  cdc: ICDCProvider | null;
  dns: IDNSProvider | null;
}

const ProviderRegistryContext = createContext<ProviderRegistryValue | null>(null);

// =============================================================================
// Provider Component
// =============================================================================

interface ProviderRegistryProps {
  api: IApiProvider;
  storage: IStorageProvider;
  AuthProvider: ComponentType<{ children: ReactNode }>;
  artifact?: IArtifactProvider | null;
  crm?: ICRMProvider | null;
  complianceScanner?: IComplianceScannerProvider | null;
  cdc?: ICDCProvider | null;
  dns?: IDNSProvider | null;
  children: ReactNode;
}

/**
 * ProviderRegistry — wraps the app with all platform providers.
 * AuthProvider is rendered as a component (it manages React state internally).
 * API and Storage are plain object instances provided via context.
 */
export function ProviderRegistry({
  api,
  storage,
  AuthProvider,
  artifact = null,
  crm = null,
  complianceScanner = null,
  cdc = null,
  dns = null,
  children,
}: ProviderRegistryProps) {
  // Sync the module-level singleton so hlm-api.ts facade can delegate
  // to the active provider without needing React context.
  setApiProvider(api);

  const registryValue = useMemo(
    () => ({ api, storage, artifact, crm, complianceScanner, cdc, dns }),
    [api, storage, artifact, crm, complianceScanner, cdc, dns],
  );

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

/**
 * Access the artifact provider for binary artifact operations.
 *
 * Returns null if no artifact provider is configured for the current platform.
 *
 * @example
 * ```tsx
 * function FirmwareUpload() {
 *   const artifact = useArtifactProvider();
 *   if (!artifact) return <p>Artifact provider not configured</p>;
 *   const upload = () => artifact.uploadArtifact(input, file);
 * }
 * ```
 */
export function useArtifactProvider(): IArtifactProvider | null {
  return useProviders().artifact;
}

/**
 * Access the CRM provider for customer and ticket operations.
 *
 * Returns null if no CRM provider is configured for the current platform.
 *
 * @example
 * ```tsx
 * function TicketList() {
 *   const crm = useCRMProvider();
 *   if (!crm) return <p>CRM not configured</p>;
 *   const { data } = useQuery({ queryKey: queryKeys.crm.tickets(), queryFn: () => crm.listTickets() });
 * }
 * ```
 */
export function useCRMProvider(): ICRMProvider | null {
  return useProviders().crm;
}

/**
 * Access the compliance scanner provider for vulnerability scanning.
 *
 * Returns null if no scanner is configured for the current platform.
 *
 * @example
 * ```tsx
 * function ScanStatus({ scanId }: { scanId: string }) {
 *   const scanner = useComplianceScannerProvider();
 *   if (!scanner) return null;
 *   const { data } = useQuery({ queryKey: queryKeys.scans.status(scanId), queryFn: () => scanner.getScanStatus(scanId) });
 * }
 * ```
 */
export function useComplianceScannerProvider(): IComplianceScannerProvider | null {
  return useProviders().complianceScanner;
}

/**
 * Access the CDC provider for change data capture and audit events.
 *
 * Returns null if no CDC provider is configured for the current platform.
 *
 * @example
 * ```tsx
 * function AuditFeed({ entityType }: { entityType: string }) {
 *   const cdc = useCDCProvider();
 *   if (!cdc) return null;
 *   const { data } = useQuery({ queryKey: queryKeys.cdc.recent(entityType), queryFn: () => cdc.listRecentChanges(entityType) });
 * }
 * ```
 */
export function useCDCProvider(): ICDCProvider | null {
  return useProviders().cdc;
}

/**
 * Access the DNS provider for domain record management.
 *
 * Returns null if no DNS provider is configured for the current platform.
 *
 * @example
 * ```tsx
 * function DNSRecords() {
 *   const dns = useDNSProvider();
 *   if (!dns) return null;
 *   const { data } = useQuery({ queryKey: queryKeys.dns.records(), queryFn: () => dns.listRecords() });
 * }
 * ```
 */
export function useDNSProvider(): IDNSProvider | null {
  return useProviders().dns;
}
