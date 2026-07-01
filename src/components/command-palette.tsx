import { useMemo } from "react";

import { getAllTools, getToolById } from "@/lib/registry";
import { useAppStore } from "@/store/app-store";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * `Cmd/Ctrl+K` command palette. Mount once at the app root (kept outside any
 * scrolling region to avoid cmdk portal conflicts in the WebView).
 *
 * When the query is empty, the last 8 navigated tools (paletteRecents) are
 * pinned at the top; they are removed from the All tools group so cmdk never
 * sees a duplicate value. Enter navigates and records a recent.
 */
export function CommandPalette({ open, onOpenChange }: Props) {
  const tools = useMemo(() => getAllTools(), []);
  const paletteRecents = useAppStore((s) => s.paletteRecents);
  const setActiveTool = useAppStore((s) => s.setActiveTool);
  const recordRecent = useAppStore((s) => s.recordRecent);

  const recentIds = useMemo(() => new Set(paletteRecents), [paletteRecents]);

  const recentTools = useMemo(
    () =>
      paletteRecents
        .map((id) => getToolById(id))
        .filter((t): t is NonNullable<typeof t> => Boolean(t)),
    [paletteRecents],
  );

  const otherTools = useMemo(
    () => tools.filter((t) => !recentIds.has(t.id)),
    [tools, recentIds],
  );

  function navigate(id: string) {
    setActiveTool(id);
    recordRecent(id);
    onOpenChange(false);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search tools…" />
      <CommandList>
        <CommandEmpty>No tools found.</CommandEmpty>
        {recentTools.length > 0 && (
          <CommandGroup heading="Recent">
            {recentTools.map((t) => {
              const Icon = t.icon;
              return (
                <CommandItem
                  key={`recent-${t.id}`}
                  value={`${t.name} ${(t.keywords ?? []).join(" ")}`}
                  onSelect={() => navigate(t.id)}
                >
                  <Icon className="h-4 w-4" />
                  {t.name}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
        <CommandGroup heading="All tools">
          {otherTools.map((t) => {
            const Icon = t.icon;
            return (
              <CommandItem
                key={t.id}
                value={`${t.name} ${(t.keywords ?? []).join(" ")}`}
                onSelect={() => navigate(t.id)}
              >
                <Icon className="h-4 w-4" />
                {t.name}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
      <div className="flex items-center justify-center gap-3 border-t px-3 py-2 text-[11px] text-muted-foreground">
        <span><kbd className="font-sans">↑↓</kbd> navigate</span>
        <span aria-hidden>•</span>
        <span><kbd className="font-sans">↵</kbd> select</span>
        <span aria-hidden>•</span>
        <span><kbd className="font-sans">esc</kbd> close</span>
      </div>
    </CommandDialog>
  );
}
