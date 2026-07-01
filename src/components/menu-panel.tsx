import { useMemo, useState } from "react";

import type { Tool } from "@/lib/types";
import { getAllTools } from "@/lib/registry";
import { sortToolsForMenu } from "@/lib/ordering";
import { useAppStore } from "@/store/app-store";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme-toggle";
import { MenuPanelItem } from "@/components/menu-panel-item";

/**
 * Left column: sticky search, then a Favorites section (only when favorites
 * exist and the query is empty) and an All tools section, both favorites-first
 * and A→Z ordered.
 */
export function MenuPanel() {
  const [query, setQuery] = useState("");
  const allTools = getAllTools();
  const favorites = useAppStore((s) => s.favorites);
  const lastActiveToolId = useAppStore((s) => s.lastActiveToolId);

  const favSet = useMemo(() => new Set(favorites), [favorites]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allTools;
    return allTools.filter((t) => {
      const haystack = [t.name, ...(t.keywords ?? [])].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [allTools, query]);

  const ordered = useMemo(
    () => sortToolsForMenu(filtered, favSet),
    [filtered, favSet],
  );

  const renderRow = (t: Tool) => (
    <MenuPanelItem key={t.id} tool={t} active={t.id === lastActiveToolId} />
  );

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r bg-card">
      <div className="space-y-3 border-b p-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tools…"
          aria-label="Search tools"
        />
        <ThemeToggle />
      </div>
      <ScrollArea className="flex-1">
        <nav className="p-2">
          {favSet.size > 0 && !query.trim() && (
            <section className="mb-2">
              <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                ★ Favorites
              </p>
              {ordered
                .filter((t) => favSet.has(t.id))
                .map(renderRow)}
            </section>
          )}
          <section>
            <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              All tools
            </p>
            {ordered
              .filter((t) => query.trim() || !favSet.has(t.id))
              .map(renderRow)}
          </section>
          {ordered.length === 0 && (
            <p className="px-2 py-4 text-sm text-muted-foreground">
              No tools match “{query}”.
            </p>
          )}
        </nav>
      </ScrollArea>
    </aside>
  );
}
