import type { StateStorage } from "zustand/middleware";

/**
 * Typed localStorage helpers. All DevKit state lives under the `devkit:`
 * namespace so it is easy to inspect / clear from DevTools.
 *
 * The Tauri v2 WebView persists localStorage in the app data dir across
 * restarts (macOS `~/Library/WebKit/com.kezlo.devkit/`,
 * Windows `%LOCALAPPDATA%\com.kezlo.devkit\EBWebView\`).
 */
const PREFIX = "devkit:";

export function storageKey(field: string): string {
  return `${PREFIX}${field}`;
}

/** Load and JSON-parse a value, returning `fallback` on miss or parse error. */
export function load<T>(field: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(storageKey(field));
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** JSON-stringify and write a value. Swallows quota / disabled-storage errors. */
export function save<T>(field: string, value: T): void {
  try {
    window.localStorage.setItem(storageKey(field), JSON.stringify(value));
  } catch {
    // Non-fatal: persistence is best-effort for this app.
  }
}

/**
 * Zustand `StateStorage` adapter so persist-backed stores share the same
 * namespaced, error-tolerant read/write path as the helpers above.
 */
export const stateStorage: StateStorage = {
  getItem: (name) => window.localStorage.getItem(storageKey(name)),
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(storageKey(name), value);
    } catch {
      // Non-fatal.
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(storageKey(name));
    } catch {
      // Non-fatal.
    }
  },
};
