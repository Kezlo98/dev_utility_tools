import { useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

import { ToolPageShell } from "@/components/tool-page-shell";
import { getAllTools } from "@/lib/registry";
import type { Tool } from "@/lib/types";
import { useAppStore } from "@/store/app-store";
import { SpotlightSearch } from "@/spotlight/spotlight-search";

export function SpotlightApp() {
  const tools = useMemo(() => getAllTools(), []);
  const [mode, setMode] = useState<"search" | "tool">("search");
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const modeRef = useRef(mode);
  // OS visibility is owned by Rust events (`spotlight:shown` / `:hidden`); the
  // hotkey handler reads this ref to decide show-vs-hide without a stale closure.
  const visibleRef = useRef(false);
  const paletteRecents = useAppStore((state) => state.paletteRecents);
  const recordRecent = useAppStore((state) => state.recordRecent);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  function resetToSearch() {
    setMode("search");
    setActiveTool(null);
    setResetKey((key) => key + 1);
  }

  useEffect(() => {
    let unlisten: UnlistenFn[] = [];
    let mounted = true;

    void Promise.all([
      listen("spotlight:hotkey-pressed", () => {
        if (modeRef.current === "tool") {
          resetToSearch();
          void invoke("spotlight_reset_to_search").catch(() => undefined);
        } else if (visibleRef.current) {
          // Rust emits `spotlight:hidden`, which drives the reset + ref update.
          void invoke("spotlight_hide").catch(() => undefined);
        } else {
          void invoke("spotlight_show").catch(() => undefined);
        }
      }),
      listen("spotlight:shown", () => {
        visibleRef.current = true;
        // Each Tauri webview owns its own store instance. Re-read persisted
        // state so recents recorded in the main window since this window's
        // mount appear immediately when the spotlight is shown.
        void useAppStore.persist.rehydrate();
      }),
      listen("spotlight:reset-to-search", resetToSearch),
      listen("spotlight:hidden", () => {
        visibleRef.current = false;
        resetToSearch();
      }),
    ]).then((listeners) => {
      if (mounted) {
        unlisten = listeners;
      } else {
        listeners.forEach((dispose) => dispose());
      }
    });

    return () => {
      mounted = false;
      unlisten.forEach((dispose) => dispose());
    };
  }, []);

  async function selectTool(tool: Tool) {
    recordRecent(tool.id);
    setActiveTool(tool);
    setMode("tool");
    // Resize before the Rust emit lands so a rejected resize rolls back to the
    // search view instead of stranding the UI in tool mode with a search-sized window.
    try {
      await invoke("spotlight_show_tool");
    } catch {
      resetToSearch();
    }
  }

  async function hide() {
    // Rust owns visibility; on success it emits `spotlight:hidden`, which
    // resets local state. The handler below is the single source of truth.
    try {
      await invoke("spotlight_hide");
    } catch {
      resetToSearch();
    }
  }

  async function backToSearch() {
    // Same shrink-back-to-bar path as re-pressing the hotkey from tool mode.
    resetToSearch();
    try {
      await invoke("spotlight_reset_to_search");
    } catch {
      // Window is already shrunk to bar size locally; nothing to roll back.
    }
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") void hide();
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      // Clicks on the transparent margin (the outer root) dismiss; clicks
      // inside the glass panel or list fall through to the tool/search UI.
      if (target instanceof HTMLElement && target.dataset.spotlightBackdrop) {
        void hide();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  });

  if (mode === "tool" && activeTool) {
    const ToolComponent = activeTool.component;
    return (
      <div
        data-spotlight-backdrop="true"
        className="h-screen w-screen bg-transparent p-3 text-foreground"
      >
        <ToolPageShell tool={activeTool} compact onBack={() => void backToSearch()}>
          <ToolComponent />
        </ToolPageShell>
      </div>
    );
  }

  return (
    <div
      data-spotlight-backdrop="true"
      className="spotlight-root h-screen w-screen bg-transparent p-3 text-foreground"
    >
      <SpotlightSearch
        tools={tools}
        recentIds={paletteRecents}
        onSelect={(tool) => void selectTool(tool)}
        resetKey={resetKey}
      />
    </div>
  );
}
