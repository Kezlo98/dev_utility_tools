# DevKit

Cross-platform (macOS + Windows) developer utilities desktop app.

Stack: **Tauri v2 · React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · Rust.**

## Prerequisites

- **Node.js** 20 LTS (≥ 18 required)
- **Rust** stable (≥ 1.77) — https://rustup.rs
- **macOS:** Xcode Command Line Tools (`xcode-select --install`)
- **Windows:** MSVC Build Tools (Visual Studio Build Tools + "Desktop development with C++" workload)

## Development

```bash
npm install            # install frontend dependencies
npm run tauri dev      # boot the desktop app (hot reload on :1420)
```

## Scripts

| Command              | Purpose                                  |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Vite dev server only (browser, :1420)    |
| `npm run tauri dev`  | Full desktop app with hot reload         |
| `npm run build`      | Type-check + Vite production build       |
| `npm run tauri build`| Bundle a distributable (.dmg / .msi)     |
| `npm run typecheck`  | `tsc --noEmit`                           |
| `npm run lint`       | ESLint                                   |
| `npm run format`     | Prettier write                           |

## Status

Phase 1 (Scaffold) — empty shell that boots on both platforms. The 17 tools land in later phases. See `plans/260701-1114-devkit-bootstrap/`.
