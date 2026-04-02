/**
 * IMS Gen 2 — Real-time Notification Provider Interface
 *
 * Defines the contract for real-time notification delivery.
 * Implementations: WebSocket, SSE, Mock (local dev).
 *
 * @see Story #193 — Real-time notifications
 */

// =============================================================================
// Notification Event Types
// =============================================================================

export type NotificationEventType = "device_status" | "firmware_approval" | "alert" | "system";

export interface NotificationEvent {
  id: string;
  type: NotificationEventType;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Notification Provider Interface
// =============================================================================

/**
 * Real-time notification provider — connects to a backend channel
 * and delivers incoming events to subscribers.
 */
export interface INotificationProvider {
  /** Open the real-time connection. */
  connect(): void;

  /** Close the connection and release resources. */
  disconnect(): void;

  /**
   * Subscribe to a specific channel (e.g., "devices", "firmware").
   * Returns an unsubscribe function.
   */
  subscribe(channel: string, callback: (event: NotificationEvent) => void): () => void;

  /**
   * Subscribe to all incoming messages regardless of channel.
   * Returns an unsubscribe function.
   */
  onMessage(callback: (event: NotificationEvent) => void): () => void;
}

// =============================================================================
// Connection State
// =============================================================================

export type ConnectionState = "disconnected" | "connecting" | "connected" | "reconnecting";
