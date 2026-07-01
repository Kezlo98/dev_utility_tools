import type { ThemeMode } from "./types";

/**
 * Theme handling. The `.dark` class on <html> drives every Tailwind color via
 * the CSS vars in index.css, so a single class toggle cascades to all tools
 * with no per-tool overrides.
 */

const DARK_MQ = "(prefers-color-scheme: dark)";

/** Resolve a ThemeMode to the concrete "light" | "dark" currently in effect. */
export function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return window.matchMedia(DARK_MQ).matches ? "dark" : "light";
  }
  return mode;
}

/** Apply a mode to the document by toggling `.dark` on <html>. */
export function applyTheme(mode: ThemeMode): void {
  const resolved = resolveTheme(mode);
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

/**
 * Keep the DOM in sync when the OS preference changes while in "system" mode.
 * Returns a cleanup that removes the listener.
 */
export function watchSystemTheme(onChange: () => void): () => void {
  const mql = window.matchMedia(DARK_MQ);
  const handler = () => onChange();
  mql.addEventListener("change", handler);
  return () => mql.removeEventListener("change", handler);
}
