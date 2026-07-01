import { useEffect } from "react";

/**
 * Listen for a global keyboard shortcut. The listener is attached to `window`
 * (never inside a focus-trapping portal) so it fires regardless of what dialog
 * or input currently has focus.
 *
 * `Cmd/Ctrl+K` toggles the command palette.
 */
export function useGlobalShortcut(
  handler: (e: KeyboardEvent) => void,
  deps: unknown[] = [],
): void {
  useEffect(() => {
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** True when the pressed key matches the palette toggle (Cmd/Ctrl+K). */
export function isPaletteToggle(e: KeyboardEvent): boolean {
  return (e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K");
}
