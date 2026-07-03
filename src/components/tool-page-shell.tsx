import type { ReactNode } from "react";
import { Star } from "lucide-react";

import { cn, isMac } from "@/lib/utils";
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
    <div className="flex h-full flex-col bg-transparent">
      {isMac && <div className="h-9 w-full shrink-0" data-tauri-drag-region />}
      <div className={cn("flex-1 min-h-0 p-3.5 pl-0", isMac ? "pt-0" : "pt-3.5")}>
        {/* Outer Bezel */}
        <div className="h-full rounded-[1.5rem] bg-black/[0.015] dark:bg-white/[0.02] p-1.5 ring-1 ring-black/[0.04] dark:ring-white/[0.08]">
          {/* Inner Core */}
          <div className="flex h-full flex-col rounded-[calc(1.5rem-0.375rem)] glass-panel overflow-hidden">
            <header className="flex items-center gap-3 border-b px-6 py-4.5 bg-card/10 backdrop-blur-md">
              <Icon className="h-5 w-5 text-muted-foreground/80" />
              <h1 className="text-lg font-bold font-display tracking-tight text-foreground/90">{tool.name}</h1>
              <button
                type="button"
                aria-label={
                  isFavorite ? "Remove from favorites" : "Add to favorites"
                }
                aria-pressed={isFavorite}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                onClick={() => toggleFavorite(tool.id)}
                className={cn(
                  "ml-auto rounded p-1 text-muted-foreground transition-all duration-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:scale-110 active:scale-95",
                  isFavorite && "text-amber-500 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-400",
                )}
              >
                <Star className={cn("h-5 w-5 transition-transform duration-300", isFavorite && "fill-current")} />
              </button>
            </header>
            <div className="flex-1 overflow-auto min-h-0 flex flex-col">
              <div className="p-6 flex-1 min-h-0 flex flex-col">
                <ToolErrorBoundary toolName={tool.name}>
                  {children}
                </ToolErrorBoundary>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
