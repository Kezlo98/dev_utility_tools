import { describe, it, expect, beforeEach } from "vitest";

import { useAppStore } from "./app-store";
import { storageKey } from "./persistence";

/**
 * Deterministic in-memory `localStorage` so the persist round-trip does not
 * depend on the test runner's storage backend (the Node/jsdom localStorage in
 * this env is inconsistent across isolated vs. full-suite runs). The store's
 * `stateStorage` adapter reads `window.localStorage` lazily, so installing this
 * before each test fully controls what persist reads and writes.
 */
function installMemoryStorage(): void {
  const map = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    key: (i) => Array.from(map.keys())[i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, String(v)),
  };
  Object.defineProperty(window, "localStorage", {
    value: storage,
    configurable: true,
  });
}

/**
 * The persist middleware serializes to localStorage synchronously, so a
 * "simulated reload" is: write via the store → confirm it landed in storage →
 * wipe in-memory state → `rehydrate()` and assert the value came back.
 */
describe("app-store ignoredVersion persistence", () => {
  beforeEach(() => {
    installMemoryStorage();
    useAppStore.setState({ ignoredVersion: null });
  });

  it("writes ignoredVersion to the devkit:app-state key", () => {
    useAppStore.getState().setIgnoredVersion("v0.2.0");

    const raw = window.localStorage.getItem(storageKey("app-state"));
    expect(raw).not.toBeNull();
    expect(raw).toContain("v0.2.0");
  });

  it("restores ignoredVersion across a simulated reload", async () => {
    useAppStore.getState().setIgnoredVersion("v0.3.0");

    // Snapshot the persisted blob, because zustand `persist` writes on every
    // `setState` — the wipe below would otherwise clobber storage with `null`.
    // A real reload keeps the on-disk snapshot while in-memory state resets.
    const persisted = window.localStorage.getItem(storageKey("app-state"))!;

    useAppStore.setState({ ignoredVersion: null });
    expect(useAppStore.getState().ignoredVersion).toBeNull();

    // Restore the pre-wipe snapshot, then rehydrate as a fresh launch would.
    window.localStorage.setItem(storageKey("app-state"), persisted);
    await useAppStore.persist.rehydrate();
    expect(useAppStore.getState().ignoredVersion).toBe("v0.3.0");
  });
});
