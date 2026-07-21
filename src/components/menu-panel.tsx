import { useMemo, useState } from "react";
import { ArrowUpCircle } from "lucide-react";

import type { Tool } from "@/lib/types";
import { getAllTools } from "@/lib/registry";
import { sortToolsForMenu } from "@/lib/ordering";
import { filterTools } from "@/lib/tool-search";
import { useAppStore } from "@/store/app-store";
import { useUpdateCheck } from "@/hooks/use-update-check";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme-toggle";
import { MenuPanelItem } from "@/components/menu-panel-item";
import { Logo } from "@/components/logo";
import { UpdateModal } from "@/components/update-modal";
import { cn, isMac } from "@/lib/utils";

/**
 * Left column: sticky search, then a Favorites section (only when favorites
 * exist and the query is empty) and an All tools section, both favorites-first
 * and A→Z ordered.
 */
export function MenuPanel() {
  const [query, setQuery] = useState("");
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const allTools = getAllTools();
  const favorites = useAppStore((s) => s.favorites);
  const lastActiveToolId = useAppStore((s) => s.lastActiveToolId);
  const updateState = useUpdateCheck();

  const favSet = useMemo(() => new Set(favorites), [favorites]);

  const filtered = useMemo(
    () => filterTools(allTools, query),
    [allTools, query],
  );

  const ordered = useMemo(
    () => sortToolsForMenu(filtered, favSet),
    [filtered, favSet],
  );

  const renderRow = (t: Tool) => (
    <MenuPanelItem key={t.id} tool={t} active={t.id === lastActiveToolId} />
  );

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-transparent">
      {isMac && <div className="h-9 w-full shrink-0" data-tauri-drag-region />}
      <div className={cn("flex-1 min-h-0 p-3.5", isMac ? "pt-0" : "pt-3.5")}>
        {/* Outer Bezel */}
        <div className="h-full rounded-[1.5rem] bg-black/[0.015] dark:bg-white/[0.02] p-1.5 ring-1 ring-black/[0.04] dark:ring-white/[0.08]">
          {/* Inner Core */}
          <div className="flex h-full flex-col rounded-[calc(1.5rem-0.375rem)] glass-panel overflow-hidden">
            {/* Header inside the island */}
            <div className="space-y-3.5 p-3.5 border-b bg-card/10 backdrop-blur-md">
              <div className="flex items-center gap-2 px-1 py-0.5">
                <Logo className="h-6 w-6 text-foreground" />
                <span className="text-lg font-bold font-display tracking-tight text-foreground/90">
                  DevKit
                </span>
                {updateState.hasUpdate && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="View available update"
                    className="ml-auto h-7 w-7 text-foreground/90"
                    onClick={() => setUpdateModalOpen(true)}
                  >
                    <ArrowUpCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tools…"
                aria-label="Search tools"
                className="bg-background/30 border-border/50 placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:ring-offset-0 focus-visible:border-primary/50 transition-all duration-300 rounded-lg"
              />
              <ThemeToggle />
            </div>
            {/* Tools list inside the same island */}
          <ScrollArea className="flex-1">
            <nav className="p-2">
              {favSet.size > 0 && !query.trim() && (
                <section className="mb-2">
                  <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    ★ Favorites
                  </p>
                  {ordered.filter((t) => favSet.has(t.id)).map(renderRow)}
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
          </div>
        </div>
      </div>
      <UpdateModal
        open={updateModalOpen}
        onOpenChange={setUpdateModalOpen}
        state={updateState}
      />
    </aside>
  );
}
