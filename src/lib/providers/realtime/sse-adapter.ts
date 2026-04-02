/**
 * IMS Gen 2 — SSE (Server-Sent Events) Notification Adapter
 *
 * Implements INotificationProvider using the EventSource API.
 * Simpler than WebSocket — suitable for one-way server-to-client notifications.
 * Auto-reconnect is built into the EventSource specification.
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

interface SSEAdapterConfig {
  /** SSE endpoint URL. Falls back to VITE_REALTIME_ENDPOINT. */
  url?: string;
  /** Whether to send credentials (cookies) with the request. Default: false */
  withCredentials?: boolean;
}

// =============================================================================
// Adapter
// =============================================================================

type MessageCallback = (event: NotificationEvent) => void;

export class SSEAdapter implements INotificationProvider {
  private readonly url: string;
  private readonly withCredentials: boolean;
  private source: EventSource | null = null;
  private state: ConnectionState = "disconnected";

  /** Channel-specific subscribers: channel -> Set<callback> */
  private channelSubs = new Map<string, Set<MessageCallback>>();

  /** Global message subscribers */
  private globalSubs = new Set<MessageCallback>();

  constructor(config?: SSEAdapterConfig) {
    const envUrl = (import.meta.env.VITE_REALTIME_ENDPOINT as string | undefined) ?? "";
    this.url = config?.url ?? envUrl;
    this.withCredentials = config?.withCredentials ?? false;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  connect(): void {
    if (this.state === "connected" || this.state === "connecting") return;

    if (!this.url) {
      console.warn("[IMS:SSE] No realtime endpoint configured — skipping connect.");
      return;
    }

    this.state = "connecting";

    this.source = new EventSource(this.url, {
      withCredentials: this.withCredentials,
    });

    this.source.onopen = () => {
      this.state = "connected";
    };

    this.source.onmessage = (event: MessageEvent) => {
      this.handleMessage(event);
    };

    this.source.onerror = () => {
      // EventSource auto-reconnects. Update state for consumers.
      if (this.state === "connected") {
        this.state = "reconnecting";
      }
    };
  }

  disconnect(): void {
    this.state = "disconnected";
    if (this.source) {
      this.source.close();
      this.source = null;
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

  private handleMessage(raw: MessageEvent): void {
    let parsed: NotificationEvent;
    try {
      parsed = JSON.parse(raw.data as string) as NotificationEvent;
    } catch {
      console.warn("[IMS:SSE] Received non-JSON message — ignoring.");
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
}

// =============================================================================
// Factory
// =============================================================================

export function createSSEAdapter(config?: SSEAdapterConfig): INotificationProvider {
  return new SSEAdapter(config);
}
