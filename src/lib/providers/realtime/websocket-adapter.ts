/**
 * IMS Gen 2 — WebSocket Notification Adapter
 *
 * Implements INotificationProvider using native WebSocket API.
 * Features: auto-reconnect with exponential backoff, heartbeat/ping-pong.
 *
 * @see Story #193 — Real-time notifications
 */

import type {
  INotificationProvider,
  NotificationEvent,
  ConnectionState,
} from "../notification-provider";

// =============================================================================
// Configuration
// =============================================================================

interface WebSocketAdapterConfig {
  /** WebSocket endpoint URL (wss://...). Falls back to VITE_REALTIME_ENDPOINT. */
  url?: string;
  /** Initial reconnect delay in ms (doubles each attempt). Default: 1000 */
  reconnectBaseDelay?: number;
  /** Maximum reconnect delay in ms. Default: 30000 */
  reconnectMaxDelay?: number;
  /** Maximum reconnect attempts before giving up. Default: 10 */
  maxReconnectAttempts?: number;
  /** Heartbeat interval in ms. Default: 30000 */
  heartbeatInterval?: number;
  /** How long to wait for a pong before considering connection stale. Default: 5000 */
  heartbeatTimeout?: number;
}

const DEFAULT_CONFIG: Required<WebSocketAdapterConfig> = {
  url: "",
  reconnectBaseDelay: 1_000,
  reconnectMaxDelay: 30_000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30_000,
  heartbeatTimeout: 5_000,
};

// =============================================================================
// Adapter
// =============================================================================

type MessageCallback = (event: NotificationEvent) => void;

export class WebSocketAdapter implements INotificationProvider {
  private readonly config: Required<WebSocketAdapterConfig>;
  private socket: WebSocket | null = null;
  private state: ConnectionState = "disconnected";
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

  /** Channel-specific subscribers: channel -> Set<callback> */
  private channelSubs = new Map<string, Set<MessageCallback>>();

  /** Global message subscribers */
  private globalSubs = new Set<MessageCallback>();

  constructor(config?: WebSocketAdapterConfig) {
    const resolved = { ...DEFAULT_CONFIG, ...config };
    if (!resolved.url) {
      resolved.url = (import.meta.env.VITE_REALTIME_ENDPOINT as string | undefined) ?? "";
    }
    this.config = resolved;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  connect(): void {
    if (this.state === "connected" || this.state === "connecting") return;

    if (!this.config.url) {
      console.warn("[IMS:WebSocket] No realtime endpoint configured — skipping connect.");
      return;
    }

    this.state = "connecting";
    this.createSocket();
  }

  disconnect(): void {
    this.state = "disconnected";
    this.reconnectAttempts = 0;
    this.clearTimers();
    if (this.socket) {
      this.socket.onclose = null; // prevent reconnect on intentional close
      this.socket.close();
      this.socket = null;
    }
  }

  subscribe(channel: string, callback: MessageCallback): () => void {
    let subs = this.channelSubs.get(channel);
    if (!subs) {
      subs = new Set();
      this.channelSubs.set(channel, subs);
    }
    subs.add(callback);

    return () => {
      subs?.delete(callback);
      if (subs?.size === 0) {
        this.channelSubs.delete(channel);
      }
    };
  }

  onMessage(callback: MessageCallback): () => void {
    this.globalSubs.add(callback);
    return () => {
      this.globalSubs.delete(callback);
    };
  }

  /** Expose current connection state for diagnostics. */
  getState(): ConnectionState {
    return this.state;
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private createSocket(): void {
    try {
      this.socket = new WebSocket(this.config.url);
    } catch {
      console.warn("[IMS:WebSocket] Failed to create WebSocket — scheduling reconnect.");
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      this.state = "connected";
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    };

    this.socket.onmessage = (event: MessageEvent) => {
      this.handleMessage(event);
    };

    this.socket.onclose = () => {
      this.stopHeartbeat();
      if (this.state !== "disconnected") {
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = () => {
      // onclose will fire after onerror — reconnect handled there
    };
  }

  private handleMessage(raw: MessageEvent): void {
    // Pong handling
    if (raw.data === "pong") {
      this.clearHeartbeatTimeout();
      return;
    }

    let parsed: NotificationEvent;
    try {
      parsed = JSON.parse(raw.data as string) as NotificationEvent;
    } catch {
      console.warn("[IMS:WebSocket] Received non-JSON message — ignoring.");
      return;
    }

    // Dispatch to global subscribers
    for (const cb of this.globalSubs) {
      cb(parsed);
    }

    // Dispatch to channel subscribers
    const channel = parsed.type;
    const subs = this.channelSubs.get(channel);
    if (subs) {
      for (const cb of subs) {
        cb(parsed);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Reconnection (exponential backoff)
  // ---------------------------------------------------------------------------

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.state = "disconnected";
      console.warn("[IMS:WebSocket] Max reconnect attempts reached — giving up.");
      return;
    }

    this.state = "reconnecting";
    const delay = Math.min(
      this.config.reconnectBaseDelay * 2 ** this.reconnectAttempts,
      this.config.reconnectMaxDelay,
    );
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.createSocket();
    }, delay);
  }

  // ---------------------------------------------------------------------------
  // Heartbeat
  // ---------------------------------------------------------------------------

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send("ping");
        this.heartbeatTimeoutTimer = setTimeout(() => {
          // No pong received — connection is stale, force reconnect
          console.warn("[IMS:WebSocket] Heartbeat timeout — reconnecting.");
          this.socket?.close();
        }, this.config.heartbeatTimeout);
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.clearHeartbeatTimeout();
  }

  private clearHeartbeatTimeout(): void {
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  private clearTimers(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createWebSocketAdapter(config?: WebSocketAdapterConfig): INotificationProvider {
  return new WebSocketAdapter(config);
}
