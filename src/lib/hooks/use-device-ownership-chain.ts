// =============================================================================
// useDeviceOwnershipChain — Story 27.3 (#419)
//
// Derives the chain of custody for a single device by querying CDC history,
// enriching customer IDs with display names from MOCK_CUSTOMERS, and
// running the pure `deriveOwnershipChainFromAuditLog` mapper.
// =============================================================================

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { DeviceOwnershipRecord } from "../types";
import { useCDCProvider } from "../providers/registry";
import { MOCK_CUSTOMERS } from "../mock-data/customer-site-data";
import { deriveOwnershipChainFromAuditLog } from "../mappers/device-ownership.mapper";
import type { Role } from "../rbac";

export interface UseDeviceOwnershipChainOptions {
  /** Current customer id — anchors the open-ended record. */
  currentCustomerId: string;
  /** Device creation timestamp; falls back to 180 days ago when absent. */
  deviceCreatedAt?: string;
  /**
   * Story 27.3 AC9 — when the caller is a CustomerAdmin, the chain is
   * filtered to records where THEIR customer was the assignee. Leaves
   * other roles unfiltered.
   */
  role?: Role;
  /** The CustomerAdmin's scoped customer id. Only consulted when role is
   *  CustomerAdmin. */
  scopedCustomerId?: string;
}

export interface DeviceOwnershipResult {
  records: DeviceOwnershipRecord[];
  isLoading: boolean;
  isError: boolean;
}

const DEFAULT_CREATED_FALLBACK_DAYS = 180;

function buildCustomerLookup(): (customerId: string) => string | undefined {
  const map = new Map(MOCK_CUSTOMERS.map((c) => [c.id, c.name]));
  return (id: string) => map.get(id);
}

/**
 * Hook — returns the full ownership chain for a device.
 *
 * @example
 * ```tsx
 * const { records, isLoading } = useDeviceOwnershipChain("dev-001", {
 *   currentCustomerId: "cust-001",
 *   role: "CustomerAdmin",
 *   scopedCustomerId: "cust-001",
 * });
 * ```
 */
export function useDeviceOwnershipChain(
  deviceId: string | undefined,
  options: UseDeviceOwnershipChainOptions,
): DeviceOwnershipResult {
  const { currentCustomerId, deviceCreatedAt, role, scopedCustomerId } = options;
  const cdc = useCDCProvider();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["device-ownership-chain", deviceId ?? ""] as const,
    queryFn: async () => {
      if (!cdc || !deviceId) return [];
      return cdc.getChangeHistory(deviceId);
    },
    enabled: !!deviceId,
  });

  const effectiveCreatedAt = useMemo(
    () =>
      deviceCreatedAt ??
      new Date(Date.now() - DEFAULT_CREATED_FALLBACK_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    [deviceCreatedAt],
  );

  const lookupCustomerName = useMemo(() => buildCustomerLookup(), []);
  const currentCustomerName = useMemo(
    () => lookupCustomerName(currentCustomerId) ?? currentCustomerId,
    [lookupCustomerName, currentCustomerId],
  );

  const records = useMemo(() => {
    if (!deviceId) return [];
    const events = data ?? [];
    const chain = deriveOwnershipChainFromAuditLog({
      events,
      deviceCreatedAt: effectiveCreatedAt,
      currentCustomerId,
      currentCustomerName,
      lookupCustomerName,
    });
    if (role === "CustomerAdmin" && scopedCustomerId) {
      return chain.filter((r) => r.customerId === scopedCustomerId);
    }
    return chain;
  }, [
    deviceId,
    data,
    effectiveCreatedAt,
    currentCustomerId,
    currentCustomerName,
    lookupCustomerName,
    role,
    scopedCustomerId,
  ]);

  return { records, isLoading, isError };
}
