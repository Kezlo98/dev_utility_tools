import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

import type { Tool } from "@/lib/types";
import { cn } from "@/lib/utils";
import { filterTools } from "@/lib/tool-search";

interface Props {
  tools: Tool[];
  recentIds: string[];
  onSelect: (tool: Tool) => void;
  resetKey: number;
}

export function SpotlightSearch({ tools, recentIds, onSelect, resetKey }: Props) {
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const orderedTools = useMemo(() => {
    const filtered = filterTools(tools, query);
    if (query.trim()) return filtered;

    const byId = new Map(filtered.map((tool) => [tool.id, tool]));
    const recentTools = recentIds
      .map((id) => byId.get(id))
      .filter((tool): tool is Tool => Boolean(tool));
    const recentSet = new Set(recentTools.map((tool) => tool.id));
    return [...recentTools, ...filtered.filter((tool) => !recentSet.has(tool.id))];
  }, [query, recentIds, tools]);

  useEffect(() => {
    setQuery("");
    setHighlightedIndex(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [resetKey]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  useEffect(() => {
    optionRefs.current[highlightedIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  const activeId = orderedTools[highlightedIndex]
    ? `spotlight-option-${orderedTools[highlightedIndex].id}`
    : undefined;

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index) =>
        orderedTools.length ? (index + 1) % orderedTools.length : 0,
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) =>
        orderedTools.length
          ? (index - 1 + orderedTools.length) % orderedTools.length
          : 0,
      );
    } else if (event.key === "Enter") {
      const tool = orderedTools[highlightedIndex];
      if (tool) {
        event.preventDefault();
        onSelect(tool);
      }
    }
  }

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/40 bg-background/85 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-card/90">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b px-5">
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded="true"
          aria-controls="spotlight-results"
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          placeholder="Search DevKit tools…"
          className="h-full min-w-0 flex-1 bg-transparent text-base font-medium outline-none placeholder:text-muted-foreground focus-visible:ring-0"
        />
        <kbd className="rounded-md border bg-muted/60 px-2 py-1 text-[11px] text-muted-foreground">
          esc
        </kbd>
      </div>

      <div id="spotlight-results" role="listbox" className="min-h-0 flex-1 overflow-y-auto p-2">
        {orderedTools.map((tool, index) => {
          const Icon = tool.icon;
          const highlighted = index === highlightedIndex;
          return (
            <button
              key={tool.id}
              id={`spotlight-option-${tool.id}`}
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              type="button"
              role="option"
              aria-selected={highlighted}
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={() => onSelect(tool)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm outline-none transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-ring",
                highlighted
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground hover:bg-accent/60",
              )}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background/60">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">{tool.name}</span>
              {recentIds.includes(tool.id) && !query.trim() && (
                <span className="text-[11px] text-muted-foreground">Recent</span>
              )}
            </button>
          );
        })}
        {orderedTools.length === 0 && (
          <p className="px-3 py-10 text-center text-sm text-muted-foreground">
            No tools match “{query}”.
          </p>
        )}
      </div>

      <footer className="flex h-10 shrink-0 items-center justify-center gap-3 border-t text-[11px] text-muted-foreground">
        <span>↑↓ navigate</span>
        <span aria-hidden>•</span>
        <span>↵ select</span>
      </footer>
    </section>
  );
}
