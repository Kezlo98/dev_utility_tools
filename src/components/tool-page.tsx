import { useEffect } from "react";

import { getAllTools, getToolById } from "@/lib/registry";
import { useAppStore } from "@/store/app-store";
import { ToolPageShell } from "@/components/tool-page-shell";

/**
 * Right pane: renders the active tool inside ToolPageShell. On first launch
 * with no persisted selection, defaults to the first tool in the registry so
 * the shell is never empty.
 */
export function ToolPage() {
  const lastActiveToolId = useAppStore((s) => s.lastActiveToolId);
  const setActiveTool = useAppStore((s) => s.setActiveTool);

  // Seed a default selection once, on first mount if nothing is persisted.
  useEffect(() => {
    if (lastActiveToolId === null) {
      const first = getAllTools()[0];
      if (first) setActiveTool(first.id);
    }
  }, [lastActiveToolId, setActiveTool]);

  if (!lastActiveToolId) return null;

  const tool = getToolById(lastActiveToolId);
  if (!tool) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Select a tool from the menu.
      </div>
    );
  }

  const ToolComponent = tool.component;
  return (
    <ToolPageShell tool={tool}>
      <ToolComponent />
    </ToolPageShell>
  );
}
