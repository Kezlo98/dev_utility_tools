import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SpotlightApp } from "./spotlight/spotlight-app";
import "./index.css";

import { restorePersistedGlobalHotkey } from "@/lib/hotkey";
import { setGlobalHotkey as setGlobalHotkeyCmd } from "@/lib/invoke";
import { applyTheme, watchSystemTheme } from "@/lib/theme";
import { useAppStore } from "@/store/app-store";

// Apply the persisted theme before React mounts to avoid a flash of the wrong
// scheme. The store hydrates synchronously from localStorage at import time,
// so the theme value is already available here.
applyTheme(useAppStore.getState().theme);

// Re-apply when the user toggles theme…
useAppStore.subscribe((s, prev) => {
  if (s.theme !== prev.theme) applyTheme(s.theme);
});
// …and when the OS preference changes (only matters while in "system" mode).
watchSystemTheme(() => applyTheme(useAppStore.getState().theme));

const isSpotlightWindow =
  new URLSearchParams(window.location.search).get("window") === "spotlight";

if (isSpotlightWindow) {
  document.documentElement.classList.add("spotlight-window");
} else {
  const { globalHotkey, setGlobalHotkey } = useAppStore.getState();
  void restorePersistedGlobalHotkey(globalHotkey, setGlobalHotkeyCmd).then(
    (restored) => {
      if (!restored) setGlobalHotkey(null);
    },
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isSpotlightWindow ? <SpotlightApp /> : <App />}
  </React.StrictMode>,
);
