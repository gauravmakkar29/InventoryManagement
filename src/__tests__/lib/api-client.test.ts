import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { createApiClient, type IApiClient } from "../../lib/api-client";

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}) {
  const headerMap = new Map(Object.entries(headers));
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : `Error ${status}`,
    json: () => Promise.resolve(data),
    headers: {
      forEach: (cb: (value: string, key: string) => void) => headerMap.forEach(cb),
      get: (key: string) => headerMap.get(key) ?? null,
    },
  };
}

describe("ApiClient", () => {
  let client: IApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    client = createApiClient({
      baseUrl: "https://api.test.com",
      baseDelayMs: 10,
      maxDelayMs: 50,
      maxRetries: { query: 2, mutation: 1, upload: 0 },
      timeouts: { query: 5000, mutation: 10000, upload: 60000 },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("executes a successful GET request", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ items: [1, 2, 3] }));

    const response = await client.execute({ url: "/devices" });

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(response.data).toEqual({ items: [1, 2, 3] });
    expect(response.status).toBe(200);
  });

  it("adds Content-Type header by default", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}));

    await client.execute({ url: "/test" });

    const callArgs = mockFetch.mock.calls[0]!;
    expect(callArgs[1].headers["Content-Type"]).toBe("application/json");
  });

  it("retries on 503 with exponential backoff", async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse(null, 503))
      .mockResolvedValueOnce(jsonResponse(null, 503))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const response = await client.execute({ url: "/devices", type: "query" });

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(response.data).toEqual({ ok: true });
  });

  it("does not retry mutations more than once", async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse(null, 503))
      .mockResolvedValueOnce(jsonResponse(null, 503));

    await expect(
      client.execute({ url: "/orders", type: "mutation", method: "POST" }),
    ).rejects.toMatchObject({ code: "HTTP_503" });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("does not retry uploads", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(null, 503));

    await expect(
      client.execute({ url: "/upload", type: "upload", method: "POST" }),
    ).rejects.toMatchObject({ code: "HTTP_503" });

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("throws non-retryable errors immediately", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(null, 404));

    await expect(client.execute({ url: "/missing" })).rejects.toHaveProperty("status", 404);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  describe("circuit breaker", () => {
    it("opens after consecutive failures", async () => {
      const cbClient = createApiClient({
        baseUrl: "https://api.test.com",
        circuitBreakerThreshold: 3,
        circuitBreakerCooldownMs: 5000,
        baseDelayMs: 1,
        maxRetries: { query: 0, mutation: 0, upload: 0 },
      });

      // Trigger 3 failures
      mockFetch.mockResolvedValue(jsonResponse(null, 500));
      for (let i = 0; i < 3; i++) {
        await cbClient.execute({ url: "/fail" }).catch(() => {});
      }

      expect(cbClient.getCircuitState()).toBe("open");

      // Next request should fail immediately without calling fetch
      const fetchCountBefore = mockFetch.mock.calls.length;
      await expect(cbClient.execute({ url: "/blocked" })).rejects.toMatchObject({
        code: "CIRCUIT_OPEN",
      });
      expect(mockFetch.mock.calls.length).toBe(fetchCountBefore);
    });

    it("resets on successful request", async () => {
      const cbClient = createApiClient({
        baseUrl: "https://api.test.com",
        circuitBreakerThreshold: 3,
        baseDelayMs: 1,
        maxRetries: { query: 0, mutation: 0, upload: 0 },
      });

      mockFetch.mockResolvedValueOnce(jsonResponse(null, 500));
      await cbClient.execute({ url: "/fail" }).catch(() => {});

      mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }));
      await cbClient.execute({ url: "/ok" });

      expect(cbClient.getCircuitState()).toBe("closed");
    });

    it("can be manually reset", async () => {
      const cbClient = createApiClient({
        baseUrl: "https://api.test.com",
        circuitBreakerThreshold: 2,
        baseDelayMs: 1,
        maxRetries: { query: 0, mutation: 0, upload: 0 },
      });

      mockFetch.mockResolvedValue(jsonResponse(null, 500));
      await cbClient.execute({ url: "/fail" }).catch(() => {});
      await cbClient.execute({ url: "/fail" }).catch(() => {});

      expect(cbClient.getCircuitState()).toBe("open");

      cbClient.resetCircuit();
      expect(cbClient.getCircuitState()).toBe("closed");
    });
  });

  describe("interceptors", () => {
    it("applies request interceptors", async () => {
      const authClient = createApiClient({
        baseUrl: "https://api.test.com",
        requestInterceptors: [
          (req) => ({
            ...req,
            headers: { ...req.headers, Authorization: "Bearer token-123" },
          }),
        ],
      });

      mockFetch.mockResolvedValueOnce(jsonResponse({}));
      await authClient.execute({ url: "/secure" });

      const headers = mockFetch.mock.calls[0]![1].headers;
      expect(headers["Authorization"]).toBe("Bearer token-123");
    });
  });
});
