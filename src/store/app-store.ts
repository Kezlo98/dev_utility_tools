import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { ThemeMode } from "@/lib/types";
import { stateStorage } from "@/store/persistence";

/**
 * App-wide UI state. The four persisted fields (favorites, theme,
 * lastActiveToolId, paletteRecents) survive restarts via the zustand `persist`
 * middleware backed by localStorage under the `devkit:` namespace.
 *
 * Hydration is synchronous (localStorage is sync), so the store is ready
 * before React mounts — no flash, no hydration race. Writes only happen on
 * explicit user actions, never from a subscribe loop.
 */

const MAX_RECENTS = 8;

interface AppState {
  favorites: string[];
  theme: ThemeMode;
  lastActiveToolId: string | null;
  paletteRecents: string[];

  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  setTheme: (mode: ThemeMode) => void;
  setActiveTool: (id: string) => void;
  recordRecent: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      favorites: [],
      theme: "system",
      lastActiveToolId: null,
      paletteRecents: [],

      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((f) => f !== id)
            : [...s.favorites, id],
        })),

      isFavorite: (id) => get().favorites.includes(id),

      setTheme: (mode) => set({ theme: mode }),

      setActiveTool: (id) => set({ lastActiveToolId: id }),

      recordRecent: (id) =>
        set((s) => ({
          paletteRecents: [id, ...s.paletteRecents.filter((r) => r !== id)].slice(
            0,
            MAX_RECENTS,
          ),
        })),
    }),
    {
      name: "app-state",
      storage: createJSONStorage(() => stateStorage),
      partialize: (s) => ({
        favorites: s.favorites,
        theme: s.theme,
        lastActiveToolId: s.lastActiveToolId,
        paletteRecents: s.paletteRecents,
      }),
    },
  ),
);
