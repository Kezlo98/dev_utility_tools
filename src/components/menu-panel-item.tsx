import { Star } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Tool } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

interface Props {
  tool: Tool;
  active: boolean;
}

/**
 * Single row in the MenuPanel: icon, name, and a favorite star. Clicking the
 * row selects the tool; clicking the star toggles favorite without selecting.
 */
export function MenuPanelItem({ tool, active }: Props) {
  const isFavorite = useAppStore((s) => s.favorites.includes(tool.id));
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const setActiveTool = useAppStore((s) => s.setActiveTool);
  const Icon = tool.icon;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setActiveTool(tool.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setActiveTool(tool.id);
        }
      }}
      className={cn(
        "group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
        active && "bg-accent",
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{tool.name}</span>
      <button
        type="button"
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        aria-pressed={isFavorite}
        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(tool.id);
        }}
        className={cn(
          "ml-auto rounded p-0.5 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none",
          isFavorite && "text-foreground",
        )}
      >
        <Star className={cn("h-3.5 w-3.5", isFavorite && "fill-current")} />
      </button>
    </div>
  );
}
