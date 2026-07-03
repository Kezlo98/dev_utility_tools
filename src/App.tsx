import { useState } from "react";

import { MenuPanel } from "@/components/menu-panel";
import { ToolPage } from "@/components/tool-page";
import { CommandPalette } from "@/components/command-palette";
import {
  useGlobalShortcut,
  isPaletteToggle,
} from "@/hooks/use-global-shortcut";

/**
 * App frame: MenuPanel (left) + ToolPage (right) + a globally-mounted command
 * palette. The palette lives at the root, outside any scrolling region, so its
 * portal doesn't conflict inside the Tauri WebView.
 */
function App() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useGlobalShortcut((e) => {
    if (isPaletteToggle(e)) {
      e.preventDefault();
      setPaletteOpen((o) => !o);
    }
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <div className="noise-overlay" />
      <MenuPanel />
      <main className="min-w-0 flex-1">
        <ToolPage />
      </main>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}

export default App;
