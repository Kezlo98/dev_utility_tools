# DevKit

Cross-platform (macOS + Windows) developer utilities desktop app containing 18 tools across 5 categories: Format & Validate, Encode / Hash / Crypto, Generators, Text & Dev, and Cron.

Stack: **Tauri v2 · React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · Rust.**

## Key Features

- **18 Developer Tools:** Integrated formatters, encoders, generators, text processors, and cron explorers.
- **Symmetric Crypto in Rust:** Heavy operations like bcrypt KDF and JWT symmetric verification are run in Rust.
- **Fast Startup & State Persistence:** Active tool, theme preferences, favorites, and palette recents are persisted synchronously via namespaced `localStorage` to avoid flash-on-mount.
- **Command Palette:** Fuzzy search tools via `Cmd/Ctrl+K` with support for recents and keywords.
- **Robust Design System:** Tailored light/dark theme cascading automatically to all tools without per-tool overrides.

## Prerequisites

- **Node.js** 20 LTS (>= 18 required)
- **Rust** stable (>= 1.77) — [rustup.rs](https://rustup.rs)
- **macOS:** Xcode Command Line Tools (`xcode-select --install`)
- **Windows:** MSVC Build Tools (Visual Studio Build Tools + "Desktop development with C++" workload)

## Development

Install dependencies and boot the hot-reloading Tauri desktop app:

```bash
npm install
npm run tauri dev
```

## Available Scripts

| Command                                                  | Purpose                                                     |
| -------------------------------------------------------- | ----------------------------------------------------------- |
| `npm run dev`                                            | Run Vite development server only (in browser)               |
| `npm run tauri dev`                                      | Launch the Tauri desktop window with hot reloading          |
| `npm run build`                                          | Compile TypeScript and bundle frontend for production       |
| `npm run tauri build`                                    | Build standalone distributable package for current platform |
| `npm run tauri build -- --target universal-apple-darwin` | Compile macOS universal package                             |
| `npm run typecheck`                                      | Perform type safety analysis on frontend source code        |
| `npm run lint`                                           | Run ESLint static code analysis                             |
| `npm run format`                                         | Run Prettier formatter                                      |
| `npm test`                                               | Run Vitest suite (frontend units + tool smoke tests)        |
| `cargo test` _(in `src-tauri/`)_                         | Run Rust backend unit tests                                 |

## Releasing & Code Signing

All releases are compiled automatically via GitHub Actions in a draft release. Because the bootstrap stage ships unsigned, security warnings will occur on the first launch on macOS and Windows.

- Bypass Gatekeeper on macOS: right-click **DevKit.app** -> **Open**.
- Bypass SmartScreen on Windows: click **More info** -> **Run anyway**.

Refer to [release-and-signing.md](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/docs/release-and-signing.md) for bypass guides and secrets to enable automatic signing.

## Project Structure

- [src/](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src) - React frontend codebase
  - [components/](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src/components) - Navigation shell, dialogs, and shadcn/ui primitives
  - [tools/](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src/tools) - Component directories and test suites for the 18 tools
  - [lib/](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src/lib) - Shared frontend utilities (registry, transforms, theme, random)
  - [store/](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src/store) - Zustand stores and localStorage persistence adapter
- [src-tauri/](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src-tauri) - Rust Tauri app
  - [src/commands/](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src-tauri/src/commands) - Cryptographic IPC handlers (bcrypt and JWT)
  - [capabilities/](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src-tauri/capabilities) - Security access controls and window permissions
- [tests/](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/tests) - Integration and smoke testing
  - [smoke/tool-registry.test.tsx](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/tests/smoke/tool-registry.test.tsx) - Mount validations
- [.github/workflows/](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/.github/workflows) - CI check/deploy configuration

## Project Status

Bootstrap phase completed. For implementation details, check [plan.md](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/plans/260701-1114-devkit-bootstrap/plan.md).
