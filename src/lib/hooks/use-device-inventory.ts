import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DeviceStatus } from "../types";
import type { DeviceSearchFilters } from "../opensearch-types";
import type { MockDevice } from "../mock-data/inventory-data";
import { MOCK_DEVICES } from "../mock-data/inventory-data";
import type { CreateDevicePayload } from "../types/device";
import { useLocalPagination } from "./use-paginated-query";
import { queryKeys } from "../query-keys";
import { mockQueryFn } from "./use-mock-query";

type SortField = "name" | "serial" | "model" | "status" | "location" | "health";
type SortDir = "asc" | "desc";
const PAGE_SIZE = 6;

export type { SortField, SortDir };

const deviceQueryKey = queryKeys.devices.list();

export function useDeviceInventory() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter] = useState<string>("all");
  const [locationFilter] = useState<string>("all");
  const [advancedFilters, setAdvancedFilters] = useState<DeviceSearchFilters>({});
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const {
    data: devices = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: deviceQueryKey,
    queryFn: mockQueryFn(MOCK_DEVICES),
    initialData: MOCK_DEVICES,
  });

  const handleStatusChange = useCallback(
    (deviceId: string, newStatus: DeviceStatus) => {
      try {
        const device = devices.find((d) => d.id === deviceId);
        queryClient.setQueryData<MockDevice[]>(deviceQueryKey, (old) =>
          (old ?? []).map((d) =>
            d.id === deviceId
              ? {
                  ...d,
                  status: newStatus,
                  health: newStatus === DeviceStatus.Offline ? 0 : d.health,
                }
              : d,
          ),
        );
        if (device) {
          toast.success(`Device ${device.name} status updated to ${newStatus}`);
        }
      } catch (err) {
        toast.error(
          `Failed to update device status: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      }
    },
    [devices, queryClient],
  );

  const handleCreateDevice = useCallback(
    (payload: CreateDevicePayload) => {
      try {
        const newDevice: MockDevice = {
          id: `d${Date.now()}`,
          name: payload.name,
          serial: payload.serial,
          model: payload.model,
          status: payload.status,
          location: payload.location,
          health: payload.status === DeviceStatus.Online ? 100 : 0,
          firmware: payload.firmware,
          lastSeen: "just now",
          lat: payload.lat,
          lng: payload.lng,
        };
        queryClient.setQueryData<MockDevice[]>(deviceQueryKey, (old) => [
          newDevice,
          ...(old ?? []),
        ]);
        toast.success(`Device ${payload.name} created`);
      } catch (err) {
        toast.error(
          `Failed to create device: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      }
    },
    [queryClient],
  );

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("asc");
      }
    },
    [sortField],
  );

  const filteredDevices = useMemo(() => {
    let result = [...devices];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.serial.toLowerCase().includes(q) ||
          d.location.toLowerCase().includes(q) ||
          d.model.toLowerCase().includes(q),
      );
    }

    const activeStatus =
      advancedFilters.status ?? (statusFilter !== "all" ? statusFilter : undefined);
    if (activeStatus) {
      result = result.filter((d) => d.status === activeStatus);
    }

    const activeLocation =
      advancedFilters.location ?? (locationFilter !== "all" ? locationFilter : undefined);
    if (activeLocation) {
      result = result.filter((d) => d.location === activeLocation);
    }

    if (advancedFilters.model) {
      result = result.filter((d) => d.model === advancedFilters.model);
    }

    if (advancedFilters.healthScoreMin != null) {
      result = result.filter((d) => d.health >= advancedFilters.healthScoreMin!);
    }
    if (advancedFilters.healthScoreMax != null) {
      result = result.filter((d) => d.health <= advancedFilters.healthScoreMax!);
    }

    result.sort((a, b) => {
      const getValue = (d: MockDevice) => {
        switch (sortField) {
          case "name":
            return d.name;
          case "serial":
            return d.serial;
          case "model":
            return d.model;
          case "status":
            return d.status;
          case "location":
            return d.location;
          case "health":
            return d.health;
        }
      };
      const aVal = getValue(a);
      const bVal = getValue(b);
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [devices, search, statusFilter, locationFilter, advancedFilters, sortField, sortDir]);

  // Story 22.4: Standardized local pagination via useLocalPagination
  const pagination = useLocalPagination(filteredDevices, { pageSize: PAGE_SIZE });
  const { paginatedItems: paginatedDevices, totalPages, startIdx, endIdx } = pagination;
  // Expose page/setPage compatible with React.Dispatch<SetStateAction<number>>
  const page = pagination.page;
  const setPage = useCallback(
    (value: number | ((prev: number) => number)) => {
      const next = typeof value === "function" ? value(pagination.page) : value;
      pagination.goToPage(next);
    },
    [pagination],
  );

  const exportCsv = useCallback(() => {
    if (filteredDevices.length === 0) return;
    const headers = [
      "Device Name",
      "Serial Number",
      "Model",
      "Status",
      "Location",
      "Health Score",
      "Firmware",
      "Last Seen",
    ];
    const rows = filteredDevices.map((d) => [
      d.name,
      d.serial,
      d.model,
      d.status,
      d.location,
      String(d.health),
      d.firmware,
      d.lastSeen,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join(
      "\n",
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inventory-export-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredDevices.length} devices to CSV`);
  }, [filteredDevices]);

  return {
    devices,
    filteredDevices,
    paginatedDevices,
    search,
    setSearch,
    advancedFilters,
    setAdvancedFilters,
    sortField,
    sortDir,
    handleSort,
    handleStatusChange,
    handleCreateDevice,
    exportCsv,
    page,
    setPage,
    totalPages,
    startIdx,
    endIdx,
    isLoading,
    error,
  };
}
