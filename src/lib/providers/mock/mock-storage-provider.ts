import type { IStorageProvider } from "../types";

/**
 * Mock Storage Provider — delegates to browser localStorage.
 * Future adapters can use sessionStorage, IndexedDB, or server-side storage.
 */
export function createMockStorageProvider(): IStorageProvider {
  return {
    getItem: (key) => localStorage.getItem(key),
    setItem: (key, value) => localStorage.setItem(key, value),
    removeItem: (key) => localStorage.removeItem(key),
  };
}
