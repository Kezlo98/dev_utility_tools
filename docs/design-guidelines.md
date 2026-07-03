# Design Guidelines & UI/UX Standards

DevKit implements a clean, premium visual design system based on Tailwind CSS and Radix UI primitives. This document outlines layout shells, component conventions, theme propagation, and interaction guidelines.

---

## 1. Visual Aesthetics & Themes

DevKit prioritizes high-fidelity, uncluttered UI/UX tailored specifically for developer efficiency:

- **Typography:** Uses native sans-serif fonts for the navigation and shell framework, and clean monospace fonts (`font-mono` at `text-sm`) for all inputs, code outputs, regexes, and logs to ensure characters align.
- **Borders & Dividers:** Region divisions use thin 1px borders (`border-border` defined by CSS variables in [index.css](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src/index.css)) rather than thick shadow structures.
- **Animations:** Transitions (e.g., selection highlights, favorite star hover transitions, and command palette fades) use subtle animations (`transition-colors` or `transition-opacity` with standard durations) to make the interface feel responsive and alive.

---

## 2. Layout & Shell Structures

### 2.1 The Global Application Frame

The top-level app structure defined in [App.tsx](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src/App.tsx) splits the screen into a fixed sidebar and a flexible workspace:

```typescript
<div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
  <MenuPanel />
  <main className="min-w-0 flex-1">
    <ToolPage />
  </main>
  <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
</div>
```

### 2.2 Left Navigation Sidebar ([MenuPanel.tsx](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src/components/menu-panel.tsx))

- Width is fixed at `w-64` (16rem).
- Displays a search query field, followed by the theme selector toggle.
- Displays a **★ Favorites** section at the top (only if one or more tools are starred and the search query is empty).
- Displays the remaining tools under **All tools**.
- Both sections are sorted A→Z alphabetically.
- Hovering over a row displays a faint star icon. Clicking the star toggles the tool's favorite status without shifting focus.

### 2.3 Tool Page Wrapper ([ToolPageShell.tsx](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src/components/tool-page-shell.tsx))

Every tool mounts inside this shell. Tools **must not** render their own header. The shell provides:

- A standardized top header displaying the tool's name, category icon, and a large favorite toggle star.
- A scrolling workspace container with consistent padding (`p-6`).
- An error boundary wrapper ([ToolErrorBoundary.tsx](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src/components/tool-error-boundary.tsx)) to catch tool-specific runtime errors and prevent full application crashes.

---

## 3. Persistent Theme Management

The user's theme is managed globally and synchronized using Zustand:

- **Theme Modes:** Supports `light`, `dark`, and `system` modes.
- **Flicker Prevention:** The theme is resolved and applied to the document node (`document.documentElement.classList.toggle("dark")`) in [main.tsx](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src/main.tsx) _before_ React compiles or mounts components. This prevents layout scheme flashes on startup.
- **System Preference Watcher:** A media query observer (`window.matchMedia("(prefers-color-scheme: dark)")`) listens for system-wide adjustments. If `system` mode is active, the theme switches in real time.

---

## 4. Input / Output Panel Conventions ([ToolIoPanels.tsx](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src/components/tool-io-panels.tsx))

For formatters, encoders, and transformers, DevKit provides a side-by-side IO layout split-screen grid (stacking to single columns on small screen boundaries):

- **Input Pane (Left/Top):** Editable textarea, mono-spaced font, spelling checks disabled.
- **Output Pane (Right/Bottom):** Read-only textarea, mono-spaced font.
- **Error Display:** When a compilation or formatting error occurs, the output pane renders a high-visibility warning container with a subtle red background (`bg-destructive/5`) and a red border (`border-destructive/40`), detailing the exact parser stack trace.
- **Copy Button:** Renders on the Output Pane's header. It handles copying via clipboard helpers and transitions to a checkmark icon indicating "Copied" for 1.5 seconds before resetting.

---

## 5. Command Palette Behavior ([CommandPalette.tsx](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src/components/command-palette.tsx))

The global command palette is accessed via `Cmd+K` (macOS) or `Ctrl+K` (Windows).

- **Root Mounting:** Mounted at the document root to prevent scrolling viewport container clipping.
- **History (Recents):** Pins the last 8 recently accessed tools under a **Recent** header.
- **Deduplication:** Recents are dynamically omitted from the **All tools** section to prevent duplicate listings.
- **Fuzzy Filtering:** Searches tool names and keywords configured in the registry.
- **Navigation Footer:** Renders layout guides: `↑↓ navigate • ↵ select • esc close`.

## Related Documents

- [project-overview-pdr.md](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/docs/project-overview-pdr.md) - Project scope
- [codebase-summary.md](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/docs/codebase-summary.md) - Code structure
- [code-standards.md](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/docs/code-standards.md) - Coding style conventions
