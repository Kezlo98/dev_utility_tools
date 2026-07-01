import type { Tool } from "./types";

/**
 * Sort tools for the MenuPanel: favorites first, then the rest. Each half is
 * sorted A→Z by name (locale-aware). Favorites keep their stable alpha order
 * rather than insertion order so the menu never reorders on toggle.
 */
export function sortToolsForMenu(
  tools: Tool[],
  favorites: Set<string>,
): Tool[] {
  const byName = (a: Tool, b: Tool) => a.name.localeCompare(b.name);

  const fav = tools.filter((t) => favorites.has(t.id)).sort(byName);
  const rest = tools.filter((t) => !favorites.has(t.id)).sort(byName);

  return [...fav, ...rest];
}
