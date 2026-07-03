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
        "group flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none",
        "transition-colors duration-150",
        "hover:bg-accent/85 hover:text-foreground",
        "focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-accent/80 text-foreground font-medium border border-border/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors duration-150",
          active ? "text-primary dark:text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      <span className="truncate font-sans">{tool.name}</span>
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
          "ml-auto rounded p-0.5 opacity-0 transition-all duration-150 hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none",
          isFavorite && "opacity-100 text-amber-500 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-400",
        )}
      >
        <Star className={cn("h-3.5 w-3.5", isFavorite && "fill-current")} />
      </button>
    </div>
  );
}
