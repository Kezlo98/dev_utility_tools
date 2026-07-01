import type { ReactNode } from "react";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Tool } from "@/lib/types";
import { useAppStore } from "@/store/app-store";
import { ToolErrorBoundary } from "@/components/tool-error-boundary";

interface Props {
  tool: Tool;
  children: ReactNode;
}

/**
 * Shared chrome for every tool: header with name + favorite star, an error
 * boundary around the tool body, and consistent padding. Tools never render
 * their own header — they just fill the children slot.
 */
export function ToolPageShell({ tool, children }: Props) {
  const isFavorite = useAppStore((s) => s.favorites.includes(tool.id));
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const Icon = tool.icon;

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b px-6 py-4">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-lg font-semibold">{tool.name}</h1>
        <button
          type="button"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={isFavorite}
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          onClick={() => toggleFavorite(tool.id)}
          className={cn(
            "ml-auto rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isFavorite && "text-foreground",
          )}
        >
          <Star className={cn("h-5 w-5", isFavorite && "fill-current")} />
        </button>
      </header>
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <ToolErrorBoundary toolName={tool.name}>{children}</ToolErrorBoundary>
        </div>
      </div>
    </div>
  );
}
