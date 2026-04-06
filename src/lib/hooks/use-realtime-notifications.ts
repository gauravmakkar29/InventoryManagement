/**
 * IMS Gen 2 — useRealtimeNotifications Hook
 *
 * Connects to the real-time notification provider on mount,
 * dispatches events to the Zustand notification store, and
 * invalidates relevant TanStack Query caches.
 *
 * Story #286: Targeted invalidation — uses event metadata.resourceId
 * for detail-level queries while invalidating list queries at the
 * list level (not the entire domain).
 *
 * @see Story #193 — Real-time notifications
 */

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type {
  INotificationProvider,
  NotificationEvent,
} from "@/lib/providers/notification-provider";
import { useNotificationStore, type StoredNotification } from "@/stores/notification-store";
import { queryKeys } from "@/lib/query-keys";

// =============================================================================
// Hook Return Type
// =============================================================================

interface UseRealtimeNotificationsReturn {
  notifications: StoredNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

// =============================================================================
// Query Invalidation Map
// =============================================================================

/**
 * Maps notification event types to targeted invalidation strategies.
 *
 * - `lists`: query keys for list-level invalidation (re-fetches lists but
 *   not unrelated detail queries)
 * - `detailFn`: optional function that returns a detail query key given a
 *   resourceId — only the specific resource is invalidated
 */
interface InvalidationStrategy {
  lists: readonly (readonly unknown[])[];
  detailFn?: (resourceId: string) => readonly unknown[];
}

const INVALIDATION_MAP: Record<string, InvalidationStrategy> = {
  device_status: {
    lists: [queryKeys.devices.list(), queryKeys.dashboard.metrics()],
    detailFn: (id) => queryKeys.devices.detail(id),
  },
  firmware_approval: {
    lists: [queryKeys.firmware.list(), queryKeys.dashboard.metrics()],
    detailFn: (id) => queryKeys.firmware.detail(id),
  },
  alert: {
    lists: [queryKeys.vulnerabilities.list(), queryKeys.compliance.list()],
  },
  system: {
    lists: [queryKeys.dashboard.metrics()],
  },
};

// =============================================================================
// Hook
// =============================================================================

export function useRealtimeNotifications(
  provider: INotificationProvider | null,
): UseRealtimeNotificationsReturn {
  const queryClient = useQueryClient();
  const providerRef = useRef(provider);
  providerRef.current = provider;

  const { notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll } =
    useNotificationStore();

  const handleEvent = useCallback(
    (event: NotificationEvent) => {
      // Add to store
      addNotification(event);

      // Targeted query invalidation
      const strategy = INVALIDATION_MAP[event.type];
      if (!strategy) return;

      // Invalidate list-level queries (not entire domain)
      for (const queryKey of strategy.lists) {
        queryClient.invalidateQueries({ queryKey });
      }

      // Invalidate specific detail query if resourceId is available
      const resourceId = event.metadata?.resourceId;
      if (strategy.detailFn && typeof resourceId === "string") {
        queryClient.invalidateQueries({ queryKey: strategy.detailFn(resourceId) });
      }
    },
    [addNotification, queryClient],
  );

  useEffect(() => {
    const p = providerRef.current;
    if (!p) return;

    p.connect();
    const unsub = p.onMessage(handleEvent);

    return () => {
      unsub();
      p.disconnect();
    };
  }, [provider, handleEvent]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}
