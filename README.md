# DevKit

Cross-platform (macOS + Windows) developer utilities desktop app — 18 tools across Format & Validate, Encode / Hash / Crypto, Generators, Text & Dev, and Cron.

Stack: **Tauri v2 · React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · Rust.**

Shared features: favorites, light/dark/system theme, last-active tool restore, and a `Cmd/Ctrl+K` command palette with fuzzy search + recents — all persisted across restarts via `localStorage`.

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

| Command                                  | Purpose                                    |
| ---------------------------------------- | ------------------------------------------ |
| `npm run dev`                            | Vite dev server only (browser, :1420)      |
| `npm run tauri dev`                      | Full desktop app with hot reload           |
| `npm run build`                          | Type-check + Vite production build         |
| `npm run tauri build`                    | Bundle a distributable (.dmg / .msi)       |
| `npm run tauri build -- --target universal-apple-darwin` | macOS universal `.dmg`        |
| `npm run typecheck`                      | `tsc --noEmit`                             |
| `npm run lint`                           | ESLint                                     |
| `npm run format`                         | Prettier write                             |
| `npm test`                               | Vitest unit + smoke tests (jsdom)          |
| `cargo test` *(in `src-tauri/`)*         | Rust crypto command tests                  |

## Releasing

Releases are produced by CI, not by hand. Push a `vX.Y.Z` tag (or dispatch the workflow manually) and the `build-and-release` workflow builds a macOS universal bundle and a Windows installer, attaching both to a **draft** GitHub release.

> **Bootstrap ships unsigned on both platforms.** First launch requires a one-time bypass — see [docs/release-and-signing.md](./docs/release-and-signing.md) for Gatekeeper/SmartScreen steps and how to enable signing later.

## Project layout

```
src/                React frontend
  components/        shell + shadcn/ui primitives
  tools/             one folder per tool (barrel + component + tests)
  lib/               shared helpers (registry, hash, random, cron, …)
src-tauri/          Rust core (bcrypt + JWT verify commands)
tests/smoke/        registry smoke tests (every tool mounts under ToolPageShell)
.github/workflows/  CI: typecheck/lint/test + build-and-release
```

## Status

Bootstrap complete. See `plans/260701-1114-devkit-bootstrap/`.
