# Codebase Summary & Architecture details

This document outlines the codebase layout, module boundaries, core state mechanisms, and interprocess communication (IPC) between the React WebView and the Rust backend.

## 1. Directory Structure

The repository is divided into the React frontend ([src/](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src)), the Rust native shell ([src-tauri/](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src-tauri)), and smoke/integration test suites ([tests/](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/tests)).

```
├── .github/workflows/          # CI lint, typecheck, and release build workflows
├── docs/                       # Architecture, design, and release documents
├── src/                        # React Frontend
│   ├── components/             # Layout frame, command palette, and UI components
│   │   └── ui/                 # Shadcn/ui core components (buttons, dialogs, inputs)
│   ├── hooks/                  # Custom hooks (e.g., keyboard shortcuts)
│   ├── lib/                    # General utilities (Transforms, Theme, Random, Registry, tool-search)
│   ├── spotlight/              # Spotlight quick-access window (SpotlightApp + search)
│   ├── store/                  # Zustand stores and localStorage persistence adapter
│   └── tools/                  # Tool components and tests grouped by domain category
│       ├── cron/               # Cron expression explorer & Crontab validator
│       ├── crypto/             # Hashing (Web Crypto), bcrypt, and JWT components
│       ├── encode/             # Base64 and URL encoding utilities
│       ├── format/             # JSON, YAML, XML, and SQL formatter tools
│       ├── generators/         # UUID/ULID, Password, QR, and Timestamp generators
│       └── text/               # Case transforms, Diff, and Regex tools
├── src-tauri/                  # Tauri Rust backend
│   ├── capabilities/           # Tauri security allowlists and capabilities
│   └── src/                    # Rust source code
│       ├── commands/           # Rust IPC command implementations (bcrypt, JWT, base64-file, spotlight)
│       ├── lib.rs              # Tauri builder bootstrap and command registration
│       └── main.rs             # Application entrypoint
└── tests/                      # Integration and smoke tests
    └── smoke/                  # Global mount validations
```

## 2. Feature Boundaries

To maintain long-term scalability, DevKit separates presentation components, business logic, and heavy computations into strict boundaries:

1. **WebView (React/TS):** Handles all visual rendering, user input validation, copy-to-clipboard actions, and light/dark theme toggles.
2. **Crypto & Digests (Web Crypto API):** General hashing (SHA-1/256/384/512) and secure password generation run in the WebView using the browser's native `crypto.subtle` API. This avoids unnecessary serialization round-trips over Tauri's IPC bridge.
3. **Heavy Compute (Rust Core):** High-cost cryptography (cost-based bcrypt KDFs) and complex JWT decoding/verification are handled by Rust.
4. **Offline Sandbox:** No part of the application communicates with the network. All libraries are compiled locally.

## 3. Tool Registry Logic

All tools in DevKit are registered in [registry.ts](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src/lib/registry.ts). The registry acts as the single source of truth for tool availability:

- **Type Definition:** Each tool implements the `Tool` interface defined in [types.ts](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src/lib/types.ts):
  ```typescript
  export interface Tool {
    id: string; // Unique identifier (used in store/palette)
    name: string; // Visual tool name
    icon: LucideIcon; // Lucide React icon element
    category: ToolCategory; // Target sidebar section
    component: ComponentType; // React component representing the tool's workspace
    keywords?: string[]; // Extra tokens for fuzzy search queries
  }
  ```
- **Display Order:** Tools are sorted alphabetically (A-Z) within their groups. Pinned favorites are separated dynamically and sorted alphabetically.
- **Shared Fuzzy Search:** The command palette (`Cmd/Ctrl+K`) and the spotlight quick-access window share one fuzzy-match helper in [tool-search.ts](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src/lib/tool-search.ts), so both surfaces filter the registry identically.

## 4. State Persistence

UI state is persisted across application restarts via Zustand middleware backed by a namespaced `localStorage` adapter:

- **Store:** Managed inside [app-store.ts](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src/store/app-store.ts). Persisted state fields include:
  - `favorites`: List of starred tool IDs.
  - `theme`: Selected theme preference (`light` | `dark` | `system`).
  - `lastActiveToolId`: Restores the user's previously open tool workspace.
  - `paletteRecents`: The last 8 tools navigated via the command palette.
  - `globalHotkey`: The user-configured global spotlight hotkey, or `null` to use the platform default.
- **Hydration:** State is loaded synchronously from `localStorage` under the `devkit:` prefix before the React app mounts, preventing theme flickering on startup.
- **Storage Adapter:** Configured in [persistence.ts](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src/store/persistence.ts), catching quota errors and gracefully failing back to memory if storage is disabled.

## 5. Tauri IPC Bridge & Rust Commands

The frontend communicates with the Rust backend via Tauri IPC commands. Command modules return `Result<T, String>`, which Tauri maps to JavaScript promise resolutions (`resolve`/`reject`). This allows the frontend to catch error strings directly.

- **Bcrypt Command ([bcrypt_cmd.rs](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src-tauri/src/commands/bcrypt_cmd.rs)):**
  Password hashing is a CPU-bound operation. Hashing a password with cost `12` takes ~250ms. Running this on the main thread would cause the WebView to freeze. To prevent UI lag, the command offloads execution to Tauri's thread pool:
  ```rust
  #[tauri::command]
  pub async fn bcrypt_hash(password: String, cost: u32) -> Result<String, String> {
      let validated = validate_cost(cost)?;
      tauri::async_runtime::spawn_blocking(move || hash_bcrypt(&password, validated))
          .await
          .map_err(|e| format!("bcrypt task failed: {e}"))?
  }
  ```
- **JWT Command ([jwt_cmd.rs](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/src-tauri/src/commands/jwt_cmd.rs)):**
  Decodes tokens and validates signatures using symmetric HS256/384/512 algorithms. It bypasses expiration checks (`exp`) specifically for inspector views, allowing expired JWTs to be audited safely, but rejects asymmetric algorithms with detailed error messages.

## Related Documents

- [project-overview-pdr.md](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/docs/project-overview-pdr.md) - Features overview
- [system-architecture.md](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/docs/system-architecture.md) - Data flows and security overview
- [design-guidelines.md](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/docs/design-guidelines.md) - UI design specifications
