import { describe, it, expect, vi } from "vitest";

import {
  PLATFORM_DEFAULT_HOTKEY,
  isReservedOnWindows,
  keyboardEventToCombo,
  restorePersistedGlobalHotkey,
} from "./hotkey";

// jsdom's user agent is non-Mac, so these tests exercise the Windows/Linux
// branch of the normalizer (Alt, Super, Ctrl+Alt+Space default).
function key(parts: {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
}): Parameters<typeof keyboardEventToCombo>[0] {
  return {
    ctrlKey: !!parts.ctrl,
    altKey: !!parts.alt,
    shiftKey: !!parts.shift,
    metaKey: !!parts.meta,
    key: parts.key,
  };
}

describe("keyboardEventToCombo", () => {
  it("returns null for a bare modifier press", () => {
    expect(
      keyboardEventToCombo(key({ key: "Control", ctrl: true })),
    ).toBeNull();
    expect(keyboardEventToCombo(key({ key: "Alt", alt: true }))).toBeNull();
    expect(keyboardEventToCombo(key({ key: "Shift", shift: true }))).toBeNull();
  });

  it("rejects combos with no positional modifier (bare or Shift-only)", () => {
    // A bare key would globally hijack typing; Shift alone is still typing.
    expect(keyboardEventToCombo(key({ key: "e" }))).toBeNull();
    expect(keyboardEventToCombo(key({ key: "a", shift: true }))).toBeNull();
    expect(keyboardEventToCombo(key({ key: " " }))).toBeNull();
  });

  it("rejects non-ASCII keys (macOS Option dead-key compositions)", () => {
    expect(keyboardEventToCombo(key({ key: "´", alt: true }))).toBeNull();
  });

  it("formats a full modifier+key combo", () => {
    expect(keyboardEventToCombo(key({ key: " ", ctrl: true, alt: true }))).toBe(
      "Ctrl+Alt+Space",
    );
    expect(keyboardEventToCombo(key({ key: "e", ctrl: true }))).toBe("Ctrl+E");
  });

  it("uppercases single-character keys and maps Space/Arrows", () => {
    expect(
      keyboardEventToCombo(key({ key: "a", ctrl: true, shift: true })),
    ).toBe("Ctrl+Shift+A");
    expect(keyboardEventToCombo(key({ key: "ArrowUp", ctrl: true }))).toBe(
      "Ctrl+Up",
    );
    expect(keyboardEventToCombo(key({ key: "Spacebar", ctrl: true }))).toBe(
      "Ctrl+Space",
    );
  });

  it("emits platform-specific modifier names", () => {
    expect(keyboardEventToCombo(key({ key: "e", alt: true }))).toBe("Alt+E");
    expect(keyboardEventToCombo(key({ key: "e", meta: true }))).toBe("Super+E");
  });
});

describe("platform default + reserved combo", () => {
  it("uses the Windows/Linux default in the non-Mac test env", () => {
    expect(PLATFORM_DEFAULT_HOTKEY).toBe("Ctrl+Alt+Space");
  });

  it("blocks bare Alt+Space on Windows but allows it with another modifier", () => {
    expect(isReservedOnWindows("Alt+Space")).toBe(true);
    expect(isReservedOnWindows("Ctrl+Alt+Space")).toBe(false);
  });
});

describe("restorePersistedGlobalHotkey", () => {
  it("leaves the platform default registered for a null preference", async () => {
    const register = vi.fn<(combo: string) => Promise<void>>();

    await expect(restorePersistedGlobalHotkey(null, register)).resolves.toBe(
      true,
    );
    expect(register).not.toHaveBeenCalled();
  });

  it("registers a persisted custom shortcut", async () => {
    const register = vi.fn().mockResolvedValue(undefined);

    await expect(
      restorePersistedGlobalHotkey("Ctrl+Shift+Space", register),
    ).resolves.toBe(true);
    expect(register).toHaveBeenCalledOnce();
    expect(register).toHaveBeenCalledWith("Ctrl+Shift+Space");
  });

  it("reports a rejected shortcut without throwing during startup", async () => {
    const register = vi.fn().mockRejectedValue(new Error("already registered"));

    await expect(
      restorePersistedGlobalHotkey("Ctrl+Shift+Space", register),
    ).resolves.toBe(false);
  });
});
