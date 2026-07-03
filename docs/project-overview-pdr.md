# Product Development Requirements (PDR) & Project Overview

DevKit is an offline-first, cross-platform developer utility suite packaged as a lightweight desktop app. It replaces single-purpose web utilities (e.g., online base64 encoders, JSON formatters) with a secure, local-first workspace.

## 1. Product Overview

Developers frequently paste sensitive data (tokens, JSON payloads, passwords) into online formatting and encoding websites, risking data exposure. DevKit solves this by providing a unified desktop hub for common developer operations. By running purely locally, it guarantees security and operates without internet connectivity.

- **Stack:** Tauri v2, React 18, TypeScript, Tailwind CSS, shadcn/ui, Rust
- **Platforms:** macOS universal (`aarch64` + `x86_64`) and Windows (`x86_64`)
- **Distribution ID:** `com.kezlo.devkit`

## 2. Target Audience

- **Software Engineers:** Need rapid text transformations, regex verification, and formatting.
- **System Operators & DevOps:** Require cron schedule verification, crontab debugging, and timestamp parsing.
- **Security Engineers:** Need local hashing (MD5, SHA), bcrypt testing, and safe symmetric JWT decoding/verification.

## 3. Key Features

- **18 Core Tools:** Covers standard developer needs grouped into 5 categories:
  - **Format & Validate:** JSON, YAML, XML, SQL
  - **Encode / Hash / Crypto:** Base64, URL encode/decode, Hash (MD5, SHA-1, SHA-256, SHA-384, SHA-512), bcrypt (Rust-backed KDF), JWT (decode & symmetric verify)
  - **Generators:** UUID/ULID, QR Code, Timestamp converter, Password generator (Web Crypto CSPRNG)
  - **Text & Dev:** Case converter, Text diff, Regex tester (limit: 500-char regex pattern, 200 KB input)
  - **Cron:** Cron expression explorer, Crontab validator
- **Navigation & Search:** Left panel provides category filters, fuzzy search, and A-Z ordering. Pinned favorites are always displayed at the top.
- **Command Palette:** Global modal accessed via `Cmd/Ctrl+K` with fuzzy search matching tool names and keywords, displaying the last 8 navigated tools as recents.
- **Namespaced Persistence:** UI theme (light, dark, system), favorites, last active tool, and command palette history are preserved across restarts synchronously using `localStorage`.
- **System Integration:** Custom window chrome with overlay title bars, custom minimum size restraints, and responsive window layout.

## 4. Scope & Boundaries

### In Scope

- **Pure Local Execution:** No remote server dependencies, zero external network requests.
- **Security-First Architecture:** CPU-intensive cryptography (bcrypt, JWT verification) runs inside the Rust backend to prevent thread jank and WebView exploits.
- **Fast Startup:** State is hydrated synchronously from storage prior to mounting React components to prevent layout flashing.
- **High-Fidelity UI/UX:** Tailored light/dark theme matching system-wide preferences, using standard typography and micro-animations.

### Out of Scope (Future Phases)

- **Auto-Update System:** Scaffolding exists, but actual update validation is deferred.
- **Cloud Sync:** Syncing favorites or configs between machines is out of scope.
- **Custom Plugin Support:** Adding third-party tool packs is deferred.
- **Telemetry / Metrics:** Zero tracking or analytical reporting is included.

## Related Documents

- [README.md](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/README.md) - Main setup instructions
- [codebase-summary.md](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/docs/codebase-summary.md) - Code architecture detail
- [project-roadmap.md](file:///Users/kezlo/Workspaces/kezlo/dev_utility_tools/docs/project-roadmap.md) - Feature implementation timeline
