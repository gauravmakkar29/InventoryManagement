/**
 * Unit tests for real-time notification system.
 *
 * Covers:
 * - MockRealtimeAdapter event generation
 * - Subscribe/unsubscribe lifecycle
 * - useRealtimeNotifications hook integration
 * - Notification store behavior
 *
 * @see Story #193 — Real-time notifications
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { MockRealtimeAdapter } from "@/lib/providers/realtime/mock-realtime-adapter";
import { useRealtimeNotifications } from "@/lib/hooks/use-realtime-notifications";
import { useNotificationStore } from "@/stores/notification-store";
import type { NotificationEvent } from "@/lib/providers/notification-provider";

// =============================================================================
// Helpers
// =============================================================================

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

// =============================================================================
// MockRealtimeAdapter Tests
// =============================================================================

describe("MockRealtimeAdapter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should start in disconnected state", () => {
    const adapter = new MockRealtimeAdapter({ emitOnConnect: false });
    expect(adapter.getState()).toBe("disconnected");
  });

  it("should transition to connected state on connect()", () => {
    const adapter = new MockRealtimeAdapter({ emitOnConnect: false });
    adapter.connect();
    expect(adapter.getState()).toBe("connected");
  });

  it("should transition to disconnected state on disconnect()", () => {
    const adapter = new MockRealtimeAdapter({ emitOnConnect: false });
    adapter.connect();
    adapter.disconnect();
    expect(adapter.getState()).toBe("disconnected");
  });

  it("should emit events on the configured interval", () => {
    const callback = vi.fn();
    const adapter = new MockRealtimeAdapter({ intervalMs: 1_000, emitOnConnect: false });

    adapter.onMessage(callback);
    adapter.connect();

    // No events yet
    expect(callback).not.toHaveBeenCalled();

    // Advance to first interval
    vi.advanceTimersByTime(1_000);
    expect(callback).toHaveBeenCalledTimes(1);

    // Advance to second interval
    vi.advanceTimersByTime(1_000);
    expect(callback).toHaveBeenCalledTimes(2);

    adapter.disconnect();
  });

  it("should emit an initial event on connect when emitOnConnect is true", () => {
    const callback = vi.fn();
    const adapter = new MockRealtimeAdapter({ intervalMs: 60_000, emitOnConnect: true });

    adapter.onMessage(callback);
    adapter.connect();

    // Initial event after 500ms delay
    vi.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(1);

    adapter.disconnect();
  });

  it("should emit events with valid NotificationEvent shape", () => {
    const callback = vi.fn();
    const adapter = new MockRealtimeAdapter({ intervalMs: 1_000, emitOnConnect: false });

    adapter.onMessage(callback);
    adapter.connect();
    vi.advanceTimersByTime(1_000);

    const event: NotificationEvent = callback.mock.calls[0]![0] as NotificationEvent;
    expect(event).toHaveProperty("id");
    expect(event).toHaveProperty("type");
    expect(event).toHaveProperty("title");
    expect(event).toHaveProperty("message");
    expect(event).toHaveProperty("timestamp");
    expect(["device_status", "firmware_approval", "alert", "system"]).toContain(event.type);

    adapter.disconnect();
  });

  it("should stop emitting events after disconnect", () => {
    const callback = vi.fn();
    const adapter = new MockRealtimeAdapter({ intervalMs: 1_000, emitOnConnect: false });

    adapter.onMessage(callback);
    adapter.connect();
    vi.advanceTimersByTime(1_000);
    expect(callback).toHaveBeenCalledTimes(1);

    adapter.disconnect();
    vi.advanceTimersByTime(5_000);
    expect(callback).toHaveBeenCalledTimes(1); // no more events
  });

  it("should not double-connect if already connected", () => {
    const callback = vi.fn();
    const adapter = new MockRealtimeAdapter({ intervalMs: 1_000, emitOnConnect: false });

    adapter.onMessage(callback);
    adapter.connect();
    adapter.connect(); // second call should be no-op

    vi.advanceTimersByTime(1_000);
    expect(callback).toHaveBeenCalledTimes(1); // only one interval timer
    adapter.disconnect();
  });
});

// =============================================================================
// Subscribe/Unsubscribe Lifecycle Tests
// =============================================================================

describe("MockRealtimeAdapter — subscribe/unsubscribe", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should deliver events to global onMessage subscribers", () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const adapter = new MockRealtimeAdapter({ intervalMs: 1_000, emitOnConnect: false });

    adapter.onMessage(cb1);
    adapter.onMessage(cb2);
    adapter.connect();
    vi.advanceTimersByTime(1_000);

    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);

    adapter.disconnect();
  });

  it("should deliver channel-specific events to channel subscribers", () => {
    const deviceCb = vi.fn();
    const firmwareCb = vi.fn();
    const adapter = new MockRealtimeAdapter({ intervalMs: 1_000, emitOnConnect: false });

    adapter.subscribe("device_status", deviceCb);
    adapter.subscribe("firmware_approval", firmwareCb);
    adapter.connect();

    // Emit multiple events to cover different types
    for (let i = 0; i < 12; i++) {
      vi.advanceTimersByTime(1_000);
    }

    // At least some device_status events should have been dispatched
    expect(deviceCb.mock.calls.length).toBeGreaterThan(0);
    // At least some firmware_approval events should have been dispatched
    expect(firmwareCb.mock.calls.length).toBeGreaterThan(0);

    adapter.disconnect();
  });

  it("should stop delivering events after unsubscribe", () => {
    const callback = vi.fn();
    const adapter = new MockRealtimeAdapter({ intervalMs: 1_000, emitOnConnect: false });

    const unsub = adapter.onMessage(callback);
    adapter.connect();
    vi.advanceTimersByTime(1_000);
    expect(callback).toHaveBeenCalledTimes(1);

    unsub();
    vi.advanceTimersByTime(5_000);
    expect(callback).toHaveBeenCalledTimes(1); // no more after unsub
    adapter.disconnect();
  });

  it("should stop delivering channel events after channel unsubscribe", () => {
    const callback = vi.fn();
    const adapter = new MockRealtimeAdapter({ intervalMs: 1_000, emitOnConnect: false });

    const unsub = adapter.subscribe("device_status", callback);
    adapter.connect();

    // Emit a few events
    for (let i = 0; i < 3; i++) {
      vi.advanceTimersByTime(1_000);
    }
    const countBefore = callback.mock.calls.length;

    unsub();

    // Emit more events
    for (let i = 0; i < 12; i++) {
      vi.advanceTimersByTime(1_000);
    }
    expect(callback.mock.calls.length).toBe(countBefore);

    adapter.disconnect();
  });
});

// =============================================================================
// Notification Store Tests
// =============================================================================

describe("useNotificationStore", () => {
  beforeEach(() => {
    // Reset store between tests
    useNotificationStore.getState().clearAll();
  });

  it("should start with empty notifications", () => {
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(0);
    expect(state.unreadCount).toBe(0);
  });

  it("should add a notification as unread", () => {
    const event: NotificationEvent = {
      id: "test-1",
      type: "device_status",
      title: "Test",
      message: "Test message",
      timestamp: new Date().toISOString(),
    };

    useNotificationStore.getState().addNotification(event);
    const state = useNotificationStore.getState();

    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0]!.read).toBe(false);
    expect(state.unreadCount).toBe(1);
  });

  it("should mark a notification as read", () => {
    const event: NotificationEvent = {
      id: "test-2",
      type: "alert",
      title: "Alert",
      message: "Alert message",
      timestamp: new Date().toISOString(),
    };

    useNotificationStore.getState().addNotification(event);
    useNotificationStore.getState().markAsRead("test-2");
    const state = useNotificationStore.getState();

    expect(state.notifications[0]!.read).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  it("should mark all notifications as read", () => {
    const events: NotificationEvent[] = [
      { id: "a", type: "alert", title: "A", message: "A", timestamp: new Date().toISOString() },
      { id: "b", type: "system", title: "B", message: "B", timestamp: new Date().toISOString() },
    ];

    for (const e of events) {
      useNotificationStore.getState().addNotification(e);
    }

    useNotificationStore.getState().markAllAsRead();
    const state = useNotificationStore.getState();

    expect(state.unreadCount).toBe(0);
    expect(state.notifications.every((n) => n.read)).toBe(true);
  });

  it("should clear all notifications", () => {
    useNotificationStore.getState().addNotification({
      id: "c",
      type: "system",
      title: "C",
      message: "C",
      timestamp: new Date().toISOString(),
    });

    useNotificationStore.getState().clearAll();
    const state = useNotificationStore.getState();

    expect(state.notifications).toHaveLength(0);
    expect(state.unreadCount).toBe(0);
  });

  it("should cap notifications at 100", () => {
    for (let i = 0; i < 110; i++) {
      useNotificationStore.getState().addNotification({
        id: `n-${i}`,
        type: "system",
        title: `N${i}`,
        message: `Msg ${i}`,
        timestamp: new Date().toISOString(),
      });
    }

    const state = useNotificationStore.getState();
    expect(state.notifications.length).toBeLessThanOrEqual(100);
  });
});

// =============================================================================
// useRealtimeNotifications Hook Tests
// =============================================================================

describe("useRealtimeNotifications", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useNotificationStore.getState().clearAll();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should connect on mount and disconnect on unmount", () => {
    const adapter = new MockRealtimeAdapter({ intervalMs: 60_000, emitOnConnect: false });
    const connectSpy = vi.spyOn(adapter, "connect");
    const disconnectSpy = vi.spyOn(adapter, "disconnect");

    const { unmount } = renderHook(() => useRealtimeNotifications(adapter), {
      wrapper: createWrapper(),
    });

    expect(connectSpy).toHaveBeenCalledTimes(1);

    unmount();
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });

  it("should add incoming events to the notification store", () => {
    const adapter = new MockRealtimeAdapter({ intervalMs: 1_000, emitOnConnect: false });

    renderHook(() => useRealtimeNotifications(adapter), {
      wrapper: createWrapper(),
    });

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    const state = useNotificationStore.getState();
    expect(state.notifications.length).toBeGreaterThanOrEqual(1);
    expect(state.unreadCount).toBeGreaterThanOrEqual(1);
  });

  it("should return notifications and actions from the hook", () => {
    const adapter = new MockRealtimeAdapter({ intervalMs: 60_000, emitOnConnect: false });

    const { result } = renderHook(() => useRealtimeNotifications(adapter), {
      wrapper: createWrapper(),
    });

    expect(result.current.notifications).toBeDefined();
    expect(result.current.unreadCount).toBeDefined();
    expect(typeof result.current.markAsRead).toBe("function");
    expect(typeof result.current.markAllAsRead).toBe("function");
    expect(typeof result.current.clearAll).toBe("function");
  });

  it("should handle null provider gracefully", () => {
    const { result } = renderHook(() => useRealtimeNotifications(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });
});
