import { isMac } from "@/lib/utils";

/**
 * Per-platform default spotlight hotkey. Must mirror the Rust `DEFAULT_HOTKEY`
 * (`Option+Space` on macOS, `Ctrl+Alt+Space` elsewhere) so a `null` store
 * preference renders the same combo Rust registers at launch.
 */
export const PLATFORM_DEFAULT_HOTKEY = isMac
  ? "Option+Space"
  : "Ctrl+Alt+Space";

/**
 * Plain `Alt+Space` is reserved by the Windows window-menu system, so it is
 * blocked client-side before registration is even attempted (the brainstorm
 * report flags this explicitly). Rust independently rejects bad combos — this
 * is defense in depth, not a substitute.
 */
export const RESERVED_WINDOWS_COMBO = "Alt+Space";

/** True only for the bare `Alt+Space` combo on Windows (no other modifier). */
export function isReservedOnWindows(combo: string): boolean {
  return !isMac && combo === RESERVED_WINDOWS_COMBO;
}

/**
 * Re-register a persisted custom shortcut during main-window startup.
 * Returns false when registration fails so the caller can restore its persisted
 * state to the platform default without blocking application rendering.
 */
export async function restorePersistedGlobalHotkey(
  combo: string | null,
  register: (combo: string) => Promise<void>,
): Promise<boolean> {
  if (combo === null) return true;

  try {
    await register(combo);
    return true;
  } catch {
    return false;
  }
}

interface ComboKey {
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  key: string;
}

// Arrow-key names as exposed by the DOM map onto Tauri's accelerator names.
const ARROW_KEYS: Record<string, string> = {
  ArrowUp: "Up",
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
};

/**
 * Normalize a keydown event into a Tauri accelerator string
 * (`"Ctrl+Alt+Space"`, `"Option+E"`, …). Returns `null` while only modifier
 * keys are held — a complete combo needs a non-modifier key.
 */
export function keyboardEventToCombo(e: ComboKey): string | null {
  // A bare modifier press is not a complete combo yet.
  if (
    e.key === "Control" ||
    e.key === "Alt" ||
    e.key === "Shift" ||
    e.key === "Meta"
  ) {
    return null;
  }

  // Non-ASCII keys (e.g. macOS Option dead-key compositions like "´") can't be
  // represented as a Tauri accelerator — keep listening for a clean keypress.
  if (e.key.length === 1 && e.key.charCodeAt(0) > 127) {
    return null;
  }

  // A global hotkey must include a positional modifier (Ctrl/Alt/Cmd); without
  // one it would hijack a normal typing key system-wide. Shift alone doesn't
  // count — `Shift+E` is still just typing an `E`.
  if (!e.ctrlKey && !e.altKey && !e.metaKey) {
    return null;
  }

  const mods: string[] = [];
  if (e.ctrlKey) mods.push("Ctrl");
  if (e.metaKey) mods.push(isMac ? "Cmd" : "Super");
  if (e.altKey) mods.push(isMac ? "Option" : "Alt");
  if (e.shiftKey) mods.push("Shift");

  let keyPart: string;
  if (e.key === " " || e.key === "Spacebar") {
    keyPart = "Space";
  } else if (e.key in ARROW_KEYS) {
    keyPart = ARROW_KEYS[e.key];
  } else if (e.key.length === 1) {
    keyPart = e.key.toUpperCase();
  } else {
    keyPart = e.key; // e.g. "Enter", "F1", "Tab"
  }

  return [...mods, keyPart].join("+");
}
